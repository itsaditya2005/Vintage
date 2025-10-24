const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const md5 = require('md5');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
// const ChannelSubscribedUsers = require("../../modules/channelSubscribedUsers");
const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
const xlsx = require('xlsx')

var vendorMaster = "vendor_master";
var viewVendorMaster = "view_" + vendorMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        BUSINESS_NAME: req.body.BUSINESS_NAME,
        MOBILE_NUMBER: req.body.MOBILE_NUMBER,
        EMAIL_ID: req.body.EMAIL_ID,
        ADDRESS_LINE_1: req.body.ADDRESS_LINE_1,
        ADDRESS_LINE_2: req.body.ADDRESS_LINE_2,
        PINCODE_ID: req.body.PINCODE_ID,
        CITY_ID: req.body.CITY_ID,
        STATE_ID: req.body.STATE_ID,
        COUNTRY_ID: req.body.COUNTRY_ID,
        CONTRACT_START_DATE: req.body.CONTRACT_START_DATE,
        CONTRACT_END_DATE: req.body.CONTRACT_END_DATE,
        PAN: req.body.PAN,
        GST_NO: req.body.GST_NO,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        COUNTRY_CODE: req.body.COUNTRY_CODE,
        DISTRICT_ID: req.body.DISTRICT_ID,
        ORG_ID: req.body.ORG_ID,
        PASSWORD: req.body.PASSWORD,
        CREATED_DATE: req.body.CREATED_DATE,
        USER_ID: req.body.USER_ID,
        PINCODE: req.body.PINCODE,
        PROFILE_PHOTO: req.body.PROFILE_PHOTO
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('MOBILE_NUMBER').optional(),
        body('EMAIL_ID').optional(),
        body('PASSWORD').exists(),
        body('CITY_ID').optional(),
        body('STATE_ID').isInt().optional(),
        body('COUNTRY_ID').isInt().optional(),
        body('PAN').optional(),
        body('GST_NO').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewVendorMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get vendor count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewVendorMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get vendor information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 133,
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
            data.PASSWORD = md5(data.PASSWORD);
            mm.executeQueryData('INSERT INTO ' + vendorMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save vendor information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Vendor information saved successfully...",
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
    }
}


