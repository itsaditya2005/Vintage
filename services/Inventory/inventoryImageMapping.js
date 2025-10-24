const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const fs = require('fs');
const path = require('path');
const applicationkey = process.env.APPLICATION_KEY;

var inventoryImageMapping = "inventory_image_mapping";
var viewInventoryImageMapping = "view_" + inventoryImageMapping;

function reqData(req) {
    var data = {
        INVENTORY_ID: req.body.INVENTORY_ID,
        UPLOADED_DATE_TIME: req.body.UPLOADED_DATE_TIME,
        IMAGE_URL: req.body.IMAGE_URL,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
    }
    return data;
}

exports.validate = function () {
    return [
        body('INVENTORY_ID').isInt().exists(),
        body('IMAGE_URL').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewInventoryImageMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get inventoryImageMapping count.",
                    });
                }
                else {

                    mm.executeQuery('select * from ' + viewInventoryImageMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get inventoryImageMapping information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 161,
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
            mm.executeQueryData('INSERT INTO ' + inventoryImageMapping + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to save inventoryImageMapping information..."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "inventoryImageMapping information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + inventoryImageMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).send({
                        "message": "Failed to update inventoryImageMapping information."
                    });
                }
                else {
                    res.status(200).send({
                        "message": "inventoryImageMapping information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
        }
    }
}


exports.mapImagesToInventory = (req, res) => {
    try {
        var data = req.body.DATA ? req.body.DATA : [];
        var INVENTORY_ID = req.params.inventoryId;
        var systemDate = mm.getSystemDate();
        var supportKey = req.headers['supportkey'];

        if ((!INVENTORY_ID || INVENTORY_ID == " ") || (data.length <= 0)) {
            res.status(400).send({
                "message": "INVENTORY_ID  or data parameter missing"
            });
        }
        else {
            var recordData = [];
            const dataLength = data.length;
            for (let i = 0; i < dataLength; i++) {
                let rec = [INVENTORY_ID, systemDate, data[i].IMAGE_URL, 1, 1];
                recordData.push(rec);
            }
            const connection = mm.openConnection();
            mm.executeDML(`delete from inventory_image_mapping where INVENTORY_ID = ?;`, [INVENTORY_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    res.status(400).send({
                        "message": "Failed to map Images to item."
                    });
                } else {
                    mm.executeDML(`insert into inventory_image_mapping(INVENTORY_ID,UPLOADED_DATE_TIME,IMAGE_URL,STATUS,CLIENT_ID) values ?`, [recordData], supportKey, connection, (error, resultsUpdate) => {
                        if (error) {
                            mm.rollbackConnection(connection)
                            console.log(error);
                            res.status(400).send({
                                "message": "Failed to map Images to item."
                            });
                        } else {
                            mm.commitConnection(connection)
                            res.status(200).send({
                                "message": "Images mapped successfully to the item."
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

exports.deleteInventoryImage = (req, res) => {
    try {
        const IMAGE_URL = req.body.IMAGE_URL;
        const INVENTORY_ID = req.params.inventoryId;
        const ID = req.params.id;
        const supportKey = req.headers['supportkey'];
        if (!IMAGE_URL || !INVENTORY_ID || !ID) {
            return res.status(400).send({
                message: "IMAGE_URL, INVENTORY_ID, or ID is missing"
            });
        }
        const connection = mm.openConnection();
        const filePath = path.join(__dirname, 'uploads/InventoryImages/', path.basename(IMAGE_URL));
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error("File deletion error:", err);
                }
            });
        } else {
            console.warn("File not found, proceeding with DB deletion.");
        }
        mm.executeDML(`DELETE FROM inventory_image_mapping WHERE INVENTORY_ID = ? AND IMAGE_URL = ? AND ID = ?;`, [INVENTORY_ID, IMAGE_URL, ID], supportKey, connection, (error, results) => {
            if (error) {
                mm.rollbackConnection(connection);
                console.error(error);
                return res.status(400).send({
                    message: "Failed to delete image record from database."
                });
            } else {
                mm.commitConnection(connection);
                return res.status(200).send({
                    message: "Image file (if existed) and database record deleted successfully."
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error"
        });
    }
};

