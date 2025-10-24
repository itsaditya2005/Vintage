const mm = require('../../utilities/globalModule');
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");

const applicationkey = process.env.APPLICATION_KEY;

var technicianActivityCalender = "technician_activity_calender";
var viewTechnicianActivityCalender = "view_" + technicianActivityCalender;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        IS_SERIVCE_AVAILABLE: req.body.IS_SERIVCE_AVAILABLE ? '1' : '0',
        DATE_OF_MONTH: req.body.DATE_OF_MONTH,
        WEEK_DAY: req.body.WEEK_DAY ? '1' : '0',
        DAY_START_TIME: req.body.DAY_START_TIME,
        DAY_END_TIME: req.body.DAY_END_TIME,
        BREAK_START_TIME: req.body.BREAK_START_TIME,
        BREAK_END_TIME: req.body.BREAK_END_TIME,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}



exports.validate = function () {
    return [

        body('TECHNICIAN_ID').isInt().optional(), body('DATE_OF_MONTH').optional(), body('WEEK_DAY').optional(), body('DAY_START_TIME').optional(), body('DAY_END_TIME').optional(), body('BREAK_START_TIME').optional(), body('BREAK_END_TIME').optional(), body('ID').optional(),


    ]
}


exports.get = (req, res) => {

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';

    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    var start = 0;
    var end = 0;

    console.log(pageIndex + " " + pageSize)
    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
        console.log(start + " " + end);
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
            mm.executeQuery('select count(*) as cnt from ' + viewTechnicianActivityCalender + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to get technicianActivityCalender count.",
                    });
                }
                else {
                    console.log(results1);
                    mm.executeQuery('select * from ' + viewTechnicianActivityCalender + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).json({
                                "code": 400,
                                "message": "Failed to get technicianActivityCalender information."
                            });
                        }
                        else {
                            res.status(200).json({
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
            res.status(400).json({
                message: "Invalid filter parameter.",
            });
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).json({
            message: "Something went wrong."
        });
    }

}


exports.create = (req, res) => {

    var data = reqData(req);
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];

    if (!data.TECHNICIAN_ID) {
        res.status(400).json({
            message: "TECHNICIAN_ID is required."
        });
        return;
    }

    if (!errors.isEmpty()) {

        console.log(errors);
        res.status(422).json({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + technicianActivityCalender + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to save technicianActivityCalender information..."
                    });
                }
                else {
                    console.log(results);
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianActivityCalender information saved successfully...",
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
    //console.log(req.body);
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

    const fieldsToCheck = ['BREAK_START_TIME', 'BREAK_END_TIME', 'DAY_END_TIME', 'DAY_START_TIME'];

    fieldsToCheck.forEach(field => {
        if (data[field] == null) {
            setData += `${field} = ?, `;
            recordData.push(null);
        }
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
            mm.executeQueryData(`UPDATE ` + technicianActivityCalender + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.status(400).json({
                        "code": 400,
                        "message": "Failed to update technicianActivityCalender information."
                    });
                }
                else {
                    console.log(results);
                    res.status(200).json({
                        "code": 200,
                        "message": "TechnicianActivityCalender information updated successfully...",
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






const generateTechnicianActivity = (activities, year, month, techId) => {
    // console.log("month: " + month);

    const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
    // console.log("daysInMonth", daysInMonth);

    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
        // const date = new Date(`${year}-${month}-${day}`);
        const date = new Date(year, month - 1, day + 1)
        // console.log("date: " + date);
        // Months are 0-indexed
        const formattedDate = date.toISOString().split("T")[0];
        console.log('FORMATED DATE', formattedDate);

        const weekDay = date.toLocaleDateString("en-US", { weekday: "long" });

        const activity = activities.find((a) => a.DATE_OF_MONTH === formattedDate);
        // console.log("Activity for date:", formattedDate, activity);

        result.push({
            ID: activity?.ID ?? null,
            TECHNICIAN_ID: techId,
            IS_SERIVCE_AVAILABLE: activity?.IS_SERIVCE_AVAILABLE ?? null,
            DATE_OF_MONTH: formattedDate,
            WEEK_DAY: weekDay,
            DAY_START_TIME: activity?.DAY_START_TIME ?? null,
            DAY_END_TIME: activity?.DAY_END_TIME ?? null,
            BREAK_START_TIME: activity?.BREAK_START_TIME ?? null,
            BREAK_END_TIME: activity?.BREAK_END_TIME ?? null,
        });
    }

    return result;
};


exports.getCalenderData = (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID
    const YEAR = req.body.YEAR;
    const MONTH = req.body.MONTH;

    if (!TECHNICIAN_ID || !YEAR || !MONTH) {
        res.status(400).json({
            message: "TECHNICIAN_ID, YEAR and MONTH are required.",
        });
    }
    var supportKey = req.headers['supportkey'];
    try {


        mm.executeQuery('select * from ' + viewTechnicianActivityCalender + ` where 1 AND TECHNICIAN_ID= ${TECHNICIAN_ID} `, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.status(400).json({
                    "code": 400,
                    "message": "Failed to get technicianActivityCalender information."
                });
            }
            else {
                const calenderData = generateTechnicianActivity(results, YEAR, MONTH, TECHNICIAN_ID)
                res.status(200).json({
                    "code": 200,
                    "message": "success",
                    "data": calenderData
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