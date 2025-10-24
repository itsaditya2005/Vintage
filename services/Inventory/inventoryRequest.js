const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryRequest = "inventory_request_master";
var viewInventoryRequest = "view_" + inventoryRequest;
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const crypto = require('crypto');
var supportKey = "supportKey";


// HTML Templates for Email Responses
const alreadyApprovedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Already Approved</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #f4f6f9;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    }
    .card h2 {
      color: #28a745;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 20px;
    }
</style>
</head>
<body>
  <div class="card">
    <span style="font-size: 40px;">✅</span>
    <h2>Already Approved</h2>
    <p>This request has already been approved.</p>
    <p>No further action is required.</p>
  </div>
</body>
</html>`;

const alreadyRejectedHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Rejected</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #fef2f2;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      text-align: center;
    }
    .card h2 {
      color: #dc3545;
      margin-bottom: 10px;
    }
    .card p {
      color: #555;
      font-size: 14px;
      margin-bottom: 20px;
    }
</style>
</head>
<body>
  <div class="card">
    <span style="font-size: 40px;">❌</span>
    <h2>Request Rejected</h2>
    <p>This request was already rejected.</p>
    <p>No further action is required.</p>
  </div>
</body>
</html>`;

const missingFields = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Request Cannot Be Processed</title>
<style>
    body {
      margin: 0;
      font-family: Arial, sans-serif;
      background: #fff8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
    }
    .card {
      background: #fff;
      padding: 30px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 420px;
      text-align: center;
    }
    .card h2 {
      color: #ff6b35;
      margin-bottom: 10px;
    }
    .card p {
      color: #444;
      font-size: 14px;
      margin-bottom: 12px;
    }
</style>
</head>
<body>
  <div class="card">
    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
    <h2>Action Not Allowed</h2>
    <p><strong>This request cannot be processed. Please contact to support team at itsupport@pockitengineers.com</strong></p>
  </div>
</body>
</html>`;

function reqData(req) {
    var data = {
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        QUANTITY: req.body.QUANTITY,
        RATE: req.body.RATE ? req.body.RATE : 0,
        TAX_RATE: req.body.TAX_RATE ? req.body.TAX_RATE : 0,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        REQUESTED_DATE_TIME: req.body.REQUESTED_DATE_TIME,
        STATUS: req.body.STATUS ? '1' : '0',
        REMARK: req.body.REMARK,
        INVENTORY_ID: req.body.INVENTORY_ID,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}



exports.validate = function () {
    return [
        body('JOB_CARD_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('CUSTOMER_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('RATE').isDecimal().optional(),
        body('TAX_RATE').isDecimal().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('REQUESTED_DATE_TIME').optional(),
        body('STATUS').optional(),
        body('REMARK').optional(),
        body('INVENTORY_ID').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryRequest + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get inventoryRequest count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryRequest + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get inventoryRequest information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "TAB_ID": 200,
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
    data.STATUS = "AP"
    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + viewInventoryRequest + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventoryRequest information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "InventoryRequest information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + inventoryRequest + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update inventoryRequest information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "inventoryRequest information updated successfully...",
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


// HTML templates
const invalidTokenHtml = `
<!DOCTYPE html>
<html>
<head>
    <title>Invalid Request</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .error { color: #dc3545; }
    </style>
</head>
<body>
    <h1 class="error">Invalid Request</h1>
    <p>This link is invalid or has expired.</p>
</body>
</html>`;


// Token management functions
async function storeTemporaryToken(token, requestMasterId, requestData, actionType) {
    console.log(`[storeTemporaryToken] Attempting to store token: ${token} for requestMasterId: ${requestMasterId}, actionType: ${actionType}`);
    const connection = mm.openConnection();
    try {
        console.log("[storeTemporaryToken] Connection opened for storing token.");
        await new Promise((resolve, reject) => {
            console.log("[storeTemporaryToken] Executing DML to insert token into inventory_request_tokens.");
            mm.executeDML(
                `INSERT INTO inventory_request_tokens(token,requestMasterId, request_data, action_type, expires_at) VALUES (?, ?, ?, ?, ?)`,
                [token, requestMasterId, JSON.stringify(requestData), actionType, new Date(requestData.expiresAt)],
                "supportKey",
                connection,
                (error, results) => {
                    if (error) {
                        console.error("[storeTemporaryToken] Error during DML execution for token insert:", error);
                        reject(error);
                    }
                    else {
                        console.log("[storeTemporaryToken] Token DML execution successful.");
                        resolve(results);
                    }
                }
            );
        });
        mm.commitConnection(connection);
        console.log("[storeTemporaryToken] Transaction committed for token storage.");
    } catch (error) {
        console.error(`[storeTemporaryToken] Error storing temporary token for ${requestMasterId}:`, error);
        mm.rollbackConnection(connection);
        console.log("[storeTemporaryToken] Transaction rolled back due to error.");
        // logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        throw error; // Re-throw if you want calling code to handle it
    }
}

async function getAndValidateToken(token, requestMasterId, markAsUsed = false) {
    console.log(`[getAndValidateToken] Attempting to get and validate token: ${token} for requestMasterId: ${requestMasterId}`);
    const connection = mm.openConnection();
    try {
        console.log("[getAndValidateToken] Connection opened for token validation.");
        // Expire old tokens
        console.log("[getAndValidateToken] Expiring old tokens...");
        await new Promise((resolve, reject) => {
            mm.executeDML(
                `UPDATE inventory_request_tokens SET status = 'expired' WHERE expires_at < NOW() AND status = 'pending'`,
                [],
                "supportKey",
                connection,
                (error, results) => {
                    if (error) return reject(error);
                    console.log("[getAndValidateToken] Old tokens expiration DML successful.");
                    resolve(results);
                }
            );
        });

        // Check token
        console.log(`[getAndValidateToken] Querying for token: ${token}`);
        const rows = await new Promise((resolve, reject) => {
            mm.executeQueryData(
                `SELECT request_data, action_type FROM inventory_request_tokens WHERE token = ? AND status = 'pending' AND expires_at >= NOW() LIMIT 1`,
                [token],
                "supportKey",
                (error, results) => {
                    if (error) return reject(error);
                    console.log("[getAndValidateToken] Token query execution successful.");
                    resolve(results);
                },
                connection
            );
        });

        if (rows.length === 0) {
            console.log("[getAndValidateToken] Token not found, expired, or already used.");
            mm.commitConnection(connection);
            return null;
        }

        if (markAsUsed) {
            await new Promise((resolve, reject) => {
                mm.executeDML(
                    `UPDATE inventory_request_tokens SET status = 'used' WHERE token = ?`,
                    [token],
                    "supportKey",
                    connection,
                    (error, results) => {
                        if (error) return reject(error);
                        console.log("[getAndValidateToken] Token marked as 'used' successfully.");
                        resolve(results);
                    }
                );
            });
        }

        mm.commitConnection(connection);
        const requestData = rows[0].request_data;
        console.log("[getAndValidateToken] Parsed request data from token:", requestData);

        return {
            ...requestData,
            STATUS: rows[0].action_type === 'approve' ? 'A' : 'R'
        };
    } catch (error) {
        mm.rollbackConnection(connection);
        console.error("[getAndValidateToken] Error:", error);
        throw error;
    }
}


// New token processing endpoint

exports.processTokenRequest = async (req, res) => {
    console.log("[processTokenRequest] Entering processTokenRequest endpoint.");
    const token = req.query.token;
    const requestMasterId = req.query.requestMasterId;
    console.log(`[processTokenRequest] Received token: ${token}, requestMasterId: ${requestMasterId}`);

    try {
        console.log("[processTokenRequest] Calling getAndValidateToken...");
        // const requestData = await getAndValidateToken(token, requestMasterId);
        const requestData = await getAndValidateToken(token, requestMasterId, false); // don't mark as used here

        if (!requestData) {
            console.log("[processTokenRequest] Token not valid. Checking request status to send proper response...");

            const statusCheck = await checkRequestStatus(requestMasterId, supportKey, mm.openConnection());

            if (statusCheck === 'AC') {
                console.log("[processTokenRequest] Request already approved.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyApprovedHTML);
            }

            if (statusCheck === 'R') {
                console.log("[processTokenRequest] Request already rejected.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyRejectedHTML);
            }

            console.log("[processTokenRequest] Token invalid and request not completed. Sending missingFieldsHTML.");
            return res.setHeader('Content-Type', 'text/html').send(missingFields);
        }


        console.log("[processTokenRequest] Token validated successfully. Preparing manual-submit form.");

        const actionLabel = requestData.STATUS === 'A' ? 'Approve' : 'Reject';
        const actionColor = requestData.STATUS === 'A' ? '#28a745' : '#dc3545';

        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Confirm ${actionLabel} Request</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        background: #f4f6f9;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                    }
                    .card {
                        background: #fff;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
                        text-align: center;
                    }
                    .btn {
                        padding: 12px 24px;
                        background: ${actionColor};
                        color: white;
                        border: none;
                        border-radius: 5px;
                        font-size: 16px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <h2>Confirm to ${actionLabel} Request</h2>
                    <form id="requestForm" action="${process.env.API_URL}inventoryRequest/updateRequestStatusEmail?token=${token}&requestMasterId=${requestMasterId}" method="POST">
                        <input type="hidden" name="TECHNICIAN_ID" value="${requestData.TECHNICIAN_ID}">
                        <input type="hidden" name="JOB_CARD_ID" value="${requestData.JOB_CARD_ID}">
                        <input type="hidden" name="CUSTOMER_ID" value="${requestData.CUSTOMER_ID}">
                        <input type="hidden" name="REQUEST_MASTER_ID" value="${requestData.REQUEST_MASTER_ID}">
                        <input type="hidden" name="TECHNICIAN_NAME" value="${requestData.TECHNICIAN_NAME}">
                        <input type="hidden" name="JOB_CARD_NO" value="${requestData.JOB_CARD_NO}">
                        <input type="hidden" name="STATUS" value="${requestData.STATUS}">
                        <input type="hidden" name="ACTION_TAKEN_FROM_MAIL" value="1">
                        <input type="hidden" name="INVENTORY_IDS" value='${JSON.stringify(requestData.INVENTORY_IDS)}'>
                        <input type="hidden" name="IDS" value='${JSON.stringify(requestData.IDS)}'>
                        <button type="submit" class="btn">${actionLabel} Request</button>
                    </form>
                </div>
            </body>
            </html>
        `);
        console.log("[processTokenRequest] Form with button sent to client.");
    } catch (error) {
        console.error('[processTokenRequest] Error processing request token:', error);
        res.status(500).send('Internal server error');
    }
};


