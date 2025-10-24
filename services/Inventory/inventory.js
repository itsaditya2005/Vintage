const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const InventoryTrack = require("../../modules/InventoryTrack");
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
const { connection } = require('mongoose');

var inventoryMaster = "inventory_master";
var viewInventoryMaster = "view_" + inventoryMaster;

function reqData(req) {
    var data = {
        ITEM_NAME: req.body.ITEM_NAME,
        INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
        INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
        DATE_OF_ENTRY: req.body.DATE_OF_ENTRY,
        STATUS: req.body.STATUS ? '1' : '0',
        SELLING_PRICE: req.body.SELLING_PRICE,
        CLIENT_ID: req.body.CLIENT_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
        INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
        BASE_UNIT_ID: req.body.BASE_UNIT_ID,
        BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
        BASE_QUANTITY: req.body.BASE_QUANTITY,
        PARENT_ID: req.body.PARENT_ID,
        SHORT_CODE: req.body.SHORT_CODE,
        AVG_LEVEL: req.body.AVG_LEVEL,
        REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
        ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
        HSN_ID: req.body.HSN_ID,
        HSN_NAME: req.body.HSN_NAME,
        TAX_PREFERENCE: req.body.TAX_PREFERENCE,
        TAX_ID: req.body.TAX_ID,
        TAX_NAME: req.body.TAX_NAME,
        IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS ? '1' : '0',
        IS_SET: req.body.IS_SET,
        SKU_CODE: req.body.SKU_CODE,
        IS_NEW: req.body.IS_NEW ? "1" : "0",
        VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED ? '1' : '0',
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED ? '1' : '0',
        EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED ? '1' : '0',
        INVENTORY_TYPE: req.body.INVENTORY_TYPE,
        RETURN_ALOW: req.body.RETURN_ALOW ? '1' : '0',
        BRAND_ID: req.body.BRAND_ID,
        BRAND_NAME: req.body.BRAND_NAME,
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
        DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
        DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
        RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
        REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW ? '1' : '0',
        REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
        EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
        WARRANTY_CARD: req.body.WARRANTY_CARD,
        RATING: req.body.RATING,
        BASE_PRICE: req.body.BASE_PRICE,
        DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
        WEIGHT: req.body.WEIGHT,
        LENGTH: req.body.LENGTH,
        BREADTH: req.body.BREADTH,
        HEIGHT: req.body.HEIGHT,
        EXPECTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
        INVENTORY_DETAILS_IMAGE: req.body.INVENTORY_DETAILS_IMAGE,
        IS_REFURBISHED: req.body.IS_REFURBISHED ? '1' : '0'
    }
    return data;
}


