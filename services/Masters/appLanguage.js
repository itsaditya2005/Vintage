const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const fs = require('fs');
const path = require('path');
const { FILE } = require('dns');

const applicationkey = process.env.APPLICATION_KEY;

var appLanguageMaster = "app_language_master";
var viewAppLanguageMaster = "view_" + appLanguageMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SHORT_CODE: req.body.SHORT_CODE,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO,
        DEAFULT_JSON: req.body.DEAFULT_JSON,
        DRAFT_JSON_URL: req.body.DRAFT_JSON_URL,
        LIVE_JSON_URL: req.body.LIVE_JSON_URL,
        APPLICATION_TYPE: req.body.APPLICATION_TYPE,
        ICON: req.body.ICON,
        CLIENT_ID: req.body.CLIENT_ID,
        SIGN: req.body.SIGN
    }
    return data;
}

exports.validate = function () {
    return [
        body('NAME').optional(),
        body('SHORT_CODE').optional(),
        body('SEQ_NO').isInt().optional(),
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
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery('select count(*) as cnt from ' + viewAppLanguageMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get app language count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewAppLanguageMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get app language information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 1,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
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
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData('select count(*) as cnt from ' + viewAppLanguageMaster + ' where 1 AND ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get app language count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewAppLanguageMaster + ' where 1 AND ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get app language information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "TAB_ID": 1,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
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
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            data, DRAFT_JSON_URL = 'Default.json';
            data.DEAFULT_JSON = 'Default.json';
            mm.executeQueryData('INSERT INTO ' + appLanguageMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save app language information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "App language information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(400).json({
                "message": "Something went wrong."
            });
        }
    }
}

exports.addAppLanguage = (req, res) => {

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
            data.DEAFULT_JSON = 'DefaultEnglish.json'
            data.DRAFT_JSON_URL = `${data.NAME}.json`
            mm.executeQueryData('INSERT INTO ' + appLanguageMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save app language information..",
                    });
                }
                else {
                    const fs = require('fs');
                    const SourceFileName = `Default.json`;
                    const sourceFilePath = path.join(__dirname, '../../uploads/DraftJson/', SourceFileName);
                    const DestinationFileName = data.NAME + '.json';
                    const destinationFilePath = path.join(__dirname, '../../uploads/DraftJson/', DestinationFileName);
                    fs.readFile(sourceFilePath, 'utf8', (err, data) => {
                        if (err) {
                            console.log("err", err)
                            res.status(400).json({
                                "message": "Failed to save app language information..",
                            });
                        }
                        else {
                            const jsonData = JSON.parse(data);
                            fs.writeFile(destinationFilePath, JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
                                if (err) {
                                    console.log("err", err)
                                    res.status(400).json({
                                        "message": "Failed to save app language information..",
                                    });
                                }
                                else {
                                    console.log("sucess")
                                    res.status(200).json({
                                        "message": "App language information saved successfully...",
                                    });
                                }

                            });
                        }
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.status(500).json({
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
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + appLanguageMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update app language information."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "App language information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(400).json({
                "message": "Something went wrong."
            });
        }
    }
}

exports.saveAsDraft = (req, res) => {
    const DRAFT_JSON = req.body.DRAFT_JSON;
    var LANGUAGE = req.body.LANGUAGE;
    var DRAFT_JSON_URL = req.body.DRAFT_JSON_URL;
    const supportKey = req.headers['supportkey'];
    try {
        if (!DRAFT_JSON || !LANGUAGE) {
            console.log("Missing parameters DEAFULT_JSON or LANGUAGE in request body.");
            res.status(400).json({
                "message": "Missing parameters DEAFULT_JSON or LANGUAGE in request body."
            });
        } else {
            const JSON_DATA = JSON.stringify(DRAFT_JSON);
            const filePath = path.join(__dirname, '../../uploads/DraftJson/', DRAFT_JSON_URL);
            fs.writeFile(filePath, JSON_DATA, (err) => {
                if (err) {
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                    console.log(err);
                    res.status(400).json({
                        "message": "failed to write JSON file."
                    });
                } else {
                    res.status(200).json({
                        "message": "App language information saved successfully and JSON file created.",
                    });
                }
            });
        }
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
};

exports.saveAsFinal = (req, res) => {
    const DRAFT_JSON = req.body.DRAFT_JSON;
    const LANGUAGE = req.body.LANGUAGE;
    const LANGUAGE_ID = req.body.LANGUAGE_ID;
    const DRAFT_JSON_URL = req.body.DRAFT_JSON_URL;
    var supportKey = req.headers['supportkey'];
    try {
        if (!DRAFT_JSON) {
            console.log("Missing parameters DRAFT_JSON in request body.");
            res.send({
                "code": 400,
                "message": "Missing parameters DRAFT_JSON in request body."
            });
        } else {
            const JSON_DATA = JSON.stringify(DRAFT_JSON);

            const FinalJsonName = `${LANGUAGE}.json`;
            const DraftfilePath = path.join(__dirname, '../../uploads/DraftJson/', DRAFT_JSON_URL);
            const LivefilePath = path.join(__dirname, '../../uploads/LiveJson/', FinalJsonName);
            fs.writeFile(DraftfilePath, JSON_DATA, (err) => {
                if (err) {
                    console.log(err);
                    res.status(400).json({
                        "message": "failed to write JSON file."
                    });
                } else {
                    fs.writeFile(LivefilePath, JSON_DATA, (err) => {
                        if (err) {
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                            console.log(err);
                            res.status(400).json({
                                "message": "failed to write JSON file."
                            });
                        } else {
                            mm.executeQueryData(`UPDATE ` + appLanguageMaster + ` SET LIVE_JSON_URL = '${FinalJsonName}' where ID = ?`, [LANGUAGE_ID], supportKey, (error, results) => {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "message": "Failed to update app language information."
                                    });
                                }
                                else {
                                    res.status(200).json({
                                        "message": "App language information saved successfully and JSON file created.",
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.getAppLanguageMaster = (req, res) => {
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
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData('select count(*) as cnt from ' + viewAppLanguageMaster + ' where 1 AND ID=?' + countCriteria, ID, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get app language count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewAppLanguageMaster + ' where 1 AND ID=?' + criteria, ID, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get app language information."
                            });
                        }
                        else {
                            fs.readFile(path.join(__dirname, '../../uploads/DraftJson/'+results[0].DEAFULT_JSON), (err, data1) => {
                                if (err) {
                                    console.log("error in reading file");
                                    res.status(400).json({
                                        "message": "Failed to get app language information.",
                                    });
                                } else {
                                    fs.readFile(path.join(__dirname, '../../uploads/DraftJson/'+results[0].DRAFT_JSON_URL), (err, data2) => {
                                        if (err) {
                                            console.log("error in reading file");
                                            res.status(400).json({
                                                "message": "Failed to get app language information.",
                                            });
                                        } else {
                                            res.status(200).json({
                                                "message": "success",
                                                "count": results1[0].cnt,
                                                "data": results,
                                                "DEAFULT_JSON": JSON.parse(data1),
                                                "DRAFT_JSON": JSON.parse(data2),
                                            });
                                        }
                                    })

                                }
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}