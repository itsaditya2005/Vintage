const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const systemLog = require("../../modules/systemLog")
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const dbm = require('../../utilities/dbMongo');
const md5 = require('md5');

const applicationkey = process.env.APPLICATION_KEY;

var customerEmailMaster = "customer_email_master";
var viewcustomerEmailMaster = "view_" + customerEmailMaster;


function reqData(req) {
    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        STATUS: req.body.STATUS ? '1' : '0',
        CLOUD_ID: req.body.CLOUD_ID,
        W_CLOUD_ID: req.body.W_CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: req.body.LOGOUT_DATETIME,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        CREATED_DATE: req.body.CREATED_DATE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('CUSTOMER_DETAILS_ID').isInt(), body('EMAIL', ' parameter missing').exists(), body('MOBILE_NO', ' parameter missing').exists(), body('ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewcustomerEmailMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get customerEmailMaster count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewcustomerEmailMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get customerEmailMaster information."
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
                // code: 400,
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            // code: 500,
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
            mm.executeQueryData('INSERT INTO ' + customerEmailMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save customerEmailMaster information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "customerEmailMaster information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                // code: 500,
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
            mm.executeQueryData(`UPDATE ` + customerEmailMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update customerEmailMaster information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "customerEmailMaster information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                // code: 500,
                message: "Something went wrong."
            });
        }
    }
}

function customerData(req) {
    var data = {
        CUSTOMER_CATEGORY_ID: req.body.CUSTOMER_CATEGORY_ID,
        CUSTOMER_TYPE: req.body.CUSTOMER_TYPE,
        NAME: req.body.NAME,
        EMAIL: req.body.EMAIL,
        SALUTATION: req.body.SALUTATION,
        MOBILE_NO: req.body.MOBILE_NO,
        REGISTRATION_DATE: req.body.REGISTRATION_DATE,
        ACCOUNT_STATUS: req.body.ACCOUNT_STATUS ? '1' : '0',
        COMPANY_NAME: req.body.COMPANY_NAME,
        ALTERNATE_MOBILE_NO: req.body.ALTERNATE_MOBILE_NO,
        CURRENT_ADDRESS_ID: req.body.CURRENT_ADDRESS_ID,
        PASSWORD: req.body.PASSWORD,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO,
        CLOUD_ID: req.body.CLOUD_ID,
        DEVICE_ID: req.body.DEVICE_ID,
        LOGOUT_DATETIME: req.body.LOGOUT_DATETIME,
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        ALTCOUNTRY_CODE: req.body.ALTCOUNTRY_CODE,
        IS_SPECIAL_CATALOGUE: req.body.IS_SPECIAL_CATALOGUE ? '1' : '0',
        CUSTOMER_DETAILS_ID: req.body.CUSTOMER_DETAILS_ID,
        IS_PARENT: req.body.IS_PARENT,
        CUSTOMER_MANAGER_ID: req.body.CUSTOMER_MANAGER_ID,
        SHORT_CODE: req.body.SHORT_CODE
    }
    return data;
}

