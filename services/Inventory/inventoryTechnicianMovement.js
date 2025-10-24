const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;
const inwardLogSchema = require("../../modules/inwardLogs")
const dbm = require('../../utilities/dbMongo');
var inventoryTechnicianMovement = "inventory_technician_movement";
var viewinventoryTechnicianMovement = "view_" + inventoryTechnicianMovement;

function reqData(req) {

    var data = {
        WAREHOUSE_ID: req.body.WAREHOUSE_ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        DATE: req.body.DATE,
        USER_ID: req.body.USER_ID,
        REASON: req.body.REASON,
        STATUS: req.body.STATUS,
        USER_NAME: req.body.USER_NAME,
        WAREHOUSE_NAME: req.body.WAREHOUSE_NAME,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        MOVEMENT_TYPE: req.body.MOVEMENT_TYPE,
        TRANSFER_MODE: req.body.TRANSFER_MODE,
        INVENTORY_DETAILS: req.body.INVENTORY_DETAILS,
        INVENTORY_CAT_ID: req.body.INVENTORY_CAT_ID,
        MOVEMENT_REQUEST_NO: req.body.MOVEMENT_REQUEST_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('WAREHOUSE_ID').isInt().optional(),
        body('TECHNICIAN_ID').isInt().optional(),
        body('DATE').optional(),
        body('USER_ID').isInt().optional(),
        body('REASON').optional(),
        body('STATUS').optional(),
        body('ID').optional(),
    ]
}

