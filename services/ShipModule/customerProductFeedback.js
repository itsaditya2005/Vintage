const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async')
const applicationkey = process.env.APPLICATION_KEY;

var customerProductFeedback = "customer_product_feedback";
var viewCustomerProductFeedback = "view_" + customerProductFeedback;

function reqData(req) {

    var data = {
        ORDER_ID: req.body.ORDER_ID,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        INVENTORY_ID: req.body.INVENTORY_ID,
        RATING: req.body.RATING ? req.body.RATING : 0,
        COMMENTS: req.body.COMMENTS,
        FEEDBACK_DATE_TIME: req.body.FEEDBACK_DATE_TIME,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}

exports.validate = function () {
    return [
        body('ORDER_ID').isInt(),
        body('CUSTOMER_ID').isInt(),
        body('INVENTORY_ID').isInt(),
        body('RATING').isDecimal(),
        body('COMMENTS', ' parameter missing').exists(),
        body('FEEDBACK_DATE_TIME', ' parameter missing').exists(),
        body('ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewCustomerProductFeedback + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get customerProductFeedback count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewCustomerProductFeedback + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get customerProductFeedback information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "count": results1[0].cnt,
                                "TAB_ID": 193,
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
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + customerProductFeedback + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save customerProductFeedback information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "CustomerProductFeedback information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + customerProductFeedback + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update customerProductFeedback information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "CustomerProductFeedback information updated successfully...",
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

exports.addFeedback = (req, res) => {
    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    const systemDate = mm.getSystemDate();
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            "message": errors.errors
        });
    }
    try {
        const connection = mm.openConnection();
        let inventoryIds = Array.isArray(data.INVENTORY_ID) ? data.INVENTORY_ID : [data.INVENTORY_ID];
        async.eachSeries(inventoryIds, (inventoryId, callback) => {
            data.INVENTORY_ID = inventoryId;
            data.FEEDBACK_DATE_TIME = systemDate;
            mm.executeDML('INSERT INTO ' + customerProductFeedback + ' SET ?', data, supportKey, connection, (error, results1) => {
                if (error) {
                    console.log(error);
                    return callback(error);
                }
                mm.executeDML('SELECT AVG(RATING) AS AVERAGE FROM customer_product_feedback WHERE INVENTORY_ID=?', [inventoryId], supportKey, connection, (error, results2) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        return callback(error);
                    }

                    if (results2.length > 0) {
                        let averageRating = results2[0].AVERAGE;
                        mm.executeDML('UPDATE  inventory_master  SET RATING=? WHERE ID=?', [averageRating, inventoryId], supportKey, connection, (error, results3) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return callback(error);
                            }
                            callback();
                        });
                    } else {
                        callback();
                    }
                });
            });
        }, (error) => {
            if (error) {
                console.log("Error occurred while inserting feedback");
                mm.rollbackConnection(connection);
                return res.status(400).json({
                    "message": "Failed to save customerProductFeedback information..."
                });
            }
            mm.commitConnection(connection);
            res.status(200).json({
                "message": "CustomerProductFeedback information saved successfully..."
            });
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
};

exports.getCustomerProductFeedback = (req, res) => {
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
    if (pageIndex === '' && pageSize === '') {
        criteria = filter + " order by " + sortKey + " " + sortValue;
    } else {
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    }

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewCustomerProductFeedback + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get customerTechnicianFeedback count.",
                    });
                } else {
                    mm.executeQuery('select * from ' + viewCustomerProductFeedback + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get customerTechnicianFeedback information."
                            });
                        } else {
                            var QUERY = ` SELECT r.rating, COUNT(f.rating) AS rating_count, COALESCE(ROUND((COUNT(f.rating) * 100 / (SELECT COUNT(*) FROM customer_product_feedback WHERE 1 ${filter}))), 0) AS progress_percentage FROM ( SELECT 1 AS rating UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 ) AS r LEFT JOIN customer_product_feedback f ON r.rating = f.rating AND 1 ${filter} GROUP BY r.rating ORDER BY r.rating;`;
                            var AVG_RATING_QUERY = ` SELECT ROUND(AVG(RATING)) AS AVG_RATING FROM customer_product_feedback WHERE 1 ${filter}; `;

                            mm.executeQuery(QUERY, supportKey, (error, progressResults) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to calculate progress."
                                    });
                                } else {
                                    mm.executeQuery(AVG_RATING_QUERY, supportKey, (error, avgResults) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to calculate average rating."
                                            });
                                        } else {
                                            res.send({
                                                "code": 200,
                                                "message": "success",
                                                "count": results1[0].cnt,
                                                "data": results,
                                                "progress": progressResults,
                                                "averageRating": avgResults[0].AVG_RATING
                                            });
                                        }
                                    });
                                }
                            });
                        }
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
            "message": "something went wrong"
        });
    }
};