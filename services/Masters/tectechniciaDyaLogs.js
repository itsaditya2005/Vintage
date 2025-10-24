const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")

const applicationkey = process.env.APPLICATION_KEY;

var technicianDayLogs = "technician_day_logs";
var viewtechnicianDayLogs = "view_" + technicianDayLogs;

function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        LOG_DATE_TIME: req.body.LOG_DATE_TIME,
        LOG_TEXT: req.body.LOG_TEXT,
        STATUS: req.body.STATUS,
        TYPE: req.body.TYPE,
        USER_ID: req.body.USER_ID,

        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SHORT_CODE').optional(),
        body('SEQ_NO').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewtechnicianDayLogs + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianDayLogs count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewtechnicianDayLogs + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianDayLogs information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 128,
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
            mm.executeQueryData('INSERT INTO ' + technicianDayLogs + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianDayLogs information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated technician day log.`;
                    var logCategory = "technician day logs";

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
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
            mm.executeQueryData(`UPDATE ` + technicianDayLogs + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianDayLogs information."
                    });
                }
                else {

                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated technician day log`;

                    var logCategory = "technician day logs";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
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


exports.getDateWiseLogs = async (req, res) => {
    const pageIndex = req.body.pageIndex ? parseInt(req.body.pageIndex) : 1;
    const pageSize = req.body.pageSize ? parseInt(req.body.pageSize) : 10;
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue === 'ASC' ? 1 : -1;
    var filter = req.body.filter || {};
    const supportKey = req.headers['supportkey'];
    filter = JSON.parse(filter)
    try {
        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (IS_FILTER_WRONG === '0') {
            const matchCriteria = filter;

            const countResult = await technicainDayLog.aggregate([
                { $match: matchCriteria },
                { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$LOG_DATE_TIME' } } } },
                { $count: 'cnt' }
            ]);

            const totalDistinctDates = countResult[0]?.cnt || 0;

            const dataResult = await technicainDayLog.aggregate([
                { $match: matchCriteria },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$LOG_DATE_TIME' } },
                        ACTION_LOGS: {
                            $push: {
                                ID: '$ID',
                                TECHNICIAN_ID: '$TECHNICIAN_ID',
                                TYPE: '$TYPE',
                                LOG_TEXT: '$LOG_TEXT',
                                STATUS: '$STATUS',
                                USER_ID: '$USER_ID',
                                USER_NAME: '$USER_NAME',
                                TECHNICIAN_NAME: '$TECHNICIAN_NAME',
                                TIME: { $dateToString: { format: '%H:%M:%S', date: '$LOG_DATE_TIME' } }
                            }
                        }
                    }
                },
                { $sort: { _id: sortValue } },
                { $skip: (pageIndex - 1) * pageSize },
                { $limit: pageSize }
            ]);

            res.status(200).send({
                code: 200,
                message: 'success',
                count: totalDistinctDates,
                data: dataResult
            });
        } else {
            res.status(422).send({
                code: 422,
                message: 'Invalid filter provided.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({
            code: 500,
            message: 'Internal Server Error.'
        });
    }
};



exports.addLog = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    data.LOG_DATE_TIME = mm.getSystemDate();
    if (!data.TECHNICIAN_ID) {
        res.send({
            "code": 422,
            "message": "TECHNICIAN_ID is required"
        });
        return;
    }
    const IS_UPDATED_ADMIN = req.body.IS_UPDATED_ADMIN
    var TECHNICIAN_STATUS
    var key = ""
    if (data.STATUS == "EN") {
        IS_UPDATED_ADMIN === 1 ? key = "is enabled by you" : key = "has enabled himself"
        IS_UPDATED_ADMIN === 1 ? data.LOG_TEXT = "Technician enabled by admin" : data.LOG_TEXT = "Technician enabled himself"
        IS_UPDATED_ADMIN === 1 ? data.TYPE = "ADMIN" : data.TYPE = "TECHNICIAN"
        TECHNICIAN_STATUS = 1
    } else if (data.STATUS == "DE") {
        IS_UPDATED_ADMIN === 1 ? key = "is disabled by you" : key = "has disabled himself"
        IS_UPDATED_ADMIN === 1 ? data.LOG_TEXT = "Technician disabled by admin" : data.LOG_TEXT = "Technician disabled himself"
        IS_UPDATED_ADMIN === 1 ? data.TYPE = "ADMIN" : data.TYPE = "TECHNICIAN"
        TECHNICIAN_STATUS = 0
    } else {
        res.status(422).json({
            "code": 422,
            "message": "Invalid Status"
        });
        return;
    }

    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            data.USER_ID = data.TECHNICIAN_ID
            mm.executeQueryData('INSERT INTO ' + technicianDayLogs + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technicianDayLogs information..."
                    });
                }
                else {
                    mm.executeQueryData('update technician_master SET TECHNICIAN_STATUS=? where ID=?', [TECHNICIAN_STATUS, data.TECHNICIAN_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to update technician_masters information..."
                            });
                        } else {
                            mm.sendNotificationToAdmin(8, "Technician Activity Notification", `Hello Admin, the technician ${req.body.TECHNICIAN_NAME} ${key}`, "", "TA", supportKey, "TA", data);
                            mm.sendNotificationToChannel(0, 'admin_channel', "Technician Activity Notification", `Hello Admin, The technician ${req.body.TECHNICIAN_NAME} ${key}`, "", "TA", supportKey, "", "TA", data);

                            res.status(200).json({
                                "code": 200,
                                "message": "Successfuly update technician_masters information..."
                            });
                        }
                    })
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(400).json({
                "code": 400,
                "message": "Something went wrong."
            });
        }
    }
}