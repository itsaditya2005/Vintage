const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const servicelog = require("../../modules/serviceLog")
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');


const async = require('async');

const applicationkey = process.env.APPLICATION_KEY;

var b2bAvailabilityMapping = "b2b_availability_mapping";
var viewb2bAvailabilityMapping = "view_" + b2bAvailabilityMapping;


function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        IS_AVAILABLE: req.body.IS_AVAILABLE ? '1' : '0',
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        B2B_PRICE: req.body.B2B_PRICE ? req.body.B2B_PRICE : 0,
        B2C_PRICE: req.body.B2C_PRICE ? req.body.B2C_PRICE : 0,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST ? req.body.TECHNICIAN_COST : 0,
        VENDOR_COST: req.body.VENDOR_COST ? req.body.VENDOR_COST : 0,
        EXPRESS_COST: req.body.EXPRESS_COST ? req.body.EXPRESS_COST : 0,
        CATEGORY_NAME: req.body.CATEGORY_NAME,
        SUB_CATEGORY_NAME: req.body.SUB_CATEGORY_NAME,
        IS_EXPRESS: req.body.IS_EXPRESS ? '1' : '0',
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        SERVICE_IMAGE: req.body.SERVICE_IMAGE,
        SERVICE_TYPE: req.body.SERVICE_TYPE,
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,
        UNIT_ID: req.body.UNIT_ID,
        TAX_ID: req.body.TAX_ID,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(),
        body('SERVICE_ID').isInt().optional(),
        body('START_TIME').optional(),
        body('END_TIME').optional(),
        body('B2B_PRICE').isDecimal().optional(),
        body('B2C_PRICE').isDecimal().optional(),
        body('TECHNICIAN_COST').isDecimal().optional(),
        body('VENDOR_COST').isDecimal().optional(),
        body('EXPRESS_COST').isDecimal().optional(),
        body('CATEGORY_NAME').optional(),
        body('SUB_CATEGORY_NAME').optional(),
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('SERVICE_IMAGE').optional(),
        body('SERVICE_TYPE').optional(),
        body('PREPARATION_MINUTES').isInt().optional(),
        body('PREPARATION_HOURS').isInt().optional(),
        body('ID').optional(),
    ]
}


