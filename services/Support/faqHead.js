const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;

var faqHead = "faq_head";
var viewFaqHead = "view_" + faqHead;

function reqData(req) {
    var data = {
        NAME: req.body.NAME,
        STATUS: req.body.STATUS ? '1' : '0',
        PARENT_ID: req.body.PARENT_ID,
        IS_PARENT: req.body.IS_PARENT ? '1' : '0',
        PARENT_NAME: req.body.PARENT_NAME,
        CLIENT_ID: req.body.CLIENT_ID,
        SEQUENCE_NO: req.body.SEQUENCE_NO ? req.body.SEQUENCE_NO : 0,
        ORG_ID: req.body.ORG_ID,
        DESCRIPTION: req.body.DESCRIPTION,
        FAQ_HEAD_TYPE: req.body.FAQ_HEAD_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME', ' parameter missing').not().isEmpty().exists(),
        body('PARENT_ID').isInt().not().isEmpty().exists(),
        body('STATUS').not().isEmpty().exists(),
        body('IS_PARENT').not().isEmpty().exists(),
        body('ID').optional(),
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
                mm.executeQuery('select count(*) as cnt from ' + viewFaqHead + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get faqHeads count.",
                        });
                    }
                    else {
                        mm.executeQuery('select * from ' + viewFaqHead + ' where 1 ' + criteria, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.status(400).json({
                                    "message": "Failed to get faqHead information."
                                });
                            }
                            else {
                                res.status(200).json({
                                    "message": "success",
                                    "count": results1[0].cnt,
                                    "TAB_ID": 171,
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
            res.status(422).json({
                "message": errors.errors
            });
        }
        else {
            try {
                const connection = mm.openConnection();
                var parentName = '';
                mm.executeQueryData(`select * from  ${viewFaqHead}  where ID = ? LIMIT 1 `, [data.PARENT_ID], supportKey, (error, resultsParentName) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        mm.rollbackConnection(connection);
                        res.status(400).json({
                            "message": "Failed to get faqHead information..."
                        });
                    }
                    else {
                        if (resultsParentName.length > 0) {
                            console.log("Parent_Name: ", resultsParentName[0].PARENT_NAME);
                            if (resultsParentName[0].IS_PARENT == 0) {
                                parentName = (resultsParentName[0].PARENT_NAME == ' ' ? (resultsParentName[0].PARENT_NAME) : resultsParentName[0].PARENT_NAME);
                            }
                            else {
                                parentName = (resultsParentName[0].PARENT_NAME == ' ' ? (resultsParentName[0].PARENT_NAME) : resultsParentName[0].PARENT_NAME + '-') + resultsParentName[0].NAME;
                            }
                            data.PARENT_NAME = parentName;
                            mm.executeDML('INSERT INTO ' + faqHead + ' SET ?', data, supportKey, connection, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.status(400).json({
                                        "message": "Failed to save faqHead information..."
                                    });
                                }
                                else {
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "message": "FaqHead information saved successfully...",
                                    });
                                }
                            });
                        }
                        else {
                            data.PARENT_NAME = 'None';
                            mm.executeDML('INSERT INTO ' + faqHead + ' SET ?', data, supportKey, connection, (error, results) => {
                                if (error) {
                                    console.log(error);
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.status(400).json({
                                        "message": "Failed to save faqHead information..."
                                    });
                                }
                                else {
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "message": "FaqHead information saved successfully...",
                                    });
                                }
                            });
                        }
                    }
                });
            } catch (error) {
                console.log(req.method + " " + req.url + " ", error)
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
                var parentName = ' ', oldParentName = ' ';
                if (data.PARENT_ID == 0) {
                    data.PARENT_NAME = 'None';
                    Object.keys(data).forEach(key => {
                        setData += `${key}= ? , `;
                        recordData.push(data[key]);
                    });
                    mm.executeQueryData(`UPDATE ` + faqHead + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            res.status(400).json({
                                "message": "Failed to update faqHead information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "FaqHead parent information updated successfully...",
                            });
                        }
                    });
                }
                else {
                    mm.executeQueryData(`select PARENT_PARENT_NAME from  ${viewFaqHead}  where ID = ? `, [data.PARENT_ID], supportKey, (error, resultsParentNamebyId) => {
                        if (error) {
                            console.log(error);
                            res.status(400).json({
                                "message": "Failed to get Parent Name..."
                            });
                        }
                        else {
                            if (resultsParentNamebyId.length > 0) {
                                data.PARENT_NAME = resultsParentNamebyId[0].PARENT_PARENT_NAME;
                                Object.keys(data).forEach(key => {
                                    setData += `${key}= ? , `;
                                    recordData.push(data[key]);
                                });
                                mm.executeQueryData(`UPDATE ` + faqHead + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                                    if (error) {
                                        console.log(error);
                                        res.status(400).json({
                                            "message": "Failed to update faqHead information."
                                        });
                                    }
                                    else {
                                        res.status(200).json({
                                            "message": "FaqHead parent information updated successfully...",
                                        });
                                    }
                                });
                            }
                            else {
                                console.log(error);
                                res.status(400).json({
                                    "message": "Failed to get Parent Name..."
                                });
                            }
                        }
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
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });

    }
}


