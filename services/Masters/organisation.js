const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const md5 = require('md5');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

var organisationMaster = "organisation_master";
var viewOrganisationMaster = "view_" + organisationMaster;


function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        PASSWORD: req.body.PASSWORD,
        ADDRESS: req.body.ADDRESS,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        USER_ID: req.body.USER_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO,
        DAY_START_TIME: req.body.DAY_START_TIME,
        DAY_END_TIME: req.body.DAY_END_TIME,
        DISTRICT_ID: req.body.DISTRICT_ID,
        CAN_CHANGE_SERVICE_PRICE: 1,
        PINCODE: req.body.PINCODE,

    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('EMAIL_ID').optional(),
        body('PASSWORD').optional(),
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

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewOrganisationMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get organisation count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewOrganisationMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get organisation information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 76,
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

exports.getdata = (req, res) => {
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

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    let criteria = '';
    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewOrganisationMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get organisation count.",
                    });
                } else {
                    mm.executeQuery('select * from ' + viewOrganisationMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get organisation information."
                            });
                        } else if (results.length > 0) {
                            // Fetch all calendar data for relevant ORG_IDs
                            let orgIds = results.map(item => item.ID).join(',');
                            let calendarQuery = `select * from orgnization_service_calender where ORG_ID IN (${orgIds})`;
                            mm.executeQuery(calendarQuery, supportKey, (error, results3) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get organisation calendar information."
                                    });
                                } else {
                                    // Map calendar data to each organisation
                                    let calendarDataMap = {};
                                    results3.forEach(item => {
                                        if (!calendarDataMap[item.ORG_ID]) {
                                            calendarDataMap[item.ORG_ID] = [];
                                        }
                                        calendarDataMap[item.ORG_ID].push(item);
                                    });

                                    results.forEach(item => {
                                        item.WEEK_DAY_DATA = calendarDataMap[item.ID] || [];
                                    });

                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "count": results1[0].cnt,
                                        "data": results
                                    });
                                }
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "No data found.",
                                "count": 0,
                                "data": []
                            });
                        }
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
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
};


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
            mm.executeQueryData('INSERT INTO ' + organisationMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save organisation information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a organisation Master  ${data.NAME}.`;

                    var logCategory = "Order Status"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    return res.send({
                        code: 200,
                        message: "organisationMaster information created and logged successfully."
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


exports.createOrg = (req, res) => {
    var data = reqData(req);
    var PASSWORD = "12345678";
    var WEEK_DAY_DATA = req.body.WEEK_DAY_DATA;
    PASSWORD = md5(PASSWORD);
    var ROLE_ID = req.body.ROLE_ID ? req.body.ROLE_ID : "8";
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
            // if (WEEK_DAY_DATA) {
            const connection = mm.openConnection()
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=?', data.EMAIL_ID, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save vendor information..."
                    });
                }
                else {
                    mm.executeDML('SELECT * FROM organisation_master WHERE EMAIL_ID=?', data.EMAIL_ID, supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save vendor information..."
                            });
                        }
                        else {
                            if (results1.length > 0 && results2.length > 0) {
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": "Email already exists..."
                                });
                            }
                            else {
                                data.PASSWORD = PASSWORD;
                                mm.executeDML('INSERT INTO ' + organisationMaster + ' SET ?', data, supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save vendor information..."
                                        });
                                    }
                                    else {
                                        mm.executeDML('INSERT INTO user_master (ROLE_ID,NAME, EMAIL_ID,PASSWORD,ORGANISATION_ID,CLIENT_ID,CAN_CHANGE_SERVICE_PRICE) VALUES(?,?,?,?,?,?,?)', [ROLE_ID, data.NAME, data.EMAIL_ID, PASSWORD, results3.insertId, data.CLIENT_ID, data.CAN_CHANGE_SERVICE_PRICE], supportKey, connection, (error, results4) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to save vendor information..."
                                                });
                                            }
                                            else {
                                                mm.executeDML('INSERT INTO user_role_mapping (USER_ID,ROLE_ID,CLIENT_ID) VALUES(?,?,?)', [results4.insertId, ROLE_ID, data.CLIENT_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to save vendor information..."
                                                        });
                                                    } else {
                                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new organisation  ${data.NAME}.`;

                                                        var logCategory = "organisation"

                                                        let actionLog = {
                                                            "SOURCE_ID": results3.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                        }
                                                        dbm.saveLog(actionLog, systemLog)

                                                        mm.commitConnection(connection)
                                                        return res.send({
                                                            code: 200,
                                                            message: "organisationMaster information saved succesfully."
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
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
            mm.executeQueryData(`UPDATE ` + organisationMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update organisation information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Organisation information updated successfully...",
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

exports.updateOrg = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var WEEK_DAY_DATA = req.body.WEEK_DAY_DATA;
    // var PASSWORD = req.body.PASSWORD;
    // PASSWORD = md5(PASSWORD);
    var ROLE_ID = req.body.ROLE_ID ? req.body.ROLE_ID : "8";
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
            const connection = mm.openConnection()
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=? AND ORGANISATION_ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save vendor information..."
                    });
                }
                else {
                    mm.executeDML('SELECT * FROM organisation_master WHERE EMAIL_ID=? AND ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save vendor information..."
                            });
                        }
                        else {
                            if (results1.length > 0 && results2.length > 0) {
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": "Email already exists..."
                                });
                            }
                            else {
                                mm.executeDML(`UPDATE ` + organisationMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update vendor information."
                                        });
                                    }
                                    else {
                                        mm.executeDML(`UPDATE user_master SET NAME=?, EMAIL_ID=?,ROLE_ID=?,CAN_CHANGE_SERVICE_PRICE=?, CREATED_MODIFIED_DATE = '${systemDate}' where ORGANISATION_ID = ${criteria.ID} `, [data.NAME, data.EMAIL_ID, ROLE_ID, data.CAN_CHANGE_SERVICE_PRICE], supportKey, connection, (error, results) => {
                                            if (error) {
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to update vendor information."
                                                });
                                            }
                                            else {
                                                mm.executeDML(`UPDATE user_role_mapping SET ROLE_ID=?, CREATED_MODIFIED_DATE = '${systemDate}' where USER_ID =(SELECT ID FROM user_master WHERE ORGANISATION_ID = ${criteria.ID} ORDER BY ID DESC LIMIT 1 )`, [ROLE_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        console.log(error);
                                                        mm.rollbackConnection(connection)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to update vendor information."
                                                        });
                                                    }
                                                    else {
                                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the organisation  ${data.NAME}.`;

                                                        var logCategory = "organisation"

                                                        let actionLog = {
                                                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                        }
                                                        dbm.saveLog(actionLog, systemLog)

                                                        mm.commitConnection(connection)
                                                        res.send({
                                                            "code": 200,
                                                            "message": "Vendor information updated successfully...",
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                })
                            }
                        }
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