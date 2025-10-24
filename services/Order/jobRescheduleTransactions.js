const { connect } = require('../../routes/globalSettings');
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const technicianActionLog = require("../../modules/technicianActionLog")

var jobRescheduleTransactions = "job_reschedule_transactions";
var viewjobRescheduleTransactions = "view_" + jobRescheduleTransactions;

function reqData(req) {
    var data = {
        REQUESTED_DATE: req.body.REQUESTED_DATE,
        ORDER_ID: req.body.ORDER_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        REASON: req.body.REASON,
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        REMARK: req.body.REMARK,
        IS_RESCHEDULED: req.body.IS_RESCHEDULED,
        OLD_SCHEDULED_DATE_TIME: req.body.OLD_SCHEDULED_DATE_TIME
    }
    return data;
}

exports.validate = function () {
    return [
        body('REQUESTED_DATE').optional(),
        body('JOB_CARD_ID').isInt().optional(),
        body('REASON').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewjobRescheduleTransactions + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get jobRescheduleTransactions count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewjobRescheduleTransactions + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error); logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get jobRescheduleTransactions information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 183,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        } else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }

}

exports.create = (req, res) => {

    var data = reqData(req);
    var JOB_CARD_NO = req.body.JOB_CARD_NO
    var CUSTOMER_ID = req.body.CUSTOMER_ID
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
            mm.executeQueryData('INSERT INTO ' + jobRescheduleTransactions + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save jobRescheduleTransactions information..."
                    });
                }
                else {
                    mm.executeQueryData(`SELECT * from view_customer_order_details where JOB_CARD_ID = ? AND ORDER_ID = ?`, [data.JOB_CARD_ID, data.ORDER_ID], supportKey, (error, resultsgetJobs) => {
                        if (error) {
                            console.log(error);
                            return res.send({
                                code: 400,
                                message: "Failed to update job card status."
                            });
                        } else {
                            const ACTION_DETAILS = `A reschedule request has been submitted by technician ${req.body.authData.data.UserData[0].USER_NAME} for job ${JOB_CARD_NO}.`;
                            const logData = { TECHNICIAN_ID: data.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: data.ORDER_ID, JOB_CARD_ID: data.JOB_CARD_ID, CUSTOMER_ID: data.CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: 0, ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Reschedule request by technician", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: mm.getSystemDate(), supportKey: 0 }
                            mm.sendNotificationToAdmin(8, `Reschedule request by technician`, ACTION_DETAILS, "", "J", supportKey, "J", resultsgetJobs);
                            // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, data.CUSTOMER_ID, `**Job Reschedule by technician**`, `Technician ${req.body.authData.data.UserData[0].USER_NAME} is rescheduled the job ${JOB_CARD_NO}`, "", "J", supportKey, "N", "J", req.body);
                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${data.CUSTOMER_ID}_channel`, `Job rescheduled by technician`, `Technician ${req.body.authData.data.UserData[0].USER_NAME} is rescheduled the job ${JOB_CARD_NO}`, "", "J", supportKey, "N", "J", resultsgetJobs);
                            dbm.saveLog(logData, technicianActionLog);
                            res.status(200).json({
                                "message": "jobRescheduleTransactions information saved successfully...",
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
                message: "Something Went Wrong."
            })
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
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + jobRescheduleTransactions + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update jobRescheduleTransactions information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of job reschedule transactions.`;


                    var logCategory = "job card photo details";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "message": "jobRescheduleTransactions information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something Went Wrong."
            })
        }
    }
}

