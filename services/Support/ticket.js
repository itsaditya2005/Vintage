const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
const db = require('../../utilities/globalModule');
const async = require('async');
const global = require('../global');

const applicationkey = process.env.APPLICATION_KEY;

var ticketMaster = "ticket_master";
var viewTicketMaster = "view_" + ticketMaster;

var notificationMaster = "notification_master";
var viewNotificationMaster = "view_" + notificationMaster;

var ticketLogDetails = "ticket_log_details";
var viewTicketLogDetails = "view_" + ticketLogDetails;

var ticketDetails = "ticket_details";
var viewTicketDetails = "view_" + ticketDetails;

var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

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
        ORG_ID: req.body.ORG_ID,
        TRANSFER_USER_ID: req.body.TRANSFER_USER_ID ? req.body.TRANSFER_USER_ID : req.body.TAKEN_BY_USER_ID,
        RECIVER_ID: req.body.RECIVER_ID,
        USER_TYPE: req.body.USER_TYPE,
        ORDER_ID: req.body.ORDER_ID,
        SHOP_ORDER_ID: req.body.SHOP_ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        IS_TAKEN_STATUS: req.body.IS_TAKEN_STATUS ? req.body.IS_TAKEN_STATUS : '',
        TAKEN_FROM_USER_ID: req.body.TAKEN_FROM_USER_ID ? req.body.TAKEN_FROM_USER_ID : 0,
    }
    return data;
}

exports.validate = function () {
    return [
        body('TICKET_GROUP_ID').isInt(),
        body('TICKET_NO', ' parameter missing').exists(),
        body('USER_ID').isInt(),
        body('MOBILE_NO', ' parameter missing').exists(),
        body('EMAIL_ID', ' parameter missing').exists(),
        body('CLOUD_ID', ' parameter missing').exists(),
        body('QUESTION', ' parameter missing').exists(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTicketMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickets count...",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTicketMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
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
                                "TAB_ID": 127,
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

exports.getUserwiseReport = (req, res) => {
    let orgId = req.body.ORG_ID;
    var supportKey = req.headers['supportkey'];
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
        criteria = filter + " GROUP BY CREATOR_EMPLOYEE_ID, CREATOR_EMPLOYEE_NAME order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY CREATOR_EMPLOYEE_ID, CREATOR_EMPLOYEE_NAME order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            if (orgId) {
                mm.executeQueryData(`SELECT COUNT(DISTINCT CREATOR_EMPLOYEE_ID,CREATOR_EMPLOYEE_NAME) as cnt FROM view_ticket_master WHERE ORG_ID = ? ${countCriteria}`, [orgId], supportKey, (error, resultsCount) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get user ticket count..."
                        });
                    }
                    else {
                        mm.executeQueryData(`select CREATOR_EMPLOYEE_ID,CREATOR_EMPLOYEE_NAME,count(ID) as TOTAL,COUNT(IF(STATUS='P',1,NULL)) AS CREATED,COUNT(IF(STATUS='S',1,NULL)) AS ASSIGNED,COUNT(IF(STATUS='R',1,NULL)) AS ANSWERED,COUNT(IF(STATUS='C',1,NULL)) AS CLOSED, COUNT(IF(STATUS='O',1,NULL)) AS RE_OPEN, COUNT(IF(STATUS='H',1,NULL)) AS ON_HOLD, COUNT(IF(STATUS='B',1,NULL)) AS BANNED from ` + viewTicketMaster + ` where ORG_ID = ? AND CREATOR_EMPLOYEE_ID IS NOT NULL ${criteria} `, [orgId], supportKey, (error, results1) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.status(400).json({
                                    "message": "Failed to get user ticket count..."
                                });
                            }
                            else {
                                res.status(200).json({
                                    "message": "success",
                                    "TAB_ID": 127,
                                    "count": resultsCount[0].cnt,
                                    "data": results1
                                });
                            }
                        });
                    }
                });
            }
            else {
                res.status(400).json({
                    "message": "Organisation Id OR Department Id missing..."
                });
            }
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
}

exports.getDepartmentwiseReport = (req, res) => {
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

    let organisationId = req.body.ORG_ID;
    let departmentId = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : 0;
    var fromDate = req.body.FROM_DATE;
    var toDate = req.body.TO_DATE;
    var searchText = req.body.searchText;
    var supportKey = req.headers['supportkey'];

    try {
        if (IS_FILTER_WRONG == "0") {
            if (organisationId) {
                mm.executeQueryData(`select DEPARTMENT_ID, DEPARTMENT_NAME, count(ID) as TOTAL, COUNT(IF(STATUS='P',1,NULL)) AS CREATED,COUNT(IF(STATUS='S',1,NULL)) AS ASSIGNED,COUNT(IF(STATUS='R',1,NULL)) AS ANSWERED,COUNT(IF(STATUS='O',1,NULL)) AS RE_OPEN, COUNT(IF(STATUS='C',1,NULL)) AS CLOSED,COUNT(IF(STATUS='H',1,NULL)) AS ON_HOLD,COUNT(IF(STATUS='B',1,NULL)) AS BANNED from ` + viewTicketMaster + ` where ORG_ID = ? ${filter} GROUP BY DEPARTMENT_ID,DEPARTMENT_NAME`, [organisationId], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get departments ticket count...",
                        });
                    }
                    else {
                        res.status(200).json({
                            "TAB_MASTER": 127,
                            "message": "success",
                            "data": results1
                        });
                    }
                });
            }
            else {
                res.status(400).json({
                    "message": "Application key OR Organisation Id missing...",
                });
            }
        } else {
            res.status(400).json({
                message: "Invalid filter parameter."
            })
        }
    }
    catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.getDashboardReport = (req, res) => {
    let organisationId = req.body.ORG_ID;
    let departmentId = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : 0;
    let userId = req.body.USER_ID ? req.body.USER_ID : 0;
    var fromDate = req.body.FROM_DATE;
    var toDate = req.body.TO_DATE;
    let filter = (departmentId ? ` AND DEPARTMENT_ID = ${departmentId} ` : '') + (userId ? ` AND USER_ID = ${userId} ` : '') + (fromDate && toDate ? ` AND DATE BETWEEN '${fromDate}' AND '${toDate}' ` : '');
    var supportKey = req.headers['supportkey'];
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            if (organisationId) {
                mm.executeQueryData(`select count(ID) as TOTAL,COUNT(IF(STATUS='P',1,NULL)) AS CREATED,COUNT(IF(STATUS='S',1,NULL)) AS ASSIGNED,COUNT(IF(STATUS='R',1,NULL)) AS ANSWERED,COUNT(IF(STATUS='C',1,NULL)) AS CLOSED, COUNT(IF(STATUS='O',1,NULL)) AS RE_OPEN, COUNT(IF(STATUS='H',1,NULL)) AS ON_HOLD, COUNT(IF(STATUS='B',1,NULL)) AS BANNED from ` + viewTicketMaster + ` where ORG_ID = ? ${filter}`, [organisationId], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get organisation ticket count...",
                        });
                    }
                    else {
                        res.status(200).json({
                            "TAB_MASTER": 127,
                            "message": "success",
                            "data": results1
                        });
                    }
                });
            }
            else {
                res.status(400).json({
                    "message": "Application key OR Organisation Id missing...",
                });
            }
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
}

