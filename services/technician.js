const { log } = require('async');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const jwt = require('jsonwebtoken');
const md5 = require('md5');
exports.dotenv = require('dotenv').config();
const applicationkey = process.env.APPLICATION_KEY;
const Pincode = require("../../modules/pincode");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog");
const technicianActionLog = require("../../modules/technicianActionLog");
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
// const ChannelSubscribedUsers = require("../../modules/channelSubscribedUsers");
const async = require('async');
var technicianMaster = "technician_master";
var viewTechnicianMaster = "view_" + technicianMaster;

var systemDate = mm.getSystemDate();
function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        EXPERIENCE_LEVEL: req.body.EXPERIENCE_LEVEL,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE1: req.body.ADDRESS_LINE1,
        ADDRESS_LINE2: req.body.ADDRESS_LINE2,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        HIRE_DATE: systemDate,
        COUNTRY_ID: req.body.COUNTRY_ID,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        AADHAR_NUMBER: req.body.AADHAR_NUMBER,
        GENDER: req.body.GENDER,
        DOB: req.body.DOB,
        IS_OWN_VEHICLE: req.body.IS_OWN_VEHICLE ? '1' : '0',
        PHOTO: req.body.PHOTO,
        PASSWORD: req.body.PASSWORD,
        VEHICLE_TYPE: req.body.VEHICLE_TYPE,
        VEHICLE_DETAILS: req.body.VEHICLE_DETAILS,
        VEHICLE_NO: req.body.VEHICLE_NO,
        VENDOR_ID: req.body.VENDOR_ID,
        REPORTING_PERSON_ID: req.body.REPORTING_PERSON_ID,
        CONTRACT_START_DATE: req.body.CONTRACT_START_DATE,
        CONTRACT_END_DATE: req.body.CONTRACT_END_DATE,
        TYPE: req.body.TYPE,
        DEVICE_ID: req.body.DEVICE_ID,
        CLOUD_ID: req.body.CLOUD_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        CURRENT_STATUS: req.body.CURRENT_STATUS,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        DISTRICT_ID: req.body.DISTRICT_ID,
        HOME_LATTITUDE: req.body.HOME_LATTITUDE,
        HOME_LONGITUDE: req.body.HOME_LONGITUDE,
        ORG_ID: req.body.ORG_ID,
        TECHNICIAN_STATUS: req.body.TECHNICIAN_STATUS ? '1' : '0',
        CREATED_DATE: req.body.CREATED_DATE,
        W_CLOUD_ID: req.body.CLOUD_ID,
        PINCODE: req.body.PINCODE,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        ASSIGNED_DATE: req.body.ASSIGNED_DATE,
        IS_UNIFORM_ASSIGNED: req.body.IS_UNIFORM_ASSIGNED ? '1' : '0',
        IS_TOOLKIT_ASSIGNED: req.body.IS_TOOLKIT_ASSIGNED ? '1' : '0'

    }
    return data;
}

function TechnicianreqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        DATE: req.body.DATE,
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        BREAK_START_TIME: req.body.BREAK_START_TIME,
        BREAK_END_TIME: req.body.BREAK_END_TIME,
        TOTAL_TIME: req.body.TOTAL_TIME,
        TYPE: req.body.TYPE,
        REMARK: req.body.REMARK,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').exists(),
        body('EXPERIENCE_LEVEL', ' parameter missing').exists(),
        body('MOBILE_NUMBER', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('CITY_ID').optional(),
        body('STATE_ID').isInt(),
        body('PINCODE_ID').optional(),
        body('AADHAR_NUMBER', ' parameter missing').exists(),
        body('GENDER', ' parameter missing').exists(),
        body('DOB', ' parameter missing').exists(),
        body('HOME_LATTITUDE', ' parameter missing').exists(),
        body('HOME_LONGITUDE', ' parameter missing').exists(),
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
    var TECHNICIAN_FILTER = ''
    var TECHNICIAN_FILTER2 = ''
    const TERRITORY_IDS = req.body.TERRITORY_IDS
    const IS_T_MANAGER = req.body.IS_T_MANAGER
    const IS_W_MANAGER = req.body.IS_T_MANAGER
    console.log("\n\n\n\n\n ksncxncnc", req.body);

    if (IS_T_MANAGER === 1) {
        TECHNICIAN_FILTER = ` AND ID IN(SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN(SELECT GROUP_CONCAT(PINCODE_ID) FROM territory_pincode_mapping WHERE ID IN(${TERRITORY_IDS}) AND IS_ACTIVE=1) AND IS_ACTIVE=1)`
    }
    if (IS_W_MANAGER == 1) {
        TECHNICIAN_FILTER2 = ` AND ID IN(SELECT TECHNICIAN_ID FROM inventory_technician_movement)`
    }
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianMaster + ' where 1 ' + TECHNICIAN_FILTER + TECHNICIAN_FILTER2 + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTechnicianMaster + ' where 1 ' + TECHNICIAN_FILTER + TECHNICIAN_FILTER2 + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technician information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 114,
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
    var WEEK_DAY_DATA = req.body.WEEK_DAY_DATA;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    console.log("create", req.body)
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
        return;
    }
    try {
        data.ASSIGNED_DATE = (data.IS_TOOLKIT_ASSIGNED === 1 && data.IS_UNIFORM_ASSIGNED === 1) ? mm.getSystemDate() : null;
        const connection = mm.openConnection()
        mm.executeDML(`SELECT * FROM ${technicianMaster} WHERE EMAIL_ID = ? OR MOBILE_NUMBER = ?`, [data.EMAIL_ID, data.MOBILE_NUMBER], supportKey, connection, (error, results) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to validate technician email or mobile number."
                });
                return;
            }
            if (results.length > 0) {
                const existingRecord = results[0];
                if (existingRecord.EMAIL_ID === data.EMAIL_ID && existingRecord.MOBILE_NUMBER === data.MOBILE_NUMBER) {
                    res.send({
                        "code": 300,
                        "message": "Email ID and mobile number already exist."
                    });
                } else if (existingRecord.EMAIL_ID === data.EMAIL_ID) {
                    res.send({
                        "code": 300,
                        "message": "Email ID already exist."
                    });
                } else if (existingRecord.MOBILE_NUMBER === data.MOBILE_NUMBER) {
                    res.send({
                        "code": 300,
                        "message": "Mobile number already exist."
                    });
                }
                return;
            }
            mm.executeDML('INSERT INTO ' + technicianMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save technician information."
                    });
                }
                else {
                    var details = [];
                    for (var i = 0; i < WEEK_DAY_DATA.length; i++) {
                        details.push([results.insertId, WEEK_DAY_DATA[i].IS_SERIVCE_AVAILABLE, WEEK_DAY_DATA[i].WEEK_DAY, WEEK_DAY_DATA[i].DAY_START_TIME, WEEK_DAY_DATA[i].DAY_END_TIME, WEEK_DAY_DATA[i].BREAK_START_TIME, WEEK_DAY_DATA[i].BREAK_END_TIME, 1]);
                    }
                    mm.executeDML('INSERT INTO technician_service_calender (TECHNICIAN_ID,IS_SERIVCE_AVAILABLE,WEEK_DAY,DAY_START_TIME,DAY_END_TIME,BREAK_START_TIME,BREAK_END_TIME,CLIENT_ID) VALUES ?', [details], supportKey, connection, (error, results5) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save Technician information..."
                            });
                        }
                        else {
                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created technician ${data.NAME}`;
                            let actionLog = {
                                "SOURCE_ID": results.insertId, "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "technician", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog);
                            mm.sendDynamicEmail(2, results.insertId, supportKey)
                            addGlobalData(results.insertId, supportKey)
                            const chanelData = {
                                CHANNEL_NAME: `pincode_${data.PINCODE_ID}_channel`,
                                USER_ID: results.insertId,
                                TYPE: "T",
                                STATUS: true,
                                USER_NAME: data.NAME,
                                CLIENT_ID: data.CLIENT_ID,
                                DATE: mm.getSystemDate()
                            }
                            const chanel = new channelSubscribedUsers(chanelData);
                            chanel.save()
                            const chanelData1 = {
                                CHANNEL_NAME: `system_alerts_channel`,
                                USER_ID: results.insertId,
                                TYPE: "T",
                                STATUS: true,
                                USER_NAME: data.NAME,
                                CLIENT_ID: data.CLIENT_ID,
                                DATE: mm.getSystemDate()
                            }
                            const chanel1 = new channelSubscribedUsers(chanelData1);
                            chanel1.save()

                            var CHANNEL_NAME = ''
                            if (data.TYPE == 'F') {
                                CHANNEL_NAME = 'freelancer_channel'
                            }
                            else if (data.TYPE == 'O') {
                                CHANNEL_NAME = 'on_payroll_channel'
                            }
                            else {
                                CHANNEL_NAME = 'vendor_managed_channel'
                            }

                            const chanelData2 = {
                                CHANNEL_NAME: CHANNEL_NAME,
                                USER_ID: results.insertId,
                                TYPE: "T",
                                STATUS: true,
                                USER_NAME: data.NAME,
                                CLIENT_ID: data.CLIENT_ID,
                                DATE: mm.getSystemDate()
                            }
                            const chanel2 = new channelSubscribedUsers(chanelData2);
                            chanel2.save()

                            mm.commitConnection(connection)
                            return res.send({
                                code: 200,
                                message: "Technician information created and logged successfully."
                            });
                        }
                    })
                }
            }
            );
        }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Internal Server Error."
        });
    }
};


exports.checkEmail = (req, res) => {
    var data = reqData(req);
    var supportKey = req.headers['supportkey'];
    console.log("create", req.body)
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID
    let TYPE = req.body.TYPE
    try {
        if (data.EMAIL_ID && data.MOBILE_NUMBER && TYPE) {
            let TypeFilter = "";
            if (TYPE == "U") {
                TypeFilter = ` AND ID!= ${TECHNICIAN_ID}`
            }

            mm.executeQueryData(`SELECT * FROM ${technicianMaster} WHERE (EMAIL_ID = ? OR MOBILE_NUMBER = ?) ${TypeFilter}`, [data.EMAIL_ID, data.MOBILE_NUMBER], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate technician email or mobile number."
                    });
                    return;
                }
                if (results.length > 0) {
                    const existingRecord = results[0];
                    if (existingRecord.EMAIL_ID === data.EMAIL_ID && existingRecord.MOBILE_NUMBER === data.MOBILE_NUMBER) {
                        res.send({
                            "code": 300,
                            "message": "Email ID and mobile number already exist."
                        });
                    } else if (existingRecord.EMAIL_ID === data.EMAIL_ID) {
                        res.send({
                            "code": 300,
                            "message": "Email ID already exist."
                        });
                    } else if (existingRecord.MOBILE_NUMBER === data.MOBILE_NUMBER) {
                        res.send({
                            "code": 300,
                            "message": "Mobile number already exist."
                        });
                    }
                    return;
                } else {
                    res.send({
                        "code": 200,
                        "message": "The email and mobile number is validated"
                    });
                }
            }
            );
        } else {
            res.send({
                "code": 400,
                "message": "The email or mobile number parameter is missing"
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Internal Server Error."
        });
    }
};


exports.createTechnician = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    data.PASSWORD = md5(data.PASSWORD)
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
                    mm.executeDML('SELECT * FROM technician_master WHERE EMAIL_ID=?', data.EMAIL_ID, supportKey, connection, (error, results2) => {
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
                                    "code": 300,
                                    "message": "Email already exist"
                                });
                            }
                            else {
                                mm.executeDML('INSERT INTO ' + technicianMaster + ' SET ?', data, supportKey, connection, (error, results3) => {
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
                                        mm.executeDML('INSERT INTO user_master (ROLE_ID,NAME, EMAIL_ID,PASSWORD,TECHNICIAN_ID,CLIENT_ID,ORG_ID) VALUES(?,?,?,?,?,?,?)', [6, data.NAME, data.EMAIL_ID, data.PASSWORD, results3.insertId, data.CLIENT_ID, data.ORG_ID], supportKey, connection, (error, results4) => {
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
                                                mm.executeDML('INSERT INTO user_role_mapping (USER_ID,ROLE_ID,CLIENT_ID) VALUES(?,?,?)', [results4.insertId, 6, data.CLIENT_ID], supportKey, connection, (error, results) => {
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
                                                        mm.commitConnection(connection)
                                                        res.send({
                                                            "code": 200,
                                                            "message": "Technician information saved successfully...",
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
    var WEEK_DAY_DATA = req.body.WEEK_DAY_DATA;
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    console.log("update", req.body)
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });
    // if (data.CONTRACT_END_DATE == null) {
    //     setData += "CONTRACT_END_DATE = ? , ";
    //     recordData.push(null);
    // }
    // if (data.CONTRACT_START_DATE == null) {
    //     setData += "CONTRACT_START_DATE = ? , ";
    //     recordData.push(null);
    // }
    // if (data.VENDOR_ID == null) {
    //     setData += "VENDOR_ID = ? , ";
    //     recordData.push(null);
    // }
    // if (data.VEHICLE_DETAILS == null) {
    //     setData += "VEHICLE_DETAILS = ? , ";
    //     recordData.push(null);
    // }
    // if (data.VEHICLE_NO == null) {
    //     setData += "VEHICLE_NO = ? , ";
    //     recordData.push(null);
    // }
    // if (data.VEHICLE_TYPE == null) {
    //     setData += "VEHICLE_TYPE = ? , ";
    //     recordData.push(null);
    // }
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            data.ASSIGNED_DATE = (data.IS_TOOLKIT_ASSIGNED === 1 && data.IS_UNIFORM_ASSIGNED === 1) ? mm.getSystemDate() : null;
            const connection = mm.openConnection()
            mm.executeQueryData(`SELECT * FROM ${technicianMaster} WHERE (EMAIL_ID = ? OR MOBILE_NUMBER = ?) AND ID != ?`, [data.EMAIL_ID, data.MOBILE_NUMBER, criteria.ID], supportKey, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection)
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate technician email or mobile number."
                    });
                } else if (results.length > 0) {
                    const existingRecord = results[0];
                    if (existingRecord.EMAIL_ID === data.EMAIL_ID && existingRecord.MOBILE_NUMBER === data.MOBILE_NUMBER) {
                        res.send({
                            "code": 300,
                            "message": "Email ID and mobile number already exist."
                        });
                    } else if (existingRecord.EMAIL_ID === data.EMAIL_ID) {
                        res.send({
                            "code": 300,
                            "message": "Email ID already exist."
                        });
                    } else if (existingRecord.MOBILE_NUMBER === data.MOBILE_NUMBER) {
                        res.send({
                            "code": 300,
                            "message": "Mobile number already exist."
                        });
                    }
                } else {
                    mm.executeQueryData(`UPDATE ` + technicianMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            mm.rollbackConnection(connection)

                            res.send({
                                "code": 400,
                                "message": "Failed to update technician information."
                            });
                        } else {
                            mm.executeDML('DELETE FROM technician_service_calender WHERE TECHNICIAN_ID=?', [criteria.ID], supportKey, connection, (error, resultS6) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection)
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save vendor information..."
                                    });
                                } else {
                                    var details = [];
                                    for (var i = 0; i < WEEK_DAY_DATA.length; i++) {
                                        details.push([criteria.ID, WEEK_DAY_DATA[i].IS_SERIVCE_AVAILABLE, WEEK_DAY_DATA[i].WEEK_DAY, WEEK_DAY_DATA[i].DAY_START_TIME, WEEK_DAY_DATA[i].DAY_END_TIME, WEEK_DAY_DATA[i].BREAK_START_TIME, WEEK_DAY_DATA[i].BREAK_END_TIME, 1]);
                                    }
                                    console.log("\n\nWEEK_DAY_DATA", WEEK_DAY_DATA);
                                    mm.executeDML('INSERT INTO technician_service_calender (TECHNICIAN_ID,IS_SERIVCE_AVAILABLE,WEEK_DAY,DAY_START_TIME,DAY_END_TIME,BREAK_START_TIME,BREAK_END_TIME,CLIENT_ID) VALUES ?', [details], supportKey, connection, (error, results5) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            mm.rollbackConnection(connection)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to save vendor information..."
                                            });
                                        } else {

                                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of technician ${data.NAME}`;
                                            let actionLog = {
                                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "technician", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                            }
                                            dbm.saveLog(actionLog, systemLog);
                                            addGlobalData(criteria.ID, supportKey)
                                            mm.commitConnection(connection)
                                            if (req.body.OLD_TYPE) {
                                                var OLD_CHANNEL_NAME = ''
                                                if (req.body.OLD_TYPE == 'F') {
                                                    OLD_CHANNEL_NAME = 'freelancer_channel'
                                                }
                                                else if (req.body.OLD_TYPE == 'O') {
                                                    OLD_CHANNEL_NAME = 'on_payroll_channel'
                                                }
                                                else {
                                                    OLD_CHANNEL_NAME = 'vendor_managed_channel'
                                                }
                                                channelSubscribedUsers
                                                    .updateMany({ CHANNEL_NAME: OLD_CHANNEL_NAME, USER_ID: criteria.ID, TYPE: "T" }, { STATUS: false })
                                                    .then(() => {
                                                        var CHANNEL_NAME = ''
                                                        if (data.TYPE == 'F') {
                                                            CHANNEL_NAME = 'freelancer_channel'
                                                        }
                                                        else if (data.TYPE == 'O') {
                                                            CHANNEL_NAME = 'on_payroll_channel'
                                                        }
                                                        else {
                                                            CHANNEL_NAME = 'vendor_managed_channel'
                                                        }

                                                        const chanelData1 = {
                                                            CHANNEL_NAME: CHANNEL_NAME,
                                                            USER_ID: criteria.ID,
                                                            TYPE: "T",
                                                            STATUS: true,
                                                            USER_NAME: data.NAME,
                                                            CLIENT_ID: data.CLIENT_ID,
                                                            DATE: mm.getSystemDate()
                                                        }
                                                        const newChannel = new channelSubscribedUsers(chanelData1);
                                                        newChannel.save();
                                                        res.send({
                                                            "code": 200,
                                                            message: "Channel subscribed successfully, and old channel deactivated.",
                                                        });
                                                    })

                                                    .catch((error) => {
                                                        console.error(error);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Technician information not updated successfully...",
                                                        });
                                                    });
                                            }
                                            else {
                                                res.send({
                                                    "code": 200,
                                                    "message": "Technician information updated successfully...",
                                                });
                                            }

                                        }
                                    });
                                }
                            });
                        }
                    }
                    );
                }
            }
            );
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};


