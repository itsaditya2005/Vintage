const mm = require('../../utilities/globalModule');
const dbm = require('../../utilities/dbMongo');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const md5 = require('md5');
const jwt = require('jsonwebtoken');
const applicationkey = process.env.APPLICATION_KEY;
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const async = require('async');
var customerMaster = "customer_master";
var viewCustomerMaster = "view_" + customerMaster;
const xlsx = require('xlsx')


function reqDataOLD(req) {
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
        SHORT_CODE: req.body.SHORT_CODE,
        INDIVIDUAL_COMPANY_NAME: req.body.INDIVIDUAL_COMPANY_NAME,
        COMPANY_ADDRESS: req.body.COMPANY_ADDRESS,
        IS_HAVE_GST: req.body.IS_HAVE_GST ? '1' : '0',
        VAT_NUMBER: req.body.VAT_NUMBER
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_CATEGORY_ID').isInt().optional(),
        body('CUSTOMER_TYPE').optional(),
        body('NAME').optional(),
        body('EMAIL').optional(),
        body('REGISTRATION_DATE').optional(),
        body('COMPANY_NAME').optional(),
        body('ALTERNATE_MOBILE_NO').optional(),
        body('PAN').optional(),
        body('GST_NO').optional(),
        body('ID').optional(),
    ]
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
            mm.executeQuery('select count(*) as cnt from ' + viewCustomerMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customer count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewCustomerMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customer information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 20,
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


function addGlobalData(data_Id, supportKey) {
    try {
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
        mm.executeQueryData('select ID,NAME from customer_master where PASSWORD=? AND ID=?', [OLD_PASSWORD, ID], supportKey, (error, resultsUser) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to save user information..."
                });
            } else {
                if (resultsUser.length > 0) {
                    mm.executeQueryData(`UPDATE ` + customerMaster + ` SET PASSWORD =?, CREATED_MODIFIED_DATE =? where ID = ? `, [NEW_PASSWORD, systemDate, ID], supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update user information."
                            });
                        } else {
                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has changed the password for ${resultsUser.NAME}.`;
                            var logCategory = "customer"

                            let actionLog = {
                                "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }

                            return res.send({
                                code: 200,
                                message: "customer information  saved successfully.",
                                "ID": results.insertId
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


exports.forgetPassword = (req, res) => {
    try {
        var EMAIL_ID = req.body.EMAIL_ID;
        var NEW_PASSWORD = req.body.PASSWORD;
        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();

        if (EMAIL_ID && EMAIL_ID != " " && NEW_PASSWORD && NEW_PASSWORD != " ") {
            var connection = mm.openConnection();
            mm.executeDML(`select * from customer_master where EMAIL_ID = ? limit 1`, [EMAIL_ID], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    res.send({
                        code: 400,
                        message: "Failed to get PASSWORD details ",
                    });
                } else {
                    mm.executeDML(`update customer_master SET PASSWORD = '${NEW_PASSWORD}' where ID = ? `, [results[0].ID], supportKey, connection, (error, resultsUpdate1) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection);
                            res.send({
                                code: 400,
                                message:
                                    "Failed to update PASSWORD!",
                            });
                        } else {
                            mm.commitConnection(connection);
                            res.send({
                                code: 200,
                                message: "PASSWORD UPDATED SUCCSESFULLY.....",
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
                message: "MOBILE NUMBER AND NEW_PASSWORD parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};



function generateToken(userId, res, resultsUser, connection, userDetails1) {

    try {
        var data = {
            "USER_ID": userId,
            "UserData": userDetails1
        }

        jwt.sign({ data }, process.env.SECRET, (error, token) => {
            if (error) {
                console.log("token error", error);
                // mm.rollbackConnection(connection)
                res.status(400).json({
                    "message": "Failed to login.",

                });
            }
            else {
                res.status(200).json({
                    "code": 200,
                    "message": "Logged in successfully.",
                    "token": token,
                    "UserData": resultsUser,
                    "isPresent": resultsUser.isPresent
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendOTPToDevice = (req, res) => {
    var TYPE = req.body.TYPE;
    var TYPE_VALUE = req.body.TYPE_VALUE;
    var systemDate = mm.getSystemDate();
    var COUNTRY_CODE = req.body.COUNTRY_CODE;
    var supportKey = req.headers["supportkey"];
    try {
        if (TYPE && TYPE != " " && TYPE_VALUE && TYPE_VALUE != " ") {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE (MOBILE_NO = ? or EMAIL = ?) AND ACCOUNT_STATUS=1 `, [TYPE_VALUE, TYPE_VALUE], supportKey, connection, (error, resultsUser) => {
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
                        if (TYPE == 'M' && resultsUser[0].COUNTRY_CODE != COUNTRY_CODE) {
                            res.send({
                                "code": 400,
                                "message": "Mobile number doesn't match the selected country code. Please verify and try again.",
                            });
                        }
                        else {
                            var OTP
                            if ((TYPE_VALUE == "8669806792" || TYPE_VALUE == "7721909974") && TYPE == "M") {
                                OTP = 1234;
                            } else {
                                // OTP = Math.floor(1000 + Math.random() * 9000);
                                OTP = 1234;
                            }
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
                                                console.log("OTP send to mobile ");
                                                mm.commitConnection(connection);
                                                res.send({
                                                    code: 200,
                                                    message: "OTP sent to mobile.",
                                                    RID: resultsRegistarGetRes[0].ID,
                                                    VID: result,
                                                    USER_ID: resultsUser[0].ID,
                                                    USER_NAME: resultsUser[0].NAME,
                                                    CUSTOMER_TYPE: resultsUser[0].CUSTOMER_TYPE
                                                });
                                            }
                                        });
                                    } else {
                                        var query = '';
                                        var dataSet = []
                                        if (TYPE == 'E') {
                                            query = `INSERT INTO registration_attempt_details(IS_REGISTERED,REGISTRATION_FOR,EMAIL_ID,IS_EMAIL_VERIFIED,EMAIL_VERIFICATION_DATETIME,EMAIL_OTP,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                            dataSet = [0, 'Customer', TYPE_VALUE, 0, null, OTP, systemDate, TYPE]
                                        } else {
                                            query = `INSERT INTO registration_attempt_details(MOBILE_NO,IS_MOBILE_VERIFIED,MOBILE_VERIFICATION_DATETIME,MOBILE_OTP,IS_REGISTERED,REGISTRATION_FOR,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                            dataSet = [TYPE_VALUE, 0, null, OTP, 0, 'Customer', systemDate, TYPE]
                                        }
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
                                                        console.log("OTP send to mobile ");
                                                        mm.commitConnection(connection);
                                                        res.send({
                                                            code: 200,
                                                            message: "OTP sent to mobile.",
                                                            RID: resultsRegistar.insertId,
                                                            VID: result,
                                                            isPresent: 1,
                                                            USER_ID: resultsUser.length > 0 ? resultsUser[0].ID : 0,
                                                            USER_NAME: resultsUser[0].NAME,
                                                            CUSTOMER_TYPE: resultsUser[0].CUSTOMER_TYPE
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
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


exports.registerOtp = (req, res) => {
    var TYPE = req.body.TYPE;
    var TYPE_VALUE = req.body.TYPE_VALUE;
    var systemDate = mm.getSystemDate();
    var COUNTRY_CODE = req.query.COUNTRY_CODE;
    COUNTRY_CODE = `${COUNTRY_CODE}`
    const CUSTOMER_TYPE = req.body.CUSTOMER_TYPE;
    var supportKey = req.headers["supportkey"];

    try {
        const connection = mm.openConnection();

        mm.executeDML("SELECT * FROM customer_email_master WHERE MOBILE_NO = ? OR EMAIL = ?", [req.body.MOBILE_NO, req.body.EMAIL_ID], supportKey, connection, (err, custResult) => {
            if (err) {
                console.log(err);
                mm.rollbackConnection(connection);
                res.send({
                    code: 400,
                    message: "Failed to get customer details from customer_email_master.",
                });
            } else {
                if (custResult.length > 0) {
                    if (custResult[0].IS_DELETED_BY_CUSTOMER == 1) {
                        mm.rollbackConnection(connection);
                        res.send({
                            code: 301,
                            message: "Oops! It looks like your account is currently deactivated. You can reach out to our support team to get it reactivated, or simply try registering with another mobile number.",
                        })
                    }
                    else if (custResult[0].EMAIL === req.body.EMAIL_ID && (custResult[0].MOBILE_NO === req.body.MOBILE_NO && custResult[0].CUSTOMER_TYPE === CUSTOMER_TYPE)) {
                        mm.rollbackConnection(connection);
                        res.send({
                            code: 300,
                            message: "Email ID and mobile number already exist.",
                        });
                    } else if (custResult[0].EMAIL === req.body.EMAIL_ID) {
                        mm.rollbackConnection(connection);
                        res.send({
                            code: 300,
                            message: "Email ID already exist.",
                        });
                    } else if (custResult[0].MOBILE_NO === req.body.MOBILE_NO) {
                        if (CUSTOMER_TYPE == custResult[0].CUSTOMER_TYPE) {
                            mm.rollbackConnection(connection);

                            res.send({
                                code: 300,
                                message: "Mobile number already exist.",
                            })  
                        }
                        mm.rollbackConnection(connection);
                        res.send({
                            code: 300,
                            message: "Mobile number already exist.",
                        });
                    }
                }
                else {
                    mm.executeDML("SELECT * FROM customer_master WHERE MOBILE_NO = ? OR EMAIL = ?", [req.body.MOBILE_NO, req.body.EMAIL_ID], supportKey, connection, (err, custMasterResult) => {
                        if (err) {
                            console.log(err);
                            mm.rollbackConnection(connection);
                            res.send({
                                code: 400,
                                message: "Failed to get customer details from customer_master.",
                            });
                        } else {
                            if (custMasterResult.length > 0) {

                                if (custMasterResult[0].IS_DELETED_BY_CUSTOMER == 1) {
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        code: 301,
                                        message: "Oops! It looks like your account is currently deactivated. You can reach out to our support team to get it reactivated, or simply try registering with another mobile number.",
                                    })
                                }
                                else if (custMasterResult[0].EMAIL_ID === req.body.EMAIL_ID && custMasterResult[0].MOBILE_NO === req.body.MOBILE_NO) {
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        code: 300,
                                        message: "email ID and mobile number already exist.",
                                    });
                                } else if (custMasterResult[0].EMAIL_ID === req.body.EMAIL_ID) {
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        code: 300,
                                        message: "Email ID already exist.",
                                    });
                                } else if (custMasterResult[0].MOBILE_NO === req.body.MOBILE_NO) {
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        code: 300,
                                        message: "Mobile number already exist.",
                                    });
                                }
                            }
                            else {
                                if (TYPE && TYPE.trim() !== "" && TYPE_VALUE && TYPE_VALUE.trim() !== "") {
                                    var OTP
                                    if ((TYPE_VALUE == "8669806792" || TYPE_VALUE == "7721909974") && TYPE == "M") {
                                        OTP = 1234;
                                    } else {
                                        // OTP = Math.floor(1000 + Math.random() * 9000);
                                        OTP = 1234
                                    }
                                    var body = `${OTP} is your One Time Password (OTP) for registration, please do not share it with anyone.\nTeam Pockigt.`;
                                    var query = '';
                                    var dataSet = []
                                    if (TYPE == 'E') {
                                        query = `INSERT INTO registration_attempt_details(IS_REGISTERED,REGISTRATION_FOR,EMAIL_ID,IS_EMAIL_VERIFIED,EMAIL_VERIFICATION_DATETIME,EMAIL_OTP,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                        dataSet = [0, 'Customer', TYPE_VALUE, 0, null, OTP, systemDate, TYPE]
                                    } else {
                                        query = `INSERT INTO registration_attempt_details(MOBILE_NO,IS_MOBILE_VERIFIED,MOBILE_VERIFICATION_DATETIME,MOBILE_OTP,IS_REGISTERED,REGISTRATION_FOR,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                        dataSet = [TYPE_VALUE, 0, null, OTP, 0, 'Customer', systemDate, TYPE]
                                    }

                                    mm.executeDML(query, dataSet, supportKey, connection, (error, resultsRegistar) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                code: 400,
                                                message: "Failed to save registration attempt.",
                                            });
                                        } else {
                                            sendOtp(TYPE, TYPE_VALUE, "OTP Verify", body, OTP, '', supportKey, (err, result) => {
                                                if (err) {
                                                    console.log(err);
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        code: 400,
                                                        message: "Failed to send OTP.",
                                                    });
                                                } else {
                                                    mm.commitConnection(connection);
                                                    res.send({
                                                        code: 200,
                                                        message: "OTP sent to mobile.",
                                                        RID: resultsRegistar.insertId,
                                                        isPresent: 0,
                                                        USER_ID: 0
                                                    });
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    res.send({
                                        code: 400,
                                        message: "Parameter missing.",
                                    });
                                }
                            }
                        }
                    }
                    );
                }
            }
        }
        );
    } catch (error) {
        console.log(error);
        res.send({
            code: 500,
            message: "Internal server error.",
        });
    }
};


