const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const applicationkey = process.env.APPLICATION_KEY;

var customerAddressMaster = "customer_address_master";
var viewCustomerAddressMaster = "view_" + customerAddressMaster;

function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE_ID: req.body.STATE_ID,
        CITY_ID: req.body.CITY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        GEO_LOCATION: req.body.GEO_LOCATION,
        TYPE: req.body.TYPE,
        IS_DEFAULT: req.body.IS_DEFAULT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        LANDMARK: req.body.LANDMARK,
        HOUSE_NO: req.body.HOUSE_NO,
        BUILDING: req.body.BUILDING,
        FLOOR: req.body.FLOOR,
        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        STATUS: req.body.STATUS ? '1' : '0',
        PINCODE_FOR: req.body.PINCODE_FOR
    }
    return data;
}

function reqDatalog(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        ADDRESS_ID: req.body.ADDRESS_ID,
        CONTACT_PERSON_NAME: req.body.CONTACT_PERSON_NAME,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        COUNTRY_ID: req.body.COUNTRY_ID,
        STATE_ID: req.body.STATE_ID,
        CITY_ID: req.body.CITY_ID,
        PINCODE_ID: req.body.PINCODE_ID,
        GEO_LOCATION: req.body.GEO_LOCATION,
        TYPE: req.body.TYPE,
        IS_DEFAULT: req.body.IS_DEFAULT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        DISTRICT_ID: req.body.DISTRICT_ID,
        LANDMARK: req.body.LANDMARK,
        HOUSE_NO: req.body.HOUSE_NO,
        BUILDING: req.body.BUILDING,
        FLOOR: req.body.FLOOR,
        PINCODE: req.body.PINCODE,
        CITY_NAME: req.body.CITY_NAME,
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        STATUS: req.body.STATUS ? '1' : '0',
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('MOBILE_NO').optional(),
        body('EMAIL_ID').optional(),
        body('ADDRESS_LINE_1').optional(),
        body('ADDRESS_LINE_2').optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('STATE_ID').isInt().optional(),
        body('CITY_ID').optional(),
        body('PINCODE_ID').optional(),
        body('GEO_LOCATION').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewCustomerAddressMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customerAddress count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewCustomerAddressMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customerAddress information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 17,
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
    var dataUpdate = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            dataUpdate.STATUS = 1
            mm.executeQueryData('SELECT * FROM ' + customerAddressMaster + ' WHERE CUSTOMER_ID = ' + dataUpdate.CUSTOMER_ID + ' AND IS_DEFAULT = 1', [], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerAddress information..."
                    });
                } else {
                    if (resultsCheck.length > 0) {
                        mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET IS_DEFAULT=0, CREATED_MODIFIED_DATE = '${mm.getSystemDate()}' where ID = ${resultsCheck[0].ID} `, [], supportKey, (updateError, updateResults) => {
                            if (updateError) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(updateError), applicationkey);
                                console.log(updateError);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update customerAddress information."
                                });
                            } else {
                                mm.executeQueryData('INSERT INTO ' + customerAddressMaster + ' SET ?', dataUpdate, supportKey, (insertError, insertResults) => {
                                    if (insertError) {
                                        console.log(insertError);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save customerAddress information..."
                                        });
                                    } else {
                                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                        var ACTION_DETAILS = `User ${NAME} has created a new address.`;
                                        var logCategory = "customer address";

                                        let actionLog = {
                                            "SOURCE_ID": insertResults.insertId,
                                            "LOG_DATE_TIME": mm.getSystemDate(),
                                            "LOG_TEXT": ACTION_DETAILS,
                                            "CATEGORY": logCategory,
                                            "CLIENT_ID": 1,
                                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                            "supportKey": 0
                                        };

                                        dbm.saveLog(actionLog, systemLog);

                                        var CHANNEL_NAME = `promotion_state_${dataUpdate.STATE_ID}_channel`;
                                        var CHANNEL_NAME2 = `promotion_country_${dataUpdate.COUNTRY_ID}_channel`;
                                        var data = {
                                            "CHANNEL_NAME": CHANNEL_NAME,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };
                                        var data2 = {
                                            "CHANNEL_NAME": CHANNEL_NAME2,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };
                                        channelSubscribedUsers.findOne(data)
                                            .then(existingRecord => {
                                                if (existingRecord) {
                                                    res.send({
                                                        "code": 200,
                                                        "message": "CustomerAddress information saved successfully...",
                                                        "ID": insertResults.insertId
                                                    });
                                                } else {
                                                    const chanelData = {
                                                        CHANNEL_NAME: CHANNEL_NAME,
                                                        USER_ID: dataUpdate.CUSTOMER_ID,
                                                        TYPE: "C",
                                                        STATUS: true,
                                                        USER_NAME: dataUpdate.NAME,
                                                        CLIENT_ID: dataUpdate.CLIENT_ID,
                                                        DATE: mm.getSystemDate()
                                                    };
                                                    const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                                    newchannelSubscribedUsers.save();

                                                    channelSubscribedUsers.findOne(data2)
                                                        .then(existingRecord2 => {
                                                            if (existingRecord2) {
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "CustomerAddress information saved successfully...",
                                                                    "ID": insertResults.insertId
                                                                });
                                                            } else {
                                                                const chanelData2 = {
                                                                    CHANNEL_NAME: CHANNEL_NAME2,
                                                                    USER_ID: dataUpdate.CUSTOMER_ID,
                                                                    TYPE: "C",
                                                                    STATUS: true,
                                                                    USER_NAME: dataUpdate.NAME,
                                                                    CLIENT_ID: dataUpdate.CLIENT_ID,
                                                                    DATE: mm.getSystemDate()
                                                                };
                                                                const newchannelSubscribedUsers2 = new channelSubscribedUsers(chanelData2);
                                                                newchannelSubscribedUsers2.save();

                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "CustomerAddress information saved successfully...",
                                                                    "ID": insertResults.insertId
                                                                });
                                                            }
                                                        })
                                                        .catch(error => {
                                                            console.error(error);
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Something went wrong during country channel subscription"
                                                            });
                                                        });
                                                }
                                            })
                                            .catch(error => {
                                                console.error(error);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Something went wrong during state channel subscription"
                                                });
                                            });
                                    }
                                });
                            }
                        });
                    } else {
                        mm.executeQueryData('INSERT INTO ' + customerAddressMaster + ' SET ?', dataUpdate, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerAddress information..."
                                });
                            } else {
                                var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                var ACTION_DETAILS = `User ${NAME} has created a new address.`;
                                var logCategory = "customer address";

                                let actionLog = {
                                    "SOURCE_ID": results.insertId,
                                    "LOG_DATE_TIME": mm.getSystemDate(),
                                    "LOG_TEXT": ACTION_DETAILS,
                                    "CATEGORY": logCategory,
                                    "CLIENT_ID": 1,
                                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                    "supportKey": 0
                                };
                                dbm.saveLog(actionLog, systemLog);

                                res.send({
                                    "code": 200,
                                    "message": "CustomerAddress information saved successfully...",
                                    "ID": results.insertId
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
};

//created by darshan on 25-03-2025 for create address without updating any previous address
exports.createAddressOLD = (req, res) => {
    var dataUpdate = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            dataUpdate.STATUS = 1
            mm.executeQueryData('INSERT INTO ' + customerAddressMaster + ' SET ?', dataUpdate, supportKey, (insertError, insertResults) => {
                if (insertError) {
                    console.log(insertError);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerAddress information..."
                    });
                } else {
                    var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                    var ACTION_DETAILS = `User ${NAME} has created new address.`;
                    var logCategory = "customer address";

                    let actionLog = {
                        "SOURCE_ID": insertResults.insertId,
                        "LOG_DATE_TIME": mm.getSystemDate(),
                        "LOG_TEXT": ACTION_DETAILS,
                        "CATEGORY": logCategory,
                        "CLIENT_ID": 1,
                        "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "supportKey": 0
                    };

                    dbm.saveLog(actionLog, systemLog);

                    var CHANNEL_NAME = `promotion_state_${dataUpdate.STATE_ID}_channel`;
                    var CHANNEL_NAME2 = `promotion_country_${dataUpdate.COUNTRY_ID}_channel`;
                    var data = {
                        "CHANNEL_NAME": CHANNEL_NAME,
                        "USER_ID": dataUpdate.CUSTOMER_ID,
                        "TYPE": "C"
                    };
                    var data2 = {
                        "CHANNEL_NAME": CHANNEL_NAME2,
                        "USER_ID": dataUpdate.CUSTOMER_ID,
                        "TYPE": "C"
                    };
                    channelSubscribedUsers.findOne(data)
                        .then(existingRecord => {
                            if (existingRecord) {
                                res.send({
                                    "code": 200,
                                    "message": "CustomerAddress information saved successfully...",
                                    "ID": insertResults.insertId
                                });
                            } else {
                                const chanelData = {
                                    CHANNEL_NAME: CHANNEL_NAME,
                                    USER_ID: dataUpdate.CUSTOMER_ID,
                                    TYPE: "C",
                                    STATUS: true,
                                    USER_NAME: dataUpdate.NAME,
                                    CLIENT_ID: dataUpdate.CLIENT_ID,
                                    DATE: mm.getSystemDate()
                                };
                                const newchannelSubscribedUsers = new channelSubscribedUsers(chanelData);
                                newchannelSubscribedUsers.save();

                                channelSubscribedUsers.findOne(data2)
                                    .then(existingRecord2 => {
                                        if (existingRecord2) {
                                            res.send({
                                                "code": 200,
                                                "message": "CustomerAddress information saved successfully...",
                                                "ID": insertResults.insertId
                                            });
                                        } else {
                                            const chanelData2 = {
                                                CHANNEL_NAME: CHANNEL_NAME2,
                                                USER_ID: dataUpdate.CUSTOMER_ID,
                                                TYPE: "C",
                                                STATUS: true,
                                                USER_NAME: dataUpdate.NAME,
                                                CLIENT_ID: dataUpdate.CLIENT_ID,
                                                DATE: mm.getSystemDate()
                                            };
                                            const newchannelSubscribedUsers2 = new channelSubscribedUsers(chanelData2);
                                            newchannelSubscribedUsers2.save();

                                            res.send({
                                                "code": 200,
                                                "message": "CustomerAddress information saved successfully...",
                                                "ID": insertResults.insertId
                                            });
                                        }
                                    })
                                    .catch(error => {
                                        console.error(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Something went wrong during country channel subscription"
                                        });
                                    });
                            }
                        })
                        .catch(error => {
                            console.error(error);
                            res.send({
                                "code": 400,
                                "message": "Something went wrong during state channel subscription"
                            });
                        });
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
};

//chnages made by pranali on 26-03-2025 for channel subscription
exports.createAddress = (req, res) => {
    var dataUpdate = reqData(req);
    var dataLog = reqDatalog(req);
    var CUSTOMER_NAME = req.body.CONTACT_PERSON_NAME
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            dataUpdate.STATUS = 1
            mm.executeQueryData('INSERT INTO ' + customerAddressMaster + ' SET ?', dataUpdate, supportKey, (insertError, insertResults) => {
                if (insertError) {
                    console.log(insertError);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerAddress information..."
                    });
                } else {
                    dataLog.ADDRESS_ID = insertResults.insertId
                    mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                        if (insertError) {
                            console.log(insertError);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save customerAddress information..."
                            });
                        } else {
                            if (dataUpdate.IS_DEFAULT && (dataUpdate.IS_DEFAULT == 1 || dataUpdate.IS_DEFAULT == true)) {
                                console.log("IS_DEFAULT is set to 1. Updating other addresses...");
                                mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET IS_DEFAULT=?, CREATED_MODIFIED_DATE = ? WHERE ID!= ? AND CUSTOMER_ID = ?`, [0, mm.getSystemDate(), insertResults.insertId, dataUpdate.CUSTOMER_ID], supportKey, (error, resultsUpdate) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save customerAddress information..."
                                        });
                                    }
                                    else {
                                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                        var ACTION_DETAILS = `User ${NAME} has created a new address.`;
                                        var logCategory = "customer address";

                                        let actionLog = {
                                            "SOURCE_ID": insertResults.insertId,
                                            "LOG_DATE_TIME": mm.getSystemDate(),
                                            "LOG_TEXT": ACTION_DETAILS,
                                            "CATEGORY": logCategory,
                                            "CLIENT_ID": 1,
                                            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                            "supportKey": 0
                                        };

                                        dbm.saveLog(actionLog, systemLog);
                                        var SUBSCRIBED_CHANNELS = []
                                        var CHANNEL_NAME = `promotion_state_${dataUpdate.STATE_ID}_channel`;
                                        var CHANNEL_NAME2 = `promotion_country_${dataUpdate.COUNTRY_ID}_channel`;
                                        var CHANNEL_NAME3 = `pincode_${dataUpdate.PINCODE_ID}_channel`;
                                        var data = {
                                            "CHANNEL_NAME": CHANNEL_NAME,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };
                                        var data2 = {
                                            "CHANNEL_NAME": CHANNEL_NAME2,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };
                                        var data3 = {
                                            "CHANNEL_NAME": CHANNEL_NAME3,
                                            "USER_ID": dataUpdate.CUSTOMER_ID,
                                            "TYPE": "C"
                                        };

                                        function subscribeUser(channelName, dataUpdate, SUBSCRIBED_CHANNELS) {
                                            const channelData = {
                                                CHANNEL_NAME: channelName,
                                                USER_ID: dataUpdate.CUSTOMER_ID,
                                                TYPE: "C",
                                                STATUS: true,
                                                USER_NAME: CUSTOMER_NAME,
                                                CLIENT_ID: dataUpdate.CLIENT_ID,
                                                DATE: mm.getSystemDate()
                                            };
                                            const newChannel = new channelSubscribedUsers(channelData);
                                            newChannel.save();
                                            SUBSCRIBED_CHANNELS.push(channelData);
                                        }

                                        channelSubscribedUsers.findOne(data).then(existingRecord => {
                                            if (!existingRecord) {
                                                subscribeUser(CHANNEL_NAME, dataUpdate, SUBSCRIBED_CHANNELS);
                                            }
                                            channelSubscribedUsers.findOne(data2).then(existingRecord2 => {
                                                if (!existingRecord2) {
                                                    subscribeUser(CHANNEL_NAME2, dataUpdate, SUBSCRIBED_CHANNELS);
                                                }
                                                channelSubscribedUsers.findOne(data3).then(existingRecord3 => {
                                                    if (!existingRecord3) {
                                                        subscribeUser(CHANNEL_NAME3, dataUpdate, SUBSCRIBED_CHANNELS);
                                                    }
                                                    res.send({
                                                        "code": 200,
                                                        "message": "CustomerAddress information saved successfully...",
                                                        "ID": insertResults.insertId,
                                                        "SUBSCRIBED_CHANNELS": SUBSCRIBED_CHANNELS
                                                    });
                                                }).catch(error => handleError(res, error));
                                            }).catch(error => handleError(res, error));
                                        }).catch(error => handleError(res, error));

                                        function handleError(res, error) {
                                            console.error(error);
                                            res.send({
                                                "code": 400,
                                                "message": "Something went wrong during channel subscription"
                                            });
                                        }
                                    }
                                })
                            } else {
                                var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                var ACTION_DETAILS = `User ${NAME} has created new address.`;
                                var logCategory = "customer address";

                                let actionLog = {
                                    "SOURCE_ID": insertResults.insertId,
                                    "LOG_DATE_TIME": mm.getSystemDate(),
                                    "LOG_TEXT": ACTION_DETAILS,
                                    "CATEGORY": logCategory,
                                    "CLIENT_ID": 1,
                                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                    "supportKey": 0
                                };

                                dbm.saveLog(actionLog, systemLog);
                                var SUBSCRIBED_CHANNELS = []
                                var CHANNEL_NAME = `promotion_state_${dataUpdate.STATE_ID}_channel`;
                                var CHANNEL_NAME2 = `promotion_country_${dataUpdate.COUNTRY_ID}_channel`;
                                var CHANNEL_NAME3 = `pincode_${dataUpdate.PINCODE_ID}_channel`;
                                var data = {
                                    "CHANNEL_NAME": CHANNEL_NAME,
                                    "USER_ID": dataUpdate.CUSTOMER_ID,
                                    "TYPE": "C"
                                };
                                var data2 = {
                                    "CHANNEL_NAME": CHANNEL_NAME2,
                                    "USER_ID": dataUpdate.CUSTOMER_ID,
                                    "TYPE": "C"
                                };
                                var data3 = {
                                    "CHANNEL_NAME": CHANNEL_NAME3,
                                    "USER_ID": dataUpdate.CUSTOMER_ID,
                                    "TYPE": "C"
                                };

                                function subscribeUser(channelName, dataUpdate, SUBSCRIBED_CHANNELS) {
                                    const channelData = {
                                        CHANNEL_NAME: channelName,
                                        USER_ID: dataUpdate.CUSTOMER_ID,
                                        TYPE: "C",
                                        STATUS: true,
                                        USER_NAME: CUSTOMER_NAME,
                                        CLIENT_ID: dataUpdate.CLIENT_ID,
                                        DATE: mm.getSystemDate()
                                    };
                                    const newChannel = new channelSubscribedUsers(channelData);
                                    newChannel.save();
                                    SUBSCRIBED_CHANNELS.push(channelData);
                                }

                                channelSubscribedUsers.findOne(data).then(existingRecord => {
                                    if (!existingRecord) {
                                        subscribeUser(CHANNEL_NAME, dataUpdate, SUBSCRIBED_CHANNELS);
                                    }
                                    channelSubscribedUsers.findOne(data2).then(existingRecord2 => {
                                        if (!existingRecord2) {
                                            subscribeUser(CHANNEL_NAME2, dataUpdate, SUBSCRIBED_CHANNELS);
                                        }
                                        channelSubscribedUsers.findOne(data3).then(existingRecord3 => {
                                            if (!existingRecord3) {
                                                subscribeUser(CHANNEL_NAME3, dataUpdate, SUBSCRIBED_CHANNELS);
                                            }
                                            res.send({
                                                "code": 200,
                                                "message": "CustomerAddress information saved successfully...",
                                                "ID": insertResults.insertId,
                                                "SUBSCRIBED_CHANNELS": SUBSCRIBED_CHANNELS
                                            });
                                        }).catch(error => handleError(res, error));
                                    }).catch(error => handleError(res, error));
                                }).catch(error => handleError(res, error));

                                function handleError(res, error) {
                                    console.error(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Something went wrong during channel subscription"
                                    });
                                }
                            }
                        }
                    });
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
};

