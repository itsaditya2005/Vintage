const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")

var territoryPincodeMapping = "territory_pincode_mapping";
var viewTerritoryPincodeMapping = "view_" + territoryPincodeMapping;

function reqData(req) {

    var data = {
        TERRITORY_ID: req.body.TERRITORY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TERRITORY_ID').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTerritoryPincodeMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get territoryPincodeMapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTerritoryPincodeMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get territoryPincodeMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 123,
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
            mm.executeQueryData('INSERT INTO ' + territoryPincodeMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save territoryPincodeMapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped pincodes to territory.`;

                    var logCategory = "territory postal code mapping";

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "TerritoryPincodeMapping information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + territoryPincodeMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update territoryPincodeMapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the territory postal code mapping.`;

                    var logCategory = "territory postal code mapping";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "New territoryPincodeMapping Successfully added",
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

    var TERITORY_ID = req.body.TERITORY_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {

            mm.executeDML(`select * from territory_pincode_mapping where TERRITORY_ID=? and PINCODE_ID=?`, [TERITORY_ID, roleDetailsItem.PINCODE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update territory_pincode_mapping set IS_ACTIVE = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO territory_pincode_mapping (TERRITORY_ID,PINCODE_ID,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?)', [TERITORY_ID, roleDetailsItem.PINCODE_ID, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
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
                    "message": "Failed to Insert territoryPincodeMapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped postal codes to the territory.`

                var logCategory = "territory postal code mapping";

                let actionLog = {
                    "SOURCE_ID": TERITORY_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "New territoryPincodeMapping Successfully added",
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
    var TERRITORY_ID = req.body.TERRITORY_ID;
    var STATUS = req.body.STATUS;
    var IS_ACTIVE = STATUS == 'M' ? '1' : '0';
    var data = req.body.data;

    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from territory_pincode_mapping where PINCODE_ID=? and TERRITORY_ID=?`, [roleDetailsItem.PINCODE_ID, TERRITORY_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update territory_pincode_mapping set IS_ACTIVE = ?, STATUS = ? where  ID = ?`, [IS_ACTIVE, STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO territory_pincode_mapping (PINCODE_ID,TERRITORY_ID,IS_ACTIVE,STATUS,CLIENT_ID,PINCODE,COUNTRY_NAME,COUNTRY_ID,STATE,STATE_NAME,OFFICE_NAME,CIRCLE_NAME,DIVISION_NAME,TALUKA,DISTRICT,DISTRICT_NAME) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [roleDetailsItem.PINCODE_ID, TERRITORY_ID, IS_ACTIVE, STATUS, 1, roleDetailsItem.PINCODE, roleDetailsItem.COUNTRY_NAME, roleDetailsItem.COUNTRY_ID, roleDetailsItem.STATE, roleDetailsItem.STATE_NAME, roleDetailsItem.OFFICE_NAME, roleDetailsItem.CIRCLE_NAME, roleDetailsItem.DIVISION_NAME, roleDetailsItem.TALUKA, roleDetailsItem.DISTRICT, roleDetailsItem.DISTRICT_NAME], supportKey, connection, (error, resultsInsert) => {
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
                    "message": "Failed to Insert territory_pincode_mapping information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped postal code to the territory`;

                var logCategory = "territory postal code mapping";

                let actionLog = {
                    "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                return res.send({
                    code: 200,
                    message: "TechnicianPincodeMapping information created successfully..."
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
    const TERRITORY_ID = req.body.TERRITORY_ID;
    const data = req.body.data;
    const supportKey = req.headers['supportkey'];

    try {
        var IS_ALREADY_MAPPED = [];
        const connection = mm.openConnection();

        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`SELECT * FROM territory_pincode_mapping WHERE PINCODE_ID=? AND TERRITORY_ID=?`,
                [roleDetailsItem.PINCODE_ID, TERRITORY_ID],
                supportKey,
                connection,
                (error, resultsIsDataPresent) => {
                    if (error) {
                        console.log(error);
                        return inner_callback(error);
                    }
                    if (resultsIsDataPresent.length === 0) {
                        return inner_callback(null);
                    }

                    mm.executeDML(
                        `SELECT * FROM view_territory_pincode_mapping WHERE PINCODE_ID=? AND IS_ACTIVE='1' AND TERRITORY_ID != ?`,
                        [roleDetailsItem.PINCODE_ID, TERRITORY_ID],
                        supportKey,
                        connection,
                        (error, resultsIsDataCheck) => {
                            if (error) {
                                console.log(error);
                                return inner_callback(error);
                            }

                            if (resultsIsDataCheck.length > 0 && req.body.data.length === 1) {
                                return inner_callback({
                                    isAlreadyMapped: true,
                                    territoryName: resultsIsDataCheck[0].TERRITORY_NAME,
                                    PINCODE: roleDetailsItem.PINCODE
                                });
                            } else {
                                if (resultsIsDataCheck.length > 0) {
                                    IS_ALREADY_MAPPED.push({ PINCODE_ID: roleDetailsItem.PINCODE_ID });
                                    inner_callback(null);
                                } else {
                                    mm.executeDML(
                                        `UPDATE territory_pincode_mapping SET IS_ACTIVE=?, STATUS=? WHERE PINCODE_ID=? AND TERRITORY_ID=?`,
                                        [roleDetailsItem.IS_ACTIVE, 'M', roleDetailsItem.PINCODE_ID, TERRITORY_ID],
                                        supportKey,
                                        connection,
                                        (error) => {
                                            if (error) {
                                                console.log("error", error);
                                                return inner_callback(error);
                                            }
                                            inner_callback(null);
                                        }
                                    );
                                }
                            }
                        }
                    );
                }
            );
        }, function subCb(error) {
            if (error) {
                if (error.isAlreadyMapped) {
                    mm.rollbackConnection(connection);
                    return res.send({
                        code: 300,
                        message: `Pincode is already mapped to ${error.territoryName} territory`
                    });
                }

                mm.rollbackConnection(connection);
                return res.send({
                    code: 400,
                    message: "Failed to update territoryPincodeMapping information.",
                    IS_ALREADY_MAPPED: IS_ALREADY_MAPPED
                });
            } else {

                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped postal code from the territory.`;

                var logCategory = "territory postal code mapping";

                let actionLog = {
                    "SOURCE_ID": 0, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                mm.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "territoryPincodeMapping Successfully unmapped",
                    IS_ALREADY_MAPPED: IS_ALREADY_MAPPED
                });
            }
        });

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};
