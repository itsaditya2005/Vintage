const { connect } = require('../../routes/globalSettings');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const shopOrderActionLog = require("../../modules/shopOrderActionLog")
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")

var shopOrderCancellationTransactions = "shop_order_cancellation_transactions";
var viewshopOrderCancellationTransactions = "view_" + shopOrderCancellationTransactions;

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
            mm.executeQuery('select count(*) as cnt from ' + viewshopOrderCancellationTransactions + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get shopOrderCancellationTransactions count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewshopOrderCancellationTransactions + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get shopOrderCancellationTransactions information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 196,
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
    const errors = validationResult(req);
    var ORDER_NUMBER = req.body.ORDER_NUMBER;
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
            mm.executeQueryData('INSERT INTO ' + shopOrderCancellationTransactions + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save shopOrderCancellationTransactions information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has requested to cancel the order.`;
                    const logData = { ORDER_ID: data.ORDER_ID, CUSTOMER_ID: data.CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Requested for order cancellation", TOTAL_AMOUNT: 0, ORDER_NUMBER: ORDER_NUMBER, PAYMENT_MODE: "", PAYMENT_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                    mm.sendNotificationToAdmin(8, `Cancellation request by customer`, ACTION_DETAILS, "", "O", supportKey, "O", req.body);
                    dbm.saveLog(logData, shopOrderActionLog);
                    res.send({
                        "code": 200,
                        "message": "shopOrderCancellationTransactions information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + shopOrderCancellationTransactions + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update shopOrderCancellationTransactions information."
                    });
                }
                else {
                    var ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has updated the details of the order cancellation transactions.`;

                    var logCategory = "Order Cancellation Transactions";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "shopOrderCancellationTransactions information updated successfully...",
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
        data.CANCELLED_BY = req.body.authData.data.UserData[0].USER_ID
        var status = ''
        var ORDER_STATUS = ''
        if (data.REFUND_STATUS == "A") {
            status = 'accepted'
            ORDER_STATUS = 'OC'
        } else {
            status = 'rejected'
            ORDER_STATUS = orderStatus1
        }
        const connection = mm.openConnection();
        PAYMENT_MODE === 'COD' && data.REFUND_STATUS == "A" ? data.PAYMENT_REFUND_STATUS = 'RF' : data.PAYMENT_REFUND_STATUS = "P"
        mm.executeDML(`UPDATE ` + shopOrderCancellationTransactions + ` SET REFUND_STATUS = ?,CREATED_MODIFIED_DATE = ?,REMARK = ?,PAYMENT_REFUND_STATUS = ? where ID = ? `, [data.REFUND_STATUS, systemDate, data.REMARK, data.PAYMENT_REFUND_STATUS, ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to update shopOrderCancellationTransactions information."
                });
            }
            else {
                if (data.REFUND_STATUS == 'R') {
                    mm.executeDML(`UPDATE shop_order_master SET CANCELLATION_REMARK = ?  where ID = ? `, [data.REMARK, ORDER_ID], supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection)
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update shopOrderCancellationTransactions information."
                            });
                        }
                        else {
                            const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has marked the order cancellation request as ${status} due to ${data.REMARK}`;
                            const logData = { ORDER_ID: ORDER_ID, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Order cancel request rejected', TOTAL_AMOUNT: 0, ORDER_NUMBER: data.ORDER_NUMBER, PAYMENT_MODE: PAYMENT_MODE, PAYMENT_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                            dbm.saveLog(logData, shopOrderActionLog);
                            // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                            mm.commitConnection(connection);
                            res.status(200).json({
                                "code": 200,
                                "message": "CancleOrderReason information updated successfully...",
                            });
                        }
                    })
                } else {
                    mm.executeDML(`UPDATE shop_order_master SET ORDER_STATUS_ID = ?  where ID = ? `, [8, ORDER_ID], supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection)
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update shopOrderCancellationTransactions information."
                            });
                        }
                        else {
                            mm.executeDML(`SELECT * FROM shop_order_details WHERE ORDER_ID=?`, [ORDER_ID], supportKey, connection, (error, results1) => {
                                if (error) {
                                    mm.rollbackConnection(connection)
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update shopOrderCancellationTransactions information."
                                    });
                                }
                                else {
                                    mm.executeDML(`SELECT * FROM pickup_location WHERE ORDER_ID=?`, [ORDER_ID], supportKey, connection, (error, results2) => {
                                        if (error) {
                                            mm.rollbackConnection(connection)
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update shopOrderCancellationTransactions information."
                                            });
                                        }
                                        else {
                                            // let updateStockQueries = '';
                                            // let updateInventoryQueries = '';
                                            // let updateStockValues = [];
                                            // let updateInventoryValues = [];
                                            // results1.forEach(({ INVENTORY_ID, QUANTITY }) => {
                                            //     updateStockQueries += `UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK = CURRENT_STOCK + ? WHERE WAREHOUSE_ID = ? AND ITEM_ID = ?;`;

                                            //     updateInventoryQueries += `UPDATE inventory_master SET CURRENT_STOCK = CURRENT_STOCK + ? WHERE ID=?;`;
                                            //     updateStockValues.push(QUANTITY, results2[0].WAREHOUSE_ID, INVENTORY_ID);
                                            //     updateInventoryValues.push(QUANTITY, INVENTORY_ID);
                                            // });
                                            // mm.executeDML(updateStockQueries, updateStockValues, supportKey, connection, (error, results) => {
                                            //     if (error) {
                                            //         mm.rollbackConnection(connection)
                                            //         logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            //         console.log(error);
                                            //         res.send({
                                            //             "code": 400,
                                            //             "message": "Failed to update shopOrderCancellationTransactions information."
                                            //         });
                                            //     }
                                            //     else {
                                            // mm.executeDML(updateInventoryQueries,updateInventoryValues, supportKey, connection, (error, results) => {
                                            //     if (error) {
                                            //         mm.rollbackConnection(connection)
                                            //         logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            //         console.log(error);
                                            //         res.send({
                                            //             "code": 400,
                                            //             "message": "Failed to update shopOrderCancellationTransactions information."
                                            //         });
                                            //     }
                                            //     else {
                                            if (data.PAYMENT_REFUND_STATUS === 'RF') {
                                                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request.`;
                                                const logData = { ORDER_ID: ORDER_ID, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request ' + status, TOTAL_AMOUNT: "", ORDER_NUMBER: "", PAYMENT_MODE: PAYMENT_MODE, PAYMENT_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                                                dbm.saveLog(logData, shopOrderActionLog);
                                                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "O", req.body);
                                                mm.commitConnection(connection);
                                                res.status(200).json({
                                                    "code": 200,
                                                    "message": "CancleOrderReason information updated successfully...",
                                                });
                                            } else {
                                                const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your order cancellation request.`;
                                                const logData = {
                                                    ORDER_ID: ORDER_ID,
                                                    CUSTOMER_ID: CUSTOMER_ID,
                                                    DATE_TIME: systemDate,
                                                    LOG_TYPE: 'order',
                                                    ACTION_LOG_TYPE: 'user',
                                                    ACTION_DETAILS: ACTION_DETAILS,
                                                    CLIENT_ID: 1,
                                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                    ORDER_DATE_TIME: null,
                                                    CART_ID: 0,
                                                    EXPECTED_DATE_TIME: null,
                                                    ORDER_MEDIUM: "",
                                                    ORDER_STATUS: 'Cancellation request ' + status,
                                                    TOTAL_AMOUNT: 0,
                                                    ORDER_NUMBER: "",
                                                    PAYMENT_MODE: PAYMENT_MODE,
                                                    PAYMENT_STATUS: "",
                                                    USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                    EXPECTED_PREAPARATION_DATETIME: null,
                                                    EXPECTED_PACKAGING_DATETIME: null,
                                                    EXPECTED_DISPATCH_DATETIME: null,
                                                    ACTUAL_PREAPARATION_DATETIME: null,
                                                    ACTUAL_PACKAGING_DATETIME: null,
                                                    ACTUAL_DISPATCH_DATETIME: null
                                                }
                                                dbm.saveLog(logData, shopOrderActionLog);
                                                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Cancellation request ${status}**`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Cancellation request ${status}`, ACTION_DETAILS, "", "O", supportKey, "N", "S", req.body);
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
                    });
                    // }
                    // });
                    //                 }
                    //             });
                    //         }
                    //     }
                }
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

            var Query = `SELECT COUNT(CASE WHEN REFUND_STATUS = 'P' THEN 1 END) AS PENDING,COUNT(CASE WHEN REFUND_STATUS = 'A' THEN 1 END) AS APPROVED,COUNT(CASE WHEN REFUND_STATUS = 'R' THEN 1 END) AS REJECTED FROM shop_order_cancellation_transactions where 1 `;
            mm.executeQuery(Query + criteria, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get shopOrderCancellationTransactions information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "TAB_ID": 196,
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
            mm.executeDML(`UPDATE ` + shopOrderCancellationTransactions + ` SET PAYMENT_REFUND_STATUS = ?,REFUNDED_DATE = ? where ID = ? `, ["RF", systemDate, ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update shopOrderCancellationTransactions information."
                    });
                }
                else {
                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has processed refund for your order cancellation request.`;
                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Cancellation request refunded', PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    const logData2 = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'user', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: 'Order canceled successfully', PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    const logaaray = [logData, logData2]
                    dbm.saveLog(logaaray, shopOrderActionLog);
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