exports.validate = function () {
    return [
        body('ITEM_NAME').optional(),
        body('INVENTORY_CATEGORY_ID').optional(),
        body('INVENTRY_SUB_CATEGORY_ID').optional(),
        body('QUANTITY').optional(),
        body('PURCHASE_PRICE').optional(),
        body('SELLING_PRICE').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 32,
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

exports.getForCart = (req, res) => {

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
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : 0
    let INVENTORY_ID = req.body.INVENTORY_ID ? req.body.INVENTORY_ID : 0
    let UNIT_ID = req.body.UNIT_ID
    let QUANTITY_PER_UNIT = req.body.QUANTITY_PER_UNIT
    let InventoryFilter = ""
    if (INVENTORY_ID && UNIT_ID && QUANTITY_PER_UNIT) {
        InventoryFilter = `INVENTORY_ID = ${INVENTORY_ID} AND UNIT_ID = ${UNIT_ID} AND QUANTITY_PER_UNIT = ${QUANTITY_PER_UNIT}`
    } else {
        InventoryFilter = `INVENTORY_ID = im.ID AND UNIT_ID = im.UNIT_ID AND QUANTITY_PER_UNIT = im.QUANTITY_PER_UNIT`
    }
    try {
        if (IS_FILTER_WRONG == "0") {
            // if (CUSTOMER_ID) {
            mm.executeQuery('select count(*) as cnt from view_shop_items where 1 AND STATUS = 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory count.",
                    });
                }
                else {
                    mm.executeQuery(`SELECT *,IF(IFNULL((SELECT INVENTORY_ID FROM view_cart_item_details WHERE ${InventoryFilter} AND CUSTOMER_ID = ${CUSTOMER_ID} AND TYPE = "P"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART FROM view_shop_items im WHERE 1 AND STATUS = 1 ${criteria}`, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 32,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
            // } else {
            //     res.send({
            //         code: 300,
            //         message: "parameter MIssing CUSTOMER_ID  INVENTORY_ID."
            //     })
            // }
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
            mm.executeQueryData('SELECT SHORT_CODE FROM ' + inventoryMaster + ' WHERE SHORT_CODE = ?', data.SHORT_CODE, supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save inventory information..."
                    });
                }
                else if (resultsCheck.length > 0) {
                    return res.send({
                        "code": 300,
                        "message": "An item with the same short code already exists."
                    });
                }
                else {
                    mm.executeQueryData('INSERT INTO ' + inventoryMaster + ' SET ?', data, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to save inventory information..."
                            });
                        }
                        else {
                            mm.executeQueryData('INSERT INTO inventory_unit_mapping(ITEM_ID,QUANTITY,UNIT_ID,CATEGORY,CATEGORY_ID,QUANTITY_PER_UNIT) values(?,?,?,?,?,?)', [results.insertId, data.QUANTITY, data.BASE_UNIT_ID, data.INVENTORY_CATEGORY_NAME, data.INVENTORY_CATEGORY_ID, data.BASE_QUANTITY], supportKey, (error, resultsUnit) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save inventory information..."
                                    });
                                }
                                else {
                                    trackData = {
                                        ITEM_NAME: req.body.ITEM_NAME,
                                        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                                        INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                                        INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                                        DATE_OF_ENTRY: mm.getSystemDate(),
                                        STATUS: req.body.STATUS,
                                        SELLING_PRICE: req.body.SELLING_PRICE,
                                        DESCRIPTION: req.body.DESCRIPTION,
                                        INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                                        INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                                        BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                                        BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                                        BASE_QUANTITY: req.body.BASE_QUANTITY,
                                        PARENT_ID: req.body.PARENT_ID,
                                        SHORT_CODE: req.body.SHORT_CODE,
                                        AVG_LEVEL: req.body.AVG_LEVEL,
                                        REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                                        ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                                        HSN_ID: req.body.HSN_ID,
                                        HSN_NAME: req.body.HSN_NAME,
                                        TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                                        TAX_ID: req.body.TAX_ID,
                                        TAX_NAME: req.body.TAX_NAME,
                                        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                                        IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                                        IS_SET: req.body.IS_SET,
                                        SKU_CODE: req.body.SKU_CODE,
                                        IS_NEW: req.body.IS_NEW,
                                        VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                                        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                                        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                                        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                                        EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                                        INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                                        RETURN_ALOW: req.body.RETURN_ALOW,
                                        BRAND_ID: req.body.BRAND_ID,
                                        BRAND_NAME: req.body.BRAND_NAME,
                                        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                                        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                                        DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                                        DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                                        RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                                        REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                                        REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                                        EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                                        WARRANTY_CARD: req.body.WARRANTY_CARD,
                                        RATING: req.body.RATING,
                                        BASE_PRICE: req.body.BASE_PRICE,
                                        DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                                        WEIGHT: req.body.WEIGHT,
                                        LENGTH: req.body.LENGTH,
                                        BREADTH: req.body.BREADTH,
                                        HEIGHT: req.body.HEIGHT,
                                        EXPECTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
                                        IS_REFURBISHED: req.body.IS_REFURBISHED
                                    }
                                    dbm.saveLog(trackData, InventoryTrack)
                                    mm.sendNotificationToAdmin(8, "New Inventory Added", `Hello Admin, New inventory item ${data.ITEM_NAME} was added to the system on ${mm.getSystemDate()}. Please review and update records if needed.`, "I", "I", supportKey, "I", req.body);
                                    res.status(200).json({
                                        'ID': results.insertId,
                                        "code": 200,
                                        "message": "Inventory information saved successfully...",
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
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
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null);
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
            mm.executeQueryData('SELECT SHORT_CODE FROM ' + inventoryMaster + ' WHERE SHORT_CODE = ? AND ID != ?', [data.SHORT_CODE, criteria.ID], supportKey, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save service information..."
                    });
                }
                else if (resultsCheck.length > 0) {
                    return res.send({
                        "code": 300,
                        "message": "An inventory item with the same short code already exists."
                    });
                }
                else {
                    mm.executeQueryData(`UPDATE ` + inventoryMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                        if (error) {
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update inventory information."
                            });
                        }
                        else {
                            const ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has modified details of ${data.ITEM_NAME} on ${systemDate}.`;
                            trackData = {
                                ITEM_ID: criteria.ID,
                                ITEM_NAME: req.body.ITEM_NAME,
                                ACTION_LOG: ACTION_LOG,
                                AADED_BY: req.body.authData.data.UserData[0].NAME,
                                WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                                INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                                INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                                DATE_OF_ENTRY: systemDate,
                                STATUS: req.body.STATUS,
                                SELLING_PRICE: req.body.SELLING_PRICE,
                                DESCRIPTION: req.body.DESCRIPTION,
                                INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                                INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                                BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                                BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                                BASE_QUANTITY: req.body.BASE_QUANTITY,
                                PARENT_ID: req.body.PARENT_ID,
                                SHORT_CODE: req.body.SHORT_CODE,
                                AVG_LEVEL: req.body.AVG_LEVEL,
                                REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                                ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                                HSN_ID: req.body.HSN_ID,
                                HSN_NAME: req.body.HSN_NAME,
                                TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                                TAX_ID: req.body.TAX_ID,
                                TAX_NAME: req.body.TAX_NAME,
                                WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                                IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                                IS_SET: req.body.IS_SET,
                                SKU_CODE: req.body.SKU_CODE,
                                IS_NEW: req.body.IS_NEW,
                                VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                                INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                                WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                                GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                                EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                                INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                                RETURN_ALOW: req.body.RETURN_ALOW,
                                BRAND_ID: req.body.BRAND_ID,
                                BRAND_NAME: req.body.BRAND_NAME,
                                WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                                GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                                DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                                DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                                RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                                REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                                REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                                EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                                WARRANTY_CARD: req.body.WARRANTY_CARD,
                                RATING: req.body.RATING,
                                BASE_PRICE: req.body.BASE_PRICE,
                                DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                                WEIGHT: req.body.WEIGHT,
                                LENGTH: req.body.LENGTH,
                                BREADTH: req.body.BREADTH,
                                HEIGHT: req.body.HEIGHT,
                                EXPECTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
                                IS_REFURBISHED: req.body.IS_REFURBISHED
                            }
                            dbm.saveLog(trackData, InventoryTrack)
                            if (req.body.IS_HAVE_VARIANTS == '1') {
                                mm.executeQueryData(`UPDATE ` + inventoryMaster + ` SET STATUS = ? where PARENT_ID = ${criteria.ID} `, [req.body.STATUS], supportKey, (error, results) => {
                                    if (error) {
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        console.log(error);
                                        res.send({
                                            "code": 400,
                                            "message": "Failed to update inventory information."
                                        });
                                    }
                                    else {
                                        res.send({
                                            "code": 200,
                                            "message": "Inventory information updated successfully...",
                                        });
                                    }
                                });
                            } else {
                                res.send({
                                    "code": 200,
                                    "message": "Inventory information updated successfully...",
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
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

exports.mapUnitToInventory = (req, res) => {
    try {
        var data = req.body.DATA ? req.body.DATA : [];
        var ITEM_ID = req.body.ITEM_ID;
        var supportKey = req.headers['supportkey'];

        if ((!ITEM_ID || ITEM_ID == " ") || (data.length <= 0)) {
            res.send({
                "code": 400,
                "message": "item id  or data parameter missing"
            });
        }
        else {
            var recordData = [];
            const dataLength = data.length;
            for (let i = 0; i < dataLength; i++) {
                let rec = [ITEM_ID, data[i].UNIT_ID, data[i].RATIO_RATE, req.body.CLIENT_ID, data[i].QUANTITY, data[i].CATEGORY_ID, data[i].QUANTITY_PER_UNIT, data[i].AVG_LEVEL, data[i].REORDER_STOCK_LEVEL, data[i].ALERT_STOCK_LEVEL];
                recordData.push(rec);
            }
            mm.executeQueryData(`delete from inventory_unit_mapping where ITEM_ID = ?;`, [ITEM_ID], supportKey, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to map units to item."
                    });
                } else {

                    mm.executeQueryData(`insert into inventory_unit_mapping(ITEM_ID,UNIT_ID,RATIO_RATE,CLIENT_ID,QUANTITY,CATEGORY_ID,QUANTITY_PER_UNIT,AVG_LEVEL,REORDER_STOCK_LEVEL,ALERT_STOCK_LEVEL) values ?`, [recordData], supportKey, (error, resultsUpdate) => {
                        if (error) {
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to map units to item."
                            });
                        } else {
                            res.send({
                                "code": 200,
                                "message": "Units mapped successfully to the item."
                            });
                        }
                    });
                }
            });
        }
    } catch (error) {
        console.log(error);
    }
}

exports.getInventoryHirarchy = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';

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
            var Query = `SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'key', CAST(c.ID AS CHAR),
        'ID', c.ID,
        'title', c.CATEGORY_NAME,
        'disabled', 1,
        'children', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CONCAT(CAST(c.ID AS CHAR), '-', CAST(sc.ID AS CHAR)),
                    'ID', sc.ID,
                    'title', sc.NAME,
                    'disabled', 1,
                    'children', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'key', CONCAT(CAST(c.ID AS CHAR), '-', CAST(sc.ID AS CHAR), '-', CAST(im.ID AS CHAR)),
                                'ID', im.ID,
                                'isLeaf', true,
                                'title', im.ITEM_NAME,
                                'details', JSON_OBJECT(
                                    'ID', im.ID,
                                    'ITEM_NAME', im.ITEM_NAME,
                                    'INVENTORY_CATEGORY_ID', im.INVENTORY_CATEGORY_ID,
                                    'INVENTRY_SUB_CATEGORY_ID', im.INVENTRY_SUB_CATEGORY_ID,
                                    'DATE_OF_ENTRY', im.DATE_OF_ENTRY,
                                    'STATUS', im.STATUS,
                                    'SELLING_PRICE', im.SELLING_PRICE,
                                    'DESCRIPTION', im.DESCRIPTION,
                                    'INVENTORY_CATEGORY_NAME', im.INVENTORY_CATEGORY_NAME,
                                    'INVENTRY_SUB_CATEGORY_NAME', im.INVENTRY_SUB_CATEGORY_NAME,
                                    'BASE_UNIT_ID', im.BASE_UNIT_ID,
                                    'BASE_UNIT_NAME', im.BASE_UNIT_NAME,
                                    'BASE_QUANTITY', im.BASE_QUANTITY,
                                    'PARENT_ID', im.PARENT_ID,
                                    'SHORT_CODE', im.SHORT_CODE,
                                    'AVG_LEVEL', im.AVG_LEVEL,
                                    'REORDER_STOCK_LEVEL', im.REORDER_STOCK_LEVEL,
                                    'ALERT_STOCK_LEVEL', im.ALERT_STOCK_LEVEL,
                                    'HSN_ID', im.HSN_ID,
                                    'HSN_NAME', im.HSN_NAME,
                                    'TAX_PREFERENCE', im.TAX_PREFERENCE,
                                    'TAX_ID', im.TAX_ID,
                                    'TAX_NAME', im.TAX_NAME,
                                    'IS_HAVE_VARIANTS', im.IS_HAVE_VARIANTS,
                                    'IS_SET', im.IS_SET,
                                    'IS_NEW', im.IS_NEW,
                                    'VARIANT_COMBINATION', im.VARIANT_COMBINATION,
                                    'SKU_CODE', im.SKU_CODE,
                                    'INVENTORY_TRACKING_TYPE', im.INVENTORY_TRACKING_TYPE,
                                    'WARRANTY_ALLOWED', im.WARRANTY_ALLOWED,
                                    'GUARANTEE_ALLOWED', im.GUARANTEE_ALLOWED,
                                    'EXPIRY_DATE_ALLOWED', im.EXPIRY_DATE_ALLOWED
                                )
                            )
                        )
                        FROM inventory_master im
                        WHERE im.INVENTORY_CATEGORY_ID = c.ID 
                          AND im.INVENTRY_SUB_CATEGORY_ID = sc.ID
                          AND im.PARENT_ID = 0
                          AND im.STATUS = 1
                          AND (
                              im.PARENT_ID = 0 -- Include inventories that are not variants
                              OR EXISTS ( -- Ensure variants exist if IS_HAVE_VARIANTS = 1
                                  SELECT 1 FROM inventory_master v
                                  WHERE v.PARENT_ID = im.ID AND im.STATUS = 1
                              )
                          )
                    )
                )
            )
            FROM inventory_sub_category sc
            WHERE sc.INVENTRY_CATEGORY_ID = c.ID 
              AND sc.IS_ACTIVE = 1
              AND EXISTS (
                  SELECT 1 FROM inventory_master im
                  WHERE im.INVENTRY_SUB_CATEGORY_ID = sc.ID 
                    AND im.PARENT_ID = 0
                    AND (
                        im.PARENT_ID = 0 -- Non-variant inventory
                        OR EXISTS ( -- Inventory has variants
                            SELECT 1 FROM inventory_master v
                            WHERE v.PARENT_ID = im.ID AND im.STATUS = 1
                        )
                    )
              )
        )
    )
) AS hierarchy
FROM inventory_category_master c
WHERE c.IS_ACTIVE = 1
AND EXISTS (
    SELECT 1 FROM inventory_sub_category sc 
    WHERE sc.INVENTRY_CATEGORY_ID = c.ID 
      AND sc.IS_ACTIVE = 1
      AND EXISTS (
          SELECT 1 FROM inventory_master im
          WHERE im.INVENTRY_SUB_CATEGORY_ID = sc.ID 
            AND im.PARENT_ID = 0
             AND im.STATUS = 1
            AND (
                im.PARENT_ID = 0 -- Non-variant inventory
                OR EXISTS ( -- Inventory has variants
                    SELECT 1 FROM inventory_master v
                    WHERE v.PARENT_ID = im.ID AND im.STATUS = 1
                )
            )
      )
) `;

            mm.executeQuery(Query + criteria, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventory information."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "success",
                        "TAB_ID": 32,
                        "data": results
                    });
                }
            });
        }
        else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.getCustomItemHirarchy = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';
    let INVENTORY_TRACKING_TYPE = req.body.INVENTORY_TRACKING_TYPE ? req.body.INVENTORY_TRACKING_TYPE : '';
    let trackingFilter = "";
    let warehouseFilter = "";
    let customerFileter = "";
    let technicianFilter = ""
    let IS_W_MANAGER = req.body.IS_W_MANAGER ? req.body.IS_W_MANAGER : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    let WAREHOUSE_ID = req.body.WAREHOUSE_ID ? req.body.WAREHOUSE_ID : '';
    let IS_FIRST = req.body.IS_FIRST ? req.body.IS_FIRST : '';
    let MOVMENT_TYPE = req.body.MOVMENT_TYPE
    let typeFilter = ""
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : '';

    if (INVENTORY_TRACKING_TYPE) {
        trackingFilter = ` AND im.INVENTORY_TRACKING_TYPE =("${INVENTORY_TRACKING_TYPE}" OR im.INVENTORY_TRACKING_TYPE IS NULL) `;
    }
    if (CUSTOMER_ID && TECHNICIAN_ID) {
        console.log("customer id", CUSTOMER_ID);
        customerFileter = ` AND im.ID IN (select DISTINCT INVENTORY_ID from inventory_request_details where STATUS="AC" AND CUSTOMER_ID = ${CUSTOMER_ID} AND INVENTORY_ID <> 0 AND TECHNICIAN_ID = ${TECHNICIAN_ID}) `;
        console.log("customerFileter", customerFileter);

    }
    if (IS_FIRST === 0) {
        console.log("customer id", CUSTOMER_ID);
        if (IS_W_MANAGER) {
            technicianFilter = " AND im.ID IN (SELECT INVENTORY_ID FROM view_inventory_technician_movement_details WHERE TECHNICIAN_ID = " + TECHNICIAN_ID + ")";
        }
        if (WAREHOUSE_ID) {
            warehouseFilter = " AND im.ID IN (SELECT INVENTORY_ID FROM view_inventory_movement_details WHERE SOURCE_WAREHOUSE_ID = " + WAREHOUSE_ID + ")";
        }

    }

    if (MOVMENT_TYPE == "T" || MOVMENT_TYPE == "W") {
        typeFilter = " AND im.INVENTORY_TYPE IN('B','S')";
    }
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
            var Query = `SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CAST(c.ID AS CHAR),
                    'ID', c.ID,
                    'title', c.CATEGORY_NAME,
                    'disabled', 1,
                    'children', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'key', CONCAT(CAST(c.ID AS CHAR), '-', CAST(sc.ID AS CHAR)),
                                'ID', sc.ID,
                                'title', sc.NAME,
                                'disabled', 1,
                                'children', (
                                    SELECT JSON_ARRAYAGG(
                                        JSON_OBJECT(
                                            'key', CONCAT(CAST(c.ID AS CHAR), '-', CAST(sc.ID AS CHAR), '-', CAST(im.ID AS CHAR)),
                                            'ID', im.ID,
                                            'isLeaf', true,
                                            'title', im.ITEM_NAME,
                                            'details', JSON_OBJECT(
                                                'ID', im.ID,
                                                'ITEM_NAME', im.ITEM_NAME,
                                                'INVENTORY_CATEGORY_ID', im.INVENTORY_CATEGORY_ID,
                                                'INVENTRY_SUB_CATEGORY_ID', im.INVENTRY_SUB_CATEGORY_ID,
                                                'DATE_OF_ENTRY', im.DATE_OF_ENTRY,
                                                'STATUS', im.STATUS,
                                                'SELLING_PRICE', im.SELLING_PRICE,
                                                'DESCRIPTION', im.DESCRIPTION,
                                                'INVENTORY_CATEGORY_NAME', im.INVENTORY_CATEGORY_NAME,
                                                'INVENTRY_SUB_CATEGORY_NAME', im.INVENTRY_SUB_CATEGORY_NAME,
                                                'BASE_UNIT_ID', im.BASE_UNIT_ID,
                                                'BASE_UNIT_NAME', im.BASE_UNIT_NAME,
                                                'BASE_QUANTITY', im.BASE_QUANTITY,
                                                'PARENT_ID', im.PARENT_ID,
                                                'SHORT_CODE', im.SHORT_CODE,
                                                'AVG_LEVEL', im.AVG_LEVEL,
                                                'REORDER_STOCK_LEVEL', im.REORDER_STOCK_LEVEL,
                                                'ALERT_STOCK_LEVEL', im.ALERT_STOCK_LEVEL,
                                                'HSN_ID', im.HSN_ID,
                                                'HSN_NAME', im.HSN_NAME,
                                                'TAX_PREFERENCE', im.TAX_PREFERENCE,
                                                'TAX_ID', im.TAX_ID,
                                                'TAX_NAME', im.TAX_NAME,
                                                'VARIANT_NAME', im.VARIANT_NAME,
                                                'IS_HAVE_VARIANTS', im.IS_HAVE_VARIANTS,
                                                'IS_VERIENT', im.IS_VERIENT,
                                                'IS_SET', im.IS_SET,
                                                'IS_NEW', im.IS_NEW,
                                                'VARIANT_COMBINATION', im.VARIANT_COMBINATION,
                                                'SKU_CODE', im.SKU_CODE,
                                                'INVENTORY_TRACKING_TYPE', im.INVENTORY_TRACKING_TYPE,
                                                'WARRANTY_ALLOWED', im.WARRANTY_ALLOWED,
                                                'GUARANTEE_ALLOWED', im.GUARANTEE_ALLOWED,
                                                'EXPIRY_DATE_ALLOWED', im.EXPIRY_DATE_ALLOWED,
                                                'INVENTORY_TYPE',im.INVENTORY_TYPE
                                            )
                                        )
                                    )
                                    FROM view_inventory_master im
                                    WHERE im.INVENTORY_CATEGORY_ID = c.ID
                                      AND im.INVENTRY_SUB_CATEGORY_ID = sc.ID
                                      AND im.PARENT_ID = 0
                                      AND im.STATUS = 1
                                      ${trackingFilter}  ${technicianFilter} ${warehouseFilter} ${typeFilter} ${customerFileter}-- Apply filter here
                                      AND (
                                          im.PARENT_ID = 0 -- Include inventories that are not variants
                                          OR EXISTS ( -- Ensure variants exist if IS_HAVE_VARIANTS = 1
                                              SELECT 1 FROM view_inventory_master v
                                              WHERE v.PARENT_ID = im.ID AND im.STATUS = 1
                                          )
                                      )
                                )
                            )
                        )
                        FROM inventory_sub_category sc
                        WHERE sc.INVENTRY_CATEGORY_ID = c.ID
                          AND sc.IS_ACTIVE = 1
                          AND EXISTS (
                              SELECT 1 FROM view_inventory_master im
                              WHERE im.INVENTRY_SUB_CATEGORY_ID = sc.ID
                                AND im.PARENT_ID = 0
                                AND im.STATUS = 1
                               ${trackingFilter}  ${technicianFilter} ${warehouseFilter} ${typeFilter} ${customerFileter}  -- Apply filter here
                                AND (
                                    im.PARENT_ID = 0 -- Non-variant inventory
                                    OR EXISTS ( -- Inventory has variants
                                        SELECT 1 FROM view_inventory_master v
                                        WHERE v.PARENT_ID = im.ID AND im.STATUS = 1
                                    )
                                )
                          )
                    )
                )
            ) AS hierarchy
            FROM inventory_category_master c
            WHERE c.IS_ACTIVE = 1
            AND EXISTS (
                SELECT 1 FROM inventory_sub_category sc
                WHERE sc.INVENTRY_CATEGORY_ID = c.ID
                  AND sc.IS_ACTIVE = 1
                  AND EXISTS (
                      SELECT 1 FROM view_inventory_master im
                      WHERE im.INVENTRY_SUB_CATEGORY_ID = sc.ID
                        AND im.PARENT_ID = 0
                        AND im.STATUS = 1
                        ${trackingFilter}  ${technicianFilter} ${warehouseFilter} ${typeFilter} ${customerFileter}-- Apply filter here
                        AND (
                            im.PARENT_ID = 0 -- Non-variant inventory
                            OR EXISTS ( -- Inventory has variants
                                SELECT 1 FROM view_inventory_master v
                                WHERE v.PARENT_ID = im.ID AND im.STATUS = 1
                            )
                        )
                  )
            )`;

            mm.executeQuery(Query + criteria, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventory information."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "success",
                        "TAB_ID": 32,
                        "data": results
                    });
                }
            });
        }
        else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.getInventoryStock = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ACTUAL_UNIT_ID';
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
        criteria = filter + " GROUP BY ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from view_inventory_account_transaction where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory count.",
                    });
                }
                else {
                    let stockQuery = `SELECT ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME, SUM(IN_QTY) - SUM(OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction WHERE 1 `
                    mm.executeQuery(stockQuery + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 32,
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

exports.getInventoryUniqueNo = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'BATCH_NO';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;
    let INVENTORY_TRACKING_TYPE = req.body.INVENTORY_TRACKING_TYPE
    let UNIQUE_NUMBER = ""
    INVENTORY_TRACKING_TYPE == "B" ? UNIQUE_NUMBER = "BATCH_NO" : UNIQUE_NUMBER = "SERIAL_NO"

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY " + UNIQUE_NUMBER + " HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0 order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY " + UNIQUE_NUMBER + " HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0 order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(DISTINCT ${UNIQUE_NUMBER}) as cnt from inventory_account_transaction where 1 ` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory count.",
                    });
                }
                else {
                    mm.executeQuery(`select DISTINCT ${UNIQUE_NUMBER} from inventory_account_transaction where 1 ` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
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

exports.getDetailedInventoryStock = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ITEM_ID';
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
        criteria = " order by " + sortKey + " " + sortValue;
    else
        criteria = " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`SELECT COUNT(DISTINCT ITEM_ID) AS cnt FROM view_inventory_account_transaction WHERE 1 ` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory count.",
                    });
                }
                else {
                    const detailedQuery = `SELECT
    ITEM_ID,
    QUANTITY_PER_UNIT,
    INVENTORY_TRACKING_TYPE,
    ITEM_NAME,
    ACTUAL_UNIT_ID,
    ACTUAL_UNIT_NAME,
    IS_VERIENT,
    PARENT_ID,
    VARIANT_COMBINATION,
    CASE
        WHEN INVENTORY_TRACKING_TYPE = 'B' THEN BATCH_NO
        WHEN INVENTORY_TRACKING_TYPE = 'S' THEN SERIAL_NO
        ELSE 'N'
    END AS UNIQUE_NO,
    SUM(IN_QTY) AS IN_QTY,
    SUM(OUT_QTY) AS OUT_QTY,
    SUM(IN_QTY) - SUM(OUT_QTY) AS CURRENT_STOCK
FROM view_inventory_account_transaction
WHERE 1 ${filter}
GROUP BY ITEM_ID,PARENT_ID, INVENTORY_TRACKING_TYPE, ITEM_NAME, ACTUAL_UNIT_ID, ACTUAL_UNIT_NAME, UNIQUE_NO,IS_VERIENT,QUANTITY_PER_UNIT,VARIANT_COMBINATION HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0 ${criteria};`
                    mm.executeQuery(detailedQuery, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 32,
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

exports.addOrUpdateInventory = (req, res) => {
    const data = req.body.DATA;
    const supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate()
    let isShortCodeExist = false
    let errorMsg = ''
    try {
        var Logarray = []
        var Logarray2 = []
        const connection = mm.openConnection();
        const seen = new Set();
        const duplicate = data.find(i => {
            if (seen.has(i.SHORT_CODE)) return true;
            seen.add(i.SHORT_CODE);
        });
        if (duplicate) {
            mm.rollbackConnection(connection);
            console.log(`Duplicate SHORT_CODE "${duplicate.SHORT_CODE}" found in item "${duplicate.ITEM_NAME}".`);
            return res.send({
                "code": 300,
                "message": `The entered short code for the inventory ${duplicate.VARIANT_COMBINATION} already exists.`,
                // "message": `An inventory ${duplicate.VARIANT_COMBINATION} with the same short code already exists.`
            });
        }
        async.eachSeries(data, (inventoryItem, inner_callback) => {
            mm.executeDML(`SELECT * FROM inventory_master WHERE ID = ? OR SHORT_CODE = ?`, [inventoryItem.ID, inventoryItem.SHORT_CODE], supportKey, connection, (error, existingRecord) => {
                if (error) {
                    console.log("Error log ", error);
                    inner_callback(error);
                } else {
                    if (existingRecord.length > 0) {
                        if (existingRecord[0].SHORT_CODE === inventoryItem.SHORT_CODE && existingRecord[0].ID !== inventoryItem.ID) {
                            console.log(`\n\n\n\n An inventory item with ${inventoryItem.VARIANT_COMBINATION} the same short code already exists.`);
                            isShortCodeExist = true
                            errorMsg = `The entered short code for the inventory ${inventoryItem.VARIANT_COMBINATION} already exists.`;
                            return inner_callback(null);
                        } else {
                            mm.executeDML(`UPDATE inventory_master SET  ITEM_NAME = ?, INVENTORY_CATEGORY_ID = ?, INVENTRY_SUB_CATEGORY_ID = ?, DATE_OF_ENTRY = ?,  STATUS = ?,SELLING_PRICE = ?, CLIENT_ID = ?,  DESCRIPTION = ?,   INVENTORY_CATEGORY_NAME = ?,INVENTRY_SUB_CATEGORY_NAME = ?, BASE_UNIT_ID = ?,  BASE_UNIT_NAME = ?,BASE_QUANTITY = ?, PARENT_ID = ?, SHORT_CODE = ?,  AVG_LEVEL = ?,  REORDER_STOCK_LEVEL = ?,  ALERT_STOCK_LEVEL = ?,  HSN_ID = ?,HSN_NAME = ?, TAX_PREFERENCE = ?, TAX_ID = ?,  TAX_NAME = ?, IS_HAVE_VARIANTS = ?, IS_SET = ?,  VARIANT_COMBINATION=?,CREATED_MODIFIED_DATE = ?,SKU_CODE=?,
                        IS_NEW=?,INVENTORY_TRACKING_TYPE = ?,WARRANTY_ALLOWED = ?,GUARANTEE_ALLOWED = ?,EXPIRY_DATE_ALLOWED = ?,INVENTORY_TYPE = ?,RETURN_ALOW=?, BRAND_ID=?, BRAND_NAME=?, WARRANTY_PERIOD = ?, GUARANTEE_PERIOD = ?, DISCOUNT_ALLOWED = ?, DISCOUNTED_PRICE = ?, RETURN_ALLOW_PERIOD = ?, REPLACEMENT_ALLOW = ?, REPLACEMENT_PERIOD = ?, EXPECTED_DELIVERY_IN_DAYS = ?,WEIGHT = ?,LENGTH = ?,BREADTH = ?,HEIGHT = ?,EXPECTED_DELIVERY_CHARGES = ?,WARRANTY_CARD = ?,BASE_PRICE = ?,DISCOUNTED_PERCENTAGE = ?,INVENTORY_DETAILS_IMAGE=?,IS_REFURBISHED = ? WHERE ID = ?`, [
                                inventoryItem.ITEM_NAME, inventoryItem.INVENTORY_CATEGORY_ID, inventoryItem.INVENTRY_SUB_CATEGORY_ID, inventoryItem.DATE_OF_ENTRY, inventoryItem.STATUS, inventoryItem.SELLING_PRICE, 1, inventoryItem.DESCRIPTION, inventoryItem.INVENTORY_CATEGORY_NAME, inventoryItem.INVENTRY_SUB_CATEGORY_NAME, inventoryItem.BASE_UNIT_ID, inventoryItem.BASE_UNIT_NAME, inventoryItem.BASE_QUANTITY, inventoryItem.PARENT_ID, inventoryItem.SHORT_CODE, inventoryItem.AVG_LEVEL, inventoryItem.REORDER_STOCK_LEVEL, inventoryItem.ALERT_STOCK_LEVEL, inventoryItem.HSN_ID, inventoryItem.HSN_NAME, inventoryItem.TAX_PREFERENCE, inventoryItem.TAX_ID, inventoryItem.TAX_NAME, inventoryItem.IS_HAVE_VARIANTS, inventoryItem.IS_SET, inventoryItem.VARIANT_COMBINATION, systemDate, inventoryItem.SKU_CODE, inventoryItem.IS_NEW, inventoryItem.INVENTORY_TRACKING_TYPE, inventoryItem.WARRANTY_ALLOWED, inventoryItem.GUARANTEE_ALLOWED, inventoryItem.EXPIRY_DATE_ALLOWED, inventoryItem.INVENTORY_TYPE, inventoryItem.RETURN_ALOW, inventoryItem.BRAND_ID, inventoryItem.BRAND_NAME, inventoryItem.WARRANTY_PERIOD, inventoryItem.GUARANTEE_PERIOD, inventoryItem.DISCOUNT_ALLOWED, inventoryItem.DISCOUNTED_PRICE, inventoryItem.RETURN_ALLOW_PERIOD, inventoryItem.REPLACEMENT_ALLOW, inventoryItem.REPLACEMENT_PERIOD, inventoryItem.EXPECTED_DELIVERY_IN_DAYS, inventoryItem.WEIGHT, inventoryItem.LENGTH, inventoryItem.BREADTH, inventoryItem.HEIGHT, inventoryItem.EXPECTED_DELIVERY_CHARGES, inventoryItem.WARRANTY_CARD, inventoryItem.BASE_PRICE, inventoryItem.DISCOUNTED_PERCENTAGE, inventoryItem.INVENTORY_DETAILS_IMAGE, inventoryItem.IS_REFURBISHED, inventoryItem.ID],
                                supportKey, connection, (error, updateResult) => {
                                    if (error) {
                                        console.log("Error log", error);
                                        inner_callback(error);
                                    } else {
                                        const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} modified details of ${inventoryItem.ITEM_NAME} for variant ${inventoryItem.VARIANT_COMBINATION} on ${systemDate}.`;
                                        trackData = {
                                            ITEM_ID: inventoryItem.ID,
                                            ITEM_NAME: inventoryItem.ITEM_NAME,
                                            ACTION_LOG: ACTION_LOG,
                                            AADED_BY: req.body.authData.data.UserData[0].NAME,
                                            WAREHOUSE_ID: inventoryItem.WAREHOUSE_ID,
                                            INVENTORY_CATEGORY_ID: inventoryItem.INVENTORY_CATEGORY_ID,
                                            INVENTRY_SUB_CATEGORY_ID: inventoryItem.INVENTRY_SUB_CATEGORY_ID,
                                            DATE_OF_ENTRY: systemDate,
                                            STATUS: inventoryItem.STATUS,
                                            SELLING_PRICE: inventoryItem.SELLING_PRICE,
                                            DESCRIPTION: inventoryItem.DESCRIPTION,
                                            INVENTORY_CATEGORY_NAME: inventoryItem.INVENTORY_CATEGORY_NAME,
                                            INVENTRY_SUB_CATEGORY_NAME: inventoryItem.INVENTRY_SUB_CATEGORY_NAME,
                                            BASE_UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                            BASE_UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                            BASE_QUANTITY: inventoryItem.BASE_QUANTITY,
                                            PARENT_ID: inventoryItem.PARENT_ID,
                                            SHORT_CODE: inventoryItem.SHORT_CODE,
                                            AVG_LEVEL: inventoryItem.AVG_LEVEL,
                                            REORDER_STOCK_LEVEL: inventoryItem.REORDER_STOCK_LEVEL,
                                            ALERT_STOCK_LEVEL: inventoryItem.ALERT_STOCK_LEVEL,
                                            HSN_ID: inventoryItem.HSN_ID,
                                            HSN_NAME: inventoryItem.HSN_NAME,
                                            TAX_PREFERENCE: inventoryItem.TAX_PREFERENCE,
                                            TAX_ID: inventoryItem.TAX_ID,
                                            TAX_NAME: inventoryItem.TAX_NAME,
                                            WAREHOUSE_NAME: inventoryItem.WAREHOUSE_NAME,
                                            IS_HAVE_VARIANTS: inventoryItem.IS_HAVE_VARIANTS,
                                            IS_SET: inventoryItem.IS_SET,
                                            SKU_CODE: inventoryItem.SKU_CODE,
                                            IS_NEW: inventoryItem.IS_NEW,
                                            VARIANT_COMBINATION: inventoryItem.VARIANT_COMBINATION,
                                            INVENTORY_TRACKING_TYPE: inventoryItem.INVENTORY_TRACKING_TYPE,
                                            WARRANTY_ALLOWED: inventoryItem.WARRANTY_ALLOWED,
                                            GUARANTEE_ALLOWED: inventoryItem.GUARANTEE_ALLOWED,
                                            EXPIRY_DATE_ALLOWED: inventoryItem.EXPIRY_DATE_ALLOWED,
                                            INVENTORY_TYPE: inventoryItem.INVENTORY_TYPE,
                                            RETURN_ALOW: inventoryItem.RETURN_ALOW,
                                            BRAND_ID: inventoryItem.BRAND_ID,
                                            BRAND_NAME: inventoryItem.BRAND_NAME,
                                            WARRANTY_PERIOD: inventoryItem.WARRANTY_PERIOD,
                                            GUARANTEE_PERIOD: inventoryItem.GUARANTEE_PERIOD,
                                            DISCOUNT_ALLOWED: inventoryItem.DISCOUNT_ALLOWED,
                                            DISCOUNTED_PRICE: inventoryItem.DISCOUNTED_PRICE,
                                            RETURN_ALLOW_PERIOD: inventoryItem.RETURN_ALLOW_PERIOD,
                                            REPLACEMENT_ALLOW: inventoryItem.REPLACEMENT_ALLOW,
                                            REPLACEMENT_PERIOD: inventoryItem.REPLACEMENT_PERIOD,
                                            EXPECTED_DELIVERY_IN_DAYS: inventoryItem.EXPECTED_DELIVERY_IN_DAYS,
                                            WARRANTY_CARD: inventoryItem.WARRANTY_CARD,
                                            RATING: inventoryItem.RATING,
                                            BASE_PRICE: inventoryItem.BASE_PRICE,
                                            DISCOUNTED_PERCENTAGE: inventoryItem.DISCOUNTED_PERCENTAGE,
                                            WEIGHT: inventoryItem.WEIGHT,
                                            LENGTH: inventoryItem.LENGTH,
                                            BREADTH: inventoryItem.BREADTH,
                                            HEIGHT: inventoryItem.HEIGHT,
                                            EXPECTED_DELIVERY_CHARGES: inventoryItem.EXPECTED_DELIVERY_CHARGES,
                                            IS_REFURBISHED: inventoryItem.IS_REFURBISHED
                                        }
                                        Logarray.push(trackData)
                                        const logData2 = {
                                            ACTION_TYPE: "Create",
                                            ACTION_DETAILS: ACTION_LOG,
                                            ACTION_DATE: new Date(),
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            INVENTORY_ID: inventoryItem.ID,
                                            INVENTORY_NAME: inventoryItem.ITEM_NAME,
                                            WAREHOUSE_ID: 0,
                                            WAREHOUSE_NAME: "",
                                            VARIANT_ID: inventoryItem.ID,
                                            VARIANT_NAME: inventoryItem.VARIANT_COMBINATION || "",
                                            QUANTITY: inventoryItem.QUANTITY,
                                            TOTAL_INWARD: 0,
                                            CURRENT_STOCK: 0,
                                            OLD_STOCK: 0 || 0,
                                            QUANTITY_PER_UNIT: inventoryItem.BASE_QUANTITY,
                                            UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                            UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                            REASON: "Inventory Inwarded",
                                            SOURCE_WAREHOUSE_ID: null,
                                            SOURCE_WAREHOUSE_NAME: "",
                                            DESTINATION_WAREHOUSE_ID: 0,
                                            DESTINATION_WAREHOUSE_NAME: "",
                                            REFERENCE_NO: inventoryItem.PO_NUMBER || "",
                                            STATUS: "COMPLETED",
                                            REMARK: inventoryItem.REMARK || ""
                                        };
                                        Logarray2.push(logData2);
                                        mm.sendNotificationToAdmin(8, "Inventory updated", `Hello Admin, Inventory item ${inventoryItem.ITEM_NAME} has been updated on ${systemDate}. Please review the changes and take necessary actions. `, "", "I", supportKey, "", "I", req.body);
                                        inner_callback(null);

                                    }
                                });
                        }
                    } else {
                        mm.executeDML(`INSERT INTO inventory_master (ITEM_NAME,  INVENTORY_CATEGORY_ID, INVENTRY_SUB_CATEGORY_ID, DATE_OF_ENTRY, STATUS, SELLING_PRICE, CLIENT_ID, DESCRIPTION, INVENTORY_CATEGORY_NAME, INVENTRY_SUB_CATEGORY_NAME, BASE_UNIT_ID, BASE_UNIT_NAME, BASE_QUANTITY, PARENT_ID, SHORT_CODE, AVG_LEVEL, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL, HSN_ID, HSN_NAME, TAX_PREFERENCE, TAX_ID, TAX_NAME, WAREHOUSE_NAME, IS_HAVE_VARIANTS, IS_SET, VARIANT_COMBINATION, SKU_CODE, IS_NEW,INVENTORY_TRACKING_TYPE, WARRANTY_ALLOWED, GUARANTEE_ALLOWED, EXPIRY_DATE_ALLOWED, INVENTORY_TYPE, RETURN_ALOW, BRAND_ID, BRAND_NAME,WARRANTY_PERIOD,GUARANTEE_PERIOD,DISCOUNT_ALLOWED,DISCOUNTED_PRICE,RETURN_ALLOW_PERIOD,REPLACEMENT_ALLOW,REPLACEMENT_PERIOD,EXPECTED_DELIVERY_IN_DAYS,WEIGHT,LENGTH,BREADTH,HEIGHT,EXPECTED_DELIVERY_CHARGES,WARRANTY_CARD,BASE_PRICE,DISCOUNTED_PERCENTAGE,INVENTORY_DETAILS_IMAGE,IS_REFURBISHED) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                            [
                                inventoryItem.ITEM_NAME, inventoryItem.INVENTORY_CATEGORY_ID, inventoryItem.INVENTRY_SUB_CATEGORY_ID, inventoryItem.DATE_OF_ENTRY, inventoryItem.STATUS, inventoryItem.SELLING_PRICE, "1", inventoryItem.DESCRIPTION, inventoryItem.INVENTORY_CATEGORY_NAME, inventoryItem.
                                    INVENTRY_SUB_CATEGORY_NAME, inventoryItem.BASE_UNIT_ID, inventoryItem.BASE_UNIT_NAME, inventoryItem.BASE_QUANTITY, inventoryItem.PARENT_ID, inventoryItem.SHORT_CODE, inventoryItem.AVG_LEVEL, inventoryItem.
                                    REORDER_STOCK_LEVEL, inventoryItem.ALERT_STOCK_LEVEL, inventoryItem.HSN_ID, inventoryItem.HSN_NAME, inventoryItem.TAX_PREFERENCE, inventoryItem.TAX_ID, inventoryItem.TAX_NAME, inventoryItem.
                                    WAREHOUSE_NAME, inventoryItem.IS_HAVE_VARIANTS, inventoryItem.IS_SET, inventoryItem.VARIANT_COMBINATION, inventoryItem.SKU_CODE, inventoryItem.IS_NEW, inventoryItem.INVENTORY_TRACKING_TYPE, inventoryItem.WARRANTY_ALLOWED, inventoryItem.GUARANTEE_ALLOWED, inventoryItem.EXPIRY_DATE_ALLOWED, inventoryItem.INVENTORY_TYPE, inventoryItem.RETURN_ALOW, inventoryItem.BRAND_ID, inventoryItem.BRAND_NAME, inventoryItem.WARRANTY_PERIOD, inventoryItem.GUARANTEE_PERIOD, inventoryItem.DISCOUNT_ALLOWED, inventoryItem.DISCOUNTED_PRICE, inventoryItem.RETURN_ALLOW_PERIOD, inventoryItem.REPLACEMENT_ALLOW, inventoryItem.REPLACEMENT_PERIOD, inventoryItem.EXPECTED_DELIVERY_IN_DAYS, inventoryItem.WEIGHT, inventoryItem.LENGTH, inventoryItem.BREADTH, inventoryItem.HEIGHT, inventoryItem.EXPECTED_DELIVERY_CHARGES, inventoryItem.WARRANTY_CARD, inventoryItem.BASE_PRICE, inventoryItem.DISCOUNTED_PERCENTAGE, inventoryItem.INVENTORY_DETAILS_IMAGE, inventoryItem.IS_REFURBISHED
                            ],
                            supportKey,
                            connection,
                            (error, insertResult) => {
                                if (error) {
                                    console.log("Error log ", error);
                                    inner_callback(error);
                                } else {
                                    mm.executeQueryData('INSERT INTO inventory_unit_mapping(ITEM_ID,QUANTITY,UNIT_ID,CATEGORY,CATEGORY_ID,QUANTITY_PER_UNIT,CLIENT_ID,AVG_LEVEL,REORDER_STOCK_LEVEL,ALERT_STOCK_LEVEL) values(?,?,?,?,?,?,?,?,?,?)', [insertResult.insertId, inventoryItem.QUANTITY, inventoryItem.BASE_UNIT_ID, inventoryItem.INVENTORY_CATEGORY_NAME, inventoryItem.INVENTORY_CATEGORY_ID, inventoryItem.BASE_QUANTITY, 1, inventoryItem.AVG_LEVEL, inventoryItem.REORDER_STOCK_LEVEL, inventoryItem.ALERT_STOCK_LEVEL], supportKey, (error, resultsUnit) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.status(400).json({
                                                "code": 400,
                                                "message": "Failed to save inventory information..."
                                            });
                                        }
                                        else {
                                            const ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has created new variant ${inventoryItem.VARIANT_COMBINATION} for item  ${inventoryItem.ITEM_NAME} on ${systemDate}.`;
                                            trackData = {
                                                ITEM_ID: insertResult.insertId,
                                                ITEM_NAME: inventoryItem.ITEM_NAME,
                                                ACTION_LOG: ACTION_LOG,
                                                WAREHOUSE_ID: inventoryItem.WAREHOUSE_ID,
                                                INVENTORY_CATEGORY_ID: inventoryItem.INVENTORY_CATEGORY_ID,
                                                INVENTRY_SUB_CATEGORY_ID: inventoryItem.INVENTRY_SUB_CATEGORY_ID,
                                                DATE_OF_ENTRY: systemDate,
                                                STATUS: inventoryItem.STATUS,
                                                SELLING_PRICE: inventoryItem.SELLING_PRICE,
                                                DESCRIPTION: inventoryItem.DESCRIPTION,
                                                INVENTORY_CATEGORY_NAME: inventoryItem.INVENTORY_CATEGORY_NAME,
                                                INVENTRY_SUB_CATEGORY_NAME: inventoryItem.INVENTRY_SUB_CATEGORY_NAME,
                                                BASE_UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                                BASE_UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                                BASE_QUANTITY: inventoryItem.BASE_QUANTITY,
                                                PARENT_ID: inventoryItem.PARENT_ID,
                                                SHORT_CODE: inventoryItem.SHORT_CODE,
                                                AVG_LEVEL: inventoryItem.AVG_LEVEL,
                                                REORDER_STOCK_LEVEL: inventoryItem.REORDER_STOCK_LEVEL,
                                                ALERT_STOCK_LEVEL: inventoryItem.ALERT_STOCK_LEVEL,
                                                HSN_ID: inventoryItem.HSN_ID,
                                                HSN_NAME: inventoryItem.HSN_NAME,
                                                TAX_PREFERENCE: inventoryItem.TAX_PREFERENCE,
                                                TAX_ID: inventoryItem.TAX_ID,
                                                TAX_NAME: inventoryItem.TAX_NAME,
                                                WAREHOUSE_NAME: inventoryItem.WAREHOUSE_NAME,
                                                IS_HAVE_VARIANTS: inventoryItem.IS_HAVE_VARIANTS,
                                                IS_SET: inventoryItem.IS_SET,
                                                SKU_CODE: inventoryItem.SKU_CODE,
                                                IS_NEW: inventoryItem.IS_NEW,
                                                VARIANT_COMBINATION: inventoryItem.VARIANT_COMBINATION,
                                                INVENTORY_TRACKING_TYPE: inventoryItem.INVENTORY_TRACKING_TYPE,
                                                WARRANTY_ALLOWED: inventoryItem.WARRANTY_ALLOWED,
                                                GUARANTEE_ALLOWED: inventoryItem.GUARANTEE_ALLOWED,
                                                EXPIRY_DATE_ALLOWED: inventoryItem.EXPIRY_DATE_ALLOWED,
                                                INVENTORY_TYPE: inventoryItem.INVENTORY_TYPE,
                                                RETURN_ALOW: inventoryItem.RETURN_ALOW,
                                                BRAND_ID: inventoryItem.BRAND_ID,
                                                BRAND_NAME: inventoryItem.BRAND_NAME,
                                                WARRANTY_PERIOD: inventoryItem.WARRANTY_PERIOD,
                                                GUARANTEE_PERIOD: inventoryItem.GUARANTEE_PERIOD,
                                                DISCOUNT_ALLOWED: inventoryItem.DISCOUNT_ALLOWED,
                                                DISCOUNTED_PRICE: inventoryItem.DISCOUNTED_PRICE,
                                                RETURN_ALLOW_PERIOD: inventoryItem.RETURN_ALLOW_PERIOD,
                                                REPLACEMENT_ALLOW: inventoryItem.REPLACEMENT_ALLOW,
                                                REPLACEMENT_PERIOD: inventoryItem.REPLACEMENT_PERIOD,
                                                EXPECTED_DELIVERY_IN_DAYS: inventoryItem.EXPECTED_DELIVERY_IN_DAYS,
                                                WARRANTY_CARD: inventoryItem.WARRANTY_CARD,
                                                RATING: inventoryItem.RATING,
                                                BASE_PRICE: inventoryItem.BASE_PRICE,
                                                DISCOUNTED_PERCENTAGE: inventoryItem.DISCOUNTED_PERCENTAGE,
                                                WEIGHT: inventoryItem.WEIGHT,
                                                LENGTH: inventoryItem.LENGTH,
                                                BREADTH: inventoryItem.BREADTH,
                                                HEIGHT: inventoryItem.HEIGHT,
                                                EXPECTED_DELIVERY_CHARGES: inventoryItem.EXPECTED_DELIVERY_CHARGES,
                                                IS_REFURBISHED: inventoryItem.IS_REFURBISHED
                                            }
                                            Logarray.push(trackData)
                                            const logData2 = {
                                                ACTION_TYPE: "Create",
                                                ACTION_DETAILS: ACTION_LOG,
                                                ACTION_DATE: new Date(),
                                                USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                INVENTORY_ID: insertResult.insertId,
                                                INVENTORY_NAME: inventoryItem.ITEM_NAME,
                                                WAREHOUSE_ID: 0,
                                                WAREHOUSE_NAME: "",
                                                VARIANT_ID: insertResult.insertId,
                                                VARIANT_NAME: inventoryItem.VARIANT_COMBINATION || "",
                                                QUANTITY: inventoryItem.QUANTITY,
                                                TOTAL_INWARD: 0,
                                                CURRENT_STOCK: 0,
                                                OLD_STOCK: 0 || 0,
                                                QUANTITY_PER_UNIT: inventoryItem.BASE_QUANTITY,
                                                UNIT_ID: inventoryItem.BASE_UNIT_ID,
                                                UNIT_NAME: inventoryItem.BASE_UNIT_NAME,
                                                REASON: "Inventory Inwarded",
                                                SOURCE_WAREHOUSE_ID: null,
                                                SOURCE_WAREHOUSE_NAME: "",
                                                DESTINATION_WAREHOUSE_ID: 0,
                                                DESTINATION_WAREHOUSE_NAME: "",
                                                REFERENCE_NO: inventoryItem.PO_NUMBER || "",
                                                STATUS: "COMPLETED",
                                                REMARK: inventoryItem.REMARK || ""
                                            };
                                            Logarray2.push(logData2);
                                            mm.sendNotificationToAdmin(8, "New Inventory Added", `Hello Admin, New inventory item ${inventoryItem.ITEM_NAME} was added to the system on ${systemDate}. Please review and update records if needed.`, "I", "I", supportKey, "I", req.body);
                                            mm.executeDML('SELECT * FROM warehouse_master WHERE STATUS=1 ', [], supportKey, connection, (error, results2) => {
                                                if (error) {
                                                    console.log(error);
                                                    inner_callback(error);
                                                }
                                                else {
                                                    if (results2.length > 0) {


                                                        var data2 = []
                                                        for (var i = 0; i < results2.length; i++) {
                                                            data2.push([results2[i].ID, insertResult.insertId, 0, 0, 1])
                                                        }
                                                        mm.executeDML('INSERT INTO inventory_warehouse_stock_management (WAREHOUSE_ID,ITEM_ID,TOTAL_INWARD,CURRENT_STOCK,CLIENT_ID) VALUES ?', [data2], supportKey, connection, (error, results) => {
                                                            if (error) {
                                                                console.log(error);
                                                                inner_callback(error);
                                                            }
                                                            else {
                                                                inner_callback();
                                                            }
                                                        });
                                                    } else {
                                                        inner_callback();
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    );
                                }
                            }
                        )
                    }
                }
            });

        }, (error) => {
            if (error) {
                mm.rollbackConnection(connection);
                res.status(400).json({
                    code: 400,
                    message: "Failed to process inventory data."
                });
            } else {
                if (isShortCodeExist) {
                    console.log("error", errorMsg);
                    res.status(200).json({
                        code: 300,
                        message: errorMsg
                    });
                } else {
                    console.log("errorbbbb", errorMsg);
                    dbm.saveLog(Logarray2, inwardLogSchema);
                    dbm.saveLog(Logarray, InventoryTrack)
                    mm.commitConnection(connection);
                    res.status(200).json({
                        code: 200,
                        message: "Inventory data processed successfully."
                    });
                }
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log("error", error);

        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
}

exports.createInventory = (req, res) => {

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
            const connection = mm.openConnection();
            mm.executeDML('SELECT SHORT_CODE FROM ' + inventoryMaster + ' WHERE SHORT_CODE = ?', data.SHORT_CODE, supportKey, connection, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save service information..."
                    });
                }
                else if (resultsCheck.length > 0) {
                    mm.rollbackConnection(connection);
                    return res.send({
                        "code": 300,
                        "message": "An item with the same short code already exists."
                    });
                }
                else {
                    mm.executeDML('INSERT INTO ' + inventoryMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to save inventory information..."
                            });
                        }
                        else {
                            mm.executeDML('INSERT INTO inventory_unit_mapping(ITEM_ID,QUANTITY,UNIT_ID,CATEGORY,CATEGORY_ID,QUANTITY_PER_UNIT,CLIENT_ID,AVG_LEVEL,REORDER_STOCK_LEVEL,ALERT_STOCK_LEVEL) values(?,?,?,?,?,?,?,?,?,?)', [results.insertId, data.QUANTITY, data.BASE_UNIT_ID, data.INVENTORY_CATEGORY_NAME, data.INVENTORY_CATEGORY_ID, data.BASE_QUANTITY, 1, data.AVG_LEVEL, data.REORDER_STOCK_LEVEL, data.ALERT_STOCK_LEVEL], supportKey, connection, (error, resultsUnit) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.status(400).json({
                                        "code": 400,
                                        "message": "Failed to save inventory information..."
                                    });
                                }
                                else {
                                    mm.executeDML('SELECT ID FROM warehouse_master WHERE STATUS=1 ', data, supportKey, connection, (error, results2) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            mm.rollbackConnection(connection);
                                            res.status(400).json({
                                                "code": 400,
                                                "message": "Failed to save inventory information..."
                                            });
                                        }
                                        else {
                                            if (results2.length > 0) {
                                                var data = []
                                                for (var i = 0; i < results2.length; i++) {
                                                    data.push([results2[i].ID, results.insertId, 0, 0, 1])
                                                }
                                                mm.executeDML('INSERT INTO inventory_warehouse_stock_management (WAREHOUSE_ID,ITEM_ID,TOTAL_INWARD,CURRENT_STOCK,CLIENT_ID) VALUES ?', [data], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection);
                                                        res.status(400).json({
                                                            "code": 400,
                                                            "message": "Failed to save inventory information..."
                                                        });
                                                    }
                                                    else {
                                                        let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has added new inventory ${req.body.ITEM_NAME} on ${mm.getSystemDate()}.`;
                                                        trackData = {
                                                            ITEM_ID: results.insertId,
                                                            ITEM_NAME: req.body.ITEM_NAME,
                                                            ACTION_LOG: ACTION_LOG,
                                                            WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                                                            INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                                                            INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                                                            DATE_OF_ENTRY: mm.getSystemDate(),
                                                            STATUS: req.body.STATUS,
                                                            SELLING_PRICE: req.body.SELLING_PRICE,
                                                            DESCRIPTION: req.body.DESCRIPTION,
                                                            INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                                                            INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                                                            BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                                                            BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                                                            BASE_QUANTITY: req.body.BASE_QUANTITY,
                                                            PARENT_ID: req.body.PARENT_ID,
                                                            SHORT_CODE: req.body.SHORT_CODE,
                                                            AVG_LEVEL: req.body.AVG_LEVEL,
                                                            REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                                                            ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                                                            HSN_ID: req.body.HSN_ID,
                                                            HSN_NAME: req.body.HSN_NAME,
                                                            TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                                                            TAX_ID: req.body.TAX_ID,
                                                            TAX_NAME: req.body.TAX_NAME,
                                                            WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                                                            IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                                                            IS_SET: req.body.IS_SET,
                                                            SKU_CODE: req.body.SKU_CODE,
                                                            IS_NEW: req.body.IS_NEW,
                                                            VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                                                            INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                                                            WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                                                            GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                                                            EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                                                            INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                                                            RETURN_ALOW: req.body.RETURN_ALOW,
                                                            BRAND_ID: req.body.BRAND_ID,
                                                            BRAND_NAME: req.body.BRAND_NAME,
                                                            WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                                                            GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                                                            DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                                                            DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                                                            RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                                                            REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                                                            REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                                                            EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                                                            WARRANTY_CARD: req.body.WARRANTY_CARD,
                                                            RATING: req.body.RATING,
                                                            BASE_PRICE: req.body.BASE_PRICE,
                                                            DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                                                            WEIGHT: req.body.WEIGHT,
                                                            LENGTH: req.body.LENGTH,
                                                            BREADTH: req.body.BREADTH,
                                                            HEIGHT: req.body.HEIGHT,
                                                            EXCPTED_DELIVERY_CHARGES: req.body.EXPECTED_DELIVERY_CHARGES,
                                                            IS_REFURBISHED: req.body.IS_REFURBISHED
                                                        }
                                                        dbm.saveLog(trackData, InventoryTrack)
                                                        const logData = {
                                                            ACTION_TYPE: "Create",
                                                            ACTION_DETAILS: ACTION_LOG,
                                                            ACTION_DATE: new Date(),
                                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                            INVENTORY_ID: results.insertId,
                                                            INVENTORY_NAME: req.body.ITEM_NAME,
                                                            WAREHOUSE_ID: 0,
                                                            WAREHOUSE_NAME: "",
                                                            VARIANT_ID: 0,
                                                            VARIANT_NAME: req.body.VARIANT_NAME || "",
                                                            QUANTITY: req.body.QUANTITY,
                                                            TOTAL_INWARD: 0,
                                                            CURRENT_STOCK: 0,
                                                            OLD_STOCK: 0 || 0,
                                                            QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
                                                            UNIT_ID: req.body.BASE_UNIT_ID,
                                                            UNIT_NAME: req.body.BASE_UNIT_NAME,
                                                            REASON: "Inventory Inwarded",
                                                            SOURCE_WAREHOUSE_ID: null,
                                                            SOURCE_WAREHOUSE_NAME: "",
                                                            DESTINATION_WAREHOUSE_ID: 0,
                                                            DESTINATION_WAREHOUSE_NAME: "",
                                                            REFERENCE_NO: req.body.PO_NUMBER || "",
                                                            STATUS: "COMPLETED",
                                                            REMARK: req.body.REMARK || ""
                                                        };
                                                        dbm.saveLog(logData, inwardLogSchema);
                                                        mm.commitConnection(connection);
                                                        mm.sendNotificationToAdmin(8, "New Inventory Added", `Hello Admin, New inventory item ${data.ITEM_NAME} was added to the system on ${mm.getSystemDate()}. Please review and update records if needed.`, "I", "I", supportKey, "I", req.body);
                                                        res.status(200).json({
                                                            'ID': results.insertId,
                                                            "code": 200,
                                                            "message": "Inventory information saved successfully...",
                                                        });
                                                    }
                                                });
                                            } else {
                                                let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has added new inventory ${req.body.ITEM_NAME} on ${mm.getSystemDate()}.`;
                                                trackData = {
                                                    ITEM_ID: results.insertId,
                                                    ITEM_NAME: req.body.ITEM_NAME,
                                                    ACTION_LOG: ACTION_LOG,
                                                    WAREHOUSE_ID: req.body.WAREHOUSE_ID,
                                                    INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
                                                    INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
                                                    DATE_OF_ENTRY: mm.getSystemDate(),
                                                    STATUS: req.body.STATUS,
                                                    SELLING_PRICE: req.body.SELLING_PRICE,
                                                    DESCRIPTION: req.body.DESCRIPTION,
                                                    INVENTORY_CATEGORY_NAME: req.body.INVENTORY_CATEGORY_NAME,
                                                    INVENTRY_SUB_CATEGORY_NAME: req.body.INVENTRY_SUB_CATEGORY_NAME,
                                                    BASE_UNIT_ID: req.body.BASE_UNIT_ID,
                                                    BASE_UNIT_NAME: req.body.BASE_UNIT_NAME,
                                                    BASE_QUANTITY: req.body.BASE_QUANTITY,
                                                    PARENT_ID: req.body.PARENT_ID,
                                                    SHORT_CODE: req.body.SHORT_CODE,
                                                    AVG_LEVEL: req.body.AVG_LEVEL,
                                                    REORDER_STOCK_LEVEL: req.body.REORDER_STOCK_LEVEL,
                                                    ALERT_STOCK_LEVEL: req.body.ALERT_STOCK_LEVEL,
                                                    HSN_ID: req.body.HSN_ID,
                                                    HSN_NAME: req.body.HSN_NAME,
                                                    TAX_PREFERENCE: req.body.TAX_PREFERENCE,
                                                    TAX_ID: req.body.TAX_ID,
                                                    TAX_NAME: req.body.TAX_NAME,
                                                    WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
                                                    IS_HAVE_VARIANTS: req.body.IS_HAVE_VARIANTS,
                                                    IS_SET: req.body.IS_SET,
                                                    SKU_CODE: req.body.SKU_CODE,
                                                    IS_NEW: req.body.IS_NEW,
                                                    VARIANT_COMBINATION: req.body.VARIANT_COMBINATION,
                                                    INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
                                                    WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
                                                    GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
                                                    EXPIRY_DATE_ALLOWED: req.body.EXPIRY_DATE_ALLOWED,
                                                    INVENTORY_TYPE: req.body.INVENTORY_TYPE,
                                                    RETURN_ALOW: req.body.RETURN_ALOW,
                                                    BRAND_ID: req.body.BRAND_ID,
                                                    BRAND_NAME: req.body.BRAND_NAME,
                                                    WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
                                                    GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD,
                                                    DISCOUNT_ALLOWED: req.body.DISCOUNT_ALLOWED,
                                                    DISCOUNTED_PRICE: req.body.DISCOUNTED_PRICE,
                                                    RETURN_ALLOW_PERIOD: req.body.RETURN_ALLOW_PERIOD,
                                                    REPLACEMENT_ALLOW: req.body.REPLACEMENT_ALLOW,
                                                    REPLACEMENT_PERIOD: req.body.REPLACEMENT_PERIOD,
                                                    EXPECTED_DELIVERY_IN_DAYS: req.body.EXPECTED_DELIVERY_IN_DAYS,
                                                    WARRANTY_CARD: req.body.WARRANTY_CARD,
                                                    RATING: req.body.RATING,
                                                    BASE_PRICE: req.body.BASE_PRICE,
                                                    DISCOUNTED_PERCENTAGE: req.body.DISCOUNTED_PERCENTAGE,
                                                    WEIGHT: req.body.WEIGHT,
                                                    LENGTH: req.body.LENGTH,
                                                    BREADTH: req.body.BREADTH,
                                                    HEIGHT: req.body.HEIGHT,
                                                    EXCPTED_DELIVERY_CHARGES: req.body.EXCPTED_DELIVERY_CHARGES,
                                                    IS_REFURBISHED: req.body.IS_REFURBISHED
                                                }
                                                dbm.saveLog(trackData, InventoryTrack)
                                                const logData = {
                                                    ACTION_TYPE: "Create",
                                                    ACTION_DETAILS: ACTION_LOG,
                                                    ACTION_DATE: new Date(),
                                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                    USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                    INVENTORY_ID: results.insertId,
                                                    INVENTORY_NAME: req.body.ITEM_NAME,
                                                    WAREHOUSE_ID: 0,
                                                    WAREHOUSE_NAME: "",
                                                    VARIANT_ID: 0,
                                                    VARIANT_NAME: req.body.VARIANT_NAME || "",
                                                    QUANTITY: req.body.QUANTITY,
                                                    TOTAL_INWARD: 0,
                                                    CURRENT_STOCK: 0,
                                                    OLD_STOCK: 0 || 0,
                                                    QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
                                                    UNIT_ID: req.body.BASE_UNIT_ID,
                                                    UNIT_NAME: req.body.BASE_UNIT_NAME,
                                                    REASON: "Inventory Inwarded",
                                                    SOURCE_WAREHOUSE_ID: null,
                                                    SOURCE_WAREHOUSE_NAME: "",
                                                    DESTINATION_WAREHOUSE_ID: 0,
                                                    DESTINATION_WAREHOUSE_NAME: "",
                                                    REFERENCE_NO: req.body.PO_NUMBER || "",
                                                    STATUS: "COMPLETED",
                                                    REMARK: req.body.REMARK || ""
                                                };
                                                dbm.saveLog(logData, inwardLogSchema);
                                                mm.commitConnection(connection);
                                                res.status(200).json({
                                                    'ID': results.insertId,
                                                    "code": 200,
                                                    "message": "Inventory information saved successfully...",
                                                });
                                            }
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

exports.getItemsForTechnician = (req, res) => {

    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';

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
            mm.executeQueryData(`SELECT COUNT(*) AS cnt FROM view_inventory_technician_movement_details WHERE INVENTORY_ID IN (SELECT ITEM_ID FROM view_inventory_account_transaction WHERE TECHNICIAN_ID = ? GROUP BY ITEM_ID HAVING (SUM(IN_QTY) - SUM(OUT_QTY)) > 0) AND (SERIAL_NO NOT IN(SELECT SERIAL_NO FROM view_inventory_account_transaction WHERE TRANSACTION_TYPE = "D" AND TECHNICIAN_ID = ? and SERIAL_NUMBER <> "-") OR  BATCH_NO NOT IN(SELECT BATCH_NO FROM view_inventory_account_transaction WHERE TRANSACTION_TYPE = "D" AND TECHNICIAN_ID = ? and BATCH_NUMBER <> "-"))` + countCriteria, [TECHNICIAN_ID, TECHNICIAN_ID, TECHNICIAN_ID], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory count.",
                    });
                }
                else {

                    oldQuery = `'SELECT * FROM view_inventory_technician_movement_details WHERE INVENTORY_ID IN (SELECT ITEM_ID FROM view_inventory_account_transaction WHERE TECHNICIAN_ID = ? GROUP BY ITEM_ID HAVING (SUM(IN_QTY) - SUM(OUT_QTY)) > 0) AND (SERIAL_NO NOT IN(SELECT SERIAL_NO FROM view_inventory_account_transaction WHERE TRANSACTION_TYPE = "D" AND TECHNICIAN_ID = ? and SERIAL_NUMBER <> "-") OR  BATCH_NO NOT IN(SELECT BATCH_NO FROM view_inventory_account_transaction WHERE TRANSACTION_TYPE = "D" AND TECHNICIAN_ID = ? and BATCH_NUMBER <> "-"))' + criteria`
                    const QueryNNNNNNNNN = `
                    SELECT 
    m.*, 
    IFNULL(p.PENDING_QTY, 0) AS PENDING_REQUESTS,
    (m.QUANTITY - IFNULL(p.PENDING_QTY, 0)) AS AVAILABLE_QUANTITY
FROM 
    view_inventory_technician_movement_details m
LEFT JOIN (
    SELECT 
        TECHNICIAN_MOVEMENT_ID,
        INVENTORY_ID,
        TECHNICIAN_ID,
        BATCH_NO,
        SERIAL_NO,
        SUM(QUANTITY) AS PENDING_QTY
    FROM 
        inventory_request_details
    WHERE 
        TECHNICIAN_ID = 16 
        AND STATUS IN ('P', 'AC') 
        AND IS_RETURNED = 0 
        AND ARCHIVE_FLAG = 'F'
    GROUP BY 
        TECHNICIAN_MOVEMENT_ID, INVENTORY_ID, TECHNICIAN_ID, BATCH_NO, SERIAL_NO
) p ON 
    m.ID = p.TECHNICIAN_MOVEMENT_ID AND
    m.INVENTORY_ID = p.INVENTORY_ID AND
    m.TECHNICIAN_ID = p.TECHNICIAN_ID AND
    (m.BATCH_NO <=> p.BATCH_NO) AND
    (m.SERIAL_NO <=> p.SERIAL_NO)
WHERE 
    m.TECHNICIAN_ID = 16 AND
    m.INVENTORY_TYPE IN ('B','S') AND
    m.STATUS = 1 AND
    m.QUANTITY > 0 AND
    (m.QUANTITY - IFNULL(p.PENDING_QTY, 0)) > 0
ORDER BY 
    m.ID DESC;`

                    const QueryOLD = `SELECT
    m.*,
    IFNULL(p.PENDING_QTY, 0) AS PENDING_REQUESTS,
    IFNULL(r.RETURNED_QTY, 0) AS RETURNED_ITEMS,
    (m.QUANTITY - IFNULL(p.PENDING_QTY, 0) + IFNULL(r.RETURNED_QTY, 0)) AS AVAILABLE_QUANTITY
FROM
    view_inventory_technician_movement_details m
LEFT JOIN (
    SELECT
        TECHNICIAN_MOVEMENT_ID,
        INVENTORY_ID,
        TECHNICIAN_ID,
        BATCH_NO,
        SERIAL_NO,
        SUM(QUANTITY) AS PENDING_QTY
    FROM
        inventory_request_details
    WHERE
        TECHNICIAN_ID =  ${TECHNICIAN_ID}
        AND STATUS IN ('P')
        AND ARCHIVE_FLAG = 'F'
    GROUP BY
        TECHNICIAN_MOVEMENT_ID, INVENTORY_ID, TECHNICIAN_ID, BATCH_NO, SERIAL_NO
) p ON
    m.ID = p.TECHNICIAN_MOVEMENT_ID
    AND m.INVENTORY_ID = p.INVENTORY_ID
    AND m.TECHNICIAN_ID = p.TECHNICIAN_ID
    AND (m.BATCH_NO <=> p.BATCH_NO)
    AND (m.SERIAL_NO <=> p.SERIAL_NO)
LEFT JOIN (
    SELECT
        MOVEMENT_ID,
        INVENTORY_ID,
        BATCH_NO,
        SERIAL_NO,
        SUM(QUANTITY) AS RETURNED_QTY
    FROM
        inventory_customer_movement_details
    WHERE
        ARCHIVE_FLAG = 'F'
    GROUP BY
        MOVEMENT_ID, INVENTORY_ID, BATCH_NO, SERIAL_NO
) r ON
    m.ID = r.MOVEMENT_ID
    AND m.INVENTORY_ID = r.INVENTORY_ID
    AND (m.BATCH_NO <=> r.BATCH_NO)
    AND (m.SERIAL_NO <=> r.SERIAL_NO)
WHERE
    m.TECHNICIAN_ID = ${TECHNICIAN_ID}
    AND m.INVENTROY_SUB_CAT_ID = 5
    AND m.STATUS = 1
    AND m.INVENTORY_TYPE IN ('B', 'S')
    AND (m.QUANTITY - IFNULL(p.PENDING_QTY, 0) + IFNULL(r.RETURNED_QTY, 0)) > 0
ORDER BY
    m.ID DESC;
;`


                    //                     const Query = `SELECT m.*,IFNULL(p.PENDING_QTY,0) AS PENDING_REQUESTS,(m.QUANTITY-IFNULL(p.PENDING_QTY,0)) AS AVAILABLE_QUANTITY FROM view_inventory_technician_movement_details m LEFT JOIN (
                    // SELECT INVENTORY_ID,TECHNICIAN_ID,SUM(QUANTITY) AS PENDING_QTY,BATCH_NO,SERIAL_NO FROM inventory_request_details WHERE TECHNICIAN_ID=${TECHNICIAN_ID} AND STATUS IN('P','AC') AND ARCHIVE_FLAG='F' GROUP BY INVENTORY_ID,TECHNICIAN_ID,BATCH_NO,SERIAL_NO) p ON m.INVENTORY_ID=p.INVENTORY_ID AND m.TECHNICIAN_ID=p.TECHNICIAN_ID AND (m.BATCH_NO=p.BATCH_NO OR (m.BATCH_NO IS NULL AND p.BATCH_NO IS NULL)) AND (m.SERIAL_NO=p.SERIAL_NO OR (m.SERIAL_NO IS NULL AND p.SERIAL_NO IS NULL)) WHERE m.TECHNICIAN_ID=${TECHNICIAN_ID} AND m.INVENTORY_TYPE IN ('B','S') AND m.STATUS=1 AND (m.QUANTITY-IFNULL(p.PENDING_QTY,0))> 0 ORDER BY m.ID DESC;`





                    var Query=`SELECT m.*,IFNULL(p.PENDING_QTY,0) AS PENDING_REQUESTS,(m.QUANTITY-IFNULL(p.PENDING_QTY,0)) AS AVAILABLE_QUANTITY FROM view_inventory_technician_movement_details m LEFT JOIN (
                    SELECT INVENTORY_ID,TECHNICIAN_ID,SUM(QUANTITY) AS PENDING_QTY,BATCH_NO,SERIAL_NO FROM inventory_request_details WHERE TECHNICIAN_ID=${TECHNICIAN_ID} AND STATUS IN('P','AC') AND IS_RETURNED=0
                    AND ARCHIVE_FLAG='F' GROUP BY INVENTORY_ID,TECHNICIAN_ID,BATCH_NO,SERIAL_NO) p ON m.INVENTORY_ID=p.INVENTORY_ID AND m.TECHNICIAN_ID=p.TECHNICIAN_ID AND (m.BATCH_NO=p.BATCH_NO OR (m.BATCH_NO IS NULL AND p.BATCH_NO IS NULL)) AND (m.SERIAL_NO=p.SERIAL_NO OR (m.SERIAL_NO IS NULL AND p.SERIAL_NO IS NULL)) WHERE m.TECHNICIAN_ID=${TECHNICIAN_ID} AND m.INVENTORY_TYPE IN ('B','S') AND m.STATUS=1 AND m.QUANTITY> 0 AND (m.QUANTITY-IFNULL(p.PENDING_QTY,0)) >0
                    ORDER BY m.ID DESC;`
                    mm.executeQueryData(Query, [TECHNICIAN_ID, TECHNICIAN_ID, TECHNICIAN_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 32,
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

exports.updateStockforOrder = (req, res) => {
    let INVENTORY_DETAILS = req.body.INVENTORY_DETAILS;
    let WAREHOUSE_ID = req.body.WAREHOUSE_ID;
    let WAREHOUSE_NAME = req.body.WAREHOUSE_NAME;
    let ORDER_ID = req.body.ORDER_ID;
    let ORDER_NUMBER = req.body.ORDER_NUMBER;
    var IS_NO_STOCK;
    var itemName;
    var transactionData = [];
    let supportKey = "supportKey";

    try {
        if (INVENTORY_DETAILS && WAREHOUSE_ID && WAREHOUSE_NAME && ORDER_ID && ORDER_NUMBER) {
            const connection = mm.openConnection()
            async.eachSeries(INVENTORY_DETAILS, function processTechnician(item, inner_callback) {
                const QUANTITY = item.INVENTORY_TRACKING_TYPE === 'N' ? 1 : item.QUANTITY;
                const INOUT_QTY = item.INVENTORY_TRACKING_TYPE === 'N' ? item.QUANTITY : 1;

                const detailedQuery = `SELECT ITEM_ID,ITEM_NAME,IS_VERIENT,INVENTORY_TRACKING_TYPE,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,QUANTITY_PER_UNIT,CREATED_MODIFIED_DATE,PARENT_ID,
                    CASE WHEN INVENTORY_TRACKING_TYPE = 'B' THEN BATCH_NO 
                         WHEN INVENTORY_TRACKING_TYPE = 'S' THEN SERIAL_NO 
                         ELSE 'N' 
                    END AS UNIQUE_NO, 
                    SUM(IN_QTY) - SUM(OUT_QTY) AS CURRENT_STOCK 
                    FROM view_inventory_account_transaction 
                    WHERE INVENTORY_TRACKING_TYPE = ? 
                        AND WAREHOUSE_ID = ? 
                        AND ITEM_ID = ? 
                        AND ACTUAL_UNIT_ID = ? 
                        AND QUANTITY_PER_UNIT = ?
                    GROUP BY ITEM_ID, PARENT_ID, CREATED_MODIFIED_DATE, INVENTORY_TRACKING_TYPE, ITEM_NAME, 
                             ACTUAL_UNIT_ID, ACTUAL_UNIT_NAME, UNIQUE_NO, IS_VERIENT, QUANTITY_PER_UNIT, VARIANT_COMBINATION 
                    HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0  
                    ORDER BY CREATED_MODIFIED_DATE ASC 
                    LIMIT ${QUANTITY};`;

                mm.executeDML(detailedQuery, [item.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, item.ITEM_ID, item.UNIT_ID, item.QUANTITY_PER_UNIT], supportKey, connection, (error, InventoryData) => {
                    if (error) {
                        console.log(`Error log`, error);
                        return inner_callback(error);
                    } else {
                        if (!InventoryData || InventoryData.length === 0) {
                            error = "error"
                            IS_NO_STOCK = true;
                            itemName = item.ITEM_NAME;
                            return inner_callback(error);
                        } else {
                            let ACTION_LOG = "Updated stock for order " + ORDER_NUMBER + " by the system.";
                            InventoryData.forEach((inventory) => {
                                transactionData.push([
                                    ORDER_NUMBER, mm.getSystemDate(), "D", inventory.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID,
                                    0, 0, 0, 0, 0, "O",
                                    (inventory.INVENTORY_TRACKING_TYPE == 'B' ? inventory.UNIQUE_NO : ""),
                                    (inventory.INVENTORY_TRACKING_TYPE == 'S' ? inventory.UNIQUE_NO : ""),
                                    inventory.ITEM_ID, 0, INOUT_QTY,
                                    ACTION_LOG, 1, inventory.ACTUAL_UNIT_ID, inventory.ACTUAL_UNIT_NAME,
                                    inventory.IS_VERIENT, inventory.PARENT_ID, inventory.QUANTITY_PER_UNIT
                                ]);

                                transactionData.push([
                                    ORDER_NUMBER, mm.getSystemDate(), "C", inventory.INVENTORY_TRACKING_TYPE, 0,
                                    0, 0, 0, 0, ORDER_ID, "O",
                                    (inventory.INVENTORY_TRACKING_TYPE == 'B' ? inventory.UNIQUE_NO : ""),
                                    (inventory.INVENTORY_TRACKING_TYPE == 'S' ? inventory.UNIQUE_NO : ""),
                                    inventory.ITEM_ID, INOUT_QTY, 0,
                                    ACTION_LOG, 1, inventory.ACTUAL_UNIT_ID, inventory.ACTUAL_UNIT_NAME,
                                    inventory.IS_VERIENT, inventory.PARENT_ID, inventory.QUANTITY_PER_UNIT
                                ]);
                            });
                            return inner_callback(null);
                        }
                    }
                });
            }, function finalCallback(error) {
                if (error) {
                    mm.rollbackConnection(connection);
                    if (IS_NO_STOCK == true) {
                        res.send({
                            code: 300,
                            message: `There is no stock available for item ${itemName} in ${WAREHOUSE_NAME}.`
                        });
                    } else {
                        res.send({
                            code: 400,
                            message: "Failed to update Order Status."
                        });
                    }
                } else {
                    mm.commitConnection(connection);
                    res.send({
                        code: 200,
                        message: "Stock updated successfully.",
                        INVENTORY_DETAILS: transactionData
                    });
                }
            });
        } else {
            res.send({
                code: 400,
                message: "Invalid filter parameter."
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

exports.getPopularInvenotry = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : ' COUNT(ID)';
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


    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`SELECT * FROM view_inventory_master WHERE 1 AND STATUS = 1 AND ID IN (SELECT DISTINCT INVENTORY_ID FROM shop_order_details GROUP BY INVENTORY_ID,UNIT_ID ORDER BY COUNT(ID) DESC) ORDER BY ${sortKey} ${sortValue} LIMIT 10`, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventory information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "success",
                        "data": results
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

//for import bulk inventory
exports.importInventoryExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/inventoryExcel/${EXCEL_FILE_NAME}.xlsx`)

        const inventory = workbook.SheetNames[0];
        const inventorySheet = workbook.Sheets[inventory];
        const inventoryExcelData = xlsx.utils.sheet_to_json(inventorySheet);

        function excelDateToJSDate(serial) {
            return new Date((serial - 25569) * 86400 * 1000);
        }
        inventoryExcelData.forEach((row) => {
            ['DATE_OF_ENTRY']
                .forEach((field) => {
                    if (typeof row[field] === 'number') {
                        row[field] = excelDateToJSDate(row[field]);
                    }
                });
        });

        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        let LogArray = []
        let TrackArray = []
        async.eachSeries(inventoryExcelData, function iteratorOverElems(element, inner_callback) {
            mm.executeDML('INSERT INTO inventory_master (ITEM_NAME, CURRENT_STOCK, WAREHOUSE_ID, INVENTORY_CATEGORY_ID, INVENTRY_SUB_CATEGORY_ID, DATE_OF_ENTRY, STATUS, SELLING_PRICE, CLIENT_ID, DESCRIPTION, INVENTORY_CATEGORY_NAME, INVENTRY_SUB_CATEGORY_NAME, BASE_UNIT_ID, BASE_UNIT_NAME, BASE_QUANTITY, PARENT_ID, SHORT_CODE, AVG_LEVEL, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL, HSN_ID, HSN_NAME, TAX_PREFERENCE, TAX_ID, TAX_NAME, WAREHOUSE_NAME, IS_HAVE_VARIANTS, IS_SET, IS_NEW, VARIANT_COMBINATION, SKU_CODE, INVENTORY_TRACKING_TYPE, WARRANTY_ALLOWED, GUARANTEE_ALLOWED, EXPIRY_DATE_ALLOWED, INVENTORY_TYPE, RETURN_ALOW, BRAND_ID, BRAND_NAME, WARRANTY_PERIOD, GUARANTEE_PERIOD, DISCOUNT_ALLOWED, DISCOUNTED_PRICE, RETURN_ALLOW_PERIOD, REPLACEMENT_ALLOW, REPLACEMENT_PERIOD, EXPECTED_DELIVERY_IN_DAYS, WARRANTY_CARD, RATING, BASE_PRICE, DISCOUNTED_PERCENTAGE, WEIGHT, LENGTH, BREADTH, HEIGHT, EXPECTED_DELIVERY_CHARGES) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [element.ITEM_NAME, element.CURRENT_STOCK, element.WAREHOUSE_ID, element.INVENTORY_CATEGORY_ID, element.INVENTRY_SUB_CATEGORY_ID, element.DATE_OF_ENTRY, element.STATUS, element.SELLING_PRICE, "1", element.DESCRIPTION, element.INVENTORY_CATEGORY_NAME, element.INVENTRY_SUB_CATEGORY_NAME, element.BASE_UNIT_ID, element.BASE_UNIT_NAME, element.BASE_QUANTITY, element.PARENT_ID, element.SHORT_CODE, element.AVG_LEVEL, element.REORDER_STOCK_LEVEL, element.ALERT_STOCK_LEVEL, element.HSN_ID, element.HSN_NAME, element.TAX_PREFERENCE, element.TAX_ID, element.TAX_NAME, element.WAREHOUSE_NAME, element.IS_HAVE_VARIANTS, element.IS_SET, element.IS_NEW, element.VARIANT_COMBINATION, element.SKU_CODE, element.INVENTORY_TRACKING_TYPE, element.WARRANTY_ALLOWED, element.GUARANTEE_ALLOWED, element.EXPIRY_DATE_ALLOWED, element.INVENTORY_TYPE, element.RETURN_ALOW, element.BRAND_ID, element.BRAND_NAME, element.WARRANTY_PERIOD, element.GUARANTEE_PERIOD, element.DISCOUNT_ALLOWED, element.DISCOUNTED_PRICE, element.RETURN_ALLOW_PERIOD, element.REPLACEMENT_ALLOW, element.REPLACEMENT_PERIOD, element.EXPECTED_DELIVERY_IN_DAYS, element.WARRANTY_CARD, element.RATING, element.BASE_PRICE, element.DISCOUNTED_PERCENTAGE, element.WEIGHT, element.LENGTH, element.BREADTH, element.HEIGHT, element.EXPECTED_DELIVERY_CHARGES], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                }
                else {
                    mm.executeDML('INSERT INTO inventory_unit_mapping(ITEM_ID,QUANTITY,UNIT_ID,CATEGORY,CATEGORY_ID,QUANTITY_PER_UNIT,CLIENT_ID,AVG_LEVEL,REORDER_STOCK_LEVEL,ALERT_STOCK_LEVEL) values(?,?,?,?,?,?,?,?,?,?)', [results.insertId, element.QUANTITY, element.BASE_UNIT_ID, element.INVENTORY_CATEGORY_NAME, element.INVENTORY_CATEGORY_ID, element.BASE_QUANTITY, 1, element.AVG_LEVEL, element.REORDER_STOCK_LEVEL, element.ALERT_STOCK_LEVEL], supportKey, connection, (error, resultsUnit) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            console.log(error);
                            inner_callback(error);
                        }
                        else {
                            mm.executeDML('SELECT ID FROM warehouse_master WHERE STATUS=1 ', [], supportKey, connection, (error, results2) => {
                                if (error) {
                                    console.log(error);
                                    inner_callback(error);
                                }
                                else {
                                    if (results2.length > 0) {
                                        var data = []
                                        for (var i = 0; i < results2.length; i++) {
                                            data.push([results2[i].ID, results.insertId, 0, 0, 1])
                                        }
                                        mm.executeDML('INSERT INTO inventory_warehouse_stock_management (WAREHOUSE_ID,ITEM_ID,TOTAL_INWARD,CURRENT_STOCK,CLIENT_ID) VALUES ?', [data], supportKey, connection, (error, results) => {
                                            if (error) {
                                                console.log(error);
                                                inner_callback(error);
                                            }
                                            else {
                                                let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has added new inventory ${req.body.ITEM_NAME} on ${mm.getSystemDate()}.`;
                                                trackData = {
                                                    ITEM_ID: results.insertId,
                                                    ITEM_NAME: element.ITEM_NAME,
                                                    ACTION_LOG: ACTION_LOG,
                                                    WAREHOUSE_ID: element.WAREHOUSE_ID,
                                                    INVENTORY_CATEGORY_ID: element.INVENTORY_CATEGORY_ID,
                                                    INVENTRY_SUB_CATEGORY_ID: element.INVENTRY_SUB_CATEGORY_ID,
                                                    DATE_OF_ENTRY: mm.getSystemDate(),
                                                    STATUS: element.STATUS,
                                                    SELLING_PRICE: element.SELLING_PRICE,
                                                    DESCRIPTION: element.DESCRIPTION,
                                                    INVENTORY_CATEGORY_NAME: element.INVENTORY_CATEGORY_NAME,
                                                    INVENTRY_SUB_CATEGORY_NAME: element.INVENTRY_SUB_CATEGORY_NAME,
                                                    BASE_UNIT_ID: element.BASE_UNIT_ID,
                                                    BASE_UNIT_NAME: element.BASE_UNIT_NAME,
                                                    BASE_QUANTITY: element.BASE_QUANTITY,
                                                    PARENT_ID: element.PARENT_ID,
                                                    SHORT_CODE: element.SHORT_CODE,
                                                    AVG_LEVEL: element.AVG_LEVEL,
                                                    REORDER_STOCK_LEVEL: element.REORDER_STOCK_LEVEL,
                                                    ALERT_STOCK_LEVEL: element.ALERT_STOCK_LEVEL,
                                                    HSN_ID: element.HSN_ID,
                                                    HSN_NAME: element.HSN_NAME,
                                                    TAX_PREFERENCE: element.TAX_PREFERENCE,
                                                    TAX_ID: element.TAX_ID,
                                                    TAX_NAME: element.TAX_NAME,
                                                    WAREHOUSE_NAME: element.WAREHOUSE_NAME,
                                                    IS_HAVE_VARIANTS: element.IS_HAVE_VARIANTS,
                                                    IS_SET: element.IS_SET,
                                                    SKU_CODE: element.SKU_CODE,
                                                    IS_NEW: element.IS_NEW,
                                                    VARIANT_COMBINATION: element.VARIANT_COMBINATION,
                                                    INVENTORY_TRACKING_TYPE: element.INVENTORY_TRACKING_TYPE,
                                                    WARRANTY_ALLOWED: element.WARRANTY_ALLOWED,
                                                    GUARANTEE_ALLOWED: element.GUARANTEE_ALLOWED,
                                                    EXPIRY_DATE_ALLOWED: element.EXPIRY_DATE_ALLOWED,
                                                    INVENTORY_TYPE: element.INVENTORY_TYPE,
                                                    RETURN_ALOW: element.RETURN_ALOW,
                                                    BRAND_ID: element.BRAND_ID,
                                                    BRAND_NAME: element.BRAND_NAME,
                                                    WARRANTY_PERIOD: element.WARRANTY_PERIOD,
                                                    GUARANTEE_PERIOD: element.GUARANTEE_PERIOD,
                                                    DISCOUNT_ALLOWED: element.DISCOUNT_ALLOWED,
                                                    DISCOUNTED_PRICE: element.DISCOUNTED_PRICE,
                                                    RETURN_ALLOW_PERIOD: element.RETURN_ALLOW_PERIOD,
                                                    REPLACEMENT_ALLOW: element.REPLACEMENT_ALLOW,
                                                    REPLACEMENT_PERIOD: element.REPLACEMENT_PERIOD,
                                                    EXPECTED_DELIVERY_IN_DAYS: element.EXPECTED_DELIVERY_IN_DAYS,
                                                    WARRANTY_CARD: element.WARRANTY_CARD,
                                                    RATING: element.RATING,
                                                    BASE_PRICE: element.BASE_PRICE,
                                                    DISCOUNTED_PERCENTAGE: element.DISCOUNTED_PERCENTAGE,
                                                    WEIGHT: element.WEIGHT,
                                                    LENGTH: element.LENGTH,
                                                    BREADTH: element.BREADTH,
                                                    HEIGHT: element.HEIGHT
                                                }
                                                TrackArray.push(trackData)
                                                const logData = {
                                                    ACTION_TYPE: "Create",
                                                    ACTION_DETAILS: ACTION_LOG,
                                                    ACTION_DATE: new Date(),
                                                    USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                    USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                    INVENTORY_ID: results.insertId,
                                                    INVENTORY_NAME: element.ITEM_NAME,
                                                    WAREHOUSE_ID: 0,
                                                    WAREHOUSE_NAME: "",
                                                    VARIANT_ID: 0,
                                                    VARIANT_NAME: element.VARIANT_NAME || "",
                                                    QUANTITY: element.QUANTITY,
                                                    TOTAL_INWARD: 0,
                                                    CURRENT_STOCK: 0,
                                                    OLD_STOCK: 0 || 0,
                                                    QUANTITY_PER_UNIT: element.QUANTITY_PER_UNIT,
                                                    UNIT_ID: element.BASE_UNIT_ID,
                                                    UNIT_NAME: element.BASE_UNIT_NAME,
                                                    REASON: "Inventory Inwarded",
                                                    SOURCE_WAREHOUSE_ID: null,
                                                    SOURCE_WAREHOUSE_NAME: "",
                                                    DESTINATION_WAREHOUSE_ID: 0,
                                                    DESTINATION_WAREHOUSE_NAME: "",
                                                    REFERENCE_NO: element.PO_NUMBER || "",
                                                    STATUS: "COMPLETED",
                                                    REMARK: element.REMARK || ""
                                                };
                                                LogArray.push(logData)

                                                mm.sendNotificationToAdmin(8, "New Inventory Added", `Hello Admin, A new inventory item ${element.ITEM_NAME} was added to the system on ${mm.getSystemDate()}. Please review and update records if needed.`, "I", "I", supportKey, "I", req.body);
                                                inner_callback();
                                            }
                                        });
                                    } else {
                                        let ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has added new inventory ${element.ITEM_NAME} on ${mm.getSystemDate()}.`;
                                        trackData = {
                                            ITEM_ID: results.insertId,
                                            ITEM_NAME: element.ITEM_NAME,
                                            ACTION_LOG: ACTION_LOG,
                                            WAREHOUSE_ID: element.WAREHOUSE_ID,
                                            INVENTORY_CATEGORY_ID: element.INVENTORY_CATEGORY_ID,
                                            INVENTRY_SUB_CATEGORY_ID: element.INVENTRY_SUB_CATEGORY_ID,
                                            DATE_OF_ENTRY: mm.getSystemDate(),
                                            STATUS: element.STATUS,
                                            SELLING_PRICE: element.SELLING_PRICE,
                                            DESCRIPTION: element.DESCRIPTION,
                                            INVENTORY_CATEGORY_NAME: element.INVENTORY_CATEGORY_NAME,
                                            INVENTRY_SUB_CATEGORY_NAME: element.INVENTRY_SUB_CATEGORY_NAME,
                                            BASE_UNIT_ID: element.BASE_UNIT_ID,
                                            BASE_UNIT_NAME: element.BASE_UNIT_NAME,
                                            BASE_QUANTITY: element.BASE_QUANTITY,
                                            PARENT_ID: element.PARENT_ID,
                                            SHORT_CODE: element.SHORT_CODE,
                                            AVG_LEVEL: element.AVG_LEVEL,
                                            REORDER_STOCK_LEVEL: element.REORDER_STOCK_LEVEL,
                                            ALERT_STOCK_LEVEL: element.ALERT_STOCK_LEVEL,
                                            HSN_ID: element.HSN_ID,
                                            HSN_NAME: element.HSN_NAME,
                                            TAX_PREFERENCE: element.TAX_PREFERENCE,
                                            TAX_ID: element.TAX_ID,
                                            TAX_NAME: element.TAX_NAME,
                                            WAREHOUSE_NAME: element.WAREHOUSE_NAME,
                                            IS_HAVE_VARIANTS: element.IS_HAVE_VARIANTS,
                                            IS_SET: element.IS_SET,
                                            SKU_CODE: element.SKU_CODE,
                                            IS_NEW: element.IS_NEW,
                                            VARIANT_COMBINATION: element.VARIANT_COMBINATION,
                                            INVENTORY_TRACKING_TYPE: element.INVENTORY_TRACKING_TYPE,
                                            WARRANTY_ALLOWED: element.WARRANTY_ALLOWED,
                                            GUARANTEE_ALLOWED: element.GUARANTEE_ALLOWED,
                                            EXPIRY_DATE_ALLOWED: element.EXPIRY_DATE_ALLOWED,
                                            INVENTORY_TYPE: element.INVENTORY_TYPE,
                                            RETURN_ALOW: element.RETURN_ALOW,
                                            BRAND_ID: element.BRAND_ID,
                                            BRAND_NAME: element.BRAND_NAME,
                                            WARRANTY_PERIOD: element.WARRANTY_PERIOD,
                                            GUARANTEE_PERIOD: element.GUARANTEE_PERIOD,
                                            DISCOUNT_ALLOWED: element.DISCOUNT_ALLOWED,
                                            DISCOUNTED_PRICE: element.DISCOUNTED_PRICE,
                                            RETURN_ALLOW_PERIOD: element.RETURN_ALLOW_PERIOD,
                                            REPLACEMENT_ALLOW: element.REPLACEMENT_ALLOW,
                                            REPLACEMENT_PERIOD: element.REPLACEMENT_PERIOD,
                                            EXPECTED_DELIVERY_IN_DAYS: element.EXPECTED_DELIVERY_IN_DAYS,
                                            WARRANTY_CARD: element.WARRANTY_CARD,
                                            RATING: element.RATING,
                                            BASE_PRICE: element.BASE_PRICE,
                                            DISCOUNTED_PERCENTAGE: element.DISCOUNTED_PERCENTAGE,
                                            WEIGHT: element.WEIGHT,
                                            LENGTH: element.LENGTH,
                                            BREADTH: element.BREADTH,
                                            HEIGHT: element.HEIGHT
                                        }
                                        TrackArray.push(trackData)
                                        const logData = {
                                            ACTION_TYPE: "Create",
                                            ACTION_DETAILS: ACTION_LOG,
                                            ACTION_DATE: new Date(),
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            INVENTORY_ID: results.insertId,
                                            INVENTORY_NAME: element.ITEM_NAME,
                                            WAREHOUSE_ID: 0,
                                            WAREHOUSE_NAME: "",
                                            VARIANT_ID: 0,
                                            VARIANT_NAME: element.VARIANT_NAME || "",
                                            QUANTITY: element.QUANTITY,
                                            TOTAL_INWARD: 0,
                                            CURRENT_STOCK: 0,
                                            OLD_STOCK: 0 || 0,
                                            QUANTITY_PER_UNIT: element.QUANTITY_PER_UNIT,
                                            UNIT_ID: element.BASE_UNIT_ID,
                                            UNIT_NAME: element.BASE_UNIT_NAME,
                                            REASON: "Inventory Inwarded",
                                            SOURCE_WAREHOUSE_ID: null,
                                            SOURCE_WAREHOUSE_NAME: "",
                                            DESTINATION_WAREHOUSE_ID: 0,
                                            DESTINATION_WAREHOUSE_NAME: "",
                                            REFERENCE_NO: element.PO_NUMBER || "",
                                            STATUS: "COMPLETED",
                                            REMARK: element.REMARK || ""
                                        };
                                        LogArray.push(logData)
                                        inner_callback();
                                    }
                                }
                            });
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
                dbm.saveLog(TrackArray, InventoryTrack)
                dbm.saveLog(LogArray, inwardLogSchema);
                mm.commitConnection(connection);
                res.send({
                    code: 200,
                    message: "ServiceItem information created and logged successfully."
                });
            }
        });

    } catch (error) {
        console.log("Error in update method try block: ", error);
        res.send({
            "code": 400,
            "message": "Internal server error "
        });
    }
}
