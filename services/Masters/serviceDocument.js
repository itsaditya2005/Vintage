const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")

var serviceDocumentMaster = "service_document_master";
var viewServiceDocumentMaster = "view_" + serviceDocumentMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        SEQ_NO: req.body.SEQ_NO,
        STATUS: req.body.STATUS ? '1' : '0',
        DOCUMENT: req.body.DOCUMENT,
        TYPE: req.body.TYPE,
        LINK: req.body.LINK,
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUBCATEGORY_ID: req.body.SUBCATEGORY_ID,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [

        body('NAME').optional(), body('SEQ_NO').isInt().optional(), body('DOCUMENT').optional(), body('SERVICE_ID').isInt().optional(), body('ID').optional(),


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
            mm.executeQuery('select count(*) as cnt from ' + viewServiceDocumentMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get serviceDocument count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewServiceDocumentMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get serviceDocument information."
                            });
                        }
                        else {
                            res.status(200).json({
                                "code": 200,
                                "TAB_ID": 140,
                                "message": "success",
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
                // code: 400,
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            // code: 500,
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
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + serviceDocumentMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save serviceDocument information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created new service document ${data.NAME}.`;
                    var logCategory = "Service Document"

                    let actionLog = {
                        "SOURCE_ID": results.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    res.status(200).json({
                        "code": 200,
                        "message": "ServiceDocument information saved successfully...",
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
        setData += `${key} = ?, `;
        recordData.push(data[key] !== undefined ? data[key] : null); // Push null if the value is undefined
    });

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + serviceDocumentMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update serviceDocument information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has update the details of ${data.NAME}.`;
                    var logCategory = "Service Document"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }

                    dbm.saveLog(actionLog, systemLog)
                    return res.send({
                        code: 200,
                        "message": "service document updated Successfully...",
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



exports.mapServiceDocumentOLD = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var SERVICE_DATA = req.body.SERVICE_DATA;
    var CLIENT_ID = req.body.CLIENT_ID;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    try {
        const connection = mm.openConnection();

        const deleteQuery = `DELETE FROM service_documemt_mapping WHERE SERVICE_ID = ?`;

        mm.executeDML(deleteQuery, [SERVICE_ID], supportKey, connection, (deleteError) => {
            if (deleteError) {
                console.log(deleteError);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(deleteError), applicationkey);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to delete existing service document mappings."
                });
            }

            const insertQuery = `INSERT INTO service_documemt_mapping (MASTER_ID, SERVICE_ID, STATUS, CLIENT_ID) VALUES (?, ?, ?, ?)`;
            async.eachSeries(SERVICE_DATA, (data, callback) => {
                const { MASTER_ID, STATUS } = data;
                if (MASTER_ID && STATUS !== undefined) {
                    const values = [SERVICE_ID, MASTER_ID, STATUS, CLIENT_ID];
                    mm.executeDML(insertQuery, values, supportKey, connection, (insertError) => {
                        if (insertError) {
                            console.log(insertError);
                            return callback(new Error("Failed to insert new service document mapping."));
                        }
                        callback();
                    });
                } else {
                    callback(new Error("Invalid SERVICE_ID or STATUS in SERVICE_DATA"));
                }
            }, (err) => {
                if (err) {
                    mm.rollbackConnection(connection);
                    return res.status(400).json({
                        "code": 400,
                        "message": "Failed to save new service document mappings."
                    });
                } else {
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "code": 200,
                        "message": "Service document mappings replaced successfully."
                    });
                }
            });
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Internal Server Error."
        });
    }
};


