const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const token = require('../ShipModule/shiprocketLoginInfo')
const applicationkey = process.env.APPLICATION_KEY;
const request = require('request')
var warehouseMaster = "warehouse_master";
var viewWarehouseMaster = "view_" + warehouseMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        PICKUP_LOCATION: req.body.PICKUP_LOCATION,
        ADDRESS_LINE1: req.body.ADDRESS_LINE1,
        ADDRESS_LINE2: req.body.ADDRESS_LINE2,
        CITY_NAME: req.body.CITY_NAME,
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        PIN_CODE_ID: req.body.PIN_CODE_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        PIN_CODE_ID: req.body.PIN_CODE_ID,
        WAREHOUSE_MANAGER_NAME: req.body.WAREHOUSE_MANAGER_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        PINCODE: req.body.PINCODE,
        WAREHOUSE_MANAGER_ID: req.body.WAREHOUSE_MANAGER_ID,
        LATITUDE: req.body.LATITUDE,
        LONGITUDE: req.body.LONGITUDE



    }
    return data;
}

exports.validate = function () {
    return [

        // body('NAME', ' parameter missing').exists(), body('ADDRESS_LINE1', ' parameter missing').exists(), body('ADDRESS_LINE2', ' parameter missing').exists(), body('CITY_ID').isInt(), body('STATE_ID').isInt(), body('COUNTRY_ID').isInt(), body('PIN_CODE_ID').isInt(), body('COUNTRY_ID').isInt(), body('PIN_CODE_ID').isInt(), body('WAREHOUSE_MANAGER_NAME', ' parameter missing').exists(), body('MOBILE_NO', ' parameter missing').exists(), body('EMAIL_ID', ' parameter missing').exists(), body('STATUS', ' parameter missing').exists(), body('ID').optional(),
        body('NAME', ' parameter missing').exists(),
        body('ADDRESS_LINE1', ' parameter missing').exists(),
        body('ADDRESS_LINE2').optional(),
        body('CITY_ID').optional(),
        body('STATE_ID').isInt(),
        body('COUNTRY_ID').isInt(),
        body('COUNTRY_ID').isInt(),
        body('WAREHOUSE_MANAGER_NAME', ' parameter missing').exists(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('STATUS', ' parameter missing').exists(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewWarehouseMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get warehouse count.",
                    });
                }
                else {

                    mm.executeQuery('select * from ' + viewWarehouseMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get warehouse information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 136,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {

        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
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
            mm.executeQueryData('INSERT INTO ' + warehouseMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save warehouse information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Warehouse information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
        }
    }
}

exports.update = (req, res) => {
    const errors = validationResult(req);
    var { CITY_NAME, STATE_NAME, PINCODE, COUNTRY_NAME } = req.body
    var data = reqData(req);
    data.PICKUP_LOCATION = data.NAME.replace(/\s+/g, "");
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
            mm.executeQueryData(`select * from  ` + warehouseMaster + ` where ID = ${criteria.ID} `, [], supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update warehouse information."
                    });
                }
                else {
                    mm.executeQueryData(`UPDATE ` + warehouseMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results1) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update warehouse information."
                            });
                        }
                        else {
                            if (results[0].NAME != data.NAME) {
                                token.createToken(supportKey, (error, result) => {
                                    if (error) {
                                        console.log("error", error)
                                        res.status(400).json({
                                            "code": 400,
                                            "message": "Failed to save pickupLocation information..."
                                        });
                                    }
                                    else {
                                        const body = {
                                            "pickup_location": data.PICKUP_LOCATION,
                                            "name": data.NAME,
                                            "email": data.EMAIL_ID,
                                            "phone": data.MOBILE_NO,
                                            "address": JSON.stringify(data.ADDRESS_LINE1),
                                            "address_2": data.ADDRESS_LINE2,
                                            "city": CITY_NAME,
                                            "state": STATE_NAME,
                                            "country": COUNTRY_NAME,
                                            "pin_code": PINCODE.split("-")[0]
                                        }
                                        console.log("body", body)
                                        var options = {
                                            url: 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": "Bearer " + result
                                            },
                                            body: body,
                                            method: "post",
                                            json: true
                                        }

                                        request(options, (error, response, body) => {
                                            if (body.success != true) {
                                                console.log("body", body);
                                                res.status(400).json({
                                                    "code": 400,
                                                    "message": body.message,
                                                });
                                            } else {
                                                console.log("body", body)
                                                res.status(200).json({
                                                    "code": 200,
                                                    "message": "PickupLocation information saved successfully...",
                                                });
                                            }
                                        });
                                    }
                                })
                            }
                            else {
                                res.status(200).json({
                                    "code": 200,
                                    "message": "PickupLocation information saved successfully...",
                                });
                            }


                        }
                    });

                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
        }
    }
}

