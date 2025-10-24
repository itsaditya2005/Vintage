const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const axios = require('axios');
const async = require('async');
const geolib = require('geolib');
const express = require('express')
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo');
const technicianActivityCalender = require('../../modules/technicianActivityCalender');
const applicationkey = process.env.APPLICATION_KEY;

var technicianschedule = "technicianschedule";
var viewTechnicianschedule = "view_" + technicianschedule;

var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

function reqData(req) {
    var data = {
        ID: req.body.ID,
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        TERRITORY_ID: req.body.TERRITORY_ID,
        TECHNICIAN_NAME: req.body.TECHNICIAN_NAME,
        DATE: req.body.DATE,
        '00:00': req.body['00:00'],
        '00:10': req.body['00:10'],
        '00:20': req.body['00:20'],
        '00:30': req.body['00:30'],
        '00:40': req.body['00:40'],
        '00:50': req.body['00:50'],
        '01:00': req.body['01:00'],
        '01:10': req.body['01:10'],
        '01:20': req.body['01:20'],
        '01:30': req.body['01:30'],
        '01:40': req.body['01:40'],
        '01:50': req.body['01:50'],
        '02:00': req.body['02:00'],
        '02:10': req.body['02:10'],
        '02:20': req.body['02:20'],
        '02:30': req.body['02:30'],
        '02:40': req.body['02:40'],
        '02:50': req.body['02:50'],
        '03:00': req.body['03:00'],
        '03:10': req.body['03:10'],
        '03:20': req.body['03:20'],
        '03:30': req.body['03:30'],
        '03:40': req.body['03:40'],
        '03:50': req.body['03:50'],
        '04:00': req.body['04:00'],
        '04:10': req.body['04:10'],
        '04:20': req.body['04:20'],
        '04:30': req.body['04:30'],
        '04:40': req.body['04:40'],
        '04:50': req.body['04:50'],
        '05:00': req.body['05:00'],
        '05:10': req.body['05:10'],
        '05:20': req.body['05:20'],
        '05:30': req.body['05:30'],
        '05:40': req.body['05:40'],
        '05:50': req.body['05:50'],
        '06:00': req.body['06:00'],
        '06:10': req.body['06:10'],
        '06:20': req.body['06:20'],
        '06:30': req.body['06:30'],
        '06:40': req.body['06:40'],
        '06:50': req.body['06:50'],
        '07:00': req.body['07:00'],
        '07:10': req.body['07:10'],
        '07:20': req.body['07:20'],
        '07:30': req.body['07:30'],
        '07:40': req.body['07:40'],
        '07:50': req.body['07:50'],
        '08:00': req.body['08:00'],
        '08:10': req.body['08:10'],
        '08:20': req.body['08:20'],
        '08:30': req.body['08:30'],
        '08:40': req.body['08:40'],
        '08:50': req.body['08:50'],
        '09:00': req.body['09:00'],
        '09:10': req.body['09:10'],
        '09:20': req.body['09:20'],
        '09:30': req.body['09:30'],
        '09:40': req.body['09:40'],
        '09:50': req.body['09:50'],
        '10:00': req.body['10:00'],
        '10:10': req.body['10:10'],
        '10:20': req.body['10:20'],
        '10:30': req.body['10:30'],
        '10:40': req.body['10:40'],
        '10:50': req.body['10:50'],
        '11:00': req.body['11:00'],
        '11:10': req.body['11:10'],
        '11:20': req.body['11:20'],
        '11:30': req.body['11:30'],
        '11:40': req.body['11:40'],
        '11:50': req.body['11:50'],
        '12:00': req.body['12:00'],
        '12:10': req.body['12:10'],
        '12:20': req.body['12:20'],
        '12:30': req.body['12:30'],
        '12:40': req.body['12:40'],
        '12:50': req.body['12:50'],
        '13:00': req.body['13:00'],
        '13:10': req.body['13:10'],
        '13:20': req.body['13:20'],
        '13:30': req.body['13:30'],
        '13:40': req.body['13:40'],
        '13:50': req.body['13:50'],
        '14:00': req.body['14:00'],
        '14:10': req.body['14:10'],
        '14:20': req.body['14:20'],
        '14:30': req.body['14:30'],
        '14:40': req.body['14:40'],
        '14:50': req.body['14:50'],
        '15:00': req.body['15:00'],
        '15:10': req.body['15:10'],
        '15:20': req.body['15:20'],
        '15:30': req.body['15:30'],
        '15:40': req.body['15:40'],
        '15:50': req.body['15:50'],
        '16:00': req.body['16:00'],
        '16:10': req.body['16:10'],
        '16:20': req.body['16:20'],
        '16:30': req.body['16:30'],
        '16:40': req.body['16:40'],
        '16:50': req.body['16:50'],
        '17:00': req.body['17:00'],
        '17:10': req.body['17:10'],
        '17:20': req.body['17:20'],
        '17:30': req.body['17:30'],
        '17:40': req.body['17:40'],
        '17:50': req.body['17:50'],
        '18:00': req.body['18:00'],
        '18:10': req.body['18:10'],
        '18:20': req.body['18:20'],
        '18:30': req.body['18:30'],
        '18:40': req.body['18:40'],
        '18:50': req.body['18:50'],
        '19:00': req.body['19:00'],
        '19:10': req.body['19:10'],
        '19:20': req.body['19:20'],
        '19:30': req.body['19:30'],
        '19:40': req.body['19:40'],
        '19:50': req.body['19:50'],
        '20:00': req.body['20:00'],
        '20:10': req.body['20:10'],
        '20:20': req.body['20:20'],
        '20:30': req.body['20:30'],
        '20:40': req.body['20:40'],
        '20:50': req.body['20:50'],
        '21:00': req.body['21:00'],
        '21:10': req.body['21:10'],
        '21:20': req.body['21:20'],
        '21:30': req.body['21:30'],
        '21:40': req.body['21:40'],
        '21:50': req.body['21:50'],
        '22:00': req.body['22:00'],
        '22:10': req.body['22:10'],
        '22:20': req.body['22:20'],
        '22:30': req.body['22:30'],
        '22:40': req.body['22:40'],
        '22:50': req.body['22:50'],
        '23:00': req.body['23:00'],
        '23:10': req.body['23:10'],
        '23:20': req.body['23:20'],
        '23:30': req.body['23:30'],
        '23:40': req.body['23:40'],
        '23:50': req.body['23:50'],
        CLIENT_ID: req.body.CLIENT_ID
    };
    return data;
}


exports.validate = function () {
    return [
        body('TECHNICIAN_ID').isInt().optional(),
        body('DATE').exists(),
        body('ID').optional(),
    ]
}

exports.get = async (req, res) => {
    try {
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
                mm.executeQuery('select count(*) as cnt from ' + viewTechnicianschedule + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get technicianschedule count.",
                        });
                    }
                    else {
                        mm.executeQuery('select * from ' + viewTechnicianschedule + ' where 1 ' + criteria, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get technicianschedule information."
                                });
                            }
                            else {
                                res.send({
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
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something Went Wrong."
        })
    }


}

