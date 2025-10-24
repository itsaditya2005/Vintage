const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var inventoryMovementDetails = "inventory_movement_details";
var viewInventoryMovementDetails = "view_" + inventoryMovementDetails;


function reqData(req) {

    var data = {
        VARIANT_ID: req.body.VARIANT_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        MOVEMENT_ID: req.body.MOVEMENT_ID,
        VARIANT_NAME: req.body.VARIANT_NAME,
        VARIENT_DETAILS_ID: req.body.VARIENT_DETAILS_ID,
        INVENTORY_NAME: req.body.INVENTORY_NAME,
        QUANTITY: req.body.QUANTITY,
        INVENTROY_SUB_CAT_ID: req.body.INVENTROY_SUB_CAT_ID,
        INVENTORY_CAT_NAME: req.body.INVENTORY_CAT_NAME,
        INVENTROY_SUB_CAT_NAME: req.body.INVENTROY_SUB_CAT_NAME,
        INVENTORY_CAT_ID: req.body.INVENTORY_CAT_ID,
        UNIT_ID: req.body.UNIT_ID,
        UNIT_NAME: req.body.UNIT_NAME,
        IS_VARIENT: req.body.IS_VARIENT

    }
    return data;
}

exports.validate = function () {
    return [
        body('MOVEMENT_ID').isInt().optional(),
        body('INVETORY_ID').isInt().optional(),
        body('MOVEMENT_TYPE').optional(),
        body('QUANTITY').isInt().optional(),
        body('UNIT_NAME').optional(),
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
        if (IS_FILTER_WRONG == 0) {
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryMovementDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryMovementDetails count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryMovementDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryMovementDetails information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 34,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
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
        if (IS_FILTER_WRONG == 0) {
            mm.executeQueryData('select count(*) as cnt from ' + viewInventoryMovementDetails + ' where 1 AND ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryMovementDetails count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewInventoryMovementDetails + ' where 1 AND ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryMovementDetails information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 34,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "message": "Something went wrong."
        });
    }
}

exports.movementDetails = (req, res) => {
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
        if (IS_FILTER_WRONG == 0) {
            mm.executeQueryData('select count(*) as cnt from ' + viewInventoryMovementDetails + ' where 1 AND MOVEMENT_ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryMovementDetails count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewInventoryMovementDetails + ' where 1 AND MOVEMENT_ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryMovementDetails information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 34,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
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
            mm.executeQueryData('INSERT INTO ' + inventoryMovementDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to save inventoryMovementDetails information..."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "InventoryMovementDetails information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
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
            mm.executeQueryData(`UPDATE ` + inventoryMovementDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).send({
                        "message": "Failed to update inventoryMovementDetails information."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "InventoryMovementDetails information updated successfully...",
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

exports.movementList = (req, res) => {
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
        if (IS_FILTER_WRONG == 0) {
            mm.executeQueryData('SELECT IM.ID, IM.VARIANT_NAME, IM.VARIANT_ID, IM.INVENTORY_ID, IM.MOVEMENT_ID, IM.VARIENT_DETAILS_ID, IM.INVENTORY_NAME, IM.QUANTITY, IM.IS_VARIENT, IM.INVENTROY_SUB_CAT_ID, IM.INVENTORY_CAT_NAME, IM.INVENTROY_SUB_CAT_NAME, IM.INVENTORY_CAT_ID, IM.UNIT_ID, IM.UNIT_NAME, IM.MOVEMENT_TYPE, IM.APPROVAL_QUANTITY,II.QUANTITY INWARD_QUANTITY,II.QUANTITY_PER_UNIT,II.UNIT_NAME INWARD_unit_name  FROM view_inventory_movement_details IM LEFT JOIN view_inventory_inward II on IM.SOURCE_WAREHOUSE_ID=II.WAREHOUSE_ID AND IM.INVENTORY_ID=INWARD_ITEM_ID WHERE MOVEMENT_ID=?', ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryMovementDetails count.",
                    });
                }
                else {
                    res.status(200).send({
                        "message": "success",
                        "TAB_ID": 34,
                        "data": results1
                    });
                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "message": "Something went wrong."
        });
    }
}