exports.updateAddressDefault = (req, res) => {
    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var ID = req.body.ID;
    var dataLog = reqDatalog(req);
    var systemDate = mm.getSystemDate()
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET IS_DEFAULT=0, CREATED_MODIFIED_DATE = '${systemDate}' where CUSTOMER_ID = ${CUSTOMER_ID} AND IS_DEFAULT = 1 `, [], supportKey, (error, results) => {
            if (error) {
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                console.log(error);
                res.send({
                    "code": 400,
                    "message": "Failed to update customerAddress information."
                });
            }
            else {
                mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET IS_DEFAULT=1, CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${ID} `, [], supportKey, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to update customerAddress information."
                        });
                    }
                    else {
                        dataLog.ADDRESS_ID = ID
                        mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                            if (insertError) {
                                console.log(insertError);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerAddress information..."
                                });
                            } else {
                                var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                var ACTION_DETAILS = `User ${NAME} has updated the default address.`;
                                var logCategory = "customer address"

                                let actionLog = {
                                    "SOURCE_ID": CUSTOMER_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                }
                                dbm.saveLog(actionLog, systemLog)
                                res.send({
                                    "code": 200,
                                    "message": "CustomerAddress information updated successfully...",
                                    "ID": results.insertId
                                });
                            }
                        });
                    }
                });
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

exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var dataLog = reqDatalog(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });


    var setDataLog = "";
    var recordDataLog = [];
    Object.keys(dataLog).forEach(key => {
        setDataLog += `${key} = ?, `;
        recordDataLog.push(dataLog[key] !== undefined ? dataLog[key] : null); // Push null if the value is undefined
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeQueryData('SELECT * FROM ' + customerAddressMaster + ' WHERE CUSTOMER_ID = ? AND IS_DEFAULT = 1', [data.CUSTOMER_ID], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customerAddress information..."
                    });
                } else {
                    if (resultsCheck.length > 0) {
                        mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET IS_DEFAULT = 0, CREATED_MODIFIED_DATE = ? WHERE ID = ?`, [systemDate, resultsCheck[0].ID], supportKey, (error, results) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to update customerAddress information."
                                });
                            } else {
                                dataLog.ADDRESS_ID = resultsCheck[0].ID
                                mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                                    if (insertError) {
                                        console.log(insertError);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save customerAddress information..."
                                        });
                                    } else {
                                        mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET ${setData} CREATED_MODIFIED_DATE = ?  WHERE ID = ?`, [...recordData, systemDate, criteria.ID], supportKey, (error, results) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to save customerAddress information..."
                                                });
                                            }
                                            else {
                                                dataLog.ADDRESS_ID = criteria.ID
                                                mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                                                    if (insertError) {
                                                        console.log(insertError);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to save customerAddress information..."
                                                        });
                                                    } else {
                                                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                                        var ACTION_DETAILS = `User ${NAME} has updated the address.`;
                                                        var logCategory = "customer address"
                                                        let actionLog = {
                                                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                        }
                                                        dbm.saveLog(actionLog, systemLog)
                                                        res.send({
                                                            "code": 200,
                                                            "message": "CustomerAddress information updated successfully...",
                                                            "ID": results.insertId
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    } else {
                        mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET ${setData} CREATED_MODIFIED_DATE = ? WHERE ID = ?`, [...recordData, systemDate, criteria.ID], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerAddress information..."
                                });
                            }
                            else {
                                var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                var ACTION_DETAILS = `User ${NAME} has updated the address`;
                                var logCategory = "customer address"
                                let actionLog = {
                                    "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                }
                                dbm.saveLog(actionLog, systemLog)
                                res.send({
                                    "code": 200,
                                    "message": "CustomerAddress information saved successfully...",
                                    "ID": results.insertId
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

//created by darshan on 25-03-2025 for if the data.is default is 1 then update old address to is default 0 if that has is default 1 and make new as default 1
exports.updateAddress = (req, res) => {
    console.log("Request received for updating address:", req.body);

    const errors = validationResult(req);
    var data = reqData(req);
    var dataLog = reqDatalog(req);
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];

    console.log("Data received from request:", data);

    // Object.keys(data).forEach(key => {
    //     if (data[key]) {
    //         setData += `${key}= ? , `;
    //         recordData.push(data[key]);
    //     }
    // });

    Object.keys(data).forEach(key => {
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });

    console.log("Set data for update:", setData);
    console.log("Record data for update:", recordData);

    if (!errors.isEmpty()) {
        console.log("Validation errors:", errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
        return;
    }

    try {
        const updateAddress = () => {
            console.log("Updating address with data:", recordData);
            // dataUpdate.STATUS = 1
            mm.executeQueryData(
                `UPDATE ${customerAddressMaster} SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${criteria.ID}`,
                recordData,
                supportKey,
                (error, results) => {
                    if (error) {
                        console.log("Error during address update:", error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to update address information."
                        });
                    } else {
                        dataLog.ADDRESS_ID = criteria.ID
                        mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                            if (insertError) {
                                console.log(insertError);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to save customerAddress information..."
                                });
                            } else {
                                var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                                var ACTION_DETAILS = `User ${NAME} has updated the address.`;
                                var logCategory = "customer address";
                                let actionLog = {
                                    "SOURCE_ID": criteria.ID,
                                    "LOG_DATE_TIME": mm.getSystemDate(),
                                    "LOG_TEXT": ACTION_DETAILS,
                                    "CATEGORY": logCategory,
                                    "CLIENT_ID": 1,
                                    "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                                    "supportKey": 0
                                };

                                console.log("Saving action log:", actionLog);
                                dbm.saveLog(actionLog, systemLog);

                                res.send({
                                    "code": 200,
                                    "message": "CustomerAddress information saved successfully...",
                                    "ID": results.insertId
                                });
                            }
                        })
                    };
                })
        };
        if (data.IS_DEFAULT && (data.IS_DEFAULT == 1 || data.IS_DEFAULT == true)) {
            console.log("IS_DEFAULT is set to 1. Updating other addresses...");

            mm.executeQueryData(
                `SELECT CUSTOMER_ID FROM ${customerAddressMaster} WHERE ID = ${criteria.ID}`,
                [],
                supportKey,
                (error, customerResults) => {
                    if (error) {
                        console.log("Error fetching customer ID:", error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to fetch customer information."
                        });
                        return;
                    }

                    if (customerResults && customerResults.length > 0) {
                        const customerId = customerResults[0].CUSTOMER_ID;
                        console.log("Customer ID found:", customerId);

                        // Update other addresses for the same customer
                        mm.executeQueryData(
                            `UPDATE ${customerAddressMaster} SET IS_DEFAULT = 0 WHERE CUSTOMER_ID = ${customerId} AND ID != ${criteria.ID}`,
                            [],
                            supportKey,
                            (updateError, updateResults) => {
                                if (updateError) {
                                    console.log("Error updating other addresses:", updateError);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(updateError), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update other addresses."
                                    });
                                    return;
                                }

                                console.log("Other addresses updated successfully. Proceeding to update current address...");
                                updateAddress();
                            }
                        );
                    } else {
                        console.log("No customer ID found. Proceeding to update current address...");
                        updateAddress();
                    }
                }
            );
        } else {
            console.log("IS_DEFAULT is not set. Directly updating address...");
            updateAddress();
        }

    } catch (error) {
        console.log("Error in try-catch block:", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
};

exports.deleteAddress = (req, res) => {
    var dataLog = reqDatalog(req);
    const CUSTOMER_ID = req.body.CUSTOMER_ID;
    const ADDRESS_ID = req.body.ADDRESS_ID;
    var supportKey = req.headers['supportkey'];

    var systemDate = mm.getSystemDate();

    try {
        mm.executeQueryData(`UPDATE ` + customerAddressMaster + ` SET STATUS=?, CREATED_MODIFIED_DATE = ? WHERE ID = ? AND CUSTOMER_ID = ?`, [0, systemDate, ADDRESS_ID, CUSTOMER_ID], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to save customerAddress information..."
                });
            }
            else {
                dataLog.ADDRESS_ID = ADDRESS_ID
                mm.executeQueryData('INSERT INTO customer_address_logs SET ?', dataLog, supportKey, (insertError, insertLogResults) => {
                    if (insertError) {
                        console.log(insertError);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(insertError), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save customerAddress information..."
                        });
                    } else {
                        var NAME = req.body.authData.data.UserData[0].NAME ? req.body.authData.data.UserData[0].NAME : req.body.authData.data.UserData[0].USER_NAME;
                        var ACTION_DETAILS = `Customer ${NAME} has deleted the address.`;
                        var logCategory = "customer address"
                        let actionLog = {
                            "SOURCE_ID": ADDRESS_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(actionLog, systemLog)
                        res.send({
                            "code": 200,
                            "message": "Customer address information deleted successfully...",
                            "ID": results.insertId
                        });
                    }
                });
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
};
