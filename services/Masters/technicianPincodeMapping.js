const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require("../../modules/channelSubscribedUsers");
var technicianPincodeMapping = "technician_pincode_mapping";
var viewTechnicianPincodeMapping = "view_" + technicianPincodeMapping;

function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('PINCODE_ID').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianPincodeMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianPincodeMapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTechnicianPincodeMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianPincodeMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 115,
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
            mm.executeQueryData('INSERT INTO ' + technicianPincodeMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianPincodeMapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped pincodes to the technician.`;

                    var logCategory = "technician Pincode Mapping"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "TechnicianPincodeMapping information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + technicianPincodeMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianPincodeMapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician postal code mapping.`;

                    var logCategory = "technician Pincode Mapping"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    return res.send({
                        code: 200,
                        message: "TechnicianPincodeMapping information updated successfully."
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

    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from technician_pincode_mapping where PINCODE_ID=? and TECHNICIAN_ID=?`, [roleDetailsItem.PINCODE_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update technician_pincode_mapping set IS_ACTIVE = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO technician_pincode_mapping (PINCODE_ID,TECHNICIAN_ID,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?)', [roleDetailsItem.PINCODE_ID, TECHNICIAN_ID, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
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
                    "message": "Failed to Insert technicianPincodeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped pincodes to the technician.`;

                var logCategory = "technician Pincode Mapping"

                let actionLog = {
                    "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New technicianPincodeMapping Successfully added",
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

exports.mapPincodes = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;

    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from technician_pincode_mapping where PINCODE_ID=? and TECHNICIAN_ID=?`, [roleDetailsItem.PINCODE_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    mm.executeDML(`select * from territory_pincode_mapping where PINCODE_ID=?`, [roleDetailsItem.PINCODE_ID], supportKey, connection, (error, resultsIsData) => {
                        if (error) {
                            console.log(error);
                            inner_callback(error);
                        } else {
                            var CHANNEL_NAME = `territory_${resultsIsData[0].TERRITORY_ID}_channel`
                            if (resultsIsDataPresent.length > 0) {
                                mm.executeDML(`update technician_pincode_mapping set IS_ACTIVE = ?, STATUS = ? where  ID = ?`, [IS_ACTIVE, STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                                    if (error) {
                                        console.log("error", error);
                                        inner_callback(error);
                                    } else {
                                        const chanelData = {
                                            CHANNEL_NAME: CHANNEL_NAME,
                                            USER_ID: TECHNICIAN_ID,
                                            TYPE: "T",
                                            STATUS: true,
                                            USER_NAME: TECHNICIAN_NAME,
                                            CLIENT_ID: 1,
                                            DATE: mm.getSystemDate()
                                        }
                                        var TYPE = "T"
                                        channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": TECHNICIAN_ID, "TYPE": TYPE })
                                            .then(existingRecord => {
                                                if (existingRecord) {
                                                    inner_callback(null);
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
                                });
                            } else {
                                mm.executeDML('INSERT INTO technician_pincode_mapping (PINCODE_ID,TECHNICIAN_ID,IS_ACTIVE,STATUS,CLIENT_ID,PINCODE,COUNTRY_NAME,COUNTRY_ID,STATE,STATE_NAME,OFFICE_NAME,CIRCLE_NAME,DIVISION_NAME,TALUKA,DISTRICT,DISTRICT_NAME) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [roleDetailsItem.PINCODE_ID, TECHNICIAN_ID, IS_ACTIVE, STATUS, 1, roleDetailsItem.PINCODE, roleDetailsItem.COUNTRY_NAME, roleDetailsItem.COUNTRY_ID, roleDetailsItem.STATE, roleDetailsItem.STATE_NAME, roleDetailsItem.OFFICE_NAME, roleDetailsItem.CIRCLE_NAME, roleDetailsItem.DIVISION_NAME, roleDetailsItem.TALUKA, roleDetailsItem.DISTRICT, roleDetailsItem.DISTRICT_NAME], supportKey, connection, (error, resultsInsert) => {
                                    if (error) {
                                        console.log("error", error);
                                        inner_callback(error);
                                    } else {
                                        const chanelData = {
                                            CHANNEL_NAME: CHANNEL_NAME,
                                            USER_ID: TECHNICIAN_ID,
                                            TYPE: "T",
                                            STATUS: true,
                                            USER_NAME: TECHNICIAN_NAME,
                                            CLIENT_ID: 1,
                                            DATE: mm.getSystemDate()
                                        }
                                        var TYPE = "T"
                                        channelSubscribedUsers.findOne({ "CHANNEL_NAME": CHANNEL_NAME, "USER_ID": TECHNICIAN_ID, "TYPE": TYPE })
                                            .then(existingRecord => {
                                                if (existingRecord) {
                                                    inner_callback(null);
                                                }
                                                else {
                                                    const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                                    newchannelSubscribedUsers.save();
                                                    inner_callback(null);
                                                }
                                            })
                                            .catch(error => {
                                                console.error(error);
                                                inner_callback(error);
                                            });

                                    }
                                });
                            }
                        }
                    });
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert technicianPincodeMapping information..."
                });
            } else {
                mm.executeDML('update technician_master set IS_PINCODE_MAPPED =1  where ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, resultsInsert) => {
                    if (error) {
                        console.log("error", error);
                        mm.rollbackConnection(connection);
                        res.send({
                            "code": 400,
                            "message": "Failed to Insert technicianPincodeMapping information..."
                        });
                    } else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped postal code to the technician.`;

                        var logCategory = "technician Pincode Mapping"

                        let actionLog = {
                            "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        mm.commitConnection(connection);
                        console.log("innnnnnnnn")
                        res.send({
                            code: 200,
                            message: "TechnicianPincodeMapping information created successfully..."
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


exports.unMapPincodes = (req, res) => {
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    var data = req.body.data;
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from technician_pincode_mapping where PINCODE_ID=? and TECHNICIAN_ID=?`, [roleDetailsItem.PINCODE_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update technician_pincode_mapping set IS_ACTIVE = ?, STATUS = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, 'M', resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
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
                    "message": "Failed to Insert technicianPincodeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped pincodes from the technician.`;

                var logCategory = "technician Pincode Mapping"

                let actionLog = {
                    "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New technicianPincodeMapping Successfully added",
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