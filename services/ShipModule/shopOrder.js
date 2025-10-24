const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var shopOrderMaster = "shop_order_master";
var viewShopOrderMaster = "view_" + shopOrderMaster;
const async = require('async');
const dbm = require('../../utilities/dbMongo');
const shopOrderActionLog = require("../../modules/shopOrderActionLog")
const token = require('../ShipModule/shiprocketLoginInfo')
const request = require('request')
function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CART_ID: req.body.CART_ID,
        ORDER_DATE_TIME: req.body.ORDER_DATE_TIME,
        ESTIMATED_DATE_TIME: req.body.ESTIMATED_DATE_TIME,
        ORDER_STATUS: req.body.ORDER_STATUS,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        COUPON_CODE: req.body.COUPON_CODE,
        COUPON_AMOUNT: req.body.COUPON_AMOUNT ? req.body.COUPON_AMOUNT : 0,
        FINAL_AMOUNT: req.body.FINAL_AMOUNT ? req.body.FINAL_AMOUNT : 0,
        DELIVERY_ADDRESS_ID: req.body.DELIVERY_ADDRESS_ID,
        SPECIAL_INSTRUCTIONS: req.body.SPECIAL_INSTRUCTIONS,
        ORDER_NUMBER: req.body.ORDER_NUMBER,
        OEDER_COMPLETED_DATETIME: req.body.OEDER_COMPLETED_DATETIME,
        RESCHEDULE_REQUEST_DATE: req.body.RESCHEDULE_REQUEST_DATE,
        RESCHEDULE_APPROVE_DATE: req.body.RESCHEDULE_APPROVE_DATE,
        RESCHEDULE_REQUEST_REMARK: req.body.RESCHEDULE_REQUEST_REMARK,
        RESCHEDULE_REQUEST_REASON: req.body.RESCHEDULE_REQUEST_REASON,
        EXPECTED_PREAPARATION_DATETIME: req.body.EXPECTED_PREAPARATION_DATETIME,
        EXPECTED_PACKAGING_DATETIME: req.body.EXPECTED_PACKAGING_DATETIME,
        EXPECTED_DISPATCH_DATETIME: req.body.EXPECTED_DISPATCH_DATETIME,
        ACTUAL_PREAPARATION_DATETIME: req.body.ACTUAL_PREAPARATION_DATETIME,
        ACTUAL_PACKAGING_DATETIME: req.body.ACTUAL_PACKAGING_DATETIME,
        ACTUAL_DISPATCH_DATETIME: req.body.ACTUAL_DISPATCH_DATETIME,
        REJECTION_REMARK: req.body.REJECTION_REMARK,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('CART_ID').isInt().optional(),
        body('ORDER_DATE_TIME').optional(),
        body('ESTIMATED_DATE_TIME').optional(),
        body('ORDER_STATUS').optional(),
        body('PAYMENT_MODE').optional(),
        body('PAYMENT_STATUS').optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('COUPON_CODE').optional(),
        body('COUPON_AMOUNT').isDecimal().optional(),
        body('FINAL_AMOUNT').isDecimal().optional(),
        body('DELIVERY_ADDRESS_ID').isInt().optional(),
        body('SPECIAL_INSTRUCTIONS').optional(),
        body('ORDER_NUMBER').optional(),
        body('OEDER_COMPLETED_DATETIME').optional(),
        body('RESCHEDULE_REQUEST_DATE').optional(),
        body('RESCHEDULE_APPROVE_DATE').optional(),
        body('RESCHEDULE_REQUEST_REMARK').optional(),
        body('RESCHEDULE_REQUEST_REASON').optional(),
        body('EXPECTED_PREAPARATION_DATETIME').optional(),
        body('EXPECTED_PACKAGING_DATETIME').optional(),
        body('EXPECTED_DISPATCH_DATETIME').optional(),
        body('ACTUAL_PREAPARATION_DATETIME').optional(),
        body('ACTUAL_PACKAGING_DATETIME').optional(),
        body('ACTUAL_DISPATCH_DATETIME').optional(),
        body('REJECTION_REMARK').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {

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
            mm.executeQuery('select count(*) as cnt from ' + viewShopOrderMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get shopOrder count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewShopOrderMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get shopOrder information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 185,
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

exports.get = (req, res) => {
    var ID = req.params.ID;
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
            mm.executeQueryData('select count(*) as cnt from ' + viewShopOrderMaster + ' where 1 AND ID=? ' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get shopOrder count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewShopOrderMaster + ' where 1 AND ID=? ' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get shopOrder information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 185,
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

exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + shopOrderMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save shopOrder information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "ShopOrder information saved successfully...",
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
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + shopOrderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update shopOrder information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "ShopOrder information updated successfully...",
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

exports.orderDetails = (req, res) => {
    var ID = req.params.id;
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
            mm.executeQueryData('select * from ' + viewShopOrderMaster + ' where 1 AND ID=? ', ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get shopOrder count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from view_shop_order_master_address_map where 1 AND ORDER_ID=? ', ID, supportKey, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get shopOrder information."
                            });
                        }
                        else {
                            mm.executeQueryData('select * from view_shop_order_summary_details where 1 AND ORDER_ID=? ', ID, supportKey, (error, results3) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.status(400).json({
                                        "message": "Failed to get shopOrder information."
                                    });
                                }
                                else {
                                    mm.executeQueryData('select * from view_shop_order_details where 1 AND ORDER_ID=? ', ID, supportKey, (error, results4) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.status(400).json({
                                                "message": "Failed to get shopOrder information."
                                            });
                                        }
                                        else {
                                            res.status(200).json({
                                                "message": "success",
                                                "TAB_ID": 185,
                                                "orderData": results1,
                                                "addressData": results2,
                                                "summaryData": results3,
                                                "detailsData": results4,
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

exports.orderUpdateStatusOld = (req, res) => {
    try {
        const { ID, ORDER_STATUS, REMARK, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, IS_FIRST, WAREHOUSE_DETAILS, WEIGHT, LENGTH, BREADTH, HEIGHT, COURIER_ID, COURIER_DETAILS, INVENTORY_DETAILS, ACCEPTANCE_REMARK } = req.body;
        let LogArrays = [];
        var supportKey = req.headers['supportkey'];
        const systemDate = mm.getSystemDate();
        let setData = "";
        var recordData = [];


        if (ORDER_STATUS == "OA" || ORDER_STATUS == "OK") {
            if (!WAREHOUSE_DETAILS || !INVENTORY_DETAILS) {
                return res.send({
                    code: 400,
                    message: "WAREHOUSE_DETAILS and INVENTORY_DETAILS is required."
                });
            }
        }

        if (ORDER_STATUS == "OD") {
            if (!WAREHOUSE_DETAILS) {
                return res.send({
                    code: 400,
                    message: "WAREHOUSE_DETAILS is required."
                });
            }
        }

        if (ORDER_STATUS === "OA") {
            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?";
            recordData.push(2, systemDate, ID);
        }
        else if (ORDER_STATUS === "OR") {
            setData = "ORDER_STATUS_ID = ?,REJECTION_REMARK=?,CREATED_MODIFIED_DATE = ?";
            recordData.push(3, REMARK, systemDate, ID);
        }
        else if (ORDER_STATUS === "ON") {
            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?,EXPECTED_PREAPARATION_DATETIME=?,ACTUAL_PREAPARATION_DATETIME=?";
            recordData.push(4, systemDate, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, ID);
        }
        else if (ORDER_STATUS === "OK") {
            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?,EXPECTED_PACKAGING_DATETIME=?,ACTUAL_PACKAGING_DATETIME=?,STOCK_TAKEN_WAREHOUSE = ?, WAREHOUSE_DETAILS = ?,ACCEPTANCE_REMARK=?,WAREHOUSE_ID=?";
            recordData.push(5, systemDate, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, WAREHOUSE_DETAILS[0].ID, JSON.stringify(WAREHOUSE_DETAILS), ACCEPTANCE_REMARK, WAREHOUSE_DETAILS[0].ID, ID);
        }
        else if (ORDER_STATUS === "OD") {
            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?,EXPECTED_DISPATCH_DATETIME=?,ACTUAL_DISPATCH_DATETIME=?,WEIGHT=?,LENGTH=?,BREADTH=?,HEIGHT=?,COURIER_ID=?,COURIER_DETAILS=?";
            recordData.push(6, systemDate, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, WEIGHT, LENGTH, BREADTH, HEIGHT, COURIER_ID, JSON.stringify(COURIER_DETAILS), ID);
        }
        else if (ORDER_STATUS === "OS") {
            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?";
            recordData.push(7, systemDate, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, ID);
        }
        const query = `UPDATE ${shopOrderMaster} SET ${setData} WHERE ID = ?`;
        const connection = mm.openConnection();
        mm.executeDML(query, recordData, supportKey, connection, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    code: 400,
                    message: "Failed to update orderMaster information."
                });
            } else {
                mm.executeDML(`SELECT ID, DATE(ORDER_DATE_TIME)ORDER_DATE,PICKUP_LOCATION,CUSTOMER_NAME,SERVICE_ADDRESS,PINCODE,STATE_NAME,COUNTRY_NAME,EMAIL,MOBILE_NO,IF(PAYMENT_MODE='COD','COD','Prepaid')PAYMENT_METHOD,COUPON_AMOUNT,FINAL_AMOUNT,CUSTOMER_ID,ORDER_NUMBER,CLIENT_ID,PAYMENT_MODE,PAYMENT_STATUS ,TOTAL_AMOUNT,WAREHOUSE_DETAILS FROM view_shop_order_master where ID = ? `, ID, supportKey, connection, (error, results1) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        mm.rollbackConnection(connection);
                        console.log(error);
                        res.status(400).json({
                            code: 400,
                            message: "Failed to update orderMaster information."
                        });
                    } else {
                        mm.executeDML(`select * FROM shop_order_details where ORDER_ID = ? `, ID, supportKey, connection, (error, results2) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                console.log(error);
                                res.status(400).json({
                                    code: 400,
                                    message: "Failed to update orderMaster information."
                                });
                            } else {
                                if (ORDER_STATUS == 'OD') {
                                    sendToShipRocket(results1, results2, results1[0].PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, (error, resultShiprocket) => {
                                        if (error) {
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            res.status(300).json({
                                                code: 300,
                                                message: "Something went wrong."
                                            });

                                        } else {

                                            if (IS_FIRST == 1) {
                                                mm.executeDML(`INSERT INTO pickup_location (PICKUP_LOCATION, NAME, EMAIL, PHONE, ADDRESS_LINE_1,ADDRESS_LINE_2, CITY, STATE, COUNTRY, PINCODE, WAREHOUSE_ID, ORDER_ID,  CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`, ['warehouse', WAREHOUSE_DETAILS[0].NAME, WAREHOUSE_DETAILS[0].EMAIL_ID, WAREHOUSE_DETAILS[0].MOBILE_NO, WAREHOUSE_DETAILS[0].ADDRESS_LINE1, WAREHOUSE_DETAILS[0].ADDRESS_LINE2, WAREHOUSE_DETAILS[0].CITY_NAME, WAREHOUSE_DETAILS[0].STATE_NAME, WAREHOUSE_DETAILS[0].COUNTRY_NAME, WAREHOUSE_DETAILS[0].PINCODE.split("-")[0], WAREHOUSE_DETAILS[0].ID, ID, WAREHOUSE_DETAILS[0].CLIENT_ID], supportKey, connection, (error, result5) => {
                                                    if (error) {
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection);
                                                        console.log(error);
                                                        res.status(400).json({
                                                            code: 400,
                                                            message: "Something went wrong in shiprocket"
                                                        });
                                                    } else {
                                                        var DESCRIPTION = '';
                                                        var TITLE = '';
                                                        if (ORDER_STATUS === "OA") {
                                                            TITLE = 'Order Accepted'
                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                        } else if (ORDER_STATUS === "OR") {
                                                            TITLE = 'Order Rejected'
                                                            DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                                        } else if (ORDER_STATUS === "ON") {
                                                            TITLE = 'Order Prepared'
                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been prepared. Will notify you once it confirmed.`
                                                        }
                                                        else if (ORDER_STATUS === "OK") {
                                                            TITLE = 'Order Packaged'
                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. Will notify you once it confirmed.`
                                                        }
                                                        else if (ORDER_STATUS === "OD") {
                                                            TITLE = 'Order Dispatched'
                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been dispatched. Will notify you once it confirmed.`
                                                        }
                                                        else if (ORDER_STATUS === "OS") {
                                                            TITLE = 'Order Deliverd'
                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been deliverd.`
                                                        }
                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", req.body);
                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);

                                                        mm.commitConnection(connection);
                                                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                                        const logData = {
                                                            ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null)
                                                        }
                                                        dbm.saveLog(logData, shopOrderActionLog);
                                                        res.status(200).json({
                                                            code: 200,
                                                            message: "OrderMaster information updated successfully."
                                                        });
                                                    }
                                                });
                                            }
                                            else {
                                                var DESCRIPTION = '';
                                                var TITLE = '';
                                                if (ORDER_STATUS === "OA") {
                                                    TITLE = 'Order Accepted'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                } else if (ORDER_STATUS === "OR") {
                                                    TITLE = 'Order Rejected'
                                                    DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                                } else if (ORDER_STATUS === "ON") {
                                                    TITLE = 'Order Prepared'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been prepared. will notify you once it confirmed.`
                                                }
                                                else if (ORDER_STATUS === "OK") {
                                                    TITLE = 'Order Packaged'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. will notify you once it confirmed.`
                                                }
                                                else if (ORDER_STATUS === "OD") {
                                                    TITLE = 'Order Dispatched'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been dispatched. will notify you once it confirmed.`
                                                }
                                                else if (ORDER_STATUS === "OS") {
                                                    TITLE = 'Order Deliverd'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been deliverd.`
                                                }
                                                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N", "O", req.body);
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);

                                                mm.commitConnection(connection);
                                                var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                                const logData = { ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null) }
                                                dbm.saveLog(logData, shopOrderActionLog);
                                                res.status(200).json({
                                                    code: 200,
                                                    message: "OrderMaster information updated successfully."
                                                });
                                            }
                                        }
                                    })
                                }
                                else if (ORDER_STATUS === "OA" || ORDER_STATUS === "OK") {
                                    if (INVENTORY_DETAILS) {
                                        mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,ORDER_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [INVENTORY_DETAILS], supportKey, connection, (error, transactions) => {
                                            if (error) {
                                                console.log(` Error adding transaction logs`, error);
                                                mm.rollbackConnection(connection);
                                                res.send({
                                                    code: 400,
                                                    message: "Failed to update Order Status."
                                                });
                                                console.log("Failed to insert transaction by system.")
                                            }
                                            else {
                                                if (results2.length === 0) {
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        code: 400,
                                                        message: "No items to update."
                                                    });
                                                } else {
                                                    const warehouseId = WAREHOUSE_DETAILS[0].ID;
                                                    const updateCases = results2.map(item => `WHEN ITEM_ID = ${item.INVENTORY_ID} THEN CURRENT_STOCK - ${item.QUANTITY}`).join(" ");
                                                    const itemIds = results2.map(item => item.INVENTORY_ID).join(", ");
                                                    const updateQuery = `
                                                    UPDATE inventory_warehouse_stock_management
                                                    SET CURRENT_STOCK = CASE ${updateCases} END
                                                    WHERE WAREHOUSE_ID = ? AND ITEM_ID IN (${itemIds})`;
                                                    mm.executeDML(updateQuery, [warehouseId], supportKey, connection, (error, serviceData) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            console.error("Error updating stock:", error);
                                                            res.send({
                                                                code: 400,
                                                                message: "Failed to update Order Status."
                                                            });
                                                        }
                                                        else {
                                                            if (IS_FIRST == 1) {
                                                                mm.executeDML(`INSERT INTO pickup_location (PICKUP_LOCATION, NAME, EMAIL, PHONE, ADDRESS_LINE_1,ADDRESS_LINE_2, CITY, STATE, COUNTRY, PINCODE, WAREHOUSE_ID, ORDER_ID,  CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`, ['warehouse', WAREHOUSE_DETAILS[0].NAME, WAREHOUSE_DETAILS[0].EMAIL_ID, WAREHOUSE_DETAILS[0].MOBILE_NO, WAREHOUSE_DETAILS[0].ADDRESS_LINE1, WAREHOUSE_DETAILS[0].ADDRESS_LINE2, WAREHOUSE_DETAILS[0].CITY_NAME, WAREHOUSE_DETAILS[0].STATE_NAME, WAREHOUSE_DETAILS[0].COUNTRY_NAME, WAREHOUSE_DETAILS[0].PINCODE.split("-")[0], WAREHOUSE_DETAILS[0].ID, ID, WAREHOUSE_DETAILS[0].CLIENT_ID], supportKey, connection, (error, results) => {
                                                                    if (error) {
                                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                        mm.rollbackConnection(connection);
                                                                        console.log(error);
                                                                        res.status(400).json({
                                                                            code: 400,
                                                                            message: "Failed to update orderMaster information."
                                                                        });
                                                                    } else {
                                                                        var DESCRIPTION = '';
                                                                        var TITLE = '';
                                                                        if (ORDER_STATUS === "OA") {
                                                                            TITLE = 'Order Accepted'
                                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                                            mm.sendNotificationToAdmin(8, "Order Accepted", `Hello Admin, a new order ${results1[0].ORDER_NUMBER} has been accepted on ${mm.getSystemDate()}. Please review it.`, "", "O", supportKey, "S", results1);
                                                                        }
                                                                        else {
                                                                            TITLE = 'Order Packaged'
                                                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. Will notify you once it confirmed.`
                                                                            mm.sendNotificationToAdmin(8, "Order Packaged", `Hello Admin, order ${results1[0].ORDER_NUMBER} has been packaged on ${mm.getSystemDate}. Ready for dispatch. Please proceed with the next steps.`, "", "O", supportKey, "S", results1);
                                                                        }

                                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N");
                                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);

                                                                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${TITLE} the order ${results1[0].ORDER_NUMBER} for the customer ${results1[0].CUSTOMER_NAME}.`
                                                                        const logData = {
                                                                            ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null)
                                                                        }
                                                                        dbm.saveLog(logData, shopOrderActionLog);
                                                                        mm.commitConnection(connection);
                                                                        res.status(200).json({
                                                                            code: 200,
                                                                            message: "OrderMaster information updated successfully."
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                            else {
                                                                var DESCRIPTION = '';
                                                                var TITLE = '';
                                                                if (ORDER_STATUS === "OA") {
                                                                    TITLE = 'Order Accepted'
                                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                                    mm.sendNotificationToAdmin(8, "Order Accepted", `Hello Admin, a new order ${results1[0].ORDER_NUMBER} has been accepted on ${mm.getSystemDate()}. Please review it.`, "", "O", supportKey);
                                                                }
                                                                else {
                                                                    TITLE = 'Order Packaged'
                                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. Will notify you once it confirmed.`
                                                                    mm.sendNotificationToAdmin(8, "Order Packaged", `Hello Admin, order ${results1[0].ORDER_NUMBER} has been packaged on ${mm.getSystemDate}. Ready for dispatch. Please proceed with the next steps.`, "", "O", supportKey);
                                                                }
                                                                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N");
                                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                                                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                                                const logData = {
                                                                    ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON', EXPECTED_DATE_TIME, null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK', EXPECTED_DATE_TIME, null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD', EXPECTED_DATE_TIME, null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON', ACTUAL_DATE_TIME, null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK', ACTUAL_DATE_TIME, null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD', ACTUAL_DATE_TIME, null)
                                                                }
                                                                dbm.saveLog(logData, shopOrderActionLog);
                                                                // mm.sendNotificationToAdmin(8, "New Inventory Added", `Hello Admin, A new inventory item ${data.ITEM_NAME} was added to the system on ${systemDate}. Please review and update records if needed.`, "", "I", supportKey);
                                                                mm.commitConnection(connection);
                                                                res.status(200).json({
                                                                    code: 200,
                                                                    message: "OrderMaster information updated successfully."
                                                                });
                                                            }
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    } else {
                                        res.status(400).json({
                                            code: 400,
                                            message: "INVENTORY_DETAILS is required. for order status OA or OK."
                                        });
                                    }
                                }
                                else {
                                    if (IS_FIRST == 1) {
                                        mm.executeDML(`INSERT INTO pickup_location (PICKUP_LOCATION, NAME, EMAIL, PHONE, ADDRESS_LINE_1,ADDRESS_LINE_2, CITY, STATE, COUNTRY, PINCODE, WAREHOUSE_ID, ORDER_ID,  CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`, ['warehouse', WAREHOUSE_DETAILS[0].NAME, WAREHOUSE_DETAILS[0].EMAIL_ID, WAREHOUSE_DETAILS[0].MOBILE_NO, WAREHOUSE_DETAILS[0].ADDRESS_LINE1, WAREHOUSE_DETAILS[0].ADDRESS_LINE2, WAREHOUSE_DETAILS[0].CITY_NAME, WAREHOUSE_DETAILS[0].STATE_NAME, WAREHOUSE_DETAILS[0].COUNTRY_NAME, WAREHOUSE_DETAILS[0].PINCODE.split("-")[0], WAREHOUSE_DETAILS[0].ID, ID, WAREHOUSE_DETAILS[0].CLIENT_ID], supportKey, connection, (error, results) => {
                                            if (error) {
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                res.status(400).json({
                                                    code: 400,
                                                    message: "Failed to update orderMaster information."
                                                });
                                            } else {
                                                var DESCRIPTION = '';
                                                var TITLE = '';
                                                if (ORDER_STATUS === "OA") {
                                                    TITLE = 'Order Accepted'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                } else if (ORDER_STATUS === "OR") {
                                                    TITLE = 'Order Rejected'
                                                    DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                                } else if (ORDER_STATUS === "ON") {
                                                    TITLE = 'Order Prepared'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been prepared. will notify you once it confirmed.`
                                                }
                                                else if (ORDER_STATUS === "OK") {
                                                    TITLE = 'Order Packaged'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. will notify you once it confirmed.`
                                                }
                                                else if (ORDER_STATUS === "OD") {
                                                    TITLE = 'Order Dispatched'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been dispatched. will notify you once it confirmed.`
                                                }
                                                else if (ORDER_STATUS === "OS") {
                                                    TITLE = 'Order Deliverd'
                                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been deliverd.`
                                                }
                                                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N", "O", req.body);
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                                mm.commitConnection(connection);
                                                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                                const logData = {
                                                    ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null)
                                                }
                                                dbm.saveLog(logData, shopOrderActionLog);
                                                // mm.sendNotificationToAdmin(8, "New Inventory Added", `Hello Admin, A new inventory item ${data.ITEM_NAME} was added to the system on ${systemDate}. Please review and update records if needed.`, "", "I", supportKey);
                                                res.status(200).json({
                                                    code: 200,
                                                    message: "OrderMaster information updated successfully."
                                                });
                                            }
                                        });
                                    }
                                    else {
                                        var DESCRIPTION = '';
                                        var TITLE = '';
                                        if (ORDER_STATUS === "OA") {
                                            TITLE = 'Order Accepted'
                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                        } else if (ORDER_STATUS === "OR") {
                                            TITLE = 'Order Rejected'
                                            DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                        } else if (ORDER_STATUS === "ON") {
                                            TITLE = 'Order Prepared'
                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been prepared. will notify you once it confirmed.`
                                        }
                                        else if (ORDER_STATUS === "OK") {
                                            TITLE = 'Order Packaged'
                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. will notify you once it confirmed.`
                                        }
                                        else if (ORDER_STATUS === "OD") {
                                            TITLE = 'Order Dispatched'
                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been dispatched. will notify you once it confirmed.`
                                        }
                                        else if (ORDER_STATUS === "OS") {
                                            TITLE = 'Order Deliverd'
                                            DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been deliverd.`
                                        }
                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N", "O", req.body);
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);

                                        mm.commitConnection(connection);
                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                        const logData = { ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null) }
                                        dbm.saveLog(logData, shopOrderActionLog);
                                        res.status(200).json({
                                            code: 200,
                                            message: "OrderMaster information updated successfully."
                                        });
                                    }
                                }
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
};

exports.orderUpdateStatus = (req, res) => {
    try {
        const { ID, ORDER_STATUS, REMARK, EXPECTED_DATE_TIME, ACTUAL_DATE_TIME, IS_FIRST, WAREHOUSE_DETAILS, WEIGHT, LENGTH, BREADTH, HEIGHT, COURIER_ID, COURIER_DETAILS, INVENTORY_DETAILS, ACCEPTANCE_REMARK, SHIPMENT_ID, IS_SHIP_ORDER, MANUAL_COURIER_URL } = req.body;

        let LogArrays = [];
        var supportKey = req.headers['supportkey'];
        const systemDate = mm.getSystemDate();
        let setData = "";
        var recordData = [];


        if (ORDER_STATUS == "OA" || ORDER_STATUS == "OK") {
            if (!WAREHOUSE_DETAILS || !INVENTORY_DETAILS) {
                return res.send({
                    code: 400,
                    message: "WAREHOUSE_DETAILS and INVENTORY_DETAILS is required."
                });
            }
        }

        if (ORDER_STATUS === "OA") {

            setData = "ORDER_STATUS_ID = ?,IS_SHIP_ORDER=?,  CREATED_MODIFIED_DATE = ?";
            recordData.push(2, IS_SHIP_ORDER, systemDate, ID);
        }
        else if (ORDER_STATUS === "OR") {

            setData = "ORDER_STATUS_ID = ?,REJECTION_REMARK=?,CREATED_MODIFIED_DATE = ?";
            recordData.push(3, REMARK, systemDate, ID);
        }
        else if (ORDER_STATUS === "ON") {

            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?,EXPECTED_PREAPARATION_DATETIME=?,ACTUAL_PREAPARATION_DATETIME=?";
            recordData.push(4, systemDate, EXPECTED_DATE_TIME, mm.getSystemDate(), ID);
        }
        else if (ORDER_STATUS === "OK") {

            setData = "ORDER_STATUS_ID = ?,IS_SHIP_ORDER=?,  CREATED_MODIFIED_DATE = ?,EXPECTED_PACKAGING_DATETIME=?,ACTUAL_PACKAGING_DATETIME=?,STOCK_TAKEN_WAREHOUSE = ?, WAREHOUSE_DETAILS = ?,ACCEPTANCE_REMARK=?,WAREHOUSE_ID=?";
            recordData.push(5, IS_SHIP_ORDER, systemDate, EXPECTED_DATE_TIME, mm.getSystemDate(), WAREHOUSE_DETAILS[0].ID, JSON.stringify(WAREHOUSE_DETAILS), ACCEPTANCE_REMARK, WAREHOUSE_DETAILS[0].ID, ID);
        }
        else if (ORDER_STATUS === "OD") {

            setData = "ORDER_STATUS_ID = ?,  CREATED_MODIFIED_DATE = ?,EXPECTED_DISPATCH_DATETIME=?,ACTUAL_DISPATCH_DATETIME=?";
            recordData.push(6, systemDate, EXPECTED_DATE_TIME, mm.getSystemDate(), ID);
        }
        else if (ORDER_STATUS === "OS") {

            setData = "ORDER_STATUS_ID = ?,DELIVERY_DATE=?,  CREATED_MODIFIED_DATE = ?";
            recordData.push(7, systemDate, mm.getSystemDate(), ID);
        }
        else if (ORDER_STATUS == 'SC') {

            setData = "WEIGHT=?,LENGTH=?,BREADTH=?,HEIGHT=?,COURIER_ID=?,COURIER_DETAILS=?,  CREATED_MODIFIED_DATE = ?";
            recordData.push(WEIGHT, LENGTH, BREADTH, HEIGHT, COURIER_ID, JSON.stringify(COURIER_DETAILS), mm.getSystemDate(), ID);
        }
        else if (ORDER_STATUS == 'OC') {

            setData = "ORDER_STATUS_ID = ?, ORDER_CANCELLED_DATE=?,` CREATED_MODIFIED_DATE = ?";
            recordData.push(8, systemDate, systemDate, ID);
        }
        else if (ORDER_STATUS == 'DO') {

            setData = "ORDER_STATUS_ID = ?,ORDER_OUT_FOR_DELIVERY_DATE=?,MANUAL_COURIER_URL=?,  CREATED_MODIFIED_DATE = ?";
            recordData.push(13, systemDate, MANUAL_COURIER_URL, systemDate, ID);
        }
        else {
            setData = " CREATED_MODIFIED_DATE = ?";
            recordData.push(mm.getSystemDate(), ID);

        }

        const query = `UPDATE ${shopOrderMaster} SET ${setData} WHERE ID = ?`;
        const connection = mm.openConnection();
        mm.executeDML(query, recordData, supportKey, connection, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    code: 400,
                    message: "Failed to update orderMaster information."
                });
            } else {

                mm.executeDML(`SELECT ID, DATE(ORDER_DATE_TIME)ORDER_DATE,PICKUP_LOCATION,CUSTOMER_NAME,SERVICE_ADDRESS,PINCODE,STATE_NAME,COUNTRY_NAME,EMAIL,MOBILE_NO,IF(PAYMENT_MODE='COD','COD','Prepaid')PAYMENT_METHOD,COUPON_AMOUNT,FINAL_AMOUNT,CUSTOMER_ID,ORDER_NUMBER,CLIENT_ID,PAYMENT_MODE,PAYMENT_STATUS ,TOTAL_AMOUNT,WAREHOUSE_DETAILS,CUSTOMER_TYPE FROM view_shop_order_master where ID = ? `, ID, supportKey, connection, (error, results1) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        mm.rollbackConnection(connection);
                        console.log(error);
                        res.status(400).json({
                            code: 400,
                            message: "Failed to update orderMaster information."
                        });
                    } else {
                        mm.executeDML(`select * FROM shop_order_details where ORDER_ID = ? `, ID, supportKey, connection, (error, results2) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                console.log(error);
                                res.status(400).json({
                                    code: 400,
                                    message: "Failed to update orderMaster information."
                                });
                            } else {
                                var DESCRIPTION = '';
                                var TITLE = '';
                                if (ORDER_STATUS === "OA") {
                                    TITLE = 'Order Accepted'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                } else if (ORDER_STATUS === "OR") {
                                    TITLE = 'Order Rejected'
                                    DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                } else if (ORDER_STATUS === "ON") {
                                    TITLE = 'Order Prepared'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been prepared. will notify you once it confirmed.`
                                }
                                else if (ORDER_STATUS === "OK") {
                                    TITLE = 'Order Packaged'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been packaged. will notify you once it confirmed.`
                                }
                                else if (ORDER_STATUS === "OD") {
                                    TITLE = 'Order Dispatched'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been dispatched. will notify you once it confirmed.`
                                }
                                else if (ORDER_STATUS === "OS") {
                                    TITLE = 'Order Deliverd'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been deliverd.`
                                }
                                else if (ORDER_STATUS === "OC") {
                                    TITLE = 'Order Cancelled'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been cancelled.`
                                }
                                else if (ORDER_STATUS === "DO") {
                                    TITLE = 'Order out for delivery'
                                    DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been out for delivery.`
                                }

                                if (ORDER_STATUS == 'OD') {
                                    mm.commitConnection(connection);
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for the customer ${results1[0].CUSTOMER_NAME}.`
                                    const logData = { ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null), ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null }
                                    dbm.saveLog(logData, shopOrderActionLog);

                                    if (results1[0].CUSTOMER_TYPE == 'I') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                    }
                                    if (ORDER_STATUS == 'OA' || ORDER_STATUS == 'OK') {
                                        mm.sendDynamicEmail(19, ID, supportKey)
                                        setTimeout(() => {
                                            mm.sendDynamicEmail(18, ID, supportKey)
                                        }, 1000);
                                    } else if (ORDER_STATUS == 'OS') {
                                        mm.sendDynamicEmail(20, ID, supportKey)
                                    } else {
                                        mm.sendDynamicEmail(18, ID, supportKey)
                                    }
                                    res.status(200).json({
                                        code: 200,
                                        message: "OrderMaster information updated successfully."
                                    });
                                }
                                else if (ORDER_STATUS === "OA" || ORDER_STATUS === "OK") {
                                    if (INVENTORY_DETAILS) {
                                        mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,ORDER_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [INVENTORY_DETAILS], supportKey, connection, (error, transactions) => {
                                            if (error) {
                                                console.log(` Error adding transaction logs`, error);
                                                mm.rollbackConnection(connection);
                                                res.send({
                                                    code: 400,
                                                    message: "Failed to update Order Status."
                                                });
                                                console.log("Failed to insert transaction by system.")
                                            }
                                            else {
                                                if (results2.length === 0) {
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        code: 400,
                                                        message: "No items to update."
                                                    });
                                                } else {
                                                    const warehouseId = WAREHOUSE_DETAILS[0].ID;
                                                    const updateCases = results2.map(item => `WHEN ITEM_ID = ${item.INVENTORY_ID} THEN CURRENT_STOCK - ${item.QUANTITY}`).join(" ");
                                                    const itemIds = results2.map(item => item.INVENTORY_ID).join(", ");
                                                    const updateQuery = `
                                                    UPDATE inventory_warehouse_stock_management
                                                    SET CURRENT_STOCK = CASE ${updateCases} END
                                                    WHERE WAREHOUSE_ID = ? AND ITEM_ID IN (${itemIds})`;
                                                    mm.executeDML(updateQuery, [warehouseId], supportKey, connection, (error, serviceData) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            console.error("Error updating stock:", error);
                                                            res.send({
                                                                code: 400,
                                                                message: "Failed to update Order Status."
                                                            });
                                                        }
                                                        else {
                                                            mm.commitConnection(connection);
                                                            var TITLE = 'Order Accepted'
                                                            var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                                            mm.sendNotificationToAdmin(8, "Order Accepted", `Hello Admin, A new order ${results1[0].ORDER_NUMBER} has been accepted on ${mm.getSystemDate()}. Please review it.`, "", "O", supportKey, "S", results1);
                                                            var TITLE2 = 'Order Packaged'
                                                            var DESCRIPTION2 = `Your order ${results1[0].ORDER_NUMBER} has been packaged. Will notify you once it confirmed.`
                                                            mm.sendNotificationToAdmin(8, "Order Packaged", `Hello Admin, order ${results1[0].ORDER_NUMBER} has been packaged on ${mm.getSystemDate}. Ready for dispatch. Please proceed with the next steps.`, "", "O", supportKey, "S", results1);
                                                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE2}`, `${DESCRIPTION2}`, "", "O", supportKey, "N", "S", results1);
                                                            if (results1[0].CUSTOMER_TYPE == 'I') {
                                                                sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                                                sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, null, results1[0].MOBILE_NO, "shop_order_accepted", REMARK)
                                                            }
                                                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} for customer ${results1[0].CUSTOMER_NAME}.`
                                                            var logData = {
                                                                ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null
                                                            }
                                                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE2} for customer ${results1[0].CUSTOMER_NAME}.`
                                                            var logData2 = {
                                                                ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE2, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                                                            }
                                                            dbm.saveLog(logData, shopOrderActionLog);
                                                            dbm.saveLog(logData2, shopOrderActionLog);
                                                            if (ORDER_STATUS == 'OA' || ORDER_STATUS == 'OK') {
                                                                mm.sendDynamicEmail(19, ID, supportKey)
                                                                setTimeout(() => {
                                                                    mm.sendDynamicEmail(18, ID, supportKey)
                                                                }, 1000);
                                                            } else if (ORDER_STATUS == 'OS') {
                                                                mm.sendDynamicEmail(20, ID, supportKey)
                                                            } else {
                                                                mm.sendDynamicEmail(18, ID, supportKey)
                                                            }
                                                            res.status(200).json({
                                                                code: 200,
                                                                message: "OrderMaster information updated successfully."
                                                            });
                                                        }
                                                    })
                                                }
                                            }
                                        });
                                    } else {
                                        res.status(400).json({
                                            code: 400,
                                            message: "INVENTORY_DETAILS is required. for order status OA or OK."
                                        });
                                    }
                                }
                                else if (ORDER_STATUS == 'SC') {
                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created order ${results1[0].ORDER_NUMBER} in shiprocket of the customer ${results1[0].CUSTOMER_NAME}.`
                                    const logData = {
                                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order Created In Shiprocket', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: systemDate, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                                    }

                                    shipOrderCreate(results1, results2, results1[0].PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, res, logData, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)
                                }
                                else if (ORDER_STATUS == 'AO') {
                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has assign order ${results1[0].ORDER_NUMBER} to courier of the customer ${results1[0].CUSTOMER_NAME}.`
                                    const logData = {
                                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order Assigned', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: systemDate, ORDER_SHIP_ASSIGN_DATETIME: systemDate, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                                    }
                                    shipAssignOrder(results1, COURIER_ID, ID, SHIPMENT_ID, connection, supportKey, res, logData, results1, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)

                                }
                                else if (ORDER_STATUS == 'GL') {
                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has generated label for the order ${results1[0].ORDER_NUMBER} of the customer ${results1[0].CUSTOMER_NAME}.`
                                    const logData = {
                                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Label Generated', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: null, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: systemDate, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                                    }
                                    shipGenrateLabel(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)
                                }
                                else if (ORDER_STATUS == 'SP') {
                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has send the order ${results1[0].ORDER_NUMBER} for pickup of the customer ${results1[0].CUSTOMER_NAME}.`
                                    const logData = {
                                        ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Sent For Pickup', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: systemDate, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: systemDate, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                                    }
                                    shipPickup(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, REMARK)
                                }
                                else {
                                    mm.commitConnection(connection);
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has marked the order ${results1[0].ORDER_NUMBER} as ${TITLE} of the customer ${results1[0].CUSTOMER_NAME}.`
                                    const logData = { ORDER_ID: ID, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: TITLE, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? EXPECTED_DATE_TIME : null), EXPECTED_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? EXPECTED_DATE_TIME : null), EXPECTED_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? EXPECTED_DATE_TIME : null), ACTUAL_PREAPARATION_DATETIME: (ORDER_STATUS == 'ON' ? ACTUAL_DATE_TIME : null), ACTUAL_PACKAGING_DATETIME: (ORDER_STATUS == 'OK' ? ACTUAL_DATE_TIME : null), ACTUAL_DISPATCH_DATETIME: (ORDER_STATUS == 'OD' ? ACTUAL_DATE_TIME : null), ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null }
                                    dbm.saveLog(logData, shopOrderActionLog);
                                    if (results1[0].CUSTOMER_TYPE == 'I' && ORDER_STATUS == 'OS') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_delivered", REMARK)
                                    }
                                    else if (results1[0].CUSTOMER_TYPE == 'I') {
                                        sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                    }
                                    if (ORDER_STATUS == 'OA' || ORDER_STATUS == 'OK') {
                                        mm.sendDynamicEmail(19, ID, supportKey)
                                        setTimeout(() => {
                                            mm.sendDynamicEmail(18, ID, supportKey)
                                        }, 1000);
                                    } else if (ORDER_STATUS == 'OS') {
                                        mm.sendDynamicEmail(20, ID, supportKey)
                                    } else {
                                        mm.sendDynamicEmail(18, ID, supportKey)
                                    }
                                    res.status(200).json({
                                        code: 200,
                                        message: "OrderMaster information updated successfully."
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
};

exports.courierServiceability = (req, res) => {
    const { PICKUP_PINCODE, DELIVERY_PINCODE, WEIGHT, LENGTH, BREADTH, HEIGHT } = req.body
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                const body = {
                    "pickup_postcode": PICKUP_PINCODE,
                    "delivery_postcode": DELIVERY_PINCODE,
                    "cod": 0,
                    "weight": WEIGHT,
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT
                }
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/serviceability',
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: body,
                    method: "get",
                    json: true
                }

                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to save pickupLocation information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "PickupLocation information saved successfully...",
                            "DATA": body
                        });
                    }
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
};

exports.trackThroughShipmentId = (req, res) => {
    const { SHIPMENT_ID } = req.params.shipment_id
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/track/shipment/' + SHIPMENT_ID,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: {},
                    method: "get",
                    json: true
                }

                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to get Tracking information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "Tracking information get successfully...",
                            "DATA": body
                        });
                    }
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
};

exports.trackThroughOrderId = (req, res) => {
    const ORDER_ID = req.params.order_id
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/track/order/' + ORDER_ID,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: {},
                    method: "get",
                    json: true
                }
                console.log("options", options)
                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to get Tracking information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "Tracking information get successfully...",
                            "DATA": body
                        });
                    }
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
};

exports.trackThroughAwbCode = (req, res) => {
    const AWB_CODE = req.params.awbCode
    var supportKey = req.headers['supportkey'];
    try {
        token.createToken(supportKey, (error, result) => {
            if (error) {
                console.log("error", error)
                res.status(400).json({
                    "message": "Failed to save pickupLocation information..."
                });
            }
            else {
                var options = {
                    url: 'https://apiv2.shiprocket.in/v1/external/courier/track/awb/' + AWB_CODE,
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": "Bearer " + result
                    },
                    body: {},
                    method: "get",
                    json: true
                }
                console.log("options", options)
                request(options, (error, response, body) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        res.status(400).json({
                            "message": "Failed to get Tracking information...",
                        });
                    } else {
                        res.status(200).json({
                            "message": "Tracking information get successfully...",
                            "DATA": body
                        });
                    }
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
};

function sendToShipRocketOld(results1, results2, PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, callback) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection);
                callback(error);
            }
            else {
                var ORDER_DETAILS = []
                for (let i = 0; i < results2.length; i++) {
                    var elemet = {
                        "name": results2[i].PRODUCT_NAME,
                        "sku": `${results2[i].PRODUCT_NAME}${results2[i].ID}`,
                        "units": results2[i].QUANTITY,
                        "selling_price": results2[i].TAX_INCLUSIVE_AMOUNT,
                        "discount": "",
                        "tax": results2[i].TAX_AMOUNT,
                        "hsn": ""
                    }
                    ORDER_DETAILS.push(elemet)
                }
                const createOrderBody = {
                    "order_id": results1[0].ID,
                    "order_date": results1[0].ORDER_DATE,
                    "pickup_location": PICKUP_LOCATION,
                    "channel_id": "",
                    "comment": "",
                    "reseller_name": "",
                    "company_name": "",
                    "billing_customer_name": results1[0].CUSTOMER_NAME,
                    "billing_last_name": "",
                    "billing_address": results1[0].SERVICE_ADDRESS,
                    "billing_isd_code": "",
                    "billing_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "billing_pincode": results1[0].PINCODE.split("-")[0],
                    "billing_state": results1[0].STATE_NAME,
                    "billing_country": results1[0].COUNTRY_NAME,
                    "billing_email": results1[0].EMAIL,
                    "billing_phone": results1[0].MOBILE_NO,
                    "billing_alternate_phone": "",
                    "shipping_is_billing": false,
                    "shipping_customer_name": results1[0].CUSTOMER_NAME,
                    "shipping_last_name": "",
                    "shipping_address": results1[0].SERVICE_ADDRESS,
                    "shipping_address_2": "",
                    "shipping_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "shipping_pincode": results1[0].PINCODE.split("-")[0],
                    "shipping_country": results1[0].COUNTRY_NAME,
                    "shipping_state": results1[0].STATE_NAME,
                    "shipping_email": results1[0].EMAIL,
                    "shipping_phone": results1[0].MOBILE_NO,
                    "order_items": ORDER_DETAILS,
                    "payment_method": results1[0].PAYMENT_METHOD,
                    "shipping_charges": 0,
                    "giftwrap_charges": 0,
                    "transaction_charges": 0,
                    "total_discount": results1[0].COUPON_AMOUNT,
                    "sub_total": (results1[0].FINAL_AMOUNT ? results1[0].FINAL_AMOUNT : results1[0].TOTAL_AMOUNT),
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT,
                    "weight": WEIGHT,
                    "ewaybill_no": "",
                    "customer_gstin": "",
                    "invoice_number": "",
                    "order_type": ""
                }
                // CREATE ORDER
                var createOrderOptions = requestPost('orders/create/adhoc', result3, createOrderBody, "post")

                request(createOrderOptions, (error, response, createOrderData) => {
                    if (error) {
                        console.log("request error -send email ", error);
                        mm.rollbackConnection(connection);
                        callback(error);
                    } else {
                        var assignOrderBody = {
                            "shipment_id": createOrderData.shipment_id,
                            // "order_id":createOrderData.order_id,
                            "courier_id": COURIER_ID,
                        }

                        // ASSIGN ORDER
                        var assignOrderOptions = requestPost('/orders/assign_awb', result3, assignOrderBody, "post")

                        request(assignOrderOptions, (error, response, awbData) => {
                            if (error) {
                                console.log("request error -send email ", error);
                                mm.rollbackConnection(connection);
                                callback(error);
                            } else {
                                // GENRATE LABEL
                                var generateLableOptions = requestPost('/courier/generate/label?order_id=' + createOrderData.order_id, result3, {}, "get ")
                                request(generateLableOptions, (error, response, labelData) => {
                                    if (error) {
                                        console.log("request error -send email ", error);
                                        mm.rollbackConnection(connection);
                                        callback(error);
                                    } else {
                                        var PickupBody = {
                                            "shipment_id": createOrderData.shipment_id
                                        }

                                        // SEND PICKUP
                                        var pickupOptions = requestPost('/courier/pickup' + createOrderData.order_id, result3, PickupBody, "post ")
                                        request(pickupOptions, (error, response, pickupData) => {
                                            if (error) {
                                                console.log("request error -send email ", error);
                                                mm.rollbackConnection(connection);
                                                callback(error);
                                            } else {
                                                mm.executeDML('UPDATE shop_order_master SET ORDER_ID=?,SHIPMENT_ID=?,AWB_CODE=? WHERE ID=?', [createOrderData.order_id, createOrderData.shipment_id, awbData.response.data.awb_code, labelData.label_url, ID], supportKey, connection, (error, results4) => {
                                                    if (error) {
                                                        console.log(error);
                                                        mm.rollbackConnection(connection)
                                                        callback(error);
                                                    }
                                                    else {
                                                        // mm.commitConnection(connection)
                                                        callback(null);
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
            }
        })
    } catch (error) {
        console.error("Error parsing JSON string:", error.message);
        return null;
    }
}

function shipOrderCreate(results1, results2, PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, res, logData, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                mm.rollbackConnection(connection)
                console.log("error", error)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get shopOrder information."
                });
            }
            else {
                var ORDER_DETAILS = []
                for (let i = 0; i < results2.length; i++) {
                    var elemet = {
                        "name": results2[i].PRODUCT_NAME,
                        "sku": `${results2[i].PRODUCT_NAME}${results2[i].ID}`,
                        "units": results2[i].QUANTITY,
                        "selling_price": results2[i].TAX_INCLUSIVE_AMOUNT,
                        "discount": "",
                        "tax": results2[i].TAX_AMOUNT,
                        "hsn": ""
                    }
                    ORDER_DETAILS.push(elemet)
                }
                const createOrderBody = {
                    "order_id": results1[0].ID,
                    "order_date": results1[0].ORDER_DATE,
                    "pickup_location": PICKUP_LOCATION,
                    "channel_id": "",
                    "comment": "",
                    "reseller_name": "",
                    "company_name": "",
                    "billing_customer_name": results1[0].CUSTOMER_NAME,
                    "billing_last_name": "",
                    "billing_address": results1[0].SERVICE_ADDRESS,
                    "billing_isd_code": "",
                    "billing_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "billing_pincode": results1[0].PINCODE.split("-")[0],
                    "billing_state": results1[0].STATE_NAME,
                    "billing_country": results1[0].COUNTRY_NAME,
                    "billing_email": results1[0].EMAIL,
                    "billing_phone": results1[0].MOBILE_NO,
                    "billing_alternate_phone": "",
                    "shipping_is_billing": false,
                    "shipping_customer_name": results1[0].CUSTOMER_NAME,
                    "shipping_last_name": "",
                    "shipping_address": results1[0].SERVICE_ADDRESS,
                    "shipping_address_2": "",
                    "shipping_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "shipping_pincode": results1[0].PINCODE.split("-")[0],
                    "shipping_country": results1[0].COUNTRY_NAME,
                    "shipping_state": results1[0].STATE_NAME,
                    "shipping_email": results1[0].EMAIL,
                    "shipping_phone": results1[0].MOBILE_NO,
                    "order_items": ORDER_DETAILS,
                    "payment_method": results1[0].PAYMENT_METHOD,
                    "shipping_charges": 0,
                    "giftwrap_charges": 0,
                    "transaction_charges": 0,
                    "total_discount": results1[0].COUPON_AMOUNT,
                    "sub_total": (results1[0].FINAL_AMOUNT ? results1[0].FINAL_AMOUNT : results1[0].TOTAL_AMOUNT),
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT,
                    "weight": WEIGHT,
                    "ewaybill_no": "",
                    "customer_gstin": "",
                    "invoice_number": "",
                    "order_type": ""
                }
                // CREATE ORDER
                var createOrderOptions = requestPost('orders/create/adhoc', result3, createOrderBody, "post")
                request(createOrderOptions, (error, response, createOrderData) => {
                    logShiprocketCall(results1[0].ID, createOrderBody, createOrderData, 'orders/create/adhoc', supportKey);
                    if (createOrderData.order_id && createOrderData.status_code != 5) {
                        mm.executeDML('update shop_order_master set ORDER_STATUS_ID=?,ORDER_ID=?,SHIPMENT_ID=?,COURIER_ID=?,ORDER_SHIPROCKET_DATETIME=? where ID=?', ["9", createOrderData.order_id, createOrderData.shipment_id, COURIER_ID, mm.getSystemDate(), ID], supportKey, connection, (error, results4) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to get shopOrder information."
                                });
                            }
                            else {
                                var TITLE = 'Order placed in Shiprocket'
                                var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been placed and is now being processed.`
                                mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                dbm.saveLog(logData, shopOrderActionLog);
                                // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                if (results1[0].CUSTOMER_TYPE == 'I') {
                                    sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                }
                                mm.commitConnection(connection)
                                res.status(200).json({
                                    "message": "success",
                                });
                            }
                        });
                    } else {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to create order in shiprocket",
                        });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        return null;
    }
}
function shipAssignOrder(results1, COURIER_ID, ID, SHIPMENT_ID, connection, supportKey, res, logData, results1, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get shopOrder information."
                });
            }
            else {
                var assignOrderBody = {
                    "shipment_id": SHIPMENT_ID,
                    "courier_id": COURIER_ID,
                }

                // ASSIGN ORDER
                var assignOrderOptions = requestPost('courier/assign/awb', result3, assignOrderBody, "post")
                request(assignOrderOptions, (error, response, awbData) => {
                    logShiprocketCall(results1[0].ID, assignOrderBody, awbData, 'courier/assign/awb', supportKey);
                    if (awbData.message) {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to assign order in shiprocket",
                        });
                    }
                    else {
                        mm.executeDML('update shop_order_master set ORDER_STATUS_ID=?,ORDER_SHIP_ASSIGN_DATETIME=?,AWB_CODE=? where ID=?', [10, mm.getSystemDate(), awbData.response.data.awb_code, ID], supportKey, connection, (error, results4) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to get shopOrder information."
                                });
                            }
                            else {
                                var TITLE = 'Order Assigned'
                                var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been assigned to courier.`
                                mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                dbm.saveLog(logData, shopOrderActionLog);
                                // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                if (results1[0].CUSTOMER_TYPE == 'I') {
                                    sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                }
                                mm.commitConnection(connection)
                                res.status(200).json({
                                    "code": 200,
                                    "message": "success",
                                });
                            }
                        });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        res.status(500).json({
            "code": 500,
            "message": "success",
        });
    }
}

function shipGenrateLabel(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get shopOrder information."
                });
            }
            else {
                var PickupBody = {
                    "shipment_id": [SHIPMENT_ID]
                }
                var generateLableOptions = requestPost('courier/generate/label', result3, PickupBody, "post")
                request(generateLableOptions, (error, response, labelData) => {
                    logShiprocketCall(results1[0].ID, PickupBody, labelData, 'courier/generate/label', supportKey);
                    if (labelData.label_created == 0) {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to generate label in shiprocket",
                        });
                    }
                    else {
                        mm.executeDML('update shop_order_master set ORDER_STATUS_ID=?,LABEL_URL=?,ORDER_LABEL_DATETIME=? where ID=?', ["11", labelData.label_url, mm.getSystemDate(), ID], supportKey, connection, (error, results4) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to get shopOrder information."
                                });
                            }
                            else {
                                var TITLE = 'Order Label Generated'
                                var DESCRIPTION = `Label generated for your order ${results1[0].ORDER_NUMBER}.`
                                mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                dbm.saveLog(logData, shopOrderActionLog);
                                // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                if (results1[0].CUSTOMER_TYPE == 'I') {
                                    sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                }
                                mm.commitConnection(connection)
                                res.status(200).json({
                                    "code": 200,
                                    "message": "success",
                                });
                            }
                        });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        res.status(500).json({
            "code": 500,
            "message": "success",
        });
    }
}

function shipPickup(results1, SHIPMENT_ID, ID, connection, supportKey, res, logData, results1, USER_ID, CUSTOMER_ID, REMARK) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                mm.rollbackConnection(connection)
                console.error("Error parsing JSON string:", error.message);
                res.status(400).json({
                    "code": 400,
                    "message": "success",
                });
            }
            else {
                var PickupBody = {
                    "shipment_id": [SHIPMENT_ID]
                }
                // SEND PICKUP
                var pickupOptions = requestPost('courier/generate/pickup', result3, PickupBody, "post")
                request(pickupOptions, (error, response, pickupData) => {
                    logShiprocketCall(results1[0].ID, PickupBody, pickupData, 'courier/generate/pickup', supportKey);
                    if (!pickupData.message) {
                        mm.executeDML('update shop_order_master set ORDER_STATUS_ID=?,PICKUP_SCHEDULED_DATE=?,ORDER_PICKUP_DATETIME=? where ID=?', ["12", pickupData.response.pickup_scheduled_date, mm.getSystemDate(), ID], supportKey, connection, (error, results4) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to get shopOrder information."
                                });
                            }
                            else {
                                var TITLE = 'Order Sent For Pickup'
                                var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been sent for pickup.`
                                mm.sendNotificationToChannel(USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                                dbm.saveLog(logData, shopOrderActionLog);
                                // mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                if (results1[0].CUSTOMER_TYPE == 'I') {
                                    sendWpMessage(results1[0].CUSTOMER_NAME, results1[0].ORDER_NUMBER, TITLE, results1[0].MOBILE_NO, "shop_order_updates", REMARK)
                                }
                                mm.commitConnection(connection)
                                res.status(200).json({
                                    "code": 200,
                                    "message": "success",
                                });
                            }
                        });
                    } else {
                        mm.rollbackConnection(connection)
                        res.status(301).json({
                            "code": 301,
                            "message": "Failed to create order in shiprocket",
                        });
                    }
                });
            }
        })
    } catch (error) {
        mm.rollbackConnection(connection)
        console.error("Error parsing JSON string:", error.message);
        res.status(500).json({
            "code": 500,
            "message": "success",
        });
    }
}

