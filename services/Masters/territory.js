const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const Pincode = require("../../modules/pincode");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")

const applicationkey = process.env.APPLICATION_KEY;

var territoryMaster = "territory_master";
var viewTerritoryMaster = "view_" + territoryMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        STATUS: req.body.STATUS ? '1' : '0',
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        COUNTRY_ID: req.body.COUNTRY_ID,
        SEQ_NO: req.body.SEQ_NO,
        IS_EXPRESS_SERVICE_AVAILABLE: req.body.IS_EXPRESS_SERVICE_AVAILABLE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        SUPPORT_COUNTRY_CODE: req.body.SUPPORT_COUNTRY_CODE,
        SUPPORT_CONTACT_NUMBER: req.body.SUPPORT_CONTACT_NUMBER,

    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('STATUS').optional(),
        // body('BRANCH_ID').isInt().optional(),
        body('CITY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('SEQ_NO').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTerritoryMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        code: 400,
                        message: "Failed to get territory count."
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTerritoryMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                code: 400,
                                message: "Failed to get territory information."
                            });
                        }
                        else {
                            res.status(200).json({
                                code: 200,
                                message: "success",
                                "TAB_ID": 122,
                                count: results1[0].cnt,
                                data: results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                code: 400,
                message: "Invalid filter parameter."
            });
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "ISomething went wrong."
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
            mm.executeQueryData('INSERT INTO ' + territoryMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        code: 400,
                        message: "Failed to save territory information..."
                    });
                }
                else {
                    mm.executeQueryData('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, (error, resultGet) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get slot information."
                            });
                        } else {
                            mm.executeQueryData('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "T", results.insertId, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, (error, resultsglobal) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save globalTimeSlotMapping information..."
                                    });
                                } else {
                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added a new territory ${data.NAME}`;
                                    let actionLog = {
                                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "territory", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                    }
                                    dbm.saveLog(actionLog, systemLog);
                                    res.status(200).json({
                                        code: 200,
                                        message: "Territory information saved successfully..."
                                    });
                                }
                            })
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
                code: 500,
                message: "Invalid filter parameter."
            });
        }
    }
}

exports.updateold = (req, res) => {
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
            mm.executeQueryData(`UPDATE ` + territoryMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        code: 400,
                        message: "Failed to update territory information."
                    });
                }
                else {
                    if (data.IS_ACTIVE == 0) {
                        const tables = ['backoffice_territory_mapping', 'vendor_territory_mapping'];
                        tables.forEach(table => {
                            const checkQuery = `SELECT COUNT(*) AS count FROM ${table} WHERE TERRITORY_ID = ${criteria.ID}`;
                            mm.executeQueryData(checkQuery, [], supportKey, (checkError, checkResult) => {
                                if (checkResult[0].count > 0) {
                                    const updateQuery = `UPDATE ${table} SET IS_ACTIVE = 0 WHERE TERRITORY_ID = ${criteria.ID}`;
                                    mm.executeQueryData(updateQuery, [], supportKey, (updateError) => {
                                        if (updateError) {
                                            logger.error(supportKey + ' Failed to update IS_ACTIVE for ' + table, applicationkey);
                                            console.log(updateError);
                                        } else {
                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the territory ${data.NAME}`;
                                            let actionLog = {
                                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "territory", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                            }
                                            dbm.saveLog(actionLog, systemLog);
                                            res.status(200).json({
                                                code: 200,
                                                message: "Territory information updated successfully..."
                                            });
                                        }
                                    });
                                }
                            });
                        });
                    } else {
                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the territory ${data.NAME}`;
                        let actionLog = {
                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "territory", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog);
                        res.status(200).json({
                            code: 200,
                            message: "Territory information updated successfully..."
                        });
                    }
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                code: 500,
                message: "Invalid filter parameter."
            });
        }
    }
}
exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    var criteria = { ID: req.body.ID };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        if (data[key]) {
            setData += `${key}= ? , `;
            recordData.push(data[key]);
        }
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        mm.executeQueryData(`UPDATE ${territoryMaster} SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${criteria.ID}`, recordData, supportKey, (error, results) => {
            if (error) {
                logger.error(
                    `${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`,
                    applicationkey
                );
                console.log(error);
                return res.status(400).json({
                    code: 400,
                    message: "Failed to update territory information."
                });
            }

            if (data.IS_ACTIVE == 0) {
                const tables = ['backoffice_territory_mapping', 'vendor_territory_mapping', 'warehouse_territory_mapping'];

                tables.forEach(table => {
                    const checkQuery = `SELECT * FROM ${table} WHERE TERITORY_ID = ?`;

                    mm.executeQueryData(checkQuery, [criteria.ID], supportKey, (checkError, checkResult) => {
                        if (checkError) {
                            logger.error(
                                `${supportKey} ${req.method} ${req.url} ${JSON.stringify(checkError)}`,
                                applicationkey
                            );
                            console.log(checkError);

                        }
                        if (checkResult && checkResult.length > 0) {
                            const updateQuery = `UPDATE ${table} SET IS_ACTIVE = 0 WHERE TERITORY_ID = ?`;
                            mm.executeQueryData(updateQuery, [criteria.ID], supportKey, (updateError) => {
                                if (updateError) {
                                    logger.error(
                                        `${supportKey} Failed to update IS_ACTIVE for ${table}`,
                                        applicationkey
                                    );
                                    console.log(updateError);
                                }
                            });
                        }
                    });
                });

                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the territory ${data.NAME}`;
                const actionLog = {
                    SOURCE_ID: criteria.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "territory",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0,
                };
                dbm.saveLog(actionLog, systemLog);

                return res.status(200).json({
                    code: 200,
                    message: "Territory information updated successfully..."
                });
            } else {

                const ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of territory ${data.NAME}`;
                const actionLog = {
                    SOURCE_ID: criteria.ID,
                    LOG_DATE_TIME: mm.getSystemDate(),
                    LOG_TEXT: ACTION_DETAILS,
                    CATEGORY: "territory",
                    CLIENT_ID: 1,
                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                    supportKey: 0,
                };
                dbm.saveLog(actionLog, systemLog);

                res.status(200).json({
                    code: 200,
                    message: "Territory information updated successfully..."
                });
            }
        }
        );
    } catch (error) {
        logger.error(
            `${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`,
            applicationkey
        );
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Invalid filter parameter."
        });
    }
};


exports.partialUpdate = (req, res) => {
    const errors = validationResult(req);
    const { NAME, STATUS, IS_ACTIVE, BRANCH_ID, COUNTRY_ID, SEQ_NO, IS_EXPRESS_SERVICE_AVAILABLE } = req.body;
    const supportKey = req.headers['supportkey'];
    const criteria = {
        ID: req.params.id,
    };
    const systemDate = mm.getSystemDate();
    let setData = [];
    let recordData = [];
    for (let key of Object.keys(req.body)) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
            setData.push(`${key} = ?`);
            recordData.push(req.body[key]);
        }
    }
    setData.push(`CREATED_MODIFIED_DATE = ?`);
    recordData.push(systemDate);
    const updateQuery = `UPDATE ${territoryMaster} SET ${setData.join(', ')} WHERE ID = ?`;
    recordData.push(criteria.ID);
    try {
        if (setData.length === 0) {
            return res.status(400).json({
                code: 400,
                message: "No valid fields provided for update."
            });
        } else {
            mm.executeQueryData(updateQuery, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    return res.status(400).json({
                        code: 400,
                        message: "Failed to update territory information."
                    });
                } else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has partially updated the details of the territory ${data.NAME}`;
                    res.status(200).json({
                        code: 200,
                        message: "Territory information updated successfully..."
                    });
                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Internal Server Error!"
        });
    }
};


exports.unMappedpincodes = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var TERRITORY_ID = req.body.TERRITORY_ID;
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
        if (IS_FILTER_WRONG == "0" && TERRITORY_ID != '') {
            mm.executeQuery(`SELECT COUNT(*) as cnt FROM pincode_master p  WHERE p.ID NOT IN (SELECT PINCODE_ID  FROM territory_pincode_mapping WHERE IS_ACTIVE=1)  ${countCriteria}`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get territory count.",
                    });
                } else {
                    mm.executeQuery(`SELECT * FROM view_pincode_master p WHERE p.ID NOT IN  (SELECT PINCODE_ID  FROM territory_pincode_mapping WHERE IS_ACTIVE=1) ${criteria}`, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get territory information."
                            });
                        } else {
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
        } else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter or territory id."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};