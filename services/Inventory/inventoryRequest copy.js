const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryRequest = "inventory_request_master";
var viewInventoryRequest = "view_" + inventoryRequest;
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const crypto = require('crypto');


function reqData(req) {

    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        QUANTITY: req.body.QUANTITY,
        RATE: req.body.RATE ? req.body.RATE : 0,
        TAX_RATE: req.body.TAX_RATE ? req.body.TAX_RATE : 0,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        REQUESTED_DATE_TIME: req.body.REQUESTED_DATE_TIME,
        STATUS: req.body.STATUS ? '1' : '0',
        REMARK: req.body.REMARK,
        INVENTORY_ID: req.body.INVENTORY_ID,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('RATE').isDecimal().optional(),
        body('TAX_RATE').isDecimal().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('REQUESTED_DATE_TIME').optional(),
        body('STATUS').optional(),
        body('REMARK').optional(),
        body('INVENTORY_ID').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get inventoryRequest count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryRequest + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get inventoryRequest information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "TAB_ID": 200,
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

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    data.STATUS = "AP"
    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + viewInventoryRequest + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventoryRequest information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "InventoryRequest information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
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
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + inventoryRequest + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update inventoryRequest information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "inventoryRequest information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}

exports.updateRequestStatusORG = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    const inventoryIDs = req.body.INVENTORY_IDS
    const IDS = req.body.IDS

    console.log("\nYYYYYYYY");
    console.log("\nREQUEST BODY,", req.body);
    console.log("\nYYYYYYYY");

    var { TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, STATUS, ORDER_ID, TECHNICIAN_NAME, JOB_CARD_NO, REQUEST_MASTER_ID } = req.body;

    var systemDate = mm.getSystemDate();
    if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || !req.body.INVENTORY_IDS) {
        console.log("Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, ID, CUSTOMER_ID, ids");

        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, ID, CUSTOMER_ID, ids`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        let setData = "";
        let recordData = [];
        let STATUSZ = "";

        if (STATUS === "A") {
            setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
            recordData.push("AC", systemDate);
            STATUSZ = "AC";
        } else if (STATUS === "R") {
            setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
            recordData.push("R", systemDate);
            STATUSZ = "R";
        } else if (STATUS === "AP") {
            setData += "STATUS = ?, ";
            recordData.push("AP");
            STATUSZ = "AP";
        } else {
            return res.send({
                code: 400,
                message: "Invalid STATUS value."
            });
        }

        var loggarry = []
        const connection = mm.openConnection();
        console.log("\n\n\n\n in update8888888");


        mm.executeDML('SELECT * FROM view_job_card WHERE ID = ?', [JOB_CARD_ID], supportKey, connection, (error, resultsGetJobs) => {
            if (error) {
                mm.rollbackConnection(connection);
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({
                    "code": 400,
                    "message": "Failed to save inventoryRequestMaster information."
                });
            } else {
                mm.executeDML(`UPDATE job_card SET INVENTORY_REQUESTED = 1 WHERE 1 AND TECHNICIAN_ID = ? AND CUSTOMER_ID = ? AND ID = ?`, [TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID], supportKey, connection, (error, resultsjOB) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                    } else {
                        let transactionData = [];
                        if (IDS.length > 0) {
                            let ACTION_LOG = `${req.body.authData.data.UserData[0].USER_NAME} has approved the inventory part request for job ${JOB_CARD_NO}.`;
                            async.eachSeries(IDS, (ids, callback) => {
                                console.log("\n\n\n\n in async");

                                mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?;`, [STATUSZ, ids, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        callback(error);
                                    } else {
                                        mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, JOB_CARD_ID, supportKey, connection, (error, resultsJob) => {
                                            if (error) {
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                console.log(error);
                                                callback(error);
                                            } else {
                                                mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, resultsJob[0].ORDER_ID, supportKey, connection, (error, resultsOrderS) => {
                                                    if (error) {
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        console.log(error);
                                                        callback(error);
                                                    } else {
                                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
                                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        loggarry.push(logData)
                                                        if (STATUS == 'A' || STATUS == 'AP') {
                                                            mm.executeDML(`SELECT * FROM inventory_request_details WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [ids, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                                                if (error) {
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    console.log(error);
                                                                    callback(error);
                                                                }
                                                                else {
                                                                    mm.executeDML(`UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK=CURRENT_STOCK-? WHERE ITEM_ID=? AND WAREHOUSE_ID=?`, [results[0].QUANTITY, results[0].INVENTORY_ID, results[0].WAREHOUSE_ID], supportKey, connection, (error, resultsupdate) => {
                                                                        if (error) {
                                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                            console.log(error);
                                                                            callback(error);
                                                                        }
                                                                        else {
                                                                            transactionData = [[JOB_CARD_NO, mm.getSystemDate(), "D", results[0].INVENTORY_TRACKING_TYPE, 0, TECHNICIAN_ID, 0, 0, 0, 0, "J", results[0].BATCH_NO, results[0].SERIAL_NO, results[0].INVENTORY_ID, 0, results[0].QUANTITY, ACTION_LOG, 1, results[0].ACTUAL_UNIT_ID, results[0].ACTUAL_UNIT_NAME, results[0].IS_VARIANT, results[0].PARENT_ID, results[0].QUANTITY_PER_UNIT],
                                                                            [JOB_CARD_NO, mm.getSystemDate(), "C", results[0].INVENTORY_TRACKING_TYPE, 0, 0, 0, 0, 0, JOB_CARD_ID, "J", results[0].BATCH_NO, results[0].SERIAL_NO, results[0].INVENTORY_ID, results[0].QUANTITY, 0, ACTION_LOG, 1, results[0].ACTUAL_UNIT_ID, results[0].ACTUAL_UNIT_NAME, results[0].IS_VARIANT, results[0].PARENT_ID, results[0].QUANTITY_PER_UNIT]]
                                                                            mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,JOB_CARD_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [transactionData], supportKey, connection, (error, transactions) => {
                                                                                if (error) {
                                                                                    console.log(` Error adding transaction logs`, error);
                                                                                    callback(error);
                                                                                }
                                                                                else {
                                                                                    callback();
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            callback();
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            },
                                (err) => {
                                    if (err) {
                                        mm.rollbackConnection(connection);
                                        console.log(err);
                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                    } else {
                                        mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ? AND STATUS = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID, "AC"], supportKey, connection, (error, resultsGet) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                return res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to save inventoryRequestMaster information."
                                                });
                                            } else {
                                                if (resultsGet.length > 0) {
                                                    var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                    mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "I", "J", resultsGetJobs);
                                                    dbm.saveLog(loggarry, technicianActionLog);
                                                    mm.commitConnection(connection);
                                                    res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                } else {
                                                    mm.executeDML(`UPDATE inventory_request_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE 1  AND TECHNICIAN_ID=${TECHNICIAN_ID} AND CUSTOMER_ID=${CUSTOMER_ID} AND JOB_CARD_ID=${JOB_CARD_ID} AND ID = ${REQUEST_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            console.log(error);
                                                            res.status(400).json({
                                                                "code": 400,
                                                                "message": "Failed to update inventoryRequestDetails information."
                                                            })
                                                        } else {
                                                            var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                            mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                            mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
                                                            dbm.saveLog(loggarry, technicianActionLog);
                                                            mm.commitConnection(connection);
                                                            res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                        } else {
                            mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsGet) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    return res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save inventoryRequestMaster information."
                                    });
                                } else {
                                    if (resultsGet.length > 0) {
                                        var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                        mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE INVENTORY_ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [STATUSZ, 0, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(err);
                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                            } else {
                                                mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, JOB_CARD_ID, supportKey, connection, (error, resultsJob) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        console.log(err);
                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                    } else {
                                                        mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, resultsJob[0].ORDER_ID, supportKey, connection, (error, resultsOrderS) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                console.log(err);
                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                                return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                            } else {
                                                                var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
                                                                const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
                                                                mm.sendNotificationToAdmin(8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                                mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
                                                                dbm.saveLog(logData, technicianActionLog);
                                                                mm.commitConnection(connection);
                                                                res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        mm.executeDML(`UPDATE inventory_request_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE 1  AND TECHNICIAN_ID=${TECHNICIAN_ID} AND CUSTOMER_ID=${CUSTOMER_ID} AND JOB_CARD_ID=${JOB_CARD_ID} AND ID = ${REQUEST_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                console.log(error);
                                                res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to update inventoryRequestDetails information."
                                                })
                                            } else {
                                                mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE INVENTORY_ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [STATUSZ, 0, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        console.log(err);
                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                    } else {
                                                        mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, JOB_CARD_ID, supportKey, connection, (error, resultsJob) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                console.log(err);
                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                                return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                            } else {
                                                                mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, resultsJob[0].ORDER_ID, supportKey, connection, (error, resultsOrderS) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection);
                                                                        console.log(err);
                                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                                    } else {
                                                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                        var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                                        mm.sendNotificationToAdmin(8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
                                                                        dbm.saveLog(logData, technicianActionLog);
                                                                        mm.commitConnection(connection);
                                                                        res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Internal Server Error."
        });
    }
};


exports.addInventory = (req, res) => {
    var INVENTORY_DATA = req.body.INVENTORY_DATA;
    var { ID,TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, STATUS, ORDER_ID, TECHNICIAN_NAME, CLIENT_ID, JOB_CARD_NO, REMARK, TECHNICIAN_NAME, CUSTOMER_NAME, EMAIL_LIST } = req.body;
    var systemDate = mm.getSystemDate();

    var REQUESTED_DATE_TIME = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    if (!Array.isArray(INVENTORY_DATA) || INVENTORY_DATA.length === 0) {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid or empty INVENTORY_DATA array."
        });
    }

    try {
        const connection = mm.openConnection();
        var ACTION_DETAILS = ` ${TECHNICIAN_NAME} has added the inventory request for job ${req.body.JOB_CARD_NO} .`;
        var TOTAL_RATE = INVENTORY_DATA.reduce((sum, item) => sum + (item.RATE * item.QUANTITY), 0);
        var TOTAL_TAX_RATE = INVENTORY_DATA.reduce((sum, item) => sum + (item.TAX_RATE * item.QUANTITY), 0);
        mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsGet) => {
            if (error) {
                mm.rollbackConnection(connection);
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({
                    "code": 400,
                    "message": "Failed to save inventoryRequestMaster information."
                });
            } else {
                mm.executeDML('SELECT * FROM view_order_details WHERE JOB_CARD_ID = ?', [JOB_CARD_ID], supportKey, connection, (error, resultsGetOrder) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            "code": 400,
                            "message": "Failed to save inventoryRequestMaster information."
                        });
                    } else {
                        if (resultsGet.length > 0) {
                            mm.executeDML('UPDATE inventory_request_master  SET TOTAL_RATE = TOTAL_RATE + ?, TOTAL_TAX_RATE = TOTAL_TAX_RATE + ? WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [TOTAL_RATE, TOTAL_TAX_RATE, JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsUpdate) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    return res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save inventoryRequestMaster information."
                                    });
                                } else {
                                    var details = INVENTORY_DATA.map(item => [
                                        resultsGet[0].ID, JOB_CARD_ID, item.INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID,
                                        item.QUANTITY, item.RATE, item.TAX_RATE,
                                        REQUESTED_DATE_TIME, 'P', ACTION_DETAILS, 1, item.WAREHOUSE_ID, item.ACTUAL_UNIT_NAME, item.ACTUAL_UNIT_ID, item.SERIAL_NO, item.BATCH_NO, item.INVENTORY_NAME, item.INVENTORY_TRACKING_TYPE, item.IS_VARIANT, item.PARENT_ID, item.QUANTITY_PER_UNIT, item.TECHNICIAN_MOVEMENT_ID]);
                                    mm.executeDML('INSERT INTO inventory_request_details (REQUEST_MASTER_ID,JOB_CARD_ID, INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID, QUANTITY, RATE, TAX_RATE, REQUESTED_DATE_TIME, STATUS, REMARK, CLIENT_ID,WAREHOUSE_ID,ACTUAL_UNIT_NAME,ACTUAL_UNIT_ID,SERIAL_NO,BATCH_NO,INVENTORY_NAME,INVENTORY_TRACKING_TYPE,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT,TECHNICIAN_MOVEMENT_ID) VALUES ?', [details], supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            return res.status(400).json({
                                                "code": 400,
                                                "message": "Failed to save inventoryRequestDetails information."
                                            });
                                        }

                                        var logData = {
                                            TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                                            LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS,
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME,
                                            ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null,
                                            ORDER_MEDIUM: null, ORDER_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                            PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "",
                                            TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "",
                                            JOB_CARD_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                            ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            DATE_TIME: systemDate, supportKey: 0
                                        };
                                        // Inside the success callback after inserting inventory_request_details
                                        var INVENTORY_IDS = INVENTORY_DATA.map(item => item.INVENTORY_ID);
                                        if (EMAIL_LIST) {
                                            sendRequestEmail("E", EMAIL_LIST, CUSTOMER_NAME, JOB_CARD_NO, INVENTORY_DATA, TECHNICIAN_NAME, TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, resultsGet[0].ID, INVENTORY_IDS);
                                        } else {
                                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Inventory request for job ${JOB_CARD_NO}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "IR", "I", resultsGetOrder);
                                            mm.sendNotificationToAdmin(8, `Inventory request for job ${JOB_CARD_NO} by ${TECHNICIAN_NAME}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}.`, "", "J", "IR", supportKey, "I", req.body);
                                        }
                                        dbm.saveLog(logData, technicianActionLog);
                                        mm.commitConnection(connection);
                                        return res.status(200).json({
                                            "code": 200,
                                            "message": "InventoryRequestDetails information saved successfully."
                                        });
                                    });
                                }
                            });

                        } else {
                            mm.executeDML('INSERT INTO inventory_request_master (JOB_CARD_ID, TECHNICIAN_ID, CUSTOMER_ID, TOTAL_RATE, TOTAL_TAX_RATE, REQUESTED_DATE_TIME, STATUS, REMARK, CLIENT_ID,PAYMENT_STATUS,TOTAL_ITEMS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
                                [JOB_CARD_ID, TECHNICIAN_ID, CUSTOMER_ID, TOTAL_RATE, TOTAL_TAX_RATE, REQUESTED_DATE_TIME, "P", REMARK, CLIENT_ID, "I", INVENTORY_DATA.length],
                                supportKey, connection,
                                (error, resultsMaster) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        return res.status(400).json({
                                            "code": 400,
                                            "message": "Failed to save inventoryRequestMaster information."
                                        });
                                    } else {

                                        var details = INVENTORY_DATA.map(item => [
                                            resultsMaster.insertId, JOB_CARD_ID, item.INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID,
                                            item.QUANTITY, item.RATE, item.TAX_RATE,
                                            REQUESTED_DATE_TIME, 'P', ACTION_DETAILS, 1, item.WAREHOUSE_ID, item.ACTUAL_UNIT_NAME, item.ACTUAL_UNIT_ID, item.SERIAL_NO, item.BATCH_NO, item.INVENTORY_NAME, item.INVENTORY_TRACKING_TYPE, item.IS_VARIANT, item.PARENT_ID, item.QUANTITY_PER_UNIT]);
                                        mm.executeDML('INSERT INTO inventory_request_details (REQUEST_MASTER_ID,JOB_CARD_ID, INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID, QUANTITY, RATE, TAX_RATE, REQUESTED_DATE_TIME, STATUS, REMARK, CLIENT_ID,WAREHOUSE_ID,ACTUAL_UNIT_NAME,ACTUAL_UNIT_ID,SERIAL_NO,BATCH_NO,INVENTORY_NAME,INVENTORY_TRACKING_TYPE,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [details], supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                return res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to save inventoryRequestDetails information."
                                                });
                                            }

                                            var logData = {
                                                TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                                                LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS,
                                                USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME,
                                                ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null,
                                                ORDER_MEDIUM: null, ORDER_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                                PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "",
                                                TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "",
                                                JOB_CARD_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                                ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                DATE_TIME: systemDate, supportKey: 0
                                            };
                                            var INVENTORY_IDS = INVENTORY_DATA.map(item => item.INVENTORY_ID);
                                            if (EMAIL_LIST) {
                                                sendRequestEmail("E", EMAIL_LIST, CUSTOMER_NAME, JOB_CARD_NO, INVENTORY_DATA, TECHNICIAN_NAME, TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, resultsMaster.insertId, INVENTORY_IDS);
                                            } else {
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Inventory request for job ${JOB_CARD_NO}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "IR", "I", resultsGetOrder);
                                                mm.sendNotificationToAdmin(8, `Inventory request for job ${JOB_CARD_NO} by ${TECHNICIAN_NAME}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}.`, "I", "IR", supportKey, "I", req.body);
                                            }
                                            dbm.saveLog(logData, technicianActionLog);
                                            mm.commitConnection(connection);
                                            return res.status(200).json({
                                                "code": 200,
                                                "message": "InventoryRequestDetails information saved successfully."
                                            });
                                        }
                                        );
                                    }
                                }
                            );
                        }
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


//NEWLY CREATED FOR EMAIL SEND 
// exports.updateRequestStatusOLD = async (req, res) => {
//     const errors = validationResult(req);
//     var supportKey = req.headers['supportkey'];

//     // Parse INVENTORY_IDS and IDS from string to array
//     let inventoryIDs;
//     try {
//         inventoryIDs = JSON.parse(req.body.INVENTORY_IDS);
//     } catch (e) {
//         console.error("Error parsing INVENTORY_IDS:", e);
//         return res.status(400).send({
//             code: 400,
//             message: "Invalid INVENTORY_IDS format. Expected a JSON array string."
//         });
//     }

//     let IDS;
//     try {
//         IDS = JSON.parse(req.body.IDS);
//     } catch (e) {
//         console.error("Error parsing IDS:", e);
//         return res.status(400).send({
//             code: 400,
//             message: "Invalid IDS format. Expected a JSON array string."
//         });
//     }

//     const ACTION_TAKEN_FROM_MAIL = req.body.ACTION_TAKEN_FROM_MAIL === '1';

//     console.log("\nREQUEST BODY:", req.body);

//     var { TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, STATUS, ORDER_ID, TECHNICIAN_NAME, JOB_CARD_NO, REQUEST_MASTER_ID } = req.body;

//     // Static HTML responses (rest of your HTML remains the same)
//     // Static HTML responses

//     const alreadyApprovedHTML = `
//         <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8">
// <title>Request Already Approved</title>
// <style>
//     body {
//       margin: 0;
//       font-family: Arial, sans-serif;
//       background: #f4f6f9;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       height: 100vh;
//     }

//     .card {
//       background: #fff;
//       padding: 30px 20px;
//       border-radius: 12px;
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//       max-width: 400px;
//       text-align: center;
//     }

//     .card img {
//       width: 80px;
//       margin-bottom: 20px;
//     }

//     .card h2 {
//       color: #28a745;
//       margin-bottom: 10px;
//     }

//     .card p {
//       color: #555;
//       font-size: 14px;
//       margin-bottom: 20px;
//     }

//     .back-btn {
//       background: #007bff;
//       color: #fff;
//       padding: 10px 18px;
//       border: none;
//       border-radius: 6px;
//       cursor: pointer;
//     }

//     .back-btn:hover {
//       background: #0056b3;
//     }
// </style>
// </head>
// <body>

//   <div class="card">
// <span style="font-size: 40px;">✅</span>
// <h2>Already Approved</h2>
// <p>This request has already been approved.</p>
// <p>No further action is required.</p>
// </div>

// </body>
// </html>`;
//     const alreadyRejectedHTML = `
//         <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8">
// <title>Request Rejected</title>
// <style>
//     body {
//       margin: 0;
//       font-family: Arial, sans-serif;
//       background: #fef2f2;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       height: 100vh;
//     }

//     .card {
//       background: #fff;
//       padding: 30px 20px;
//       border-radius: 12px;
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//       max-width: 400px;
//       text-align: center;
//     }

//     .card img {
//       width: 80px;
//       margin-bottom: 20px;
//     }

//     .card h2 {
//       color: #dc3545;
//       margin-bottom: 10px;
//     }

//     .card p {
//       color: #555;
//       font-size: 14px;
//       margin-bottom: 20px;
//     }

//     .back-btn {
//       background: #6c757d;
//       color: #fff;
//       padding: 10px 18px;
//       border: none;
//       border-radius: 6px;
//       cursor: pointer;
//     }

//     .back-btn:hover {
//       background: #5a6268;
//     }
// </style>
// </head>
// <body>

//   <div class="card">
// <span style="font-size: 40px;">❌</span>
// <h2>Request Rejected</h2>
// <p>This request was already rejected.</p>
// <p>You don’t need to take any action.</p>
// </div>

// </body>
// </html>`;

//     const missingFields = `
//         <!DOCTYPE html>
// <html lang="en">
// <head>
// <meta charset="UTF-8">
// <title>Request Cannot Be Processed</title>
// <style>
//     body {
//       margin: 0;
//       font-family: Arial, sans-serif;
//       background: #fff8f0;
//       display: flex;
//       align-items: center;
//       justify-content: center;
//       height: 100vh;
//     }

//     .card {
//       background: #fff;
//       padding: 30px 20px;
//       border-radius: 12px;
//       box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//       max-width: 420px;
//       text-align: center;
//     }

//     .card img {
//       width: 80px;
//       margin-bottom: 20px;
//     }

//     .card h2 {
//       color: #ff6b35;
//       margin-bottom: 10px;
//     }

//     .card p {
//       color: #444;
//       font-size: 14px;
//       margin-bottom: 12px;
//     }

//     .back-btn {
//       background: #007bff;
//       color: #fff;
//       padding: 10px 18px;
//       border: none;
//       border-radius: 6px;
//       cursor: pointer;
//     }

//     .back-btn:hover {
//       background: #0056b3;
//     }
// </style>
// </head>
// <body>

//   <div class="card">
// <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
// <h2>Action Not Allowed</h2>
// <strong>No further action is required.</strong></p>
// </div>

// </body>
// </html>`;


//     // Validation checks
//     if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || IDS.length === 0 || !inventoryIDs || inventoryIDs.length === 0) {
//         if (ACTION_TAKEN_FROM_MAIL) {
//             res.setHeader('Content-Type', 'text/html');
//             return res.send(alreadyRejectedHTML);
//         } else {
//             console.log("Required fields are missing or arrays are empty");
//             return res.send({
//                 code: 300,
//                 message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, CUSTOMER_ID, IDS, INVENTORY_IDS`
//             });
//         }
//     }

//     if (!errors.isEmpty()) {
//         console.log(errors);
//         return res.send({
//             code: 422,
//             message: errors.errors
//         });
//     }

//     try {
//         // Check if request is coming from email and already processed
//         if (ACTION_TAKEN_FROM_MAIL) {
//             try {
//                 // Check if there are any pending detail records for this request
//                 const pendingDetails = await new Promise((resolve, reject) => {
//                     mm.executeQueryData(
//                         `SELECT COUNT(*) as pending_count 
//                  FROM inventory_request_details 
//                  WHERE REQUEST_MASTER_ID = ? 
//                  AND STATUS NOT IN ('AC', 'AP', 'R')`,
//                         [REQUEST_MASTER_ID],
//                         supportKey,
//                         (error, results) => {
//                             if (error) reject(error);
//                             else resolve(results);
//                         }
//                     );
//                 });

//                 // If no pending details, check the status of any existing details to show appropriate message
//                 if (pendingDetails[0].pending_count === 0) {
//                     const [latestDetail] = await new Promise((resolve, reject) => {
//                         mm.executeQueryData(
//                             `SELECT STATUS 
//                      FROM inventory_request_details 
//                      WHERE REQUEST_MASTER_ID = ? 
//                      ORDER BY CREATED_MODIFIED_DATE DESC LIMIT 1`,
//                             [REQUEST_MASTER_ID],
//                             supportKey,
//                             (error, results) => {
//                                 if (error) reject(error);
//                                 else resolve(results);
//                             }
//                         );
//                     });

//                     if (latestDetail) {
//                         if (latestDetail.STATUS === 'AC' || latestDetail.STATUS === 'AP') {
//                             res.setHeader('Content-Type', 'text/html');
//                             return res.send(alreadyApprovedHTML);
//                         } else if (latestDetail.STATUS === 'R') {
//                             res.setHeader('Content-Type', 'text/html');
//                             return res.send(alreadyRejectedHTML);
//                         }
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error checking request status:", error);
//                 // Continue with normal processing if there's an error checking status
//             }
//         }

//         let systemDate = mm.getSystemDate();
//         let setData = "";
//         let recordData = [];
//         let STATUSZ = "";

//         if (STATUS === "A") {
//             setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
//             recordData.push("AC", systemDate);
//             STATUSZ = "AC";
//         } else if (STATUS === "R") {
//             setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
//             recordData.push("R", systemDate);
//             STATUSZ = "R";
//         } else if (STATUS === "AP") {
//             setData += "STATUS = ?, ";
//             recordData.push("AP");
//             STATUSZ = "AP";
//         } else {
//             return res.send({
//                 code: 400,
//                 message: "Invalid STATUS value."
//             });
//         }

//         var loggarry = [];
//         const connection = mm.openConnection();

//         mm.executeDML('SELECT * FROM view_job_card WHERE ID = ?', [JOB_CARD_ID], supportKey, connection, (error, resultsGetJobs) => {
//             if (error) {
//                 mm.rollbackConnection(connection);
//                 console.log(error);
//                 logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                 return res.status(400).json({
//                     "code": 400,
//                     "message": "Failed to save inventoryRequestMaster information."
//                 });
//             } else {
//                 mm.executeDML(`UPDATE job_card SET INVENTORY_REQUESTED = 1 WHERE 1 AND TECHNICIAN_ID = ? AND CUSTOMER_ID = ? AND ID = ?`, [TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID], supportKey, connection, (error, resultsjOB) => {
//                     if (error) {
//                         mm.rollbackConnection(connection);
//                         logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                         console.log(error);
//                     } else {
//                         let transactionData = [];
//                         if (IDS.length > 0) { // IDS is now an array
//                             let ACTION_LOG = `${resultsGetJobs[0].CUSTOMER_NAME} has approved the inventory part request for job ${JOB_CARD_NO}.`;
//                             async.eachSeries(IDS, (id, callback) => { // Renamed 'ids' to 'id' for clarity
//                                 console.log("\n\n\n\n in async");

//                                 // Use 'id' directly here, as it's a number from the parsed array
//                                 mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?;`, [STATUSZ, id, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
//                                     if (error) {
//                                         logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                         console.log(error);
//                                         callback(error);
//                                     } else {
//                                         mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, [JOB_CARD_ID], supportKey, connection, (error, resultsJob) => {
//                                             if (error) {
//                                                 logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                 console.log(error);
//                                                 callback(error);
//                                             } else {
//                                                 mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, [resultsJob[0].ORDER_ID], supportKey, connection, (error, resultsOrderS) => {
//                                                     if (error) {
//                                                         logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                         console.log(error);
//                                                         callback(error);
//                                                     } else {
//                                                         var ACTION_DETAILS = ` ${resultsGetJobs[0].CUSTOMER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
//                                                         const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: resultsGetJobs[0].CUSTOMER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: resultsGetJobs[0].CUSTOMER_NAME, DATE_TIME: systemDate, supportKey: 0 }
//                                                         loggarry.push(logData);

//                                                         if (STATUS == 'A' || STATUS == 'AP') {
//                                                             mm.executeDML(`SELECT * FROM inventory_request_details WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [id, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
//                                                                 if (error) {
//                                                                     logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                                     console.log(error);
//                                                                     callback(error);
//                                                                 } else {
//                                                                     // Ensure results[0] exists before accessing its properties
//                                                                     if (results && results.length > 0) {
//                                                                         mm.executeDML(`UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK=CURRENT_STOCK-? WHERE ITEM_ID=? AND WAREHOUSE_ID=?`, [results[0].QUANTITY, results[0].INVENTORY_ID, results[0].WAREHOUSE_ID], supportKey, connection, (error, resultsupdate) => {
//                                                                             if (error) {
//                                                                                 logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                                                 console.log(error);
//                                                                                 callback(error);
//                                                                             } else {
//                                                                                 transactionData = [[JOB_CARD_NO, mm.getSystemDate(), "D", results[0].INVENTORY_TRACKING_TYPE, 0, TECHNICIAN_ID, 0, 0, 0, 0, "J", results[0].BATCH_NO, results[0].SERIAL_NO, results[0].INVENTORY_ID, 0, results[0].QUANTITY, ACTION_LOG, 1, results[0].ACTUAL_UNIT_ID, results[0].ACTUAL_UNIT_NAME, results[0].IS_VARIANT, results[0].PARENT_ID, results[0].QUANTITY_PER_UNIT],
//                                                                                 [JOB_CARD_NO, mm.getSystemDate(), "C", results[0].INVENTORY_TRACKING_TYPE, 0, 0, 0, 0, 0, JOB_CARD_ID, "J", results[0].BATCH_NO, results[0].SERIAL_NO, results[0].INVENTORY_ID, results[0].QUANTITY, 0, ACTION_LOG, 1, results[0].ACTUAL_UNIT_ID, results[0].ACTUAL_UNIT_NAME, results[0].IS_VARIANT, results[0].PARENT_ID, results[0].QUANTITY_PER_UNIT]];
//                                                                                 mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,JOB_CARD_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [transactionData], supportKey, connection, (error, transactions) => {
//                                                                                     if (error) {
//                                                                                         console.log(` Error adding transaction logs`, error);
//                                                                                         callback(error);
//                                                                                     } else {
//                                                                                         callback();
//                                                                                     }
//                                                                                 });
//                                                                             }
//                                                                         });
//                                                                     } else {
//                                                                         callback(new Error("Inventory request details not found for ID: " + id));
//                                                                     }
//                                                                 }
//                                                             });
//                                                         } else {
//                                                             callback();
//                                                         }
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     }
//                                 });
//                             },
//                                 (err) => {
//                                     if (err) {
//                                         mm.rollbackConnection(connection);
//                                         console.log(err);
//                                         logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
//                                         return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
//                                     } else {
//                                         mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ? AND STATUS = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID, "AC"], supportKey, connection, (error, resultsGet) => {
//                                             if (error) {
//                                                 mm.rollbackConnection(connection);
//                                                 console.log(error);
//                                                 logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                 return res.status(400).json({
//                                                     "code": 400,
//                                                     "message": "Failed to save inventoryRequestMaster information."
//                                                 });
//                                             } else {
//                                                 if (resultsGet.length > 0) {
//                                                     var ACTION_DETAILSs = ` ${resultsGetJobs[0].CUSTOMER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
//                                                     mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
//                                                     mm.sendNotificationToTechnician(resultsGetJobs[0].CUSTOMER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
//                                                     dbm.saveLog(loggarry, technicianActionLog);
//                                                     mm.commitConnection(connection);
//                                                     res.status(200).send({ code: 200, message: "Inventory request updated." });
//                                                 } else {
//                                                     mm.executeDML(`UPDATE inventory_request_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE 1  AND TECHNICIAN_ID=${TECHNICIAN_ID} AND CUSTOMER_ID=${CUSTOMER_ID} AND JOB_CARD_ID=${JOB_CARD_ID} AND ID = ${REQUEST_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
//                                                         if (error) {
//                                                             mm.rollbackConnection(connection);
//                                                             logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                             console.log(error);
//                                                             res.status(400).json({
//                                                                 "code": 400,
//                                                                 "message": "Failed to update inventoryRequestDetails information."
//                                                             })
//                                                         } else {
//                                                             var ACTION_DETAILSs = ` ${resultsGetJobs[0].CUSTOMER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
//                                                             mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
//                                                             mm.sendNotificationToTechnician(resultsGetJobs[0].CUSTOMER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
//                                                             dbm.saveLog(loggarry, technicianActionLog);
//                                                             mm.commitConnection(connection);
//                                                             res.status(200).send({ code: 200, message: "Inventory request updated." });
//                                                         }
//                                                     })
//                                                 }
//                                             }
//                                         });
//                                     }
//                                 });
//                         } else {
//                             // This part handles the case where IDS is empty initially.
//                             // You might want to review this logic as well based on your requirements.
//                             mm.executeDML('SELECT * FROM view_inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsGet) => {
//                                 if (error) {
//                                     mm.rollbackConnection(connection);
//                                     console.log(error);
//                                     logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                     return res.status(400).json({
//                                         "code": 400,
//                                         "message": "Failed to save inventoryRequestMaster information."
//                                     });
//                                 } else {
//                                     if (resultsGet.length > 0) {
//                                         var ACTION_DETAILSs = ` ${resultsGet[0].CUSTOMER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
//                                         // The original code used INVENTORY_ID=? with 0, which seems incorrect if you intend to update specific inventory items.
//                                         // If INVENTORY_ID is meant to be part of the filter, it should come from the parsed `inventoryIDs` array.
//                                         // Assuming for now it was meant to update all details for the master request if IDS is empty,
//                                         // but it's important to clarify the intent here.
//                                         // For now, I'm keeping your original logic for this branch but highlighting it.
//                                         mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE INVENTORY_ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [STATUSZ, 0, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
//                                             if (error) {
//                                                 mm.rollbackConnection(connection);
//                                                 console.log(error); // Changed 'err' to 'error'
//                                                 logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey); // Changed 'err' to 'error'
//                                                 return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
//                                             } else {
//                                                 mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, [JOB_CARD_ID], supportKey, connection, (error, resultsJob) => { // Added [] for JOB_CARD_ID
//                                                     if (error) {
//                                                         mm.rollbackConnection(connection);
//                                                         console.log(error); // Changed 'err' to 'error'
//                                                         logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey); // Changed 'err' to 'error'
//                                                         return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
//                                                     } else {
//                                                         mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, [resultsJob[0].ORDER_ID], supportKey, connection, (error, resultsOrderS) => { // Added [] for resultsJob[0].ORDER_ID
//                                                             if (error) {
//                                                                 mm.rollbackConnection(connection);
//                                                                 console.log(error); // Changed 'err' to 'error'
//                                                                 logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey); // Changed 'err' to 'error'
//                                                                 return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
//                                                             } else {
//                                                                 var ACTION_DETAILS = ` ${resultsGet[0].CUSTOMER_NAM} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
//                                                                 const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: resultsGetJobs[0].CUSTOMER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: resultsGet[0].CUSTOMER_NAM, DATE_TIME: systemDate, supportKey: 0 };
//                                                                 var ACTION_DETAILSs = ` ${resultsGet[0].CUSTOMER_NAM} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
//                                                                 mm.sendNotificationToAdmin(8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
//                                                                 mm.sendNotificationToTechnician(resultsGet[0].CUSTOMER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
//                                                                 dbm.saveLog(logData, technicianActionLog);
//                                                                 mm.commitConnection(connection);
//                                                                 res.status(200).send({ code: 200, message: "Inventory request updated." });
//                                                             }
//                                                         });
//                                                     }
//                                                 });
//                                             }
//                                         });
//                                     } else {
//                                         mm.executeDML(`UPDATE inventory_request_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE 1  AND TECHNICIAN_ID=${TECHNICIAN_ID} AND CUSTOMER_ID=${CUSTOMER_ID} AND JOB_CARD_ID=${JOB_CARD_ID} AND ID = ${REQUEST_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
//                                             if (error) {
//                                                 mm.rollbackConnection(connection);
//                                                 logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
//                                                 console.log(error);
//                                                 res.status(400).json({
//                                                     "code": 400,
//                                                     "message": "Failed to update inventoryRequestDetails information."
//                                                 })
//                                             } else {
//                                                 // This block appears to be missing an update to inventory_request_details if IDS is empty.
//                                                 // It currently only updates inventory_request_master.
//                                                 // If the intent is to update all details related to the master request, you might need a different query here.
//                                                 var ACTION_DETAILSs = ` ${resultsGetJobs[0].CUSTOMER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
//                                                 mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
//                                                 mm.sendNotificationToTechnician(resultsGetJobs[0].CUSTOMER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
//                                                 dbm.saveLog(loggarry, technicianActionLog); // Note: loggarry might be empty if IDS was empty
//                                                 mm.commitConnection(connection);
//                                                 res.status(200).send({ code: 200, message: "Inventory request updated." });
//                                             }
//                                         });
//                                     }
//                                 }
//                             });
//                         }
//                     }
//                 });
//             }
//         });
//     } catch (error) {
//         console.error("Caught an unexpected error:", error);
//         if (connection) {
//             mm.rollbackConnection(connection);
//         }
//         res.status(500).send({ code: 500, message: "An unexpected error occurred." });
//     }
// };



// async function sendRequestEmailOLD(TYPE, EMAIL_LIST, CUSTOMER_NAME, JOB_CARD_NO, INVENTORY_DATA = [],
//     TECHNICIAN_NAME = '', TECHNICIAN_ID = '', JOB_CARD_ID = '', CUSTOMER_ID = '',
//     REQUEST_MASTER_ID = '', INVENTORY_IDS = []) {

//     // If IDS is empty, fetch them from database using REQUEST_MASTER_ID
//     // if ((!IDS || IDS.length === 0) && REQUEST_MASTER_ID) {
//     try {
//         const detailsResults = await new Promise((resolve, reject) => {
//             mm.executeQueryData('SELECT ID FROM inventory_request_details WHERE REQUEST_MASTER_ID = ?',
//                 [REQUEST_MASTER_ID], "supportKey", (error, results) => {
//                     if (error) {
//                         reject(error);
//                     } else {
//                         resolve(results);
//                     }
//                 });
//         });

//         if (detailsResults && detailsResults.length > 0) {
//             IDS = detailsResults.map(item => item.ID);
//         }
//     } catch (error) {
//         console.error("Error fetching inventory detail IDs:", error);
//         // Continue with empty IDS if there was an error
//     }
//     // }

//     // Ensure INVENTORY_IDS and IDS are properly formatted arrays
//     // Handle case where they might come as stringified JSON
//     if (typeof INVENTORY_IDS === 'string') {
//         try {
//             INVENTORY_IDS = JSON.parse(INVENTORY_IDS);
//         } catch (e) {
//             INVENTORY_IDS = [];
//         }
//     }

//     if (typeof IDS === 'string') {
//         try {
//             IDS = JSON.parse(IDS);
//         } catch (e) {
//             IDS = [];
//         }
//     }

//     // Generate HTML for inventory list
//     let partsHTML = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-size: 14px;">';
//     partsHTML += `
//         <thead style="background-color: #f2f2f2;">
//             <tr>
//                 <th>Part Name</th>
//                 <th>Rate (₹)</th>
//                 <th>Quantity</th>
//                 <th>Amount (₹)</th>
//             </tr>
//         </thead>
//         <tbody>
//     `;

//     let totalAmount = 0;
//     INVENTORY_DATA.forEach(item => {
//         let amount = item.RATE * item.QUANTITY;
//         totalAmount += amount;
//         partsHTML += `
//             <tr>
//                 <td>${item.INVENTORY_NAME}</td>
//                 <td>${item.RATE}</td>
//                 <td>${item.QUANTITY}</td>
//                 <td>${amount.toFixed(2)}</td>
//             </tr>
//         `;
//     });

//     partsHTML += `
//         <tr>
//             <td colspan="3" style="text-align: right;"><strong>Total</strong></td>
//             <td><strong>${totalAmount.toFixed(2)}</strong></td>
//         </tr>
//     `;
//     partsHTML += '</tbody></table>';

//     let subject = `Inventory Approval Request - ${JOB_CARD_NO}`;

//     // Compose the HTML email body with Approve/Reject buttons
//     let emailbody = `
//         <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid rgb(204, 204, 204); box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 10px; border-radius: 8px;">
//             <div style="text-align: center;">
//                 <img src="${process.env.FILE_URL}/logo/PockIT_Logo.png" style="width: 122px; height: 35px;" alt="PockIT Logo">
//                 <p style="font-family: Roboto, Arial, sans-serif;">
//                     <font size="3"><span>🚀</span>&nbsp;<strong>Team PockIT Engineers!</strong></font>
//                 </p>
//             </div>

//             <div style="font-family: Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.6;">
//                 <p><strong>Dear Team,</strong></p>
//                 <p>The technician <strong>${TECHNICIAN_NAME}</strong> has raised an inventory request for the job <strong>${JOB_CARD_NO}</strong> for customer <strong>${CUSTOMER_NAME}</strong>.</p>
//                 <p>Please find below the list of requested parts:</p>
//                 ${partsHTML}

//                 <div style="margin: 30px 0; text-align: center;">
//                     <p style="text-align: left;" >Please approve or reject this request</p>
//                     <div style="display: flex; justify-content: center; gap: 20px;">
//                         <form action="https://1786vqrk-8767.inc1.devtunnels.ms/api/inventoryRequest/updateRequestStatus" method="POST" target="_blank" style="margin: 0;">
//                             <input type="hidden" name="TECHNICIAN_ID" value="${TECHNICIAN_ID}">
//                             <input type="hidden" name="JOB_CARD_ID" value="${JOB_CARD_ID}">
//                             <input type="hidden" name="CUSTOMER_ID" value="${CUSTOMER_ID}">
//                             <input type="hidden" name="STATUS" value="A">
//                             <input type="hidden" name="ORDER_ID" value="">
//                             <input type="hidden" name="TECHNICIAN_NAME" value="${TECHNICIAN_NAME}">
//                             <input type="hidden" name="JOB_CARD_NO" value="${JOB_CARD_NO}">
//                             <input type="hidden" name="REQUEST_MASTER_ID" value="${REQUEST_MASTER_ID}">
//                             <input type="hidden" name="INVENTORY_IDS" value='${JSON.stringify(Array.isArray(INVENTORY_IDS) ? INVENTORY_IDS : [])}'>
//                             <input type="hidden" name="IDS" value='${JSON.stringify(Array.isArray(IDS) ? IDS : [])}'>
//                             <input type="hidden" name="ACTION_TAKEN_FROM_MAIL" value="1">
//                             <button type="submit" style="background-color: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
//                                 Approve Request
//                             </button>
//                         </form>&nbsp; &nbsp;   

//                         <form action="https://1786vqrk-8767.inc1.devtunnels.ms/api/inventoryRequest/updateRequestStatus" method="POST" target="_blank" style="margin: 0;">
//                             <input type="hidden" name="TECHNICIAN_ID" value="${TECHNICIAN_ID}">
//                             <input type="hidden" name="JOB_CARD_ID" value="${JOB_CARD_ID}">
//                             <input type="hidden" name="CUSTOMER_ID" value="${CUSTOMER_ID}">
//                             <input type="hidden" name="STATUS" value="R">
//                             <input type="hidden" name="ORDER_ID" value="">
//                             <input type="hidden" name="TECHNICIAN_NAME" value="${TECHNICIAN_NAME}">
//                             <input type="hidden" name="JOB_CARD_NO" value="${JOB_CARD_NO}">
//                             <input type="hidden" name="REQUEST_MASTER_ID" value="${REQUEST_MASTER_ID}">
//                             <input type="hidden" name="INVENTORY_IDS" value='${JSON.stringify(Array.isArray(INVENTORY_IDS) ? INVENTORY_IDS : [])}'>
//                             <input type="hidden" name="IDS" value='${JSON.stringify(Array.isArray(IDS) ? IDS : [])}'>
//                             <input type="hidden" name="ACTION_TAKEN_FROM_MAIL" value="1">
//                             <button type="submit" style="background-color: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
//                                 Reject Request
//                             </button>
//                         </form>
//                     </div>
//                 </div>

//                 <p>If you need any assistance, please feel free to reach out to us at <strong>itsupport@pockitengineers.com</strong>.</p>

//                 <p>
//                     <strong>Best Regards</strong>,<br>
//                     <strong>PockIT Team</strong>
//                 </p>
//             </div>
//         </div>
//     `;

//     // Split and trim the EMAIL_LIST (comma-separated)
//     let toEmails = EMAIL_LIST.split(',').map(email => email.trim()).filter(email => email);

//     // Loop over each email and send individually
//     toEmails.forEach(to => {
//         mm.sendEmail(to, subject, emailbody, "", "", (error, results) => {
//             if (error) {
//                 console.log(`Error sending email to ${to}`, error);
//                 logger.error(`Error sending inventory request email to ${to}: ${JSON.stringify(error)}`, applicationkey);
//             } else {
//                 console.log(`Email sent successfully to ${to}`, results);
//                 logger.info(`Inventory request email sent to ${to} for request ${REQUEST_MASTER_ID}`, applicationkey);
//             }
//         });
//     });
// }


// HTML Templates for Email Responses
const alreadyApprovedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Already Approved</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f6f9;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    }
    .card h2 {
      color: #28a745;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 20px;
    }
</style>
</head>
<body>
  <div class="card">
    <span style="font-size: 40px;">✅</span>
    <h2>Already Approved</h2>
    <p>This request has already been approved.</p>
    <p>No further action is required.</p>
  </div>
</body>
</html>`;

const alreadyRejectedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Rejected</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #fef2f2;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    }
    .card h2 {
      color: #dc3545;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 20px;
    }
</style>
</head>
<body>
  <div class="card">
    <span style="font-size: 40px;">❌</span>
    <h2>Request Rejected</h2>
    <p>This request was already rejected.</p>
    <p>No further action is required.</p>
  </div>
</body>
</html>`;

const missingFields = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Cannot Be Processed</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #fff8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 420px;
      text-align: center;
    }
    .card h2 {
      color: #ff6b35;
      margin-bottom: 10px;
    }
    .card p {
      color: #444;
      font-size: 14px;
      margin-bottom: 12px;
    }
</style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
    <h2>Action Not Allowed</h2>
    <p><strong>This request cannot be processed. Please contact to support team at itsupport@pockitengineers.com</strong></p>
  </div>
</body>
</html>`;


exports.updateRequestStatus = async (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const SECRET_KEY = process.env.REQUEST_SECRET_KEY;

    // Handle both direct API calls and email payloads
    let requestBody = req.body;
    let isFromEmail = false;

    // Process encoded payload if coming from email
    if (req.body.payload) {
        try {
            // Decode the payload
            const decoded = Buffer.from(req.body.payload, 'base64').toString('utf8');
            const { data, signature } = JSON.parse(decoded);

            // Verify the signature
            const hmac = crypto.createHmac('sha256', SECRET_KEY);
            hmac.update(data);
            const expectedSignature = hmac.digest('hex');

            if (signature !== expectedSignature) {
                return handleEmailErrorResponse(res, 'Invalid request signature');
            }

            // Parse the data and check expiration
            requestBody = JSON.parse(data);
            const now = new Date();
            const expiresAt = new Date(requestBody.expiresAt);

            if (now > expiresAt) {
                return handleEmailErrorResponse(res, 'This request has expired');
            }

            isFromEmail = true;
            requestBody.ACTION_TAKEN_FROM_MAIL = '1';

            console.log("Requested from email:", requestBody);
            

        } catch (error) {
            console.error("Error processing encoded payload:", error);
            return handleEmailErrorResponse(res, 'Invalid payload format');
        }
    }

    // Parse and validate arrays
    let inventoryIDs, IDS;
    try {
        inventoryIDs = parseArrayField(requestBody.INVENTORY_IDS, 'INVENTORY_IDS');
        IDS = parseArrayField(requestBody.IDS, 'IDS');
    } catch (e) {
        console.error(e.message);
        return isFromEmail ?
            handleEmailErrorResponse(res, e.message) :
            res.status(400).send({ code: 400, message: e.message });
    }

    const ACTION_TAKEN_FROM_MAIL = requestBody.ACTION_TAKEN_FROM_MAIL === '1';

    console.log("\nPROCESSING REQUEST:", {
        REQUEST_MASTER_ID: requestBody.REQUEST_MASTER_ID,
        SOURCE: isFromEmail ? 'EMAIL' : 'DIRECT_API',
        ACTION: requestBody.STATUS === 'A' ? 'APPROVE' : 'REJECT'
    });

    const {
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        STATUS,
        ORDER_ID,
        TECHNICIAN_NAME,
        JOB_CARD_NO,
        REQUEST_MASTER_ID
    } = requestBody;

    // Validate required fields
    if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || IDS.length === 0 || !inventoryIDs || inventoryIDs.length === 0) {
        if (ACTION_TAKEN_FROM_MAIL) {
            return res.setHeader('Content-Type', 'text/html').send(missingFields);
        }
        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, CUSTOMER_ID, IDS, INVENTORY_IDS`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({ code: 422, message: errors.errors });
    }

    const connection = mm.openConnection();
    let loggarry = [];
    const systemDate = mm.getSystemDate();

    try {
        // Check if request is already processed (for email requests)
        if (ACTION_TAKEN_FROM_MAIL) {
            const statusCheck = await checkRequestStatus(REQUEST_MASTER_ID, supportKey, connection);
            if (statusCheck) {
                mm.commitConnection(connection);
                res.setHeader('Content-Type', 'text/html');
                return res.send(statusCheck === 'AC' ? alreadyApprovedHTML : alreadyRejectedHTML);
            }
        }

        // Determine status code
        let STATUSZ;
        if (STATUS === "A") {
            STATUSZ = "AC";
        } else if (STATUS === "R") {
            STATUSZ = "R";
        } else if (STATUS === "AP") {
            STATUSZ = "AP";
        } else {
            mm.commitConnection(connection);
            return res.send({ code: 400, message: "Invalid STATUS value." });
        }

        // Update job card and inventory details
        const jobCard = await executeQuery(
            'SELECT * FROM view_job_card WHERE ID = ?',
            [JOB_CARD_ID],
            supportKey,
            connection
        );

        if (!jobCard || jobCard.length === 0) {
            mm.rollbackConnection(connection);
            return handleErrorResponse(res, isFromEmail, "Job card not found");
        }

        await executeDML(
            `UPDATE job_card SET INVENTORY_REQUESTED = 1 WHERE ID = ?`,
            [JOB_CARD_ID],
            supportKey,
            connection
        );

        // Process each inventory item
        for (const id of IDS) {
            await updateInventoryDetail(
                id, STATUSZ, systemDate, CUSTOMER_ID, TECHNICIAN_ID,
                JOB_CARD_ID, REQUEST_MASTER_ID, supportKey, connection
            );

            if (STATUS === 'A' || STATUS === 'AP') {
                await processInventoryApproval(
                    id, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID,
                    REQUEST_MASTER_ID, JOB_CARD_NO, supportKey, connection
                );
            }

            const actionDetails = `${jobCard[0].CUSTOMER_NAME} has ${getActionVerb(STATUS)} the inventory request for job ${JOB_CARD_NO}`;
            loggarry.push(createLogData(
                TECHNICIAN_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                TECHNICIAN_NAME, jobCard[0].CUSTOMER_NAME,
                systemDate, STATUS, actionDetails
            ));
        }

        // Update master record and send notifications
        await updateMasterRecord(
            TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID,
            STATUSZ, systemDate, supportKey, connection
        );

        const actionMessage = `${jobCard[0].CUSTOMER_NAME} has ${getActionVerb(STATUS)} the inventory request for job ${JOB_CARD_NO}`;

        mm.sendNotificationToAdmin(
            8,
            `**Inventory Request ${getActionStatus(STATUS)}**`,
            actionMessage,
            "", "J", "N", supportKey, "I", requestBody
        );

        mm.sendNotificationToTechnician(
            jobCard[0].CUSTOMER_ID,
            TECHNICIAN_ID,
            `**Inventory Request ${getActionStatus(STATUS)}**`,
            actionMessage,
            "", "J", supportKey, "N", "J", jobCard
        );

        dbm.saveLog(loggarry, technicianActionLog);
        mm.commitConnection(connection);

        if (isFromEmail) {
            res.setHeader('Content-Type', 'text/html');
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Request ${getActionStatus(STATUS)}</title>
                    <style>
                        body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #fef2f2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        }
                        .card {
                        background: #fff;
                        padding: 30px 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        text-align: center;
                        }
                        .card h2 {
                        color: #dc3545;
                        margin-bottom: 10px;
                        }
                        .card p {
                        color: #555;
                        font-size: 14px;
                        margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <span style="font-size: 40px;">${STATUS === 'A' ? '✅' : '❌'}</span>
                        <h2>Request ${getActionStatus(STATUS)}</h2>
                        <p>The inventory request has been ${getActionVerb(STATUS)} successfully.</p>
                    </div>
                </body>
                </html>
            `);
        }

        return res.status(200).send({ code: 200, message: "Inventory request updated." });

    } catch (error) {
        console.error("Caught an unexpected error:", error);
        if (connection) mm.rollbackConnection(connection);

        if (isFromEmail) {
            return handleEmailErrorResponse(res, 'An error occurred processing your request');
        }
        return res.status(500).send({ code: 500, message: "An unexpected error occurred." });
    }
};

// Helper functions
function parseArrayField(field, fieldName) {
    if (typeof field === 'string') {
        try {
            return JSON.parse(field);
        } catch (e) {
            throw new Error(`Invalid ${fieldName} format. Expected a JSON array string.`);
        }
    }
    return Array.isArray(field) ? field : [];
}

async function checkRequestStatus(requestMasterId, supportKey, connection) {
    const pendingDetails = await executeQuery(
        `SELECT COUNT(*) as pending_count 
         FROM inventory_request_details 
         WHERE REQUEST_MASTER_ID = ? 
         AND STATUS NOT IN ('AC', 'AP', 'R')`,
        [requestMasterId],
        supportKey,
        connection
    );

    if (pendingDetails[0].pending_count === 0) {
        const [latestDetail] = await executeQuery(
            `SELECT STATUS 
             FROM inventory_request_details 
             WHERE REQUEST_MASTER_ID = ? 
             ORDER BY CREATED_MODIFIED_DATE DESC LIMIT 1`,
            [requestMasterId],
            supportKey,
            connection
        );
        return latestDetail?.STATUS;
    }
    return null;
}

async function updateInventoryDetail(id, status, systemDate, customerId, technicianId, jobCardId, requestMasterId, supportKey, connection) {
    return executeDML(
        `UPDATE inventory_request_details 
         SET STATUS=?, CREATED_MODIFIED_DATE = ? 
         WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`,
        [status, systemDate, id, customerId, technicianId, jobCardId, requestMasterId],
        supportKey,
        connection
    );
}

async function processInventoryApproval(id, customerId, technicianId, jobCardId, requestMasterId, jobCardNo, supportKey, connection) {
    const [detail] = await executeQuery(
        `SELECT * FROM inventory_request_details 
         WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`,
        [id, customerId, technicianId, jobCardId, requestMasterId],
        supportKey,
        connection
    );

    if (!detail) throw new Error(`Inventory detail not found for ID: ${id}`);

    await executeDML(
        `UPDATE inventory_warehouse_stock_management 
         SET CURRENT_STOCK=CURRENT_STOCK-? 
         WHERE ITEM_ID=? AND WAREHOUSE_ID=?`,
        [detail.QUANTITY, detail.INVENTORY_ID, detail.WAREHOUSE_ID],
        supportKey,
        connection
    );

    const actionLog = `${jobCardNo} inventory request approved`;
    const transactionData = [
        [jobCardNo, mm.getSystemDate(), "D", detail.INVENTORY_TRACKING_TYPE, 0, technicianId, 0, 0, 0, 0, "J",
            detail.BATCH_NO, detail.SERIAL_NO, detail.INVENTORY_ID, 0, detail.QUANTITY, actionLog, 1,
            detail.ACTUAL_UNIT_ID, detail.ACTUAL_UNIT_NAME, detail.IS_VARIANT, detail.PARENT_ID, detail.QUANTITY_PER_UNIT],
        [jobCardNo, mm.getSystemDate(), "C", detail.INVENTORY_TRACKING_TYPE, 0, 0, 0, 0, 0, jobCardId, "J",
            detail.BATCH_NO, detail.SERIAL_NO, detail.INVENTORY_ID, detail.QUANTITY, 0, actionLog, 1,
            detail.ACTUAL_UNIT_ID, detail.ACTUAL_UNIT_NAME, detail.IS_VARIANT, detail.PARENT_ID, detail.QUANTITY_PER_UNIT]
    ];

    return executeDML(
        `INSERT INTO inventory_account_transaction 
         (TRANSACTION_ID, TRANSACTION_DATE, TRANSACTION_TYPE, INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, 
          TECHNICIAN_ID, ADJUSTMENT_ID, MOVEMENT_ID, INWARD_ID, JOB_CARD_ID, GATEWAY_TYPE, 
          BATCH_NO, SERIAL_NO, ITEM_ID, IN_QTY, OUT_QTY, REMARKS, CLIENT_ID, ACTUAL_UNIT_ID, 
          ACTUAL_UNIT_NAME, IS_VARIANT, PARENT_ID, QUANTITY_PER_UNIT) 
         VALUES ?`,
        [transactionData],
        supportKey,
        connection
    );
}

async function updateMasterRecord(
    technicianId,
    customerId,
    jobCardId,
    requestMasterId,
    status,
    systemDate,
    supportKey,
    connection
) {
    // First check if there's already an approved master record
    const existingMaster = await executeQuery(
        `SELECT * FROM inventory_request_master 
         WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ? AND STATUS = 'AC'`,
        [jobCardId, customerId, technicianId],
        supportKey,
        connection
    );

    if (existingMaster && existingMaster.length > 0) {
        // Master record already approved - no need to update
        return;
    }

    // Update the master record
    return executeDML(
        `UPDATE inventory_request_master 
         SET STATUS = ?, CREATED_MODIFIED_DATE = ? 
         WHERE ID = ? AND TECHNICIAN_ID = ? AND CUSTOMER_ID = ? AND JOB_CARD_ID = ?`,
        [status, systemDate, requestMasterId, technicianId, customerId, jobCardId],
        supportKey,
        connection
    );
}

function createLogData(technicianId, orderId, jobCardId, customerId, technicianName, customerName, dateTime, status, actionDetails) {
    return {
        TECHNICIAN_ID: technicianId,
        ORDER_ID: orderId,
        JOB_CARD_ID: jobCardId,
        CUSTOMER_ID: customerId,
        LOG_TYPE: 'Inventory',
        ACTION_LOG_TYPE: 'User',
        ACTION_DETAILS: actionDetails,
        TECHNICIAN_NAME: technicianName,
        ORDER_STATUS: `Inventory request ${getActionStatus(status)}`,
        JOB_CARD_STATUS: `Inventory request ${getActionStatus(status)}`,
        USER_NAME: customerName,
        DATE_TIME: dateTime,
        supportKey: 0
    };
}

function getActionVerb(status) {
    return status === 'A' ? 'approved' : status === 'R' ? 'rejected' : 'auto-approved';
}

function getActionStatus(status) {
    return status === 'A' ? 'approved' : status === 'R' ? 'rejected' : 'auto-approved';
}

function handleEmailErrorResponse(res, message) {
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Request Error</title>
            <style>/* Your error styles */</style>
        </head>
        <body>
            <div class="card">
                <span style="font-size: 40px;">⚠️</span>
                <h2>Action Failed</h2>
                <p>${message}</p>
                <p>Please contact support if you need assistance.</p>
            </div>
        </body>
        </html>
    `);
}

// Promise-based wrappers for your database functions
function executeQuery(query, params, supportKey, connection) {
    return new Promise((resolve, reject) => {
        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        }, connection);
    });
}

function executeDML(query, params, supportKey, connection) {
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) reject(error);
            else resolve(results);
        });
    });
}