function sendToShipRocket(results1, results2, PICKUP_LOCATION, COURIER_ID, ID, WEIGHT, LENGTH, BREADTH, HEIGHT, connection, supportKey, callback) {
    try {
        token.createToken(supportKey, (error, result3) => {
            if (error) {
                console.log("error", error)
                callback(error);
            }
            else {
                var ORDER_DETAILS = []
                for (let i = 0; i < results2.length; i++) {
                    var elemet = {
                        "name": results2[i].PRODUCT_NAME,
                        "sku": `${results2[i].PRODUCT_NAME}${results2[i].ID}`,
                        "units": results2[i].QUANTITY,
                        "selling_price": results2[i].TAX_INCLUSIVE_AMOUNT,
                        "discount": "",
                        "tax": results2[i].TAX_AMOUNT,
                        "hsn": ""
                    }
                    ORDER_DETAILS.push(elemet)
                }
                const createOrderBody = {
                    "order_id": results1[0].ID,
                    "order_date": results1[0].ORDER_DATE,
                    "pickup_location": PICKUP_LOCATION,
                    "channel_id": "",
                    "comment": "",
                    "reseller_name": "",
                    "company_name": "",
                    "billing_customer_name": results1[0].CUSTOMER_NAME,
                    "billing_last_name": "",
                    "billing_address": results1[0].SERVICE_ADDRESS,
                    "billing_isd_code": "",
                    "billing_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "billing_pincode": results1[0].PINCODE.split("-")[0],
                    "billing_state": results1[0].STATE_NAME,
                    "billing_country": results1[0].COUNTRY_NAME,
                    "billing_email": results1[0].EMAIL,
                    "billing_phone": results1[0].MOBILE_NO,
                    "billing_alternate_phone": "",
                    "shipping_is_billing": false,
                    "shipping_customer_name": results1[0].CUSTOMER_NAME,
                    "shipping_last_name": "",
                    "shipping_address": results1[0].SERVICE_ADDRESS,
                    "shipping_address_2": "",
                    "shipping_city": results1[0].PINCODE.split("-")[0].split(" ")[0],
                    "shipping_pincode": results1[0].PINCODE.split("-")[0],
                    "shipping_country": results1[0].COUNTRY_NAME,
                    "shipping_state": results1[0].STATE_NAME,
                    "shipping_email": results1[0].EMAIL,
                    "shipping_phone": results1[0].MOBILE_NO,
                    "order_items": ORDER_DETAILS,
                    "payment_method": results1[0].PAYMENT_METHOD,
                    "shipping_charges": 0,
                    "giftwrap_charges": 0,
                    "transaction_charges": 0,
                    "total_discount": results1[0].COUPON_AMOUNT,
                    "sub_total": (results1[0].FINAL_AMOUNT ? results1[0].FINAL_AMOUNT : results1[0].TOTAL_AMOUNT),
                    "length": LENGTH,
                    "breadth": BREADTH,
                    "height": HEIGHT,
                    "weight": WEIGHT,
                    "ewaybill_no": "",
                    "customer_gstin": "",
                    "invoice_number": "",
                    "order_type": ""
                }
                // CREATE ORDER
                var createOrderOptions = requestPost('orders/create/adhoc', result3, createOrderBody, "post")
                request(createOrderOptions, (error, response, createOrderData) => {
                    console.log("createOrderData", createOrderData)
                    console.log("error", error)
                    logShiprocketCall(results1[0].ID, createOrderBody, createOrderData, 'orders/create/adhoc', supportKey);
                    if (createOrderData.order_id && createOrderData.status_code != 5) {
                        var assignOrderBody = {
                            "shipment_id": createOrderData.shipment_id,
                            "courier_id": COURIER_ID,
                        }

                        // ASSIGN ORDER
                        var assignOrderOptions = requestPost('courier/assign/awb', result3, assignOrderBody, "post")
                        request(assignOrderOptions, (error, response, awbData) => {
                            logShiprocketCall(results1[0].ID, assignOrderBody, awbData, 'courier/assign/awb', supportKey);
                            console.log("awbData", awbData);
                            if (awbData.message) {
                                if (error) {
                                    callback(error);
                                }
                                else {
                                    error = "error"
                                    callback(error)
                                }
                            } else {
                                // GENRATE LABEL
                                var PickupBody = {
                                    "shipment_id": [createOrderData.shipment_id]
                                }
                                var generateLableOptions = requestPost('courier/generate/label', result3, PickupBody, "post")
                                request(generateLableOptions, (error, response, labelData) => {
                                    logShiprocketCall(results1[0].ID, PickupBody, labelData, 'courier/generate/label', supportKey);
                                    console.log("labelData", labelData);
                                    if (labelData.success) {
                                        if (error) {
                                            callback(error);
                                        }
                                        else {
                                            error = "error"
                                            callback(error)
                                        }
                                    } else {
                                        var PickupBody = {
                                            "shipment_id": [createOrderData.shipment_id]
                                        }
                                        // SEND PICKUP
                                        var pickupOptions = requestPost('courier/generate/pickup', result3, PickupBody, "post")
                                        request(pickupOptions, (error, response, pickupData) => {
                                            console.log("pickupData", pickupData);
                                            logShiprocketCall(results1[0].ID, PickupBody, pickupData, 'courier/generate/pickup', supportKey);
                                            if (pickupData.pickup_status) {
                                                if (error) {
                                                    callback(error);
                                                }
                                                else {
                                                    error = "error"
                                                    callback(error)
                                                }
                                                mm.executeDML('UPDATE shop_order_master SET ORDER_ID=?,SHIPMENT_ID=?,AWB_CODE=?,LABEL_URL=?,PICKUP_SCHEDULED_DATE=? WHERE ID=?', [createOrderData.order_id, createOrderData.shipment_id, awbData.response.data.awb_code, labelData.label_url, null, ID], supportKey, connection, (error, results4) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback(error);
                                                    }
                                                    else {
                                                        callback(null);
                                                    }
                                                });

                                            } else {
                                                mm.executeDML('UPDATE shop_order_master SET ORDER_ID=?,SHIPMENT_ID=?,AWB_CODE=?,LABEL_URL=?,PICKUP_SCHEDULED_DATE=? WHERE ID=?', [createOrderData.order_id, createOrderData.shipment_id, awbData.response.data.awb_code, labelData.label_url, null, ID], supportKey, connection, (error, results4) => {
                                                    if (error) {
                                                        console.log(error);
                                                        callback(error);
                                                    }
                                                    else {
                                                        console.log("error ")
                                                        callback(error);
                                                    }
                                                });

                                            }
                                        });
                                    }
                                });
                            }
                        });

                    } else {
                        if (error) {
                            callback(error);
                        }
                        else {
                            error = "error"
                            callback(error)
                        }
                    }
                });
            }
        })
    } catch (error) {
        console.error("Error parsing JSON string:", error.message);
        return null;
    }
}

