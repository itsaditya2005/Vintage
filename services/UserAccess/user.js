const mm = require('../../utilities/globalModule');
const db = require('../../utilities/dbModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const jwt = require('jsonwebtoken');
const md5 = require('md5');

const applicationkey = process.env.APPLICATION_KEY;

var userMaster = "user_master";
var viewUserMaster = "view_" + userMaster;

function reqData(req) {
    var data = {
        ROLE_ID: req.body.ROLE_ID,
        NAME: req.body.NAME,
        EMAIL_ID: req.body.EMAIL_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        PASSWORD: req.body.PASSWORD,
        CLIENT_ID: req.body.CLIENT_ID,
        FIREBASE_REG_TOKEN: req.body.FIREBASE_REG_TOKEN,
        LAST_LOGIN_DATETIME: req.body.LAST_LOGIN_DATETIME,
        LOGOUT_DATE_TIME: req.body.LOGOUT_DATE_TIME,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        ORG_ID: req.body.ORG_ID,
        ORGANISATION_ID: req.body.ORG_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('ROLE_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('PASSWORD', ' parameter missing').optional(),
        body('ORG_ID', ' parameter missing').exists(),
        body('ID').optional()
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
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQuery('select count(*) as cnt from ' + viewUserMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to get users count.",
                });
            } else {
                mm.executeQuery('select * from ' + viewUserMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                        res.send({
                            "code": 400,
                            "message": "Failed to get user information."
                        });
                    } else {
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
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
    }
}

exports.create = (req, res) => {
    console.log(req.body);
    var data = reqData(req);
    data.PASSWORD = md5(data.PASSWORD);
    const errors = validationResult(req);
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeQueryData('select ID from ' + userMaster + ' where (EMAIL_ID=?)', [data.EMAIL_ID], supportKey, (error, resultsUser) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        "code": 400,
                        "message": "Failed to save user information..."
                    });
                } else {
                    if (resultsUser.length > 0) {
                        res.send({
                            "code": 401,
                            "message": "Entered  email already present."
                        });
                    }
                    else {
                        mm.executeQueryData('INSERT INTO ' + userMaster + ' SET ?', data, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save user information..."
                                });
                            } else {
                                res.send({
                                    "code": 200,
                                    "message": "User information saved successfully...",
                                });

                            }
                        });
                    }
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            console.log(error)
        }
    }
}

exports.update = (req, res) => {
    console.log(req.body);
    const errors = validationResult(req);

    var data = reqData(req);
    var deviceid = req.headers['deviceid'];
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
    } else {
        try {
            mm.executeQueryData('select ID from ' + userMaster + ' where (EMAIL_ID=?) AND ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, (error, resultsUser) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        "code": 400,
                        "message": "Failed to save user information..."
                    });
                } else {
                    if (resultsUser.length > 0) {
                        res.send({
                            "code": 401,
                            "message": "Entered  email already present."
                        });
                    }
                    else {
                        mm.executeQueryData(`UPDATE ` + userMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
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
                }
            })
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
            console.log(error);
        }
    }
}