exports.getTicketReport = (req, res) => {
    const d = new Date();
    let month = d.getMonth();
    const d1 = new Date();
    let year = d1.getFullYear();
    let applicationId = req.body.APPLICATION_KEY;
    var supportKey = req.headers['supportkey'];
    var MONTH = req.body.MONTH ? req.body.MONTH : month + 1;
    var YEAR = req.body.YEAR ? req.body.YEAR : year;
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(STATUS) as TOTAL,COUNT(IF(STATUS ='P',1,NULL)) AS CREATED,COUNT(IF(STATUS='S',1,NULL)) AS ASSIGNED,COUNT(IF(STATUS='O',1,NULL)) AS RE_OPEN, COUNT(IF(STATUS='C',1,NULL)) AS CLOSED,COUNT(IF(STATUS='H',1,NULL)) AS ON_HOLD,COUNT(IF(STATUS='B',1,NULL)) AS BANNED from ` + viewTicketMaster + ``, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get ticket status count...",
                    });
                }
                else {
                    mm.executeQuery(`select count(PRIORITY) AS TOTAL,COUNT(IF(PRIORITY ='H',1,NULL)) AS HIGH,COUNT(IF(PRIORITY='L',1,NULL)) AS LOW,COUNT(IF(PRIORITY='V',1,NULL)) AS VERY_HIGH,COUNT(IF(PRIORITY='O',1,NULL)) AS VERY_LOW, COUNT(IF(PRIORITY='M',1,NULL)) AS MEDIUM from ` + viewTicketMaster + ``, supportKey, (error, results2) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get ticket priority count...",
                            });
                        }
                        else {
                            var sql = `SELECT AAA.DATE, IFNULL(BBB.GROUP_1,0) GROUP_1,ifnull(BBB.GROUP_2,0) GROUP_2 FROM(SELECT DATE FROM (SELECT MAKEDATE(((${YEAR})),1) + INTERVAL (((${MONTH}))-1) MONTH + INTERVAL daynum DAY DATE FROM (SELECT t*10+u daynum FROM (SELECT 0 t UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) A,(SELECT 0 u UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9) B ORDER BY daynum) AA) AA WHERE MONTH(DATE) = ${MONTH} and YEAR(DATE) = ${YEAR}) AAA LEFT JOIN (select  date(DATE) as DATE, COUNT(if(FIND_IN_SET(status,'P,S,O,H'),1,null)) as GROUP_1, COUNT(if(FIND_IN_SET(status,'R,C,B'),1,null)) as GROUP_2 from view_ticket_master where month(date) = ${MONTH} and year(date) = ${YEAR} group by date(DATE)) BBB USING (DATE) order by DATE`
                            mm.executeQuery(sql, supportKey, (error, result4) => {
                                if (error) {
                                    res.status(400).json({
                                        "message": "Failed to get datewise data..."
                                    });
                                }
                                else {
                                    var sql = `select count(IF(HOUR(TIMEDIFF(FIRST_RESOLVED_TIME, DATE)) <= 24 and status in('S','O','H','R','C','B'),1,null)) "Picked before 24 Hrs.", count(IF((HOUR(TIMEDIFF(FIRST_RESOLVED_TIME, DATE)) > 24) and (HOUR(TIMEDIFF(FIRST_RESOLVED_TIME, DATE)) <= 48) and status in('S','O','H','R','C','B'),1,null)) "Picked between 24 to 48 Hrs.",count(IF((HOUR(TIMEDIFF(FIRST_RESOLVED_TIME, DATE)) > 48) and (HOUR(TIMEDIFF(FIRST_RESOLVED_TIME, DATE)) <= 72) and status in('S','O','H','R','C','B'),1,null)) "Picked between 48 to 72 Hrs.", count(IF(HOUR(TIMEDIFF(FIRST_RESOLVED_TIME, DATE)) > 72 and status in('S','O','H','R','C','B'),1,null)) "Picked after 72 Hrs." from ` + viewTicketMaster + ``
                                    mm.executeQuery(sql, supportKey, (error, result5) => {
                                        if (error) {
                                            console.log(error);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            res.status(400).json({
                                                "message": "Failed to get ticket response time count...",
                                            });
                                        }
                                        else {
                                            res.status(200).json({
                                                "TAB_MASTER": 127,
                                                "message": "success",
                                                "data": results1, results2, result4, result5
                                            });
                                        }
                                    });
                                }
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
}

exports.getLogDetails = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewTicketLogDetails + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickets log details count...",
                    });
                }
                else {
                    mm.executeQuery(`select TICKET_NUMBER,log_datetime,LOG_text,TICKET_STATUS from ` + viewTicketLogDetails + ``, supportKey, (error, results3) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get ticket log details count...",
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "data": results3
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

exports.getLogDetailsByTicketNo = (req, res) => {
    let TICKET_NUMBER = req.body.TICKET_NUMBER;
    var supportKey = req.headers['supportkey'];
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData('select count(*) as cnt from ' + viewTicketLogDetails + ' where TICKET_NUMBER = ?', [TICKET_NUMBER], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get given ticket log details count...",
                    });
                }
                else {
                    mm.executeQueryData(`select TICKET_NUMBER,log_datetime,LOG_text,TICKET_STATUS from ` + viewTicketLogDetails + ` where TICKET_NUMBER = ?`, [TICKET_NUMBER], supportKey, (error, results3) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get given ticket log details information...",
                            });
                        }
                        else {
                            res.status(200).json({
                                "message": "success",
                                "data": results3
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
}

exports.getOptionWiseCount = (req, res) => {

    let organisationId = req.body.ORG_ID;
    let departmentId = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : 0;
    let userId = req.body.USER_ID ? req.body.USER_ID : 0;
    var fromDate = req.body.FROM_DATE;
    var toDate = req.body.TO_DATE;
    var searchText = req.body.searchText;
    let filter = ((departmentId ? ` AND DEPARTMENT_ID = ${departmentId} ` : '') + (userId ? ` AND USER_ID = ${userId} ` : '') + (fromDate && toDate ? ` AND DATE BETWEEN '${fromDate}' AND '${toDate}' ` : '')) || (searchText != '' ? `AND TICKET_GROUP_VALUE LIKE '%${searchText}%'` : '');
    var supportKey = req.headers['supportkey'];
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    try {
        if (IS_FILTER_WRONG == "0") {
            if (organisationId) {
                mm.executeQueryData(`select count(ID) as TOTAL, TICKET_GROUP_VALUE, COUNT(IF(TICKET_GROUP_TYPE='O' and STATUS = 'P',1,NULL)) AS CREATED, COUNT(IF(TICKET_GROUP_TYPE='O' AND STATUS='S',1,NULL)) AS ASSIGNED, COUNT(IF(TICKET_GROUP_TYPE='O' AND STATUS='O',1,NULL)) AS RE_OPEN, COUNT(IF(TICKET_GROUP_TYPE='O' AND STATUS='C',1,NULL)) AS CLOSED, COUNT(IF(TICKET_GROUP_TYPE='O' AND STATUS='H',1,NULL)) AS ON_HOLD, COUNT(IF(TICKET_GROUP_TYPE='O' AND STATUS='B',1,NULL)) AS BANNED from ` + viewTicketMaster + ` where ORG_ID = ? ${filter} AND IS_LAST = 1 GROUP BY TICKET_GROUP_TYPE`, [organisationId], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.status(400).json({
                            "message": "Failed to get option wise count...",
                        });
                    }
                    else {
                        res.status(200).json({
                            "TAB_MASTER": 127,
                            "message": "success",
                            "data": results1
                        });
                    }
                });
            }
            else {
                res.status(400).json({
                    "message": "Application key OR Organisation Id missing...",
                });
            }
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
}

exports.getReportByReportingHead = (req, res) => {
    let organisationId = req.body.ORG_ID;
    let USER_ID = req.body.USER_ID ? req.body.USER_ID : 0;
    var fromDate = req.body.FROM_DATE;
    var toDate = req.body.TO_DATE;
    var searchText = req.body.searchText;
    var filter = ((USER_ID || (fromDate && toDate) ? `AND USER_ID = ${USER_ID}  OR DATE BETWEEN '(${fromDate}' AND '${toDate})' ` : '')) || (searchText != '' ? `AND DEPARTMENT_NAME LIKE '%${searchText}%' OR CREATOR_NAME LIKE '%${searchText}%'` : '');
    var supportKey = req.headers['supportkey'];

    try {
        console.log("USER_ID", USER_ID);
        console.log("fromDate", fromDate);
        console.log("toDate", toDate);
        if (organisationId) {
            console.log("EMPLOYEE_ID", USER_ID);
            mm.executeQueryData(`select CREATOR_NAME, count(ID) as TOTAL, COUNT(IF(STATUS='P',1,NULL)) AS CREATED,COUNT(IF(STATUS='S',1,NULL)) AS ASSIGNED,COUNT(IF(STATUS='R',1,NULL)) AS ANSWERED,COUNT(IF(STATUS='O',1,NULL)) AS RE_OPEN, COUNT(IF(STATUS='C',1,NULL)) AS CLOSED,COUNT(IF(STATUS='H',1,NULL)) AS ON_HOLD,COUNT(IF(STATUS='B',1,NULL)) AS BANNED from ` + viewTicketMaster + ` where ORG_ID = ? ${filter} GROUP BY CREATOR_NAME`, [organisationId], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get ticket data...",
                    });
                }
                else {
                    res.status(200).json({
                        "message": "success",
                        "data": results1
                    });
                }
            });
        }
        else {
            res.status(400).json({
                "message": "Application key OR Organisation Id missing...",
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

exports.autoCloseTicket = (req, res) => {
    var supportKey = req.headers['supportkey'];
    try {
        var connection = mm.openConnection();
        mm.executeDML(`SELECT ID FROM ticket_master where STATUS = 'R' AND DATEDIFF(CURRENT_DATE,DATE(LAST_RESPONDED))>(SELECT TICKET_TIME_PERIOD FROM view_ticket_group_master WHERE ID = ticket_master.TICKET_GROUP_ID)`, '', supportKey, connection, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                mm.rollbackConnection(connection);
                res.status(400).json({
                    "message": "Failed to save ticket information..."
                });
            } else {
                mm.executeDML(`UPDATE ticket_master SET STATUS = 'C' where STATUS = 'R' AND DATEDIFF(CURRENT_DATE,DATE(LAST_RESPONDED))>(SELECT TICKET_TIME_PERIOD FROM view_ticket_group_master WHERE ID = ticket_master.TICKET_GROUP_ID)`, '', supportKey, connection, (error, results4) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        console.log(error);
                        res.status(400).json({
                            "message": "Failed to update ticket information..."
                        });
                    } else {
                        var errors1 = "";
                        var DESCRIPTION = "Created ticket has been auto closed by the system.";

                        if (results.length > 0) {
                            async.eachSeries(results, function iteratorOverElems(roleDetailsItem, callback) {
                                var TICKET_MASTER_ID = roleDetailsItem.ID;
                                mm.executeQueryData('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [TICKET_MASTER_ID, 'AC', '0', '', DESCRIPTION, 1], supportKey, (error, resultsInsert) => {
                                    if (error) {
                                        console.log(error)
                                        errors1 += ('\n' + error);
                                        callback(error);
                                    }
                                    else {
                                        callback();
                                    }
                                });
                            }, function subCb(error) {
                                if (error) {
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    mm.rollbackConnection(connection)
                                    res.status(400).json({
                                        "message": "Failed to Insert data..."
                                    });
                                } else {
                                    mm.commitConnection(connection)
                                    res.status(200).json({
                                        "message": "Success...",
                                    });
                                }
                            });
                        } else {
                            mm.rollbackConnection(connection)
                            res.status(300).json({
                                "message": "There Is No Tickets..."
                            });
                        }
                    }
                });
            }
        })
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

exports.getAutoCloseTicketReport = (req, res) => {
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

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    var supportKey = req.headers['supportkey'];

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';
    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';
    var TAKEN_BY_USER_ID = req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : '';
    var TICKET_GENERATOR_BRANCH_ID = req.body.TICKET_GENERATOR_BRANCH_ID ? req.body.TICKET_GENERATOR_BRANCH_ID : '';

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = `AND DATE(DATE) BETWEEN '${START_DATE}' AND '${END_DATE}'`
    }

    var filterUser = '';
    if (USER_ID.length > 0) {
        filterUser = `AND USER_ID IN (${USER_ID}) `
    }


    var filterUserTaken = '';
    if (TAKEN_BY_USER_ID.length > 0) {
        filterUserTaken = `AND TAKEN_BY_USER_ID IN (${TAKEN_BY_USER_ID}) `
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(*) as cnt from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${filterUserTaken} ${filterUser} ${countCriteria}`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickets count...",
                    });
                }
                else {
                    mm.executeQuery(`SELECT TICKET_NO,LAST_RESPONDED,TICKET_MASTER_ID,DATE,LAST_RESPONDED,CREATER_NAME,TICKET_TAKEN_EMPLOYEE,CREATED_MODIFIED_DATE,STATUS,TICKET_TAKEN_DEPARTMENT from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${filterUserTaken} ${filterUser} ${criteria}`, supportKey, (error, results) => {
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
                                "TAB_ID": 126,
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

exports.getCreatorWiseAutoCloseTicketCount = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'USER_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY USER_ID,CREATER_NAME order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY USER_ID,CREATER_NAME order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = `AND DATE(DATE) BETWEEN '${START_DATE}' AND '${END_DATE}'`
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(DISTINCT USER_ID) as cnt from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${countCriteria}`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickets count...",
                    });
                }
                else {
                    mm.executeQuery(`SELECT CREATER_NAME ,COUNT(DISTINCT TICKET_MASTER_ID) NUMBER_OF_TICKETS from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${criteria}`, supportKey, (error, results) => {
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
                                "count": results1[0].cnt,
                                "TAB_ID": 126,
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

exports.getGroupWiseAutoCloseTicketCount = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'DEPARTMENT_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let criteria = '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    if (pageIndex === '' && pageSize === '')
        criteria = filter + " GROUP BY DEPARTMENT_ID order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " GROUP BY DEPARTMENT_ID order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = `AND DATE(DATE) BETWEEN '${START_DATE}' AND '${END_DATE}'`
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(DISTINCT DEPARTMENT_ID) as cnt from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${countCriteria}`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickets count...",
                    });
                }
                else {
                    mm.executeQuery(`SELECT DEPARTMENT_NAME ,COUNT(DISTINCT TICKET_MASTER_ID) NUMBER_OF_TICKETS from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${criteria}`, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "message": "Failed to get ticket information..."
                            });
                        }
                        else {
                            res.status(200).json({
                                "TAB_MASTER": 126,
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

exports.getGroupWiseAutoCloseTicketReport = (req, res) => {
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    let sortKey = req.body.sortKey ? req.body.sortKey : 'DEPARTMENT_ID';
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

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    var DEPARTMENT_ID = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : '';
    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = `AND DATE(DATE) BETWEEN '${START_DATE}' AND '${END_DATE}'`
    }

    var filterDepartment = '';
    if (DEPARTMENT_ID.length > 0) {
        filterDepartment = `AND DEPARTMENT_ID IN (${DEPARTMENT_ID}) `
    }

    var filterUser = '';
    if (USER_ID.length > 0) {
        filterUser = `AND USER_ID IN (${USER_ID}) `
    }

    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQuery(`select count(*) as cnt from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${filterDepartment} ${filterUser} ${countCriteria}`, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "message": "Failed to get tickets count...",
                    });
                }
                else {
                    mm.executeQuery(`SELECT TICKET_NO,LAST_RESPONDED,CREATER_NAME,TICKET_MASTER_ID,DATE,LAST_RESPONDED,DEPARTMENT_NAME,TICKET_TAKEN_EMPLOYEE,CREATED_MODIFIED_DATE,STATUS,TICKET_TAKEN_DEPARTMENT from view_ticket_details WHERE STATUS = "C" AND SENDER = "AC" AND SENDER_ID = "0" ${filterDatewise} ${filterDepartment}  ${filterUser} ${criteria}`, supportKey, (error, results) => {
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
                                "TAB_ID": 126,
                                "count": results1[0].cnt,
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
}

exports.track = (req, res) => {
    var ticketNo = req.query.TICKET
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQuery(`select * from view_ticket_master where TICKET_NO = '${ticketNo}' `, supportKey, (error, results) => {
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
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    }
}

function addLog(id, Ltext, CREATED_DATE_TIME, supportKey) {
    try {
        console.log("supportKey", supportKey);
        let NLtext = Ltext ? Ltext : "Not Available";
        console.log("Ltext", Ltext);
        console.log("LOG_DATETIME", CREATED_DATE_TIME);
        mm.executeQueryData(`INSERT INTO ` + ticketLogDetails + `(TICKET_ID,LOG_TEXT,LOG_DATETIME) VALUES (?,'${NLtext}',${CREATED_DATE_TIME})`, [id], supportKey, (error, results3) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log("TicketLogDetail information saved successfully...");
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error)
    }
}


exports.update = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    var KEY = req.body.KEY;
    var ACTION = req.body.ACTION;
    var supportKey = req.headers['supportkey'];
    var TICKET_TAKEN_EMPLOYEE = req.body.TICKET_TAKEN_EMPLOYEE;
    var TICKET_TAKEN_DEPARTMENT = req.body.TICKET_TAKEN_DEPARTMENT;
    var TRANSFER_FROM = req.body.TRANSFER_FROM;
    var DEPARTMENT_ID = req.body.DEPARTMENT_ID;
    var TAKEN_FROM_USER_ID = req.body.TAKEN_FROM_USER_ID;
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        setData += `${key} = ? , `;
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

            var connection = mm.openConnection();
            var Ltext;
            var msgTitle = ""; //notification title
            var msgDesc = ""; //notification description
            var CustomermsgTitle = ""; //notification title
            var CREATED_DATE_TIME = `(select DATE from view_ticket_master where ID=${criteria.ID})`;
            DEPARTMENT_ID = req.body.DEPARTMENT_ID;
            mm.executeDML(`select TICKET_TAKEN_EMPLOYEE,CUSTOMER_TYPE,TAKEN_BY_USER_ID, TICKET_TAKEN_DEPARTMENT, TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID from ` + viewTicketMaster + ` where TAKEN_BY_USER_ID = ? and TICKET_NO = ? AND USER_ID = ?`, [data.TAKEN_BY_USER_ID, data.TICKET_NO, data.USER_ID], supportKey, connection, (error, results5) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    mm.rollbackConnection(connection);
                    res.status(400).json({
                        "message": "Failed to get ticket information..."
                    });
                } else {
                    // S for Assign
                    if (data.STATUS == "S") {
                        mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.status(400).json({
                                    "message": "Failed to update ticket information..."
                                });
                            } else {
                                mm.executeDML(`select TICKET_TAKEN_EMPLOYEE,CUSTOMER_TYPE, TICKET_TAKEN_DEPARTMENT, TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID from ` + viewTicketMaster + ` where TAKEN_BY_USER_ID=? and TICKET_NO = ? AND USER_ID=?`, [data.TAKEN_BY_USER_ID, data.TICKET_NO, data.USER_ID], supportKey, connection, (error, results51) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection);
                                        res.status(400).json({
                                            "message": "Failed to get ticket information..."
                                        });
                                    }
                                    else {
                                        Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = '${data.TICKET_NO}'),' picked the ticket ' ,(select TICKET_NO from view_ticket_master where ID=${criteria.ID}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where ID = ${criteria.ID}),' on ',(select time(LAST_RESPONDED) from view_ticket_master where ID = ${criteria.ID}))`
                                        msgTitle = "Your Created Ticket is Picked";
                                        msgDesc = "Dear User, Your ticket No. " + results51[0].TICKET_NO + " is picked by support user " + results51[0].TICKET_TAKEN_EMPLOYEE + ". Wait for their solution.";
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, results51[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                        const wBparams = [{ "type": "text", "text": results51[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results51[0].TICKET_NO }, { "type": "text", "text": results51[0].TICKET_TAKEN_EMPLOYEE }, { "type": "text", "text": formattedDate }]
                                        const wparams = [{ "type": "body", "parameters": wBparams }]
                                        if (results51[0].CUSTOMER_TYPE == "I") {
                                            mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_assigned", wparams, 'en', (error, resultswsms) => {
                                                if (error) {
                                                    console.log(error)
                                                }
                                                else {
                                                    console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                }
                                            })
                                        }
                                        var DESCRIPTION = results51[0].TICKET_TAKEN_EMPLOYEE + " from " + results51[0].TICKET_TAKEN_DEPARTMENT + " has taken the ticket.";
                                        mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                res.status(400).json({
                                                    "message": "Failed to save ticket information..."
                                                });
                                            } else {
                                                addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                mm.commitConnection(connection);
                                                mm.sendDynamicEmail(22, criteria.ID, supportKey)
                                                res.status(200).json({
                                                    "message": "success"
                                                });
                                            }
                                        })
                                    }
                                });
                            }
                        });
                    }
                    // R for Resolved
                    else if (data.STATUS == "R" && KEY == "SUPPORT_USER") {
                        mm.executeDML(`select TICKET_TAKEN_EMPLOYEE,CUSTOMER_TYPE,TICKET_TAKEN_DEPARTMENT,TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID,TAKEN_BY_USER_ID from ` + viewTicketMaster + ` where TICKET_NO = ? AND USER_ID=?`, [data.TICKET_NO, data.USER_ID], supportKey, connection, (error, results6) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).json({
                                    "message": "Failed to get ticket information..."
                                });
                            }
                            else {
                                if (results6[0].TAKEN_BY_USER_ID == data.TRANSFER_USER_ID) {
                                    // Original owner is resolving the ticket - keep status as R
                                    mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "message": "Failed to update ticket information..."
                                            });
                                        } else {
                                            Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = '${data.TICKET_NO}'),' answered the ticket ' ,(select TICKET_NO from view_ticket_master where ID=${criteria.ID}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where ID = ${criteria.ID}),' on ',(select time(LAST_RESPONDED) from view_ticket_master where ID = ${criteria.ID}))`;
                                            msgTitle = "Your Created Ticket is Answered by Support User";
                                            msgDesc = "Dear User, Your ticket No. " + results6[0].TICKET_NO + " is resolved by support user " + results6[0].TICKET_TAKEN_EMPLOYEE + ". Please follow the given solution.";
                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, results6[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                            const wBparams = [{ "type": "text", "text": results6[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results6[0].TICKET_NO }]
                                            const wparams = [{ "type": "body", "parameters": wBparams }]
                                            if (results6[0].CUSTOMER_TYPE == "I") {
                                                mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_resolved", wparams, 'en', (error, resultswsms) => {
                                                    if (error) {
                                                        console.log(error)
                                                    }
                                                    else {
                                                        console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                    }
                                                })
                                            }
                                            mm.sendDynamicEmail(23, criteria.ID, supportKey)

                                            addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                            mm.commitConnection(connection);
                                            res.status(200).json({
                                                "message": "success"
                                            });
                                        }
                                    });
                                }
                                else {
                                    // Ticket is being transferred - maintain original status from data.STATUS
                                    mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "message": "Failed to update ticket information..."
                                            });
                                        } else {
                                            mm.executeDML(`select IS_TAKEN_USER_NAME,CUSTOMER_TYPE,TICKET_TAKEN_DEPARTMENT_NAME,TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID,TAKEN_BY_USER_ID from ` + viewTicketMaster + ` where TICKET_NO = ? AND USER_ID=?`, [data.TICKET_NO, data.USER_ID], supportKey, connection, (error, results67) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    mm.rollbackConnection(connection);
                                                    res.status(400).json({
                                                        "message": "Failed to get ticket information..."
                                                    });
                                                } else {
                                                    Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = '${data.TICKET_NO}'),' transfered the ticket ' ,(select TICKET_NO from view_ticket_master where ID=${criteria.ID}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where ID = ${criteria.ID}),' on ',(select time(LAST_RESPONDED) from view_ticket_master where ID = ${criteria.ID}))`;
                                                    msgTitle = "Ticket is transfered to you by another support member";
                                                    CustomermsgTitle = "Ticket is transfered to another support member";
                                                    msgDesc = "Dear User, Ticket No. " + results6[0].TICKET_NO + " is transfered to you by user " + results6[0].TICKET_TAKEN_EMPLOYEE + ". Please check.";
                                                    let msgDesc2 = "Dear User, Ticket No. " + results6[0].TICKET_NO + " is transfered to another support user " + results6[0].TICKET_TAKEN_EMPLOYEE + ". Wait for their solution.";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results6[0].USER_ID, "C", CustomermsgTitle, msgDesc2, supportKey, req.body);
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                    var DESCRIPTION = TICKET_TAKEN_EMPLOYEE + " from " + TICKET_TAKEN_DEPARTMENT + " has transfered the ticket to " + results67[0].IS_TAKEN_USER_NAME + " from " + results67[0].TICKET_TAKEN_DEPARTMENT_NAME;
                                                    mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                                        if (error) {
                                                            console.log(error);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            mm.rollbackConnection(connection);
                                                            res.status(400).json({
                                                                "message": "Failed to save ticket information..."
                                                            });
                                                        } else {
                                                            const wBparams = [{ "type": "text", "text": results6[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results6[0].TICKET_NO }]
                                                            const wparams = [{ "type": "body", "parameters": wBparams }]
                                                            if (results6[0].CUSTOMER_TYPE == 'I') {
                                                                mm.sendWAToolSMS(data.MOBILE_NO, "support_transfer_ticket", wparams, 'en', (error, resultswsms) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                    }
                                                                    else {
                                                                        console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                                    }
                                                                })
                                                            }
                                                            mm.sendDynamicEmail(28, criteria.ID, supportKey)
                                                            addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                            mm.commitConnection(connection);
                                                            res.status(200).json({
                                                                "message": "success"
                                                            });
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                    // Ticket is Reopened
                    else if (data.STATUS == "O") {
                        mm.executeDML(`select TICKET_TAKEN_EMPLOYEE,CUSTOMER_TYPE,TICKET_TAKEN_DEPARTMENT,TICKET_NO,CREATOR_EMPLOYEE_NAME,TAKEN_BY_USER_ID,USER_ID from ` + viewTicketMaster + ` where USER_ID=? and TICKET_NO = '${data.TICKET_NO}'`, [data.USER_ID], supportKey, connection, (error, results8) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).json({
                                    "message": "Failed to get ticket information..."
                                });
                            }
                            else {
                                if (results8[0].TAKEN_BY_USER_ID == data.TRANSFER_USER_ID) {
                                    mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "message": "Failed to update ticket information..."
                                            });
                                        } else {
                                            if (ACTION != "MANUALLY_REOPEN") {
                                                if (ACTION == 'UNBANNED') {
                                                    msgTitle = "Ticket is unbanned by Support User";
                                                    msgDesc = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is unbanned by support user " + results8[0].TICKET_TAKEN_EMPLOYEE + ".";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                                    var DESCRIPTION = results8[0].TICKET_TAKEN_EMPLOYEE + " from " + results8[0].TICKET_TAKEN_DEPARTMENT + " has unbanned your ticket.";
                                                    mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                                        if (error) {
                                                            console.log(error);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            mm.rollbackConnection(connection);
                                                            res.status(400).json({
                                                                "message": "Failed to save ticket information..."
                                                            });
                                                        } else {
                                                            const wBparams = [{ "type": "text", "text": results8[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results8[0].TICKET_NO }]
                                                            const wparams = [{ "type": "body", "parameters": wBparams }]
                                                            if (results8[0].CUSTOMER_TYPE == "I") {
                                                                mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_reopened", wparams, 'en', (error, resultswsms) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                    }
                                                                    else {
                                                                        console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                                    }
                                                                })
                                                            }
                                                             mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                            addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                            mm.commitConnection(connection);
                                                            res.status(200).json({
                                                                "message": "success"
                                                            });
                                                        }
                                                    })
                                                } else {
                                                    msgTitle = "Ticket is re-opend by User";
                                                    msgDesc = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is reopened by " + results8[0].CREATOR_EMPLOYEE_NAME + " please check and resolve it.";
                                                    let msgDesc2 = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is reopened by " + results8[0].CREATOR_EMPLOYEE_NAME + " Wait for solution.";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                    const wBparams = [{ "type": "text", "text": results8[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results8[0].TICKET_NO }]
                                                    const wparams = [{ "type": "body", "parameters": wBparams }]
                                                    if (results8[0].CUSTOMER_TYPE == "I") {
                                                        mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_reopened", wparams, 'en', (error, resultswsms) => {
                                                            if (error) {
                                                                console.log(error)
                                                            }
                                                            else {
                                                                console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                            }
                                                        })
                                                    }
                                                     mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                    addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                    // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results8[0].TICKET_NO, results8[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_reopened')
                                                    mm.commitConnection(connection);
                                                    res.status(200).json({
                                                        "message": "success"
                                                    });
                                                }
                                            }
                                            else {

                                                msgTitle = "Ticket is re-opend by User";
                                                msgDesc = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is reopened by " + results8[0].CREATOR_EMPLOYEE_NAME + " please check and resolve it.";
                                                let msgDesc2 = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is reopened by " + results8[0].CREATOR_EMPLOYEE_NAME + " Wait for their solution.";
                                                sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);
                                                sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                var DESCRIPTION = results8[0].CREATOR_EMPLOYEE_NAME + " has re-opened the ticket";
                                                mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                                    if (error) {
                                                        console.log(error);
                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                        mm.rollbackConnection(connection);
                                                        res.status(400).json({
                                                            "message": "Failed to save ticket information..."
                                                        });
                                                    } else {
                                                        const wBparams = [{ "type": "text", "text": results8[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results8[0].TICKET_NO }]
                                                        const wparams = [{ "type": "body", "parameters": wBparams }]
                                                        if (results8[0].CUSTOMER_TYPE == "I") {
                                                            mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_reopened", wparams, 'en', (error, resultswsms) => {
                                                                if (error) {
                                                                    console.log(error)
                                                                }
                                                                else {
                                                                    console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                                }
                                                            })
                                                        }
                                                         mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                        addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                        // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results8[0].TICKET_NO, results8[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_reopened')
                                                        mm.commitConnection(connection);
                                                        res.status(200).json({
                                                            "message": "success"
                                                        });
                                                    }
                                                })
                                            }
                                        }
                                    });
                                }
                                else {
                                    mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "message": "Failed to update ticket information..."
                                            });
                                        } else {
                                            mm.executeDML(`select IS_TAKEN_USER_NAME,CUSTOMER_TYPE,TICKET_TAKEN_DEPARTMENT_NAME,TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID,TAKEN_BY_USER_ID from ` + viewTicketMaster + ` where TICKET_NO = ? AND USER_ID=?`, [data.TICKET_NO, data.USER_ID], supportKey, connection, (error, results678) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    mm.rollbackConnection(connection);
                                                    res.status(400).json({
                                                        "message": "Failed to get ticket information..."
                                                    });
                                                } else {
                                                    // mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                    Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = '${data.TICKET_NO}'),' transfered the ticket ' ,(select TICKET_NO from view_ticket_master where ID=${criteria.ID}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where ID = ${criteria.ID}),' on ',(select time(LAST_RESPONDED) from view_ticket_master where ID = ${criteria.ID}))`;
                                                    msgTitle = "Your created ticket is transfered to another Support User";
                                                    msgDesc = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is transfered to " + results678[0].IS_TAKEN_USER_NAME + ".";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TRANSFER_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);
                                                    var msgTitle1 = "Ticket is transfered to you";
                                                    var msgDesc1 = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is transfered to you by " + results8[0].TICKET_TAKEN_EMPLOYEE + ". Please check.";
                                                    let msgDesc2 = "Dear User, Ticket No. " + results8[0].TICKET_NO + " is transfered to " + results8[0].TICKET_TAKEN_EMPLOYEE + ". Wait for their solution.";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results8[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results678[0].TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                    var DESCRIPTION = TICKET_TAKEN_EMPLOYEE + " from " + TICKET_TAKEN_DEPARTMENT + " has transfered the ticket to " + results678[0].IS_TAKEN_USER_NAME + " from " + results678[0].TICKET_TAKEN_DEPARTMENT_NAME;
                                                    mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                                        if (error) {
                                                            console.log(error);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            mm.rollbackConnection(connection);
                                                            res.status(400).json({
                                                                "message": "Failed to save ticket information..."
                                                            });
                                                        } else {
                                                            const wBparams = [{ "type": "text", "text": results678[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results678[0].TICKET_NO }]
                                                            const wparams = [{ "type": "body", "parameters": wBparams }]
                                                            if (results678[0].CUSTOMER_TYPE == "I") {
                                                                mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_reopened", wparams, 'en', (error, resultswsms) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                    }
                                                                    else {
                                                                        console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                                    }
                                                                })
                                                            }
                                                             mm.sendDynamicEmail(24, criteria.ID, supportKey)
                                                            addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                            // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results8[0].TICKET_NO, results8[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_reopened')
                                                            mm.commitConnection(connection);
                                                            res.status(200).json({
                                                                "message": "success"
                                                            });
                                                        }
                                                    })
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                    // TICKET CLOSED
                    else if (data.STATUS == "C") {
                        if (data.TAKEN_BY_USER_ID == 0) {
                            mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "message": "Failed to update ticket information..."
                                    });
                                } else {
                                    const wBparams = [{ "type": "text", "text": results5[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results5[0].TICKET_NO }]
                                    const wparams = [{ "type": "body", "parameters": wBparams }]
                                    if (results5[0].CUSTOMER_TYPE == "I") {
                                        mm.sendWAToolSMS(data.MOBILE_NO, "support_closed_ticket", wparams, 'en', (error, resultswsms) => {
                                            if (error) {
                                                console.log(error)
                                            }
                                            else {
                                                console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                            }
                                        })
                                    }
                                    mm.sendDynamicEmail(25, criteria.ID, supportKey)
                                    mm.commitConnection(connection);
                                    res.status(200).json({
                                        "message": "Closed...."
                                    });
                                }
                            });
                        } else {
                            mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    console.log(error);
                                    res.status(400).json({
                                        "message": "Failed to update ticket information..."
                                    });
                                } else {
                                    if (data.TAKEN_BY_USER_ID != 0) {
                                        msgTitle = "Created ticket is closed";
                                        Ltext = `concat((select UPPER(CREATOR_EMPLOYEE_NAME) from view_ticket_master where USER_ID=${data.USER_ID} and TICKET_NO = ${data.TICKET_NO}),' closed his/her ticket ',(select TICKET_NO from view_ticket_master where ID = ${criteria.ID}),' created on ',(select time(CREATED_DATE_TIME) from view_ticket_master where ID = ${criteria.ID}))`
                                        msgDesc = "Dear User, Ticket No. " + results5[0].TICKET_NO + " is closed by " + results5[0].CREATOR_EMPLOYEE_NAME + ". Please check.";
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, results5[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                        var DESCRIPTION = results5[0].CREATOR_EMPLOYEE_NAME + " has close the ticket.";
                                        mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                res.status(400).json({
                                                    "message": "Failed to save ticket information..."
                                                });
                                            }
                                            else {
                                                mm.sendDynamicEmail(25, criteria.ID, supportKey)
                                                addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey)
                                                const wBparams = [{ "type": "text", "text": results5[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results5[0].TICKET_NO }]
                                                const wparams = [{ "type": "body", "parameters": wBparams }]
                                                if (results5[0].CUSTOMER_TYPE == "I") {
                                                    mm.sendWAToolSMS(data.MOBILE_NO, "support_closed_ticket", wparams, 'en', (error, resultswsms) => {
                                                        if (error) {
                                                            console.log(error)
                                                        }
                                                        else {
                                                            console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                        }
                                                    })
                                                }
                                                mm.commitConnection(connection);
                                                res.status(200).json({
                                                    "message": "success"
                                                });
                                            }
                                        })
                                    } else {
                                        var DESCRIPTION = results5[0].TICKET_TAKEN_EMPLOYEE + " from " + results5[0].TICKET_TAKEN_DEPARTMENT + " has close the ticket.";
                                        mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                            if (error) {
                                                console.log(error);
                                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                mm.rollbackConnection(connection);
                                                res.status(400).json({
                                                    "message": "Failed to save ticket information..."
                                                });
                                            } else {
                                                const wBparams = [{ "type": "text", "text": results5[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results5[0].TICKET_NO }]
                                                const wparams = [{ "type": "body", "parameters": wBparams }]
                                                if (results5[0].CUSTOMER_TYPE == "I") {
                                                    mm.sendWAToolSMS(data.MOBILE_NO, "support_closed_ticket", wparams, 'en', (error, resultswsms) => {
                                                        if (error) {
                                                            console.log(error)
                                                        }
                                                        else {
                                                            console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                        }
                                                    })
                                                }

                                                mm.sendDynamicEmail(25, criteria.ID, supportKey)
                                                addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                mm.commitConnection(connection);
                                                res.status(200).json({
                                                    "message": "success"
                                                });
                                            }
                                        });
                                    }
                                }
                            });
                        }
                    }
                    // TICKET ON HOLD
                    else if (data.STATUS == "H") {
                        mm.executeDML(`select TICKET_TAKEN_EMPLOYEE,CUSTOMER_TYPE,TICKET_TAKEN_DEPARTMENT,TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID,TAKEN_BY_USER_ID from ` + viewTicketMaster + ` where TICKET_NO = '${data.TICKET_NO}' AND USER_ID=?`, [data.USER_ID], supportKey, connection, (error, results10) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection)
                                res.status(400).json({
                                    "message": "Failed to get ticket information..."
                                });
                            }
                            else {
                                console.log("IM IN hold section :", results10[0].TAKEN_BY_USER_ID, "data.TRANSFER_USER_ID", data.TRANSFER_USER_ID);
                                if (results10[0].TAKEN_BY_USER_ID == data.TRANSFER_USER_ID) {
                                    mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "message": "Failed to update ticket information..."
                                            });
                                        } else {
                                            Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = ${data.TICKET_NO}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where DEPARTMENT_ID=${DEPARTMENT_ID} AND TICKET_NO = ${data.TICKET_NO}),' is kept the ticket ',(select TICKET_NO from view_ticket_master where ID = ${criteria.ID}),' on-hold on ',(select time(LAST_RESPONDED) from view_ticket_master where ID = ${criteria.ID}))`
                                            msgTitle = "Your ticket is kept on hold by Support User";
                                            msgDesc = "Dear User, Your ticket No. " + results10[0].TICKET_NO + " is kept on hold by " + results10[0].TICKET_TAKEN_EMPLOYEE + ".";
                                            sendNotifications(req.body.authData.data.UserData[0].USER_ID, results10[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                            var DESCRIPTION = results5[0].TICKET_TAKEN_EMPLOYEE + " from " + results5[0].TICKET_TAKEN_DEPARTMENT + " has put on hold the ticket.";
                                            mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    mm.rollbackConnection(connection);
                                                    res.status(400).json({
                                                        "message": "Failed to save ticket information..."
                                                    });
                                                } else {
                                                    const wBparams = [{ "type": "text", "text": results5[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results5[0].TICKET_NO }, { "type": "text", "text": results5[0].TICKET_TAKEN_EMPLOYEE }]
                                                    const wparams = [{ "type": "body", "parameters": wBparams }]
                                                    if (results5[0].CUSTOMER_TYPE == 'I') {
                                                        mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_onhold", wparams, 'en', (error, resultswsms) => {
                                                            if (error) {
                                                                console.log(error)
                                                            }
                                                            else {
                                                                console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                            }
                                                        })
                                                    }

                                                    mm.sendDynamicEmail(26, criteria.ID, supportKey)
                                                    addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                    // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results10[0].TICKET_NO, results10[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_ticket_onhold')
                                                    mm.commitConnection(connection);
                                                    res.status(200).json({
                                                        "message": "success"
                                                    });
                                                }
                                            })
                                        }
                                    });
                                }
                                else {
                                    mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                            console.log(error);
                                            res.status(400).json({
                                                "message": "Failed to update ticket information..."
                                            });
                                        } else {
                                            mm.executeDML(`select IS_TAKEN_USER_NAME,CUSTOMER_TYPE,TICKET_TAKEN_DEPARTMENT_NAME,TICKET_NO,CREATOR_EMPLOYEE_NAME,USER_ID,TAKEN_BY_USER_ID from ` + viewTicketMaster + ` where TAKEN_BY_USER_ID=? and TICKET_NO = '${data.TICKET_NO}' AND USER_ID=?`, [data.TAKEN_BY_USER_ID, data.USER_ID], supportKey, connection, (error, results101) => {
                                                if (error) {
                                                    console.log(error);
                                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                    mm.rollbackConnection(connection)
                                                    res.status(400).json({
                                                        "message": "Failed to get ticket information..."
                                                    });
                                                } else {
                                                    Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = '${data.TICKET_NO}'),' transfered the ticket ' ,(select TICKET_NO from view_ticket_master where ID=${criteria.ID}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where ID = ${criteria.ID}),' on ',(select time(LAST_RESPONDED) from view_ticket_master where ID = ${criteria.ID}))`;
                                                    msgTitle = "Your created ticket is transfered to another Support User";
                                                    msgDesc = "Dear User, Ticket No. " + results101[0].TICKET_NO + " is transfered to " + results101[0].IS_TAKEN_USER_NAME + ".";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results101[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, data.TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                    msgTitle = "Ticket is transfered to you by another Support User";
                                                    msgDesc = "Dear User, Ticket No. " + results101[0].TICKET_NO + " is transfered to you by " + results10[0].TICKET_TAKEN_EMPLOYEE + ".";
                                                    let msgDesc2 = "Dear User, Ticket No. " + results101[0].TICKET_NO + " is transfered to " + results10[0].TICKET_TAKEN_EMPLOYEE + ". Please wait for their solution.";
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results101[0].TAKEN_BY_USER_ID, "B", msgTitle, msgDesc, supportKey, req.body);
                                                    sendNotifications(req.body.authData.data.UserData[0].USER_ID, results101[0].USER_ID, "C", msgTitle, msgDesc2, supportKey, req.body);
                                                    var DESCRIPTION = TICKET_TAKEN_EMPLOYEE + " from " + TICKET_TAKEN_DEPARTMENT + " has transfered the ticket to " + results101[0].IS_TAKEN_USER_NAME + " from " + results101[0].TICKET_TAKEN_DEPARTMENT_NAME;
                                                    mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                                        if (error) {
                                                            console.log(error);
                                                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                            mm.rollbackConnection(connection);
                                                            res.status(400).json({
                                                                "message": "Failed to save ticket information..."
                                                            });
                                                        } else {
                                                            const wBparams = [{ "type": "text", "text": results101[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results101[0].TICKET_NO }]
                                                            const wparams = [{ "type": "body", "parameters": wBparams }]
                                                            if (results101[0].CUSTOMER_TYPE == "I") {
                                                                mm.sendWAToolSMS(data.MOBILE_NO, "support_transfer_ticket", wparams, 'en', (error, resultswsms) => {
                                                                    if (error) {
                                                                        console.log(error)
                                                                    }
                                                                    else {
                                                                        console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                                    }
                                                                })
                                                            }
                                                            mm.sendDynamicEmail(26, criteria.ID, supportKey)
                                                            addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                                            // sendWpMessage(results5[0].CREATOR_EMPLOYEE_NAME, results10[0].TICKET_NO, results10[0].TICKET_TAKEN_EMPLOYEE, data.MOBILE_NO, 'support_transfer_ticket')
                                                            mm.commitConnection(connection);
                                                            res.status(200).json({
                                                                "message": "success"
                                                            });
                                                        }
                                                    });
                                                }
                                            });
                                        }
                                    });
                                }
                            }
                        });
                    }
                    // Block by support
                    else if (data.STATUS == "B") {
                        mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} ${(data.STATUS == 'S' ? 'FIRST_RESOLVED_TIME = LAST_RESPONDED,' : '')} ${(data.STATUS == 'H' ? 'ON_HOLD = LAST_RESPONDED,' : '')} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.status(400).json({
                                    "message": "Failed to update ticket information..."
                                });
                            } else {
                                Ltext = `concat((select UPPER(TICKET_TAKEN_EMPLOYEE) from view_ticket_master where TAKEN_BY_USER_ID=${data.TAKEN_BY_USER_ID} and TICKET_NO = ${data.TICKET_NO}),' from ',(select UPPER(DEPARTMENT_NAME) from view_ticket_master where DEPARTMENT_ID = ${DEPARTMENT_ID} AND TICKET_NO = ${data.TICKET_NO}),' is banned the user from replying to ticket ',(select TICKET_NO from view_ticket_master where ID = ${criteria.ID}),' on ',(select time(IFNULL(ON_HOLD,LAST_RESPONDED)) from view_ticket_master where ID = ${criteria.ID}))`
                                msgTitle = "Your Ticket is banned";
                                msgDesc = "Dear User, Your ticket No. " + results5[0].TICKET_NO + " is banned by " + results5[0].TICKET_TAKEN_EMPLOYEE + ".";
                                sendNotifications(req.body.authData.data.UserData[0].USER_ID, results5[0].USER_ID, "C", msgTitle, msgDesc, supportKey, req.body);
                                var DESCRIPTION = results5[0].TICKET_TAKEN_EMPLOYEE + " from " + results5[0].TICKET_TAKEN_DEPARTMENT + " has banned the ticket.";
                                mm.executeDML('INSERT INTO ' + ticketDetails + `(TICKET_MASTER_ID,SENDER,SENDER_ID,URL,DESCRIPTION,CLIENT_ID) values (?,?,?,?,?,?)`, [criteria.ID, 'X', '0', '', DESCRIPTION, data.CLIENT_ID], supportKey, connection, (error, results123) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection);
                                        res.status(400).json({
                                            "message": "Failed to save ticket information..."
                                        });
                                    } else {
                                        const wBparams = [{ "type": "text", "text": results5[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results5[0].TICKET_NO }]
                                        const wparams = [{ "type": "body", "parameters": wBparams }]
                                        if (results5[0].CUSTOMER_TYPE == "I") {
                                            mm.sendWAToolSMS(data.MOBILE_NO, "support_ticket_banned_", wparams, 'en', (error, resultswsms) => {
                                                if (error) {
                                                    console.log(error)
                                                }
                                                else {
                                                    console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                                }
                                            })
                                        }

                                        mm.sendDynamicEmail(27, criteria.ID, supportKey)
                                        addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                        mm.commitConnection(connection);
                                        res.status(200).json({
                                            "message": "success"
                                        });
                                    }
                                })
                            }
                        });
                    }
                    // User Sent New Message
                    else if (data.STATUS == "P") {
                        mm.executeDML(`UPDATE ` + ticketMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results4) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                console.log(error);
                                res.status(400).json({
                                    "message": "Failed to update ticket information..."
                                });
                            } else {
                                const wBparams = [{ "type": "text", "text": results5[0].CREATOR_EMPLOYEE_NAME }, { "type": "text", "text": results5[0].TICKET_NO }]
                                const wparams = [{ "type": "body", "parameters": wBparams }]
                                if (results5[0].CUSTOMER_TYPE == "I") {
                                    mm.sendWAToolSMS(data.MOBILE_NO, "support_transfer_ticket", wparams, 'en', (error, resultswsms) => {
                                        if (error) {
                                            console.log(error)
                                        }
                                        else {
                                            console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");
                                        }
                                    })
                                }
                                mm.sendDynamicEmail(28, criteria.ID, supportKey)
                                addLog(criteria.ID, Ltext, CREATED_DATE_TIME, data.STATUS, supportKey);
                                mm.commitConnection(connection);
                                res.status(200).json({
                                    "message": "success"
                                });
                            }
                        });
                    }
                    else {
                        console.log("No");
                        mm.rollbackConnection(connection);
                        res.status(400).json({
                            "message": "Invalid Status"
                        });
                    }
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

