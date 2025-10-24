const { json } = require('body-parser');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const fs = require('fs');
const path = require('path');

const applicationkey = process.env.APPLICATION_KEY;



exports.getCount = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {

        let custFilter = ''
        let vendorFilter = ''
        let orderFilter = ''
        let serviceFilter = ''
        let jobFilter = ''
        let techFilter = ''
        let TvendorFilter = ''
        let TorderFilter = ''
        let TserviceFilter = ''
        let TjobFilter = ''
        let TtechFilter = ''

        if (req.body.fromDate && req.body.toDate) {
            const fromDate = req.body.fromDate;
            const toDate = req.body.toDate;

            custFilter = ` AND DATE(REGISTRATION_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
            vendorFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
            orderFilter = ` AND DATE(ORDER_DATE_TIME) BETWEEN "${fromDate}" AND "${toDate}"`;
            serviceFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
            jobFilter = ` AND DATE(JOB_CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
            techFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        }
        if (req.body.territoryId) {
            const territoryId = req.body.territoryId;
            TvendorFilter = ` AND ID IN(SELECT VENDOR_ID FROM vendor_territory_mapping WHERE TERITORY_ID IN(${territoryId}) AND IS_ACTIVE=1)`;
            TorderFilter = ` AND TERRITORY_ID IN(${territoryId})`;
            TserviceFilter = ` AND ID IN(SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERRITORY_ID IN(${territoryId}) AND STATUS=1)`;
            TjobFilter = ` AND TERRITORY_ID IN(${territoryId})`;
            TtechFilter = ` AND ID IN(SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN(SELECT GROUP_CONCAT(PINCODE_ID) FROM territory_pincode_mapping WHERE ID IN(${territoryId}) AND IS_ACTIVE=1) AND IS_ACTIVE=1)`;
        }
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT 
                            (SELECT COUNT(*) FROM customer_master WHERE 1  ${custFilter} ) AS customer_count,
                            (SELECT COUNT(*) FROM vendor_master WHERE 1  ${vendorFilter} ${TvendorFilter}) AS vendor_count,
                            (SELECT COUNT(*) FROM technician_master WHERE 1  ${techFilter} ${TtechFilter}) AS technician_count,
                            (SELECT COUNT(*) FROM view_order_master WHERE 1  ${orderFilter} ${TorderFilter}) AS order_count,
                            (SELECT COUNT(*) FROM service_master WHERE 1  ${serviceFilter} ${TserviceFilter}) AS service_count,
                            (SELECT COUNT(*) FROM view_job_card WHERE 1  ${jobFilter} ${TjobFilter}) AS job_count `
            console.log("\n\n\n\n\n\n query:", query);


            mm.executeQuery(query, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceItem information."
                    });
                }
                else {
                    var JobQuery = `SELECT
                    SUM(CASE WHEN STATUS = 'P' THEN 1 ELSE 0 END) AS PENDING_COUNT,
                        SUM(CASE WHEN STATUS = 'AS' THEN 1 ELSE 0 END) AS SHEDULED_COUNT,
                        SUM(CASE WHEN STATUS = 'AS' AND TECHNICIAN_STATUS = 'ST' THEN 1 ELSE 0 END) AS START_TRAVEL_COUNT,
                        SUM(CASE WHEN STATUS = 'AS' AND TECHNICIAN_STATUS = 'RD' THEN 1 ELSE 0 END) AS REACHED_COUNT,
                        SUM(CASE WHEN STATUS = 'AS' AND TECHNICIAN_STATUS = 'SJ' THEN 1 ELSE 0 END) AS STARTED_COUNT,
                        SUM(CASE WHEN STATUS = 'CO' THEN 1 ELSE 0 END) AS COMPLETED_COUNT,
                        SUM(CASE WHEN STATUS = 'R' THEN 1 ELSE 0 END) AS REJECTED_COUNT
                        FROM  view_job_card where 1 `;
                    mm.executeQuery(JobQuery + jobFilter + TjobFilter, supportKey, (error, resultsJob) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianschedule count.",
                            });
                        }
                        else {
                            var OrderQuery = `SELECT
                            SUM(CASE WHEN ORDER_STATUS = 'OP' THEN 1 ELSE 0 END) AS PLACED_COUNT,
                            SUM(CASE WHEN ORDER_STATUS = 'OA' THEN 1 ELSE 0 END) AS SHEDULED_COUNT,
                            SUM(CASE WHEN ORDER_STATUS = 'OR' THEN 1 ELSE 0 END) AS RESHEDULED_COUNT,
                            SUM(CASE WHEN ORDER_STATUS = 'CO' THEN 1 ELSE 0 END) AS COMPLETED_COUNT,
                            SUM(CASE WHEN ORDER_STATUS = 'CA' THEN 1 ELSE 0 END) AS CANCELED_COUNT
                            FROM  view_ORDER_MASTER where 1 `;
                            mm.executeQuery(OrderQuery + orderFilter + TorderFilter, supportKey, (error, resultsOrder) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get technicianschedule count.",
                                    });
                                }
                                else {
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "success",
                                        "data": results,
                                        "jobCounts": resultsJob,
                                        "orderCounts": resultsOrder
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.technicianBelow4Ratings = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let custFilter = ''
    let vendorFilter = ''
    let orderFilter = ''
    let serviceFilter = ''
    let jobFilter = ''
    let techFilter = ''
    let TvendorFilter = ''
    let TorderFilter = ''
    let TserviceFilter = ''
    let TjobFilter = ''
    let TtechFilter = ''

    if (req.body.fromDate && req.body.toDate) {
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;

        custFilter = ` AND DATE(REGISTRATION_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        vendorFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        orderFilter = ` AND DATE(ORDER_DATE_TIME) BETWEEN "${fromDate}" AND "${toDate}"`;
        serviceFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        jobFilter = ` AND DATE(JOB_CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        techFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
    }
    if (req.body.territoryId) {
        const territoryId = req.body.territoryId;
        TvendorFilter = ` AND ID IN(SELECT VENDOR_ID FROM vendor_territory_mapping WHERE TERRITORY_ID IN(${territoryId}) AND IS_ACTIVE=1)`;
        TorderFilter = ` AND TERRITORY_ID IN(${territoryId})`;
        TserviceFilter = ` AND ID IN(SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERITORY_ID IN(${territoryId}) AND STATUS=1)`;
        TjobFilter = ` AND TERRITORY_ID IN(${territoryId})`;
        TtechFilter = ` AND ID IN(SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN(SELECT GROUP_CONCAT(PINCODE_ID) FROM territory_pincode_mapping WHERE ID IN(${territoryId}) AND IS_ACTIVE=1) AND IS_ACTIVE=1)`;
    }
    try {
        if (IS_FILTER_WRONG == "0") {

            mm.executeQuery('select count(*) as cnt from view_technician_master where 1 AND AVG_RATINGS < 4' + techFilter + TtechFilter + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery('select * from view_technician_master where 1 AND AVG_RATINGS < 4' + techFilter + TtechFilter + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technician information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 114,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.techniciaNHighRatings = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    let custFilter = ''
    let vendorFilter = ''
    let orderFilter = ''
    let serviceFilter = ''
    let jobFilter = ''
    let techFilter = ''
    let TvendorFilter = ''
    let TorderFilter = ''
    let TserviceFilter = ''
    let TjobFilter = ''
    let TtechFilter = ''

    if (req.body.fromDate && req.body.toDate) {
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;

        custFilter = ` AND DATE(REGISTRATION_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        vendorFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        orderFilter = ` AND DATE(ORDER_DATE_TIME) BETWEEN "${fromDate}" AND "${toDate}"`;
        serviceFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        jobFilter = ` AND DATE(JOB_CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        techFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
    }
    if (req.body.territoryId) {
        const territoryId = req.body.territoryId;
        TvendorFilter = ` AND ID IN(SELECT VENDOR_ID FROM vendor_territory_mapping WHERE TERRITORY_ID IN(${territoryId}) AND IS_ACTIVE=1)`;
        TorderFilter = ` AND TERRITORY_ID IN(${territoryId})`;
        TserviceFilter = ` AND ID IN(SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERITORY_ID IN(${territoryId}) AND STATUS=1)`;
        TjobFilter = ` AND TERRITORY_ID IN(${territoryId})`;
        TtechFilter = ` AND ID IN(SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN(SELECT GROUP_CONCAT(PINCODE_ID) FROM territory_pincode_mapping WHERE ID IN(${territoryId}) AND IS_ACTIVE=1) AND IS_ACTIVE=1)`;
    }
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from view_technician_master where 1 ' + techFilter + TtechFilter + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery('select * from view_technician_master where 1 ' + techFilter + TtechFilter + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technician information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 114,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.customerBelow4Ratings = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from view_customer_master where 1 AND AVARAGE_RATING < 4' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customer count.",
                    });
                }
                else {
                    mm.executeQuery('select * from view_customer_master where 1 AND AVARAGE_RATING < 4' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customer information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 20,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.customerHighRatings = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from view_customer_master where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customer count.",
                    });
                }
                else {
                    mm.executeQuery('select * from view_customer_master where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customer information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 20,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.orderPieChart = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    let custFilter = ''
    let vendorFilter = ''
    let orderFilter = ''
    let serviceFilter = ''
    let jobFilter = ''
    let techFilter = ''
    let TvendorFilter = ''
    let TorderFilter = ''
    let TserviceFilter = ''
    let TjobFilter = ''
    let TtechFilter = ''

    if (req.body.fromDate && req.body.toDate) {
        const fromDate = req.body.fromDate;
        const toDate = req.body.toDate;

        custFilter = ` AND DATE(REGISTRATION_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        vendorFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        orderFilter = ` AND DATE(ORDER_DATE_TIME) BETWEEN "${fromDate}" AND "${toDate}"`;
        serviceFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        jobFilter = ` AND DATE(JOB_CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
        techFilter = ` AND DATE(CREATED_DATE) BETWEEN "${fromDate}" AND "${toDate}"`;
    }
    if (req.body.territoryId) {
        const territoryId = req.body.territoryId;
        TvendorFilter = ` AND ID IN(SELECT VENDOR_ID FROM vendor_territory_mapping WHERE TERRITORY_ID IN(${territoryId}) AND IS_ACTIVE=1)`;
        TorderFilter = ` AND TERRITORY_ID IN(${territoryId})`;
        TserviceFilter = ` AND ID IN(SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERITORY_ID IN(${territoryId}) AND STATUS=1)`;
        TjobFilter = ` AND TERRITORY_ID IN(${territoryId})`;
        TtechFilter = ` AND ID IN(SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN(SELECT GROUP_CONCAT(PINCODE_ID) FROM territory_pincode_mapping WHERE ID IN(${territoryId}) AND IS_ACTIVE=1) AND IS_ACTIVE=1)`;
    }
    try {
        if (IS_FILTER_WRONG == "0") {
            var OrderQuery = `SELECT
                SUM(CASE WHEN ORDER_STATUS = 'OP' THEN 1 ELSE 0 END) AS PLACED_COUNT,
                SUM(CASE WHEN ORDER_STATUS = 'OA' THEN 1 ELSE 0 END) AS SHEDULED_COUNT,
                SUM(CASE WHEN ORDER_STATUS = 'OR' THEN 1 ELSE 0 END) AS RESHEDULED_COUNT,
                SUM(CASE WHEN ORDER_STATUS = 'CO' THEN 1 ELSE 0 END) AS COMPLETED_COUNT,
                SUM(CASE WHEN ORDER_STATUS = 'CA' THEN 1 ELSE 0 END) AS CANCELED_COUNT
                FROM  view_ORDER_MASTER where 1 `;
            mm.executeQuery(OrderQuery + orderFilter + TorderFilter, supportKey, (error, resultsOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "success",
                        "data": resultsOrder,
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.getEarnings = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    const IS_VENDOR_OR_TECHNICIAN = req.body.IS_VENDOR_OR_TECHNICIAN
    var SELECT_COLUMN = ''
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            IS_VENDOR_OR_TECHNICIAN == 'V' ? SELECT_COLUMN = 'VENDOR_COST' : 'TECHNICIAN_COST';
            var Query = `select sum(${SELECT_COLUMN}) TOTAL_EARNINGS,(SELECT SUM(${SELECT_COLUMN}) FROM job_card WHERE DATE(SCHEDULED_DATE_TIME)=CURRENT_DATE ${criteria})AS TODAYS_EARNINGS FROM job_card WHERE  1 ${criteria}`
            mm.executeQuery(Query, supportKey, (error, resultsOrder) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "success",
                        "data": resultsOrder,
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.OrderSummaryReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'CUSTOMER_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY CUSTOMER_ID order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY CUSTOMER_ID order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `Select count(DISTINCT CUSTOMER_ID) as cnt from view_order_master where 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT CUSTOMER_ID,CUSTOMER_NAME,count(ORDER_NUMBER)as order_count,sum(FINAL_AMOUNT) as FINAL_AMOUNT,
                    COUNT(CASE WHEN ORDER_STATUS = 'CO' THEN 1 END) AS COMPLETED,
                    COUNT(CASE WHEN ORDER_STATUS in ('OP','OA','OS','ON') THEN 1 END) AS PENDING,
                    COUNT(CASE WHEN ORDER_STATUS = 'OR' THEN 1 END) AS REJECTED,
                    COUNT(CASE WHEN ORDER_STATUS = 'CA' THEN 1 END) AS CANCELLED
                    from view_order_master where 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 67,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.orderDetailedReport = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from view_order_summery_details where 1 ' + filter, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMaster information."
                    });
                }
                else {
                    mm.executeQuery('SELECT ID,ORDER_ID,ORDER_NUMBER,GROSS_AMOUNT,TAX_RATE,COUPON_CHARGES,IFNULL(DISCOUNT_CHARGES,0.00) AS DISCOUNT_CHARGES,IFNULL(TOTAL_TAX,0.00) AS TOTAL_TAX ,SERVICE_CHARGES,NET_AMOUNT,CUSTOMER_NAME,ORDER_STATUS,ORDER_STATUS_NAME FROM view_order_summery_details where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get orderMaster information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "TAB_ID": 73,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }

                    });
                }

            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }
}