function addGlobalData(data_Id, supportKey) {
    try {
        mm.executeQueryData(`select NAME,EMAIL_ID,MOBILE_NUMBER,DISTRICT_NAME,PINCODE from view_technician_master where ID = ?;`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Technician", results5[0].NAME, JSON.stringify(results5[0]), "/masters/technician_master", 0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "Technician", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/technician_master", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(err => {
                            console.error("Error in addDatainGlobalmongo:", err);
                        });
                } else {
                    console.log(" no data found");
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}


exports.login = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var username = req.body.username;
        var password = req.body.password;
        var FIREBASE_REG_TOKEN = req.body.CLOUD_ID ? req.body.CLOUD_ID : '';
        var DEVICE_ID = req.body.DEVICE_ID
        var CLOUD_ID = req.body.CLOUD_ID

        var supportKey = req.headers['supportkey'];

        if ((!username || username == ' ') || (!password || password == ' ')) {
            res.send({
                "code": 400,
                "message": "username or password or cloudId parameter missing.",
            });
        }
        else {
            var connection = mm.openConnection();
            var md5pass = md5(password);
            mm.executeDML(`SELECT * FROM ${viewTechnicianMaster}  WHERE  (MOBILE_NUMBER =? or EMAIL_ID=?) and PASSWORD =? and IS_ACTIVE = 1`, [username, username, md5pass], supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to get user record.",
                    });
                }
                else {
                    if (results1.length > 0) {
                        mm.executeDML(`update technician_master set FIREBASE_REG_TOKEN = ?,DEVICE_ID = ?,CLOUD_ID = ?,W_CLOUD_ID = ? CREATED_MODIFIED_DATE='${systemDate}',LAST_LOGIN_DATETIME='${systemDate}' WHERE ID=?`, [FIREBASE_REG_TOKEN, DEVICE_ID, CLOUD_ID, CLOUD_ID, results1[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update user record",
                                });
                            }
                            else {
                                var userDetails = [{
                                    USER_ID: results1[0].ID,
                                    CLIENT_ID: results1[0].CLIENT_ID,
                                    ROLE_ID: results1[0].ROLE_ID,
                                    ROLE_NAME: results1[0].ROLE_NAME,
                                    NAME: results1[0].NAME,
                                    USER_NAME: results1[0].USER_NAME,
                                    EMAIL_ID: results1[0].EMAIL_ID,
                                    LAST_LOGIN_DATETIME: results1[0].LAST_LOGIN_DATETIME,
                                    IS_TECHNICIAN: 1,
                                    ORG_ID: results1[0].ORG_ID
                                }]
                                generateToken(results1[0].ID, res, userDetails, connection);
                            }
                        });
                    }
                    else {
                        mm.executeDML(`SELECT * FROM customer_master  WHERE  (MOBILE_NUMBER =? or EMAIL_ID=?) and PASSWORD =? and IS_ACTIVE = 1`, [username, username, md5pass], supportKey, connection, (error, results1) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get user record.",
                                });
                            }
                            else {
                                if (results1.length > 0) {
                                    mm.executeDML(`update customer_master set CREATED_MODIFIED_DATE='${systemDate}',LAST_LOGIN_DATETIME='${systemDate}' WHERE ID=?`, [results1[0].ID], supportKey, connection, (error, resultsUpdate) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection)
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update user record",
                                            });
                                        }
                                        else {
                                            const ACTION_DETAILS = "Technician logged in to the system"
                                            let actionLog = {
                                                "SOURCE_ID": results1[0].ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "technician", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                            }
                                            dbm.saveLog(actionLog, systemLog);
                                            var userDetails = [{
                                                USER_ID: results1[0].ID,
                                                CLIENT_ID: results1[0].CLIENT_ID,
                                                ROLE_ID: results1[0].ROLE_ID,
                                                ROLE_NAME: results1[0].ROLE_NAME,
                                                USER_NAME: results1[0].USER_NAME,
                                                EMAIL_ID: results1[0].EMAIL_ID,
                                                LAST_LOGIN_DATETIME: results1[0].LAST_LOGIN_DATETIME,
                                                ORG_ID: results1[0].ORG_ID
                                            }]
                                            generateToken(results1[0].ID, res, userDetails, connection);
                                        }
                                    });
                                }
                                else {
                                    res.send({
                                        "code": 404,
                                        "message": "Incorrect username or password"
                                    });

                                }
                            }
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}


function generateToken(userId, res, resultsUser, connection) {

    try {

        var data = {
            "USER_ID": userId,
            "UserData": resultsUser
        }

        jwt.sign({ data }, process.env.SECRET, (error, token) => {
            if (error) {
                console.log("token error", error);
                // db.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to login.",

                });
            }
            else {
                // db.commitConnection(connection);
                res.send({
                    "code": 200,
                    "message": "Logged in successfully.",
                    "data": [{
                        "token": token,
                        "UserData": resultsUser
                    }]
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}


exports.changePassword = (req, res) => {
    var OLD_PASSWORD = req.body.OLD_PASSWORD;
    OLD_PASSWORD = md5(OLD_PASSWORD);
    var NEW_PASSWORD = req.body.NEW_PASSWORD;
    NEW_PASSWORD = md5(NEW_PASSWORD);
    var ID = req.body.ID;
    var systemDate = mm.getSystemDate();
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData('select ID from technician_master where PASSWORD=? AND ID=?', [OLD_PASSWORD, ID], supportKey, (error, resultsUser) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to save user information..."
                });
            } else {
                if (resultsUser.length > 0) {
                    mm.executeQueryData(`UPDATE ` + technicianMaster + ` SET PASSWORD =?, CREATED_MODIFIED_DATE =? where ID = ? `, [NEW_PASSWORD, systemDate, ID], supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update user information."
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "User information updated successfully...",
                            });
                        }
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "Password not match"
                    });
                }
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.updateTechnician = (req, res) => {
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
    if (data.CONTRACT_END_DATE == null) {
        setData += "CONTRACT_END_DATE = ? , ";
        recordData.push(null);
    }

    if (data.CONTRACT_START_DATE == null) {
        setData += "CONTRACT_START_DATE = ? , ";
        recordData.push(null);
    }

    if (data.VENDOR_ID == null) {
        setData += "VENDOR_ID = ? , ";
        recordData.push(null);
    }


    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const connection = mm.openConnection();
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=? AND TECHNICIAN_ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, connection, (error, results1) => {
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
                    mm.executeDML('SELECT * FROM technician_master WHERE EMAIL_ID=? AND ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, connection, (error, results2) => {
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
                                    "code": 300,
                                    "message": "Email already exists..."
                                });
                            }
                            else {

                                mm.executeDML(`UPDATE ` + technicianMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
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
                                        mm.executeDML(`UPDATE user_master SET NAME=?, EMAIL_ID=?, CREATED_MODIFIED_DATE = '${systemDate}' where TECHNICIAN_ID = ${criteria.ID} `, [data.NAME, data.EMAIL_ID], supportKey, connection, (error, results) => {
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
                                                mm.executeDML(`UPDATE user_role_mapping SET ROLE_ID=?, CREATED_MODIFIED_DATE = '${systemDate}' where USER_ID =(select ID from user_master where TECHNICIAN_ID = ${criteria.ID}) `, [data.ROLE_ID], supportKey, connection, (error, results) => {
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
                                                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician ${data.NAME}`;
                                                        let actionLog = {
                                                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "technician", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                        }
                                                        dbm.saveLog(actionLog, systemLog);
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
                                });
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


exports.unMappedpincodesMONGO = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const pageIndex = parseInt(req.body.pageIndex) || 1;
    const pageSize = parseInt(req.body.pageSize) || 10;
    const sortKey = req.body.sortKey || '_id'; // Use `_id` for MongoDB sorting
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || {};
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    console.log("filter", filter)
    if (IS_FILTER_WRONG !== '0' || !TECHNICIAN_ID) {
        return res.status(400).send({
            code: 400,
            message: 'Invalid filter parameter or technician id.',
        });
    }

    try {
        // Fetch excluded PINCODE_IDs from MySQL
        const query = `SELECT PINCODE_ID FROM technician_pincode_mapping WHERE TECHNICIAN_ID = ${TECHNICIAN_ID}`;
        mm.executeQuery(query, supportKey, async (error, resultsPincode) => {
            if (error) {
                console.error(error);
                return res.status(400).send({
                    code: 400,
                    message: 'Failed to get technician postal code mappings.',
                });
            }
            const excludedPincodeIds = resultsPincode.map(item => item.PINCODE_ID);
            // console.log(`Pincode`, excludedPincodeIds);
            try {
                // Build MongoDB filter
                let mongoFilter = {};

                if (excludedPincodeIds && excludedPincodeIds.length > 0 && excludedPincodeIds != null && excludedPincodeIds[0] != null) {
                    mongoFilter = { $and: [{ _id: { $nin: excludedPincodeIds } }, filter] }
                } else {
                    mongoFilter = filter

                }
                console.log('mongofilter', mongoFilter);

                // Count total records
                const totalRecords = await Pincode.countDocuments(mongoFilter);

                // Fetch paginated data
                const sortOrder = sortValue === 'DESC' ? -1 : 1;
                const pincodeData = await Pincode.find(mongoFilter)
                    .sort({ [sortKey]: sortOrder })

                // .skip((pageIndex - 1) * pageSize)
                // .limit(pageSize);
                return res.status(200).send({
                    code: 200,
                    message: 'success',
                    count: totalRecords,
                    data: pincodeData,
                });

            } catch (mongoError) {
                console.error(mongoError);
                return res.status(500).send({
                    code: 500,
                    message: 'Failed to query MongoDB.',
                });
            }


        })
    } catch (error) {
        console.error(error);
        return res.status(500).send({
            code: 500,
            message: 'Something went wrong.',
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
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
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
        if (IS_FILTER_WRONG == "0" && TECHNICIAN_ID != '') {
            mm.executeQuery(`select count(*) as cnt from pincode_master p where 1 AND ID NOT IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID}) AND ID IN (select DISTINCT PINCODE_ID from territory_pincode_mapping)` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery('select * from view_pincode_master p where 1 AND ID NOT IN (select PINCODE_ID from technician_pincode_mapping where TECHNICIAN_ID = ' + TECHNICIAN_ID + ') AND ID IN (select DISTINCT PINCODE_ID from territory_pincode_mapping)' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get technician information."
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
                message: "Invalid filter parameter or technician id."
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



exports.unMappedSkills = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
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
        if (IS_FILTER_WRONG == "0" && TECHNICIAN_ID != '') {
            mm.executeQuery(`select count(*) as cnt from skill_master p where 1 AND ID NOT IN (select SKILL_ID from technician_skill_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID})` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from skill_master p where 1 AND ID NOT IN (select SKILL_ID from technician_skill_mapping where TECHNICIAN_ID = ${TECHNICIAN_ID})` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get technician information."
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
                message: "Invalid filter parameter or technician id."
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

exports.getTechnicianCalendar = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from technicianschedule where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technician count.",
                    });
                }
                else {
                    mm.executeQuery('select * from technicianschedule where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technician information."
                            });
                        }
                        else {
                            res.send({
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

exports.sendOTP1 = (req, res) => {

    var MOBILE_NUMBER = req.body.MOBILE_NUMBER
    var COUNTRY_CODE = req.body.COUNTRY_CODE
    var DEVICE_ID = req.body.DEVICE_ID
    var systemDate = mm.getSystemDate()
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQueryData('SELECT MOBILE_NUMBER,DEVICE_ID FROM technician_master WHERE MOBILE_NUMBER=? AND IS_ACTIVE=1 ', [MOBILE_NUMBER], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get technician data.",
                });
            }
            else {
                if (results1.length > 0) {
                    if (results1[0].DEVICE_ID != DEVICE_ID) {
                        res.send({
                            "code": 301,
                            "message": "You are already logged in on another device.",
                        });
                    } else {
                        // var OTP = Math.floor(1000 + Math.random() * 9000);
                        var OTP = "1234";
                        mm.executeQueryData('INSERT INTO  registration_attempt_details (MOBILE_NO,MOBILE_OTP) VALUES (?,?)', [MOBILE_NUMBER, OTP], supportKey, (error, resultsOtp1) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save registration information..."
                                });
                            }
                            else {
                                mm.executeQueryData('INSERT INTO  registration_otp_details (TYPE,TYPE_VALUE,OTP,OTP_MESSAGE,REQUESTED_DATETIME,CLIENT_ID,STATUS) VALUES (?,?,?,?,?,?,?)', ['M', MOBILE_NUMBER, OTP, 'genericotp', systemDate, 1, 1], supportKey, (error, resultsOtp2) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save registration information..."
                                        });
                                    } else {
                                        var wparams = [
                                            {
                                                "type": "body",
                                                "parameters": [
                                                    {
                                                        "type": "text",
                                                        "text": OTP
                                                    }
                                                ]
                                            },
                                            {
                                                "type": "button",
                                                "sub_type": "url",
                                                "index": "0",
                                                "parameters": [
                                                    {
                                                        "type": "text",
                                                        "text": OTP
                                                    }
                                                ]
                                            }
                                        ]
                                        const SENT_TO = `${COUNTRY_CODE}${MOBILE_NUMBER}`;
                                        mm.sendWAToolSMS(SENT_TO, "genericotp", wparams, 'en', (error, resultswsms) => {
                                            if (error) {
                                                console.log(error)
                                            }
                                            else {
                                                console.log(" whatsapp msg send : ", resultswsms)
                                            }
                                        })
                                        res.send({
                                            "code": 200,
                                            "message": "Otp successfully sent",
                                            "type": 1
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "Invalid mobile number."
                    });
                }
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


exports.verifyOTPOLD = (req, res) => {

    var MOBILE = req.body.MOBILE_NUMBER
    var OTP = req.body.OTP
    var CLOUD_ID = req.body.CLOUD_ID
    var supportKey = req.headers['supportkey'];
    // console.log('req', req.body)
    try {
        mm.executeQueryData('SELECT MOBILE_OTP,ID FROM registration_attempt_details WHERE MOBILE_NO=? ORDER BY ID DESC LIMIT 1', [MOBILE], supportKey, (error, results2) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get memberMaster count.",
                });
            }
            else {
                if (results2.length > 0) {
                    if (results2[0].MOBILE_OTP == OTP) {
                        mm.executeQueryData(`SELECT * FROM technician_master  WHERE  MOBILE_NUMBER = ? and IS_ACTIVE = 1`, [MOBILE], supportKey, (error, results1) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to login...",
                                });
                            }
                            else {
                                if (results1.length > 0) {
                                    mm.executeQueryData(`UPDATE technician_master SET CLOUD_ID=? WHERE ID = ?`, [CLOUD_ID, results1[0].ID], supportKey, (error, resultRole) => {
                                        if (error) {
                                            console.log(error);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to login..."
                                            });

                                        } else {
                                            // mm.executeQueryData(`SELECT * FROM view_user_role_mapping where USER_ID = ?`, [results1[0].ID], supportKey, (error, resultRole) => {
                                            //     if (error) {
                                            //         console.log(error);
                                            //         res.send({
                                            //             "code": 400,
                                            //             "message": "Failed to login..."
                                            //         });

                                            //     } else {
                                            console.log("resultRole", resultRole);
                                            var userDetails = [{
                                                USER_ID: results1[0].ID,
                                                USER_NAME: results1[0].NAME,
                                                NAME: results1[0].NAME,
                                                // NAME: results1[0].NAME,
                                                MOBILE_NUMBER: results1[0].MOBILE_NUMBER,
                                                CLIENT_ID: results1[0].CLIENT_ID,
                                                // ROLE_ID: resultRole[0].ROLE_ID,
                                                FIRST_NAME: results1[0].FIRST_NAME,
                                                FATHER_NAME: results1[0].FATHER_NAME,
                                                SURNAME: results1[0].SURNAME,
                                                EMAIL_ID: results1[0].EMAIL_ID,
                                            }]

                                            generateToken(results1[0].ID, res, userDetails, "1");
                                        }
                                    })
                                    //     }
                                    // })
                                } else {
                                    res.send({
                                        "code": 400,
                                        "message": "Invalid mobile number."
                                    });
                                }
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "Invalid OTP",
                        });
                    }
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "OTP not found",
                    });
                }

            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }

}



