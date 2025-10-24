const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var paymentGatewayMaster = "payment_gateway_master";
var viewPaymentGatewayMaster = "view_" + paymentGatewayMaster;


function reqData(req) {

    var data = {
        GATEWAY_NAME: req.body.GATEWAY_NAME,
        GATEWAY_TYPE: req.body.GATEWAY_TYPE,
        API_KEY: req.body.API_KEY,
        API_SECRET: req.body.API_SECRET,
        MERCHANT_ID: req.body.MERCHANT_ID,
        ENDPOINT_URL: req.body.ENDPOINT_URL,
        WEBHOOK_URL: req.body.WEBHOOK_URL,
        SUPPORTED_CURRENCIES: req.body.SUPPORTED_CURRENCIES,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        MODE: req.body.MODE,
        ENCRYPTION_KEY: req.body.ENCRYPTION_KEY,
        MIN_AMOUNT: req.body.MIN_AMOUNT ? req.body.MIN_AMOUNT : 0,
        MAX_AMOUNT: req.body.MAX_AMOUNT ? req.body.MAX_AMOUNT : 0,
        SETTLEMENT_TIME: req.body.SETTLEMENT_TIME,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('GATEWAY_NAME').optional(),
        body('GATEWAY_TYPE').optional(),
        body('API_KEY').optional(),
        body('API_SECRET').optional(),
        body('MERCHANT_ID').optional(),
        body('ENDPOINT_URL').optional(),
        body('WEBHOOK_URL').optional(),
        body('SUPPORTED_CURRENCIES').optional(),
        body('MODE').optional(),
        body('ENCRYPTION_KEY').optional(),
        body('MIN_AMOUNT').isDecimal().optional(),
        body('MAX_AMOUNT').isDecimal().optional(),
        body('SETTLEMENT_TIME').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewPaymentGatewayMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get payment gateway count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewPaymentGatewayMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get payment gateway information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 80,
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
            "code": 500,
            "message": "Something went wrong."
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
            mm.executeQueryData('INSERT INTO ' + paymentGatewayMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save payment gateway information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Payment gateway information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + paymentGatewayMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update payment gateway information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Payment gateway information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}