exports.technicianPerformanceReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'NAME';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var queryC = `SELECT count(*) as cnt FROM view_technician_performance_report WHERE 1 `
            mm.executeQuery(queryC + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * FROM view_technician_performance_report WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 150,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.serviceUtilizationReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + "  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var queryC = `SELECT count(*) as cnt from view_service_utilization_report where 1 `
            mm.executeQuery(queryC + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * from view_service_utilization_report where 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            console.log("Order count:", result1)
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 151,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.refundReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + "  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var queryC = `SELECT count(*) as cnt  FROM view_order_cancellation_transactions WHERE 1 `
            mm.executeQuery(queryC + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT CUSTOMER_ID,CUSTOMER_NAME,ORDER_ID,ORDER_NUMBER,TOTAL_AMOUNT,PAYMENT_REFUND_STATUS,PAYMENT_STATUS FROM view_order_cancellation_transactions WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 61,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}
exports.technicianwiseJobCardReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + "  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {

            var queryC = `select count(*) as cnt FROM view_job_card WHERE 1 `
            mm.executeQuery(queryC + filter, supportKey, (error, resultsgetc) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT TECHNICIAN_NAME,JOB_CARD_NO,ASSIGNED_DATE,START_TIME,END_TIME,IFNULL(TIMESTAMPDIFF(MINUTE,START_TIME,END_TIME),0) AS EXPECTED_TIME_IN_MIN,IFNULL(TIMESTAMPDIFF(MINUTE,START_TIME,JOB_COMPLETED_DATETIME),0) AS ACTUAL_TIME_IN_MIN FROM view_job_card WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            console.log("resultsgetc :", resultsgetc)
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 44,
                                "message": "success",
                                "count": resultsgetc[0].cnt,
                                "data": result
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.vendorPerformanceReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'NAME';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + "   order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt from view_vendor_performance_report WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * from view_vendor_performance_report WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 152,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.customerServiceFeedbackReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT COUNT(*) as cnt FROM view_customer_service_feedback WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT ID,FEEDBACK_DATE_TIME,CUSTOMER_NAME,SERVICE_NAME,RATING,COMMENTS FROM view_customer_service_feedback WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 22,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.customerTechnicianFeedbackReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_customer_technician_feedback WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT FEEDBACK_DATE_TIME,CUSTOMER_NAME,TECHNICIAN_NAME,RATING,COMMENTS FROM view_customer_technician_feedback WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 23,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.technicianCustomerFeedbackReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_technician_customer_feedback  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT ID,FEEDBACK_DATE_TIME,CUSTOMER_NAME,TECHNICIAN_NAME,RATING,COMMENTS FROM view_technician_customer_feedback  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 111,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.orderCancellationReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_order_cancellation_transactions  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT ORDER_ID,ORDER_NUMBER,REQUESTED_DATE,CANCEL_DATE,CUSTOMER_NAME,CUSTOMER_REMARK,REASON,ORDER_STATUS,ORDER_STATUS_NAME FROM view_order_cancellation_transactions  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 61,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.customerRegistrationReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM customer_master  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT ID,NAME,REGISTRATION_DATE,EMAIL,MOBILE_NO FROM customer_master  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 20,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.jobAssignmentReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt from view_job_card  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT ID,JOB_CARD_NO,USER_NAME,TECHNICIAN_NAME,SCHEDULED_DATE_TIME,STATUS,JOB_CARD_STATUS,TERRITORY_ID,TERRITORY_NAME,ASSIGNED_DATE from view_job_card  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 44,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.orderwiseJobCardDetailedReportOLD = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_job_card  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT JOB_CARD_NO,JOB_CARD_STATUS,JOB_CREATED_DATE,SCHEDULED_DATE_TIME,ASSIGNED_DATE,TECHNICIAN_NAME,TECHNICIAN_STATUS,TRACK_STATUS,SERVICE_ADDRESS,SERVICE_SKILLS,SERVICE_FULL_NAME,SERVICE_NAME,TERRITORY_NAME,SERVICE_AMOUNT,TOTAL_AMOUNT,TECHNICIAN_COST,VENDOR_COST,CUSTOMER_RATING,TECHNICIAN_RATING FROM view_job_card  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 44,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.emailTransactionHistory = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_email_transactiona_history  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * FROM view_email_transactiona_history  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 155,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.smsTransactionHistory = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM sms_transactiona_history  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * FROM sms_transactiona_history  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 156,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.whatsappTransactionHistory = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM whatsapp_messages_history  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * FROM whatsapp_messages_history  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 157,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.b2bcustomerServicesSummery = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_b2b_customer_service_summery_report  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * FROM view_b2b_customer_service_summery_report  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 158,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.technicianTimeSheetoLDbACKUP = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    const START_TIME = req.body.START_TIME
    const END_TIME = req.body.END_TIME
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {

            var query = `SET SESSION group_concat_max_len = 10000000;
SELECT 
    CONCAT('{', GROUP_CONCAT(
        CONCAT('"', TECHNICIAN_ID, '": ', JOBS)
    ORDER BY TECHNICIAN_ID SEPARATOR ', '), '}') AS JSON_RESULT
FROM (
    SELECT 
        jc.TECHNICIAN_ID,
        jc.TECHNICIAN_NAME,
        CONCAT('[', GROUP_CONCAT(
            CONCAT('{',
                '"TECHNICIAN_NAME": "', COALESCE(jc.TECHNICIAN_NAME, ''), '", ',
                '"JOB_CARD_NUMBER": "', COALESCE(jc.JOB_CARD_NO, ''), '", ',
                '"SERVICE_NAME": "', COALESCE(jc.SERVICE_NAME, ''), '", ',
                '"ORDER_NUMBER": "', COALESCE(jc.ORDER_NO, ''), '", ',
                '"JOB_CARD_STATUS": "', COALESCE(jcs.NAME, ''), '", ',
                '"ORDER_STATUS": "', COALESCE(vm.ORDER_STATUS, ''), '", ',
                '"ORDER_DATE_TIME": "', DATE_FORMAT(COALESCE(jc.JOB_CREATED_DATE, NOW()), '%Y-%m-%d %H:%i:%s'), '", ',
                '"SCHEDULED_DATE": "', DATE_FORMAT(COALESCE(jc.SCHEDULED_DATE_TIME, NOW()), '%Y-%m-%d'), '", ',
                '"ASSIGNED_DATE": "', DATE_FORMAT(COALESCE(jc.ASSIGNED_DATE, NOW()), '%Y-%m-%d'), '", ',
                '"JOB_COMPLETED_DATETIME": "', DATE_FORMAT(COALESCE(jc.JOB_COMPLETED_DATETIME, NOW()), '%Y-%m-%d'), '", ',
                '"START_TIME": "', IFNULL(DATE_FORMAT(jc.START_TIME, '%H:%i'), '00:00'), '", ',
                '"END_TIME": "', IFNULL(DATE_FORMAT(jc.END_TIME, '%H:%i'), '00:00'), '", ',
                '"TOTAL_TIME": "', IF(jc.START_TIME IS NOT NULL AND jc.END_TIME IS NOT NULL, 
                                       TIME_FORMAT(SEC_TO_TIME(TIMESTAMPDIFF(SECOND, jc.START_TIME, jc.END_TIME)), '%H:%i:%s'), 
                                       '00:00:00'), '"'
            '}')
        ORDER BY jc.START_TIME SEPARATOR ', '), ']') AS JOBS
    FROM job_card jc
    LEFT JOIN job_card_status_master jcs ON jc.JOB_STATUS_ID = jcs.ID
    LEFT JOIN view_order_master vm ON jc.ORDER_ID = vm.ID
    WHERE jc.SCHEDULED_DATE_TIME BETWEEN '${START_TIME}' AND '${END_TIME}'
    GROUP BY jc.TECHNICIAN_ID, jc.TECHNICIAN_NAME ${criteria}
) AS subquery where 1  `
            mm.executeQuery(query, supportKey, (error, result) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "success",
                        "data": result[1][0],
                    });
                }
            });

        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.technicianTimeSheet = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    const START_TIME = req.body.START_TIME
    const END_TIME = req.body.END_TIME
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {

            var query = `SELECT COUNT(*) AS cnt FROM view_technician_time_sheet_report WHERE 1  `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT * FROM view_technician_time_sheet_report WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 159,
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });

        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getTechnicianEarnings = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    console.log("\n\n\n\ngetTechnicianEarnings", req.body);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(`select count(*) as cnt from view_job_card  WHERE  TECHNICIAN_ID = ? AND JOB_CARD_STATUS='COMPLETED' ${countCriteria}`, [TECHNICIAN_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get jobCard technician count."
                    });
                }
                else {
                    mm.executeQueryData(`SELECT ID ,JOB_CARD_NO,ASSIGNED_DATE,JOB_COMPLETED_DATETIME,TECHNICIAN_ID,TECHNICIAN_NAME,TECHNICIAN_COST FROM view_job_card WHERE  TECHNICIAN_ID = ? AND JOB_CARD_STATUS='COMPLETED'  ${criteria};`, [TECHNICIAN_ID], supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get jobCard technician information."
                            });
                        } else {
                            mm.executeQueryData(`SELECT IFNULL(SUM(TECHNICIAN_COST),0) AS TOTAL_EARNINGS FROM view_job_card WHERE  TECHNICIAN_ID = ? AND JOB_CARD_STATUS='COMPLETED'  ${criteria};`, [TECHNICIAN_ID], supportKey, (error, results2) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get technician cost."
                                    });
                                } else {
                                    res.send({
                                        "code": 200,
                                        "message": "Technician total cost information fetched successfully.",
                                        "count": results[0].cnt,
                                        "JOB_WISE_EARNINGS": results1,
                                        "TOTAL_EARNINGS": results2[0].TOTAL_EARNINGS,
                                    })
                                }
                            })
                        }
                    })

                }
            })
        } else {
            res.send({
                "code": 400,
                "message": "Invalid Filter."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }
}

exports.gettechnicianCashCollection = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from view_payment_gateway_transactions where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get banner  count.",
                    });
                }
                else {
                    mm.executeQuery('SELECT ID,TECHNICIAN_NAME,TECHNICIAN_MOBILE_NO,TECHNICIAN_TYPE,VENDOR_NAME,JOB_CARD_NO,ORDER_NO,TRANSACTION_AMOUNT,TRANSACTION_DATE,CUSTOMER_NAME,CUSTOMER_MOBILE_NO FROM view_payment_gateway_transactions where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get banner information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 81,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getDistinctOrderNumbers = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ORDER_NUMBER';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(DISTINCT ORDER_NUMBER) as cnt from view_order_details where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get Service count.",
                    });
                }
                else {
                    mm.executeQuery('select DISTINCT ORDER_NUMBER from view_order_details where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get Service information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "TAB_ID": 89,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}

exports.vendorDetailedPerformanceReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'VENDOR_NAME';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + "   order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt from view_vendor_detailed_performance_report WHERE 1  AND STATUS = "CO" `;
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get vendor performance report count.",
                    });
                }
                else {
                    var query = `SELECT * from view_vendor_detailed_performance_report WHERE 1  AND STATUS = "CO" `;
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get vendor performance report.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 44,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getTechnicianSLAReport = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(*) as cnt from view_job_card where 1 AND TECHNICIAN_STATUS= 'AS'  ` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from view_job_card where 1 AND TECHNICIAN_STATUS= 'AS' ` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get technician information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 44,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getCustomerAddressLogs = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(*) as cnt from view_customer_address_logs where 1 ` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get address count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from view_customer_address_logs where 1` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get address information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 204,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.userloginLogs = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(*) as cnt from view_user_login_logs where 1 ` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get user logins count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from view_user_login_logs where 1` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get user logins information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 205,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.orderwiseJobCardDetailedReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            var query = `SELECT count(*) as cnt FROM view_job_card  WHERE 1 `
            mm.executeQuery(query + filter, supportKey, (error, result1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get order count.",
                    });
                }
                else {
                    var query = `SELECT JOB_CARD_NO,JOB_CARD_STATUS,JOB_CREATED_DATE,SCHEDULED_DATE_TIME,ASSIGNED_DATE,TECHNICIAN_NAME,TECHNICIAN_STATUS,TRACK_STATUS,SERVICE_ADDRESS,SERVICE_SKILLS,SERVICE_FULL_NAME,SERVICE_NAME,TERRITORY_NAME,SERVICE_AMOUNT,TOTAL_AMOUNT,TECHNICIAN_COST,VENDOR_COST,CUSTOMER_RATING,TECHNICIAN_RATING,CUSTOMER_NAME,CUSTOMER_EMAIL,CUSTOMER_MOBILE_NUMBER,COMPANY_NAME,ORDER_NO,JOB_COMPLETED_DATETIME,CUSTOMER_ID,CATEGORY_ID,CATEGORY_NAME,SUB_CATEGORY_ID,SUB_CATEGORY_NAME,TAX_AMOUNT FROM view_job_card  WHERE 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, result) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get order count.",
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 44,
                                "message": "success",
                                "count": result1[0].cnt,
                                "data": result,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}