exports.createVendor = (req, res) => {

    var data = reqData(req);
    var ROLE_ID = req.body.ROLE_ID ? req.body.ROLE_ID : "9";

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
            const connection = mm.openConnection()
            data.PASSWORD = md5(data.PASSWORD);
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=?', data.EMAIL_ID, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save vendor information..."
                    });
                }
                else {
                    mm.executeDML('SELECT * FROM vendor_master WHERE EMAIL_ID=? OR MOBILE_NUMBER = ?', [data.EMAIL_ID, data.MOBILE_NUMBER], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save vendor information..."
                            });
                        }
                        else {
                            if (results1.length > 0 || results2.length > 0) {
                                let message = "";
                                if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID) && results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Email and mobile number already exist";
                                } else if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID)) {
                                    message = "Email already exists";
                                } else if (results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Mobile number already exists";
                                }
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": message
                                });
                            }
                            else {
                                mm.executeDML('INSERT INTO ' + vendorMaster + ' SET ?', data, supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to save vendor information..."
                                        });
                                    }
                                    else {
                                        mm.executeDML('INSERT INTO user_master (ROLE_ID,NAME, EMAIL_ID,IS_ACTIVE,VENDOR_ID,CLIENT_ID,ORG_ID,PASSWORD,MOBILE_NUMBER) VALUES(?,?,?,?,?,?,?,?,?)', [ROLE_ID, data.NAME, data.EMAIL_ID, data.STATUS, results3.insertId, data.CLIENT_ID, data.ORG_ID, data.PASSWORD, data.MOBILE_NUMBER], supportKey, connection, (error, results4) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to save vendor information..."
                                                });
                                            }
                                            else {
                                                mm.executeDML('INSERT INTO user_role_mapping (USER_ID,ROLE_ID,CLIENT_ID) VALUES(?,?,?)', [results4.insertId, ROLE_ID, data.CLIENT_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to save vendor information..."
                                                        });
                                                    }
                                                    else {
                                                        mm.executeDML('UPDATE vendor_master set  USER_ID= ? WHERE ID = ?', [results4.insertId, results3.insertId], supportKey, connection, (error, results9) => {
                                                            if (error) {
                                                                console.log(error);
                                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                mm.rollbackConnection(connection)
                                                                res.send({
                                                                    "code": 400,
                                                                    "message": "Failed to save vendor information..."
                                                                });
                                                            }
                                                            else {
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new vendor ${data.NAME}.`;

                                                                var logCategory = "V";

                                                                let actionLog = {
                                                                    "SOURCE_ID": results3.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                }
                                                                dbm.saveLog(actionLog, systemLog)
                                                                mm.commitConnection(connection)
                                                                mm.sendDynamicEmail(3, results3.insertId, supportKey)
                                                                addGlobalData(results3.insertId, supportKey)
                                                                const chanelData = {
                                                                    CHANNEL_NAME: `pincode_${data.PINCODE_ID}_channel`,
                                                                    USER_ID: results4.insertId,
                                                                    TYPE: "V",
                                                                    STATUS: true,
                                                                    USER_NAME: data.NAME,
                                                                    CLIENT_ID: data.CLIENT_ID,
                                                                    DATE: mm.getSystemDate()
                                                                }
                                                                const chanel = new channelSubscribedUsers(chanelData);
                                                                chanel.save()
                                                                const chanelData2 = {
                                                                    CHANNEL_NAME: 'system_alerts_channel',
                                                                    USER_ID: results4.insertId,
                                                                    TYPE: "V",
                                                                    STATUS: true,
                                                                    USER_NAME: data.NAME,
                                                                    CLIENT_ID: data.CLIENT_ID,
                                                                    DATE: mm.getSystemDate()
                                                                }
                                                                console.log("chanelData2", chanelData2)
                                                                const chanel2 = new channelSubscribedUsers(chanelData2);
                                                                chanel2.save()
                                                                const chanelData1 = {
                                                                    CHANNEL_NAME: 'vendor_channel',
                                                                    USER_ID: results4.insertId,
                                                                    TYPE: "V",
                                                                    STATUS: true,
                                                                    USER_NAME: data.NAME,
                                                                    CLIENT_ID: data.CLIENT_ID,
                                                                    DATE: mm.getSystemDate()
                                                                }
                                                                const chanel1 = new channelSubscribedUsers(chanelData1);
                                                                chanel1.save()
                                                                var wBparams = [{ "type": "text", "text": data.NAME }, { "type": "text", "text": data.EMAIL_ID }]
                                                                var templateName = "welcome_vendor"
                                                                var wparams = [{ "type": "body", "parameters": wBparams }]
                                                                mm.sendWAToolSMS(data.MOBILE_NUMBER, templateName, wparams, 'En', (error, resultswsms) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                    }
                                                                    else {
                                                                        console.log("Successfully send SMS", resultswsms)
                                                                    }
                                                                })
                                                                res.send({
                                                                    "code": 200,
                                                                    "message": "Vendor information saved successfully...",
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
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

function generateRandomAlphanumeric() {
    const length = Math.floor(Math.random() * (20 - 8 + 1)) + 8;
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
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
            data.PASSWORD = md5(data.PASSWORD);
            mm.executeQueryData(`UPDATE ` + vendorMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update vendor information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "Vendor information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 400,
                "message": "Something went wrong."
            });
        }
    }
}


exports.updateVendor = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var ROLE_ID = req.body.ROLE_ID ? req.body.ROLE_ID : "9";
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
            const connection = mm.openConnection()
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=? AND VENDOR_ID!=?', [data.EMAIL_ID, criteria.ID], supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection)
                    res.send({
                        "code": 400,
                        "message": "Failed to save vendor information..."
                    });
                }
                else {
                    mm.executeDML('SELECT * FROM vendor_master WHERE (EMAIL_ID=? OR MOBILE_NUMBER = ?) AND ID!=?', [data.EMAIL_ID, data.MOBILE_NUMBER, criteria.ID], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            mm.rollbackConnection(connection)
                            res.send({
                                "code": 400,
                                "message": "Failed to save vendor information..."
                            });
                        }
                        else {
                            if (results1.length > 0 || results2.length > 0) {
                                let message = "";
                                if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID) && results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Email and mobile number already exist";
                                } else if (results1.some(user => user.EMAIL_ID === data.EMAIL_ID)) {
                                    message = "Email already exists";
                                } else if (results2.some(vendor => vendor.MOBILE_NUMBER === data.MOBILE_NUMBER)) {
                                    message = "Mobile number already exists";
                                }
                                mm.commitConnection(connection)
                                res.send({
                                    "code": 200,
                                    "message": message
                                });
                            }
                            else {
                                mm.executeDML(`UPDATE ` + vendorMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        mm.rollbackConnection(connection)
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update vendor information."
                                        });
                                    }
                                    else {
                                        mm.executeDML(`UPDATE user_master SET NAME=?, EMAIL_ID=?,MOBILE_NUMBER=?, CREATED_MODIFIED_DATE = '${systemDate}' where VENDOR_ID = ${criteria.ID} `, [data.NAME, data.EMAIL_ID, data.MOBILE_NUMBER], supportKey, connection, (error, results) => {
                                            if (error) {
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                console.log(error);
                                                mm.rollbackConnection(connection)
                                                res.send({
                                                    "code": 400,
                                                    "message": "Failed to update vendor information."
                                                });
                                            }
                                            else {
                                                mm.executeDML(`UPDATE user_role_mapping SET ROLE_ID=?, CREATED_MODIFIED_DATE = '${systemDate}' where USER_ID =(SELECT ID FROM user_master WHERE VENDOR_ID = ${criteria.ID} ORDER BY ID DESC LIMIT 1)`, [ROLE_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        console.log(error);
                                                        mm.rollbackConnection(connection)
                                                        res.send({
                                                            "code": 400,
                                                            "message": "Failed to update vendor information."
                                                        });
                                                    }
                                                    else {
                                                        var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the vendor ${data.NAME}.`;
                                                        var logCategory = "Vendor";
                                                        let actionLog = {
                                                            "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                        }
                                                        dbm.saveLog(actionLog, systemLog)
                                                        addGlobalData(criteria.ID, supportKey)
                                                        mm.commitConnection(connection);
                                                        res.send({
                                                            "code": 200,
                                                            "message": "Vendor information updated successfully...",
                                                        });
                                                    }
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 400,
                "message": "Something went wrong."
            });
        }


    }

}

