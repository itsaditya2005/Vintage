const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;

var invoicePaymentDetails = "invoice_payment_details";
var viewInvoicePaymentDetails = "view_" + invoicePaymentDetails;

function reqData(req) {

    var data = {
        INVOICE_ID: req.body.INVOICE_ID,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        PAYMENT_DATE: req.body.PAYMENT_DATE,
        PAYMENT_METHOD: req.body.PAYMENT_METHOD,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        AMOUNT: req.body.AMOUNT ? req.body.AMOUNT : 0,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

function reqDataPyament(req) {

    var data = {
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        VENDOR_ID: req.body.VENDOR_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        MEMBER_FROM: req.body.MEMBER_FROM,
        PAYMENT_FOR: req.body.PAYMENT_FOR,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_STATUS: req.body.TRANSACTION_STATUS,
        TRANSACTION_AMOUNT: req.body.TRANSACTION_AMOUNT,
        PAYLOAD: req.body.PAYLOAD,
        RESPONSE_DATA: req.body.RESPONSE_DATA,
        RESPONSE_CODE: req.body.RESPONSE_CODE,
        MERCHENT_ORDER_ID: req.body.MERCHENT_ORDER_ID,
        MERCHENT_ID: req.body.MERCHENT_ID,
        RESPONSE_MESSAGE: req.body.RESPONSE_MESSAGE,
        CLIENT_ID: req.body.CLIENT_ID,

    }
    return data;
}

exports.validate = function () {
    return [
        body('INVOICE_ID').isInt().optional(),
        body('TRANSACTION_ID').isInt().optional(),
        body('PAYMENT_DATE').optional(),
        body('PAYMENT_METHOD').optional(),
        body('PAYMENT_STATUS').optional(),
        body('AMOUNT').isDecimal().optional(),
        body('PAYMENT_MODE').optional(),
        body('ID').optional(),
    ]
}

exports.getPaymentTransactions = (req, res) => {
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
                        "message": "Failed to get invoicePaymentDetails count.",
                    });
                }
                else {
                    mm.executeQuery('select * from view_payment_gateway_transactions where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get invoicePaymentDetails information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 43,
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
            mm.executeQueryData('INSERT INTO ' + invoicePaymentDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save invoicePaymentDetails information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new invoice payment details.`;

                    var logCategory = "invoice payment details";

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "InvoicePaymentDetails information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + invoicePaymentDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update invoicePaymentDetails information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of invoice payment details.`;

                    var logCategory = "invoice payment details";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "InvoicePaymentDetails information updated successfully...",
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
            mm.executeQuery('select count(*) as cnt from payment_gateway_transactions where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get invoicePaymentDetails count.",
                    });
                }
                else {
                    mm.executeQuery('select * from payment_gateway_transactions where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get invoicePaymentDetails information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
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

exports.addPaymentTransactions = (req, res) => {
    let PAYMENT_TYPE = req.body.PAYMENT_TYPE;
    let PAYMENT_FOR = req.body.PAYMENT_FOR;
    let JOB_CARD_NO = req.body.JOB_CARD_NO
    var data = reqDataPyament(req);
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
            if (PAYMENT_FOR == "P") {
                data.PAYLOAD = JSON.stringify(req.body.PAYLOAD);
                data.RESPONSE_DATA = JSON.stringify(req.body.RESPONSE_DATA);
                mm.executeQueryData('INSERT INTO payment_gateway_transactions SET ?', data, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        mm.executeQueryData('UPDATE inventory_request_master SET PAYMENT_STATUS = ? WHERE JOB_CARD_ID = ? AND TECHNICIAN_ID = ? AND CUSTOMER_ID =?', ["S", data.JOB_CARD_ID, data.TECHNICIAN_ID, data.CUSTOMER_ID], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save invoicePaymentDetails information..."
                                });
                            }
                            else {
                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new invoice payment.`;
                                var logCategory = "invoice payment details";
                                let actionLog = {
                                    "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                }
                                mm.sendNotificationToTechnician(data.TECHNICIAN_ID, data.CUSTOMER_ID, `Part(s) Payment`, `A payment of Rs. ${data.TRANSACTION_AMOUNT} has been completed for parts related to job ${JOB_CARD_NO}`, "", "J", supportKey, "N", "J", req.body);
                                dbm.saveLog(actionLog, systemLog)
                                res.send({
                                    "code": 200,
                                    "message": "InvoicePaymentDetails information saved successfully...",
                                });
                            }
                        });
                    }
                });
            } else if (PAYMENT_FOR == "O") {
                mm.executeQueryData('INSERT INTO payment_gateway_transactions SET ?', data, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        mm.executeQueryData('UPDATE order_master SET PAYMENT_STATUS = ? WHERE ID = ? AND CUSTOMER_ID =?', ["D", data.ORDER_ID, data.CUSTOMER_ID], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save invoicePaymentDetails information..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "InvoicePaymentDetails information saved successfully...",
                                });
                            }
                        });
                    }
                });
            } else if (PAYMENT_FOR == "S") {
                mm.executeQueryData('INSERT INTO payment_gateway_transactions SET ?', data, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        mm.executeQueryData('UPDATE shop_order_master SET PAYMENT_STATUS = ? WHERE ID = ? AND CUSTOMER_ID =?', ["D", data.ORDER_ID, data.CUSTOMER_ID], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save invoicePaymentDetails information..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "InvoicePaymentDetails information saved successfully...",
                                });
                            }
                        });
                    }
                });
            }
            else if (PAYMENT_FOR == "J") {
                mm.executeQueryData('INSERT INTO payment_gateway_transactions SET ?', data, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save invoicePaymentDetails information..."
                        });
                    }
                    else {
                        mm.executeQueryData('UPDATE order_master SET PAYMENT_STATUS = ? WHERE ID = ? AND CUSTOMER_ID =?', ["D", data.ORDER_ID, data.CUSTOMER_ID], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save invoicePaymentDetails information..."
                                });
                            }
                            else {
                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new invoice payment.`;
                                var logCategory = "invoice payment details";
                                let actionLog = {
                                    "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                }
                                mm.sendNotificationToTechnician(data.TECHNICIAN_ID, data.CUSTOMER_ID, `Payment Done for job ${JOB_CARD_NO}`, `the Payment of job ${data.TRANSACTION_AMOUNT} is done for ${JOB_CARD_NO}`, "", "J", supportKey, "N", "J", req.body);
                                dbm.saveLog(actionLog, systemLog)
                                res.send({
                                    "code": 200,
                                    "message": "InvoicePaymentDetails information saved successfully...",
                                });
                            }
                        });
                    }
                });
            } else {
                res.send({
                    "code": 400,
                    "message": "Invalid Payment For."
                });
            }
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