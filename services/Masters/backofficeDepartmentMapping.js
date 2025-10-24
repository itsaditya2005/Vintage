const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
var backofficeDepartmentMapping = "backoffice_department_mapping";
var viewbackofficeDepartmentMapping = "view_" + backofficeDepartmentMapping;

function reqData(req) {

    var data = {
        BACKOFFICE_ID: req.body.BACKOFFICE_ID,
        DEPARTMENT_ID: req.body.DEPARTMENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('BACKOFFICE_ID').isInt().optional(),
        body('DEPARTMENT_ID').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewbackofficeDepartmentMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get backoffice department mapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewbackofficeDepartmentMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get backoffice department mapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 176,
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
            mm.executeQueryData('INSERT INTO ' + backofficeDepartmentMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save backoffice department mapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped a new Back Office department.`;
                    var logCategory = "backoffice Department Mapping"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "Backoffice department mapping information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + backofficeDepartmentMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update backofficeDepartmentMapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `Back Office department mapping has been updated by user ${req.body.authData.data.UserData[0].NAME}.`;

                    var logCategory = "backoffice Department Mapping"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "Backoffice department mapping information updated successfully...",
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

    var BACKOFFICE_ID = req.body.BACKOFFICE_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from backoffice_department_mapping where DEPARTMENT_ID=? and BACKOFFICE_ID=?`, [roleDetailsItem.DEPARTMENT_ID, BACKOFFICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update backoffice_department_mapping set IS_ACTIVE = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO backoffice_department_mapping (BACKOFFICE_ID,DEPARTMENT_ID,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?)', [BACKOFFICE_ID, roleDetailsItem.DEPARTMENT_ID, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
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
                    "message": "Failed to Insert backoffice department mapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped the department.`;
                var logCategory = "backoffice Department Mapping"

                let actionLog = {
                    "SOURCE_ID": BACKOFFICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New backoffice department mapping Successfully added",
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

exports.mapDepartment = (req, res) => {
    var BACKOFFICE_ID = req.body.BACKOFFICE_ID;
    var BACKOFFICE_NAME = req.body.BACKOFFICE_NAME;
    var USER_ID = req.body.USER_ID;
    var STATUS = req.body.STATUS;

    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;
    console.log("mapDepartmentdata", req.body)
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from backoffice_department_mapping where DEPARTMENT_ID=? and BACKOFFICE_ID=?`, [roleDetailsItem.DEPARTMENT_ID, BACKOFFICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    var CHANNEL_NAME = `ticket_${roleDetailsItem.DEPARTMENT_ID}_channel`
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update backoffice_department_mapping set IS_ACTIVE = ? ,STATUS = ? where  ID = ?`, [IS_ACTIVE, STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                const chanelData = {
                                    CHANNEL_NAME: CHANNEL_NAME,
                                    USER_ID: USER_ID,
                                    TYPE: "B",
                                    STATUS: (STATUS == 'M' ? true : false),
                                    USER_NAME: BACKOFFICE_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }
                                var TYPE = "B"
                                channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": USER_ID, "TYPE": TYPE })
                                    .then(existingRecord => {
                                        if (existingRecord) {
                                            channelSubscribedUsers
                                                .updateMany({ CHANNEL_NAME: CHANNEL_NAME, USER_ID: USER_ID, TYPE: TYPE }, { STATUS: (STATUS == 'M' ? true : false) })
                                                .then(() => {
                                                    // const newChannel = new channelSubscribedUsers(req.body);
                                                    // newChannel.save();
                                                    inner_callback(null);
                                                })

                                                .catch((error) => {
                                                    inner_callback(error);
                                                });
                                        }
                                        else {
                                            console.log("out")
                                            const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                            newchannelSubscribedUsers.save();
                                            inner_callback(null);
                                        }
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        inner_callback(null);
                                    });
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO backoffice_department_mapping (BACKOFFICE_ID,DEPARTMENT_ID,IS_ACTIVE,STATUS,CLIENT_ID) VALUES (?,?,?,?,?)', [BACKOFFICE_ID, roleDetailsItem.DEPARTMENT_ID, IS_ACTIVE, STATUS, 1], supportKey, connection, (error, resultsInsert) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                const chanelData = {
                                    CHANNEL_NAME: CHANNEL_NAME,
                                    USER_ID: USER_ID,
                                    TYPE: "B",
                                    STATUS: (STATUS == 'M' ? true : false),
                                    USER_NAME: BACKOFFICE_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }
                                var TYPE = "B"
                                channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": USER_ID, "TYPE": TYPE })
                                    .then(existingRecord => {
                                        if (existingRecord) {
                                            channelSubscribedUsers
                                                .updateMany({ CHANNEL_NAME: CHANNEL_NAME, USER_ID: USER_ID, TYPE: TYPE }, { STATUS: (STATUS == 'M' ? true : false) })
                                                .then(() => {
                                                    // const newChannel = new channelSubscribedUsers(req.body);
                                                    // newChannel.save();
                                                    inner_callback(null);
                                                })

                                                .catch((error) => {
                                                    inner_callback(error);
                                                });
                                        }
                                        else {
                                            console.log("out")
                                            const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                            newchannelSubscribedUsers.save();
                                            inner_callback(null);
                                        }
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        inner_callback(null);
                                    });
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
                    "message": "Failed to Insert backoffice department mapping information..."
                });
            } else {
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped the department.`;

                var logCategory = "backoffice Department Mapping"

                let actionLog = {
                    "SOURCE_ID": BACKOFFICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New backoffice department mapping successfully added",
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


exports.unMapDepartment = (req, res) => {
    var BACKOFFICE_ID = req.body.BACKOFFICE_ID;
    var BACKOFFICE_NAME = req.body.BACKOFFICE_NAME;
    var USER_ID = req.body.USER_ID;
    var data = req.body.data;
    var STATUS = req.body.STATUS;
    console.log("unMapDepartmentdata", req.body)
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from backoffice_department_mapping where DEPARTMENT_ID=? AND BACKOFFICE_ID=?`, [roleDetailsItem.DEPARTMENT_ID, BACKOFFICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    var CHANNEL_NAME = `ticket_${roleDetailsItem.DEPARTMENT_ID}_channel`
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update backoffice_department_mapping set IS_ACTIVE = ?, STATUS = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, 'M', resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                const chanelData = {
                                    CHANNEL_NAME: CHANNEL_NAME,
                                    USER_ID: USER_ID,
                                    TYPE: "B",
                                    STATUS: roleDetailsItem.IS_ACTIVE,
                                    USER_NAME: BACKOFFICE_NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }
                                var TYPE = "B"
                                channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": USER_ID, "TYPE": TYPE })
                                    .then(existingRecord => {
                                        if (existingRecord) {
                                            channelSubscribedUsers
                                                .updateMany({ CHANNEL_NAME: CHANNEL_NAME, USER_ID: USER_ID, TYPE: TYPE }, { STATUS: roleDetailsItem.IS_ACTIVE })
                                                .then(() => {
                                                    // const newChannel = new channelSubscribedUsers(req.body);
                                                    // newChannel.save();
                                                    inner_callback(null);
                                                })

                                                .catch((error) => {
                                                    inner_callback(error);
                                                });
                                        }
                                        else {
                                            console.log("out")
                                            const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                            newchannelSubscribedUsers.save();
                                            inner_callback(null);
                                        }
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        inner_callback(null);
                                    });
                            }
                        });
                    } else {
                        const chanelData = {
                            CHANNEL_NAME: CHANNEL_NAME,
                            USER_ID: USER_ID,
                            TYPE: "B",
                            STATUS: roleDetailsItem.IS_ACTIVE,
                            USER_NAME: BACKOFFICE_NAME,
                            CLIENT_ID: 1,
                            DATE: mm.getSystemDate()
                        }
                        var TYPE = "B"
                        channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": USER_ID, "TYPE": TYPE })
                            .then(existingRecord => {
                                if (existingRecord) {
                                    channelSubscribedUsers
                                        .updateMany({ CHANNEL_NAME: CHANNEL_NAME, USER_ID: USER_ID, TYPE: TYPE }, { STATUS: roleDetailsItem.IS_ACTIVE })
                                        .then(() => {
                                            // const newChannel = new channelSubscribedUsers(req.body);
                                            // newChannel.save();
                                            inner_callback(null);
                                        })

                                        .catch((error) => {
                                            inner_callback(error);
                                        });
                                }
                                else {
                                    console.log("out")
                                    const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                    newchannelSubscribedUsers.save();
                                    inner_callback(null);
                                }
                            })
                            .catch(error => {
                                console.error(error);
                                inner_callback(null);
                            });
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to insert backoffice department mapping information..."
                });
            } else {
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has unmapped the department.`;
                var logCategory = "backoffice Department Mapping"

                let actionLog = {
                    "SOURCE_ID": BACKOFFICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "Department unmapped successfully",
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

exports.unMappedDepartment = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var BACKOFFICE_ID = req.body.BACKOFFICE_ID;
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
        if (IS_FILTER_WRONG == "0" && BACKOFFICE_ID != '') {
            mm.executeQuery(`select count(*) as cnt from department_master p where 1 AND ID NOT IN (select DEPARTMENT_ID from backoffice_department_mapping where BACKOFFICE_ID = ${BACKOFFICE_ID})` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get department count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from department_master p where 1 AND ID NOT IN (select DEPARTMENT_ID from backoffice_department_mapping where BACKOFFICE_ID = ${BACKOFFICE_ID})` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get department information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter or backoffice id."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}  
