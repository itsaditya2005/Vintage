const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var inventoryAccountTransaction = "inventory_account_transaction";
var viewInventoryAccountTransaction = "view_" + inventoryAccountTransaction;


function reqData(req) {

    var data = {
        TRANSACTION_ID: req.body.TRANSACTION_ID,
        TRANSACTION_DATE: req.body.TRANSACTION_DATE,
        TRANSACTION_TYPE: req.body.TRANSACTION_TYPE ? '1' : '0',
        MOVEMENT_ID: req.body.MOVEMENT_ID,
        ITEM_ID: req.body.ITEM_ID,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        REMARKS: req.body.REMARKS,
        ADJUSTMENT_ID: req.body.ADJUSTMENT_ID,
        INWARD_ID: req.body.INWARD_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        IS_VARIANT: req.body.IS_VARIANT,
        PARENT_ID: req.body.PARENT_ID,
        IN_QTY: req.body.IN_QTY,
        OUT_QTY: req.body.OUT_QTY,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        GATEWAY_TYPE: req.body.GATEWAY_TYPE ? '1' : '0',
        BATCH_NO: req.body.BATCH_NO,
        SERIAL_NO: req.body.SERIAL_NO,
        ACTUAL_UNIT_ID: req.body.ACTUAL_UNIT_ID,
        ACTUAL_UNIT_NAME: req.body.ACTUAL_UNIT_NAME,
    }
    return data;
}



exports.validate = function () {
    return [
        body('TRANSACTION_ID').isInt(),
        body('TRANSACTION_DATE').optional(),
        body('TRANSACTION_TYPE').optional(),
        body('MOVEMENT_ID').isInt(),
        body('ITEM_ID').isInt(),
        body('WAREHOUSE_ID').isInt(),
        body('REMARKS').optional(),
        body('ADJUSTMENT_ID').isInt(),
        body('INWARD_ID').isInt(),
        body('ID').optional(),
    ]
}



exports.validate = function () {
    return [

        body('TRANSACTION_ID').isInt(), body('TRANSACTION_DATE', ' parameter missing').exists(), body('TRANSACTION_TYPE', ' parameter missing').exists(), body('MOVEMENT_ID').isInt(), body('ITEM_ID').isInt(), body('WAREHOUSE_ID').isInt(), body('REMARKS', ' parameter missing').exists(), body('ADJUSTMENT_ID').isInt(), body('TYPE', ' parameter missing').exists(), body('INWARD_ID').isInt(), body('ID').optional(),


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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryAccountTransaction + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get inventoryAccountTransaction count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryAccountTransaction + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get inventoryAccountTransaction information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 194,
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

    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + inventoryAccountTransaction + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save inventoryAccountTransaction information..."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "InventoryAccountTransaction information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + inventoryAccountTransaction + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update inventoryAccountTransaction information."
                    });
                }
                else {
                    res.status(200).json({
                        "code": 200,
                        "message": "InventoryAccountTransaction information updated successfully...",
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