const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo')
var TechnicianActionLog = require('../../modules/technicianActionLog')
var technicianCertificateRequest = "technician_certificate_request";
var viewTechnicianCertificateRequest = "view_" + technicianCertificateRequest;
const fs = require('fs')
const path = require('path')
function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        CERTIFICATE_PHOTO: req.body.CERTIFICATE_PHOTO,
        ISSUED_BY_ORGANIZATION_NAME: req.body.ISSUED_BY_ORGANIZATION_NAME,
        CREDENTIAL_ID: req.body.CREDENTIAL_ID,
        STATUS: req.body.STATUS,
        REJECT_REMARK: req.body.REJECT_REMARK,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        ISSUED_DATE: req.body.ISSUED_DATE,
        CLIENT_ID: req.body.CLIENT_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        REQUESTED_DATETIME: req.body.REQUESTED_DATETIME,
        APPROVER_ID: req.body.APPROVER_ID,
        APPROVED_BY: req.body.APPROVED_BY,
        ACTION_DATE_TIME: req.body.ACTION_DATE_TIME

    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('CERTIFICATE_PHOTO').optional(),
        body('ISSUED_BY_ORGANIZATION_NAME').optional(),
        body('CREDENTIAL_ID').optional(),
        body('STATUS').optional(),
        body('REJECT_REMARK').optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;
    console.log(pageIndex + " " + pageSize)
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
        console.log(start + " " + end);
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianCertificateRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get technicianCertificateRequest count.",
                    });
                }
                else {
                    console.log(results1);
                    mm.executeQuery('select * from ' + viewTechnicianCertificateRequest + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get technicianCertificateRequest information."
                            });
                        } else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 177,
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
    data.STATUS = "P";
    data.REQUESTED_DATETIME = mm.getSystemDate();
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + technicianCertificateRequest + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save technicianCertificateRequest information..."
                    });
                } else {
                    mm.sendNotificationToAdmin(8, "Certificate Request", `Technician ${data.TECHNICIAN_NAME} has send a certificate approval request,\n kindly take action over it.`, "", "C", supportKey);

                    var ACTION_DETAILS = `Technician ${data.TECHNICIAN_NAME} has submitted a certificate request.`
                    const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Certificate Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: data.TECHNICIAN_ID, TECHNICIAN_NAME: data.TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: data.TECHNICIAN_NAME, DATE_TIME: data.REQUESTED_DATETIME, supportKey: 0 }
                    dbm.saveLog(logData, TechnicianActionLog)
                    console.log(results);
                    res.status(200).json({
                        "message": "TechnicianCertificateRequest information saved successfully...",
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
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + technicianCertificateRequest + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianCertificateRequest information."
                    });
                }
                else {
                    console.log(results);
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianCertificateRequest information updated successfully...",
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

exports.updateCertificateStatus = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME
    const STATUS = req.body.STATUS
    const REJECT_REMARK = req.body.REJECT_REMARK
    if (!TECHNICIAN_ID && !TECHNICIAN_NAME && !STATUS) {
        return res.status(400).json({
            "code": 400,
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
            mm.executeDML(`UPDATE ` + technicianCertificateRequest + ` SET STATUS=? ,  CREATED_MODIFIED_DATE = '${systemDate}',ACTION_DATE_TIME= '${systemDate}',APPROVER_ID=${req.body.authData.data.UserData[0].USER_ID},APPROVED_BY="${req.body.authData.data.UserData[0].NAME}" where ID = ${criteria.ID} `, ['A'], supportKey, connection, (error, results1) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    mm.rollbackConnection(connection)
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianCertificateRequest information."
                    });
                }
                else {
                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "**Certificate Approved**", `Dear ${TECHNICIAN_NAME}, your certificate request is approved`, "", "C", supportKey, "N", "CA", req.body);
                    var ACTION_DETAILS = ` User ${req.body.authData.data.UserData[0].NAME} has approved the certificate verification request for the technician ${TECHNICIAN_NAME}.`
                    const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Certificate Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    dbm.saveLog(logData, TechnicianActionLog)
                    console.log(results1);
                    mm.commitConnection(connection)
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianCertificateRequest information updated successfully...",
                    });
                }
            });

        } else if (STATUS == "R") {
            mm.executeDML(`UPDATE ` + technicianCertificateRequest + ` SET STATUS=? ,CREATED_MODIFIED_DATE = '${systemDate}',ACTION_DATE_TIME='${systemDate}',REJECT_REMARK=?,APPROVER_ID=${req.body.authData.data.UserData[0].USER_ID},APPROVED_BY='${req.body.authData.data.UserData[0].NAME}'  where ID = ${criteria.ID} `, ['R', REJECT_REMARK], supportKey, connection, (error, results3) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    mm.rollbackConnection(connection)
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianCertificateRequest information."
                    });
                }
                else {
                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "**Certificate Rejected**", `Dear ${TECHNICIAN_NAME}, your certificate request is Rejected`, "", "C", supportKey, "N", "CR", req.body);
                    var ACTION_DETAILS = ` User ${req.body.authData.data.UserData[0].NAME} has rejected the certificate verification request for the technician ${TECHNICIAN_NAME}.`
                    const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Certificate Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    dbm.saveLog(logData, TechnicianActionLog)
                    console.log(results3);
                    mm.commitConnection(connection)
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianCertificateRequest information updated successfully...",
                    });
                }

            });
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

exports.getStatusCount = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    console.log(pageIndex + " " + pageSize)
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
        console.log(start + " " + end);
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianCertificateRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technicianSkillRequest count.",
                    });
                }
                else {
                    console.log(results1);
                    var query = `SELECT COUNT(CASE WHEN status = 'P' THEN 1 END) AS PENDING, COUNT(CASE WHEN status = 'A' THEN 1 END) AS APPROVED, COUNT(CASE WHEN status = 'R' THEN 1 END) AS REJECTED FROM technician_certificate_request `
                    mm.executeQuery(query + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get technicianSkillRequest information."
                            });
                        }
                        else {
                            res.status(200).json({
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
            res.status(400).json({
                // code: 400,
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            // code: 500,
            message: "Something went wrong."
        });
    }

}

exports.deleteCertificate = (req, res) => {
    const CERTIFICATE_PHOTO = req.body.CERTIFICATE_PHOTO
    const ID = req.body.ID
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        mm.executeDML(`UPDATE ` + technicianCertificateRequest + ` SET IS_DELETE=1 ,  CREATED_MODIFIED_DATE = '${systemDate}' where ID =?`, [ID], supportKey, connection, (error, results1) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                mm.rollbackConnection(connection)
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to update technicianCertificateRequest information."
                });
            }
            else {
                const pathName = path.join(__dirname, '../../uploads/CertificatePhotos/' + CERTIFICATE_PHOTO)
                fs.unlink(pathName, (err) => {
                    if (err) {
                        console.log(err)
                        mm.rollbackConnection(connection)
                        res.status(400).json({
                            "message": "Failed to update technicianCertificateRequest information."
                        });
                    }
                    else {
                        mm.commitConnection(connection)
                        res.status(200).json({
                            "message": "Sucessfully deleted"
                        });
                    }
                })
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong."
        });
    }

}
