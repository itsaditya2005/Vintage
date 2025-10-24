const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const technicianActionLog = require("../../modules/technicianActionLog")

const applicationkey = process.env.APPLICATION_KEY;

var orderMaster = "order_master";
var viewOrderMaster = "view_" + orderMaster;

var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

function formatDate(dateInput) {
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}

function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CART_ID: req.body.CART_ID,
        ORDER_DATE_TIME: req.body.ORDER_DATE_TIME,
        EXPECTED_DATE_TIME: req.body.EXPECTED_DATE_TIME,
        ORDER_MEDIUM: req.body.ORDER_MEDIUM,
        ORDER_STATUS: req.body.ORDER_STATUS ? '1' : '0',
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        COUPON_CODE: req.body.COUPON_CODE,
        COUPON_AMOUNT: req.body.COUPON_AMOUNT ? req.body.COUPON_AMOUNT : 0,
        FINAL_AMOUNT: req.body.FINAL_AMOUNT ? req.body.FINAL_AMOUNT : 0,
        SERVICE_ADDRESS_ID: req.body.SERVICE_ADDRESS_ID,
        BILLING_ADDRESS_ID: req.body.BILLING_ADDRESS_ID,
        SPECIAL_INSTRUCTIONS: req.body.SPECIAL_INSTRUCTIONS,
        ORDER_NUMBER: req.body.ORDER_NUMBER,
        CLIENT_ID: req.body.CLIENT_ID,
        REMARK: req.body.REMARK,
        TAX_EXCLUSIVE_AMOUNT: req.body.TAX_EXCLUSIVE_AMOUNT,
        UNIT_NAME: req.body.UNIT_NAME,
        TAX_RATE: req.body.TAX_RATE,
        TAX_AMOUNT: req.body.TAX_AMOUNT,
        TAX_INCLUSIVE_AMOUNT: req.body.TAX_INCLUSIVE_AMOUNT,
        ORDER_CREATED_BY: req.body.ORDER_CREATED_BY,
        ORDER_CREATER_ID: req.body.ORDER_CREATER_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('CART_ID').isInt().optional(),
        body('ORDER_DATE_TIME').optional(),
        body('EXPECTED_DATE_TIME').optional(),
        body('ORDER_MEDIUM').optional(),
        body('ORDER_STATUS').optional(),
        body('PAYMENT_MODE').optional(),
        body('PAYMENT_STATUS').optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('COUPON_CODE').optional(),
        body('COUPON_AMOUNT').isDecimal().optional(),
        body('FINAL_AMOUNT').isDecimal().optional(),
        body('SERVICE_ADDRESS').optional(),
        body('BILLING_ADDRESS').optional(),
        body('SPECIAL_INSTRUCTIONS').optional(),
        body('ID').optional(),
    ]
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
            mm.executeQueryData(`UPDATE ` + orderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "OrderMaster information updated successfully...",
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
            mm.executeQuery('select count(*) as cnt from ' + viewOrderMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMaster count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewOrderMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
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
                                "message": "success",
                                "TAB_ID": 67,
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

exports.generateOrderNumber = (req, res) => {
    const supportKey = req.headers['supportkey'];
    var systemDate = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const prefix = 'ORD';
    const datePart = systemDate;
    try {
        mm.executeQuery('SELECT ORDER_NUMBER FROM order_master WHERE 1 ORDER BY ID DESC LIMIT 1', supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    code: 400,
                    message: "Failed to generate order number.",
                });
            }
            else {
                let newSequenceNumber = 1;
                if (results.length > 0) {
                    const lastOrderNumber = results[0].ORDER_NUMBER;
                    const lastSequence = parseInt(lastOrderNumber.split('/')[2], 10);
                    newSequenceNumber = lastSequence + 1;
                }
                const newOrderNumber = `${prefix}/${datePart}/${String(newSequenceNumber).padStart(5, '0')}`;
                res.send({
                    code: 200,
                    message: "Order number generated successfully.",
                    orderNumber: newOrderNumber,
                });
            }
        });
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong while generating the order number.",
        });
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
            mm.executeQueryData('INSERT INTO ' + orderMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save orderMaster information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "OrderMaster information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + orderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "OrderMaster information updated successfully...",
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


exports.createOrder = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var ORDER_DATA = req.body.ORDER_DATA;
    var SERVICE_ADDRESS_DATA = req.body.SERVICE_ADDRESS_DATA;
    var BILLING_ADDRESS_DATA = req.body.BILLING_ADDRESS_DATA;
    var ORDER_DETAILS_DATA = req.body.ORDER_DETAILS_DATA
    var SUMMARY_DATA = req.body.SUMMARY_DATA;
    var MOBILE_NO = req.body.MOBILE_NO
    var username = req.body.USERNAME;
    var Razorpay_ID = req.body.Razorpay_ID
    ORDER_DATA.ORDER_CREATED_BY = ORDER_DATA.ORDER_CREATED_BY ? ORDER_DATA.ORDER_CREATED_BY : 'C'
    ORDER_DATA.ORDER_CREATER_ID = ORDER_DATA.ORDER_CREATER_ID ? ORDER_DATA.ORDER_CREATER_ID : req.body.authData.data.UserData[0].USER_ID
    var systemDate = mm.getSystemDate();
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
            mm.executeDML('SELECT ORDER_NUMBER,ORDER_DATE_TIME FROM order_master ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, orderResult) => {
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
                    let newSequenceNumber = 1;
                    if (orderResult.length > 0) {
                        const lastOrderNumber = orderResult[0].ORDER_NUMBER;
                        const lastSequence = parseInt(lastOrderNumber.split('/')[2], 10);
                        newSequenceNumber = lastSequence + 1;
                    }
                    var datePart = systemDate.split(" ")[0].split("-").join('')
                    const ORDER_NUMBER = `ORD/${datePart}/${String(newSequenceNumber).padStart(5, '0')}`;
                    mm.executeDML('INSERT INTO order_master (CUSTOMER_ID,ORDER_DATE_TIME,EXPECTED_DATE_TIME,ORDER_MEDIUM,ORDER_STATUS_ID,PAYMENT_MODE,PAYMENT_STATUS,TOTAL_AMOUNT,COUPON_CODE,COUPON_AMOUNT,FINAL_AMOUNT,TERRITORY_ID,CLIENT_ID,SPECIAL_INSTRUCTIONS,ORDER_NUMBER,IS_EXPRESS,SERVICE_COUNT,TOTAL_TAXABLE_AMOUNT,DISCOUNT_AMOUNT,EXPRESS_DELIVERY_CHARGES,TAX_AMOUNT,STATE_ID,IS_SAME_STATE,USER_ID,ORDER_CREATED_BY,ORDER_CREATER_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [ORDER_DATA.CUSTOMER_ID, systemDate, SUMMARY_DATA.EXPECTED_DATE_TIME, ORDER_DATA.ORDER_MEDIUM, 1, "COD", "P", SUMMARY_DATA.TOTAL_AMOUNT, ORDER_DATA.COUPON_CODE, ORDER_DATA.COUPON_AMOUNT, SUMMARY_DATA.NET_AMOUNT, ORDER_DATA.TERRITORY_ID, ORDER_DATA.CLIENT_ID, SUMMARY_DATA.SPECIAL_INSTRUCTIONS, ORDER_NUMBER, ORDER_DATA.IS_EXPRESS, ORDER_DATA.SERVICE_COUNT, ORDER_DATA.TOTAL_TAXABLE_AMOUNT, ORDER_DATA.DISCOUNT_AMOUNT, ORDER_DATA.EXPRESS_DELIVERY_CHARGES, ORDER_DATA.TAX_AMOUNT, ORDER_DATA.STATE_ID, ORDER_DATA.IS_SAME_STATE, ORDER_DATA.USER_ID, ORDER_DATA.ORDER_CREATED_BY, ORDER_DATA.ORDER_CREATER_ID], supportKey, connection, (error, results) => {
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
                            mm.executeDML('INSERT INTO order_master_address_map (ORDER_ID,ADDRESS_LINE_1,ADDRESS_LINE_2,CITY_ID,STATE_ID,COUNTRY_ID,PINCODE,LATITUDE,LONGITUDE,CLIENT_ID,ADDRESS_ID,CONTACT_PERSON_NAME,MOBILE_NO,LANDMARK,PINCODE_ID,CITY_NAME) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [results.insertId, SERVICE_ADDRESS_DATA.ADDRESS_LINE_1, SERVICE_ADDRESS_DATA.ADDRESS_LINE_2, SERVICE_ADDRESS_DATA.CITY_ID, SERVICE_ADDRESS_DATA.STATE_ID, SERVICE_ADDRESS_DATA.COUNTRY_ID, SERVICE_ADDRESS_DATA.PINCODE, SERVICE_ADDRESS_DATA.LATITUDE, SERVICE_ADDRESS_DATA.LONGITUDE, ORDER_DATA.CLIENT_ID, SERVICE_ADDRESS_DATA.ID, SERVICE_ADDRESS_DATA.CONTACT_PERSON_NAME, SERVICE_ADDRESS_DATA.MOBILE_NO, SERVICE_ADDRESS_DATA.LANDMARK, SERVICE_ADDRESS_DATA.PINCODE_ID, SERVICE_ADDRESS_DATA.CITY_NAME], supportKey, connection, (error, results1) => {
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
                                    mm.executeDML('INSERT INTO order_master_address_map (ORDER_ID,ADDRESS_LINE_1,ADDRESS_LINE_2,CITY_ID,STATE_ID,COUNTRY_ID,PINCODE_ID,LATITUDE,LONGITUDE,CLIENT_ID,ADDRESS_ID,PINCODE,CONTACT_PERSON_NAME,MOBILE_NO,LANDMARK,CITY_NAME) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [results.insertId, BILLING_ADDRESS_DATA.ADDRESS_LINE_1, BILLING_ADDRESS_DATA.ADDRESS_LINE_2, BILLING_ADDRESS_DATA.CITY_ID, BILLING_ADDRESS_DATA.STATE_ID, BILLING_ADDRESS_DATA.COUNTRY_ID, BILLING_ADDRESS_DATA.PINCODE_ID, BILLING_ADDRESS_DATA.LATITUDE, BILLING_ADDRESS_DATA.LONGITUDE, ORDER_DATA.CLIENT_ID, BILLING_ADDRESS_DATA.ID, BILLING_ADDRESS_DATA.PINCODE, BILLING_ADDRESS_DATA.CONTACT_PERSON_NAME, BILLING_ADDRESS_DATA.MOBILE_NO, BILLING_ADDRESS_DATA.LANDMARK, BILLING_ADDRESS_DATA.CITY_NAME], supportKey, connection, (error, results2) => {
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
                                            mm.executeDML('UPDATE ' + orderMaster + ' SET SERVICE_ADDRESS_ID = ?, BILLING_ADDRESS_ID = ? where ID = ?', [results1.insertId, results2.insertId, results.insertId], supportKey, connection, (error, results3) => {
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
                                                    var orderDetailsData = []
                                                    let FINAL_ITEM_AMOUNT = 0;
                                                    for (let index = 0; index < ORDER_DETAILS_DATA.length; index++) {
                                                        const element = ORDER_DETAILS_DATA[index];
                                                        FINAL_ITEM_AMOUNT = element.IS_EXPRESS == 1 ? (element.TOTAL_AMOUNT + element.EXPRESS_DELIVERY_CHARGES) : element.TOTAL_AMOUNT
                                                        orderDetailsData.push([results.insertId, element.SERVICE_CATALOGUE_ID, element.SERVICE_ITEM_ID, element.CATEGORY_ID, element.SUB_CATEGORY_ID, element.JOB_CARD_ID, element.QUANTITY, element.RATE, element.UNIT_ID, element.TOTAL_AMOUNT, ORDER_DATA.CLIENT_ID, element.TAX_EXCLUSIVE_AMOUNT, element.UNIT_NAME, element.TAX_RATE, element.TAX_AMOUNT, element.TOTAL_AMOUNT, element.IS_EXPRESS, element.EXPRESS_DELIVERY_CHARGES, element.TOTAL_DURARTION_MIN, element.DURARTION_MIN, element.DURARTION_HOUR, element.IS_JOB_CREATED_DIRECTLY, element.START_TIME, element.END_TIME, element.CESS, element.CGST, element.SGST, element.IGST, element.MAX_QTY, element.PREPARATION_HOURS, element.PREPARATION_MINUTES, element.CATEGORY_NAME, element.SUB_CATEGORY_NAME, element.SERVICE_PARENT_NAME, element.SERVICE_NAME, element.VENDOR_COST, element.TECHNICIAN_COST, ORDER_DATA.VENDOR_ID, element.TOTAL_TAX_EXCLUSIVE_AMOUNT, FINAL_ITEM_AMOUNT, element.BRAND_NAME, element.MODEL_NUMBER, element.PHOTO_FILE, element.DESCRIPTION,])
                                                    }

                                                    mm.executeDML('INSERT INTO order_details (ORDER_ID,SERVICE_CATALOGUE_ID,SERVICE_ITEM_ID,CATEGORY_ID,SUB_CATEGORY_ID,JOB_CARD_ID,QUANTITY,RATE,UNIT_ID,TOTAL_AMOUNT,CLIENT_ID,TAX_EXCLUSIVE_AMOUNT,UNIT_NAME,TAX_RATE,TAX_AMOUNT,TAX_INCLUSIVE_AMOUNT,IS_EXPRESS, EXPRESS_DELIVERY_CHARGES,TOTAL_DURARTION_MIN,DURARTION_MIN,DURARTION_HOUR,IS_JOB_CREATED_DIRECTLY,START_TIME,END_TIME,CESS,CGST,SGST,IGST,MAX_QTY, PREPARATION_HOURS, PREPARATION_MINUTES, CATEGORY_NAME, SUB_CATEGORY_NAME, SERVICE_PARENT_NAME,SERVICE_NAME,VENDOR_COST,TECHNICIAN_COST,VENDOR_ID,TOTAL_TAX_EXCLUSIVE_AMOUNT,FINAL_ITEM_AMOUNT,BRAND_NAME,MODEL_NUMBER,PHOTO_FILE,DESCRIPTION) values ?', [orderDetailsData], supportKey, connection, (error, results4) => {
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
                                                            mm.executeDML('INSERT INTO order_summery_details (ORDER_ID,GROSS_AMOUNT,TAX_RATE,COUPON_CHARGES,DISCOUNT_CHARGES,TOTAL_TAX,SERVICE_CHARGES,NET_AMOUNT,CLIENT_ID) values (?,?,?,?,?,?,?,?,?)', [results.insertId, SUMMARY_DATA.GROSS_AMOUNT, SUMMARY_DATA.TAX_RATE, SUMMARY_DATA.COUPON_CHARGES, SUMMARY_DATA.DISCOUNT_CHARGES, SUMMARY_DATA.TOTAL_TAX, SUMMARY_DATA.SERVICE_CHARGES, SUMMARY_DATA.NET_AMOUNT, ORDER_DATA.CLIENT_ID], supportKey, connection, (error, results5) => {
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
                                                                    if (Razorpay_ID) {
                                                                        mm.executeDML('UPDATE payment_getway_order_logs SET ORDER_ID = ? where RAZORPAY_ORDER_ID = ?', [results1.insertId, Razorpay_ID], supportKey, connection, (error, results3) => {
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
                                                                                mm.commitConnection(connection);
                                                                                addGlobalData(results.insertId, supportKey)
                                                                                console.log(req.body.authData.data.UserData[0]);
                                                                                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has successfully placed an order for customer ${ORDER_DATA.CUSTOMER_NAME}.`;
                                                                                const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results.insertId, JOB_CARD_ID: 0, CUSTOMER_ID: ORDER_DATA.CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: data.EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: data.EXPECTED_DATE_TIME, ORDER_MEDIUM: data.ORDER_MEDIUM, ORDER_STATUS: "Order placed successfully", PAYMENT_MODE: data.PAYMENT_MODE, PAYMENT_STATUS: data.PAYMENT_STATUS, TOTAL_AMOUNT: data.TOTAL_AMOUNT, ORDER_NUMBER: ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                                let actionLog = { "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "orderMaster", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0 }
                                                                                dbm.saveLog(logData, technicianActionLog);
                                                                                // mm.sendDynamicEmail(7, results4.insertId, supportKey)
                                                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${ORDER_DATA.CUSTOMER_ID}_channel`, "Order Placed Successfully", `Your order ${ORDER_NUMBER} has been placed successfully. Thank you for choosing us!`, "", "O", supportKey, "N", "O", req.body);
                                                                                const formattedDate = formatDate(orderResult[0].ORDER_DATE_TIME);
                                                                                var wBparams = [
                                                                                    {
                                                                                        "type": "text",
                                                                                        "text": ORDER_DATA.CUSTOMER_NAME
                                                                                    },
                                                                                    {
                                                                                        "type": "text",
                                                                                        "text": ORDER_NUMBER
                                                                                    },
                                                                                    {
                                                                                        "type": "text",
                                                                                        "text": SUMMARY_DATA.TOTAL_AMOUNT
                                                                                    },
                                                                                    {
                                                                                        "type": "text",
                                                                                        "text": orderResult[0].ORDER_DATE_TIME
                                                                                    }
                                                                                ]

                                                                                var wparams = [
                                                                                    {
                                                                                        "type": "body",
                                                                                        "parameters": wBparams
                                                                                    }
                                                                                ]
                                                                                if (ORDER_DATA.CUSTOMER_TYPE === "I") {
                                                                                    // mm.sendWAToolSMS(MOBILE_NO, "service_order_placed_new", wparams, 'En', (error, resultswsms) => {
                                                                                    //     if (error) {
                                                                                    //         console.log(error)
                                                                                    //     }
                                                                                    //     else {
                                                                                    //         console.log(" whatsapp msg send : ", resultswsms)
                                                                                    //     }
                                                                                    // })
                                                                                    res.send({
                                                                                        "code": 200,
                                                                                        "message": "Successfully to save orderMaster information..."
                                                                                    });
                                                                                } else {
                                                                                    res.send({
                                                                                        "code": 200,
                                                                                        "message": "Successfully to save orderMaster information..."
                                                                                    });
                                                                                }
                                                                            }
                                                                        });
                                                                    } else {
                                                                        const formattedDate = formatDate(orderResult[0].ORDER_DATE_TIME);
                                                                        var wBparams = [
                                                                            {
                                                                                "type": "text",
                                                                                "text": ORDER_DATA.CUSTOMER_NAME
                                                                            },
                                                                            {
                                                                                "type": "text",
                                                                                "text": ORDER_NUMBER
                                                                            },
                                                                            {
                                                                                "type": "text",
                                                                                "text": SUMMARY_DATA.TOTAL_AMOUNT
                                                                            },
                                                                            {
                                                                                "type": "text",
                                                                                "text": orderResult[0].ORDER_DATE_TIME
                                                                            }
                                                                        ]
                                                                        var wparams = [
                                                                            {
                                                                                "type": "body",
                                                                                "parameters": wBparams
                                                                            }
                                                                        ]
                                                                        mm.commitConnection(connection);
                                                                        addGlobalData(results.insertId, supportKey)
                                                                        console.log(req.body.authData.data.UserData[0]);
                                                                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has successfully placed an order for customer ${ORDER_DATA.CUSTOMER_NAME}.`;
                                                                        const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results.insertId, JOB_CARD_ID: 0, CUSTOMER_ID: ORDER_DATA.CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: data.EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: data.EXPECTED_DATE_TIME, ORDER_MEDIUM: data.ORDER_MEDIUM, ORDER_STATUS: "Order placed successfully", PAYMENT_MODE: data.PAYMENT_MODE, PAYMENT_STATUS: data.PAYMENT_STATUS, TOTAL_AMOUNT: data.TOTAL_AMOUNT, ORDER_NUMBER: ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                        dbm.saveLog(logData, technicianActionLog);
                                                                        // mm.sendDynamicEmail(7, results4.insertId, supportKey)
                                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${ORDER_DATA.CUSTOMER_ID}_channel`, "Order Placed Successfully", `Your order ${ORDER_NUMBER} has been placed successfully. Thank you for choosing us!`, "", "O", supportKey, "N", "O", req.body);
                                                                        if (ORDER_DATA.CUSTOMER_TYPE === "I") {
                                                                            // mm.sendWAToolSMS(MOBILE_NO, "service_order_placed_new", wparams, 'En', (error, resultswsms) => {
                                                                            //     if (error) {
                                                                            //         console.log(error)
                                                                            //     }
                                                                            //     else {
                                                                            //         console.log(" whatsapp msg send : ", resultswsms)
                                                                            //     }
                                                                            // })
                                                                            res.send({
                                                                                "code": 200,
                                                                                "message": "Successfully to save orderMaster information..."
                                                                            });
                                                                        } else {
                                                                            res.send({
                                                                                "code": 200,
                                                                                "message": "Successfully to save orderMaster information..."
                                                                            });
                                                                        }
                                                                    }
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
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}


exports.getOrderDetails = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewOrderMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMaster count.",
                    });
                }
                else {
                    // let query =`SELECT ID,TERRITORY_NAME,ORDER_DATE_TIME,ORDER_NUMBER,CUSTOMER_ID,CUSTOMER_NAME,MOBILE_NO,(SELECT COUNT(ID) FROM order_details WHERE ORDER_ID=OM.ID)SERVICES, EXPECTED_DATE_TIME,TOTAL_AMOUNT,TOTAL_TAXABLE_AMOUNT,PAYMENT_STATUS,ORDER_STATUS,PAYMENT_MODE,CUSTOMER_TYPE,IS_EXPRESS,SERVICE_COUNT,SERVICE_ADDRESS,SERVICE_LATITUDE,SERVICE_LONGITUDE FROM view_order_master OM WHERE 1`

                    let query = `SELECT * FROM view_territory_wise_order_details where 1 `
                    mm.executeQuery(query + criteria, supportKey, (error, results) => {
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
                                "message": "success",
                                "TAB_ID": 143,
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

exports.getPaymentOrdeDetailsOLD = (req, res) => {

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
    let ORDER_ID = req.body.ORDER_ID ? req.body.ORDER_ID : '';
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
            mm.executeQuery(`select * from view_order_master where 1 AND ID=${ORDER_ID} `, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMaster count.",
                    });
                }
                else {

                    mm.executeQuery(`select * from view_order_details where 1 AND ORDER_ID=${ORDER_ID}`, supportKey, (error, results2) => {
                        if (error) {
                            console.log(error);

                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get orderMaster information."
                            });
                        }
                        else {


                            mm.executeQuery(`select * from view_order_payment_details where 1 AND ORDER_ID=${ORDER_ID}`, supportKey, (error, results3) => {
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
                                        "message": "success",
                                        "orderData": results1,
                                        "detailsData": results2,
                                        "paymentData": results3
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
                "code": 500,
                "message": "Something went wrong."
            });
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

exports.getPaymentOrdeDetails = (req, res) => {

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
    let ORDER_ID = req.body.ORDER_ID ? req.body.ORDER_ID : '';
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
            mm.executeQuery(`select * from view_order_master where 1 AND ID=${ORDER_ID} `, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get orderMaster count.",
                    });
                }
                else {

                    mm.executeQuery(`select * from view_order_details where 1 AND ORDER_ID=${ORDER_ID}`, supportKey, (error, results2) => {
                        if (error) {
                            console.log(error);

                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get orderMaster information."
                            });
                        }
                        else {


                            mm.executeQuery(`select * from view_order_payment_details where 1 AND ORDER_ID=${ORDER_ID}`, supportKey, (error, results3) => {
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
                                        "message": "success",
                                        "orderData": results1,
                                        "detailsData": results2,
                                        "paymentData": results3
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
                "code": 500,
                "message": "Something went wrong."
            });
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
            mm.executeQueryData(`UPDATE ` + orderMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update orderMaster information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "OrderMaster information updated successfully...",
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



exports.orderUpdateStatus = (req, res) => {
    try {

        const { ID, ORDER_STATUS, REMARK, RESCHEDULE_REQUEST_REASON, RESCHEDULE_APPROVE_DATE, EXPECTED_DATE_TIME, OLD_EXPECTED_DATE_TIME, IS_UPDATED_BY_CUSTOMER, SPECIAL_INSTRUCTIONS, ACCEPTANCE_REMARK } = req.body;
        const SERVICE_ITEM_IDS = req.body.SERVICE_ITEM_IDS
        const ASSING_TO = req.body.ASSING_TO ? req.body.ASSING_TO : 0
        let LogArrays = [];
        var supportKey = req.headers['supportkey'];

        if (!ID) {
            res.send({
                code: 400,
                message: "ID and is required."
            });
            return;
        }
        if (!ORDER_STATUS) {
            res.send({
                code: 400,
                message: "ORDER_STATUS is required."
            });
            return;
        }
        if (ORDER_STATUS !== "OA" && ORDER_STATUS !== "OR" && ORDER_STATUS !== "OS") {
            res.send({
                code: 400,
                message: "Invalid ORDER_STATUS."
            });
            return;
        }
        var orderStatusId = 0;
        if (ORDER_STATUS === "OA") {
            orderStatusId = 2
        } else if (ORDER_STATUS === "OR") {
            orderStatusId = 3
        } else if (ORDER_STATUS === "OS") {
            orderStatusId = 1
        }

        const systemDate = mm.getSystemDate();
        let setData = "ORDER_STATUS_ID = ?, CREATED_MODIFIED_DATE = ?";
        var recordData = [orderStatusId, systemDate, ID];

        if (ORDER_STATUS === "OR") {
            if (!REMARK) {
                res.send({
                    code: 400,
                    message: "REMARK is required."
                });
                return;
            }
            setData = "ORDER_STATUS_ID = ?, REMARK = ?, CREATED_MODIFIED_DATE = ?,ORDER_REJECTED_DATE=?";
            // recordData[1]= REMARK;
            // recordData.splice(1, 0, REMARK);
            recordData = [3, REMARK, systemDate, systemDate, ID]
            // recordData.push(REMARK);
        } else if (ORDER_STATUS === "OA") {
            if (!EXPECTED_DATE_TIME) {
                res.send({
                    code: 400,
                    message: "EXPECTED_DATE_TIME is required for ORDER_STATUS 'OA'."
                });
                return;
            }
            setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?, CREATED_MODIFIED_DATE = ?,ORDER_ACCEPTED_DATE=?,REMARK=?,ACCEPTANCE_REMARK=?, ASSING_TO=?";
            // recordData.splice(1, 0, EXPECTED_DATE_TIME);
            recordData = [2, EXPECTED_DATE_TIME, systemDate, systemDate, REMARK, ACCEPTANCE_REMARK, ASSING_TO, ID]
            // recordData[1]= EXPECTED_DATE_TIME;

            // recordData.push(EXPECTED_DATE_TIME);
        }
        else if (ORDER_STATUS === "OS") {
            if (!EXPECTED_DATE_TIME) {
                res.send({
                    code: 400,
                    message: "EXPECTED_DATE_TIME is required for ORDER_STATUS 'OS'."
                });
                return;
            }
            if (IS_UPDATED_BY_CUSTOMER == 1) {
                setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?, CREATED_MODIFIED_DATE = ?,REMARK = ?,RESCHEDULE_REQUEST_DATE=?,OLD_EXPECTED_DATE_TIME=?,RESCHEDULE_REQUEST_REMARK=?,RESCHEDULE_REQUEST_REASON= ?, SPECIAL_INSTRUCTIONS = ?";
                recordData = [1, EXPECTED_DATE_TIME, systemDate, REMARK, systemDate, OLD_EXPECTED_DATE_TIME, REMARK, RESCHEDULE_REQUEST_REASON, REMARK, ID]
            } else {

                setData = "ORDER_STATUS_ID = ?, EXPECTED_DATE_TIME = ?, CREATED_MODIFIED_DATE = ?,REMARK = ?,RESCHEDULE_REQUEST_DATE=?,RESCHEDULE_REQUEST_REMARK=?,ORDER_ACCEPTED_DATE=?";
                recordData = [2, EXPECTED_DATE_TIME, systemDate, REMARK, systemDate, REMARK, systemDate, ID]
            }
        }
        const query = `UPDATE ${orderMaster} SET ${setData} WHERE ID = ?`;
        const connection = mm.openConnection();
        mm.executeDML('select ORDER_STATUS from view_order_master where ID = ?', ID, supportKey, connection, (error, orderResult) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                mm.rollbackConnection(connection);
                console.log(error);
                res.send({
                    code: 500,
                    message: "Failed to update orderMaster information."
                });
            } else {
                if ((orderResult.ORDER_STATUS == "OA" && ORDER_STATUS == "OA") || (orderResult.ORDER_STATUS == "OA" && ORDER_STATUS == "OR") || (orderResult.ORDER_STATUS == "OA" && ORDER_STATUS == "OS")) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Order already accepted."
                    });
                } else if ((orderResult.ORDER_STATUS == "OR" && ORDER_STATUS == "OR") || (orderResult.ORDER_STATUS == "OR" && ORDER_STATUS == "OA") || (orderResult.ORDER_STATUS == "OR" && ORDER_STATUS == "OS")) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Order already rejected."
                    });
                } else if ((orderResult.ORDER_STATUS == "OS" && ORDER_STATUS == "OS") || (orderResult.ORDER_STATUS == "OS" && ORDER_STATUS == "OA") || (orderResult.ORDER_STATUS == "OS" && ORDER_STATUS == "OR")) {
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Order already rescheduled."
                    });
                } else {
                    mm.executeDML(query, recordData, supportKey, connection, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            mm.rollbackConnection(connection);
                            res.send({
                                code: 500,
                                message: "Failed to update orderMaster information."
                            });
                        } else {
                            mm.executeDML(`select * FROM view_order_master where ID = ? `, ID, supportKey, connection, (error, results1) => {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    res.send({
                                        code: 500,
                                        message: "Failed to update orderMaster information."
                                    });
                                } else {
                                    mm.executeDML(`select * FROM view_order_details where ORDER_ID = ? `, results1[0].ID, supportKey, connection, (error, resultsget) => {
                                        if (error) {
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            res.send({
                                                code: 500,
                                                message: "Failed to update orderMaster information."
                                            });
                                        } else {
                                            var DESCRIPTION = '';
                                            var TITLE = '';
                                            if (ORDER_STATUS === "OA") {
                                                // mm.sendDynamicEmail(8, resultsget[0].ID, supportKey)
                                                TITLE = 'Order Accepted'
                                                DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been accepted and is now being processed.`
                                            } else if (ORDER_STATUS === "OR") {
                                                // mm.sendDynamicEmail(9, resultsget[0].ID, supportKey)
                                                TITLE = 'Order Rejected'
                                                DESCRIPTION = `We regret to inform you that your order ${results1[0].ORDER_NUMBER} has been rejected due to ${REMARK}.`
                                            } else if (ORDER_STATUS === "OS") {
                                                // IS_UPDATED_BY_CUSTOMER != 1 ? mm.sendDynamicEmail(14, resultsget[0].ID, supportKey) : "";
                                                TITLE = 'Order Rescheduled'
                                                DESCRIPTION = `Your order ${results1[0].ORDER_NUMBER} has been rescheduled. will notify you once it confirmed.`
                                            }
                                            // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N", "O", req.body);
                                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", supportKey, "N", "O", results1);
                                            if (SERVICE_ITEM_IDS) {
                                                async.eachSeries(SERVICE_ITEM_IDS, function processTechnician(Services, inner_callback) {
                                                    mm.executeDML('select * from view_auto_job_data where SERVICE_ID = ? order by ORDER_DETAILS_ID DESC limit 1', [Services], supportKey, connection, (error, serviceData) => {
                                                        if (error) {
                                                            console.log(`Error retrieving service data`, error);
                                                            return inner_callback(error);
                                                        } else {
                                                            if (!serviceData || serviceData.length === 0) {
                                                                return inner_callback(null);
                                                            } else {
                                                                mm.executeDML('SELECT JOB_CARD_NO FROM job_card ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, jobResult) => {
                                                                    if (error) {
                                                                        console.log(` Error getting letest Job Number`, error);
                                                                        return inner_callback(error);
                                                                    }
                                                                    else {
                                                                        mm.executeDML('SELECT * FROM view_order_details where SERVICE_ITEM_ID = ? AND ID = ?', [Services, serviceData[0].ORDER_DETAILS_ID], supportKey, connection, (error, OrderResult) => {
                                                                            if (error) {
                                                                                console.log(` Error getting letest Job Number`, error);
                                                                                return inner_callback(error);
                                                                            }
                                                                            else {
                                                                                let JOB_PAYMENT_STATUS = ""
                                                                                let systemDate = mm.getSystemDate();
                                                                                let newSequenceNumber = 1;
                                                                                if (jobResult.length > 0) {
                                                                                    const lastOrderNumber = jobResult[0].JOB_CARD_NO;
                                                                                    const parts = lastOrderNumber.split('/');
                                                                                    const sequencePart = parts[parts.length - 1];
                                                                                    const lastSequence = parseInt(sequencePart, 10);
                                                                                    newSequenceNumber = lastSequence + 1;
                                                                                }
                                                                                const datePart = systemDate.split(" ")[0].split("-").join('');
                                                                                const JOB_CARD_NO = `JOB/${datePart}/${String(newSequenceNumber).padStart(5, '0')}`;
                                                                                serviceData[0].PAYMENT_STATUS == "D" ? JOB_PAYMENT_STATUS = "D" : "P"
                                                                                mm.executeDML('INSERT INTO job_card(JOB_CREATED_DATE,EXPECTED_DATE_TIME,TASK_DESCRIPTION,JOB_STATUS_ID,ORDER_ID,ORDER_NO,JOB_CARD_NO,CUSTOMER_ID,SERVICE_ID,TERRITORY_ID,TECHNICIAN_ID,SERVICE_AMOUNT,ESTIMATED_TIME_IN_MIN,CLIENT_ID,ORDER_DETAILS_ID,TECHNICIAN_STATUS,USER_ID,CUSTOMER_TYPE,CUSTOMER_NAME,SERVICE_ADDRESS,LATTITUTE,LONGITUDE,SERVICE_NAME,SERVICE_SKILLS,PINCODE,TERRITORY_NAME,JOB_PAYMENT_STATUS,IS_REMOTE_JOB,VENDOR_COST,TECHNICIAN_COST) values(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [serviceData[0].JOB_CREATED_DATE, serviceData[0].EXPECTED_DATE_TIME, serviceData[0].TASK_DESCRIPTION, 1, serviceData[0].ORDER_ID, serviceData[0].ORDER_NUMBER, JOB_CARD_NO, serviceData[0].CUSTOMER_ID, serviceData[0].SERVICE_ID, serviceData[0].TERRITORY_ID, serviceData[0].TECHNICIAN_ID, serviceData[0].SERVICE_AMOUNT, serviceData[0].ESTIMATED_TIME_IN_MIN, serviceData[0].CLIENT_ID, serviceData[0].ORDER_DETAILS_ID, serviceData[0].TECHNICIAN_STATUS, serviceData[0].USER_ID, serviceData[0].CUSTOMER_TYPE, serviceData[0].CUSTOMER_NAME, serviceData[0].SERVICE_ADDRESS, serviceData[0].LATTITUTE, serviceData[0].LONGITUDE, serviceData[0].SERVICE_NAME, serviceData[0].SERVICE_SKILLS, serviceData[0].PINCODE, serviceData[0].TERRITORY_NAME, JOB_PAYMENT_STATUS, 0, serviceData[0].VENDOR_COST, serviceData[0].TECHNICIAN_COST], supportKey, connection, (error, resultsjOB) => {
                                                                                    if (error) {
                                                                                        console.log(`Failed to Create Job Card`, error);
                                                                                        return inner_callback(error);
                                                                                    }
                                                                                    else {
                                                                                        mm.executeDML(`UPDATE order_details SET JOB_CARD_ID = ? WHERE ID = ?`, [resultsjOB.insertId, serviceData[0].ORDER_DETAILS_ID], supportKey, connection, (error, results) => {
                                                                                            if (error) {
                                                                                                console.log(`Failed to update order details`, error);
                                                                                                return inner_callback(error);
                                                                                            }
                                                                                            else {
                                                                                                mm.executeDML(`SELECT * from view_job_card WHERE ID = ?`, [resultsjOB.insertId], supportKey, connection, (error, resultsgetJob) => {
                                                                                                    if (error) {
                                                                                                        console.log(`Failed to update order details`, error);
                                                                                                        return inner_callback(error);
                                                                                                    }
                                                                                                    else {
                                                                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, results1[0].CUSTOMER_ID, "**Job Created**", `Your order ${results1[0].ORDER_NUMBER} has been approved and job is created for your order. Our technician will be assigned shortly.`, "", "J", supportKey, "N", "J", req.body);
                                                                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${results1[0].CUSTOMER_ID}_channel`, "Job Created", `Your order ${results1[0].ORDER_NUMBER} has been approved and job is created for your order. Our technician will be assigned shortly.`, "", "J", supportKey, "N", "J", results1);
                                                                                                        // mm.sendNotificationToTerritory(results1[0].TERRITORY_ID, "**New Job Created**", `Dear Technician, a new job has been created near your location.`, "", "J", supportKey, 'PJ', resultsgetJob);
                                                                                                        console.log(req.body.authData.data.UserData[0]);
                                                                                                        var TOPIC_NAME = `territory_${results1[0].TERRITORY_ID}_channel`
                                                                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "New Job Created", `Dear Technician, a new job has been created near your location.`, "", "J", supportKey, "", "PJ", resultsgetJob);
                                                                                                        let ACTION_DETAILSS = ` System has auto generated a job for the service ${serviceData[0].SERVICE_NAME} for the customer ${serviceData[0].CUSTOMER_NAME}.`
                                                                                                        const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results1[0].ID, JOB_CARD_ID: resultsjOB.insertId, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: 'System', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILSS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: results1[0].ORDER_MEDIUM, ORDER_STATUS: "", PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job card created", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                                                        LogArrays.push(logData);
                                                                                                        addJobGlobalData(resultsjOB.insertId, supportKey);
                                                                                                        return inner_callback(null);

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
                                                            }
                                                        }
                                                    })
                                                }, function finalCallback(error) {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        res.send({
                                                            code: 400,
                                                            message: "Failed to update Order Status."
                                                        });
                                                        console.log("Failed to Create Job Card by system.")
                                                    } else {
                                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME} has ${(ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : (ORDER_STATUS == 'OS' ? 'rescheduled' : 'scheduled')))} the order ${results1[0].ORDER_NUMBER} for the customer ${results1[0].CUSTOMER_NAME}.`
                                                        const orderLog = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results1[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: results1[0].ORDER_MEDIUM, ORDER_STATUS: 'Order ' + (ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : 'rescheduled')), PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        LogArrays.push(orderLog);
                                                        dbm.saveLog(LogArrays, technicianActionLog);
                                                        var templateName = ""
                                                        var wBparams = []
                                                        if (ORDER_STATUS === "OS" && RESCHEDULE_APPROVE_DATE) {
                                                            templateName = "service_order_rescheduled"
                                                            wBparams = [{ "type": "text", "text": results1[0].CUSTOMER_NAME }, { "type": "text", "text": results1[0].ORDER_NUMBER }, { "type": "text", "text": EXPECTED_DATE_TIME }, { "type": "text", "text": EXPECTED_DATE_TIME }, { "type": "text", "text": results1[0].OLD_EXPECTED_DATE_TIME }]
                                                        } else if (ORDER_STATUS === "OA" && !RESCHEDULE_APPROVE_DATE) {
                                                            templateName = "order_accepted"
                                                            wBparams = [{ "type": "text", "text": results1[0].CUSTOMER_NAME }, { "type": "text", "text": results1[0].ORDER_NUMBER }, { "type": "text", "text": EXPECTED_DATE_TIME }, { "type": "text", "text": formattedDate }]
                                                        } else {
                                                            wBparams = [{ "type": "text", "text": results1[0].CUSTOMER_NAME }, { "type": "text", "text": results1[0].ORDER_NUMBER }, { "type": "text", "text": REMARK }, { "type": "text", "text": formattedDate }]
                                                            templateName = "order_rejected"
                                                        }
                                                        var wparams = [{ "type": "body", "parameters": wBparams }]

                                                        if (results1[0].CUSTOMER_TYPE === "I") {
                                                            console.log("results1[0].CUSTOMER_TYPE for whatsapp send sms ", results1[0].CUSTOMER_TYPE);

                                                            // mm.sendWAToolSMS(results1[0].MOBILE_NO, templateName, wparams, 'En', (error, resultswsms) => {
                                                            //     if (error) {
                                                            //         console.log(error)
                                                            //     }
                                                            //     else {
                                                            //         console.log("Successfully send SMS", resultswsms)
                                                            //     }
                                                            // })
                                                            mm.commitConnection(connection);
                                                            console.log("Job Card Created successfully.")
                                                            res.send({
                                                                code: 200,
                                                                message: "OrderMaster information updated successfully."
                                                            });
                                                        } else {
                                                            mm.commitConnection(connection);
                                                            console.log("Job Card Created successfully.")
                                                            res.send({
                                                                code: 200,
                                                                message: "OrderMaster information updated successfully."
                                                            });
                                                        }
                                                    }
                                                });
                                            } else {
                                                var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME} has ${(ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : (ORDER_STATUS == 'OS' ? 'rescheduled' : 'scheduled')))} the order ${results1[0].ORDER_NUMBER} for the customer ${results1[0].CUSTOMER_NAME}.`
                                                const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results1[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: results1[0].ORDER_MEDIUM, ORDER_STATUS: 'Order ' + (ORDER_STATUS == 'OA' ? 'accepted' : (ORDER_STATUS == 'OR' ? 'rejected' : 'rescheduled')), PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                dbm.saveLog(logData, technicianActionLog);
                                                var templateName = ""
                                                var wBparams = []
                                                if (ORDER_STATUS === "OS" && RESCHEDULE_APPROVE_DATE) {
                                                    templateName = "service_order_rescheduled"
                                                    wBparams = [{ "type": "text", "text": results1[0].CUSTOMER_NAME }, { "type": "text", "text": results1[0].ORDER_NUMBER }, { "type": "text", "text": EXPECTED_DATE_TIME }, { "type": "text", "text": EXPECTED_DATE_TIME }, { "type": "text", "text": results1[0].OLD_EXPECTED_DATE_TIME }]
                                                } else if (ORDER_STATUS === "OA" && !RESCHEDULE_APPROVE_DATE) {
                                                    templateName = "order_accepted"
                                                    wBparams = [{ "type": "text", "text": results1[0].CUSTOMER_NAME }, { "type": "text", "text": results1[0].ORDER_NUMBER }, { "type": "text", "text": EXPECTED_DATE_TIME }, { "type": "text", "text": formattedDate }]
                                                } else {
                                                    wBparams = [{ "type": "text", "text": results1[0].CUSTOMER_NAME }, { "type": "text", "text": results1[0].ORDER_NUMBER }, { "type": "text", "text": REMARK }, { "type": "text", "text": formattedDate }]
                                                    templateName = "order_rejected"
                                                }
                                                var wparams = [{ "type": "body", "parameters": wBparams }]

                                                if (results1[0].CUSTOMER_TYPE === "I") {
                                                    console.log("results1[0].CUSTOMER_TYPE for whatsapp send sms ", results1[0].CUSTOMER_TYPE);
                                                    // mm.sendWAToolSMS(results1[0].MOBILE_NO, templateName, wparams, 'En', (error, resultswsms) => {
                                                    //     if (error) {
                                                    //         console.log(error)
                                                    //     }
                                                    //     else {
                                                    //         console.log("Successfully send SMS", resultswsms)
                                                    //     }
                                                    // })
                                                    mm.commitConnection(connection);
                                                    console.log("Job Card Created successfully.")
                                                    res.send({
                                                        code: 200,
                                                        message: "OrderMaster information updated successfully."
                                                    });
                                                } else {
                                                    mm.commitConnection(connection);
                                                    console.log("Job Card Created successfully.")
                                                    res.send({
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
};

//old method
exports.getCategoriesHierarchyORG = (req, res) => {
    try {
        var customer_id = req.body.CUSTOMER_ID;
        var teritory_id = req.body.TERRITORY_ID;
        let CustID
        var supportKey = req.headers['supportkey'];

        var deviceid = req.headers['deviceid'];
        if (customer_id || teritory_id) {
            mm.executeQueryData(`select CUSTOMER_TYPE,IS_SPECIAL_CATALOGUE,CUSTOMER_DETAILS_ID from customer_master where ID = ? `, [customer_id], supportKey, (error, resultsCustomer) => {
                if (error) {
                    console.log(error)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        code: 400,
                        message: "Failed to get Data",
                    });
                }
                else {

                    if (resultsCustomer.length > 0) {
                        CustID = resultsCustomer[0].CUSTOMER_TYPE == 'B' ? resultsCustomer[0].CUSTOMER_DETAILS_ID : customer_id
                        var query = ``
                        var qdata = []
                        if (resultsCustomer[0].CUSTOMER_TYPE == 'B' && resultsCustomer[0].IS_SPECIAL_CATALOGUE == 1) {
                            query = `SET SESSION group_concat_max_len =10000000; 
                            SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', c.ID, 'title', c.NAME,'DESCRIPTION',c.DESCRIPTION,'ICON',c.ICON, 'disabled', 'true', 'children', IFNULL((SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', s.ID, 'title', s.NAME,'DESCRIPTION',s.DESCRIPTION,'ICON',s.IMAGE, 'isLeaf', 'true')),']'),'"[', '['),']"', ']') FROM sub_category_master s WHERE s.CATEGORY_ID = c.ID and STATUS = 1 and ID IN (SELECT SUB_CATEGORY_ID FROM view_b2b_availability_mapping where CUSTOMER_ID = ?  and IS_AVAILABLE = 1 AND SERVICE_STATUS = 1)), '[]'))),']'),'"[', '['), ']"', ']') AS data FROM category_master c where STATUS = 1 and ID IN (SELECT CATEGORY_ID FROM view_b2b_availability_mapping where CUSTOMER_ID = ?  and IS_AVAILABLE = 1 AND SERVICE_STATUS = 1);`
                            qdata.push(CustID);
                            qdata.push(CustID);

                        } else {
                            query = ` SET SESSION group_concat_max_len =10000000; 
                            SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', c.ID, 'title', c.NAME,'DESCRIPTION',c.DESCRIPTION,'ICON',c.ICON, 'disabled', 'true', 'children', IFNULL((SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', s.ID, 'title', s.NAME,'DESCRIPTION',s.DESCRIPTION,'ICON',s.IMAGE, 'isLeaf', 'true')),']'),'"[', '['),']"', ']') FROM sub_category_master s WHERE s.CATEGORY_ID = c.ID and STATUS = 1 and ID IN (select SUB_CATEGORY_ID from view_territory_service_non_availability_mapping where TERRITORY_ID =  ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1)), '[]'))),']'),'"[', '['), ']"', ']') AS data FROM category_master c where STATUS = 1 and ID IN (select CATEGORY_ID from view_territory_service_non_availability_mapping where TERRITORY_ID =  ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1);`;
                            qdata.push(teritory_id);
                            qdata.push(teritory_id);
                        }

                        mm.executeQueryData(query, qdata, supportKey, (error, results) => {
                            if (error) {
                                console.log(error)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                                res.send({
                                    code: 400,
                                    message: "Failed to get Data",
                                });
                            }
                            else {
                                var json = results[1][0].data
                                if (json) {
                                    json = json.replace(/\\/g, '');
                                    json = json.replace(/\"true\"/g, true).replace(/\"false\"/g, false)
                                }
                                //console.log(json);}
                                res.send({
                                    code: 200,
                                    message: "success",
                                    data: JSON.parse(json)
                                })
                            }
                        });
                    } else {
                        var query = ``
                        var qdata = []

                        query = ` SET SESSION group_concat_max_len =10000000; 
                            SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', c.ID, 'title', c.NAME,'DESCRIPTION',c.DESCRIPTION,'ICON',c.ICON, 'disabled', 'true', 'children', IFNULL((SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', s.ID, 'title', s.NAME,'DESCRIPTION',s.DESCRIPTION,'ICON',s.IMAGE, 'isLeaf', 'true')),']'),'"[', '['),']"', ']') FROM sub_category_master s WHERE s.CATEGORY_ID = c.ID and STATUS = 1 and ID IN (select SUB_CATEGORY_ID from view_territory_service_non_availability_mapping where TERRITORY_ID =  ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1)), '[]'))),']'),'"[', '['), ']"', ']') AS data FROM category_master c where STATUS = 1 and ID IN (select CATEGORY_ID from view_territory_service_non_availability_mapping where TERRITORY_ID =  ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1);`;
                        qdata.push(teritory_id);
                        qdata.push(teritory_id);
                        mm.executeQueryData(query, qdata, supportKey, (error, results) => {
                            if (error) {
                                console.log(error)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                                res.send({
                                    code: 400,
                                    message: "Failed to get Data",
                                });
                            }
                            else {
                                var json = results[1][0].data
                                if (json) {
                                    json = json.replace(/\\/g, '');
                                    json = json.replace(/\"true\"/g, true).replace(/\"false\"/g, false)
                                }
                                //console.log(json);}
                                res.send({
                                    code: 200,
                                    message: "success",
                                    data: JSON.parse(json)
                                })
                            }
                        });
                    }

                }
            });

        } else {
            res.send({
                code: 400,
                message: "Parameter missing - customer_id or teritory_id",
            });
        }

    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}

exports.getCategoriesHierarchy = (req, res) => {
    try {
        const customer_id = req.body.CUSTOMER_ID;
        const teritory_id = req.body.TERRITORY_ID;
        const sortKey = req.body.sortKey || 'SEQ_NO';
        const sortValue = req.body.sortValue || 'ASC'; // Default to ASC
        const supportKey = req.headers['supportkey'];
        const deviceid = req.headers['deviceid'];
        console.log("sortValue", sortValue)

        if (!customer_id && !teritory_id) {
            return res.send({
                code: 400,
                message: "Parameter missing - customer_id or teritory_id",
            });
        }

        mm.executeQueryData(
            `SELECT CUSTOMER_TYPE, IS_SPECIAL_CATALOGUE, CUSTOMER_DETAILS_ID 
             FROM customer_master 
             WHERE ID = ?`,
            [customer_id],
            supportKey,
            (error, resultsCustomer) => {
                if (error) {
                    console.log(error);
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey, supportKey, deviceid);
                    return res.send({ code: 400, message: "Failed to get Data" });
                }

                const hasCustomer = resultsCustomer.length > 0;
                const customerType = hasCustomer ? resultsCustomer[0].CUSTOMER_TYPE : null;
                const isSpecial = hasCustomer && resultsCustomer[0].IS_SPECIAL_CATALOGUE === 1;
                const CustID = hasCustomer && customerType === 'B' ? resultsCustomer[0].CUSTOMER_DETAILS_ID : customer_id;

                let query = '';
                let qdata = [];

                if (hasCustomer && customerType === 'B' && isSpecial) {
                    query = `
                        SET SESSION group_concat_max_len = 10000000;
                        SELECT REPLACE(REPLACE(CONCAT('[',
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'key', c.ID,
                                    'title', c.NAME,
                                    'DESCRIPTION', c.DESCRIPTION,
                                    'ICON', c.ICON,
                                    'disabled', 'true',
                                    'children', IFNULL((
                                        SELECT REPLACE(REPLACE(CONCAT('[',
                                            GROUP_CONCAT(
                                                JSON_OBJECT(
                                                    'key', s.ID,
                                                    'title', s.NAME,
                                                    'DESCRIPTION', s.DESCRIPTION,
                                                    'ICON', s.IMAGE,
                                                    'isLeaf', 'true'
                                                ) ORDER BY s.${sortKey} ${sortValue}
                                            ), ']'), '"[', '['), ']"', ']')
                                        FROM sub_category_master s
                                        WHERE s.CATEGORY_ID = c.ID AND s.STATUS = 1
                                        AND s.ID IN (
                                            SELECT SUB_CATEGORY_ID
                                            FROM view_b2b_availability_mapping
                                            WHERE CUSTOMER_ID = ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1
                                        )
                                    ), '[]')
                                ) ORDER BY c.${sortKey} ${sortValue}
                            ), ']'), '"[', '['), ']"', ']') AS data
                        FROM category_master c
                        WHERE STATUS = 1
                        AND ID IN (
                            SELECT CATEGORY_ID
                            FROM view_b2b_availability_mapping
                            WHERE CUSTOMER_ID = ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1
                        );
                    `;
                    qdata = [CustID, CustID];
                } else {
                    query = `
                        SET SESSION group_concat_max_len = 10000000;
                        SELECT REPLACE(REPLACE(CONCAT('[',
                            GROUP_CONCAT(
                                JSON_OBJECT(
                                    'key', c.ID,
                                    'title', c.NAME,
                                    'DESCRIPTION', c.DESCRIPTION,
                                    'ICON', c.ICON,
                                    'disabled', 'true',
                                    'children', IFNULL((
                                        SELECT REPLACE(REPLACE(CONCAT('[',
                                            GROUP_CONCAT(
                                                JSON_OBJECT(
                                                    'key', s.ID,
                                                    'title', s.NAME,
                                                    'DESCRIPTION', s.DESCRIPTION,
                                                    'ICON', s.IMAGE,
                                                    'isLeaf', 'true'
                                                ) ORDER BY s.${sortKey} ${sortValue}
                                            ), ']'), '"[', '['), ']"', ']')
                                        FROM sub_category_master s
                                        WHERE s.CATEGORY_ID = c.ID AND s.STATUS = 1
                                        AND s.ID IN (
                                            SELECT SUB_CATEGORY_ID
                                            FROM view_territory_service_non_availability_mapping
                                            WHERE TERRITORY_ID = ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1
                                        )
                                    ), '[]')
                                ) ORDER BY c.${sortKey} ${sortValue}
                            ), ']'), '"[', '['), ']"', ']') AS data
                        FROM category_master c
                        WHERE STATUS = 1
                        AND ID IN (
                            SELECT CATEGORY_ID
                            FROM view_territory_service_non_availability_mapping
                            WHERE TERRITORY_ID = ? AND IS_AVAILABLE = 1 AND SERVICE_STATUS = 1
                        );
                    `;
                    qdata = [teritory_id, teritory_id];
                }

                mm.executeQueryData(query, qdata, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey, supportKey, deviceid);
                        return res.send({ code: 400, message: "Failed to get Data" });
                    }

                    let json = results[1][0].data;
                    if (json) {
                        json = json.replace(/\\/g, '').replace(/\"true\"/g, true).replace(/\"false\"/g, false);
                    }

                    return res.send({
                        code: 200,
                        message: "success",
                        data: JSON.parse(json)
                    });
                });
            }
        );
    } catch (error) {
        console.log(error);
        const supportKey = req.headers['supportkey'];
        const deviceid = req.headers['deviceid'];
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey, supportKey, deviceid);
        return res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.getServices = (req, res) => {
    try {

        console.log(req.body)
        var teritory_id = req.body.TERRITORY_ID;
        var customer_id = req.body.CUSTOMER_ID;
        var subcategory_id = req.body.SUB_CATEGORY_ID;
        var searchkey = req.body.SEARCHKEY;
        var parentID = req.body.PARENT_ID;
        var customerCategoryType = req.body.CUSTOMER_TYPE;

        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';


        // var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (((customerCategoryType == 'I' && teritory_id) || (customerCategoryType != 'I' && customer_id)) && subcategory_id) {
            var start = 0;
            var end = 0;
            var filter = ` and S.SUB_CATEGORY_ID = ${subcategory_id} ` + (parentID ? `AND S.PARENT_ID = ${parentID} ` : ` AND S.PARENT_ID=0 `) + (searchkey ? `AND S.NAME LIKE ${searchkey}` : ``)
            var filterAll = filter + (customerCategoryType == 'I' ? ` AND S.SERVICE_TYPE IN ('C','O')` : ` AND S.SERVICE_TYPE IN ('B','O')`) + ``;
            let criteria = '';
            let countCriteria = filter;

            if (pageIndex != '' && pageSize != '') {
                start = (pageIndex - 1) * pageSize;
                end = pageSize;
            }

            var dataquery = []
            dataquery.push(teritory_id)
            dataquery.push(subcategory_id)
            parentID ? dataquery.push(parentID) : true;
            searchkey ? dataquery.push(searchkey) : true;

            var keyData = customerCategoryType == 'I' ? 'B2C_PRICE' : 'B2B_PRICE';

            if (pageIndex === '' && pageSize === '')
                criteria = filter + " order by " + sortKey + " " + sortValue;
            else
                criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

            var supportKey = req.headers['supportkey'];

            var deviceid = req.headers['deviceid'];

            mm.executeQueryData('select count(*) as cnt from view_service_master S where ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ?  and IS_AVAILABLE = 1 AND S.STATUS=1)  ' + countCriteria, dataquery, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get services count.",
                    });
                }
                else {

                    var Query = ``;
                    console.log("here 1: ", customerCategoryType);

                    if (customerCategoryType == 'I') {
                        Query = ` SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_PERIOD, S.GUARANTEE_PERIOD) AS GUARANTEE_PERIOD,
    COALESCE(T.WARRANTY_PERIOD, S.PREPARATION_HOURS) AS PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_ALLOWED, S.GUARANTEE_ALLOWED) AS GUARANTEE_ALLOWED,
    COALESCE(T.WARRANTY_ALLOWED, S.WARRANTY_ALLOWED) AS WARRANTY_ALLOWED,
    COALESCE(T.SERVICE_DETAILS_IMAGE, S.SERVICE_DETAILS_IMAGE) AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
     S.IS_FOR_B2B = 0 AND S.STATUS = 1 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}
UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    S.SERVICE_IMAGE AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
     NULL AS GUARANTEE_PERIOD,
    NULL AS PREPARATION_HOURS,
    NULL AS GUARANTEE_ALLOWED,
    NULL AS WARRANTY_ALLOWED,
    NULL AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
     (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id}  AND T.IS_AVAILABLE =1   ${filter}
    ) and S.IS_FOR_B2B = 0 AND S.STATUS = 1
ORDER BY 
    ID ASC;`;

                        console.log("here :  ", Query);

                        //SELECT m.*, 0 AS QUANTITY, t.${keyData} AS KEY_PRICE, t.B2B_PRICE as B2B_PRICE, t.B2C_PRICE AS B2C_PRICE, t.EXPRESS_COST AS EXPRESS_COST,t.SERVICE_TYPE as T_SERVICE_TYPE,t.PREPARATION_HOURS AS T_PREPARATION_HOURS,t.PREPARATION_MINUTES AS T_PREPARATION_MINUTES,t.START_TIME AS T_START_TIME,t.END_TIME AS T_END_TIME FROM  view_service_master m  JOIN territory_service_non_availability_mapping t ON t.SERVICE_ID = m.ID AND t.TERRITORY_ID = ? AND t.IS_AVAILABLE = 1
                        mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);

                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services information."
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
                    else {

                        mm.executeQueryData('select CUSTOMER_TYPE,IS_SPECIAL_CATALOGUE,CUSTOMER_DETAILS_ID from customer_master where ID = ?; ', [customer_id], supportKey, (error, results11) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services count.",
                                });
                            }
                            else {
                                if (results11.length > 0) {

                                    if (results11[0].IS_SPECIAL_CATALOGUE) {

                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_PERIOD, S.GUARANTEE_PERIOD) AS GUARANTEE_PERIOD,
    COALESCE(T.WARRANTY_PERIOD, S.PREPARATION_HOURS) AS PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_ALLOWED, S.GUARANTEE_ALLOWED) AS GUARANTEE_ALLOWED,
    COALESCE(T.WARRANTY_ALLOWED, S.WARRANTY_ALLOWED) AS WARRANTY_ALLOWED,
    COALESCE(T.SERVICE_DETAILS_IMAGE, S.SERVICE_DETAILS_IMAGE) AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT
FROM 
    view_service_master S
JOIN 
    view_b2b_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID}
WHERE 
  S.IS_PARENT = 0 AND T.IS_AVAILABLE =1  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS CUSTOMER_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    S.SERVICE_IMAGE AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
     NULL AS GUARANTEE_PERIOD,
    NULL AS PREPARATION_HOURS,
    NULL AS GUARANTEE_ALLOWED,
    NULL AS WARRANTY_ALLOWED,
    NULL AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_b2b_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} AND T.IS_AVAILABLE =1 
    ) ${filter}
ORDER BY 
    ID ASC;`
                                        console.log("HERE ", Query);


                                    } else {

                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
     COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_PERIOD, S.GUARANTEE_PERIOD) AS GUARANTEE_PERIOD,
    COALESCE(T.WARRANTY_PERIOD, S.PREPARATION_HOURS) AS PREPARATION_HOURS,
    COALESCE(T.GUARANTEE_ALLOWED, S.GUARANTEE_ALLOWED) AS GUARANTEE_ALLOWED,
    COALESCE(T.WARRANTY_ALLOWED, S.WARRANTY_ALLOWED) AS WARRANTY_ALLOWED,
    COALESCE(T.SERVICE_DETAILS_IMAGE, S.SERVICE_DETAILS_IMAGE) AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
    S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    S.SERVICE_IMAGE AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    NULL AS GUARANTEE_PERIOD,
    NULL AS PREPARATION_HOURS,
    NULL AS GUARANTEE_ALLOWED,
    NULL AS WARRANTY_ALLOWED,
    NULL AS SERVICE_DETAILS_IMAGE,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1  ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id} AND T.IS_AVAILABLE =1    ${filter}
    ) and S.IS_FOR_B2B = 0 
ORDER BY 
    ID ASC;`

                                    }

                                    //SELECT m.*, 0 AS QUANTITY, t.${keyData} AS KEY_PRICE, t.B2B_PRICE as B2B_PRICE, t.B2C_PRICE AS B2C_PRICE, t.EXPRESS_COST AS EXPRESS_COST,t.SERVICE_TYPE as T_SERVICE_TYPE,t.PREPARATION_HOURS AS T_PREPARATION_HOURS,t.PREPARATION_MINUTES AS T_PREPARATION_MINUTES,t.START_TIME AS T_START_TIME,t.END_TIME AS T_END_TIME FROM  view_service_master m  JOIN territory_service_non_availability_mapping t ON t.SERVICE_ID = m.ID AND t.TERRITORY_ID = ? AND t.IS_AVAILABLE = 1
                                    mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                                        if (error) {
                                            console.log(error);

                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get services information."
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


                                } else {

                                    res.send({
                                        "code": 201,
                                        "message": "No customer data found.",
                                    });
                                    // return;
                                    console.log("No customer data found.");


                                }

                            }
                        });

                    }

                }
            });

        } else {

            res.send({
                "code": 400,
                "message": "parameter missing- teritory_id, subcategory_id ."
            });

        }

    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}



