const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var inventoryPurchaseMaster = "inventory_purchase_master";
var viewInventoryPurchaseMaster = "view_" + inventoryPurchaseMaster;


function reqData(req) {

    var data = {
        ORDER_DATE_TIME: req.body.ORDER_DATE_TIME,
        SUPPLIER_NAME: req.body.SUPPLIER_NAME,
        SUPPLIER_CONTACT_NO: req.body.SUPPLIER_CONTACT_NO,
        PAYMENT_TERMS: req.body.PAYMENT_TERMS,
        PAYMENT_METHOD: req.body.PAYMENT_METHOD,
        PAYMENT_STATUS: req.body.PAYMENT_STATUS,
        TAX_AMOUNT: req.body.TAX_AMOUNT ? req.body.TAX_AMOUNT : 0,
        DISCOUNT_AMOUNT: req.body.DISCOUNT_AMOUNT ? req.body.DISCOUNT_AMOUNT : 0,
        GRAND_TOTAL: req.body.GRAND_TOTAL ? req.body.GRAND_TOTAL : 0,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [
        body('PURCHASE_ORDER_ID').isInt().optional(),
        body('ORDER_DATE').optional(),
        body('SUPPLIER_ID').isInt().optional(),
        body('ITEM_ID').isInt().optional(),
        body('ITEM_DESCRIPTION').optional(),
        body('ITEM_CATEGORY').optional(),
        body('QUANTITY_ORDERED').isInt().optional(),
        body('UNIT_ID').isInt().optional(),
        body('UNIT_PRICE').isDecimal().optional(),
        body('TOTAL_PRICE').isDecimal().optional(),
        body('BATCH_NUMBER').optional(),
        body('PAYMENT_TERMS').optional(),
        body('PAYMENT_METHOD').optional(),
        body('PAYMENT_STATUS').optional(),
        body('TAX_AMOUNT').isDecimal().optional(),
        body('DISCOUNT_AMOUNT').isDecimal().optional(),
        body('GRAND_TOTAL').isDecimal().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryPurchaseMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventoryPurchase count.",
                    });
                }
                else {

                    mm.executeQuery('select * from ' + viewInventoryPurchaseMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventoryPurchase information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 36,
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
            mm.executeQueryData('INSERT INTO ' + inventoryPurchaseMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save inventoryPurchase information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "InventoryPurchase information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + inventoryPurchaseMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update inventoryPurchase information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "InventoryPurchase information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
        }
    }
}


exports.createPurchase = (req, res) => {

    var data = reqData(req);
    var ITEMS_DATA = req.body.ITEMS_DATA
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
            mm.executeQueryData('INSERT INTO ' + inventoryPurchaseMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save inventoryPurchase information..."
                    });
                }
                else {

                    var details = [];
                    for (var i = 0; i < ITEMS_DATA.length; i++) {
                        details.push({ "PURCHASE_MASTER_ID": results.insertId, "ITEM_NAME": ITEMS_DATA[i].ITEM_NAME, "ITEM_DESCRIPTION": ITEMS_DATA[i].ITEM_DESCRIPTION, "ITEM_SUB_CATEGORY": ITEMS_DATA[i].ITEM_SUB_CATEGORY, "QUANTITY_ORDERED": ITEMS_DATA[i].QUANTITY_ORDERED, "UNIT_NAME": ITEMS_DATA[i].UNIT_NAME, "UNIT_PRICE": ITEMS_DATA[i].UNIT_PRICE, "TOTAL_PRICE": ITEMS_DATA[i].TOTAL_PRICE, CLIENT_ID: 1, "CREATED_MODIFIED_DATE": mm.getSystemDate() });
                    }
                    mm.executeQueryData('INSERT INTO inventory_Purchase_details SET ?', details, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save inventoryPurchase Details information..."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "InventoryPurchase information saved successfully...",
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 400,
                "message": "Failed to save inventoryPurchase information..."
            });
        }
    }
}


exports.getData = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    var MASTER_ID = req.body.MASTER_ID;

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
        if (IS_FILTER_WRONG == "0" && MASTER_ID != '') {
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryPurchaseMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventoryPurchase count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryPurchaseMaster + ' where 1 AND ID = ' + MASTER_ID + ' ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventoryPurchase information."
                            });
                        }
                        else {
                            mm.executeQuery('select * from inventory_Purchase_Details where 1 AND PURCHASE_MASTER_ID = ' + MASTER_ID + ' ' + criteria, supportKey, (error, resultsDetails) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get inventoryPurchase information."
                                    });
                                }
                                else {
                                    results.push({ "ITEMS_DATA": resultsDetails });
                                    res.send({
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
            });
        } else {
            res.send({
                "code": 400,
                "message": "Filter is wrong or Master ID not found.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to get inventoryPurchase information."
        });
    }
}


exports.updatePurchase = (req, res) => {
    var data = reqData(req);
    var ITEMS_DATA = req.body.ITEMS_DATA;
    var MASTER_ID = req.body.ID;
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
            mm.executeQueryData('UPDATE ' + inventoryPurchaseMaster + ' SET ? WHERE ID = ?', [data, MASTER_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update inventoryPurchase information..."
                    });
                } else {
                    mm.executeQueryData('DELETE FROM inventory_Purchase_details WHERE PURCHASE_MASTER_ID = ?', [MASTER_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to update inventoryPurchase details..."
                            });
                        } else {
                            var details = [];
                            for (var i = 0; i < ITEMS_DATA.length; i++) {
                                details.push({ "PURCHASE_MASTER_ID": MASTER_ID, "ITEM_NAME": ITEMS_DATA[i].ITEM_NAME, "ITEM_DESCRIPTION": ITEMS_DATA[i].ITEM_DESCRIPTION, "ITEM_SUB_CATEGORY": ITEMS_DATA[i].ITEM_SUB_CATEGORY, "QUANTITY_ORDERED": ITEMS_DATA[i].QUANTITY_ORDERED, "UNIT_NAME": ITEMS_DATA[i].UNIT_NAME, "UNIT_PRICE": ITEMS_DATA[i].UNIT_PRICE, "TOTAL_PRICE": ITEMS_DATA[i].TOTAL_PRICE, CLIENT_ID: 1, "CREATED_MODIFIED_DATE": mm.getSystemDate() });
                            }
                            mm.executeQueryData('INSERT INTO inventory_Purchase_Details SET ?', details, supportKey, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to save updated inventoryPurchase details..."
                                    });
                                } else {
                                    res.send({
                                        "code": 200,
                                        "message": "InventoryPurchase information updated successfully..."
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
                "code": 400,
                "message": "Failed to update inventoryPurchase information..."
            });
        }
    }
};
