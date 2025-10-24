const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const md5 = require('md5');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
var backofficeTeamMaster = "backoffice_team_master";
var viewBackofficeTeamMaster = "view_" + backofficeTeamMaster;
const systemLog = require("../../modules/systemLog")


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        ROLE_ID: req.body.ROLE_ID,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        EMAIL_ID: req.body.EMAIL_ID,
        PASSWORD: md5(req.body.PASSWORD),
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ORG_ID: req.body.ORG_ID,
        CAN_CHANGE_SERVICE_PRICE: req.body.CAN_CHANGE_SERVICE_PRICE ? '1' : '0',
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        REPORTING_HEAD_ID: req.body.REPORTING_HEAD_ID,
        REPORTING_HEAD_NAME: req.body.REPORTING_HEAD_NAME
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('ROLE_ID').isInt().optional(),
        body('MOBILE_NUMBER').optional(),
        body('EMAIL_ID').optional(),
        body('DOB').optional(),
        body('GENDER').optional(),
        body('ADDRESS_LINE1').optional(),
        body('ADDRESS_LINE2').optional(),
        body('CITY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
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
    const IS_T_MANAGER = req.body.IS_T_MANAGER;
    const TERRITORY_IDS = req.body.TERRITORY_IDS
    var backofficeFiletr = ''
    if (IS_T_MANAGER === 1) {
        backofficeFiletr = `AND ID IN (SELECT BACKOFFICE_ID FROM backoffice_territory_mapping WHERE TERITORY_ID IN (${TERRITORY_IDS}) AND IS_ACTIVE = 1)UNION SELECT * FROM view_backoffice_team_master WHERE IS_ACTIVE = 1 AND ID NOT IN (SELECT BACKOFFICE_ID FROM backoffice_territory_mapping);`
    }
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewBackofficeTeamMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get backoffice team count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewBackofficeTeamMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get backoffice team information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 2,
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
    data.PASSWORD = md5(data.PASSWORD);
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
            mm.executeQueryData('INSERT INTO ' + backofficeTeamMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save backoffice team information..."
                    });
                }
                else {

                    res.send({
                        "code": 200,
                        "message": "Backoffice team information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 400,
                "message": "Something went wrong."
            });
        }
    }
}


