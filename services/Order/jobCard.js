const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const geolib = require('geolib');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;

var jobCard = "job_card";
var viewJobCard = "view_" + jobCard;

function reqData(req) {
    var data = {
        JOB_CREATED_DATE: req.body.JOB_CREATED_DATE,
        EXPECTED_DATE_TIME: req.body.EXPECTED_DATE_TIME,
        TASK_DESCRIPTION: req.body.TASK_DESCRIPTION,
        JOB_STATUS_ID: req.body.JOB_STATUS_ID,
        ORDER_ID: req.body.ORDER_ID,
        ORDER_NO: req.body.ORDER_NO,
        JOB_CARD_NO: req.body.JOB_CARD_NO,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        CUSTOMER_NAME: req.body.CUSTOMER_NAME,
        SERVICE_ID: req.body.SERVICE_ID,
        SERVICE_ADDRESS: req.body.SERVICE_ADDRESS,
        LATTITUTE: req.body.LATTITUTE,
        LONGITUDE: req.body.LONGITUDE,
        SERVICE_SKILLS: req.body.SERVICE_SKILLS,
        SERVICE_FULL_NAME: req.body.SERVICE_FULL_NAME,
        SERVICE_NAME: req.body.SERVICE_NAME,
        PINCODE: req.body.PINCODE,
        PRIORITY: req.body.PRIORITY,
        TERRITORY_ID: req.body.TERRITORY_ID,
        TERRITORY_NAME: req.body.TERRITORY_NAME,
        SERVICE_AMOUNT: req.body.SERVICE_AMOUNT,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        SCHEDULED_DATE_TIME: req.body.SCHEDULED_DATE_TIME,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        ESTIMATED_TIME_IN_MIN: req.body.ESTIMATED_TIME_IN_MIN,
        EXECUTION_DATE_TIME: req.body.EXECUTION_DATE_TIME,
        CLIENT_ID: req.body.CLIENT_ID,
        ORDER_DETAILS_ID: req.body.ORDER_DETAILS_ID,
        TECHNICIAN_STATUS: req.body.TECHNICIAN_STATUS,
        USER_ID: req.body.USER_ID,
        ASSIGNED_DATE: req.body.ASSIGNED_DATE,
        ORGNISATION_ID: req.body.ORGNISATION_ID,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST,
        VENDOR_COST: req.body.VENDOR_COST,
        VENDOR_ID: req.body.VENDOR_ID,
        JOB_PAYMENT_STATUS: req.body.JOB_PAYMENT_STATUS,
        IS_REMOTE_JOB: req.body.IS_REMOTE_JOB ? req.body.IS_REMOTE_JOB : 0,


    }
    return data;
}

exports.validate = function () {

    return [
        body('TASK_DESCRIPTION').optional(),
        body('ORDER_ID').isInt().optional(),
        body('ORDER_NO').optional(),
        body('JOB_CARD_NO').optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('CUSTOMER_TYPE').optional(),
        body('CUSTOMER_NAME').optional(),
        body('SERVICE_ID').isInt().optional(),
        body('SERVICE_ADDRESS').optional(),
        body('SERVICE_SKILLS').optional(),
        body('SERVICE_FULL_NAME').optional(),
        body('SERVICE_NAME').optional(),
        body('PINCODE').optional(),
        body('PRIORITY').optional(),
        body('TERRITORY_ID').isInt().optional(),
        body('TERRITORY_NAME').optional(),
        body('SERVICE_AMOUNT').isDecimal().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('TECHNICIAN_NAME').optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewJobCard + ' where 1' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get jobCard count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewJobCard + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get jobCard information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
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
            code: 500,
            message: "Something Went Wrong."
        })
    }
}

