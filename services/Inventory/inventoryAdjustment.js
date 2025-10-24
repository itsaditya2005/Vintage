const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
const applicationkey = process.env.APPLICATION_KEY;
var inventoryAdjustment = "inventory_adjustment";
const async = require('async');
var viewInventoryAdjustment = "view_" + inventoryAdjustment;

function reqData(req) {
    var data = {
        ITEM_ID: req.body.ITEM_ID,
        OLD_QTY: req.body.OLD_QTY,
        ADJUSTMENT_QUANTITY: req.body.ADJUSTMENT_QUANTITY,
        NEW_QTY: req.body.NEW_QTY,
        ADJUSTMENT_TYPE: req.body.ADJUSTMENT_TYPE,
        ADJUSTMENT_REASON: req.body.ADJUSTMENT_REASON,
        VARIANT_ID: req.body.VARIANT_ID,
        VARIENT_DETAILS_ID: req.body.VARIENT_DETAILS_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        ADJUSTED_DATETIME: req.body.ADJUSTED_DATETIME,
        ADJUSTED_BY: req.body.ADJUSTED_BY,
        CLIENT_ID: req.body.CLIENT_ID,
        ITEM_NAME: req.body.ITEM_NAME,
        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
        VARIANT_NAME: req.body.VARIANT_NAME,
        OLD_QTY: req.body.OLD_QTY,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_NAME: req.body.UNIT_NAME,
        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
        PO_NUMBER: req.body.PO_NUMBER,
        REMARK: req.body.REMARK
    }
    return data;
}

