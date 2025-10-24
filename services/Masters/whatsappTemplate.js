const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

const applicationkey = process.env.APPLICATION_KEY;

var whatsAppTemplateMaster = "whats_app_template_master";
var viewWhatsAppTemplateMaster = "view_" + whatsAppTemplateMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        CATEGORY: req.body.CATEGORY,
        LANGUAGES: req.body.LANGUAGES,
        HEADER_TYPE: req.body.HEADER_TYPE,
        HEADER_TEXT: req.body.HEADER_TEXT,
        HEADER_VALUES: req.body.HEADER_VALUES,
        BODY_TEXT: req.body.BODY_TEXT,
        BODY_VALUES: req.body.BODY_VALUES,
        FOOTER_TEXT: req.body.FOOTER_TEXT,
        BUTTON_VALUES: req.body.BUTTON_VALUES,
        CREATED_DATETIME: req.body.CREATED_DATETIME,
        SUMITTED_DATETIME: req.body.SUMITTED_DATETIME,
        STATUS: req.body.STATUS,
        TEMPLATE_ID: req.body.TEMPLATE_ID,
        TEMPLATE_STATUS: req.body.TEMPLATE_STATUS,
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('BODY_TEXT').optional(),
        body('LANGUAGES').optional(),
        body('HEADER_TEXT').optional(),
        body('FOOTER_TEXT').optional(),
        body('BUTTON_VALUES').optional(),
        body('STATUS').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewWhatsAppTemplateMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get whatsAppTemplate count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewWhatsAppTemplateMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get whatsAppTemplate information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 138,
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
    } else {
        try {
            mm.executeQueryData(`SELECT * FROM  whats_app_template_master WHERE NAME = ?`, [req.body.NAME], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to check WhatsAppTemplate information."
                    });
                    return;
                }
                if (results.length > 0) {
                    res.send({
                        "code": 300,
                        "message": "WhatsAppTemplate name already exists."
                    });
                } else {
                    mm.executeQueryData('INSERT INTO ' + whatsAppTemplateMaster + ' SET ?', data, supportKey, (error, results1) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to save WhatsAppTemplate information..."
                            });
                        } else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new whatsApp template: ${data.NAME}.`;

                            var logCategory = "WhatsApp Template"

                            let actionLog = {
                                "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog)
                            res.send({
                                "code": 200,
                                "message": "WhatsAppTemplate information saved successfully..."
                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};

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
        if (data[key]) {
            setData += `${key} = ?, `;
            recordData.push(data[key]);
        }
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).send({
            "code": 422,
            "message": errors.errors
        });
    } else {
        try {
            mm.executeQueryData(`SELECT * FROM ${whatsAppTemplateMaster} WHERE NAME = ? AND ID != ?`, [data.NAME, criteria.ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to check WhatsAppTemplate information."
                    });
                    return;
                }

                if (results.length > 0) {
                    res.status(300).send({
                        "code": 300,
                        "message": "WhatsAppTemplate name already exists."
                    });
                } else {
                    mm.executeQueryData(`UPDATE ${whatsAppTemplateMaster} SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${criteria.ID}`, [recordData], supportKey, (updateError, updateResults) => {
                        if (updateError) {
                            console.log(updateError);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(updateError), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to update WhatsAppTemplate information."
                            });
                        } else {
                            var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the whatsApp template:${data.NAME}.`;

                            var logCategory = "WhatsApp Template"

                            let actionLog = {
                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            dbm.saveLog(actionLog, systemLog)
                            res.send({
                                "code": 200,
                                "message": "WhatsAppTemplate information updated..."
                            })
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
};