exports.getJobsforDispatcher = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewJobCard + ' where 1 AND ORDER_ID NOT IN(SELECT ORDER_ID FROM order_cancellation_transactions)' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get jobCard count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewJobCard + ' where 1  AND ORDER_ID NOT IN(SELECT ORDER_ID FROM order_cancellation_transactions)' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get jobCard information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
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
            code: 500,
            message: "Something Went Wrong."
        })
    }
}

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + jobCard + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save jobCard information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "JobCard information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];

    var criteria = {
        ID: req.body.ID,
    };

    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];

    Object.keys(data).forEach(key => {
        data[key] ? setData += `${key}= ? , ` : true;
        data[key] ? recordData.push(data[key]) : true;
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + jobCard + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update jobCard information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "JobCard information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}

exports.createJobCard = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const connection = mm.openConnection()
            mm.executeDML('SELECT * FROM view_order_master where ID = ?', [data.ORDER_ID], supportKey, connection, (error, OrderResult) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    mm.executeDML('SELECT JOB_CARD_NO FROM view_job_card ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, jobResult) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection)
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save orderMaster information..."
                            });
                        }
                        else {
                            let systemDate = mm.getSystemDate();
                            let newSequenceNumber = 1;
                            if (jobResult.length > 0) {
                                const lastOrderNumber = jobResult[0].JOB_CARD_NO;
                                const parts = lastOrderNumber.split('/');
                                const sequencePart = parts[parts.length - 1]; // This gets "00142" regardless of prefix
                                const lastSequence = parseInt(sequencePart, 10);
                                newSequenceNumber = lastSequence + 1;
                            }
                            const datePart = systemDate.split(" ")[0].split("-").join('');
                            const JOB_CARD_NO = `JOB/${datePart}/${String(newSequenceNumber).padStart(5, '0')}`;
                            data.JOB_CARD_NO = JOB_CARD_NO;
                            data.JOB_STATUS_ID = 1;
                            data.JOB_CREATED_DATE = systemDate;
                            data.TECHNICIAN_STATUS = 'P';
                            OrderResult[0].PAYMENT_STATUS == "D" ? data.JOB_PAYMENT_STATUS = "D" : "P"
                            mm.executeDML('INSERT INTO ' + jobCard + ' SET ?', data, supportKey, connection, (error, resultsjOB) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection)
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save jobCard information..."
                                    });
                                }
                                else {
                                    mm.executeDML(`UPDATE order_details SET JOB_CARD_ID = '${resultsjOB.insertId}' WHERE ID = ${data.ORDER_DETAILS_ID}`, [], supportKey, connection, (error, results) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to save jobCard information..."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, [resultsjOB.insertId], supportKey, connection, (error, resultsCheckJob) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                    console.log(error);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get job information."
                                                    });
                                                } else {
                                                    mm.commitConnection(connection)
                                                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has generated a job for the service ${data.SERVICE_NAME} for customer ${data.CUSTOMER_NAME}.`
                                                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: resultsjOB.insertId, CUSTOMER_ID: data.CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: data.TECHNICIAN_NAME, ORDER_DATE_TIME: data.EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: data.EXPECTED_DATE_TIME, ORDER_MEDIUM: OrderResult[0].ORDER_MEDIUM, ORDER_STATUS: "Job card created", PAYMENT_MODE: OrderResult[0].PAYMENT_MODE, PAYMENT_STATUS: OrderResult[0].PAYMENT_STATUS, TOTAL_AMOUNT: OrderResult[0].TOTAL_AMOUNT, ORDER_NUMBER: OrderResult[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job card created", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }

                                                    dbm.saveLog(logData, technicianActionLog);
                                                    // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, data.CUSTOMER_ID, "**Job Created**", `A job has been created for your order ${data.ORDER_NO}. Our technician will be assigned shortly.`, "", "J", supportKey, "N", "J", req.body);
                                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${data.CUSTOMER_ID}_channel`, `New Job Created`, `A job has been created for your order ${data.ORDER_NO}. Our technician will be assigned shortly.`, "", "O", supportKey, "N", "O", OrderResult);
                                                    var TOPIC_NAME = `territory_${data.TERRITORY_ID}_channel`
                                                    // data.IS_REMOTE_JOB == 0 ? mm.sendNotificationToTerritory(data.TERRITORY_ID, "**New Job Created**", `Dear Technician, a new job has been created near your location.`, "", "J", supportKey, 'PJ', resultsCheckJob) : "";
                                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "New Job Created", `Dear technician, a new job has been created near your location.`, "", "J", supportKey, "", "PJ", resultsCheckJob);
                                                    addGlobalData(resultsjOB.insertId, supportKey);
                                                    res.send({
                                                        "code": 200,
                                                        "message": "JobCard information saved successfully...",
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}

function addGlobalData(JOB_ID, supportKey) {
    try {
        mm.executeQueryData(`select ORDER_NO,JOB_CARD_NO,CUSTOMER_NAME,TERRITORY_NAME,SERVICE_NAME,SERVICE_ADDRESS,TERRITORY_ID from view_job_card where ID = ?`, [JOB_ID], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                if (results5.length > 0) {
                    let logData = { ID: JOB_ID, CATEGORY: "Job", TITLE: results5[0].JOB_CARD_NO, DATA: JSON.stringify(results5[0]), ROUTE: "/overview/jobs", TERRITORY_ID: results5[0].TERRITORY_ID };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(err => {
                            console.error("Error in addDatainGlobalmongo:", err);
                        });
                } else {
                    console.log(" no data found");
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.getAssignedJobs = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let SCHEDULED_DATE_TIME = req.body.SCHEDULED_DATE_TIME ? req.body.SCHEDULED_DATE_TIME : '';
    let START_TIME = req.body.START_TIME ? req.body.START_TIME : '';
    let END_TIME = req.body.END_TIME ? req.body.END_TIME : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    let LATTITUTE = req.body.LATTITUTE ? req.body.LATTITUTE : '';
    let LONGITUDE = req.body.LONGITUDE ? req.body.LONGITUDE : '';

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
            if (TECHNICIAN_ID && SCHEDULED_DATE_TIME && START_TIME && END_TIME) {
                mm.executeQueryData(`select count(*) as cnt from view_job_card  WHERE  TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (END_TIME <= '${START_TIME + ":00"}') AND STATUS='AS' order by ID DESC LIMIT 1`, [TECHNICIAN_ID, SCHEDULED_DATE_TIME, START_TIME], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get jobCard count.",
                        });
                    }
                    else {
                        mm.executeQueryData(`SELECT * FROM view_job_card WHERE  TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (END_TIME <= '${START_TIME + ":00"}') AND STATUS='AS' order by ID DESC LIMIT 1`, [TECHNICIAN_ID, SCHEDULED_DATE_TIME, START_TIME], supportKey, (error, resultsCheck) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get jobCard information."
                                });
                            }
                            else {
                                if (resultsCheck.length > 0) {
                                    res.send({
                                        "code": 300,
                                        "message": "JobCard is already assigned to the Technician.",
                                        "count": results1[0].cnt,
                                        "data": resultsCheck
                                    });
                                } else {
                                    mm.executeQueryData('SELECT NAME AS TECHNICIAN_NAME, HOME_LATTITUDE AS LOCATION_LATITUDE, HOME_LONGITUDE AS LOCATION_LONG FROM technician_master WHERE ID = ?', [TECHNICIAN_ID], supportKey, (error, locationData) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get jobCard information."
                                            });
                                        }
                                        else {
                                            res.send({
                                                "code": 200,
                                                "message": "success",
                                                "TAB_ID": 44,
                                                "count": 1,
                                                "data": locationData
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            } else {
                res.send({
                    "code": 400,
                    "message": "Parameters are missing."
                });
            }
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

exports.getBetweenJobs = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let SCHEDULED_DATE_TIME = req.body.SCHEDULED_DATE_TIME ? req.body.SCHEDULED_DATE_TIME : '';
    let START_TIME = req.body.START_TIME ? req.body.START_TIME : '';
    let END_TIME = req.body.END_TIME ? req.body.END_TIME : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    let LATTITUTE = req.body.LATTITUTE ? req.body.LATTITUTE : '';
    let LONGITUDE = req.body.LONGITUDE ? req.body.LONGITUDE : '';

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
            if (TECHNICIAN_ID && SCHEDULED_DATE_TIME && START_TIME && END_TIME) {
                mm.executeQueryData(`select count(*) as cnt from view_job_card  WHERE  TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (END_TIME <= '${START_TIME + ":00"}') AND STATUS='AS' order by ID DESC LIMIT 1`, [TECHNICIAN_ID, SCHEDULED_DATE_TIME, START_TIME], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get jobCard count.",
                        });
                    }
                    else {
                        mm.executeQueryData(`SELECT *,1 AS PREVIOUS_JOB FROM view_job_card WHERE  TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (END_TIME <= '${START_TIME + ":00"}') order by END_TIME DESC LIMIT 1`, [TECHNICIAN_ID, SCHEDULED_DATE_TIME, START_TIME], supportKey, (error, resultsCheck) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get jobCard information."
                                });
                            }
                            else {
                                mm.executeQueryData(`SELECT *,0 AS PREVIOUS_JOB FROM view_job_card WHERE  TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (START_TIME >= '${END_TIME + ":00"}') order by START_TIME DESC LIMIT 1`, [TECHNICIAN_ID, SCHEDULED_DATE_TIME, START_TIME], supportKey, (error, resultsCheck1) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get jobCard information."
                                        });
                                    }
                                    else {
                                        var result = {}
                                        var result2 = {}
                                        if (resultsCheck.length > 0) {
                                            result = getDistanceAndTime(
                                                parseFloat(resultsCheck[0].LOCATION_LATITUDE),
                                                parseFloat(resultsCheck[0].LOCATION_LONG),
                                                parseFloat(LATTITUTE),
                                                parseFloat(LONGITUDE),
                                                60
                                            );
                                        }

                                        if (resultsCheck1.length > 0) {
                                            result2 = getDistanceAndTime(
                                                parseFloat(resultsCheck1[0].LOCATION_LATITUDE),
                                                parseFloat(resultsCheck1[0].LOCATION_LONG),
                                                parseFloat(LATTITUTE),
                                                parseFloat(LONGITUDE),
                                                60
                                            );
                                        }

                                        var jobsData = [];
                                        jobsData = [...resultsCheck, ...resultsCheck1];
                                        res.send({
                                            "code": 200,
                                            "message": "JobCard information fetched successfully.",
                                            "data": jobsData,
                                            "preveousJob": result,
                                            "nextJob": result2
                                        })
                                    }
                                });
                            }
                        });
                    }
                });
            } else {
                res.send({
                    "code": 400,
                    "message": "Parameters are missing."
                });
            }
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