function updateLogAndStatus(TECHNICIAN_ID, LOG_DATE_TIME, LOG_TEXT, STATUS, TYPE, TECHNICIAN_STATUS, supportKey, req, callback) {

    console.log("req.body.authData.data \n\n :", req.body.authData.data);

    const logQuery = 'INSERT INTO technician_day_logs (TECHNICIAN_ID,LOG_DATE_TIME,LOG_TEXT,STATUS,TYPE,USER_ID) VALUES(?,?,?,?,?,?)';
    const masterQuery = 'UPDATE technician_master SET TECHNICIAN_STATUS=? WHERE ID=?';

    mm.executeQueryData(logQuery, [TECHNICIAN_ID, LOG_DATE_TIME, LOG_TEXT, STATUS, TYPE, req.body.authData.data.USER_ID ? req.body.authData.data.USER_ID : 0], supportKey, (logError, logResults) => {
        if (logError) {
            return callback(logError, null);
        } else {
            mm.executeQueryData(masterQuery, [TECHNICIAN_STATUS, TECHNICIAN_ID], supportKey, (statusError, statusResults) => {
                if (statusError) {
                    return callback(statusError, null);
                } else {
                    callback(null, { logResults, statusResults });
                }
            });
        }
    });
}


exports.dayTrack = (req, res) => {
    var data = TechnicianreqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var LOG_DATE_TIME = mm.getSystemDate();
    var LOG_TEXT = '';
    var TYPE = '';
    var TECHNICIAN_STATUS = 1;

    if (data.TYPE === "IN") {
        LOG_TEXT = "Day Start By Technician";
        TYPE = "TECHNICIAN";
        TECHNICIAN_STATUS = 1;
    } else if (data.TYPE === "OUT") {
        LOG_TEXT = "Day End By Technician";
        TYPE = "TECHNICIAN";
        TECHNICIAN_STATUS = 0;
    } else if (data.TYPE === "BS") {
        LOG_TEXT = "Break Start By Technician";
        TYPE = "TECHNICIAN";
    } else if (data.TYPE === "BI") {
        LOG_TEXT = "Break Ended By Technician";
        TYPE = "TECHNICIAN";
    } else {
        return res.status(422).json({
            code: 422,
            message: "Invalid TYPE",
        });
    }

    if (!errors.isEmpty()) {
        return res.status(422).send({
            code: 422,
            message: errors.errors,
        });
    }
    console.log('TECHNICIAN_STATUS', TECHNICIAN_STATUS)
    try {
        const currentDate = new Date().toISOString().split('T')[0];

        const checkQuery = `SELECT * FROM technician_daystart_track WHERE DATE = ? AND TECHNICIAN_ID = ?`;

        mm.executeQueryData(checkQuery, [currentDate, data.TECHNICIAN_ID], supportKey, (error, existingRecord) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.send({
                    code: 400,
                    message: "Error while checking existing record.",
                });
            }

            if (existingRecord.length > 0) {
                let setData = '';
                let recordData = [];

                Object.keys(data).forEach((key) => {
                    if (data[key]) {
                        setData += `${key} = ?, `;
                        recordData.push(data[key]);
                    }
                });

                if (setData.length > 0) {
                    setData = setData.slice(0, -2);
                    const updateQuery = `UPDATE technician_daystart_track SET ${setData} WHERE DATE = ? AND TECHNICIAN_ID = ?`;
                    recordData.push(currentDate, data.TECHNICIAN_ID);

                    mm.executeQueryData(updateQuery, recordData, supportKey, (updateError) => {
                        if (updateError) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            return res.send({
                                code: 400,
                                message: "Failed to update technician time track.",
                            });
                        }
                        updateLogAndStatus(data.TECHNICIAN_ID, LOG_DATE_TIME, LOG_TEXT, data.TYPE, TYPE, TECHNICIAN_STATUS, supportKey, req, (err) => {
                            if (err) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.status(400).json({
                                    code: 400,
                                    message: "Failed to update log and status.",
                                });
                            }
                            res.status(200).json({
                                code: 200,
                                message: "Technician day track updated successfully.",
                            });
                        });
                    });
                } else {
                    res.send({
                        code: 200,
                        message: "No changes detected for today's record.",
                    });
                }
            } else {
                mm.executeQueryData('INSERT INTO technician_daystart_track SET ?', data, supportKey, (insertError) => {
                    if (insertError) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.send({
                            code: 400,
                            message: "Failed to save technician time track information.",
                        });
                    }
                    updateLogAndStatus(data.TECHNICIAN_ID, LOG_DATE_TIME, LOG_TEXT, data.TYPE, TYPE, TECHNICIAN_STATUS, supportKey, req, (err) => {
                        if (err) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            return res.status(400).json({
                                code: 400,
                                message: "Failed to update log and status.",
                            });
                        }
                        res.status(200).json({
                            code: 200,
                            message: "Technician time track information saved successfully.",
                        });
                    });
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error(error);
        res.send({
            code: 500,
            message: "Internal Server Error.",
        });
    }
};

