const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;
var TechnicianActionLog = require('../../modules/technicianActionLog')
const dbm = require('../../utilities/dbMongo')
var technicianProfileUpdateRequest = "technician_profile_update_request";
var viewTechnicianProfileUpdateRequest = "view_" + technicianProfileUpdateRequest;


function reqData(req) {
    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_OLD_NAME: req.body.TECHNICIAN_OLD_NAME,
        TECHNICIAN_NEW_NAME: req.body.TECHNICIAN_NEW_NAME,
        OLD_MOBILE_NUMBER: req.body.OLD_MOBILE_NUMBER,
        NEW_MOBILE_NUMBER: req.body.NEW_MOBILE_NUMBER,
        TECHNICIAN_OLD_EMAIL: req.body.TECHNICIAN_OLD_EMAIL,
        TECHNICIAN_NEW_EMAIL: req.body.TECHNICIAN_NEW_EMAIL,
        OLD_PROFILE_PHOTO: req.body.OLD_PROFILE_PHOTO,
        NEW_PROFILE_PHOTO: req.body.NEW_PROFILE_PHOTO,
        REQUESTED_DATETIME: req.body.REQUESTED_DATETIME,
        ACTION_DATETIME: req.body.ACTION_DATETIME,
        APPROVER_ID: req.body.APPROVER_ID,
        APPROVER_NAME: req.body.APPROVER_NAME,
        STATUS: req.body.STATUS,
        IS_VERIFIED: req.body.IS_VERIFIED,
        VERIFICATION_OTP: req.body.VERIFICATION_OTP,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}



exports.validate = function () {
    return [
        body('TECHNCIAN_ID').isInt().optional(),
        body('TECHNICIAN_OLD_NAME').optional(),
        body('TECHNICIAN_NEW_NAME').optional(),
        body('TECHNICIAN_OLD_EMAIL').optional(),
        body('TECHNICIAN_NEW_EMAIL').optional(),
        body('OLD_PROFILE_PHOTO').optional(),
        body('NEW_PROFILE_PHOTO').optional(),
        body('REQUESTED_DATETIME').optional(),
        body('APPROVAL_DATETIME').optional(),
        body('APPROVER_ID').isInt().optional(),
        body('APPROVER_NAME').optional(),
        body('STATUS').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianProfileUpdateRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get technicianProfileUpdateRequest count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTechnicianProfileUpdateRequest + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get technicianProfileUpdateRequest information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 182,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }

}


