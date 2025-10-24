const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const { createOrder } = require('./order');
const technicianActionLog = require("../../modules/technicianActionLog")
const dbm = require('../../utilities/dbMongo')
const applicationkey = process.env.APPLICATION_KEY;

var cartMaster = "cart_master";
var viewCartMaster = "view_" + cartMaster;


function reqData(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        TOTAL_AMOUNT: req.body.TOTAL_AMOUNT ? req.body.TOTAL_AMOUNT : 0,
        CREATED_DATE: req.body.CREATED_DATE,
        STATUS: req.body.STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID


    }
    return data;
}



exports.validate = function () {
    return [
        body('CUSTOMER_ID').isInt().optional(), body('TOTAL_AMOUNT').isDecimal().optional(), body('CREATED_DATE').optional(), body('STATUS').optional(), body('ID').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewCartMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get cart count.",
                    });
                }
                else {

                    mm.executeQuery('select * from ' + viewCartMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);

                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get cart information."
                            });
                        }
                        else {


                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 6,
                                "count": results1[0].cnt,
                                "data": results
                            });
                        }
                    });
                }
            });
        } else {
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
            "message": "something went wrong"
        }
        )
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
            mm.executeQueryData('INSERT INTO ' + cartMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save cart information..."
                    });
                }
                else {

                    res.send({
                        "code": 200,
                        "message": "Cart information saved successfully...",
                    });
                }
            });
        } catch (error) {

            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error)
            res.send({
                "code": 500,
                "message": "something went wrong"
            }
            )
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
            mm.executeQueryData(`UPDATE ` + cartMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {

                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update cart information."
                    });
                }
                else {

                    var ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has updated the cart details.`;


                    var logCategory = "CART";

                    let actionLog = {
                        "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                    }
                    dbm.saveLog(actionLog, systemLog)
                    res.send({
                        "code": 200,
                        "message": "Cart information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 500,
                "message": "something went wrong"
            }
            )
        }
    }
}



exports.addToCart = (req, res) => {
    try {

        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const serviceId = req.body.SERVICE_ID;
        const teritory_id = req.body.TERITORY_ID;
        const quantity = req.body.QUANTITY;
        const STATE_ID = req.body.STATE_ID;
        const IS_TEMP_CART = req.body.IS_TEMP_CART ? req.body.IS_TEMP_CART : 0;

        const BRAND_NAME = req.body.BRAND_NAME ? req.body.BRAND_NAME : '';
        const MODEL_NUMBER = req.body.MODEL_NUMBER ? req.body.MODEL_NUMBER : '';
        const SERVICE_PHOTO_FILE = req.body.SERVICE_PHOTO_FILE ? req.body.SERVICE_PHOTO_FILE : '';
        const DESCRIPTION = req.body.DESCRIPTION ? req.body.DESCRIPTION : '';
        const ADDRESS_ID = req.body.ADDRESS_ID;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();


        // Check if the user has a cart
        if (CUSTOMER_ID && serviceId && teritory_id && quantity && STATE_ID && ADDRESS_ID) {

            const connection = mm.openConnection()
            mm.executeDML(`call  spAddToCart(?,?,?,?,?,?,?,?,?,?,?)`, [CUSTOMER_ID, serviceId, teritory_id, quantity, STATE_ID, IS_TEMP_CART, BRAND_NAME, MODEL_NUMBER, SERVICE_PHOTO_FILE, DESCRIPTION, ADDRESS_ID], supportKey, connection, (error, resultsCheckcART) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save cart information..."
                    });
                }
                else {
                    console.log("here is the rs : ", resultsCheckcART[0][0].CART_ID);

                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has created a cart.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: 0, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Services added to cart", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: 0, DATE_TIME: systemDate, supportKey: 0 }

                    dbm.saveLog(logdata, technicianActionLog)

                    mm.commitConnection(connection);

                    res.send({
                        "code": 200,
                        "message": "Cart information saved successfully...",
                        "data": {
                            CART_ID: resultsCheckcART[0][0].CART_ID
                        }
                    });
                }
            });

        } else {

            res.send({
                "code": 200,
                "message": "parameter missing- CUSTOMER_ID, SERVICE_ID, TERITORY_ID, QUANTITY, STATE_ID",
            });

        }

    } catch (error) {
        console.log("Error in addToCart :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }

}



exports.getCartDetails = (req, res) => {
    try {

        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        var supportKey = req.headers['supportkey'];

        // Check if the user has a cart
        if (CUSTOMER_ID || CART_ID) {

            var filter = (CUSTOMER_ID) ? ` CUSTOMER_ID= ? AND STATUS = 'C'` : ` ID= ? `;
            var dataID = (CUSTOMER_ID) ? CUSTOMER_ID : CART_ID;
            // const connection = mm.openConnection()
            mm.executeQueryData(`select * from view_cart_master where ${filter}  order by ID DESC LIMIT 1;`, [dataID], supportKey, (error, resultsCheckcART) => {
                if (error) {
                    console.log(error);
                    // mm.rollbackConnection(connection);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get cart information..."
                    });
                }
                else {
                    if (resultsCheckcART.length > 0) {


                        mm.executeQueryData(`select * from view_cart_item_details where CART_ID = ?;`, [resultsCheckcART[0].ID], supportKey, (error, resultsCartDetails) => {
                            if (error) {
                                console.log(error);
                                // mm.rollbackConnection(connection);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get cart information..."
                                });
                            }
                            else {

                                res.send({
                                    "code": 200,
                                    "message": "Cart information fetched successfully...",
                                    "data": {
                                        CART_INFO: resultsCheckcART,
                                        CART_DETAILS: resultsCartDetails
                                    }
                                });

                            }
                        })

                    } else {
                        res.send({
                            "code": 200,
                            "message": "Cart information fetched successfully...",
                            "data": {
                                CART_INFO: [],
                                CART_DETAILS: []
                            }
                        });

                    }

                }
            });

        } else {

            res.send({
                "code": 200,
                "message": "parameter missing- CUSTOMER_ID",
            });

        }

    } catch (error) {
        console.log("Error in getCartDetails :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }

}




exports.deleteCartItem = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const SERVICE_ID = req.body.SERVICE_ID;
        const CART_ID = req.body.CART_ID;
        const CART_ITEM_ID = req.body.CART_ITEM_ID;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();


        if (CUSTOMER_ID && SERVICE_ID && CART_ID && CART_ITEM_ID) {
            mm.executeQueryData(`call spRemoveFromCart(?,?,?,?)`, [CUSTOMER_ID, SERVICE_ID, CART_ID, CART_ITEM_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to delete cart information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has deleted a cart.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: 0, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Service removed from cart", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: 0, DATE_TIME: systemDate, supportKey: 0 }

                    dbm.saveLog(logdata, technicianActionLog)

                    res.send({
                        "code": 200,
                        "message": "Cart information deleted successfully...",
                    });
                }
            });
        } else {
            res.send({
                "code": 200,
                "message": "parameter missing- ID",
            });
        }
    } catch (error) {
        console.log("Error in delete :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}


exports.updateCartItem = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const SERVICE_ID = req.body.SERVICE_ID;
        const CART_ID = req.body.CART_ID;
        const CART_ITEM_ID = req.body.CART_ITEM_ID;
        const QUANTITY = req.body.QUANTITY;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();


        if (CUSTOMER_ID && SERVICE_ID && CART_ID && CART_ITEM_ID && QUANTITY) {
            mm.executeQueryData(`call spUpdateCart(?,?,?,?,?)`, [CUSTOMER_ID, SERVICE_ID, CART_ID, CART_ITEM_ID, QUANTITY], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update cart information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has updated the cart details.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: 0, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Cart updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: 0, DATE_TIME: systemDate, supportKey: 0 }

                    dbm.saveLog(logdata, technicianActionLog)
                    res.send({
                        "code": 200,
                        "message": "Cart information updated successfully...",
                    });
                }
            });
        } else {
            res.send({
                "code": 200,
                "message": "parameter missing- ID",
            });
        }
    } catch (error) {
        console.log("Error in updateCart :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}


exports.updateServiceDetails = (req, res) => {
    try {

        const CART_ID = req.body.CART_ID;
        const SCHEDULE_DATE = req.body.SCHEDULE_DATE;
        const SCHEDULE_START_TIME = req.body.SCHEDULE_START_TIME;
        const SCHEDULE_END_TIME = req.body.SCHEDULE_END_TIME;
        const REMARK = req.body.REMARK ? req.body.REMARK : '';

        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CART_ID && SCHEDULE_DATE && SCHEDULE_START_TIME && SCHEDULE_END_TIME) {
            mm.executeQueryData(`update cart_master  set SCHEDULE_DATE = ?,SCHEDULE_START_TIME = ? , SCHEDULE_END_TIME =?, REMARK=?   where ID = ?`, [SCHEDULE_DATE, SCHEDULE_START_TIME, SCHEDULE_END_TIME, REMARK, CART_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update cart information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has updated the cart details.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: 0, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: 0, DATE_TIME: systemDate, supportKey: 0 }

                    dbm.saveLog(logdata, technicianActionLog)
                    res.send({
                        "code": 200,
                        "message": "Cart information updated successfully...",
                    });
                }
            });
        } else {
            res.send({
                "code": 200,
                "message": "parameter missing- ID",
            });
        }

    } catch (error) {
        console.log("Error in updateServiceDetails :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}





exports.createOrder = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        const ADDRESS_ID = req.body.ADDRESS_ID;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID && CART_ID && ADDRESS_ID) {
            mm.executeQueryData(`call spCreateOrder(?,?,?)`, [CUSTOMER_ID, CART_ID], supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to create order..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME}  has created an order.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: 0, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: 0, DATE_TIME: systemDate, supportKey: 0 }

                    dbm.saveLog(logdata, technicianActionLog)
                    res.send({
                        "code": 200,
                        "message": "Order created successfully...",
                    });
                }
            });
        } else {
            res.send({
                "code": 200,
                "message": "parameter missing- ID",
            });
        }

    } catch (error) {
        console.log("Error in createOrder :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}