exports.getDayTrack = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from technician_daystart_track where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get  count.",
                    });
                }
                else {
                    mm.executeQuery('select * from technician_daystart_track where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 114,
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




//updated on 30-03-25 by ujef for action log type condition for admin panel
exports.updateJobStatus = (req, res) => {
    console.log("\n\n\n\n\n\n req.body.authData : ", req.body);
    const errors = validationResult(req);
    const JOB_DATA = req.body.JOB_DATA;
    console.log("\n\n\n\n\n\n\nJOB_DATA", req.body);
    var supportKey = req.headers['supportkey'];
    const EXPECTED_DATE_TIME = req.body.JOB_DATA[0].EXPECTED_DATE_TIME;
    const ESTIMATED_TIME_IN_MIN = req.body.JOB_DATA[0].ESTIMATED_TIME_IN_MIN;
    const START_TIME = new Date(EXPECTED_DATE_TIME.replace(' ', 'T'));
    const endTime = new Date(START_TIME.getTime() + ESTIMATED_TIME_IN_MIN * 60000);
    const END_TIME = endTime;
    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const formattedStartTime = START_TIME.toLocaleTimeString('en-GB', options);
    const formattedEndTime = END_TIME.toLocaleTimeString('en-GB', options);
    console.log("START_TIME:", formattedStartTime);
    console.log("END_TIME:", formattedEndTime);
    const TERRITORY_ID = req.body.JOB_DATA[0].TERRITORY_ID;
    const TECHNICIAN_NAME = req.body.JOB_DATA[0].TECHNICIAN_NAME ? req.body.JOB_DATA[0].TECHNICIAN_NAME : req.body.TECHNICIAN_NAME ? req.body.TECHNICIAN_NAME : req.body.NAME;
    const JOB_CARD_NO = req.body.JOB_DATA[0].JOB_CARD_NO;
    var DATE = EXPECTED_DATE_TIME.split(' ')[0];
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    let ID = req.body.JOB_DATA[0].ID;
    let SERVICE_ID = req.body.JOB_DATA[0].SERVICE_ID;
    var ORDER_ID = req.body.JOB_DATA[0].ORDER_ID;
    var supportKey = req.headers['supportkey'];
    var STATUS = req.body.STATUS;
    let REMARK = req.body.REMARK ? req.body.REMARK : '';
    var systemDate = mm.getSystemDate();
    const IS_UPDATED_BY_ADMIN = req.body.IS_UPDATED_BY_ADMIN ? req.body.IS_UPDATED_BY_ADMIN : 0;
    if (!TECHNICIAN_ID || !ORDER_ID || !STATUS || !ID || !SERVICE_ID) {
        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, ORDER_ID, STATUS, ID, SERVICE_ID`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        const connection = mm.openConnection();
        let setData = "";
        let recordData = [];
        let ORDER_STATUS = '';

        if (STATUS === "AC" || STATUS === "AS") {
            setData += "JOB_STATUS_ID = ?, TECHNICIAN_STATUS = ?, ";
            // assignJobtoTechnician(JOB_DATA, TECHNICIAN_ID, req, res);
            recordData.push(2, "AS");
            ORDER_STATUS = "OS";
        } else if (STATUS === "ON") {
            setData += "TECHNICIAN_STATUS = ?, ";
            recordData.push("ON");
        } else if (STATUS === "CO") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?,JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, mm.getSystemDate(), JOB_DATA[0].USED_TIME, REMARK);
        } else if (STATUS === "ST") {
            setData += "TRACK_STATUS = ?, ";
            recordData.push("ST");
        } else if (STATUS === "RD") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?,";
            ORDER_STATUS = "ON";
            recordData.push("RD", "ON");
        } else if (STATUS === "SJ") {
            setData += "TRACK_STATUS = ?, ";
            recordData.push("SJ");
        } else if (STATUS === "EJ") {
            setData += "TRACK_STATUS = ?, TECHNICIAN_STATUS = ?, JOB_STATUS_ID = ?,JOB_COMPLETED_DATETIME = ?, USED_TIME = ?, REMARK = ?";
            recordData.push("EJ", "CO", 3, mm.getSystemDate(), JOB_DATA[0].USED_TIME, REMARK);
        } else if (STATUS === "PJ") {
            setData += "TRACK_STATUS = ?, USED_TIME = ?,JOB_PAUSED_DATETIME = ?,";
            recordData.push("PJ", JOB_DATA[0].USED_TIME, mm.getSystemDate());
        } else if (STATUS === "RJ") {
            setData += "TRACK_STATUS = ?,JOB_RESUMED_DATETIME = ?,";
            recordData.push("SJ", mm.getSystemDate());
        } else {
            console.log("\n\n\n\nInvalid STATUS value.");

            return res.send({
                code: 400,
                message: "Invalid STATUS value."
            });
        }

        let ACTION_DETAILS = '';
        let ORDER_STATUS_LOG = '';
        let ORDER_STATUSS = '';
        let LOG_TYPE = ''
        if (STATUS === 'AC' || STATUS === 'AS') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has accepted the job ${req.body.JOB_DATA[0].JOB_CARD_NO}`;
            ORDER_STATUS_LOG = `Technician has accepted the job`;
            ORDER_STATUSS = `Order scheduled.`;
            LOG_TYPE = 'Order';
        } else if (STATUS === 'ON') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has ongoing job ${req.body.JOB_DATA[0].JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician has ongoing the job`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'CO') {
            ACTION_DETAILS = ` ${TECHNICIAN_NAME} has completed the job card ${JOB_CARD_NO} from the list`;
            ORDER_STATUS_LOG = `Technician has completed the job`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'EJ') {
            ACTION_DETAILS = ` ${TECHNICIAN_NAME} has completed the job card ${JOB_CARD_NO} from the list`;
            ORDER_STATUS_LOG = `Technician has completed the job`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'ST') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has updated job ${req.body.JOB_DATA[0].JOB_CARD_NO} to start travelling.`;
            ORDER_STATUS_LOG = `Technician has started traveling for the job`;
            ORDER_STATUSS = ``
            LOG_TYPE = 'Job';
        } else if (STATUS === 'SJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has updated job ${req.body.JOB_DATA[0].JOB_CARD_NO} to start job.`;
            ORDER_STATUS_LOG = `Technician has started the job`;
            ORDER_STATUSS = `Order ongoing`;
            LOG_TYPE = 'Order';
        } else if (STATUS === 'RD') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has updated job ${req.body.JOB_DATA[0].JOB_CARD_NO} to reached at customer location.`;
            ORDER_STATUS_LOG = `Technician is reached at customer location`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'PJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has paused the job ${req.body.JOB_DATA[0].JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician is paused the job`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else if (STATUS === 'RJ') {
            ACTION_DETAILS = `${TECHNICIAN_NAME} has resumed the job ${req.body.JOB_DATA[0].JOB_CARD_NO}.`;
            ORDER_STATUS_LOG = `Technician is resumed the job`;
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        } else {
            ORDER_STATUSS = ``;
            LOG_TYPE = 'Job';
        }
        var DESCRIPTION = '';
        var TITLE = '';
        if (STATUS === "ST") {
            TITLE = 'Technician is On the Way'
            DESCRIPTION = `Our technician is on the way to your location for job ${req.body.JOB_DATA[0].JOB_CARD_NO}.`
        } else if (STATUS === "RD") {
            TITLE = 'Technician Has Arrived'
            DESCRIPTION = `Our technician has reached to your location for job ${req.body.JOB_DATA[0].JOB_CARD_NO}.`
        } else if (STATUS === "SJ") {
            TITLE = 'Job Started'
            DESCRIPTION = `The job ${req.body.JOB_DATA[0].JOB_CARD_NO} for your order has been started. Our technician is working on it.`
        } else if (STATUS === "EJ" || STATUS === "CO") {
            TITLE = 'Job Completed'
            DESCRIPTION = `The job ${req.body.JOB_DATA[0].JOB_CARD_NO} for your order has been successfully completed. Thank you for choosing our service!`
        } else if (STATUS === "PJ") {
            TITLE = 'Job Paused'
            DESCRIPTION = `The job ${req.body.JOB_DATA[0].JOB_CARD_NO} is paused by our technician.`
        } else if (STATUS === "RJ") {
            TITLE = 'Job Resumed'
            DESCRIPTION = `The job ${req.body.JOB_DATA[0].JOB_CARD_NO} is resumed by our technician.`
        } else if (STATUS === "AS" || STATUS === "AC") {
            TITLE = 'Job assigned'
            DESCRIPTION = `The job ${req.body.JOB_DATA[0].JOB_CARD_NO} is assigned to the technician.`
        }
        mm.executeDML('SELECT * FROM view_order_master where ID = ?', [JOB_DATA[0].ORDER_ID], supportKey, connection, (error, OrderResult) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to save orderMaster information..."
                });
            }
            else {
                // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, req.body.JOB_DATA[0].CUSTOMER_ID, `**${TITLE}**`, `${DESCRIPTION}`, "", "J", supportKey, "N", "J", req.body);
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${req.body.JOB_DATA[0].CUSTOMER_ID}_channel`, `${TITLE}`, `${DESCRIPTION}`, "", "J", supportKey, "N", "J", OrderResult);

                if (STATUS === 'AC' || STATUS === 'AS') {
                    mm.executeDML(`SELECT * FROM view_job_card WHERE 1 AND TECHNICIAN_ID = ? AND DATE(EXPECTED_DATE_TIME) = ? AND (START_TIME <= '${formattedStartTime}' AND START_TIME <= '${formattedEndTime}') AND (END_TIME >= '${formattedStartTime}' AND END_TIME >= '${formattedEndTime}') AND STATUS = 'AS'`, [TECHNICIAN_ID, DATE, formattedStartTime, formattedEndTime], supportKey, connection, (error, resultsCheck) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            console.log(error);
                            return res.status(400).send({
                                "code": 400,
                                "message": "Failed to update technicianschedule information."
                            });
                        } else {
                            if (resultsCheck.length > 0) {
                                console.log("\n\n Job card already scheduled for this time slot.");
                                return res.status(200).send({
                                    "code": 300,
                                    "message": "Job card already scheduled for this time slot."
                                });
                            } else {
                                mm.executeDML(`SELECT * FROM  technicianschedule WHERE 1 AND TECHNICIAN_ID = ? AND DATE = ? `, [TECHNICIAN_ID, DATE], supportKey, connection, (error, resultsCheckt) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                        console.log(error);
                                        return res.status(400).send({
                                            "code": 400,
                                            "message": "Failed to update technicianschedule information."
                                        });
                                    } else {
                                        // Generate time slots
                                        const start = parseTime(formattedStartTime); // Convert "16:00" to { hours: 16, minutes: 0 }
                                        const end = parseTime(formattedEndTime);
                                        const timeSlots = generateTimeSlots(start, end);
                                        const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                                        var query = ``;
                                        var values = ''
                                        if (resultsCheckt.length > 0) {
                                            query = `UPDATE technicianschedule SET ${setClauses}, DATE = ?,TECHNICIAN_NAME = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                                            values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS'), DATE, req.body.NAME ? req.body.NAME : JOB_DATA[0].TECHNICIAN_NAME, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                                        } else {
                                            const columns = timeSlots.map(slot => `\`${slot}\``).join(", ");
                                            const placeholders = timeSlots.map(() => "?").join(", ");
                                            query = `INSERT INTO technicianschedule (${columns},TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID)  VALUES (${placeholders},?, ?, ?, ?, ?)`;
                                            values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS'), req.body.NAME ? req.body.NAME : JOB_DATA[0].TECHNICIAN_NAME, DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                                        }
                                        mm.executeDML(query, values, supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                console.log(error);
                                                return res.status(400).send({
                                                    "code": 400,
                                                    "message": "Failed to update technicianschedule information."
                                                });
                                            } else {
                                                mm.executeDML('UPDATE job_card SET JOB_STATUS_ID = ?,TECHNICIAN_ID = ?,TECHNICIAN_NAME = ?,SCHEDULED_DATE_TIME = ?,START_TIME = ?,END_TIME = ?,USER_ID = ?,ASSIGNED_DATE = ?,ORGNISATION_ID = ?,TECHNICIAN_STATUS = ? WHERE ID = ? AND ORDER_ID = ? AND JOB_CARD_NO = ? AND SERVICE_ID = ? ', [2, TECHNICIAN_ID, req.body.NAME ? req.body.NAME : JOB_DATA[0].TECHNICIAN_NAME, DATE, formattedStartTime, formattedEndTime, JOB_DATA[0].USER_ID, mm.getSystemDate(), JOB_DATA[0].ORGNISATION_ID, 'AS', JOB_DATA[0].ID, JOB_DATA[0].ORDER_ID, JOB_DATA[0].JOB_CARD_NO, JOB_DATA[0].SERVICE_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                        console.log(error);
                                                        return res.status(400).send({
                                                            "code": 400,
                                                            "message": "Failed to update technicianschedule information."
                                                        });
                                                    } else {
                                                        mm.executeDML('UPDATE order_master SET ORDER_STATUS_ID = ? WHERE ID = ?', [4, JOB_DATA[0].ORDER_ID], supportKey, connection, (error, resultsOrder) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                                console.log(error);
                                                                return res.status(400).send({
                                                                    "code": 400,
                                                                    "message": "Failed to update technicianschedule information."
                                                                });
                                                            } else {
                                                                var ACTION_DETAILS1 = ` ${JOB_DATA[0].TECHNICIAN_NAME} has accepted the job ${JOB_CARD_NO}`
                                                                let actionLog = {
                                                                    "SOURCE_ID": TECHNICIAN_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "JobstatusUpdate", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                }
                                                                const logData = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 },
                                                                { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 }]
                                                                dbm.saveLog(logData, technicianActionLog);
                                                                mm.sendNotificationToAdmin(8, `${TITLE}`, `${DESCRIPTION}`, "", "J", "N", supportKey, "J", OrderResult);
                                                                mm.commitConnection(connection);
                                                                res.status(200).send({
                                                                    "code": 200,
                                                                    "message": "Technicianschedule information updated successfully...",
                                                                });
                                                            }
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
                } else if (STATUS === 'CO' || STATUS === 'EJ') {
                    console.log("\n\n\n\n\n\n\n\n\nrequested data:", req.body);

                    mm.executeDML(`SELECT * FROM  technicianschedule WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ? `, [TERRITORY_ID, TECHNICIAN_ID, DATE], supportKey, connection, (error, resultsCheckt) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            console.log(error);
                            return res.status(400).send({
                                "code": 400,
                                "message": "Failed to update technicianschedule information."
                            });
                        } else {
                            // Generate time slots
                            const start = parseTime(formattedStartTime); // Convert "16:00" to { hours: 16, minutes: 0 }
                            const end = parseTime(formattedEndTime);
                            const timeSlots = generateTimeSlots(start, end);
                            const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                            var query = ``;
                            var values = ''
                            if (resultsCheckt.length > 0) {
                                query = `UPDATE technicianschedule SET ${setClauses}, DATE = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                                values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',CO'), DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                            } else {
                                const columns = timeSlots.map(slot => `\`${slot}\``).join(", ");
                                const placeholders = timeSlots.map(() => "?").join(", ");
                                query = `INSERT INTO technicianschedule (${columns},TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID)  VALUES (${placeholders},?, ?, ?, ?, ?)`;
                                values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',CO'), TECHNICIAN_NAME, DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                            }
                            mm.executeDML(query, values, supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                    console.log(error);
                                    return res.status(400).send({
                                        "code": 400,
                                        "message": "Failed to update technicianschedule information."
                                    });
                                } else {
                                    mm.executeDML('UPDATE job_card SET JOB_STATUS_ID = ?,TECHNICIAN_STATUS = ?,TECHNICIAN_ID = ?,TECHNICIAN_NAME = ?,SCHEDULED_DATE_TIME = ?,START_TIME = ?,END_TIME = ?,USER_ID = ?,ASSIGNED_DATE = ?,ORGNISATION_ID = ?,JOB_COMPLETED_DATETIME = ? WHERE ID = ? AND ORDER_ID = ? AND JOB_CARD_NO = ? AND SERVICE_ID = ? ', [3, 'CO', TECHNICIAN_ID, TECHNICIAN_NAME, DATE, formattedStartTime, formattedEndTime, JOB_DATA[0].USER_ID, mm.getSystemDate(), JOB_DATA[0].ORGNISATION_ID, mm.getSystemDate(), JOB_DATA[0].ID, JOB_DATA[0].ORDER_ID, JOB_DATA[0].JOB_CARD_NO, JOB_DATA[0].SERVICE_ID], supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                            console.log(error);
                                            return res.status(400).send({
                                                "code": 400,
                                                "message": "Failed to update technicianschedule information."
                                            });
                                        } else {
                                            mm.executeDML(`UPDATE order_master SET ORDER_STATUS_ID = ?,OEDER_COMPLETED_DATETIME = ? WHERE ID IN (SELECT ORDER_ID FROM job_card WHERE ORDER_ID = ${ORDER_ID} GROUP BY ORDER_ID HAVING COUNT(CASE WHEN JOB_STATUS_ID != 3 THEN 1 END) = 0);`, [6, mm.getSystemDate()], supportKey, connection, (error, resultsOrder) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                    console.log(error);
                                                    return res.status(400).send({
                                                        "code": 400,
                                                        "message": "Failed to update technicianschedule information."
                                                    });
                                                } else {
                                                    mm.executeDML(`SELECT ORDER_STATUS,JOB_CARD_STATUS,ORDER_DETAILS_ID FROM view_job_card WHERE ORDER_ID = ?;`, [ORDER_ID], supportKey, connection, (error, getCountforinvoice) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                            console.log(error);
                                                            return res.status(400).send({
                                                                "code": 400,
                                                                "message": "Failed to update technicianschedule information."
                                                            });
                                                        } else {
                                                            if (getCountforinvoice.length > 0) {
                                                                if (Array.isArray(getCountforinvoice) && getCountforinvoice.some(item => item.JOB_CARD_STATUS === "Assigned")) {
                                                                    console.log("\n\n\n\nthe job is in assigned stage so no need to generate invoice");
                                                                    // generateInvoice(JOB_DATA[0].JOB_CARD_ID, JOB_DATA[0].ORDER_ID, JOB_DATA[0].JOB_CARD_NO, "O", JOB_DATA[0].ORDER_NO)
                                                                } else {
                                                                    console.log("completed");
                                                                    generateInvoice(JOB_DATA[0].JOB_CARD_ID, JOB_DATA[0].ORDER_ID, JOB_DATA[0].JOB_CARD_NO, "O", JOB_DATA[0].ORDER_NO, req.body)
                                                                    mm.sendDynamicEmail(12, getCountforinvoice[0].ORDER_DETAILS_ID)
                                                                }
                                                            }
                                                            mm.executeDML(`select * from view_job_card  WHERE ORDER_ID = ? AND STATUS IN("AS", "AC")`, [JOB_DATA[0].ORDER_ID], supportKey, connection, (error, resultsjOBS) => {
                                                                if (error) {
                                                                    mm.rollbackConnection(connection);
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    console.log(error);
                                                                    return res.send({
                                                                        code: 400,
                                                                        message: "Failed to update job card status."
                                                                    });
                                                                } else {
                                                                    mm.commitConnection(connection);
                                                                    var ACTION_DETAILS1 = ` ${TECHNICIAN_NAME} has completed the job ${JOB_CARD_NO}`
                                                                    let actionLog = {
                                                                        "SOURCE_ID": TECHNICIAN_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "JobstatusUpdate", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                    }
                                                                    if (resultsjOBS.length === 0) {
                                                                        console.log("\n\n\n\n\n\nresultsOrder", resultsOrder);
                                                                        ORDER_STATUSS = 'Order completed for job'
                                                                        let logdata1 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Job", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 },
                                                                        {
                                                                            TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Order", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: "Order completed", PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0
                                                                        }]
                                                                        dbm.saveLog(logdata1, technicianActionLog);
                                                                    } else {
                                                                        console.log("\n\n\n\n\n\nresultsOrder11", resultsOrder);
                                                                        ORDER_STATUSS = ''
                                                                        let logdata2 = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS1, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 }]
                                                                        dbm.saveLog(logdata2, technicianActionLog);
                                                                    }
                                                                    mm.sendNotificationToAdmin(8, `${TITLE}`, `${DESCRIPTION}`, "", "J", "N", supportKey, "J", OrderResult);
                                                                    res.status(200).send({
                                                                        "code": 200,
                                                                        "message": "Technicianschedule information updated successfully...",
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else if (STATUS == 'SJ') {
                    mm.executeDML(`UPDATE job_card SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${ID} AND TECHNICIAN_ID=${TECHNICIAN_ID} AND SERVICE_ID=${SERVICE_ID} AND ORDER_ID=${ORDER_ID}`, recordData, supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            return res.send({
                                code: 400,
                                message: "Failed to update job card status."
                            });
                        } else {
                            mm.executeDML(`UPDATE order_master SET ORDER_STATUS_ID = 5  WHERE ID = ?`, [JOB_DATA[0].ORDER_ID], supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    return res.send({
                                        code: 400,
                                        message: "Failed to update job card status."
                                    });
                                } else {
                                    mm.executeDML(`select ORDER_DETAILS_ID from job_card  WHERE ID = ?`, [JOB_DATA[0].ID], supportKey, connection, (error, resultsjOBS) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            return res.send({
                                                code: 400,
                                                message: "Failed to update job card status."
                                            });
                                        } else {
                                            mm.commitConnection(connection);
                                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: "Job", ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 }
                                            const logData3 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: '-', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: ORDER_STATUSS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 }
                                            const loggarry = [logData2, logData3];
                                            dbm.saveLog(loggarry, technicianActionLog);
                                            mm.sendNotificationToAdmin(8, `${TITLE}`, `${DESCRIPTION}`, "", "J", "N", supportKey, "J", OrderResult);
                                            mm.sendDynamicEmail(11, resultsjOBS[0].ORDER_DETAILS_ID, supportKey)
                                            res.status(200).send({
                                                "code": 200,
                                                "message": "Technicianschedule information updated successfully...",
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                } else if (STATUS == "PJ" || STATUS == "RJ") {
                    mm.executeDML(`UPDATE job_card SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${JOB_DATA[0].ID} AND TECHNICIAN_ID=${JOB_DATA[0].TECHNICIAN_ID} AND SERVICE_ID=${JOB_DATA[0].SERVICE_ID} AND ORDER_ID=${JOB_DATA[0].ORDER_ID}`, recordData, supportKey, connection, (error, results) => {
                        if (error) {
                            console.log("\n\n\n\n\n\n\n\n in else block");
                            mm.rollbackConnection(connection);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            return res.send({
                                code: 400,
                                message: "Failed to update job card status."
                            });
                        } else {
                            mm.executeDML(`INSERT INTO job_card_pause_log(JOB_CARD_ID,STATUS,DATE_TIME,LOGGED_BY,LOG_TEXT,TECHNICIAN_ID) VALUES(?,?,?,?,?,?)`, [JOB_DATA[0].ID, STATUS, mm.getSystemDate(), TECHNICIAN_ID, ACTION_DETAILS, TECHNICIAN_ID], supportKey, connection, (error, resultsInsert) => {
                                if (error) {
                                    console.log("\n\n\n\n\n\n\n\n in else block");
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    return res.send({
                                        code: 400,
                                        message: "Failed to update job card status."
                                    });
                                } else {
                                    mm.commitConnection(connection);
                                    const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: JOB_DATA[0].ORDER_STATUS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 }
                                    let actionLog = {
                                        "SOURCE_ID": TECHNICIAN_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "JobstatusUpdate", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                    }
                                    // dbm.saveLog(actionLog, systemLog);
                                    console.log("ACTION : ", ACTION_DETAILS);
                                    dbm.saveLog(logData2, technicianActionLog);
                                    res.status(200).send({
                                        "code": 200,
                                        "message": "Technicianschedule information updated successfully...",
                                    });
                                }
                            });
                        }
                    });
                } else {
                    mm.executeDML(`UPDATE job_card SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${JOB_DATA[0].ID} AND TECHNICIAN_ID=${JOB_DATA[0].TECHNICIAN_ID} AND SERVICE_ID=${JOB_DATA[0].SERVICE_ID} AND ORDER_ID=${JOB_DATA[0].ORDER_ID}`, recordData, supportKey, connection, (error, results) => {
                        if (error) {
                            console.log("\n\n\n\n\n\n\n\n in else block");

                            mm.rollbackConnection(connection);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            return res.send({
                                code: 400,
                                message: "Failed to update job card status."
                            });
                        } else {
                            mm.commitConnection(connection);
                            const logData2 = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: JOB_DATA[0].ORDER_ID, JOB_CARD_ID: JOB_DATA[0].ID, CUSTOMER_ID: JOB_DATA[0].CUSTOMER_ID, LOG_TYPE: LOG_TYPE, ACTION_LOG_TYPE: IS_UPDATED_BY_ADMIN == 1 ? 'User' : 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: JOB_DATA[0].USER_ID, TECHNICIAN_NAME: JOB_DATA[0].TECHNICIAN_NAME, ORDER_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, CART_ID: 0, EXPECTED_DATE_TIME: JOB_DATA[0].EXPECTED_DATE_TIME, ORDER_MEDIUM: JOB_DATA[0].ORDER_MEDIUM, ORDER_STATUS: JOB_DATA[0].ORDER_STATUS, PAYMENT_MODE: JOB_DATA[0].PAYMENT_MODE, PAYMENT_STATUS: JOB_DATA[0].PAYMENT_STATUS, TOTAL_AMOUNT: JOB_DATA[0].TOTAL_AMOUNT, ORDER_NUMBER: JOB_DATA[0].ORDER_NUMBER, TASK_DESCRIPTION: JOB_DATA[0].TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN: JOB_DATA[0].ESTIMATED_TIME_IN_MIN, PRIORITY: JOB_DATA[0].PRIORITY, JOB_CARD_STATUS: ORDER_STATUS_LOG, USER_NAME: JOB_DATA[0].TECHNICIAN_NAME, DATE_TIME: systemDate, supportKey: 0 }
                            let actionLog = {
                                "SOURCE_ID": TECHNICIAN_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "JobstatusUpdate", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            // dbm.saveLog(actionLog, systemLog);
                            console.log("ACTION : ", ACTION_DETAILS);
                            dbm.saveLog(logData2, technicianActionLog);
                            res.status(200).send({
                                "code": 200,
                                "message": "Technicianschedule information updated successfully...",
                            });
                        }
                    });
                }
            }
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        return res.status(400).send({
            "code": 400,
            "message": "Failed to update technicianschedule information."
        });
    }
};

exports.sendOTPtoConfirm = (req, res) => {
    console.log("\n\n\n\n\n\n req.body.authData : ", req.body);
    const MOBILE_NUMBER = req.body.MOBILE_NUMBER;
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME ? req.body.TECHNICIAN_NAME : "";
    const USER_ID = req.body.USER_ID;
    const COUNTRY_CODE = req.body.COUNTRY_CODE;
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const ORDER_ID = req.body.ORDER_ID;
    const ORDER_NO = req.body.ORDER_NO;
    const JOB_CARD_NO = req.body.JOB_CARD_NO;
    const JOB_CARD_ID = req.body.ID;
    const SERVICE_ID = req.body.SERVICE_ID;
    const systemDate = mm.getSystemDate();
    const supportKey = req.headers['supportkey'];
    if (!MOBILE_NUMBER || !COUNTRY_CODE || !TECHNICIAN_ID || !CUSTOMER_ID || !ORDER_ID || !ORDER_NO || !JOB_CARD_NO || !SERVICE_ID) {
        return res.send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }

    try {
        const query = 'SELECT MOBILE_NO,NAME FROM customer_master WHERE MOBILE_NO=? AND ACCOUNT_STATUS=1 AND ID=?';
        mm.executeQueryData(query, [MOBILE_NUMBER, CUSTOMER_ID], supportKey, (error, results1) => {
            if (error) {
                console.error(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    code: 400,
                    message: "Failed to get customer data.",
                });
            } else {
                if (results1.length > 0) {
                    // var OTP = Math.floor(1000 + Math.random() * 9000);
                    const OTP = 1234;
                    const insertQuery = `INSERT INTO job_card_completion_otp  (MOBILE_NUMBER, TECHNICIAN_ID, CUSTOMER_ID, ORDER_ID, ORDER_NO, JOB_CARD_NO, SERVICE_ID, MOBILE_OTP, REQUESTED_DATETIME,VERIFIED_DATETIME,STATUS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?,?)`;
                    const values = [MOBILE_NUMBER, TECHNICIAN_ID, CUSTOMER_ID, ORDER_ID, ORDER_NO, JOB_CARD_NO, SERVICE_ID, OTP, systemDate, null, 'P'];

                    mm.executeQueryData(insertQuery, values, supportKey, (error, resultsOtp1) => {
                        if (error) {
                            console.error(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                code: 400,
                                message: "Failed to save OTP information...",
                            });
                        } else {
                            const crypto = require('crypto');

                            // Ensure the key is exactly 16 bytes
                            const secretKey = Buffer.alloc(16, 'SixteenCharKey!');
                            const iv = crypto.randomBytes(16); // Random Initialization Vector (IV)

                            // Function to filter and format encrypted string
                            function formatToAlphabetic(base64String) {
                                // Remove non-alphabetic characters
                                const alphabeticString = base64String.replace(/[^A-Za-z]/g, '');
                                // Ensure it's exactly 30 characters
                                return alphabeticString.slice(0, 30).padEnd(30, 'A'); // Pad with 'A' if needed
                            }

                            // Encrypt Function
                            function encrypt(text) {
                                const cipher = crypto.createCipheriv('aes-128-cbc', secretKey, iv);
                                let encrypted = cipher.update(text, 'utf8', 'base64');
                                encrypted += cipher.final('base64');
                                // Combine IV and Encrypted text
                                const combined = `${iv.toString('base64')}:${encrypted}`;
                                // Convert to alphabetic only
                                return formatToAlphabetic(combined);
                            }

                            // Example Usage
                            const encrypted = encrypt(JOB_CARD_NO);
                            console.log('\nEncrypted (Alphabetic 30):', encrypted);
                            mm.executeQueryData(`UPDATE job_card SET HAPPY_CODE= ? WHERE 1 AND JOB_CARD_NO = ?`, [encrypted, JOB_CARD_NO], supportKey, (error, resultsUpdate) => {
                                if (error) {
                                    console.error(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        code: 400,
                                        message: "Failed to update job data.",
                                    });
                                } else {
                                    console.log("\n\n\n\n\n\n req.body.authData : ", req.body);
                                    // console.log("\n\n\n\n\n\n req.body.authData : ", req.body.authData.data.UserData[0]);

                                    let ACTION_DETAILSs = `Dear ${results1[0].NAME}, please share OTP ${OTP} with our technician ${TECHNICIAN_NAME} to complete your order. For queries, contact our support team at itsupport@pockitengineers.com.`
                                    // mm.sendNotificationToCustomer(TECHNICIAN_ID, CUSTOMER_ID, `**Happy code for job completion : ${OTP}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", req.body);
                                    mm.sendNotificationToChannel(TECHNICIAN_ID, `customer_${CUSTOMER_ID}_channel`, `Happy code for job completion : ${OTP}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", req.body);
                                    sendOtpToCompleteJob(encrypted, MOBILE_NUMBER, results1[0].NAME, OTP, req, res);
                                    res.send({
                                        code: 200,
                                        message: "OTP sent successfully.",
                                    });
                                }
                            });
                        }
                    });
                } else {
                    res.send({
                        code: 400,
                        message: "Invalid mobile number.",
                    });
                }
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error(error);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};



exports.verifyOTPToConfirm = (req, res) => {
    const MOBILE_NUMBER = req.body.MOBILE_NUMBER;
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const JOB_CARD_NO = req.body.JOB_CARD_NO;
    const REMARK = req.body.REMARK;
    const OTP = req.body.OTP;
    const supportKey = req.headers['supportkey'];
    if (!MOBILE_NUMBER || !TECHNICIAN_ID || !JOB_CARD_NO || !OTP) {
        return res.status(400).send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }

    try {
        const fetchOTPQuery = `SELECT MOBILE_OTP,JOB_CARD_ID FROM job_card_completion_otp WHERE MOBILE_NUMBER = ? AND TECHNICIAN_ID =? AND JOB_CARD_NO=? ORDER BY ID DESC LIMIT 1`;
        mm.executeQueryData(fetchOTPQuery, [MOBILE_NUMBER, TECHNICIAN_ID, JOB_CARD_NO], supportKey, (error, resultsOtp) => {
            if (error) {
                console.error(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    code: 400,
                    message: "Failed to fetch OTP.",
                });
            } else {
                console.log(resultsOtp, "RESULTOTP")
                if (resultsOtp.length > 0) {
                    if (resultsOtp[0].MOBILE_OTP == OTP) {
                        mm.executeQueryData('UPDATE job_card_completion_otp SET VERIFIED_DATETIME = ?,STATUS = ? WHERE MOBILE_NUMBER = ? AND TECHNICIAN_ID =? AND JOB_CARD_NO=?', [systemDate, 1, MOBILE_NUMBER, TECHNICIAN_ID, JOB_CARD_NO], supportKey, (error, VerifysOtp) => {
                            if (error) {
                                console.error(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    code: 400,
                                    message: "Failed to fetch OTP.",
                                });
                            } else {
                                mm.executeQueryData('UPDATE job_card SET TECHNICIAN_STATUS = ?,JOB_STATUS_ID = ?,TRACK_STATUS = ?,REMARK = ? WHERE JOB_CARD_NO = ? AND TECHNICIAN_ID =?', ['CO', 3, 'EJ', REMARK, JOB_CARD_NO, TECHNICIAN_ID], supportKey, (error, VerifysOtp) => {
                                    if (error) {
                                        console.error(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            code: 400,
                                            message: "Failed to fetch OTP.",
                                        });
                                    } else {
                                        res.send({
                                            code: 200,
                                            message: "OTP verified successfully.",
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        res.send({
                            code: 400,
                            message: "Invalid OTP.",
                        });
                    }
                } else {
                    res.send({
                        code: 400,
                        message: "no OTP provided.",
                    });
                }
            }
        });
    } catch (error) {
        console.error(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


exports.confirmByLink = (req, res) => {
    const HAPPYCODE = req.body.HAPPY_CODE;

    const supportKey = req.headers['supportkey'];
    if (!HAPPYCODE) {
        return res.send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }
    try {
        const crypto = require('crypto');
        // Ensure the key is exactly 16 bytes
        const secretKey = Buffer.alloc(16, 'SixteenCharKey!');
        const iv = crypto.randomBytes(16); // Random Initialization Vector (IV)

        // Decrypt Function
        function decrypt(encryptedText) {
            const [ivHex, encryptedData] = encryptedText.split(':');
            const decipher = crypto.createDecipheriv(
                'aes-128-cbc',
                Buffer.from(secretKey, 'utf8'),
                Buffer.from(ivHex, 'hex')
            );
            let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            return decrypted;
        }

        const decrypted = decrypt(HAPPYCODE);
        console.log('Decrypted:', decrypted);

        const fetchOTPQuery = `SELECT JOB_CARD_NO FROM view_job_card WHERE JOB_CARD_NO = ? AND CUSTOMER_STATUS = 'P'  ORDER BY ID DESC LIMIT 1`;

        mm.executeQueryData(fetchOTPQuery, [decrypted], supportKey, (error, resultsOtp) => {
            if (error) {
                console.error(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    code: 400,
                    message: "Failed to fetch OTP.",
                });
            } else {
                console.log(resultsOtp, "RESULTOTP")
                if (resultsOtp.length > 0) {
                    if (resultsOtp[0].JOB_CARD_NO === decrypted) {
                        mm.executeQueryData('UPDATE job_card SET JOB_STATUS_ID = ?,TECHNICIAN_STATUS = ?,TRACK_STATUS = ?,CUSTOMER_STATUS = ? WHERE JOB_CARD_NO = ? AND CUSTOMER_STATUS = ?', [3, 'CO', 'EJ', 'V', decrypted, 'P'], supportKey, (error, resultsOtp) => {
                            if (error) {
                                console.error(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    code: 400,
                                    message: "Failed to UPDATE DATA.",
                                });
                            } else {
                                res.send({
                                    code: 200,
                                    message: "Happy code verified successfully.",
                                });
                            }
                        });
                    } else {
                        res.send({
                            code: 400,
                            message: "Invalid Happy code.",
                        });
                    }
                } else {
                    res.send({
                        code: 300,
                        message: "You are Alredy Confirmed this job.",
                    });
                }
            }
        });
    } catch (error) {
        console.error(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get organisation count.",
                    });
                } else {
                    mm.executeQuery('select * from ' + viewTechnicianMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get organisation information."
                            });
                        } else if (results.length > 0) {
                            // Fetch all calendar data for relevant ORG_IDs
                            let TECHNICIAN_ID = results.map(item => item.ID).join(',');
                            let calendarQuery = `select * from technician_service_calender where TECHNICIAN_ID IN (${TECHNICIAN_ID})`;
                            mm.executeQuery(calendarQuery, supportKey, (error, results3) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get TECHNICIAN calendar information."
                                    });
                                } else {
                                    // Map calendar data to each organisation
                                    let calendarDataMap = {};
                                    results3.forEach(item => {
                                        if (!calendarDataMap[item.TECHNICIAN_ID]) {
                                            calendarDataMap[item.TECHNICIAN_ID] = [];
                                        }
                                        calendarDataMap[item.TECHNICIAN_ID].push(item);
                                    });

                                    results.forEach(item => {
                                        item.WEEK_DAY_DATA = calendarDataMap[item.ID] || [];
                                    });

                                    res.send({
                                        "code": 200,
                                        "message": "success",
                                        "TAB_ID": 114,
                                        "count": results1[0].cnt,
                                        "data": results,
                                        "data2": results3
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

// Helper function to parse time string into { hours, minutes }
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
}

// Helper function to generate time slots between start and end times
function generateTimeSlots(start, end) {
    const slots = [];
    let current = new Date(0, 0, 0, start.hours, start.minutes);

    while (current <= new Date(0, 0, 0, end.hours, end.minutes)) {
        const hours = current.getHours().toString().padStart(2, "0");
        const minutes = current.getMinutes().toString().padStart(2, "0");
        slots.push(`${hours}:${minutes}`);
        current.setMinutes(current.getMinutes() + 10); // Increment by 10 minutes
    }

    return slots;
}


exports.getInvoice = (req, res) => {
    var supportKey = req.headers['supportkey'];
    const { JOB_CARD_ID, ORDER_ID, JOB_CARD_NO, INVOICE_FOR, ORDER_NO } = req.body;
    console.log("req.body", req.body);
    let modifiedOrderNo = ORDER_NO.replace(/\//g, "-");
    let modifiedJobrNo = JOB_CARD_NO.replace(/\//g, "-");

    try {
        if (INVOICE_FOR == 'J') {
            const query = `SELECT * from view_get_invoice WHERE JOB_CARD_ID = ${JOB_CARD_ID};`;
            mm.executeQuery(query, supportKey, (error, orderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to get order data.",
                    });
                }

                const query1 = `SELECT JOB_CARD_ID, JOB_CARD_NO, INVENTORY_ID, INVENTORY_NAME, RATE, TAX_RATE, QUANTITY, TOTAL_AMOUNT,REQUEST_MASTER_ID FROM view_inventory_request_details WHERE JOB_CARD_ID = ${JOB_CARD_ID} AND PAYMENT_STATUS = 'I' AND STATUS = "AC"`;
                mm.executeQuery(query1, supportKey, (error, inventoryDetails) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.send({
                            "code": 400,
                            "message": "Failed to get inventory details.",
                        });
                    }
                    console.log("\n\n\n\norderDetails:", orderDetails);

                    // Perform total calculations
                    const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                    const invoiceTemplate = require('fs').readFileSync('templates/invoice.html', 'utf8');
                    const populatedHtml = invoiceTemplate
                        .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                        .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                        .replace('{{JobCardNo}}', orderDetails[0]?.JOB_CARD_NO || '')
                        .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                        .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                        .replace('{{OrderRows}}', orderDetails.map(order => `
                    <tr>
                        <td>${order.SERVICE_NAME}</td>
                        <td>${order.QUANTITY}</td>
                        <td>${order.TAX_EXCLUSIVE_AMOUNT}</td>
                        <td>${order.TAX_RATE} %</td>
                        <td>${order.TAX_AMOUNT}</td>
                        <td>${order.TOTAL_AMOUNT}</td>
                    </tr>
                `).join(''))
                        .replace('{{InventorySection}}', inventoryDetails.length > 0
                            ? `<h5>Inventory Details</h5>
                       <table class="striped">
                           <thead>
                               <tr>
                                   <th>Item Name</th>
                                   <th>Quantity</th>
                                   <th>Tax</th>
                                   <th>Rate</th>
                                   <th>Total Amount</th>
                               </tr>
                           </thead>
                           <tbody>
                               ${inventoryDetails.map(item => `
                                   <tr>
                                       <td>${item.INVENTORY_NAME}</td>
                                       <td>${item.QUANTITY}</td>
                                       <td>${item.TAX_RATE}</td>
                                       <td>${item.RATE}</td>
                                       <td>${item.TOTAL_AMOUNT}</td>
                                   </tr>
                               `).join('')}
                           </tbody>
                       </table>`
                            : '')
                        .replace('{{FinalAmount}}', finalAmount);
                    // Generate and Save PDF
                    const pdf = require('html-pdf');
                    const outputFilePath = `uploads/Invoices/${modifiedJobrNo}.pdf`;
                    pdf.create(populatedHtml, {
                        childProcessOptions: {
                            env: {
                                OPENSSL_CONF: '/dev/null',
                            },
                        }
                    }).toFile(outputFilePath, (err, result) => {
                        if (err) {
                            console.log(err);
                            logger.error(supportKey + ' PDF Generation Error: ' + JSON.stringify(err), applicationkey);
                            return res.send({
                                "code": 500,
                                "message": "Failed to generate invoice PDF."
                            });
                        }
                        // Insert into Invoice Master
                        const invoiceInsertQuery = `INSERT INTO invoice_master (CUSTOMER_ID, JOB_CARD_ID, ORDER_ID, SERVICE_ID, BILLING_ADDRESS_ID, INVOICE_DATE, TOTAL_AMOUNT, TAX_RATE, TAX_AMOUNT, DISCOUNT_AMOUNT, FINAL_AMOUNT, PAYMENT_STATUS, INVOICE_URL, CLIENT_ID, TYPE) VALUES (${orderDetails[0].CUSTOMER_ID},${JOB_CARD_ID}, ${ORDER_ID}, ${orderDetails[0].SERVICE_ITEM_ID}, ${orderDetails[0].BILLING_ADDRESS_ID}, NOW(),${finalAmount},NULL, 0,0,${finalAmount}, 'S', '${outputFilePath.split('/').pop()}',1, "J")`;
                        mm.executeQuery(invoiceInsertQuery, supportKey, (error) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.send({
                                    "code": 500,
                                    "message": "Failed to insert invoice record."
                                });
                            }
                            if (inventoryDetails.length > 0) {
                                mm.executeQueryData(`UPDATE inventory_request_master SET PAYMENT_STATUS = 'P' WHERE 1  AND ID = ? AND JOB_CARD_ID = ?`, [inventoryDetails[0].REQUEST_MASTER_ID, JOB_CARD_ID], supportKey, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        return res.send({
                                            code: 400,
                                            message: "Failed to update job card status."
                                        });
                                    } else {
                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID,`customer_${orderDetails[0].CUSTOMER_ID}_channel` , `**Inventory  Payment request for job ${JOB_CARD_NO}**`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToAdmin(8, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", "N", supportKey, "I", req.body);
                                        return res.send({
                                            "code": 200,
                                            "message": "Invoice generated successfully.",
                                            "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                        });
                                    }
                                });
                            } else {
                                return res.send({
                                    "code": 200,
                                    "message": "Invoice generated successfully.",
                                    "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                });
                            }
                        });
                    });
                });
            })
        } else if (INVOICE_FOR === 'P') {
            const query = `SELECT vd.ORDER_ID,vd.SERVICE_NAME,vd.TAX_RATE,vd.SERVICE_ITEM_ID, vm.ORDER_NUMBER,vd.JOB_CARD_NO, vd.QUANTITY, vd.RATE, vd.TOTAL_AMOUNT,vm.CUSTOMER_ID, vm.CUSTOMER_NAME, vm.BILLING_ADDRESS_ID,vm.BILLING_ADDRESS_LINE_1 FROM view_order_details vd JOIN view_order_master vm ON vd.ORDER_ID = vm.ID WHERE vd.JOB_CARD_ID = ${JOB_CARD_ID} AND vd.ORDER_ID = ${ORDER_ID} AND vm.ID = ${ORDER_ID};`;
            mm.executeQuery(query, supportKey, (error, orderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to get order data.",
                    });
                }

                const query1 = `SELECT JOB_CARD_ID, JOB_CARD_NO, INVENTORY_ID, INVENTORY_NAME, RATE, TAX_RATE, QUANTITY, TOTAL_AMOUNT,REQUEST_MASTER_ID FROM view_inventory_request_details WHERE JOB_CARD_ID = ${JOB_CARD_ID} AND STATUS = 'P'`;
                mm.executeQuery(query1, supportKey, (error, inventoryDetails) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.send({
                            "code": 400,
                            "message": "Failed to get inventory details.",
                        });
                    }

                    // Perform total calculations
                    const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                    const invoiceTemplate = require('fs').readFileSync('templates/invoice.html', 'utf8');
                    const populatedHtml = invoiceTemplate
                        .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                        .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                        .replace('{{JobCardNo}}', orderDetails[0]?.JOB_CARD_NO || '')
                        .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                        .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                        .replace('{{OrderRows}}', orderDetails.map(order => `
                        <tr>
                            <td>${order.SERVICE_NAME}</td>
                            <td>${order.QUANTITY}</td>
                            <td>${order.TAX_EXCLUSIVE_AMOUNT}</td>
                            <td>${order.TAX_RATE} %</td>
                            <td>${order.TAX_AMOUNT}</td>
                            <td>${order.TOTAL_AMOUNT}</td>
                        </tr>
                    `).join(''))
                        .replace('{{InventorySection}}', inventoryDetails.length > 0
                            ? `<h5>Inventory Details</h5>
                           <table class="striped">
                               <thead>
                                   <tr>
                                       <th>Item Name</th>
                                       <th>Quantity</th>
                                       <th>Tax</th>
                                       <th>Rate</th>
                                       <th>Total Amount</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${inventoryDetails.map(item => `
                                       <tr>
                                           <td>${item.INVENTORY_NAME}</td>
                                           <td>${item.QUANTITY}</td>
                                           <td>${item.TAX_RATE}</td>
                                           <td>${item.RATE}</td>
                                           <td>${item.TOTAL_AMOUNT}</td>
                                       </tr>
                                   `).join('')}
                               </tbody>
                           </table>`
                            : '')
                        .replace('{{FinalAmount}}', finalAmount);
                    // Generate and Save PDF
                    const pdf = require('html-pdf');
                    const outputFilePath = `uploads/Invoices/Invoice-${JOB_CARD_ID}-${ORDER_ID}.pdf`;
                    pdf.create(populatedHtml, {
                        childProcessOptions: {
                            env: {
                                OPENSSL_CONF: '/dev/null',
                            },
                        }
                    }).toFile(outputFilePath, (err, result) => {
                        if (err) {
                            console.log(err);
                            logger.error(supportKey + ' PDF Generation Error: ' + JSON.stringify(err), applicationkey);
                            return res.send({
                                "code": 500,
                                "message": "Failed to generate invoice PDF."
                            });
                        }
                        // Insert into Invoice Master
                        const invoiceInsertQuery = `INSERT INTO invoice_master (CUSTOMER_ID, JOB_CARD_ID, ORDER_ID, SERVICE_ID, BILLING_ADDRESS_ID, INVOICE_DATE, TOTAL_AMOUNT, TAX_RATE, TAX_AMOUNT, DISCOUNT_AMOUNT, FINAL_AMOUNT, PAYMENT_STATUS, INVOICE_URL, CLIENT_ID, TYPE) VALUES (${orderDetails[0].CUSTOMER_ID},${JOB_CARD_ID}, ${ORDER_ID}, ${orderDetails[0].SERVICE_ITEM_ID}, ${orderDetails[0].BILLING_ADDRESS_ID}, NOW(),${finalAmount},NULL, 0,0,${finalAmount}, 'S', '${outputFilePath.split('/').pop()}',1, "J")`;
                        mm.executeQuery(invoiceInsertQuery, supportKey, (error) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.send({
                                    "code": 500,
                                    "message": "Failed to insert invoice record."
                                });
                            }
                            if (inventoryDetails.length > 1) {
                                mm.executeQueryData(`UPDATE inventory_request_master SET PAYMENT_STATUS = 'P' WHERE 1  AND ID = ? AND JOB_CARD_ID = ?`, [inventoryDetails[0].REQUEST_MASTER_ID, JOB_CARD_ID], supportKey, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        return res.send({
                                            code: 400,
                                            message: "Failed to update job card status."
                                        });
                                    } else {
                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, orderDetails[0].CUSTOMER_ID, `**Inventory  Payment request for job ${JOB_CARD_NO}**`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToAdmin(8, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        return res.send({
                                            "code": 200,
                                            "message": "Invoice generated successfully.",
                                            "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                        });
                                    }
                                });
                            } else {
                                return res.send({
                                    "code": 200,
                                    "message": "Invoice generated successfully.",
                                    "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                });
                            }
                        });
                    });
                });
            })
        } else if (INVOICE_FOR === 'O') {
            const query = `SELECT * from view_get_invoice WHERE ORDER_ID = ${ORDER_ID};`;
            mm.executeQuery(query, supportKey, (error, orderDetails) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to get order data.",
                    });
                }

                const query1 = `SELECT JOB_CARD_ID, JOB_CARD_NO, INVENTORY_ID, INVENTORY_NAME, RATE, TAX_RATE, QUANTITY, TOTAL_AMOUNT,REQUEST_MASTER_ID FROM view_inventory_request_details WHERE ORDER_ID = ${ORDER_ID} AND STATUS = 'AC'`;
                mm.executeQuery(query1, supportKey, (error, inventoryDetails) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.send({
                            "code": 400,
                            "message": "Failed to get inventory details.",
                        });
                    }

                    // Perform total calculations
                    const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                    const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                    const invoiceTemplate = require('fs').readFileSync('templates/order.html', 'utf8');
                    const populatedHtml = invoiceTemplate
                        .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                        .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                        .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                        .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                        .replace('{{OrderRows}}', orderDetails.map(order => `
                        <tr>
                            <td>${order.SERVICE_NAME}</td>
                            <td>${order.QUANTITY}</td>
                            <td>${order.TAX_EXCLUSIVE_AMOUNT}</td>
                            <td>${order.TAX_RATE}</td>
                            <td>${order.TAX_AMOUNT}</td>
                            <td>${order.TOTAL_AMOUNT}</td>
                        </tr>
                    `).join(''))
                        .replace('{{InventorySection}}', inventoryDetails.length > 0
                            ? `<h5>Part Details</h5>
                           <table class="striped">
                               <thead>
                                   <tr>
                                       <th>Item Name</th>
                                       <th>Job Number</th>
                                       <th>Quantity</th>
                                       <th>Tax</th>
                                       <th>Rate</th>
                                       <th>Total Amount</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   ${inventoryDetails.map(item => `
                                       <tr>
                                           <td>${item.INVENTORY_NAME}</td>
                                           <td>${item.JOB_CARD_NO}</td>
                                           <td>${item.QUANTITY}</td>
                                           <td>${item.TAX_RATE}</td>
                                           <td>${item.RATE}</td>
                                           <td>${item.TOTAL_AMOUNT}</td>
                                       </tr>
                                   `).join('')}
                               </tbody>
                           </table>`
                            : '')
                        .replace('{{FinalAmount}}', finalAmount);
                    // Generate and Save PDF
                    const pdf = require('html-pdf');
                    const outputFilePath = `uploads/Invoices/${modifiedOrderNo}.pdf`;
                    pdf.create(populatedHtml, {
                        childProcessOptions: {
                            env: {
                                OPENSSL_CONF: '/dev/null',
                            },
                        }
                    }).toFile(outputFilePath, (err, result) => {
                        if (err) {
                            console.log(err);
                            logger.error(supportKey + ' PDF Generation Error: ' + JSON.stringify(err), applicationkey);
                            return res.send({
                                "code": 500,
                                "message": "Failed to generate invoice PDF."
                            });
                        }
                        // Insert into Invoice Master
                        const invoiceInsertQuery = `INSERT INTO invoice_master (CUSTOMER_ID, JOB_CARD_ID, ORDER_ID, SERVICE_ID, BILLING_ADDRESS_ID, INVOICE_DATE, TOTAL_AMOUNT, TAX_RATE, TAX_AMOUNT, DISCOUNT_AMOUNT, FINAL_AMOUNT, PAYMENT_STATUS, INVOICE_URL, CLIENT_ID, TYPE) VALUES (${orderDetails[0].CUSTOMER_ID},${JOB_CARD_ID}, ${ORDER_ID}, ${orderDetails[0].SERVICE_ITEM_ID}, ${orderDetails[0].BILLING_ADDRESS_ID}, NOW(),${finalAmount},NULL, 0,0,${finalAmount}, 'S', '${outputFilePath.split('/').pop()}',1, "J")`;
                        mm.executeQuery(invoiceInsertQuery, supportKey, (error) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.send({
                                    "code": 500,
                                    "message": "Failed to insert invoice record."
                                });
                            }
                            if (inventoryDetails.length > 1) {
                                mm.executeQueryData(`UPDATE inventory_request_master SET PAYMENT_STATUS = 'P' WHERE 1  AND ID = ? AND JOB_CARD_ID = ?`, [inventoryDetails[0].REQUEST_MASTER_ID, JOB_CARD_ID], supportKey, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        return res.send({
                                            code: 400,
                                            message: "Failed to update job card status."
                                        });
                                    } else {
                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, orderDetails[0].CUSTOMER_ID, `**Inventory  Payment request for job ${JOB_CARD_NO}**`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", req.body);
                                        mm.sendNotificationToAdmin(8, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", "N", supportKey, "J", req.body);
                                        return res.send({
                                            "code": 200,
                                            "message": "Invoice generated successfully.",
                                            "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                        });
                                    }
                                });
                            } else {
                                return res.send({
                                    "code": 200,
                                    "message": "Invoice generated successfully.",
                                    "invoiceUrl": process.env.FILE_URL + `/Invoices/${outputFilePath.split('/').pop()}`,
                                });
                            }
                        });
                    });
                });
            })
        } else {
            return res.send({
                "code": 400,
                "message": "Faild to generate invoice",
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


function sendWelcomeEmail(emailId, name, mobileNumber) {
    const to = emailId;
    const subject = `Welcome to PockIT – We’re Excited to Have You!`;
    const body = `
        <p>Hi ${name},</p>
        <p>Welcome to <strong>PockIT</strong>. Your account has been created successfully, and we’re thrilled to have you on board!</p>
        <p>If you have any questions or need assistance, feel free to reach out to us at any time. We look forward to working with you!</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The PockIT Team</strong></p>`;
    const TEMPLATE_NAME = 'TECHNICIAN_WELCOME_EMAIL';
    const ATTACHMENTS = '';

    mm.sendEmail(to, subject, body, TEMPLATE_NAME, ATTACHMENTS, (error, results) => {
        if (error) {
            console.error('Failed to send welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', results);
        }
    });
}

function generateInvoice(JOB_CARD_ID, ORDER_ID, JOB_CARD_NO, INVOICE_FOR, ORDER_NO, BODY) {
    if (INVOICE_FOR === 'O') {
        let modifiedOrderNo = ORDER_NO.replace(/\//g, "-");
        let supportKey = "99999999999"
        const query = `SELECT * from view_get_invoice WHERE ORDER_ID = ${ORDER_ID};`;
        mm.executeQuery(query, supportKey, (error, orderDetails) => {
            if (error) {
                console.log(error);
                // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            }
            const query1 = `SELECT JOB_CARD_ID, JOB_CARD_NO, INVENTORY_ID, INVENTORY_NAME, RATE, TAX_RATE, QUANTITY, TOTAL_AMOUNT,REQUEST_MASTER_ID FROM view_inventory_request_details WHERE ORDER_ID = ${ORDER_ID} AND STATUS = 'AC'`;
            mm.executeQuery(query1, supportKey, (error, inventoryDetails) => {
                if (error) {
                    console.log(error);
                    // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                }
                // Perform total calculations
                const totalAmount = parseFloat(orderDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                const totalAmount1 = parseFloat(inventoryDetails.reduce((sum, item) => sum + parseFloat(item.TOTAL_AMOUNT), 0)).toFixed(2);
                const finalAmount = (parseFloat(totalAmount) + parseFloat(totalAmount1)).toFixed(2);
                const invoiceTemplate = require('fs').readFileSync('templates/order.html', 'utf8');
                const populatedHtml = invoiceTemplate
                    .replace('{{CustomerName}}', orderDetails[0]?.CUSTOMER_NAME || '')
                    .replace('{{BillingAddress}}', orderDetails[0]?.BILLING_ADDRESS_LINE_1 || '')
                    .replace('{{OrderNumber}}', orderDetails[0]?.ORDER_NUMBER || '')
                    .replace('{{InvoiceDate}}', new Date().toLocaleDateString('en-GB'))
                    .replace('{{OrderRows}}', orderDetails.map(order => `
                    <tr>
                        <td>${order.SERVICE_NAME}</td>
                        <td>${order.QUANTITY}</td>
                        <td>${order.TAX_EXCLUSIVE_AMOUNT}</td>
                        <td>${order.TAX_RATE}</td>
                        <td>${order.TAX_AMOUNT}</td>
                        <td>${order.TOTAL_AMOUNT}</td>
                    </tr>
                `).join(''))
                    .replace('{{InventorySection}}', inventoryDetails.length > 0
                        ? `<h5>Part Details</h5>
                       <table class="striped">
                           <thead>
                               <tr>
                                   <th>Item Name</th>
                                   <th>Job Number</th>
                                   <th>Quantity</th>
                                   <th>Tax</th>
                                   <th>Rate</th>
                                   <th>Total Amount</th>
                               </tr>
                           </thead>
                           <tbody>
                               ${inventoryDetails.map(item => `
                                   <tr>
                                       <td>${item.INVENTORY_NAME}</td>
                                       <td>${item.JOB_CARD_NO}</td>
                                       <td>${item.QUANTITY}</td>
                                       <td>${item.TAX_RATE}</td>
                                       <td>${item.RATE}</td>
                                       <td>${item.TOTAL_AMOUNT}</td>
                                   </tr>
                               `).join('')}
                           </tbody>
                       </table>`
                        : '')
                    .replace('{{FinalAmount}}', finalAmount);
                // Generate and Save PDF
                const pdf = require('html-pdf');
                const outputFilePath = `uploads/Invoices/${modifiedOrderNo}.pdf`;
                pdf.create(populatedHtml, {
                    childProcessOptions: {
                        env: {
                            OPENSSL_CONF: '/dev/null',
                        },
                    }
                }).toFile(outputFilePath, (err, result) => {
                    if (err) {
                        console.log(err);
                        // logger.error(supportKey + ' PDF Generation Error: ' + JSON.stringify(err), applicationkey);
                    }
                    // Insert into Invoice Master
                    const invoiceInsertQuery = `INSERT INTO invoice_master (CUSTOMER_ID, JOB_CARD_ID, ORDER_ID, SERVICE_ID, BILLING_ADDRESS_ID, INVOICE_DATE, TOTAL_AMOUNT, TAX_RATE, TAX_AMOUNT, DISCOUNT_AMOUNT, FINAL_AMOUNT, PAYMENT_STATUS, INVOICE_URL, CLIENT_ID, TYPE) VALUES (${orderDetails[0].CUSTOMER_ID},0, ${orderDetails[0].ORDER_ID}, ${orderDetails[0].SERVICE_ITEM_ID}, ${orderDetails[0].BILLING_ADDRESS_ID}, NOW(),${finalAmount},NULL, 0,0,${finalAmount}, 'S', '${outputFilePath.split('/').pop()}',1, "O")`;
                    mm.executeQuery(invoiceInsertQuery, supportKey, (error) => {
                        if (error) {
                            console.log(error);
                            // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        } else {
                            console.log("INVOICE GENERATED");
                            // mm.sendNotificationToCustomer(0, orderDetails[0].CUSTOMER_ID, `**Inventory  Payment request for job ${JOB_CARD_NO}**`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", BODY);
                            mm.sendNotificationToChannel(0, `customer_${orderDetails[0].CUSTOMER_ID}_channel`, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "N", "J", BODY);
                            mm.sendNotificationToAdmin(8, `Inventory Payment request for job ${JOB_CARD_NO}`, `The technician has generated inventory inovice for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", "N", supportKey, "J", BODY);
                        }
                    })
                })
            })
        })
    } else {
        console.log("no data found");
    }
}

function sendOtpToCompleteJob(encrypted, MOBILE_NUMBER, NAME, OTP, req, res) {
    const supportKey = "0980989890889";
    var otpText1 = `Dear ${NAME}, please share OTP ${OTP} with our technician to complete your order. For queries, contact Pockit Team.Team UVtechSoft.`
    mm.sendSMS(MOBILE_NUMBER, otpText1, (error, resultswsms) => {
        if (error) {
            console.log(error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        }
        else {
            var otpText2 = `Dear User, mark your order as completed via https://pockitadmin.uvtechsoft.com/job-completed?key=${encrypted}. Thank you. Team UvtechSoft.`
            mm.sendCustomSMS(MOBILE_NUMBER, otpText2, (error, resultswsms) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                }
                else {
                    console.log(resultswsms);
                }
            });
        }
    });
}


function sendOtpTologin(encrypted, MOBILE_NUMBER, NAME, OTP, req, res) {
    const supportKey = "0980989890889";
    var otpText1 = `Dear ${NAME}, please share OTP ${OTP} with our technician to complete your order. For queries, contact Pockit Team.Team UVtechSoft.`
    mm.sendSMS(MOBILE_NUMBER, otpText1, (error, resultswsms) => {
        if (error) {
            console.log(error);
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        }
        else {
            console.log(resultswsms);
        }
    });
}



exports.verifyOTP = (req, res) => {

    var TYPE_VALUE = req.body.TYPE_VALUE
    var OTP = req.body.OTP
    var TYPE = req.body.TYPE
    var CLOUD_ID = req.body.CLOUD_ID
    var { DEVICE_TYPE, DEVICE_ID, DEVICE_NAME, DEVICE_IP, SESSION_KEY } = req.body
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection();
        mm.executeDML('select OTP,ID from registration_otp_details where TYPE = ? AND TYPE_VALUE = ? order by ID desc limit 1', [TYPE, TYPE_VALUE], supportKey, connection, (error, results2) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                mm.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to get memberMaster count.",
                });
            }
            else {
                if (results2.length > 0) {
                    if (results2[0].OTP == OTP) {
                        mm.executeDML(`SELECT * FROM technician_master  WHERE  (MOBILE_NUMBER = ? OR EMAIL_ID=?) and IS_ACTIVE = 1`, [TYPE_VALUE, TYPE_VALUE], supportKey, connection, (error, results1) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to login...",
                                });
                            }
                            else {
                                if (results1[0].DEVICE_ID != null && results1[0].DEVICE_ID != DEVICE_ID) {
                                    mm.rollbackConnection(connection)
                                    res.send({
                                        "code": 301,
                                        "message": "You are already logged in on another device.",
                                    });
                                }
                                else {
                                    if (results1.length > 0) {
                                        mm.executeDML(`UPDATE technician_master SET CLOUD_ID=?,DEVICE_ID=? WHERE ID = ?`, [CLOUD_ID, DEVICE_ID, results1[0].ID], supportKey, connection, async (error, resultRole) => {
                                            if (error) {
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to login..."
                                                });

                                            } else {
                                                mm.executeDML('UPDATE registration_otp_details SET IS_VERIFIED=?,VERIFICATION_DATETIME=? WHERE ID = ?', ["1", systemDate, results2[0].ID], supportKey, connection, async (error, resultRole) => {
                                                    if (error) {
                                                        console.log(error);
                                                        mm.rollbackConnection(connection)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to login..."
                                                        });

                                                    } else {
                                                        const subscribedChannels = await channelSubscribedUsers.find({
                                                            USER_ID: results1[0].ID,
                                                            TYPE: "T",
                                                            STATUS: true
                                                        });
                                                        var userDetails = [{
                                                            USER_ID: results1[0].ID,
                                                            USER_NAME: results1[0].NAME,
                                                            MOBILE_NUMBER: results1[0].MOBILE_NUMBER,
                                                            CLIENT_ID: results1[0].CLIENT_ID,
                                                            FIRST_NAME: results1[0].FIRST_NAME,
                                                            FATHER_NAME: results1[0].FATHER_NAME,
                                                            SURNAME: results1[0].SURNAME,
                                                            EMAIL_ID: results1[0].EMAIL_ID,
                                                            SUBSCRIBED_CHANNELS: subscribedChannels
                                                        }]
                                                        var sessionData = {
                                                            DEVICE_TYPE: DEVICE_TYPE, DEVICE_ID: DEVICE_ID, DEVICE_NAME: DEVICE_NAME, DEVICE_IP: DEVICE_IP, SESSION_KEY: SESSION_KEY
                                                        }
                                                        updateLoginInfo(req, res, connection, supportKey, results1[0].ID, userDetails, sessionData)
                                                        // mm.executeQueryData(`INSERT INTO USER_SESSION_DETAILS (USER_ID,DEVICE_TYPE,DEVICE_ID,DEVICE_NAME,DEVICE_IP,LOGIN_DATE_TIME,STATUS,SESSION_KEY,CLIENT_ID) VALUES (?,?,?,?,?,?,?,?,?)`, [results1[0].ID,DEVICE_TYPE,DEVICE_ID,DEVICE_NAME,DEVICE_IP,mm.getSystemDate(),1,SESSION_KEY,results1[0].CLIENT_ID], supportKey, (error, resultRole) => {
                                                        //     if (error) {
                                                        //         console.log(error);
                                                        //         res.send({
                                                        //             "code": 400,
                                                        //             "message": "Failed to login..."
                                                        //         });

                                                        //     } else {


                                                        //         generateToken(results1[0].ID, res, userDetails, "1");
                                                        //     }
                                                        // })
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        res.send({
                                            "code": 400,
                                            "message": "Invalid mobile number."
                                        });
                                    }
                                }
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "Invalid OTP",
                        });
                    }
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "OTP not found",
                    });
                }

            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }

}