exports.createTeam = (req, res) => {
    var data = reqData(req);
    var PASSWORD = req.body.PASSWORD;
    PASSWORD = md5(PASSWORD);
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
            const connection = mm.openConnection()
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=?', data.EMAIL_ID, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save backoffice team information..."
                    });
                }
                else {
                    mm.executeDML('SELECT * FROM backoffice_team_master WHERE EMAIL_ID=? OR MOBILE_NUMBER = ?', [data.EMAIL_ID, data.MOBILE_NUMBER], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save backoffice team information..."
                            });
                        }
                        else {
                            if (results1.length > 0 || results2.length > 0) {
                                let message = "";
                                if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID) && results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Email ID and mobile number already exist";
                                } else if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID)) {
                                    message = "Email ID already exists";
                                } else if (results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Mobile number already exists";
                                }
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 300,
                                    "message": message
                                });
                            }
                            else {
                                mm.executeDML('INSERT INTO ' + backofficeTeamMaster + ' SET ?', data, supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save backoffice team information..."
                                        });
                                    }
                                    else {

                                        mm.executeDML('INSERT INTO user_master (ROLE_ID,NAME, EMAIL_ID,PASSWORD,BACKOFFICE_TEAM_ID,CLIENT_ID,ORG_ID,CAN_CHANGE_SERVICE_PRICE,MOBILE_NUMBER) VALUES(?,?,?,?,?,?,?,?,?)', [data.ROLE_ID, data.NAME, data.EMAIL_ID, data.PASSWORD, results3.insertId, data.CLIENT_ID, data.ORG_ID, data.CAN_CHANGE_SERVICE_PRICE, data.MOBILE_NUMBER], supportKey, connection, (error, results4) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to save backoffice team information..."
                                                });
                                            }
                                            else {
                                                mm.executeDML('INSERT INTO user_role_mapping (USER_ID,ROLE_ID,CLIENT_ID) VALUES(?,?,?)', [results4.insertId, data.ROLE_ID, data.CLIENT_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to save backoffice team information..."
                                                        });
                                                    }
                                                    else {
                                                        mm.executeDML('UPDATE backoffice_team_master SET USER_ID=? WHERE ID=?', [results4.insertId, results3.insertId], supportKey, connection, (error, results) => {
                                                            if (error) {
                                                                console.log(error);
                                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                mm.rollbackConnection(connection)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to save backoffice team information..."
                                                                });
                                                            }
                                                            else {
                                                                mm.sendDynamicEmail(4, results3.insertId, supportKey)
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has successfully created the Back Office team member ${data.NAME}.`;

                                                                var logCategory = "backofficeTeam"
                                                                let actionLog = {
                                                                    "SOURCE_ID": results3.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                }
                                                                // systemLog.create(actionLog);
                                                                dbm.saveLog(actionLog, systemLog)
                                                                addGlobalData(results3.insertId, supportKey)
                                                                const chanelData1 = {
                                                                    CHANNEL_NAME: 'backoffice_channel',
                                                                    USER_ID: results4.insertId,
                                                                    TYPE: "B",
                                                                    STATUS: true,
                                                                    USER_NAME: data.NAME,
                                                                    CLIENT_ID: data.CLIENT_ID,
                                                                    DATE: mm.getSystemDate()
                                                                }
                                                                const chanel1 = new channelSubscribedUsers(chanelData1);
                                                                chanel1.save()
                                                                const chanelData2 = {
                                                                    CHANNEL_NAME: 'system_alerts_channel',
                                                                    USER_ID: results4.insertId,
                                                                    TYPE: "B",
                                                                    STATUS: true,
                                                                    USER_NAME: data.NAME,
                                                                    CLIENT_ID: data.CLIENT_ID,
                                                                    DATE: mm.getSystemDate()
                                                                }
                                                                const chanel2 = new channelSubscribedUsers(chanelData2);
                                                                chanel2.save()
                                                                if (data.ROLE_ID == 22 || data.ROLE_ID == 21 || data.ROLE_ID == 20 || data.ROLE_ID == 8 || data.ROLE_ID == 5 || data.ROLE_ID == 4 || data.ROLE_ID == 3 || data.ROLE_ID == 2 || data.ROLE_ID == 1) {
                                                                    const chanelData3 = {
                                                                        CHANNEL_NAME: 'backoffice_chat_channel',
                                                                        USER_ID: results4.insertId,
                                                                        TYPE: "B",
                                                                        STATUS: true,
                                                                        USER_NAME: data.NAME,
                                                                        CLIENT_ID: data.CLIENT_ID,
                                                                        DATE: mm.getSystemDate()
                                                                    }
                                                                    const chanel3 = new channelSubscribedUsers(chanelData3);
                                                                    chanel3.save()
                                                                }
                                                                var wBparams = [{ "type": "text", "text": data.NAME }, { "type": "text", "text": data.EMAIL_ID }]
                                                                var templateName = "welcome_backoffice_teamwelcome_backoffice_team"
                                                                var wparams = [{ "type": "body", "parameters": wBparams }]
                                                                mm.sendWAToolSMS(data.MOBILE_NUMBER, templateName, wparams, 'En', (error, resultswsms) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                    }
                                                                    else {
                                                                        console.log("Successfully send SMS", resultswsms)
                                                                    }
                                                                })
                                                                mm.commitConnection(connection);
                                                                return res.send({
                                                                    code: 200,
                                                                    message: "ServiceItem information updated and logged successfully."
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
            mm.executeQueryData(`UPDATE ` + backofficeTeamMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update backofficeTeam information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "BackofficeTeam information updated successfully...",
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


exports.updateTeam = (req, res) => {
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
            const connection = mm.openConnection();
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=? AND BACKOFFICE_TEAM_ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, connection, (error, results1) => {
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
                    mm.executeDML('SELECT * FROM backoffice_team_master WHERE (EMAIL_ID=? OR MOBILE_NUMBER=?) AND ID!=?', [data.EMAIL_ID, data.MOBILE_NUMBER, criteria.ID], supportKey, connection, (error, results2) => {
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
                            if (results1.length > 0 || results2.length > 0) {
                                let message = "";
                                if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID) && results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Email ID and mobile number already exist";
                                } else if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID)) {
                                    message = "Email ID already exists";
                                } else if (results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Mobile number already exists";
                                }
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 300,
                                    "message": message
                                });
                            }
                            else {
                                mm.executeDML(`UPDATE ` + backofficeTeamMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
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
                                        addGlobalData(criteria.ID, supportKey)
                                        mm.executeDML(`UPDATE user_master SET NAME=?, EMAIL_ID=?,CAN_CHANGE_SERVICE_PRICE = ?, CREATED_MODIFIED_DATE = '${systemDate}',MOBILE_NUMBER = ?,ROLE_ID=? where BACKOFFICE_TEAM_ID = ${criteria.ID} `, [data.NAME, data.EMAIL_ID, data.CAN_CHANGE_SERVICE_PRICE, data.MOBILE_NUMBER, data.ROLE_ID], supportKey, connection, (error, results) => {
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
                                                mm.executeDML(`UPDATE user_role_mapping SET ROLE_ID=?, CREATED_MODIFIED_DATE = '${systemDate}' where USER_ID =(select ID from user_master where BACKOFFICE_TEAM_ID = ${criteria.ID}) `, [data.ROLE_ID], supportKey, connection, async (error, results) => {
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
                                                        mm.executeDML(`select ID from user_master where BACKOFFICE_TEAM_ID = ${criteria.ID} `, [], supportKey, connection, async (error, results) => {
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
                                                                console.log(req.body.authData.data.UserData[0]);
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has successfully updated the details of ${data.NAME}.`;
                                                                var logCategory = "backofficeTeam"

                                                                let actionLog = {
                                                                    "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                }
                                                                // systemLog.create(actionLog);
                                                                dbm.saveLog(actionLog, systemLog)

                                                                var existingChannel = await channelSubscribedUsers.findOne({
                                                                    CHANNEL_NAME: 'backoffice_channel',
                                                                    USER_ID: results[0].ID
                                                                });
                                                                if (!existingChannel) {
                                                                    const chanelData1 = {
                                                                        CHANNEL_NAME: 'backoffice_channel',
                                                                        USER_ID: results[0].ID,
                                                                        TYPE: "B",
                                                                        STATUS: true,
                                                                        USER_NAME: data.NAME,
                                                                        CLIENT_ID: data.CLIENT_ID,
                                                                        DATE: mm.getSystemDate()
                                                                    }
                                                                    const chanel1 = new channelSubscribedUsers(chanelData1);
                                                                    chanel1.save()
                                                                }

                                                                var existingChannel = await channelSubscribedUsers.findOne({
                                                                    CHANNEL_NAME: 'system_alerts_channel',
                                                                    USER_ID: results[0].ID
                                                                });
                                                                if (!existingChannel) {
                                                                    const chanelData2 = {
                                                                        CHANNEL_NAME: 'system_alerts_channel',
                                                                        USER_ID: results[0].ID,
                                                                        TYPE: "B",
                                                                        STATUS: true,
                                                                        USER_NAME: data.NAME,
                                                                        CLIENT_ID: data.CLIENT_ID,
                                                                        DATE: mm.getSystemDate()
                                                                    }
                                                                    const chanel2 = new channelSubscribedUsers(chanelData2);
                                                                    chanel2.save()
                                                                }
                                                                if (data.ROLE_ID == 22 || data.ROLE_ID == 21 || data.ROLE_ID == 20 || data.ROLE_ID == 8 || data.ROLE_ID == 7 || data.ROLE_ID == 5 || data.ROLE_ID == 4 || data.ROLE_ID == 3 || data.ROLE_ID == 2 || data.ROLE_ID == 1) {
                                                                    var existingChannel = await channelSubscribedUsers.findOne({
                                                                        CHANNEL_NAME: 'backoffice_chat_channel',
                                                                        USER_ID: results[0].ID
                                                                    });
                                                                    console.log("existingChannel", existingChannel)
                                                                    if (!existingChannel) {
                                                                        const chanelData1 = {
                                                                            CHANNEL_NAME: 'backoffice_chat_channel',
                                                                            USER_ID: results[0].ID,
                                                                            TYPE: "B",
                                                                            STATUS: true,
                                                                            USER_NAME: data.NAME,
                                                                            CLIENT_ID: data.CLIENT_ID,
                                                                            DATE: mm.getSystemDate()
                                                                        }
                                                                        const chanel1 = new channelSubscribedUsers(chanelData1);
                                                                        chanel1.save()
                                                                    }
                                                                }

                                                                mm.commitConnection(connection);
                                                                return res.send({
                                                                    code: 200,
                                                                    message: "ServiceItem information updated and logged successfully."
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
    const TEMPLATE_NAME = 'BACKOFFICE_WELCOME_EMAIL';
    const ATTACHMENTS = '';

    mm.sendEmail(to, subject, body, TEMPLATE_NAME, ATTACHMENTS, (error, results) => {
        if (error) {
            console.error('Failed to send welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', results);
        }
    });
}

function addGlobalData(data_Id, supportKey) {
    try {
        mm.executeQueryData(`select * from view_backoffice_team_master where ID = ?`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Vendor", results5[0].NAME, JSON.stringify(results5[0]), "/masters/vendor_master", 0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "BackofficeTeam", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/backoffice", TERRITORY_ID: 0 };
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


// const async = require('async')
const xlsx = require('xlsx')

exports.importBackofficeExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/backofficeExcel/${EXCEL_FILE_NAME}.xlsx`)
        const backoffice = workbook.SheetNames[0];
        const backofficeSheet = workbook.Sheets[backoffice];

        const backofficeExcelData = xlsx.utils.sheet_to_json(backofficeSheet);
        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        async.eachSeries(backofficeExcelData, function iteratorOverElems(element, inner_callback) {
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=?', element.EMAIL_ID, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    inner_callback(error)
                }
                else {
                    mm.executeDML('SELECT * FROM backoffice_team_master WHERE EMAIL_ID=? and MOBILE_NUMBER = ?', [element.EMAIL_ID, element.MOBILE_NUMBER], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            inner_callback(error)
                        }
                        else {
                            if (results1.length > 0 || results2.length > 0) {
                                inner_callback(null)
                            }
                            else {
                                mm.executeDML('INSERT INTO backoffice_team_master (NAME, ROLE_ID, MOBILE_NUMBER, EMAIL_ID, IS_ACTIVE, PASSWORD, CLIENT_ID, COUNTRY_CODE, VENDOR_ID, ORG_ID, CAN_CHANGE_SERVICE_PRICE, USER_ID, PROFILE_PHOTO, REPORTING_HEAD_ID, REPORTING_HEAD_NAME) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [element.NAME, element.ROLE_ID, element.MOBILE_NUMBER, element.EMAIL_ID, element.IS_ACTIVE, md5(element.PASSWORD), "1", element.COUNTRY_CODE, element.VENDOR_ID, element.ORG_ID, element.CAN_CHANGE_SERVICE_PRICE, element.USER_ID, element.PROFILE_PHOTO, element.REPORTING_HEAD_ID, element.REPORTING_HEAD_NAME], supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        inner_callback(error)
                                    }
                                    else {
                                        mm.executeDML('INSERT INTO user_master (ROLE_ID,NAME, EMAIL_ID,PASSWORD,BACKOFFICE_TEAM_ID,CLIENT_ID,ORG_ID,CAN_CHANGE_SERVICE_PRICE,MOBILE_NUMBER) VALUES(?,?,?,?,?,?,?,?,?)', [element.ROLE_ID, element.NAME, element.EMAIL_ID, element.PASSWORD, results3.insertId, "1", element.ORG_ID, element.CAN_CHANGE_SERVICE_PRICE, element.MOBILE_NUMBER], supportKey, connection, (error, results4) => {
                                            if (error) {
                                                console.log(error);
                                                inner_callback(error)
                                            }
                                            else {
                                                mm.executeDML('INSERT INTO user_role_mapping (USER_ID,ROLE_ID,CLIENT_ID) VALUES(?,?,?)', [results4.insertId, element.ROLE_ID, element.CLIENT_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        inner_callback(error)
                                                    }
                                                    else {
                                                        mm.executeDML('UPDATE backoffice_team_master SET USER_ID=? WHERE ID=?', [results4.insertId, results3.insertId], supportKey, connection, (error, results) => {
                                                            if (error) {
                                                                console.log(error);
                                                                inner_callback(error)
                                                            }
                                                            else {
                                                                sendWelcomeEmail(element.EMAIL_ID, element.NAME, element.MOBILE_NUMBER);
                                                                console.log(req.body.authData.data.UserData[0]);
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created the backoffice Team ${element.NAME}.`;

                                                                var logCategory = "backofficeTeam"
                                                                let actionLog = {
                                                                    "SOURCE_ID": results3.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                }
                                                                // systemLog.create(actionLog);
                                                                dbm.saveLog(actionLog, systemLog)
                                                                addGlobalData(results3.insertId, supportKey)
                                                                inner_callback(null)
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
                }
            });

        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to save data"
                })
            } else {
                mm.commitConnection(connection)
                res.send({
                    "code": 200,
                    "message": "Data saved successfully"
                })
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