//chnaged by darshan on 26-03-25 for custom filter
exports.getServicesForWeb = (req, res) => {
    try {

        console.log(req.body)
        var teritory_id = req.body.TERRITORY_ID;
        var customer_id = req.body.CUSTOMER_ID;
        var subcategory_id = req.body.SUB_CATEGORY_ID;
        var searchkey = req.body.SEARCHKEY;
        var parentID = req.body.PARENT_ID;
        var customerCategoryType = req.body.CUSTOMER_TYPE;
        let customFilter = req.body.filter

        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';


        // var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (((customerCategoryType == 'I' && teritory_id) || (customerCategoryType != 'I' && customer_id)) && subcategory_id) {
            var start = 0;
            var end = 0;
            var filter = `${customFilter} and S.CATEGORY_ID = ${subcategory_id} ` + (parentID ? `AND S.PARENT_ID = ${parentID} ` : ` AND S.PARENT_ID=0 `) + (searchkey ? `AND S.NAME LIKE ${searchkey}` : ``)
            var filterAll = filter + (customerCategoryType == 'I' ? ` AND S.SERVICE_TYPE IN ('C','O')` : ` AND S.SERVICE_TYPE IN ('B','O')`) + ``;
            let criteria = '';
            let countCriteria = customFilter + filter;

            if (pageIndex != '' && pageSize != '') {
                start = (pageIndex - 1) * pageSize;
                end = pageSize;
            }

            var dataquery = []
            dataquery.push(teritory_id)
            dataquery.push(subcategory_id)
            parentID ? dataquery.push(parentID) : true;
            searchkey ? dataquery.push(searchkey) : true;
            var customerFilter = '';
            if (customer_id) {
                customerFilter = ` AND CUSTOMER_ID = ${customer_id}`
            }

            var keyData = customerCategoryType == 'I' ? 'B2C_PRICE' : 'B2B_PRICE';

            if (pageIndex === '' && pageSize === '')
                criteria = filter + " order by " + sortKey + " " + sortValue;
            else
                criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

            var supportKey = req.headers['supportkey'];

            var deviceid = req.headers['deviceid'];

            mm.executeQueryData('select count(*) as cnt from view_service_master S where ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ?  and IS_AVAILABLE = 1 )  ' + countCriteria, dataquery, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get services count.",
                    });
                }
                else {

                    var Query = ``;
                    console.log("here 1: ", customerCategoryType);

                    if (customerCategoryType == 'I') {
                        Query = ` SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    0 as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = 'S' AND CART_STATUS = 'C' ORDER BY ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
     S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}
UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = 'S' AND CART_STATUS = 'C' ORDER BY ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id}  AND T.IS_AVAILABLE =1   ${filter}
    ) and S.IS_FOR_B2B = 0
ORDER BY 
    ID ASC;`;

                        console.log("here :  ", Query);

                        //SELECT m.*, 0 AS QUANTITY, t.${keyData} AS KEY_PRICE, t.B2B_PRICE as B2B_PRICE, t.B2C_PRICE AS B2C_PRICE, t.EXPRESS_COST AS EXPRESS_COST,t.SERVICE_TYPE as T_SERVICE_TYPE,t.PREPARATION_HOURS AS T_PREPARATION_HOURS,t.PREPARATION_MINUTES AS T_PREPARATION_MINUTES,t.START_TIME AS T_START_TIME,t.END_TIME AS T_END_TIME FROM  view_service_master m  JOIN territory_service_non_availability_mapping t ON t.SERVICE_ID = m.ID AND t.TERRITORY_ID = ? AND t.IS_AVAILABLE = 1
                        mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);

                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services information."
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
                    else {

                        mm.executeQueryData('select CUSTOMER_TYPE,IS_SPECIAL_CATALOGUE,CUSTOMER_DETAILS_ID from customer_master where ID = ?; ', [customer_id], supportKey, (error, results11) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services count.",
                                });
                            }
                            else {
                                if (results11.length > 0) {

                                    if (results11[0].IS_SPECIAL_CATALOGUE) {
                                        // console.log("\n\n\n\n\n\n")
                                        // console.log("CUSTOMER HAVE SPAECIAL CATALOG :  ", results11);
                                        // console.log("\n\n\n\n\n\n")
                                        customerFilter = ` AND CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID}`;
                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    view_b2b_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID}
WHERE 
  S.IS_PARENT = 0 AND T.IS_AVAILABLE =1  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS CUSTOMER_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ${customer_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_b2b_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.CUSTOMER_ID = ${results11[0].CUSTOMER_DETAILS_ID} AND T.IS_AVAILABLE =1 
    ) ${filter}
ORDER BY 
    ID ASC;`
                                        console.log("HERE ", Query);


                                    } else {
                                        // console.log("\n\n\n\n\n\n")
                                        // console.log("CUSTOMER dont HAVE SPAECIAL CATALOG :  ", results11);
                                        // console.log("\n\n\n\n\n\n")
                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    view_territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
    S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1  ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN view_territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id} AND T.IS_AVAILABLE =1    ${filter}
    ) and S.IS_FOR_B2B = 0 
ORDER BY 
    ID ASC;`

                                    }

                                    //SELECT m.*, 0 AS QUANTITY, t.${keyData} AS KEY_PRICE, t.B2B_PRICE as B2B_PRICE, t.B2C_PRICE AS B2C_PRICE, t.EXPRESS_COST AS EXPRESS_COST,t.SERVICE_TYPE as T_SERVICE_TYPE,t.PREPARATION_HOURS AS T_PREPARATION_HOURS,t.PREPARATION_MINUTES AS T_PREPARATION_MINUTES,t.START_TIME AS T_START_TIME,t.END_TIME AS T_END_TIME FROM  view_service_master m  JOIN territory_service_non_availability_mapping t ON t.SERVICE_ID = m.ID AND t.TERRITORY_ID = ? AND t.IS_AVAILABLE = 1
                                    mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                                        if (error) {
                                            console.log(error);

                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get services information."
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


                                } else {

                                    res.send({
                                        "code": 201,
                                        "message": "No customer data found.",
                                    });
                                    // return;
                                    console.log("No customer data found.");


                                }

                            }
                        });

                    }

                }
            });

        } else {

            res.send({
                "code": 400,
                "message": "parameter missing- teritory_id, subcategory_id ."
            });

        }

    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}