// Updated updateRequestStatusEmail function
exports.updateRequestStatusEmail = async (req, res) => {
    console.log("[updateRequestStatusEmail] Entering updateRequestStatusEmail endpoint.");
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const SECRET_KEY = process.env.REQUEST_SECRET_KEY;
    console.log(`[updateRequestStatusEmail] Received supportKey: ${supportKey}, SECRET_KEY: ${SECRET_KEY}`, req.body);

    let requestBody = req.body;
    let isFromEmail = false;

    // Process token-based requests
    if (req.query.token) {
        console.log("[updateRequestStatusEmail] Processing token-based request.");
        try {
            // After fixing the URL construction to use '&', req.query.token will be the clean token itself.
            // And req.query.requestMasterId will be directly available.
            const cleanToken = req.query.token;
            const requestMasterIdFromQuery = req.query.requestMasterId; // Correctly extract from query params

            console.log(`[updateRequestStatusEmail] Token found in query. cleanToken: ${cleanToken}, requestMasterIdFromQuery: ${requestMasterIdFromQuery}`);
            // const tokenData = await getAndValidateToken(cleanToken, requestMasterIdFromQuery); // Pass directly
            const tokenData = await getAndValidateToken(cleanToken, requestMasterIdFromQuery, true);
            if (!tokenData) {
                console.log("[updateRequestStatusEmail] Token is expired or already used. Checking if request already processed...");
                const statusCheck = await checkRequestStatus(requestMasterIdFromQuery, supportKey, mm.openConnection());

                if (statusCheck === 'AC') {
                    console.log("[updateRequestStatusEmail] Request already approved (from fallback).");
                    return res.setHeader('Content-Type', 'text/html').send(alreadyApprovedHTML);
                }

                if (statusCheck === 'R') {
                    console.log("[updateRequestStatusEmail] Request already rejected (from fallback).");
                    return res.setHeader('Content-Type', 'text/html').send(alreadyRejectedHTML);
                }

                console.log("[updateRequestStatusEmail] Token not usable and request not processed. Sending missingFieldsHTML.");
                return res.setHeader('Content-Type', 'text/html').send(missingFields);
            }
            // Proceed with request normally
            requestBody = tokenData;
            isFromEmail = true;

            let connection = null;
            console.log("[updateRequestStatusEmail] Checking if request is already processed...");
            const statusCheck = await checkRequestStatus(requestMasterIdFromQuery, supportKey, connection);

            if (statusCheck === 'AC') {
                console.log("[updateRequestStatusEmail] Request already approved.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyApprovedHTML);
            }

            if (statusCheck === 'R') {
                console.log("[updateRequestStatusEmail] Request already rejected.");
                return res.setHeader('Content-Type', 'text/html').send(alreadyRejectedHTML);
            }

            console.log("[updateRequestStatusEmail] Token-based request data processed:", requestBody);
        } catch (error) {
            console.error("[updateRequestStatusEmail] Error processing token:", error);
            return handleEmailErrorResponse(res, 'Invalid request token');
        }
    }
    // Process encoded payload if coming from email
    else if (req.body.payload) {
        console.log("[updateRequestStatusEmail] Processing encoded payload from email.");
        try {
            // Decode the payload
            const decoded = Buffer.from(req.body.payload, 'base64').toString('utf8');
            const { data, signature } = JSON.parse(decoded);
            console.log("[updateRequestStatusEmail] Payload decoded. Verifying signature.");

            // Verify the signature
            const hmac = crypto.createHmac('sha256', SECRET_KEY);
            hmac.update(data);
            const expectedSignature = hmac.digest('hex');

            if (signature !== expectedSignature) {
                console.log("[updateRequestStatusEmail] Invalid request signature.");
                return handleEmailErrorResponse(res, 'Invalid request signature');
            }
            console.log("[updateRequestStatusEmail] Signature verified. Parsing data and checking expiration.");

            // Parse the data and check expiration
            requestBody = JSON.parse(data);
            const now = new Date();
            const expiresAt = new Date(requestBody.expiresAt);

            if (now > expiresAt) {
                console.log("[updateRequestStatusEmail] Request has expired.");
                return handleEmailErrorResponse(res, 'This request has expired');
            }

            isFromEmail = true;
            requestBody.ACTION_TAKEN_FROM_MAIL = '1';

            console.log("[updateRequestStatusEmail] Requested from email with decoded payload:", requestBody);

        } catch (error) {
            console.error("[updateRequestStatusEmail] Error processing encoded payload:", error);
            return handleEmailErrorResponse(res, 'Invalid payload format');
        }
    } else {
        console.log("[updateRequestStatusEmail] Direct API call (not from email).");
    }

    // Parse and validate arrays
    let inventoryIDs, IDS;
    try {
        console.log("[updateRequestStatusEmail] Parsing INVENTORY_IDS and IDS fields.");
        inventoryIDs = parseArrayField(requestBody.INVENTORY_IDS, 'INVENTORY_IDS');
        IDS = parseArrayField(requestBody.IDS, 'IDS');
        console.log("[updateRequestStatusEmail] Parsed INVENTORY_IDS:", inventoryIDs);
        console.log("[updateRequestStatusEmail] Parsed IDS:", IDS);
    } catch (e) {
        console.error(`[updateRequestStatusEmail] Error parsing array fields: ${e.message}`);
        return isFromEmail ?
            handleEmailErrorResponse(res, e.message) :
            res.status(400).send({ code: 400, message: e.message });
    }

    const ACTION_TAKEN_FROM_MAIL = requestBody.ACTION_TAKEN_FROM_MAIL === '1';

    console.log("\nPROCESSING REQUEST:", {
        REQUEST_MASTER_ID: requestBody.REQUEST_MASTER_ID,
        SOURCE: isFromEmail ? 'EMAIL' : 'DIRECT_API',
        ACTION: requestBody.STATUS === 'A' ? 'APPROVE' : 'REJECT'
    });

    const {
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        STATUS,
        ORDER_ID,
        TECHNICIAN_NAME,
        JOB_CARD_NO,
        REQUEST_MASTER_ID
    } = requestBody;

    // Validate required fields
    console.log("[updateRequestStatusEmail] Validating required fields...");
    if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || IDS.length === 0 || !inventoryIDs || inventoryIDs.length === 0) {
        console.log("[updateRequestStatusEmail] Missing required fields.");
        if (ACTION_TAKEN_FROM_MAIL) {
            return res.setHeader('Content-Type', 'text/html').send(missingFields); // Assuming missingFields is defined elsewhere
        }
        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, CUSTOMER_ID, IDS, INVENTORY_IDS`
        });
    }
    console.log("[updateRequestStatusEmail] Required fields present.");

    if (!errors.isEmpty()) {
        console.log("[updateRequestStatusEmail] Validation errors:", errors);
        return res.send({ code: 422, message: errors.errors });
    }

    const connection = mm.openConnection();
    let loggarry = [];
    const systemDate = mm.getSystemDate();
    console.log("[updateRequestStatusEmail] Database connection opened. System date:", systemDate);

    try {
        // Check if request is already processed (for email requests)
        if (ACTION_TAKEN_FROM_MAIL) {
            console.log("[updateRequestStatusEmail] Checking if email request is already processed...");
            const statusCheck = await checkRequestStatus(REQUEST_MASTER_ID, supportKey, connection);
            if (statusCheck) {
                console.log(`[updateRequestStatusEmail] Request already processed with status: ${statusCheck}.`);
                mm.commitConnection(connection);
                res.setHeader('Content-Type', 'text/html');
                return res.send(statusCheck === 'AC' ? alreadyApprovedHTML : alreadyRejectedHTML); // Assuming these HTMLs are defined elsewhere
            }
            console.log("[updateRequestStatusEmail] Request not yet processed, proceeding.");
        }

        // Determine status code
        let STATUSZ;
        if (STATUS === "A") {
            STATUSZ = "AC";
        } else if (STATUS === "R") {
            STATUSZ = "R";
        } else if (STATUS === "AP") {
            STATUSZ = "AP";
        } else {
            console.log("[updateRequestStatusEmail] Invalid STATUS value provided:", STATUS);
            mm.commitConnection(connection);
            return res.send({ code: 400, message: "Invalid STATUS value." });
        }
        console.log("[updateRequestStatusEmail] Determined internal STATUSZ:", STATUSZ);

        // Update job card and inventory details
        console.log(`[updateRequestStatusEmail] Fetching job card details for ID: ${JOB_CARD_ID}`);
        const jobCard = await executeQuery(
            'SELECT * FROM view_job_card WHERE ID = ?',
            [JOB_CARD_ID],
            supportKey,
            connection
        );

        if (!jobCard || jobCard.length === 0) {
            console.log("[updateRequestStatusEmail] Job card not found.");
            mm.rollbackConnection(connection);
            return handleErrorResponse(res, isFromEmail, "Job card not found");
        }
        console.log("[updateRequestStatusEmail] Job card found:", jobCard[0]);

        console.log(`[updateRequestStatusEmail] Updating job card INVENTORY_REQUESTED status for ID: ${JOB_CARD_ID}`);
        await executeDML(
            `UPDATE job_card SET INVENTORY_REQUESTED = 1 WHERE ID = ?`,
            [JOB_CARD_ID],
            supportKey,
            connection
        );
        console.log("[updateRequestStatusEmail] Job card INVENTORY_REQUESTED status updated.");

        // Process each inventory item
        console.log("[updateRequestStatusEmail] Processing each inventory item...");
        for (const id of IDS) {
            console.log(`[updateRequestStatusEmail] Updating inventory detail for ID: ${id}`);
            await updateInventoryDetail(
                id, STATUSZ, systemDate, CUSTOMER_ID, TECHNICIAN_ID,
                JOB_CARD_ID, REQUEST_MASTER_ID, supportKey, connection
            );
            console.log(`[updateRequestStatusEmail] Inventory detail ${id} updated.`);

            if (STATUS === 'A' || STATUS === 'AP') {
                console.log(`[updateRequestStatusEmail] Processing approval for inventory item ID: ${id}`);
                await processInventoryApproval(
                    id, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID,
                    REQUEST_MASTER_ID, JOB_CARD_NO, supportKey, connection
                );
                console.log(`[updateRequestStatusEmail] Inventory item ${id} approval processed.`);
            }

            const actionDetails = `${jobCard[0].CUSTOMER_NAME} has ${getActionVerb(STATUS)} the inventory request for job ${JOB_CARD_NO}`;
            console.log(`[updateRequestStatusEmail] Logging action details for item ${id}: ${actionDetails}`);
            loggarry.push(createLogData(
                TECHNICIAN_ID, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                TECHNICIAN_NAME, jobCard[0].CUSTOMER_NAME,
                systemDate, STATUS, actionDetails
            ));
        }
        console.log("[updateRequestStatusEmail] All inventory items processed.");

        // Update master record and send notifications
        console.log("[updateRequestStatusEmail] Updating master record.");
        await updateMasterRecord(
            TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID, REQUEST_MASTER_ID,
            STATUSZ, systemDate, supportKey, connection
        );
        console.log("[updateRequestStatusEmail] Master record updated.");

        const actionMessage = `${jobCard[0].CUSTOMER_NAME} has ${getActionVerb(STATUS)} the inventory request for job ${JOB_CARD_NO}`;
        console.log("[updateRequestStatusEmail] Sending notifications to admin and technician.");

        mm.sendNotificationToAdmin(
            8,
            `**Inventory Request ${getActionStatus(STATUS)}**`,
            actionMessage,
            "", "J", "N", supportKey, "I", requestBody
        );
        console.log("[updateRequestStatusEmail] Notification sent to admin.");

        mm.sendNotificationToTechnician(
            jobCard[0].CUSTOMER_ID,
            TECHNICIAN_ID,
            `**Inventory Request ${getActionStatus(STATUS)}**`,
            actionMessage,
            "", "J", supportKey, "N", "J", jobCard
        );
        console.log("[updateRequestStatusEmail] Notification sent to technician.");

        dbm.saveLog(loggarry, technicianActionLog); // Assuming technicianActionLog is defined
        console.log("[updateRequestStatusEmail] Logs saved to technicianActionLog.");
        mm.commitConnection(connection);
        console.log("[updateRequestStatusEmail] Transaction committed for updateRequestStatusEmail.");

        if (isFromEmail) {
            console.log("[updateRequestStatusEmail] Responding with HTML for email request success.");
            res.setHeader('Content-Type', 'text/html');
            return res.send(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Request ${getActionStatus(STATUS)}</title>
                    <style>
                        body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #fef2f2;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                        }
                        .card {
                        background: #fff;
                        padding: 30px 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 400px;
                        text-align: center;
                        }
                        .card h2 {
                        color: #dc3545;
                        margin-bottom: 10px;
                        }
                        .card p {
                        color: #555;
                        font-size: 14px;
                        margin-bottom: 20px;
                        }
                    </style>
                </head>
                <body>
                    <div class="card">
                        <span style="font-size: 40px;">${STATUS === 'A' ? '✅' : '❌'}</span>
                        <h2>Request ${getActionStatus(STATUS)}</h2>
                        <p>The inventory request has been ${getActionVerb(STATUS)} successfully.</p>
                    </div>
                </body>
                </html>
            `);
        }

        console.log("[updateRequestStatusEmail] Responding with JSON for direct API call success.");
        // return res.status(200).send({ code: 200, message: "Inventory request updated." });
        res.setHeader('Content-Type', 'text/html');

        return res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Request ${STATUS === 'A' ? 'Approved' : 'Rejected'}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background: #f4f6f9;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        }
        .card {
          background: #fff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 0 12px rgba(0, 0, 0, 0.15);
          text-align: center;
        }
        .card h2 {
          color: ${STATUS === 'A' ? '#28a745' : '#dc3545'};
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Inventory Request ${STATUS === 'A' ? 'Approved' : 'Rejected'}</h2>
        <p>The inventory request for job <strong>${JOB_CARD_NO}</strong> has been successfully ${STATUS === 'A' ? 'approved' : 'rejected'}.</p>
      </div>
    </body>
    </html>
  `);


    } catch (error) {
        console.error("[updateRequestStatusEmail] Caught an unexpected error:", error);
        if (connection) {
            mm.rollbackConnection(connection);
            console.log("[updateRequestStatusEmail] Transaction rolled back due to unexpected error.");
        }

        if (isFromEmail) {
            return handleEmailErrorResponse(res, 'An error occurred processing your request');
        }
        return res.status(500).send({ code: 500, message: "An unexpected error occurred." });
    }
};

// Updated sendRequestEmail function
async function sendRequestEmail(
    TYPE,
    EMAIL_LIST,
    CUSTOMER_NAME,
    JOB_CARD_NO,
    INVENTORY_DATA = [],
    TECHNICIAN_NAME = '',
    TECHNICIAN_ID = '',
    JOB_CARD_ID = '',
    CUSTOMER_ID = '',
    REQUEST_MASTER_ID = '',
    INVENTORY_IDS = []
) {
    console.log("[sendRequestEmail] Entering sendRequestEmail function.");
    console.log(`[sendRequestEmail] Parameters: TYPE=${TYPE}, EMAIL_LIST=${EMAIL_LIST}, CUSTOMER_NAME=${CUSTOMER_NAME}, JOB_CARD_NO=${JOB_CARD_NO}, TECHNICIAN_NAME=${TECHNICIAN_NAME}, REQUEST_MASTER_ID=${REQUEST_MASTER_ID}`);

    // 1. Prepare the request data
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours expiration
    console.log("[sendRequestEmail] Token expiration set to:", expiresAt.toLocaleString());

    // Get inventory detail IDs
    let IDS = [];
    try {
        console.log(`[sendRequestEmail] Fetching inventory detail IDs for REQUEST_MASTER_ID: ${REQUEST_MASTER_ID}`);
        const detailsResults = await new Promise((resolve, reject) => {
            mm.executeQueryData(
                'SELECT ID FROM inventory_request_details WHERE REQUEST_MASTER_ID = ? AND STATUS NOT IN ("AC", "AP", "R")',
                [REQUEST_MASTER_ID],
                "supportKey",
                (error, results) => {
                    if (error) {
                        console.error("[sendRequestEmail] Error during inventory detail IDs query:", error);
                        reject(error);
                    }
                    else {
                        console.log("[sendRequestEmail] Inventory detail IDs query successful.");
                        resolve(results);
                    }
                }
            );
        });
        IDS = detailsResults.map(item => item.ID);
        console.log("[sendRequestEmail] Fetched inventory detail IDS:", IDS);
    } catch (error) {
        console.error("[sendRequestEmail] Error fetching inventory detail IDs:", error);
    }

    const requestData = {
        TECHNICIAN_ID,
        JOB_CARD_ID,
        CUSTOMER_ID,
        JOB_CARD_NO,
        REQUEST_MASTER_ID,
        TECHNICIAN_NAME,
        INVENTORY_IDS: Array.isArray(INVENTORY_IDS) ? INVENTORY_IDS : [],
        IDS: Array.isArray(IDS) ? IDS : [],
        expiresAt: expiresAt.toISOString()
    };
    console.log("[sendRequestEmail] Prepared request data for token generation:", requestData);

    // 2. Generate and store tokens
    console.log("[sendRequestEmail] Generating and storing approve/reject tokens.");
    const approveToken = crypto.randomBytes(16).toString('hex');
    const rejectToken = crypto.randomBytes(16).toString('hex');
    console.log(`[sendRequestEmail] Approve Token: ${approveToken}, Reject Token: ${rejectToken}`);


    await storeTemporaryToken(approveToken, REQUEST_MASTER_ID, requestData, 'approve');
    console.log("[sendRequestEmail] Approve token stored successfully.");
    await storeTemporaryToken(rejectToken, REQUEST_MASTER_ID, requestData, 'reject');
    console.log("[sendRequestEmail] Reject token stored successfully.");

    // 3. Generate email content
    console.log("[sendRequestEmail] Generating inventory table HTML for email.");
    const partsHTML = generateInventoryTable(INVENTORY_DATA);
    const subject = `Inventory Approval Request - ${JOB_CARD_NO}`;
    console.log("[sendRequestEmail] Email subject:", subject);

    const webApproveLink = `${process.env.API_URL}inventoryRequest/processTokenRequest?token=${approveToken}&requestMasterId=${REQUEST_MASTER_ID}`;
    const webRejectLink = `${process.env.API_URL}inventoryRequest/processTokenRequest?token=${rejectToken}&requestMasterId=${REQUEST_MASTER_ID}`;
    console.log("[sendRequestEmail] Generated Web Approve Link:", webApproveLink);
    console.log("[sendRequestEmail] Generated Web Reject Link:", webRejectLink);

    const emailBody = `
        <div style="max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #ccc; border-radius: 8px;">
            <div style="text-align: center;">
                <img src="${process.env.FILE_URL}/logo/PockIT_Logo.png" style="width: 122px; height: 35px;" alt="Logo">
                <h2>Inventory Approval Request</h2>
            </div>

            <div style="font-family: Arial, sans-serif; color: #333; font-size: 15px; line-height: 1.6;">
                <p><strong>Dear Team,</strong></p>
                <p>The technician <strong>${TECHNICIAN_NAME}</strong> has raised an inventory request for the job <strong>${JOB_CARD_NO}</strong> for customer <strong>${CUSTOMER_NAME}</strong>.</p>
                
                ${partsHTML}

                <div style="margin: 30px 0; text-align: center;">
                    <p style="text-align: left;">Please approve or reject this request:</p>
                    
                    <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 20px;">
                        <a href="${webApproveLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
                            Approve Request
                        </a> &nbsp;&nbsp;
                        <a href="${webRejectLink}" style="background-color: #f44336; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold;">
                            Reject Request
                        </a>
                    </div>

                    <div style="font-size: 12px; color: #666; background: #f9f9f9; padding: 10px; border-radius: 4px;">
                        <p><strong>Having trouble with the buttons?</strong> Copy and paste the link in browser:</p>
                        <p>Approve: ${webApproveLink}</p>
                        <p>Reject: ${webRejectLink}</p>
                    </div>
                </div>

                <p>If you need any assistance, please contact us at <strong>itsupport@pockitengineers.com</strong>.</p>
                <p><strong>Note:</strong> This request will expire on ${new Date(expiresAt).toLocaleString()}.</p>
            </div>
        </div>
    `;
    console.log("[sendRequestEmail] Email body generated.");

    // 4. Send emails
    const toEmails = EMAIL_LIST.split(',').map(email => email.trim()).filter(email => email);
    console.log("[sendRequestEmail] Sending emails to:", toEmails);
    toEmails.forEach(to => {
        mm.sendEmail(to, subject, emailBody, "", "", (error, results) => {
            if (error) {
                console.error(`[sendRequestEmail] Error sending email to ${to}:`, error);
                logger.error(`Error sending inventory request email to ${to}: ${JSON.stringify(error)}`, applicationkey);
            } else {
                console.log(`[sendRequestEmail] Email sent successfully to ${to}. Results:`, results);
                logger.info(`Inventory request email sent to ${to} for request ${REQUEST_MASTER_ID}`, applicationkey);
            }
        });
    });
    console.log("[sendRequestEmail] Email sending process initiated for all recipients.");
}

// Keep all your existing helper functions
function parseArrayField(field, fieldName) {
    console.log(`[parseArrayField] Attempting to parse field: '${fieldName}' with value:`, field);
    if (typeof field === 'string') {
        try {
            const parsed = JSON.parse(field);
            console.log(`[parseArrayField] Successfully parsed string field '${fieldName}':`, parsed);
            return parsed;
        } catch (e) {
            console.error(`[parseArrayField] Error parsing JSON string for '${fieldName}': ${e.message}`);
            throw new Error(`Invalid ${fieldName} format. Expected a JSON array string.`);
        }
    }
    const result = Array.isArray(field) ? field : [];
    console.log(`[parseArrayField] Field '${fieldName}' is already an array or defaulted to empty array:`, result);
    return result;
}

async function checkRequestStatus(requestMasterId, supportKey, connection) {
    console.log(`[checkRequestStatus] Checking status for requestMasterId: ${requestMasterId}`);
    const pendingDetails = await executeQuery(
        `SELECT COUNT(*) as pending_count 
         FROM inventory_request_details 
         WHERE REQUEST_MASTER_ID = ? 
         AND STATUS NOT IN ('AC', 'AP', 'R')`,
        [requestMasterId],
        supportKey,
        connection
    );
    console.log(`[checkRequestStatus] Pending details count for ${requestMasterId}:`, pendingDetails[0].pending_count);

    if (pendingDetails[0].pending_count === 0) {
        console.log(`[checkRequestStatus] No pending details found for ${requestMasterId}. Fetching latest status.`);
        const [latestDetail] = await executeQuery(
            `SELECT STATUS 
             FROM inventory_request_details 
             WHERE REQUEST_MASTER_ID = ? 
             ORDER BY CREATED_MODIFIED_DATE DESC LIMIT 1`,
            [requestMasterId],
            supportKey,
            connection
        );
        const status = latestDetail?.STATUS;
        console.log(`[checkRequestStatus] Latest status for ${requestMasterId}: ${status}`);
        return status;
    }
    console.log(`[checkRequestStatus] Pending details found for ${requestMasterId}. Returning null.`);
    return null;
}

async function updateInventoryDetail(id, status, systemDate, customerId, technicianId, jobCardId, requestMasterId, supportKey, connection) {
    console.log(`[updateInventoryDetail] Updating inventory detail ID: ${id} to status: ${status}`);
    const results = await executeDML(
        `UPDATE inventory_request_details 
         SET STATUS=?, CREATED_MODIFIED_DATE = ? 
         WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`,
        [status, systemDate, id, customerId, technicianId, jobCardId, requestMasterId],
        supportKey,
        connection
    );
    console.log(`[updateInventoryDetail] Inventory detail ID: ${id} updated. DML Results:`, results);
    return results;
}

async function processInventoryApproval(id, customerId, technicianId, jobCardId, requestMasterId, jobCardNo, supportKey, connection) {
    console.log(`[processInventoryApproval] Processing inventory approval for detail ID: ${id}, Job Card No: ${jobCardNo}`);
    console.log(`[processInventoryApproval] Fetching inventory detail for ID: ${id}`);
    const [detail] = await executeQuery(
        `SELECT * FROM inventory_request_details 
         WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`,
        [id, customerId, technicianId, jobCardId, requestMasterId],
        supportKey,
        connection
    );

    if (!detail) {
        console.error(`[processInventoryApproval] Inventory detail not found for ID: ${id}. Throwing error.`);
        throw new Error(`Inventory detail not found for ID: ${id}`);
    }
    console.log("[processInventoryApproval] Inventory detail found:", detail);

    console.log(`[processInventoryApproval] Updating inventory warehouse stock for item ID: ${detail.INVENTORY_ID}, Warehouse ID: ${detail.WAREHOUSE_ID}`);
    const stockUpdateResults = await executeDML(
        `UPDATE inventory_warehouse_stock_management 
         SET CURRENT_STOCK=CURRENT_STOCK-? 
         WHERE ITEM_ID=? AND WAREHOUSE_ID=?`,
        [detail.QUANTITY, detail.INVENTORY_ID, detail.WAREHOUSE_ID],
        supportKey,
        connection
    );
    console.log("[processInventoryApproval] Inventory warehouse stock updated. Results:", stockUpdateResults);

    const actionLog = `${jobCardNo} inventory request approved`;
    const transactionData = [
        [jobCardNo, mm.getSystemDate(), "D", detail.INVENTORY_TRACKING_TYPE, 0, technicianId, 0, 0, 0, 0, "J",
            detail.BATCH_NO, detail.SERIAL_NO, detail.INVENTORY_ID, 0, detail.QUANTITY, actionLog, 1,
            detail.ACTUAL_UNIT_ID, detail.ACTUAL_UNIT_NAME, detail.IS_VARIANT, detail.PARENT_ID, detail.QUANTITY_PER_UNIT],
        [jobCardNo, mm.getSystemDate(), "C", detail.INVENTORY_TRACKING_TYPE, 0, 0, 0, 0, 0, jobCardId, "J",
            detail.BATCH_NO, detail.SERIAL_NO, detail.INVENTORY_ID, detail.QUANTITY, 0, actionLog, 1,
            detail.ACTUAL_UNIT_ID, detail.ACTUAL_UNIT_NAME, detail.IS_VARIANT, detail.PARENT_ID, detail.QUANTITY_PER_UNIT]
    ];
    console.log("[processInventoryApproval] Prepared inventory account transaction data.");

    const transactionInsertResults = await executeDML(
        `INSERT INTO inventory_account_transaction 
         (TRANSACTION_ID, TRANSACTION_DATE, TRANSACTION_TYPE, INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, 
          TECHNICIAN_ID, ADJUSTMENT_ID, MOVEMENT_ID, INWARD_ID, JOB_CARD_ID, GATEWAY_TYPE, 
          BATCH_NO, SERIAL_NO, ITEM_ID, IN_QTY, OUT_QTY, REMARKS, CLIENT_ID, ACTUAL_UNIT_ID, 
          ACTUAL_UNIT_NAME, IS_VARIANT, PARENT_ID, QUANTITY_PER_UNIT) 
         VALUES ?`,
        [transactionData],
        supportKey,
        connection
    );
    console.log("[processInventoryApproval] Inventory account transaction inserted. Results:", transactionInsertResults);
    return transactionInsertResults;
}

async function updateMasterRecord(
    technicianId,
    customerId,
    jobCardId,
    requestMasterId,
    status,
    systemDate,
    supportKey,
    connection
) {
    console.log(`[updateMasterRecord] Updating master record for REQUEST_MASTER_ID: ${requestMasterId}, STATUS: ${status}`);
    // First check if there's already an approved master record
    console.log("[updateMasterRecord] Checking for existing approved master record.");
    const existingMaster = await executeQuery(
        `SELECT * FROM inventory_request_master 
         WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ? AND STATUS = 'AC'`,
        [jobCardId, customerId, technicianId],
        supportKey,
        connection
    );

    if (existingMaster && existingMaster.length > 0) {
        console.log("[updateMasterRecord] Existing approved master record found. No update needed.");
        return;
    }
    console.log("[updateMasterRecord] No existing approved master record found.");

    // Update the master record
    const results = await executeDML(
        `UPDATE inventory_request_master 
         SET STATUS = ?, CREATED_MODIFIED_DATE = ? 
         WHERE ID = ? AND TECHNICIAN_ID = ? AND CUSTOMER_ID = ? AND JOB_CARD_ID = ?`,
        [status, systemDate, requestMasterId, technicianId, customerId, jobCardId],
        supportKey,
        connection
    );
    console.log(`[updateMasterRecord] Master record for ${requestMasterId} updated. DML Results:`, results);
    return results;
}

function createLogData(technicianId, orderId, jobCardId, customerId, technicianName, customerName, dateTime, status, actionDetails) {
    const logData = {
        TECHNICIAN_ID: technicianId,
        ORDER_ID: orderId,
        JOB_CARD_ID: jobCardId,
        CUSTOMER_ID: customerId,
        LOG_TYPE: 'Inventory',
        ACTION_LOG_TYPE: 'User',
        ACTION_DETAILS: actionDetails,
        TECHNICIAN_NAME: technicianName,
        ORDER_STATUS: `Inventory request ${getActionStatus(status)}`,
        JOB_CARD_STATUS: `Inventory request ${getActionStatus(status)}`,
        USER_NAME: customerName,
        DATE_TIME: dateTime,
        supportKey: 0
    };
    console.log("[createLogData] Created log data:", logData);
    return logData;
}

function getActionVerb(status) {
    const verb = status === 'A' ? 'approved' : status === 'R' ? 'rejected' : 'auto-approved';
    console.log(`[getActionVerb] Status: ${status}, Verb: ${verb}`);
    return verb;
}

function getActionStatus(status) {
    const actionStatus = status === 'A' ? 'approved' : status === 'R' ? 'rejected' : 'auto-approved';
    console.log(`[getActionStatus] Status: ${status}, Action Status: ${actionStatus}`);
    return actionStatus;
}

function handleEmailErrorResponse(res, message) {
    console.error(`[handleEmailErrorResponse] Sending email error response: ${message}`);
    res.setHeader('Content-Type', 'text/html');
    return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Request Error</title>
            <style>/* Your error styles */</style>
        </head>
        <body>
            <div class="card">
                <span style="font-size: 40px;">⚠️</span>
                <h2>Action Failed</h2>
                <p>${message}</p>
                <p>Please contact support if you need assistance.</p>
            </div>
        </body>
        </html>
    `);
}

