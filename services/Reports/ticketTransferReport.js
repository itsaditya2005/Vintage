const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;


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

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

    let countCriteria = filter; '['

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';
    var TAKEN_BY_USER_ID = req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : '';
    var DEPARTMENT_ID = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : '';
    var RECIVER_ID = req.body.RECIVER_ID ? req.body.RECIVER_ID : '';

    var supportKey = req.headers['supportkey'];

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = `AND DATE(DATE) BETWEEN'${START_DATE}' AND '${END_DATE}'`
    }

    var filterTicketCreator = '';
    if (USER_ID.length > 0) {
        filterTicketCreator = `AND USER_ID IN (${USER_ID})`
    }
    var filterTicketReciver = '';
    if (TAKEN_BY_USER_ID.length > 0) {
        filterTicketReciver = `AND TAKEN_BY_USER_ID IN (${TAKEN_BY_USER_ID})`
    }
    var filterDepartment = '';
    if (DEPARTMENT_ID.length > 0) {
        filterDepartment = `AND TICKET_TAKEN_DEPARTMENT_NAME IN (${DEPARTMENT_ID})`
    }
    var filterTransfer = '';
    if (RECIVER_ID.length > 0) {
        filterTransfer = `AND RECIVER_ID IN (${RECIVER_ID})`
    }

    try {
        mm.executeQuery(`select count(ID) as cnt from view_ticket_master where 1 AND TAKEN_BY_USER_ID <> 0 ${filterDatewise} ${filterTicketCreator} ${filterTicketReciver} ${filterDepartment} ${filterTransfer} ` + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get count.",
                });
            }
            else {
                mm.executeQuery(`SELECT ID,TICKET_NO,CREATOR_EMPLOYEE_NAME,RECIVER_NAME ,TICKET_TAKEN_DEPARTMENT_NAME, RECIVER_AGENT, ANSWER_AGENT, SUPPORT_AGENT_NAME from view_ticket_master tm where 1 AND TAKEN_BY_USER_ID <> 0 ${filterDatewise} ${filterTicketCreator} ${filterTicketReciver} ${filterDepartment} ${filterTransfer} ${criteria} `, supportKey, (error, daywiseCount) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get data.",
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "count": results1[0].cnt,
                            "TAB_ID":127,
                            "data": daywiseCount
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }
}

exports.gete = (req, res) => {
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

    let countCriteria = filter; '['

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';
    var TAKEN_BY_USER_ID = req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : '';
    var DEPARTMENT_ID = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : '';
    var RECIVER_ID = req.body.RECIVER_ID ? req.body.RECIVER_ID : '';

    var supportKey = req.headers['supportkey'];

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = `AND DATE(DATE) BETWEEN'${START_DATE}' AND '${END_DATE}'`
    }

    var filterTicketCreator = '';
    if (USER_ID.length > 0) {
        filterTicketCreator = `AND USER_ID IN (${USER_ID})`
    }
    var filterTicketReciver = '';
    if (TAKEN_BY_USER_ID.length > 0) {
        filterTicketReciver = `AND TAKEN_BY_USER_ID IN (${TAKEN_BY_USER_ID})`
    }
    var filterDepartment = '';
    if (DEPARTMENT_ID.length > 0) {
        filterDepartment = `AND DEPARTMENT_ID IN (${DEPARTMENT_ID})`
    }
    var filterTransfer = '';

    if (RECIVER_ID.length > 0) {
        filterTransfer = `AND RECIVER_ID IN (${RECIVER_ID})`
    }

    try {
        mm.executeQuery(`select count(ID) as cnt from view_ticket_master where 1 ${filterDatewise} ${filterTicketCreator} ${filterTicketReciver} ${filterDepartment} ${filterTransfer} ` + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get count.",
                });
            }
            else {
                mm.executeQuery(`SELECT ID,TICKET_NO,CREATOR_EMPLOYEE_NAME,RECIVER_NAME ,DEPARTMENT_NAME,TICKET_TRANSFER_EMPLOYEE_NAME AS RECIVER_AGENT,TICKET_TRANSFER_EMPLOYEE_NAME AS ANSWER_AGENT,TICKET_GENERATOR_BRANCH AS CREATOR_BRANCH_NAME,TICKET_TAKEN_BRANCH AS RECEIVER_BRANCH_NAME,TICKET_TRANSFER_EMPLOYEE_NAME AS SUPPORT_AGENT_NAME,TICKET_TRANSFER_BRANCH_NAME AS SUPPORT_AGENT_BRANCH_NAME from view_ticket_master tm where 1  ${filterDatewise} ${filterTicketCreator} ${filterTicketReciver} ${filterDepartment} ${filterTransfer} ${criteria} `, supportKey, (error, daywiseCount) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get data.",
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "count": results1[0].cnt,
                            "data": daywiseCount
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }
}