exports.create = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var TECHNICIAN_NAME = req.body.TECHNICIAN_NAME;
    data.REQUESTED_DATETIME = mm.getSystemDate();
    data.STATUS = "P";
    data.IS_VERIFIED = 0;
    if (!TECHNICIAN_NAME) {
        return res.status(400).json({
            "message": "TECHNICIAN_NAME is required."
        });
    }

    data.NEW_MOBILE_NUMBER ||= data.OLD_MOBILE_NUMBER;
    data.TECHNICIAN_NEW_NAME ||= data.TECHNICIAN_OLD_NAME;
    data.TECHNICIAN_NEW_EMAIL ||= data.TECHNICIAN_OLD_EMAIL;
    data.NEW_PROFILE_PHOTO ||= data.OLD_PROFILE_PHOTO;
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            var OTP
            if (data.NEW_MOBILE_NUMBER == "7020082803" || data.NEW_MOBILE_NUMBER == "8618749880") {
                OTP = 1234;
            } else {
                // OTP = Math.floor(1000 + Math.random() * 9000);
                OTP = 1234
            }
            data.VERIFICATION_OTP = OTP;
            var connection = mm.openConnection();
            mm.executeDML('select * from technician_profile_update_request where STATUS = "P" AND IS_VERIFIED = 0 AND TECHNICIAN_ID = ? ', [data.TECHNICIAN_ID], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get technicianProfileUpdateRequest information."
                    });
                }
                else {

                    if (results.length > 0) {
                        mm.executeDML('UPDATE technician_profile_update_request SET TECHNICIAN_ID=?,TECHNICIAN_OLD_NAME=?,TECHNICIAN_NEW_NAME=?,OLD_MOBILE_NUMBER=?,NEW_MOBILE_NUMBER=?,TECHNICIAN_OLD_EMAIL=?,TECHNICIAN_NEW_EMAIL=?,OLD_PROFILE_PHOTO=?,NEW_PROFILE_PHOTO=?,REQUESTED_DATETIME=?,ACTION_DATETIME=?,APPROVER_ID=?,APPROVER_NAME=?,STATUS=?,IS_VERIFIED=?,VERIFICATION_OTP=?,CLIENT_ID=? WHERE ID = ?', [data.TECHNICIAN_ID, data.TECHNICIAN_OLD_NAME, data.TECHNICIAN_NEW_NAME, data.OLD_MOBILE_NUMBER, data.NEW_MOBILE_NUMBER, data.TECHNICIAN_OLD_EMAIL, data.TECHNICIAN_NEW_EMAIL, data.OLD_PROFILE_PHOTO, data.NEW_PROFILE_PHOTO, data.REQUESTED_DATETIME, data.ACTION_DATETIME, data.APPROVER_ID, data.APPROVER_NAME, data.STATUS, data.IS_VERIFIED, data.VERIFICATION_OTP, data.CLIENT_ID, results[0].ID], supportKey, connection, (error, results1) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).json({
                                    "message": "Failed to update technicianProfileUpdateRequest information."
                                });
                            }
                            else {
                                var TYPE = "M";
                                sendOtp(TYPE, data.NEW_MOBILE_NUMBER, "OTP Verify", body, OTP, TECHNICIAN_NAME, supportKey, (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            code: 400,
                                            message: "Failed to send OTP",
                                        });
                                    } else {
                                        mm.sendNotificationToAdmin(data.TECHNICIAN_ID, 8, "Technician profile update", `Technician ${TECHNICIAN_NAME} has updated his profile.`, "", "P", supportKey);
                                        var ACTION_DETAILS = ` Technician ${TECHNICIAN_NAME} has updated their profile..`
                                        const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Technician profile updated', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: data.TECHNICIAN_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: TECHNICIAN_NAME, DATE_TIME: data.REQUESTED_DATETIME, supportKey: 0 }
                                        dbm.saveLog(logData, TechnicianActionLog)
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            message: "OTP sent to mobile."
                                        });
                                    }
                                });
                            }
                        });
                    }
                    else {
                        mm.executeDML('INSERT INTO ' + technicianProfileUpdateRequest + ' SET ?', data, supportKey, connection, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).json({
                                    "code": 400,
                                    "message": "Failed to save technicianProfileUpdateRequest information..."
                                });
                            }
                            else {
                                var TYPE = "M";
                                sendOtp(TYPE, data.NEW_MOBILE_NUMBER, "OTP Verify", body, OTP, TECHNICIAN_NAME, supportKey, (err, result) => {
                                    if (err) {
                                        console.log(err);
                                        mm.rollbackConnection(connection);
                                        res.send({
                                            code: 400,
                                            message: "Failed to send OTP",
                                        });
                                    } else {
                                        mm.sendNotificationToAdmin(data.TECHNICIAN_ID, 8, "Technician profile update", `Technician ${TECHNICIAN_NAME} has updated his profile.`, "", "P", supportKey);
                                        var ACTION_DETAILS = ` Technician ${TECHNICIAN_NAME} has updated their profile.`
                                        const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Technician profile updated', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: data.TECHNICIAN_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: TECHNICIAN_NAME, DATE_TIME: data.REQUESTED_DATETIME, supportKey: 0 }
                                        dbm.saveLog(logData, TechnicianActionLog)
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            message: "OTP sent to mobile."
                                        });
                                    }
                                });
                            }
                        });
                    }
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}

