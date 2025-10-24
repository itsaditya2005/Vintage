const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const request = require('request');

const applicationkey = process.env.APPLICATION_KEY;

var shiprocketLoginInfo = "shiprocket_login_info";
var viewShiprocketLoginInfo = "view_" + shiprocketLoginInfo;


function reqData(req) {

    var data = {
        COMPANY_ID: req.body.COMPANY_ID,
        CREATED_AT: req.body.CREATED_AT,
        EMAIL: req.body.EMAIL,
        FIRST_NAME: req.body.FIRST_NAME,
        SHIPROCKET_ID: req.body.SHIPROCKET_ID,
        LAST_NAME: req.body.LAST_NAME,
        TOKEN: req.body.TOKEN,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('COMPANY_ID').optional(), 
        body('CREATED_AT').optional(), 
        body('EMAIL').optional(), 
        body('FIRST_NAME	').optional(), 
        body('SHIPROCKET_ID	').isInt().optional(), 
        body('LAST_NAME	').optional(), 
        body('TOKEN	').optional(), body('ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewShiprocketLoginInfo + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get shiprocketLoginInfo count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewShiprocketLoginInfo + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get shiprocketLoginInfo information."
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
            mm.executeQueryData('INSERT INTO ' + shiprocketLoginInfo + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save shiprocketLoginInfo information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "ShiprocketLoginInfo information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + shiprocketLoginInfo + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update shiprocketLoginInfo information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "ShiprocketLoginInfo information updated successfully...",
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

exports.createToken = (supportKey,callback) => {
    const systemDate=mm.getSystemDate().split(" ")[0]
    try {
        mm.executeQueryData('select * from view_shiprocket_login_info where 1 AND date(EXPIRY_DATE)>= ? order by ID DESC LIMIT 1 ',systemDate, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                return callback(error, null)
            }
            else {
                if (results.length > 0) {
                    return callback(null, results[0].TOKEN)
                }
                else {
                    var options = {
                        url: 'https://apiv2.shiprocket.in/v1/external/auth/login',
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: {
                            "email": "developer@pockitengineers.com",
                            "password": "Pockit@123"
                        },
                        method: "post",
                        json: true
                    }

                    request(options, (error, response, body) => {
                        if (error) {
                            console.log("request error -send email ", error);
                            return callback(error, null)
                        } else {
                            mm.executeQueryData('insert into  shiprocket_login_info (COMPANY_ID,CREATED_AT,EMAIL,FIRST_NAME,SHIPROCKET_ID,LAST_NAME,TOKEN,CLIENT_ID) VALUES (?,?,?,?,?,?,?,?)', [body.company_id, body.created_at, body.email, body.first_name, body.id, body.last_name, body.token, "1"], supportKey, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    return callback(error, null)
                                }
                                else {
                                    return callback(null, body.token)
                                }
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        console.error(error);
        res.send({ code: 500, message: "Something went wrong." });
    }
};