function requestPost(url, token, body, method) {
    var options = {
        url: 'https://apiv2.shiprocket.in/v1/external/' + url,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        },
        body: body,
        method: method,
        json: true
    }
    console.log("options", options)
    return options
}

exports.updateOrderDelivery1 = (req, res) => {
    const { order_id, shipment_status, current_status, etd } = req.body;
    var systemDate = mm.getSystemDate()
    var supportKey = req.headers['supportkey'];
    try {
        if (shipment_status == 'Delivered' || current_status == 'Delivered') {
            mm.executeQueryData(`UPDATE ` + shopOrderMaster + ` SET ORDER_STATUS=?,SHIPROCKET_FINAL_RESPONSE=?,DELIVERY_DATE=?, CREATED_MODIFIED_DATE =?,ORDER_STATUS_ID=? where ID =? `, ["OS", JSON.stringify(req.body), etd, systemDate, 7, order_id], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.status(200).json({
                        "message": "Failed to update shopOrder information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "ShopOrder information updated successfully...",
                    });
                }
            });
        } else if (shipment_status == 'Cancelled' || current_status == 'Cancelled') {
            mm.executeQueryData(`UPDATE ` + shopOrderMaster + ` SET ORDER_STATUS=?,SHIPROCKET_FINAL_RESPONSE=?,DELIVERY_DATE=?, CREATED_MODIFIED_DATE =?,ORDER_STATUS_ID=? where ID =? `, ["OC", JSON.stringify(req.body), etd, systemDate, 7, order_id], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.status(200).json({
                        "message": "Failed to update shopOrder information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "ShopOrder information updated successfully...",
                    });
                }
            });
        }
        else {
            res.status(200).json({
                "message": "ShopOrder information updated successfully...",
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

function logShiprocketCall(orderId, requestData, responseData, apiEndpoint, supportKey) {
    console.log("logShiprocketCall")
    const sql = 'INSERT INTO shiprocket_logs (ORDER_ID, REQUEST, RESPONSE, API,CLIENT_ID) VALUES (?, ?, ?, ?,? )';
    const values = [
        orderId,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        apiEndpoint,
        "1"
    ];
    mm.executeQueryData(sql, values, supportKey, (err, res) => {
        if (err) console.log("Logging error:", err);
        else
            console.log("sucess")
    });
}


exports.updateOrderDelivery = (req, res) => {
    const { order_id, shipment_status, current_status, etd } = req.body;
    var systemDate = mm.getSystemDate()
    var supportKey = req.headers['supportkey'];
    try {
        if (shipment_status == 'DELIVERED' || current_status == 'DELIVERED') {
            mm.executeQueryData(`UPDATE ` + shopOrderMaster + ` SET ORDER_STATUS_ID=?,SHIPROCKET_FINAL_RESPONSE=?,DELIVERY_DATE=?, CREATED_MODIFIED_DATE =? where ID =? `, [7, JSON.stringify(req.body), etd, systemDate, order_id], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.status(200).json({
                        "message": "Failed to update shopOrder information."
                    });
                }
                else {
                    mm.executeQueryData(`select * from view_shop_order_master WHERE ID=?`, [order_id], supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            res.status(200).json({
                                "message": "Failed to update shopOrder information."
                            });
                        }
                        else {
                            var ACTION_DETAILS = `Shiprocket has deliver the order ${results1[0].ORDER_NUMBER} for the customer ${results1[0].CUSTOMER_NAME}.`
                            const logData = {
                                ORDER_ID: order_id, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: 0, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order Delivered', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: "Shiprocket", EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: null, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: systemDate
                            }
                            var TITLE = 'Order Delivered'
                            var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been delivered.`
                            mm.sendNotificationToChannel(0, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                            dbm.saveLog(logData, shopOrderActionLog);
                            mm.sendDynamicEmail(20, order_id, supportKey)
                            res.status(200).json({
                                "message": "ShopOrder information updated successfully...",
                            });
                        }
                    });
                }
            });
        } else if (shipment_status == 'Cancelled' || current_status == 'Cancelled') {
            mm.executeQueryData(`UPDATE ` + shopOrderMaster + ` SET ORDER_STATUS_ID=?,SHIPROCKET_FINAL_RESPONSE=?,ORDER_CANCELLED_DATE=?, CREATED_MODIFIED_DATE =? where ID =? `, [8, JSON.stringify(req.body), etd, systemDate, order_id], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.status(200).json({
                        "message": "Failed to update shopOrder information."
                    });
                }
                else {
                    mm.executeQueryData(`select * from view_shop_order_master WHERE ID=?`, [order_id], supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            res.status(200).json({
                                "message": "Failed to update shopOrder information."
                            });
                        }
                        else {
                            var ACTION_DETAILS = `Shiprocket has cancelled the order ${results1[0].ORDER_NUMBER} for the customer ${results1[0].CUSTOMER_NAME}.`
                            const logData = {
                                ORDER_ID: order_id, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: 0, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Order cancelled', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: "Shiprocket", EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: null, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: systemDate, ORDER_OUT_FOR_DELIVERY_DATETIME: null, ORDER_DELIVERY_DATETIME: null
                            }
                            var TITLE = 'Order cancelled'
                            var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been cancelled.`
                            mm.sendNotificationToChannel(0, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                            mm.sendDynamicEmail(18, order_id, supportKey)
                            dbm.saveLog(logData, shopOrderActionLog);
                            res.status(200).json({
                                "message": "ShopOrder information updated successfully...",
                            });
                        }
                    });
                }
            });
        } else if (shipment_status == 'OUT FOR DELIVERY' || current_status == 'OUT FOR DELIVERY') {
            mm.executeQueryData(`UPDATE ` + shopOrderMaster + ` SET ORDER_STATUS_ID=?,SHIPROCKET_FINAL_RESPONSE=?,ORDER_OUT_FOR_DELIVERY_DATE=?, CREATED_MODIFIED_DATE =? where ID =? `, [13, JSON.stringify(req.body), etd, systemDate, order_id], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.status(200).json({
                        "message": "Failed to update shopOrder information."
                    });
                }
                else {
                    mm.executeQueryData(`select * from view_shop_order_master WHERE ID=?`, [order_id], supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            res.status(200).json({
                                "message": "Failed to update shopOrder information."
                            });
                        }
                        else {
                            var ACTION_DETAILS = `Shiprocket has out for devlivery of the order ${results1[0].ORDER_NUMBER} for the customer ${results1[0].CUSTOMER_NAME}.`
                            const logData = {
                                ORDER_ID: order_id, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: "order", ACTION_LOG_TYPE: "user", ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: results1[0].CLIENT_ID, USER_ID: 0, ORDER_DATE_TIME: "", CART_ID: results1[0].CART_ID, EXPECTED_DATE_TIME: "", ORDER_MEDIUM: "", ORDER_STATUS: 'Out for Delivery', TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, USER_NAME: "Shiprocket", EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null, ORDER_SHIPROCKET_DATETIME: null, ORDER_SHIP_ASSIGN_DATETIME: null, ORDER_LABEL_DATETIME: null, ORDER_PICKUP_DATETIME: null, ORDER_CANCEL_DATETIME: null, ORDER_OUT_FOR_DELIVERY_DATETIME: systemDate, ORDER_DELIVERY_DATETIME: null
                            }
                            console.log("logData", logData)
                            var TITLE = 'Out for Delivery'
                            var DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been out for delivery.`
                            mm.sendNotificationToChannel(0, `customer_${results1[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "O", supportKey, "N", "S", results1);
                            mm.sendDynamicEmail(18, order_id, supportKey)
                            dbm.saveLog(logData, shopOrderActionLog);
                            res.status(200).json({
                                "message": "ShopOrder information updated successfully...",
                            });
                        }
                    });
                }
            });
        } else {
            res.status(200).json({
                "message": "ShopOrder information updated successfully...",
            });
        }
        logShiprocketCall(order_id, req.body, '', "webhook api", supportKey)
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}

