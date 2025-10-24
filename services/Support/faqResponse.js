const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

var faqResponse = "faq_responses";
var viewFaqResponse = "view_" + faqResponse;

const applicationkey = process.env.APPLICATION_KEY;

function reqData(req) {
    var data = {
        FAQ_MASTER_ID: req.body.FAQ_MASTER_ID,
        USER_MOBILE: req.body.USER_MOBILE ? req.body.USER_MOBILE : '',
        USER_EMAIL_ID: req.body.USER_EMAIL_ID ? req.body.USER_EMAIL_ID : '',
        SUGGESTION: req.body.SUGGESTION,
        STATUS: req.body.STATUS ? req.body.STATUS : 'P',
        USER_ID: req.body.USER_ID ? req.body.USER_ID : '',
        CLIENT_ID: req.body.CLIENT_ID,
        USER_TYPE: req.body.USER_TYPE,
        USER_NAME: req.body.USER_NAME
    }
    return data;
}

exports.validate = function () {
    return [
        body('FAQ_MASTER_ID').isInt().not().isEmpty().exists(),
        body('USER_EMAIL_ID', ' parameter missing').not().isEmpty().exists(),
        body('SUGGESTION', ' parameter missing').optional(),
        body('ID').optional(),
    ]
}

exports.validateUpdate = () => {
    return [
        body('STATUS').not().isEmpty().exists(),
        body('ID').not().isEmpty().exists()
    ]
}

exports.get = (req, res) => {
    try {
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
        let criteria = '';
        var IS_FILTER_WRONG = mm.sanitizeFilter(filter);


        if (pageIndex === '' && pageSize === '')
            criteria = filter + " order by " + sortKey + " " + sortValue;
        else
            criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

        let countCriteria = filter;
        var supportKey = req.headers['supportkey'];

        try {
            if (IS_FILTER_WRONG == "0") {
                mm.executeQuery('select count(*) as cnt from ' + viewFaqResponse + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get faqResponses count...",
                        });
                    }
                    else {
                        mm.executeQuery('select * from ' + viewFaqResponse + ' where 1 ' + criteria, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.status(400).json({
                                    "message": "Failed to get faqResponse information..."
                                });
                            }
                            else {
                                res.status(200).json({
                                    "message": "success",
                                    "count": results1[0].cnt,
                                    "TAB_ID": 173,
                                    "data": results
                                });
                            }
                        });
                    }
                });
            } else {
                res.status(400).json({
                    message: "Invalid filter parameter."
                })
            }
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                message: "Something went wrong."
            });
        }
    } catch (error) {
        console.log(req.method + " " + req.url + " ", error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}

exports.create = (req, res) => {
    try {
        var data = reqData(req);
        const errors = validationResult(req);
        var supportKey = req.headers['supportkey'];

        if (!errors.isEmpty()) {
            console.log(errors);
            return res.status(422).json({
                "message": errors.errors
            });
        }

        const connection = mm.openConnection();
        const updateFaqMaster = (faqMasterId, connection, res) => {
            const queryCount = `SELECT SUM(IFNULL(CASE WHEN STATUS = 'P' THEN 1 ELSE 0 END,0)) AS POSITIVE_COUNT, SUM(IFNULL(CASE WHEN STATUS = 'N' THEN 1 ELSE 0 END,0)) AS NEGATIVE_COUNT FROM ${faqResponse} WHERE FAQ_MASTER_ID = ?`;

            mm.executeDML(queryCount, [faqMasterId], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    return res.status(400).json({
                        "message": "Failed to save faqResponse information..."
                    });
                }
                else {
                    results[0].POSITIVE_COUNT = results[0].POSITIVE_COUNT || 0;
                    results[0].NEGATIVE_COUNT = results[0].NEGATIVE_COUNT || 0;

                    mm.executeDML(`UPDATE faq_master SET POSITIVE_COUNT=?, NEGATIVE_COUNT=? WHERE ID=?`, [results[0].POSITIVE_COUNT, results[0].NEGATIVE_COUNT, faqMasterId], supportKey, connection, (error) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection);
                            return res.status(400).json({
                                "message": "Failed to update faqMaster information..."
                            });
                        } else {
                            mm.commitConnection(connection);
                            res.status(200).json({
                                "message": "FaqResponse information saved successfully..."
                            });
                        }
                    });
                }
            });
        };

        if (data.STATUS === 'U') {
            mm.executeDML(`DELETE FROM ${faqResponse} WHERE USER_ID = ? AND USER_TYPE = ? AND FAQ_MASTER_ID = ?`, [data.USER_ID, data.USER_TYPE, data.FAQ_MASTER_ID], supportKey, connection, (error) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    return res.status(400).json({
                        "message": "Failed to delete faqResponse information..."
                    });
                } else {
                    updateFaqMaster(data.FAQ_MASTER_ID, connection, res);
                }
            });
        } else {
            mm.executeDML(`SELECT * FROM ${faqResponse} WHERE USER_ID = ? AND USER_TYPE = ? AND FAQ_MASTER_ID = ?`, [data.USER_ID, data.USER_TYPE, data.FAQ_MASTER_ID], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    return res.status(400).json({
                        "message": "Failed to check existing faqResponse information..."
                    });
                }
                else {
                    if (results.length > 0) {
                        mm.executeDML(`UPDATE ${faqResponse} SET SUGGESTION=?, STATUS=? WHERE USER_ID=? AND USER_TYPE=? AND FAQ_MASTER_ID=?`, [data.SUGGESTION, data.STATUS, data.USER_ID, data.USER_TYPE, data.FAQ_MASTER_ID], supportKey, connection, (error) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                return res.status(400).json({
                                    "message": "Failed to update faqResponse information..."
                                });
                            } else {
                                updateFaqMaster(data.FAQ_MASTER_ID, connection, res);
                            }
                        });
                    } else {
                        mm.executeDML(`INSERT INTO ${faqResponse} SET ?`, data, supportKey, connection, (error) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                return res.status(400).json({
                                    "message": "Failed to save faqResponse information..."
                                });
                            }
                            else {
                                updateFaqMaster(data.FAQ_MASTER_ID, connection, res);
                            }
                        });
                    }
                }
            });
        }
    } catch (error) {
        console.log(req.method + " " + req.url + " ", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({ "message": "Something went wrong." });
    }
};



exports.update = (req, res) => {
    try {
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
                const connection = mm.openConnection();
                mm.executeDML(`UPDATE ` + faqResponse + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                    if (error) {
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        mm.rollbackConnection(connection);
                        res.status(400).json({
                            "message": "Failed to update faqResponse information..."
                        });
                    }
                    else {
                        if (data.STATUS == 'A') {
                            req.body.ID = req.body.FAQ_MASTER_ID;
                            require('./faq').update(req, res);
                            mm.commitConnection(connection);
                        }
                        else {
                            mm.commitConnection(connection);
                            res.status(200).json({
                                "message": "FaqResponse information updated successfully...",
                            });
                        }
                    }
                });
            } catch (error) {
                console.log(req.method + " " + req.url + " ", error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.status(500).json({
                    message: "Something went wrong."
                });
            }
        }
    } catch (error1) {
        console.log(req.method + " " + req.url + " ", error1)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error1), applicationkey);
        res.status(500).json({
            message: "Something went wrong."
        });
    }
}