const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;

exports.getStockMgtReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'WAREHOUSE_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY WAREHOUSE_ID,ITEM_ID,PARENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY WAREHOUSE_ID,ITEM_ID,PARENT_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            const countQuery = `SELECT COUNT(*) AS cnt FROM (
                SELECT WAREHOUSE_ID,WAREHOUSE_NAME,ITEM_ID,ITEM_NAME,PARENT_ID,VARIANT_NAME,REORDER_STOCK_LEVEL,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,INVENTORY_TYPE,ALERT_STOCK_LEVEL,AVG_LEVEL,WAREHOUSE_MANAGER_NAME FROM view_inventory_account_transaction WHERE WAREHOUSE_ID <> 0
                GROUP BY WAREHOUSE_ID,PARENT_ID,WAREHOUSE_NAME,ITEM_ID,ITEM_NAME,REORDER_STOCK_LEVEL,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,INVENTORY_TYPE,ALERT_STOCK_LEVEL,AVG_LEVEL,WAREHOUSE_MANAGER_NAME
            ) AS grouped_data WHERE 1 AND WAREHOUSE_ID <> 0`
            mm.executeQuery(countQuery + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianActionLogs count.",
                    });
                }
                else {
                    mm.executeQuery('SELECT WAREHOUSE_ID,WAREHOUSE_NAME,ITEM_ID,PARENT_ID,ITEM_NAME,VARIANT_NAME,IFNULL(SUM(IN_QTY)-SUM(OUT_QTY),0) AS CURRENT_STOCK,REORDER_STOCK_LEVEL,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,INVENTORY_TYPE,ALERT_STOCK_LEVEL,AVG_LEVEL,WAREHOUSE_MANAGER_NAME FROM `view_inventory_account_transaction` WHERE 1 AND WAREHOUSE_ID <> 0' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianActionLogs information."
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
        } else {
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
            "message": "Internal Server Error."
        })
    }
}

exports.getTechniciansStockMgtReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'TECHNICIAN_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY TECHNICIAN_ID,ITEM_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,BATCH_NO,SERIAL_NO HAVING SUM(IN_QTY)-SUM(OUT_QTY) > 0 order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY TECHNICIAN_ID,ITEM_ID,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,BATCH_NO,SERIAL_NO HAVING SUM(IN_QTY)-SUM(OUT_QTY) > 0 order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            const countQuery = `SELECT COUNT(*) AS cnt FROM (
                SELECT TECHNICIAN_ID,TECHNICIAN_NAME,ITEM_ID,ITEM_NAME,IFNULL(SUM(IN_QTY)-SUM(OUT_QTY),0) AS CURRENT_STOCK,REORDER_STOCK_LEVEL,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,INVENTORY_TYPE,ALERT_STOCK_LEVEL,AVG_LEVEL,SERIAL_NO,BATCH_NO FROM view_inventory_account_transaction WHERE 1 AND TECHNICIAN_ID <> 0
                GROUP BY TECHNICIAN_ID,WAREHOUSE_NAME,ITEM_ID,ITEM_NAME,REORDER_STOCK_LEVEL,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,INVENTORY_TYPE,ALERT_STOCK_LEVEL,AVG_LEVEL,SERIAL_NO,BATCH_NO,WAREHOUSE_MANAGER_NAME
            ) AS grouped_data WHERE 1 AND TECHNICIAN_ID <> 0 `

            mm.executeQuery(countQuery + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianActionLogs count.",
                    });
                }
                else {
                    mm.executeQuery('SELECT TECHNICIAN_ID,TECHNICIAN_NAME,ITEM_ID,ITEM_NAME,IFNULL(SUM(IN_QTY)-SUM(OUT_QTY),0) AS CURRENT_STOCK,REORDER_STOCK_LEVEL,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,INVENTORY_TYPE,ALERT_STOCK_LEVEL,AVG_LEVEL,SERIAL_NO,BATCH_NO FROM view_inventory_account_transaction WHERE 1 AND TECHNICIAN_ID <> 0 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianActionLogs information."
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
        } else {
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
            "message": "Internal Server Error."
        })
    }
}

exports.getPartDetails = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;

    }
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ITEM_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';
    let JOB_CARD_ID = req.body.JOB_CARD_ID ? req.body.JOB_CARD_ID : '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + "  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (JOB_CARD_ID) {
            if (IS_FILTER_WRONG == "0") {
                const countQuery = `SELECT COUNT(*) AS cnt FROM view_inventory_request_details WHERE 1 AND JOB_CARD_ID = ${JOB_CARD_ID} `
                mm.executeQuery(countQuery + countCriteria, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get technicianActionLogs count.",
                        });
                    }
                    else {
                        mm.executeQuery('SELECT * FROM view_inventory_request_details WHERE 1 AND JOB_CARD_ID = ' + JOB_CARD_ID + '' + criteria, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get technicianActionLogs information."
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
            } else {
                res.send({
                    code: 400,
                    message: "Invalid filter parameter."
                })
            }
        } else {
            res.send({
                code: 400,
                message: "Invalid JOB_CARD_ID parameter."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Internal Server Error."
        })
    }
}

exports.getStocksbyCategory = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ITEM_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY ITEM_ID, ITEM_NAME, VARIANT_NAME, WAREHOUSE_NAME,COALESCE(SERIAL_NO, ''), COALESCE(BATCH_NO, ''),ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TYPE, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL,AVG_LEVEL, INVENTORY_TRACKING_TYPE HAVING SUM(IN_QTY - OUT_QTY) > 0 order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY ITEM_ID, ITEM_NAME, VARIANT_NAME, WAREHOUSE_NAME,COALESCE(SERIAL_NO, ''), COALESCE(BATCH_NO, ''),ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TYPE, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL,AVG_LEVEL, INVENTORY_TRACKING_TYPE HAVING SUM(IN_QTY - OUT_QTY) > 0 order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            const countQuery = `SELECT COUNT(*) AS cnt FROM (SELECT ITEM_ID,WAREHOUSE_ID, ITEM_NAME, VARIANT_NAME, WAREHOUSE_NAME,COALESCE(SERIAL_NO, '') AS SERIAL_NO,COALESCE(BATCH_NO, '') AS BATCH_NO,ACTUAL_UNIT_ID, ACTUAL_UNIT_NAME, INVENTORY_TYPE, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL,AVG_LEVEL, INVENTORY_TRACKING_TYPE, SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction GROUP BY ITEM_ID, ITEM_NAME, VARIANT_NAME, WAREHOUSE_NAME,COALESCE(SERIAL_NO, ''), COALESCE(BATCH_NO, ''),ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TYPE, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL,AVG_LEVEL,WAREHOUSE_ID, INVENTORY_TRACKING_TYPE HAVING SUM(IN_QTY - OUT_QTY) > 0 ) AS grouped_data WHERE 1 AND WAREHOUSE_ID <> 0 ${filter}`
            mm.executeQuery(countQuery + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianActionLogs count.",
                    });
                }
                else {
                    mm.executeQuery(`SELECT ITEM_ID, ITEM_NAME, VARIANT_NAME, WAREHOUSE_NAME,COALESCE(SERIAL_NO, '') AS SERIAL_NO,COALESCE(BATCH_NO, '') AS BATCH_NO,ACTUAL_UNIT_ID, ACTUAL_UNIT_NAME, INVENTORY_TYPE, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL,AVG_LEVEL, INVENTORY_TRACKING_TYPE, SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction WHERE 1 ${criteria}`, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianActionLogs information."
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
        } else {
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
            "message": "Internal Server Error."
        })
    }
}

exports.getStocksbyCategorynew = (req, res) => {
    try {
        const { pageIndex, pageSize, sortKey = 'WAREHOUSE_ID', sortValue = 'DESC', filter = '' } = req.body;
        const supportKey = req.headers['supportkey'];
        let start = 0, end = 0;

        if (pageIndex && pageSize) {
            start = (pageIndex - 1) * pageSize;
            end = pageSize;
        }

        const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (IS_FILTER_WRONG !== "0") {
            return res.status(400).json({ code: 400, message: "Invalid filter parameter." });
        }

        const baseQuery = `FROM view_inventory_account_transaction WHERE WAREHOUSE_ID <> 0 ${filter}`;
        const groupBy = `GROUP BY ITEM_ID, VARIANT_NAME, ACTUAL_UNIT_ID, ACTUAL_UNIT_NAME, WAREHOUSE_ID, SERIAL_NO, BATCH_NO, INVENTORY_TRACKING_TYPE`;
        const havingClause = `HAVING SUM(IN_QTY - OUT_QTY) > 0`;
        const orderBy = `ORDER BY ${sortKey} ${sortValue}`;
        const countQuery = `SELECT COUNT(*) AS cnt FROM (SELECT ITEM_ID, WAREHOUSE_ID ${baseQuery} ${groupBy} ${havingClause}) AS grouped_data`;

        let dataQuery = `SELECT ITEM_ID, ITEM_NAME, VARIANT_NAME, ACTUAL_UNIT_ID, ACTUAL_UNIT_NAME, SERIAL_NO, BATCH_NO, 
            INVENTORY_TYPE, REORDER_STOCK_LEVEL, ALERT_STOCK_LEVEL, AVG_LEVEL, WAREHOUSE_NAME, INVENTORY_TRACKING_TYPE, 
            SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK 
            ${baseQuery} ${groupBy} ${havingClause} ${orderBy}`;

        if (pageIndex && pageSize) {
            dataQuery += ` LIMIT ${start}, ${end}`;
        }

        mm.executeQuery(countQuery, supportKey, (countError, countResults) => {
            if (countError) {
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(countError)}`, applicationkey);
                return res.status(400).json({ code: 400, message: "Failed to get stock count." });
            }

            mm.executeQuery(dataQuery, supportKey, (dataError, dataResults) => {
                if (dataError) {
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(dataError)}`, applicationkey);
                    return res.status(400).json({ code: 400, message: "Failed to get stock data." });
                }
                res.status(200).json({
                    code: 200,
                    message: "Success",
                    TAB_ID: 194,
                    count: countResults[0].cnt,
                    data: dataResults
                });
            });
        });
    } catch (error) {
        logger.error(`${req.headers['supportkey']} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        res.status(500).json({ code: 500, message: "Internal Server Error." });
    }
};