function sendWpMessage(NAME, ORDER_NUMBER, STATUS, MOBILE_NO, TEMPLATE_NAME, REMARK) {

    console.log("im in sendWpMessage function", "NAME", NAME, "ORDER_NUMBER", ORDER_NUMBER, "STATUS", STATUS, "MOBILE_NO", MOBILE_NO, "TEMPLATE_NAME", TEMPLATE_NAME);

    var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    var wBparams = [];
    if (STATUS == "Order Rejected") {
        wBparams = [{ "type": "text", "text": NAME }, { "type": "text", "text": ORDER_NUMBER }, { "type": "text", "text": REMARK }, { "type": "text", "text": formattedDate }]
        TEMPLATE_NAME = "order_rejected"
    } else {
        wBparams = [
            {
                "type": "text",
                "text": NAME
            },
            {
                "type": "text",
                "text": ORDER_NUMBER
            }
        ];
    }
    if (STATUS && STATUS !== "Order Deliverd" && STATUS !== "Order Rejected") {
        wBparams.push({
            "type": "text",
            "text": STATUS
        });
    }
    var wparams = [
        {
            "type": "body",
            "parameters": wBparams
        }
    ]

    mm.sendWAToolSMS(MOBILE_NO, TEMPLATE_NAME, wparams, 'en', (error, resultswsms) => {
        if (error) {
            console.log(error)
        }
        else {
            console.log("watsapp message sent");

        }
    })
}