// Promise-based wrappers for your database functions
function executeQuery(query, params, supportKey, connection) {
    console.log(`[executeQuery] Executing query: '${query}' with params:`, params);
    return new Promise((resolve, reject) => {
        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                console.error(`[executeQuery] Error executing query: '${query}'`, error);
                reject(error);
            }
            else {
                console.log(`[executeQuery] Query successful for: '${query}'. Results count: ${results ? results.length : 0}`);
                resolve(results);
            }
        }, connection);
    });
}

function executeDML(query, params, supportKey, connection) {
    console.log(`[executeDML] Executing DML: '${query}' with params:`, params);
    return new Promise((resolve, reject) => {
        mm.executeDML(query, params, supportKey, connection, (error, results) => {
            if (error) {
                console.error(`[executeDML] Error executing DML: '${query}'`, error);
                reject(error);
            }
            else {
                console.log(`[executeDML] DML successful for: '${query}'. Results:`, results);
                resolve(results);
            }
        });
    });
}


function handleErrorResponse(res, isFromEmail, message) {
    console.error(`[handleErrorResponse] Handling error response. isFromEmail: ${isFromEmail}, message: ${message}`);
    if (isFromEmail) {
        res.setHeader('Content-Type', 'text/html');
        return res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Request Error</title>
                <style>
                    body {
                        margin: 0;
                        font-family: Arial, sans-serif;
                        background: #fff8f0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        height: 100vh;
                    }
                    .card {
                        background: #fff;
                        padding: 30px 20px;
                        border-radius: 12px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                        max-width: 420px;
                        text-align: center;
                    }
                    .card h2 {
                        color: #ff6b35;
                        margin-bottom: 10px;
                    }
                    .card p {
                        color: #444;
                        font-size: 14px;
                        margin-bottom: 12px;
                    }
                </style>
            </head>
            <body>
                <div class="card">
                    <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
                    <h2>Processing Error</h2>
                    <p><strong>${message}</strong></p>
                    <p>Please contact support if you need assistance.</p>
                </div>
            </body>
            </html>
        `);
    } else {
        return res.status(400).send({
            code: 400,
            message: message
        });
    }
}

function generateInventoryTable(inventoryData) {
    let totalAmount = 0;
    const rows = inventoryData.map(item => {
        let Rate = parseFloat(item.RATE).toFixed(2)
        let amount = Rate * item.QUANTITY;
        totalAmount += amount;
        return `
            <tr>
                <td>${item.INVENTORY_NAME}</td>
                <td style="text-align: right;">${Rate}</td>
                <td style="text-align: center;">${item.QUANTITY}</td>
                <td style="text-align: right;">${amount.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

    return `
        <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <thead style="background-color: #f2f2f2;">
                <tr>
                    <th>Part Name</th>
                    <th>Rate ($)</th>
                    <th>Quantity</th>
                    <th>Amount ($)</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
                <tr style="font-weight: bold;">
                    <td colspan="3" style="text-align: right;">Total</td>
                    <td style="text-align: right;">${totalAmount.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
    `;
}



exports.addInventory = (req, res) => {
    var INVENTORY_DATA = req.body.INVENTORY_DATA;
    var { TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, STATUS, ORDER_ID, TECHNICIAN_NAME, CLIENT_ID, JOB_CARD_NO, REMARK, TECHNICIAN_NAME, CUSTOMER_NAME, EMAIL_LIST } = req.body;
    var systemDate = mm.getSystemDate();

    var REQUESTED_DATE_TIME = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];

    if (!Array.isArray(INVENTORY_DATA) || INVENTORY_DATA.length === 0) {
        return res.status(400).json({
            "code": 400,
            "message": "Invalid or empty INVENTORY_DATA array."
        });
    }

    try {
        const connection = mm.openConnection();
        var ACTION_DETAILS = ` ${TECHNICIAN_NAME} has added the inventory request for job ${req.body.JOB_CARD_NO} .`;
        var TOTAL_RATE = INVENTORY_DATA.reduce((sum, item) => sum + (item.RATE * item.QUANTITY), 0);
        var TOTAL_TAX_RATE = INVENTORY_DATA.reduce((sum, item) => sum + (item.TAX_RATE * item.QUANTITY), 0);
        mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsGet) => {
            if (error) {
                mm.rollbackConnection(connection);
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({
                    "code": 400,
                    "message": "Failed to save inventoryRequestMaster information."
                });
            } else {
                mm.executeDML('SELECT * FROM view_order_details WHERE JOB_CARD_ID = ?', [JOB_CARD_ID], supportKey, connection, (error, resultsGetOrder) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return res.status(400).json({
                            "code": 400,
                            "message": "Failed to save inventoryRequestMaster information."
                        });
                    } else {
                        if (resultsGet.length > 0) {
                            mm.executeDML('UPDATE inventory_request_master  SET TOTAL_RATE = TOTAL_RATE + ?, TOTAL_TAX_RATE = TOTAL_TAX_RATE + ? WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [TOTAL_RATE, TOTAL_TAX_RATE, JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsUpdate) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    return res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save inventoryRequestMaster information."
                                    });
                                } else {
                                    var details = INVENTORY_DATA.map(item => [
                                        resultsGet[0].ID, JOB_CARD_ID, item.INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID,
                                        item.QUANTITY, item.RATE, item.TAX_RATE,
                                        REQUESTED_DATE_TIME, 'P', ACTION_DETAILS, 1, item.WAREHOUSE_ID, item.ACTUAL_UNIT_NAME, item.ACTUAL_UNIT_ID, item.SERIAL_NO, item.BATCH_NO, item.INVENTORY_NAME, item.INVENTORY_TRACKING_TYPE, item.IS_VARIANT, item.PARENT_ID, item.QUANTITY_PER_UNIT, item.ID]);
                                    mm.executeDML('INSERT INTO inventory_request_details (REQUEST_MASTER_ID,JOB_CARD_ID, INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID, QUANTITY, RATE, TAX_RATE, REQUESTED_DATE_TIME, STATUS, REMARK, CLIENT_ID,WAREHOUSE_ID,ACTUAL_UNIT_NAME,ACTUAL_UNIT_ID,SERIAL_NO,BATCH_NO,INVENTORY_NAME,INVENTORY_TRACKING_TYPE,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT,TECHNICIAN_MOVEMENT_ID) VALUES ?', [details], supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            return res.status(400).json({
                                                "code": 400,
                                                "message": "Failed to save inventoryRequestDetails information."
                                            });
                                        }

                                        var logData = {
                                            TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                                            LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS,
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME,
                                            ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null,
                                            ORDER_MEDIUM: null, ORDER_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                            PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "",
                                            TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "",
                                            JOB_CARD_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                            ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            DATE_TIME: systemDate, supportKey: 0
                                        };
                                        // Inside the success callback after inserting inventory_request_details
                                        var INVENTORY_IDS = INVENTORY_DATA.map(item => item.INVENTORY_ID);
                                        if (EMAIL_LIST) {
                                            sendRequestEmail("E", EMAIL_LIST, CUSTOMER_NAME, JOB_CARD_NO, INVENTORY_DATA, TECHNICIAN_NAME, TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, resultsGet[0].ID, INVENTORY_IDS);
                                        } else {
                                            mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Inventory request for job ${JOB_CARD_NO}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "IR", "I", resultsGetOrder);
                                            mm.sendNotificationToAdmin(8, `Inventory request for job ${JOB_CARD_NO} by ${TECHNICIAN_NAME}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}.`, "", "J", "IR", supportKey, "I", req.body);
                                        }
                                        dbm.saveLog(logData, technicianActionLog);
                                        mm.commitConnection(connection);
                                        return res.status(200).json({
                                            "code": 200,
                                            "message": "InventoryRequestDetails information saved successfully."
                                        });
                                    });
                                }
                            });

                        } else {
                            mm.executeDML('INSERT INTO inventory_request_master (JOB_CARD_ID, TECHNICIAN_ID, CUSTOMER_ID, TOTAL_RATE, TOTAL_TAX_RATE, REQUESTED_DATE_TIME, STATUS, REMARK, CLIENT_ID,PAYMENT_STATUS,TOTAL_ITEMS) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)',
                                [JOB_CARD_ID, TECHNICIAN_ID, CUSTOMER_ID, TOTAL_RATE, TOTAL_TAX_RATE, REQUESTED_DATE_TIME, "P", REMARK, CLIENT_ID, "I", INVENTORY_DATA.length],
                                supportKey, connection,
                                (error, resultsMaster) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        return res.status(400).json({
                                            "code": 400,
                                            "message": "Failed to save inventoryRequestMaster information."
                                        });
                                    } else {

                                        var details = INVENTORY_DATA.map(item => [
                                            resultsMaster.insertId, JOB_CARD_ID, item.INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID,
                                            item.QUANTITY, item.RATE, item.TAX_RATE,
                                            REQUESTED_DATE_TIME, 'P', ACTION_DETAILS, 1, item.WAREHOUSE_ID, item.ACTUAL_UNIT_NAME, item.ACTUAL_UNIT_ID, item.SERIAL_NO, item.BATCH_NO, item.INVENTORY_NAME, item.INVENTORY_TRACKING_TYPE, item.IS_VARIANT, item.PARENT_ID, item.QUANTITY_PER_UNIT, item.ID]);
                                        mm.executeDML('INSERT INTO inventory_request_details (REQUEST_MASTER_ID,JOB_CARD_ID, INVENTORY_ID, TECHNICIAN_ID, CUSTOMER_ID, QUANTITY, RATE, TAX_RATE, REQUESTED_DATE_TIME, STATUS, REMARK, CLIENT_ID,WAREHOUSE_ID,ACTUAL_UNIT_NAME,ACTUAL_UNIT_ID,SERIAL_NO,BATCH_NO,INVENTORY_NAME,INVENTORY_TRACKING_TYPE,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT,TECHNICIAN_MOVEMENT_ID) VALUES ?', [details], supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                return res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to save inventoryRequestDetails information."
                                                });
                                            }

                                            var logData = {
                                                TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID, JOB_CARD_ID, CUSTOMER_ID,
                                                LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS,
                                                USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME,
                                                ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null,
                                                ORDER_MEDIUM: null, ORDER_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                                PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "",
                                                TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "",
                                                JOB_CARD_STATUS: `Inventory request ${STATUS === 'A' ? 'approved' : STATUS === 'R' ? 'rejected' : STATUS === 'AP' ? 'auto-approved' : 'updated'}`,
                                                ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                DATE_TIME: systemDate, supportKey: 0
                                            };
                                            var INVENTORY_IDS = INVENTORY_DATA.map(item => item.INVENTORY_ID);
                                            if (EMAIL_LIST) {
                                                sendRequestEmail("E", EMAIL_LIST, CUSTOMER_NAME, JOB_CARD_NO, INVENTORY_DATA, TECHNICIAN_NAME, TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, resultsMaster.insertId, INVENTORY_IDS);
                                            } else {
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, `Inventory request for job ${JOB_CARD_NO}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}. Please take action over it.`, "", "J", supportKey, "IR", "I", resultsGetOrder);
                                                mm.sendNotificationToAdmin(8, `Inventory request for job ${JOB_CARD_NO} by ${TECHNICIAN_NAME}`, `The technician ${TECHNICIAN_NAME} has added the inventory part request for the job ${JOB_CARD_NO}.`, "I", "IR", supportKey, "I", req.body);
                                            }
                                            dbm.saveLog(logData, technicianActionLog);
                                            mm.commitConnection(connection);
                                            return res.status(200).json({
                                                "code": 200,
                                                "message": "InventoryRequestDetails information saved successfully."
                                            });
                                        }
                                        );
                                    }
                                }
                            );
                        }
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};


