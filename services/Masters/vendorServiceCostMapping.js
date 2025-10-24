const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

var vendorServiceCostMapping = "vendor_service_cost_mapping";
var viewVendorServiceCostMapping = "view_" + vendorServiceCostMapping;

function reqData(req) {
    var data = {
        VENDOR_ID: req.body.VENDOR_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        COST_TYPE: req.body.COST_TYPE ? '1' : '0',
        EFFECTIVE_DATE: req.body.EFFECTIVE_DATE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('VENDOR_ID').isInt().optional(),
        body('SERVICE_ID').isInt().optional(),
        body('COST_TYPE').optional(),
        body('EFFECTIVE_DATE').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewVendorServiceCostMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get vendorServiceCostMapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewVendorServiceCostMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get vendorServiceCostMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 134,
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
            mm.executeQueryData('INSERT INTO ' + vendorServiceCostMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save vendorServiceCostMapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new vendor service cost mapping.`;

                    var logCategory = "vendor service cost mapping";

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "VendorServiceCostMapping information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + vendorServiceCostMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update vendorServiceCostMapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the vendor service cost mapping.`;
                    var logCategory = "vendor service cost mapping";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "VendorServiceCostMapping information updated successfully..."
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

exports.addBulk = (req, res) => {

    var VENDOR_ID = req.body.VENDOR_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from vendor_service_cost_mapping where SERVICE_ID=? and VENDOR_ID=?`, [roleDetailsItem.SERVICE_ID, VENDOR_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update vendor_service_cost_mapping set SERVICE_ID=? , COST_TYPE=?, COST=?,EFFECTIVE_DATE=?,IS_ACTIVE=? where  ID = ?`, [roleDetailsItem.SERVICE_ID, roleDetailsItem.COST_TYPE, roleDetailsItem.COST, roleDetailsItem.EFFECTIVE_DATE, roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO vendor_service_cost_mapping (VENDOR_ID,SERVICE_ID,COST_TYPE,COST,EFFECTIVE_DATE,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?,?,?,?)', [VENDOR_ID, roleDetailsItem.SERVICE_ID, roleDetailsItem.COST_TYPE, roleDetailsItem.COST, roleDetailsItem.EFFECTIVE_DATE, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert vendorServiceCostMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped the service cost to the vendor.`;

                var logCategory = "vendor service cost mapping";

                let actionLog = {
                    "SOURCE_ID": VENDOR_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New vendorServiceCostMapping Successfully added",
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