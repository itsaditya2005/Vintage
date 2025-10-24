const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;
var inventoryRequestDetails = "inventory_request_details";
var viewInventoryRequestDetails = "view_" + inventoryRequestDetails;


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
        body('JOB_CARD_ID').isInt().optional(), body('TECHNICIAN_ID').isInt().optional(), body('CUSTOMER_ID').isInt().optional(), body('QUANTITY').isInt().optional(), body('RATE').isDecimal().optional(), body('TAX_RATE').isDecimal().optional(), body('TOTAL_AMOUNT').isDecimal().optional(), body('REQUESTED_DATE_TIME').optional(), body('STATUS').optional(), body('REMARK').optional(), body('INVENTORY_ID').isInt().optional(), body('ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryRequestDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get inventoryRequestDetails count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryRequestDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get inventoryRequestDetails information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 199,
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
            mm.executeQueryData('INSERT INTO ' + inventoryRequestDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventoryRequestDetails information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "InventoryRequestDetails information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + inventoryRequestDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update inventoryRequestDetails information."
                    });
                }
                else {
                    console.log(results);
                    res.status(200).json({
                        "code": 200,
                        "message": "InventoryRequestDetails information updated successfully...",
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