exports.validate = function () {
    return [
        body('ITEM_ID').isInt().optional(),
        body('OLD_QTY').isInt().optional(),
        body('ADJUSTMENT_QUANTITY').isInt().optional(),
        body('NEW_QTY').isInt().optional(),
        body('ADJUSTMENT_REASON').optional(),
        body('ADJUSTED_BY').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryAdjustment + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventoryAdjustment count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryAdjustment + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventoryAdjustment information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 29,
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
    const NEW_QTY = req.body.NEW_QTY
    const inventory_id = req.ID
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + inventoryAdjustment + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save inventoryAdjustment information..."
                    });
                }
                mm.executeQueryData('update inventory_master SET QUANTITY= ? where ID=? ', [NEW_QTY, data.ITEM_ID], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to save inventoryAdjustment information..."
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "InventoryAdjustment information saved successfully...",
                        });
                    }
                });
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
            mm.executeQueryData(`UPDATE ` + inventoryAdjustment + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update inventoryAdjustment information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "InventoryAdjustment information updated successfully...",
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


exports.adjustmentInventory = (req, res) => {
    let { CLIENT_ID, ADJUSTMENT_ARRAY, WAREHOUSE_NAME } = req.body;
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).send({
            code: 422,
            message: errors.array()
        });
    }

    if (!Array.isArray(ADJUSTMENT_ARRAY) || ADJUSTMENT_ARRAY.length === 0) {
        return res.status(400).send({
            code: 400,
            message: "ADJUSTMENT_ARRAY must be a non-empty array."
        });
    }

    const connection = mm.openConnection();
    const Logarray = [];

    try {
        async.eachSeries(
            ADJUSTMENT_ARRAY,
            (adjustmentItem, callback) => {
                const insertQuery = `
                    INSERT INTO inventory_adjustment 
                    (CLIENT_ID, ITEM_ID, OLD_QTY, ADJUSTMENT_QUANTITY, NEW_QTY, ADJUSTMENT_REASON, VARIANT_ID, 
                    WAREHOUSE_ID, ADJUSTED_DATETIME, ADJUSTED_BY, ITEM_NAME, WAREHOUSE_NAME, VARIANT_NAME, 
                    UNIT_ID, UNIT_NAME, ADJUSTMENT_TYPE, REMARK,IS_VERIENT, USER_ID,USER_NAME,UNIQUE_NO,INVENTORY_TRACKING_TYPE) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const insertValues = [
                    CLIENT_ID,
                    adjustmentItem.ITEM_ID,
                    adjustmentItem.OLD_QTY,
                    adjustmentItem.ADJUSTMENT_QUANTITY,
                    adjustmentItem.OLD_QTY - adjustmentItem.ADJUSTMENT_QUANTITY,
                    adjustmentItem.REMARK,
                    adjustmentItem.VARIANT_ID,
                    adjustmentItem.WAREHOUSE_ID,
                    mm.getSystemDate(),
                    req.body.authData.data.UserData[0].USER_ID,
                    adjustmentItem.ITEM_NAME,
                    adjustmentItem.WAREHOUSE_NAME,
                    adjustmentItem.VARIANT_NAME,
                    adjustmentItem.UNIT_ID,
                    adjustmentItem.UNIT_NAME,
                    adjustmentItem.ADJUSTMENT_TYPE,
                    adjustmentItem.REMARK,
                    adjustmentItem.IS_VERIENT,
                    req.body.authData.data.UserData[0].USER_ID,
                    req.body.authData.data.UserData[0].NAME,
                    adjustmentItem.UNIQUE_NO,
                    adjustmentItem.INVENTORY_TRACKING_TYPE
                ];

                mm.executeDML(insertQuery, insertValues, supportKey, connection, (error, results) => {
                    if (error) {
                        console.error(error);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                        return callback(error);
                    }

                    const updateQuery = `UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK = CURRENT_STOCK - ? WHERE ITEM_ID=? AND WAREHOUSE_ID=?`;
                    const updateValues = [adjustmentItem.ADJUSTMENT_QUANTITY, adjustmentItem.ITEM_ID, adjustmentItem.WAREHOUSE_ID];

                    mm.executeDML(updateQuery, updateValues, supportKey, connection, (error, results1) => {
                        if (error) {
                            console.error(error);
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            return callback(error);
                        }

                        mm.executeDML(`SELECT TRANSACTION_ID FROM inventory_account_transaction where GATEWAY_TYPE='A' order by id desc limit 1;`, [], supportKey, connection, (error, results1) => {
                            if (error) {
                                console.error(error);
                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                return callback(error);
                            }
                            var date = mm.getSystemDate().split(' ')[0].split("-");
                            const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has adjusted the stock for ${adjustmentItem.ITEM_NAME} in the warehouse ${adjustmentItem.WAREHOUSE_NAME}.`;
                            if (results1.length > 0) {
                                var LAST_ID = parseInt(results1[0].TRANSACTION_ID.split('/')[2].slice(-2));
                                var newLastId = (LAST_ID + 1).toString().padStart(2, '0');
                                var TRANSACTION_ID = `INW/${results.insertId}/${date[0]}${date[1]}${date[2]}${newLastId}`;
                            } else {
                                var TRANSACTION_ID = `INW/${results.insertId}/${date[0]}${date[1]}${date[2]}01`;
                            }
                            mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,ORDER_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [TRANSACTION_ID, mm.getSystemDate(), 'D', adjustmentItem.INVENTORY_TRACKING_TYPE, adjustmentItem.WAREHOUSE_ID, 0, results.insertId, 0, 0, 0, "A", (adjustmentItem.INVENTORY_TRACKING_TYPE == 'B' ? adjustmentItem.UNIQUE_NO : ""), (adjustmentItem.INVENTORY_TRACKING_TYPE == 'S' ? adjustmentItem.UNIQUE_NO : ""), adjustmentItem.ITEM_ID, 0, adjustmentItem.ADJUSTMENT_QUANTITY, ACTION_LOG, 1, adjustmentItem.UNIT_ID, adjustmentItem.UNIT_NAME, adjustmentItem.IS_VERIENT, adjustmentItem.PARENT_ID, adjustmentItem.QUANTITY_PER_UNIT], supportKey, connection, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    callback(error)
                                }
                                else {
                                    mm.executeDML(`UPDATE inventory_master SET CURRENT_STOCK = CURRENT_STOCK - ? WHERE ID=?`, [adjustmentItem.ADJUSTMENT_QUANTITY, adjustmentItem.ITEM_ID], supportKey, connection, (error, results1) => {
                                        if (error) {
                                            console.error(error);
                                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                            return callback(error);
                                        }
                                        const logData = {
                                            ACTION_TYPE: "Adjusted",
                                            ACTION_DETAILS: ACTION_LOG,
                                            ACTION_DATE: new Date(),
                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                            INVENTORY_ID: adjustmentItem.ITEM_ID,
                                            INVENTORY_NAME: adjustmentItem.ITEM_NAME,
                                            WAREHOUSE_ID: adjustmentItem.WAREHOUSE_ID,
                                            WAREHOUSE_NAME: adjustmentItem.WAREHOUSE_NAME,
                                            VARIANT_ID: adjustmentItem.VARIANT_ID,
                                            IS_VERIANT: adjustmentItem.IS_VERIENT,
                                            VARIANT_NAME: adjustmentItem.VARIANT_NAME || "",
                                            QUANTITY: adjustmentItem.ADJUSTMENT_QUANTITY,
                                            ADJUSTMENT_TYPE: adjustmentItem.ADJUSTMENT_TYPE,
                                            OLD_STOCK: adjustmentItem.OLD_QTY || 0,
                                            QUANTITY_PER_UNIT: adjustmentItem.QUANTITY_PER_UNIT || 0,
                                            UNIT_ID: adjustmentItem.UNIT_ID,
                                            UNIT_NAME: adjustmentItem.UNIT_NAME,
                                            REASON: adjustmentItem.REMARK || "",
                                            STATUS: "COMPLETED",
                                            REMARK: adjustmentItem.REMARK || ""
                                        };
                                        Logarray.push(logData);
                                        mm.sendNotificationToAdmin(8, "Inventory Adjustment", `Hello Admin, The stock of ${adjustmentItem.ITEM_NAME} has been adjusted on ${mm.getSystemDate()}. Please review the changes and ensure records are updated accordingly.`, "", "IA", supportKey, "I", req.body);
                                        callback();

                                    });
                                }
                            });
                        });
                    });
                });
            },
            (err) => {
                if (err) {
                    console.error(err);
                    mm.rollbackConnection(connection);
                    return res.status(400).send({
                        code: 400,
                        message: "Failed to save inventory adjustment information."
                    });
                }
                dbm.saveLog(Logarray, inwardLogSchema);
                mm.commitConnection(connection);
                res.status(200).send({
                    code: 200,
                    message: "Inventory adjustment information saved successfully."
                });
            }
        );
    } catch (error) {
        mm.rollbackConnection(connection);
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.error(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong."
        });
    }
};