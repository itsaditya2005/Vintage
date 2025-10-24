const { connect } = require('../../routes/globalSettings');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const technicianActionLog = require("../../modules/technicianActionLog")

var orderCancellationTransactions = "order_cancellation_transactions";
var viewOrderCancellationTransactions = "view_" + orderCancellationTransactions;

function reqData(req) {
    var data = {
        REQUESTED_DATE: req.body.REQUESTED_DATE,
        ORDER_ID: req.body.ORDER_ID,
        PAYMENT_ID: req.body.PAYMENT_ID,
        CANCELLED_BY: req.body.CANCELLED_BY,
        CANCEL_DATE: req.body.CANCEL_DATE,
        REASON: req.body.REASON,
        REFUND_STATUS: req.body.REFUND_STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        REMARK: req.body.REMARK,
        CUSTOMER_REMARK: req.body.CUSTOMER_REMARK,
        PAYMENT_REFUND_STATUS: req.body.PAYMENT_REFUND_STATUS
    }
    return data;
}

exports.validate = function () {
    return [
        body('REQUESTED_DATE').optional(),
        body('ORDER_ID').isInt().optional(),
        body('PAYMENT_ID').optional(),
        body('CANCELLED_BY').optional(),
        body('CANCEL_DATE').optional(),
        body('REASON').optional(),
        body('REFUND_STATUS').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewOrderCancellationTransactions + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderCancellationTransactions count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewOrderCancellationTransactions + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get orderCancellationTransactions information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 61,
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

exports.create = (req, res) => {

    var data = reqData(req);
    var ORDER_CREATER_ID = req.body.ORDER_CREATER_ID
    var ORDER_CREATED_BY = req.body.ORDER_CREATED_BY
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
            data.PAYMENT_REFUND_STATUS = 'P'
            mm.executeQueryData('INSERT INTO ' + orderCancellationTransactions + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderCancellationTransactions information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].USER_NAME} has requested to cancel order.`;
                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: data.CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Requested for order cancellation", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: 0, ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: mm.getSystemDate(), supportKey: 0 }
                    mm.sendNotificationToAdmin(8, `Order Cancellation Request`, ACTION_DETAILS, "", "O", "", supportKey, "O", req.body);
                    if (ORDER_CREATED_BY == 'V') {
                        mm.sendNotificationToVendor(req.body.authData.data.UserData[0].USER_ID, ORDER_CREATER_ID, `Order Cancellation Request`, ACTION_DETAILS, "", "O", supportKey, "", "O", req.body);
                    }
                    else if (ORDER_CREATED_BY == 'B') {
                        mm.sendNotificationToManager(req.body.authData.data.UserData[0].USER_ID, ORDER_CREATER_ID, `Order Cancellation Request`, ACTION_DETAILS, "", "O", supportKey, "", "O", req.body);
                    }
                    else {
                        console.log("ORDER_CREATED_BY is C ")
                    }
                    dbm.saveLog(logData, technicianActionLog);
                    res.send({
                        "code": 200,
                        "message": "OrderCancellationTransactions information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + orderCancellationTransactions + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderCancellationTransactions information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated of order cancellation request.`;


                    var logCategory = "job card photo details";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "OrderCancellationTransactions information updated successfully...",
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

exports.updateStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var orderStatus1 = req.body.ORDER_STATUS;
    var PAYMENT_MODE = req.body.PAYMENT_MODE
    var REASON = req.body.REASON
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        var status = ''
        var ORDER_STATUS = ''
        if (data.REFUND_STATUS == "A") {
            status = 'accepted'
            // mm.sendDynamicEmail(13, getOrderDetails[0].ORDER_DETAILS_ID, supportKey)
            ORDER_STATUS = 'OC'
            data.CANCELLED_BY = req.body.authData.data.UserData[0].USER_ID
            data.CANCEL_DATE = systemDate
        } else {
            status = 'rejected'
            ORDER_STATUS = orderStatus1
            data.CANCELLED_BY = null
            data.CANCEL_DATE = null
        }
        const connection = mm.openConnection();
        PAYMENT_MODE === 'COD' && data.REFUND_STATUS == "A" ? data.PAYMENT_REFUND_STATUS = 'RF' : data.PAYMENT_REFUND_STATUS = "P"
        mm.executeDML(`UPDATE ` + orderCancellationTransactions + ` SET REFUND_STATUS = ?,CREATED_MODIFIED_DATE = ?,REMARK = ?,PAYMENT_REFUND_STATUS = ? ,CANCELLED_BY=?,CANCEL_DATE=? where ID = ? `, [data.REFUND_STATUS, systemDate, data.REMARK, data.PAYMENT_REFUND_STATUS, data.CANCELLED_BY, data.CANCEL_DATE, ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to update orderCancellationTransactions information."
                });
            }
            else {
                mm.executeDML(`SELECT ID from order_details where ORDER_ID = ? `, [ORDER_ID], supportKey, connection, (error, getOrderDetails) => {
                    if (error) {
                        mm.rollbackConnection(connection)
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update orderCancellationTransactions information."
                        });
                    }
                    else {
                        mm.executeDML(`SELECT * from view_order_master where ID = ? `, [ORDER_ID], supportKey, connection, (error, getOrderMaster) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update orderCancellationTransactions information."
                                });
                            }
                            else {
                                if (data.REFUND_STATUS == "A") {
                                    mm.sendDynamicEmail(13, getOrderDetails[0].ID, supportKey)
                                } else if (data.REFUND_STATUS == "R") {
                                    mm.sendDynamicEmail(14, getOrderDetails[0].ID, supportKey)
                                }
                                if (data.REFUND_STATUS == 'R') {
                                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request due to ${data.REMARK}`;
                                    const logData = {
                                        TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request ' + status, PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0
                                    }
                                    dbm.saveLog(logData, technicianActionLog);
                                    // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "O", getOrderMaster);
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "CancleOrderReason information updated successfully...",
                                    });
                                } else {
                                    mm.executeDML(`UPDATE order_master SET ORDER_STATUS_ID = ?  where ID = ? `, [7, ORDER_ID], supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection)
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update orderCancellationTransactions information."
                                            });
                                        }
                                        else {
                                            mm.executeDML(`SELECT * FROM view_order_master where ID = ? `, [ORDER_ID], supportKey, connection, (error, resultsGetOrder) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    console.log(error);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to update orderCancellationTransactions information."
                                                    });
                                                }
                                                else {
                                                    let formattedDate = mm.getFormmattedDate();
                                                    var wBparams = [
                                                        {
                                                            "type": "text",
                                                            "text": resultsGetOrder[0].ORDER_NUMBER
                                                        },
                                                        {
                                                            "type": "text",
                                                            "text": data.REASON
                                                        },
                                                        {
                                                            "type": "text",
                                                            "text": formattedDate
                                                        }
                                                    ]

                                                    var wparams = [
                                                        {
                                                            "type": "body",
                                                            "parameters": wBparams
                                                        }
                                                    ]

                                                    mm.sendWAToolSMS(resultsGetOrder[0].MOBILE_NO, "order_cancelled", wparams, 'en', (error, resultswsms) => {
                                                        if (error) {
                                                            console.log(error)
                                                        }
                                                        else {
                                                            console.log("Successfully send SMS", resultswsms)
                                                        }
                                                    })
                                                    if (data.PAYMENT_REFUND_STATUS === 'RF') {
                                                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request.`;
                                                        const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request ' + status, PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        const logData2 = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Order Cancelled successfully ', PAYMENT_MODE: PAYMENT_MODE, PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        const logarray = [logData, logData2]
                                                        dbm.saveLog(logarray, technicianActionLog);
                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "O", resultsGetOrder);
                                                        mm.sendDynamicEmail(13, getOrderDetails[0].ORDER_DETAILS_ID, supportKey)
                                                        mm.commitConnection(connection);
                                                        res.status(200).json({
                                                            "code": 200,
                                                            "message": "CancleOrderReason information updated successfully...",
                                                        });
                                                    } else {
                                                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request.`;
                                                        const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request ' + status, PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        dbm.saveLog(logData, technicianActionLog);
                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "O", resultsGetOrder);
                                                        mm.commitConnection(connection);
                                                        res.status(200).json({
                                                            "code": 200,
                                                            "message": "CancleOrderReason information updated successfully...",
                                                        });
                                                    }
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        })
                    }
                })
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }
}

exports.getCounts = (req, res) => {
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

            var Query = `SELECT COUNT(CASE WHEN REFUND_STATUS = 'P' THEN 1 END) AS PENDING,COUNT(CASE WHEN REFUND_STATUS = 'A' THEN 1 END) AS APPROVED,COUNT(CASE WHEN REFUND_STATUS = 'R' THEN 1 END) AS REJECTED FROM order_cancellation_transactions where 1 `;
            mm.executeQuery(Query + criteria, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderCancellationTransactions information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 61,
                        "data": results
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

exports.RefundStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var ORDER_STATUS = req.body.ORDER_STATUS;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var PAYMENT_REFUND_STATUS = req.body.PAYMENT_REFUND_STATUS
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        if (PAYMENT_REFUND_STATUS != "RF") {
            res.send({
                "code": 300,
                "message": "Wrong Status."
            });
        } else {
            const connection = mm.openConnection();
            mm.executeDML(`UPDATE ` + orderCancellationTransactions + ` SET PAYMENT_REFUND_STATUS = ?,REFUNDED_DATE = ? where ID = ? `, ["RF", systemDate, ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderCancellationTransactions information."
                    });
                }
                else {
                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has refunded the amount for your order cancellation request.`;
                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request refunded', PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    const logData2 = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Order canceled successfully', PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    const logaaray = [logData, logData2]
                    dbm.saveLog(logaaray, technicianActionLog);
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "code": 200,
                        "message": "CancleOrderReason information updated successfully...",
                    });

                }
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