exports.updateRequestStatus = (req, res) => {
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var inventoryIDs = req.body.INVENTORY_IDS
    var IDS = req.body.IDS

    console.log("\nYYYYYYYY");
    console.log("\nREQUEST BODY,", req.body);
    console.log("\nYYYYYYYY");

    var { TECHNICIAN_ID, JOB_CARD_ID, CUSTOMER_ID, STATUS, ORDER_ID, TECHNICIAN_NAME, JOB_CARD_NO, REQUEST_MASTER_ID } = req.body;
    // Parse and validate arrays
    // let inventoryIDs, IDS;
    try {
        inventoryIDs = parseArrayField(req.body.INVENTORY_IDS, 'INVENTORY_IDS');
        IDS = parseArrayField(req.body.IDS, 'IDS');
    } catch (e) {
        console.error(e.message);
        return res.status(400).send({ code: 400, message: e.message });
    }
    var systemDate = mm.getSystemDate();
    if (!TECHNICIAN_ID || !JOB_CARD_ID || !STATUS || !CUSTOMER_ID || !IDS || !req.body.INVENTORY_IDS) {
        console.log("Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, ID, CUSTOMER_ID, ids");

        return res.send({
            code: 300,
            message: `Required fields are missing. TECHNICIAN_ID, JOB_CARD_ID, STATUS, ID, CUSTOMER_ID, ids`
        });
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }

    try {
        let setData = "";
        let recordData = [];
        let STATUSZ = "";

        if (STATUS === "A") {
            setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
            recordData.push("AC", systemDate);
            STATUSZ = "AC";
        } else if (STATUS === "R") {
            setData += "STATUS = ?,VERIFICATION_DATE = ?, ";
            recordData.push("R", systemDate);
            STATUSZ = "R";
        } else if (STATUS === "AP") {
            setData += "STATUS = ?, ";
            recordData.push("AP");
            STATUSZ = "AP";
        } else {
            return res.send({
                code: 400,
                message: "Invalid STATUS value."
            });
        }

        var loggarry = []
        const connection = mm.openConnection();
        console.log("\n\n\n\n in update8888888");


        mm.executeDML('SELECT * FROM view_job_card WHERE ID = ?', [JOB_CARD_ID], supportKey, connection, (error, resultsGetJobs) => {
            if (error) {
                mm.rollbackConnection(connection);
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                return res.status(400).json({
                    "code": 400,
                    "message": "Failed to save inventoryRequestMaster information."
                });
            } else {
                mm.executeDML(`UPDATE job_card SET INVENTORY_REQUESTED = 1 WHERE 1 AND TECHNICIAN_ID = ? AND CUSTOMER_ID = ? AND ID = ?`, [TECHNICIAN_ID, CUSTOMER_ID, JOB_CARD_ID], supportKey, connection, (error, resultsjOB) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                    } else {
                        let transactionData = [];
                        if (IDS.length > 0) {
                            let ACTION_LOG = `${req.body.authData.data.UserData[0].USER_NAME} has approved the inventory part request for job ${JOB_CARD_NO}.`;
                            async.eachSeries(IDS, (ids, callback) => {
                                console.log("\n\n\n\n in async");

                                mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?;`, [STATUSZ, ids, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        callback(error);
                                    } else {
                                        mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, JOB_CARD_ID, supportKey, connection, (error, resultsJob) => {
                                            if (error) {
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                console.log(error);
                                                callback(error);
                                            } else {
                                                mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, resultsJob[0].ORDER_ID, supportKey, connection, (error, resultsOrderS) => {
                                                    if (error) {
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        console.log(error);
                                                        callback(error);
                                                    } else {
                                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
                                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                        loggarry.push(logData)
                                                        if (STATUS == 'A' || STATUS == 'AP') {
                                                            mm.executeDML(`SELECT * FROM inventory_request_details WHERE ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [ids, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                                                if (error) {
                                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                    console.log(error);
                                                                    callback(error);
                                                                }
                                                                else {
                                                                    mm.executeDML(`UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK=CURRENT_STOCK-? WHERE ITEM_ID=? AND WAREHOUSE_ID=?`, [results[0].QUANTITY, results[0].INVENTORY_ID, results[0].WAREHOUSE_ID], supportKey, connection, (error, resultsupdate) => {
                                                                        if (error) {
                                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                            console.log(error);
                                                                            callback(error);
                                                                        }
                                                                        else {
                                                                            transactionData = [[JOB_CARD_NO, mm.getSystemDate(), "D", results[0].INVENTORY_TRACKING_TYPE, 0, TECHNICIAN_ID, 0, 0, 0, 0, "J", results[0].BATCH_NO, results[0].SERIAL_NO, results[0].INVENTORY_ID, 0, results[0].QUANTITY, ACTION_LOG, 1, results[0].ACTUAL_UNIT_ID, results[0].ACTUAL_UNIT_NAME, results[0].IS_VARIANT, results[0].PARENT_ID, results[0].QUANTITY_PER_UNIT],
                                                                            [JOB_CARD_NO, mm.getSystemDate(), "C", results[0].INVENTORY_TRACKING_TYPE, 0, 0, 0, 0, 0, JOB_CARD_ID, "J", results[0].BATCH_NO, results[0].SERIAL_NO, results[0].INVENTORY_ID, results[0].QUANTITY, 0, ACTION_LOG, 1, results[0].ACTUAL_UNIT_ID, results[0].ACTUAL_UNIT_NAME, results[0].IS_VARIANT, results[0].PARENT_ID, results[0].QUANTITY_PER_UNIT]]
                                                                            mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,JOB_CARD_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [transactionData], supportKey, connection, (error, transactions) => {
                                                                                if (error) {
                                                                                    console.log(` Error adding transaction logs`, error);
                                                                                    callback(error);
                                                                                }
                                                                                else {
                                                                                    callback();
                                                                                }
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                        else {
                                                            callback();
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            },
                                (err) => {
                                    if (err) {
                                        mm.rollbackConnection(connection);
                                        console.log(err);
                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                    } else {
                                        mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ? AND STATUS = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID, "AC"], supportKey, connection, (error, resultsGet) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                return res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to save inventoryRequestMaster information."
                                                });
                                            } else {
                                                if (resultsGet.length > 0) {
                                                    var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                    mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "I", "J", resultsGetJobs);
                                                    dbm.saveLog(loggarry, technicianActionLog);
                                                    mm.commitConnection(connection);
                                                    res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                } else {
                                                    mm.executeDML(`UPDATE inventory_request_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE 1  AND TECHNICIAN_ID=${TECHNICIAN_ID} AND CUSTOMER_ID=${CUSTOMER_ID} AND JOB_CARD_ID=${JOB_CARD_ID} AND ID = ${REQUEST_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            console.log(error);
                                                            res.status(400).json({
                                                                "code": 400,
                                                                "message": "Failed to update inventoryRequestDetails information."
                                                            })
                                                        } else {
                                                            var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                            mm.sendNotificationToAdmin(8, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                            mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `**Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}**`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
                                                            dbm.saveLog(loggarry, technicianActionLog);
                                                            mm.commitConnection(connection);
                                                            res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                        }
                                                    })
                                                }
                                            }
                                        })
                                    }
                                })
                        } else {
                            mm.executeDML('SELECT * FROM inventory_request_master WHERE JOB_CARD_ID = ? AND CUSTOMER_ID = ? AND TECHNICIAN_ID = ?', [JOB_CARD_ID, CUSTOMER_ID, TECHNICIAN_ID], supportKey, connection, (error, resultsGet) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    return res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save inventoryRequestMaster information."
                                    });
                                } else {
                                    if (resultsGet.length > 0) {
                                        var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                        mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE INVENTORY_ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [STATUSZ, 0, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(err);
                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                            } else {
                                                mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, JOB_CARD_ID, supportKey, connection, (error, resultsJob) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        console.log(err);
                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                    } else {
                                                        mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, resultsJob[0].ORDER_ID, supportKey, connection, (error, resultsOrderS) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                console.log(err);
                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                                return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                            } else {
                                                                var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
                                                                const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory part request for the job ${JOB_CARD_NO} .`;
                                                                mm.sendNotificationToAdmin(8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                                mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
                                                                dbm.saveLog(logData, technicianActionLog);
                                                                mm.commitConnection(connection);
                                                                res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    } else {
                                        mm.executeDML(`UPDATE inventory_request_master SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE 1  AND TECHNICIAN_ID=${TECHNICIAN_ID} AND CUSTOMER_ID=${CUSTOMER_ID} AND JOB_CARD_ID=${JOB_CARD_ID} AND ID = ${REQUEST_MASTER_ID}`, recordData, supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                console.log(error);
                                                res.status(400).json({
                                                    "code": 400,
                                                    "message": "Failed to update inventoryRequestDetails information."
                                                })
                                            } else {
                                                mm.executeDML(`UPDATE inventory_request_details SET STATUS=?, CREATED_MODIFIED_DATE = '${systemDate}' WHERE INVENTORY_ID=? AND CUSTOMER_ID=? AND TECHNICIAN_ID=? AND JOB_CARD_ID=? AND REQUEST_MASTER_ID=?`, [STATUSZ, 0, CUSTOMER_ID, TECHNICIAN_ID, JOB_CARD_ID, REQUEST_MASTER_ID], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        console.log(err);
                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                    } else {
                                                        mm.executeDML(`SELECT * FROM view_job_card WHERE ID = ?`, JOB_CARD_ID, supportKey, connection, (error, resultsJob) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                console.log(err);
                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                                return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                            } else {
                                                                mm.executeDML(`SELECT * FROM view_order_master WHERE ID = ?`, resultsJob[0].ORDER_ID, supportKey, connection, (error, resultsOrderS) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection);
                                                                        console.log(err);
                                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                                                                        return res.status(400).send({ code: 400, message: "Failed to update inventory request." });
                                                                    } else {
                                                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Inventory', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), PAYMENT_MODE: "", PAYMENT_STATUS: "", TOTAL_AMOUNT: "", ORDER_NUMBER: "", TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Inventory request " + (STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated'))), ORDER_TYPE: "", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                        var ACTION_DETAILSs = ` ${req.body.authData.data.UserData[0].USER_NAME} has ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))} the inventory request for the job ${JOB_CARD_NO} .`;
                                                                        mm.sendNotificationToAdmin(8, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", "N", supportKey, "I", req.body);
                                                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, `Inventory Request ${(STATUS == 'A' ? 'approved' : (STATUS == 'R' ? 'rejected' : (STATUS == 'AP' ? 'auto-approved' : 'updated')))}`, `${ACTION_DETAILSs}`, "", "J", supportKey, "N", "J", resultsGetJobs);
                                                                        dbm.saveLog(logData, technicianActionLog);
                                                                        mm.commitConnection(connection);
                                                                        res.status(200).send({ code: 200, message: "Inventory request updated." });
                                                                    }
                                                                })
                                                            }
                                                        })
                                                    }
                                                })
                                            }
                                        })
                                    }
                                }
                            })
                        }
                    }
                })
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Internal Server Error."
        });
    }
};