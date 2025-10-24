const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const applicationkey = process.env.APPLICATION_KEY;

var ticketGroupMaster = "ticket_group_master";
var viewTicketGroupMaster = "view_" + ticketGroupMaster;

function reqData(req) {
    var data = {
        PARENT_ID: req.body.PARENT_ID,
        TYPE: req.body.TYPE,
        VALUE: req.body.VALUE,
        URL: req.body.URL,
        SEQ_NO: req.body.SEQ_NO,
        IS_LAST: req.body.IS_LAST ? '1' : '0',
        ALERT_MSG: req.body.ALERT_MSG,
        STATUS: req.body.STATUS ? '1' : '0',
        PRIORITY: req.body.PRIORITY,
        DEPARTMENT_ID: req.body.DEPARTMENT_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        ORG_ID: req.body.ORG_ID,
        TICKET_TYPE: req.body.TICKET_TYPE
    }
    return data;
}

exports.validate = function () {
    return [
        body('PARENT_ID').isInt(),
        body('TYPE', ' parameter missing').exists(),
        body('VALUE', ' parameter missing').exists(),
        body('URL', ' parameter missing').exists(),
        body('SEQ_NO').isInt(),
        body('ALERT_MSG', ' parameter missing').exists(),
        body('PRIORITY', ' parameter missing').exists(),
        body('DEPARTMENT_ID').isInt(),
        body('ID').optional(),
    ]
}

exports.get = (req, res) => {
    try {
        var pageIndex = req.body.pageIndex ? req.body.pageIndex : 1;
        var pageSize = req.body.pageSize ? req.body.pageSize : 10;
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
                mm.executeQuery('select count(*) as cnt from ' + viewTicketGroupMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to get ticketGroups count...",
                        });
                    }
                    else {
                        mm.executeQuery('select * from ' + viewTicketGroupMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                res.status(400).json({
                                    "message": "Failed to get ticketGroup information..."
                                });
                            }
                            else {
                                res.status(200).json({
                                    "message": "success",
                                    "count": results1[0].cnt,
                                    "TAB_ID": 169,
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
                "message": "Something went wrong."
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

exports.ticketGroups = (req, res) => {
    try {
        var pageIndex = req.body.pageIndex ? req.body.pageIndex : 1;
        var pageSize = req.body.pageSize ? req.body.pageSize : 10;
        var start = 0;
        var end = 0;
        var ID = req.body.ID
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
        var parentFilter = ''
        if (ID) {
            var parentFilter = `AND PARENT_ID=(select PARENT_ID from TICKET_GROUP_MASTER where ID=((select PARENT_ID from TICKET_GROUP_MASTER where ID=${ID}))) AND TYPE='Q'  and STATUS=1`
        }
        var supportKey = req.headers['supportkey'];
        try {
            if (IS_FILTER_WRONG == "0") {
                mm.executeQuery('select count(*) as cnt from ' + viewTicketGroupMaster + ' where 1 ' + parentFilter + countCriteria, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to get ticketGroups count...",
                        });
                    }
                    else {
                        mm.executeQuery('select * from ' + viewTicketGroupMaster + ' where 1 ' + parentFilter + criteria, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                res.status(400).json({
                                    "message": "Failed to get ticketGroup information..."
                                });
                            }
                            else {
                                res.status(200).json({
                                    "message": "success",
                                    "count": results1[0].cnt,
                                    "TAB_ID": 169,
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
                "message": "Something went wrong."
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
            mm.executeQueryData('INSERT INTO ' + ticketGroupMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to save ticketGroup information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "TicketGroup information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
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
            mm.executeQueryData(`UPDATE ` + ticketGroupMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "message": "Failed to update ticketGroup information..."
                    });
                }
                else {
                    res.status(200).json({
                        "message": "TicketGroup information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.status(500).json({
                "message": "Something went wrong."
            });
        }
    }
}

exports.getParent1 = (req, res) => {
    var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQueryData(`SELECT T2.id, T2.VALUE,t2.PARENT_ID FROM (SELECT @r AS _id, (SELECT @r := parent_id FROM ticket_group_master WHERE id = _id) AS parent_id, @l := @l + 1 AS lvl FROM (SELECT @r := ${TICKET_GROUP_ID}, @l := 0) vars, ticket_group_master m WHERE @r <> 0) T1 JOIN ticket_group_master T2 ON T1._id = T2.id ORDER BY T1.lvl DESC `, [], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get ticketGroup information..."
                });
            }
            else {
                res.status(200).json({
                    "message": "success",
                    "data": results
                });
            }
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.getParent = (req, res) => {
    var TICKET_GROUP_ID = req.body.TICKET_GROUP_ID;
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQueryData(`SELECT T2.id, T2.VALUE,T2.PARENT_ID FROM (SELECT @r AS _id, (SELECT @r := parent_id FROM ticket_group_master WHERE id = _id) AS parent_id, @l := @l + 1 AS lvl FROM (SELECT @r := ${TICKET_GROUP_ID}, @l := 0) vars, ticket_group_master m WHERE @r <> 0) T1 JOIN ticket_group_master T2 ON T1._id = T2.id ORDER BY T1.lvl DESC `, [], supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get ticketGroup information..."
                });
            }
            else {
                res.status(200).json({
                    "message": "success",
                    "data": results
                });
            }
        });

    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}