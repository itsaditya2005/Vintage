const mm = require('../utilities/globalModule');

var tableName = "global_settings";
var viewTableName = "view_" + tableName;

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

    let countCriteria = filter;
    var supportKey = req.headers['supportkey'];
    try {
        mm.executeQuery('select count(*) as cnt from ' + viewTableName + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
            if (error) {
                console.log(error);

                res.send({
                    "code": 400,
                    "message": "error occurred",
                });
            }
            else {
                console.log(results1);
                mm.executeQuery('select * from ' + viewTableName + ' where 1 ' + criteria, supportKey, (error, results) => {
                    if (error) {
                        console.log(error);

                        res.send({
                            "code": 400,
                            "message": "error occurred"
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
    } catch (error) {
        console.log(error);

    }

}

exports.getVersion = (req, res) => {
    var supportKey = req.headers['supportkey'];
    try {

        mm.executeQuery(`select VALUE from global_settings where KEYWORD ='TECHNICIAN_MIN_VERSION' `, supportKey, (error, result1) => {
            if (error) {
                console.log(error);

                res.send({
                    "code": 400,
                    "message": "error occurred"
                });
            }
            else {
                mm.executeQuery(`select VALUE from global_settings where KEYWORD ='TECHNICIAN_CUR_VERSION' `, supportKey, (error, result2) => {
                    if (error) {
                        console.log(error);

                        res.send({
                            "code": 400,
                            "message": "error occurred"
                        });
                    }
                    else {
                        mm.executeQuery(`select VALUE from global_settings where KEYWORD ='TECHNICIAN_APK_LINK'`, supportKey, (error, result3) => {
                            if (error) {
                                console.log(error);
                                res.send({
                                    "code": 400,
                                    "message": "error occurred"
                                });
                            }
                            else {
                                mm.executeQuery(`select VALUE from global_settings where KEYWORD ='CUSTOMER_MIN_VERSION' `, supportKey, (error, result4) => {
                                    if (error) {
                                        console.log(error);

                                        res.send({
                                            "code": 400,
                                            "message": "error occurred"
                                        });
                                    }
                                    else {
                                        mm.executeQuery(`select VALUE from global_settings where KEYWORD ='CUSTOMER_CUR_VERSION' `, supportKey, (error, result5) => {
                                            if (error) {
                                                console.log(error);

                                                res.send({
                                                    "code": 400,
                                                    "message": "error occurred"
                                                });
                                            }
                                            else {
                                                mm.executeQuery(`select VALUE from global_settings where KEYWORD ='CUSTOMER_APK_LINK'`, supportKey, (error, result6) => {
                                                    if (error) {
                                                        console.log(error);
                                                        res.send({
                                                            "code": 400,
                                                            "message": "error occurred"
                                                        });
                                                    }
                                                    else {
                                                        res.send({
                                                            "code": 200,
                                                            "message": "success",
                                                            "data": [{
                                                                "TECHNICIAN_MIN_VERSION": result1[0].VALUE,
                                                                "TECHNICIAN_CUR_VERSION": result2[0].VALUE,
                                                                "TECHNICIAN_APK_LINK": result3[0].VALUE,
                                                                "CUSTOMER_MIN_VERSION": result4[0].VALUE,
                                                                "CUSTOMER_CUR_VERSION": result5[0].VALUE,
                                                                "CUSTOMER_APK_LINK": result6[0].VALUE,
                                                                "SYSTEM_DATE": mm.getSystemDate(),

                                                            }]
                                                        });
                                                    }
                                                })
                                            }
                                        });
                                    }
                                });
                            }
                        })
                    }
                });
            }
        });
    } catch (error) {
        console.log(error);

    }
}


exports.getVestionUpdatedHistory = (req, res) => {
    try {
        const applicationkey = process.env.APPLICATION_KEY;
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
        var supportKey = req.headers['supportkey'];

        try {
            mm.executeQuery('select count(*) as cnt from view_version_update_history where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    // 

                    res.send({
                        "code": 400,
                        "message": "Failed to get vesrion update history count.",
                    });
                }
                else {
                    console.log(results1);
                    mm.executeQuery('select * from view_version_update_history where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            //

                            res.send({
                                "code": 400,
                                "message": "Failed to get vesrion update history information."
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
        } catch (error) {
            //

            console.log(error);
        }

    } catch (error) {
        console.log(req.method + " " + req.url + " ", error)

    }
}

exports.updatedVersion = (req, res) => {
    var TECHNICIAN_MIN_VERSION = req.body.TECHNICIAN_MIN_VERSION;
    var TECHNICIAN_CUR_VERSION = req.body.TECHNICIAN_CUR_VERSION;
    var TECHNICIAN_APK_LINK = req.body.TECHNICIAN_APK_LINK ? req.body.TECHNICIAN_APK_LINK : '';
    var CUSTOMER_MIN_VERSION = req.body.CUSTOMER_MIN_VERSION;
    var CUSTOMER_CUR_VERSION = req.body.CUSTOMER_CUR_VERSION;
    var CUSTOMER_APK_LINK = req.body.CUSTOMER_APK_LINK ? req.body.CUSTOMER_APK_LINK : '';

    var TECHNICIAN_DESCRIPTION = req.body.TECHNICIAN_DESCRIPTION;
    var CUSTOMER_DESCRIPTION = req.body.CUSTOMER_DESCRIPTION;
    var TECHNICIAN_PREVIOUS_VERSION = req.body.TECHNICIAN_PREVIOUS_VERSION;
    var CUSTOMER_PREVIOUS_VERSION = req.body.CUSTOMER_PREVIOUS_VERSION;
    var USER_ID = req.body.USER_ID;
    var DATETIME = mm.getSystemDate()

    var supportKey = req.headers['supportkey'];

    try {
        if (!TECHNICIAN_MIN_VERSION || !TECHNICIAN_CUR_VERSION || !CUSTOMER_MIN_VERSION || !CUSTOMER_CUR_VERSION || !TECHNICIAN_PREVIOUS_VERSION || !CUSTOMER_PREVIOUS_VERSION || !USER_ID) {
            res.send({
                "code": 400,
                "message": "Parameter missing vesion or userid."
            });
        } else {

            var connection = mm.openConnection();
            mm.executeDML(`UPDATE ` + tableName + ` SET VALUE = ? where KEYWORD = 'TECHNICIAN_MIN_VERSION' `, TECHNICIAN_MIN_VERSION, supportKey, connection, (error, results) => {
                if (error) {

                    console.log(error);
                    mm.rollbackConnection(connection);
                    res.send({
                        "code": 400,
                        "message": "Failed to update APK information."
                    });
                } else {
                    mm.executeDML(`UPDATE ` + tableName + ` SET VALUE = ? where KEYWORD = 'TECHNICIAN_CUR_VERSION' `, TECHNICIAN_CUR_VERSION, supportKey, connection, (error, results1) => {
                        if (error) {

                            console.log(error);
                            mm.rollbackConnection(connection);
                            res.send({
                                "code": 400,
                                "message": "Failed to update APK information."
                            });
                        } else {
                            mm.executeDML(`UPDATE ` + tableName + ` SET VALUE = ? where KEYWORD = 'TECHNICIAN_APK_LINK' `, TECHNICIAN_APK_LINK, supportKey, connection, (error, results2) => {
                                if (error) {

                                    console.log(error);
                                    mm.rollbackConnection(connection);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to update APK information."
                                    });
                                } else {
                                    mm.executeDML(`UPDATE ` + tableName + ` SET VALUE = ? where KEYWORD = 'CUSTOMER_MIN_VERSION' `, CUSTOMER_MIN_VERSION, supportKey, connection, (error, results) => {
                                        if (error) {

                                            console.log(error);
                                            mm.rollbackConnection(connection);
                                            res.send({
                                                "code": 400,
                                                "message": "Failed to update APK information."
                                            });
                                        } else {
                                            mm.executeDML(`UPDATE ` + tableName + ` SET VALUE = ? where KEYWORD = 'CUSTOMER_CUR_VERSION' `, CUSTOMER_CUR_VERSION, supportKey, connection, (error, results1) => {
                                                if (error) {

                                                    console.log(error);
                                                    mm.rollbackConnection(connection);
                                                    res.send({
                                                        "code": 400,
                                                        "message": "Failed to update APK information."
                                                    });
                                                } else {
                                                    mm.executeDML(`UPDATE ` + tableName + ` SET VALUE = ? where KEYWORD = 'CUSTOMER_APK_LINK' `, CUSTOMER_APK_LINK, supportKey, connection, (error, results2) => {
                                                        if (error) {

                                                            console.log(error);
                                                            mm.rollbackConnection(connection);
                                                            res.send({
                                                                "code": 400,
                                                                "message": "Failed to update APK information."
                                                            });
                                                        } else {

                                                            mm.executeDML(`insert into  version_update_history(TECHNICIAN_PREVIOUS_VERSION,CUSTOMER_PREVIOUS_VERSION,TECHNICIAN_MIN_VERSION,TECHNICIAN_CUR_VERSION,CUSTOMER_MIN_VERSION,CUSTOMER_CUR_VERSION,DATETIME,TECHNICIAN_DESCRIPTION , CUSTOMER_DESCRIPTION,USER_ID) values(?,?,?,?,?,?,?,?,?,?)`, [TECHNICIAN_PREVIOUS_VERSION,CUSTOMER_PREVIOUS_VERSION,TECHNICIAN_MIN_VERSION,TECHNICIAN_CUR_VERSION,CUSTOMER_MIN_VERSION,CUSTOMER_CUR_VERSION, DATETIME, TECHNICIAN_DESCRIPTION,CUSTOMER_DESCRIPTION, USER_ID], supportKey, connection, (error, resultsAdd) => {
                                                                if (error) {

                                                                    console.log(error);
                                                                    mm.rollbackConnection(connection);
                                                                    res.send({
                                                                        "code": 400,
                                                                        "message": "Failed to insert APK update information."
                                                                    });
                                                                } else {
                                                                    mm.commitConnection(connection);
                                                                    res.send({
                                                                        "code": 200,
                                                                        "message": "Apk Information Updated successfully..."
                                                                    })
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
    } catch (error) {

        console.log(error);
    }
}