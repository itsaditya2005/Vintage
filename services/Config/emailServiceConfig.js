const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var emailServiceConfig = "email_service_config";
var viewEmailServiceConfig = "view_" + emailServiceConfig;

function reqData(req) {
    var data = {
        SERVICE_PROVIDER: req.body.SERVICE_PROVIDER,
        SMTP_HOST: req.body.SMTP_HOST,
        SMTP_PORT: req.body.SMTP_PORT,
        AUTHENTICATION_TYPE: req.body.AUTHENTICATION_TYPE,
        USERNAME: req.body.USERNAME,
        PASSWORD: req.body.PASSWORD,
        SENDER_EMAIL: req.body.SENDER_EMAIL,
        SENDER_NAME: req.body.SENDER_NAME,
        ENCRYPTION_TYPE: req.body.ENCRYPTION_TYPE,
        RETRY_ATTEMPTS: req.body.RETRY_ATTEMPTS,
        TIMEOUT_SECONDS: req.body.TIMEOUT_SECONDS,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CREATED_AT: req.body.CREATED_AT,
        UPDATED_AT: req.body.UPDATED_AT,
        NOTES: req.body.NOTES,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('SERVICE_PROVIDER').optional(),
        body('SMTP_HOST').optional(),
        body('SMTP_PORT').optional(),
        body('AUTHENTICATION_TYPE').optional(),
        body('USERNAME').optional(),
        body('PASSWORD').optional(),
        body('SENDER_EMAIL').optional(),
        body('SENDER_NAME').optional(),
        body('ENCRYPTION_TYPE').optional(),
        body('RETRY_ATTEMPTS').optional(),
        body('TIMEOUT_SECONDS').optional(),
        body('CREATED_AT').optional(),
        body('UPDATED_AT').optional(),
        body('NOTES').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewEmailServiceConfig + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get email service config count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewEmailServiceConfig + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get email service config information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 25,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        } else {
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
            const checkQuery = `SELECT * FROM ${emailServiceConfig} WHERE SENDER_EMAIL = ? OR USERNAME = ?`;
            mm.executeQueryData(checkQuery, [data.SENDER_EMAIL, data.USERNAME], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 500,
                        "message": "Failed to check existing records."
                    });
                } else if (results.length > 0) {
                    const emailExists = results.some(record => record.SENDER_EMAIL === data.SENDER_EMAIL);
                    const usernameExists = results.some(record => record.USERNAME === data.USERNAME);

                    if (emailExists && usernameExists) {
                        res.send({
                            "code": 300,
                            "message": "Sender email and username already exist."
                        });
                    } else if (emailExists) {
                        res.send({
                            "code": 300,
                            "message": "Sender email already exists."
                        });
                    } else if (usernameExists) {
                        res.send({
                            "code": 300,
                            "message": "Username already exists."
                        });
                    }
                } else {
                    mm.executeQueryData('INSERT INTO ' + emailServiceConfig + ' SET ?', data, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save email service config information"
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "Email service config information saved successfully",
                            });
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
            const checkQuery = `SELECT * FROM ${emailServiceConfig} WHERE (SENDER_EMAIL = ? OR USERNAME = ?) AND ID != ?`;
            mm.executeQueryData(checkQuery, [data.SENDER_EMAIL, data.USERNAME, criteria.ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 500,
                        "message": "Failed to check existing records."
                    });
                } else if (results.length > 0) {
                    const emailExists = results.some(record => record.SENDER_EMAIL === data.SENDER_EMAIL);
                    const usernameExists = results.some(record => record.USERNAME === data.USERNAME);

                    if (emailExists && usernameExists) {
                        res.send({
                            "code": 300,
                            "message": "Sender email and username already exist."
                        });
                    } else if (emailExists) {
                        res.send({
                            "code": 300,
                            "message": "Sender email already exists."
                        });
                    } else if (usernameExists) {
                        res.send({
                            "code": 300,
                            "message": "Username already exists."
                        });
                    }
                } else {
                    mm.executeQueryData(`UPDATE ` + emailServiceConfig + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update email service config information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "Email service config information updated successfully...",
                            });
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
