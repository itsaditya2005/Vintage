const jwt = require('jsonwebtoken');
const mm = require('../utilities/globalModule');
const formidable = require('formidable');
const path = require('path');
const async = require('async');
const db = require('../utilities/dbModule');
const logger = require("../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
const fs = require('fs');
const TechnicianActionLog = require('../utilities/dbMongo');
const GlobalData = require("../modules/globalData");


// MongoDB Logging Utility
const { connectToDatabase, closeDatabaseConnection } = require('../utilities/dbMongo');
const ServicesActivityLog = require('../modules/serviceLog'); // Assuming correct imports for Mongoose models
const systemActivityLog = require('../modules/systemLog'); // Assuming correct imports for Mongoose models
const { json } = require('body-parser');
const CryptoJS = require('crypto-js');
const crypto = require('crypto');
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);

// function decrypt(encryptedText, keyHex, ivHex) {
//   const key = Buffer.from(keyHex, 'hex');
//   const iv = Buffer.from(ivHex, 'hex');
//   const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
//   let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
//   decrypted += decipher.final('utf8');
//   return decrypted;
// }



exports.requireAuthentication = function (req, res, next) {
    try {
        var apikey = req.headers['apikey'];
        var applicationkey = req.headers['applicationkey'];
        console.log("apikey...", apikey)
        console.log("applicationkey", applicationkey)
        console
        if (apikey && applicationkey) {
            // const apiKeys = decrypt(apikey.encryptedData, apikey.key, apikey.iv);
            // const applicationKeysKeys = decrypt(applicationkey.encryptedData, applicationkey.key, applicationkey.iv);

            const bytes = CryptoJS.AES.decrypt(apikey, process.env.SECRET_KEY);
            var apiKeys = bytes.toString(CryptoJS.enc.Utf8);
            const applicationKeybytes = CryptoJS.AES.decrypt(applicationkey, process.env.SECRET_KEY);
            var applicationKeysKeys = applicationKeybytes.toString(CryptoJS.enc.Utf8);
            if (apiKeys == process.env.APIKEY && applicationKeysKeys == process.env.APPLICATION_KEY) {
                next();
            } else {
                res.send({
                    "code": 300,
                    "message": "Access Denied...!"
                });
            }
        }
        else {
            res.send({
                "code": 400,
                "message": "Parameter missing"
            });
        }

    } catch (error) {
        console.log(error)
        res.send({
            "code": 400,
            "message": "Server not found..."
        });
    }
}


exports.checkTokenold = function (req, res, next) {

    try {
        //console.log('token',req.headers['token']);


        if (req.headers['token']) {
            jwt.verify(req.headers['token'], process.env.SECRET, (error, authD4333ata) => {
                console.log("checking token");
                if (error) {
                    console.log('error', error);
                    //logger.error('APIK' + apikey + ' ' + req.method + " " + req.url + 'Wrong Token.', req.headers['supportkey']);
                    res.send({
                        "code": 403,
                        "message": "Wrong Token."
                    });
                } else {
                    // console.log( "alae")
                    console.log('authD4333ata   ', authD4333ata.data.USER_ID);

                    // req.authData = authData;
                    next();
                }
            });
        }
        else {

            res.send({
                "code": 403,
                "message": "No Token Provided."
            });
        }

    } catch (error) {
        console.log(error);
    }
}

exports.checkToken = function (req, res, next) {

    try {
        //console.log('token',req.headers['token']);


        if (req.headers['token']) {
            jwt.verify(req.headers['token'], process.env.SECRET, (error, authData) => {
                console.log("checking token");
                if (error) {
                    console.log('error', error);
                    //logger.error('APIK' + apikey + ' ' + req.method + " " + req.url + 'Wrong Token.', req.headers['supportkey']);
                    res.send({
                        "code": 403,
                        "message": "Wrong Token."
                    });
                } else {
                    // console.log( "alae")
                    console.log('authD4333ata   ', authData.data.USER_ID);

                    req.body.authData = authData;
                    next();
                }
            });
        }
        else {

            res.send({
                "code": 403,
                "message": "No Token Provided."
            });
        }

    } catch (error) {
        console.log(error);
    }
}

exports.uploadFilesOld = function (req, res) {
    const fs = require('fs');
    var folderName = req.params['folderName'];
    var form = new formidable.IncomingForm();
    var pathName = path.join(__dirname, '../uploads/', folderName, '/');
    form.parse(req, function (err, fields, files) {
        console.log("Here : - ", files)


        var oldPath = files.Image.filepath;
        var newPath = path.join(__dirname, '../uploads/') + folderName + '/' + files.Image.originalFilename;
        var rawData = fs.readFileSync(oldPath)
        fs.writeFile(newPath, rawData, function (err) {
            if (err) {
                console.log(err);
                res.send({
                    "code": 400,
                    "message": "failed to upload ",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "uploaded",
                });
            }
        })
    });

}

