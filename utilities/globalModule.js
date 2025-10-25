const logger = require("./logger");
const request = require("request")
const firebase = require('../utilities/firebase');
var applicationkey = process.env.APPLICATION_KEY
var supportKey = "supportKey"
const async = require('async');
const channelSubscribedUsers = require('../modules/channelSubscribedUsers');


var mysql = require('mysql2');
exports.dotenv = require('dotenv').config();
var config = {

    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    // timezone: 'IST',
    multipleStatements: true,
    charset: 'utf8mb4',
    dateStrings: true,
    port: process.env.MYSQL_PORT
}

exports.executeQuery = (query, supportKey, callback) => {
    var connection = mysql.createConnection(config);
    try {
        connection.connect();
        console.log(query);
        connection.query(query, callback);
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        connection.end();
    } finally {
        connection.end();
    }
}

exports.executeQueryData = (query, data, supportKey, callback) => {
    var connection = mysql.createConnection(config);
    try {
        connection.connect();
        console.log(query, data);
        connection.query(query, data, callback);
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        connection.end();
    } finally {
        connection.end();
    }
}

exports.diff_hours = (dt2, dt1) => {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= (60 * 60);
    return Math.abs(diff);

}

exports.getFormmattedDate = function (inDate) {
    let date_ob = new Date(inDate);
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    date_cur = year + "-" + month + "-" + date + " " + hours + ":" + minutes + ":" + seconds;

    return date_cur;
}

exports.diff_minutes = (dt2, dt1) => {
    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    diff /= 60;
    return Math.abs(diff);

}

exports.diff_seconds = (dt2, dt1) => {

    var diff = (dt2.getTime() - dt1.getTime()) / 1000;
    return Math.abs(diff);

}

