const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;

var backofficeTerritoryMapping = "backoffice_territory_mapping";
var viewBackofficeTerritoryMapping = "view_" + backofficeTerritoryMapping;
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

function reqData(req) {

    var data = {
        BACKOFFICE_ID: req.body.BACKOFFICE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        TERITORY_ID: req.body.TERITORY_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('BACKOFFICE_ID').isInt().optional(),
        body('TERITORY_ID').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewBackofficeTerritoryMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get backofficeTerritoryMapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewBackofficeTerritoryMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get backofficeTerritoryMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 3,
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
            mm.executeQueryData('INSERT INTO ' + backofficeTerritoryMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save backofficeTerritoryMapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has create backoffice territory mapping.`;
                    var logCategory = "backofficeTerritoryMapping"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)

                    return res.send({
                        code: 200,
                        message: "successfully created..."
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
            mm.executeQueryData(`UPDATE ` + backofficeTerritoryMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update backofficeTerritoryMapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has made updates to the back office territory mapping.`;
                    var logCategory = "backofficeTerritoryMapping"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    return res.send({
                        code: 200,
                        message: "information updated and logged successfully."
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
    var USER_ID = req.body.USER_ID;
    var BACKOFFICE_NAME = req.body.BACKOFFICE_NAME;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var ROLE_ID = req.body.ROLE_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from backoffice_territory_mapping where TERITORY_ID=? and BACKOFFICE_ID=?`, [roleDetailsItem.TERITORY_ID, BACKOFFICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {

                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update backoffice_territory_mapping set IS_ACTIVE = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {

                                if (ROLE_ID == 23) {
                                    inner_callback(null);
                                }
                                else {
                                    if (ROLE_ID == 24 || ROLE_ID == 25) {
                                        var CHANNEL_NAME = `support_${roleDetailsItem.TERITORY_ID}_channel`
                                        
                                    }
                                    else {
                                        var CHANNEL_NAME = `territory_${roleDetailsItem.TERITORY_ID}_admin_channel`
                                    }
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
                    } else {
                        mm.executeDML('INSERT INTO backoffice_territory_mapping (TERITORY_ID,BACKOFFICE_ID,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?)', [roleDetailsItem.TERITORY_ID, BACKOFFICE_ID, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                if (ROLE_ID == 23) {
                                    inner_callback(null);
                                }
                                else {
                                    if (ROLE_ID == 24 || ROLE_ID == 25) {
                                        var CHANNEL_NAME = `support_${roleDetailsItem.TERITORY_ID}_channel`
                                        
                                    }
                                    else {
                                        var CHANNEL_NAME = `territory_${roleDetailsItem.TERITORY_ID}_admin_channel`
                                    }
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
                                                        inner_callback(null);
                                                    })

                                                    .catch((error) => {
                                                        inner_callback(error);
                                                    });
                                            }
                                            else {
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
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert BackofficeTerritoryMapping information..."
                });
            } else {
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped the back office territory.`;
                var logCategory = "backoffice territory mapping"
                let actionLog = {
                    "SOURCE_ID": BACKOFFICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)

                mm.commitConnection(connection);
                return res.send({
                    code: 200,
                    message: "New BackofficeTerritoryMapping information."
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
