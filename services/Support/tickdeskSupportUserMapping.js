const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var tickdeskSupportUserMapping = "tickdesk_support_user_mapping";
var viewTickdeskSupportUserMapping = "view_" + tickdeskSupportUserMapping;

function reqData(req) {
    var data = {
        EMPLOYEE_ID: req.body.EMPLOYEE_ID,
        DEPARTMENT_ID: req.body.DEPARTMENT_ID,
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('EMPLOYEE_ID').isInt(),
        body('DEPARTMENT_ID').isInt(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTickdeskSupportUserMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickdeskSupportUserMapping  count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTickdeskSupportUserMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get tickdeskSupportUserMapping  information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "count": results1[0].cnt,
                                "TAB_ID": 167,
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
            mm.executeQueryData('INSERT INTO ' + tickdeskSupportUserMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save tickdeskSupportUserMapping  information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "TickdeskSupportUserMapping  information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + tickdeskSupportUserMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update tickdeskSupportUserMapping  information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "TickdeskSupportUserMapping  information updated successfully...",
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

exports.addBulk = (req, res) => {
    try {
        const connection = mm.openConnection();
        var data = req.body.data;
        var supportKey = req.headers['supportkey'];
        var errors1 = "";
        var EMPLOYEE_ID1 = req.body.EMPLOYEE_ID;

        if ((!EMPLOYEE_ID1 && EMPLOYEE_ID1 == undefined && EMPLOYEE_ID1 == '') || (data == undefined && data.length == 0 && data == "")) {
            res.status(400).json({
                "message": "EMPLOYEE_ID  or data parameter missing"
            });
        } else {
            var array2 = [];
            var data1 = data//JSON.parse(data);
            for (let index = 0; index < data1.length; index++) {
                const element = data1[index];
                array2.push([element.DEPARTMENT_ID, element.STATUS, element.CLIENT_ID, EMPLOYEE_ID1]);
            }
            mm.executeDML('INSERT INTO tickdesk_support_user_mapping (DEPARTMENT_ID,STATUS,CLIENT_ID,EMPLOYEE_ID) values ?',
                [array2], supportKey, connection, (error, results1) => {
                    if (error) {
                        console.log(error);
                        mm.rollbackConnection(connection);
                        res.status(400).json({
                            "message": "Failed to save tickdeskSupportUser details..."
                        });
                    }
                    else {
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "message": "tickdeskSupportUser details added successfully..."
                        });
                    }
                });
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}