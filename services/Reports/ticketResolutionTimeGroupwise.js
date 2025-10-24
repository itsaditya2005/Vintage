const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const db = require('../../utilities/globalModule');
const async = require('async');
const global = require('../global');

const applicationkey = process.env.APPLICATION_KEY;

var ticketMaster = "ticket_master";
var viewTicketMaster = "view_" + ticketMaster;

function reqData(req) {
    var data = {
        TICKET_GROUP_ID: req.body.TICKET_GROUP_ID,
        TICKET_NO: req.body.TICKET_NO,
        USER_ID: req.body.USER_ID,
        MOBILE_NO: req.body.MOBILE_NO,
        EMAIL_ID: req.body.EMAIL_ID,
        CLOUD_ID: req.body.CLOUD_ID,
        QUESTION: req.body.QUESTION,
        STATUS: req.body.STATUS,
        PRIORITY: req.body.PRIORITY ? req.body.PRIORITY : 'M',
        IS_TAKEN: req.body.IS_TAKEN ? '1' : '0',
        TAKEN_BY_USER_ID: req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : 0,
        LAST_RESPONDED: req.body.LAST_RESPONDED ? req.body.LAST_RESPONDED : mm.getSystemDate(),
        CLIENT_ID: req.body.CLIENT_ID,
        SUBJECT: req.body.SUBJECT,
        DATE: req.body.DATE ? req.body.DATE : mm.getSystemDate(),
        ORG_ID: req.body.ORG_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TICKET_GROUP_ID').isInt(),
        body('TICKET_NO').isInt(),
        body('USER_ID').isInt(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('CLOUD_ID', ' parameter missing').exists(),
        body('QUESTION', ' parameter missing').exists(),
        body('ID').optional(),
    ]
}

exports.getTicketResolutionTimeGroupwise = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'TICKET_GROUP_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';

    if (pageIndex === '' && pageSize === '')
        criteria = " order by " + sortKey + " " + sortValue;
    else
        criteria = " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        var sql = `select TICKET_GROUP_ID,TICKET_GROUP_VALUE,COUNT(IF(HOUR(TIMEDIFF(LAST_RESPONDED, DATE)) <= 24 AND STATUS = 'C',1,null)) "CLOSED_BEFORE_24", COUNT(IF((HOUR(TIMEDIFF(LAST_RESPONDED, DATE)) > 24) AND (HOUR(TIMEDIFF(LAST_RESPONDED, DATE)) <= 48) AND STATUS ='C',1,null)) "CLOSED_BETWEEN_24_48",COUNT(IF((HOUR(TIMEDIFF(LAST_RESPONDED, DATE)) > 48) AND (HOUR(TIMEDIFF(LAST_RESPONDED, DATE)) <= 72) AND STATUS = 'C',1,null)) "CLOSED_BETWEEN_48_72", COUNT(IF(HOUR(TIMEDIFF(LAST_RESPONDED, DATE)) > 72 AND STATUS ='C',1,null)) "CLOSED_AFTER_72" from ` + viewTicketMaster + ` WHERE 1 ${filter} GROUP BY TICKET_GROUP_ID,TICKET_GROUP_VALUE ${criteria}`;
        mm.executeQuery(sql, supportKey, (error, result) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get ticket response time count...",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "TAB_ID": 127,
                    "data": result
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }
}