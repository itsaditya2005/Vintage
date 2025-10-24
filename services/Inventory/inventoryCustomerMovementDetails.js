const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var inventoryCustomerMovementDetails = "inventory_customer_movement_details";
var viewinventoryCustomerMovementDetails = "view_" + inventoryCustomerMovementDetails;


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
            mm.executeQuery('select count(*) as cnt from ' + viewinventoryCustomerMovementDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryCustomerMovementDetails count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewinventoryCustomerMovementDetails + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryCustomerMovementDetails information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 202,
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
            mm.executeQueryData('select count(*) as cnt from ' + viewinventoryCustomerMovementDetails + ' where 1 AND ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryCustomerMovementDetails count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewinventoryCustomerMovementDetails + ' where 1 AND ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryCustomerMovementDetails information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 202,
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
            mm.executeQueryData('select count(*) as cnt from ' + viewinventoryCustomerMovementDetails + ' where 1 AND MOVEMENT_ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryCustomerMovementDetails count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewinventoryCustomerMovementDetails + ' where 1 AND MOVEMENT_ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get inventoryCustomerMovementDetails information."
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
            mm.executeQueryData('INSERT INTO ' + inventoryCustomerMovementDetails + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to save inventoryCustomerMovementDetails information..."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "inventoryCustomerMovementDetails information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + inventoryCustomerMovementDetails + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).send({
                        "message": "Failed to update inventoryCustomerMovementDetails information."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "inventoryCustomerMovementDetails information updated successfully...",
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
                        "message": "Failed to get inventoryCustomerMovementDetails count.",
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

exports.getCustomers = (req, res) => {
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
            mm.executeQuery(`SELECT count(*) as cnt FROM customer_master where 1 AND ID IN(SELECT DISTINCT CUSTOMER_ID from inventory_request_details where STATUS="AC" AND INVENTORY_ID <>0  AND IS_RETURNED=0 AND JOB_CARD_ID IN(SELECT DISTINCT JOB_CARD_ID FROM inventory_account_transaction WHERE 1 GROUP BY JOB_CARD_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0))`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get customer count.",
                    });
                }
                else {
                    mm.executeQuery('SELECT * from customer_master where 1 AND ID IN(SELECT DISTINCT CUSTOMER_ID from inventory_request_details where STATUS="AC" AND INVENTORY_ID <>0  AND IS_RETURNED=0 AND JOB_CARD_ID IN(SELECT DISTINCT JOB_CARD_ID FROM inventory_account_transaction WHERE 1 GROUP BY JOB_CARD_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0))', supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get customer information."
                            });
                        }
                        else {
                            console.log("results", results);

                            res.status(200).send({
                                "message": "success",
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


exports.getTechnicians = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    let CUSTOMER_ID = req.body.CUSTOMER_ID;

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
            if (CUSTOMER_ID) {
                mm.executeQuery(`SELECT COUNT(*) as cnt from technician_master where 1 AND ID IN(SELECT DISTINCT TECHNICIAN_ID from view_inventory_request_details where STATUS="AC" AND INVENTORY_ID <>0 AND CUSTOMER_ID=${CUSTOMER_ID} AND IS_RETURNED=0 AND JOB_CARD_ID IN(SELECT DISTINCT JOB_CARD_ID FROM inventory_account_transaction WHERE 1 GROUP BY JOB_CARD_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0))`, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            "message": "Failed to get technician count.",
                        });
                    }
                    else {
                        mm.executeQuery(`SELECT * from technician_master where 1 AND ID IN(SELECT DISTINCT TECHNICIAN_ID from view_inventory_request_details where STATUS="AC" AND INVENTORY_ID <>0 AND CUSTOMER_ID=${CUSTOMER_ID} AND IS_RETURNED=0 AND JOB_CARD_ID IN(SELECT DISTINCT JOB_CARD_ID FROM inventory_account_transaction WHERE 1 GROUP BY JOB_CARD_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0))`, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.status(400).send({
                                    "message": "Failed to get technician information."
                                });
                            }
                            else {
                                res.status(200).send({
                                    "message": "success",
                                    "count": results1[0].cnt,
                                    "data": results
                                });
                            }
                        });
                    }
                });
            } else {
                res.status(400).send({
                    "message": "CUSTOMER_ID is required.",
                });
            }
        } else {
            res.status(400).send({
                "message": "Invalid Filter.",
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

exports.getItemsToMovementOLD = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    let CUSTOMER_ID = req.body.CUSTOMER_ID;
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID;

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
            if (CUSTOMER_ID) {
                mm.executeQuery(`SELECT COUNT(*) AS cnt FROM (SELECT t.* FROM view_inventory_account_transaction t JOIN (SELECT JOB_CARD_ID, ITEM_ID  FROM view_inventory_account_transaction WHERE 1 AND JOB_CARD_ID IN (SELECT DISTINCT JOB_CARD_ID FROM inventory_request_details    WHERE CUSTOMER_ID = ${CUSTOMER_ID} AND TECHNICIAN_ID = ${TECHNICIAN_ID} AND STATUS = "AC")AND ITEM_ID <> 0 GROUP BY JOB_CARD_ID, ITEM_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0) agg ON t.JOB_CARD_ID = agg.JOB_CARD_ID AND t.ITEM_ID = agg.ITEM_ID AND t.IS_RETURNED=0 AND t.TRANSACTION_TYPE="C") AS sub;`, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            "message": "Failed to get customer count.",
                        });
                    }
                    else {
                        const ORGQuery = `SELECT * FROM (SELECT t.* FROM view_inventory_account_transaction t JOIN (SELECT JOB_CARD_ID, ITEM_ID  FROM view_inventory_account_transaction WHERE 1 AND JOB_CARD_ID IN (SELECT DISTINCT JOB_CARD_ID FROM inventory_request_details    WHERE CUSTOMER_ID = ${CUSTOMER_ID} AND TECHNICIAN_ID = ${TECHNICIAN_ID} AND STATUS = "AC")AND ITEM_ID <> 0 GROUP BY JOB_CARD_ID, ITEM_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0) agg ON t.JOB_CARD_ID = agg.JOB_CARD_ID AND t.ITEM_ID = agg.ITEM_ID AND t.IS_RETURNED=0 AND t.TRANSACTION_TYPE="C") AS sub`


                        var Query = `SELECT sub.*,ird.ID AS INVENTORY_DETAILS_ID FROM (SELECT t.*FROM view_inventory_account_transaction t JOIN (SELECT JOB_CARD_ID,ITEM_ID FROM view_inventory_account_transaction WHERE ITEM_ID<> 0 AND JOB_CARD_ID IN (SELECT DISTINCT JOB_CARD_ID FROM inventory_request_details WHERE CUSTOMER_ID=${CUSTOMER_ID} AND TECHNICIAN_ID=${TECHNICIAN_ID} AND STATUS="AC") GROUP BY JOB_CARD_ID,ITEM_ID HAVING SUM(IN_QTY)-SUM(OUT_QTY)> 0) agg ON t.JOB_CARD_ID=agg.JOB_CARD_ID AND t.ITEM_ID=agg.ITEM_ID AND t.IS_RETURNED=0 AND t.TRANSACTION_TYPE="C") AS sub JOIN inventory_request_details ird ON sub.JOB_CARD_ID=ird.JOB_CARD_ID AND sub.ITEM_ID=ird.INVENTORY_ID WHERE ird.CUSTOMER_ID=${CUSTOMER_ID} AND ird.TECHNICIAN_ID=${TECHNICIAN_ID} AND ird.STATUS="AC" AND ird.IS_RETURNED=0;`
                        mm.executeQuery(Query, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.status(400).send({
                                    "message": "Failed to get customer information."
                                });
                            }
                            else {

                                console.log("results", results);

                                // // Make INVENTORY_DETAILS_ID distinct
                                // const distinctInventoryDetailsMap = new Map();

                                // for (const row of results) {
                                //     if (!distinctInventoryDetailsMap.has(row.INVENTORY_DETAILS_ID)) {
                                //         distinctInventoryDetailsMap.set(row.INVENTORY_DETAILS_ID, row);
                                //     }
                                // }

                                // const finalResults = Array.from(distinctInventoryDetailsMap.values());

                                // console.log("\n\n\n\n finalResults", finalResults);

                                // res.status(200).send({
                                //     "message": "success",
                                //     "count": finalResults.length,
                                //     "data": finalResults
                                // });

                                // Ensure both INVENTORY_DETAILS_ID and ID are globally unique
                                const seenTransactionIDs = new Set();
                                const seenInventoryDetailsIDs = new Set();
                                const finalResults = [];

                                for (const row of results) {
                                    if (!seenTransactionIDs.has(row.ID) && !seenInventoryDetailsIDs.has(row.INVENTORY_DETAILS_ID)) {
                                        seenTransactionIDs.add(row.ID);
                                        seenInventoryDetailsIDs.add(row.INVENTORY_DETAILS_ID);
                                        finalResults.push(row);
                                    }
                                }
                                console.log("\n\n\n\n finalResults", finalResults);
                                res.status(200).send({
                                    message: "success",
                                    count: finalResults.length,
                                    data: finalResults
                                });


                            }
                        });
                    }
                });
            } else {
                res.status(400).send({
                    "message": "CUSTOMER_ID is required.",
                });
            }
        } else {
            res.status(400).send({
                "message": "Invalid Filter.",
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

exports.getItemsToMovement = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    let CUSTOMER_ID = req.body.CUSTOMER_ID;
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID;

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    var start = 0;
    var end = 0;
    let criteria = '';

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
            if (CUSTOMER_ID) {
                mm.executeQuery(`SELECT COUNT(*) AS cnt FROM (SELECT t.* FROM view_inventory_account_transaction t JOIN (SELECT JOB_CARD_ID, ITEM_ID FROM view_inventory_account_transaction WHERE 1 AND JOB_CARD_ID IN (SELECT DISTINCT JOB_CARD_ID FROM inventory_request_details WHERE CUSTOMER_ID = ${CUSTOMER_ID} AND TECHNICIAN_ID = ${TECHNICIAN_ID} AND STATUS = "AC")AND ITEM_ID <> 0 GROUP BY JOB_CARD_ID, ITEM_ID HAVING SUM(IN_QTY) - SUM(OUT_QTY) > 0) agg ON t.JOB_CARD_ID = agg.JOB_CARD_ID AND t.ITEM_ID = agg.ITEM_ID AND t.IS_RETURNED=0 AND t.TRANSACTION_TYPE="C") AS sub;`, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).send({
                            "message": "Failed to get customer count.",
                        });
                    } else {
                        var Query = `SELECT sub.*,ird.ID AS INVENTORY_DETAILS_ID FROM (SELECT t.*FROM view_inventory_account_transaction t JOIN (SELECT JOB_CARD_ID,ITEM_ID FROM view_inventory_account_transaction WHERE ITEM_ID<> 0 AND JOB_CARD_ID IN (SELECT DISTINCT JOB_CARD_ID FROM inventory_request_details WHERE CUSTOMER_ID=${CUSTOMER_ID} AND TECHNICIAN_ID=${TECHNICIAN_ID} AND STATUS="AC") GROUP BY JOB_CARD_ID,ITEM_ID HAVING SUM(IN_QTY)-SUM(OUT_QTY)> 0) agg ON t.JOB_CARD_ID=agg.JOB_CARD_ID AND t.ITEM_ID=agg.ITEM_ID AND t.IS_RETURNED=0 AND t.TRANSACTION_TYPE="C") AS sub JOIN inventory_request_details ird ON sub.JOB_CARD_ID=ird.JOB_CARD_ID AND sub.ITEM_ID=ird.INVENTORY_ID WHERE ird.CUSTOMER_ID=${CUSTOMER_ID} AND ird.TECHNICIAN_ID=${TECHNICIAN_ID} AND ird.STATUS="AC" AND ird.IS_RETURNED=0;`
                        
                        mm.executeQuery(Query, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.status(400).send({
                                    "message": "Failed to get customer information."
                                });
                            } else {
                                console.log("Raw results:", results);

                                // Use two Sets to track unique IDs and INVENTORY_DETAILS_IDs
                                const seenIDs = new Set();
                                const seenInventoryDetailsIDs = new Set();
                                const finalResults = [];

                                for (const row of results) {
                                    // Only add the row if both its ID and INVENTORY_DETAILS_ID are unique
                                    if (!seenIDs.has(row.ID) && !seenInventoryDetailsIDs.has(row.INVENTORY_DETAILS_ID)) {
                                        seenIDs.add(row.ID);
                                        seenInventoryDetailsIDs.add(row.INVENTORY_DETAILS_ID);
                                        finalResults.push(row);
                                    }
                                }

                                console.log("\n\n\n\nFinal results (distinct ID and INVENTORY_DETAILS_ID):", finalResults);
                                res.status(200).send({
                                    message: "success",
                                    count: finalResults.length,
                                    data: finalResults
                                });
                            }
                        });
                    }
                });
            } else {
                res.status(400).send({
                    "message": "CUSTOMER_ID is required.",
                });
            }
        } else {
            res.status(400).send({
                "message": "Invalid Filter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "message": "Something went wrong."
        });
    }
};
