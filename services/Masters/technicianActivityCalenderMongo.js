const mm = require('../../utilities/globalModule');
const { collectionName, ObjectId, closeConnection } = require("../../utilities/dbMongo");
const { validationResult, body } = require('express-validator');
const logger = require("../../utilities/logger");
// const { collectionName, closeConnection } = require("../../utilities/global");

const applicationkey = process.env.APPLICATION_KEY;

var technicianActivityCalender = "technician_activity_calender";
var viewTechnicianActivityCalender = "view_" + technicianActivityCalender;


function reqData(req) {

    var data = {
        TECHNICIAN_ID: req.body.TECHNICIAN_ID,
        IS_SERIVCE_AVAILABLE: req.body.IS_SERIVCE_AVAILABLE ? '1' : '0',
        DATE_OF_MONTH: req.body.DATE_OF_MONTH,
        WEEK_DAY: req.body.WEEK_DAY,
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

const generateTechnicianActivity = (activities, year, month, techId) => {
    const daysInMonth = new Date(year, month, 0).getDate(); // Get total days in the month
    // console.log("daysInMonth", daysInMonth);
    // console.log("activities: ",activities)
    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(`${year}-${month}-${day}`);
        // console.log("date: " + date);
        // Months are 0-indexed
        const formattedDate = date.toISOString().split("T")[0];
        const weekDay = date.toLocaleDateString("en-US", { weekday: "long" });

        const activity = activities.find((a) => a.DATE_OF_MONTH === formattedDate);
        // console.log("Activity for date:", formattedDate, activity);
        // console.log("activities activity?.DAY_START_TIME: ", activity?.ID ?? null)

        result.push({
            ID: activity?._id ?? null,
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


exports.getCalenderDataold = (req, res) => {
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
                    "data": calenderData,
                    "TAB_ID": 139
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




exports.create = async (req, res) => {
    try {
        var data = reqData(req);
        const errors = validationResult(req);
        if (!data.TECHNICIAN_ID) {
            res.status(400).json({
                "code": 400,
                "message": "TECHNICIAN_ID is required."
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
        const { client, collection } = await collectionName("technician_activity_calender");
        const result = await collection.insertOne(data);
        if (!result.insertedId) {
            res.status(500).json({
                "message": "Failed to insert data into the database"
            });
        }
        res.status(200).json({
            "code": 200,
            "message": "Data added successfully",
            // insertedId: result.insertedId
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            "message": "Something went wrong."
        });
    } finally {
        await closeConnection();
    }
};



exports.getCalenderData = async (req, res) => {
    const TECHNICIAN_ID = req.body.TECHNICIAN_ID;
    const YEAR = req.body.YEAR;
    const MONTH = req.body.MONTH;

    if (!TECHNICIAN_ID || !YEAR || !MONTH) {
        return res.status(400).json({
            "code": 400,
            "message": "TECHNICIAN_ID, YEAR and MONTH are required."
        });
    }

    const supportKey = req.headers['supportkey'];
    let client;

    try {
        const { client: dbClient, collection } = await collectionName("technician_activity_calender");
        client = dbClient;

        const results = await collection.find({ TECHNICIAN_ID: parseInt(TECHNICIAN_ID) }).toArray();

        // if (!results || results.length === 0) {
        //     return res.status(404).json({
        //         code: 404,
        //         message: "No technician activity calendar data found."
        //     });
        // }
        // console.log("results", results)
        const calenderData = generateTechnicianActivity(results, YEAR, MONTH, TECHNICIAN_ID);

        res.status(200).json({
            code: 200,
            message: "Success",
            data: calenderData,
            TAB_ID: 139
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error(error);
        res.status(500).json({
            "code": 500,
            "message": "Something went wrong."
        });
    } finally {
        if (client) {
            await closeConnection();
        }
    }
};


exports.update = async (req, res) => {
    const errors = validationResult(req);
    const supportKey = req.headers['supportkey'];
    const data = reqData(req);
    const systemDate = new Date().toISOString();
    const criteria = {
        ID: req.body.ID,
    };

    if (!criteria.ID) {
        return res.status(400).json({
            code: 400,
            message: "ID is required for updating the record.",
        });
    }
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.status(422).json({
            code: 422,
            message: errors.errors,
        });
    }
    try {
        const { client, collection } = await collectionName("technician_activity_calender");

        // Construct the update object
        const updateData = {
            ...data,
            CREATED_MODIFIED_DATE: systemDate,
        };

        // MongoDB query
        const result = await collection.updateOne({ _id: new ObjectId(criteria.ID) }, { $set: updateData });
        console.log("RESULT: " + result)
        if (result.matchedCount === 0) {
            console.log("No matching record found.");
            return res.status(404).json({
                code: 404,
                message: "No document found with the provided ID.",
            });
        }

        console.log("Update successful.", result);
        return res.status(200).json({
            code: 200,
            message: "TechnicianActivityCalender information updated successfully...",
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error("Error updating technician activity calendar:", error);
        return res.status(500).json({
            code: 500,
            message: "Failed to update technicianActivityCalender information.",
        });
    } finally {
        await closeConnection();
    }
};