exports.getJobsForTechnician = (req, res) => {
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


    try {
        if (IS_FILTER_WRONG == "0") {
            if (TECHNICIAN_ID) {
                var IS_ON_JOB = '';
                mm.executeQueryData(`select GROUP_CONCAT(ID)AS PINCODE_IDS FROM pincode_master WHERE ID IN(select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ?)`, [TECHNICIAN_ID], supportKey, (error, getTechnicianPincodes) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get jobCard count.",
                        });
                    }
                    else {
                        if (getTechnicianPincodes.length > 0) {
                            mm.executeQueryData(`select * from view_job_card  WHERE TECHNICIAN_ID = ? AND TRACK_STATUS IN('ST','RD','SJ') AND TERRITORY_ID IN (SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE PINCODE_ID IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID}))`, [TECHNICIAN_ID], supportKey, (error, resultDataCHECK) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get jobCard information."
                                    });
                                } else {
                                    if (resultDataCHECK.length > 0) {
                                        IS_ON_JOB = 1
                                    } else {
                                        IS_ON_JOB = 0
                                    }
                                    mm.executeQueryData(`select count(*) as cnt from view_job_card WHERE TERRITORY_ID IN (SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE PINCODE_ID IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID})) ${countCriteria}`, [], supportKey, (error, results1) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get jobCard count.",
                                            });
                                        }
                                        else {
                                            mm.executeQueryData(`select * from view_job_card WHERE TERRITORY_ID IN (SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE PINCODE_ID IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID})) ${criteria}`, [], supportKey, (error, resultData) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get jobCard information."
                                                    });
                                                } else {
                                                    res.send({
                                                        "code": 200,
                                                        "message": "JobCard information fetched successfully.",
                                                        "total": results1[0].cnt,
                                                        "data": resultData,
                                                        "IS_ON_JOB": IS_ON_JOB
                                                    })
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        } else {
                            res.send({
                                "code": 400,
                                "message": "Technician is not assigned to any Pincode."
                            });
                        }
                    }
                });
            } else {
                res.send({
                    "code": 400,
                    "message": "Parameters missing Technician ID."
                });
            }
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