exports.getServicesForWebOld = (req, res) => {
    try {

        console.log(req.body)
        var teritory_id = req.body.TERRITORY_ID;
        var customer_id = req.body.CUSTOMER_ID;
        var subcategory_id = req.body.SUB_CATEGORY_ID;
        var searchkey = req.body.SEARCHKEY;
        var parentID = req.body.PARENT_ID;
        var customerCategoryType = req.body.CUSTOMER_TYPE;

        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';


        // var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (((customerCategoryType == 'I' && teritory_id) || (customerCategoryType != 'I' && customer_id)) && subcategory_id) {
            var start = 0;
            var end = 0;
            var filter = ` and S.CATEGORY_ID = ${subcategory_id} ` + (parentID ? `AND S.PARENT_ID = ${parentID} ` : ` AND S.PARENT_ID=0 `) + (searchkey ? `AND S.NAME LIKE ${searchkey}` : ``) + (customerCategoryType == 'I' ? ` AND S.SERVICE_TYPE IN ('C','O')` : ` AND S.SERVICE_TYPE IN ('B','O')`) + ``;
            let criteria = '';
            let countCriteria = filter;

            if (pageIndex != '' && pageSize != '') {
                start = (pageIndex - 1) * pageSize;
                end = pageSize;
            }

            var dataquery = []
            dataquery.push(teritory_id)
            dataquery.push(subcategory_id)
            parentID ? dataquery.push(parentID) : true;
            searchkey ? dataquery.push(searchkey) : true;

            var keyData = customerCategoryType == 'I' ? 'B2C_PRICE' : 'B2B_PRICE';

            if (pageIndex === '' && pageSize === '')
                criteria = filter + " order by " + sortKey + " " + sortValue;
            else
                criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

            var supportKey = req.headers['supportkey'];

            var deviceid = req.headers['deviceid'];

            mm.executeQueryData('select count(*) as cnt from view_service_master S where ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ?  and IS_AVAILABLE = 1 )  ' + countCriteria, dataquery, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get services count.",
                    });
                }
                else {

                    var Query = ``;
                    console.log("here 1: ", customerCategoryType);

                    if (customerCategoryType == 'I') {
                        Query = ` SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(T.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID AND CUSTOMER_ID = ${customer_id} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
     S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filter}
UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
     (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
     IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID AND CUSTOMER_ID = ${customer_id} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id}  AND T.IS_AVAILABLE =1   ${filter}
    ) and S.IS_FOR_B2B = 0
ORDER BY 
    ID ASC;`;

                        console.log("here :  ", Query);

                        //SELECT m.*, 0 AS QUANTITY, t.${keyData} AS KEY_PRICE, t.B2B_PRICE as B2B_PRICE, t.B2C_PRICE AS B2C_PRICE, t.EXPRESS_COST AS EXPRESS_COST,t.SERVICE_TYPE as T_SERVICE_TYPE,t.PREPARATION_HOURS AS T_PREPARATION_HOURS,t.PREPARATION_MINUTES AS T_PREPARATION_MINUTES,t.START_TIME AS T_START_TIME,t.END_TIME AS T_END_TIME FROM  view_service_master m  JOIN territory_service_non_availability_mapping t ON t.SERVICE_ID = m.ID AND t.TERRITORY_ID = ? AND t.IS_AVAILABLE = 1
                        mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);

                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services information."
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
                    else {

                        mm.executeQueryData('select CUSTOMER_TYPE,IS_SPECIAL_CATALOGUE from customer_master where ID = ?; ', [customer_id], supportKey, (error, results11) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services count.",
                                });
                            }
                            else {
                                if (results11.length > 0) {

                                    if (results11[0].IS_SPECIAL_CATALOGUE) {

                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(T.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID AND CUSTOMER_ID = ${customer_id} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    b2b_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ${customer_id}
WHERE 
  S.IS_PARENT = 0 AND T.IS_AVAILABLE =1  ${filter}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS CUSTOMER_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ${customer_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID AND CUSTOMER_ID = ${customer_id} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN b2b_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.CUSTOMER_ID = ${customer_id} AND T.IS_AVAILABLE =1 
    ) ${filter}
ORDER BY 
    ID ASC;`
                                        console.log("HERE ", Query);


                                    } else {

                                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(T.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID AND CUSTOMER_ID = ${customer_id} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
    S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filter}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
	NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1  ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID AND CUSTOMER_ID = ${customer_id} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID = 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id} AND T.IS_AVAILABLE =1    ${filter}
    ) and S.IS_FOR_B2B = 0 
ORDER BY 
    ID ASC;`

                                    }

                                    //SELECT m.*, 0 AS QUANTITY, t.${keyData} AS KEY_PRICE, t.B2B_PRICE as B2B_PRICE, t.B2C_PRICE AS B2C_PRICE, t.EXPRESS_COST AS EXPRESS_COST,t.SERVICE_TYPE as T_SERVICE_TYPE,t.PREPARATION_HOURS AS T_PREPARATION_HOURS,t.PREPARATION_MINUTES AS T_PREPARATION_MINUTES,t.START_TIME AS T_START_TIME,t.END_TIME AS T_END_TIME FROM  view_service_master m  JOIN territory_service_non_availability_mapping t ON t.SERVICE_ID = m.ID AND t.TERRITORY_ID = ? AND t.IS_AVAILABLE = 1
                                    mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                                        if (error) {
                                            console.log(error);

                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get services information."
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


                                } else {

                                    res.send({
                                        "code": 201,
                                        "message": "No customer data found.",
                                    });
                                    // return;
                                    console.log("No customer data found.");


                                }

                            }
                        });

                    }

                }
            });

        } else {

            res.send({
                "code": 400,
                "message": "parameter missing- teritory_id, subcategory_id ."
            });

        }

    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}