exports.get = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';

    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    console.log(pageIndex + " " + pageSize)
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
        console.log(start + " " + end);
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
            mm.executeQuery('select count(*) as cnt from ' + viewb2bAvailabilityMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get B2B availability mapping count.",
                    });
                }
                else {
                    console.log(results1);
                    mm.executeQuery('select * from ' + viewb2bAvailabilityMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get B2B availability mapping information."
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
    var CATEGORY_NAME = req.body.CATEGORY_NAME
    var SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID
    var DURARTION_HOUR = req.body.DURARTION_HOUR
    var DURARTION_MIN = req.body.DURARTION_MIN
    var UNIT_ID = req.body.UNIT_ID
    var SHORT_CODE = req.body.SHORT_CODE
    var MAX_QTY = req.body.MAX_QTY
    var TAX_ID = req.body.TAX_ID
    var IS_NEW = req.body.IS_NEW
    var PARENT_ID = req.body.PARENT_ID
    var IS_PARENT = req.body.IS_PARENT
    var IS_FOR_B2B = req.body.IS_FOR_B2B
    var IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY
    var ORG_ID = req.body.ORG_ID
    var QTY = req.body.QTY
    var STATUS = req.body.STATUS
    var TAX_NAME = req.body.TAX_NAME
    var UNIT_NAME = req.body.UNIT_NAME
    var TERRITORY_ID = req.body.TERRITORY_ID
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
            mm.executeQueryData('INSERT INTO ' + b2bAvailabilityMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save B2B availability mapping information..."
                    });
                }
                else {
                    console.log(req.body.authData.data.UserData[0]);
                    var systemDate = mm.getSystemDate();
                    var ACTION_DETAILS = `A new service has been created by ${req.body.authData.data.UserData[0].NAME}.`;
                    let logData2 = {
                        "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'B2BM', "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID,
                        "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME, "SUB_CATEGORY_ID": SUB_CATEGORY_ID,
                        "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                        "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR,
                        "DURATION_MIN": DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                        "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE, "MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                        "END_TIME": data.END_TIME, "IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID, "IS_PARENT": IS_PARENT,
                        "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
                        "IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE": data.HSN_CODE, "HSN_CODE_ID": data.HSN_CODE_ID, "SUPPORT_KEY": supportKey
                    };
                    dbm.saveLog(logData2, servicelog)
                    addGlobalData(results.insertId, "B2B", supportKey)
                    return res.send({
                        code: 200,
                        message: "ServiceItem information updated and logged successfully."
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
    var CATEGORY_NAME = req.body.CATEGORY_NAME
    var TERRITORY_ID = req.body.TERRITORY_ID
    var SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME
    var SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID
    var DURARTION_HOUR = req.body.DURARTION_HOUR
    var DURARTION_MIN = req.body.DURARTION_MIN
    var UNIT_ID = req.body.UNIT_ID
    var SHORT_CODE = req.body.SHORT_CODE
    var MAX_QTY = req.body.MAX_QTY
    var TAX_ID = req.body.TAX_ID
    var IS_NEW = req.body.IS_NEW
    var PARENT_ID = req.body.PARENT_ID
    var IS_PARENT = req.body.IS_PARENT
    var IS_FOR_B2B = req.body.IS_FOR_B2B
    var IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY
    var ORG_ID = req.body.ORG_ID
    var QTY = req.body.QTY
    var STATUS = req.body.STATUS
    var UNIT_NAME = req.body.UNIT_NAME
    var TAX_NAME = req.body.TAX_NAME
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
            mm.executeQueryData(`UPDATE ` + b2bAvailabilityMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update B2B availability mapping information."
                    });
                }
                else {
                    console.log(req.body.authData.data.UserData[0]);
                    var systemDate = mm.getSystemDate();
                    var ACTION_DETAILS = `The service has been updated by ${req.body.authData.data.UserData[0].NAME}`;
                    let logData2 = {
                        "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'B2BM', "USER_ID": req.body.authData.data.UserData[0].USER_ID,
                        "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID,
                        "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME, "SUB_CATEGORY_ID": SUB_CATEGORY_ID,
                        "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                        "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR,
                        "DURATION_MIN": DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                        "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE, "MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                        "END_TIME": data.END_TIME, "IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID, "IS_PARENT": IS_PARENT,
                        "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
                        "IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE": data.HSN_CODE, "HSN_CODE_ID": data.HSN_CODE_ID, "SUPPORT_KEY": supportKey
                    };
                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "b2bAvailabilityMapping", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(logData2, servicelog)
                    addGlobalData(criteria.ID, "B2B", supportKey)
                    return res.send({
                        code: 200,
                        message: "ServiceItem information updated and logged successfully."
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



exports.mapServicesCustomer = (req, res) => {
    const { CUSTOMER_ID, service_ids, CLIENT_ID } = req.body;
    const supportKey = req.headers['supportkey'];

    if (!Array.isArray(service_ids) || service_ids.length === 0) {
        return res.status(400).send({
            code: 400,
            message: "service_ids must be a non-empty array."
        });
    }

    try {
        var SERVICE_LOGS = [];
        const connection = mm.openConnection();
        async.eachSeries(service_ids, (SERVICE_ID, inner_callback) => {
            mm.executeDML(`SELECT * FROM view_service_master WHERE ID = ?`, [SERVICE_ID], supportKey, connection, (error, serviceData) => {
                if (error || !serviceData || serviceData.length === 0) {
                    console.log(`Error or no data found for SERVICE_ID ${SERVICE_ID}:`, error);
                    return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${SERVICE_ID}`));
                }

                const service = serviceData[0];

                mm.executeDML(`SELECT * FROM b2b_availability_mapping WHERE CUSTOMER_ID = ? AND SERVICE_ID = ?`, [CUSTOMER_ID, SERVICE_ID], supportKey, connection, (error, mappingData) => {
                    if (error) {
                        console.log("Error checking existing mapping:", error);
                        return inner_callback(error);
                    }

                    const systemDate = mm.getSystemDate();
                    const actionDetails = `${req.body.authData.data.UserData[0].NAME} has ${mappingData.length > 0 ? 'updated' : 'created'} service ${service.NAME}.`;
                    const logData = {
                        LOG_DATE_TIME: systemDate,
                        LOG_TEXT: actionDetails,
                        LOG_TYPE: 'B2BBL',
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        ADDED_BY: req.body.authData.data.UserData[0].NAME,
                        SERVICE_ID: SERVICE_ID,
                        CUSTOMER_ID: CUSTOMER_ID,
                        NAME: service.NAME,
                        DESCRIPTION: service.DESCRIPTION,
                        CATEGORY_NAME: service.CATEGORY_NAME,
                        SUB_CATEGORY_NAME: service.SUB_CATEGORY_NAME,
                        SUB_CATEGORY_ID: service.SUB_CATEGORY_ID,
                        B2B_PRICE: service.B2B_PRICE,
                        B2C_PRICE: service.B2C_PRICE,
                        TECHNICIAN_COST: service.TECHNICIAN_COST,
                        VENDOR_COST: service.VENDOR_COST,
                        EXPRESS_COST: service.EXPRESS_COST,
                        IS_EXPRESS: service.IS_EXPRESS,
                        SERVICE_TYPE: service.SERVICE_TYPE,
                        DURARTION_HOUR: service.DURARTION_HOUR,
                        DURARTION_MIN: service.DURARTION_MIN,
                        PREPARATION_MINUTES: service.PREPARATION_MINUTES,
                        PREPARATION_HOURS: service.PREPARATION_HOURS,
                        UNIT_ID: service.UNIT_ID,
                        UNIT_NAME: service.UNIT_NAME,
                        SHORT_CODE: service.SHORT_CODE,
                        MAX_QTY: service.MAX_QTY,
                        TAX_ID: service.TAX_ID,
                        TAX_NAME: service.TAX_NAME,
                        START_TIME: service.START_TIME,
                        END_TIME: service.END_TIME,
                        IS_NEW: service.IS_NEW,
                        PARENT_ID: service.PARENT_ID,
                        IS_PARENT: service.IS_PARENT,
                        SERVICE_IMAGE: service.SERVICE_IMAGE,
                        IS_FOR_B2B: service.IS_FOR_B2B,
                        IS_JOB_CREATED_DIRECTLY: service.IS_JOB_CREATED_DIRECTLY,
                        ORG_ID: service.ORG_ID ? service.ORG_ID : '0',  
                        QTY: service.QTY,
                        STATUS: service.STATUS,
                        HSN_CODE: service.HSN_CODE,
                        HSN_CODE_ID: service.HSN_CODE_ID,
                        SUPPORT_KEY: supportKey,
                    };
                    SERVICE_LOGS.push(logData)

                    const actionLog = {
                        SOURCE_ID: SERVICE_ID,
                        LOG_DATE_TIME: systemDate,
                        LOG_TEXT: actionDetails,
                        CATEGORY: "b2bAvailabilityMapping",
                        CLIENT_ID: CLIENT_ID,
                        USER_ID: req.body.authData.data.UserData[0].USER_ID,
                        supportKey,
                    };
                    if (mappingData.length > 0) {
                        mm.executeDML(`UPDATE b2b_availability_mapping SET START_TIME = ?, END_TIME = ?, B2B_PRICE = ?, B2C_PRICE = ?, TECHNICIAN_COST = ?, VENDOR_COST = ?, EXPRESS_COST = ?, CATEGORY_NAME = ?, SUB_CATEGORY_NAME = ?, IS_EXPRESS = ?, NAME = ?, DESCRIPTION = ?, SERVICE_IMAGE = ?, SERVICE_TYPE = ?, PREPARATION_MINUTES = ?, PREPARATION_HOURS = ?, IS_AVAILABLE=?HSN_CODE_ID=?,HSN_CODE=?,UNIT_ID = ?, TAX_ID = ? WHERE ID = ?`,
                            [service.START_TIME, service.END_TIME, service.B2B_PRICE, service.B2C_PRICE, service.TECHNICIAN_COST, service.VENDOR_COST, service.EXPRESS_COST, service.CATEGORY_NAME, service.SUB_CATEGORY_NAME, service.IS_EXPRESS, service.NAME, service.DESCRIPTION, service.SERVICE_IMAGE, service.SERVICE_TYPE, service.PREPARATION_MINUTES, service.PREPARATION_HOURS, service.STATUS,
                            service.HSN_CODE_ID, service.HSN_CODE, service.UNIT_ID, service.TAX_ID, mappingData[0].ID],
                            supportKey, connection, (error) => {
                                if (error) {
                                    console.log("Error updating mapping:", error);
                                    return inner_callback(error);
                                } else {
                                    inner_callback();
                                }
                            });
                    } else {
                        mm.executeDML(`INSERT INTO b2b_availability_mapping (CUSTOMER_ID, SERVICE_ID, IS_AVAILABLE, START_TIME, END_TIME, B2B_PRICE, B2C_PRICE, TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, CATEGORY_NAME, SUB_CATEGORY_NAME, IS_EXPRESS, NAME, DESCRIPTION, SERVICE_IMAGE, CLIENT_ID, SERVICE_TYPE, PREPARATION_MINUTES, PREPARATION_HOURS,HSN_CODE_ID,HSN_CODE,UNIT_ID,TAX_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)`,
                            [CUSTOMER_ID, SERVICE_ID, service.STATUS, service.START_TIME, service.END_TIME, service.B2B_PRICE, service.B2C_PRICE, service.TECHNICIAN_COST, service.VENDOR_COST, service.EXPRESS_COST, service.CATEGORY_NAME, service.SUB_CATEGORY_NAME, service.IS_EXPRESS, service.NAME, service.DESCRIPTION, service.SERVICE_IMAGE, CLIENT_ID, service.SERVICE_TYPE, service.PREPARATION_MINUTES, service.PREPARATION_HOURS, service.HSN_CODE_ID, service.HSN_CODE, service.UNIT_ID, service.TAX_ID],
                            supportKey, connection, (error) => {
                                if (error) {
                                    console.log("Error inserting mapping:", error);
                                    return inner_callback(error);
                                } else {
                                    inner_callback();
                                }
                            });
                    }
                });
            });
        }, (error) => {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    code: 400,
                    message: "Failed to insert/update B2B availability mapping."
                });
            } else {
                dbm.saveLog(SERVICE_LOGS, servicelog)
                mm.commitConnection(connection)
                res.send({
                    "code": 200,
                    "message": "Services mapped successfully.",
                });
            }
        });
    } catch (error) {
        console.error("Unexpected error:", error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};


exports.addBulkService = (req, res) => {
    const { CUSTOMER_ID, data, CLIENT_ID, authData } = req.body;
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();

    if (!CUSTOMER_ID) {
        return res.status(400).send({
            code: 400,
            message: "Parameter missing.",
        });
    }

    const connection = mm.openConnection();

    try {
        var SERVICE_LOGS = [];
        async.eachSeries(
            data,
            (services, callback) => {
                const serviceId = services.SERVICE_ID;
                mm.executeDML(
                    `SELECT * FROM b2b_availability_mapping WHERE CUSTOMER_ID = ? AND SERVICE_ID = ?`,
                    [CUSTOMER_ID, serviceId],
                    supportKey,
                    connection,
                    (error, results) => {
                        if (error) {
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            return callback(error);
                        }

                        const query = results.length > 0
                            ? `UPDATE b2b_availability_mapping SET IS_AVAILABLE = ?, START_TIME = ?, END_TIME = ?, B2B_PRICE = ?, B2C_PRICE = ?, TECHNICIAN_COST = ?, VENDOR_COST = ?, EXPRESS_COST = ?, IS_EXPRESS = ?, NAME = ?, DESCRIPTION = ?, SERVICE_IMAGE = ?, SERVICE_TYPE = ?, PREPARATION_MINUTES = ?, PREPARATION_HOURS = ?, CLIENT_ID = ?, CATEGORY_NAME = ?, SUB_CATEGORY_NAME = ?, HSN_CODE_ID = ?, HSN_CODE = ?, UNIT_ID = ?, TAX_ID = ? WHERE CUSTOMER_ID = ? AND SERVICE_ID = ?`
                            : `INSERT INTO b2b_availability_mapping (CUSTOMER_ID, SERVICE_ID, IS_AVAILABLE, START_TIME, END_TIME, B2B_PRICE, B2C_PRICE, TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, IS_EXPRESS, NAME, DESCRIPTION, SERVICE_IMAGE, SERVICE_TYPE, PREPARATION_MINUTES, PREPARATION_HOURS, CLIENT_ID, CATEGORY_NAME, SUB_CATEGORY_NAME,HSN_CODE_ID,HSN_CODE,UNIT_ID,TAX_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

                        const params = results.length > 0
                            ? [
                                services.IS_AVAILABLE ? 1 : 0, services.START_TIME, services.END_TIME, services.B2B_PRICE, services.B2C_PRICE, services.TECHNICIAN_COST,
                                services.VENDOR_COST, services.EXPRESS_COST, services.IS_EXPRESS ? 1 : 0, services.NAME, services.DESCRIPTION, services.SERVICE_IMAGE,
                                services.SERVICE_TYPE, services.PREPARATION_MINUTES, services.PREPARATION_HOURS, CLIENT_ID, services.CATEGORY_NAME, services.SUB_CATEGORY_NAME, services.HSN_CODE_ID, services.HSN_CODE, services.UNIT_ID, services.TAX_ID,
                                CUSTOMER_ID, serviceId
                            ]
                            : [
                                CUSTOMER_ID, services.SERVICE_ID, services.IS_AVAILABLE ? 1 : 0, services.START_TIME, services.END_TIME, services.B2B_PRICE,
                                services.B2C_PRICE, services.TECHNICIAN_COST, services.VENDOR_COST, services.EXPRESS_COST, services.IS_EXPRESS ? 1 : 0, services.NAME,
                                services.DESCRIPTION, services.SERVICE_IMAGE, services.SERVICE_TYPE, services.PREPARATION_MINUTES, services.PREPARATION_HOURS,
                                CLIENT_ID, services.CATEGORY_NAME, services.SUB_CATEGORY_NAME, services.HSN_CODE_ID, services.HSN_CODE, services.UMIT_ID, services.TAX_ID
                            ];

                        mm.executeDML(query, params, supportKey, connection, (error, resultsService) => {
                            if (error) {
                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                return callback(error);
                            }

                            const ACTION_DETAILS = `${authData.data.UserData[0].NAME} has ${results.length > 0 ? 'updated' : 'created'} service ${services.NAME}.`;
                            const logData = {
                                LOG_DATE_TIME: systemDate,
                                LOG_TEXT: ACTION_DETAILS,
                                LOG_TYPE: 'B2BBL',
                                USER_ID: authData.data.UserData[0].USER_ID,
                                ADDED_BY: authData.data.UserData[0].NAME,
                                SERVICE_ID: results.length > 0 ? serviceId : resultsService.insertId,
                                CUSTOMER_ID: CUSTOMER_ID,
                                TERRITORY_ID: services.TERRITORY_ID,
                                NAME: services.NAME,
                                DESCRIPTION: services.DESCRIPTION,
                                CATEGORY_NAME: services.CATEGORY_NAME,
                                SUB_CATEGORY_NAME: services.SUB_CATEGORY_NAME,
                                SUB_CATEGORY_ID: services.SUB_CATEGORY_ID,
                                B2B_PRICE: services.B2B_PRICE,
                                B2C_PRICE: services.B2C_PRICE,
                                TECHNICIAN_COST: services.TECHNICIAN_COST,
                                VENDOR_COST: services.VENDOR_COST,
                                EXPRESS_COST: services.EXPRESS_COST,
                                IS_EXPRESS: services.IS_EXPRESS,
                                SERVICE_TYPE: services.SERVICE_TYPE,
                                DURATION_HOUR: services.DURATION_HOUR,
                                DURATION_MIN: services.DURATION_MIN,
                                PREPARATION_MINUTES: services.PREPARATION_MINUTES,
                                PREPARATION_HOURS: services.PREPARATION_HOURS,
                                UNIT_ID: services.UNIT_ID,
                                UNIT_NAME: services.UNIT_NAME,
                                SHORT_CODE: services.SHORT_CODE,
                                MAX_QTY: services.MAX_QTY,
                                TAX_ID: services.TAX_ID,
                                TAX_NAME: services.TAX_NAME,
                                START_TIME: services.START_TIME,
                                END_TIME: services.END_TIME,
                                IS_NEW: services.IS_NEW,
                                PARENT_ID: services.PARENT_ID,
                                IS_PARENT: services.IS_PARENT,
                                SERVICE_IMAGE: services.SERVICE_IMAGE,
                                IS_FOR_B2B: services.IS_FOR_B2B,
                                IS_JOB_CREATED_DIRECTLY: services.IS_JOB_CREATED_DIRECTLY,
                                IS_AVAILABLE: services.IS_AVAILABLE,
                                ORG_ID: services.ORG_ID,
                                QTY: services.QTY,
                                STATUS: services.STATUS,
                                HSN_CODE: services.HSN_CODE,
                                HSN_CODE_ID: services.HSN_CODE_ID,
                                SUPPORT_KEY: supportKey,
                            };
                            SERVICE_LOGS.push(logData)

                            const actionLog = {
                                SOURCE_ID: results.length > 0 ? serviceId : resultsService.insertId,
                                LOG_DATE_TIME: systemDate,
                                LOG_TEXT: ACTION_DETAILS,
                                CATEGORY: "b2bAvailabilityMapping",
                                CLIENT_ID: 1,
                                USER_ID: authData.data.UserData[0].USER_ID,
                                supportKey,
                            };
                            callback();
                        });
                    }
                );
            },
            (err) => {
                if (err) {
                    console.log("Error", err);
                    mm.rollbackConnection(connection);
                    res.status(400).send({
                        code: 400,
                        message: "Failed to save vendor information.",
                    });
                } else {
                    dbm.saveLog(SERVICE_LOGS, servicelog)
                    mm.commitConnection(connection);
                    res.status(200).send({
                        code: 200,
                        message: "Vendor information updated/inserted successfully.",
                    });
                }
            }
        );
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.error(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};


exports.serviceDetails = (req, res) => {

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
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " ORDER BY CASE WHEN SM.PARENT_ID = 0 THEN SM.ID ELSE SM.PARENT_ID END,SM.PARENT_ID = 0 DESC ";
    else
        criteria = filter + " ORDER BY CASE WHEN SM.PARENT_ID = 0 THEN SM.ID ELSE SM.PARENT_ID END,SM.PARENT_ID = 0 DESC " + " LIMIT " + start + "," + end;

    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData(`select count(*) as cnt from service_master SM where 1 AND SM.IS_PARENT = 0 and SM.SERVICE_TYPE IN ('B','O')` + criteria, CUSTOMER_ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get b2bServiceAvailabilityMapping count.",
                    });
                }
                else {
                    var Query = `SELECT 
    SM.ID AS SERVICE_ID,
    SM.NAME,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, SM.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, SM.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, SM.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, SM.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, SM.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, SM.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, SM.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, SM.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(T.DESCRIPTION, SM.DESCRIPTION) AS DESCRIPTION,
    COALESCE(T.SERVICE_IMAGE, SM.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CLIENT_ID, SM.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE) AS SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES) AS PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS)AS PREPARATION_HOURS
FROM 
    service_master SM
LEFT JOIN 
    b2b_availability_mapping T 
    ON SM.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ?
WHERE 
     SM.IS_PARENT = 0 AND SM.STATUS =1 and SM.SERVICE_TYPE IN ('B','O') `
                    mm.executeQueryData(Query + criteria, [CUSTOMER_ID], supportKey, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get B2B availability mapping count.",
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results2,
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

function addGlobalData(data_Id, TYPE, supportKey) {
    try {
        console.log("\n\n\n\n IN addGlobalData");
        let tableName = '';
        TYPE == "MAIN" ? tableName = 'view_service_master' : tableName = 'view_b2b_availability_mapping';
        mm.executeQueryData(`select * from ${tableName} where ID = ?`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.error(error); // Use console.error for errors
            } else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    let logData = { ID: data_Id, CATEGORY: "Service", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/service-master", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(err => {
                            console.error("Error in add data in globalmongo:", err);
                        });
                } else {
                    console.log("no data found");
                }
            }
        });
    } catch (error) {
        console.error(error); // Use console.error for errors
    }
}