exports.createDetails = (req, res) => {
    var data = customerData(req);
    var systemDate = mm.getSystemDate();
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    data.PASSWORD = md5(data.PASSWORD);
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE EMAIL = ? OR MOBILE_NO = ?;SELECT * FROM customer_master WHERE SHORT_CODE = ?`, [data.EMAIL, data.MOBILE_NO, data.SHORT_CODE], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate customer email."
                    });
                } else {
                    if (results[0].length > 0) {
                        if (results[0][0].EMAIL === data.EMAIL && results[0][0].MOBILE_NO === data.MOBILE_NO) {
                            res.send({
                                "code": 300,
                                "message": "Email ID and mobile number already exist."
                            });
                            return;
                        } else if (results[0][0].EMAIL === data.EMAIL) {
                            res.send({
                                "code": 300,
                                "message": "Email ID already exist."
                            });
                            return;
                        } else if (results[0][0].MOBILE_NO === data.MOBILE_NO) {
                            res.send({
                                "code": 300,
                                "message": "Mobile number already exist."
                            });
                            return;
                        }
                    } else {

                        if (results[1].length > 0 && results[1][0].SHORT_CODE === data.SHORT_CODE && data.CUSTOMER_TYPE === 'B') {
                            return res.send({
                                "code": 300,
                                "message": "Short code already exist."
                            });
                        } else {
                            data.REGISTRATION_DATE = systemDate;
                            data.IS_PARENT = '0';
                            mm.executeDML(`INSERT INTO customer_master set ?`, data, supportKey, connection, (error, results1) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save customer information."
                                    });
                                } else {
                                    mm.executeDML('SELECT * FROM global_timeslots_settings ORDER BY ID DESC LIMIT 1', [], supportKey, connection, (error, resultGet) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get slot information."
                                            });
                                        } else {
                                            mm.executeDML('INSERT INTO global_time_slots_mapping (ORG_ID, MAPPING_FOR, MAPPING_ID, SLOT1_START_TIME, SLOT1_END_TIME, SLOT2_START_TIME, SLOT2_END_TIME, SLOT3_START_TIME, SLOT3_END_TIME,CLIENT_ID,CUSTOMER_DETAILS_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)', [0, "C", results1.insertId, resultGet[0].SLOT1_START_TIME, resultGet[0].SLOT1_END_TIME, resultGet[0].SLOT2_START_TIME, resultGet[0].SLOT2_END_TIME, resultGet[0].SLOT3_START_TIME, resultGet[0].SLOT3_END_TIME, 1, results1.insertId], supportKey, connection, (error, resultsglobal) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to save globalTimeSlotMapping information..."
                                                    });
                                                }
                                                else {
                                                    mm.sendDynamicEmail(1, results1.insertId, supportKey)
                                                    addGlobalData(results1.insertId, supportKey)
                                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created  new customer  ${data.NAME}.`;
                                                    var logCategory = "customer"

                                                    let actionLog = {
                                                        SOURCE_ID: results.insertId, LOG_DATE_TIME: mm.getSystemDate(), LOG_TEXT: ACTION_DETAILS, CATEGORY: logCategory, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, supportKey: "987654327654", CUSTOMER_DETAILS_ID: results1.insertId
                                                    }
                                                    dbm.saveLog(actionLog, systemLog)
                                                    const chanelData = {
                                                        CHANNEL_NAME: `customer_channel`,
                                                        USER_ID: results1.insertId,
                                                        TYPE: "C",
                                                        STATUS: true,
                                                        USER_NAME: data.NAME,
                                                        CLIENT_ID: data.CLIENT_ID,
                                                        DATE: mm.getSystemDate()
                                                    }
                                                    const chanel = new channelSubscribedUsers(chanelData);
                                                    chanel.save()
                                                    const chanelData2 = {
                                                        CHANNEL_NAME: 'system_alerts_channel',
                                                        USER_ID: results1.insertId,
                                                        TYPE: "C",
                                                        STATUS: true,
                                                        USER_NAME: data.NAME,
                                                        CLIENT_ID: data.CLIENT_ID,
                                                        DATE: mm.getSystemDate()
                                                    }
                                                    const chanel2 = new channelSubscribedUsers(chanelData2);
                                                    chanel2.save()

                                                    const chanelData3 = {
                                                        CHANNEL_NAME: `customer_${results1.insertId}_channel`,
                                                        USER_ID: results1.insertId,
                                                        TYPE: "C",
                                                        STATUS: true,
                                                        USER_NAME: data.NAME,
                                                        CLIENT_ID: 1,
                                                        DATE: mm.getSystemDate()
                                                    }
                                                    const chanel3 = new channelSubscribedUsers(chanelData3);
                                                    chanel3.save()
                                                    mm.commitConnection(connection);
                                                    res.send({
                                                        "code": 200,
                                                        "message": "Customer information saved successfully.",
                                                        // "ID": results1.insertId,
                                                        "CUSTOMER_DETAILS_ID": results1.insertId
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
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

exports.updateDetails = (req, res) => {
    const errors = validationResult(req);
    var data = customerData(req);
    console.log("req.body", req.body);

    var supportKey = req.headers['supportkey'];
    var criteria = { ID: req.body.ID };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];

    Object.keys(data).forEach(key => {
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            const connection = mm.openConnection();
            mm.executeDML(`SELECT * FROM customer_master WHERE (EMAIL = ? OR MOBILE_NO = ?) AND ID != ?;SELECT SHORT_CODE FROM customer_master WHERE SHORT_CODE = ? AND ID != ?;`, [data.EMAIL, data.MOBILE_NO, criteria.ID, data.SHORT_CODE, criteria.ID], supportKey, connection, (error, results) => {
                if (error) {
                    mm.rollbackConnection(connection)
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to validate customer email."
                    });
                } else {
                    console.log("results", results);
                    if (results[0].length > 0) {
                        if (results[0][0].EMAIL === data.EMAIL && results[0][0].MOBILE_NO === data.MOBILE_NO) {
                            res.send({
                                "code": 300,
                                "message": "Email ID and mobile number already exist."
                            });
                            return;
                        } else if (results[0][0].EMAIL === data.EMAIL) {
                            res.send({
                                "code": 300,
                                "message": "Email ID already exist."
                            });
                            return;
                        } else if (results[0][0].MOBILE_NO === data.MOBILE_NO) {
                            res.send({
                                "code": 300,
                                "message": "Mobile number already exist."
                            });
                            return;
                        }
                    } else {
                        if (results[1].length > 0 && results[1][0].SHORT_CODE === data.SHORT_CODE && data.CUSTOMER_TYPE === "B" && results[1][0].ID !== criteria.ID) {
                            return res.send({
                                "code": 300,
                                "message": "Short code already exist."
                            });
                        } else {
                            mm.executeDML(`UPDATE customer_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${criteria.ID}`, recordData, supportKey, connection, (error, results) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update customer information."
                                    });
                                } else {
                                    addGlobalData(criteria.ID, supportKey)
                                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of ${data.NAME}.`;
                                    var logCategory = "customer"

                                    let actionLog = {
                                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                    }
                                    dbm.saveLog(actionLog, systemLog)
                                    mm.commitConnection(connection);
                                    res.send({
                                        "code": 200,
                                        "message": "customer information updated successfully...",
                                    });
                                }
                            })
                        }
                    }
                }
            })
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Internal Server Error."
            });
        }
    }
};

function addGlobalData(data_Id, supportKey) {
    try {
        mm.executeQueryData(`select * from view_customer_master where ID = ?`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    // require('../global').addDatainGlobal(data_Id, "Customer", results5[0].NAME, JSON.stringify(results5[0]), "/masters/customer",0, supportKey)
                    let logData = { ID: data_Id, CATEGORY: "Customer", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/customer", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(err => {
                            console.error("Error in addDatainGlobalmongo:", err);
                        });
                } else {
                    console.log(" no data found");
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}
