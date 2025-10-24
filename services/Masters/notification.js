const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');
const async = require('async');
const applicationkey = process.env.APPLICATION_KEY;

var notificationMaster = "notification_master";
var viewNotificationMaster = "view_" + notificationMaster;

function reqData(req) {
    var data = {
        OWNER_ID: req.body.OWNER_ID,
        TITLE: req.body.TITLE,
        DESCRIPTION: req.body.DESCRIPTION,
        ORDER_ID: req.body.ORDER_ID,
        ATTACHMENT: req.body.ATTACHMENT,
        MEMBER_ID: req.body.MEMBER_ID,
        TYPE: req.body.TYPE,
        STATUS: req.body.STATUS,
        CLIENT_ID: req.body.CLIENT_ID,
        IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
        SEQ_NO: req.body.SEQ_NO
    }
    return data;
}

exports.validate = function () {
    return [
        body('TITLE').optional(),
        body('MESSAGE').optional(),
        body('NOTIFICATION_TYPE').optional(),
        body('SENDER_ID').isInt().optional(),
        body('RECEIVER_ID').isInt().optional(),
        body('SENT_DATE').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewNotificationMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get notification count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewNotificationMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get notification information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 60,
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
            "code": 500,
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
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            mm.executeQueryData('INSERT INTO ' + notificationMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save notification information..."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new notification ${data.TITLE}.`;

                    var logCategory = "notification"

                    let actionLog = {
                        "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)

                    res.send({
                        "code": 200,
                        "message": "notification information saved successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
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
            mm.executeQueryData(`UPDATE ` + notificationMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update notification information."
                    });
                }
                else {
                    var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated details of the notification ${data.TITLE}.`;

                    var logCategory = "notification"

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "notification information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "Something went wrong."
            });
        }
    }
}

exports.sendNotification = (req, res) => {

    try {
        var data = req.body.data;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();
        var TITLE = req.body.TITLE;
        var DESCRIPTION = req.body.DESCRIPTION;
        var MEDIA_TYPE = req.body.MEDIA_TYPE;
        var SHARING_TYPE = req.body.SHARING_TYPE;
        var TYPE = req.body.TYPE;
        var ATTACHMENT = req.body.ATTACHMENT || "";
        var TOPIC_NAME = req.body.TOPIC_NAME;
        var NOTIFIICATION_TYPE = req.body.NOTIFICATION_TYPE;
        if ((!TITLE && TITLE == undefined && TITLE == '') || (!DESCRIPTION && DESCRIPTION == undefined && DESCRIPTION == '') || (!SHARING_TYPE && SHARING_TYPE == undefined && SHARING_TYPE == '')) {
            res.send({
                "code": 400,
                "message": "data parameter missing ... "
            });
        } else {
            if (NOTIFIICATION_TYPE === 'C') {
                console.log("innnnnn")
                async.eachSeries(data, function iteratorOverElems(record, inner_callback) {
                    // Vendor
                    if (SHARING_TYPE == 1) {
                        mm.sendNotificationToVendor(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                        inner_callback()
                    }
                    // backoffice
                    else if (SHARING_TYPE == 2) {
                        mm.sendNotificationToManager(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                        inner_callback()
                    }
                    // customer
                    else if (SHARING_TYPE == 3) {
                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, `customer_${record}_channel`, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                        mm.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE,MEDIA_TYPE,TOPIC_NAME) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [req.body.authData.data.UserData[0].USER_ID, TITLE, DESCRIPTION, ATTACHMENT, record, "C", 1, 1, TYPE, MEDIA_TYPE, `customer_${record}_channel`], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                inner_callback(error)
                            }
                            else {
                                inner_callback()
                            }
                        });
                    }
                    // technician
                    else if (SHARING_TYPE == 4) {
                        mm.sendNotificationToTechnician(req.body.authData.data.UserData[0].USER_ID, record, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "P", req.body);
                        inner_callback()
                    }

                }, function subCb(error) {
                    if (error) {
                        res.status(400).json({
                            "message": "Failed to send notification "
                        });
                    } else {
                        res.status(200).json({
                            "message": "Notification Sent successfully ...",
                        });
                    }
                });
            }
            else {
                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, "TP", req.body);
                // const channelSubscribedUsers = require('../../modules/channelSubscribedUsers');
                // channelSubscribedUsers.distinct("USER_ID", { TOPIC_NAME: TOPIC_NAME, TYPE: TYPE, STATUS: true }, function (err, userIds) {
                //     if (err) {
                //         console.log(err);
                //         return res.status(400).json({
                //             "message": "Failed to fetch subscribed users"
                //         });
                //     } else {
                //         async.eachSeries(userIds, function iteratorOverElems(record, inner_callback) {
                //             mm.executeQueryData(
                //                 `INSERT INTO notification_master (OWNER_ID, TITLE, DESCRIPTION, ATTACHMENT, MEMBER_ID, TYPE, STATUS, CLIENT_ID, NOTIFICATION_TYPE, MEDIA_TYPE, TOPIC_NAME) VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
                //                 [req.body.authData.data.UserData[0].USER_ID, TITLE, DESCRIPTION, ATTACHMENT, record, TYPE, 1, 1, "N", MEDIA_TYPE, TOPIC_NAME],
                //                 supportKey,
                //                 (error, results) => {
                //                     if (error) {
                //                         console.log(error);
                //                         inner_callback(error);
                //                     } else {
                //                         inner_callback();
                //                     }
                //                 }
                //             );
                //         }, function subCb(error) {
                //             if (error) {
                //                 return res.status(400).json({
                //                     "message": "Failed to send notification"
                //                 });
                //             } else {
                //                 return res.status(200).json({
                //                     "message": "Notification Sent successfully ..."
                //                 });
                //             }
                //         });
                //     }
                // });
                res.status(200).json({
                    "message": "Notification Sent successfully ...",
                });
            }
        }
    } catch (error) {
        console.log(error);
        res.send({
            "code": 400,
            "message": "Failed to send notification "
        });
    }
}

const admin = require('firebase-admin');
exports.subscribeMultiple = async (req, res) => {

    const { token, topics } = req.body;
    if (!token || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: 'Token and at least one topic are required' });
    }

    try {
        const subscribePromises = topics.map((topic) =>
            admin.messaging().subscribeToTopic(token, topic)
        );

        await Promise.all(subscribePromises);
        console.log(`Subscribed to topics: ${topics.join(', ')}`);
        res.json({ message: `Subscribed to topics: ${topics.join(', ')}` });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({ error: 'Subscription failed' });
    }
}

exports.unsubscribeMultiple = async (req, res) => {

    const { token, topics } = req.body;

    if (!token || !Array.isArray(topics) || topics.length === 0) {
        return res.status(400).json({ error: 'Token and at least one topic are required' });
    }

    try {
        const unsubscribePromises = topics.map((topic) =>
            admin.messaging().unsubscribeFromTopic(token, topic)
        );

        await Promise.all(unsubscribePromises);
        console.log(`Unsubscribed to topics: ${topics.join(', ')}`);
        res.json({ message: `Unsubscribed to topics: ${topics.join(', ')}` });
    } catch (error) {
        console.error('Unsubscription error:', error);
        res.status(500).json({ error: 'Unsubscription failed' });
    }
}