exports.getAll = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewinventoryTechnicianMovement + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryTechnicianMovement count.",
                    });
                }
                else {

                    mm.executeQuery('select * from ' + viewinventoryTechnicianMovement + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryTechnicianMovement information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 201,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).send({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "message": "Something went wrong."
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
            mm.executeQueryData('select count(*) as cnt from ' + viewinventoryTechnicianMovement + ' where 1 AND ID=? ' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryTechnicianMovement count.",
                    });
                }
                else {

                    mm.executeQueryData('select * from ' + viewinventoryTechnicianMovement + ' where 1 AND ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);

                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryTechnicianMovement information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 201,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).send({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
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
        res.status(422).send({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + inventoryTechnicianMovement + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to save inventoryTechnicianMovement information..."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "inventoryTechnicianMovement information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).send({
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
        res.status(422).send({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + inventoryTechnicianMovement + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).send({
                        "message": "Failed to update inventoryTechnicianMovement information."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "inventoryTechnicianMovement information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).send({
                "message": "Something went wrong."
            });
        }
    }
}

exports.createMovement = (req, res) => {

    var { MOVEMENT_NUMBER, WAREHOUSE_ID, TECHNICIAN_ID, DATE, USER_ID, REASON, CLIENT_ID, USER_NAME, WAREHOUSE_NAME, TECHNICIAN_NAME, MOVEMENT_TYPE, TRANSFER_MODE, INVENTORY_DETAILS } = req.body
    var supportKey = req.headers['supportkey'];

    try {
        console.log("");
        
        var is_Id
        let LoggArr = [];
        const connection = mm.openConnection()
        mm.executeDML('INSERT INTO inventory_technician_movement (MOVEMENT_NUMBER,WAREHOUSE_ID,TECHNICIAN_ID,DATE,USER_ID,USER_NAME,WAREHOUSE_NAME,TECHNICIAN_NAME,MOVEMENT_TYPE,CLIENT_ID,TRANSFER_MODE) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [MOVEMENT_NUMBER, WAREHOUSE_ID, TECHNICIAN_ID, DATE, USER_ID, USER_NAME,WAREHOUSE_NAME, TECHNICIAN_NAME, MOVEMENT_TYPE, CLIENT_ID, TRANSFER_MODE], supportKey, connection, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "message": "Failed to add inventory movement"
                });
            }
            else {
                async.eachSeries(INVENTORY_DETAILS, function iteratorOverElems(movementData, callback) {
                    if (movementData.INVENTORY_ID != null && movementData.INVENTORY_ID != undefined && movementData.INVENTORY_ID != '') {

                        console.log("\n\n\n\n\n\n\n INVENTORY_DETAILS", movementData);

                        mm.executeDML('INSERT INTO inventory_technician_movement_details (MOVEMENT_ID,INVENTORY_ID,IS_VARIENT,PARENT_ID,VARIANT_NAME,INVENTORY_NAME,QUANTITY,UNIT_ID,UNIT_NAME,QUANTITY_PER_UNIT,INVENTORY_CAT_ID,INVENTORY_CAT_NAME,INVENTROY_SUB_CAT_ID,INVENTROY_SUB_CAT_NAME,MOVEMENT_TYPE,CLIENT_ID,SERIAL_NO,BATCH_NO) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [results1.insertId, movementData.INVENTORY_ID, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.VARIANT_NAME, movementData.INVENTORY_NAME, movementData.QUANTITY, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.QUANTITY_PER_UNIT, movementData.INVENTORY_CAT_ID, movementData.INVENTORY_CAT_NAME, movementData.INVENTROY_SUB_CAT_ID, movementData.INVENTROY_SUB_CAT_NAME, MOVEMENT_TYPE, CLIENT_ID, movementData.SERIAL_NO, movementData.BATCH_NO], supportKey, connection, (error, results2) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                callback(error)
                            }
                            else {
                                mm.executeDML('select TRANSACTION_ID FROM inventory_account_transaction WHERE GATEWAY_TYPE="T"  ORDER BY ID DESC LIMIT 1 ', [], supportKey, connection, (error, results3) => {
                                    if (error) {
                                        console.log(error);
                                        mm.rollbackConnection(connection);
                                        res.status(400).json({
                                            "message": "Failed to add inventory movement"
                                        });
                                    }
                                    else {
                                        var date = mm.getSystemDate().split(' ')[0].split("-");
                                        if (results3.length > 0) {
                                            var LAST_ID = parseInt(results3[0].TRANSACTION_ID.split('/')[2].slice(-2));
                                            var newLastId = (LAST_ID + 1).toString().padStart(2, '0');
                                            var TRANSACTION_ID = `MOV/${movementData.INVENTORY_ID}/${date[0]}${date[1]}${date[2]}${newLastId}`;
                                        } else {
                                            var TRANSACTION_ID = `MOV/${movementData.INVENTORY_ID}/${date[0]}${date[1]}${date[2]}01`;
                                        }
                                        var ACTION_LOG = ""

                                        var data = []
                                        if (TRANSFER_MODE == "W") {
                                            data = [[TRANSACTION_ID, mm.getSystemDate(), "D", movementData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, 0, 0, 0, 0, 0, "M", movementData.BATCH_NO, movementData.SERIAL_NO, movementData.INVENTORY_ID, 0, movementData.QUANTITY, ACTION_LOG, CLIENT_ID, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.QUANTITY_PER_UNIT],
                                            [TRANSACTION_ID, mm.getSystemDate(), "C", movementData.INVENTORY_TRACKING_TYPE, 0, TECHNICIAN_ID, 0, 0, 0, 0, "M", movementData.BATCH_NO, movementData.SERIAL_NO, movementData.INVENTORY_ID, movementData.QUANTITY, 0, ACTION_LOG, CLIENT_ID, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.QUANTITY_PER_UNIT]]
                                            ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has transferred the inventory to technician ${TECHNICIAN_NAME}`;
                                            var TITLE = 'Inventory Stock Transferred'
                                            var DESCRIPTION = `You have received ${movementData.QUANTITY} new items in your inventory stock.
Item: ${movementData.INVENTORY_NAME}
Quantity: ${movementData.QUANTITY}
Tracking Type: ${movementData.INVENTORY_TRACKING_TYPE}
Unique Type: ${movementData.INVENTORY_TRACKING_TYPE === "S" ? movementData.SERIAL_NO : movementData.INVENTORY_TRACKING_TYPE === "B" ? movementData.BATCH_NO : "N/A"}
Please check and update your stock accordingly.`
                                            mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, TITLE, DESCRIPTION, "", "T", supportKey, "", "I", req.body)
                                        } else {
                                            data = [[TRANSACTION_ID, mm.getSystemDate(), "D", movementData.INVENTORY_TRACKING_TYPE, 0, TECHNICIAN_ID, 0, 0, 0, 0, "M", movementData.BATCH_NO, movementData.SERIAL_NO, movementData.INVENTORY_ID, 0, movementData.QUANTITY, ACTION_LOG, CLIENT_ID, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.QUANTITY_PER_UNIT],
                                            [TRANSACTION_ID, mm.getSystemDate(), "C", movementData.INVENTORY_TRACKING_TYPE, WAREHOUSE_ID, 0, 0, 0, 0, 0, "M", movementData.BATCH_NO, movementData.SERIAL_NO, movementData.INVENTORY_ID, movementData.QUANTITY, 0, ACTION_LOG, CLIENT_ID, movementData.UNIT_ID, movementData.UNIT_NAME, movementData.IS_VERIENT, movementData.PARENT_ID, movementData.QUANTITY_PER_UNIT]]
                                            ACTION_LOG = `${req.body.authData.data.UserData[0].NAME} has transferred the inventory from technician ${TECHNICIAN_NAME} to the warehouse ${WAREHOUSE_NAME}`;
                                        }
                                        mm.executeDML('INSERT INTO inventory_account_transaction (TRANSACTION_ID,TRANSACTION_DATE,TRANSACTION_TYPE,INVENTORY_TRACKING_TYPE,WAREHOUSE_ID,TECHNICIAN_ID,ADJUSTMENT_ID,MOVEMENT_ID,INWARD_ID,ORDER_ID,GATEWAY_TYPE,BATCH_NO,SERIAL_NO,ITEM_ID,IN_QTY,OUT_QTY,REMARKS,CLIENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,IS_VARIANT,PARENT_ID,QUANTITY_PER_UNIT) VALUES ?', [data], supportKey, connection, (error, results) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                callback(error)
                                            }
                                            else {
                                                mm.executeDML(`UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK=CURRENT_STOCK+? WHERE WAREHOUSE_ID=? AND ITEM_ID=?;UPDATE inventory_warehouse_stock_management SET CURRENT_STOCK=CURRENT_STOCK-? WHERE WAREHOUSE_ID=? AND ITEM_ID=?`, [movementData.QUANTITY, TECHNICIAN_ID, movementData.INVENTORY_ID, movementData.QUANTITY, WAREHOUSE_ID, movementData.INVENTORY_ID], supportKey, connection, (error, results8) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        callback(error)
                                                    }
                                                    else {
                                                        const logData = {
                                                            ACTION_TYPE: "MOVEMENT",
                                                            ACTION_DETAILS: ACTION_LOG,
                                                            ACTION_DATE: new Date(),
                                                            USER_ID: req.body.authData.data.UserData[0].USER_ID,
                                                            USER_NAME: req.body.authData.data.UserData[0].NAME,
                                                            INVENTORY_ID: movementData.INVENTORY_ID,
                                                            INVENTORY_NAME: movementData.INVENTORY_NAME,
                                                            WAREHOUSE_ID: 0,
                                                            WAREHOUSE_NAME: "",
                                                            VARIANT_ID: movementData.VARIANT_ID,
                                                            VARIANT_NAME: movementData.VARIANT_NAME || "",
                                                            QUANTITY: movementData.QUANTITY,
                                                            TOTAL_INWARD: 0,
                                                            CURRENT_STOCK: 0,
                                                            OLD_STOCK: 0,
                                                            QUANTITY_PER_UNIT: "",
                                                            UNIT_ID: movementData.UNIT_ID,
                                                            UNIT_NAME: movementData.UNIT_NAME,
                                                            REASON: "Inventory Movement",
                                                            WAREHOUSE_ID: WAREHOUSE_ID,
                                                            WAREHOUSE_NAME: WAREHOUSE_NAME,
                                                            TECHNICIAN_ID: TECHNICIAN_ID,
                                                            TECHNICIAN_NAME: TECHNICIAN_NAME,
                                                            REFERENCE_NO: "",
                                                            STATUS: "COMPLETED",
                                                            REMARK: ""
                                                        };
                                                        LoggArr.push(logData);
                                                        callback()
                                                    }
                                                });
                                            }
                                        });

                                    }
                                });
                            }
                        });
                    } else {
                        is_Id = true
                        error = "Please check the INWARD_ITEM_ID is must be a numeric";
                        callback(error)
                    }
                }, function subCb(error) {
                    if (error) {
                        if (is_Id == true) {
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "message": error
                            });
                        } else {
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "message": "Failed to add inventory movement"
                            });
                        }
                    } else {
                        dbm.saveLog(LoggArr, inwardLogSchema);
                        mm.commitConnection(connection);
                        res.status(200).json({
                            "message": "New inventory inward Successfully added",
                        });
                    }
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

exports.counts = (req, res) => {
    var supportKey = req.headers['supportkey'];
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`SELECT COUNT(IF(STATUS='A',1,null))APPROVED, COUNT(IF(STATUS='P',1,null))PENDING, COUNT(IF(STATUS='R',1,null))REJECTED FROM inventory_movement WHERE 1` + filter, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryTechnicianMovement count.",
                    });
                }
                else {
                    res.status(200).send({
                        "message": "success",
                        "TAB_ID": 29,
                        "data": results1
                    });
                }
            });
        }
        else {
            res.status(400).send({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "message": "Something went wrong."
        });
    }

}

exports.detailedList = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewinventoryTechnicianMovement + ' IM  where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryTechnicianMovement count.",
                    });
                }
                else {

                    mm.executeQuery('select *,(select count(*) from view_inventory_technician_movement_details where MOVEMENT_ID=IM.ID) as INVENTORY_COUNT from ' + viewinventoryTechnicianMovement + ' IM where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);

                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryTechnicianMovement information."
                            });
                        }
                        else {
                            res.status(200).send({
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
            res.status(400).send({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "message": "Something went wrong."
        });
    }

}
