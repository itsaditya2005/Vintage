const mm = require('../utilities/globalModule');
const dbm = require('../utilities/dbMongo');
const logger = require("../utilities/logger");
const { validationResult, body } = require('express-validator');
const md5 = require('md5');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../modules/systemLog")
const channelSubscribedUsers = require('../modules/channelSubscribedUsers');
const async = require('async');
var customerMaster = "customer_master";
var customerAddressMaster = "customer_address_master";
const xlsx = require('xlsx')
const path = require('path');
const fs = require('fs');
const { log } = require('util');

function reqData(req) {
    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        REGISTRATION_DATE: req.body.REGISTRATION_DATE,
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        ALTERNATE_MOBILE_NO: req.body.ALTERNATE_MOBILE_NO,
        CURRENT_ADDRESS_ID: req.body.CURRENT_ADDRESS_ID,
        PASSWORD: req.body.PASSWORD,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        CLOUD_ID: req.body.CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: req.body.LOGOUT_DATETIME,
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE ? '1' : '0',
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        SHORT_CODE: req.body.SHORT_CODE
    }
    return data;
}

function customerData(req) {

    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        REGISTRATION_DATE: req.body.REGISTRATION_DATE,
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        ALTERNATE_MOBILE_NO: req.body.ALTERNATE_MOBILE_NO,
        CURRENT_ADDRESS_ID: req.body.CURRENT_ADDRESS_ID,
        PASSWORD: req.body.PASSWORD,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        CLOUD_ID: req.body.CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: req.body.LOGOUT_DATETIME,
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE ? '1' : '0',
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        SHORT_CODE: req.body.SHORT_CODE
    }
    return data;
}

function reqDataAddress(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE_ID: req.body.STATE_ID,
        CITY_ID: req.body.CITY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        GEO_LOCATION: req.body.GEO_LOCATION,
        TYPE: req.body.TYPE,
        IS_DEFAULT: req.body.IS_DEFAULT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        LANDMARK: req.body.LANDMARK,
        HOUSE_NO: req.body.HOUSE_NO,
        BUILDING: req.body.BUILDING,
        FLOOR: req.body.FLOOR,
        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        PINCODE_FOR: req.body.PINCODE_FOR
    }
    return data;
}

function reqDatalog(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        ADDRESS_ID: req.body.ADDRESS_ID,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE_ID: req.body.STATE_ID,
        CITY_ID: req.body.CITY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        GEO_LOCATION: req.body.GEO_LOCATION,
        TYPE: req.body.TYPE,
        IS_DEFAULT: req.body.IS_DEFAULT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        LANDMARK: req.body.LANDMARK,
        HOUSE_NO: req.body.HOUSE_NO,
        BUILDING: req.body.BUILDING,
        FLOOR: req.body.FLOOR,
        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        STATUS: req.body.STATUS ? '1' : '0',
    }
    return data;
}