exports.create = (req, res) => {
    console.log("INCREATE")
    var data = reqData(req);
    const errors = validationResult(req);
    var DEPARTMENT_ID = req.body.DEPARTMENT_ID;
    var TERRITORY_ID = req.body.TERRITORY_ID;
    var supportKey = req.headers['supportkey'];

    if (!errors.isEmpty()) {
        console.log(errors);
        res.status(422).json({
            "message": errors.errors
        });
    }
    else {
        try {
            console.log("in1")
            if (DEPARTMENT_ID && TERRITORY_ID) {
                console.log("in2")

                const connection = mm.openConnection();
                mm.executeDML('SELECT CUSTOMER_TYPE from customer_master where ID = ?', [data.USER_ID], supportKey, connection, (error, checkType) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        mm.rollbackConnection(connection);
                        res.status(400).json({
                            "message": "Failed to save ticket information..."
                        });
                    }
                    else {
                        mm.executeDML('INSERT INTO ' + ticketMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                mm.rollbackConnection(connection);
                                res.status(400).json({
                                    "message": "Failed to save ticket information..."
                                });
                            }
                            else {
                                var lastId = results.insertId;
                                mm.executeDML(`select CREATOR_EMPLOYEE_NAME,USER_ID,ORGANISATION_NAME from ` + viewTicketMaster + ` where ID=?`, [lastId], supportKey, connection, (error, results1) => {
                                    if (error) {
                                        console.log(error);
                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                        mm.rollbackConnection(connection);
                                        res.status(400).json({
                                            "message": "Failed to get ticket information..."
                                        });
                                    }
                                    else {
                                        var msgTitle = ""; //notification title
                                        var msgDesc = ""; //notification description
                                        msgTitle = "New Ticket Created";
                                        msgDesc = "Dear User, " + results1[0].CREATOR_EMPLOYEE_NAME + " created a new ticket in your department. Please check "
                                        // mm.sendNotificationToDepartmentId(data.TICKET_GROUP_ID, msgTitle, msgDesc, supportKey);
                                        sendNotifications(req.body.authData.data.UserData[0].USER_ID, DEPARTMENT_ID, "D", msgTitle, msgDesc, supportKey, req.body, TERRITORY_ID);

                                        var CREATED_DATE_TIME = `(select DATE from view_ticket_master where ID=${lastId})`;
                                        console.log('Ltext1');
                                        var Ltext = `concat((select upper(CREATOR_EMPLOYEE_NAME) from view_ticket_master where ID=${lastId}),' is created the ticket ',(select TICKET_NO from view_ticket_master where ID=${lastId}),' on ',(select time(date) from view_ticket_master where ID = ${lastId}),' with subject ',(select upper(QUESTION) from view_ticket_master where ID = ${lastId}),' for ',(select upper(DEPARTMENT_NAME) from view_ticket_group_master where ID = ${data.TICKET_GROUP_ID}), ' department.')`;
                                        addLog(lastId, Ltext, CREATED_DATE_TIME, supportKey);
                                        var wBparams = [
                                            {
                                                "type": "text",
                                                "text": results1[0].CREATOR_EMPLOYEE_NAME
                                            },
                                            {
                                                "type": "text",
                                                "text": data.TICKET_NO
                                            },
                                            {
                                                "type": "text",
                                                "text": data.SUBJECT
                                            },
                                            {
                                                "type": "text",
                                                "text": mm.getSystemDate()
                                            }
                                        ]
                                        if (data.USER_TYPE == 'C') {
                                            var wparams = [
                                                {
                                                    "type": "body",
                                                    "parameters": wBparams
                                                }
                                            ]
                                            if (checkType[0].CUSTOMER_TYPE == 'I') {
                                                mm.sendWAToolSMS(data.MOBILE_NO, "ticket_creation_mail_to_customer", wparams, 'en', (error, resultswsms) => {
                                                    if (error) {
                                                        console.log(error)
                                                    }
                                                    else {
                                                        console.log("\n\n\n\n******watsapp message sent*******\n\n\n\n");
                                                    }
                                                })
                                                mm.sendDynamicEmail(5, results.insertId, supportKey)
                                            }
                                            else {
                                                mm.sendDynamicEmail(5, results.insertId, supportKey)
                                            }
                                        }
                                        req.body.TICKET_MASTER_ID = results.insertId;
                                        req.body.SENDER = 'U';
                                        req.body.SENDER_ID = data.USER_ID;
                                        req.body.DESCRIPTION = data.QUESTION;
                                        mm.commitConnection(connection);
                                        require('./ticketDetails').create(req, res);
                                    }
                                });
                            }
                        });
                    }
                });
            }
            else {
                console.log("in3")
                res.status(400).json({
                    "message": "parameter missing"
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
}

function sendNotifications(SENDER_ID, RECIPIENT_ID, USER_TYPE, msgTitle, msgDesc, supportKey, body, TERRITORY_ID) {
    if (USER_TYPE == 'D') {
        mm.sendNotificationToChannel(SENDER_ID, `support_${TERRITORY_ID}_channel`, msgTitle, msgDesc, "", "D", supportKey, "TC", "T", body);
        // mm.sendNotificationToDepartment(SENDER_ID, RECIPIENT_ID, msgTitle, msgDesc, "", "D", supportKey);
    } else if (USER_TYPE == 'C') {
        // mm.sendNotificationToCustomer(SENDER_ID, RECIPIENT_ID, msgTitle, msgDesc, "", "C", supportKey, "", "T", req.body);
        mm.sendNotificationToChannel(SENDER_ID, `customer_${RECIPIENT_ID}_channel`, msgTitle, msgDesc, "", "C", supportKey, "TC", "T", body);
    } else if (USER_TYPE == 'B') {
        // SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4
        mm.sendNotificationToManager(SENDER_ID, RECIPIENT_ID, msgTitle, msgDesc, "", "B", supportKey, "", "T", body);
    }
}


function sendWpMessage(NAME, TICKET_NO, SUPPORT_USER_NAME, MOBILE_NO, TEMPLATE_NAME) {

    console.log("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nim in sendWpMessage function", "NAME", NAME, "TICKET_NO", TICKET_NO, "SUPPORT_USER_NAME", SUPPORT_USER_NAME, "MOBILE_NO", MOBILE_NO, "TEMPLATE_NAME", TEMPLATE_NAME);

    var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    var wBparams = [];
    if (TEMPLATE_NAME == "support_ticket_assigned ") {
        wBparams = [{ "type": "text", "text": NAME }, { "type": "text", "text": TICKET_NO }, { "type": "text", "text": SUPPORT_USER_NAME }, { "type": "text", "text": formattedDate }]
    } else if (TEMPLATE_NAME == "support_ticket_onhold ") {
        wBparams = [{ "type": "text", "text": NAME }, { "type": "text", "text": TICKET_NO }, { "type": "text", "text": SUPPORT_USER_NAME }]
    }
    else {
        wBparams = [{ "type": "text", "text": NAME }, { "type": "text", "text": TICKET_NO }]
    }

    var wparams = [
        {
            "type": "body",
            "parameters": wBparams
        }
    ]

    mm.sendWAToolSMS(MOBILE_NO, TEMPLATE_NAME, wparams, 'en', (error, resultswsms) => {
        if (error) {
            console.log(error)
        }
        else {
            console.log("\n\n\n\n\n\n*******watsapp message sent*****\n\n\n\n");

        }
    })
}