exports.sendRequest = (methodType, method, body, callback) => {
    try {

        var request = require('request');
        var options = {
            url: process.env.GM_API + method,
            headers: {
                "apikey": process.env.GM_API_KEY,
                "supportkey": process.env.SUPPORT_KEY,
            },
            body: body,
            method: methodType,
            json: true
        }

        request(options, (error, response, body) => {
            if (error) {
                console.log("request error -send email ", error);
                callback(error);
            } else {
                console.log(body);
                callback(null, body);
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.executeQueryAsync = (query, supportKey) => {
    var connection = mysql.createConnection(config);
    try {
        return new Promise((resolve, reject) => {
            connection.connect();
            console.log(query);
            connection.query(query, (error, res) => {
                if (error) {
                    resolve({ error: error })
                }

                console.log("res");
                resolve(res)
            });
            logger.database(query, applicationkey, supportKey);
        });
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        return { error: error };
    } finally {
        connection.end()
    }
}

exports.executeQueryTransaction = async (query, connection) => {

    try {

        return new Promise((resolve, reject) => {
            console.log(query);
            connection.query(query, (error, results) => {
                if (error) {
                    console.log(error);
                    this.rolbackConnection(connection);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        this.rolbackConnection(connection);
    } finally {
    }
}

exports.executeQueryDataTransaction = (query, data, connection) => {
    try {
        return new Promise((resolve, reject) => {
            console.log(query, data);
            connection.query(query, data, (error, results) => {
                if (error) {
                    console.log(error);
                    this.rolbackConnection(connection);
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        this.rolbackConnection(connection);
    } finally {
    }
}

exports.getSystemDate = function (date) {
    let date_ob = date ? new Date(date) : new Date();
    let day = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    date_cur = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + seconds;
    return date_cur;
}

exports.getTimeDate = function () {
    let date_ob = new Date();
    let date = ("0" + date_ob.getDate()).slice(-2);
    let month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    let year = date_ob.getFullYear();
    let hours = ("0" + date_ob.getHours()).slice(-2);
    let minutes = ("0" + date_ob.getMinutes()).slice(-2);
    let seconds = ("0" + date_ob.getSeconds()).slice(-2);
    date_cur = year + month + date + hours + minutes + seconds;
    return date_cur;
}

exports.intermediateDates = function (startDate, endDate) {
    var startDatea = new Date(startDate);
    var endDatea = new Date(endDate);
    var getDateArray = function (start, end) {
        var arr = new Array();
        var dt = new Date(start);
        while (dt <= end) {

            var tempDate = new Date(dt);
            let date = ("0" + tempDate.getDate()).slice(-2);
            let month = ("0" + (tempDate.getMonth() + 1)).slice(-2);
            let year = tempDate.getFullYear();

            arr.push(year + "-" + month + "-" + date);
            dt.setDate(dt.getDate() + 1);
        }
        return arr;
    }

    var dateArr = getDateArray(startDatea, endDatea);
    return dateArr;
}

exports.generateKey = function (size) {

    var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var result = '';
    for (var i = size; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    console.log('length = ', result.length);
    return result;

}

exports.sanitizeDataJson = (json) => {
    try {
        console.log("before jsondata", json)
        json.replace(/\\/g, '')
        console.log("jsondata", json)

        json = JSON.parse(json);

        return json;

    } catch (error) {
        console.log(error);
    }
}

exports.sendEmailOLS = (to, subject, body, TEMPLATE_NAME, ATTACHMENTS, callback) => {
    console.log("to  ", to)
    console.log("body ", body)
    console.log("Mail subject ", subject)
    var request = require('request');

    console.log("email key ", process.env.EMAIL_SERVER_KEY)

    var options = {
        url: process.env.GM_API + 'sendEmail',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: process.env.EMAIL_SERVER_KEY,
            TO: to,
            SUBJECT: subject,
            BODY: body
        },
        json: true
    }

    request.post(options, (error, response, body) => {
        if (error) {
            console.log("request error -send email ", error);
            callback("EMAIL SEND ERROR.");
        } else {

            this.executeQueryData(
                `INSERT INTO email_transactiona_history 
                (SENT_TO, PARAMS, TEMPLATE_NAME, SUBJECT, BODY, ATTACHMENTS, RESPONSE_DATA, STATUS, CLIENT_ID) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    to,
                    JSON.stringify(body), // Serialized PARAMS
                    TEMPLATE_NAME,
                    subject,
                    JSON.stringify(body), // Serialized BODY to avoid invalid SQL
                    ATTACHMENTS || '',    // Ensure ATTACHMENTS is not undefined
                    JSON.stringify(response.body), // Serialized RESPONSE_DATA
                    1,                    // STATUS
                    1                     // CLIENT_ID
                ],
                supportKey,
                (error, result) => {
                    if (error) {
                        console.log("Error :", error);
                        callback(error);
                    } else {
                        console.log(result);
                        callback(null, response.body);
                    }
                }
            );

        }
    });
}

exports.sendSMSold = (to, body, callback) => {
    const request = require('request');
    console.log("in sms send method", body);
    var options = {
        url: process.env.GM_API + 'sendSms',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {

            KEY: body.search(/otp/i) ? process.env.SMS_SERVER_KEY_OTP : process.env.SMS_SERVER_KEY,
            TO: to,
            BODY: String.raw`${body}`//body

        },
        json: true
    };

    console.log(options);
    request.post(options, (error, response, body) => {
        if (error) {
            callback(error);
        } else {
            console.log("bdoy: ", response.body);
            if (response.body.code == 400)
                callback("SMS SEND ERROR." + JSON.stringify(body));
            else
                callback(null, "SMS SEND : " + JSON.stringify(body))
        }
    });
}

exports.sendSMS = (to, body, callback) => {
    const request = require('request');
    console.log("in sms send method", body);
    var options = {
        url: process.env.GM_API + 'sendSms',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: body.search(/otp/i) ? process.env.SMS_SERVER_KEY_OTP : process.env.SMS_SERVER_KEY,
            TO: to,
            BODY: String.raw`${body}`
        },
        json: true
    };

    console.log(options);

    request.post(options, (error, response, responseBody) => {
        if (error) {
            this.executeQueryData(
                "INSERT INTO `sms_transactiona_history` (SENT_TO, PARAMS, MEDIA_LINK, STATUS, RESPONSE_DATA, TEMPLATE_NAME, CLIENT_ID) VALUES (?,?,?,?,?,?,?)",
                [to, JSON.stringify(body), null, 0, JSON.stringify(error), null, 1],
                process.env.SUPPORT_KEY,
                (err, result) => {
                    if (err) console.log(err);
                    else callback(error);
                }
            );
        } else {
            console.log("response body: ", response.body);
            if (response.body.code === 400) {
                this.executeQueryData(
                    "INSERT INTO `sms_transactiona_history` (SENT_TO, PARAMS, MEDIA_LINK, STATUS, RESPONSE_DATA, TEMPLATE_NAME, CLIENT_ID) VALUES (?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 0, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(JSON.stringify(body), response.body);
                    }
                );
            } else {
                this.executeQueryData(
                    "INSERT INTO `sms_transactiona_history` (SENT_TO, PARAMS, MEDIA_LINK, STATUS, RESPONSE_DATA, TEMPLATE_NAME, CLIENT_ID) VALUES (?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 1, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(null, JSON.stringify(body), response.body);
                    }
                );
            }
        }
    });
};

exports.sendCustomSMS = (to, body, callback) => {
    const request = require('request');
    console.log("in sms send method", body);
    var options = {
        url: process.env.GM_API + 'sendSms',
        headers: {
            "apikey": process.env.GM_API_KEY,
            "supportkey": process.env.SUPPORT_KEY,
            "applicationkey": process.env.APPLICATION_KEY
        },
        body: {
            KEY: process.env.SMS_SERVER_KEY_CUSTOM,
            TO: to,
            BODY: String.raw`${body}`
        },
        json: true
    };

    console.log(options);

    request.post(options, (error, response, responseBody) => {
        if (error) {
            this.executeQueryData(
                "INSERT INTO `sms_transactiona_history` (SENT_TO, PARAMS, MEDIA_LINK, STATUS, RESPONSE_DATA, TEMPLATE_NAME, CLIENT_ID) VALUES (?,?,?,?,?,?,?)",
                [to, JSON.stringify(body), null, 0, JSON.stringify(error), null, 1],
                process.env.SUPPORT_KEY,
                (err, result) => {
                    if (err) console.log(err);
                    else callback(error);
                }
            );
        } else {
            console.log("response body: ", response.body);
            if (response.body.code === 400) {
                this.executeQueryData(
                    "INSERT INTO `sms_transactiona_history` (SENT_TO, PARAMS, MEDIA_LINK, STATUS, RESPONSE_DATA, TEMPLATE_NAME, CLIENT_ID) VALUES (?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 0, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(JSON.stringify(body), response.body);
                    }
                );
            } else {
                this.executeQueryData(
                    "INSERT INTO `sms_transactiona_history` (SENT_TO, PARAMS, MEDIA_LINK, STATUS, RESPONSE_DATA, TEMPLATE_NAME, CLIENT_ID) VALUES (?,?,?,?,?,?,?)",
                    [to, JSON.stringify(body), null, 1, JSON.stringify(response.body), null, 1],
                    process.env.SUPPORT_KEY,
                    (err, result) => {
                        if (err) console.log(err);
                        else callback(null, JSON.stringify(body), response.body);
                    }
                );
            }
        }
    });
};

exports.openConnection = () => {
    try {
        const con = mysql.createConnection(config);
        con.connect();
        con.beginTransaction(function (err) {
            if (err) {
                throw err;
            }
        });
        return con;
    }
    catch (error) {
        console.error(error);
    }
}

exports.rollbackConnection = (connection) => {
    try {
        connection.rollback(function () {
            connection.end();
        });
    }
    catch (error) {
        console.error(error);
    }
}

exports.commitConnection = (connection) => {
    try {
        connection.commit(function () {
            connection.end();
        });
    }
    catch (error) {
        console.error(error);
    }
}

exports.executeDML = (query, data, supportKey, connection, callback) => {
    try {
        console.log(query, data);
        connection.query(query, data, callback);
    } catch (error) {
        console.log("Exception  In : " + query + " Error : ", error);
        callback(error);
    } finally {
    }
}

exports.sanitizeFilter = (input) => {
    if (!input || typeof input !== 'string') return "0";

    const dangerousPatterns = [
        /--/g,                              // SQL comments
        /;/g,                               // Query stacking
        /\/\*/g, /\*\//g,                   // Multi-line comments
        /\b(SELECT|INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|RENAME|GRANT|REVOKE|EXECUTE|UNION|ROLLBACK|COMMIT)\b/i,
        /\(\s*SELECT\b/i,                   // Subqueries
        /\bOR\s+['"]?\d+['"]?\s*=\s*['"]?\d+['"]?/i  // OR 1=1 or '1'='1'
    ];

    for (const pattern of dangerousPatterns) {
        if (pattern.test(input)) {
            return "1"; // unsafe
        }
    }

    return "0"; // safe
};

exports.sendWAToolSMS = (MOBILE_NO, TEMPLATE_NAME, wparams, TEMP_LANG, callback) => {
    var supportKey = ['supportkey'];
    try {
        console.log("im in try block");

        var options = {
            url: process.env.WA_TOOLS_PLATFORM_URL,
            headers: {
                apikey: process.env.WA_TOOLS_PLATFORM_API_KEY,
            },
            body: {
                API_KEY: process.env.WA_TOOLS_CLIENT_API_KEY,
                WP_CLIENT_ID: process.env.WA_TOOLS_CLIENT_ID,
                TEMPLATE_NAME: TEMPLATE_NAME,
                MOBILE_NO: MOBILE_NO,
                TEMP_PARA: wparams,
                TEMP_LANG: TEMP_LANG
            },
            json: true
        };
        console.log("\n\n TEMP_PARA ARE :", options.body.TEMP_PARA);

        console.log("OPTIONS ARE :", options);

        request.post(options, (error, response, body) => {
            console.log("im in Request block");
            var SEND_TO = options.body.MOBILE_NO
            var PARAMS = JSON.stringify(options.body.TEMP_PARA)
            if (error) {
                console.log(error);
                callback(error);
            }
            else {
                if (response.body.code == 200) {
                    console.log(error);
                    this.executeQueryData(`INSERT INTO whatsapp_messages_history (SENT_TO,PARAMS,TEMPLATE_NAME,MEDIA_LINK,STATUS,RESPONSE_DATA,CLIENT_ID) VALUE (?,?,?,?,?,"?",1)`, [SEND_TO, PARAMS, TEMPLATE_NAME, '', 'S', JSON.stringify(body)], supportKey, (error, result) => {
                        if (error) {
                            console.log("Error :", body);
                            callback(error);
                        }
                        else {
                            console.log("success :", body);

                            callback(null, body);
                        }
                    })
                } else {
                    console.log("success");
                    this.executeQueryData(`INSERT INTO whatsapp_messages_history (SENT_TO,PARAMS,TEMPLATE_NAME,MEDIA_LINK,STATUS,RESPONSE_DATA,CLIENT_ID) VALUE (?,?,?,?,?,"?",1)`, [SEND_TO, PARAMS, TEMPLATE_NAME, '', 'F', body], supportKey, (error, result) => {
                        if (error) {
                            callback(error);
                        }
                        else {
                            callback(error);
                        }
                    })

                }
            }
        });

    } catch (error) {
        console.log(error);
        callback(error);
    }
}

exports.sendNotificationToAdmin = (ROLE_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, MEDIA_TYPE, supportKey, data3, data4) => {
    try {
        console.log("\n\ndata3", data3);
        console.log("\n\ndata4", data4);

        this.executeQueryData(`SELECT ID,CLOUD_ID,W_CLOUD_ID FROM view_user_master WHERE ROLE_ID IN(?)`, [ROLE_ID], supportKey, (error, resultEmp) => {
            if (error) {
                console.log(error);
            }
            else {
                async.eachSeries(resultEmp, (technicians, inner_callback) => {
                    this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE) VALUES (?,?,?,?,?,?,?,?,?) `, [technicians.ID, TITLE, DESCRIPTION, "", technicians.ID, "A", 1, 1, TYPE], supportKey, (error, resultsMember1) => {
                        if (error) {
                            console.log(error);
                        }
                        else {
                            if (technicians.CLOUD_ID) {
                                firebase.generateNotification("", technicians.CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "A", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (technicians.W_CLOUD_ID) {
                                firebase.generateNotification("", technicians.W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "A", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }
                    })
                }, (error) => {
                    if (error) {
                        console.log(`Error sending notification.`);
                    } else {
                        console.log(`Notification sent successfully.`);
                    }
                });
                if (resultEmp.length > 0) {
                    let Notifications = [];
                    for (let i = 0; i < resultEmp.length; i++) {
                        console.log("resultEmp :", resultEmp);

                        Notifications.push([resultEmp[i].ID, TITLE, DESCRIPTION, "", resultEmp[i].ID, "A", 1, 1, TYPE]);
                    }

                }
                else {
                    console.log('Cloud Id Not Present');
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToTerritoryOLD = (TERRITORY_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey) => {
    try {
        this.executeQueryData(`SELECT DISTINCT TECHNICIAN_ID FROM view_technician_pincode_mapping WHERE PINCODE_ID IN (SELECT PINCODE_ID FROM territory_pincode_mapping WHERE TERRITORY_ID= ? AND IS_ACTIVE = 1) AND TECHNICIAN_IS_ACTIVE = 1 AND IS_ACTIVE = 1`, [TERRITORY_ID], supportKey, (error, resultTechnician) => {
            if (error) {
                console.log(error);
            }
            else {
                if (resultTechnician.length > 0) {
                    async.eachSeries(resultTechnician, (technicians, inner_callback) => {
                        this.executeQueryData("SELECT ID,NAME,CLOUD_ID,W_CLOUD_ID FROM view_technician_master WHERE ID = ?", [technicians.TECHNICIAN_ID], supportKey, (error, resultEmp) => {

                            if (error || !technicians.TECHNICIAN_ID || technicians.TECHNICIAN_ID.length === 0) {
                                console.log(`Error or no data found for TECHNICIAN_ID ${technicians.TECHNICIAN_ID}:`, error);
                                return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${technicians.TECHNICIAN_ID}`));
                            } else {
                                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE) VALUES(?,?,?,?,?,?,?,?,?)`, [technicians.TECHNICIAN_ID, TITLE, DESCRIPTION, "", technicians.TECHNICIAN_ID, "T", 1, 1, TYPE], supportKey, (error, resultsMember1) => {
                                    if (error) {
                                        console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                        inner_callback(error || new Error(`Error sending notification to technician ${resultEmp[0].NAME}.`));
                                    }
                                    else {
                                        if (resultEmp[0].CLOUD_ID) {
                                            firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, '', '', '', '9');
                                            console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                            inner_callback();
                                        } else {
                                            console.log('Cloud Id Not Present');
                                            inner_callback();
                                        }
                                    }
                                })

                            }
                        });
                    }, (error) => {
                        if (error) {
                            console.log(`Error sending notification.`);
                        } else {
                            console.log(`Notification sent successfully.`);
                        }
                    });
                } else {
                    console.log(`No technician data found`);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToTerritory = (TERRITORY_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, DATA) => {
    try {
        console.log("\n\n\n\n\n\nIN TECHNICINA NOTIFICATION DATA", DATA);


        this.executeQueryData(`SELECT DISTINCT TECHNICIAN_ID FROM view_technician_pincode_mapping WHERE PINCODE_ID IN (SELECT PINCODE_ID FROM territory_pincode_mapping WHERE TERRITORY_ID= ? AND IS_ACTIVE = 1) AND TECHNICIAN_IS_ACTIVE = 1 AND IS_ACTIVE = 1`, [TERRITORY_ID], supportKey, (error, resultTechnician) => {
            if (error) {
                console.log(error);
            }
            else {
                if (resultTechnician.length > 0) {
                    async.eachSeries(resultTechnician, (technicians, inner_callback) => {
                        this.executeQueryData("SELECT ID,NAME,CLOUD_ID,W_CLOUD_ID FROM view_technician_master WHERE ID = ?", [technicians.TECHNICIAN_ID], supportKey, (error, resultEmp) => {

                            if (error || !technicians.TECHNICIAN_ID || technicians.TECHNICIAN_ID.length === 0) {
                                console.log(`Error or no data found for TECHNICIAN_ID ${technicians.TECHNICIAN_ID}:`, error);
                                return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${technicians.TECHNICIAN_ID}`));
                            } else {
                                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE) VALUES(?,?,?,?,?,?,?,?,?)`, [technicians.TECHNICIAN_ID, TITLE, DESCRIPTION, "", technicians.TECHNICIAN_ID, "T", 1, 1, TYPE], supportKey, (error, resultsMember1) => {
                                    if (error) {
                                        console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                        inner_callback(error || new Error(`Error sending notification to technician ${resultEmp[0].NAME}.`));
                                    }
                                    else {
                                        if (resultEmp[0].CLOUD_ID) {
                                            firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, JSON.stringify(data3), JSON.stringify(DATA), '', '9', '', ATTACHMENT);
                                            console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                            inner_callback();
                                        } else {
                                            console.log('Cloud Id Not Present');
                                            inner_callback();
                                        }
                                    }
                                })

                            }
                        });
                    }, (error) => {
                        if (error) {
                            console.log(`Error sending notification.`);
                        } else {
                            console.log(`Notification sent successfully.`);
                        }
                    });
                } else {
                    console.log(`No technician data found`);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToTerritoryManager = (TECHNICIAN_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, DATA) => {
    try {
        this.executeQueryData(`SELECT DISTINCT BACKOFFICE_ID FROM backoffice_territory_mapping WHERE TERITORY_ID IN(SELECT DISTINCT TERRITORY_ID FROM territory_pincode_mapping WHERE IS_ACTIVE=1 AND PINCODE_ID IN(SELECT PINCODE_ID FROM technician_pincode_mapping WHERE TECHNICIAN_ID=? AND IS_ACTIVE=1))  AND  IS_ACTIVE = 1`, [TECHNICIAN_ID], supportKey, (error, resultTechnician) => {
            if (error) {
                console.log(error);
            }
            else {
                if (resultTechnician.length > 0) {
                    async.eachSeries(resultTechnician, (technicians, inner_callback) => {
                        this.executeQueryData("SELECT ID,NAME,CLOUD_ID,W_CLOUD_ID FROM view_user_master WHERE ID = ?", [technicians.BACKOFFICE_ID], supportKey, (error, resultEmp) => {

                            if (error || !technicians.BACKOFFICE_ID || technicians.BACKOFFICE_ID.length === 0) {
                                console.log(`Error or no data found for BACKOFFICE_ID ${technicians.BACKOFFICE_ID}:`, error);
                                return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${technicians.BACKOFFICE_ID}`));
                            } else {
                                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE) VALUES(?,?,?,?,?,?,?,?,?)`, [technicians.BACKOFFICE_ID, TITLE, DESCRIPTION, "", technicians.BACKOFFICE_ID, "T", 1, 1, TYPE], supportKey, (error, resultsMember1) => {
                                    if (error) {
                                        console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                        inner_callback(error || new Error(`Error sending notification to technician ${resultEmp[0].NAME}.`));
                                    }
                                    else {
                                        if (resultEmp[0].CLOUD_ID) {
                                            firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, JSON.stringify(data3), JSON.stringify(DATA), '', '9', '', ATTACHMENT);
                                            console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                            inner_callback();
                                        } else {
                                            console.log('Cloud Id Not Present');
                                            inner_callback();
                                        }
                                    }
                                })

                            }
                        });
                    }, (error) => {
                        if (error) {
                            console.log(`Error sending notification.`);
                        } else {
                            console.log(`Notification sent successfully.`);
                        }
                    });
                } else {
                    console.log(`No technician data found`);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToCustomer = (SENDER_ID, CUSTOMER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        this.executeQueryData("SELECT ID,CLOUD_ID FROM view_customer_master WHERE ID = ?", [CUSTOMER_ID], supportKey, (error, resultEmp) => {
            if (error) {
                console.log(error);
            }
            else {
                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE,MEDIA_TYPE) VALUES (?,?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, CUSTOMER_ID, "C", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "C", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "C", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }
                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}


exports.sendNotificationToTechnician = (SENDER_ID, TECHNICIAN_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        this.executeQueryData("SELECT ID,CLOUD_ID,W_CLOUD_ID FROM view_technician_master WHERE ID = ?", [TECHNICIAN_ID], supportKey, (error, resultEmp) => {
            if (error) {
                console.log(error);
            }
            else {
                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE,MEDIA_TYPE) VALUES (?,?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, TECHNICIAN_ID, "T", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            let data3New = (data3 !== null && typeof data3 === 'object') ? JSON.stringify(data3) : data3;

                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "T", data3New, JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            // if (resultEmp[0].W_CLOUD_ID) {
                            //     firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "T", '', '', '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            // }
                        }
                    }
                })

            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToManager = (SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        this.executeQueryData("SELECT ID,CLOUD_ID,W_CLOUD_ID FROM view_user_master WHERE ID=?", [RECIVER_ID], supportKey, (error, resultEmp) => {
            if (error) {
                console.log(error);
            }
            else {
                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE,MEDIA_TYPE) VALUES (?,?,?,?,?,?,?,?,?,?) `, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, RECIVER_ID, "B", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }


                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToVendor = (SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        this.executeQueryData("SELECT ID,CLOUD_ID,W_CLOUD_ID FROM view_user_master WHERE ID=?", [RECIVER_ID], supportKey, (error, resultEmp) => {
            if (error) {
                console.log(error);
            }
            else {
                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE,MEDIA_TYPE) VALUES (?,?,?,?,?,?,?,?,?,?) `, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, RECIVER_ID, "V", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "V", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "V", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }
                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToChannelold = async (SENDER_ID, TOPIC_NAME, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        const userIds = await channelSubscribedUsers.find({ CHANNEL_NAME: TOPIC_NAME, STATUS: true })
        var data = []
        for (let i = 0; i < userIds.length; i++) {
            data.push([SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, userIds[i].USER_ID, userIds[i].TYPE, 1, 1, "N", MEDIA_TYPE, TOPIC_NAME])
        }
        console.log("\n\n\n\n\n\n\n\n channels subscribed users", userIds);
        if (data.length > 0) {
            this.executeQueryData(`INSERT INTO notification_master (OWNER_ID, TITLE, DESCRIPTION, ATTACHMENT, MEMBER_ID, TYPE, STATUS, CLIENT_ID, NOTIFICATION_TYPE, MEDIA_TYPE, TOPIC_NAME) VALUES ?`, [data], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, "");
                }
            }
            );
        } else {
            // firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3, JSON.stringify(data4), '', '9', MEDIA_TYPE, "");
            console.log("\n\n\n\n\n\n\n\n NO channels subscribed users");

        }
    } catch (error) {
        console.log("Error in send notification:", error);
    }
}


exports.sendNotificationToWManager = (SENDER_ID, RECIVER_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        this.executeQueryData("SELECT ID,CLOUD_ID,W_CLOUD_ID FROM user_master WHERE ID=?", [RECIVER_ID], supportKey, (error, resultEmp) => {
            if (error) {
                console.log(error);
            }
            else {
                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE,MEDIA_TYPE) VALUES (?,?,?,?,?,?,?,?,?,?) `, [SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, RECIVER_ID, "B", 1, 1, TYPE, MEDIA_TYPE], supportKey, (error, resultsMember1) => {
                    if (error) {
                        console.log(error);
                    }
                    else {
                        if (resultEmp.length > 0) {
                            if (resultEmp[0].CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '', '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
                            }
                            if (resultEmp[0].W_CLOUD_ID) {
                                firebase.generateNotification("", resultEmp[0].W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '', '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
                            }
                        }


                    }
                })
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendNotificationToDepartment = (SENDER_ID, DEPARTMENT_ID, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, data3, data4) => {
    try {
        this.executeQueryData(`SELECT DISTINCT BACKOFFICE_ID FROM view_backoffice_department_mapping WHERE DEPARTMENT_ID =
            ? AND IS_ACTIVE = 1 AND STATUS = 'M'`, [DEPARTMENT_ID], supportKey, (error, resultbackoffice) => {
            if (error) {
                console.log(error);
            }
            else {
                if (resultbackoffice.length > 0) {
                    async.eachSeries(resultbackoffice, (backoffice, inner_callback) => {
                        this.executeQueryData("SELECT ID,NAME,CLOUD_ID,W_CLOUD_ID FROM view_user_master  WHERE BACKOFFICE_TEAM_ID = ?", [backoffice.BACKOFFICE_ID], supportKey, (error, resultEmp) => {

                            if (error || !backoffice.BACKOFFICE_ID || backoffice.BACKOFFICE_ID.length === 0) {
                                console.log(`Error or no data found for BACKOFFICE_ID ${backoffice.BACKOFFICE_ID}:`, error);
                                return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${backoffice.BACKOFFICE_ID}`));
                            } else {
                                this.executeQueryData(`INSERT INTO notification_master (OWNER_ID,TITLE,DESCRIPTION,ATTACHMENT,MEMBER_ID,TYPE,STATUS,CLIENT_ID,NOTIFICATION_TYPE) VALUES(?,?,?,?,?,?,?,?,?)`, [SENDER_ID, TITLE, DESCRIPTION, "", backoffice.BACKOFFICE_ID, "TC", 1, 1, "B"], supportKey, (error, resultsMember1) => {
                                    if (error) {
                                        console.log(`Error sending notification to technician ${resultEmp[0].NAME}.`, error);
                                        inner_callback(error || new Error(`Error sending notification to department ${resultEmp[0].NAME}.`));
                                    }
                                    else {
                                        if (resultEmp[0].CLOUD_ID) {
                                            firebase.generateNotification("", resultEmp[0].CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, '', '', '', '9');
                                            console.log(`Notification sent successfully to technician ${resultEmp[0].NAME}.`);
                                            inner_callback();
                                        } else {
                                            console.log('Cloud Id Not Present');
                                            inner_callback();
                                        }
                                    }
                                })

                            }
                        });
                    }, (error) => {
                        if (error) {
                            console.log(`Error sending notification.`);
                        } else {
                            console.log(`Notification sent successfully.`);
                        }
                    });
                } else {
                    console.log(`No technician data found`);
                }
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendDynamicEmailORIGINAL = (templateID, referenceId, supportKey) => {

    console.log("\n\n\n\n\n\n\n*templateID  in dynamic email", templateID);
    this.executeQueryData(`SELECT TEMPLATE_NAME, TEMPLATE_CATEGORY_ID, SUBJECT, BODY, BODY_VALUES, ATTACHMENTS FROM email_template_master  WHERE TEMPLATE_CATEGORY_ID = ?`, [templateID], supportKey, (error, template) => {
        if (error) {
            console.error("Error fetching template:", error);
            return;
        }
        if (!template.length) {
            console.error("Template not found!");
            return;
        }

        let { TEMPLATE_CATEGORY_ID, BODY, BODY_VALUES } = template[0];
        BODY_VALUES = JSON.parse(BODY_VALUES);


        this.executeQueryData(`SELECT TABLE_COLUMN, TABLE_NAME FROM placeholder_master WHERE TEMPLATE_CATEGORY_ID = ?`, [TEMPLATE_CATEGORY_ID], supportKey, (error, mappings) => {
            if (error) {
                console.log("Error fetching mappings:", error);
                return;
            }

            if (!mappings.length) {
                console.log("No mappings found!");
                return;
            }

            let tableQueries = {};
            let emailTable = mappings[0].TABLE_NAME;
            let emailField = "EMAIL_ID";

            for (let { TABLE_COLUMN, TABLE_NAME } of mappings) {
                if (!tableQueries[TABLE_NAME]) tableQueries[TABLE_NAME] = [];
                tableQueries[TABLE_NAME].push(TABLE_COLUMN);
            }
            if (!emailTable || !emailField) {
                console.log("Email table or field not found!");
                return;
            }

            let values = {};
            let queriesExecuted = 0;
            let totalQueries = Object.keys(tableQueries).length;
            let recipientEmail = "";

            for (let table in tableQueries) {
                this.executeQueryData(`SELECT ${tableQueries[table].join(", ")} FROM ${table} WHERE ID = ?`, [referenceId], supportKey, (error, data) => {
                    if (error) {
                        console.log("Error fetching data from table:", error);
                        return;
                    }

                    if (data.length) {
                        Object.assign(values, data[0]);
                        if (table === emailTable && data[0][emailField]) {
                            recipientEmail = data[0][emailField];
                        }
                    }

                    queriesExecuted++;
                    if (queriesExecuted === totalQueries) {
                        let bodyMapping = {};
                        BODY_VALUES.forEach((key, index) => {
                            bodyMapping[index + 1] = key;
                        });

                        Object.keys(bodyMapping).forEach((num) => {
                            let regex = new RegExp(`{{\\s*${num}\\s*}}`, 'g');
                            BODY = BODY.replace(regex, `{{ ${bodyMapping[num]} }}`);
                        });

                        Object.keys(values).forEach((key) => {
                            let regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
                            BODY = BODY.replace(regex, values[key] || "");
                        });

                        if (!recipientEmail) {
                            console.log("Recipient email not found!");
                            return;
                        }
                        console.log("\n\nrecipientEmail ", recipientEmail);
                        console.log("template[0].SUBJECT ", template[0].SUBJECT);
                        console.log("BODY ", BODY);

                        this.sendEmail(recipientEmail, template[0].SUBJECT, BODY, template[0].TEMPLATE_NAME, template[0].ATTACHMENTS, (error, results) => {
                            if (error) {
                                console.log('Failed to send email:', error);
                            } else {
                                console.log('Email sent successfully to:', recipientEmail);
                            }
                        }
                        );
                    }
                }
                );
            }
        }
        );
    }
    );
};

exports.sendDynamicEmail = (templateID, referenceId, supportKey) => {

    console.log("\n\n*** sendDynamicEmail initiated for template:", templateID);

    // 1️⃣ Fetch the email template
    this.executeQueryData(`
        SELECT TEMPLATE_NAME, TEMPLATE_CATEGORY_ID, SUBJECT, SUBJECT_VALUES, BODY, BODY_VALUES, ATTACHMENTS
        FROM email_template_master 
        WHERE TEMPLATE_CATEGORY_ID = ?`,
        [templateID],
        supportKey,
        (error, template) => {
            if (error) {
                console.error("Error fetching template:", error);
                return;
            }
            if (!template.length) {
                console.error("Template not found!");
                return;
            }

            let { TEMPLATE_CATEGORY_ID, SUBJECT, SUBJECT_VALUES, BODY, BODY_VALUES, ATTACHMENTS } = template[0];
            BODY_VALUES = JSON.parse(BODY_VALUES || "[]");
            SUBJECT_VALUES = JSON.parse(SUBJECT_VALUES || "[]");

            // 2️⃣ Fetch placeholders from master
            this.executeQueryData(`
                SELECT TABLE_COLUMN, TABLE_NAME, PLACEHOLDER_TYPE 
                FROM placeholder_master 
                WHERE TEMPLATE_CATEGORY_ID = ?`,
                [TEMPLATE_CATEGORY_ID],
                supportKey,
                (error, mappings) => {

                    if (error) {
                        console.log("Error fetching mappings:", error);
                        return;
                    }
                    if (!mappings.length) {
                        console.log("No mappings found for template category:", TEMPLATE_CATEGORY_ID);
                        return;
                    }

                    // --- Organize columns per table ---
                    let tableQueries = {};
                    for (let { TABLE_COLUMN, TABLE_NAME } of mappings) {
                        if (!tableQueries[TABLE_NAME]) tableQueries[TABLE_NAME] = [];
                        tableQueries[TABLE_NAME].push(TABLE_COLUMN);
                    }

                    let values = {};
                    let queriesExecuted = 0;
                    let totalQueries = Object.keys(tableQueries).length;
                    let recipientEmail = "";

                    // 3️⃣ Fetch data from all required tables
                    for (let table in tableQueries) {
                        this.executeQueryData(
                            `SELECT ${tableQueries[table].join(", ")} FROM ${table} WHERE ID = ?`,
                            [referenceId],
                            supportKey,
                            (error, data) => {
                                if (error) {
                                    console.log("Error fetching data from table:", table, error);
                                    return;
                                }

                                if (data.length) {
                                    Object.assign(values, data[0]);

                                    // Assume EMAIL_ID is always part of one table
                                    if (data[0].EMAIL_ID && !recipientEmail)
                                        recipientEmail = data[0].EMAIL_ID;
                                }

                                queriesExecuted++;
                                if (queriesExecuted === totalQueries) {
                                    // All queries completed, now build email
                                    console.log("All data collected:", values);

                                    // --- BODY Placeholder Replacement ---
                                    BODY_VALUES.forEach((key, index) => {
                                        const regex = new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g');
                                        BODY = BODY.replace(regex, `{{${key}}}`);
                                    });

                                    Object.keys(values).forEach((key) => {
                                        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
                                        BODY = BODY.replace(regex, values[key] || "");
                                    });

                                    // --- SUBJECT Placeholder Replacement ---
                                    SUBJECT_VALUES.forEach((key, index) => {
                                        const regex = new RegExp(`{{\\s*${index + 1}\\s*}}`, 'g');
                                        SUBJECT = SUBJECT.replace(regex, `{{${key}}}`);
                                    });

                                    // Replace placeholders from values if marked SUBJECT or BOTH
                                    mappings.forEach((m) => {
                                        if (['SUBJECT', 'Both'].includes(m.PLACEHOLDER_TYPE)) {
                                            const regex = new RegExp(`{{\\s*${m.TABLE_COLUMN}\\s*}}`, 'gi');
                                            SUBJECT = SUBJECT.replace(regex, values[m.TABLE_COLUMN] || "");
                                        }
                                    });

                                    // --- Validation and Send ---
                                    if (!recipientEmail) {
                                        console.log("Recipient email not found!");
                                        return;
                                    }

                                    console.log("Final Email Subject:", SUBJECT);
                                    console.log("Final Email Body:", BODY);

                                    this.sendEmail(
                                        recipientEmail,
                                        SUBJECT,
                                        BODY,
                                        template[0].TEMPLATE_NAME,
                                        ATTACHMENTS,
                                        (error, results) => {
                                            if (error) {
                                                console.error('❌ Failed to send email:', error);
                                            } else {
                                                console.log('✅ Email sent successfully to:', recipientEmail);
                                            }
                                        }
                                    );
                                }
                            }
                        );
                    }
                }
            );
        }
    );
};



exports.sendNotificationToWManager = (TITLE, DESCRIPTION, ATTACHMENT, MEDIA_TYPE, data3, data4, CLOUD_ID, W_CLOUD_ID) => {
    try {
        if (CLOUD_ID) {
            firebase.generateNotification("", CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Web Notification
        }
        if (W_CLOUD_ID) {
            firebase.generateNotification("", W_CLOUD_ID, "N", TITLE, DESCRIPTION, ATTACHMENT, "B", JSON.stringify(data3), JSON.stringify(data4), '', '9', MEDIA_TYPE, ATTACHMENT); // Mobile Notification
        }
    } catch (error) {
        console.log(error);
    }
}

exports.userloginlogs = (USER_ID, USER_TYPE, DATE_TIME, STATUS, supportKey) => {
    try {
        this.executeQueryData(`INSERT INTO user_login_logs (USER_ID, USER_TYPE, DATE_TIME, STATUS,CLIENT_ID) VALUES(?,?,?,?,?)`, [USER_ID, USER_TYPE, DATE_TIME, STATUS, 1], supportKey, (error) => {
            if (error) {
                console.log(error);
            } else {
                console.log("userloginlogs");
            }
        });
    } catch (error) {
        console.log(error);
    }
}

exports.sendEmail = (to, subject, body, TEMPLATE_NAME, ATTACHMENTS, callback) => {
    console.log("to  ", to)
    console.log("body ", body)
    console.log("Mail subject ", subject)

    // Usage
    sendEmailCallback(
        to,
        subject,
        body,
        (err, response) => {
            if (err) {
                console.error('Callback Error:', err.response?.body || err);
                callback("EMAIL SEND ERROR.");
            } else {
                console.log('Callback Success:', response[0].statusCode, response);
                this.executeQueryData(
                    `INSERT INTO email_transactiona_history 
            (SENT_TO, PARAMS, TEMPLATE_NAME, SUBJECT, BODY, ATTACHMENTS, RESPONSE_DATA, STATUS, CLIENT_ID) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        to,
                        JSON.stringify(body), // Serialized PARAMS
                        TEMPLATE_NAME,
                        subject,
                        JSON.stringify(body), // Serialized BODY to avoid invalid SQL
                        ATTACHMENTS || '',    // Ensure ATTACHMENTS is not undefined
                        JSON.stringify(response), // Serialized RESPONSE_DATA
                        ((response[0].statusCode == 200 || response[0].statusCode == 202) ? 1 : 0),                    // STATUS
                        1                     // CLIENT_ID
                    ],
                    supportKey,
                    (error, result) => {
                        if (error) {
                            console.log("Error :", error);
                            callback(error);
                        } else {
                            console.log(result);
                            callback(null, response.body);
                        }
                    }
                );

            }
        }
    );


}

const sgMail = require('@sendgrid/mail');

// Replace with your actual API Key from Azure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY); // safer to use .env file

function sendEmailCallback(to, subject, html, callback) {
    const msg = {
        to,
        from: 'donotreply@pockitengineers.com', // Must be a verified sender
        subject,
        html
    };

    sgMail
        .send(msg)
        .then(response => callback(null, response))
        .catch(error => callback(error));
}

exports.sendNotificationToChannel = async (SENDER_ID, TOPIC_NAME, TITLE, DESCRIPTION, ATTACHMENT, TYPE, supportKey, MEDIA_TYPE, data3, data4) => {
    try {
        const userIds = await channelSubscribedUsers.find({ CHANNEL_NAME: TOPIC_NAME, STATUS: true })
        var data = []
        for (let i = 0; i < userIds.length; i++) {
            data.push([SENDER_ID, TITLE, DESCRIPTION, ATTACHMENT, userIds[i].USER_ID, userIds[i].TYPE, 1, 1, TYPE, MEDIA_TYPE, TOPIC_NAME])
        }
        console.log("\n\n\n\n\n\n\n\n channels subscribed users", userIds);
        if (data.length > 0) {
            this.executeQueryData(`INSERT INTO notification_master (OWNER_ID, TITLE, DESCRIPTION, ATTACHMENT, MEMBER_ID, TYPE, STATUS, CLIENT_ID, NOTIFICATION_TYPE, MEDIA_TYPE, TOPIC_NAME) VALUES ?`, [data], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                } else {
                    firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3, JSON.stringify(data4), '', '9', MEDIA_TYPE, "");
                }
            }
            );
        } else {
            // firebase.generateNotification(TOPIC_NAME, "", "N", TITLE, DESCRIPTION, ATTACHMENT, TYPE, data3, JSON.stringify(data4), '', '9', MEDIA_TYPE, "");
            console.log("\n\n\n\n\n\n\n\n NO channels subscribed users");

        }
    } catch (error) {
        console.log("Error in send notification:", error);
    }
}