const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');

var inventoryInward = "inventory_inward";
var viewInventoryInward = "view_" + inventoryInward;


function reqData(req) {

    var data = {
        ID: req.body.ID,
        PO_NUMBER: req.body.PO_NUMBER,
        INWARD_NO: req.body.INWARD_NO,
        INWARD_DATE: req.body.INWARD_DATE,
        IS_VARIANT: req.body.IS_VARIANT ? '1' : '0',
        INWARD_ITEM_ID: req.body.INWARD_ITEM_ID,
        INVENTORY_CATEGORY_ID: req.body.INVENTORY_CATEGORY_ID,
        INVENTRY_SUB_CATEGORY_ID: req.body.INVENTRY_SUB_CATEGORY_ID,
        QUANTITY: req.body.QUANTITY,
        QUANTITY_PER_UNIT: req.body.QUANTITY_PER_UNIT,
        UNIT_ID: req.body.UNIT_ID,
        INVENTORY_TRACKING_TYPE: req.body.INVENTORY_TRACKING_TYPE,
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        SKU_CODE: req.body.SKU_CODE,
        INWARD_VARIANT_ID: req.body.INWARD_VARIANT_ID,
        REMARK: req.body.REMARK,
        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('ID').isInt().optional(),
        body('PO_NUMBER').optional(),
        body('INWARD_NO').optional(),
        body('INWARD_DATE').optional(),
        body('INWARD_ITEM_ID').isInt().optional(),
        body('INVENTORY_CATEGORY_ID').isInt().optional(),
        body('INVENTRY_SUB_CATEGORY_ID').isInt().optional(),
        body('QUANTITY').isInt().optional(),
        body('QUANTITY_PER_UNIT').isInt().optional(),
        body('UNIT_ID').isInt().optional(),
        body('INVENTORY_TRACKING_TYPE').optional(),
        body('WAREHOUSE_ID').isInt().optional(),
        body('SKU_CODE').optional(),
        body('INWARD_VARIANT_ID').isInt().optional(),
        body('REMARK').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {

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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryInward + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get inventoryInward count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryInward + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get inventoryInward information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 197,
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
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}

exports.get = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var ID = req.params.id;
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
            mm.executeQueryData('select count(*) as cnt from ' + viewInventoryInward + ' where 1 AND ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get inventoryInward count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewInventoryInward + ' where 1 AND ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get inventoryInward information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 197,
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
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + inventoryInward + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save inventoryInward information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "InventoryInward information saved successfully...",
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
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + inventoryInward + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update inventoryInward information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "InventoryInward information updated successfully...",
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

exports.inwardInventory = (req, res) => {

    var INVENTORY_INWARD_DATA = req.body.INVENTORY_INWARD_DATA
    var supportKey = req.headers['supportkey'];
    let PO_NUMBER = req.body.INVENTORY_INWARD_DATA.PO_NUMBER
    let INWARD_DATE = mm.getSystemDate();
    let WAREHOUSE_ID = req.body.INVENTORY_INWARD_DATA.WAREHOUSE_ID
    let WAREHOUSE_NAME = req.body.INVENTORY_INWARD_DATA.WAREHOUSE_NAME
    var INVENTORY_DETAILS = req.body.INVENTORY_INWARD_DATA.INVENTORY_DETAILS

    try {
        let LogArray = []
        const connection = mm.openConnection()
        mm.executeDML(`SELECT * FROM inventory_inward ORDER BY ID DESC LIMIT 1  `, [], supportKey, connection, (error, inwardRes) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                logger.error(supportKey + 'inwardInventory' + req.method + " " + req.url + '' + JSON.stringify(error), applicationkey);
                res.status(400).json({
                    "message": "Failed to get inventory inward data."
                });
            } else {
                let systemDate = mm.getSystemDate();
                let newSequenceNumber = 1;
                if (inwardRes.length > 0) {
                    const lastOrderNumber = inwardRes[0].INWARD_NO;
                    const lastSequence = parseInt(lastOrderNumber.split('/')[2], 10);
                    newSequenceNumber = lastSequence + 1;
                }
                var datePart = systemDate.split(" ")[0].split("-").join('')
                const INWARD_NO = `INW/${datePart}/${String(newSequenceNumber).padStart(5, '0')}`;
                //  INWARD_NO;
                mm.executeDML('INSERT INTO inventory_inward (PO_NUMBER,INWARD_NO,INWARD_DATE,WAREHOUSE_ID,CLIENT_ID) VALUES (?,?,?,?,?)', [PO_NUMBER, INWARD_NO, INWARD_DATE, WAREHOUSE_ID, 1], supportKey, connection, (error, resultsInword) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to add inventory movement"
                        })
                    }
                    else {
                        var is_inwardId
                        async.eachSeries(INVENTORY_DETAILS, function iteratorOverElems(inwardData, callback) {
                            if (inwardData.INWARD_ITEM_ID != null && inwardData.INWARD_ITEM_ID != undefined && inwardData.INWARD_ITEM_ID != '') {
                                mm.executeDML('INSERT INTO inventory_inward_details (INWARD_MASTER_ID, UNIQUE_NO, GUARANTTEE_IN_DAYS, WARANTEE_IN_DAYS, EXPIRY_DATE,CLIENT_ID,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT, INWARD_ITEM_ID,INVENTORY_CATEGORY_ID,INVENTRY_SUB_CATEGORY_ID,QUANTITY, QUANTITY_PER_UNIT,UNIT_ID,PARENT_ID,SKU_CODE) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [resultsInword.insertId, inwardData.UNIQUE_NO, inwardData.GUARANTTEE_IN_DAYS, inwardData.WARANTEE_IN_DAYS, inwardData.EXPIRY_DATE, "1", inwardData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, inwardData.ACTUAL_UNIT_ID, inwardData.ACTUAL_UNIT_NAME, inwardData.IS_VARIANT, inwardData.INWARD_ITEM_ID, inwardData.INVENTORY_CATEGORY_ID, inwardData.INVENTRY_SUB_CATEGORY_ID, inwardData.QUANTITY, inwardData.QUANTITY_PER_UNIT, inwardData.UNIT_ID, inwardData.PARENT_ID, inwardData.SKU_CODE], supportKey, connection, (error, results2) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        callback(error)
                                    }
                                    else {
                                        mm.executeDML('SELECT TRANSACTION_ID from  inventory_account_transaction WHERE GATEWAY_TYPE="I" order by id desc limit 1;', [], supportKey, connection, (error, results1) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                callback(error)
                                            }
                                            else {
                                                var date = mm.getSystemDate().split(' ')[0].split("-");

                                                if (results1.length > 0) {
                                                    var LAST_ID = parseInt(results1[0].TRANSACTION_ID.split('/')[2].slice(-2));
                                                    var newLastId = (LAST_ID + 1).toString().padStart(2, '0');
                                                    var TRANSACTION_ID = `INW/${inwardData.INWARD_ITEM_ID}/${date[0]}${date[1]}${date[2]}${newLastId}`;
                                                } else {
                                                    var TRANSACTION_ID = `INW/${inwardData.INWARD_ITEM_ID}/${date[0]}${date[1]}${date[2]}01`;
                                                }

                                                // chnaged the (inwardData.INVENTORY_TRACKING_TYPE == 'B' ? inwardData.QUANTITY_PER_UNIT : 1) to (inwardData.INVENTORY_TRACKING_TYPE == 'B' ? 1 : 1) for IN_QTY
                                                const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has inwarded the inventory ${inwardData.ITEM_NAME} for the warehouse ${WAREHOUSE_NAME}`;
                                                mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,ORDER_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [TRANSACTION_ID, mm.getSystemDate(), 'C', inwardData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, 0, 0, 0, resultsInword.insertId, 0, "I", (inwardData.INVENTORY_TRACKING_TYPE == 'B' ? inwardData.UNIQUE_NO : ""), (inwardData.INVENTORY_TRACKING_TYPE == 'S' ? inwardData.UNIQUE_NO : ""), inwardData.INWARD_ITEM_ID, (inwardData.INVENTORY_TRACKING_TYPE == 'B' ? 1 : 1), 0, ACTION_LOG, 1, inwardData.ACTUAL_UNIT_ID, inwardData.ACTUAL_UNIT_NAME, inwardData.IS_VARIANT, inwardData.PARENT_ID, inwardData.QUANTITY_PER_UNIT], supportKey, connection, (error, results) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        callback(error)
                                                    }
                                                    else {

                                                        const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has inwarded the inventory item ${inwardData.ITEM_NAME} for the warehouse ${WAREHOUSE_NAME}`;
                                                        // const ACTION_LOG = `User ${req.body.authData.data.UserData[0].NAME} has inwarded the inventory`;
                                                        const logData = {
                                                            ACTION_TYPE: "Inward",
                                                            ACTION_DETAILS: ACTION_LOG,
                                                            ACTION_DATE: new Date(), // Capturing the current date and time
                                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                            INVENTORY_ID: inwardData.PARENT_ID,
                                                            INVENTORY_NAME: inwardData.INWARD_ITEM_NAME,
                                                            WAREHOUSE_ID: WAREHOUSE_ID,
                                                            WAREHOUSE_NAME: inwardData.WAREHOUSE_NAME,
                                                            VARIANT_ID: inwardData.INWARD_ITEM_ID,
                                                            VARIANT_NAME: inwardData.VARIANT_NAME || "", // Optional field
                                                            QUANTITY: inwardData.QUANTITY,
                                                            TOTAL_INWARD: 0, // Assuming 0 is computed elsewhere
                                                            CURRENT_STOCK: 0,
                                                            OLD_STOCK: 0 || 0, // Optional if not tracked
                                                            QUANTITY_PER_UNIT: inwardData.QUANTITY_PER_UNIT,
                                                            UNIT_ID: inwardData.UNIT_ID,
                                                            UNIT_NAME: inwardData.UNIT_NAME,
                                                            REASON: "Inventory Inwarded",
                                                            SOURCE_WAREHOUSE_ID: null, // Not applicable for inward
                                                            SOURCE_WAREHOUSE_NAME: "",
                                                            DESTINATION_WAREHOUSE_ID: WAREHOUSE_ID,
                                                            DESTINATION_WAREHOUSE_NAME: inwardData.WAREHOUSE_NAME,
                                                            REFERENCE_NO: inwardData.PO_NUMBER || "", // Optional reference for inwarding
                                                            STATUS: "COMPLETED",
                                                            REMARK: inwardData.REMARK || ""
                                                        };
                                                        addLogEntry(logData);
                                                        function addLogEntry(newEntry) {
                                                            const isDuplicate = LogArray.some(
                                                                (entry) =>
                                                                    entry.VARIANT_ID === newEntry.VARIANT_ID &&
                                                                    entry.INVENTORY_ID === newEntry.INVENTORY_ID &&
                                                                    entry.ACTION_DETAILS === newEntry.ACTION_DETAILS
                                                            );

                                                            if (!isDuplicate) {
                                                                LogArray.push(newEntry);
                                                            } else {
                                                                console.log('Duplicate entry detected. Skipping...');
                                                            }
                                                        }
                                                        mm.sendNotificationToAdmin(8, "Inward Inventory", `Hello Admin, The inventory ${inwardData.ITEM_NAME} has been inwarded in ${WAREHOUSE_NAME} on ${mm.getSystemDate()}. Please verify.`, "", "II", supportKey, "I", req.body);
                                                        callback()
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            } else {
                                is_inwardId = true
                                error = "Please check the INWARD_ITEM_ID is must be a numeric";
                                callback(error)
                            }
                        }, function subCb(error) {
                            if (error) {
                                if (is_inwardId == false) {
                                    console.log("error", error);
                                    mm.rollbackConnection(connection);
                                    res.status(400).json({
                                        "message": "Failed to add inventory inwards"
                                    });
                                } else {
                                    console.log("error", error);
                                    mm.rollbackConnection(connection);
                                    res.status(400).json({
                                        "message": error
                                    });
                                }
                            } else {
                                dbm.saveLog(LogArray, inwardLogSchema);
                                mm.executeDML(`SELECT INWARD_ITEM_ID, WAREHOUSE_ID, (SELECT SUM(CASE WHEN ACTUAL_UNIT_NAME LIKE '%Box%'  THEN QUANTITY_PER_UNIT ELSE 1 END) FROM inventory_inward_details WHERE INWARD_MASTER_ID = ?) AS TOTAL_INWARD FROM inventory_inward_details WHERE INWARD_MASTER_ID = ? GROUP BY INWARD_ITEM_ID,WAREHOUSE_ID;`, [resultsInword.insertId, resultsInword.insertId], supportKey, connection, (error, detailsData) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        return res.status(400).json({ "message": "Failed to fetch inventory data" });
                                    }
                                    if (detailsData.length === 0) {
                                        return res.status(400).json({ "message": "No inventory data found" });
                                    }
                                    let updateWarehouseStockQuery = `UPDATE inventory_warehouse_stock_management SET 
                                    TOTAL_INWARD = CASE `;
                                    let updateInventoryMasterQuery = `UPDATE inventory_master SET 
                                    CURRENT_STOCK = CASE `;

                                    let warehouseParams = [];
                                    let inventoryMasterParams = [];
                                    let itemIds = [];

                                    detailsData.forEach(stockData => {
                                        updateWarehouseStockQuery += `WHEN WAREHOUSE_ID = ? AND ITEM_ID = ? THEN TOTAL_INWARD + ? `;
                                        warehouseParams.push(stockData.WAREHOUSE_ID, stockData.INWARD_ITEM_ID, stockData.TOTAL_INWARD);

                                        updateInventoryMasterQuery += `WHEN ID = ? THEN CURRENT_STOCK + ? `;
                                        inventoryMasterParams.push(stockData.INWARD_ITEM_ID, stockData.TOTAL_INWARD);

                                        itemIds.push(stockData.INWARD_ITEM_ID);
                                    });

                                    updateWarehouseStockQuery += `ELSE TOTAL_INWARD END,CURRENT_STOCK = CASE `;

                                    detailsData.forEach(stockData => {
                                        updateWarehouseStockQuery += `WHEN WAREHOUSE_ID = ? AND ITEM_ID = ? THEN CURRENT_STOCK + ? `;
                                        warehouseParams.push(stockData.WAREHOUSE_ID, stockData.INWARD_ITEM_ID, stockData.TOTAL_INWARD);
                                    });

                                    updateWarehouseStockQuery += `ELSE CURRENT_STOCK END WHERE ITEM_ID IN (${itemIds.map(() => '?').join(',')})`;

                                    updateInventoryMasterQuery += `ELSE CURRENT_STOCK END WHERE ID IN (${itemIds.map(() => '?').join(',')})`;

                                    mm.executeDML(updateWarehouseStockQuery, [...warehouseParams, ...itemIds], supportKey, connection, (error, result) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            mm.rollbackConnection(connection);
                                            return res.status(400).json({ "message": "Failed to update warehouse stock" });
                                        }

                                        mm.executeDML(updateInventoryMasterQuery, [...inventoryMasterParams, ...itemIds], supportKey, connection, (error, result) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                return res.status(400).json({ "message": "Failed to update inventory master" });
                                            }

                                            mm.commitConnection(connection);
                                            res.status(200).json({ "message": "Inventory updated successfully" });
                                        });
                                    });
                                })

                            }
                        });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}