function addGlobalData(data_Id, supportKey) {
    try {
        mm.executeQueryData(`select NAME,EMAIL_ID,MOBILE_NUMBER,DISTRICT_NAME,PINCODE from view_vendor_master where ID = ?`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    let logData = { ID: data_Id, CATEGORY: "Vendor", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/vendor_master", TERRITORY_ID: 0 };
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

function sendWelcomeEmail(emailId, name, mobileNumber) {
    const to = emailId;
    const subject = `Welcome to PockIT – We’re Excited to Have You!`;
    const body = `
        <p>Hi ${name},</p>
        <p>Welcome to <strong>PockIT</strong>. Your account has been created successfully, and we’re thrilled to have you on board!</p>
        <p>If you have any questions or need assistance, feel free to reach out to us at any time. We look forward to working with you!</p>
        <br>
        <p>Best regards,</p>
        <p><strong>The PockIT Team</strong></p>`;
    const TEMPLATE_NAME = 'VENDOR_WELCOME_EMAIL';
    const ATTACHMENTS = '';

    mm.sendEmail(to, subject, body, TEMPLATE_NAME, ATTACHMENTS, (error, results) => {
        if (error) {
            console.error('Failed to send welcome email:', error);
        } else {
            console.log('Welcome email sent successfully:', results);
        }
    });
}


exports.importVendorExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/vendorExcel/${EXCEL_FILE_NAME}.xlsx`)
        const vendor = workbook.SheetNames[0];
        const vendorSheet = workbook.Sheets[vendor];

        const vendorExcelData = xlsx.utils.sheet_to_json(vendorSheet);
        function excelDateToJSDate(serial) {
            return new Date((serial - 25569) * 86400 * 1000);
        }
        vendorExcelData.forEach((row) => {
            ['CONTRACT_START_DATE', 'CONTRACT_END_DATE', 'CREATED_DATE']
                .forEach((field) => {
                    if (typeof row[field] === 'number') {
                        row[field] = excelDateToJSDate(row[field]);
                    }
                });
        });
        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        let LogArray = []
        async.eachSeries(vendorExcelData, function iteratorOverElems(element, inner_callback) {
            element.PASSWORD = md5(element.PASSWORD);
            mm.executeDML('SELECT * FROM user_master WHERE EMAIL_ID=?', element.EMAIL_ID, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    inner_callback(error)
                }
                else {
                    mm.executeDML('SELECT * FROM vendor_master WHERE EMAIL_ID=? OR MOBILE_NUMBER = ?', [element.EMAIL_ID, element.MOBILE_NUMBER], supportKey, connection, (error, results2) => {
                        if (error) {
                            console.log(error);
                            inner_callback(error)
                        }
                        else {
                            if (results1.length > 0 || results2.length > 0) {
                                inner_callback(null)
                            }
                            else {
                                mm.executeDML('INSERT INTO vendor_master (NAME, BUSINESS_NAME, MOBILE_NUMBER, EMAIL_ID, ADDRESS_LINE_1, ADDRESS_LINE_2, PINCODE_ID, CITY_ID, STATE_ID, COUNTRY_ID, CONTRACT_START_DATE, CONTRACT_END_DATE, PAN, GST_NO, STATUS, CLIENT_ID, COUNTRY_CODE, BACKOFFICE_ID, DISTRICT_ID, ORG_ID, PASSWORD, CREATED_DATE, USER_ID, PINCODE, PROFILE_PHOTO) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [element.NAME, element.BUSINESS_NAME, element.MOBILE_NUMBER, element.EMAIL_ID, element.ADDRESS_LINE_1, element.ADDRESS_LINE_2, element.PINCODE_ID, element.CITY_ID, element.STATE_ID, element.COUNTRY_ID, element.CONTRACT_START_DATE, element.CONTRACT_END_DATE, element.PAN, element.GST_NO, element.STATUS, "1", element.COUNTRY_CODE, element.BACKOFFICE_ID, element.DISTRICT_ID, element.ORG_ID, element.PASSWORD, element.CREATED_DATE, element.USER_ID, element.PINCODE, element.PROFILE_PHOTO], supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        inner_callback(error)
                                    }
                                    else {
                                        mm.executeDML('INSERT INTO user_master (ROLE_ID,NAME, EMAIL_ID,IS_ACTIVE,VENDOR_ID,CLIENT_ID,ORG_ID,PASSWORD,MOBILE_NUMBER) VALUES(?,?,?,?,?,?,?,?,?)', [9, element.NAME, element.EMAIL_ID, element.STATUS, results3.insertId, "1", element.ORG_ID, element.PASSWORD, element.MOBILE_NUMBER], supportKey, connection, (error, results4) => {
                                            if (error) {
                                                console.log(error);
                                                inner_callback(error)
                                            }
                                            else {
                                                mm.executeDML('INSERT INTO user_role_mapping (USER_ID,ROLE_ID,CLIENT_ID) VALUES(?,?,?)', [results4.insertId, 9, "1"], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        inner_callback(error)
                                                    }
                                                    else {
                                                        mm.executeDML('UPDATE vendor_master set  USER_ID= ? WHERE ID = ?', [results4.insertId, results3.insertId], supportKey, connection, (error, results9) => {
                                                            if (error) {
                                                                console.log(error);
                                                                inner_callback(error)
                                                            }
                                                            else {
                                                                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new vendor ${element.NAME}.`;

                                                                var logCategory = "V";

                                                                let actionLog = {
                                                                    "SOURCE_ID": results3.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                                                                }
                                                                LogArray.push(actionLog)
                                                                sendWelcomeEmail(element.EMAIL_ID, element.NAME, element.MOBILE_NUMBER);
                                                                addGlobalData(results3.insertId, supportKey)
                                                                inner_callback(null)
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        }
                    });
                }
            });

        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to save data"
                })
            } else {
                dbm.saveLog(LogArray, systemLog)
                mm.commitConnection(connection)
                res.send({
                    "code": 200,
                    "message": "Data saved successfully"
                })
            }
        });

    } catch (error) {
        console.log("Error: ", error);
        res.send({
            "code": 400,
            "message": "Internal server error "
        });
    }
}