exports.get1 = (req, res) => {
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

    let countCriteria = filter; '['

    var START_DATE = req.body.START_DATE ? req.body.START_DATE : '';
    var END_DATE = req.body.END_DATE ? req.body.END_DATE : '';

    var USER_ID = req.body.USER_ID ? req.body.USER_ID : '';
    var TAKEN_BY_USER_ID = req.body.TAKEN_BY_USER_ID ? req.body.TAKEN_BY_USER_ID : '';
    var DEPARTMENT_ID = req.body.DEPARTMENT_ID ? req.body.DEPARTMENT_ID : '';
    var RECIVER_ID = req.body.RECIVER_ID ? req.body.RECIVER_ID : '';

    var supportKey = req.headers['supportkey'];

    var filterDatewise = '';
    if (START_DATE.length > 0 && END_DATE.length > 0) {
        filterDatewise = ` AND DATE(DATE) BETWEEN'${START_DATE}' AND '${END_DATE}'`
    }

    var filterTicketCreator = '';
    if (USER_ID.length > 0) {
        filterTicketCreator = ` AND USER_ID IN (${USER_ID})`
    }
    var filterTicketReciver = '';
    if (TAKEN_BY_USER_ID.length > 0) {
        filterTicketReciver = ` AND TAKEN_BY_USER_ID IN (${TAKEN_BY_USER_ID})`
    }
    var filterDepartment = '';
    if (DEPARTMENT_ID.length > 0) {
        filterDepartment = ` AND TICKET_TAKEN_DEPARTMENT_ID IN (${DEPARTMENT_ID})`
    }
    var filterTransfer = '';
    if (RECIVER_ID.length > 0) {
        filterTransfer = ` AND RECIVER_ID IN (${RECIVER_ID})`
    }

    try {
        mm.executeQuery(`select count(ID) as cnt from view_ticket_master where 1 ${filterDatewise} ${filterTicketCreator} ${filterTicketReciver} ${filterDepartment} ${filterTransfer} ` + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get count.",
                });
            }
            else {
                mm.executeQuery(`SELECT ID,TICKET_NO,CREATOR_EMPLOYEE_NAME,RECIVER_NAME ,TICKET_TAKEN_DEPARTMENT_NAME,TICKET_TAKEN_EMPLOYEE AS RECIVER_AGENT,TICKET_TAKEN_EMPLOYEE AS ANSWER_AGENT,TICKET_TAKEN_EMPLOYEE AS SUPPORT_AGENT_NAME from view_ticket_master tm where 1   ${filterDatewise} ${filterTicketCreator} ${filterTicketReciver} ${filterDepartment} ${filterTransfer} ${criteria} `, supportKey, (error, daywiseCount) => {
                    if (error) {
                        console.log(error);
                        res.send({
                            "code": 400,
                            "message": "Failed to get data.",
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "success",
                            "TAB_ID": 127,
                            "count": results1[0].cnt,
                            "data": daywiseCount
                        });
                    }
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
    }
}