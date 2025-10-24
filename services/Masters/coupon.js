const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');

const applicationkey = process.env.APPLICATION_KEY;

var couponMaster = "coupon_master";
var viewCouponMaster = "view_" + couponMaster;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        START_DATE: req.body.START_DATE,
        EXPIRY_DATE: req.body.EXPIRY_DATE,
        STATUS: req.body.STATUS ? '1' : '0',
        MAX_USES_COUNT: req.body.MAX_USES_COUNT,
        COUPON_CODE: req.body.COUPON_CODE,
        COUPON_VALUE: req.body.COUPON_VALUE,
        PERUSER_MAX_COUNT: req.body.PERUSER_MAX_COUNT,
        COUPON_VALUE_TYPE: req.body.COUPON_VALUE_TYPE,
        COUPON_MAX_VALUE: req.body.COUPON_MAX_VALUE,
        MIN_CART_AMOUNT: req.body.MIN_CART_AMOUNT,
        MAX_CART_AMOUNT: req.body.MAX_CART_AMOUNT,
        CLIENT_ID: req.body.CLIENT_ID,
        COUPON_TYPE_ID: req.body.COUPON_TYPE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        COUPON_FOR: req.body.COUPON_FOR
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('COUPON_VALUE_TYPE').optional(),
        body('COUPON_VALUE').isDecimal().optional(),
        body('MAX_USES_COUNT').isInt().optional(),
        body('MIN_CART_AMOUNT').isDecimal().optional(),
        body('MAX_CART_AMOUNT').isDecimal().optional(),
        body('COUPON_MAX_VALUE').isDecimal().optional(),
        body('START_DATE').optional(), body('EXPIRY_DATE').optional(),
        body('PERUSER_MAX_COUNT').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewCouponMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get coupon count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewCouponMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get coupon information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 13,
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
            mm.executeQueryData('INSERT INTO ' + couponMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save coupon information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new coupon ${data.NAME}.`;
                    var logCategory = "coupon"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    res.send({
                        "code": 200,
                        "message": "Coupon information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + couponMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update coupon information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the coupon ${data.NAME}.`;
                    var logCategory = "coupon"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    res.send({
                        "code": 200,
                        "message": "Coupon information updated successfully...",
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

exports.addServices = (req, res) => {
    var supportKey = req.headers['supportkey']
    const COUPON_ID = req.body.COUPON_ID;
    var data = req.body.SERVICE_DATA;

    try {

        if (COUPON_ID && data) {
            async.eachSeries(data, function (item, callback) {
                mm.executeQueryData('select * from coupon_code_service_mapping where COUPON_ID = ? and SERVICE_ID = ?', [COUPON_ID, item.SERVICE_ID], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to add services to coupon."
                        });
                    }
                    else {
                        if (results.length > 0) {
                            mm.executeQueryData(`UPDATE coupon_code_service_mapping SET STATUS = ? where COUPON_ID = ? and SERVICE_ID = ?`, [item.STATUS, COUPON_ID, item.SERVICE_ID], supportKey, (error, resultsUpdate) => {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to add services to coupon."
                                    });
                                }
                                else {
                                    callback();
                                }
                            });
                        }
                        else {
                            mm.executeQueryData(`INSERT INTO coupon_code_service_mapping(COUPON_ID,SERVICE_ID,COUNTRY_ID,STATUS,CLIENT_ID,CATEGORY_ID,SUB_CATEGORY_ID,SERVICE_CATELOG_ID) VALUES (?,?,?,?,?,?,?,?);`, [COUPON_ID, item.SERVICE_ID, item.COUNTRY_ID, item.STATUS, item.CLIENT_ID, item.CATEGORY_ID, item.SUB_CATEGORY_ID, item.SERVICE_CATELOG_ID], supportKey, (error, resultsInsert) => {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to add services to coupon."
                                    });
                                }
                                else {
                                    callback();
                                }
                            });
                        }
                    }
                });

            }
                , function (err) {
                    if (err) {
                        console.log(err);
                        res.send({
                            "code": 400,
                            "message": "Failed to add services to coupon."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "Services added to coupon successfully...",
                        });
                    }
                });

        }
        else {
            res.send({
                "code": 400,
                "message": "Invalid parameters."
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

exports.getServices = (req, res) => {
    var COUPON_ID = req.body.COUPON_ID;
    var CATEGORY_ID = req.body.CATEGORY_ID;
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
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

            if (CATEGORY_ID && SUB_CATEGORY_ID && COUPON_ID) {
                mm.executeQueryData(`select CATEGORY_ID,CATEGORY_NAME,SUB_CATEGORY_ID,SUB_CATEGORY_NAME,ID,NAME,PARENT_ID as SERVICE_CATELOG_ID,STATUS  from view_service_master where STATUS = 1 and IS_PARENT = 0 and CATEGORY_ID = ? AND SUB_CATEGORY_ID = ?  AND ID NOT IN (SELECT SERVICE_ID FROM coupon_code_service_mapping where COUPON_ID = ? ) ` + criteria, [CATEGORY_ID, SUB_CATEGORY_ID, COUPON_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get services for coupon."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "data": results
                        });
                    }
                });
            }
            else {
                res.send({
                    "code": 400,
                    "message": "Invalid parameters."
                });
            }
        } else {
            res.send({
                "code": 400,
                "message": "Invalid Filter."
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

exports.addInventory = (req, res) => {
    var supportKey = req.headers['supportkey']
    const COUPON_ID = req.body.COUPON_ID;
    var data = req.body.INVENTORY_DATA;
    try {
        if (COUPON_ID && data) {
            async.eachSeries(data, function (item, callback) {
                mm.executeQueryData('select * from coupon_code_inventory_mapping where COUPON_ID = ? and INVENTORY_ID= ?', [COUPON_ID, item.INVENTORY_ID], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to add services to coupon."
                        });
                    }
                    else {
                        if (results.length > 0) {
                            mm.executeQueryData(`UPDATE coupon_code_inventory_mapping SET STATUS = ? where COUPON_ID = ? and INVENTORY_ID = ?`, [item.STATUS, COUPON_ID, item.INVENTORY_ID], supportKey, (error, resultsUpdate) => {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "message": "Failed to add services to coupon."
                                    });
                                }
                                else {
                                    callback();
                                }
                            });
                        }
                        else {
                            mm.executeQueryData(`INSERT INTO coupon_code_inventory_mapping(COUPON_ID,INVENTORY_ID,COUNTRY_ID,STATUS,CLIENT_ID,INVENTORY_CATEGORY_ID, INVENTORY_SUB_CATEGORY_ID) VALUES (?,?,?,?,?,?,?);`, [COUPON_ID, item.INVENTORY_ID, item.COUNTRY_ID, item.STATUS, item.CLIENT_ID, item.INVENTORY_CATEGORY_ID, item.INVENTORY_SUB_CATEGORY_ID], supportKey, (error, resultsInsert) => {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "message": "Failed to add services to coupon."
                                    });
                                }
                                else {
                                    callback();
                                }
                            });
                        }
                    }
                });

            }
                , function (err) {
                    if (err) {
                        console.log(err);
                        res.status(400).json({
                            "message": "Failed to add services to coupon."
                        });
                    }
                    else {
                        res.status(200).json({
                            "message": "Services added to coupon successfully...",
                        });
                    }
                });

        }
        else {
            res.status(400).json({
                "message": "Invalid parameters."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}
exports.getInventory = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var COUPON_ID = req.body.COUPON_ID;
    var CATEGORY_ID = req.body.CATEGORY_ID;
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
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
            if (CATEGORY_ID && SUB_CATEGORY_ID && COUPON_ID) {
                mm.executeQueryData(`select INVENTORY_CATEGORY_ID,INVENTORY_CATEGORY_NAME,INVENTRY_SUB_CATEGORY_ID,INVENTRY_SUB_CATEGORY_NAME,ID,ITEM_NAME,PARENT_ID as INVENTORY_CATELOG_ID,STATUS,VARIANT_NAME,IS_HAVE_VARIANTS,IS_VERIENT  from view_inventory_master where STATUS = 1 AND IS_VERIENT=1  and INVENTORY_CATEGORY_ID = ? AND INVENTRY_SUB_CATEGORY_ID = ?  AND ID NOT IN (SELECT INVENTORY_ID FROM coupon_code_inventory_mapping where COUPON_ID = ? ) ` + criteria, [CATEGORY_ID, SUB_CATEGORY_ID, COUPON_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get services for coupon."
                        });
                    }
                    else {
                        res.status(200).json({
                            "message": "success",
                            "data": results
                        });
                    }
                });
            }
            else {
                res.status(400).json({
                    "message": "Invalid parameters."
                });
            }
        } else {
            res.send({
                "code": 400,
                "message": "Invalid Filtter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}