function updateLoginInfo(req, res, connection, supportKey, userId, userData, sessionData) {
    try {
        var systemDate = mm.getSystemDate();
        if (userId) {
            mm.executeDML(`update user_session_details set LOGOUT_DATE_TIME='${systemDate}',STATUS='E' where USER_ID=? AND STATUS='O'`, userId, supportKey, connection, (error, resultsUpdateSessions) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Failed to update user session details ",
                    });
                } else {
                    createUserSession(req, userId, sessionData, supportKey, connection, async (err, sessionKey) => {
                        if (err) {
                            console.log(err);
                            mm.rollbackConnection(connection);
                            res.send({
                                code: 400,
                                message: "Failed to create userSession ",
                            });
                        } else {
                            userData[0].sessionKey = sessionKey
                            mm.commitConnection(connection)
                            generateToken(userId, res, userData, "1");
                        }
                    }
                    );
                }
            }
            );
        } else {
            mm.commitConnection(connection);
            res.send({
                code: 400,
                message: "parameter missing - data  ",
            });
        }
    } catch (error) {
        console.log(error);
    }
}
const path = require('path')
function createUserSession(req, userId, sessionData, supportKey, connection, callback) {
    try {
        var systemDate = mm.getSystemDate();
        getSessionKey(req, supportKey, (error, sessionKey) => {
            if (error) {
                callback(error);
            } else {
                mm.executeDML(`insert into user_session_details(USER_ID,DEVICE_TYPE,DEVICE_ID,DEVICE_NAME,DEVICE_IP,LOGIN_DATE_TIME,STATUS,SESSION_KEY,CLIENT_ID) values(?,?,?,?,?,?,?,?,?) `, [userId, sessionData.DEVICE_TYPE, sessionData.DEVICE_ID, sessionData.DEVICE_NAME, sessionData.DEVICE_IP, systemDate, "O", sessionKey, 1,], supportKey, connection, (error, resultsSessionCreate) => {
                    if (error) {
                        callback(error);
                    } else {
                        var pathName = path.join(__dirname, '../../userdata/sessionData.txt');
                        var data = require("fs").readFileSync(pathName, { encoding: "utf8" });
                        var data1 = "";
                        data1 = data.length > 0 ? JSON.parse(data) : [];
                        if (data1.length > 0) {
                            var index = -1;
                            if (
                                sessionData.DEVICE_TYPE == "D" ||
                                sessionData.DEVICE_TYPE == "M"
                            ) {
                                index = data1.findIndex(
                                    (c) =>
                                        c.USER_ID === userId &&
                                        (c.DEVICE_TYPE === "D" || c.DEVICE_TYPE === "M")
                                );
                            } else {
                                index = data1.findIndex(
                                    (c) => c.USER_ID === userId && c.DEVICE_TYPE === "W"
                                );
                            }
                            if (index >= 0) {
                                data1.splice(index, 1);
                            }
                        }

                        data1.push({
                            USER_ID: userId,
                            SESSION_KEY: sessionKey,
                            DEVICE_TYPE: sessionData.DEVICE_TYPE,
                        });

                        require("fs").writeFileSync(
                            pathName,
                            JSON.stringify(data1)
                        );

                        callback(null, sessionKey);
                    }
                }
                );
            }
        });
    } catch (error) {
        callback(error);
    }
}