function addGlobalData(ORDER_ID, supportKey) {
    try {
        mm.executeQueryData(`select ORDER_NUMBER,CUSTOMER_NAME,MOBILE_NO,EMAIL,TERRITORY_NAME,SERVICE_ADDRESS,TERRITORY_ID from view_order_master where ID = ?`, [ORDER_ID], supportKey, (error, results5) => {
            if (error) {
                console.log(`Error to find order data`, error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(ORDER_ID, "Order", results5[0].ORDER_NUMBER, JSON.stringify(results5[0]), "/order-list", results5[0].TERRITORY_ID, supportKey)
                    let logData = { ID: ORDER_ID, CATEGORY: "Order", TITLE: results5[0].ORDER_NUMBER, DATA: JSON.stringify(results5[0]), ROUTE: "/order-list", TERRITORY_ID: results5[0].TERRITORY_ID };
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



function addJobGlobalData(JOB_ID, supportKey) {
    try {
        mm.executeQueryData(`select ORDER_NO,JOB_CARD_NO,CUSTOMER_NAME,TERRITORY_NAME,TERRITORY_ID,SERVICE_NAME,SERVICE_ADDRESS,START_TIME,END_TIME,SCHEDULED_DATE_TIME,ESTIMATED_TIME_IN_MIN,TECHNICIAN_NAME,PINCODE,EXPECTED_DATE_TIME,SERVICE_AMOUNT from view_job_card where ID = ?`, [JOB_ID], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(JOB_ID, "Job", results5[0].JOB_CARD_NO, JSON.stringify(results5[0]), "/overview/jobs", supportKey)
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

exports.updateOrder = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var ORDER_DATA = req.body.ORDER_DATA;
    var SERVICE_ADDRESS_DATA = req.body.SERVICE_ADDRESS_DATA;
    var BILLING_ADDRESS_DATA = req.body.BILLING_ADDRESS_DATA;
    var ORDER_DETAILS_DATA = req.body.ORDER_DETAILS_DATA
    var SUMMARY_DATA = req.body.SUMMARY_DATA;
    var DELETED_DATA = req.body.DELETED_DATA;
    var username = req.body.USERNAME;
    console.log("here : ", SUMMARY_DATA, ORDER_DETAILS_DATA)
    var systemDate = mm.getSystemDate();
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
            mm.executeDML(`SELECT * FROM view_order_master where ID = ? ;`, [ORDER_DATA.ID], supportKey, connection, (error, orderResult) => {
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
                    let newSequenceNumber = 1;
                    if (orderResult.length > 0) {

                        if (orderResult[0].ORDER_STATUS == 'OP') {

                            mm.executeDML(`update order_master set  PAYMENT_MODE= ?,TOTAL_AMOUNT=?, FINAL_AMOUNT=?,SPECIAL_INSTRUCTIONS=?,IS_EXPRESS=?,SERVICE_COUNT=?,TOTAL_TAXABLE_AMOUNT=?,DISCOUNT_AMOUNT=?,EXPRESS_DELIVERY_CHARGES=?,TAX_AMOUNT=?, EXPECTED_DATE_TIME = ?,IS_EXPRESS = ? where ID = ?;`,
                                [SUMMARY_DATA.PAYMENT_MODE, SUMMARY_DATA.TOTAL_AMOUNT, SUMMARY_DATA.FINAL_AMOUNT, SUMMARY_DATA.SPECIAL_INSTRUCTIONS, ORDER_DATA.IS_EXPRESS, ORDER_DATA.SERVICE_COUNT, ORDER_DATA.TOTAL_TAXABLE_AMOUNT, ORDER_DATA.DISCOUNT_AMOUNT, ORDER_DATA.EXPRESS_DELIVERY_CHARGES, ORDER_DATA.TAX_AMOUNT, SUMMARY_DATA.EXPECTED_DATE_TIME, ORDER_DATA.IS_EXPRESS, ORDER_DATA.ID], supportKey, connection, (error, results3) => {
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

                                        updateOrderDetails(ORDER_DETAILS_DATA, orderResult[0].ID, ORDER_DATA.CUSTOMER_ID, supportKey, req, connection, (error) => {
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



                                                var queriz = `update order_summery_details set GROSS_AMOUNT = ?,TAX_RATE = ?,COUPON_CHARGES = ?,DISCOUNT_CHARGES = ?,TOTAL_TAX = ?,SERVICE_CHARGES = ?,NET_AMOUNT = ? where ORDER_ID = ?;`


                                                mm.executeDML(queriz, [SUMMARY_DATA.GROSS_AMOUNT, SUMMARY_DATA.TAX_RATE, SUMMARY_DATA.COUPON_CHARGES, SUMMARY_DATA.DISCOUNT_CHARGES, SUMMARY_DATA.TOTAL_TAX, SUMMARY_DATA.SERVICE_CHARGES, SUMMARY_DATA.NET_AMOUNT, ORDER_DATA.ID], supportKey, connection, (error, results5) => {
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

                                                        if (DELETED_DATA.length > 0) {

                                                            deleteOrders(DELETED_DATA, req.body.authData, supportKey, connection, req, (error) => {
                                                                if (error) {

                                                                    mm.rollbackConnection(connection)
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to save orderMaster information..."
                                                                    });

                                                                } else {

                                                                    mm.commitConnection(connection);

                                                                    // ORDER_DATA.ORDER_NUMBER = ORDER_NUMBER;
                                                                    // addGlobalData(results.insertId, supportKey)


                                                                    console.log(req.body.authData.data.UserData[0]);
                                                                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has successfully placed an order for customer ${ORDER_DATA.CUSTOMER_NAME}.`
                                                                    // require('../global').actionLogs(0, 0, results.insertId, 0, ORDER_DATA.CUSTOMER_ID, 'Order', 'User', ACTION_DETAILS, req.body.authData.data.UserData[0].USER_ID, "", data.EXPECTED_DATE_TIME, 0, data.EXPECTED_DATE_TIME, data.ORDER_MEDIUM, data.ORDER_STATUS, data.PAYMENT_MODE, data.PAYMENT_STATUS, data.TOTAL_AMOUNT, data.ORDER_NUMBER, "", 0, "", "", req.body.authData.data.UserData[0].NAME, supportKey)
                                                                    // mm.sendNotificationToCustomer(ORDER_DATA.CUSTOMER_ID, "**Order Placed Successfully**", `Your order ${ORDER_NUMBER} has been placed successfully. Thank you for choosing us!`, "", "", supportKey);
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "Successfully to save orderMaster information..."
                                                                    });

                                                                }
                                                            })

                                                        }
                                                        else {

                                                            mm.commitConnection(connection);

                                                            // ORDER_DATA.ORDER_NUMBER = ORDER_NUMBER;
                                                            // addGlobalData(results.insertId, supportKey)

                                                            console.log(req.body.authData.data.UserData[0]);
                                                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has successfully placed the order for customer ${ORDER_DATA.CUSTOMER_NAME}.`
                                                            // require('../global').actionLogs(0, 0, results.insertId, 0, ORDER_DATA.CUSTOMER_ID, 'Order', 'User', ACTION_DETAILS, req.body.authData.data.UserData[0].USER_ID, "", data.EXPECTED_DATE_TIME, 0, data.EXPECTED_DATE_TIME, data.ORDER_MEDIUM, data.ORDER_STATUS, data.PAYMENT_MODE, data.PAYMENT_STATUS, data.TOTAL_AMOUNT, data.ORDER_NUMBER, "", 0, "", "", req.body.authData.data.UserData[0].NAME, supportKey)
                                                            // mm.sendNotificationToCustomer(ORDER_DATA.CUSTOMER_ID, "**Order Placed Successfully**", `Your order ${ORDER_NUMBER} has been placed successfully. Thank you for choosing us!`, "", "", supportKey);
                                                            res.send({
                                                                "code": 200,
                                                                "message": "Successfully to save orderMaster information..."
                                                            });
                                                        }

                                                    }
                                                });

                                            }
                                        })

                                    }
                                });

                        } else {

                            res.send({
                                "code": 422,
                                "message": "Order cannot be updated as it is already processed."
                            });

                        }

                    }
                    else {

                        res.send({
                            "code": 400,
                            "message": "Order not found."
                        });

                    }

                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }

}


function updateOrderDetails(ORDER_DETAILS_DATA, ORDER_ID, CUSTOMER_ID, supportKey, req, connection, callback) {
    try {
        var systemDate = mm.getSystemDate();

        // var orderDetailsData = []
        // for (let index = 0; index < ORDER_DETAILS_DATA.length; index++) {
        //     const element = ORDER_DETAILS_DATA[index];
        //     orderDetailsData.push([results.insertId, element.SERVICE_CATALOGUE_ID, element.SERVICE_ITEM_ID, element.CATEGORY_ID, element.SUB_CATEGORY_ID, element.JOB_CARD_ID, element.QUANTITY, element.RATE, element.UNIT_ID, element.TOTAL_AMOUNT, ORDER_DATA.CLIENT_ID, element.TAXABLE_AMOUNT, element.UNIT_NAME, element.TAX_RATE, element.TAX_AMOUNT, element.TOTAL_AMOUNT, element.IS_EXPRESS, element.EXPRESS_DELIVERY_CHARGES, element.TOTAL_DURARTION_MIN, element.DURARTION_MIN, element.DURARTION_HOUR, element.IS_JOB_CREATED_DIRECTLY, element.START_TIME, element.END_TIME, element.CESS, element.CGST, element.SGST, element.IGST, element.MAX_QTY, element.PREPARATION_HOURS, element.PREPARATION_MINUTES, element.CATEGORY_NAME, element.SUB_CATEGORY_NAME, element.SERVICE_PARENT_NAME, element.SERVICE_NAME])
        // }


        async.eachSeries(ORDER_DETAILS_DATA, function (orderDetailsItem, intercallback) {
            var ids = [];
            mm.executeDML('select ID FROM order_details where ID=?', [orderDetailsItem.ID], supportKey, connection, (error, results4) => {
                if (error) {
                    console.log(error);
                    intercallback(error);
                }
                else {

                    if (results4.length > 0) {
                        ids.push(results4[0].ID)
                        mm.executeDML('UPDATE order_details SET  QUANTITY = ?, RATE = ?, TOTAL_AMOUNT = ?,  TAX_EXCLUSIVE_AMOUNT = ?, TAX_RATE = ?, TAX_AMOUNT = ?, TAX_INCLUSIVE_AMOUNT = ?, IS_EXPRESS = ?, EXPRESS_DELIVERY_CHARGES = ?, TOTAL_DURARTION_MIN = ?, DURARTION_MIN = ?, DURARTION_HOUR = ?, START_TIME = ?, END_TIME = ?, CESS = ?, CGST = ?, SGST = ?, IGST = ?, MAX_QTY = ?, PREPARATION_HOURS = ?, PREPARATION_MINUTES = ?, CATEGORY_NAME = ?, SUB_CATEGORY_NAME = ?, SERVICE_PARENT_NAME = ?, SERVICE_NAME = ?,TOTAL_TAX_EXCLUSIVE_AMOUNT=? where ID = ?',
                            [orderDetailsItem.QUANTITY, orderDetailsItem.RATE, orderDetailsItem.TOTAL_AMOUNT, orderDetailsItem.TAX_EXCLUSIVE_AMOUNT, orderDetailsItem.TAX_RATE, orderDetailsItem.TAX_AMOUNT, orderDetailsItem.TAX_INCLUSIVE_AMOUNT, orderDetailsItem.IS_EXPRESS, orderDetailsItem.EXPRESS_DELIVERY_CHARGES, orderDetailsItem.TOTAL_DURARTION_MIN, orderDetailsItem.DURARTION_MIN, orderDetailsItem.DURARTION_HOUR, orderDetailsItem.START_TIME, orderDetailsItem.END_TIME, orderDetailsItem.CESS, orderDetailsItem.CGST, orderDetailsItem.SGST, orderDetailsItem.IGST, orderDetailsItem.MAX_QTY, orderDetailsItem.PREPARATION_HOURS, orderDetailsItem.PREPARATION_MINUTES, orderDetailsItem.CATEGORY_NAME, orderDetailsItem.SUB_CATEGORY_NAME, orderDetailsItem.SERVICE_PARENT_NAME, orderDetailsItem.SERVICE_NAME, orderDetailsItem.TOTAL_TAX_EXCLUSIVE_AMOUNT, results4[0].ID], supportKey, connection, (error, results5) => {
                                if (error) {
                                    console.log(error);
                                    // mm.rollbackConnection(connection)
                                    intercallback(error);
                                }
                                else {
                                    intercallback();
                                }
                            });
                    } else {
                        var ordItem = [ORDER_ID, orderDetailsItem.SERVICE_CATALOGUE_ID, orderDetailsItem.SERVICE_ITEM_ID, orderDetailsItem.CATEGORY_ID, orderDetailsItem.SUB_CATEGORY_ID, orderDetailsItem.JOB_CARD_ID, orderDetailsItem.QUANTITY, orderDetailsItem.RATE, orderDetailsItem.UNIT_ID, orderDetailsItem.TOTAL_AMOUNT, 1, orderDetailsItem.TAX_EXCLUSIVE_AMOUNT, orderDetailsItem.UNIT_NAME, orderDetailsItem.TAX_RATE, orderDetailsItem.TAX_AMOUNT, orderDetailsItem.TOTAL_AMOUNT, orderDetailsItem.IS_EXPRESS, orderDetailsItem.EXPRESS_DELIVERY_CHARGES, orderDetailsItem.TOTAL_DURARTION_MIN, orderDetailsItem.DURARTION_MIN, orderDetailsItem.DURARTION_HOUR, orderDetailsItem.IS_JOB_CREATED_DIRECTLY, orderDetailsItem.START_TIME, orderDetailsItem.END_TIME, orderDetailsItem.CESS, orderDetailsItem.CGST, orderDetailsItem.SGST, orderDetailsItem.IGST, orderDetailsItem.MAX_QTY, orderDetailsItem.PREPARATION_HOURS, orderDetailsItem.PREPARATION_MINUTES, orderDetailsItem.CATEGORY_NAME, orderDetailsItem.SUB_CATEGORY_NAME, orderDetailsItem.SERVICE_PARENT_NAME, orderDetailsItem.SERVICE_NAME, orderDetailsItem.TOTAL_TAX_EXCLUSIVE_AMOUNT]

                        mm.executeDML('INSERT INTO order_details (ORDER_ID,SERVICE_CATALOGUE_ID,SERVICE_ITEM_ID,CATEGORY_ID,SUB_CATEGORY_ID,JOB_CARD_ID,QUANTITY,RATE,UNIT_ID,TOTAL_AMOUNT,CLIENT_ID,TAX_EXCLUSIVE_AMOUNT,UNIT_NAME,TAX_RATE,TAX_AMOUNT,TAX_INCLUSIVE_AMOUNT,IS_EXPRESS, EXPRESS_DELIVERY_CHARGES,TOTAL_DURARTION_MIN,DURARTION_MIN,DURARTION_HOUR,IS_JOB_CREATED_DIRECTLY,START_TIME,END_TIME,CESS,CGST,SGST,IGST,MAX_QTY, PREPARATION_HOURS, PREPARATION_MINUTES, CATEGORY_NAME, SUB_CATEGORY_NAME, SERVICE_PARENT_NAME,SERVICE_NAME,TOTAL_TAX_EXCLUSIVE_AMOUNT) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);', ordItem, supportKey, connection, (error, results411) => {
                            if (error) {
                                console.log(error);
                                intercallback(error);
                            }
                            else {
                                ids.push(results411.insertId)
                                intercallback();
                            }
                        });

                    }

                }
            });
        }, function (err) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                console.log(req.body.authData.data.UserData[0]);
                var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has updated the order details.`
                const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "Order updated", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                dbm.saveLog(logData, technicianActionLog);
                callback();
            }
        })

    } catch (error) {
        console.log(error);
        callback(error);
    }

}


function deleteOrders(DELETED_DATA, authData, supportKey, connection, req, callback) {

    try {
        var systemDate = mm.getSystemDate();

        // var orderDetailsData = []
        // for (let index = 0; index < ORDER_DETAILS_DATA.length; index++) {
        //     const element = ORDER_DETAILS_DATA[index];
        //     orderDetailsData.push([results.insertId, element.SERVICE_CATALOGUE_ID, element.SERVICE_ITEM_ID, element.CATEGORY_ID, element.SUB_CATEGORY_ID, element.JOB_CARD_ID, element.QUANTITY, element.RATE, element.UNIT_ID, element.TOTAL_AMOUNT, ORDER_DATA.CLIENT_ID, element.TAXABLE_AMOUNT, element.UNIT_NAME, element.TAX_RATE, element.TAX_AMOUNT, element.TOTAL_AMOUNT, element.IS_EXPRESS, element.EXPRESS_DELIVERY_CHARGES, element.TOTAL_DURARTION_MIN, element.DURARTION_MIN, element.DURARTION_HOUR, element.IS_JOB_CREATED_DIRECTLY, element.START_TIME, element.END_TIME, element.CESS, element.CGST, element.SGST, element.IGST, element.MAX_QTY, element.PREPARATION_HOURS, element.PREPARATION_MINUTES, element.CATEGORY_NAME, element.SUB_CATEGORY_NAME, element.SERVICE_PARENT_NAME, element.SERVICE_NAME])
        // }


        async.eachSeries(DELETED_DATA, function (orderDetailsItem, intercallback) {
            var ids = [];
            mm.executeDML('select ID FROM view_order_details where ID = ?;', [orderDetailsItem], supportKey, connection, (error, results4) => {
                if (error) {
                    console.log(error);
                    intercallback(error);
                }
                else {
                    if (results4.length > 0) {

                        mm.executeDML('DELETE FROM  order_details WHERE ID = ?;', [results4[0].ID], supportKey, connection, (error, results5) => {
                            if (error) {
                                console.log(error);
                                // mm.rollbackConnection(connection)
                                intercallback(error);
                            }
                            else {

                                //add log in log table

                                // const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has removed  job ${JOB_CARD_NO} for the technician ${TECHNICIAN_NAME}.`;
                                // const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: resultsjOB.insertId, CUSTOMER_ID: data.CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: data.TECHNICIAN_NAME, ORDER_DATE_TIME: data.EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: data.EXPECTED_DATE_TIME, ORDER_MEDIUM: OrderResult[0].ORDER_MEDIUM, ORDER_STATUS: OrderResult[0].ORDER_STATUS, PAYMENT_MODE: OrderResult[0].PAYMENT_MODE, PAYMENT_STATUS: OrderResult[0].PAYMENT_STATUS, TOTAL_AMOUNT: OrderResult[0].TOTAL_AMOUNT, ORDER_NUMBER: OrderResult[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "P", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                // dbm.saveLog(logData, technicianActionLog);


                                intercallback();
                            }
                        });

                    } else {

                        intercallback();

                    }

                }
            });
        }, function (err) {
            if (err) {
                console.log(err);
                callback(err);
            } else {
                // console.log(req.body.authData.data.UserData[0]);
                // var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has updated the order details.`
                // const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                // dbm.saveLog(logData, technicianActionLog);

                callback();
            }
        })

    } catch (error) {
        console.log(error);
        callback(error);
    }
}


