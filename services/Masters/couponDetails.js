const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

const applicationkey = process.env.APPLICATION_KEY;

var couponDetails = "coupon_details";
var viewCouponDetails = "view_" + couponDetails;


function reqData(req) {
    var data = {
        COUPON_MASTER_ID: req.body.COUPON_MASTER_ID,
        MAX_REDEMPTION_COUNT: req.body.MAX_REDEMPTION_COUNT,
        MINIMUM_ORDER_AMOUNT: req.body.MINIMUM_ORDER_AMOUNT ? req.body.MINIMUM_ORDER_AMOUNT : 0,
        MAXIMUM_ORDER_AMOUNT: req.body.MAXIMUM_ORDER_AMOUNT ? req.body.MAXIMUM_ORDER_AMOUNT : 0,
        MAXIMUM_DISCOUNT_AMOUNT: req.body.MAXIMUM_DISCOUNT_AMOUNT ? req.body.MAXIMUM_DISCOUNT_AMOUNT : 0,
        START_DATE: req.body.START_DATE,
        EXPIRY_DATE: req.body.EXPIRY_DATE,
        USAGE_LIMIT: req.body.USAGE_LIMIT,
        USAGE_LIMIT_PER_USER: req.body.USAGE_LIMIT_PER_USER,
        APPLICABLE_PRODUCTS: req.body.APPLICABLE_PRODUCTS,
        CLIENT_ID: req.body.CLIENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO
    }
    return data;
}


exports.validate = function () {
    return [
        body('COUPON_MASTER_ID').isInt().optional(),
        body('MAX_REDEMPTION_COUNT').isInt().optional(),
        body('MINIMUM_ORDER_AMOUNT').isDecimal().optional(),
        body('MAXIMUM_ORDER_AMOUNT').isDecimal().optional(),
        body('MAXIMUM_DISCOUNT_AMOUNT').isDecimal().optional(),
        body('START_DATE').optional(),
        body('EXPIRY_DATE').optional(),
        body('USAGE_LIMIT ').isInt().optional(),
        body('USAGE_LIMIT_PER_USER').isInt().optional(),
        body('APPLICABLE_PRODUCTS').isInt().optional(),
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

    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewCouponDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get couponDetails count.",
                });
            }
            else {
                mm.executeQuery('select * from ' + viewCouponDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get couponDetails information."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 12,
                            "count": results1[0].cnt,
                            "data": results
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
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
            mm.executeQueryData('INSERT INTO ' + couponDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save couponDetails information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created new coupon details.`;
                    var logCategory = "CouponDetails"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    res.send({
                        "code": 200,
                        "message": "CouponDetails information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 400,
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
            mm.executeQueryData(`UPDATE ` + couponDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update couponDetails information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the coupon details`;
                    var logCategory = "CouponDetails"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    res.send({
                        "code": 200,
                        "message": "CouponDetails information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 400,
                "message": "Something went wrong."
            });
        }
    }
}