function getSessionKey(req, supportKey, callback) {
    var sessionKey = mm.generateKey(32);

    mm.executeQuery(
        `select ID from user_session_details where SESSION_KEY='${sessionKey}'`,
        supportKey,
        (error, results1) => {
            if (error) {
                callback(error);
            } else {
                if (results1.length > 0) {
                    getSessionKey(req, supportKey);
                } else {
                    callback(null, sessionKey);
                }
            }
        }
    );
}

exports.logout = (req, res) => {
    var SESSION_KEY = req.body.SESSION_KEY;
    var USER_ID = req.body.USER_ID;
    var supportKey = req.headers["supportkey"]; //Supportkey ;
    var systemDate = mm.getSystemDate();
    try {
        if (SESSION_KEY && SESSION_KEY != " ") {
            mm.executeQueryData(`UPDATE user_session_details set STATUS='L',LOGOUT_DATE_TIME=? where SESSION_KEY=? `, [systemDate, SESSION_KEY], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        code: 400,
                        message: "Failed to logut from system ",
                    });
                } else {
                    mm.executeQueryData(`UPDATE technician_master SET DEVICE_ID=null where ID=?`, [USER_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            res.send({
                                code: 400,
                                message: "Failed to logut from system ",
                            });
                        } else {
                            var data = require("fs").readFileSync(
                                "./userdata/sessionData.txt",
                                { encoding: "utf8" }
                            );
                            var data1 = JSON.parse(data);

                            if (data.length > 0) {
                                const index = data1.findIndex(
                                    (c) => c.SESSION_KEY === SESSION_KEY
                                );

                                if (index > 0) {
                                    data1.splice(index, 1);
                                }
                            }

                            require("fs").writeFileSync(
                                "./userdata/sessionData.txt",
                                JSON.stringify(data1),
                                "utf8"
                            );
                            res.send({
                                code: 200,
                                message: "Successfully logout from system ...",
                            });
                        }
                    }
                    );
                }
            }
            );
        } else {
            res.send({
                code: 400,
                message: "parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);

        res.send({
            code: 400,
            message: "Failed to logut from system.",
        });
    }
};



exports.updateTechnicianProfile = (req, res) => {
    const errors = validationResult(req);
    var EMAIL_ID = req.body.EMAIL_ID;
    var PROFILE_PHOTO = req.body.PROFILE_PHOTO;
    var NAME = req.body.NAME;
    var MOBILE_NUMBER = req.body.MOBILE_NUMBER;
    var GENDER = req.body.GENDER;
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID
    };
    var systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        return res.send({ "code": 422, "message": errors.errors });
    }
    try {
        // var OTP = Math.floor(100000 + Math.random() * 900000);
        var OTP = 1234
        const connection = mm.openConnection();
        mm.executeDML(`SELECT EMAIL_ID, MOBILE_NUMBER FROM ${technicianMaster} WHERE  (EMAIL_ID = ? OR MOBILE_NUMBER = ?) AND ID != ?;SELECT EMAIL_ID, MOBILE_NUMBER FROM ${technicianMaster} WHERE  ID=?;`, [EMAIL_ID, MOBILE_NUMBER, criteria.ID, criteria.ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "message": "Failed to validate technician email or mobile number."
                });
            }
            if (results.length > 0) {
                if (results[0].EMAIL_ID === EMAIL_ID) {
                    return res.status(400).json({
                        "message": "Email ID already exists."
                    });
                }
                if (results[0].MOBILE_NUMBER === MOBILE_NUMBER) {
                    return res.status(400).json({
                        "message": "Mobile Number already exists."
                    });
                }
                if (results[0].MOBILE_NUMBER === MOBILE_NUMBER && results[0].EMAIL_ID === EMAIL_ID) {
                    return res.status(400).json({
                        "message": "Email ID and Mobile Number are already exists."
                    });
                }
            }
            const oldMobile = results.length > 0 ? results[1][0].MOBILE_NUMBER : null;
            if (oldMobile !== MOBILE_NUMBER) {
                sendOtp("M", MOBILE_NUMBER, "OTP verify", body, OTP, NAME, supportKey, (error, OTP) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        return res.status(400).json({
                            "message": "Failed to send OTP."
                        });
                    } else {
                        mm.executeDML(`UPDATE technician_master SET VERIFICATION_OTP = ?,EMAIL_ID = ?,NAME=?,PROFILE_PHOTO=?,GENDER=?,CREATED_MODIFIED_DATE= '${systemDate}' WHERE ID = ?`, [OTP, EMAIL_ID, NAME, PROFILE_PHOTO, GENDER, criteria.ID], supportKey, connection, (error, results) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                return res.status(400).json({
                                    "message": "Failed to update OTP."
                                });
                            } else {

                                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician ${NAME}`;
                                let actionLog = {
                                    "SOURCE_ID": criteria.ID,
                                    "LOG_DATE_TIME": systemDate,
                                    "LOG_TEXT": ACTION_DETAILS,
                                    "CATEGORY": "technician",
                                    "CLIENT_ID": 1,
                                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                    "supportKey": 0
                                };
                                dbm.saveLog(actionLog, systemLog);
                                mm.commitConnection(connection);
                                res.status(201).json({
                                    "message": "Technician information updated successfully...",
                                    "is_new_mobile": 1
                                });
                            }
                        })
                    }
                });
            } else {
                mm.executeDML(`UPDATE ${technicianMaster} SET NAME=? ,EMAIL_ID=?,PROFILE_PHOTO=?,GENDER=?,CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ?`, [NAME, EMAIL_ID, PROFILE_PHOTO, GENDER, criteria.ID], supportKey, connection, (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        return res.status(400).json({
                            "message": "Failed to update technician information."
                        });
                    } else {
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the technician ${NAME}`;
                        let actionLog = {
                            "SOURCE_ID": criteria.ID,
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS,
                            "CATEGORY": "technician",
                            "CLIENT_ID": 1,
                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                            "supportKey": 0
                        };
                        dbm.saveLog(actionLog, systemLog);
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "message": "Technician information updated successfully..."
                        });
                    }
                }
                );
            }
        }
        );
    } catch (error) {
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var subject = "Technician Otp Support"
    var otpText1
    if (TYPE == "M") {
        callback(null, OTP);
        otpText1 = `Your Profile Update Request OTP is ${OTP}. This code is valid for the next [5 minutes]. Please do not share it with anyone.`
    } else {
        callback(null, OTP);
        otpText1 = `<p style="text-align: justify;"><strong>Dear Technician,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Pockit</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><em>Suggestion/feedback if any can be provided through our official website https://pockitapp.pockitengineers.com/</em></p>`;
    }

}



