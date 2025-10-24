const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;

var ticketFaqMapping = "ticket_faq_mapping";
var viewTicketFaqMapping = "view_" + ticketFaqMapping;

function reqData(req) {
    var data = {
        TICKET_GROUP_ID: req.TICKET_GROUP_ID,
        FAQ_MASTER_ID: req.FAQ_MASTER_ID,
        STATUS: req.IS_SELECTED ? 1 : 0,
        CLIENT_ID: req.CLIENT_ID,
        SEQ_NO: req.SEQ_NO
    }
    return data;
}

exports.addBulk = (req, res) => {
    try {
        var data = req.body.data ? req.body.data : [];
        console.log("data ", req.body.data);
        var supportKey = req.headers['supportkey'];
        var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;

        if ((!TICKET_GROUP_ID || TICKET_GROUP_ID == " ") || (data.length <= 0)) {
            res.status(400).json({
                "message": "TicketGroupId  or data parameter missing"
            });

        } else {
            const connection = mm.openConnection();
            async.eachSeries(data, function iteratorOverElems(applicationMappingitem, callback) {
                applicationMappingitem.TICKET_GROUP_ID = TICKET_GROUP_ID;
                var dataRecord = reqData(applicationMappingitem);

                mm.executeDML(`select * from  ${viewTicketFaqMapping} where TICKET_GROUP_ID = ? and FAQ_MASTER_ID = ?`, [TICKET_GROUP_ID, dataRecord.FAQ_MASTER_ID], supportKey, connection, (error, resultsIsDataPresent) => {
                    if (error) {
                        console.log(error)
                        callback(error);
                    }
                    else {
                        if (resultsIsDataPresent.length > 0) {
                            mm.executeDML(`update ${ticketFaqMapping} set SEQ_NO = ?, STATUS = ? where ID = ?`, [dataRecord.SEQ_NO, dataRecord.STATUS, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
                                if (error) {
                                    console.log(error);
                                    callback(error)
                                }
                                else {
                                    callback(null)
                                }
                            });
                        }
                        else {
                            mm.executeDML('INSERT INTO ' + ticketFaqMapping + ' SET ?', dataRecord, supportKey, connection, (error, resultsInsert) => {
                                if (error) {
                                    console.log(error)
                                    callback(error)
                                }
                                else {
                                    callback(null);
                                }
                            });
                        }

                    }
                });
            }, function subCb(error) {
                if (error) {
                    mm.rollbackConnection(connection);
                    res.status(400).json({
                        "message": "Failed to add ticketFaqMapping details."
                    });
                } else {
                    console.log("inserted successfully...")
                    mm.commitConnection(connection);
                    res.status(200).json({
                        "message": "TicketFaqMapping information added successfully.",
                    });
                }
            });
        }

    } catch (error) {
        console.log(req.method + " " + req.url + " ", error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.get = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;
        var FAQ_HEAD_ID = req.body.FAQ_HEAD_ID ? req.body.FAQ_HEAD_ID : 0;
        var FAQ_TYPE = req.body.FAQ_TYPE
        var filter = ` AND FAQ_TYPE =  "${FAQ_TYPE}"`
        var filterQuery = FAQ_HEAD_ID != 0 ? ` where  FAQ_HEAD_ID = ${FAQ_HEAD_ID}` : ''
        var ORG_ID = req.body.ORG_ID;
        var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

        if (IS_FILTER_WRONG == "0") {
            if (TICKET_GROUP_ID) {
                var query = `SELECT m.ID AS FAQ_MASTER_ID,m.*,IF((SELECT STATUS FROM ${viewTicketFaqMapping} where  FAQ_MASTER_ID= m.ID AND TICKET_GROUP_ID= ? and ORG_ID=?)=1,1,0) AS IS_SELECTED,(SELECT SEQ_NO FROM ${viewTicketFaqMapping} where FAQ_MASTER_ID= m.ID AND TICKET_GROUP_ID= ? and ORG_ID=?) as SEQ_NO from view_faq_master m   ${filterQuery} ${filter}`;
                mm.executeQueryData(query, [TICKET_GROUP_ID, ORG_ID, TICKET_GROUP_ID, ORG_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to get record..."
                        });
                    }
                    else {
                        if (results.length > 0) {
                            res.status(200).json({
                                "message": "success",
                                "data": results
                            });
                        }
                        else {
                            res.status(200).json({
                                "TAB_ID": 168,
                                "message": "No data Found..."
                            });
                        }
                    }
                });
            }
            else {
                res.status(400).json({
                    "message": "Parameters missing TickitGroupID... "
                });
            }
        } else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }
    } catch (error) {
        console.log(req.method + " " + req.url + " ", error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.getTicketFaqMappings = (req, res) => {
    try {
        var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;
        var ORG_ID = req.body.ORG_ID;
        var FAQ_TYPE = req.body.FAQ_TYPE
        var supportKey = req.headers['supportkey'];
        if (!TICKET_GROUP_ID || !ORG_ID) {
            res.status(422).json({
                "message": "Parameters missing.. "
            });
        } else {
            mm.executeQueryData('select * from ' + viewTicketFaqMapping + ' where TICKET_GROUP_ID = ?  AND ORG_ID = ? AND STATUS = 1 AND FAQ_TYPE=?', [TICKET_GROUP_ID, ORG_ID, FAQ_TYPE], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get ticket information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "success",
                        "data": results
                    });
                }
            });
        }
    } catch (error) {
        console.log(req.method + " " + req.url + " ", error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}