exports.createWarehouse = (req, res) => {

    var data = reqData(req);
    var { CITY_NAME, STATE_NAME, PINCODE, COUNTRY_NAME } = req.body
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
            data.PICKUP_LOCATION = data.NAME.replace(/\s+/g, "");
            const connection = mm.openConnection();
            mm.executeDML('INSERT INTO ' + warehouseMaster + ' SET ?', data, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save warehouse information..."
                    });
                }
                else {
                    mm.executeDML('SELECT * FROM inventory_master WHERE STATUS=1 ; ', [], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save warehouse information..."
                            });
                        }
                        else {
                            if (results2.length > 0) {
                                var inventoryData = []
                                for (var i = 0; i < results2.length; i++) {
                                    inventoryData.push([results1.insertId, results2[i].ID, 0, 0, 1])
                                }
                                mm.executeDML('INSERT INTO inventory_warehouse_stock_management (WAREHOUSE_ID,ITEM_ID,TOTAL_INWARD,CURRENT_STOCK,CLIENT_ID) VALUES ?', [inventoryData], supportKey, connection, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save warehouse information..."
                                        });
                                    }
                                    else {
                                        token.createToken(supportKey, (error, result) => {
                                            if (error) {
                                                console.log("error", error)
                                                mm.rollbackConnection(connection)
                                                res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to save pickupLocation information..."
                                                });
                                            }
                                            else {
                                                const body = {
                                                    "pickup_location": data.PICKUP_LOCATION,
                                                    "name": data.NAME,
                                                    "email": data.EMAIL_ID,
                                                    "phone": data.MOBILE_NO,
                                                    "address": JSON.stringify(data.ADDRESS_LINE1),
                                                    "address_2": data.ADDRESS_LINE2,
                                                    "city": CITY_NAME,
                                                    "state": STATE_NAME,
                                                    "country": COUNTRY_NAME,
                                                    "pin_code": PINCODE.split("-")[0]
                                                }
                                                var options = {
                                                    url: 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                                                    headers: {
                                                        "Content-Type": "application/json",
                                                        "Authorization": "Bearer " + result
                                                    },
                                                    body: body,
                                                    method: "post",
                                                    json: true
                                                }

                                                request(options, (error, response, body) => {
                                                    if (body.success == true) {
                                                        mm.commitConnection(connection)
                                                        res.status(200).json({
                                                            "code": 200,
                                                            "message": "PickupLocation information saved successfully...",
                                                        });
                                                    }
                                                    else {
                                                        mm.rollbackConnection(connection)
                                                        res.status(400).json({
                                                            "code": 400,
                                                            "message": body.message,
                                                        });
                                                    }

                                                });
                                            }
                                        })
                                    }
                                });
                            } else {
                                token.createToken(supportKey, (error, result) => {
                                    if (error) {
                                        console.log("error", error)
                                        mm.rollbackConnection(connection)
                                        res.status(400).json({
                                            "code": 400,
                                            "message": "Failed to save pickupLocation information..."
                                        });
                                    }
                                    else {
                                        const body = {
                                            "pickup_location": data.PICKUP_LOCATION,
                                            "name": data.NAME,
                                            "email": data.EMAIL_ID,
                                            "phone": data.MOBILE_NO,
                                            "address": JSON.stringify(data.ADDRESS_LINE1),
                                            "address_2": data.ADDRESS_LINE2,
                                            "city": CITY,
                                            "state": STATE,
                                            "country": COUNTRY,
                                            "pin_code": PINCODE
                                        }
                                        var options = {
                                            url: 'https://apiv2.shiprocket.in/v1/external/settings/company/addpickup',
                                            headers: {
                                                "Content-Type": "application/json",
                                                "Authorization": "Bearer " + result
                                            },
                                            body: body,
                                            method: "post",
                                            json: true
                                        }

                                        request(options, (error, response, body) => {
                                            if (error) {
                                                console.log("error", error);
                                                mm.rollbackConnection(connection)
                                                res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to save pickupLocation information...",
                                                });
                                            } else {
                                                mm.commitConnection(connection)
                                                res.status(200).json({
                                                    "code": 200,
                                                    "message": "PickupLocation information saved successfully...",
                                                });
                                            }
                                        });
                                    }
                                })
                            }
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
        }
    }
}

