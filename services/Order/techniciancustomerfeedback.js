const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;

var technicianCustomerFeedback = "technician_customer_feedback";
var viewTechnicianCustomerFeedback = "view_" + technicianCustomerFeedback;

function reqData(req) {

    var data = {
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        RATING: req.body.RATING,
        COMMENTS: req.body.COMMENTS,
        FEEDBACK_DATE_TIME: req.body.FEEDBACK_DATE_TIME,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('RATING').isInt().optional(),
        body('COMMENTS').optional(),
        body('FEEDBACK_DATE_TIME').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianCustomerFeedback + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianCustomerFeedback count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTechnicianCustomerFeedback + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianCustomerFeedback information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 111,
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
            mm.executeQueryData('INSERT INTO ' + technicianCustomerFeedback + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianCustomerFeedback information..."
                    });
                }
                else {
                    mm.executeQueryData('SELECT * FROM view_customer_order_details WHERE ORDER_ID = ? AND JOB_CARD_ID = ? AND CUSTOMER_ID = ?', [data.ORDER_ID, data.JOB_CARD_ID, data.CUSTOMER_ID], supportKey, (error, resultsGet) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save technicianCustomerFeedback information..."
                            });
                        }
                        else {
                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has given new technician-customer feedback.`;

                            var logCategory = "technician customer feedback";

                            let actionLog = {
                                "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog)
                            // mm.sendNotificationToCustomer(data.TECHNICIAN_ID, data.CUSTOMER_ID, "**Feedback**", `You have a received feedback from technician`, "", "F", supportKey, "N", "F", req.body);
                            mm.sendNotificationToChannel(data.TECHNICIAN_ID, `customer_${data.CUSTOMER_ID}_channel`, "Feedback", `You have a received feedback from technician`, "", "F", supportKey, "N", "F", resultsGet);
                            res.send({
                                "code": 200,
                                "message": "TechnicianCustomerFeedback information saved successfully...",
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
    if (data.COMMENTS == null) {
        setData += "COMMENTS = ? , ";
        recordData.push(null);
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + technicianCustomerFeedback + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianCustomerFeedback information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details technician customer feedback.`;

                    var logCategory = "technician customer feedback";

                    let actionLog = {
                        "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "TechnicianCustomerFeedback information updated successfully...",
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

exports.getTechnicianCustomerFeedback = (req, res) => {
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
    let CUSTOMER_MANAGER_ID = req.body.CUSTOMER_MANAGER_ID ? req.body.CUSTOMER_MANAGER_ID : '';
    let FilterManager = '';
    let FilterManager2 = '';
    if (CUSTOMER_MANAGER_ID != '') {
        FilterManager += " AND f.CUSTOMER_MANAGER_ID = " + CUSTOMER_MANAGER_ID;
        FilterManager2 += " AND CUSTOMER_MANAGER_ID = " + CUSTOMER_MANAGER_ID;
    }

    let criteria = '';
    if (pageIndex === '' && pageSize === '') {
        criteria = filter + " order by " + sortKey + " " + sortValue;
    } else {
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    }

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianCustomerFeedback + ' where 1 ' + FilterManager2 + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianCustomerFeedback count.",
                    });
                } else {
                    mm.executeQuery('select * from ' + viewTechnicianCustomerFeedback + ' where 1 ' + FilterManager2 + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianCustomerFeedback information."
                            });
                        } else {
                            var QUERY = ` SELECT r.rating, COUNT(f.rating) AS rating_count, COALESCE(ROUND((COUNT(f.rating) * 100 / (SELECT COUNT(*) FROM view_technician_customer_feedback WHERE 1 ${filter + FilterManager2}))), 0) AS progress_percentage FROM ( SELECT 1 AS rating UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 ) AS r LEFT JOIN view_technician_customer_feedback f ON r.rating = f.rating AND 1 ${filter + FilterManager} GROUP BY r.rating ORDER BY r.rating;`;
                            var AVG_RATING_QUERY = ` SELECT ROUND(AVG(RATING)) AS AVG_RATING FROM view_technician_customer_feedback WHERE 1 ${filter + FilterManager2}; `;

                            mm.executeQuery(QUERY, supportKey, (error, progressResults) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to calculate progress."
                                    });
                                } else {
                                    mm.executeQuery(AVG_RATING_QUERY, supportKey, (error, avgResults) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to calculate average rating."
                                            });
                                        } else {
                                            res.send({
                                                "code": 200,
                                                "message": "success",
                                                "count": results1[0].cnt,
                                                "data": results,
                                                "progress": progressResults,
                                                "averageRating": avgResults[0].AVG_RATING
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
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "something went wrong"
        });
    }
};