function getDistanceAndTime(lat1, lon1, lat2, lon2, averageSpeedKmph = 60) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const estimatedTimeHours = distance / averageSpeedKmph;

    return {
        distance: distance.toFixed(2),
        estimatedTimeHours: estimatedTimeHours.toFixed(2),
    };
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

exports.getjobDetailsWithFeedback = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';

    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    var ORDER_ID = req.body.ORDER_ID
    var CUSTOMER_ID = req.body.CUSTOMER_ID
    var JOB_CARD_ID = req.body.JOB_CARD_ID
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
            mm.executeQueryData(`SELECT TECHNICIAN_ID AS ID, TECHNICIAN_NAME AS NAME, IFNULL((SELECT CAST(AVG(customer_technician_feedback.RATING) AS DECIMAL(10,2)) FROM customer_technician_feedback WHERE customer_technician_feedback.TECHNICIAN_ID = view_job_card.TECHNICIAN_ID), 0) AS AVERAGE_REVIEW, (SELECT COUNT(ID) FROM job_card WHERE job_card.TECHNICIAN_ID = view_job_card.TECHNICIAN_ID) AS job_count, TECHNICIAN_STATUS, JOB_CARD_STATUS, CUSTOMER_STATUS, TRACK_STATUS FROM view_job_card WHERE ORDER_ID = ? AND CUSTOMER_ID = ? AND ID = ?;`, [ORDER_ID, CUSTOMER_ID, JOB_CARD_ID], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderDetails information."
                    });
                } else {
                    mm.executeQuery(`SELECT csf.RATING AS service_feedback,csf.COMMENTS AS service_comment,ctf.RATING AS technician_feedback,ctf.COMMENTS AS technician_comment FROM customer_service_feedback csf LEFT JOIN customer_technician_feedback ctf ON csf.ORDER_ID = ctf.ORDER_ID WHERE csf.ORDER_ID=${ORDER_ID} AND  csf.CUSTOMER_ID=${CUSTOMER_ID} AND csf.JOB_CARD_ID=${JOB_CARD_ID}`, supportKey, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get orderDetails information."
                            });
                        } else {
                            mm.executeQuery(`SELECT * from view_inventory_request_details  WHERE 1 AND JOB_CARD_ID=${JOB_CARD_ID} AND  CUSTOMER_ID=${CUSTOMER_ID} AND STATUS="P" order by ID DESC;SELECT * from view_inventory_request_details  WHERE 1 AND JOB_CARD_ID=${JOB_CARD_ID} AND  CUSTOMER_ID=${CUSTOMER_ID} AND STATUS!="P" order by ID DESC;`, supportKey, (error, results3) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get orderDetails information."
                                    });
                                } else {
                                    mm.executeQuery(`SELECT * from inventory_request_master  WHERE 1 AND JOB_CARD_ID=${JOB_CARD_ID} AND  CUSTOMER_ID=${CUSTOMER_ID} AND PAYMENT_STATUS="P" AND STATUS IN("A","AC");SELECT * from inventory_request_master  WHERE 1 AND JOB_CARD_ID=${JOB_CARD_ID} AND  CUSTOMER_ID=${CUSTOMER_ID} AND PAYMENT_STATUS NOT IN("P","R");`, supportKey, (error, results4) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get orderDetails information."
                                            });
                                        } else {
                                            let pendingRequests = results3[0] || [];
                                            let allRequests = results3[1] || [];

                                            let pendingPayments = results4[0] || [];
                                            let PaidPayment = results4[1] || [];

                                            let pendingPayment = pendingPayments.length > 0 ? 1 : 0;
                                            let inventoryReq = pendingRequests.length > 0 ? 1 : 0;

                                            return res.send({
                                                "code": 200,
                                                "message": "success",
                                                "techData": results1,
                                                "feedbackData": results2,
                                                "inventoryReq": inventoryReq,
                                                "pendingPayment": pendingPayment,
                                                "jobData": allRequests,
                                                "pendingPayments": pendingPayments,
                                                "PaidPayment": PaidPayment,
                                            });
                                        }
                                    });
                                }
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