exports.createCustomer = (req, res) => {
    var data = reqData(req);
    var custdata = customerData(req);
    data.PASSWORD = generateRandomAlphanumeric();
    data.PASSWORD = md5(data.PASSWORD);
    var systemDate = mm.getSystemDate();
    data.REGISTRATION_DATE = systemDate;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const connection = mm.openConnection();
        mm.executeDML(
            `SELECT * FROM customer_master WHERE EMAIL = ? OR MOBILE_NO = ?;SELECT * FROM customer_master WHERE SHORT_CODE = ?`,
            [data.EMAIL, data.MOBILE_NO, data.SHORT_CODE],
            supportKey,
            connection,
            (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.send({
                        "code": 400,
                        "message": "Failed to validate customer email."
                    });
                }

                // Check for existing email or mobile (case insensitive for email)
                if (results[0].length > 0) {
                    console.log("result11", results);
                    const existingEmail = results[0][0].EMAIL.toLowerCase();
                    const newEmail = data.EMAIL.toLowerCase();

                    if (existingEmail === newEmail && results[0][0].MOBILE_NO === data.MOBILE_NO) {
                        mm.rollbackConnection(connection);
                        return res.send({
                            "code": 300,
                            "message": "Email ID and mobile number already exist."
                        });
                    } else if (existingEmail === newEmail) {
                        mm.rollbackConnection(connection);
                        return res.send({
                            "code": 300,
                            "message": "Email ID already exist."
                        });
                    } else if (results[0][0].MOBILE_NO === data.MOBILE_NO) {
                        mm.rollbackConnection(connection);
                        return res.send({
                            "code": 300,
                            "message": "Mobile number already exist."
                        });
                    }
                }
                console.log("result11", results);
                if (data.CUSTOMER_TYPE === "B") {
                    // Check for existing short code
                    // if (results[1].length > 0 && results[1][0].SHORT_CODE === data.SHORT_CODE) {
                    if (results[1].some(row => row.SHORT_CODE.toLowerCase() === data.SHORT_CODE.toLowerCase())) {
                        console.log("result11", results);
                        mm.rollbackConnection(connection);
                        return res.send({
                            "code": 300,
                            "message": "Short code already exist."
                        });
                    } else {

                        // Proceed with customer creation
                        data.IS_PARENT = 1;
                        mm.executeDML('INSERT INTO customer_email_master SET ?', data, supportKey, connection, (error, results) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to save customer information."
                                });
                            }

                            custdata.CUSTOMER_DETAILS_ID = results.insertId;
                            custdata.IS_PARENT = 1;
                            mm.executeDML(`INSERT INTO customer_master SET ? `, custdata, supportKey, connection, (error, results1) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    return res.send({
                                        "code": 400,
                                        "message": "Failed to save customer information."
                                    });
                                }

                                if (data.CUSTOMER_TYPE == "B") {
                                    mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            return res.send({
                                                "code": 400,
                                                "message": "Failed to get slot information."
                                            });
                                        }

                                        mm.executeDML(
                                            'INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID,CUSTOMER_DETAILS_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
                                            [0, "C", results1.insertId, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1, results1.insertId],
                                            supportKey,
                                            connection,
                                            (error, resultsglobal) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    return res.send({
                                                        "code": 400,
                                                        "message": "Failed to save globalTimeSlotMapping information..."
                                                    });
                                                }

                                                mm.sendDynamicEmail(1, results1.insertId, supportKey);
                                                addGlobalData(results1.insertId, supportKey);
                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer${data.NAME}.`;
                                                var logCategory = "customer";

                                                let actionLog = {
                                                    SOURCE_ID: results.insertId,
                                                    LOG_DATE_TIME: mm.getSystemDate(),
                                                    LOG_TEXT: ACTION_DETAILS,
                                                    CATEGORY: logCategory,
                                                    CLIENT_ID: 1,
                                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                    supportKey: "987654327654",
                                                    CUSTOMER_DETAILS_ID: results1.insertId
                                                };
                                                dbm.saveLog(actionLog, systemLog);

                                                const channels = [
                                                    { CHANNEL_NAME: "customer_channel" },
                                                    { CHANNEL_NAME: "system_alerts_channel" },
                                                    { CHANNEL_NAME: `customer_${results1.insertId}_channel` }
                                                ];

                                                channels.forEach(channel => {
                                                    const chanelData = {
                                                        ...channel,
                                                        USER_ID: results1.insertId,
                                                        TYPE: "C",
                                                        STATUS: true,
                                                        USER_NAME: data.NAME,
                                                        CLIENT_ID: data.CLIENT_ID,
                                                        DATE: mm.getSystemDate()
                                                    };
                                                    new channelSubscribedUsers(chanelData).save();
                                                });

                                                mm.commitConnection(connection);
                                                return res.send({
                                                    "code": 200,
                                                    "message": "Customer information saved successfully.",
                                                    "ID": results1.insertId,
                                                    "CUSTOMER_DETAILS_ID": results.insertId
                                                });
                                            }
                                        );
                                    });
                                } else {
                                    mm.sendDynamicEmail(1, results1.insertId, supportKey);
                                    addGlobalData(results.insertId, supportKey);

                                    const channels = [
                                        { CHANNEL_NAME: "customer_channel" },
                                        { CHANNEL_NAME: "system_alerts_channel" },
                                        { CHANNEL_NAME: `customer_${results1.insertId}_channel` }
                                    ];

                                    channels.forEach(channel => {
                                        const chanelData = {
                                            ...channel,
                                            USER_ID: results1.insertId,
                                            TYPE: "C",
                                            STATUS: true,
                                            USER_NAME: data.NAME,
                                            CLIENT_ID: data.CLIENT_ID,
                                            DATE: mm.getSystemDate()
                                        };
                                        new channelSubscribedUsers(chanelData).save();
                                    });

                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer ${data.NAME}.`;
                                    var logCategory = "customer";

                                    let actionLog = {
                                        SOURCE_ID: results.insertId,
                                        LOG_DATE_TIME: mm.getSystemDate(),
                                        LOG_TEXT: ACTION_DETAILS,
                                        CATEGORY: logCategory,
                                        CLIENT_ID: 1,
                                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                        supportKey: "987654327654",
                                        CUSTOMER_DETAILS_ID: results1.insertId
                                    };
                                    dbm.saveLog(actionLog, systemLog);

                                    mm.commitConnection(connection);
                                    return res.send({
                                        "code": 200,
                                        "message": "Customer information saved successfully.",
                                        "ID": results1.insertId,
                                        "CUSTOMER_DETAILS_ID": results.insertId
                                    });
                                }
                            });
                        });
                    }
                } else {

                    // Proceed with customer creation
                    data.IS_PARENT = 1;
                    mm.executeDML('INSERT INTO customer_email_master SET ?', data, supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            return res.send({
                                "code": 400,
                                "message": "Failed to save customer information."
                            });
                        }

                        custdata.CUSTOMER_DETAILS_ID = results.insertId;
                        custdata.IS_PARENT = 1;
                        mm.executeDML(`INSERT INTO customer_master SET ? `, custdata, supportKey, connection, (error, results1) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.send({
                                    "code": 400,
                                    "message": "Failed to save customer information."
                                });
                            }

                            if (data.CUSTOMER_TYPE == "B") {
                                mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        return res.send({
                                            "code": 400,
                                            "message": "Failed to get slot information."
                                        });
                                    }

                                    mm.executeDML(
                                        'INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID,CUSTOMER_DETAILS_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
                                        [0, "C", results1.insertId, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1, results1.insertId],
                                        supportKey,
                                        connection,
                                        (error, resultsglobal) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                return res.send({
                                                    "code": 400,
                                                    "message": "Failed to save globalTimeSlotMapping information..."
                                                });
                                            }

                                            mm.sendDynamicEmail(1, results1.insertId, supportKey);
                                            addGlobalData(results1.insertId, supportKey);
                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer${data.NAME}.`;
                                            var logCategory = "customer";

                                            let actionLog = {
                                                SOURCE_ID: results.insertId,
                                                LOG_DATE_TIME: mm.getSystemDate(),
                                                LOG_TEXT: ACTION_DETAILS,
                                                CATEGORY: logCategory,
                                                CLIENT_ID: 1,
                                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                supportKey: "987654327654",
                                                CUSTOMER_DETAILS_ID: results1.insertId
                                            };
                                            dbm.saveLog(actionLog, systemLog);

                                            const channels = [
                                                { CHANNEL_NAME: "customer_channel" },
                                                { CHANNEL_NAME: "system_alerts_channel" },
                                                { CHANNEL_NAME: `customer_${results1.insertId}_channel` }
                                            ];

                                            channels.forEach(channel => {
                                                const chanelData = {
                                                    ...channel,
                                                    USER_ID: results1.insertId,
                                                    TYPE: "C",
                                                    STATUS: true,
                                                    USER_NAME: data.NAME,
                                                    CLIENT_ID: data.CLIENT_ID,
                                                    DATE: mm.getSystemDate()
                                                };
                                                new channelSubscribedUsers(chanelData).save();
                                            });

                                            mm.commitConnection(connection);
                                            return res.send({
                                                "code": 200,
                                                "message": "Customer information saved successfully.",
                                                "ID": results1.insertId,
                                                "CUSTOMER_DETAILS_ID": results.insertId
                                            });
                                        }
                                    );
                                });
                            } else {
                                mm.sendDynamicEmail(1, results1.insertId, supportKey);
                                addGlobalData(results.insertId, supportKey);

                                const channels = [
                                    { CHANNEL_NAME: "customer_channel" },
                                    { CHANNEL_NAME: "system_alerts_channel" },
                                    { CHANNEL_NAME: `customer_${results1.insertId}_channel` }
                                ];

                                channels.forEach(channel => {
                                    const chanelData = {
                                        ...channel,
                                        USER_ID: results1.insertId,
                                        TYPE: "C",
                                        STATUS: true,
                                        USER_NAME: data.NAME,
                                        CLIENT_ID: data.CLIENT_ID,
                                        DATE: mm.getSystemDate()
                                    };
                                    new channelSubscribedUsers(chanelData).save();
                                });

                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer ${data.NAME}.`;
                                var logCategory = "customer";

                                let actionLog = {
                                    SOURCE_ID: results.insertId,
                                    LOG_DATE_TIME: mm.getSystemDate(),
                                    LOG_TEXT: ACTION_DETAILS,
                                    CATEGORY: logCategory,
                                    CLIENT_ID: 1,
                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                    supportKey: "987654327654",
                                    CUSTOMER_DETAILS_ID: results1.insertId
                                };
                                dbm.saveLog(actionLog, systemLog);

                                var wBparams = [{ "type": "text", "text": data.NAME }, { "type": "text", "text": data.EMAIL }]
                                var templateName = "welcome_customer"
                                var wparams = [{ "type": "body", "parameters": wBparams }]
                                mm.sendWAToolSMS(data.MOBILE_NO, templateName, wparams, 'En', (error, resultswsms) => {
                                    if (error) {
                                        console.log(error)
                                    }
                                    else {
                                        console.log("Successfully send SMS", resultswsms)
                                    }
                                })
                                mm.commitConnection(connection);
                                return res.send({
                                    "code": 200,
                                    "message": "Customer information saved successfully.",
                                    "ID": results1.insertId,
                                    "CUSTOMER_DETAILS_ID": results.insertId
                                });

                            }
                        });
                    });
                }
            }
        );
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        return res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.createAddress = (req, res) => {
    var dataUpdate = reqDataAddress(req);
    var dataLog = reqDatalog(req);
    var CUSTOMER_NAME = req.body.CONTACT_PERSON_NAME
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            dataUpdate.STATUS = 1
            mm.executeQueryData('INSERT INTO ' + customerAddressMaster + ' SET ?', dataUpdate, supportKey, (insertError, insertResults) => {
                if (insertError) {
                    console.log(insertError);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerAddress information..."
                    });
                } else {
                    dataLog.ADDRESS_ID = insertResults.insertId
                    mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                        if (insertError) {
                            console.log(insertError);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save customerAddress information..."
                            });
                        } else {
                            if (dataUpdate.IS_DEFAULT && (dataUpdate.IS_DEFAULT == 1 || dataUpdate.IS_DEFAULT == true)) {
                                console.log("IS_DEFAULT is set to 1. Updating other addresses...");
                                mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET IS_DEFAULT=?, CREATED_MODIFIED_DATE = ? WHERE ID!= ? AND CUSTOMER_ID = ?`, [0, mm.getSystemDate(), insertResults.insertId, dataUpdate.CUSTOMER_ID], supportKey, (error, resultsUpdate) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save customerAddress information..."
                                        });
                                    }
                                    else {
                                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                        var ACTION_DETAILS = `User ${NAME} has created a new address.`;
                                        var logCategory = "customer address";

                                        let actionLog = {
                                            "SOURCE_ID": insertResults.insertId,
                                            "LOG_DATE_TIME": mm.getSystemDate(),
                                            "LOG_TEXT": ACTION_DETAILS,
                                            "CATEGORY": logCategory,
                                            "CLIENT_ID": 1,
                                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                            "supportKey": 0
                                        };

                                        dbm.saveLog(actionLog, systemLog);
                                        var SUBSCRIBED_CHANNELS = []
                                        var CHANNEL_NAME = `promotion_state_${dataUpdate.STATE_ID}_channel`;
                                        var CHANNEL_NAME2 = `promotion_country_${dataUpdate.COUNTRY_ID}_channel`;
                                        var CHANNEL_NAME3 = `pincode_${dataUpdate.PINCODE_ID}_channel`;
                                        var data = {
                                            "CHANNEL_NAME": CHANNEL_NAME,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };
                                        var data2 = {
                                            "CHANNEL_NAME": CHANNEL_NAME2,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };
                                        var data3 = {
                                            "CHANNEL_NAME": CHANNEL_NAME3,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };

                                        function subscribeUser(channelName, dataUpdate, SUBSCRIBED_CHANNELS) {
                                            const channelData = {
                                                CHANNEL_NAME: channelName,
                                                USER_ID: dataUpdate.CUSTOMER_ID,
                                                TYPE: "C",
                                                STATUS: true,
                                                USER_NAME: CUSTOMER_NAME,
                                                CLIENT_ID: dataUpdate.CLIENT_ID,
                                                DATE: mm.getSystemDate()
                                            };
                                            const newChannel = new channelSubscribedUsers(channelData);
                                            newChannel.save();
                                            SUBSCRIBED_CHANNELS.push(channelData);
                                        }

                                        channelSubscribedUsers.findOne(data).then(existingRecord => {
                                            if (!existingRecord) {
                                                subscribeUser(CHANNEL_NAME, dataUpdate, SUBSCRIBED_CHANNELS);
                                            }
                                            channelSubscribedUsers.findOne(data2).then(existingRecord2 => {
                                                if (!existingRecord2) {
                                                    subscribeUser(CHANNEL_NAME2, dataUpdate, SUBSCRIBED_CHANNELS);
                                                }
                                                channelSubscribedUsers.findOne(data3).then(existingRecord3 => {
                                                    if (!existingRecord3) {
                                                        subscribeUser(CHANNEL_NAME3, dataUpdate, SUBSCRIBED_CHANNELS);
                                                    }
                                                    res.send({
                                                        "code": 200,
                                                        "message": "CustomerAddress information saved successfully...",
                                                        "ID": insertResults.insertId,
                                                        "SUBSCRIBED_CHANNELS": SUBSCRIBED_CHANNELS
                                                    });
                                                }).catch(error => handleError(res, error));
                                            }).catch(error => handleError(res, error));
                                        }).catch(error => handleError(res, error));

                                        function handleError(res, error) {
                                            console.error(error);
                                            res.send({
                                                "code": 400,
                                                "message": "Something went wrong during channel subscription"
                                            });
                                        }
                                    }
                                })
                            } else {
                                var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                var ACTION_DETAILS = `User ${NAME} has created new address.`;
                                var logCategory = "customer address";

                                let actionLog = {
                                    "SOURCE_ID": insertResults.insertId,
                                    "LOG_DATE_TIME": mm.getSystemDate(),
                                    "LOG_TEXT": ACTION_DETAILS,
                                    "CATEGORY": logCategory,
                                    "CLIENT_ID": 1,
                                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                    "supportKey": 0
                                };

                                dbm.saveLog(actionLog, systemLog);
                                var SUBSCRIBED_CHANNELS = []
                                var CHANNEL_NAME = `promotion_state_${dataUpdate.STATE_ID}_channel`;
                                var CHANNEL_NAME2 = `promotion_country_${dataUpdate.COUNTRY_ID}_channel`;
                                var CHANNEL_NAME3 = `pincode_${dataUpdate.PINCODE_ID}_channel`;
                                var data = {
                                    "CHANNEL_NAME": CHANNEL_NAME,
                                    "USER_ID": dataUpdate.CUSTOMER_ID,
                                    "TYPE": "C"
                                };
                                var data2 = {
                                    "CHANNEL_NAME": CHANNEL_NAME2,
                                    "USER_ID": dataUpdate.CUSTOMER_ID,
                                    "TYPE": "C"
                                };
                                var data3 = {
                                    "CHANNEL_NAME": CHANNEL_NAME3,
                                    "USER_ID": dataUpdate.CUSTOMER_ID,
                                    "TYPE": "C"
                                };

                                function subscribeUser(channelName, dataUpdate, SUBSCRIBED_CHANNELS) {
                                    const channelData = {
                                        CHANNEL_NAME: channelName,
                                        USER_ID: dataUpdate.CUSTOMER_ID,
                                        TYPE: "C",
                                        STATUS: true,
                                        USER_NAME: CUSTOMER_NAME,
                                        CLIENT_ID: dataUpdate.CLIENT_ID,
                                        DATE: mm.getSystemDate()
                                    };
                                    const newChannel = new channelSubscribedUsers(channelData);
                                    newChannel.save();
                                    SUBSCRIBED_CHANNELS.push(channelData);
                                }

                                channelSubscribedUsers.findOne(data).then(existingRecord => {
                                    if (!existingRecord) {
                                        subscribeUser(CHANNEL_NAME, dataUpdate, SUBSCRIBED_CHANNELS);
                                    }
                                    channelSubscribedUsers.findOne(data2).then(existingRecord2 => {
                                        if (!existingRecord2) {
                                            subscribeUser(CHANNEL_NAME2, dataUpdate, SUBSCRIBED_CHANNELS);
                                        }
                                        channelSubscribedUsers.findOne(data3).then(existingRecord3 => {
                                            if (!existingRecord3) {
                                                subscribeUser(CHANNEL_NAME3, dataUpdate, SUBSCRIBED_CHANNELS);
                                            }
                                            res.send({
                                                "code": 200,
                                                "message": "CustomerAddress information saved successfully...",
                                                "ID": insertResults.insertId,
                                                "SUBSCRIBED_CHANNELS": SUBSCRIBED_CHANNELS
                                            });
                                        }).catch(error => handleError(res, error));
                                    }).catch(error => handleError(res, error));
                                }).catch(error => handleError(res, error));

                                function handleError(res, error) {
                                    console.error(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Something went wrong during channel subscription"
                                    });
                                }
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
};

function addGlobalData(data_Id, supportKey) {
    try {
        console.log("\n\n\n\n\n\n\n\n im in addGlobalData function", data_Id);
        mm.executeQueryData(`select * from view_customer_email_details where ID = ?`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Customer", results5[0].NAME, JSON.stringify(results5[0]), "/masters/customer",0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "Customer", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/customer", TERRITORY_ID: 0 };
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

function generateRandomAlphanumeric() {
    const length = Math.floor(Math.random() * (20 - 8 + 1)) + 8; // Random length between 8 and 20
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}


exports.bulkImportORG = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const authUser = req.body.UserData[0];
    const wb = xlsx.readFile(path.join(__dirname, '../uploads/CustomerSheets/PockIT_Customer_Data.xlsx'));
    const custRows = xlsx.utils.sheet_to_json(wb.Sheets['customer']);
    const addrRows = xlsx.utils.sheet_to_json(wb.Sheets['customerAddress']);

    // index addresses by Mobile Number
    const addrsByMobile = addrRows.reduce((acc, r) => {
        const m = String(r['Mobile No From Customer Sheet']).trim();
        (acc[m] = acc[m] || []).push(r);
        return acc;
    }, {});

    const results = [];

    async.eachSeries(custRows, (row, nextCustomer) => {
        const conn = mm.openConnection();

        mm.executeDML('START TRANSACTION;', [], supportKey, conn, err => {
            if (err) return nextCustomer(err);

            // ────────────────────────────────────────────────────────────────────────
            // 1️⃣ Build and INSERT customer_email_master
            // ────────────────────────────────────────────────────────────────────────
            const pwd = md5(generateRandomAlphanumeric());
            const emailPayload = {
                CUSTOMER_CATEGORY_ID: row['Customer Category Name'] === 'Individual' ? 1 : 2,
                CUSTOMER_TYPE: row['Customer Type'] === 'B2B' ? 'B' : 'I',
                NAME: row['Customer Name'],
                EMAIL: row['Email'],
                SALUTATION: row['Salutation'],
                MOBILE_NO: String(row['Mobile Number']),
                COMPANY_NAME: row['Company name'],
                ALTERNATE_MOBILE_NO: String(row['Alternate Mobile Number']),
                PAN: row['PAN Number'],
                GST_NO: row['GST Number'],
                COUNTRY_CODE: String(row['Country Code']),
                ALTCOUNTRY_CODE: String(row['Altername Country Code']),
                IS_SPECIAL_CATALOGUE: row['Is Have Spacial Catlouge'] === 'Yes' ? '1' : '0',
                SHORT_CODE: row['Short Code'],
                PASSWORD: pwd,
                REGISTRATION_DATE: mm.getSystemDate(),
                CLIENT_ID: 1,
                IS_PARENT: 1,
                ACCOUNT_STATUS: '1'
            };

            mm.executeDML('INSERT INTO customer_email_master SET ?', emailPayload, supportKey, conn, (err, emailRes) => {
                if (err) {
                    mm.rollbackConnection(conn);
                    return nextCustomer(err);
                }

                // ────────────────────────────────────────────────────────────────────────
                // 2️⃣ Build and INSERT customer_master
                // ────────────────────────────────────────────────────────────────────────
                const custPayload = Object.assign(
                    customerData({ body: emailPayload }),
                    { CUSTOMER_DETAILS_ID: emailRes.insertId }
                );

                mm.executeDML('INSERT INTO customer_master SET ?', custPayload, supportKey, conn, (err, masterRes) => {
                    if (err) {
                        mm.rollbackConnection(conn);
                        return nextCustomer(err);
                    }

                    const customerId = masterRes.insertId;
                    const customerDetails = emailRes.insertId;

                    // ────────────────────────────────────────────────────────────────────────
                    // 3️⃣ (Optional) B2B → global_time_slots_mapping
                    // ────────────────────────────────────────────────────────────────────────
                    const slotTasks = [];
                    if (emailPayload.CUSTOMER_TYPE === 'B') {
                        slotTasks.push(cb => {
                            mm.executeDML(
                                `INSERT INTO global_time_slots_mapping
                   (ORG_ID, MAPPING_FOR, MAPPING_ID,
                    SLOT1_START_TIME, SLOT1_END_TIME,
                    SLOT2_START_TIME, SLOT2_END_TIME,
                    SLOT3_START_TIME, SLOT3_END_TIME,
                    CLIENT_ID, CUSTOMER_DETAILS_ID)
                 SELECT
                   0,'C',?,gs.SLOT1_START_TIME,gs.SLOT1_END_TIME,
                   gs.SLOT2_START_TIME,gs.SLOT2_END_TIME,
                   gs.SLOT3_START_TIME,gs.SLOT3_END_TIME,
                   1,?
                  FROM global_timeslots_settings gs
                 ORDER BY gs.ID DESC LIMIT 1;`,
                                [customerId, customerDetails],
                                supportKey,
                                conn,
                                cb
                            );
                        });
                    }

                    async.series(slotTasks, err => {
                        if (err) {
                            mm.rollbackConnection(conn);
                            return nextCustomer(err);
                        }

                        // ────────────────────────────────────────────────────────────────────────
                        // 4️⃣ EXACTLY YOUR createCustomer SIDE‑EFFECTS
                        // ────────────────────────────────────────────────────────────────────────

                        const NAME = authUser.NAME || authUser.USER_NAME;
                        const ACTION_C = `User ${NAME} has created a new customer ${emailPayload.NAME}.`;
                        dbm.saveLog({
                            SOURCE_ID: emailRes.insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: ACTION_C,
                            CATEGORY: 'customer',
                            CLIENT_ID: 1,
                            USER_ID: authUser.USER_ID,
                            supportKey,
                            CUSTOMER_DETAILS_ID: customerDetails
                        }, systemLog);

                        ['customer_channel', 'system_alerts_channel', `customer_${customerId}_channel`]
                            .forEach(ch => new channelSubscribedUsers({
                                CHANNEL_NAME: ch,
                                USER_ID: customerId,
                                TYPE: 'C',
                                STATUS: true,
                                USER_NAME: emailPayload.NAME,
                                CLIENT_ID: 1,
                                DATE: mm.getSystemDate()
                            }).save());

                        mm.sendWAToolSMS(
                            emailPayload.MOBILE_NO,
                            'welcome_customer',
                            [{
                                type: 'body', parameters: [
                                    { type: 'text', text: emailPayload.NAME },
                                    { type: 'text', text: emailPayload.EMAIL }
                                ]
                            }],
                            'En',
                            err => { if (err) console.error('WA SMS error', err); }
                        );

                        // ────────────────────────────────────────────────────────────────────────
                        // 5️⃣ Now INSERT ADDRESSES + EXACTLY YOUR createAddress LOGIC
                        // ────────────────────────────────────────────────────────────────────────
                        const myAddrs = addrsByMobile[emailPayload.MOBILE_NO] || [];
                        async.eachSeries(myAddrs, (r, cbAddr) => {
                            const aBody = Object.assign(reqDataAddress({ body: r }), {
                                CUSTOMER_ID: customerId,
                                CLIENT_ID: 1,
                                STATUS: '1',
                                CUSTOMER_DETAILS_ID: customerDetails
                            });

                            mm.executeQueryData('INSERT INTO customer_address_master SET ?', aBody, supportKey, (err, insertResults) => {
                                if (err) return cbAddr(err);

                                // build your dataUpdate exactly
                                const dataUpdate = Object.assign({}, aBody, {
                                    ID: insertResults.insertId
                                });

                                // copy/paste your entire createAddress IF/ELSE block here,
                                // but **replace** each inner res.send(...) with `cbAddr(null, SUBSCRIBED_CHANNELS);`

                                if (dataUpdate.IS_DEFAULT && (dataUpdate.IS_DEFAULT == 1 || dataUpdate.IS_DEFAULT === true)) {
                                    console.log("IS_DEFAULT is set to 1. Updating other addresses...");
                                    mm.executeQueryData(
                                        `UPDATE customer_address_master
                        SET IS_DEFAULT=?, CREATED_MODIFIED_DATE=?
                      WHERE ID!=? AND CUSTOMER_ID=?`,
                                        [0, mm.getSystemDate(), insertResults.insertId, dataUpdate.CUSTOMER_ID],
                                        supportKey,
                                        (error) => {
                                            if (error) {
                                                console.error(error);
                                                return cbAddr(error);
                                            }

                                            const NAME2 = authUser.NAME || authUser.USER_NAME;
                                            const ACTION_A = `User ${NAME2} has created a new address.`;
                                            dbm.saveLog({
                                                SOURCE_ID: insertResults.insertId,
                                                LOG_DATE_TIME: mm.getSystemDate(),
                                                LOG_TEXT: ACTION_A,
                                                CATEGORY: 'customer address',
                                                CLIENT_ID: 1,
                                                USER_ID: authUser.USER_ID,
                                                supportKey: 0
                                            }, systemLog);

                                            const channels = [
                                                `promotion_state_${dataUpdate.STATE_ID}_channel`,
                                                `promotion_country_${dataUpdate.COUNTRY_ID}_channel`,
                                                `pincode_${dataUpdate.PINCODE_ID}_channel`
                                            ];

                                            let SUBSCRIBED_CHANNELS = [];
                                            function subscribeUser(chName) {
                                                const chData = {
                                                    CHANNEL_NAME: chName,
                                                    USER_ID: dataUpdate.CUSTOMER_ID,
                                                    TYPE: 'C',
                                                    STATUS: true,
                                                    USER_NAME: NAME2,
                                                    CLIENT_ID: dataUpdate.CLIENT_ID,
                                                    DATE: mm.getSystemDate()
                                                };
                                                new channelSubscribedUsers(chData).save();
                                                SUBSCRIBED_CHANNELS.push(chData);
                                            }

                                            // nested findOne → subscribeUser exactly as in your createAddress
                                            channelSubscribedUsers.findOne({ CHANNEL_NAME: channels[0], USER_ID: dataUpdate.CUSTOMER_ID })
                                                .then(r0 => {
                                                    if (!r0) subscribeUser(channels[0]);
                                                    return channelSubscribedUsers.findOne({ CHANNEL_NAME: channels[1], USER_ID: dataUpdate.CUSTOMER_ID });
                                                })
                                                .then(r1 => {
                                                    if (!r1) subscribeUser(channels[1]);
                                                    return channelSubscribedUsers.findOne({ CHANNEL_NAME: channels[2], USER_ID: dataUpdate.CUSTOMER_ID });
                                                })
                                                .then(r2 => {
                                                    if (!r2) subscribeUser(channels[2]);
                                                    cbAddr(null, SUBSCRIBED_CHANNELS);
                                                })
                                                .catch(e => cbAddr(e));
                                        }
                                    );

                                } else {
                                    // ────────────────────────────────────────────────────────────────
                                    // ELSE block from createAddress (identical),
                                    // but swap final res.send(...) → cbAddr(null, SUBSCRIBED_CHANNELS)
                                    // ────────────────────────────────────────────────────────────────
                                    const NAME2 = authUser.NAME || authUser.USER_NAME;
                                    const ACTION_A = `User ${NAME2} has created new address.`;
                                    dbm.saveLog({
                                        SOURCE_ID: insertResults.insertId,
                                        LOG_DATE_TIME: mm.getSystemDate(),
                                        LOG_TEXT: ACTION_A,
                                        CATEGORY: 'customer address',
                                        CLIENT_ID: 1,
                                        USER_ID: authUser.USER_ID,
                                        supportKey: 0
                                    }, systemLog);

                                    const channels = [
                                        `promotion_state_${dataUpdate.STATE_ID}_channel`,
                                        `promotion_country_${dataUpdate.COUNTRY_ID}_channel`,
                                        `pincode_${dataUpdate.PINCODE_ID}_channel`
                                    ];

                                    let SUBSCRIBED_CHANNELS = [];
                                    function subscribeUser(chName) {
                                        const chData = {
                                            CHANNEL_NAME: chName,
                                            USER_ID: dataUpdate.CUSTOMER_ID,
                                            TYPE: 'C',
                                            STATUS: true,
                                            USER_NAME: NAME2,
                                            CLIENT_ID: dataUpdate.CLIENT_ID,
                                            DATE: mm.getSystemDate()
                                        };
                                        new channelSubscribedUsers(chData).save();
                                        SUBSCRIBED_CHANNELS.push(chData);
                                    }

                                    channelSubscribedUsers.findOne({ CHANNEL_NAME: channels[0], USER_ID: dataUpdate.CUSTOMER_ID })
                                        .then(r0 => {
                                            if (!r0) subscribeUser(channels[0]);
                                            return channelSubscribedUsers.findOne({ CHANNEL_NAME: channels[1], USER_ID: dataUpdate.CUSTOMER_ID });
                                        })
                                        .then(r1 => {
                                            if (!r1) subscribeUser(channels[1]);
                                            return channelSubscribedUsers.findOne({ CHANNEL_NAME: channels[2], USER_ID: dataUpdate.CUSTOMER_ID });
                                        })
                                        .then(r2 => {
                                            if (!r2) subscribeUser(channels[2]);
                                            cbAddr(null, SUBSCRIBED_CHANNELS);
                                        })
                                        .catch(e => cbAddr(e));
                                }

                            }); // end INSERT customer_address_master
                        }, err => {
                            if (err) {
                                mm.rollbackConnection(conn);
                                return nextCustomer(err);
                            }
                            mm.commitConnection(conn);
                            results.push({ customer: emailPayload.NAME, status: 'ok' });
                            nextCustomer();
                        });

                    }); // end async.eachSeries(addresses)
                }); // end INSERT customer_master
            }); // end INSERT customer_email_master
        }); // end START TRANSACTION
    }, err => {
        if (err) {
            return res.status(500).send({ code: 500, message: 'Import failed', detail: err.toString() });
        }
        res.send({ code: 200, message: 'Import complete', results });
    });
};


exports.bulkImportNew = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const authUser = req.body.UserData[0];
    console.log('[bulkImport] Starting import for user', authUser.USER_ID);

    // Read Excel
    const filePath = path.join(__dirname, '../uploads/CustomerSheets/PockIT_Customer_Data.xlsx');
    console.log('[bulkImport] Reading Excel file:', filePath);
    let wb;
    try {
        wb = xlsx.readFile(filePath);
    } catch (e) {
        console.error('[bulkImport] Failed to read Excel:', e);
        return res.status(500).send({ code: 500, message: 'Could not read Excel file', detail: e.toString() });
    }

    // Parse sheets
    const custRows = xlsx.utils.sheet_to_json(wb.Sheets['customer'] || {});
    const addrRows = xlsx.utils.sheet_to_json(wb.Sheets['customerAddress'] || {});
    console.log(`[bulkImport] Parsed ${custRows.length} customers and ${addrRows.length} addresses`);

    // Index addresses by mobile
    const addrsByMobile = addrRows.reduce((acc, r) => {
        const m = String(r['Mobile No From Customer Sheet']).trim();
        (acc[m] = acc[m] || []).push(r);
        return acc;
    }, {});

    const results = [];
    async.eachSeries(custRows, (row, nextCust) => {
        console.log('[bulkImport] Processing customer:', row['Customer Name']);
        const conn = mm.openConnection();

        mm.executeDML('START TRANSACTION;', [], supportKey, conn, err => {
            if (err) {
                console.error('[bulkImport] TX START failed', err);
                return nextCust(err);
            }

            // Build customer_email_master
            const pwd = md5(generateRandomAlphanumeric());
            const emailPayload = {
                CUSTOMER_CATEGORY_ID: row['Customer Category Name'] === 'Individual' ? 1 : 2,
                CUSTOMER_TYPE: row['Customer Type'] === 'B2B' ? 'B' : 'I',
                NAME: row['Customer Name'],
                EMAIL: row['Email'],
                SALUTATION: row['Salutation'],
                MOBILE_NO: String(row['Mobile Number']),
                COMPANY_NAME: row['Company name'],
                ALTERNATE_MOBILE_NO: String(row['Alternate Mobile Number']),
                PAN: row['PAN Number'],
                GST_NO: row['GST Number'],
                COUNTRY_CODE: String(row['Country Code']),
                ALTCOUNTRY_CODE: String(row['Altername Country Code']),
                IS_SPECIAL_CATALOGUE: row['Is Have Spacial Catlouge'] === 'Yes' ? '1' : '0',
                SHORT_CODE: row['Short Code'],
                PASSWORD: pwd,
                REGISTRATION_DATE: mm.getSystemDate(),
                CLIENT_ID: 1,
                IS_PARENT: 1,
                ACCOUNT_STATUS: '1'
            };
            console.log('[bulkImport] Inserting email master for', emailPayload.NAME);

            mm.executeDML('INSERT INTO customer_email_master SET ?', emailPayload, supportKey, conn, (err, emailRes) => {
                if (err) {
                    console.error('[bulkImport] email_master INSERT failed', err);
                    mm.rollbackConnection(conn);
                    return nextCust(err);
                }
                console.log('[bulkImport] Inserted email_master ID=', emailRes.insertId);

                // Insert customer_master
                const custPayload = Object.assign({}, emailPayload, {
                    CUSTOMER_DETAILS_ID: emailRes.insertId
                });
                console.log('[bulkImport] Inserting customer master for', custPayload.NAME);

                mm.executeDML('INSERT INTO customer_master SET ?', custPayload, supportKey, conn, (err, masterRes) => {
                    if (err) {
                        console.error('[bulkImport] customer_master INSERT failed', err);
                        mm.rollbackConnection(conn);
                        return nextCust(err);
                    }
                    console.log('[bulkImport] Inserted customer_master ID=', masterRes.insertId);

                    const customerId = masterRes.insertId;
                    const customerDetails = emailRes.insertId;

                    // B2B time-slot mapping
                    const slotTasks = [];
                    if (emailPayload.CUSTOMER_TYPE === 'B') {
                        slotTasks.push(cb => {
                            console.log('[bulkImport] Mapping time-slots for', customerId);
                            const sql = `INSERT INTO global_time_slots_mapping
                             (ORG_ID,MAPPING_FOR,MAPPING_ID,
                              SLOT1_START_TIME,SLOT1_END_TIME,
                              SLOT2_START_TIME,SLOT2_END_TIME,
                              SLOT3_START_TIME,SLOT3_END_TIME,
                              CLIENT_ID,CUSTOMER_DETAILS_ID)
                           SELECT
                             0,'C',?,gs.SLOT1_START_TIME,gs.SLOT1_END_TIME,
                             gs.SLOT2_START_TIME,gs.SLOT2_END_TIME,
                             gs.SLOT3_START_TIME,gs.SLOT3_END_TIME,
                             1,?
                           FROM global_timeslots_settings gs
                          ORDER BY gs.ID DESC LIMIT 1;`;
                            mm.executeDML(sql, [customerId, customerDetails], supportKey, conn, cb);
                        });
                    }

                    async.series(slotTasks, err => {
                        if (err) {
                            console.error('[bulkImport] Time-slot mapping failed', err);
                            mm.rollbackConnection(conn);
                            return nextCust(err);
                        }

                        // // sendDynamicEmail
                        // console.log('[bulkImport] sendDynamicEmail for details=', customerDetails);
                        // mm.sendDynamicEmail(1, customerDetails, supportKey, (err, info) => {
                        //   if (err) console.error('[bulkImport] sendDynamicEmail failed', err);
                        //   else     console.log('[bulkImport] sendDynamicEmail success', info);

                        //   // addGlobalData
                        //   console.log('[bulkImport] addGlobalData for', customerId);
                        //   try {
                        //     addGlobalData(customerId, supportKey);
                        //     console.log('[bulkImport] addGlobalData done');
                        //   } catch (e) {
                        //     console.error('[bulkImport] addGlobalData error', e);
                        //   }

                        // logging
                        const uname = authUser.NAME || authUser.USER_NAME;
                        console.log('[bulkImport] Saving creation log for', customerId);
                        dbm.saveLog({
                            SOURCE_ID: emailRes.insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: `User ${uname} created customer ${emailPayload.NAME}`,
                            CATEGORY: 'customer',
                            CLIENT_ID: 1,
                            USER_ID: authUser.USER_ID,
                            supportKey,
                            CUSTOMER_DETAILS_ID: customerDetails
                        }, systemLog, () => console.log('[bulkImport] customer creation logged'));

                        // channel subscriptions
                        ['customer_channel', 'system_alerts_channel', `customer_${customerId}_channel`]
                            .forEach(ch => {
                                console.log('[bulkImport] Subscribing to', ch);
                                new channelSubscribedUsers({
                                    CHANNEL_NAME: ch,
                                    USER_ID: customerId,
                                    TYPE: 'C',
                                    STATUS: true,
                                    USER_NAME: emailPayload.NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }).save(err => {
                                    if (err) console.error('[bulkImport] Channel save error', ch, err);
                                    else console.log('[bulkImport] Channel saved', ch);
                                });
                            });

                        // WhatsApp SMS
                        //   console.log('[bulkImport] sendWAToolSMS to', emailPayload.MOBILE_NO);
                        //   mm.sendWAToolSMS(
                        //     emailPayload.MOBILE_NO,
                        //     'welcome_customer',
                        //     [{ type:'body', parameters:[
                        //          { type:'text', text: emailPayload.NAME },
                        //          { type:'text', text: emailPayload.EMAIL }
                        //     ]}],
                        //     'En',
                        //     (err, resp) => {
                        //       if (err) console.error('[bulkImport] WAToolSMS error', err);
                        //       else     console.log('[bulkImport] WAToolSMS sent', resp);

                        // now insert addresses
                        const myAddrs = addrsByMobile[emailPayload.MOBILE_NO] || [];
                        console.log('[bulkImport] Found', myAddrs.length, 'addresses');
                        async.eachSeries(myAddrs, (r, cbA) => {
                            const aBody = {
                                CUSTOMER_ID: customerId,
                                CUSTOMER_DETAILS_ID: customerDetails,
                                CLIENT_ID: 1,
                                STATUS: '1',
                                CONTACT_PERSON_NAME: r['Contact Person Name'],
                                MOBILE_NO: String(r['Contact Person Mobile Number']),
                                EMAIL_ID: r['Contact Person Email'],
                                ADDRESS_LINE_1: r['Address Line 1'],
                                ADDRESS_LINE_2: r['Address Line 2'],
                                GEO_LOCATION: r['Geo Location'],
                                TYPE: r['Type'] === 'Work' ? 'W' : r['Type'] === 'Home' ? 'H' : 'O',
                                IS_DEFAULT: r['Is Default Address'] === 'Yes' ? 1 : 0,
                                LANDMARK: r['Landmark'],
                                HOUSE_NO: r['House Number'],
                                BUILDING: r['Bulding'],
                                FLOOR: r['Floor'],
                                PINCODE: r['Pincode'],
                                CITY_NAME: r['City Name'],
                                STATE_ID: r['State ID'],
                                COUNTRY_ID: r['Country ID'] || r['Country Code'],
                                PINCODE_ID: r['Pincode ID']
                            };
                            console.log('[bulkImport] Inserting address for', aBody.CONTACT_PERSON_NAME);
                            mm.executeQueryData('INSERT INTO customer_address_master SET ?', aBody, supportKey, (err, aRes) => {
                                if (err) return cbA(err);
                                console.log('[bulkImport] Address ID=', aRes.insertId);

                                // address logic same as createAddress
                                const du = Object.assign({ ID: aRes.insertId }, aBody);
                                const uname2 = authUser.NAME || authUser.USER_NAME;
                                const doSubscribe = () => {
                                    const chans = [
                                        `promotion_state_${du.STATE_ID}_channel`,
                                        `promotion_country_${du.COUNTRY_ID}_channel`,
                                        `pincode_${du.PINCODE_ID}_channel`
                                    ];
                                    let subbed = [];
                                    function sub(c) {
                                        const d = { CHANNEL_NAME: c, USER_ID: du.CUSTOMER_ID, TYPE: 'C', STATUS: true, USER_NAME: uname2, CLIENT_ID: du.CLIENT_ID, DATE: mm.getSystemDate() };
                                        new channelSubscribedUsers(d).save(); subbed.push(d);
                                    }
                                    channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[0], USER_ID: du.CUSTOMER_ID })
                                        .then(r0 => { if (!r0) sub(chans[0]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[1], USER_ID: du.CUSTOMER_ID }); })
                                        .then(r1 => { if (!r1) sub(chans[1]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[2], USER_ID: du.CUSTOMER_ID }); })
                                        .then(r2 => { if (!r2) sub(chans[2]); cbA(null, subbed); })
                                        .catch(e => cbA(e));
                                };

                                if (du.IS_DEFAULT) {
                                    console.log('[bulkImport] Clearing other defaults');
                                    mm.executeQueryData(
                                        `UPDATE customer_address_master SET IS_DEFAULT=0, CREATED_MODIFIED_DATE=? WHERE ID!=? AND CUSTOMER_ID=?`,
                                        [mm.getSystemDate(), aRes.insertId, du.CUSTOMER_ID],
                                        supportKey,
                                        err => {
                                            if (err) return cbA(err);
                                            dbm.saveLog({ SOURCE_ID: aRes.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: `User ${uname2} created address`, CATEGORY: 'customer address', CLIENT_ID: 1, USER_ID: authUser.USER_ID, supportKey: 0 }, systemLog);
                                            doSubscribe();
                                        }
                                    );
                                } else {
                                    console.log('[bulkImport] Logging & subscribing address');
                                    dbm.saveLog({ SOURCE_ID: aRes.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: `User ${uname2} created address`, CATEGORY: 'customer address', CLIENT_ID: 1, USER_ID: authUser.USER_ID, supportKey: 0 }, systemLog);
                                    doSubscribe();
                                }
                            });
                        }, err => {
                            if (err) { mm.rollbackConnection(conn); return nextCust(err); }
                            mm.commitConnection(conn);
                            console.log('[bulkImport] Committed for', emailPayload.NAME);
                            results.push({ customer: emailPayload.NAME, status: 'ok' });
                            nextCust();
                        });

                        // }
                        //   ); // end sendWAToolSMS
                        // }); // end sendDynamicEmail
                    }); // end slotTasks
                }); // end customer_master insert
            }); // end email_master insert
        }); // end start tx
    }, err => {
        if (err) {
            console.error('[bulkImport] Import failed', err);
            return res.status(500).send({ code: 500, message: 'Import failed', detail: err.toString() });
        }
        console.log('[bulkImport] Import complete for all customers');
        res.send({ code: 200, message: 'Import complete', results });
    });
};


exports.bulkImportWORKING = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const authUser = req.body.UserData[0];
    console.log('[bulkImport] Starting import for user', authUser.USER_ID);

    // 1️⃣ Read workbook
    const filePath = path.join(__dirname, '../uploads/CustomerSheets/PockIT_Customer_Data.xlsx');
    console.log('[bulkImport] Reading Excel file:', filePath);
    let wb;
    try {
        wb = xlsx.readFile(filePath);
    } catch (e) {
        console.error('[bulkImport] Failed to read Excel:', e);
        return res.status(500).send({ code: 500, message: 'Could not read Excel file', detail: e.toString() });
    }

    // 2️⃣ Parse sheets
    const custRows = xlsx.utils.sheet_to_json(wb.Sheets['customer'] || {});
    const addrRows = xlsx.utils.sheet_to_json(wb.Sheets['customerAddress'] || {});
    console.log(`[bulkImport] Parsed ${custRows.length} customers and ${addrRows.length} addresses`);

    // 3️⃣ Index addresses by mobile
    const addrsByMobile = addrRows.reduce((acc, r) => {
        const m = String(r['Mobile No From Customer Sheet']).trim();
        (acc[m] = acc[m] || []).push(r);
        return acc;
    }, {});

    const results = [];
    async.eachSeries(custRows, (row, nextCust) => {
        console.log('[bulkImport] Processing customer row:', row['Customer Name']);
        const conn = mm.openConnection();

        mm.executeDML('START TRANSACTION;', [], supportKey, conn, err => {
            if (err) {
                console.error('[bulkImport] TX START failed', err);
                return nextCust(err);
            }

            // ─── Build customer_email_master payload ─────────────────────────────
            const pwd = md5(generateRandomAlphanumeric());
            const emailPayload = {
                CUSTOMER_CATEGORY_ID: row['Customer Category Name'] === 'Individual' ? 1 : 2,
                CUSTOMER_TYPE: row['Customer Type'] === 'B2B' ? 'B' : 'I',
                NAME: row['Customer Name'],
                EMAIL: row['Email'],
                SALUTATION: row['Salutation'],
                MOBILE_NO: String(row['Mobile Number']),
                COMPANY_NAME: row['Company name'],
                ALTERNATE_MOBILE_NO: String(row['Alternate Mobile Number']),
                PAN: row['PAN Number'],
                GST_NO: row['GST Number'],
                COUNTRY_CODE: String(row['Country Code']),
                ALTCOUNTRY_CODE: String(row['Altername Country Code']),
                IS_SPECIAL_CATALOGUE: row['Is Have Spacial Catlouge'] === 'Yes' ? '1' : '0',
                SHORT_CODE: row['Short Code'],
                PASSWORD: pwd,
                REGISTRATION_DATE: mm.getSystemDate(),
                CLIENT_ID: 1,
                IS_PARENT: 1,
                ACCOUNT_STATUS: '1'
            };
            console.log('[bulkImport] Inserting email master for', emailPayload.NAME);

            mm.executeDML('INSERT INTO customer_email_master SET ?', emailPayload, supportKey, conn, (err, emailRes) => {
                if (err) {
                    console.error('[bulkImport] email_master INSERT failed', err);
                    mm.rollbackConnection(conn);
                    return nextCust(err);
                }
                console.log('[bulkImport] Inserted email_master ID=', emailRes.insertId);

                // ─── Build & insert customer_master ─────────────────────────────────
                const custPayload = Object.assign({
                    CUSTOMER_DETAILS_ID: emailRes.insertId,
                    CLIENT_ID: 1,
                    IS_PARENT: 1,
                    ACCOUNT_STATUS: '1'
                }, emailPayload);
                console.log('[bulkImport] Inserting customer master for', custPayload.NAME);

                mm.executeDML('INSERT INTO customer_master SET ?', custPayload, supportKey, conn, (err, masterRes) => {
                    if (err) {
                        console.error('[bulkImport] customer_master INSERT failed', err);
                        mm.rollbackConnection(conn);
                        return nextCust(err);
                    }
                    console.log('[bulkImport] Inserted customer_master ID=', masterRes.insertId);

                    const customerId = masterRes.insertId;
                    const customerDetails = emailRes.insertId;

                    // ─── (Optional) B2B time‑slot mapping ────────────────────────────────
                    const slotTasks = [];
                    if (emailPayload.CUSTOMER_TYPE === 'B') {
                        slotTasks.push(cb => {
                            console.log('[bulkImport] Mapping time‑slots for', customerId);
                            const sql = `
                INSERT INTO global_time_slots_mapping
                  (ORG_ID,MAPPING_FOR,MAPPING_ID,
                   SLOT1_START_TIME,SLOT1_END_TIME,
                   SLOT2_START_TIME,SLOT2_END_TIME,
                   SLOT3_START_TIME,SLOT3_END_TIME,
                   CLIENT_ID,CUSTOMER_DETAILS_ID)
                SELECT
                  0,'C',?,gs.SLOT1_START_TIME,gs.SLOT1_END_TIME,
                  gs.SLOT2_START_TIME,gs.SLOT2_END_TIME,
                  gs.SLOT3_START_TIME,gs.SLOT3_END_TIME,
                  1,?
                FROM global_timeslots_settings gs
                ORDER BY gs.ID DESC LIMIT 1;`;
                            mm.executeDML(sql, [customerId, customerDetails], supportKey, conn, cb);
                        });
                    }

                    async.series(slotTasks, err => {
                        if (err) {
                            console.error('[bulkImport] Time‑slot mapping failed', err);
                            mm.rollbackConnection(conn);
                            return nextCust(err);
                        }

                        // ─── createCustomer side‑effects ──────────────────────────────────

                        const uname = authUser.NAME || authUser.USER_NAME;
                        console.log(`[bulkImport] Logging creation event for user ${uname}`);
                        dbm.saveLog({
                            SOURCE_ID: emailRes.insertId,
                            LOG_DATE_TIME: mm.getSystemDate(),
                            LOG_TEXT: `User ${uname} created customer ${emailPayload.NAME}`,
                            CATEGORY: 'customer',
                            CLIENT_ID: 1,
                            USER_ID: authUser.USER_ID,
                            supportKey,
                            CUSTOMER_DETAILS_ID: customerDetails
                        }, systemLog);

                        console.log('[bulkImport] Subscribing customer channels for', customerId);
                        ['customer_channel', 'system_alerts_channel', `customer_${customerId}_channel`]
                            .forEach(ch => new channelSubscribedUsers({
                                CHANNEL_NAME: ch,
                                USER_ID: customerId,
                                TYPE: 'C',
                                STATUS: true,
                                USER_NAME: emailPayload.NAME,
                                CLIENT_ID: 1,
                                DATE: mm.getSystemDate()
                            }).save());
                        // ─── insert addresses ────────────────────────────────────────────
                        const myAddrs = addrsByMobile[emailPayload.MOBILE_NO] || [];
                        console.log(`[bulkImport] Found ${myAddrs.length} addresses for ${emailPayload.MOBILE_NO}`);
                        async.eachSeries(myAddrs, (r, cbAddr) => {
                            // // build full address payload
                            // const aBody = {
                            //     CUSTOMER_ID: customerId,
                            //     CUSTOMER_DETAILS_ID: customerDetails,
                            //     CLIENT_ID: 1,
                            //     STATUS: '1',
                            //     CONTACT_PERSON_NAME: r['Contact Person Name'],
                            //     MOBILE_NO: String(r['Contact Person Mobile Number']),
                            //     EMAIL_ID: r['Contact Person Email'],
                            //     ADDRESS_LINE_1: r['Address Line 1'],
                            //     ADDRESS_LINE_2: r['Address Line 2'],
                            //     GEO_LOCATION: r['Geo Location'],
                            //     TYPE: r['Type'] === 'Work' ? 'W' : r['Type'] === 'Home' ? 'H' : 'O',
                            //     IS_DEFAULT: r['Is Default Address'] === 'Yes' ? 1 : 0,
                            //     LANDMARK: r['Landmark'],
                            //     HOUSE_NO: r['House Number'],
                            //     BUILDING: r['Bulding'],
                            //     FLOOR: r['Floor'],
                            //     PINCODE: r['Pincode'],
                            //     CITY_NAME: r['City Name'],
                            //     STATE_ID: r['State ID'],
                            //     COUNTRY_ID: r['Country ID'] || r['Country Code'],
                            //     PINCODE_ID: r['Pincode ID'],
                            //     COUNTRY_ID: null, STATE_ID: null, PINCODE_ID: null, DISTRICT_ID: null, PINCODE_FOR: null,
                            // };
                            // console.log('[bulkImport] Inserting address for', aBody.CONTACT_PERSON_NAME);

                            const pin = String(r['Pincode']).trim();

                            mm.executeQueryData(
                                'SELECT ID AS PINCODE_ID, COUNTRY_ID, STATE_ID, DISTRICT_ID, PINCODE_FOR FROM pincode_master WHERE PINCODE = ? LIMIT 1',
                                [pin],
                                supportKey,
                                (err, pinRes) => {
                                    if (err) {
                                        console.error('[bulkImport] Failed to fetch postal code details:', pin, err);
                                        return cbAddr(err);
                                    }

                                    const pinData = pinRes[0] || {};

                                    const aBody = {
                                        CUSTOMER_ID: customerId,
                                        CUSTOMER_DETAILS_ID: customerDetails,
                                        CLIENT_ID: 1,
                                        STATUS: '1',
                                        CONTACT_PERSON_NAME: r['Contact Person Name'],
                                        MOBILE_NO: String(r['Contact Person Mobile Number']),
                                        EMAIL_ID: r['Contact Person Email'],
                                        ADDRESS_LINE_1: r['Address Line 1'],
                                        ADDRESS_LINE_2: r['Address Line 2'],
                                        GEO_LOCATION: r['Geo Location'],
                                        TYPE: r['Type'] === 'Work' ? 'W' : r['Type'] === 'Home' ? 'H' : 'O',
                                        IS_DEFAULT: r['Is Default Address'] === 'Yes' ? 1 : 0,
                                        LANDMARK: r['Landmark'],
                                        HOUSE_NO: r['House Number'],
                                        BUILDING: r['Bulding'],
                                        FLOOR: r['Floor'],
                                        PINCODE: pin,
                                        CITY_NAME: r['City Name'],
                                        STATE_ID: pinData.STATE_ID || null,
                                        COUNTRY_ID: pinData.COUNTRY_ID || null,
                                        DISTRICT_ID: pinData.DISTRICT_ID || null,
                                        PINCODE_ID: pinData.PINCODE_ID || null,
                                        PINCODE_FOR: pinData.PINCODE_FOR || null
                                    };

                                    console.log('[bulkImport] Inserting address for', aBody.CONTACT_PERSON_NAME);

                                    mm.executeQueryData('INSERT INTO customer_address_master SET ?', aBody, supportKey, (err, addrRes) => {
                                        if (err) {
                                            console.error('[bulkImport] address INSERT failed', err);
                                            return cbAddr(err);
                                        }
                                        console.log('[bulkImport] Address ID=', addrRes.insertId);

                                        // run your createAddress IF/ELSE logic:
                                        const du = Object.assign({ ID: addrRes.insertId }, aBody);
                                        const uname2 = authUser.NAME || authUser.USER_NAME;
                                        const doSubscribe = () => {
                                            const chans = [
                                                `promotion_state_${du.STATE_ID}_channel`,
                                                `promotion_country_${du.COUNTRY_ID}_channel`,
                                                `pincode_${du.PINCODE_ID}_channel`
                                            ];
                                            let subscribed = [];
                                            function sub(ch) {
                                                const d = {
                                                    CHANNEL_NAME: ch,
                                                    USER_ID: du.CUSTOMER_ID,
                                                    TYPE: 'C',
                                                    STATUS: true,
                                                    USER_NAME: uname2,
                                                    CLIENT_ID: du.CLIENT_ID,
                                                    DATE: mm.getSystemDate()
                                                };
                                                new channelSubscribedUsers(d).save();
                                                subscribed.push(d);
                                            }
                                            // nested findOne
                                            channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[0], USER_ID: du.CUSTOMER_ID })
                                                .then(r0 => { if (!r0) sub(chans[0]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[1], USER_ID: du.CUSTOMER_ID }); })
                                                .then(r1 => { if (!r1) sub(chans[1]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[2], USER_ID: du.CUSTOMER_ID }); })
                                                .then(r2 => { if (!r2) sub(chans[2]); cbAddr(null, subscribed); })
                                                .catch(e => cbAddr(e));
                                        };

                                        if (du.IS_DEFAULT) {
                                            console.log('[bulkImport] IS_DEFAULT=1, clearing others');
                                            mm.executeQueryData(
                                                `UPDATE customer_address_master
                        SET IS_DEFAULT=0, CREATED_MODIFIED_DATE=?
                      WHERE ID!=? AND CUSTOMER_ID=?`,
                                                [mm.getSystemDate(), addrRes.insertId, du.CUSTOMER_ID],
                                                supportKey,
                                                err => {
                                                    if (err) {
                                                        console.error('[bulkImport] clear defaults failed', err);
                                                        return cbAddr(err);
                                                    }
                                                    // log action
                                                    dbm.saveLog({
                                                        SOURCE_ID: addrRes.insertId,
                                                        LOG_DATE_TIME: mm.getSystemDate(),
                                                        LOG_TEXT: `User ${uname2} has created a new address.`,
                                                        CATEGORY: 'customer address',
                                                        CLIENT_ID: 1,
                                                        USER_ID: authUser.USER_ID,
                                                        supportKey: 0
                                                    }, systemLog);
                                                    doSubscribe();
                                                }
                                            );
                                        } else {
                                            console.log('[bulkImport] IS_DEFAULT=0, just logging + subscribing');
                                            dbm.saveLog({
                                                SOURCE_ID: addrRes.insertId,
                                                LOG_DATE_TIME: mm.getSystemDate(),
                                                LOG_TEXT: `User ${uname2} has created new address.`,
                                                CATEGORY: 'customer address',
                                                CLIENT_ID: 1,
                                                USER_ID: authUser.USER_ID,
                                                supportKey: 0
                                            }, systemLog);
                                            doSubscribe();
                                        }
                                    });
                                }, err => {
                                    if (err) {
                                        console.error('[bulkImport] Error in addresses loop', err);
                                        mm.rollbackConnection(conn);
                                        return nextCust(err);
                                    }
                                    console.log('[bulkImport] Committing transaction for', emailPayload.NAME);
                                    mm.commitConnection(conn);
                                    results.push({ customer: emailPayload.NAME, status: 'ok' });
                                    nextCust();
                                });
                        });
                    }); // end addresses
                }); // end customer_master
            }); // end email_master
        }); // end START TRANSACTION
    }, err => {
        if (err) {
            console.error('[bulkImport] Import failed', err);
            return res.status(500).send({ code: 500, message: 'Import failed', detail: err.toString() });
        }
        console.log('[bulkImport] Import complete for all customers');
        res.send({ code: 200, message: 'Import complete', results });
    });
};

exports.bulkImportLates_working = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const authUser = req.body.UserData[0];
    console.log('[bulkImport] Starting import for user', authUser.USER_ID);

    // 1️⃣ Read workbook
    const filePath = path.join(__dirname, '../uploads/CustomerSheets/PockIT_Customer_Data.xlsx');
    console.log('[bulkImport] Reading Excel file:', filePath);
    let wb;
    try {
        wb = xlsx.readFile(filePath);
    } catch (e) {
        console.error('[bulkImport] Failed to read Excel:', e);
        return res.status(500).send({ code: 500, message: 'Could not read Excel file', detail: e.toString() });
    }

    // 2️⃣ Parse sheets
    const custRows = xlsx.utils.sheet_to_json(wb.Sheets['customer'] || {});
    const addrRows = xlsx.utils.sheet_to_json(wb.Sheets['customerAddress'] || {});
    console.log(`[bulkImport] Parsed ${custRows.length} customers and ${addrRows.length} addresses`);

    // 3️⃣ Index addresses by mobile
    const addrsByMobile = addrRows.reduce((acc, r) => {
        const m = String(r['Mobile No From Customer Sheet']).trim();
        (acc[m] = acc[m] || []).push(r);
        return acc;
    }, {});

    const results = [];
    async.eachSeries(custRows, (row, nextCust) => {
        console.log('[bulkImport] Processing customer row:', row['Customer Name']);
        const conn = mm.openConnection();

        // New logic to check pincode before starting the transaction
        const myAddrs = addrsByMobile[String(row['Mobile Number']).trim()] || [];
        const addressTasks = myAddrs.map(r => cb => {
            const pin = String(r['Pincode']).trim();
            mm.executeQueryData(
                'SELECT ID AS PINCODE_ID, COUNTRY_ID, STATE AS STATE_ID, DISTRICT AS DISTRICT_ID, PINCODE_FOR FROM pincode_master WHERE PINCODE = ? LIMIT 1',
                [pin],
                supportKey,
                (err, pinRes) => {
                    if (err) {
                        return cb(err);
                    }
                    if (!pinRes || pinRes.length === 0) {
                        return cb(new Error(`Pincode ${pin} not found for customer ${row['Customer Name']}`));
                    }
                    cb(null, pinRes[0]);
                }
            );
        });

        // Use async.series to check all addresses for the current customer
        async.series(addressTasks, (err, pinResults) => {
            if (err) {
                console.warn(`[bulkImport] Skipping customer ${row['Customer Name']} due to postal code validation failure:`, err.message);
                mm.rollbackConnection(conn);
                results.push({ customer: row['Customer Name'], status: 'skipped', reason: err.message });
                return nextCust();
            }

            // Pincode validation passed, proceed with the original logic
            mm.executeDML('START TRANSACTION;', [], supportKey, conn, err => {
                if (err) {
                    console.error('[bulkImport] TX START failed', err);
                    mm.rollbackConnection(conn); // Close connection on error
                    return nextCust(err);
                }

                // ─── Build customer_email_master payload ─────────────────────────────
                const pwd = md5(generateRandomAlphanumeric());
                const emailPayload = {
                    CUSTOMER_CATEGORY_ID: row['Customer Category Name'] === 'Individual' ? 1 : 2,
                    CUSTOMER_TYPE: row['Customer Type'] === 'B2B' ? 'B' : 'I',
                    NAME: row['Customer Name'],
                    EMAIL: row['Email'],
                    SALUTATION: row['Salutation'],
                    MOBILE_NO: String(row['Mobile Number']),
                    COMPANY_NAME: row['Company name'],
                    ALTERNATE_MOBILE_NO: String(row['Alternate Mobile Number']),
                    PAN: row['PAN Number'],
                    GST_NO: row['GST Number'],
                    COUNTRY_CODE: String(row['Country Code']),
                    ALTCOUNTRY_CODE: String(row['Altername Country Code']),
                    IS_SPECIAL_CATALOGUE: row['Is Have Spacial Catlouge'] === 'Yes' ? '1' : '0',
                    SHORT_CODE: row['Short Code'],
                    PASSWORD: pwd,
                    REGISTRATION_DATE: mm.getSystemDate(),
                    CLIENT_ID: 1,
                    IS_PARENT: 1,
                    ACCOUNT_STATUS: '1'
                };
                console.log('[bulkImport] Inserting email master for', emailPayload.NAME);

                mm.executeDML('INSERT INTO customer_email_master SET ?', emailPayload, supportKey, conn, (err, emailRes) => {
                    if (err) {
                        console.error('[bulkImport] email_master INSERT failed', err);
                        mm.rollbackConnection(conn);
                        return nextCust(err);
                    }
                    console.log('[bulkImport] Inserted email_master ID=', emailRes.insertId);

                    // ─── Build & insert customer_master ─────────────────────────────────
                    const custPayload = Object.assign({
                        CUSTOMER_DETAILS_ID: emailRes.insertId,
                        CLIENT_ID: 1,
                        IS_PARENT: 1,
                        ACCOUNT_STATUS: '1'
                    }, emailPayload);
                    console.log('[bulkImport] Inserting customer master for', custPayload.NAME);

                    mm.executeDML('INSERT INTO customer_master SET ?', custPayload, supportKey, conn, (err, masterRes) => {
                        if (err) {
                            console.error('[bulkImport] customer_master INSERT failed', err);
                            mm.rollbackConnection(conn);
                            return nextCust(err);
                        }
                        console.log('[bulkImport] Inserted customer_master ID=', masterRes.insertId);

                        const customerId = masterRes.insertId;
                        const customerDetails = emailRes.insertId;

                        // ─── (Optional) B2B time‑slot mapping ────────────────────────────────
                        const slotTasks = [];
                        if (emailPayload.CUSTOMER_TYPE === 'B') {
                            slotTasks.push(cb => {
                                console.log('[bulkImport] Mapping time‑slots for', customerId);
                                const sql = `
                                    INSERT INTO global_time_slots_mapping
                                    (ORG_ID,MAPPING_FOR,MAPPING_ID,
                                    SLOT1_START_TIME,SLOT1_END_TIME,
                                    SLOT2_START_TIME,SLOT2_END_TIME,
                                    SLOT3_START_TIME,SLOT3_END_TIME,
                                    CLIENT_ID,CUSTOMER_DETAILS_ID)
                                    SELECT
                                    0,'C',?,gs.SLOT1_START_TIME,gs.SLOT1_END_TIME,
                                    gs.SLOT2_START_TIME,gs.SLOT2_END_TIME,
                                    gs.SLOT3_START_TIME,gs.SLOT3_END_TIME,
                                    1,?
                                    FROM global_timeslots_settings gs
                                    ORDER BY gs.ID DESC LIMIT 1;`;
                                mm.executeDML(sql, [customerId, customerDetails], supportKey, conn, cb);
                            });
                        }

                        async.series(slotTasks, err => {
                            if (err) {
                                console.error('[bulkImport] Time‑slot mapping failed', err);
                                mm.rollbackConnection(conn);
                                return nextCust(err);
                            }

                            // ─── createCustomer side‑effects ──────────────────────────────────
                            const uname = authUser.NAME || authUser.USER_NAME;
                            console.log(`[bulkImport] Logging creation event for user ${uname}`);
                            dbm.saveLog({
                                SOURCE_ID: emailRes.insertId,
                                LOG_DATE_TIME: mm.getSystemDate(),
                                LOG_TEXT: `User ${uname} created customer ${emailPayload.NAME}`,
                                CATEGORY: 'customer',
                                CLIENT_ID: 1,
                                USER_ID: authUser.USER_ID,
                                supportKey,
                                CUSTOMER_DETAILS_ID: customerDetails
                            }, systemLog);

                            console.log('[bulkImport] Subscribing customer channels for', customerId);
                            ['customer_channel', 'system_alerts_channel', `customer_${customerId}_channel`]
                                .forEach(ch => new channelSubscribedUsers({
                                    CHANNEL_NAME: ch,
                                    USER_ID: customerId,
                                    TYPE: 'C',
                                    STATUS: true,
                                    USER_NAME: emailPayload.NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }).save());

                            // ─── insert addresses ────────────────────────────────────────────
                            console.log(`[bulkImport] Found ${myAddrs.length} addresses for ${emailPayload.MOBILE_NO}`);

                            // Use async.eachOfSeries to get the index along with the row
                            async.eachOfSeries(myAddrs, (r, index, cbAddr) => {
                                // Correctly get the pincode data using the index
                                const pinData = pinResults[index];
                                console.log('[bulkImport] Using Pincode Data:', pinData);

                                const pin = String(r['Pincode']).trim();
                                const aBody = {
                                    CUSTOMER_ID: customerId,
                                    CUSTOMER_DETAILS_ID: customerDetails,
                                    CLIENT_ID: 1,
                                    STATUS: '1',
                                    CONTACT_PERSON_NAME: r['Contact Person Name'],
                                    MOBILE_NO: String(r['Contact Person Mobile Number']),
                                    EMAIL_ID: r['Contact Person Email'],
                                    ADDRESS_LINE_1: r['Address Line 1'],
                                    ADDRESS_LINE_2: r['Address Line 2'],
                                    GEO_LOCATION: r['Geo Location'],
                                    TYPE: r['Type'] === 'Work' ? 'W' : r['Type'] === 'Home' ? 'H' : 'O',
                                    IS_DEFAULT: r['Is Default Address'] === 'Yes' ? 1 : 0,
                                    LANDMARK: r['Landmark'],
                                    HOUSE_NO: r['House Number'],
                                    BUILDING: r['Bulding'],
                                    FLOOR: r['Floor'],
                                    PINCODE: pin,
                                    CITY_NAME: r['City Name'],
                                    STATE_ID: pinData.STATE_ID || null,
                                    COUNTRY_ID: pinData.COUNTRY_ID || null,
                                    DISTRICT_ID: pinData.DISTRICT_ID || null,
                                    PINCODE_ID: pinData.PINCODE_ID || null,
                                    PINCODE_FOR: pinData.PINCODE_FOR || null
                                };

                                console.log('[bulkImport] Inserting address for', aBody.CONTACT_PERSON_NAME);

                                mm.executeQueryData('INSERT INTO customer_address_master SET ?', aBody, supportKey, (err, addrRes) => {
                                    if (err) {
                                        console.error('[bulkImport] address INSERT failed', err);
                                        return cbAddr(err);
                                    }
                                    console.log('[bulkImport] Address ID=', addrRes.insertId);

                                    const du = Object.assign({ ID: addrRes.insertId }, aBody);
                                    const uname2 = authUser.NAME || authUser.USER_NAME;
                                    const doSubscribe = () => {
                                        const chans = [
                                            `promotion_state_${du.STATE_ID}_channel`,
                                            `promotion_country_${du.COUNTRY_ID}_channel`,
                                            `pincode_${du.PINCODE_ID}_channel`
                                        ];
                                        let subscribed = [];
                                        function sub(ch) {
                                            const d = {
                                                CHANNEL_NAME: ch,
                                                USER_ID: du.CUSTOMER_ID,
                                                TYPE: 'C',
                                                STATUS: true,
                                                USER_NAME: uname2,
                                                CLIENT_ID: du.CLIENT_ID,
                                                DATE: mm.getSystemDate()
                                            };
                                            new channelSubscribedUsers(d).save();
                                            subscribed.push(d);
                                        }

                                        channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[0], USER_ID: du.CUSTOMER_ID })
                                            .then(r0 => { if (!r0) sub(chans[0]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[1], USER_ID: du.CUSTOMER_ID }); })
                                            .then(r1 => { if (!r1) sub(chans[1]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[2], USER_ID: du.CUSTOMER_ID }); })
                                            .then(r2 => { if (!r2) sub(chans[2]); cbAddr(null, subscribed); })
                                            .catch(e => cbAddr(e));
                                    };

                                    if (du.IS_DEFAULT) {
                                        console.log('[bulkImport] IS_DEFAULT=1, clearing others');
                                        mm.executeQueryData(
                                            `UPDATE customer_address_master
                                                SET IS_DEFAULT=0, CREATED_MODIFIED_DATE=?
                                                WHERE ID!=? AND CUSTOMER_ID=?`,
                                            [mm.getSystemDate(), addrRes.insertId, du.CUSTOMER_ID],
                                            supportKey,
                                            err => {
                                                if (err) {
                                                    console.error('[bulkImport] clear defaults failed', err);
                                                    return cbAddr(err);
                                                }
                                                dbm.saveLog({
                                                    SOURCE_ID: addrRes.insertId,
                                                    LOG_DATE_TIME: mm.getSystemDate(),
                                                    LOG_TEXT: `User ${uname2} has created a new address.`,
                                                    CATEGORY: 'customer address',
                                                    CLIENT_ID: 1,
                                                    USER_ID: authUser.USER_ID,
                                                    supportKey: 0
                                                }, systemLog);
                                                doSubscribe();
                                            }
                                        );
                                    } else {
                                        console.log('[bulkImport] IS_DEFAULT=0, just logging + subscribing');
                                        dbm.saveLog({
                                            SOURCE_ID: addrRes.insertId,
                                            LOG_DATE_TIME: mm.getSystemDate(),
                                            LOG_TEXT: `User ${uname2} has created new address.`,
                                            CATEGORY: 'customer address',
                                            CLIENT_ID: 1,
                                            USER_ID: authUser.USER_ID,
                                            supportKey: 0
                                        }, systemLog);
                                        doSubscribe();
                                    }
                                });
                            }, err => {
                                if (err) {
                                    console.error('[bulkImport] Error in addresses loop', err);
                                    mm.rollbackConnection(conn);
                                    return nextCust(err);
                                }
                                console.log('[bulkImport] Committing transaction for', emailPayload.NAME);
                                mm.commitConnection(conn);
                                results.push({ customer: emailPayload.NAME, status: 'ok' });
                                nextCust();
                            });
                        }); // end addresses
                    }); // end customer_master
                }); // end email_master
            }); // end START TRANSACTION
        }); // end pincode check series
    }, err => {
        if (err) {
            console.error('[bulkImport] Import failed', err);
            return res.status(500).send({ code: 500, message: 'Import failed', detail: err.toString() });
        }
        console.log('[bulkImport] Import complete for all customers');
        res.send({ code: 200, message: 'Import complete', results });
    });
};

// for adding logs
function logUploadResult({ name, email, mobile, isSuccess, reason, supportKey }) {
    const logData = {
        CUSTOMER_NAME: name || null,
        EMAIL_ID: email || null,
        MOBILE_NUMBER: mobile || null,
        IS_SUCCESS: isSuccess ? 1 : 0,
        REASON: reason || null,
        CREATED_MODIFIED_DATE: mm.getSystemDate()
    };
    mm.executeQueryData('INSERT INTO customer_excel_upload_logs SET ?', logData, supportKey, err => {
        if (err) console.error('[logUploadResult] Failed to log result for', name, err);
        else console.log('[logUploadResult] Logged result for', name);
    });
}

exports.bulkImport = (req, res) => {
    const supportKey = req.headers['supportkey'];
    const authUser = req.body.UserData[0];
    console.log('[bulkImport] Starting import for user', authUser.USER_ID);

    const filePath = path.join(__dirname, '../uploads/CustomerSheets/customernew.xlsx');
    console.log('[bulkImport] Reading Excel file:', filePath);
    let wb;
    try {
        wb = xlsx.readFile(filePath);
    } catch (e) {
        console.error('[bulkImport] Failed to read Excel:', e);
        return res.status(500).send({ code: 500, message: 'Could not read Excel file', detail: e.toString() });
    }

    const custRows = xlsx.utils.sheet_to_json(wb.Sheets['customer'] || {});
    const addrRows = xlsx.utils.sheet_to_json(wb.Sheets['customerAddress'] || {});
    console.log(`[bulkImport] Parsed ${custRows.length} customers and ${addrRows.length} addresses`);

    const addrsByMobile = addrRows.reduce((acc, r) => {
        const m = String(r['Mobile No From Customer Sheet']).trim();
        (acc[m] = acc[m] || []).push(r);
        return acc;
    }, {});

    const results = [];
    async.eachSeries(custRows, (row, nextCust) => {
        console.log('[bulkImport] Processing customer row:', row['Customer Name']);
        const conn = mm.openConnection();
        const myAddrs = addrsByMobile[String(row['Mobile Number']).trim()] || [];

        const addressTasks = myAddrs.map(r => cb => {
            const pin = String(r['Pincode']).trim();
            mm.executeQueryData(
                'SELECT ID AS PINCODE_ID, COUNTRY_ID, STATE AS STATE_ID, DISTRICT AS DISTRICT_ID, PINCODE_FOR FROM pincode_master WHERE PINCODE = ? LIMIT 1',
                [pin],
                supportKey,
                (err, pinRes) => {
                    if (err) return cb(err);
                    if (!pinRes || pinRes.length === 0) {
                        return cb(new Error(`Pincode ${pin} not found for customer ${row['Customer Name']}`));
                    }
                    cb(null, pinRes[0]);
                }
            );
        });

        async.series(addressTasks, (err, pinResults) => {
            if (err) {
                console.warn(`[bulkImport] Skipping customer ${row['Customer Name']} due to postal code validation failure:`, err.message);
                mm.rollbackConnection(conn);

                // logUploadResult({
                //     name: row['Customer Name'],
                //     email: row['Email'],
                //     mobile: String(row['Mobile Number']),
                //     isSuccess: false,
                //     reason: `Pincode validation failed: ${err.message}`,
                //     supportKey
                // });

                results.push({ customer: row['Customer Name'], status: 'skipped', reason: err.message });
                return nextCust();
            }

            mm.executeDML('START TRANSACTION;', [], supportKey, conn, err => {
                if (err) {
                    console.error('[bulkImport] TX START failed', err);
                    mm.rollbackConnection(conn);
                    return nextCust(err);
                }

                const pwd = md5(generateRandomAlphanumeric());
                const emailPayload = {
                    CUSTOMER_CATEGORY_ID: row['Customer Category Name'] === 'Individual' ? 1 : 2,
                    CUSTOMER_TYPE: row['Customer Type'] === 'B2B' ? 'B' : 'I',
                    NAME: row['Customer Name'],
                    EMAIL: row['Email'],
                    SALUTATION: row['Salutation'],
                    MOBILE_NO: String(row['Mobile Number']),
                    COMPANY_NAME: row['Company name'],
                    ALTERNATE_MOBILE_NO: String(row['Alternate Mobile Number']) || null,
                    PAN: row['PAN Number'],
                    GST_NO: row['GST Number'],
                    // COUNTRY_CODE: String(row['Country Code']),
                    // ALTCOUNTRY_CODE: String(row['Altername Country Code']),
                    COUNTRY_CODE: row['Country Code'] ? `+${String(row['Country Code']).replace(/^\+/, '')}` : null,
                    ALTCOUNTRY_CODE: row['Altername Country Code'] ? `+${String(row['Altername Country Code']).replace(/^\+/, '')}` : null,
                    IS_SPECIAL_CATALOGUE: row['Is Have Spacial Catlouge'] === 'Yes' ? '1' : '0',
                    SHORT_CODE: row['Short Code'],
                    PASSWORD: pwd,
                    REGISTRATION_DATE: mm.getSystemDate(),
                    CLIENT_ID: 1,
                    IS_PARENT: 1,
                    ACCOUNT_STATUS: '1'
                };
                console.log('[bulkImport] Inserting email master for', emailPayload.NAME);
                console.log('row\n\n\n\n\n', row['Row no.']);
                if (row.Row_no === undefined) {
                    mm.executeDML('INSERT INTO customer_email_master SET ?', emailPayload, supportKey, conn, (err, emailRes) => {
                        if (err) {
                            console.error('[bulkImport] email_master INSERT failed', err);

                            // logUploadResult({
                            //     name: emailPayload.NAME,
                            //     email: emailPayload.EMAIL,
                            //     mobile: emailPayload.MOBILE_NO,
                            //     isSuccess: false,
                            //     reason: `Email insert failed: ${err.message}`,
                            //     supportKey
                            // });

                            mm.rollbackConnection(conn);
                            return nextCust(err);
                        }

                        const custPayload = Object.assign({
                            CUSTOMER_DETAILS_ID: emailRes.insertId,
                            CLIENT_ID: 1,
                            IS_PARENT: 1,
                            ACCOUNT_STATUS: '1'
                        }, emailPayload);

                        mm.executeDML('INSERT INTO customer_master SET ?', custPayload, supportKey, conn, (err, masterRes) => {
                            if (err) {
                                console.error('[bulkImport] customer_master INSERT failed', err);
                                mm.rollbackConnection(conn);
                                return nextCust(err);
                            }

                            const customerId = masterRes.insertId;
                            const customerDetails = emailRes.insertId;

                            const slotTasks = [];
                            if (emailPayload.CUSTOMER_TYPE === 'B') {
                                slotTasks.push(cb => {
                                    const sql = `
                                    INSERT INTO global_time_slots_mapping
                                    (ORG_ID,MAPPING_FOR,MAPPING_ID,
                                    SLOT1_START_TIME,SLOT1_END_TIME,
                                    SLOT2_START_TIME,SLOT2_END_TIME,
                                    SLOT3_START_TIME,SLOT3_END_TIME,
                                    CLIENT_ID,CUSTOMER_DETAILS_ID)
                                    SELECT
                                    0,'C',?,gs.SLOT1_START_TIME,gs.SLOT1_END_TIME,
                                    gs.SLOT2_START_TIME,gs.SLOT2_END_TIME,
                                    gs.SLOT3_START_TIME,gs.SLOT3_END_TIME,
                                    1,?
                                    FROM global_timeslots_settings gs
                                    ORDER BY gs.ID DESC LIMIT 1;`;
                                    mm.executeDML(sql, [customerId, customerDetails], supportKey, conn, cb);
                                });
                            }

                            async.series(slotTasks, err => {
                                if (err) {
                                    console.error('[bulkImport] Time‑slot mapping failed', err);
                                    mm.rollbackConnection(conn);
                                    return nextCust(err);
                                }

                                const uname = authUser.NAME || authUser.USER_NAME;
                                dbm.saveLog({
                                    SOURCE_ID: emailRes.insertId,
                                    LOG_DATE_TIME: mm.getSystemDate(),
                                    LOG_TEXT: `User ${uname} created customer ${emailPayload.NAME}`,
                                    CATEGORY: 'customer',
                                    CLIENT_ID: 1,
                                    USER_ID: authUser.USER_ID,
                                    supportKey,
                                    CUSTOMER_DETAILS_ID: customerDetails
                                }, systemLog);

                                ['customer_channel', 'system_alerts_channel', `customer_${customerId}_channel`]
                                    .forEach(ch => new channelSubscribedUsers({
                                        CHANNEL_NAME: ch,
                                        USER_ID: customerId,
                                        TYPE: 'C',
                                        STATUS: true,
                                        USER_NAME: emailPayload.NAME,
                                        CLIENT_ID: 1,
                                        DATE: mm.getSystemDate()
                                    }).save());

                                async.eachOfSeries(myAddrs, (r, index, cbAddr) => {
                                    const pinData = pinResults[index];

                                    const aBody = {
                                        CUSTOMER_ID: customerId,
                                        CUSTOMER_DETAILS_ID: customerDetails,
                                        CLIENT_ID: 1,
                                        STATUS: '1',
                                        CONTACT_PERSON_NAME: r['Contact Person Name'],
                                        MOBILE_NO: String(r['Contact Person Mobile Number']),
                                        EMAIL_ID: r['Contact Person Email'],
                                        ADDRESS_LINE_1: r['Address Line 1'],
                                        ADDRESS_LINE_2: r['Address Line 2'],
                                        GEO_LOCATION: r['Geo Location'],
                                        TYPE: r['Type'] === 'Work' ? 'W' : r['Type'] === 'Home' ? 'H' : 'O',
                                        IS_DEFAULT: r['Is Default Address'] === 'Yes' ? 1 : 0,
                                        LANDMARK: r['Landmark'] ? r['Landmark'] : null,
                                        HOUSE_NO: r['House Number'],
                                        BUILDING: r['Bulding'],
                                        FLOOR: r['Floor'] ? r['Floor'] : null,
                                        PINCODE: String(r['Pincode']).trim(),
                                        CITY_NAME: r['City Name'],
                                        STATE_ID: pinData.STATE_ID || null,
                                        COUNTRY_ID: pinData.COUNTRY_ID || null,
                                        DISTRICT_ID: pinData.DISTRICT_ID || null,
                                        PINCODE_ID: pinData.PINCODE_ID || null,
                                        PINCODE_FOR: pinData.PINCODE_FOR || null
                                    };

                                    mm.executeQueryData('INSERT INTO customer_address_master SET ?', aBody, supportKey, (err, addrRes) => {
                                        if (err) return cbAddr(err);

                                        const uname2 = authUser.NAME || authUser.USER_NAME;
                                        const du = Object.assign({ ID: addrRes.insertId }, aBody);
                                        const doSubscribe = () => {
                                            const chans = [
                                                `promotion_state_${du.STATE_ID}_channel`,
                                                `promotion_country_${du.COUNTRY_ID}_channel`,
                                                `pincode_${du.PINCODE_ID}_channel`
                                            ];
                                            let subscribed = [];
                                            function sub(ch) {
                                                const d = {
                                                    CHANNEL_NAME: ch,
                                                    USER_ID: du.CUSTOMER_ID,
                                                    TYPE: 'C',
                                                    STATUS: true,
                                                    USER_NAME: emailPayload.NAME,
                                                    CLIENT_ID: du.CLIENT_ID,
                                                    DATE: mm.getSystemDate()
                                                };
                                                new channelSubscribedUsers(d).save();
                                                subscribed.push(d);
                                            }

                                            channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[0], USER_ID: du.CUSTOMER_ID })
                                                .then(r0 => { if (!r0) sub(chans[0]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[1], USER_ID: du.CUSTOMER_ID }); })
                                                .then(r1 => { if (!r1) sub(chans[1]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[2], USER_ID: du.CUSTOMER_ID }); })
                                                .then(r2 => { if (!r2) sub(chans[2]); cbAddr(null, subscribed); })
                                                .catch(e => cbAddr(e));
                                        };

                                        if (du.IS_DEFAULT) {
                                            mm.executeQueryData(
                                                `UPDATE customer_address_master SET IS_DEFAULT=0, CREATED_MODIFIED_DATE=? WHERE ID!=? AND CUSTOMER_ID=?`,
                                                [mm.getSystemDate(), addrRes.insertId, du.CUSTOMER_ID],
                                                supportKey,
                                                err => {
                                                    if (err) return cbAddr(err);
                                                    dbm.saveLog({
                                                        SOURCE_ID: addrRes.insertId,
                                                        LOG_DATE_TIME: mm.getSystemDate(),
                                                        LOG_TEXT: `User ${uname2} has created a new address.`,
                                                        CATEGORY: 'customer address',
                                                        CLIENT_ID: 1,
                                                        USER_ID: authUser.USER_ID,
                                                        supportKey: 0
                                                    }, systemLog);
                                                    doSubscribe();
                                                }
                                            );
                                        } else {
                                            dbm.saveLog({
                                                SOURCE_ID: addrRes.insertId,
                                                LOG_DATE_TIME: mm.getSystemDate(),
                                                LOG_TEXT: `User ${uname2} has created new address.`,
                                                CATEGORY: 'customer address',
                                                CLIENT_ID: 1,
                                                USER_ID: authUser.USER_ID,
                                                supportKey: 0
                                            }, systemLog);
                                            doSubscribe();
                                        }
                                    });
                                }, err => {
                                    if (err) {
                                        mm.rollbackConnection(conn);
                                        return nextCust(err);
                                    }

                                    mm.commitConnection(conn);

                                    // logUploadResult({
                                    //     name: emailPayload.NAME,
                                    //     email: emailPayload.EMAIL,
                                    //     mobile: emailPayload.MOBILE_NO,
                                    //     isSuccess: true,
                                    //     supportKey
                                    // });

                                    results.push({ customer: emailPayload.NAME, status: 'ok' });
                                    nextCust();
                                });
                            });
                        });
                    });
                } else {
                    delete emailPayload.IS_PARENT;
                    const custPayload = Object.assign({
                        CUSTOMER_DETAILS_ID: row.Row_no,
                        IS_PARENT: 0,
                    }, emailPayload);

                    mm.executeDML('INSERT INTO customer_master SET ?', custPayload, supportKey, conn, (err, masterRes) => {
                        if (err) {
                            console.error('[bulkImport] customer_master INSERT failed', err);
                            mm.rollbackConnection(conn);
                            return nextCust(err);
                        }

                        const customerId = masterRes.insertId;
                        console.log('row\n\n\n\n\n', row);
                        const customerDetails = row.Row_no;

                        const slotTasks = [];
                        if (emailPayload.CUSTOMER_TYPE === 'B') {
                            slotTasks.push(cb => {
                                const sql = `
                                    INSERT INTO global_time_slots_mapping
                                    (ORG_ID,MAPPING_FOR,MAPPING_ID,
                                    SLOT1_START_TIME,SLOT1_END_TIME,
                                    SLOT2_START_TIME,SLOT2_END_TIME,
                                    SLOT3_START_TIME,SLOT3_END_TIME,
                                    CLIENT_ID,CUSTOMER_DETAILS_ID)
                                    SELECT
                                    0,'C',?,gs.SLOT1_START_TIME,gs.SLOT1_END_TIME,
                                    gs.SLOT2_START_TIME,gs.SLOT2_END_TIME,
                                    gs.SLOT3_START_TIME,gs.SLOT3_END_TIME,
                                    1,?
                                    FROM global_timeslots_settings gs
                                    ORDER BY gs.ID DESC LIMIT 1;`;
                                mm.executeDML(sql, [customerId, customerDetails], supportKey, conn, cb);
                            });
                        }

                        async.series(slotTasks, err => {
                            if (err) {
                                console.error('[bulkImport] Time‑slot mapping failed', err);
                                mm.rollbackConnection(conn);
                                return nextCust(err);
                            }

                            const uname = authUser.NAME || authUser.USER_NAME;
                            dbm.saveLog({
                                SOURCE_ID: row.Row_no,
                                LOG_DATE_TIME: mm.getSystemDate(),
                                LOG_TEXT: `User ${uname} created customer ${emailPayload.NAME}`,
                                CATEGORY: 'customer',
                                CLIENT_ID: 1,
                                USER_ID: authUser.USER_ID,
                                supportKey,
                                CUSTOMER_DETAILS_ID: customerDetails
                            }, systemLog);

                            ['customer_channel', 'system_alerts_channel', `customer_${customerId}_channel`]
                                .forEach(ch => new channelSubscribedUsers({
                                    CHANNEL_NAME: ch,
                                    USER_ID: customerId,
                                    TYPE: 'C',
                                    STATUS: true,
                                    USER_NAME: emailPayload.NAME,
                                    CLIENT_ID: 1,
                                    DATE: mm.getSystemDate()
                                }).save());

                            async.eachOfSeries(myAddrs, (r, index, cbAddr) => {
                                const pinData = pinResults[index];

                                const aBody = {
                                    CUSTOMER_ID: customerId,
                                    CUSTOMER_DETAILS_ID: customerDetails,
                                    CLIENT_ID: 1,
                                    STATUS: '1',
                                    CONTACT_PERSON_NAME: r['Contact Person Name'],
                                    MOBILE_NO: String(r['Contact Person Mobile Number']),
                                    EMAIL_ID: r['Contact Person Email'],
                                    ADDRESS_LINE_1: r['Address Line 1'],
                                    ADDRESS_LINE_2: r['Address Line 2'],
                                    GEO_LOCATION: r['Geo Location'],
                                    TYPE: r['Type'] === 'Work' ? 'W' : r['Type'] === 'Home' ? 'H' : 'O',
                                    IS_DEFAULT: r['Is Default Address'] === 'Yes' ? 1 : 0,
                                    LANDMARK: r['Landmark'] ? r['Landmark'] : null,
                                    HOUSE_NO: r['House Number'],
                                    BUILDING: r['Bulding'],
                                    FLOOR: r['Floor'] ? r['Floor'] : null,
                                    PINCODE: String(r['Pincode']).trim(),
                                    CITY_NAME: r['City Name'],
                                    STATE_ID: pinData.STATE_ID || null,
                                    COUNTRY_ID: pinData.COUNTRY_ID || null,
                                    DISTRICT_ID: pinData.DISTRICT_ID || null,
                                    PINCODE_ID: pinData.PINCODE_ID || null,
                                    PINCODE_FOR: pinData.PINCODE_FOR || null
                                };

                                mm.executeQueryData('INSERT INTO customer_address_master SET ?', aBody, supportKey, (err, addrRes) => {
                                    if (err) return cbAddr(err);

                                    const uname2 = authUser.NAME || authUser.USER_NAME;
                                    const du = Object.assign({ ID: addrRes.insertId }, aBody);
                                    const doSubscribe = () => {
                                        const chans = [
                                            `promotion_state_${du.STATE_ID}_channel`,
                                            `promotion_country_${du.COUNTRY_ID}_channel`,
                                            `pincode_${du.PINCODE_ID}_channel`
                                        ];
                                        let subscribed = [];
                                        function sub(ch) {
                                            const d = {
                                                CHANNEL_NAME: ch,
                                                USER_ID: du.CUSTOMER_ID,
                                                TYPE: 'C',
                                                STATUS: true,
                                                USER_NAME: emailPayload.NAME,
                                                CLIENT_ID: du.CLIENT_ID,
                                                DATE: mm.getSystemDate()
                                            };
                                            new channelSubscribedUsers(d).save();
                                            subscribed.push(d);
                                        }

                                        channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[0], USER_ID: du.CUSTOMER_ID })
                                            .then(r0 => { if (!r0) sub(chans[0]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[1], USER_ID: du.CUSTOMER_ID }); })
                                            .then(r1 => { if (!r1) sub(chans[1]); return channelSubscribedUsers.findOne({ CHANNEL_NAME: chans[2], USER_ID: du.CUSTOMER_ID }); })
                                            .then(r2 => { if (!r2) sub(chans[2]); cbAddr(null, subscribed); })
                                            .catch(e => cbAddr(e));
                                    };

                                    if (du.IS_DEFAULT) {
                                        mm.executeQueryData(
                                            `UPDATE customer_address_master SET IS_DEFAULT=0, CREATED_MODIFIED_DATE=? WHERE ID!=? AND CUSTOMER_ID=?`,
                                            [mm.getSystemDate(), addrRes.insertId, du.CUSTOMER_ID],
                                            supportKey,
                                            err => {
                                                if (err) return cbAddr(err);
                                                dbm.saveLog({
                                                    SOURCE_ID: addrRes.insertId,
                                                    LOG_DATE_TIME: mm.getSystemDate(),
                                                    LOG_TEXT: `User ${uname2} has created a new address.`,
                                                    CATEGORY: 'customer address',
                                                    CLIENT_ID: 1,
                                                    USER_ID: authUser.USER_ID,
                                                    supportKey: 0
                                                }, systemLog);
                                                doSubscribe();
                                            }
                                        );
                                    } else {
                                        dbm.saveLog({
                                            SOURCE_ID: addrRes.insertId,
                                            LOG_DATE_TIME: mm.getSystemDate(),
                                            LOG_TEXT: `User ${uname2} has created new address.`,
                                            CATEGORY: 'customer address',
                                            CLIENT_ID: 1,
                                            USER_ID: authUser.USER_ID,
                                            supportKey: 0
                                        }, systemLog);
                                        doSubscribe();
                                    }
                                });
                            }, err => {
                                if (err) {
                                    mm.rollbackConnection(conn);
                                    return nextCust(err);
                                }

                                mm.commitConnection(conn);

                                // logUploadResult({
                                //     name: emailPayload.NAME,
                                //     email: emailPayload.EMAIL,
                                //     mobile: emailPayload.MOBILE_NO,
                                //     isSuccess: true,
                                //     supportKey
                                // });

                                results.push({ customer: emailPayload.NAME, status: 'ok' });
                                nextCust();
                            });
                        });
                    });
                    ;
                }
            });
        });
    }, err => {
        if (err) {
            console.error('[bulkImport] Import failed', err);
            return res.status(500).send({ code: 500, message: 'Import failed', detail: err.toString() });
        }
        console.log('[bulkImport] Import complete for all customers');
        res.send({ code: 200, message: 'Import complete', results });
    });
};





