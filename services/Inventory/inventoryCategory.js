const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var inventoryCategoryMaster = "inventory_category_master";
var viewInventoryCategoryMaster = "view_" + inventoryCategoryMaster;

function reqData(req) {
    var data = {
        CATEGORY_NAME: req.body.CATEGORY_NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        PARENT_ID: req.body.PARENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        SEQ_NO: req.body.SEQ_NO,
        ICON: req.body.ICON
    }
    return data;
}

exports.validate = function () {
    return [
        body('CATEGORY_NAME', ' parameter missing').exists(),
        body('DESCRIPTION').optional(),
        body('PARENT_ID').isInt(), body('ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryCategoryMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventoryCategory count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryCategoryMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventoryCategory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 30,
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

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + inventoryCategoryMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save inventoryCategory information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "InventoryCategory information saved successfully...",
                    });
                }
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
    if (data.DESCRIPTION == null) {
        setData += "DESCRIPTION = ? , ";
        recordData.push(null);
    }
    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + inventoryCategoryMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update inventoryCategory information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "InventoryCategory information updated successfully...",
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

exports.getcatogoryHirechy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];

        var query = `SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'key', CAST(cm.ID AS CHAR),
        'title', cm.CATEGORY_NAME,
        'disabled', CASE
            WHEN NOT EXISTS (
                SELECT 1
                FROM inventory_sub_category scm
                WHERE scm.INVENTRY_CATEGORY_ID = cm.ID AND scm.IS_ACTIVE = 0
            ) THEN 1
            ELSE 0
        END,
        'children', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR)),
                    'title', scm.NAME,
                    'isLeaf', true,
                    'disabled', CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM inventory_sub_category scm_check
                            WHERE scm_check.INVENTRY_CATEGORY_ID = cm.ID AND scm_check.IS_ACTIVE = 1
                        ) THEN 1
                        ELSE 0
                    END
                )
            )
            FROM inventory_sub_category scm
            WHERE scm.INVENTRY_CATEGORY_ID = cm.ID AND scm.IS_ACTIVE = 1
        )
    )
) AS categories
FROM inventory_category_master cm 
WHERE EXISTS (
    SELECT 1
    FROM inventory_sub_category scm
    WHERE scm.INVENTRY_CATEGORY_ID = cm.ID AND scm.IS_ACTIVE = 1
)
    AND cm.IS_ACTIVE = 1

HAVING categories IS NOT NULL;


`
        mm.executeQuery(query, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    code: 400,
                    message: "Failed to get Data",
                });
            } else {
                const cleanedResults = results.map(category => {
                    if (category.categories) {
                        category.categories = category.categories.filter(categoryItem => {
                            if (categoryItem.children) {

                                return categoryItem.children.length > 0;
                            }
                            return false;
                        });
                    }
                    return category;
                });

                res.send({
                    code: 200,
                    message: "Success",
                    data: cleanedResults,
                });
            }
        });

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "sever Error",
        });
    }
}


exports.getCategoryForTechnician = (req, res) => {
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
        if (IS_FILTER_WRONG == "0" && TECHNICIAN_ID != '') {
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryCategoryMaster + ' where 1 AND ID IN(SELECT INVENTORY_CAT_ID FROM view_inventory_technician_movement_details WHERE TECHNICIAN_ID = ' + TECHNICIAN_ID + ')' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get inventoryCategory count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewInventoryCategoryMaster + ' where 1 AND ID IN(SELECT INVENTORY_CAT_ID FROM view_inventory_technician_movement_details WHERE TECHNICIAN_ID = ' + TECHNICIAN_ID + ')' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventoryCategory information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 30,
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