function handleErrorResponse(res, isFromEmail, message) {
    if (isFromEmail) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Request Error</title>
                <style>
                    body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #fff8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                    }
                    .card {
                        background: #fff;
                        padding: 30px 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 420px;
                        text-align: center;
                    }
                    .card h2 {
                        color: #ff6b35;
                        margin-bottom: 10px;
                    }
                    .card p {
                        color: #444;
                        font-size: 14px;
                        margin-bottom: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h2>Processing Error</h2>
                    <p><strong>${message}</strong></p>
                    <p>Please contact support if you need assistance.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        return res.status(400).send({
            code: 400,
            message: message
        });
    }
}



async function sendRequestEmail(TYPE, EMAIL_LIST, CUSTOMER_NAME, JOB_CARD_NO, INVENTORY_DATA = [],
    TECHNICIAN_NAME = '', TECHNICIAN_ID = '', JOB_CARD_ID = '', CUSTOMER_ID = '',
    REQUEST_MASTER_ID = '', INVENTORY_IDS = []) {

    // Fetch inventory detail IDs if not provided
    let IDS = [];
    try {
        const detailsResults = await new Promise((resolve, reject) => {
            mm.executeQueryData('SELECT ID FROM inventory_request_details WHERE REQUEST_MASTER_ID = ?',
                [REQUEST_MASTER_ID], "supportKey", (error, results) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(results);
                    }
                });
        });

        if (detailsResults && detailsResults.length > 0) {
            IDS = detailsResults.map(item => item.ID);

            console.log("\n\n\n\n IDS:", IDS);
            
        }
    } catch (error) {
        console.error("Error fetching inventory detail IDs:", error);
    }

    // Ensure arrays are properly formatted
    if (typeof INVENTORY_IDS === 'string') {
        try {
            INVENTORY_IDS = JSON.parse(INVENTORY_IDS);
        } catch (e) {
            INVENTORY_IDS = [];
        }
    }



    if (typeof IDS === 'string') {
        try {
            IDS = JSON.parse(IDS);
        } catch (e) {
            IDS = IDS;
        }
    }

    // Generate HTML for inventory list
    let partsHTML = '<table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; font-size: 14px;">';
    partsHTML += `
        <thead style="background-color: #f2f2f2;">
            <tr>
                <th>Part Name</th>
                <th>Rate (₹)</th>
                <th>Quantity</th>
                <th>Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
    `;

    let totalAmount = 0;
    INVENTORY_DATA.forEach(item => {
        let amount = item.RATE * item.QUANTITY;
        totalAmount += amount;
        partsHTML += `
            <tr>
                <td>${item.INVENTORY_NAME}</td>
                <td>${item.RATE}</td>
                <td>${item.QUANTITY}</td>
                <td>${amount.toFixed(2)}</td>
            </tr>
        `;
    });

    partsHTML += `
        <tr>
            <td colspan="3" style="text-align: right;"><strong>Total</strong></td>
            <td><strong>${totalAmount.toFixed(2)}</strong></td>
        </tr>
    `;
    partsHTML += '</tbody></table>';

    let subject = `Inventory Approval Request - ${JOB_CARD_NO}`;

    // Create secure request data with expiration
    const now = new Date();
    // const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours expiration
    const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours expiration
    // const expiresAt = new Date(now.getTime() + 60 * 1000); // 1 minute expiration (60,000 milliseconds)

    const requestData = {
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        JOB_CARD_NO,
        REQUEST_MASTER_ID,
        INVENTORY_IDS: Array.isArray(INVENTORY_IDS) ? INVENTORY_IDS : [],
        IDS: Array.isArray(IDS) ? IDS : [],
        TECHNICIAN_NAME,
        ACTION_TAKEN_FROM_MAIL: 1,
        expiresAt: expiresAt.toISOString(),
        nonce: Math.random().toString(36).substring(2, 15) // Add random nonce
    };

    // Create HMAC signature for security
    const SECRET_KEY = process.env.REQUEST_SECRET_KEY


    function createSignedData(data) {
        const dataString = JSON.stringify(data);
        const hmac = crypto.createHmac('sha256', SECRET_KEY);
        hmac.update(dataString);
        const signature = hmac.digest('hex');
        return { data: dataString, signature };
    }

    // Create signed and encoded data for both actions
    const signedApproveData = createSignedData({ ...requestData, STATUS: 'A', ORDER_ID: '' });
    const signedRejectData = createSignedData({ ...requestData, STATUS: 'R', ORDER_ID: '' });

    const encodedApproveData = Buffer.from(JSON.stringify(signedApproveData)).toString('base64');
    const encodedRejectData = Buffer.from(JSON.stringify(signedRejectData)).toString('base64');

    // Compose the HTML email body
    let emailbody = `
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid rgb(204, 204, 204); box-shadow: rgba(0, 0, 0, 0.1) 0px 4px 10px; border-radius: 8px;">
            <div style="text-align: center;">
                <img src="${process.env.FILE_URL}/logo/PockIT_Logo.png" style="width: 122px; height: 35px;" alt="PockIT Logo">
                <p style="font-family: Roboto, Arial, sans-serif;">
                    <font size="3"><span>🚀</span>&nbsp;<strong>Team PockIT Engineers!</strong></font>
                </p>
            </div>

            <div style="font-family: Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.6;">
                <p><strong>Dear Team,</strong></p>
                <p>The technician <strong>${TECHNICIAN_NAME}</strong> has raised an inventory request for the job <strong>${JOB_CARD_NO}</strong> for customer <strong>${CUSTOMER_NAME}</strong>.</p>
                <p>Please find below the list of requested parts:</p>
                ${partsHTML}

                <div style="margin: 30px 0; text-align: center;">
                    <p style="text-align: left;">Please approve or reject this request</p>
                    <div style="display: flex; justify-content: center; gap: 20px;">
                        <form action="${process.env.API_URL}inventoryRequest/updateRequestStatus" method="POST" target="_blank" style="margin: 0;">
                            <input type="hidden" name="payload" value="${encodedApproveData}">
                            <button type="submit" style="background-color: #4CAF50; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
                                Approve Request
                            </button>
                        </form>&nbsp; &nbsp;   
                        
                        <form action="${process.env.API_URL}inventoryRequest/updateRequestStatus" method="POST" target="_blank" style="margin: 0;">
                            <input type="hidden" name="payload" value="${encodedRejectData}">
                            <button type="submit" style="background-color: #f44336; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; font-weight: bold;">
                                Reject Request
                            </button>
                        </form>
                    </div>
                    
                </div>

                <p>If you need any assistance, please feel free to reach out to us at <strong>itsupport@pockitengineers.com</strong>.</p>

                <p>
                    <strong>Best Regards</strong>,<br>
                    <strong>PockIT Team</strong>
                </p>
                <p style="font-size: 12px; color: #666; margin-top: 10px; text-align: left;">
                    Note: This link will expire in 48 hours
                </p>
            </div>
        </div>
    `;

    // Send emails
    let toEmails = EMAIL_LIST.split(',').map(email => email.trim()).filter(email => email);
    toEmails.forEach(to => {
        mm.sendEmail(to, subject, emailbody, "", "", (error, results) => {
            if (error) {
                console.log(`Error sending email to ${to}`, error);
                logger.error(`Error sending inventory request email to ${to}: ${JSON.stringify(error)}`, applicationkey);
            } else {
                console.log(`Email sent successfully to ${to}`, results);
                logger.info(`Inventory request email sent to ${to} for request ${REQUEST_MASTER_ID}`, applicationkey);
            }
        });
    });
}