exports.updatePaymentStatusOLD = (req, res) => {
    var ORDER_ID = req.body.ORDER_ID;
    var JOB_CARD_ID = req.body.JOB_CARD_ID;
    var JOB_CARD_NO = req.body.JOB_CARD_NO;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME
    let STATUS = req.body.STATUS
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection();
        mm.executeDML(`UPDATE job_card SET JOB_PAYMENT_STATUS = ? where ID = ? `, ["D", JOB_CARD_ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.status(400).json({
                    "message": "Failed to update jobTransactionsTransactions information."
                });
            } else {
                const ACTION_DETAILS = `${TECHNICIAN_NAME} has marked the payment status as completed for the job ${JOB_CARD_NO}.`;
                const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: `Payment completed for job ${JOB_CARD_NO}`, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                dbm.saveLog(logData, technicianActionLog);
                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Payment status updated**`, ACTION_DETAILS, "", "J", supportKey, "N", "J", req.body);
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Payment status updated`, ACTION_DETAILS, "", "J", supportKey, "N", "P", req.body);
                mm.commitConnection(connection);
                res.status(200).json({
                    "message": "jobreschedule information updated successfully...",
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
}

exports.updatePaymentStatus = (req, res) => {
    var ORDER_ID = req.body.ORDER_ID;
    var JOB_CARD_ID = req.body.JOB_CARD_ID;
    var JOB_CARD_NO = req.body.JOB_CARD_NO;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME
    let STATUS = req.body.STATUS
    let IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN
    let USER_NAME = IS_UPDATED_BY_ADMIN === 1 ? req.body.authData.data.UserData[0].USER_NAME : TECHNICIAN_NAME
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection();
        mm.executeDML(`UPDATE job_card SET JOB_PAYMENT_STATUS = ? where ID = ? `, ["D", JOB_CARD_ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.status(400).json({
                    "message": "Failed to update jobTransactionsTransactions information."
                });
            } else {
                let LOG_TYPE = IS_UPDATED_BY_ADMIN === 1 ? "User" : "Technician"
                const ACTION_DETAILS = `${USER_NAME} has marked the payment status as completed for the job ${JOB_CARD_NO}.`;
                const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: LOG_TYPE, ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: `Payment completed for job ${JOB_CARD_NO}`, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                dbm.saveLog(logData, technicianActionLog);
                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Payment status updated**`, ACTION_DETAILS, "", "J", supportKey, "N", "J", req.body);
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Payment status updated`, ACTION_DETAILS, "", "J", supportKey, "N", "P", req.body);
                mm.commitConnection(connection);
                res.status(200).json({
                    "message": "jobreschedule information updated successfully...",
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
}

function getJobsForTechnician(TECHNICIAN_ID) {
    let supportKey = "99999"
    try {
        if (TECHNICIAN_ID) {
            var IS_ON_JOB = '';
            mm.executeQueryData(`select GROUP_CONCAT(ID)AS PINCODE_IDS FROM pincode_master WHERE ID IN(select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ?)`, [TECHNICIAN_ID], supportKey, (error, getTechnicianPincodes) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get jobCard count.",
                    });
                }
                else {
                    if (getTechnicianPincodes.length > 0) {
                        mm.executeQueryData(`select * from view_job_card  WHERE TECHNICIAN_ID = ? AND TRACK_STATUS IN('ST','RD','SJ') AND TERRITORY_ID IN (SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE PINCODE_ID IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID}))`, [TECHNICIAN_ID], supportKey, (error, resultDataCHECK) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get jobCard information."
                                });
                            } else {
                                if (resultDataCHECK.length > 0) {
                                    IS_ON_JOB = 1
                                } else {
                                    IS_ON_JOB = 0
                                }
                                mm.executeQueryData(`select count(*) as cnt from view_job_card WHERE TERRITORY_ID IN (SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE PINCODE_ID IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID})) ${countCriteria}`, [], supportKey, (error, results1) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to get jobCard count.",
                                        });
                                    }
                                    else {
                                        mm.executeQueryData(`select * from view_job_card WHERE TERRITORY_ID IN (SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE PINCODE_ID IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID})) ${criteria}`, [], supportKey, (error, resultData) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to get jobCard information."
                                                });
                                            } else {
                                                res.send({
                                                    "code": 200,
                                                    "message": "JobCard information fetched successfully.",
                                                    "total": results1[0].cnt,
                                                    "data": resultData,
                                                    "IS_ON_JOB": IS_ON_JOB
                                                })
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        res.send({
                            "code": 400,
                            "message": "Technician is not assigned to any Pincode."
                        });
                    }
                }
            });
        } else {
            console.log("TECHNICIAN_ID not found");

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