exports.requestForReschedule = (req, res) => {
    try {

        const { ORDER_STATUS, EXPECTED_DATE_TIME, RESCHEDULE_REQUEST_REMARK, RESCHEDULE_REQUEST_REASON, ID } = req.body;
        const systemDate = mm.getSystemDate();
        var supportKey = req.headers['supportkey'];

        if (!ID) {
            res.send({
                code: 400,
                message: "ID and is required."
            });
            return;
        }
        if (!ORDER_STATUS) {
            res.send({
                code: 400,
                message: "ORDER_STATUS is required."
            });
            return;
        }
        if (ORDER_STATUS !== "RR") {
            res.send({
                code: 400,
                message: "Invalid ORDER_STATUS."
            });
            return;
        }
        let setData = "ORDER_STATUS_ID = ?, RESCHEDULE_REQUEST_DATE = ?,EXPECTED_DATE_TIME = ?,RESCHEDULE_REQUEST_REMARK = ?,RESCHEDULE_REQUEST_REASON = ?, CREATED_MODIFIED_DATE = ?";
        let recordData = [1, systemDate, EXPECTED_DATE_TIME, RESCHEDULE_REQUEST_REMARK, RESCHEDULE_REQUEST_REASON, systemDate, ID];


        const query = `UPDATE ${orderMaster} SET ${setData} WHERE ID = ?`;
        const connection = mm.openConnection();
        mm.executeDML(query, recordData, supportKey, connection, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                mm.rollbackConnection(connection);
                res.send({
                    code: 500,
                    message: "Failed to update orderMaster information."
                });
            } else {
                mm.executeDML(`select * FROM view_order_master where ID = ? `, ID, supportKey, connection, (error, results1) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        mm.rollbackConnection(connection);
                        console.log(error);
                        res.send({
                            code: 500,
                            message: "Failed to update orderMaster information."
                        });
                    } else {
                        var DESCRIPTION = '';
                        var TITLE = '';
                        TITLE = 'Request for order rescheduled'
                        DESCRIPTION = `The customer has requested for reschedule Order ${results1[0].ORDER_NUMBER}. Please take the necessary action.`
                        mm.sendNotificationToAdmin(8, `**${TITLE}**`, `${DESCRIPTION}`, "", "O", "", supportKey, "O", results1);
                        console.log(req.body.authData.data.UserData[0]);
                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has requested to reschedule order ${results1[0].ORDER_NUMBER}.`
                        const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results1[0].ID, JOB_CARD_ID: 0, CUSTOMER_ID: results1[0].CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: results1[0].ORDER_MEDIUM, ORDER_STATUS: 'Requested for order reschedule', PAYMENT_MODE: results1[0].PAYMENT_MODE, PAYMENT_STATUS: results1[0].PAYMENT_STATUS, TOTAL_AMOUNT: results1[0].TOTAL_AMOUNT, ORDER_NUMBER: results1[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                        dbm.saveLog(logData, technicianActionLog);
                        mm.commitConnection(connection);
                        res.send({
                            code: 200,
                            message: "OrderMaster information updated successfully."
                        });
                    }
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
};


// function sendWatsappMsg(req, res) {
//     var wBparams = [
//         {
//             "type": "text",
//             "text": "Darshan"
//         },
//         {
//             "type": "text",
//             "text": "1slkajsdlkjd"
//         },
//         {
//             "type": "text",
//             "text": 1234.12
//         },
//         {
//             "type": "text",
//             "text": "2025-12-12"
//         }
//     ]
//     var wparams = [
//         {
//             "type": "body",
//             "parameters": wBparams
//         }
//     ]

//     mm.sendWAToolSMS("919970812589", "service_order_placed_new", wparams, 'En', (error, resultswsms) => {
//         if (error) {
//             console.log(error)
//         }
//         else {
//             console.log(" whatsapp msg send : ", resultswsms)
//             res.send({
//                 code: 200,
//                 message: "OrderMaster information updated successfully."
//             })
//             // callback()
//         }
//     })

// }

exports.sendWatsappMsgs = (req, res) => {
    // sendWatsappMsg(req, res)
}