exports.uploadFiles = function (req, res) {
    const fs = require('fs');
    var folderName = req.params['folderName'];
    var form = new formidable.IncomingForm();
    var pathName = path.join(__dirname, '../uploads/', folderName, '/');

    // Folder check
    if (!fs.existsSync(pathName)) {
        res.status(400).send({
            "code": 400,
            "message": "Folder not found"
        });
    } else {
        form.parse(req, function (err, fields, files) {
            if (err) {
                res.status(400).send({
                    "code": 400,
                    "message": "Error parsing the form"
                });
            } else {
                console.log("Here : - ", files);

                if (!files.Image) {
                    res.status(400).send({
                        "code": 400,
                        "message": "No image file uploaded"
                    });
                } else {
                    var oldPath = files.Image.filepath;
                    var newPath = path.join(__dirname, '../uploads/') + folderName + '/' + files.Image.originalFilename;
                    var rawData = fs.readFileSync(oldPath);

                    fs.writeFile(newPath, rawData, function (err) {
                        if (err) {
                            res.status(500).send({
                                "code": 500,
                                "message": "Failed to upload"
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "Uploaded successfully"
                            });
                        }
                    });
                }
            }
        });
    }
};

exports.dowloadFilesOLd = (req, res) => {
    const folder = req.params.folder;
    const filename = req.params.filename;
    // console.log("in dowload")
    const filePath = path.join(__dirname, 'uploads', folder, filename);
    // console.log("\n\n\n\n\nfilePath", filePath);
    if (fs.existsSync(filePath)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.sendFile(filePath);
    } else {
        res.status(404).json({ error: "File not found" });
    }
}

const mime = require('mime-types');

exports.downloadFiles = (req, res) => {
    const filename = req.params.filename;
    const folderName = req.params.folderName;

    // Sanitize the folder and file names.
    const safeFolderName = path.normalize(folderName);
    const safeFilename = path.normalize(filename);

    const absoluteUploadPath = path.resolve(__dirname, '../uploads');
    const filePath = path.resolve(absoluteUploadPath, safeFolderName, safeFilename);

    // Check if the requested file is within the allowed uploads directory.
    if (!filePath.startsWith(absoluteUploadPath)) {
        return res.status(400).send('Invalid file path.');
    }
    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            return res.status(404).send('File not found');
        }

        // Set appropriate headers for download
        const mimeType = mime.lookup(filename);
        res.setHeader('Content-type', mimeType || 'application/octet-stream');
        res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-type', 'application/octet-stream'); // Or the correct MIME type

        // Stream the file to the response
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (streamError) => {
            console.error('Error streaming file:', streamError);
            res.status(500).send('Internal server error');
        });

    });
}


exports.getDownloadLink = (req, res) => {
    const filename = req.params.filename;
    const folderName = req.params.folderName;

    if (!filename || !folderName) {
        return res.status(400).json({
            success: false,
            message: "Filename and folderName are required.",
        });
    }

    const downloadLink = `${process.env.FILE_URL}/${folderName}/${filename}`;

    res.status(200).json({
        success: true,
        message: "Download link generated successfully.",
        downloadLink,
    });
};




exports.actionLogsMYSQL = (TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, supportKey) => {
    try {
        mm.executeQueryData(`insert into technician_action_logs (TECHNICIAN_ID,VENDOR_ID,ORDER_ID,JOB_CARD_ID,CUSTOMER_ID,DATE_TIME,LOG_TYPE,ACTION_LOG_TYPE,ACTION_DETAILS,CLIENT_ID,USER_ID,TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME) VALUES (?,?,?,?,?,CURRENT_TIMESTAMP,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`, [TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, 1, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME], supportKey, (error, results) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Success");
            }
        });

    } catch (error) {
        console.log(error);
    }
}


//MONGO
exports.actionLogs = async (TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, DATE_TIME, supportKey) => {
    try {
        console.log("data:", TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, supportKey)
        //await connectToDatabase();
        const logEntry = new TechnicianActionLog({ TECHNICIAN_ID, VENDOR_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID, LOG_TYPE, ACTION_LOG_TYPE, ACTION_DETAILS, CLIENT_ID: 1, USER_ID, TECHNICIAN_NAME, ORDER_DATE_TIME, CART_ID, EXPECTED_DATE_TIME, ORDER_MEDIUM, ORDER_STATUS, PAYMENT_MODE, PAYMENT_STATUS, TOTAL_AMOUNT, ORDER_NUMBER, TASK_DESCRIPTION, ESTIMATED_TIME_IN_MIN, PRIORITY, JOB_CARD_STATUS, USER_NAME, DATE_TIME });
        const result = await logEntry.save();
        console.log("Log entry saved successfully:", result);

        //await closeDatabaseConnection();
    } catch (error) {
        console.log("Error in actionLogs:", error);
        //await closeDatabaseConnection();
    }
};


