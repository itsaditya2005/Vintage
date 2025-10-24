const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var technicianLocationTrack = "technician_location_track";
var viewTechnicianLocationTrack = "view_" + technicianLocationTrack;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        LOCATION_LATITUDE: req.body.LOCATION_LATITUDE,
        LOCATION_LONG: req.body.LOCATION_LONG,
        DATE_TIME: req.body.DATE_TIME,
        ORDER_ID: req.body.ORDER_ID,
        JOB_CARD_ID: req.body.JOB_CARD_ID,
        CLIENT_ID: req.body.CLIENT_ID,
        SERVICE_ID: req.body.SERVICE_ID
    }
    return data;
}

exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('LOCATION_LATITUDE').optional(),
        body('LOCATION_LONG').optional(),
        body('DATE_TIME').optional(),
        body('ORDER_ID').optional(),
        body('JOB_CARD_ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianLocationTrack + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianLocationTrack count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewTechnicianLocationTrack + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);

                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get technicianLocationTrack information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 113,
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
            code: 500,
            message: "Something Went Wrong."
        })
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
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + technicianLocationTrack + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianLocationTrack information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "TechnicianLocationTrack information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData(`UPDATE ` + technicianLocationTrack + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianLocationTrack information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "TechnicianLocationTrack information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                code: 500,
                message: "Something Went Wrong."
            })
        }
    }
}


exports.getTechnicianLocations = (req, res) => {

    let PINCODE_ID = req.body.PINCODE_ID ? req.body.PINCODE_ID : [];
    let SKILL_ID = req.body.SKILL_ID ? req.body.SKILL_ID : '';
    let TYPE = req.body.TYPE ? req.body.TYPE : '';
    let EXPERIANCE = req.body.EXPERIANCE ? req.body.EXPERIANCE : '';
    let LOGITUDE = req.body.LOGITUDE ? req.body.LOGITUDE : '';
    let LATITUDE = req.body.LATITUDE ? req.body.LATITUDE : '';
    let IS_ALL = req.body.IS_ALL ? req.body.IS_ALL : '0';
    var supportKey = req.headers['supportkey'];

    var filterPincode = '';
    if (PINCODE_ID.length > 0) {
        filterPincode = ` AND (SELECT TECHNICIAN_ID FROM technician_pincode_mapping WHERE PINCODE_ID IN (${PINCODE_ID}) AND IS_ACTIVE = 1)`
    }

    var filterSkill = '';
    if (SKILL_ID.length > 0) {
        filterSkill = ` AND (SELECT TECHNICIAN_ID FROM technician_skill_mapping WHERE SKILL_ID IN (${SKILL_ID}) AND IS_ACTIVE = 1)`
    }

    var filterType = '';
    if (TYPE.length > 0) {
        filterType = ` AND TYPE IN (${TYPE})`
    }

    var filterExperience = '';
    if (EXPERIANCE.length > 0) {
        filterExperience = ` AND EXPERIENCE_LEVEL IN (${EXPERIANCE})`
    }

    var filterIsAll = ``;
    if (IS_ALL == '1') {
        filterIsAll = ` AND (6371 * ACOS(COS(RADIANS(${LATITUDE})) * COS(RADIANS((SELECT LOCATION_LATITUDE FROM technician_location_track WHERE TECHNICIAN_ID = VTM.ID ORDER BY ID DESC LIMIT 1))) * COS(RADIANS((SELECT LOCATION_LONG FROM technician_location_track WHERE TECHNICIAN_ID = VTM.ID ORDER BY ID DESC LIMIT 1)) - RADIANS(${LOGITUDE})) + SIN(RADIANS(${LATITUDE})) * SIN(RADIANS((SELECT LOCATION_LATITUDE FROM technician_location_track WHERE TECHNICIAN_ID = VTM.ID ORDER BY ID DESC LIMIT 1))))) <= 50;`;
    }

    try {
        mm.executeQuery(`SELECT *,(SELECT LOCATION_LATITUDE FROM technician_location_track WHERE TECHNICIAN_ID=VTM.ID ORDER BY ID DESC LIMIT 1)LOCATION_LATITUDE,(SELECT LOCATION_LONG FROM technician_location_track WHERE TECHNICIAN_ID=VTM.ID ORDER BY ID DESC LIMIT 1)LOCATION_LONG FROM view_technician_master VTM WHERE 1 ${filterPincode} ${filterSkill} ${filterType} ${filterExperience} ${filterIsAll}`, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get technicianLocationTrack count.",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": results
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to get technicianLocationTrack count.",
        });
    }
}



exports.getTechnicianLocationsByFilter = (req, res) => {

    let ORDER_ID = req.body.ORDER_ID ? req.body.ORDER_ID : '';
    let JOB_CARD_ID = req.body.JOB_CARD_ID ? req.body.JOB_CARD_ID : '';
    let TECHNICIAN_ID = req.body.TECHNICIAN_ID ? req.body.TECHNICIAN_ID : '';
    var supportKey = req.headers['supportkey'];
    var filter = req.body.filter ? req.body.filter : '';

    var filterOrder = '';
    if (ORDER_ID.length > 0) {
        filterOrder = ` AND t1.ORDER_ID IN (${ORDER_ID})`
    }

    var filterJob = ``;
    if (JOB_CARD_ID.length > 0) {
        filterJob = ` AND t1.JOB_CARD_ID IN (${JOB_CARD_ID})`
    }

    var filterTechnician = ``;
    if (TECHNICIAN_ID.length > 0) {
        filterTechnician = ` AND t1.TECHNICIAN_ID IN (${TECHNICIAN_ID})`
    }

    try {

        var Query = `SELECT t1.TECHNICIAN_ID,t1.TECHNICIAN_NAME,t1.CITY_NAME, t1.ORDER_ID,t1.JOB_CARD_ID,t1.LOCATION_LATITUDE,t1.LOCATION_LONG,t1.DATE_TIME FROM view_technician_location_track t1 WHERE t1.DATE_TIME = (SELECT MAX(t2.DATE_TIME) FROM view_technician_location_track t2 WHERE t2.TECHNICIAN_ID = t1.TECHNICIAN_ID AND (t2.ORDER_ID) = COALESCE(t1.ORDER_ID) ) ${filterOrder} ${filterJob} ${filterTechnician} ${filter}`
        mm.executeQuery(Query, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to get technicianLocationTrack count.",
                });
            }
            else {
                res.send({
                    "code": 200,
                    "message": "success",
                    "data": results
                });
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to get technicianLocationTrack count.",
        });
    }
}