function sendSMSEmail(type, to, OTP, subject, body, callback) {
    if (type == "M") {
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
        var type = "c";
        var TYPE = req.body.TYPE;
        var TYPE_VALUE = req.body.TYPE_VALUE;
        var OTP = req.body.OTP;
        var USER_ID = req.body.USER_ID;
        var IS_NEW_CUSTOMER = req.body.IS_NEW_CUSTOMER;
        var supportKey = req.headers["supportkey"]; //Supportkey ;
        var systemDate = mm.getSystemDate();
        var CUSTOMER_NAME = req.body.CUSTOMER_NAME
        var CUSTOMER_EMAIL_ID = req.body.CUSTOMER_EMAIL_ID
        var CUSTOMER_MOBILE_NO = req.body.CUSTOMER_MOBILE_NO
        var CUSTOMER_TYPE = req.body.CUSTOMER_TYPE
        var CLOUD_ID = req.body.CLOUD_ID
        var W_CLOUD_ID = req.body.W_CLOUD_ID
        var DEVICE_ID = req.body.DEVICE_ID
        var COUNTRY_CODE = req.body.COUNTRY_CODE
        var IS_SPECIAL_CATALOGUE = req.body.IS_SPECIAL_CATALOGUE
        var ACCOUNT_STATUS = req.body.ACCOUNT_STATUS
        var CUSTOMER_CATEGORY_ID = req.body.CUSTOMER_CATEGORY_ID
        var SHORT_CODE = req.body.SHORT_CODE
        if (TYPE != " " && TYPE_VALUE != " " && OTP != " ") {
            var connection = mm.openConnection();
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
                    // console.log("OTP results ", results);
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
                                    if (IS_NEW_CUSTOMER == 1) {
                                        mm.executeDML(`SELECT * FROM customer_master WHERE EMAIL = ? OR MOBILE_NO = ?`, [CUSTOMER_EMAIL_ID, CUSTOMER_MOBILE_NO], supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to validate customer email."
                                                });
                                            } else {
                                                if (results.length > 0) {
                                                    if (results[0].EMAIL === CUSTOMER_EMAIL_ID && results[0].MOBILE_NO === CUSTOMER_EMAIL_ID) {
                                                        mm.rollbackConnection(connection);
                                                        res.send({
                                                            "code": 300,
                                                            "message": "Email ID and mobile number already exist."
                                                        });
                                                    } else if (results[0].EMAIL === CUSTOMER_EMAIL_ID) {
                                                        mm.rollbackConnection(connection);
                                                        res.send({
                                                            "code": 300,
                                                            "message": "Email ID already exist."
                                                        });
                                                    } else if (results[0].MOBILE_NO === CUSTOMER_MOBILE_NO) {
                                                        if (CUSTOMER_TYPE == "B" && results[0].CUSTOMER_TYPE == "B") {
                                                            mm.rollbackConnection(connection);
                                                            res.send({
                                                                "code": 300,
                                                                "message": "Mobile number already exist."
                                                            });
                                                        }
                                                        mm.rollbackConnection(connection);
                                                        res.send({
                                                            "code": 300,
                                                            "message": "Mobile number already exist."
                                                        });
                                                    }

                                                } else {
                                                    if (CUSTOMER_TYPE == "B") {
                                                        if (results[0].some(row => row.SHORT_CODE.toLowerCase() === data.SHORT_CODE.toLowerCase())) {
                                                            console.log("result11", results);
                                                            mm.rollbackConnection(connection);
                                                            return res.send({
                                                                "code": 300,
                                                                "message": "Short code already exist."
                                                            });
                                                        }
                                                    }
                                                    mm.executeDML(`INSERT into customer_email_master (NAME,EMAIL,MOBILE_NO,CLIENT_ID,ACCOUNT_STATUS,IS_SPECIAL_CATALOGUE,REGISTRATION_DATE,CLOUD_ID,W_CLOUD_ID,COUNTRY_CODE,CUSTOMER_TYPE,CUSTOMER_CATEGORY_ID,IS_PARENT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) `, [CUSTOMER_NAME, CUSTOMER_EMAIL_ID, CUSTOMER_MOBILE_NO, 1, ACCOUNT_STATUS, IS_SPECIAL_CATALOGUE, systemDate, CLOUD_ID, W_CLOUD_ID, COUNTRY_CODE, CUSTOMER_TYPE, CUSTOMER_CATEGORY_ID, 1], supportKey, connection, async (error, resultCustomer1) => {

                                                        if (error) {
                                                            console.log(error);
                                                            logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                            mm.rollbackConnection(connection);
                                                            res.status(400).send({
                                                                code: 400,
                                                                message: "Failed to update mobile verified in registration attempt details.",
                                                            });
                                                        } else {
                                                            mm.executeDML(`INSERT into customer_master (NAME,EMAIL,MOBILE_NO,CLIENT_ID,ACCOUNT_STATUS,IS_SPECIAL_CATALOGUE,REGISTRATION_DATE,CLOUD_ID,W_CLOUD_ID,COUNTRY_CODE,CUSTOMER_TYPE,CUSTOMER_CATEGORY_ID,CUSTOMER_DETAILS_ID,IS_PARENT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?) `, [CUSTOMER_NAME, CUSTOMER_EMAIL_ID, CUSTOMER_MOBILE_NO, 1, ACCOUNT_STATUS, IS_SPECIAL_CATALOGUE, systemDate, CLOUD_ID, W_CLOUD_ID, COUNTRY_CODE, CUSTOMER_TYPE, CUSTOMER_CATEGORY_ID, resultCustomer1.insertId, 1], supportKey, connection, async (error, resultCustomer2) => {

                                                                if (error) {
                                                                    console.log(error);
                                                                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                                    mm.rollbackConnection(connection);
                                                                    res.status(400).send({
                                                                        code: 400,
                                                                        message: "Failed to update mobile verified in registration attempt details.",
                                                                    });
                                                                } else {
                                                                    if (CUSTOMER_TYPE == "B") {
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
                                                                            mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID,CUSTOMER_DETAILS_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)', [0, "C", resultCustomer2.insertId, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1, resultCustomer2.insertId], supportKey, connection, (error, resultsglobal) => {
                                                                                if (error) {
                                                                                    mm.rollbackConnection(connection);
                                                                                    console.log(error);
                                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                                    return res.send({
                                                                                        "code": 400,
                                                                                        "message": "Failed to save globalTimeSlotMapping information..."
                                                                                    });
                                                                                } else {
                                                                                    const channels = [
                                                                                        { CHANNEL_NAME: "customer_channel" },
                                                                                        { CHANNEL_NAME: "system_alerts_channel" },
                                                                                        { CHANNEL_NAME: `customer_${resultCustomer2.insertId}_channel` }
                                                                                    ];
                                                                                    var SUBSCRIBED_CHANNELS = []
                                                                                    channels.forEach(channel => {
                                                                                        const chanelData = {
                                                                                            ...channel,
                                                                                            USER_ID: resultCustomer2.insertId,
                                                                                            TYPE: "C",
                                                                                            STATUS: true,
                                                                                            USER_NAME: CUSTOMER_NAME,
                                                                                            CLIENT_ID: 1,
                                                                                            DATE: mm.getSystemDate()
                                                                                        };
                                                                                        new channelSubscribedUsers(chanelData).save();
                                                                                        SUBSCRIBED_CHANNELS.push(chanelData)
                                                                                    });

                                                                                    var userDetails = [{
                                                                                        USER_ID: resultCustomer2.insertId,
                                                                                        USER_NAME: CUSTOMER_NAME,
                                                                                        MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : results[0].MOBILE_NO,
                                                                                        CLIENT_ID: 1,
                                                                                        isPresent: 1,
                                                                                        EMAIL_ID: CUSTOMER_EMAIL_ID,
                                                                                        CUSTOMER_DETAILS_ID: resultCustomer2.insertId,
                                                                                        SUBSCRIBED_CHANNELS: SUBSCRIBED_CHANNELS

                                                                                    }]

                                                                                    var userDetails1 = [{
                                                                                        USER_ID: resultCustomer2.insertId,
                                                                                        USER_NAME: CUSTOMER_NAME,
                                                                                        NAME: CUSTOMER_NAME,
                                                                                    }]
                                                                                    mm.sendDynamicEmail(1, resultCustomer2.insertId, supportKey)
                                                                                    var wBparams = [{ "type": "text", "text": CUSTOMER_NAME }, { "type": "text", "text": CUSTOMER_MOBILE_NO }]
                                                                                    var templateName = "welcome_customers"
                                                                                    var wparams = [{ "type": "body", "parameters": wBparams }]
                                                                                    // mm.sendWAToolSMS(CUSTOMER_MOBILE_NO, templateName, wparams, 'En', (error, resultswsms) => {
                                                                                    //     if (error) {
                                                                                    //         console.log(error)
                                                                                    //     }
                                                                                    //     else {
                                                                                    //         console.log("Successfully send SMS", resultswsms)
                                                                                    //     }
                                                                                    // })
                                                                                    addGlobalData(resultCustomer2.insertId, supportKey)
                                                                                    generateToken(userDetails[0].USER_ID, res, userDetails, "1", userDetails1);
                                                                                    mm.userloginlogs(resultCustomer2.insertId, "C", systemDate, "L", supportKey)
                                                                                    mm.commitConnection(connection);
                                                                                }
                                                                            }
                                                                            );

                                                                        });
                                                                    } else {
                                                                        const channels = [
                                                                            { CHANNEL_NAME: "customer_channel" },
                                                                            { CHANNEL_NAME: "system_alerts_channel" },
                                                                            { CHANNEL_NAME: `customer_${resultCustomer2.insertId}_channel` }
                                                                        ];
                                                                        var SUBSCRIBED_CHANNELS = []
                                                                        channels.forEach(channel => {
                                                                            const chanelData = {
                                                                                ...channel,
                                                                                USER_ID: resultCustomer2.insertId,
                                                                                TYPE: "C",
                                                                                STATUS: true,
                                                                                USER_NAME: CUSTOMER_NAME,
                                                                                CLIENT_ID: 1,
                                                                                DATE: mm.getSystemDate()
                                                                            };
                                                                            new channelSubscribedUsers(chanelData).save();
                                                                            SUBSCRIBED_CHANNELS.push(chanelData)
                                                                        });

                                                                        var userDetails = [{
                                                                            USER_ID: resultCustomer2.insertId,
                                                                            USER_NAME: CUSTOMER_NAME,
                                                                            MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : results[0].MOBILE_NO,
                                                                            CLIENT_ID: 1,
                                                                            isPresent: 1,
                                                                            EMAIL_ID: CUSTOMER_EMAIL_ID,
                                                                            CUSTOMER_DETAILS_ID: resultCustomer2.insertId,
                                                                            SUBSCRIBED_CHANNELS: SUBSCRIBED_CHANNELS

                                                                        }]

                                                                        var userDetails1 = [{
                                                                            USER_ID: resultCustomer2.insertId,
                                                                            USER_NAME: CUSTOMER_NAME,
                                                                            NAME: CUSTOMER_NAME,
                                                                        }]
                                                                        mm.sendDynamicEmail(1, resultCustomer2.insertId, supportKey)
                                                                        var wBparams = [{ "type": "text", "text": CUSTOMER_NAME }, { "type": "text", "text": CUSTOMER_MOBILE_NO }]
                                                                        var templateName = "welcome_customers"
                                                                        var wparams = [{ "type": "body", "parameters": wBparams }]
                                                                        mm.sendWAToolSMS(CUSTOMER_MOBILE_NO, templateName, wparams, 'En', (error, resultswsms) => {
                                                                            if (error) {
                                                                                console.log(error)
                                                                            }
                                                                            else {
                                                                                console.log("Successfully send SMS", resultswsms)
                                                                            }
                                                                        })
                                                                        addGlobalData(resultCustomer2.insertId, supportKey)
                                                                        generateToken(userDetails[0].USER_ID, res, userDetails, "1", userDetails1);
                                                                        mm.userloginlogs(resultCustomer2.insertId, "C", systemDate, "L", supportKey)
                                                                        mm.commitConnection(connection);
                                                                    }
                                                                }
                                                            });
                                                        }
                                                    });
                                                }
                                            }
                                        });
                                    } else {
                                        mm.executeDML(`SELECT ID,EMAIL,CUSTOMER_TYPE,MOBILE_NO FROM customer_master WHERE ID = ? AND (MOBILE_NO = ? OR EMAIL = ?)`, [USER_ID, TYPE_VALUE, TYPE_VALUE], supportKey, connection, async (error, resultgetCustomer) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                res.status(400).send({
                                                    code: 400,
                                                    message: "Failed to update mobile verified in registration attempt details details ",
                                                });
                                            } else {
                                                mm.executeDML(`SELECT * FROM customer_address_master WHERE CUSTOMER_ID = ? AND STATUS = 1`, [USER_ID], supportKey, connection, async (error, resultgetAdress) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection);
                                                        res.status(400).send({
                                                            code: 400,
                                                            message: "Failed to update mobile verified in registration attempt details details ",
                                                        });
                                                    } else {
                                                        mm.executeDML(`UPDATE customer_master SET CLOUD_ID = ? WHERE ID = ? AND MOBILE_NO = ?`, [CLOUD_ID, USER_ID, TYPE_VALUE], supportKey, connection, async (error, resultCustomer) => {
                                                            if (error) {
                                                                console.log(error);
                                                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                                mm.rollbackConnection(connection);
                                                                res.status(400).send({
                                                                    code: 400,
                                                                    message: "Failed to update mobile verified in registration attempt details details ",
                                                                });
                                                            } else {
                                                                if (resultgetCustomer[0].CUSTOMER_TYPE == "B" && resultgetAdress.length == 0) {
                                                                    mm.rollbackConnection(connection);
                                                                    res.status(301).send({
                                                                        code: 301,
                                                                        message: "You don't have any default address to process this request, please contact our support team at itsupport@pockitengineers.com",
                                                                    })
                                                                } else {
                                                                    console.log("USER_ID", USER_ID)
                                                                    const subscribedChannels1 = await channelSubscribedUsers.find({
                                                                        USER_ID: USER_ID,
                                                                        TYPE: "C",
                                                                        STATUS: true
                                                                    });
                                                                    var userDetails = [{
                                                                        USER_ID: USER_ID,
                                                                        USER_NAME: CUSTOMER_NAME,
                                                                        MOBILE_NUMBER: TYPE === "M" ? TYPE_VALUE : resultgetCustomer[0].MOBILE_NO,
                                                                        EMAIL_ID: resultgetCustomer[0].EMAIL,
                                                                        CLIENT_ID: 1,
                                                                        isPresent: 1,
                                                                        SUBSCRIBED_CHANNELS: subscribedChannels1
                                                                    }]

                                                                    var userDetails1 = [{
                                                                        USER_ID: USER_ID,
                                                                        USER_NAME: CUSTOMER_NAME,
                                                                        NAME: CUSTOMER_NAME
                                                                    }]
                                                                    mm.userloginlogs(USER_ID, "C", systemDate, "L", supportKey)
                                                                    generateToken(userDetails[0].USER_ID, res, userDetails, "1", userDetails1);
                                                                    mm.commitConnection(connection);
                                                                }
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
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
                message: "mobileno or OTP or registrationAttemptId parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};



exports.addCustomer = (req, res) => {
    var data = reqData(req);
    var ADDRESS_DATA = req.body.ADDRESS_DATA;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
        return;
    }

    try {
        const connection = mm.openConnection()
        mm.executeDML(`SELECT * FROM ${customerMaster} WHERE EMAIL = ? OR MOBILE_NO = ?`, [data.EMAIL, data.MOBILE_NO], supportKey, connection, (error, results) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to validate customer email or mobile number."
                });
                return;
            }

            if (results.length > 0) {
                const existingRecord = results[0];
                if (existingRecord.EMAIL === data.EMAIL && existingRecord.MOBILE_NO === data.MOBILE_NO) {
                    res.status(300).json({
                        "code": 300,
                        "message": "Email ID and mobile number already exist."
                    });
                } else if (existingRecord.EMAIL === data.EMAIL) {
                    res.status(300).json({
                        "code": 300,
                        "message": "Email ID already exist."
                    });
                } else if (existingRecord.MOBILE_NO === data.MOBILE_NO) {
                    res.status(300).json({
                        "code": 300,
                        "message": "Mobile number already exist."
                    });
                }
                return;
            }

            mm.executeDML('INSERT INTO ' + customerMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technician information."
                    });
                }
                else {
                    var details = [];
                    for (var i = 0; i < ADDRESS_DATA.length; i++) {
                        details.push([results.insertId, ADDRESS_DATA[0].CONTACT_PERSON_NAME, ADDRESS_DATA[0].MOBILE_NO, ADDRESS_DATA[0].EMAIL_ID, ADDRESS_DATA[0].ADDRESS_LINE_1, ADDRESS_DATA[0].ADDRESS_LINE_2, ADDRESS_DATA[0].COUNTRY_ID, ADDRESS_DATA[0].STATE_ID, ADDRESS_DATA[0].CITY_ID, ADDRESS_DATA[0].PINCODE_ID, ADDRESS_DATA[0].GEO_LOCATION, ADDRESS_DATA[0].TYPE, ADDRESS_DATA[0].IS_DEFAULT, 1, ADDRESS_DATA[0].DISTRICT_ID, ADDRESS_DATA[0].PINCODE]);
                    }
                    mm.executeDML('INSERT INTO customer_address_master (CUSTOMER_ID,CONTACT_PERSON_NAME,MOBILE_NO,EMAIL_ID,ADDRESS_LINE_1,ADDRESS_LINE_2,COUNTRY_ID,STATE_ID,CITY_ID,PINCODE_ID,GEO_LOCATION,TYPE,IS_DEFAULT,CLIENT_ID,DISTRICT_ID,PINCODE) VALUES ?', [details], supportKey, connection, (error, results5) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to save Customer information..."
                            });
                        }
                        else {
                            addGlobalData(results.insertId, supportKey)
                            var ACTION_DETAILS = `A new customer has been created with the name ${data.NAME}.`;
                            var logCategory = "customer"

                            let actionLog = {
                                "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }

                            dbm.saveLog(actionLog, systemLog)
                            var userDetails = [{
                                USER_ID: results.insertId,
                                CLIENT_ID: 1,
                                USER_NAME: data.NAME,
                                NAME: data.NAME
                            }]
                            generateToken(userDetails[0].USER_ID, res, userDetails, "1");
                            mm.commitConnection(connection)
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
        res.status(500).json({
            "code": 500,
            "message": "Internal Server Error."
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
    const TEMPLATE_NAME = 'CUSTOMER_WELCOME_EMAIL';
    const ATTACHMENTS = '';

    mm.sendEmail(to, subject, body, TEMPLATE_NAME, ATTACHMENTS, (error, results) => {
        if (error) {
            console.error('Failed to send welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', results);
        }
    });
}

exports.logout = (req, res) => {
    var USER_ID = req.body.USER_ID;
    var supportKey = req.headers["supportkey"]; //Supportkey ;
    var systemDate = mm.getSystemDate();
    try {
        mm.executeQueryData(`UPDATE customer_email_details SET CLOUD_ID=null where ID=?`, [USER_ID], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                res.send({
                    code: 400,
                    message: "Failed to logut from system ",
                });
            } else {
                mm.userloginlogs(USER_ID, "C", systemDate, "O", supportKey)
                res.send({
                    code: 200,
                    message: "Successfully logout from system ...",
                });
            }
        })

    } catch (error) {
        console.log(error);

        res.send({
            code: 400,
            message: "Failed to logut from system.",
        });
    }
}

exports.importCustomerExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/customerExcel/${EXCEL_FILE_NAME}.xlsx`)
        const customer = workbook.SheetNames[0];
        const customerSheet = workbook.Sheets[customer];
        const customerDetails = workbook.SheetNames[1];
        const customerDetailsSheet = workbook.Sheets[customerDetails];

        const CustomerExcelData = xlsx.utils.sheet_to_json(customerSheet);
        const CustomerDetailsExcelData = xlsx.utils.sheet_to_json(customerDetailsSheet);
        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        var LogArray = []
        async.eachSeries(CustomerExcelData, function iteratorOverElems(element, inner_callback) {
            mm.executeDML(`select * from customer_master where EMAIL=? or MOBILE_NO=?`, [element.EMAIL, element.MOBILE_NO], supportKey, connection, (error, getAsset) => {
                if (error) {
                    console.log("Error in update method: ", error);
                    inner_callback(error)
                }
                else {
                    if (getAsset.length > 0) {
                        inner_callback(null)
                    }
                    else {
                        mm.executeDML(`INSERT INTO customer_master (SR_NO, CUSTOMER_CATEGORY_ID, CUSTOMER_TYPE, NAME, EMAIL, SALUTATION, MOBILE_NO, REGISTRATION_DATE, ACCOUNT_STATUS, COMPANY_NAME, ALTERNATE_MOBILE_NO, CURRENT_ADDRESS_ID, PAN, GST_NO, PASSWORD, PROFILE_PHOTO, CLOUD_ID, W_CLOUD_ID, DEVICE_ID, LOGOUT_DATETIME, CLIENT_ID, COUNTRY_CODE, ALTCOUNTRY_CODE, IS_SPECIAL_CATALOGUE) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [element.SR_NO, element.CUSTOMER_CATEGORY_ID, element.CUSTOMER_TYPE, element.NAME, element.EMAIL, element.SALUTATION, element.MOBILE_NO, systemDate, element.ACCOUNT_STATUS, element.COMPANY_NAME, element.ALTERNATE_MOBILE_NO, element.CURRENT_ADDRESS_ID, element.PAN, element.GST_NO, (element.PASSWORD ? md5(element.PASSWORD) : ""), element.PROFILE_PHOTO, element.CLOUD_ID, element.W_CLOUD_ID, element.DEVICE_ID, element.LOGOUT_DATETIME, "1", element.COUNTRY_CODE, element.ALTCOUNTRY_CODE, element.IS_SPECIAL_CATALOGUE], element.supportKey, connection, (error, getAsset) => {
                            if (error) {
                                console.log("Error in update method: ", error);
                                inner_callback(error)
                            }
                            else {
                                inner_callback(null)
                                addGlobalData(getAsset.insertId, supportKey)
                                var ACTION_DETAILS = `New customer created with name ${element.NAME}.`;
                                var logCategory = "customer"

                                let actionLog = {
                                    "SOURCE_ID": getAsset.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                }
                                LogArray.push(actionLog)
                            }
                        });
                    }
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
                async.eachSeries(CustomerDetailsExcelData, function iteratorOverElems(element, inner_callback) {
                    mm.executeDML(`select * from customer_master where SR_NO=?`, [element.CUSTOMER_ID], supportKey, connection, (error, getAsset) => {
                        if (error) {
                            console.log("Error in update method: ", error);
                            inner_callback(error)
                        }
                        else {
                            if (getAsset.length > 0) {
                                mm.executeDML(`INSERT INTO customer_address_master (CUSTOMER_ID, CONTACT_PERSON_NAME, MOBILE_NO, EMAIL_ID, ADDRESS_LINE_1, ADDRESS_LINE_2, COUNTRY_ID, STATE_ID, CITY_ID, PINCODE_ID, GEO_LOCATION, TYPE, IS_DEFAULT, CLIENT_ID, DISTRICT_ID, LANDMARK, HOUSE_NO, BUILDING, FLOOR, PINCODE, CITY_NAME) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [getAsset[0].ID, element.CONTACT_PERSON_NAME, element.MOBILE_NO, element.EMAIL_ID, element.ADDRESS_LINE_1, element.ADDRESS_LINE_2, element.COUNTRY_ID, element.STATE_ID, element.CITY_ID, element.PINCODE_ID, element.GEO_LOCATION, element.TYPE, element.IS_DEFAULT, "1", element.DISTRICT_ID, element.LANDMARK, element.HOUSE_NO, element.BUILDING, element.FLOOR, element.PINCODE, element.CITY_NAME], supportKey, connection, (error, getAsset) => {
                                    if (error) {
                                        console.log("Error in update method: ", error);
                                        inner_callback(error)
                                    }
                                    else {
                                        inner_callback(null)
                                    }
                                });
                            }
                            else {
                                inner_callback(null)
                            }
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
                        mm.executeDML(`UPDATE customer_master SET SR_NO=NULL`, [], supportKey, connection, (error, getAsset) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save data"
                                })
                            }
                            else {
                                dbm.saveLog(LogArray, systemLog)
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": "Data saved successfully"
                                })
                            }
                        });

                    }
                });
            }
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log("Error in update method try block: ", error);
        res.send({
            "code": 400,
            "message": "Internal server error "
        });
    }
}

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Customer Otp Support"
    var otpText1
    if (TYPE == "M") {
        // otpText1 = `Dear customer, please share OTP ${OTP} with our technician to complete your order. For queries, contact PockIT Team.Team UVtechSoft.`;
        otpText1 = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Customer,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team PockIT</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><em>Suggestion/feedback if any can be provided through our official website https://my.pockitengineers.com/</em></p>`;
    }
    var otpSendStatus = "S";
    mm.executeQueryData(`INSERT INTO registration_otp_details(TYPE,TYPE_VALUE,OTP,OTP_MESSAGE,REQUESTED_DATETIME,CLIENT_ID,STATUS,IS_VERIFIED,OTP_TYPE) values(?,?,?,?,?,?,?,?,?)`, [TYPE, TYPE_VALUE, OTP, otpText1, systemDate, 1, 'S', '0', 'C'], supportKey, (error, insertOtpDetails) => {
        if (error) {
            callback(error);
        }
        else {
            sendSMSEmail(TYPE, TYPE_VALUE, OTP, subject, otpText1, (error, results) => {
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

exports.unMappedTechnicians = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
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
        if (IS_FILTER_WRONG == "0" && CUSTOMER_ID != '') {
            mm.executeQuery(`select count(*) as cnt from technician_master p where 1 AND ID NOT IN (select TECHNICIAN_ID from customer_technician_mapping where CUSTOMER_ID = ${CUSTOMER_ID})` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get skill count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from technician_master p where 1 AND ID NOT IN (select TECHNICIAN_ID from customer_technician_mapping where CUSTOMER_ID = ${CUSTOMER_ID})` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get Skill information."
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
                message: "Invalid filter parameter or service id."
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


function customerDataOLD(req) {

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
        SHORT_CODE: req.body.SHORT_CODE,
        INDIVIDUAL_COMPANY_NAME: req.body.INDIVIDUAL_COMPANY_NAME,
        COMPANY_ADDRESS: req.body.COMPANY_ADDRESS,
        IS_HAVE_GST: req.body.IS_HAVE_GST ? '1' : '0',
        VAT_NUMBER: req.body.VAT_NUMBER
    }
    return data;
}

exports.createold = (req, res) => {
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE EMAIL = ? OR MOBILE_NO = ?;SELECT * FROM customer_master WHERE SHORT_CODE = ?`, [data.EMAIL, data.MOBILE_NO, data.SHORT_CODE], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate customer email."
                    });
                } else {
                    if (results[0].length > 0) {
                        console.log("results", results);

                        if (results[0][0].EMAIL === data.EMAIL && results[0][0].MOBILE_NO === data.MOBILE_NO) {
                            res.send({
                                "code": 300,
                                "message": "Email ID and mobile number already exist."
                            });
                            return;
                        } else if (results[0][0].EMAIL === data.EMAIL) {
                            res.send({
                                "code": 300,
                                "message": "Email ID already exist."
                            });
                            return;
                        } else if (results[0][0].MOBILE_NO === data.MOBILE_NO) {
                            res.send({
                                "code": 300,
                                "message": "Mobile number already exist."
                            });
                            return;
                        }
                    } else {
                        console.log("results1111111111", results);
                        if (results[1].length > 0 && results[1][0].SHORT_CODE === data.SHORT_CODE) {
                            return res.send({
                                "code": 300,
                                "message": "Short code already exist."
                            });
                        } else {
                            data.IS_PARENT = 1;
                            mm.executeDML('INSERT INTO customer_email_master SET ?', data, supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save customer information."
                                    });
                                } else {
                                    custdata.CUSTOMER_DETAILS_ID = results.insertId;
                                    custdata.IS_PARENT = 1;
                                    mm.executeDML(`INSERT INTO customer_master SET ? `, custdata, supportKey, connection, (error, results1) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to save customer information."
                                            });
                                        } else {
                                            if (data.CUSTOMER_TYPE == "B") {
                                                mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to get slot information."
                                                        });
                                                    } else {
                                                        mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID,CUSTOMER_DETAILS_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)', [0, "C", results1.insertId, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1, results1.insertId], supportKey, connection, (error, resultsglobal) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                console.log(error);
                                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to save globalTimeSlotMapping information..."
                                                                });
                                                            }
                                                            else {
                                                                mm.sendDynamicEmail(1, results1.insertId, supportKey)
                                                                addGlobalData(results1.insertId, supportKey)
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer${data.NAME}.`;
                                                                var logCategory = "customer"

                                                                let actionLog = {
                                                                    SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654", CUSTOMER_DETAILS_ID: results1.insertId
                                                                }
                                                                dbm.saveLog(actionLog, systemLog)

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
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "Customer information saved successfully.",
                                                                    "ID": results1.insertId,
                                                                    "CUSTOMER_DETAILS_ID": results.insertId
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            } else {
                                                mm.sendDynamicEmail(1, results1.insertId, supportKey)
                                                addGlobalData(results.insertId, supportKey)

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
                                                var logCategory = "customer"

                                                let actionLog = {
                                                    SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654", CUSTOMER_DETAILS_ID: results1.insertId
                                                }
                                                dbm.saveLog(actionLog, systemLog)
                                                mm.commitConnection(connection);
                                                res.send({
                                                    "code": 200,
                                                    "message": "Customer information saved successfully.",
                                                    "ID": results1.insertId,
                                                    "CUSTOMER_DETAILS_ID": results.insertId
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
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
};

exports.create = (req, res) => {
    var data = reqData(req);
    var custdata = customerData(req);
    // data.PASSWORD = generateRandomAlphanumeric();
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
                            custdata.PASSWORD = data.PASSWORD;
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
                                var templateName = "welcome_customers"
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

exports.updateOLD = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var custdata = customerData(req);
    console.log("req.body", req.body);
    var CUSTOMER_MASTER_ID = req.body.CUSTOMER_MASTER_ID ? req.body.CUSTOMER_MASTER_ID : req.body.ID
    var CUSTOMER_EMAIL_ID = req.body.CUSTOMER_DETAILS_ID ? req.body.CUSTOMER_DETAILS_ID : req.body.ID

    var supportKey = req.headers['supportkey'];
    var criteria = { ID: req.body.ID };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];

    Object.keys(data).forEach(key => {
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE (EMAIL = ? OR MOBILE_NO = ?) AND ID != ?;SELECT * FROM customer_master WHERE SHORT_CODE = ?`, [data.EMAIL, data.MOBILE_NO, CUSTOMER_MASTER_ID, data.SHORT_CODE], supportKey, connection, (error, results) => {
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
                if (data.CUSTOMER_TYPE === "B") {
                    // Check for existing short code
                    if (results[1].some(row => row.SHORT_CODE.toLowerCase() === data.SHORT_CODE.toLowerCase()) && results[1][0].ID !== CUSTOMER_MASTER_ID) {
                        console.log("result11", results);
                        mm.rollbackConnection(connection);
                        return res.send({
                            "code": 300,
                            "message": "Short code already exist."
                        });
                    } else {
                        mm.executeDML(`UPDATE customer_email_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_EMAIL_ID}`, recordData, supportKey, connection, (error, results) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update customer information."
                                });
                            } else {
                                mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                    if (error) {
                                        mm.rollbackConnection(connection)
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update customer information."
                                        });
                                    } else {
                                        if (data.CUSTOMER_TYPE == "B") {
                                            mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get slot information."
                                                    });
                                                } else {
                                                    mm.executeDML('SELECT * FROM global_time_slots_mapping WHERE MAPPING_FOR = "C" AND MAPPING_ID = ?', [criteria.ID], supportKey, connection, (error, resultGetSlot) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection)
                                                            console.log(error);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to get slot information."
                                                            });
                                                        } else {
                                                            if (resultGetSlot.length > 0) {
                                                                // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                addGlobalData(results.insertId, supportKey)
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                var logCategory = "customer"

                                                                let actionLog = {
                                                                    SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                }
                                                                // console.log("ascending", actionLog);
                                                                dbm.saveLog(actionLog, systemLog)
                                                                // systemLog.create(actionLog);
                                                                mm.commitConnection(connection);
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "Customer information saved successfully.",
                                                                    "ID": results.insertId
                                                                });
                                                            } else {
                                                                mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "C", criteria.ID, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, connection, (error, resultsglobal) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection)
                                                                        console.log(error);
                                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to save globalTimeSlotMapping information..."
                                                                        });
                                                                    }
                                                                    else {
                                                                        // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                        addGlobalData(results.insertId, supportKey)
                                                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                        var logCategory = "customer"

                                                                        let actionLog = {
                                                                            SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                        }
                                                                        // console.log("ascending", actionLog);
                                                                        dbm.saveLog(actionLog, systemLog)
                                                                        // systemLog.create(actionLog);
                                                                        mm.commitConnection(connection)
                                                                        res.send({
                                                                            "code": 200,
                                                                            "message": "Customer information saved successfully.",
                                                                            "ID": results.insertId
                                                                        });
                                                                    }
                                                                });
                                                            }

                                                        }
                                                    });
                                                }
                                            });

                                        } else {

                                            addGlobalData(criteria.ID, supportKey)
                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                                            var logCategory = "customer"

                                            let actionLog = {
                                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                            }
                                            dbm.saveLog(actionLog, systemLog)
                                            mm.commitConnection(connection);
                                            res.send({
                                                "code": 200,
                                                "message": "customer information updated successfully...",
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                } else {
                    mm.executeDML(`UPDATE customer_email_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_EMAIL_ID}`, recordData, supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection)
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update customer information."
                            });
                        } else {
                            mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection)
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update customer information."
                                    });
                                } else {
                                    if (data.CUSTOMER_TYPE == "B") {
                                        mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                            if (error) {
                                                mm.rollbackConnection(connection)
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to get slot information."
                                                });
                                            } else {
                                                mm.executeDML('SELECT * FROM global_time_slots_mapping WHERE MAPPING_FOR = "C" AND MAPPING_ID = ?', [criteria.ID], supportKey, connection, (error, resultGetSlot) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection)
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to get slot information."
                                                        });
                                                    } else {
                                                        if (resultGetSlot.length > 0) {
                                                            // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                            addGlobalData(results.insertId, supportKey)
                                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                            var logCategory = "customer"

                                                            let actionLog = {
                                                                SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                            }
                                                            // console.log("ascending", actionLog);
                                                            dbm.saveLog(actionLog, systemLog)
                                                            // systemLog.create(actionLog);
                                                            mm.commitConnection(connection);
                                                            res.send({
                                                                "code": 200,
                                                                "message": "Customer information saved successfully.",
                                                                "ID": results.insertId
                                                            });
                                                        } else {
                                                            mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "C", criteria.ID, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, connection, (error, resultsglobal) => {
                                                                if (error) {
                                                                    mm.rollbackConnection(connection)
                                                                    console.log(error);
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to save globalTimeSlotMapping information..."
                                                                    });
                                                                }
                                                                else {
                                                                    // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                    addGlobalData(results.insertId, supportKey)
                                                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                    var logCategory = "customer"

                                                                    let actionLog = {
                                                                        SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                    }
                                                                    // console.log("ascending", actionLog);
                                                                    dbm.saveLog(actionLog, systemLog)
                                                                    // systemLog.create(actionLog);
                                                                    mm.commitConnection(connection)
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "Customer information saved successfully.",
                                                                        "ID": results.insertId
                                                                    });
                                                                }
                                                            });
                                                        }

                                                    }
                                                });
                                            }
                                        });
                                    } else {

                                        addGlobalData(criteria.ID, supportKey)
                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                                        var logCategory = "customer"

                                        let actionLog = {
                                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                        }
                                        dbm.saveLog(actionLog, systemLog)
                                        mm.commitConnection(connection);
                                        res.send({
                                            "code": 200,
                                            "message": "customer information updated successfully...",
                                        });
                                    }
                                }
                            });
                        }
                    });
                }
            })
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Internal Server Error."
            });
        }
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var custdata = customerData(req);
    console.log("req.body", req.body);
    var CUSTOMER_MASTER_ID = req.body.CUSTOMER_MASTER_ID ? req.body.CUSTOMER_MASTER_ID : req.body.ID
    var CUSTOMER_EMAIL_ID = req.body.CUSTOMER_DETAILS_ID ? req.body.CUSTOMER_DETAILS_ID : req.body.ID

    var supportKey = req.headers['supportkey'];
    var criteria = { ID: req.body.ID };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];

    Object.keys(data).forEach(key => {
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE (EMAIL = ? OR MOBILE_NO = ?) AND ID != ?;SELECT * FROM customer_master WHERE SHORT_CODE = ?`, [data.EMAIL, data.MOBILE_NO, CUSTOMER_MASTER_ID, data.SHORT_CODE], supportKey, connection, (error, results) => {
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
                if (data.CUSTOMER_TYPE === "B") {
                    // Check for existing short code
                    if (results[1].some(row => row.SHORT_CODE.toLowerCase() === data.SHORT_CODE.toLowerCase()) && results[1][0].ID !== CUSTOMER_MASTER_ID) {
                        console.log("result11", results);
                        mm.rollbackConnection(connection);
                        return res.send({
                            "code": 300,
                            "message": "Short code already exist."
                        });
                    } else {
                        if (data.IS_PARENT) {
                            mm.executeDML(`UPDATE customer_email_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_EMAIL_ID}`, recordData, supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection)
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update customer information."
                                    });
                                } else {
                                    mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection)
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update customer information."
                                            });
                                        } else {
                                            if (data.CUSTOMER_TYPE == "B") {
                                                mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection)
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to get slot information."
                                                        });
                                                    } else {
                                                        mm.executeDML('SELECT * FROM global_time_slots_mapping WHERE MAPPING_FOR = "C" AND MAPPING_ID = ?', [criteria.ID], supportKey, connection, (error, resultGetSlot) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection)
                                                                console.log(error);
                                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to get slot information."
                                                                });
                                                            } else {
                                                                if (resultGetSlot.length > 0) {
                                                                    // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                    addGlobalData(results.insertId, supportKey)
                                                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                    var logCategory = "customer"

                                                                    let actionLog = {
                                                                        SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                    }
                                                                    // console.log("ascending", actionLog);
                                                                    dbm.saveLog(actionLog, systemLog)
                                                                    // systemLog.create(actionLog);
                                                                    mm.commitConnection(connection);
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "Customer information saved successfully.",
                                                                        "ID": results.insertId
                                                                    });
                                                                } else {
                                                                    mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "C", criteria.ID, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, connection, (error, resultsglobal) => {
                                                                        if (error) {
                                                                            mm.rollbackConnection(connection)
                                                                            console.log(error);
                                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                            res.send({
                                                                                "code": 400,
                                                                                "message": "Failed to save globalTimeSlotMapping information..."
                                                                            });
                                                                        }
                                                                        else {
                                                                            // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                            addGlobalData(results.insertId, supportKey)
                                                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                            var logCategory = "customer"

                                                                            let actionLog = {
                                                                                SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                            }
                                                                            // console.log("ascending", actionLog);
                                                                            dbm.saveLog(actionLog, systemLog)
                                                                            // systemLog.create(actionLog);
                                                                            mm.commitConnection(connection)
                                                                            res.send({
                                                                                "code": 200,
                                                                                "message": "Customer information saved successfully.",
                                                                                "ID": results.insertId
                                                                            });
                                                                        }
                                                                    });
                                                                }

                                                            }
                                                        });
                                                    }
                                                });

                                            } else {

                                                addGlobalData(criteria.ID, supportKey)
                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                                                var logCategory = "customer"

                                                let actionLog = {
                                                    "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                }
                                                dbm.saveLog(actionLog, systemLog)
                                                mm.commitConnection(connection);
                                                res.send({
                                                    "code": 200,
                                                    "message": "customer information updated successfully...",
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        else {
                            mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection)
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update customer information."
                                    });
                                } else {
                                    if (data.CUSTOMER_TYPE == "B") {
                                        mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                            if (error) {
                                                mm.rollbackConnection(connection)
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to get slot information."
                                                });
                                            } else {
                                                mm.executeDML('SELECT * FROM global_time_slots_mapping WHERE MAPPING_FOR = "C" AND MAPPING_ID = ?', [criteria.ID], supportKey, connection, (error, resultGetSlot) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection)
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to get slot information."
                                                        });
                                                    } else {
                                                        if (resultGetSlot.length > 0) {
                                                            // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                            addGlobalData(results.insertId, supportKey)
                                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                            var logCategory = "customer"

                                                            let actionLog = {
                                                                SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                            }
                                                            // console.log("ascending", actionLog);
                                                            dbm.saveLog(actionLog, systemLog)
                                                            // systemLog.create(actionLog);
                                                            mm.commitConnection(connection);
                                                            res.send({
                                                                "code": 200,
                                                                "message": "Customer information saved successfully.",
                                                                "ID": results.insertId
                                                            });
                                                        } else {
                                                            mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "C", criteria.ID, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, connection, (error, resultsglobal) => {
                                                                if (error) {
                                                                    mm.rollbackConnection(connection)
                                                                    console.log(error);
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to save globalTimeSlotMapping information..."
                                                                    });
                                                                }
                                                                else {
                                                                    // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                    addGlobalData(results.insertId, supportKey)
                                                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                    var logCategory = "customer"

                                                                    let actionLog = {
                                                                        SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                    }
                                                                    // console.log("ascending", actionLog);
                                                                    dbm.saveLog(actionLog, systemLog)
                                                                    // systemLog.create(actionLog);
                                                                    mm.commitConnection(connection)
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "Customer information saved successfully.",
                                                                        "ID": results.insertId
                                                                    });
                                                                }
                                                            });
                                                        }

                                                    }
                                                });
                                            }
                                        });

                                    } else {

                                        addGlobalData(criteria.ID, supportKey)
                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                                        var logCategory = "customer"

                                        let actionLog = {
                                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                        }
                                        dbm.saveLog(actionLog, systemLog)
                                        mm.commitConnection(connection);
                                        res.send({
                                            "code": 200,
                                            "message": "customer information updated successfully...",
                                        });
                                    }
                                }
                            });
                        }

                    }
                } else {
                    if (data.IS_PARENT == 1) {
                        mm.executeDML(`UPDATE customer_email_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_EMAIL_ID}`, recordData, supportKey, connection, (error, results) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update customer information."
                                });
                            } else {
                                mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                    if (error) {
                                        mm.rollbackConnection(connection)
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update customer information."
                                        });
                                    } else {
                                        if (data.CUSTOMER_TYPE == "B") {
                                            mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get slot information."
                                                    });
                                                } else {
                                                    mm.executeDML('SELECT * FROM global_time_slots_mapping WHERE MAPPING_FOR = "C" AND MAPPING_ID = ?', [criteria.ID], supportKey, connection, (error, resultGetSlot) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection)
                                                            console.log(error);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to get slot information."
                                                            });
                                                        } else {
                                                            if (resultGetSlot.length > 0) {
                                                                // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                addGlobalData(results.insertId, supportKey)
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                var logCategory = "customer"

                                                                let actionLog = {
                                                                    SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                }
                                                                // console.log("ascending", actionLog);
                                                                dbm.saveLog(actionLog, systemLog)
                                                                // systemLog.create(actionLog);
                                                                mm.commitConnection(connection);
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "Customer information saved successfully.",
                                                                    "ID": results.insertId
                                                                });
                                                            } else {
                                                                mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "C", criteria.ID, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, connection, (error, resultsglobal) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection)
                                                                        console.log(error);
                                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                        res.send({
                                                                            "code": 400,
                                                                            "message": "Failed to save globalTimeSlotMapping information..."
                                                                        });
                                                                    }
                                                                    else {
                                                                        // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                        addGlobalData(results.insertId, supportKey)
                                                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                        var logCategory = "customer"

                                                                        let actionLog = {
                                                                            SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                        }
                                                                        // console.log("ascending", actionLog);
                                                                        dbm.saveLog(actionLog, systemLog)
                                                                        // systemLog.create(actionLog);
                                                                        mm.commitConnection(connection)
                                                                        res.send({
                                                                            "code": 200,
                                                                            "message": "Customer information saved successfully.",
                                                                            "ID": results.insertId
                                                                        });
                                                                    }
                                                                });
                                                            }

                                                        }
                                                    });
                                                }
                                            });
                                        } else {

                                            addGlobalData(criteria.ID, supportKey)
                                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                                            var logCategory = "customer"

                                            let actionLog = {
                                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                            }
                                            dbm.saveLog(actionLog, systemLog)
                                            mm.commitConnection(connection);
                                            res.send({
                                                "code": 200,
                                                "message": "customer information updated successfully...",
                                            });
                                        }
                                    }
                                });
                            }
                        });
                    }
                    else {
                        mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${CUSTOMER_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                            if (error) {
                                mm.rollbackConnection(connection)
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update customer information."
                                });
                            } else {
                                if (data.CUSTOMER_TYPE == "B") {
                                    mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                        if (error) {
                                            mm.rollbackConnection(connection)
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get slot information."
                                            });
                                        } else {
                                            mm.executeDML('SELECT * FROM global_time_slots_mapping WHERE MAPPING_FOR = "C" AND MAPPING_ID = ?', [criteria.ID], supportKey, connection, (error, resultGetSlot) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection)
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get slot information."
                                                    });
                                                } else {
                                                    if (resultGetSlot.length > 0) {
                                                        // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                        addGlobalData(results.insertId, supportKey)
                                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                        var logCategory = "customer"

                                                        let actionLog = {
                                                            SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                        }
                                                        // console.log("ascending", actionLog);
                                                        dbm.saveLog(actionLog, systemLog)
                                                        // systemLog.create(actionLog);
                                                        mm.commitConnection(connection);
                                                        res.send({
                                                            "code": 200,
                                                            "message": "Customer information saved successfully.",
                                                            "ID": results.insertId
                                                        });
                                                    } else {
                                                        mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [0, "C", criteria.ID, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1], supportKey, connection, (error, resultsglobal) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection)
                                                                console.log(error);
                                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to save globalTimeSlotMapping information..."
                                                                });
                                                            }
                                                            else {
                                                                // sendWelcomeEmail(data.EMAIL, data.NAME, data.MOBILE_NO);
                                                                addGlobalData(results.insertId, supportKey)
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new customer  ${data.NAME}.`;
                                                                var logCategory = "customer"

                                                                let actionLog = {
                                                                    SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654"
                                                                }
                                                                // console.log("ascending", actionLog);
                                                                dbm.saveLog(actionLog, systemLog)
                                                                // systemLog.create(actionLog);
                                                                mm.commitConnection(connection)
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "Customer information saved successfully.",
                                                                    "ID": results.insertId
                                                                });
                                                            }
                                                        });
                                                    }

                                                }
                                            });
                                        }
                                    });
                                } else {

                                    addGlobalData(criteria.ID, supportKey)
                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of  ${data.NAME}.`;
                                    var logCategory = "customer"

                                    let actionLog = {
                                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                    }
                                    dbm.saveLog(actionLog, systemLog)
                                    mm.commitConnection(connection);
                                    res.send({
                                        "code": 200,
                                        "message": "customer information updated successfully...",
                                    });
                                }
                            }
                        });
                    }

                }
            })
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Internal Server Error."
            });
        }
    }
};

exports.getCustomerDetails = (req, res) => {

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
            mm.executeQuery('select count(*) as cnt from view_customer_email_master where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customer count.",
                    });
                }
                else {
                    mm.executeQuery('select *,(SELECT ID FROM customer_master WHERE customer_master.CUSTOMER_DETAILS_ID = view_customer_email_master.ID AND customer_master.IS_PARENT = 1) AS CUSTOMER_MASTER_ID  from view_customer_email_master where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customer information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 203,
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


exports.deleteProfile = (req, res) => {
    try {
        var CUSTOMER_ID = req.body.CUSTOMER_ID;
        var CUSTOMER_NAME = req.body.NAME;
        var MOBILE_NO = req.body.MOBILE_NO;
        var supportKey = req.headers["supportkey"]; //Supportkey ;
        var systemDate = mm.getSystemDate();
        if (CUSTOMER_ID) {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE ID = ?`, [CUSTOMER_ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate customer email."
                    });
                } else {
                    if (results.length > 0) {
                        mm.executeDML(`UPDATE customer_master SET ACCOUNT_STATUS = ?, IS_DELETED_BY_CUSTOMER = ? WHERE ID = ?`, [0, 1, CUSTOMER_ID], supportKey, connection, async (error, resultsUpdate) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).send({
                                    code: 400,
                                    message: "Failed to update mobile verified in registration attempt details.",
                                });
                            } else {
                                mm.executeDML(`UPDATE customer_email_master SET ACCOUNT_STATUS = ?, IS_DELETED_BY_CUSTOMER = ? WHERE MOBILE_NO = ?`, [0, 1, MOBILE_NO], supportKey, connection, async (error, resultsUpdate1) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection);
                                        res.status(400).send({
                                            code: 400,
                                            message: "Failed to update mobile verified in registration attempt details.",
                                        });
                                    } else {
                                        mm.executeDML(`insert into customer_deletion_logs (CUSTOMER_ID,DELETED_DATE_TIME) values(?,?)`, [CUSTOMER_ID, systemDate], supportKey, connection, async (error, resultLogs) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                res.status(400).send({
                                                    code: 400,
                                                    message: "Failed to update mobile verified in registration attempt details.",
                                                });
                                            } else {
                                                mm.sendNotificationToAdmin(8, "Customer Profile Deleted", "Hello admin customer " + CUSTOMER_NAME + " has deleted his profile", "", "CA", "", supportKey, "", "")
                                                // mm.sendDynamicEmail(1, resultCustomer2.insertId, supportKey)
                                                addGlobalData(CUSTOMER_ID, supportKey)
                                                mm.commitConnection(connection);
                                                res.status(200).send({
                                                    code: 200,
                                                    message: "Customer profile deleted successfully.",
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
        } else {
            res.status(400).send({
                code: 400,
                message: "Please provide customer id.",
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};



exports.activateProfile = (req, res) => {
    try {
        var CUSTOMER_ID = req.body.CUSTOMER_ID;
        var CUSTOMER_NAME = req.body.NAME;
        var MOBILE_NO = req.body.MOBILE_NO;
        var IS_B2C = req.body.IS_B2C;
        var supportKey = req.headers["supportkey"]; //Supportkey ;
        var systemDate = mm.getSystemDate();
        if (CUSTOMER_ID) {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE ID = ?`, [CUSTOMER_ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate customer email."
                    });
                } else {
                    if (results.length > 0) {
                        mm.executeDML(`UPDATE customer_master SET ACCOUNT_STATUS = ?, IS_DELETED_BY_CUSTOMER = ? WHERE ID = ?`, [1, 0, CUSTOMER_ID], supportKey, connection, async (error, resultsUpdate) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).send({
                                    code: 400,
                                    message: "Failed to update mobile verified in registration attempt details.",
                                });
                            } else {
                                mm.executeDML(`UPDATE customer_email_master SET ACCOUNT_STATUS = ?, IS_DELETED_BY_CUSTOMER = ? WHERE MOBILE_NO = ?`, [1, 0, MOBILE_NO], supportKey, connection, async (error, resultsUpdate1) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection);
                                        res.status(400).send({
                                            code: 400,
                                            message: "Failed to update mobile verified in registration attempt details.",
                                        });
                                    } else {
                                        mm.executeDML(`insert into customer_deletion_logs (CUSTOMER_ID,ACTIVATE_DATE_TIME) values(?,?)`, [CUSTOMER_ID, systemDate], supportKey, connection, async (error, resultLogs) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                res.status(400).send({
                                                    code: 400,
                                                    message: "Failed to update mobile verified in registration attempt details.",
                                                });
                                            } else {
                                                mm.sendDynamicEmail(17, CUSTOMER_ID, supportKey)
                                                if (results[0].CUSTOMER_TYPE == "B") {
                                                    var wBparams = [
                                                        {
                                                            "type": "text",
                                                            "text": results[0].NAME
                                                        }
                                                    ]

                                                    var wparams = [
                                                        {
                                                            "type": "body",
                                                            "parameters": wBparams
                                                        }
                                                    ]

                                                    mm.sendWAToolSMS(MOBILE_NO, "reactivate_customer", wparams, 'en', (error, resultswsms) => {
                                                        if (error) {
                                                            console.log(error)
                                                        }
                                                        else {
                                                            console.log("Message sent successfully")
                                                        }
                                                    })
                                                }

                                                addGlobalData(CUSTOMER_ID, supportKey)
                                                mm.commitConnection(connection);
                                                res.status(200).send({
                                                    code: 200,
                                                    message: "Customer profile activated successfully.",
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
        } else {
            res.status(400).send({
                code: 400,
                message: "Please provide customer id.",
            });
        }
    }
    catch (error) {
        console.log(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.customerlogin = (req, res) => {
    try {
        var systemDate = mm.getSystemDate();
        var username = req.body.username;
        var password = req.body.password;
        var type = req.body.type;
        var supportKey = req.headers['supportkey'];

        if ((!username || username == ' ') || (!password || password == ' ')) {
            res.send({
                "code": 400,
                "message": "username or password parameter missing.",
            });
        }
        else {
            password = md5(password);
            console.log("username", username);
            console.log("password", password);
            const connection = mm.openConnection();
            mm.executeDML(`SELECT ID,NAME,EMAIL,PROFILE_PHOTO from customer_master WHERE   EMAIL=? and PASSWORD =? and ACCOUNT_STATUS = 1 and CUSTOMER_TYPE = 'B'`, [username, password], supportKey, connection, async (error, results1) => {
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
                        var USER_ID = results1[0].ID;
                        const subscribedChannels1 = await channelSubscribedUsers.find({
                            USER_ID: USER_ID,
                            TYPE: "C",
                            STATUS: true
                        });
                        var userDetails = [{
                            USER_ID: USER_ID,
                            USER_NAME: results1[0].NAME,
                            EMAIL_ID: results1[0].EMAIL,
                            CLIENT_ID: 1,
                            isPresent: 1,
                            // SUBSCRIBED_CHANNELS: subscribedChannels1,
                            ROLE_ID: 27,
                            PROFILE_PHOTO: results1[0].PROFILE_PHOTO
                        }]

                        var userDetails1 = [{
                            USER_ID: USER_ID,
                            USER_NAME: results1[0].NAME,
                            NAME: results1[0].NAME,
                            EMAIL_ID: results1[0].EMAIL,
                            CLIENT_ID: 1,
                            ROLE_ID: 27
                        }]
                        var userDetails1 = {
                            "ID": results1[0].ID,
                            "USER_TYPE": "C",
                            "CUSTOMER_TYPE": "B",
                        }
                        mm.commitConnection(connection);
                        generateToken(results1[0].ID, res, userDetails, "1", userDetails1);

                    }
                    else {
                        mm.rollbackConnection(connection)
                        res.send({
                            "code": 404,
                            "message": "Incorrect username or password"
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}




exports.changeCustomerPassword = (req, res) => {
    var USER_ID = req.body.USER_ID;
    var USER_NAME = req.body.USER_NAME
    var NEW_PASSWORD = req.body.NEW_PASSWORD;
    NEW_PASSWORD = md5(NEW_PASSWORD);
    var systemDate = mm.getSystemDate();
    var deviceid = req.headers['deviceid'];
    var supportKey = req.headers['supportkey'];

    try {
        mm.executeQueryData('select ID,NAME from customer_master where  ID=? and EMAIL=? and ACCOUNT_STATUS = 1 and CUSTOMER_TYPE = "B"', [USER_ID, USER_NAME], supportKey, (error, resultsUser) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    "code": 400,
                    "message": "Failed to save user information..."
                });
            } else {
                if (resultsUser.length > 0) {
                    mm.executeQueryData(`UPDATE customer_master SET PASSWORD =?, CREATED_MODIFIED_DATE =? where ID = ? `, [NEW_PASSWORD, systemDate, USER_ID], supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update user information."
                            });
                        } else {
                            mm.executeQueryData(`UPDATE customer_email_master SET PASSWORD =?, CREATED_MODIFIED_DATE =? where  EMAIL = ? `, [NEW_PASSWORD, systemDate, USER_NAME], supportKey, (error, results) => {
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
                    });
                }
                else {
                    res.send({
                        "code": 400,
                        "message": "invalid customer"
                    });
                }
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        console.log(error);
    }
}

exports.sendotpforchangepassword = (req, res) => {
    var TYPE = "E";
    var TYPE_VALUE = req.body.username;
    var systemDate = mm.getSystemDate();
    var COUNTRY_CODE = req.body.COUNTRY_CODE;
    var supportKey = req.headers["supportkey"];
    try {
        if (TYPE && TYPE != " " && TYPE_VALUE && TYPE_VALUE != " ") {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE (MOBILE_NO = ? or EMAIL = ?) AND ACCOUNT_STATUS=1 AND CUSTOMER_TYPE = "B" `, [TYPE_VALUE, TYPE_VALUE], supportKey, connection, (error, resultsUser) => {
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

                        var OTP
                        if ((TYPE_VALUE == "8669806792" || TYPE_VALUE == "7721909974") && TYPE == "M") {
                            OTP = 1234;
                        } else {
                            // OTP = Math.floor(1000 + Math.random() * 9000);
                            OTP = 1234;
                        }
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

                                    sendOtppassword("E", TYPE_VALUE, "OTP Verify", body, OTP, resultsUser[0].NAME, supportKey, (err, result) => {
                                        if (err) {
                                            console.log(err);
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                code: 400,
                                                message: "Failed to send OTP",
                                            });
                                        } else {
                                            console.log("OTP send to mobile ");
                                            mm.commitConnection(connection);
                                            res.send({
                                                code: 200,
                                                message: "OTP sent to mobile.",
                                                RID: resultsRegistarGetRes[0].ID,
                                                VID: result,
                                                USER_ID: resultsUser[0].ID,
                                                USER_NAME: resultsUser[0].NAME,
                                                EMAIL: resultsUser[0].EMAIL,
                                                CUSTOMER_TYPE: resultsUser[0].CUSTOMER_TYPE
                                            });
                                        }
                                    });
                                } else {
                                    var query = '';
                                    var dataSet = []
                                    if (TYPE == 'E') {
                                        query = `INSERT INTO registration_attempt_details(IS_REGISTERED,REGISTRATION_FOR,EMAIL_ID,IS_EMAIL_VERIFIED,EMAIL_VERIFICATION_DATETIME,EMAIL_OTP,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                        dataSet = [0, 'Customer', TYPE_VALUE, 0, null, OTP, systemDate, TYPE]
                                    }
                                    //  else {
                                    //     query = `INSERT INTO registration_attempt_details(MOBILE_NO,IS_MOBILE_VERIFIED,MOBILE_VERIFICATION_DATETIME,MOBILE_OTP,IS_REGISTERED,REGISTRATION_FOR,REGISTRATION_DATETIME,TYPE) values(?,?,?,?,?,?,?,?)`
                                    //     dataSet = [TYPE_VALUE, 0, null, OTP, 0, 'Customer', systemDate, TYPE]
                                    // }
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
                                                    console.log("OTP send to mobile ");
                                                    mm.commitConnection(connection);
                                                    res.send({
                                                        code: 200,
                                                        message: "OTP sent to mobile.",
                                                        RID: resultsRegistar.insertId,
                                                        VID: result,
                                                        isPresent: 1,
                                                        USER_ID: resultsUser.length > 0 ? resultsUser[0].ID : 0,
                                                        USER_NAME: resultsUser[0].NAME,
                                                        CUSTOMER_TYPE: resultsUser[0].CUSTOMER_TYPE,
                                                        EMAIL: resultsUser[0].EMAIL
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });

                    } else {
                        mm.rollbackConnection(connection);
                        res.status(400).send({
                            code: 400,
                            message: "User not found.",
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

function sendOtppassword(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var systemDate = mm.getSystemDate();
    console.log("TYPE : ", TYPE, "TYPE_VALUE :", TYPE_VALUE);
    var subject = "Customer Otp Support"
    var otpText1
    if (TYPE == "M") {
        // otpText1 = `Dear customer, please share OTP ${OTP} with our technician to complete your order. For queries, contact PockIT Team.Team UVtechSoft.`;
        otpText1 = `Your one-time password (OTP) is ${OTP}. Please enter this code to complete your login. This code is valid for 10 minutes. Team UVtechSoft.`;
    } else {
        otpText1 = `<p style="text-align: justify;"><strong>Dear Customer,</strong></p><p style="text-align: justify;">Your one-time password (OTP) to change password is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team PockIT</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><p>`;
    }
    var otpSendStatus = "S";
    const connection = mm.openConnection();
    console.log("\n\n\n\n\n\nInserting otp details");
    mm.executeDML(`INSERT INTO registration_otp_details(TYPE,TYPE_VALUE,OTP,OTP_MESSAGE,REQUESTED_DATETIME,CLIENT_ID,STATUS,IS_VERIFIED,OTP_TYPE) values(?,?,?,?,?,?,?,?,?)`, [TYPE, TYPE_VALUE, OTP, otpText1, systemDate, 1, 'S', '0', 'C'], supportKey, connection, (error, insertOtpDetails) => {
        if (error) {
            console.log(error);
            mm.rollbackConnection(connection);
            callback(error);
        }
        else {
            sendSMSEmail(TYPE, TYPE_VALUE, OTP, subject, otpText1, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    callback(error);
                }
                else {
                    const VID = insertOtpDetails.insertId;
                    mm.commitConnection(connection);
                    callback(null, VID);
                }
            });
        }
    });
}


exports.verifyOTPpassword = (req, res) => {
    try {
        var TYPE = "E";
        var TYPE_VALUE = req.body.EMAIL_ID;
        var OTP = req.body.OTP;
        var USER_ID = req.body.USER_ID;
        var supportKey = req.headers["supportkey"]; //Supportkey ;
        var systemDate = mm.getSystemDate();
        if (TYPE != " " && TYPE_VALUE != " " && OTP != " ") {
            var connection = mm.openConnection();
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
                    // console.log("OTP results ", results);
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
                                    console.log("USER_ID", USER_ID)
                                    mm.commitConnection(connection);
                                    res.status(200).send({
                                        code: 200,
                                        message: "OTP verified successfully.",
                                    });

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
                message: "mobileno or OTP or registrationAttemptId parameter missing.",
            });
        }
    } catch (error) {
        console.log(error);
    }
};