exports.getStocksbyUnit = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'WAREHOUSE_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY ITEM_ID,INVENTORY_TRACKING_TYPE, VARIANT_NAME, ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,WAREHOUSE_NAME,WAREHOUSE_ID  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY ITEM_ID,INVENTORY_TRACKING_TYPE, VARIANT_NAME, ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,WAREHOUSE_NAME,WAREHOUSE_ID  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        if (IS_FILTER_WRONG == "0") {
            const countQuery = `SELECT COUNT(*) AS cnt FROM (SELECT ITEM_ID,ITEM_NAME,VARIANT_NAME,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,WAREHOUSE_NAME,WAREHOUSE_ID,SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction WHERE 1 AND WAREHOUSE_ID<>0 ${filter} GROUP BY ITEM_ID,INVENTORY_TRACKING_TYPE, VARIANT_NAME, ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,WAREHOUSE_NAME,WAREHOUSE_ID) AS grouped_data WHERE 1  ${filter}`
            mm.executeQuery(countQuery + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianActionLogs count.",
                    });
                }
                else {
                    mm.executeQuery('SELECT ITEM_ID,ITEM_NAME,VARIANT_NAME,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,INVENTORY_TRACKING_TYPE,WAREHOUSE_NAME,WAREHOUSE_ID,SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction WHERE 1 AND WAREHOUSE_ID<>0 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianActionLogs information."
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
        } else {
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
            "message": "Internal Server Error."
        })
    }
}