mm.executeQueryPromise = function (query, supportKey) {
    return new Promise((resolve, reject) => {
        mm.executeQuery(query, supportKey, (err, result) => {
            if (err) reject(err);
            else resolve([result]);
        });
    });
};

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
            mm.executeQueryData('INSERT INTO ' + technicianschedule + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save technicianschedule information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "technicianschedule information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + technicianschedule + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update technicianschedule information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "technicianschedule information updated successfully...",
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

// Helper function to promisify mm.executeQueryData
const executeQueryDataAsync = (query, params, supportKey) => {
    return new Promise((resolve, reject) => {
        mm.executeQueryData(query, params, supportKey, (error, results) => {
            if (error) {
                reject(error);
                return;
            }
            resolve(results);
        });
    });
};

// Helper function for distance and time (assuming it's synchronous or promisified)
const getDistanceAndTimeAsync = (lat1, lon1, lat2, lon2, speed) => {
    // If getDistanceAndTime is callback-based, promisify it similarly to executeQueryDataAsync
    return new Promise((resolve) => {
        resolve(getDistanceAndTime(lat1, lon1, lat2, lon2, speed));
    });
};

exports.getTechniciansScheduleNew = async (req, res) => {
    const supportKey = req.headers['supportkey'];
    const pageIndex = req.body.pageIndex || '';
    const pageSize = req.body.pageSize || '';
    const sortKey = req.body.sortKey || 'ID';
    const sortValue = req.body.sortValue || 'DESC';
    const filter = req.body.filter || '';
    const TERRITORY_ID = req.body.SERVICE_DATA[0].TERRITORY_ID;
    const EXPECTED_DATE_TIME = req.body.SERVICE_DATA[0].EXPECTED_DATE_TIME;
    const ESTIMATED_TIME_IN_MIN = req.body.SERVICE_DATA[0].ESTIMATED_TIME_IN_MIN;
    const startTime = new Date(EXPECTED_DATE_TIME);
    const SERVICE_START_TIME = startTime.toTimeString().split(' ')[0];
    const endTime = new Date(startTime.getTime() + ESTIMATED_TIME_IN_MIN * 60000);
    const SERVICE_END_TIME = endTime.toTimeString().split(' ')[0];
    const SERVICE_LAT = req.body.SERVICE_DATA[0].LATTITUTE;
    const SERVICE_LONG = req.body.SERVICE_DATA[0].LONGITUDE;
    const SortOrder = req.body.SortOrder;
    const adjustedStartTime = new Date(startTime.getTime() + ESTIMATED_TIME_IN_MIN * 60000);
    const isoString = adjustedStartTime.toISOString();
    var MONGOFILTER_DATE = isoString.split('T');
    var JOB_DATE = isoString.split('T');
    const IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const TECHNICIAN_TYPE = req.body.TECHNICIAN_TYPE;
    const VENDOR_ID = req.body.VENDOR_ID;
    const IS_SCHEDULED_BY = req.body.IS_SCHEDULED_BY;
    let start = 0;
    let end = 0;
    let criteria = '';

    if (pageIndex && pageSize) {
        start = (pageIndex - 1) * pageSize;
        end = parseInt(pageSize);
    }

    criteria = pageIndex && pageSize
        ? `${filter} ORDER BY ${sortKey} ${sortValue} LIMIT ${start}, ${end}`
        : `${filter} ORDER BY ${sortKey} ${sortValue}`;

    try {
        if (IS_FILTER_WRONG === '0') {
            if (req.body.SERVICE_DATA && req.body.TECHNICIAN_TYPE) {
                let technicianFilter = '';
                let techVertualFilter = '';
                let vendorFilter = '';

                if (TECHNICIAN_TYPE === "M") {
                    technicianFilter = ` AND TECHNICIAN_ID IN (SELECT TECHNICIAN_ID FROM customer_technician_mapping WHERE STATUS = 'M' AND IS_ACTIVE = 1 AND CUSTOMER_ID = ${req.body.CUSTOMER_ID}) `;
                }
                if (IS_SCHEDULED_BY === "V") {
                    vendorFilter = ` AND TECHNICIAN_ID IN (SELECT ID FROM technician_master WHERE VENDOR_ID = ${VENDOR_ID} AND IS_ACTIVE = 1) `;
                }
                if (TECHNICIAN_TYPE === "R" || TECHNICIAN_TYPE === "AR") {
                    techVertualFilter = ` AND TECHNICIAN_ID IN (SELECT ID FROM technician_master WHERE 1 AND IS_ACTIVE = 1 AND TYPE = 'R') `;
                }
                if (TECHNICIAN_TYPE === "MR") {
                    techVertualFilter = ` AND TECHNICIAN_ID IN (SELECT TECHNICIAN_ID FROM customer_technician_mapping WHERE STATUS = 'M' AND IS_ACTIVE = 1 AND CUSTOMER_ID = ${req.body.CUSTOMER_ID}) AND TECHNICIAN_ID IN (SELECT ID FROM technician_master WHERE 1 AND IS_ACTIVE = 1 AND TYPE = 'R') `;
                }

                const technicianData = await executeQueryDataAsync(
                    'SELECT DISTINCT TECHNICIAN_ID FROM view_technician_pincode_mapping WHERE PINCODE_ID IN (SELECT PINCODE_ID FROM territory_pincode_mapping WHERE TERRITORY_ID= ? AND IS_ACTIVE = 1) AND TECHNICIAN_IS_ACTIVE = 1 AND IS_ACTIVE = 1 ' + technicianFilter + vendorFilter + techVertualFilter,
                    [TERRITORY_ID],
                    supportKey
                );

                if (technicianData.length === 0) {
                    return res.status(200).send({ code: 300, message: 'No technicians found.' });
                }
                const TECHNICIAN_DATA = [];
                const technicianProcessingPromises = technicianData.map(async (record) => {
                    try {
                        let DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME;
                        const filterM = {
                            TECHNICIAN_ID: record.TECHNICIAN_ID,
                            $expr: {
                                $eq: [
                                    { $dateToString: { format: "%Y-%m-%d", date: "$DATE_OF_MONTH" } },
                                    MONGOFILTER_DATE[0]
                                ]
                            }
                        };
                        const techCalendardata = await technicianActivityCalender.findOne(filterM);

                        const calendarData = await executeQueryDataAsync(
                            `SELECT DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME, IS_SERIVCE_AVAILABLE FROM technician_service_calender WHERE WEEK_DAY=LEFT(DAYNAME('${JOB_DATE[0]}'), 2) AND TECHNICIAN_ID = ?`,
                            [record.TECHNICIAN_ID],
                            supportKey
                        );

                        if (calendarData.length === 0) return;
                        if (techCalendardata) {
                            // console.log("\n\n\n\n techCalendardata is present : ",techCalendardata)
                            // TECHNICIAN_STATUS = techCalendardata.IS_SERIVCE_AVAILABLE === 1 || techCalendardata.IS_SERIVCE_AVAILABLE === true ? 0 : 1
                            // IS_SERIVCE_AVAILABLE = techCalendardata.IS_SERIVCE_AVAILABLE === 1 || techCalendardata.IS_SERIVCE_AVAILABLE === true ? 1 : 0
                            ({ DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME } = techCalendardata);
                        } else {
                            // TECHNICIAN_STATUS = calendarData[0].IS_SERIVCE_AVAILABLE === 0 ? 0 : 1
                            // IS_SERIVCE_AVAILABLE = calendarData[0].IS_SERIVCE_AVAILABLE === 0 ? 0 : 1
                            ({ DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME } = calendarData[0]);
                        }

                        const systemDate = mm.getSystemDate();
                        const SERVICE_START = new Date(`${systemDate.split(' ')[0]} ${SERVICE_START_TIME}`);
                        const SERVICE_END = new Date(`${systemDate.split(' ')[0]} ${SERVICE_END_TIME}`);
                        const DAY_START = new Date(`${systemDate.split(' ')[0]} ${DAY_START_TIME}`);
                        const DAY_END = new Date(`${systemDate.split(' ')[0]} ${DAY_END_TIME}`);
                        const BREAK_START = new Date(`${systemDate.split(' ')[0]} ${BREAK_START_TIME}`);
                        const BREAK_END = new Date(`${systemDate.split(' ')[0]} ${BREAK_END_TIME}`);

                        if (DAY_END <= DAY_START) DAY_END.setDate(DAY_END.getDate() + 1);
                        if (BREAK_END <= BREAK_START) BREAK_END.setDate(BREAK_END.getDate() + 1);
                        let working_deviation = 0;
                        let break_deviation = 0;
                        let overlap_start = null;
                        let overlap_end = null;
                        let BREAK_EARLY_OR_LATE = 'NA';
                        let break_overlap_duration = 0;
                        let DAY_EARLY_OR_LATE = 'NA';
                        let SST = DAY_START;
                        let SET = DAY_END;
                        let BST = BREAK_START;
                        let BET = BREAK_END;
                        let JST = SERVICE_START;
                        let JET = SERVICE_END;
                        if (JST >= SST && JET <= SET) {
                            working_deviation = 0;

                            if (JST < BST && JET > BST && JET < BET) {
                                overlap_start = BST;
                                overlap_end = JET;
                                break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                break_deviation = break_overlap_duration;
                                BREAK_EARLY_OR_LATE = 'E';
                            } else if (JST > BST && JST < BET && JET <= BET) {
                                if (JST > BST && JET < BET) {
                                    overlap_start = JST;
                                    overlap_end = JET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'E';
                                } else if (JST > BST && JET <= BET) {
                                    overlap_start = JST;
                                    overlap_end = JET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'E';
                                } else {
                                    overlap_start = BST;
                                    overlap_end = JET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'L';
                                }
                            } else if (
                                JST <= BST && JET >= BET) {
                                overlap_start = BST;
                                overlap_end = BET;
                                break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                break_deviation = 1000;
                            } else if (JST > BST && JET <= SET && BET <= JET) {
                                if (JET < SET) {
                                    break_deviation = 0;

                                } else {
                                    overlap_start = JST;
                                    overlap_end = BET;
                                    break_overlap_duration = (overlap_end - overlap_start) / 60000; // ms to minutes
                                    break_deviation = break_overlap_duration;
                                    BREAK_EARLY_OR_LATE = 'E';
                                }

                            }
                        } else if (JST < SST && JET > BST && JET <= BET && JET >= SET) {
                            working_deviation = 1000;
                            break_deviation = (JET - BST) / 60000;
                            BREAK_EARLY_OR_LATE = 'L';
                        } else if (JST < SST && JET > BST && JET <= BET && JET <= SET) {
                            working_deviation = (SST - JST) / 60000;
                            break_deviation = (JET - BST) / 60000;
                            overlap_start = BST;
                            overlap_end = JET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            BREAK_EARLY_OR_LATE = 'L';
                            DAY_EARLY_OR_LATE = 'E';
                        } else if (JST >= SST && JST < BST && JET > BET && JET <= SET) {
                            working_deviation = 0;
                            break_deviation = 1000;
                            BREAK_EARLY_OR_LATE = 'E';
                        } else if (JST >= SST && JST < BST && JET > BET && JET > SET) {
                            working_deviation = (JET - SET) / 60000;
                            break_deviation = 1000;
                            overlap_start = BST;
                            overlap_end = BET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'L';
                        } else if (JST >= SST && BST >= JST) {
                            working_deviation = (JET - SET) / 60000;
                            break_deviation = 1000;
                            overlap_start = BST;
                            overlap_end = BET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'L';
                        } else if (JET <= SET && BET >= SET) {
                            working_deviation = (SST - JST) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                        } else if (JST <= SST && BET <= JET && BST.getTime() !== JET.getTime()) {
                            working_deviation = (SST - JST) / 60000;
                            break_deviation = 1000;
                            overlap_start = BST;
                            overlap_end = BET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                            BREAK_EARLY_OR_LATE = 'NA';
                        } else if ((JET < SST || JST > SET) && (JST < BST || JET > BET)) {
                            working_deviation = 1000;
                            break_deviation = 1000;
                        } else if (JST <= SST && JET <= BET) {
                            working_deviation = (SST - JST) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                        } else if (JST <= BET && JET >= SET) {
                            if (BST <= JST && JET >= SET) {
                                working_deviation = (JET - SET) / 60000;
                                overlap_start = JST;
                                overlap_end = BET;
                                break_overlap_duration = (overlap_end - overlap_start) / 60000;
                                break_deviation = break_overlap_duration;
                                DAY_EARLY_OR_LATE = 'L';
                                BREAK_EARLY_OR_LATE = 'E';
                            } else {
                                working_deviation = (JET - SET) / 60000;
                                DAY_EARLY_OR_LATE = 'L';
                            }
                        } else if (JST > BET && JET > SET) {
                            working_deviation = (JET - SET) / 60000;
                            DAY_EARLY_OR_LATE = 'L';
                        } else if (JST <= SST && BET <= SET && BST.getTime() == JET.getTime()) {
                            working_deviation = (SST - JST) / 60000;
                            break_deviation = (BST - JET) / 6000;
                            overlap_start = BST;
                            overlap_end = JET;
                            break_overlap_duration = (overlap_end - overlap_start) / 60000;
                            DAY_EARLY_OR_LATE = 'E';
                            BREAK_EARLY_OR_LATE = 'NA';
                        } else {
                            working_deviation = 1000;
                        }

                        const jobData = await executeQueryDataAsync(
                            `SELECT START_TIME, END_TIME, LATTITUTE, LONGITUDE FROM view_job_card WHERE TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = '${JOB_DATE[0]}' AND (END_TIME <= '${SERVICE_START_TIME}') ORDER BY START_TIME DESC LIMIT 1`,
                            [record.TECHNICIAN_ID],
                            supportKey
                        );

                        const parseJobTime = jobTime => new Date(`${systemDate.split(' ')[0]} ${jobTime}`);

                        const IS_JOB_CONFLICT = jobData.some(job => {
                            const JOB_START = parseJobTime(job.START_TIME);
                            const JOB_END = parseJobTime(job.END_TIME);
                            return SERVICE_START < JOB_END && SERVICE_END > JOB_START;
                        }) ? 1 : 0;

                        const currentTime = new Date(systemDate);
                        const IS_ON_JOB = jobData.some(job => {
                            const JOB_START = parseJobTime(job.START_TIME);
                            const JOB_END = parseJobTime(job.END_TIME);
                            return currentTime >= JOB_START && currentTime <= JOB_END;
                        }) ? 1 : 0;

                        const skillData = await executeQueryDataAsync(
                            'SELECT GROUP_CONCAT(SKILL_NAME) as SKILLS FROM view_technician_skill_mapping WHERE TECHNICIAN_ID = ? AND IS_ACTIVE = 1',
                            [record.TECHNICIAN_ID],
                            supportKey
                        );

                        const DataTechnician = await executeQueryDataAsync(
                            'SELECT * FROM view_technician_master A WHERE ID = ?',
                            [record.TECHNICIAN_ID],
                            supportKey
                        );

                        if (skillData.length === 0 || skillData[0].SKILLS == null || skillData[0].SKILLS === '' || skillData[0].SKILLS.length === 0 || DataTechnician.length === 0) {
                            return; // Skip this technician if essential data is missing
                        }
                        let LOC_LAT = (jobData[0] && jobData[0].LATTITUTE)
                            ? jobData[0].LATTITUTE
                            : (DataTechnician[0] ? DataTechnician[0].HOME_LATTITUDE : null);

                        let LOC_LONG = (jobData[0] && jobData[0].LONGITUDE)
                            ? jobData[0].LONGITUDE
                            : (DataTechnician[0] ? DataTechnician[0].HOME_LONGITUDE : null);

                        const distanceResult = await getDistanceAndTimeAsync(parseFloat(LOC_LAT), parseFloat(LOC_LONG), parseFloat(SERVICE_LAT), parseFloat(SERVICE_LONG), 60);
                        const googleDistance = await getDistanceDataFromGoogleAPI(parseFloat(LOC_LAT), parseFloat(LOC_LONG), parseFloat(SERVICE_LAT), parseFloat(SERVICE_LONG));
                        const distanceInKm = `${distanceResult.distance}km`;
                        const hrs = distanceResult.estimatedTimeHours.split('.')[0];
                        const mins = distanceResult.estimatedTimeHours.split('.')[1];
                        const TimeInHours = `${hrs} hours ${mins} mins`;
                        const GoogleDistance = googleDistance ? googleDistance.distance : distanceInKm;
                        const GoogleDuration = googleDistance ? googleDistance.duration : TimeInHours;

                        const TECHNICIAN_SKILLS = skillData[0].SKILLS.split(',');
                        const SERVICE_SKILLS = req.body.SERVICE_DATA[0].SERVICE_SKILLS.split(',');
                        const matchedSkills = SERVICE_SKILLS.filter(skill => TECHNICIAN_SKILLS.includes(skill)).length;
                        const SKILL_RATIO = `${matchedSkills}/${SERVICE_SKILLS.length}`;

                        const BREAK_TIME = `${BREAK_START_TIME} to ${BREAK_END_TIME}`;
                        const currentSystemDate = new Date(systemDate);
                        const IS_ON_BREAK = currentSystemDate >= BREAK_START && currentSystemDate <= BREAK_END ? 1 : 0;

                        const formattedWorkingDeviation = formatMinutesToHoursAndMinutes(Math.round(working_deviation));
                        const formattedBreakDeviation = formatMinutesToHoursAndMinutes(Math.round(break_deviation));
                        const formattedBreakOverlapDuration = formatMinutesToHoursAndMinutes(Math.round(break_overlap_duration));

                        TECHNICIAN_DATA.push({
                            ...DataTechnician[0],
                            TECHNICIAN_ID: record.TECHNICIAN_ID,
                            WORK_DEVIATIONS: working_deviation,
                            BREAK_DEVIATIONS: break_deviation,
                            BREAK_OVERLAP_DURATIONS: break_overlap_duration,
                            working_deviation: formattedWorkingDeviation,
                            break_deviation: formattedBreakDeviation,
                            break_overlap_duration: formattedBreakOverlapDuration,
                            BREAK_EARLY_OR_LATE,
                            DAY_EARLY_OR_LATE,
                            IS_JOB_CONFLICT,
                            IS_ON_JOB,
                            DISTANCE: GoogleDistance,
                            DISTANCE_IN_KM: GoogleDistance,
                            ESTIMATED_TIME_TRAVAL: GoogleDuration,
                            // DISTANCE: distanceInKm,
                            // DISTANCE_IN_KM: distanceResult.distance,
                            // ESTIMATED_TIME_TRAVAL: TimeInHours,
                            SKILL_RATIO,
                            MATCHED_SKILLS: matchedSkills,
                            BREAK_TIME,
                            IS_ON_BREAK,
                            DAY_START_TIME: DAY_START_TIME,
                            DAY_END_TIME: DAY_END_TIME,
                            DAY_START_END: `${DAY_START_TIME} to ${DAY_END_TIME}`,
                            CURRENT_LATITUDE: LOC_LAT,
                            CURRENT_LONGITUDE: LOC_LONG,
                            IS_SERIVCE_AVAILABLE: techCalendardata && techCalendardata.IS_SERIVCE_AVAILABLE !== undefined ? (techCalendardata.IS_SERIVCE_AVAILABLE ? 1 : 0) : calendarData[0].IS_SERIVCE_AVAILABLE,
                            TECHNICIAN_STATUS: techCalendardata && techCalendardata.IS_SERIVCE_AVAILABLE !== undefined ? (techCalendardata.IS_SERIVCE_AVAILABLE ? 1 : 0) : calendarData[0].IS_SERIVCE_AVAILABLE,
                        });
                    } catch (innerError) {
                        console.error("Error processing technician:", innerError);
                        // Optionally handle errors for individual technicians, e.g., log and continue
                    }
                });
                await Promise.all(technicianProcessingPromises);
                // const filteredTechnicians = TECHNICIAN_DATA.filter(technician => technician.IS_SERIVCE_AVAILABLE === 1);
                const sortedTechnicians = sortTechnicians(TECHNICIAN_DATA, SortOrder);
                res.status(200).send({ code: 200, data: sortedTechnicians });
            } else {
                res.status(400).send({ code: 400, message: 'Please provide a valid parameter.' });
            }
        } else {
            res.status(400).send({ code: 400, message: 'Invalid filter parameter.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ code: 500, message: 'Something went wrong.' });
    }
};

function formatMinutesToHoursAndMinutes(minutes) {
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hrs > 0 ? `${hrs}hr${hrs > 1 ? 's' : ''} ${mins}min` : `${mins}min`;
}

async function getDistanceDataFromGoogleAPI(lat1, lon1, lat2, lon2) {
    // const API_KEYOLD = 'AIzaSyA1EJJ0RMDQwzsDd00Oziy1pytYn_Ozi-g';
    const API_KEY = 'AIzaSyDT0rIRA3oOkwIhszO4xoZIiYfzkTc_4WY';
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=${API_KEY}`;

    try {
        const response = await axios.get(url);
        if (response.data.status === "OK" && response.data.rows[0].elements[0].status === "OK") {
            const element = response.data.rows[0].elements[0];
            return {
                distance: element.distance.text,
                duration: element.duration.text || "Unknown",
            };
        } else {
            throw new Error(`Distance Matrix API error: ${response.data.status}`);
        }
    } catch (error) {
        console.error("Error fetching data from Google Maps API:", error.message);
        return { distance: "N/A", duration: "N/A" };
    }
}

function haversineDistance(lat1, lon1, lat2, lon2) {
    const toRadians = (degrees) => degrees * (Math.PI / 180);

    const R = 6371;
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return `${distance.toFixed(2)} km`;
}

async function calculateDistance(lat1, lon1, lat2, lon2) {
    const googleData = await getDistanceDataFromGoogleAPI(lat1, lon1, lat2, lon2);

    if (googleData.distance === "N/A") {
        const haversineDist = haversineDistance(lat1, lon1, lat2, lon2);
        return {
            distance: haversineDist,
            duration: "Unknown",
        };
    }

    return googleData;
}

exports.getJobCounts = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let DATE = req.body.DATE ? req.body.DATE : '';

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
            // var Query = `SELECT SUM(CASE WHEN STATUS IN ('AS','CO','P','R') AND (DATE(ASSIGNED_DATE)='${DATE}' OR DATE(JOB_COMPLETED_DATETIME)= '${DATE}' OR DATE(JOB_CREATED_DATE)= '${DATE}') THEN 1 ELSE 0 END) AS TOTAL_COUNT,
            // SUM(CASE WHEN STATUS='AS' AND DATE(ASSIGNED_DATE)='${DATE}' THEN 1 ELSE 0 END) AS ASSIGNED_COUNT,SUM(CASE WHEN STATUS='CO' AND DATE(JOB_COMPLETED_DATETIME)='${DATE}' THEN 1 ELSE 0 END) AS COMPLETED_COUNT,
            // SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END) AS PENDING_COUNT,SUM(CASE WHEN STATUS='R' THEN 1 ELSE 0 END) AS REJECTED_COUNT 
            // FROM view_job_card WHERE 1 `;

            var Query = `SELECT (SUM(CASE WHEN STATUS='AS' AND DATE(ASSIGNED_DATE)='${DATE}' THEN 1 ELSE 0 END)+SUM(CASE WHEN STATUS='CO' AND DATE(JOB_COMPLETED_DATETIME)='${DATE}' THEN 1 ELSE 0 END)+SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END)+SUM(CASE WHEN STATUS='R' THEN 1 ELSE 0 END)) AS TOTAL_COUNT,
            SUM(CASE WHEN STATUS='AS' AND DATE(ASSIGNED_DATE)='${DATE}' THEN 1 ELSE 0 END) AS ASSIGNED_COUNT,
            SUM(CASE WHEN STATUS='CO' AND DATE(JOB_COMPLETED_DATETIME)='${DATE}' THEN 1 ELSE 0 END) AS COMPLETED_COUNT,
            SUM(CASE WHEN STATUS='P' THEN 1 ELSE 0 END) AS PENDING_COUNT,
            SUM(CASE WHEN STATUS='R' THEN 1 ELSE 0 END) AS REJECTED_COUNT 
            FROM view_job_card WHERE 1 `;
            mm.executeQuery(Query + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get technicianschedule count.",
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "success",
                        "data": results1
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

exports.scheduleJob = (req, res) => {
    const errors = validationResult(req);
    var data = reqData(req);
    const systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    const IS_ORDER_JOB = req.body.IS_ORDER_JOB;
    const ORDER_DATA = req.body.ORDER_DATA;
    const ORDER_NO = req.body.ORDER_NO;
    var VENDOR_ID = req.body.VENDOR_ID;
    const { TERRITORY_ID, TECHNICIAN_ID, DATE, START_TIME, END_TIME, JOB_CARD_NO, ORDER_ID, SERVICE_ID, ID, TECHNICIAN_NAME, SCHEDULED_DATE_TIME, ORGNISATION_ID, USER_ID, CUSTOMER_ID, CUSTOMER_MANAGER_ID } = req.body;

    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).send({
            "code": 422,
            "message": errors.errors
        });
    }

    try {
        const connection = mm.openConnection()
        if (IS_ORDER_JOB == 'J') {
            mm.executeDML(`SELECT * FROM ${technicianschedule} WHERE 1 AND TECHNICIAN_ID = ? AND DATE = ? AND TERRITORY_ID  = ?`, [TECHNICIAN_ID, DATE, TERRITORY_ID], supportKey, connection, (error, resultsCheck1) => {
                if (error) {
                    mm.rollbackConnection(connection);
                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                    console.log(error);
                    return res.status(400).send({
                        "code": 400,
                        "message": "Failed to update technicianschedule information."
                    });
                } else {
                    const start = parseTime(START_TIME);
                    const end = parseTime(END_TIME);
                    const timeSlots = generateTimeSlots(start, end);
                    const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                    var query = ``;
                    var values = ''
                    if (resultsCheck1.length > 0) {
                        query = `UPDATE ${technicianschedule} SET ${setClauses}, DATE = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                        values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS,' + CUSTOMER_MANAGER_ID), DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                    } else {
                        const columns = timeSlots.map(slot => `\`${slot}\``).join(", ");
                        const placeholders = timeSlots.map(() => "?").join(", ");
                        query = `INSERT INTO ${technicianschedule} (${columns},TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID)  VALUES (${placeholders},?, ?, ?, ?, ?)`;
                        values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS,' + CUSTOMER_MANAGER_ID), TECHNICIAN_NAME, DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                    }
                    mm.executeDML(`SELECT * FROM view_job_card WHERE 1 AND TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (START_TIME <= '${START_TIME + ":00"}' OR START_TIME <= '${END_TIME + ":00"}') AND (END_TIME >= '${START_TIME + ":00"}' OR END_TIME >= '${END_TIME + ":00"}') AND STATUS='AS'`, [TECHNICIAN_ID, DATE, START_TIME, END_TIME], supportKey, connection, (error, resultsCheck) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                            console.log(error);
                            return res.status(400).send({
                                "code": 400,
                                "message": "Failed to update technicianschedule information."
                            });
                        } else {
                            if (resultsCheck.length > 0) {
                                mm.rollbackConnection(connection);
                                return res.status(200).send({
                                    "code": 300,
                                    "message": "The technician is already scheduled for this time slot."
                                });
                            } else {
                                mm.executeDML(query, values, supportKey, connection, (error, results) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                        console.log(error);
                                        return res.status(400).send({
                                            "code": 400,
                                            "message": "Failed to update technicianschedule information."
                                        });
                                    } else {
                                        mm.executeDML('UPDATE job_card SET JOB_STATUS_ID = ?,TECHNICIAN_STATUS = ?,TECHNICIAN_ID = ?,TECHNICIAN_NAME = ?,SCHEDULED_DATE_TIME = ?,START_TIME = ?,END_TIME = ?,USER_ID = ?,ASSIGNED_DATE = ?,ORGNISATION_ID = ?,VENDOR_ID = ? WHERE ID = ?', [2, 'AS', TECHNICIAN_ID, TECHNICIAN_NAME, DATE, START_TIME, END_TIME, USER_ID, mm.getSystemDate(), ORGNISATION_ID, VENDOR_ID, ID], supportKey, connection, (error, results) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                console.log(error);
                                                return res.status(400).send({
                                                    "code": 400,
                                                    "message": "Failed to update technicianschedule information."
                                                });
                                            } else {
                                                mm.executeDML('UPDATE order_master SET ORDER_STATUS_ID = ? WHERE ID = ?', [4, ORDER_ID], supportKey, connection, (error, resultsOrder) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                        console.log(error);
                                                        return res.status(400).send({
                                                            "code": 400,
                                                            "message": "Failed to update technicianschedule information."
                                                        });
                                                    } else {
                                                        mm.executeDML('SELECT * FROM view_order_master WHERE ID = ?', [ORDER_ID], supportKey, connection, (error, resultsOrderS) => {
                                                            if (error) {
                                                                mm.rollbackConnection(connection);
                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                                console.log(error);
                                                                return res.status(400).send({
                                                                    "code": 400,
                                                                    "message": "Failed to update technicianschedule information."
                                                                });
                                                            } else {
                                                                mm.executeDML('SELECT * FROM order_details WHERE ORDER_ID = ?', [ORDER_ID], supportKey, connection, (error, getOrderDetails) => {
                                                                    if (error) {
                                                                        mm.rollbackConnection(connection);
                                                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                                        console.log(error);
                                                                        return res.status(400).send({
                                                                            "code": 400,
                                                                            "message": "Failed to update technicianschedule information."
                                                                        });
                                                                    } else {
                                                                        mm.executeDML('SELECT * FROM view_job_card WHERE ID = ?', [ID], supportKey, connection, (error, resultsgetJobDetails) => {
                                                                            if (error) {
                                                                                mm.rollbackConnection(connection);
                                                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                                                console.log(error);
                                                                                return res.status(400).send({
                                                                                    "code": 400,
                                                                                    "message": "Failed to update technicianschedule information."
                                                                                });
                                                                            } else {
                                                                                mm.executeDML('SELECT * FROM view_customer_order_details where ORDER_ID = ? AND JOB_CARD_ID = ?', [ORDER_ID, ID], supportKey, connection, (error, resultgetcustomerOrder) => {
                                                                                    if (error) {
                                                                                        console.log(error);
                                                                                        mm.rollbackConnection(connection)
                                                                                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                                                                        res.send({
                                                                                            "code": 400,
                                                                                            "message": "Failed to save orderMaster information..."
                                                                                        });
                                                                                    }
                                                                                    else {

                                                                                        var wBparams = [
                                                                                            {
                                                                                                "type": "text",
                                                                                                "text": resultsOrderS[0].CUSTOMER_NAME
                                                                                            },
                                                                                            {
                                                                                                "type": "text",
                                                                                                "text": resultsOrderS[0].ORDER_NUMBER
                                                                                            },
                                                                                            {
                                                                                                "type": "text",
                                                                                                "text": DATE
                                                                                            },
                                                                                            {
                                                                                                "type": "text",
                                                                                                "text": formattedDate
                                                                                            }
                                                                                        ]

                                                                                        var wparams = [
                                                                                            {
                                                                                                "type": "body",
                                                                                                "parameters": wBparams
                                                                                            }
                                                                                        ]

                                                                                        mm.sendWAToolSMS(resultsOrderS[0].MOBILE_NO, "order_scheduled", wparams, 'en', (error, resultswsms) => {
                                                                                            if (error) {
                                                                                                console.log(error)
                                                                                            }
                                                                                            else {
                                                                                                console.log("SMS sent successfully", resultswsms);
                                                                                            }
                                                                                        })

                                                                                        var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has assigned a job ${JOB_CARD_NO} for the technician ${data.TECHNICIAN_NAME}.`
                                                                                        const logarray = [{ TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, CART_ID: 0, EXPECTED_DATE_TIME: DATE, ORDER_MEDIUM: resultsOrderS[0].ORDER_MEDIUM, ORDER_STATUS: "Order scheduled", PAYMENT_MODE: resultsOrderS[0].PAYMENT_MODE, PAYMENT_STATUS: resultsOrderS[0].PAYMENT_STATUS, TOTAL_AMOUNT: resultsOrderS[0].TOTAL_AMOUNT, ORDER_NUMBER: resultsOrderS[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job assigned to the technician", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 },
                                                                                        { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: '-', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, CART_ID: 0, EXPECTED_DATE_TIME: DATE, ORDER_MEDIUM: resultsOrderS[0].ORDER_MEDIUM, ORDER_STATUS: "Order scheduled", PAYMENT_MODE: resultsOrderS[0].PAYMENT_MODE, PAYMENT_STATUS: resultsOrderS[0].PAYMENT_STATUS, TOTAL_AMOUNT: resultsOrderS[0].TOTAL_AMOUNT, ORDER_NUMBER: resultsOrderS[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job assigned to the technician", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }]
                                                                                        dbm.saveLog(logarray, technicianActionLog);
                                                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, "**Job Scheduled**", `Your job for ${resultsOrderS[0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", supportKey, "N", "J", req.body);
                                                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, "Job Scheduled", `Your job for ${resultsOrderS[0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", supportKey, "N", "J", resultgetcustomerOrder);
                                                                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Job Scheduled for You", `A job has been scheduled for ${resultsOrderS[0].ORDER_NUMBER}. \n Scheduled Date & Time: ${DATE}${START_TIME}.`, "", "J", supportKey, "N", "J", resultsgetJobDetails);
                                                                                        mm.sendDynamicEmail(10, getOrderDetails[0].ID, supportKey)

                                                                                        mm.commitConnection(connection);
                                                                                        res.status(200).send({
                                                                                            "code": 200,
                                                                                            "message": "Technicianschedule information updated successfully...",
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
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
            });
        } else if (IS_ORDER_JOB == 'O') {
            if (ORDER_DATA && Array.isArray(ORDER_DATA)) {
                var TechnicianLogData = [];
                async.eachSeries(ORDER_DATA, (jobCard, callback) => {
                    const { TERRITORY_ID, TECHNICIAN_ID, DATE, START_TIME, END_TIME, JOB_CARD_NO, ORDER_ID, SERVICE_ID, ID, TECHNICIAN_NAME, ORGNISATION_ID, USER_ID, CUSTOMER_ID, VENDOR_ID, ORDER_NO } = jobCard;
                    mm.executeDML(
                        `SELECT * FROM ${technicianschedule} WHERE TECHNICIAN_ID = ? AND DATE = ?`,
                        [TECHNICIAN_ID, DATE],
                        supportKey, connection,
                        (error, resultsCheck1) => {
                            if (error) return callback(error);
                            const start = parseTime(START_TIME);
                            const end = parseTime(END_TIME);
                            const timeSlots = generateTimeSlots(start, end);
                            const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                            let query, values;

                            if (resultsCheck1.length > 0) {
                                query = `UPDATE ${technicianschedule} SET ${setClauses}, DATE = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                                values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS'), DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                            } else {
                                const columns = timeSlots.map(slot => `\`${slot}\``).join(", ");
                                const placeholders = timeSlots.map(() => "?").join(", ");
                                query = `INSERT INTO ${technicianschedule} (${columns}, TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID) VALUES (${placeholders}, ?, ?, ?, ?, ?)`;
                                values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS'), TECHNICIAN_NAME, DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                            }

                            mm.executeDML(query, values, supportKey, connection, (error) => {
                                if (error) return callback(error);

                                mm.executeDML(
                                    `UPDATE job_card SET JOB_STATUS_ID = ?, TECHNICIAN_STATUS = ?, TECHNICIAN_ID = ?, TECHNICIAN_NAME = ?, SCHEDULED_DATE_TIME = ?, START_TIME = ?, END_TIME = ?, USER_ID = ?, ASSIGNED_DATE = ?, ORGNISATION_ID = ?,VENDOR_ID = ? WHERE ID = ?`,
                                    [2, 'AS', TECHNICIAN_ID, TECHNICIAN_NAME, DATE, START_TIME, END_TIME, USER_ID, mm.getSystemDate(), ORGNISATION_ID, VENDOR_ID, ID],
                                    supportKey, connection,
                                    (error) => {
                                        if (error) return callback(error);

                                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has assigned job ${JOB_CARD_NO} for the technician ${TECHNICIAN_NAME}.`;
                                        const logData = { TECHNICIAN_ID: TECHNICIAN_ID, ORDER_ID: ORDER_ID, JOB_CARD_ID: ID, CUSTOMER_ID: CUSTOMER_ID, ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, ORDER_STATUS: 'Order scheduled', JOB_CARD_STATUS: 'Job card assigned to technician', LOG_TYPE: 'Job', ACTION_LOG_TYPE: "User", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: mm.getSystemDate(), supportKey: 0 };
                                        TechnicianLogData.push(logData)
                                        callback(null);
                                    }
                                );
                            });
                        }
                    );
                }, (err) => {
                    if (err) {
                        mm.rollbackConnection(connection);
                        console.log(err);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(err)}`, applicationkey);
                        return res.status(400).send({ code: 400, message: "Failed to schedule job cards." });
                    } else {
                        mm.executeDML('UPDATE order_master SET ORDER_STATUS_ID = ? WHERE ID = ?', [4, ORDER_ID], supportKey, connection, (error, resultsOrder) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                console.log(error);
                                return res.status(400).send({
                                    "code": 400,
                                    "message": "Failed to update technicianschedule information."
                                });
                            } else {
                                mm.executeDML('SELECT * FROM view_order_details WHERE JOB_CARD_ID = ?', [ID], supportKey, connection, (error, resultsOrderS) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                        console.log(error);
                                        return res.status(400).send({
                                            "code": 400,
                                            "message": "Failed to update technicianschedule information."
                                        });
                                    } else {
                                        mm.executeDML(`select * from view_order_master where ID =?`, [ORDER_ID], supportKey, connection, (error, resultsOrderM) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                            }
                                            else {
                                                mm.executeDML('SELECT * FROM view_job_card WHERE ID = ?', [ID], supportKey, connection, (error, resultsgetJobDetails) => {
                                                    if (error) {
                                                        mm.rollbackConnection(connection);
                                                        console.log(error);
                                                    } else {
                                                        const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has assigned order ${ORDER_NO} to technician ${TECHNICIAN_NAME}.`;
                                                        const logData1 = { TECHNICIAN_ID: TECHNICIAN_ID, ORDER_ID: ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, ORDER_STATUS: 'Order scheduled', JOB_CARD_STATUS: 'Job card assigned to technician', LOG_TYPE: 'Order', ACTION_LOG_TYPE: "User", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: mm.getSystemDate(), supportKey: 0 };
                                                        TechnicianLogData.push(logData1)
                                                        dbm.saveLog(TechnicianLogData, technicianActionLog);
                                                        // mm.sendNotificationToCustomer(req.body.authData.data.UserData[0].USER_ID, CUSTOMER_ID, "**Job Scheduled**", `Your job for ${ORDER_NO} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", supportKey, "N", "J", req.body);
                                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, "Job Scheduled", `Your job for ${ORDER_NO} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", supportKey, "N", "J", resultsOrderM);
                                                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Job Scheduled for You", `A job has been scheduled for ${ORDER_NO}. \n Scheduled Date & Time: ${DATE}${START_TIME}.`, "", "J", supportKey, "N", "J", resultsgetJobDetails);
                                                        let orderDetailsId = resultsOrderS.lenght > 0 ? resultsOrderS[0].ID : 0;
                                                        resultsOrderS.lenght > 0 && orderDetailsId > 0 ? mm.sendDynamicEmail(10, orderDetailsId, supportKey) : "";

                                                        var wBparams = [
                                                            {
                                                                "type": "text",
                                                                "text": resultsOrderS[0].CUSTOMER_NAME
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": resultsOrderS[0].ORDER_NUMBER
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": DATE
                                                            },
                                                            {
                                                                "type": "text",
                                                                "text": formattedDate
                                                            }
                                                        ]

                                                        var wparams = [
                                                            {
                                                                "type": "body",
                                                                "parameters": wBparams
                                                            }
                                                        ]

                                                        mm.sendWAToolSMS(resultsOrderS[0].MOBILE_NO, "order_scheduled", wparams, 'en', (error, resultswsms) => {
                                                            if (error) {
                                                                console.log(error)
                                                            }
                                                            else {
                                                                console.log("SMS sent successfully", resultswsms);
                                                            }
                                                        })
                                                        mm.commitConnection(connection);
                                                        res.status(200).send({ code: 200, message: "Job cards scheduled successfully." });

                                                    }
                                                })
                                            }
                                        })
                                    }
                                })
                            }
                        });
                    }
                });
            } else {
                res.status(400).send({ code: 400, message: "Order data is missing or invalid." });
            }
        } else {
            mm.rollbackConnection(connection);
            res.status(400).send({
                "code": 400,
                "message": "Invalid ORDER_STATUS."
            });
        }
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)} `, applicationkey);
        console.log(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong."
        });
    }
};

exports.updateScheduleJob = (req, res) => {
    const systemDate = mm.getSystemDate();
    var supportKey = req.headers['supportkey'];
    var OLD_DATA = req.body.OLD_DATA;
    const { TERRITORY_ID, TECHNICIAN_ID, DATE, START_TIME, END_TIME, JOB_CARD_NO, ORDER_ID, SERVICE_ID, ID, TECHNICIAN_NAME, SCHEDULED_DATE_TIME, ORGNISATION_ID, USER_ID, CUSTOMER_ID, VENDOR_ID, CUSTOMER_MANAGER_ID, REASON } = req.body;

    try {
        const connection = mm.openConnection()
        mm.executeDML(`SELECT * FROM ${technicianschedule} WHERE 1 AND TECHNICIAN_ID = ? AND DATE = ? AND TERRITORY_ID = ?`, [TECHNICIAN_ID, DATE, TERRITORY_ID], supportKey, connection, (error, resultsCheck1) => {
            if (error) {
                mm.rollbackConnection(connection);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)} `, applicationkey);
                console.log(error);
                return res.status(400).send({
                    "code": 400,
                    "message": "Failed to update technicianschedule information."
                });
            } else {
                if (OLD_DATA.length == 0) {
                    mm.rollbackConnection(connection);
                    return res.status(200).send({
                        "code": 300,
                        "message": "No old data found."
                    });
                }
                const start = parseTime(OLD_DATA.START_TIME);
                const end = parseTime(OLD_DATA.END_TIME);
                const timeSlots = generateTimeSlots(start, end);
                const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                var query = ``;
                var values = ''
                query = `UPDATE ${technicianschedule} SET ${setClauses}, DATE = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                values = [...Array(timeSlots.length).fill(null), OLD_DATA.SCHEDULED_DATE_TIME.split(' ')[0], mm.getSystemDate(), OLD_DATA.TERRITORY_ID, OLD_DATA.TECHNICIAN_ID, OLD_DATA.SCHEDULED_DATE_TIME.split(' ')[0]];
                mm.executeDML(query, values, supportKey, connection, (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                        console.log(error);
                        return res.status(400).send({
                            "code": 400,
                            "message": "Failed to update technicianschedule information."
                        });
                    } else {
                        const start = parseTime(START_TIME);
                        const end = parseTime(END_TIME);
                        const timeSlots = generateTimeSlots(start, end);
                        const setClauses = timeSlots.map(slot => `\`${slot}\` = ?`).join(", ");
                        var query = ``;
                        var values = ''
                        if (resultsCheck1.length > 0) {
                            query = `UPDATE ${technicianschedule} SET ${setClauses}, DATE = ?, CREATED_MODIFIED_DATE = ? WHERE TERRITORY_ID = ? AND TECHNICIAN_ID = ? AND DATE = ?`;
                            values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS,' + CUSTOMER_MANAGER_ID), DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                        } else {
                            const columns = timeSlots.map(slot => `\`${slot}\``).join(", ");
                            const placeholders = timeSlots.map(() => "?").join(", ");
                            query = `INSERT INTO ${technicianschedule} (${columns},TECHNICIAN_NAME, DATE, CREATED_MODIFIED_DATE, TERRITORY_ID, TECHNICIAN_ID)  VALUES (${placeholders},?, ?, ?, ?, ?)`;
                            values = [...Array(timeSlots.length).fill(JOB_CARD_NO + ',AS,' + CUSTOMER_MANAGER_ID), TECHNICIAN_NAME, DATE, mm.getSystemDate(), TERRITORY_ID, TECHNICIAN_ID, DATE];
                        }
                        mm.executeDML(`SELECT * FROM view_job_card  WHERE 1 AND JOB_CARD_NO != '${JOB_CARD_NO}' AND ID != ${ID} AND TECHNICIAN_ID = ? AND DATE(SCHEDULED_DATE_TIME) = ? AND (START_TIME <= '${START_TIME + ":00"}' OR START_TIME <= '${END_TIME + ":00"}') AND (END_TIME >= '${START_TIME + ":00"}' OR END_TIME >= '${END_TIME + ":00"}') AND STATUS='AS' `, [TECHNICIAN_ID, DATE, START_TIME, END_TIME], supportKey, connection, (error, resultsCheck) => {
                            if (error) {
                                mm.rollbackConnection(connection);
                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                console.log(error);
                                return res.status(400).send({
                                    "code": 400,
                                    "message": "Failed to update technicianschedule information."
                                });
                            } else {

                                if (resultsCheck.length > 0) {
                                    mm.rollbackConnection(connection);
                                    return res.status(200).send({
                                        "code": 300,
                                        "message": "The Technician is already scheduled for this time slot."
                                    });
                                } else {
                                    mm.executeDML(query, values, supportKey, connection, (error, results) => {
                                        if (error) {
                                            mm.rollbackConnection(connection);
                                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                            console.log(error);
                                            return res.status(400).send({
                                                "code": 400,
                                                "message": "Failed to update technicianschedule information."
                                            });
                                        } else {
                                            mm.executeDML('UPDATE job_card SET JOB_STATUS_ID = ?,TECHNICIAN_STATUS = ?,TECHNICIAN_ID = ?,TECHNICIAN_NAME = ?,SCHEDULED_DATE_TIME = ?,START_TIME = ?,END_TIME = ?,USER_ID = ?,ASSIGNED_DATE = ?,ORGNISATION_ID = ?,VENDOR_ID = ?,REASON=? WHERE ID = ?', [2, 'AS', TECHNICIAN_ID, TECHNICIAN_NAME, DATE, START_TIME, END_TIME, USER_ID, mm.getSystemDate(), ORGNISATION_ID, VENDOR_ID, REASON, ID], supportKey, connection, (error, results) => {
                                                if (error) {
                                                    mm.rollbackConnection(connection);
                                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                    console.log(error);
                                                    return res.status(400).send({
                                                        "code": 400,
                                                        "message": "Failed to update technicianschedule information."
                                                    });
                                                } else {
                                                    mm.executeDML('SELECT * FROM view_order_master WHERE ID = ?', [ORDER_ID], supportKey, connection, (error, resultsOrderS) => {
                                                        if (error) {
                                                            mm.rollbackConnection(connection);
                                                            logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                            console.log(error);
                                                            return res.status(400).send({
                                                                "code": 400,
                                                                "message": "Failed to update technicianschedule information."
                                                            });
                                                        } else {
                                                            mm.executeDML('SELECT * FROM view_job_card WHERE ID = ?', [ID], supportKey, connection, (error, resultsgetJobDetails) => {
                                                                if (error) {
                                                                    mm.rollbackConnection(connection);
                                                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                                    console.log(error);
                                                                    return res.status(400).send({
                                                                        "code": 400,
                                                                        "message": "Failed to update technicianschedule information."
                                                                    });
                                                                } else {
                                                                    console.log(req.body.authData.data.UserData[0]);
                                                                    var ACTION_DETAILS = ` ${req.body.authData.data.UserData[0].NAME} has removed job ${JOB_CARD_NO} form technician ${OLD_DATA.TECHNICIAN_NAME} and reassigned to the technician ${TECHNICIAN_NAME}.`
                                                                    const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'User', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: DATE, CART_ID: 0, EXPECTED_DATE_TIME: DATE, ORDER_MEDIUM: resultsOrderS[0].ORDER_MEDIUM, ORDER_STATUS: "Job scheduled for other technician", PAYMENT_MODE: resultsOrderS[0].PAYMENT_MODE, PAYMENT_STATUS: resultsOrderS[0].PAYMENT_STATUS, TOTAL_AMOUNT: resultsOrderS[0].TOTAL_AMOUNT, ORDER_NUMBER: resultsOrderS[0].ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: "", JOB_CARD_STATUS: "Job card assigned to other technician", USER_NAME: req.body.authData.data.UserData[0].NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                                    dbm.saveLog(logData, technicianActionLog);

                                                                    var wBparams = [
                                                                        {
                                                                            "type": "text",
                                                                            "text": resultsOrderS[0].CUSTOMER_NAME
                                                                        },
                                                                        {
                                                                            "type": "text",
                                                                            "text": resultsOrderS[0].ORDER_NUMBER
                                                                        },
                                                                        {
                                                                            "type": "text",
                                                                            "text": DATE
                                                                        },
                                                                        {
                                                                            "type": "text",
                                                                            "text": formattedDate
                                                                        }
                                                                    ]

                                                                    var wparams = [
                                                                        {
                                                                            "type": "body",
                                                                            "parameters": wBparams
                                                                        }
                                                                    ]

                                                                    mm.sendWAToolSMS(resultsOrderS[0].MOBILE_NO, "order_scheduled", wparams, 'en', (error, resultswsms) => {
                                                                        if (error) {
                                                                            console.log(error)
                                                                        }
                                                                        else {
                                                                            console.log("SMS sent successfully", resultswsms);
                                                                        }
                                                                    })
                                                                    mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${CUSTOMER_ID}_channel`, "Job Scheduled", `Your job for ${resultsOrderS[0].ORDER_NUMBER} has been scheduled for ${DATE}.Technician Assigned: ${TECHNICIAN_NAME}.`, "", "J", "supportKey", "N", "J", resultsOrderS);
                                                                    mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_ID, "Job Scheduled for You", `A job has been scheduled for ${resultsOrderS[0].ORDER_NUMBER}. \n Scheduled Date & Time: ${DATE}${START_TIME}.`, "", "J", "supportKey", "N", "J", resultsgetJobDetails);
                                                                    mm.commitConnection(connection);
                                                                    res.status(200).send({
                                                                        "code": 200,
                                                                        "message": "Technicianschedule information updated successfully...",
                                                                    });
                                                                }
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
                });
            }
        });
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong."
        });
    }
};

function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return { hours, minutes };
}

function generateTimeSlots(start, end) {
    const slots = [];
    let current = new Date(0, 0, 0, start.hours, start.minutes);

    while (current <= new Date(0, 0, 0, end.hours, end.minutes)) {
        const hours = current.getHours().toString().padStart(2, "0");
        const minutes = current.getMinutes().toString().padStart(2, "0");
        slots.push(`${hours}:${minutes}`);
        current.setMinutes(current.getMinutes() + 10);
    }

    return slots;
}

function sortTechnicians(technicianData, sortOrder) {
    return technicianData.sort((a, b) => {
        for (const { KEY } of sortOrder) {
            switch (KEY) {
                case 'SK': {
                    const aSkill = parseInt(a.MATCHED_SKILLS);
                    const bSkill = parseInt(b.MATCHED_SKILLS);
                    if (aSkill !== bSkill) return bSkill - aSkill;
                    break;
                }
                case 'D': {
                    const aDistance = parseFloat(a.DISTANCE_IN_KM);
                    const bDistance = parseFloat(b.DISTANCE_IN_KM);
                    if (aDistance !== bDistance) return aDistance - bDistance;
                    break;
                }
                case 'S': {
                    if (a.WORK_DEVIATIONS !== b.WORK_DEVIATIONS) {
                        return a.WORK_DEVIATIONS - b.WORK_DEVIATIONS;
                    }
                    break;
                }
                case 'B': {
                    if (a.BREAK_DEVIATIONS !== b.BREAK_DEVIATIONS) {
                        return a.BREAK_DEVIATIONS - b.BREAK_DEVIATIONS;
                    }
                    break;
                }
                case 'R': {
                    if (a.AVG_RATINGS !== b.AVG_RATINGS) {
                        return b.AVG_RATINGS - a.AVG_RATINGS;
                    }
                    break;
                }
            }
        }
        if (technicianData.length <= 1) {
            return technicianData;
        } else {
            return 0;
        }
    });
}

function getDistanceAndTime(lat1, lon1, lat2, lon2, averageSpeedKmph = 60) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    const estimatedTimeHours = distance / averageSpeedKmph;

    return {
        distance: distance.toFixed(2),
        estimatedTimeHours: estimatedTimeHours.toFixed(2),
    };
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