exports.serviceLogsMYSQL = (
    LOG_DATE_TIME, LOG_TEXT, LOG_TYPE, USER_ID, ADDED_BY, SERVICE_ID, CUSTOMER_ID, TERRITORY_ID,
    NAME, DESCRIPTION, CATEGORY_NAME, SUB_CATEGORY_NAME, SUB_CATEGORY_ID, B2B_PRICE, B2C_PRICE,
    TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, IS_EXPRESS, SERVICE_TYPE, DURATION_HOUR,
    DURATION_MIN, PREPARATION_MINUTES, PREPARATION_HOURS, UNIT_ID, SHORT_CODE, MAX_QTY,
    TAX_ID, START_TIME, END_TIME, IS_NEW, PARENT_ID, IS_PARENT, SERVICE_IMAGE,
    IS_FOR_B2B, IS_JOB_CREATED_DIRECTLY, IS_AVAILABLE, ORG_ID, QTY, STATUS, supportKey, callback
) => {
    try {
        mm.executeQueryData(
            `INSERT INTO services_activity_logs (
                LOG_DATE_TIME, LOG_TEXT, LOG_TYPE, USER_ID, ADDED_BY, SERVICE_ID, CUSTOMER_ID, 
                TERRITORY_ID, NAME, DESCRIPTION, CATEGORY_NAME, SUB_CATEGORY_NAME, SUB_CATEGORY_ID, 
                B2B_PRICE, B2C_PRICE, TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, IS_EXPRESS, 
                SERVICE_TYPE, DURATION_HOUR, DURATION_MIN, PREPARATION_MINUTES, PREPARATION_HOURS, 
                UNIT_ID, SHORT_CODE, MAX_QTY, TAX_ID, START_TIME, END_TIME, IS_NEW, PARENT_ID, 
                IS_PARENT, SERVICE_IMAGE, IS_FOR_B2B, IS_JOB_CREATED_DIRECTLY, IS_AVAILABLE, 
                ORG_ID, QTY, STATUS,CLIENT_ID
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                LOG_DATE_TIME, LOG_TEXT, LOG_TYPE, USER_ID, ADDED_BY, SERVICE_ID, CUSTOMER_ID,
                TERRITORY_ID, NAME, DESCRIPTION, CATEGORY_NAME, SUB_CATEGORY_NAME, SUB_CATEGORY_ID,
                B2B_PRICE, B2C_PRICE, TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, IS_EXPRESS,
                SERVICE_TYPE, DURATION_HOUR, DURATION_MIN, PREPARATION_MINUTES ? PREPARATION_MINUTES : null, PREPARATION_HOURS ? PREPARATION_HOURS : null,
                UNIT_ID, SHORT_CODE, MAX_QTY, TAX_ID, START_TIME, END_TIME, IS_NEW, PARENT_ID,
                IS_PARENT, SERVICE_IMAGE, IS_FOR_B2B, IS_JOB_CREATED_DIRECTLY, IS_AVAILABLE,
                ORG_ID, QTY, STATUS, 1
            ],
            supportKey,
            (error, results) => {
                if (error) {
                    console.error("Error in serviceLogs query execution:", error);
                    return callback(error, null); // Correctly calling the callback with an error
                }
                console.log("serviceLogs entry added successfully.");
                return callback(null, results); // Calling the callback with success
            }
        );
    } catch (error) {
        console.error("Error in serviceLogs try-catch block:", error);
        return callback(error, null); // Ensure callback is called on exceptions
    }
};


// General log function
async function logToDatabase(model, data) {
    try {
        //await connectToDatabase(); // Open DB connection
        const logEntry = new model(data);
        const result = await logEntry.save();
        console.log("Log entry added successfully:", result);
    } catch (error) {
        console.error("Error in logging entry:", error);
        throw error;
    } finally {
        //await closeDatabaseConnection(); // Close DB connection after operation
    }
}

// Service Logs
exports.serviceLogs = async (logData) => {
    try {
        const result = await logToDatabase(ServicesActivityLog, logData);
        console.log("result", result);
        return result;
    } catch (error) {
        console.error("Error in serviceLogs:", error);
        throw error;
    }
};

// Action System Logs
exports.actionSystemLogs = async (logData) => {
    try {
        const result = await logToDatabase(systemActivityLog, logData);
        console.log("result", result);
        return result;
    } catch (error) {
        console.error("Error in actionSystemLogs:", error);
        throw error;
    }
};


exports.addDatainGlobal = (ID, CATEGORY, TITLE, DATA, ROUTE, TERRITORY_ID, supportKey) => {
    try {
        console.log("\n\n\n\nIm in Global", ID, CATEGORY, TITLE, DATA, ROUTE, TERRITORY_ID, supportKey);

        mm.executeQueryData(`SELECT * FROM global_data WHERE SOURCE_ID = ? AND CATEGORY = ? `, [ID, CATEGORY], supportKey, (error, resultsCheck) => {
            if (error) {
                console.log(error);
            }
            else {
                if (resultsCheck.length > 0) {
                    mm.executeQueryData(`UPDATE global_data SET TITLE=?,DATA = ?,ROUTE=?,CREATED_MODIFIED_DATE = CURRENT_TIMESTAMP,TERRITORY_ID=? WHERE SOURCE_ID = ? AND CATEGORY = ? `, [TITLE, DATA, ROUTE, ID, TERRITORY_ID, CATEGORY], supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            console.log("Success");
                        }
                    });
                } else {
                    mm.executeQueryData(`insert into global_data (SOURCE_ID,CATEGORY,ROUTE,TITLE,DATA,TERRITORY_ID) VALUES (?,?,?,?,?,?);`, [ID, CATEGORY, ROUTE, TITLE, DATA, TERRITORY_ID], supportKey, (error, results12) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            console.log("Success");
                        }
                    });
                }
            }
        })
    } catch (error) {
        console.log(error);
    }
}

exports.searchGloballyMYSQL = (req, res) => {

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
    let filter = '';//req.body.filter ? req.body.filter : '';
    let searchKey = req.body.searchKey ? req.body.searchKey : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    var TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';

    var category = req.body.category ? req.body.category : '';
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    var categoryFilter = ''
    if (category != "" && category != undefined && category != null) {
        categoryFilter = ` AND CATEGORY = "${category}" `
    }
    var dataFilter = ''
    if (searchKey != "" && searchKey != undefined && searchKey != null) {
        dataFilter = ` AND DATA LIKE '%${searchKey}%' `
    }

    if (TERRITORY_ID != "" && TERRITORY_ID != undefined && TERRITORY_ID != null) {
        dataFilter += ` AND TERRITORY_ID in (${TERRITORY_ID}) `
    }
    console.log("categoryFilter", categoryFilter);
    console.log("dataFilter", dataFilter);

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData('select count(*) as cnt from view_global_data where 1 ' + countCriteria + categoryFilter + dataFilter, [], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customer count.",
                    });
                }
                else {
                    var query = `SET SESSION group_concat_max_len = 4294967290;SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('CATEGORY',k.CATEGORY,'MATCHED_RECORDS',( IFNULL((SELECT replace(REPLACE(( CONCAT('[',GROUP_CONCAT(JSON_OBJECT('ID',a.ID,'SOURCE_ID',a.SOURCE_ID,'CATEGORY',a.CATEGORY,'TITLE',a.TITLE,'DATA',a.DATA,'ROUTE',ROUTE)),']')),'"[','['),']"',']') FROM view_global_data a WHERE CATEGORY = k.CATEGORY ${dataFilter}${criteria} ),'[]') )
            )),']')),'"[','['),']"',']') AS data FROM (select DISTINCT CATEGORY from global_data) k where 1 ${filter}${categoryFilter};`;

                    mm.executeQueryData(query, [], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customer information."
                            });
                        }
                        else {
                            console.log("here ", results)
                            var json = convertStringToJson(results[1][0].data)//results[1][0].data
                            // if (json) {
                            //     json = json.replace(/\\/g, '');
                            //     json = json.replace(/\"true\"/g, true).replace(/\"false\"/g, false)
                            // }

                            console.log("here ", json)

                            res.send({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": json
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

exports.searchGloballyORG = async (req, res) => {
    try {
        let { pageIndex, pageSize, sortKey, sortValue, searchKey, category, TERRITORY_ID, TYPE } = req.body;

        pageIndex = pageIndex ? parseInt(pageIndex) : 1;
        pageSize = pageSize ? parseInt(pageSize) : 10;
        sortKey = sortKey || 'ID';
        sortValue = sortValue === 'ASC' ? 1 : -1;


        console.log("\n\n\n req body", req.body);

        let filter = {};
        if (category) filter.CATEGORY = category;
        if (searchKey) filter.DATA = { $regex: searchKey, $options: 'i' };
        if (searchKey) filter.TITLE = { $regex: searchKey, $options: 'i' };
        if (TERRITORY_ID.length > 0) filter.TERRITORY_ID = { $in: TERRITORY_ID };// ''


        console.log("FILTER", JSON.stringify(filter));


        if (TYPE === "M") {
            filter.CATEGORY = { $in: ["Category", "SubCategory", "Service"] };
        } else if (TYPE === "W") {
            let excludeCategories = ["Category", "SubCategory", "Service"];
            filter.CATEGORY = { $nin: excludeCategories };

            // If `category` is provided in the payload, explicitly include it
            if (category) {
                filter.CATEGORY = { $nin: excludeCategories, $in: [category] };
            }
        }


        const totalCount = await GlobalData.countDocuments(filter);
        let data = await GlobalData.aggregate([
            { $match: filter },
            { $sort: { [sortKey]: sortValue } },
            { $skip: (pageIndex - 1) * pageSize },
            { $limit: pageSize },
            {
                $group: {
                    _id: "$CATEGORY",
                    MATCHED_RECORDS: {
                        $push: {
                            ID: "$ID",
                            SOURCE_ID: "$SOURCE_ID",
                            CATEGORY: "$CATEGORY",
                            TITLE: "$TITLE",
                            DATA: "$DATA",  // Keep as is for now, parse later
                            ROUTE: "$ROUTE"
                        }
                    }
                }
            },
            { $project: { _id: 0, CATEGORY: "$_id", MATCHED_RECORDS: 1 } }
        ]);
        console.log("\n\n\n\n data here111", JSON.stringify(data));
        // **Manually Parse DATA in JavaScript**
        data.forEach(category => {
            category.MATCHED_RECORDS.forEach(record => {
                try {
                    record.DATA = record.DATA ? JSON.parse(record.DATA) : {};
                } catch (e) {
                    console.error("JSON Parsing Error for DATA:", record.DATA);
                    record.DATA = {}; // Default to empty object if parsing fails
                }
            });
        });
        console.log("\n\n\n\n data here", JSON.stringify(data));

        res.send({
            code: 200,
            message: "success",
            count: totalCount,
            data
        });
    } catch (error) {
        console.error(error);
        res.send({ code: 500, message: "Something went wrong." });
    }
};

//update by me
exports.searchGlobally = async (req, res) => {
    try {
        let { pageIndex, pageSize, sortKey, sortValue, searchKey, category, TERRITORY_ID, TYPE } = req.body;

        pageIndex = pageIndex ? parseInt(pageIndex) : 1;
        pageSize = pageSize ? parseInt(pageSize) : 10;
        sortKey = sortKey || 'ID';
        sortValue = sortValue === 'ASC' ? 1 : -1;

        let filter = {};

        if (category) filter.CATEGORY = category;

        // Apply searchKey on raw DATA and TITLE only
        if (searchKey) {
            filter.$or = [
                { DATA: { $regex: searchKey, $options: 'i' } },
                { TITLE: { $regex: searchKey, $options: 'i' } }
            ];
        }

        if (TERRITORY_ID && TERRITORY_ID.length > 0) {
            filter.TERRITORY_ID = { $in: TERRITORY_ID };
        }

        if (TYPE === "M") {
            filter.CATEGORY = { $in: ["Category", "SubCategory", "Service"] };
        } else if (TYPE === "W") {
            const excludeCategories = ["Category", "SubCategory", "Service"];
            filter.CATEGORY = category
                ? { $nin: excludeCategories, $in: [category] }
                : { $nin: excludeCategories };
        }

        console.log("FILTER", JSON.stringify(filter));

        const totalCount = await GlobalData.countDocuments(filter);

        const data = await GlobalData.aggregate([
            { $match: filter },
            { $sort: { [sortKey]: sortValue } },
            { $skip: (pageIndex - 1) * pageSize },
            { $limit: pageSize },
            {
                $group: {
                    _id: "$CATEGORY",
                    MATCHED_RECORDS: {
                        $push: {
                            ID: "$ID",
                            SOURCE_ID: "$SOURCE_ID",
                            CATEGORY: "$CATEGORY",
                            TITLE: "$TITLE",
                            DATA: "$DATA",
                            ROUTE: "$ROUTE"
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    CATEGORY: "$_id",
                    MATCHED_RECORDS: 1
                }
            }
        ]);

        // Parse stringified DATA fields
        data.forEach(category => {
            category.MATCHED_RECORDS.forEach(record => {
                try {
                    record.DATA = record.DATA ? JSON.parse(record.DATA) : {};
                } catch (e) {
                    console.error("JSON Parsing Error for DATA:", record.DATA);
                    record.DATA = {};
                }
            });
        });

        res.send({
            code: 200,
            message: "success",
            count: totalCount,
            data
        });

    } catch (error) {
        console.error(error);
        res.send({ code: 500, message: "Something went wrong." });
    }
};



function convertStringToJson(inputString) {
    try {
        // Step 1: Correct double escaping for JSON compatibility
        const correctedString = inputString
            .replace(/\\"/g, '"') // Fix escaped double quotes
            .replace(/\\\\/g, '\\'); // Fix escaped backslashes

        // Step 2: Parse the corrected string into JSON
        const jsonObject = JSON.parse(correctedString);

        // Step 3: Parse any nested JSON strings into objects
        jsonObject.forEach(category => {
            category.MATCHED_RECORDS.forEach(record => {
                if (typeof record.DATA === 'string') {
                    record.DATA = JSON.parse(record.DATA); // Parse nested JSON
                }
            });
        });

        return jsonObject;
    } catch (error) {
        console.error("Error parsing JSON string:", error.message);
        return null;
    }
}



exports.actionSystemLogsMYSQL = (SOURCE_ID, LOG_DATE_TIME, LOG_TEXT, CATEGORY, CLIENT_ID, USER_ID, supportKey) => {
    try {
        mm.executeQueryData(`insert into action_system_logs (SOURCE_ID, LOG_DATE_TIME, LOG_TEXT, CATEGORY, CLIENT_ID, USER_ID) VALUES (?,CURRENT_TIMESTAMP,?,?,?,?);`, [SOURCE_ID, LOG_DATE_TIME, LOG_TEXT, CATEGORY, CLIENT_ID, USER_ID], supportKey, (error, results) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("Success");
            }
        });

    } catch (error) {
        console.log(error);
    }
}

exports.globalDataForWeb = (req, res) => {
    var supportKey = req.headers['supportkey'];
    let TERRITORY_ID = req.body.TERRITORY_ID;
    let CUSTOMER_ID = req.body.CUSTOMER_ID;
    let CUSTOMER_TYPE = req.body.CUSTOMER_TYPE;
    let searchKey = req.body.searchKey
    let filterService = ""
    let filtercategory = ""
    let filterSubcategory = ""
    let filterService1 = ""
    let filtercategory1 = ""
    // let filterSubcategory1 = ""
    if (searchKey && searchKey != "" && searchKey != undefined) {
        filterService = ` AND (NAME LIKE '%${searchKey}%' OR SUB_CATEGORY_NAME LIKE '%${searchKey}%' OR CATEGORY_NAME LIKE '%${searchKey}%') `
        filtercategory = ` AND (NAME LIKE '%${searchKey}%') `
        filterSubcategory = ` AND (NAME LIKE '%${searchKey}%' OR CATEGORY_NAME LIKE '%${searchKey}%') `
        filterService1 = ` AND (ITEM_NAME LIKE '%${searchKey}%' OR BRAND_NAME LIKE '%${searchKey}%') `
        filtercategory1 = ` AND (BRAND_NAME LIKE '%${searchKey}%') `
        // filterSubcategory1 = ` AND (NAME LIKE '%${searchKey}%' OR CATEGORY_NAME LIKE '%${searchKey}%') `
    }
    try {
        if (CUSTOMER_TYPE && (CUSTOMER_ID || TERRITORY_ID)) {
            var query = '';
            var category = '';
            var subCategory = '';
            if (CUSTOMER_TYPE == 'I') {
                query = `select * from view_service_master where 1 AND STATUS = 1 ${filterService} AND ID IN(SELECT DISTINCT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${TERRITORY_ID}  AND IS_AVAILABLE=1)`;

                category = `select * from view_category_master where 1 AND STATUS = 1 ${filtercategory} AND NAME IN(SELECT DISTINCT CATEGORY_NAME FROM territory_service_non_availability_mapping where TERRITORY_ID = ${TERRITORY_ID}  AND IS_AVAILABLE=1)`;

                subCategory = `select * from view_sub_category_master where 1 AND STATUS = 1 ${filterSubcategory} AND NAME IN(SELECT DISTINCT SUB_CATEGORY_NAME FROM territory_service_non_availability_mapping where TERRITORY_ID = ${TERRITORY_ID}  AND IS_AVAILABLE=1)`;
            }
            else {
                query = `SELECT * FROM view_service_master where 1 AND STATUS = 1 ${filterService} AND ID IN(SELECT DISTINCT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = (SELECT CUSTOMER_DETAILS_ID FROM customer_master where ID = ${CUSTOMER_ID} LIMIT 1))`;

                category = `select * from view_category_master where 1 AND STATUS = 1 ${filtercategory} AND NAME IN(SELECT DISTINCT CATEGORY_NAME FROM b2b_availability_mapping where CUSTOMER_ID = (SELECT CUSTOMER_DETAILS_ID FROM customer_master where ID = ${CUSTOMER_ID} LIMIT 1))`;

                subCategory = `select * from view_sub_category_master where 1 AND STATUS = 1 ${filterSubcategory} AND NAME IN(SELECT DISTINCT SUB_CATEGORY_NAME FROM b2b_availability_mapping where CUSTOMER_ID = (SELECT CUSTOMER_DETAILS_ID FROM customer_master where ID = ${CUSTOMER_ID} LIMIT 1))`;
            }

            let query1 = `select * from view_inventory_master where 1 AND STATUS = 1 ${filterService1}`

            let category2 = `select * from view_brand_master where 1 AND STATUS = 1 ${filtercategory1}`

            // let subCategory2 = `select * from view_sub_category_master where 1 ${filterSubcategory1}`


            mm.executeQueryData(query, [], supportKey, (error, services) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get distinct services.",
                    });
                }
                else {
                    mm.executeQueryData(category, [], supportKey, (error, categories) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get distinct services.",
                            });
                        }
                        else {
                            mm.executeQueryData(subCategory, [], supportKey, (error, subcategories) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get distinct services.",
                                    });
                                } else {
                                    mm.executeQueryData(query1, [], supportKey, (error, items) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to get distinct services.",
                                            });
                                        }
                                        else {
                                            mm.executeQueryData(category2, [], supportKey, (error, itemCategories) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to get distinct services.",
                                                    });
                                                }
                                                else {
                                                    // mm.executeQueryData(subCategory2, [], supportKey, (error, itemSubcategories) => {
                                                    //     if (error) {
                                                    //         console.log(error);
                                                    //         logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    //         res.send({
                                                    //             "code": 400,
                                                    //             "message": "Failed to get distinct services.",
                                                    //         });
                                                    //     } else {
                                                    const formattedResponse = formatResponse(categories, subcategories, services, items, itemCategories);
                                                    res.send({
                                                        "code": 200,
                                                        "message": "success",
                                                        "count": formattedResponse.data.length,
                                                        "data": formattedResponse.data
                                                    });
                                                }

                                            })
                                        }
                                    })

                                }
                            });
                        }
                    });
                }
            });
            //     }
            // });
        } else {
            res.send({
                "code": 400,
                "message": "Parameter Missing."
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });

    }
};

function formatResponse(categories, subcategories, services, items, itemCategories) {
    const response = {
        data: []
    };

    console.log("itemCategories", itemCategories);


    if (categories && categories.length > 0) {
        const categoryData = {
            MATCHED_RECORDS: categories.map(cat => ({
                SOURCE_ID: cat.ID,
                CATEGORY: "Category",
                TITLE: cat.NAME,
                DATA: cat,
                ROUTE: "masters/category"
            })),
            CATEGORY: "Category"
        };
        response.data.push(categoryData);
    }

    if (subcategories && subcategories.length > 0) {
        const subCategoryData = {
            MATCHED_RECORDS: subcategories.map(subCat => ({
                SOURCE_ID: subCat.ID,
                CATEGORY: "SubCategory",
                TITLE: subCat.NAME,
                DATA: subCat,
                ROUTE: "masters/subcategory"
            })),
            CATEGORY: "SubCategory"
        };
        response.data.push(subCategoryData);
    }

    if (services && services.length > 0) {
        const serviceData = {
            MATCHED_RECORDS: services.map(service => ({
                SOURCE_ID: service.ID,
                CATEGORY: "Service",
                TITLE: service.NAME,
                DATA: service,
                ROUTE: "masters/service"
            })),
            CATEGORY: "Service"
        };
        response.data.push(serviceData);
    }

    if (itemCategories && itemCategories.length > 0) {
        const itemCategoryData = {
            MATCHED_RECORDS: itemCategories.map(cat => ({
                SOURCE_ID: cat.ID,
                CATEGORY: "ItemBrands",
                TITLE: cat.BRAND_NAME,
                DATA: cat,
                ROUTE: ""
            })),
            CATEGORY: "ItemBrands"
        };
        response.data.push(itemCategoryData);
    }

    if (items && items.length > 0) {
        const itemData = {
            MATCHED_RECORDS: items.map(item => ({
                SOURCE_ID: item.ID,
                CATEGORY: "Items",
                TITLE: item.ITEM_NAME,
                DATA: item,
                ROUTE: "inventory/item"
            })),
            CATEGORY: "Items"
        };
        response.data.push(itemData);
    }

    // if (itemSubcategories && itemSubcategories.length > 0) {
    //     const itemSubCategoryData = {
    //         MATCHED_RECORDS: itemSubcategories.map(subCat => ({
    //             SOURCE_ID: subCat.ID,
    //             CATEGORY: "Brands",
    //             TITLE: subCat.BRAND_NAME,
    //             DATA: subCat,
    //             ROUTE: "inventory/subcategory"
    //         })),
    //         CATEGORY: "ItemSubCategory"
    //     };
    //     response.data.push(itemSubCategoryData);
    // }

    return response;
}


function formatResponseOLD(categories, subcategories, services) {
    const response = {
        data: []
    };

    if (categories && categories.length > 0) {
        const categoryData = {
            MATCHED_RECORDS: categories.map(cat => ({
                SOURCE_ID: cat.ID,
                CATEGORY: "Category",
                TITLE: cat.NAME,
                DATA: cat,
                ROUTE: "masters/category"
            })),
            CATEGORY: "Category"
        };
        response.data.push(categoryData);
    }

    if (subcategories && subcategories.length > 0) {
        const subCategoryData = {
            MATCHED_RECORDS: subcategories.map(subCat => ({
                SOURCE_ID: subCat.ID,
                CATEGORY: "SubCategory",
                TITLE: subCat.NAME,
                DATA: subCat,
                ROUTE: "masters/subcategory"
            })),
            CATEGORY: "SubCategory"
        };
        response.data.push(subCategoryData);
    }

    if (services && services.length > 0) {
        const serviceData = {
            MATCHED_RECORDS: services.map(service => ({
                SOURCE_ID: service.ID,
                CATEGORY: "Service",
                TITLE: service.NAME,
                DATA: service,
                ROUTE: "masters/service"
            })),
            CATEGORY: "Service"
        };
        response.data.push(serviceData);
    }

    return response;
}

// Ideally load from environment variable
const MAP_API_KEY = process.env.MAP_API_KEY || 'AIzaSyDT0rIRA3oOkwIhszO4xoZIiYfzkTc_4WY';
const axios = require('axios');

exports.getPlaces = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const SEARCHKEY = req.body.SEARCHKEY;

    try {
        if (!SEARCHKEY) {
            return res.status(400).send({
                code: 400,
                message: "Parameter Missing: SEARCHKEY is required.",
            });
        }

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
            {
                params: {
                    input: SEARCHKEY,
                    key: MAP_API_KEY,
                    language: 'en',
                },
            }
        );
        console.log("Response: ", response);

        res.status(200).send({
            code: 200,
            message: "Success",
            data: response.data.predictions,
        });

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.error(error);

        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.getPlaceDetails = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const placeId = req.body.placeId;

    try {
        if (!placeId) {
            return res.status(400).send({
                code: 400,
                message: "Parameter Missing: placeId is required.",
            });
        }

        const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
                params: {
                    place_id: placeId,
                    key: MAP_API_KEY,
                    language: 'en',
                },
            }
        );

        const result = response.data.result;
        const { lat, lng } = result.geometry.location;
        const address = result.formatted_address;

        res.status(200).send({
            code: 200,
            message: "Success",
            data: {
                lat,
                lng,
                address,
            },
        });

    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.error(error);

        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};

exports.getDirections = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const LOCATION_LATITUDE = req.body.LOCATION_LATITUDE;
    const LOCATION_LONG = req.body.LOCATION_LONG;
    const destination = req.body.destination; // expecting { LOCATION_LATITUDE, LOCATION_LONG }

    try {
        if (
            !LOCATION_LATITUDE || !LOCATION_LONG ||
            !destination?.LOCATION_LATITUDE || !destination?.LOCATION_LONG
        ) {
            return res.status(400).send({
                code: 400,
                message: "Parameter Missing: Origin or Destination coordinates are required.",
            });
        }

        const originStr = `${LOCATION_LATITUDE},${LOCATION_LONG}`;
        const destStr = `${destination.LOCATION_LATITUDE},${destination.LOCATION_LONG}`;

        console.log("originStr:", originStr);
        console.log("destStr:", destStr);

        const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&key=${MAP_API_KEY}`;

        const response = await axios.get(url);
        const json = response.data;

        if (!json.routes || json.routes.length === 0) {
            return res.status(404).send({
                code: 404,
                message: "No route found between the provided coordinates.",
            });
        }

        const route = json.routes[0];
        const leg = route.legs[0];

        const lat = leg.end_location.lat;
        const lng = leg.end_location.lng;
        const address = leg.end_address;

        res.status(200).send({
            code: 200,
            message: "Success",
            json: json,
            data: {
                lat,
                lng,
                address,
                distance: leg.distance.text,
                duration: leg.duration.text,
            },
        });

    } catch (error) {
        logger?.error?.(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error.message || error)}`, applicationkey);
        console.error("Error in getDirections:", error.message);

        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
            error: error.message,
        });
    }
};