exports.verifyProfileOTP = (req, res) => {
    try {
        var OTP = req.body.OTP;
        var MOBILE_NUMBER = req.body.MOBILE_NUMBER;
        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();
        const TECHNICIAN_ID = req.body.TECHNICIAN_ID

        if (OTP != " " && MOBILE_NUMBER != " ") {
            var connection = mm.openConnection();
            mm.executeDML(`select ID,VERIFICATION_OTP from technician_master where ID = ?`, [TECHNICIAN_ID], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        code: 400,
                        message: "Failed to get opt details ",
                    });
                } else {
                    console.log("OTP results ", results);
                    if (results.length > 0) {
                        console.log("ACTUAL OTP ", results[0].VERIFICATION_OTP);
                        console.log("INCOMMING OTP ", OTP);
                        if (results[0].VERIFICATION_OTP == OTP) {
                            console.log("OTP verified ..... ");
                            mm.executeDML(`UPDATE technician_master SET MOBILE_NUMBER=? ,IS_VERIFIED=1  WHERE ID = ?  `, [MOBILE_NUMBER, TECHNICIAN_ID], supportKey, connection, (error, resultCustomer) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection);
                                    res.status(400).send({
                                        code: 400,
                                        message: "Failed to update mobile number ",
                                    });
                                } else {
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "message": "OTP verified successfully..."
                                    });
                                }
                            });
                        } else {
                            console.log("OTP not verified ..... ");
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                message: "invalid OTP ",
                            });
                        }
                    } else {
                        mm.rollbackConnection(connection);
                        res.status(400).json({

                            message: "invalid OTP request ",
                        });
                    }
                }
            });
        } else {
            res.status(400).json({
                message: "mobileno or OTP parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};



exports.sendOTP = (req, res) => {

    var TYPE_VALUE = req.body.TYPE_VALUE
    var TYPE = req.body.TYPE;
    var DEVICE_ID = req.body.DEVICE_ID
    var systemDate = mm.getSystemDate()
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQueryData('SELECT MOBILE_NUMBER,DEVICE_ID FROM technician_master WHERE (MOBILE_NUMBER = ? or EMAIL_ID = ?) AND IS_ACTIVE=1 ', [TYPE_VALUE, TYPE_VALUE], supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get technician data.",
                });
            }
            else {
                if (results1.length > 0) {
                    if (results1[0].DEVICE_ID != DEVICE_ID && results1[0].DEVICE_ID != null) {
                        res.send({
                            "code": 301,
                            "message": "You are already logged in on another device.",
                        });
                    } else {
                        // var OTP = Math.floor(1000 + Math.random() * 9000);
                        var OTP = "1234";
                        if (TYPE == 'M') {
                            var QUERY = 'INSERT INTO  registration_attempt_details (MOBILE_NO,IS_MOBILE_VERIFIED,IS_REGISTERED,TYPE,MOBILE_OTP,REGISTRATION_FOR) VALUES (?,?,?,?,?,?)'
                            var data = [TYPE_VALUE, 0, 1, TYPE, OTP, 'Technician']
                        }
                        else {
                            var QUERY = 'INSERT INTO  registration_attempt_details (EMAIL_ID,IS_MOBILE_VERIFIED,IS_REGISTERED,TYPE,EMAIL_OTP,REGISTRATION_FOR) VALUES (?,?,?,?,?,?)'
                            var data = [TYPE_VALUE, 0, 1, TYPE, OTP, 'Technician']
                        }
                        console.log("data", data)
                        mm.executeQueryData(QUERY, data, supportKey, (error, resultsOtp1) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save registration information..."
                                });
                            }
                            else {
                                mm.executeQueryData('INSERT INTO  registration_otp_details (TYPE,TYPE_VALUE,OTP,OTP_MESSAGE,REQUESTED_DATETIME,CLIENT_ID,STATUS,IS_VERIFIED) VALUES (?,?,?,?,?,?,?,?)', [TYPE, TYPE_VALUE, OTP, 'genericotp', systemDate, 1, 1, 0], supportKey, (error, resultsOtp2) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save registration information..."
                                        });
                                    } else {
                                        sendOtpTologin(TYPE, TYPE_VALUE, "OTP Verify", body, OTP, '', supportKey, (err, result) => {
                                            if (err) {
                                                console.log(err);
                                                res.send({
                                                    code: 400,
                                                    message: "Failed to send OTP",
                                                });
                                            } else {
                                                res.send({
                                                    "code": 200,
                                                    "message": "Otp successfully sent",
                                                    "type": 1
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
                else {
                    // if(TYPE=='M')
                    // {
                    //     res.send({
                    //         "code": 400,
                    //         "message": `Invalid ${TYPE=='M','mobile number','Email ID'}.`
                    //     });
                    // }
                    // else
                    // {
                    //     res.send({
                    //         "code": 400,
                    //         "message": "Invalid email ID."
                    //     });
                    // }
                    res.send({
                        "code": 400,
                        "message": `Invalid ${TYPE == 'M' ? 'mobile number' : 'Email ID'}.`
                    });
                }
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

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Customer Otp Support"
    var otpText1
    if (TYPE == "M") {
        otpText1 = `Dear customer, please share OTP ${OTP} with our technician to complete your order. For queries, contact Pockit Team.Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Customer,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Pockit</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><em>Suggestion/feedback if any can be provided through our official website https://pockitapp.pockitengineers.com/</em></p>`;
    }
    var otpSendStatus = "S";
    mm.executeQueryData(`INSERT INTO registration_otp_details(TYPE,TYPE_VALUE,OTP,OTP_MESSAGE,REQUESTED_DATETIME,CLIENT_ID,STATUS,IS_VERIFIED,OTP_TYPE) values(?,?,?,?,?,?,?,?,?)`, [TYPE, TYPE_VALUE, OTP, otpText1, systemDate, 1, 'S', '0', 'C'], supportKey, (error, insertOtpDetails) => {
        if (error) {
            callback(error);
        }
        else {
            sendSMSEmail(TYPE, TYPE_VALUE, subject, otpText1, (error, results) => {
                if (error) {
                    callback(error);
                }
                else {
                    const VID = insertOtpDetails.insertId;
                    callback(null, VID);
                }
            });
        }
    });
}


function sendOtpTologin(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    var subject = "technician login otp"
    var otpText1
    if (TYPE == "M") {
        var otpText1 = `Dear Technician, please share OTP ${OTP} with our technician to complete your order. For queries, contact Pockit Team.Team UVtechSoft.`

    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Customer,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team Pockit</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><em>Suggestion/feedback if any can be provided through our official website https://pockitapp.pockitengineers.com/</em></p>`;

    }
    sendSMSEmail(TYPE, TYPE_VALUE, subject, otpText1, (error, results) => {
        if (error) {
            callback(error);
        }
        else {
            callback(null);
        }
    });

}



function sendSMSEmail(type, to, subject, body, callback) {
    if (type == "M") {
        console.log("\n\n\n\n\n\n in sms")
        mm.sendSMS(to, body, (error, result) => {
            if (error) {
                console.log(error);
                callback(null, result);
            } else {
                callback(null, result);
            }
        });
    } else if (type == "E") {
        let data = {
            USER_ID: '',
            TYPE: 'text',
            ATTACHMENT: '',
        }
        mm.sendEmail(to, subject, body, 'technician login otp', "", (error, results) => {
            if (error) {
                console.log(error);
                callback(null, results);
            } else {
                callback(null, results);
            }
        });
    }
};



exports.clearId = (req, res) => {
    var SESSION_KEY = req.body.SESSION_KEY;
    var USER_ID = req.body.USER_ID;
    var supportKey = req.headers["supportkey"]; //Supportkey ;
    var systemDate = mm.getSystemDate();
    try {
        if (SESSION_KEY && SESSION_KEY != " ") {
            mm.executeQueryData(`UPDATE user_session_details set STATUS='L',LOGOUT_DATE_TIME=? where SESSION_KEY=? `, [systemDate, SESSION_KEY], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        code: 400,
                        message: "Failed to logut from system ",
                    });
                } else {
                    mm.executeQueryData(`UPDATE technician_master SET DEVICE_ID=null,CLOUD_ID=null,W_CLOUD_ID=null where ID=?`, [USER_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            res.send({
                                code: 400,
                                message: "Failed to logut from system ",
                            });
                        } else {
                            var data = require("fs").readFileSync(
                                "./userdata/sessionData.txt",
                                { encoding: "utf8" }
                            );
                            var data1 = JSON.parse(data);

                            if (data.length > 0) {
                                const index = data1.findIndex(
                                    (c) => c.SESSION_KEY === SESSION_KEY
                                );

                                if (index > 0) {
                                    data1.splice(index, 1);
                                }
                            }

                            require("fs").writeFileSync(
                                "./userdata/sessionData.txt",
                                JSON.stringify(data1),
                                "utf8"
                            );
                            res.send({
                                code: 200,
                                message: "Successfully logout from system ...",
                            });
                        }
                    }
                    );
                }
            }
            );
        } else {
            res.send({
                code: 400,
                message: "parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);

        res.send({
            code: 400,
            message: "Failed to logut from system.",
        });
    }
};

const xlsx = require('xlsx')
// const async = require('async')


exports.importTechnicianExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/technicianExcel/${EXCEL_FILE_NAME}.xlsx`)

        const technician = workbook.SheetNames[0];
        const technicianSheet = workbook.Sheets[technician];
        const technicianExcelData = xlsx.utils.sheet_to_json(technicianSheet);

        const technicianDetails = workbook.SheetNames[1];
        const technicianDetailsSheet = workbook.Sheets[technicianDetails];
        const technicianDetailsExcelData = xlsx.utils.sheet_to_json(technicianDetailsSheet);


        function excelDateToJSDate(serial) {
            return new Date((serial - 25569) * 86400 * 1000);
        }
        technicianExcelData.forEach((row) => {
            ['HIRE_DATE', 'DOB', 'CONTRACT_START_DATE', 'CONTRACT_END_DATE', 'CREATED_DATE', 'ASSIGNED_DATE']
                .forEach((field) => {
                    if (typeof row[field] === 'number') {
                        row[field] = excelDateToJSDate(row[field]);
                    }
                });
        });

        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        let LogArray = []
        async.eachSeries(technicianExcelData, function iteratorOverElems(element, inner_callback) {
            element.PASSWORD = element.PASSWORD ? md5(element.PASSWORD) : null;
            mm.executeDML(`SELECT * FROM ${technicianMaster} WHERE EMAIL_ID = ? or MOBILE_NUMBER = ?`, [element.EMAIL_ID, element.MOBILE_NUMBER], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    inner_callback(error)
                }
                else {
                    if (results.length > 0) {
                        inner_callback(null)
                    }
                    else {
                        mm.executeDML('INSERT INTO technician_master (NAME, EXPERIENCE_LEVEL, MOBILE_NUMBER, EMAIL_ID, ADDRESS_LINE1, ADDRESS_LINE2, IS_ACTIVE, HIRE_DATE, COUNTRY_ID, CITY_ID, STATE_ID, PINCODE_ID, AADHAR_NUMBER, GENDER, DOB, IS_OWN_VEHICLE, PHOTO, PASSWORD, VEHICLE_TYPE, VEHICLE_DETAILS, VEHICLE_NO, VENDOR_ID, CONTRACT_START_DATE, CONTRACT_END_DATE, TYPE, DEVICE_ID, W_CLOUD_ID, CLOUD_ID, REPORTING_PERSON_ID, CLIENT_ID, CURRENT_STATUS, COUNTRY_CODE, DISTRICT_ID, HOME_LATTITUDE, HOME_LONGITUDE, ORG_ID, AVRAGE_REVIEW, LETEST_REVIEW, TECHNICIAN_STATUS, CREATED_DATE, FIREBASE_REG_TOKEN, PINCODE, PROFILE_PHOTO, ASSIGNED_DATE, IS_TOOLKIT_ASSIGNED, IS_UNIFORM_ASSIGNED, VERIFICATION_OTP, IS_VERIFIED,SR_NO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [element.NAME, element.EXPERIENCE_LEVEL, element.MOBILE_NUMBER, element.EMAIL_ID, element.ADDRESS_LINE1, element.ADDRESS_LINE2, element.IS_ACTIVE, element.HIRE_DATE, element.COUNTRY_ID, element.CITY_ID, element.STATE_ID, element.PINCODE_ID, element.AADHAR_NUMBER, element.GENDER, element.DOB, element.IS_OWN_VEHICLE, element.PHOTO, element.PASSWORD, element.VEHICLE_TYPE, element.VEHICLE_DETAILS, element.VEHICLE_NO, element.VENDOR_ID, element.CONTRACT_START_DATE, element.CONTRACT_END_DATE, element.TYPE, element.DEVICE_ID, element.W_CLOUD_ID, element.CLOUD_ID, element.REPORTING_PERSON_ID, "1", element.CURRENT_STATUS, element.COUNTRY_CODE, element.DISTRICT_ID, element.HOME_LATTITUDE, element.HOME_LONGITUDE, element.ORG_ID, element.AVRAGE_REVIEW, element.LETEST_REVIEW, element.TECHNICIAN_STATUS, element.CREATED_DATE, element.FIREBASE_REG_TOKEN, element.PINCODE, element.PROFILE_PHOTO, element.ASSIGNED_DATE, element.IS_TOOLKIT_ASSIGNED, element.IS_UNIFORM_ASSIGNED, element.VERIFICATION_OTP, element.IS_VERIFIED, element.SR_NO], supportKey, connection, (error, results1) => {
                            if (error) {
                                console.log(error);
                                inner_callback(error)
                            }
                            else {
                                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created the technician ${element.NAME}`;
                                let actionLog = {
                                    "SOURCE_ID": results1.insertId, "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "technician", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                }
                                LogArray.push(actionLog)
                                sendWelcomeEmail(element.EMAIL_ID, element.NAME, element.MOBILE_NUMBER);
                                addGlobalData(results1.insertId, supportKey)
                                inner_callback(null)
                            }
                        }
                        );
                    }
                }
            }
            );
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to save data"
                })
            } else {
                async.eachSeries(technicianDetailsExcelData, function iteratorOverElems(element, inner_callback) {
                    mm.executeDML(`SELECT * FROM ${technicianMaster} WHERE SR_NO=?`, [element.TECHNICIAN_ID], supportKey, connection, (error, results) => {
                        if (error) {
                            console.log(error);
                            inner_callback(error)
                        }
                        else {
                            if (results.length > 0) {
                                inner_callback(null)
                            }
                            else {
                                mm.executeDML('INSERT INTO technician_service_calender (TECHNICIAN_ID,IS_SERIVCE_AVAILABLE,WEEK_DAY,DAY_START_TIME,DAY_END_TIME,BREAK_START_TIME,BREAK_END_TIME,CLIENT_ID) VALUES (?,?,?,?,?,?,?,?)', [element.TECHNICIAN_ID, element.IS_SERIVCE_AVAILABLE, element.WEEK_DAY, element.DAY_START_TIME, element.DAY_END_TIME, element.BREAK_START_TIME, element.BREAK_END_TIME, "1"], supportKey, connection, (error, results5) => {
                                    if (error) {
                                        console.log(error);
                                        inner_callback(error)
                                    }
                                    else {
                                        inner_callback(null)
                                    }
                                })
                            }
                        }
                    }
                    );
                }, function subCb(error) {
                    if (error) {
                        mm.rollbackConnection(connection)
                        res.send({
                            "code": 400,
                            "message": "Failed to save data"
                        })
                    } else {
                        mm.executeDML('update technician_master set SR_NO=null ', [], supportKey, connection, (error, results5) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save data"
                                })
                            }
                            else {
                                dbm.saveLog(LogArray, systemLog);
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": "Data saved successfully"
                                })
                            }
                        })
                    }
                });
            }
        });

    } catch (error) {
        console.log("Error in update method try block: ", error);
        res.send({
            "code": 400,
            "message": "Internal server error "
        });
    }
}