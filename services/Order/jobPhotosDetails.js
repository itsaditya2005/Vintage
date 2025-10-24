const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;

var jobPhotosDetails = "job_photos_details";
var viewJobPhotosDetails = "view_" + jobPhotosDetails;


function reqData(req) {

    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        UPLOADED_DATE_TIME: req.body.UPLOADED_DATE_TIME,
        PHOTOS_URL: req.body.PHOTOS_URL,
        STATUS: req.body.STATUS,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(), 
        body('TECHNICIAN_ID').isInt().optional(), 
        body('ORDER_ID').isInt().optional(), 
        body('CUSTOMER_ID').isInt().optional(), 
        body('UPLOADED_DATE_TIME').optional(), 
        body('PHOTOS').optional(), 
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
            mm.executeQuery('select count(*) as cnt from ' + viewJobPhotosDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get jobPhotosDetails count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewJobPhotosDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get jobPhotosDetails information."
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


exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + jobPhotosDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save jobPhotosDetails information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added job photos.`;

                    var logCategory = "job card photo details";

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "code": 200,
                        "message": "JobPhotosDetails information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + jobPhotosDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update jobPhotosDetails information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated job photo details.`;

                    var logCategory = "job card photo details";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "code": 200,
                        "message": "JobPhotosDetails information saved successfully...",
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


exports.addPhotos = (req, res) => {
    const { JOB_CARD_ID, TECHNICIAN_ID, CUSTOMER_ID, ORDER_ID, PHOTOS_DATA, STATUS, REMARK } = req.body;
    var UPLOADED_DATE_TIME = mm.getSystemDate();
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!JOB_CARD_ID || !TECHNICIAN_ID || !CUSTOMER_ID || !ORDER_ID || !STATUS) {
        return res.status(400).json({
            "code": 400,
            "message": "All required fields"
        });
    }
    try {
        if (PHOTOS_DATA.length > 0) {
            var details = [];
            for (var i = 0; i < PHOTOS_DATA.length; i++) {
                details.push([JOB_CARD_ID, TECHNICIAN_ID, ORDER_ID, CUSTOMER_ID, UPLOADED_DATE_TIME, STATUS, PHOTOS_DATA[i].PHOTOS, 1, REMARK]);
            }
            mm.executeQueryData('INSERT INTO job_photos_details ( JOB_CARD_ID, TECHNICIAN_ID, ORDER_ID, CUSTOMER_ID, UPLOADED_DATE_TIME, STATUS, PHOTOS_URL, CLIENT_ID, REMARK)VALUES ?', [details], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    return res.status(400).json({
                        "code": 400,
                        "message": `Failed to save PHOTOS information for item at index ${i}.`
                    });
                } else {
                    mm.executeQueryData('UPDATE job_card SET REMARK = ?,IS_JOB_COMPLETE = 1 WHERE 1  AND ID = ?', [REMARK, JOB_CARD_ID], supportKey, (error, updateJob) => {
                        if (error) {
                            console.error(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                code: 400,
                                message: "Failed to save PHOTOS information.",
                            });
                        } else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has successfully saved the photos.`;
                            var logCategory = "job card photo details";
                            let actionLog = {
                                "SOURCE_ID": JOB_CARD_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog)
                            return res.status(200).json({
                                "code": 200,
                                "message": "PHOTOS information saved successfully."
                            });

                        }
                    });
                }
            });
        } else {
            mm.executeQueryData('UPDATE job_card SET REMARK = ?,IS_JOB_COMPLETE = 1 WHERE 1  AND ID = ?', [REMARK, JOB_CARD_ID], supportKey, (error, updateJob) => {
                if (error) {
                    console.error(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        code: 400,
                        message: "Failed to save PHOTOS information.",
                    });
                } else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has successfully saved the photos.`;
                    var logCategory = "job card photo details";
                    let actionLog = {
                        "SOURCE_ID": JOB_CARD_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    return res.status(200).json({
                        "code": 200,
                        "message": "PHOTOS information saved successfully."
                    });

                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.deletePhoto = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };

    if (!criteria.ID) {
        return res.status(400).json({
            "code": 400,
            "message": "ID required fields"
        });
    }

    try {
        mm.executeQueryData(`DELETE FROM job_photos_details WHERE ID = ?`, [criteria.ID], supportKey, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to delete jobPhotosDetails information."
                });
            }
            else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has deleted the photos.`;
                res.status(200).json({
                    "code": 200,
                    "message": "photo deleted successfully...",
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




