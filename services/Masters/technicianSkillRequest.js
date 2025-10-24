const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;
var TechnicianActionLog = require('../../modules/technicianActionLog')
const dbm = require('../../utilities/dbMongo')
var technicianSkillRequest = "technician_skill_request";
var viewTechnicianSkillRequest = "view_" + technicianSkillRequest;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        SKILL_IDS: req.body.SKILL_IDS,
        SKILL_NAME: req.body.SKILL_NAME,
        APPROVER_ID: req.body.APPROVER_ID,
        APPROVED_BY: req.body.APPROVED_BY,
        REQUESTED_DATETIME: req.body.REQUESTED_DATETIME,
        ACTION_DATE_TIME: req.body.ACTION_DATE_TIME,
        REJECTED_REMARK: req.body.REJECTED_REMARK,
        STATUS: req.body.STATUS,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('TECHNICIAN_NAME').optional(),
        body('SKILL_IDS').optional(),
        body('SKILL_NAME').optional(),
        body('APPROVER_ID').isInt().optional(),
        body('APPROVED_BY').optional(),
        body('REQUESTED_DATETIME').optional(),
        body('APPROVED_DATE_TIME').optional(),
        body('REJECTED_REMARK').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianSkillRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technicianSkillRequest count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTechnicianSkillRequest + ' where 1 ' + criteria, supportKey, (error, results) => {
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
                                "TAB_ID": 147,
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
    data.REQUESTED_DATETIME = mm.getSystemDate()
    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            data.STATUS = 'P'
            mm.executeQueryData('INSERT INTO ' + technicianSkillRequest + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technicianSkillRequest information..."
                    });
                }
                else {
                    mm.sendNotificationToAdmin(8, "Skill Request", `Technician ${data.TECHNICIAN_NAME} has sent skill approval request,\n kindly take action over it.`, "", "S", supportKey, "TSR", data);

                    var ACTION_DETAILS = ` Technician ${data.TECHNICIAN_NAME}  has submitted a skill request.`
                    const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Skill Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: data.TECHNICIAN_ID, TECHNICIAN_NAME: data.TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: data.TECHNICIAN_NAME, DATE_TIME: data.REQUESTED_DATETIME, supportKey: 0 }
                    dbm.saveLog(logData, TechnicianActionLog)
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianSkillRequest information saved successfully...",
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
            data.STATUS = 'P'
            mm.executeQueryData(`UPDATE ` + technicianSkillRequest + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianSkillRequest information."
                    });
                }
                else {
                    var ACTION_DETAILS = ` Technician ${data.TECHNICIAN_NAME} has updated skill request.`
                    const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Skill Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: data.TECHNICIAN_ID, TECHNICIAN_NAME: data.TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: data.TECHNICIAN_NAME, DATE_TIME: data.REQUESTED_DATETIME, supportKey: 0 }
                    dbm.saveLog(logData, TechnicianActionLog)
                    mm.sendNotificationToAdmin(8, "Skill Request", `Technician ${data.TECHNICIAN_NAME} has sent skill approval request,\n kindly take action over it.`, "", "S", supportKey);
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianSkillRequest information updated successfully...",
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


exports.updateSkillStatus = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID
    const TECHNICIAN_NAME = req.body.TECHNICIAN_NAME
    const STATUS = req.body.STATUS
    const SKILL_IDS = req.body.SKILL_IDS
    const REJECTED_REMARK = req.body.REJECTED_REMARK
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
        var dataset = []
        if (STATUS == "A") {
            for (var i = 0; i < SKILL_IDS.length; i++) {
                dataset.push([TECHNICIAN_ID, SKILL_IDS[i], 1, 'M', 1])
            }
            mm.executeDML(`INSERT INTO technician_skill_mapping (TECHNICIAN_ID,SKILL_ID,IS_ACTIVE,STATUS,CLIENT_ID) VALUES ?`, [dataset], supportKey, connection, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    mm.rollbackConnection(connection)
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to insert technician Skill map information."
                    });
                }
                else {
                    mm.executeDML(`UPDATE ` + technicianSkillRequest + ` SET STATUS=? ,  CREATED_MODIFIED_DATE = '${systemDate}',ACTION_DATE_TIME= '${systemDate}',APPROVER_ID=${req.body.authData.data.UserData[0].USER_ID},APPROVED_BY="${req.body.authData.data.UserData[0].NAME}" where ID = ${criteria.ID} `, ['A'], supportKey, connection, (error, results1) => {
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
                            mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Skill Approved", `Dear ${TECHNICIAN_NAME}, your skill request has been approved.`, "", "S", supportKey, "N", "S", req.body);
                            var ACTION_DETAILS = ` User ${req.body.authData.data.UserData[0].NAME} has approved the skill request of technician ${TECHNICIAN_NAME}.`
                            const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Skill Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                            dbm.saveLog(logData, TechnicianActionLog)
                            mm.commitConnection(connection)
                            res.status(200).json({
                                "code": 200,
                                "message": "TechnicianSkillRequest information updated successfully...",
                            });
                        }
                    });
                }
            });
        } else if (STATUS == "R") {
            mm.executeDML(`UPDATE ` + technicianSkillRequest + ` SET STATUS=? ,CREATED_MODIFIED_DATE = '${systemDate}',ACTION_DATE_TIME='${systemDate}',REJECTED_REMARK=?,APPROVER_ID=${req.body.authData.data.UserData[0].USER_ID},APPROVED_BY='${req.body.authData.data.UserData[0].NAME}'  where ID = ${criteria.ID} `, ['R', REJECTED_REMARK], supportKey, connection, (error, results3) => {
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
                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Skill Request Rejected", `Dear ${TECHNICIAN_NAME}, your skill request is rejected`, "", "S", supportKey, "N", "S", req.body);
                    var ACTION_DETAILS = ` User ${req.body.authData.data.UserData[0].NAME} has rejected the skill approval request of technician ${TECHNICIAN_NAME}.`
                    const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Skill Request', ACTION_LOG_TYPE: 'Technician', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    dbm.saveLog(logData, TechnicianActionLog)
                    mm.commitConnection(connection)
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianSkillRequest information updated successfully...",
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianSkillRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technicianSkillRequest count.",
                    });
                }
                else {
                    var query = `SELECT COUNT(CASE WHEN status = 'P' THEN 1 END) AS PENDING, COUNT(CASE WHEN status = 'A' THEN 1 END) AS APPROVED, COUNT(CASE WHEN status = 'R' THEN 1 END) AS REJECTED FROM technician_skill_request`
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
