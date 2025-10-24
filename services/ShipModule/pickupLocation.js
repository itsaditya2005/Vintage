const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const token = require('./shiprocketLoginInfo')
const applicationkey = process.env.APPLICATION_KEY;
const request=require('request')
var pickupLocation = "pickup_location";
var viewPickupLocation = "view_" + pickupLocation;


function reqData(req) {

    var data = {
        PICKUP_LOCATION: req.body.PICKUP_LOCATION,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        PHONE: req.body.PHONE,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE1: req.body.ADDRESS_LINE1,
        CITY: req.body.CITY,
        STATE: req.body.STATE,
        COUNTRY: req.body.COUNTRY,
        PINCODE: req.body.PINCODE,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        ORDER_ID: req.body.ORDER_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('PICKUP_LOCATION', ' parameter missing').exists(), 
        body('NAME', ' parameter missing').exists(), 
        body('EMAIL', ' parameter missing').exists(), 
        body('PHONE', ' parameter missing').exists(), 
        body('ADDRESS_LINE_1', ' parameter missing').exists(), 
        body('ADDRESS_LINE1', ' parameter missing').exists(), 
        body('CITY', ' parameter missing').exists(), 
        body('STATE', ' parameter missing').exists(), 
        body('COUNTRY', ' parameter missing').exists(), 
        body('PINCODE', ' parameter missing').exists(), 
        body('WAREHOUSE_ID').isInt(), 
        body('ORDER_ID').isInt(), 
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
            mm.executeQuery('select count(*) as cnt from ' + viewPickupLocation + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get pickupLocation count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewPickupLocation + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get pickupLocation information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "TAB_ID": 195,
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
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + pickupLocation + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save pickupLocation information..."
                    });
                }
                else {
                    token.createToken(supportKey, (error, result) => {
                        if (error) {
                            console.log("error", error)
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to save pickupLocation information..."
                            });
                        }
                        else {
                            const body={
                                "pickup_location": data.PICKUP_LOCATION,
                                "name": data.NAME,
                                "email": data.EMAIL,
                                "phone": data.PHONE,
                                "address":data.ADDRESS_LINE_1,
                                "address_2":data.ADDRESS_LINE1,
                                "city": data.CITY,
                                "state": data.STATE,
                                "country": data.COUNTRY,
                                "pin_code": data.PINCODE
                              }
                            var options = {
                                url: 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                                headers: {
                                    "Content-Type": "application/json",
                                    "Authorization":"Bearer "+result
                                },
                                body:body,
                                method: "post",
                                json: true
                            }

                            request(options, (error, response, body) => {
                                if (error) {
                                    console.log("request error -send email ", error);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save pickupLocation information...",
                                    });
                                } else {
                                    res.status(200).json({
                                        "code": 200,
                                        "message": "PickupLocation information saved successfully...",
                                    });
                                }
                            });
                        }
                    })

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
            mm.executeQueryData(`UPDATE ` + pickupLocation + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update pickupLocation information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "PickupLocation information updated successfully...",
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