exports.updateStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var JOB_CARD_ID = req.body.JOB_CARD_ID;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    let SCHEDULED_DATE_TIME = req.body.SCHEDULED_DATE_TIME
    let REQUESTED_DATE = req.body.REQUESTED_DATE
    let START_TIME = req.body.START_TIME
    let END_TIME = req.body.END_TIME
    let STATUS = req.body.STATUS
    let TERRITORY_ID = req.body.TERRITORY_ID
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        var status = ''
        if (STATUS == "A") {
            status = 'accepted'
        } else {
            status = 'rejected'
        }
        const connection = mm.openConnection();
        mm.executeDML(`UPDATE ` + jobRescheduleTransactions + ` SET STATUS = ?,CREATED_MODIFIED_DATE = ?,REMARK = ? where ID = ? `, [STATUS, systemDate, data.REMARK, ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.status(400).json({
                    "message": "Failed to update jobRescheduleTransactions information."
                });
            }
            else {
                if (STATUS == 'R') {
                    mm.executeQueryData(`SELECT * from view_customer_order_details where JOB_CARD_ID = ? AND ORDER_ID = ?`, [data.JOB_CARD_ID, data.ORDER_ID], supportKey, (error, resultsgetOrder) => {
                        if (error) {
                            console.log(error);
                            return res.send({
                                code: 400,
                                message: "Failed to update job card status."
                            });
                        } else {
                            mm.executeQueryData(`SELECT * from view_job_card where ID = ? AND ORDER_ID = ?`, [data.JOB_CARD_ID, data.ORDER_ID], supportKey, (error, resultsgetJobs) => {
                                if (error) {
                                    console.log(error);
                                    return res.send({
                                        code: 400,
                                        message: "Failed to update job card status."
                                    });
                                } else {
                                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your job rescheduling request.`;
                                    const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job reschedule request is rejected by " + req.body.authData.data.UserData[0].NAME + "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                    dbm.saveLog(logData, technicianActionLog);
                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Reschedule request ${status}`, `${req.body.authData.data.UserData[0].NAME} has resheduled your job at ${SCHEDULED_DATE_TIME}.`, "", "O", supportKey, "N", "J", resultsgetOrder);
                                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Reschedule request ${status}`, ACTION_DETAILS, "", "J", supportKey, "N", "J", resultsgetJobs);
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "message": "jobreschedule information updated successfully...",
                                    });
                                }
                            })
                        }
                    })
                } else {
                    mm.executeDML(`UPDATE job_card SET JOB_STATUS_ID = ?,TECHNICIAN_ID = null,TECHNICIAN_NAME = null,SCHEDULED_DATE_TIME = null,START_TIME = null,END_TIME=null,TECHNICIAN_STATUS ='P',ASSIGNED_DATE =NULL,TRACK_STATUS = null,EXPECTED_DATE_TIME = ?  where ID = ? `, [1, REQUESTED_DATE, JOB_CARD_ID], supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection)
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.status(400).json({
                                "message": "Failed to update jobRescheduleTransactions information."
                            });
                        }
                        else {
                            mm.executeDML(`SELECT * FROM technicianschedule WHERE 1 AND TECHNICIAN_ID = ? AND DATE = ? AND TERRITORY_ID = ? `, [TECHNICIAN_ID, SCHEDULED_DATE_TIME, TERRITORY_ID], supportKey, connection, (error, resultsCheck1) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)} `, applicationkey);
                                    console.log(error);
                                    return res.status(400).send({
                                        "message": "Failed to update technicianschedule information."
                                    });
                                } else {
                                    mm.executeQueryData(`SELECT * from view_job_card where ID = ? AND ORDER_ID = ?`, [data.JOB_CARD_ID, data.ORDER_ID], supportKey, (error, resultsgetJobs) => {
                                        if (error) {
                                            console.log(error);
                                            return res.send({
                                                code: 400,
                                                message: "Failed to update job card status."
                                            });
                                        } else {
                                            if (resultsCheck1.length > 0) {
                                                const start = parseTime(START_TIME);
                                                const end = parseTime(END_TIME);
                                                const timeSlots = generateTimeSlots(start, end);
                                                const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                                                var query = ``;
                                                var values = ''
                                                query = `UPDATE technicianschedule SET ${setClauses}, DATE = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                                                values = [...Array(timeSlots.length).fill(null), SCHEDULED_DATE_TIME.split(' ')[0], mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, SCHEDULED_DATE_TIME.split(' ')[0]];
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
                                                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has ${status} your job rescheduling request.`;
                                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job reschedule request is approved by " + req.body.authData.data.UserData[0].NAME + "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        dbm.saveLog(logData, technicianActionLog);
                                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Reschedule request ${status}`, ACTION_DETAILS, "", "J", supportKey, "N", "JR", resultsgetJobs);
                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Reschedule request ${status}`, `${req.body.authData.data.UserData[0].NAME} has resheduled your job at ${SCHEDULED_DATE_TIME}.`, "", "O", supportKey, "N", "JR", resultsgetJobs);

                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, `**Reschedule request ${status}**`, `${req.body.authData.data.UserData[0].NAME} has $resheduled your job at ${SCHEDULED_DATE_TIME}.`, "", "O", supportKey, "N", "J", req.body);

                                                        mm.commitConnection(connection);
                                                        res.status(200).json({
                                                            "message": "jobreschedule information updated successfully...",
                                                        });
                                                    }
                                                });
                                            } else {
                                                mm.rollbackConnection(connection);
                                                return res.status(400).send({
                                                    "code": 400,
                                                    "message": "Failed to update technicianschedule information."
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
}

exports.getCounts = (req, res) => {
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

            var Query = `SELECT COUNT(CASE WHEN STATUS = 'P' THEN 1 END) AS PENDING,COUNT(CASE WHEN STATUS = 'A' THEN 1 END) AS APPROVED,COUNT(CASE WHEN STATUS = 'R' THEN 1 END) AS REJECTED FROM view_job_reschedule_transactions where 1 `;
            mm.executeQuery(Query + criteria, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get jobRescheduleTransactions information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "success",
                        "TAB_ID": 183,
                        "data": results
                    });
                }
            });
        } else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }

}

exports.RefundStatus = (req, res) => {

    var data = reqData(req);
    var ID = req.body.ID;
    var ORDER_ID = req.body.ORDER_ID;
    var ORDER_STATUS = req.body.ORDER_STATUS;
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var PAYMENT_STATUS = req.body.PAYMENT_STATUS
    var systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    try {
        if (PAYMENT_STATUS != "RF") {
            res.status(300).json({
                "message": "Wrong Status."
            });
        } else {
            const connection = mm.openConnection();
            mm.executeDML(`UPDATE ` + jobRescheduleTransactions + ` SET PAYMENT_STATUS = ?,REFUNDED_DATE = ? where ID = ? `, ["RF", systemDate, ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update jobRescheduleTransactions information."
                    });
                }
                else {
                    const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has refunded the amount for your job.`;
                    const logData = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    const logData2 = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: "", ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                    const logaaray = [logData, logData2]
                    dbm.saveLog(logaaray, technicianActionLog);
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "message": "jobreschedule information updated successfully...",
                    });

                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something Went Wrong."
        })
    }
}

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
}

function generateTimeSlots(start, end) {
    const slots = [];
    let current = new Date(0, 0, 0, start.hours, start.minutes);

    while (current <= new Date(0, 0, 0, end.hours, end.minutes)) {
        const hours = current.getHours().toString().padStart(2, "0");
        const minutes = current.getMinutes().toString().padStart(2, "0");
        slots.push(`${hours}:${minutes}`);
        current.setMinutes(current.getMinutes() + 10);
    }

    return slots;
}

exports.bulkRescheduleByTechnician = (req, res) => {
    var data = req.body;
    var supportKey = req.headers['supportkey'];

    try {
        if (data) {
            let dataset = data.map(item => [item.REQUESTED_DATE, item.CUSTOMER_ID, item.JOB_CARD_ID, item.ORDER_ID, item.TECHNICIAN_ID, item.STATUS, item.REASON, item.REMARK, item.IS_RESCHEDULED, item.CLIENT_ID, item.OLD_SCHEDULED_DATE_TIME]);

            mm.executeQueryData('INSERT INTO job_reschedule_transactions (REQUESTED_DATE, CUSTOMER_ID, JOB_CARD_ID, ORDER_ID, TECHNICIAN_ID, STATUS, REASON, REMARK, IS_RESCHEDULED, CLIENT_ID, OLD_SCHEDULED_DATE_TIME) VALUES ?',
                [dataset],
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                        return res.status(400).json({ message: "Failed to save jobRescheduleTransactions information..." });
                    }

                    data.forEach(item => {
                        const ACTION_DETAILS = `Technician ${req.body.authData.data.UserData[0].USER_NAME} has requested to reschedule job ${item.JOB_CARD_NO}.`;
                        const logData = { TECHNICIAN_ID: item.TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: item.ORDER_ID, JOB_CARD_ID: item.JOB_CARD_ID, CUSTOMER_ID: item.CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: "", ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "", PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: 0, ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Reschedule request by technician", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: mm.getSystemDate(), supportKey: 0 };
                        mm.sendNotificationToAdmin(8, `Reschedule request by technician`, ACTION_DETAILS, "", "J", supportKey, "J", req.body);
                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, item.CUSTOMER_ID, `**Job Reschedule by technician**`, `Technician ${req.body.authData.data.UserData[0].USER_NAME} rescheduled the job ${item.JOB_CARD_ID}`, "", "J", supportKey, "N", "J", req.body);
                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${item.CUSTOMER_ID}_channel`, `Job Rescheduled by technician`, `Technician ${req.body.authData.data.UserData[0].USER_NAME} rescheduled the job ${item.JOB_CARD_ID}`, "", "J", supportKey, "N", "J", req.body);
                        dbm.saveLog(logData, technicianActionLog);
                    });
                    res.status(200).json({ message: "jobRescheduleTransactions information saved successfully..." });
                }
            );
        } else {
            return res.status(400).json({ message: "data is required" });
        }
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.status(500).json({ message: "Something Went Wrong." });
    }
};