exports.loginOld = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var username = req.body.username;
        var password = req.body.password;
        var type = req.body.type;
        var FIREBASE_REG_TOKEN = req.body.cloudid ? req.body.cloudid : '';
        var supportKey = req.headers['supportkey'];

        if ((!username || username == ' ') || (!password || password == ' ') || (!type || type == ' ')) {
            res.send({
                "code": 400,
                "message": "username or password or cloudId or type parameter missing.",
            });
        }
        else {
            password = md5(password);
            var connection = db.openConnection();
            db.executeDML(`SELECT ID,CLIENT_ID,ROLE_ID,ROLE_NAME,NAME,EMAIL_ID,LAST_LOGIN_DATETIME,ORG_ID,PROFILE_PHOTO,STATE_ID,VENDOR_ID,BACKOFFICE_TEAM_ID,IFNULL(CAN_CHANGE_SERVICE_PRICE,'0') AS CAN_CHANGE_SERVICE_PRICE,MOBILE_NUMBER FROM ${viewUserMaster}  WHERE   EMAIL_ID=? and PASSWORD =? and IS_ACTIVE = 1`, [username, password], supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    db.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to get user record.",
                    });
                }
                else {
                    if (results1.length > 0) {
                        db.executeDML(`update user_master set FIREBASE_REG_TOKEN=?,CREATED_MODIFIED_DATE='${systemDate}',DEVICE_ID = ?, CLOUD_ID = ?,W_CLOUD_ID = ?,LAST_LOGIN_DATETIME='${systemDate}' WHERE ID=?`, [FIREBASE_REG_TOKEN, req.body.DEVICE_ID, req.body.cloudid, null, results1[0].ID], supportKey, connection, async (error, resultsUpdate) => {
                            if (error) {
                                console.log(error);
                                db.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update user record",
                                });
                            }
                            else {
                                const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
                                const subscribedChannels = await channelSubscribedUsers.find({
                                    USER_ID: results1[0].ID,
                                    TYPE: type,
                                    STATUS: true
                                });

                                var userDetails = [{
                                    USER_ID: results1[0].ID,
                                    USER_NAME: results1[0].NAME,
                                    MOBILE_NUMBER: results1[0].MOBILE_NUMBER,
                                    PROFILE_PHOTO: results1[0].PROFILE_PHOTO,
                                    CLIENT_ID: results1[0].CLIENT_ID,
                                    ROLE_ID: results1[0].ROLE_ID,
                                    ROLE_NAME: results1[0].ROLE_NAME,
                                    NAME: results1[0].NAME,
                                    EMAIL_ID: results1[0].EMAIL_ID,
                                    LAST_LOGIN_DATETIME: results1[0].LAST_LOGIN_DATETIME,
                                    ORGANISATION_ID: results1[0].ORG_ID,
                                    STATE_ID: results1[0].STATE_ID,
                                    CAN_CHANGE_SERVICE_PRICE: results1[0].CAN_CHANGE_SERVICE_PRICE,
                                    VENDOR_ID: results1[0].VENDOR_ID,
                                    BACKOFFICE_TEAM_ID: results1[0].BACKOFFICE_TEAM_ID,
                                    SUBSCRIBED_CHANNELS: subscribedChannels
                                }]

                                var userDetails1 = [{
                                    USER_ID: results1[0].ID,
                                    USER_NAME: results1[0].NAME,
                                    NAME: results1[0].NAME,
                                }]

                                generateToken(results1[0].ID, res, userDetails, connection, userDetails1);
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 404,
                            "message": "Incorrect username or password or type"
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

exports.login = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var username = req.body.username;
        var password = req.body.password;
        var type = req.body.type;
        var FIREBASE_REG_TOKEN = req.body.cloudid ? req.body.cloudid : '';
        var supportKey = req.headers['supportkey'];

        if ((!username || username == ' ') || (!password || password == ' ') || (!type || type == ' ')) {
            res.send({
                "code": 400,
                "message": "username or password or cloudId or type parameter missing.",
            });
        }
        else {
            password = md5(password);
            const connection = db.openConnection();
            db.executeDML(`SELECT ID,CLIENT_ID,ROLE_ID,ROLE_NAME,NAME,EMAIL_ID,LAST_LOGIN_DATETIME,ORG_ID,PROFILE_PHOTO,STATE_ID,VENDOR_ID,BACKOFFICE_TEAM_ID,IFNULL(CAN_CHANGE_SERVICE_PRICE,'0') AS CAN_CHANGE_SERVICE_PRICE,MOBILE_NUMBER FROM ${viewUserMaster}  WHERE   EMAIL_ID=? and PASSWORD =? and IS_ACTIVE = 1`, [username, password], supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    db.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to get user record.",
                    });
                }
                else {
                    if (results1.length > 0) {
                        db.executeDML(`update user_master set FIREBASE_REG_TOKEN=?,CREATED_MODIFIED_DATE='${systemDate}',DEVICE_ID = ?, CLOUD_ID = ?,W_CLOUD_ID = ?,LAST_LOGIN_DATETIME='${systemDate}' WHERE ID=?`, [FIREBASE_REG_TOKEN, req.body.DEVICE_ID, req.body.cloudid, null, results1[0].ID], supportKey, connection, async (error, resultsUpdate) => {
                            if (error) {
                                console.log(error);
                                db.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update user record",
                                });
                            }
                            else {
                                let USER_TYPE;
                                if (results1[0].VENDOR_ID) {
                                    USER_TYPE = 'V';
                                } else if (results1[0].BACKOFFICE_TEAM_ID) {
                                    USER_TYPE = 'B';
                                } else {
                                    USER_TYPE = 'A';
                                }
                                const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
                                const subscribedChannels = await channelSubscribedUsers.find({
                                    USER_ID: results1[0].ID,
                                    TYPE: USER_TYPE,
                                    STATUS: true
                                });
                                var userDetails = [{
                                    USER_ID: results1[0].ID,
                                    USER_NAME: results1[0].NAME,
                                    MOBILE_NUMBER: results1[0].MOBILE_NUMBER,
                                    PROFILE_PHOTO: results1[0].PROFILE_PHOTO,
                                    CLIENT_ID: results1[0].CLIENT_ID,
                                    ROLE_ID: results1[0].ROLE_ID,
                                    ROLE_NAME: results1[0].ROLE_NAME,
                                    NAME: results1[0].NAME,
                                    EMAIL_ID: results1[0].EMAIL_ID,
                                    LAST_LOGIN_DATETIME: results1[0].LAST_LOGIN_DATETIME,
                                    ORGANISATION_ID: results1[0].ORG_ID,
                                    STATE_ID: results1[0].STATE_ID,
                                    CAN_CHANGE_SERVICE_PRICE: results1[0].CAN_CHANGE_SERVICE_PRICE,
                                    VENDOR_ID: results1[0].VENDOR_ID,
                                    BACKOFFICE_TEAM_ID: results1[0].BACKOFFICE_TEAM_ID,
                                    SUBSCRIBED_CHANNELS: subscribedChannels
                                }]
                                var userDetails1 = [{
                                    USER_ID: results1[0].ID,
                                    USER_NAME: results1[0].NAME,
                                    NAME: results1[0].NAME,
                                }]
                                let TYPE = '';
                                TYPE = results1[0].ROLE_ID == 8 ? 'A' : results1[0].ROLE_ID == 9 ? 'V' : 'B'
                                mm.userloginlogs(results1[0].ID, TYPE, systemDate, "L", supportKey)
                                generateToken(results1[0].ID, res, userDetails, connection, userDetails1);
                            }
                        });
                    }
                    else {
                        db.rollbackConnection(connection)
                        res.send({
                            "code": 404,
                            "message": "Incorrect username or password or type"
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}


exports.testWebhook = (req, res) => {
    console.log("WEBHOOK CALLED", req.body)
}

function generateToken(userId, res, resultsUser, connection, userDetails1) {
    try {
        var data = {
            "USER_ID": userId,
            "UserData": userDetails1
        }

        jwt.sign({ data }, process.env.SECRET, (error, token) => {
            if (error) {
                console.log("token error", error);
                db.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to login.",
                });
            }
            else {
                db.commitConnection(connection);
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

exports.getForms = (req, res) => {
    try {
        var ROLE_ID = req.body.ROLE_ID;
        var supportKey = req.headers['supportkey'];

        if (ROLE_ID) {
            var query = `SET SESSION group_concat_max_len = 4294967290;SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('level',1,'title',m.FORM_NAME,'icon',m.ICON,'link',m.LINK,'SEQ_NO',m.SEQ_NO,'children',( IFNULL((SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('level',2,'title',FORM_NAME,'icon',ICON,'link',link,'SEQ_NO',SEQ_NO)),']')),'"[','['),']"',']') FROM view_role_details WHERE PARENT_ID = m.FORM_ID AND ROLE_ID = m.ROLE_ID  and IS_ALLOWED=1 AND SHOW_IN_MENU = 1 order by SEQ_NO ASC),'[]') )
            )),']')),'"[','['),']"',']') AS data FROM view_role_details m WHERE PARENT_ID = 0 AND ROLE_ID = ${ROLE_ID} AND IS_ALLOWED = 1 AND SHOW_IN_MENU = 1 order by SEQ_NO ASC`

            mm.executeQuery(query, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to get Record."
                    });
                }
                else {
                    if (results.length > 0) {
                        var json = results[1][0].data
                        if (json) {
                            json = json.replace(/\\/g, '');
                            json = JSON.parse(json);
                        }
                        res.send({
                            "code": 200,
                            "message": "SUCCESS",
                            "data": json
                        });

                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "No Data",
                        });
                    }
                }
            });
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter missing - ROLE_ID "
            });
            return
        }

    } catch (error) {
        console.log(error);
    }
}

