const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var departmentMaster = "department_master";
var viewDepartmentMaster = "view_" + departmentMaster;

function reqData(req) {
    var data = {
        ORG_ID: req.body.ORG_ID,
        NAME: req.body.NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        STATUS: req.body.STATUS ? '1' : '0',
        SEQUENCE_NO: req.body.SEQUENCE_NO,
        CLIENT_ID: req.body.CLIENT_ID,
        TICKET_TIME_PERIOD: req.body.TICKET_TIME_PERIOD,
        TYPE: req.body.TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('ORG_ID').isInt(),
        body('NAME', ' parameter missing').exists(),
        body('SHORT_CODE', ' parameter missing').exists(),
        body('SEQUENCE_NO', ' parameter missing').exists(),
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
    let criteria = '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewDepartmentMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get departments count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewDepartmentMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get department information."
                            });
                        } else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 175,
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
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
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
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('SELECT SHORT_CODE FROM ' + departmentMaster + ' WHERE SHORT_CODE = ?', [data.SHORT_CODE], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save department information..."
                    });
                }
                else if (resultsCheck.length > 0) {
                    return res.status(200).json({
                        "code": 300,
                        "message": "A department with the same short code already exists."
                    });
                }
                else {
                    mm.executeQueryData('INSERT INTO ' + departmentMaster + ' SET ?', data, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to save department information..."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "Department information saved successfully...",
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
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
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('SELECT SHORT_CODE FROM ' + departmentMaster + ' WHERE SHORT_CODE = ? AND ID != ?', [data.SHORT_CODE, criteria.ID], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save department information..."
                    });
                }
                else if (resultsCheck.length > 0) {
                    return res.status(200).json({
                        "code": 300,
                        "message": "A department with the same short code already exists."
                    });
                }
                else {
                    mm.executeQueryData(`UPDATE ` + departmentMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to update department information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "Department information updated successfully...",
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "message": "Something went wrong."
            });
        }
    }
}