exports.getStocksForUnit = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'ITEM_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY ITEM_ID,VARIANT_NAME, ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY ITEM_ID,VARIANT_NAME, ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            const countQuery = `SELECT COUNT(*) AS cnt FROM (SELECT ITEM_ID,ITEM_NAME,VARIANT_NAME,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction WHERE 1 ${filter} GROUP BY PARENT_ID,ITEM_ID, VARIANT_NAME, ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME) AS grouped_data WHERE 1  ${filter}`
            mm.executeQuery(countQuery + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianActionLogs count.",
                    });
                }
                else {
                    mm.executeQuery('SELECT ITEM_ID,ITEM_NAME,VARIANT_NAME,ACTUAL_UNIT_ID,ACTUAL_UNIT_NAME,SUM(IN_QTY - OUT_QTY) AS CURRENT_STOCK FROM view_inventory_account_transaction WHERE 1  ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianActionLogs information."
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
        } else {
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
            "message": "Internal Server Error."
        })
    }
}


exports.getStocksforWeb = (req, res) => {
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
        criteria = filter + "  order by " + sortKey + " " + sortValue;
    else
        criteria = filter + "  order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    let UNIT_ID = req.body.UNIT_ID ? req.body.UNIT_ID : '';
    let ITEM_ID = req.body.ITEM_ID ? req.body.ITEM_ID : '';
    let UnitFilter = '';
    let ItemFilter = '';
    if (UNIT_ID) {
        UnitFilter = ` u.ID = ${UNIT_ID}`;
    }
    if (ITEM_ID) {
        ItemFilter = ` AND i.ID = ${ITEM_ID}`
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            if (UNIT_ID && ITEM_ID) {
                const countQuery = `SELECT COUNT(*) AS cnt FROM inventory_master WHERE 1 AND ID = ${ITEM_ID} ${filter}`
                mm.executeQuery(countQuery, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get technicianActionLogs count.",
                        });
                    }
                    else {
                        let Query = `SELECT
    i.ID AS ITEM_ID,
    i.ITEM_NAME,
    u.ID AS UNIT_ID,
    u.NAME,
    COALESCE(SUM(t.IN_QTY - t.OUT_QTY), 0) AS CURRENT_STOCK
FROM
    inventory_master i
JOIN
    unit_master u ON ${UnitFilter} ${ItemFilter}
LEFT JOIN
    view_inventory_account_transaction t ON i.ID = t.ITEM_ID AND u.ID = t.ACTUAL_UNIT_ID
GROUP BY
    i.ID,
    i.ITEM_NAME,
    u.ID,
    u.NAME
ORDER BY
    i.ID,
    i.ITEM_NAME;`
                        mm.executeQuery(Query, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get technicianActionLogs information."
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
                    message: "parameters required unit id and item id."
                })
            }
        } else {
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
            "message": "Internal Server Error."
        })
    }

}