exports.logoutOLG = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var USER_ID = req.body.USER_ID;
        var supportKey = req.headers['supportkey'];

        if (!USER_ID || USER_ID == ' ') {
            res.send({
                "code": 400,
                "message": "userId parameter missing.",
            });
        }
        else {
            mm.executeQueryData(`update user_master set FIREBASE_REG_TOKEN='',DEVICE_ID='',CLOUD_ID='',CREATED_MODIFIED_DATE='${systemDate}',LOGOUT_DATE_TIME='${systemDate}' where ID = ?`, USER_ID, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to logout.",
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Logout sucessfully.",
                    });
                }
            })

        }

    } catch (error) {
        console.log(error);
    }

}


exports.logout = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var USER_ID = req.body.USER_ID;
        var ROLE_ID = req.body.ROLE_ID
        var supportKey = req.headers['supportkey'];

        if (!USER_ID || USER_ID == ' ') {
            res.send({
                "code": 400,
                "message": "userId parameter missing.",
            });
        }
        else {
            mm.executeQueryData(`update user_master set FIREBASE_REG_TOKEN='',DEVICE_ID='',CLOUD_ID='',CREATED_MODIFIED_DATE='${systemDate}',LOGOUT_DATE_TIME='${systemDate}' where ID = ?`, USER_ID, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to logout.",
                    });
                }
                else {
                    let TYPE = '';
                    TYPE = ROLE_ID == 8 ? 'A' : ROLE_ID == 9 ? 'V' : 'B'
                    mm.userloginlogs(USER_ID, TYPE, systemDate, "O", supportKey)
                    res.send({
                        "code": 200,
                        "message": "Logout sucessfully.",
                    });
                }
            })

        }

    } catch (error) {
        console.log(error);
    }

}



