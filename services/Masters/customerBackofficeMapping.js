const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")

var customerBackofficeMapping = "customer_backoffice_mapping";
var viewcustomerBackofficeMapping = "view_" + customerBackofficeMapping;

function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        BACKOFFICE_ID: req.body.BACKOFFICE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('BACKOFFICE_ID').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewcustomerBackofficeMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get viewcustomerBackofficeMapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewcustomerBackofficeMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customerBackofficeMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 118,
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
            mm.executeQueryData('INSERT INTO ' + customerBackofficeMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerBackofficeMapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the customer.`;
                    var logCategory = "Service Skill Mapping"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "customerBackofficeMapping information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + customerBackofficeMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update customerBackofficeMapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of customer technician mapping  .`;

                    var logCategory = "Service Skill Mapping"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "customerBackofficeMapping information updated successfully...",
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

    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from customer_backoffice_mapping where BACKOFFICE_ID=? and CUSTOMER_ID=?`, [roleDetailsItem.BACKOFFICE_ID, CUSTOMER_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update customer_backoffice_mapping set IS_ACTIVE = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO customer_backoffice_mapping (BACKOFFICE_ID,CUSTOMER_ID,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?)', [roleDetailsItem.BACKOFFICE_ID, CUSTOMER_ID, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
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
                    "message": "Failed to Insert customerBackofficeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the customer.`;
                var logCategory = "Service Skill Mapping"

                let actionLog = {
                    "SOURCE_ID": CUSTOMER_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New customerBackofficeMapping Successfully added",
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


exports.mapBackOffice = (req, res) => {
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from customer_backoffice_mapping where BACKOFFICE_ID=? and CUSTOMER_ID=?`, [roleDetailsItem.BACKOFFICE_ID, CUSTOMER_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update customer_backoffice_mapping set IS_ACTIVE = ?, STATUS = ? where  ID = ?`, [IS_ACTIVE, STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO customer_backoffice_mapping (CUSTOMER_ID,BACKOFFICE_ID,IS_ACTIVE,STATUS,CLIENT_ID) VALUES (?,?,?,?,?)', [CUSTOMER_ID, roleDetailsItem.BACKOFFICE_ID, IS_ACTIVE, STATUS, 1], supportKey, connection, (error, resultsInsert) => {
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
                    "message": "Failed to Insert serviceSkillsMapping information..."
                });
            } else {
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped a new technician to the customer.`;

                var logCategory = "Service Skill Mapping"

                let actionLog = {
                    "SOURCE_ID": CUSTOMER_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New serviceSkillsMapping Successfully added",
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


exports.unMapBackOffice = (req, res) => {
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var data = req.body.data;
    var STATUS = req.body.STATUS;

    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from customer_backoffice_mapping where BACKOFFICE_ID=? AND CUSTOMER_ID=?`, [roleDetailsItem.BACKOFFICE_ID, CUSTOMER_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update customer_backoffice_mapping set IS_ACTIVE = ?, STATUS = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, 'M', resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        inner_callback(null);
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert serviceSkillsMapping information..."
                });
            } else {
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has unmapped technician.`;
                var logCategory = "Service Skill Mapping"

                let actionLog = {
                    "SOURCE_ID": CUSTOMER_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New serviceSkillsMapping Successfully added",
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