exports.unMappedServiceDocument = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var SERVICE_ID = req.body.SERVICE_ID;
    var CATEGORY_ID = req.body.CATEGORY_ID;
    var SUBCATEGORY_ID = req.body.SUBCATEGORY_ID;
    console.log(SERVICE_ID, CATEGORY_ID, SUBCATEGORY_ID);
    if (!SERVICE_ID) {
        return res.send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }
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
        if (IS_FILTER_WRONG == "0" && SERVICE_ID != '') {
            mm.executeQuery(`select count(*) as cnt from service_document_master p where 1 AND ID NOT IN (select MASTER_ID from service_documemt_mapping where SERVICE_ID = ${SERVICE_ID} ) AND CATEGORY_ID = ${CATEGORY_ID} AND SUBCATEGORY_ID = ${SUBCATEGORY_ID} ` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get  count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from service_document_master p where 1 AND ID NOT IN (select MASTER_ID from service_documemt_mapping where SERVICE_ID = ${SERVICE_ID} )AND CATEGORY_ID = ${CATEGORY_ID} AND SUBCATEGORY_ID = ${SUBCATEGORY_ID}` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get  information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "code": 200,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter or technician id."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}




exports.unMapService = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var data = req.body.DATA;
    var STATUS = req.body.STATUS ? 1 : 0;
    console.log("\n\n\nREQ BODY:", req.body);
    // if (!SERVICE_ID || !STATUS || !data) {
    //     return res.send({
    //         code: 400,
    //         message: "Missing required fields in the request body.",
    //     });
    // }
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from service_documemt_mapping where MASTER_ID=? AND SERVICE_ID=?`, [roleDetailsItem.MASTER_ID, SERVICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update service_documemt_mapping set  STATUS = ? where  ID = ?`, [STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        inner_callback(null);
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert service document information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has unmapped service document.`;

                var logCategory = "Service Document"

                let actionLog = {
                    "SOURCE_ID": SERVICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                return res.send({
                    code: 200,
                    "message": "New service document Successfully added",
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


exports.mappedServiceDocument = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var SERVICE_ID = req.body.SERVICE_ID;
    if (!SERVICE_ID) {
        return res.send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }
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
        if (IS_FILTER_WRONG == "0" && SERVICE_ID != '') {
            mm.executeQuery(`select count(*) as cnt from service_document_master p where 1 AND ID  IN (select MASTER_ID from service_documemt_mapping where SERVICE_ID = ${SERVICE_ID})` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get  count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from service_document_master p where 1 AND ID IN (select MASTER_ID from service_documemt_mapping where SERVICE_ID = ${SERVICE_ID})` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get  information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "code": 200,
                                "TAB_ID": 140,
                                "message": "success",
                                "count": results1[0].cnt,
                                "data": results,
                            });
                        }
                    });
                }
            });
        }
        else {
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter or technician id."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}



exports.mapServiceDocument = (req, res) => {
    var SERVICE_ID = req.body.SERVICE_ID;
    var STATUS = req.body.STATUS ? 1 : 0;
    var data = req.body.SERVICE_DATA;
    console.log("\n\n\nREQ BODY:", req.body)

    if (!SERVICE_ID || !STATUS || !data) {
        return res.send({
            code: 400,
            message: "Missing required fields in the request body.",
        });
    }
    var supportKey = req.headers['supportkey'];
    try {
        const connection = mm.openConnection()
        async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
            mm.executeDML(`select * from service_documemt_mapping where MASTER_ID=? and SERVICE_ID=?`, [roleDetailsItem.MASTER_ID, SERVICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                if (error) {
                    console.log(error);
                    inner_callback(error);
                } else {
                    if (resultsIsDataPresent.length > 0) {
                        mm.executeDML(`update service_documemt_mapping set STATUS = ? where  ID = ?`, [STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    } else {
                        mm.executeDML('INSERT INTO service_documemt_mapping (SERVICE_ID,MASTER_ID,STATUS,CLIENT_ID,CATEGORY_ID,SUBCATEGORY_ID) VALUES (?,?,?,?,?,?)', [SERVICE_ID, roleDetailsItem.MASTER_ID, STATUS, 1, req.body.CATEGORY_ID, req.body.SUBCATEGORY_ID], supportKey, connection, (error, resultsInsert) => {
                            if (error) {
                                console.log("error", error);
                                inner_callback(error);
                            } else {
                                inner_callback(null);
                            }
                        });
                    }
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection);
                res.send({
                    "code": 400,
                    "message": "Failed to Insert service document information..."
                });
            } else {
                var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped document to the service.`;

                var logCategory = "Service Document"

                let actionLog = {
                    "SOURCE_ID": SERVICE_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                }

                dbm.saveLog(actionLog, systemLog)
                mm.commitConnection(connection);
                return res.send({
                    code: 200,
                    "message": "New service document Successfully added",
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

