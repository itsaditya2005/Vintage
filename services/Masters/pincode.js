const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var pincodeMaster = "pincode_master";
var viewPincodeMaster = "view_" + pincodeMaster;

function reqData(req) {

    var data = {
        OFFICE_NAME: req.body.OFFICE_NAME,
        PINCODE: req.body.PINCODE,
        DIVISION_NAME: req.body.DIVISION_NAME,
        CIRCLE_NAME: req.body.CIRCLE_NAME,
        TALUKA: req.body.TALUKA,
        DISTRICT: req.body.DISTRICT,
        STATE: req.body.STATE,
        COUNTRY_ID: req.body.COUNTRY_ID,
        SUB_OFFICE: req.body.SUB_OFFICE,
        HEAD_OFFICE: req.body.HEAD_OFFICE,
        LONGITUDE: req.body.LONGITUDE,
        LATTITUDE: req.body.LATTITUDE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        STATE_NAME: req.body.STATE_NAME,
        COUNTRY_NAME: req.body.COUNTRY_NAME,
        DISTRICT_NAME: req.body.DISTRICT_NAME,
        PINCODE_FOR: req.body.PINCODE_FOR,
        IANA_CODE_ID: req.body.IANA_CODE_ID


    }
    return data;
}


exports.validate = function () {
    return [
        body('OFFICE_NAME').optional(),
        body('PINCODE').optional(),
        body('DIVISION_NAME').optional(),
        body('CIRCLE_NAME').optional(),
        body('TALUKA').optional(),
        body('DISTRICT').optional(),
        body('STATE').optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('SUB_OFFICE').optional(),
        body('HEAD_OFFICE').optional(),
        body('LONGITUDE').optional(),
        body('LATTITUDE').optional(),
        body('IS_ACTIVE').optional(),
        body('CLIENT_ID').isInt().optional(),
        body('ID').optional(),
        body('STATE_NAME').exists(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewPincodeMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get postal code count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewPincodeMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get postal code information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 82,
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
            mm.executeQueryData('SELECT * FROM ' + pincodeMaster + ' WHERE PINCODE = ?', [data.PINCODE], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get postal code information..."
                    });
                }
                else {
                    if (resultsCheck.length > 0) {
                        res.send({
                            "code": 300,
                            "message": "A postal code with the same postal code already exists."
                        });
                    } else {
                        mm.executeQueryData('INSERT INTO ' + pincodeMaster + ' SET ?', data, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save postal code information..."
                                });
                            }
                            else {
                                res.send({
                                    "code": 200,
                                    "message": "Pincode information saved successfully...",
                                });
                            }
                        });
                    }
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
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
    const fields = ["TALUKA", "DIVISION_NAME", "CIRCLE_NAME", "SUB_OFFICE", "HEAD_OFFICE"];

    fields.forEach((field) => {
        if (data[field] == null) {
            setData += `${field} = ? , `;
            recordData.push(null);
        }
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
            mm.executeQueryData('SELECT * FROM ' + pincodeMaster + ' WHERE PINCODE = ? AND ID != ?', [data.PINCODE, criteria.ID], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get postal code information..."
                    });
                }
                else {
                    if (resultsCheck.length > 0) {
                        res.send({
                            "code": 300,
                            "message": "A postal code with the same postal code already exists."
                        });
                    } else {
                        mm.executeQueryData(`UPDATE ` + pincodeMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update postal code information."
                                });
                            }
                            else {
                                mm.executeQueryData(`UPDATE customer_address_master SET PINCODE_FOR = ?  where PINCODE_ID = ${criteria.ID} `, [data.PINCODE_FOR], supportKey, (error, resultsUpdate) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update postal code information."
                                        });
                                    }
                                    else {
                                        res.send({
                                            "code": 200,
                                            "message": "Pincode information updated successfully...",
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
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}