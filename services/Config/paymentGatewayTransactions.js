const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var paymentGatewayTransactions = "payment_gateway_transactions";
var viewPaymentGatewayTransactions = "view_" + paymentGatewayTransactions;

function reqData(req) {
    var data = {
        CART_ID: req.body.CART_ID,
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        VENDOR_ID: req.body.VENDOR_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        MEMBER_FROM: req.body.MEMBER_FROM ? '1' : '0',
        PAYMENT_FOR: req.body.PAYMENT_FOR,
        PAYMENT_MODE: req.body.PAYMENT_MODE,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_STATUS: req.body.TRANSACTION_STATUS,
        TRANSACTION_AMOUNT: req.body.TRANSACTION_AMOUNT,
        PAYLOAD: req.body.PAYLOAD,
        RESPONSE_DATA: req.body.RESPONSE_DATA,
        MERCHENT_ORDER_ID: req.body.MERCHENT_ORDER_ID,
        MERCHENT_ID: req.body.MERCHENT_ID,
        RESPONSE_MESSAGE: req.body.RESPONSE_MESSAGE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CART_ID').isInt().optional(),
        body('ORDER_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('VENDOR_ID').isInt().optional(),
        body('MOBILE_NUMBER').optional(),
        body('MEMBER_FROM').optional(),
        body('PAYMENT_FOR').optional(),
        body('PAYMENT_MODE').optional(),
        body('TRANSACTION_DATE').optional(),
        body('TRANSACTION_ID').optional(),
        body('TRANSACTION_STATUS').optional(),
        body('TRANSACTION_AMOUNT').optional(),
        body('PAYLOAD').optional(),
        body('RESPONSE_DATA').optional(),
        body('MERCHENT_ORDER_ID').optional(),
        body('MERCHENT_ID').optional(),
        body('RESPONSE_MESSAGE').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewPaymentGatewayTransactions + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get payment gateway transactions count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewPaymentGatewayTransactions + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get payment gateway transactions information."
                            });
                        }
                        else {
                            res.status(200).json({
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
            mm.executeQueryData('INSERT INTO ' + paymentGatewayTransactions + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save payment gateway transactions information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "Payment gateway transactions information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + paymentGatewayTransactions + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update payment gateway transactions information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "Payment gateway transactions information updated successfully...",
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



const request = require("request");

exports.createOrder = (req, res) => {
    const supportKey = ['supportkey'];
    const {
        CART_ID, ORDER_ID, CUSTOMER_ID,
        JOB_CARD_ID, PAYMENT_FOR, amount
    } = req.body;

    const key_id = "rzp_live_UOLu84DuvGULjK";
    const key_secret = "nmTJg1E5trqVWJYvkYyrQfeW";

    try {
        const options = {
            url: "https://api.razorpay.com/v1/orders",
            headers: {
                "content-type": "application/json"
            },
            auth: {
                user: key_id,
                pass: key_secret
            },
            body: {
                amount: amount, // amount in paise
                currency: "INR",
                receipt: `receipt_${CART_ID}_${Date.now()}`,
                notes: {
                    CART_ID,
                    ORDER_ID,
                    CUSTOMER_ID
                }
            },
            json: true
        };

        console.log("Creating Razorpay order with options:", options);

        request.post(options, (error, response, body) => {
            // Handle Razorpay API error (network or server)
            if (error) {
                console.log("Razorpay Request Error:", error);
                return res.status(500).json({
                    message: "Razorpay request failed.",
                    code: 500,
                    data: error
                });
            }

            // Determine if Razorpay responded with success or internal error format
            const isSuccess = body && body.id && !body.error;

            const razorpayOrderId = isSuccess ? body.id : null;

            const logData = [
                CART_ID,
                ORDER_ID,
                CUSTOMER_ID,
                JOB_CARD_ID,
                PAYMENT_FOR,
                mm.getSystemDate(),
                JSON.stringify(options),
                JSON.stringify(body),
                1,
                razorpayOrderId
            ];

            mm.executeQueryData(`INSERT INTO payment_getway_order_logs  (CART_ID, ORDER_ID, CUSTOMER_ID, JOB_CARD_ID, PAYMENT_FOR, TRANSACTION_DATE, PAYLOAD, RESPONSE_DATA, CLIENT_ID, RAZORPAY_ORDER_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`, logData, supportKey, (logErr, result) => {
                if (logErr) {
                    console.log("DB Logging Error:", logErr);
                    return res.status(400).json({
                        message: "Failed to save payment gateway logs.",
                        code: 400,
                        data: body
                    });
                }

                if (!isSuccess) {
                    console.log("Razorpay returned error object:", body);
                    return res.status(400).json({
                        message: "Failed to create Razorpay order.",
                        code: 400,
                        data: body
                    });
                }

                console.log("Razorpay Order Created Successfully:", body);
                return res.status(200).json({
                    message: "Order created successfully.",
                    code: 200,
                    data: body
                });
            }
            );
        });

    } catch (err) {
        console.error("Exception:", err);
        return res.status(500).json({
            message: "Something went wrong.",
            code: 500
        });
    }
};

