const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const mongoose = require("mongoose");
const { ObjectId } = require('mongodb');

const applicationkey = process.env.APPLICATION_KEY;

exports.getDistinctData = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const pageIndex = req.body.pageIndex || '';
    const pageSize = req.body.pageSize || '';
    const keywords = req.body.keywords;
    const sortKey = req.body.sortKey || `${keywords}`;
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || '';
    const TAB_ID = req.body.TAB_ID;
    const isMongo = req.body.isMongo ? 1 : 0;

    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const IS_FILTER_WRONG1 = mm.sanitizeFilter(keywords);

    let start = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex === '' && pageSize === '') {
        criteria = filter + " ORDER BY " + sortKey + " " + sortValue;
    } else {
        criteria = filter + " ORDER BY " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    }

    if (IS_FILTER_WRONG !== "0" && IS_FILTER_WRONG1 !== 0) {
        res.status(400).send({
            code: 400,
            message: "Invalid filter parameter.",
        });
        return;
    }

    try {
        if (isMongo == 1) {
            const tabNameRecord = await mongoose.connection.collection('coll_master').findOne({ _id: new ObjectId(TAB_ID) });
            if (!tabNameRecord) {
                return res.status(404).send({
                    code: 404,
                    message: "Table information not found."
                });
            }

            const tableName = tabNameRecord.COLL_NAME;
            const collection = mongoose.connection.collection(tableName);

            let filter = {};
            const distinctValues = await collection.distinct(keywords, filter);
            const data = distinctValues.map(value => ({ [keywords]: value }));

            const totalCount = distinctValues.length;

            res.status(200).json({
                code: 200,
                message: "Success",
                count: totalCount,
                data: data,
            });
        } else {
            const connection = mm.openConnection();
            const tableQuery = `SELECT NAME FROM tab_master WHERE ID = ?`;

            mm.executeDML(tableQuery, [TAB_ID], supportKey, connection, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    mm.rollbackConnection(connection);
                    res.status(400).send({
                        code: 400,
                        message: "Failed to get table information.",
                    });
                } else {
                    if (results && results.length > 0) {
                        const tableName = results[0].NAME;
                        const countQuery = `SELECT COUNT(DISTINCT ${keywords}) AS cnt FROM ${'view_' + tableName} WHERE 1 ${countCriteria}`;
                        mm.executeDML(countQuery, [], supportKey, connection, (error, results1) => {
                            if (error) {
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey);
                                mm.rollbackConnection(connection);
                                res.status(400).send({
                                    code: 400,
                                    message: "Failed to get count.",
                                });
                            } else {
                                if (results1 && results1.length > 0 && results1[0].cnt > 0) {
                                    const dataQuery = `SELECT DISTINCT ${keywords} FROM ${'view_' + tableName} WHERE 1 ${criteria}`;
                                    mm.executeDML(dataQuery, [], supportKey, connection, (error, results2) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey);
                                            res.status(400).send({
                                                code: 400,
                                                message: "Failed to get data.",
                                            });
                                        } else {
                                            mm.commitConnection(connection);
                                            res.status(200).send({
                                                code: 200,
                                                message: "Success",
                                                count: results1[0].cnt,
                                                data: results2,
                                            });
                                        }
                                    });
                                } else {
                                    res.status(200).send({
                                        code: 200,
                                        message: "No records found.",
                                    });
                                }
                            }
                        });
                    } else {
                        res.status(404).send({
                            code: 404,
                            message: "No table information found.",
                        });
                    }
                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey);
        console.error(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
        });
    }
};





