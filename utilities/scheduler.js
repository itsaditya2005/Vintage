var scheduler = require('node-schedule');
const mm = require('../utilities/globalModule');
const db = require('../utilities/globalModule');
// const fcm = require('../utilities/firebase');
const fs = require('fs')
const async = require('async');
// const { attachment } = require('express/lib/response');
const TechnicianActivityCalendar = require('../modules/technicianActivityCalender');
const TechnicianDayLog = require('../modules/technicainDayLog');

const dbm = require('../utilities/dbMongo')
exports.schedulerJob = (req, res) => {
    try {
        console.log("scheduler started");
        var j = scheduler.scheduleJob(" */1 * * * *", getSchedulerMaster);
    } catch (error) {
        console.log(error);
    }
}

var log = "schedularLog";

function getSchedulerMaster() {
    try {

        var systemdate = mm.getSystemDate();
        var dateTime = systemdate.toString().split(' ');
        var todayDate = new Date(systemdate);

        var dayName = todayDate.toString().split(' ')[0];
        var date = dateTime[0].split('-');
        var time = dateTime[1].split(':');

        var dhours = ("0" + todayDate.getHours()).slice(-2) + ':00:00';

        var dmin = '00:' + ("0" + todayDate.getMinutes()).slice(-2) + ':' + ("0" + todayDate.getSeconds()).slice(-2);
        var dsec = '00:' + '00:' + ("0" + todayDate.getSeconds()).slice(-2);


        var query = `select * from view_scheduler_master where  STATUS = 'A' AND ((REPEAT_MODE = 'C' AND REPEAT_DATA = '${dateTime[1]}') or (REPEAT_MODE = 'H' AND REPEAT_DATA = '${dateTime[1]}') or (REPEAT_MODE = 'N' AND REPEAT_DATA = '${dateTime[1]}') or (TIME = '${dateTime[1]}' AND ( (REPEAT_MODE = 'D') OR (REPEAT_MODE = 'W' AND REPEAT_DATA ='${dayName}') OR (REPEAT_MODE = 'M' AND REPEAT_DATA = '${date[2]}') OR (REPEAT_MODE = 'Y' AND REPEAT_DATA = '${date[1]}-${date[2]}') OR (REPEAT_MODE = 'S' AND REPEAT_DATA = '${dateTime[0]}'))))`;

        mm.executeQuery(query, log, (error, results) => {
            if (error) {
                console.log(error);
            }
            else {
                var timeObject = new Date(systemdate);
                var milliseconds = 60 * 1000; // 10 seconds = 10000 milliseconds
                timeObject = new Date(timeObject.getTime() + milliseconds);
                var hours = ("0" + timeObject.getHours()).slice(-2);

                // current minutes	
                var minutes = ("0" + timeObject.getMinutes()).slice(-2);

                // current seconds
                var seconds = ("0" + timeObject.getSeconds()).slice(-2);
                var curTime = hours + ":" + minutes + ":" + seconds;


                mm.executeQuery(`update scheduler_master set REPEAT_DATA = '${curTime}'  WHERE  REPEAT_MODE= 'N' AND STATUS ='A'`, log, (error, resultsUpdateIsFetched) => {
                    if (error) {
                        console.log("Error in last 1 : ", error);

                    }
                    else {
                        if (results.length > 0) {

                            for (let i = 0; i < results.length; i++) {
                                var record = results[i];
                                executeTask(record);
                            }
                        }
                        else {
                            console.log('No record');
                        }
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);
    }
}


function executeTask(data) {
    var supportKey = "schedular"
    var systemDate = mm.getSystemDate();
    // var today = systemDate.split(' ')[0];
    var CURRENT_TIME = mm.getSystemDate().split(' ')[1]
    CURRENT_TIME = CURRENT_TIME.slice(0, 5) + ":00";
    var today = new Date();
    var shortDayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    var day = shortDayNames[today.getDay()];
    switch (data.NOTIFICATION_TYPE_ID) {

        // FOR technician day start and end by system
        case 1:
            try {
                const connection = mm.openConnection();
                mm.executeDML('SELECT ID FROM technician_master WHERE (IS_SYSTEM_START != 1 OR IS_SYSTEM_END != 1) AND IS_ACTIVE=1', [], supportKey, connection, (error, technicianIds) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.error('Failed to retrieve technician IDs:', error);
                        return;
                    }

                    if (!technicianIds || technicianIds.length === 0) {
                        mm.rollbackConnection(connection);
                        console.log('No Technician IDs found.');
                        return;
                    }

                    let today = new Date();
                    let todayDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

                    let currentWeekDay = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][today.getDay()];

                    async.eachSeries(technicianIds, function processTechnician(technician, inner_callback) {
                        let TECHNICIAN_ID = technician.ID;
                        TechnicianActivityCalendar.find({
                            TECHNICIAN_ID,
                            $expr: {
                                $eq: [
                                    { $dateToString: { format: "%Y-%m-%d", date: "$DATE_OF_MONTH" } },
                                    todayDate
                                ]
                            }
                        }).then((activityData) => {
                            if (activityData.length > 0) {
                                let activity = activityData[0];
                                if (activity.DAY_START_TIME === CURRENT_TIME) {
                                    mm.executeDML('SELECT START_TIME FROM technician_daystart_track WHERE DATE = CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, trackData) => {
                                        if (error || (trackData && trackData.length > 0)) return inner_callback(error);

                                        mm.executeDML('INSERT INTO technician_daystart_track (TECHNICIAN_ID, START_TIME, CLIENT_ID, DATE) VALUES (?, NOW(), 1, CURDATE())', [TECHNICIAN_ID], supportKey, connection, (error, result1) => {
                                            if (error) return inner_callback(error);
                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day start by system', STATUS: 'DS', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);

                                            mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 1, IS_SYSTEM_START = 1, IS_SYSTEM_END = 0 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, inner_callback);
                                        }
                                        );
                                    }
                                    );
                                } else if (activity.DAY_END_TIME === CURRENT_TIME) {
                                    mm.executeDML('SELECT END_TIME FROM technician_daystart_track WHERE DATE = CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, trackData) => {
                                        if (error || (trackData && trackData.length > 0 && trackData[0].END_TIME != null))
                                            return inner_callback(error);

                                        mm.executeDML('UPDATE technician_daystart_track SET END_TIME = NOW() WHERE DATE = CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, result4) => {
                                            if (error) return inner_callback(error);

                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day end by system', STATUS: 'DE', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);

                                            mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0, IS_SYSTEM_START = 0, IS_SYSTEM_END = 1 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, inner_callback);
                                        }
                                        );
                                    }
                                    );
                                } else {

                                    inner_callback(null);
                                }
                            } else {
                                mm.executeDML('SELECT DAY_START_TIME, DAY_END_TIME FROM technician_service_calender WHERE WEEK_DAY = ? AND TECHNICIAN_ID = ?', [currentWeekDay, TECHNICIAN_ID], supportKey, connection, (error, serviceData) => {
                                    if (error || serviceData.length === 0) return inner_callback(error);

                                    let service = serviceData[0];
                                    if (service.DAY_START_TIME === CURRENT_TIME) {
                                        mm.executeDML('INSERT INTO technician_daystart_track (TECHNICIAN_ID, START_TIME, CLIENT_ID, DATE) VALUES (?, NOW(), 1, CURDATE())', [TECHNICIAN_ID], supportKey, connection, (error, result5) => {
                                            if (error) return inner_callback(error);

                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day start by system', STATUS: 'DS', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);

                                            mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 1, IS_SYSTEM_START = 1, IS_SYSTEM_END = 0 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, inner_callback);
                                        }
                                        );
                                    } else if (service.DAY_END_TIME === CURRENT_TIME) {
                                        mm.executeDML('UPDATE technician_daystart_track SET END_TIME = NOW() WHERE DATE = CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, result6) => {
                                            if (error) return inner_callback(error);

                                            let logdata = { TECHNICIAN_ID, LOG_TEXT: 'Day end by system', STATUS: 'DE', TYPE: 'SYSTEM', CLIENT_ID: 1, USER_ID: 0 };
                                            dbm.saveLog(logdata, TechnicianDayLog);

                                            mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0, IS_SYSTEM_START = 0, IS_SYSTEM_END = 1 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, inner_callback);
                                        }
                                        );
                                    } else {
                                        inner_callback(null);
                                    }
                                }
                                );
                            }
                        });
                    },
                        (err) => {
                            if (err) {
                                mm.rollbackConnection(connection);
                                console.error('Error processing technicians:', err);
                            } else {
                                mm.commitConnection(connection);
                                console.log('Technician processing completed successfully.');
                            }
                        }
                    );
                }
                );
            } catch (error) {
                console.error("Error in technicianScheduler:", error);
            }

            break;

        // FOR technician day end by system not in use
        case 2:
            // for day end of technician not using 
            try {
                const connection = mm.openConnection();
                mm.executeDML('SELECT ID FROM technician_master where IS_SYSTEM_END !=1  ', [], supportKey, connection, (error, technicianIds) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.error('Failed to retrieve technician IDs:', error);
                    } else {
                        if (!technicianIds || technicianIds.length === 0) {
                            mm.rollbackConnection(connection);
                            console.log('No Technician IDs found.');
                        } else {
                            let todayDate = today.toISOString().split("T")[0];
                            async.eachSeries(technicianIds, function processTechnician(technician, inner_callback) {
                                var TECHNICIAN_ID = technician.ID;
                                (async function () {
                                    try {
                                        activityData = require("../modules/technicianActivityCalender").find({
                                            TECHNICIAN_ID,
                                            $expr: {
                                                $eq: [
                                                    { $dateToString: { format: "%Y-%m-%d", date: "$DATE_OF_MONTH" } },
                                                    todayDate
                                                ]
                                            }
                                        }).then((activityData) => {
                                            if (activityData && activityData.length > 0 && activityData[0].DAY_END_TIME == CURRENT_TIME) {
                                                console.log("\n\n\n\n\n act      ", activityData)

                                                console.log("\n\n\n\nn\n\n", "calender")
                                                mm.executeDML('SELECT END_TIME FROM technician_daystart_track WHERE DATE = CURDATE()  AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, async (error, trackData) => {
                                                    if (error) {
                                                        console.error(
                                                            `Error checking daystart track for technician ${TECHNICIAN_ID}:`,
                                                            error
                                                        );
                                                        return inner_callback(error);
                                                    } else {
                                                        if (trackData && trackData.length > 0 && trackData[0].END_TIME == CURRENT_TIME) {
                                                            console.log("\n\n\n\n\n\n trackdata", trackData)
                                                            return inner_callback(null);
                                                        } else {
                                                            // Step 4: Insert into tech_daystart_track
                                                            mm.executeDML('update technician_daystart_track SET END_TIME = ? where TECHNICIAN_ID=? AND DATE=CURDATE() ', [CURRENT_TIME, TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                if (error) {
                                                                    console.error(
                                                                        `Error inserting day start track for technician ${TECHNICIAN_ID}:`,
                                                                        error
                                                                    );
                                                                    return inner_callback(error);
                                                                } else {
                                                                    console.log('i am in MongoDB operations');
                                                                    var LOG_TEXT = 'Day end by system';
                                                                    var STATUS = 'DE';
                                                                    var TYPE = 'SYSTEM';
                                                                    logdata = { TECHNICIAN_ID, LOG_TEXT, STATUS, TYPE, CLIENT_ID: 1, USER_ID: 0 }
                                                                    dbm.saveLog(logdata, TechnicianDayLog)
                                                                    console.log(
                                                                        `Logged day END for technician ${TECHNICIAN_ID}`
                                                                    );

                                                                    mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0, IS_SYSTEM_START=0 ,  IS_SYSTEM_END=1 WHERE ID =?', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                        if (error) {
                                                                            console.error(
                                                                                `Error updating technician status for ID ${TECHNICIAN_ID}:`,
                                                                                error
                                                                            );
                                                                            return inner_callback(error);
                                                                        } else {
                                                                            inner_callback(null);
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    }
                                                })
                                            } else {
                                                mm.executeDML('SELECT DAY_END_TIME FROM technician_service_calender WHERE TECHNICIAN_ID = ? AND WEEK_DAY = ? AND IS_SERIVCE_AVAILABLE = 1', [TECHNICIAN_ID, day], supportKey, connection, async (error, serviceData) => {
                                                    if (error) {
                                                        console.error(`Error retrieving service data for technician ${TECHNICIAN_ID}:`, error);
                                                        return inner_callback(error);
                                                    }
                                                    if (!serviceData || serviceData.length === 0 || !serviceData[0].DAY_END_TIME) {
                                                        return inner_callback(null);
                                                    }

                                                    const DAY_END_TIME = serviceData[0].DAY_END_TIME;
                                                    mm.executeDML('SELECT END_TIME FROM technician_daystart_track WHERE DATE = CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, async (error, trackData) => {
                                                        if (error) {
                                                            console.error(
                                                                `Error checking daystart track for technician ${TECHNICIAN_ID}:`,
                                                                error
                                                            );
                                                            return inner_callback(error);
                                                        }
                                                        if (trackData && trackData.length > 0 && trackData[0].END_TIME != null) {
                                                            return inner_callback(null);
                                                        }
                                                        // console.log("\n\n\n\nDay start time:", DAY_END_TIME);
                                                        // console.log("\n\n\n\nDay CURRENT_TIME:", CURRENT_TIME);
                                                        if (DAY_END_TIME === CURRENT_TIME) {
                                                            try {
                                                                mm.executeDML('update technician_daystart_track set  END_TIME=? where TECHNICIAN_ID=? AND DATE=CURDATE()', [CURRENT_TIME, TECHNICIAN_ID], supportKey, connection, (error, resultsInsert) => {
                                                                    if (error) {

                                                                        console.log(`Error inserting day start track for technician ${TECHNICIAN_ID}:`, error);
                                                                        return inner_callback(error);
                                                                    } else {
                                                                        console.log("\n\n\n\n\n\n\n\n\n resultsInsert", resultsInsert);
                                                                        
                                                                        console.log('i am in MongoDB operations');
                                                                        var LOG_TEXT = 'Day end by system';
                                                                        var STATUS = 'DE';
                                                                        var TYPE = 'SYSTEM';
                                                                        logdata = { TECHNICIAN_ID, LOG_TEXT, STATUS, TYPE, CLIENT_ID: 1, USER_ID: 0 }
                                                                        dbm.saveLog(logdata, TechnicianDayLog)
                                                                        console.log(
                                                                            `Logged day start for technician ${TECHNICIAN_ID}`
                                                                        );

                                                                        mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0,IS_SYSTEM_START=0,IS_SYSTEM_END=1 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                            if (error) {
                                                                                console.error(
                                                                                    `Error updating technician status for ID ${TECHNICIAN_ID}:`,
                                                                                    error
                                                                                );
                                                                                return inner_callback(error);
                                                                            }
                                                                            inner_callback(null);
                                                                        });
                                                                    }
                                                                });
                                                            } catch (mongoError) {
                                                                console.error(
                                                                    'MongoDB operation error:',
                                                                    mongoError
                                                                );
                                                                return inner_callback(mongoError);
                                                            }
                                                        } else {
                                                            return inner_callback(null);
                                                        }
                                                    });
                                                });
                                            }
                                        })

                                    } catch (e) {
                                        console.error('Internal async error:', e);
                                        return inner_callback(e);
                                    }
                                })(); // IIFE
                            },
                                function finalCallback(error) {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        console.error('Failed to process technician day start by system.');
                                    } else {
                                        mm.commitConnection(connection);

                                        console.log('Technician day END by system processed successfully.');
                                    }
                                });
                        }
                    }
                });
            } catch (error) {
                console.error('System error:', error);
            }
            break;

        // insert the next days data in activity calendar for all technicians
        case 3:
            try {
                const connection = mm.openConnection();
                mm.executeDML('SELECT ID FROM technician_master', [], supportKey, connection, async (error, technicianIds) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log("Failed to retrieve technician IDs.");
                    } else if (!technicianIds || technicianIds.length === 0) {
                        mm.rollbackConnection(connection);
                        console.log("No technicians found.");
                    } else {
                        const nextDt = new Date();
                        nextDt.setDate(nextDt.getDate() + 1);
                        const nextDate = nextDt.toISOString().split("T")[0];  // Use only the date part (YYYY-MM-DD)
                        const day2 = shortDayNames[nextDt.getDay()];

                        // Use async.eachSeries to process each technician ID
                        async.eachSeries(technicianIds, (technician, inner_callback) => {
                            const TECHNICIAN_ID = technician.ID;

                            // Wrap async function in a promise to use await within the callback correctly
                            (async () => {
                                try {
                                    // Check for existing activity data in MongoDB
                                    const activityData = await TechnicianActivityCalendar.find({
                                        TECHNICIAN_ID,
                                        DATE_OF_MONTH: nextDate
                                    });

                                    if (activityData && activityData.length > 0) {
                                        // If activity data exists for technician on the given date, skip to the next one
                                        inner_callback(null);  // Continue to next technician
                                    } else {
                                        // If no activity data exists, check the service calendar for availability
                                        const serviceData = await new Promise((resolve, reject) => {
                                            mm.executeDML('SELECT DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME, IS_SERIVCE_AVAILABLE, WEEK_DAY ' +
                                                'FROM technician_service_calender ' +
                                                'WHERE TECHNICIAN_ID = ? AND WEEK_DAY = ?', [TECHNICIAN_ID, day2], supportKey, connection, (err, result) => {
                                                    if (err) {
                                                        reject(err);
                                                    } else {
                                                        resolve(result);
                                                    }
                                                });
                                        });

                                        if (serviceData && serviceData.length > 0) {
                                            // Destructure data from service calendar to populate new activity
                                            const { DAY_START_TIME, DAY_END_TIME, BREAK_START_TIME, BREAK_END_TIME, IS_SERIVCE_AVAILABLE, WEEK_DAY } = serviceData[0];

                                            // Insert new activity into TechnicianActivityCalendar collection
                                            const newActivity = new TechnicianActivityCalendar({
                                                TECHNICIAN_ID,
                                                DATE_OF_MONTH: nextDate,
                                                DAY_START_TIME,
                                                DAY_END_TIME,
                                                BREAK_START_TIME,
                                                BREAK_END_TIME,
                                                IS_SERIVCE_AVAILABLE,
                                                WEEK_DAY,
                                                CLIENT_ID: 1 // Assuming CLIENT_ID is static, adjust as needed
                                            });

                                            // Save new activity calendar entry
                                            await newActivity.save();
                                            console.log(`Activity calendar updated for technician ${TECHNICIAN_ID}.`);
                                        } else {
                                            console.log(`No service calendar found for technician ${TECHNICIAN_ID}.`);
                                        }

                                        inner_callback(null);  // Continue to next technician
                                    }
                                } catch (error) {
                                    console.log(`Error processing technician ${TECHNICIAN_ID}:`, error);
                                    inner_callback(error);  // If error occurs, stop iteration
                                }
                            })();  // Immediately Invoked Function Expression (IIFE) for async/await

                        }, function finalCallback(error) {
                            if (error) {
                                mm.rollbackConnection(connection);
                                console.log("Failed to process activity calendar update.");
                            } else {
                                mm.commitConnection(connection);
                                console.log("Activity calendar updated successfully for all technicians.");
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("System error:", error);
            }

            break;

        // send notification to warehouse manager and admin when AVG_LEVEL stock level is reached
        case 4:
            try {
                mm.executeQuery(`SELECT WAREHOUSE_MANAGER_ID, AVG_LEVEL, CURRENT_STOCK, ITEM_NAME, CLOUD_ID, W_CLOUD_ID  FROM view_inventory_warehouse_wise_stock  WHERE AVG_LEVEL = CURRENT_STOCK`, supportKey, (err, result) => {
                    if (err) {
                        console.log("SQL Error:", err);
                    } else {
                        if (result.length === 0) {
                            console.log("No records found matching AVG_LEVEL == CURRENT_STOCK.");
                            return;
                        }

                        const details = [];
                        for (let i = 0; i < result.length; i++) {
                            const row = result[i];
                            details.push([0, 'Critical Low Stock for Average Level', `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`, "", row.WAREHOUSE_MANAGER_ID, "AL", 1, 1, "N", ""]);
                        }
                        mm.executeQueryData(`INSERT INTO notification_master (OWNER_ID, TITLE, DESCRIPTION, ATTACHMENT, MEMBER_ID, TYPE, STATUS, CLIENT_ID, NOTIFICATION_TYPE, MEDIA_TYPE) VALUES ?`, [details], supportKey, (error, insertResult) => {
                            if (error) {
                                console.log("Insert Error:", error);
                            } else {
                                console.log("Notifications inserted successfully.");
                                for (let i = 0; i < result.length; i++) {
                                    const row = result[i];
                                    mm.sendNotificationToWManager('Critical Low Stock for Average Level', `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`, "", "", "ALT", row, row.CLOUD_ID, row.W_CLOUD_ID);
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("System error:", error);
            }
            break;

        //send notification to warehouse manager and admin when REORDER_STOCK_LEVEL stock level is reached
        case 5:
            try {
                mm.executeQuery('SELECT WAREHOUSE_MANAGER_ID,AVG_LEVEL,CURRENT_STOCK,ITEM_NAME,CLOUD_ID,W_CLOUD_ID FROM view_inventory_warehouse_wise_stock WHERE REORDER_STOCK_LEVEL=CURRENT_STOCK', supportKey, (err, result) => {
                    if (err) {
                        console.log("SQL Error:", err);
                    } else {
                        if (result.length === 0) {
                            console.log("No records found matching REORDER_STOCK_LEVEL == CURRENT_STOCK.");
                            return;
                        }

                        const details = [];
                        for (let i = 0; i < result.length; i++) {
                            const row = result[i];
                            details.push([0, 'Critical Low Stock for Reorder Level', `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`, "", row.WAREHOUSE_MANAGER_ID, "AL", 1, 1, "N", ""]);
                        }
                        mm.executeQueryData(`INSERT INTO notification_master (OWNER_ID, TITLE, DESCRIPTION, ATTACHMENT, MEMBER_ID, TYPE, STATUS, CLIENT_ID, NOTIFICATION_TYPE, MEDIA_TYPE) VALUES ?`, [details], supportKey, (error, insertResult) => {
                            if (error) {
                                console.log("Insert Error:", error);
                            } else {
                                console.log("Notifications inserted successfully.");
                                for (let i = 0; i < result.length; i++) {
                                    const row = result[i];
                                    mm.sendNotificationToWManager('Critical Low Stock for Reorder Level', `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`, "", "", "ALT", row, row.CLOUD_ID, row.W_CLOUD_ID);
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("System error:", error);
            }
            break;

        //send notification to warehouse manager and admin when ALERT_STOCK_LEVEL stock level is reached
        case 6:
            try {
                mm.executeQuery('SELECT WAREHOUSE_MANAGER_ID,AVG_LEVEL,CURRENT_STOCK,ITEM_NAME,CLOUD_ID,W_CLOUD_ID FROM view_inventory_warehouse_wise_stock WHERE ALERT_STOCK_LEVEL=CURRENT_STOCK', supportKey, (err, result) => {
                    if (err) {
                        console.log(err)
                    } else {
                        if (result.length === 0) {
                            console.log("No records found matching ALERT_STOCK_LEVEL == CURRENT_STOCK.");
                            return;
                        }

                        const details = [];
                        for (let i = 0; i < result.length; i++) {
                            const row = result[i];
                            details.push([0, 'Critical Low Stock for Alert Stock Level', `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`, "", row.WAREHOUSE_MANAGER_ID, "AL", 1, 1, "N", ""]);
                        }
                        mm.executeQueryData(`INSERT INTO notification_master (OWNER_ID, TITLE, DESCRIPTION, ATTACHMENT, MEMBER_ID, TYPE, STATUS, CLIENT_ID, NOTIFICATION_TYPE, MEDIA_TYPE) VALUES ?`, [details], supportKey, (error, insertResult) => {
                            if (error) {
                                console.log("Insert Error:", error);
                            } else {
                                console.log("Notifications inserted successfully.");
                                for (let i = 0; i < result.length; i++) {
                                    const row = result[i];
                                    mm.sendNotificationToWManager('Critical Low Stock for Alert Stock Level', `${row.ITEM_NAME} is almost out of stock! Only ${row.CURRENT_STOCK} left. Take action over it`, "", "", "ALT", row, row.CLOUD_ID, row.W_CLOUD_ID);
                                }
                            }
                        });
                    }
                });
            } catch (error) {
                console.error("System error:", error);
            }
            break;

        case 7:
            try {
                const supportKey = "1023456789";
                const axios = require("axios");
                const async = require("async");
                mm.executeQuery(`update scheduler_master set REPEAT_DATA=ADDTIME(REPEAT_DATA, '00:30:00') WHERE  ID=${data.ID}`, log, (error, resultsUpdateIsFetched) => {
                    if (error) {
                        console.log("Error in last 1 : ", error);
                    }
                    else {
                        async function checkAndSendEmail() {
                            const url = "https://console.pockitengineers.com/auth/user/login";
                            const payload = {
                                username: "admin.pockit@gmail.com",
                                password: "12345678",
                                type: "A",
                            };

                            const to = ["darshan.kalli@gttdata.ai", "kedar.kulkarni@gttdata.ai", "amit.shinde@gttdata.ai", "shreya.shinde@gttdata.ai", "rajdoot.herlekar@gttdata.ai", "umesh.patil@gttdata.ai"];
                            // const to = ["darshan.kalli@gttdata.ai"]
                            const nowIST = mm.getSystemDate();

                            try {
                                const response = await axios.post(url, payload, {
                                    timeout: 15000,
                                    validateStatus: () => true,
                                    headers: {
                                        "Content-Type": "application/json",
                                        "apikey": "U2FsdGVkX1+lA46Y4WEHU6wNGdemjz6OlLX5lHI9+vkUn+VwIosZLGrMCVdm0C1K43g9pXBD7f2StMQqkQZmaQ==",
                                        "applicationkey": "U2FsdGVkX1/bCtnUbrmmzgwNgkfND27FPCAKskGD6YMjg31TQLtpGBdWpz+L9ESl"
                                    },
                                });

                                console.log("response", response)
                                // Check the response data for error codes
                                if (response.status !== 200) {
                                    // API returned 200 HTTP status but error in body
                                    const subject = `⚠️ PocKit Server Monitor: Server Error (${response.status})`;
                                    const body = buildHtmlEmail({
                                        url,
                                        username: payload.username,
                                        timestamp: nowIST,
                                        status: response.status, // Use the API's error code
                                        errorMessage: response.statusText || "API returned error",
                                        responsePreview: stringifyPreview(response.data),
                                        hint: "The API returned a logical error. Verify credentials and request parameters.",
                                    });

                                    async.eachSeries(to, (email, callback) => {
                                        const individualTo = email; // Send to one recipient at a time
                                        console.log(`Email sending failed for ${individualTo}:`);
                                        mm.executeQueryData(`SELECT * from server_logs_transactiona_history where SENT_TO = ? AND created_at  INTERVAL 1 hrs)`, [individualTo], supportKey, (err, resultsCheck) => {
                                            if (err) {
                                                console.log(`Database error for ${email}:`, err);
                                                return callback(err);
                                            }
                                            if (resultsCheck.length > 0) {
                                                return callback();
                                            }
                                            mm.sendEmail(individualTo, subject, body, "ServerError", "", (err, results) => {
                                                if (err) {
                                                    console.log(`Email sending failed for ${email}:`, err);
                                                    // You can choose to continue with other emails or stop here
                                                    return callback(err);
                                                } else {
                                                    console.log(`Alert email sent to ${email}:`, results);

                                                    // Insert into your log table for each email
                                                    mm.executeQueryData(
                                                        `INSERT INTO server_logs_transactiona_history 
                                    (SENT_TO, PARAMS, TEMPLATE_NAME, SUBJECT, BODY, ATTACHMENTS, RESPONSE_DATA, STATUS, CLIENT_ID, created_at, updated_at) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                                        [
                                                            individualTo, // Store just this recipient
                                                            JSON.stringify(payload),
                                                            "ServerError",
                                                            subject,
                                                            body,
                                                            "",
                                                            JSON.stringify(response.data),
                                                            response.status,
                                                            1,
                                                            nowIST,
                                                            nowIST
                                                        ],
                                                        supportKey,
                                                        (err, results) => {
                                                            if (err) {
                                                                console.log(`Database error for ${email}:`, err);
                                                                return callback(err);
                                                            }
                                                            callback(); // Proceed to next email
                                                        }
                                                    );
                                                }
                                            });
                                        }, (err) => {
                                            if (err) {
                                                console.log("Error in email sending process:", err);
                                            } else {
                                                console.log("All emails sent successfully");
                                            }
                                        });
                                    });
                                    return;
                                } else {
                                    console.log("API call successful (200). No email will be sent.");
                                    return;
                                }
                            } catch (error) {
                                // Network/timeout/exception → send alert
                                const subject = "🚨 Login API Monitor: Request Failed";

                                let status = error.response?.status ?? "Not Reachable";
                                const body = buildHtmlEmail({
                                    url,
                                    username: payload.username,
                                    timestamp: nowIST,
                                    status,
                                    errorMessage: error.message || "Unknown error",
                                    responsePreview: stringifyPreview(error.response?.data),
                                    hint:
                                        "The API might be down or unreachable. Check server health, firewall rules, SSL, and network connectivity.",
                                });

                                async.eachSeries(to, (email, callback) => {
                                    const individualTo = email; // Send to one recipient at a time
                                    console.log(`Email sending failed for ${individualTo}:`);
                                    mm.sendEmail(individualTo, subject, body, "ServerError", "", (err, results) => {
                                        if (err) {
                                            console.log(`Email sending failed for ${email}:`, err);
                                            // You can choose to continue with other emails or stop here
                                            return callback(err);
                                        } else {
                                            console.log(`Alert email sent to ${email}:`, results);

                                            // Insert into your log table for each email
                                            mm.executeQueryData(
                                                `INSERT INTO server_logs_transactiona_history 
                                    (SENT_TO, PARAMS, TEMPLATE_NAME, SUBJECT, BODY, ATTACHMENTS, RESPONSE_DATA, STATUS, CLIENT_ID, created_at, updated_at) 
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                                [
                                                    individualTo, // Store just this recipient
                                                    JSON.stringify(payload),
                                                    "ServerError",
                                                    subject,
                                                    body,
                                                    "",
                                                    JSON.stringify(error.response?.data ?? "data not found"),
                                                    error.response?.status ?? "Not Reachable",
                                                    1,
                                                    nowIST,
                                                    nowIST
                                                ],
                                                supportKey,
                                                (err, results) => {
                                                    if (err) {
                                                        console.log(`Database error for ${email}:`, err);
                                                        return callback(err);
                                                    }
                                                    callback(); // Proceed to next email
                                                }
                                            );
                                        }
                                    });
                                }, (err) => {
                                    if (err) {
                                        console.log("Error in email sending process:", err);
                                    } else {
                                        console.log("All emails sent successfully");
                                    }
                                });
                            }
                        }

                        function stringifyPreview(data) {
                            try {
                                if (data == null) return "—";
                                const text = typeof data === "string" ? data : JSON.stringify(data);
                                // keep email compact
                                return text.length > 1000 ? text.slice(0, 1000) + " …(truncated)" : text;
                            } catch {
                                return "—";
                            }
                        }
                        function buildHtmlEmail({ url, username, timestamp, status, errorMessage, responsePreview, hint }) {
                            return `
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta charset="utf-8" />
                                            <meta name="x-apple-disable-message-reformatting" />
                                            <meta name="color-scheme" content="light dark">
                                            <meta name="supported-color-schemes" content="light dark">
                                            <style>
                                            /* Some clients respect <style>; inline styles are also applied below */
                                            @media (max-width: 480px) {
                                                .container { padding: 16px !important; }
                                                .card { padding: 16px !important; }
                                            }
                                            .badge {
                                                display:inline-block;
                                                padding:4px 8px;
                                                border-radius:999px;
                                                font-size:12px;
                                                line-height:1;
                                                border:1px solid #e2e8f0;
                                                background:#f8fafc;
                                            }
                                            .status-bad { background:#fee2e2; border-color:#fecaca; }
                                            </style>
                                        </head>
                                        <body style="margin:0; padding:0; background:#f5f7fb; font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#111827;">
                                            <div class="container" style="max-width:640px; margin:0 auto; padding:24px;">
                                            <div style="text-align:center; margin-bottom:16px;">
                                                <h1 style="margin:0; font-size:20px;">PocKit Server Monitoring Alert</h1>
                                                <div class="badge status-bad" style="display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; line-height:1; border:1px solid #fecaca; background:#fee2e2; margin-top:8px;">
                                                Action Required
                                                </div>
                                            </div>
                
                                            <div class="card" style="background:#ffffff; border-radius:14px; padding:24px; box-shadow:0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);">
                                                <p style="margin:0 0 12px 0;"><B>Hello Team,</B></p>
                                                <p style="margin:0 0 16px 0;">
                                               <B>This is an automated alert indicating a failure during the login endpoint health check.</B>
                                                </p>
                
                                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; font-size:14px;">
                                                <tr>
                                                    <td style="padding:8px 0; width:180px; color:#6b7280;">Endpoint</td>
                                                    <td style="padding:8px 0;"><a href="${url}" style="color:#2563eb; text-decoration:none;">${url}</a></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0; color:#6b7280;">Username Used</td>
                                                    <td style="padding:8px 0;">${escapeHtml(username)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0; color:#6b7280;">Timestamp (IST)</td>
                                                    <td style="padding:8px 0;">${escapeHtml(timestamp)}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0; color:#6b7280;">HTTP Status</td>
                                                    <td style="padding:8px 0;"><span class="badge" style="display:inline-block; padding:4px 8px; border-radius:999px; font-size:12px; line-height:1; border:1px solid #e2e8f0; background:#f8fafc;">${escapeHtml(
                                String(status)
                            )}</span></td>
                                                </tr>
                                                <tr>
                                                    <td style="padding:8px 0; color:#6b7280; vertical-align:top;">Error Message</td>
                                                    <td style="padding:8px 0;">${escapeHtml(errorMessage || "—")}</td>
                                                </tr>
                                                </table>
                
                                                <div style="margin:16px 0 8px 0; font-weight:600;">Response Preview</div>
                                                <pre style="white-space:pre-wrap; word-wrap:break-word; background:#0b1020; color:#e5e7eb; padding:12px; border-radius:10px; font-size:12px; line-height:1.5; max-height:320px; overflow:auto; margin:0;">${escapeHtml(
                                responsePreview || "—"
                            )}</pre>
                
                                                <div style="margin-top:16px;">
                                                <div style="font-weight:600; margin-bottom:6px;">Recommended Actions</div>
                                                <ol style="margin:0; padding-left:18px;">
                                                    <li>Verify the login service is running and reachable.</li>
                                                    <li>Check server and reverse proxy (Nginx) logs for errors.</li>
                                                    <li>Confirm credentials and auth flow (e.g., type="A").</li>
                                                    <li>Review recent deployments/config changes and roll back if needed.</li>
                                                </ol>
                                                </div>
                
                                                <p style="margin:16px 0 0 0; color:#6b7280; font-size:12px;">
                                                This email was generated by the monitoring service. Please do not reply.
                                                </p>
                                            </div>
                
                                            <div style="text-align:center; color:#9ca3af; font-size:12px; margin-top:12px;">
                                                © ${new Date().getFullYear()} Monitoring Service
                                            </div>
                                            </div>
                                        </body>
                                        </html>`;
                        }

                        // Very small HTML escape to avoid breaking markup with dynamic values
                        function escapeHtml(str) {
                            try {
                                return String(str)
                                    .replace(/&/g, "&amp;")
                                    .replace(/</g, "&lt;")
                                    .replace(/>/g, "&gt;")
                                    .replace(/"/g, "&quot;");
                            } catch {
                                return "";
                            }
                        }

                        // Run it
                        checkAndSendEmail();
                    }
                });


            } catch (error) {
                console.error(`${supportKey} Email scheduling failed: ${error.message}`);
            }
            break;

        default:
            break;

    }
}



exports.dayStartBySystem = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();

        // Step 1: Select IDs from technician_master
        mm.executeDML('SELECT ID FROM technician_master', [], supportKey, connection, (error, technicianIds) => {
            if (error) {
                mm.rollbackConnection(connection);
                return res.status(400).send({
                    code: 400,
                    message: "Failed to retrieve technician IDs."
                });
            } else {
                if (!technicianIds || technicianIds.length === 0) {
                    mm.rollbackConnection(connection);
                    return res.status(404).send({
                        code: 404,
                        message: "No technicians found."
                    });
                } else {
                    // Process each technician
                    async.eachSeries(technicianIds, function processTechnician(technician, inner_callback) {
                        const TECHNICIAN_ID = technician.ID;

                        // Step 2: Select Day_start_time from technician_service_calender
                        mm.executeDML('SELECT DAY_START_TIME FROM technician_service_calender WHERE TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, serviceData) => {
                            if (error) {
                                console.error(`Error retrieving service data for technician ${TECHNICIAN_ID}:`, error);
                                return inner_callback(error);
                            } else {
                                if (!serviceData || serviceData.length === 0 || !serviceData[0].DAY_START_TIME) {
                                    return inner_callback(null); // Skip if no day start time
                                } else {
                                    const DAY_START_TIME = serviceData[0].DAY_START_TIME;

                                    // Step 3: Check tech_daystart_track for current date and technician_id
                                    mm.executeDML(
                                        'SELECT START_TIME FROM technician_daystart_track WHERE DATE= CURDATE() AND TECHNICIAN_ID = ?',
                                        [TECHNICIAN_ID], supportKey, connection,
                                        (error, trackData) => {
                                            if (error) {
                                                console.error(`Error checking daystart track for technician ${TECHNICIAN_ID}:`, error);
                                                return inner_callback(error);
                                            } else {
                                                if (trackData && trackData.length > 0) {
                                                    return inner_callback(null); // Day already started
                                                } else {
                                                    // Step 4: Insert into tech_daystart_track
                                                    mm.executeDML('INSERT INTO technician_daystart_track (TECHNICIAN_ID, START_TIME) VALUES (?, NOW())', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                        if (error) {
                                                            console.error(`Error inserting day start track for technician ${TECHNICIAN_ID}:`, error);
                                                            return inner_callback(error);
                                                        } else {
                                                            // Step 5: Insert a log record
                                                            mm.executeDML('INSERT INTO technician_day_logs (TECHNICIAN_ID, LOG_DATE_TIME, LOG_TEXT, STATUS, TYPE, CLIENT_ID, USER_ID) VALUES (?, NOW(), ?, ?, ?, ?, ?)', [TECHNICIAN_ID, 'Day start by system', 'DS', 'SYSTEM', 1, 0], supportKey, connection, (error) => {
                                                                if (error) {
                                                                    console.error(`Error logging day start for technician ${TECHNICIAN_ID}:`, error);
                                                                    return inner_callback(error);
                                                                } else {
                                                                    // Update technician status
                                                                    mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 1 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                        if (error) {
                                                                            console.error(`Error updating technician status for ID ${TECHNICIAN_ID}:`, error);
                                                                            return inner_callback(error);
                                                                        } else {
                                                                            inner_callback(null);
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
                            }
                        });
                    }, function finalCallback(error) {
                        if (error) {
                            mm.rollbackConnection(connection);
                            return res.status(400).send({
                                code: 400,
                                message: "Failed to process technician day start by system.",
                                details: error.message
                            });
                        } else {
                            mm.commitConnection(connection);
                            res.status(200).send({
                                code: 200,
                                message: "Technician day start by system processed successfully."
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error("System error:", error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
            details: error.message
        });
    }
};



exports.dayEndBySystem = (req, res) => {
    const supportKey = req.headers['supportkey'];

    try {
        const connection = mm.openConnection();

        // Step 1: Select IDs from technician_master
        mm.executeDML('SELECT ID FROM technician_master', [], supportKey, connection, (error, technicianIds) => {
            if (error) {
                mm.rollbackConnection(connection);
                return res.status(400).send({
                    code: 400,
                    message: "Failed to retrieve technician IDs."
                });
            } else {
                if (!technicianIds || technicianIds.length === 0) {
                    mm.rollbackConnection(connection);
                    return res.status(404).send({
                        code: 404,
                        message: "No technicians found."
                    });
                } else {
                    // Process each technician
                    async.eachSeries(technicianIds, function processTechnician(technician, inner_callback) {
                        const TECHNICIAN_ID = technician.ID;

                        // Step 2: Select Day_start_time from technician_service_calender
                        mm.executeDML('SELECT DAY_END_TIME FROM technician_service_calender WHERE TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, serviceData) => {
                            if (error) {
                                console.error(`Error retrieving service data for technician ${TECHNICIAN_ID}:`, error);
                                return inner_callback(error);
                            } else {
                                if (!serviceData || serviceData.length === 0 || !serviceData[0].DAY_END_TIME) {
                                    return inner_callback(null); // Skip if no day end time
                                } else {
                                    const DAY_END_TIME = serviceData[0].DAY_END_TIME;

                                    // Step 3: Check tech_daystart_track for current date and technician_id
                                    mm.executeDML('SELECT END_TIME FROM technician_daystart_track WHERE DATE= CURDATE() AND TECHNICIAN_ID = ?', [TECHNICIAN_ID], supportKey, connection, (error, trackData) => {
                                        if (error) {
                                            console.error(`Error checking daystart track for technician ${TECHNICIAN_ID}:`, error);
                                            return inner_callback(error);
                                        } else {
                                            if (trackData && trackData.length > 0) {
                                                return inner_callback(null); // Day already started
                                            } else {
                                                // Step 4: Insert into tech_daystart_track
                                                mm.executeDML('INSERT INTO technician_daystart_track (TECHNICIAN_ID, END_TIME) VALUES (?, NOW())', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                    if (error) {
                                                        console.error(`Error inserting day start track for technician ${TECHNICIAN_ID}:`, error);
                                                        return inner_callback(error);
                                                    } else {
                                                        // Step 5: Insert a log record
                                                        mm.executeDML('INSERT INTO technician_day_logs (TECHNICIAN_ID, LOG_DATE_TIME, LOG_TEXT, STATUS, TYPE, CLIENT_ID, USER_ID) VALUES (?, NOW(), ?, ?, ?, ?, ?)', [TECHNICIAN_ID, 'Day end by system', 'OUT', 'SYSTEM', 1, 0], supportKey, connection, (error) => {
                                                            if (error) {
                                                                console.error(`Error logging day END for technician ${TECHNICIAN_ID}:`, error);
                                                                return inner_callback(error);
                                                            } else {
                                                                // Update technician status
                                                                mm.executeDML('UPDATE technician_master SET TECHNICIAN_STATUS = 0 WHERE ID = ?', [TECHNICIAN_ID], supportKey, connection, (error) => {
                                                                    if (error) {
                                                                        console.error(`Error updating technician status for ID ${TECHNICIAN_ID}:`, error);
                                                                        return inner_callback(error);
                                                                    } else {
                                                                        inner_callback(null);
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
                            }
                        });
                    }, function finalCallback(error) {
                        if (error) {
                            mm.rollbackConnection(connection);
                            return res.status(400).send({
                                code: 400,
                                message: "Failed to process technician day start by system.",
                                details: error.message
                            });
                        } else {
                            mm.commitConnection(connection);
                            res.status(200).send({
                                code: 200,
                                message: "Technician day END by system processed successfully."
                            });
                        }
                    });
                }
            }
        });
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.error("System error:", error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong.",
            details: error.message
        });
    }
};