exports.sendOTPToDevice = (req, res) => {
    var TYPE = "E";
    var TYPE_VALUE = req.body.EMAIL_ID;
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers["supportkey"];
    try {
        if (TYPE && TYPE != " " && TYPE_VALUE && TYPE_VALUE != " ") {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM user_master WHERE EMAIL_ID = ? AND IS_ACTIVE = 1 ;`, [TYPE_VALUE], supportKey, connection, (error, resultsUser) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                    res.send({
                        code: 400,
                        message: "Failed to get opt details ",
                    });
                } else {
                    if (resultsUser.length > 0) {
                        // var OTP = Math.floor(1000 + Math.random() * 9000);
                        var OTP = 1234;
                        var body = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;

                        mm.executeDML(`select ID from registration_otp_details where TYPE_VALUE = ? AND IS_VERIFIED=1 order by id desc limit 1;`, [TYPE_VALUE], supportKey, connection, (error, resultsRegistarGetRes) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.send({
                                    code: 400,
                                    message: "Failed to get registration attempt ... ",
                                });
                            } else {
                                // console.log("registration attempt details:", resultsRegistarGetRes)
                                if (resultsRegistarGetRes.length > 0) {
                                    console.log(" Already in registration attempt details:", resultsRegistarGetRes[0].ID);

                                    sendOtp(TYPE, TYPE_VALUE, "OTP Verify", body, OTP, resultsUser[0].NAME, supportKey, (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                code: 400,
                                                message: "Failed to send OTP",
                                            });
                                        } else {
                                            console.log("OTP send to Email ");
                                            mm.commitConnection(connection);
                                            res.send({
                                                code: 200,
                                                "USER_ID": resultsUser[0].ID,
                                                "USER_NAME": resultsUser[0].NAME,
                                                message: "OTP sent to Email.",
                                            });
                                        }
                                    });
                                } else {
                                    var query = `INSERT INTO registration_attempt_details(IS_REGISTERED,REGISTRATION_FOR,EMAIL_ID,IS_EMAIL_VERIFIED,EMAIL_VERIFICATION_DATETIME,EMAIL_OTP,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                    var dataSet = [0, 'Customer', TYPE_VALUE, 0, null, OTP, systemDate, TYPE]

                                    mm.executeDML(query, dataSet, supportKey, connection, (error, resultsRegistar) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                code: 400,
                                                message: "Failed to save registration attempt ... ",
                                            });
                                        } else {
                                            sendOtp(TYPE, TYPE_VALUE, "OTP Verify", body, OTP, resultsUser[0].NAME, supportKey, (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        code: 400,
                                                        message: "Failed to send OTP",
                                                    });
                                                } else {
                                                    console.log("OTP send to Email ");
                                                    mm.commitConnection(connection);
                                                    res.send({
                                                        code: 200,
                                                        "USER_ID": resultsUser[0].ID,
                                                        message: "OTP sent to Email.",
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    } else {
                        res.status(400).send({
                            code: 400,
                            message: "The user is not registered or has been deactivated.",
                            isPresent: 0
                        });
                    }
                }
            });
        } else {
            res.send({
                code: 400,
                message: "parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Customer Otp Support"
    var otpText1
    if (TYPE == "M") {
        otpText1 = `Dear Admin, please share OTP ${OTP} with our technician to complete your order. For queries, contact PockIT Team.Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear User,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team PockIT</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><em>Suggestion/feedback if any can be provided through our official website https://my.pockitengineers.com/</em></p>`;
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

function sendSMSEmail(type, to, subject, body, callback) {
    if (type == "M") {
        var wBparams = [
            {
                "type": "text",
                "text": to
            }
        ]
        var wparams = [
            {
                "type": "body",
                "parameters": wBparams
            }
        ]
        mm.sendWAToolSMS(to, "login_otp", wparams, 'En', (error, resultswsms) => {
            if (error) {
                console.log(error)
            }
            else {
                callback(null, { message: "sent" });
                console.log("SMS sent successfully", resultswsms);
            }
        })
    } else if (type == "E") {
        let data = {
            USER_ID: '',
            TYPE: 'text',
            ATTACHMENT: '',
        }
        mm.sendEmail(to, subject, body, 'Customer Otp', "", (error, results) => {
            if (error) {
                console.log(error);
                callback(null, results);
            } else {
                callback(null, results);
            }
        });
    }
};

exports.verifyOTP = (req, res) => {
    try {
        var TYPE = "E";
        var TYPE_VALUE = req.body.EMAIL_ID;
        var OTP = req.body.OTP;
        var supportKey = req.headers["supportkey"]; //Supportkey ;
        var systemDate = mm.getSystemDate();
        if (TYPE != " " && TYPE_VALUE != " " && OTP != " ") {
            const connection = mm.openConnection();
            mm.executeDML(`select OTP from registration_otp_details where TYPE = ? AND TYPE_VALUE = ? order by ID desc limit 1`, [TYPE, TYPE_VALUE], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        code: 400,
                        message: "Failed to get opt details ",
                    });
                } else {
                    if (results.length > 0) {
                        console.log("ACTUAL OTP ", results[0].OTP);
                        console.log("INCOMMING OTP ", OTP);
                        if (results[0].OTP == OTP) {
                            console.log("OTP verified ..... ");

                            mm.executeDML(`update registration_otp_details set IS_VERIFIED=1,VERIFICATION_DATETIME='${systemDate}'  WHERE TYPE_VALUE=? `, [TYPE_VALUE], supportKey, connection, (error, resultsUpdate1) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection);
                                    res.status(400).send({
                                        code: 400,
                                        message: "Failed to update mobile verified in registration attempt details details ",
                                    });
                                } else {
                                    console.log("OTP verified ..... ");
                                    mm.commitConnection(connection);
                                    res.status(200).send({
                                        code: 200,
                                        message: "OTP verified Succuessfully..... ",
                                    })
                                }
                            });
                        } else {
                            console.log("OTP not verified ..... ");
                            mm.rollbackConnection(connection);
                            res.status(300).send({
                                code: 300,
                                message: "invalid OTP ",
                            });
                        }
                    } else {
                        mm.rollbackConnection(connection);
                        res.status(400).send({
                            code: 400,
                            message: "invalid OTP request ",
                        });
                    }
                }
            });
        } else {
            res.status(400).send({
                code: 400,
                message: "OTP or emailid parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};


exports.changePassword = (req, res) => {
    var USER_ID = req.body.USER_ID;
    var USER_NAME = req.body.USER_NAME
    var NEW_PASSWORD = req.body.NEW_PASSWORD;
    NEW_PASSWORD = md5(NEW_PASSWORD);
    var systemDate = mm.getSystemDate();
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData('select ID,NAME from user_master where  ID=?', [USER_ID], supportKey, (error, resultsUser) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to save user information..."
                });
            } else {
                if (resultsUser.length > 0) {
                    mm.executeQueryData(`UPDATE user_master SET PASSWORD =?, CREATED_MODIFIED_DATE =? where ID = ? `, [NEW_PASSWORD, systemDate, USER_ID], supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update user information."
                            });
                        } else {
                            var ACTION_DETAILS = `User ${USER_NAME} has changed the password ${resultsUser.NAME}.`;
                            var logCategory = "customer"

                            let actionLog = {
                                "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": USER_ID, "supportKey": 0
                            }

                            return res.send({
                                code: 200,
                                message: "user information  saved successfully.",
                                "ID": USER_ID
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
    }
}