const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
var CustomerEmailMapping = "customer_email_mapping";
var viewCustomerEmailMapping = "view_" + CustomerEmailMapping;
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        EMAIL_ID: req.body.EMAIL_ID,
        PRICE_RANGE: req.body.PRICE_RANGE,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('CUSTOMER_ID').exists(),
        body('PRICE_RANGE').exists(),
        body('EMAIL_ID').exists(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewCustomerEmailMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get CustomerEmailMapping count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewCustomerEmailMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get CustomerEmailMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 3,
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
            mm.executeQueryData('INSERT INTO ' + CustomerEmailMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save customer email mapping information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has create backoffice territory mapping.`;
                    var logCategory = "CustomerEmailMapping"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)

                    return res.send({
                        code: 200,
                        message: "The customer email mapping has been created successfully."
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
            mm.executeQueryData(`UPDATE ` + CustomerEmailMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update customer email mapping information."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has made updates to the customer email mapping.`;
                    var logCategory = "CustomerEmailMapping"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    return res.send({
                        code: 200,
                        message: "information updated successfully."
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
}
// addBulk
exports.addBulkOLD = (req, res) => {

    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var data = req.body.data;
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from customer_email_mapping where CUSTOMER_ID=?`, [CUSTOMER_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`DELETE FROM customer_email_mapping where  CUSTOMER_ID = ?`, [CUSTOMER_ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                mm.executeDML('INSERT INTO customer_email_mapping (EMAIL_ID,CUSTOMER_ID,PRICE_RANGE,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?,?)', [roleDetailsItem.EMAIL_ID, CUSTOMER_ID, roleDetailsItem.PRICE_RANGE, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
                                    if (error) {
                                        console.log("error", error);
                                        inner_callback(error);
                                    } else {
                                        inner_callback(null);
                                    }
                                });
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO customer_email_mapping (EMAIL_ID,CUSTOMER_ID,PRICE_RANGE,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?,?)', [roleDetailsItem.EMAIL_ID, CUSTOMER_ID, roleDetailsItem.PRICE_RANGE, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to save customer email mapping information."
                });
            } else {
                var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped the email to customer.`;
                var logCategory = "CustomerEmailMapping"
                let actionLog = {
                    "SOURCE_ID": CUSTOMER_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }
                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                return res.send({
                    code: 200,
                    message: "Customer email mapping information saved successfully."
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


exports.addBulk = async (req, res) => { // Made the function async to use await

    var CUSTOMER_ID = req.body.CUSTOMER_ID;
    var data = req.body.data; // Array of objects like { EMAIL_ID, PRICE_RANGE, IS_ACTIVE }
    var CLIENT_ID = req.body.CLIENT_ID;
    var supportKey = req.headers['supportkey'];

    let connection; // Declare connection outside try block for finally access

    try {
        connection = mm.openConnection(); // Open database connection

        // Start a transaction (assuming mm.openConnection starts one or it's implicitly handled)
        // If mm.openConnection doesn't start a transaction, you might need mm.beginTransaction(connection);

        // 1. Delete all existing mappings for the CUSTOMER_ID
        // This ensures idempotency and replaces old mappings with new ones
        await new Promise((resolve, reject) => {
            mm.executeDML(`DELETE FROM customer_email_mapping WHERE CUSTOMER_ID = ?`, [CUSTOMER_ID], supportKey, connection, (error, results) => {
                if (error) {
                    console.error("Error deleting existing customer email mappings:", error);
                    return reject(error);
                }
                console.log(`Deleted existing mappings for CUSTOMER_ID: ${CUSTOMER_ID}. Rows affected: ${results.affectedRows}`);
                resolve();
            });
        });

        // 2. Prepare data for bulk insert
        if (data && data.length > 0) {
            const placeholders = data.map(() => '(?,?,?,?,?)').join(',');
            const values = [];
            data.forEach(item => {
                values.push(item.EMAIL_ID, CUSTOMER_ID, item.PRICE_RANGE, item.IS_ACTIVE, CLIENT_ID);
            });

            const insertSql = `INSERT INTO customer_email_mapping (EMAIL_ID, CUSTOMER_ID, PRICE_RANGE, IS_ACTIVE, CLIENT_ID) VALUES ${placeholders}`;

            // Execute the bulk insert
            await new Promise((resolve, reject) => {
                mm.executeDML(insertSql, values, supportKey, connection, (error, results) => {
                    if (error) {
                        console.error("Error inserting new customer email mappings:", error);
                        return reject(error);
                    }
                    console.log(`Inserted ${results.affectedRows} new mappings.`);
                    resolve();
                });
            });
        } else {
            console.log("No new data provided for insertion. Only existing mappings were deleted (if any).");
        }

        // Log the action
        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped the email to customer.`;
        var logCategory = "CustomerEmailMapping";
        let actionLog = {
            "SOURCE_ID": CUSTOMER_ID,
            "LOG_DATE_TIME": mm.getSystemDate(),
            "LOG_TEXT": ACTION_DETAILS,
            "CATEGORY": logCategory,
            "CLIENT_ID": 1, // Assuming CLIENT_ID is always 1 for the log or comes from req.body.CLIENT_ID
            "USER_ID": req.body.authData.data.UserData[0].USER_ID,
            "supportKey": 0
        };
        dbm.saveLog(actionLog, systemLog); // Assuming systemLog is defined elsewhere

        mm.commitConnection(connection); // Commit the transaction
        return res.send({
            code: 200,
            message: "Customer email mapping information saved successfully."
        });

    } catch (error) {
        // Rollback connection in case of any error
        if (connection) {
            mm.rollbackConnection(connection);
        }
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey); // Assuming applicationkey is defined elsewhere
        console.error("Caught an error in addBulk:", error);
        res.send({
            "code": 500,
            "message": "Something went wrong. Failed to save customer email mapping information."
        });
    }
};
