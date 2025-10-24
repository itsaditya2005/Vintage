const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;

var faqMaster = "faq_master";
var viewFaqMaster = "view_" + faqMaster;

function reqData(req) {
    var data = {
        FAQ_HEAD_ID: req.body.FAQ_HEAD_ID,
        QUESTION: req.body.QUESTION,
        ANSWER: req.body.ANSWER,
        ORG_ID: req.body.ORG_ID,
        SEQ_NO: req.body.SEQ_NO,
        POSITIVE_COUNT: req.body.POSITIVE_COUNT ? req.body.POSITIVE_COUNT : 0,
        NEGATIVE_COUNT: req.body.NEGATIVE_COUNT ? req.body.NEGATIVE_COUNT : 0,
        URL: req.body.URL,
        TAGS: req.body.TAGS,
        STATUS: req.body.STATUS ? '1' : '0',
        NEGATIVE_FLAG: req.body.NEGATIVE_FLAG ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID,
        FAQ_TYPE: req.body.FAQ_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('FAQ_HEAD_ID').isInt(),
        body('QUESTION', ' parameter missing').exists(),
        body('ANSWER', ' parameter missing').exists(),
        body('SEQ_NO').isInt(),
        body('POSITIVE_COUNT').isInt().optional(),
        body('NEGATIVE_COUNT').isInt().optional(),
        body('URL', ' parameter missing').optional(),
        body('TAGS', ' parameter missing').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewFaqMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get faqs count...",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewFaqMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get faq information..."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "count": results1[0].cnt,
                                "TAB_ID": 172,
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
            mm.executeQueryData('INSERT INTO ' + faqMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save faq information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "Faq information saved successfully...",
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
        setData += `${key}= ? , `;
        recordData.push(data[key]);
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + faqMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update faq information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "Faq information updated successfully...",
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

exports.markHelpfulCount = (req, res) => {
    var FAQ_ID = req.body.FAQ_ID;
    var type = req.body.TYPE;
    var supportKey = req.headers['supportkey'];

    if (!FAQ_ID && FAQ_ID == undefined && type == '' && type == undefined) {
        console.log("Empty FAQ_ID");
        res.status(400).json({
            "message": "FAQ ID OR TYPE parameter missing..."
        });
    }
    else {
        const connection = mm.openConnection();
        if (type === 'P') {
            mm.executeQuery(`select POSITIVE_COUNT from  view_faq_master WHERE ID = ${FAQ_ID}`, supportKey, (error, resultsPositiveCount) => {
                if (error) {
                    res.status(400).json({
                        "message": "Failed to get POSITIVE_COUNT count..."
                    });
                }
                else {
                    console.log(resultsPositiveCount);
                    var faqPositiveCount = resultsPositiveCount[0].POSITIVE_COUNT + 1;
                    mm.executeDML('UPDATE faq_master set POSITIVE_COUNT = ?  where ID = ?', [faqPositiveCount, FAQ_ID], supportKey, connection, (error, resultsUpdateCount) => {
                        if (error) {
                            console.log(error);
                            mm.rollbackConnection(connection);
                            res.status(400).json({
                                "message": "Failed to Update count..."
                            });
                        }
                        else {
                            mm.commitConnection(connection);
                            res.status(400).json({
                                "message": "Positive count updated successfully..."
                            });
                        }
                    });
                }
            })
        }
        else if (type === 'N') {
            console.log(req.body);
            var FAQ_MASTER_ID = req.body.FAQ_MASTER_ID
            var userMobile = req.body.USER_MOBILE;
            var userEmail = req.body.USER_EMAIL_ID;
            var suggestion = req.body.SUGGESTION;
            var STATUS = req.body.STATUS ? req.body.STATUS : 'P';
            if (((!userMobile && userMobile === undefined && userMobile === '') || (!userEmail && userEmail === undefined && userEmail === '')) && (!suggestion && suggestion == undefined)) {
                res.status(400).json({
                    "message": "parameters missing."
                });
            }
            else {
                mm.executeQueryData(`select NEGATIVE_COUNT from  view_faq_master WHERE ID = ?`, [FAQ_ID], supportKey, (error, resultsNegativeCount) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        var faqNegativeCount = resultsNegativeCount[0].NEGATIVE_COUNT + 1;
                        mm.executeDML('UPDATE faq_master set NEGATIVE_COUNT = ? , NEGATIVE_FLAG = 1 where ID = ?', [faqNegativeCount, FAQ_ID], supportKey, connection, (error, resultsUpdateCount) => {
                            if (error) {
                                console.log(error);
                                mm.rollbackConnection(connection);
                                res.status(400).json({
                                    "message": "Failed to Update count..."
                                });
                            }
                            else {
                                require('./faqResponse').create(req, res);
                                mm.commitConnection(connection);
                            }
                        });
                    }
                });
            }
        }
    }
}

exports.searchFaq = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var TAGS = req.body.TAGS;
    var QUESTION = req.body.QUESTION;

    try {
        mm.executeQuery(`select count(*) as cnt from ` + viewFaqMaster + ` where TAGS Like '%${TAGS}%' OR QUESTION Like '%${QUESTION}%' `, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.status(400).json({
                    "message": "Failed to get faq tag matched count...",
                });
            }
            else {
                mm.executeQuery(`select * from ` + viewFaqMaster + ` where TAGS Like '%${TAGS}%' OR QUESTION Like '%${QUESTION}%' `, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get faq tag matched information..."
                        });
                    }
                    else {
                        res.status(200).json({
                            "message": "success",
                            "count": results1[0].cnt,
                            "data": results
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