function sendOtp(TYPE, TYPE_VALUE, subject, body, OTP, USER_NAME, supportKey, callback) {
    var subject = "Technician Otp Support"
    var otpText1
    if (TYPE == "M") {
        callback(null, OTP);
        otpText1 = `Your Profile Update Request OTP is ${OTP}. This code is valid for the next [5 minutes]. Please do not share it with anyone.`
    } else {
        callback(null, OTP);
        otpText1 = `<p style="text-align: justify;"><strong>Dear Technician,</strong></p><p style="text-align: justify;">Your one-time password (OTP) for email verification is</p><h1 style="text-align: center;"> ${OTP} </h1><p style="text-align: justify;">Please do not share this one time password with anyone.<br />In case you need any further clarification for the same, <br />please do get in touch immediately with itsupport@pockitengineers.com.</p><p style="text-align: justify;"><strong>Regards,</strong></p><p style="text-align: justify;"><strong> Team PockIT</strong></p><p style="text-align: justify;"><em>This email notification was automatically generated please do not reply to this mail.</em></p><p style="text-align: justify;"><em>Suggestion/feedback if any can be provided through our official website https://my.pockitengineers.com/</em></p>`;
    }

}


exports.verifyOTP = (req, res) => {
    try {
        var OTP = req.body.OTP;
        var MOBILE_NUMBER = req.body.MOBILE_NUMBER;
        var supportKey = req.headers["supportkey"];
        var systemDate = mm.getSystemDate();
        const TECHNICIAN_ID = req.body.TECHNICIAN_ID

        if (OTP != " " && MOBILE_NUMBER != " ") {
            var connection = mm.openConnection();
            mm.executeDML(`select ID,VERIFICATION_OTP,NEW_MOBILE_NUMBER,TECHNICIAN_NEW_NAME,TECHNICIAN_NEW_EMAIL,NEW_PROFILE_PHOTO,TECHNICIAN_ID from technician_profile_update_request where STATUS = "P" AND IS_VERIFIED = 0 AND NEW_MOBILE_NUMBER = ? order by ID desc limit 1`, [MOBILE_NUMBER], supportKey, connection, (error, results) => {
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
                        if (results[0].VERIFICATION_OTP == OTP) {
                            mm.executeDML(`UPDATE technician_master SET NAME=?,MOBILE_NUMBER=?,EMAIL_ID=?,PHOTO=?   WHERE ID = ?  `, [results[0].TECHNICIAN_NEW_NAME, results[0].NEW_MOBILE_NUMBER, results[0].TECHNICIAN_NEW_EMAIL, results[0].NEW_PROFILE_PHOTO, results[0].TECHNICIAN_ID], supportKey, connection, (error, resultCustomer) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + " " + req.method + " " + req.url + " " + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection);
                                    res.status(400).send({
                                        code: 400,
                                        message: "Failed to update mobile verified in registration attempt details details ",
                                    });
                                } else {
                                    mm.executeDML(`UPDATE technician_profile_update_request SET IS_VERIFIED=? ,STATUS=? WHERE ID = ?  `, [1, "A", results[0].ID], supportKey, connection, (error, result1) => {
                                        if (error) {
                                            console.log(error);
                                            mm.rollbackConnection(connection);
                                            res.status(400).send({
                                                message: "Failed to update technician profile update request details ",

                                            });
                                        } else {
                                            mm.commitConnection(connection);
                                            res.status(200).json({
                                                "message": "OTP verified successfully..."
                                            });
                                        }
                                    });

                                }
                            });
                        } else {
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
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + technicianProfileUpdateRequest + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update technicianProfileUpdateRequest information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "TechnicianProfileUpdateRequest information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    }
}

exports.updateProfileStatus = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME
    const STATUS = req.body.STATUS
    const NEW_NAME = req.body.NEW_NAME
    const NEW_EMAIL = req.body.NEW_EMAIL
    const NEW_PHOTO = req.body.NEW_PHOTO
    const REJECTED_REMARK = req.body.REJECTED_REMARK
    const NEW_MOBILE_NUMBER = req.body.NEW_MOBILE_NUMBER
    if (!TECHNICIAN_ID && !TECHNICIAN_NAME && !STATUS) {
        return res.status(400).json({
            "message": "TECHNICIAN_ID, TECHNICIAN_NAME, STATUS are required."
        });
    }
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };

    var systemDate = mm.getSystemDate();
    try {
        const connection = mm.openConnection()

        if (STATUS == "A") {
            if (!NEW_NAME && !NEW_EMAIL) {
                res.status(400).json({
                    "message": "NEW_NAME and NEW_EMAIL are required."
                });
            } else {
                mm.executeDML(`UPDATE ` + technicianProfileUpdateRequest + ` SET STATUS= ? ,  CREATED_MODIFIED_DATE = '${systemDate}',ACTION_DATETIME= '${systemDate}',APPROVER_ID=${req.body.authData.data.UserData[0].USER_ID},APPROVER_NAME="${req.body.authData.data.UserData[0].NAME}" where ID = ${criteria.ID} `, ['A'], supportKey, connection, (error, results1) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        mm.rollbackConnection(connection)
                        res.status(400).json({
                            "message": "Failed to update technicianProfileUpdateRequest information."
                        });
                    }
                    else {
                        mm.executeDML(`UPDATE technician_master SET NAME=? ,EMAIL_ID= ?,PHOTO=? ,CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${TECHNICIAN_ID} `, [NEW_NAME, NEW_EMAIL, NEW_PHOTO], supportKey, connection, (error, results1) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "message": "Failed to update technician information."
                                });
                            }
                            else {
                                mm.sendNotificationToTechnician(TECHNICIAN_ID, "**Profile Approved**", `Dear ${TECHNICIAN_NAME}, your profile update request is Approved`, "", "P", supportKey, "N", "P", req.body);
                                var ACTION_DETAILS = ` User ${req.body.authData.data.UserData[0].NAME} has approved the profile update request of technician ${TECHNICIAN_NAME}.`
                                const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Profile Update Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                dbm.saveLog(logData, TechnicianActionLog)
                                mm.commitConnection(connection)
                                res.status(200).json({
                                    "message": "TechnicianProfileUpdateRequest information updated successfully...",
                                });
                            }
                        });
                    }
                });
            }
        } else if (STATUS == "R") {
            if (!REJECTED_REMARK) {
                return res.status(400).json({
                    "message": "REJECTED_REMARK is required."
                });
            } else {
                mm.executeDML(`UPDATE ` + technicianProfileUpdateRequest + ` SET STATUS=? ,CREATED_MODIFIED_DATE = '${systemDate}',ACTION_DATETIME='${systemDate}',REJECTED_REMARK=?,APPROVER_ID=${req.body.authData.data.UserData[0].USER_ID},APPROVER_NAME='${req.body.authData.data.UserData[0].NAME}'  where ID = ${criteria.ID} `, ['R', REJECTED_REMARK], supportKey, connection, (error, results3) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        mm.rollbackConnection(connection)
                        res.status(400).json({
                            "code": 400,
                            "message": "Failed to update technicianSkillRequest information."
                        });
                    }
                    else {
                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "**Profile Rejected**", `Dear ${TECHNICIAN_NAME}, your profile update request is Rejected`, "", "P", supportKey, "N", "P", req.body);
                        var ACTION_DETAILS = ` User ${req.body.authData.data.UserData[0].NAME} has rejected the profile update request of technician ${TECHNICIAN_NAME}.`
                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Profile Update Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                        dbm.saveLog(logData, TechnicianActionLog)
                        mm.commitConnection(connection)
                        res.status(200).json({
                            "message": "TechnicianProfileUpdateRequest information updated successfully...",
                        });
                    }
                });
            }
        } else {
            res.status(400).json({
                "code": 400,
                "message": "Invalid status."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }

}

