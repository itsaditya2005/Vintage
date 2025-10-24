const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const { createOrder } = require('./order');
const technicianActionLog = require("../../modules/technicianActionLog")
const shopActionLog = require("../../modules/shopOrderActionLog")
const dbm = require('../../utilities/dbMongo')
const applicationkey = process.env.APPLICATION_KEY;

var cartMaster = "cart_master";
var viewCartMaster = "view_" + cartMaster;

var formattedDate = new Date(mm.getSystemDate().split(" ")[0]).toLocaleDateString("en-GB", {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

function formatDate(dateInput) {
    const date = new Date(dateInput);
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
}


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
        body('CUSTOMER_ID').isInt().optional(),
        body('TOTAL_AMOUNT').isDecimal().optional(),
        body('CREATED_DATE').optional(),
        body('STATUS').optional(),
        body('ID').optional(),
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

                    var ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated the cart.`;
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

exports.addToCartOLD = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const serviceId = req.body.SERVICE_ID;
        const inventoryId = req.body.INVENTORY_ID;
        const teritory_id = req.body.TERITORY_ID;
        const quantity = req.body.QUANTITY;
        const STATE_ID = req.body.STATE_ID;
        const IS_TEMP_CART = req.body.IS_TEMP_CART ? req.body.IS_TEMP_CART : 0;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        let QUANTITY_PER_UNIT = req.body.QUANTITY_PER_UNIT ? req.body.QUANTITY_PER_UNIT : 0;
        let UNIT_ID = req.body.UNIT_ID ? req.body.UNIT_ID : 0;
        let UNIT_NAME = req.body.UNIT_NAME ? req.body.UNIT_NAME : 0;

        const BRAND_NAME = req.body.BRAND_NAME ? req.body.BRAND_NAME : '';
        const MODEL_NUMBER = req.body.MODEL_NUMBER ? req.body.MODEL_NUMBER : '';
        const SERVICE_PHOTO_FILE = req.body.SERVICE_PHOTO_FILE ? req.body.SERVICE_PHOTO_FILE : '';
        const DESCRIPTION = req.body.DESCRIPTION ? req.body.DESCRIPTION : '';
        const ADDRESS_ID = req.body.ADDRESS_ID;
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();
        if (TYPE == 'S') {
            if (CUSTOMER_ID && serviceId && teritory_id && quantity && STATE_ID && ADDRESS_ID) {
                return res.send({
                    "code": 400,
                    "message": "parameter missing for cart Service CUSTOMER_ID && serviceId && teritory_id && quantity && STATE_ID && ADDRESS_ID"
                })
            }
        }
        if (TYPE != 'S') {
            if (CUSTOMER_ID && inventoryId && teritory_id && quantity && STATE_ID && ADDRESS_ID && QUANTITY_PER_UNIT && UNIT_ID && UNIT_NAME) {
                return res.send({
                    "code": 400,
                    "message": "parameter missing for cart Inventory CUSTOMER_ID && inventoryId && teritory_id && quantity && STATE_ID && ADDRESS_ID"
                })
            }
        }

        if (CUSTOMER_ID && (serviceId || inventoryId) && teritory_id && quantity && STATE_ID && ADDRESS_ID && TYPE) {
            const connection = mm.openConnection()
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spAddToCart(?,?,?,?,?,?,?,?,?,?,?);`;
                qdata = [CUSTOMER_ID, serviceId, teritory_id, quantity, STATE_ID, IS_TEMP_CART, BRAND_NAME, MODEL_NUMBER, SERVICE_PHOTO_FILE, DESCRIPTION, ADDRESS_ID];
            } else {
                if (QUANTITY_PER_UNIT && UNIT_ID && UNIT_NAME) {
                    var Queryz = `call spAddToCart_shop(?,?,?,?,?,?,?,?,?,?);`;
                    qdata = [CUSTOMER_ID, inventoryId, quantity, STATE_ID, IS_TEMP_CART, ADDRESS_ID, teritory_id, QUANTITY_PER_UNIT, UNIT_ID, UNIT_NAME];
                } else {
                    return res.send({
                        "code": 400,
                        "message": "parameter missing for shop cart QUANTITY_PER_UNIT or UNIT_ID or UNIT_NAME"
                    })
                }
            }

            mm.executeDML(Queryz, qdata, supportKey, connection, (error, resultsCheckcART) => {
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
                    var module = ''
                    var ACTION_DETAILS = '';
                    var logdata = {};
                    if (TYPE == 'S') {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created a cart.`;
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: resultsCheckcART[0][0].CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Services added to cart", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                        module = technicianActionLog
                    } else {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created a cart.`;
                        logdata = { ORDER_ID: 0, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: resultsCheckcART[0][0].CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Product added to cart", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                        module = shopActionLog
                    }
                    dbm.saveLog(logdata, module)
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
                "message": "parameter missing- CUSTOMER_ID, SERVICE_ID || INVENTORY_ID, TERITORY_ID, QUANTITY, STATE_ID",
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

exports.addToCart = (req, res) => {
    try {
        const {
            CUSTOMER_ID,
            SERVICE_ID,
            INVENTORY_ID,
            TERITORY_ID,
            QUANTITY,
            STATE_ID,
            IS_TEMP_CART = 0,
            TYPE = 'S',
            QUANTITY_PER_UNIT = 0,
            UNIT_ID = 0,
            UNIT_NAME = '',
            BRAND_NAME = '',
            MODEL_NUMBER = '',
            SERVICE_PHOTO_FILE = '',
            DESCRIPTION = '',
            ADDRESS_ID
        } = req.body;

        const supportKey = req.headers['supportkey'];
        const systemDate = mm.getSystemDate();
        // Validate required parameters based on TYPE
        if (TYPE === 'S') {
            if (!CUSTOMER_ID || !SERVICE_ID || !TERITORY_ID || !QUANTITY || !STATE_ID || !ADDRESS_ID) {
                return res.status(400).send({
                    code: 400,
                    message: "Missing required parameters for cart service: CUSTOMER_ID, SERVICE_ID, TERITORY_ID, QUANTITY, STATE_ID, ADDRESS_ID"
                });
            }
        } else {
            if (!CUSTOMER_ID || !INVENTORY_ID || !TERITORY_ID || !QUANTITY || !STATE_ID || !ADDRESS_ID || !QUANTITY_PER_UNIT || !UNIT_ID || !UNIT_NAME) {
                return res.status(400).send({
                    code: 400,
                    message: "Missing required parameters for cart inventory: CUSTOMER_ID, INVENTORY_ID, TERITORY_ID, QUANTITY, STATE_ID, ADDRESS_ID, QUANTITY_PER_UNIT, UNIT_ID, UNIT_NAME"
                });
            }
        }

        const connection = mm.openConnection();
        let query = '';
        let queryData = [];

        if (TYPE === 'S') {
            query = `CALL spAddToCart(?,?,?,?,?,?,?,?,?,?,?)`;
            queryData = [
                CUSTOMER_ID, SERVICE_ID, TERITORY_ID, QUANTITY, STATE_ID,
                IS_TEMP_CART, BRAND_NAME, MODEL_NUMBER, SERVICE_PHOTO_FILE,
                DESCRIPTION, ADDRESS_ID
            ];
        } else {
            query = `CALL spAddToCart_shop(?,?,?,?,?,?,?,?,?,?)`;
            queryData = [
                CUSTOMER_ID, INVENTORY_ID, QUANTITY, STATE_ID, IS_TEMP_CART,
                ADDRESS_ID, TERITORY_ID, QUANTITY_PER_UNIT, UNIT_ID, UNIT_NAME
            ];
        }

        mm.executeDML(query, queryData, supportKey, connection, (error, results) => {
            if (error) {
                console.error("Database Error:", error);
                mm.rollbackConnection(connection);
                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);

                return res.status(400).send({
                    code: 400,
                    message: "Failed to save cart information."
                });
            }

            const cartId = results[0][0].CART_ID;
            const userData = req.body.authData.data.UserData[0];
            const actionDetails = `Customer ${userData.USER_NAME} has created a cart.`;

            const logData = {
                CUSTOMER_ID,
                USER_ID: userData.USER_ID,
                USER_NAME: userData.USER_NAME,
                CART_ID: cartId,
                DATE_TIME: systemDate,
                LOG_TYPE: 'Cart',
                ACTION_LOG_TYPE: 'Customer',
                ACTION_DETAILS: actionDetails,
                ORDER_STATUS: TYPE === 'S' ? "Services added to cart" : "Product added to cart",
                TOTAL_AMOUNT: 0
            };

            const module = TYPE === 'S' ? technicianActionLog : shopActionLog;
            dbm.saveLog(logData, module);

            mm.commitConnection(connection);

            res.status(200).send({
                code: 200,
                message: "Cart information saved successfully.",
                data: {
                    CART_ID: cartId
                }
            });
        });
    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).send({
            code: 500,
            message: "Something went wrong. Please try again."
        });
    }
};


exports.getCartDetails = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        const IS_CART_PAGE = req.body.IS_CART_PAGE ? req.body.IS_CART_PAGE : 0;
        var supportKey = req.headers['supportkey'];
        if (CUSTOMER_ID || CART_ID) {
            var filter = (CUSTOMER_ID) ? ` CUSTOMER_ID= ? AND STATUS = 'C'` : ` ID= ? `;
            var dataID = (CUSTOMER_ID) ? CUSTOMER_ID : CART_ID;
            if (IS_CART_PAGE) {
                mm.executeQueryData(`select * from view_cart_master where CUSTOMER_ID = ?  and IS_TEMP_CART = 1 order by ID DESC LIMIT 1;`, [CUSTOMER_ID], supportKey, (error, resultsCheckcART1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get cart information..."
                        });
                    } else {
                        if (resultsCheckcART1.length > 0) {
                            var qdata = [];
                            var Queryz = '';
                            TYPE = resultsCheckcART1[0].TYPE;
                            if (TYPE == 'S') {
                                Queryz = `call spDiscardTempCart(?,?);`;
                                qdata = [resultsCheckcART1[0].ID, CUSTOMER_ID];
                            } else {
                                var Queryz = `call spDiscardTempCart(?,?);`;
                                qdata = [resultsCheckcART1[0].ID, CUSTOMER_ID]
                            }
                            mm.executeQueryData(Queryz, qdata, supportKey, (error, resultsCartDetails) => {
                                if (error) {
                                    console.log(error);
                                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                    res.send({
                                        "code": 400,
                                        "message": "Failed to get cart information..."
                                    });
                                }
                                else {
                                    mm.executeQueryData(`select * from view_cart_master where ${filter}  order by ID DESC LIMIT 1;`, [dataID], supportKey, (error, resultsCheckcART) => {
                                        if (error) {
                                            console.log(error);
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
                                                                CART_DETAILS: resultsCartDetails,
                                                                TYPE: resultsCheckcART[0].TYPE
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
                                }
                            })
                        } else {
                            mm.executeQueryData(`select * from view_cart_master where ${filter}  order by ID DESC LIMIT 1;`, [dataID], supportKey, (error, resultsCheckcART) => {
                                if (error) {
                                    console.log(error);
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
                                                        CART_DETAILS: resultsCartDetails,
                                                        TYPE: resultsCheckcART[0].TYPE
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
                        }
                    }
                });
            }
            else {
                mm.executeQueryData(`select * from view_cart_master where ${filter}  order by ID DESC LIMIT 1;`, [dataID], supportKey, (error, resultsCheckcART) => {
                    if (error) {
                        console.log(error);
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
                                            CART_DETAILS: resultsCartDetails,
                                            TYPE: resultsCheckcART[0].TYPE
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
            }
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
        const INVENTORY_ID = req.body.INVENTORY_ID;
        const SERVICE_ID = req.body.SERVICE_ID;
        const CART_ID = req.body.CART_ID;
        const CART_ITEM_ID = req.body.CART_ITEM_ID;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();


        if (CUSTOMER_ID && (SERVICE_ID || INVENTORY_ID) && CART_ID && CART_ITEM_ID && TYPE) {
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spRemoveFromCart(?,?,?,?)`;
                qdata = [CUSTOMER_ID, SERVICE_ID, CART_ID, CART_ITEM_ID]
            } else {
                var Queryz = `call spRemoveFromCart_shop(?,?,?,?)`;
                qdata = [CUSTOMER_ID, INVENTORY_ID, CART_ID, CART_ITEM_ID]
            }

            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to delete cart information..."
                    });
                }
                else {
                    var ACTION_DETAILS = '';
                    var module = '';
                    var logdata = {};
                    if (TYPE == 'S') {
                        const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has deleted a cart.`;
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Service removed from cart", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                        module = technicianActionLog
                    } else {
                        const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has deleted a cart.`;
                        logdata = { ORDER_ID: 0, DATE_TIME: mm.getSystemDate(), CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Product removed from cart", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                        module = shopActionLog
                    }
                    dbm.saveLog(logdata, module)
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
        const INVENTORY_ID = req.body.INVENTORY_ID;
        const SERVICE_ID = req.body.SERVICE_ID;
        const CART_ID = req.body.CART_ID;
        const CART_ITEM_ID = req.body.CART_ITEM_ID;
        const QUANTITY = req.body.QUANTITY;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();


        if (CUSTOMER_ID && (SERVICE_ID || INVENTORY_ID) && CART_ID && CART_ITEM_ID && QUANTITY && TYPE) {

            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spUpdateCart(?,?,?,?,?); `;
                qdata = [CUSTOMER_ID, SERVICE_ID, CART_ID, CART_ITEM_ID, QUANTITY];
            } else {
                var Queryz = `call spUpdateCart_shop(?,?,?,?,?); `;
                qdata = [CUSTOMER_ID, INVENTORY_ID, CART_ID, CART_ITEM_ID, QUANTITY]
            }


            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update cart information..."
                    });
                }
                else {

                    var ACTION_DETAILS = '';
                    var module = '';
                    var logdata = {};
                    if (TYPE == 'S') {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated a cart.`;
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Cart updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                        module = technicianActionLog
                    } else {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated a cart.`;
                        logdata = { ORDER_ID: 0, DATE_TIME: mm.getSystemDate(), CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Cart updated", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                        module = shopActionLog
                    }

                    dbm.saveLog(logdata, module)
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
        const EXPECTED_DATE_TIME = req.body.EXPECTED_DATE_TIME;
        const REMARK = req.body.REMARK ? req.body.REMARK : '';
        const IS_EXPRESS = req.body.IS_EXPRESS ? 1 : 0;

        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CART_ID && SCHEDULE_DATE && SCHEDULE_START_TIME && SCHEDULE_END_TIME && EXPECTED_DATE_TIME) {
            var Queryz = `call  spUpdateExpressCharge(?,?,?,?,?,?,?); `;
            var qdata = [CART_ID, IS_EXPRESS, SCHEDULE_DATE, SCHEDULE_START_TIME, SCHEDULE_END_TIME, EXPECTED_DATE_TIME, REMARK]


            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to update cart information..."
                    });
                }
                else {
                    const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated a cart.`;
                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: 0, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Cart updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }

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
        const Razorpay_ID = req.body.Razorpay_ID
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CUSTOMER_NAME = req.body.CUSTOMER_NAME;
        const CUSTOMER_MOBILE = req.body.CUSTOMER_MOBILE;
        const CART_ID = req.body.CART_ID;
        const IS_TEMP_CART = req.body.IS_TEMP_CART
        const TERRITORYID = req.body.TERRITORYID
        const paymentMetod = req.body.PAYMENT_METHOD;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID && CART_ID && paymentMetod && TYPE && TERRITORYID) {

            var Queryz = '';
            var qdata = [];
            var tableName = ""
            var templateName = ""

            if (TYPE == 'S') {
                Queryz = `call spCreateOrder(?,?,?); `;
                qdata = [CUSTOMER_ID, CART_ID, paymentMetod];
                tableName = "view_order_master"
                templateName = "service_order_placed_new"
            } else {
                templateName = "service_order_placed_new"
                var Queryz = `call spCreateOrder_shop(?,?,?); `;
                qdata = [CUSTOMER_ID, CART_ID, paymentMetod]
                tableName = "view_shop_order_master"
            }
            const connection = mm.openConnection();
            mm.executeDML(Queryz, qdata, supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection)
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to create order..."
                    });
                }
                else {

                    mm.executeDML('SELECT * FROM ' + tableName + ' WHERE ID = ?', [results[0][0].NEW_ORDER_ID], supportKey, connection, (error, resultsCart) => {
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
                            console.log("Razorpay_ID", Razorpay_ID)
                            console.log("results[0][0].NEW_ORDER_ID", results)
                            if (results[0][0].NEW_ORDER_ID) {
                                if (Razorpay_ID) {

                                    mm.executeDML('UPDATE payment_getway_order_logs SET ORDER_ID = ? where RAZORPAY_ORDER_ID = ?', [results[0][0].NEW_ORDER_ID, Razorpay_ID], supportKey, connection, (error, results3) => {
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
                                            console.log("TYPE", TYPE)
                                            let dataResult = JSON.stringify(results);
                                            mm.sendNotificationToAdmin(8, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", "N", supportKey, "O", req.body);
                                            var module = ''
                                            if (TYPE == 'S') {
                                                var TOPIC_NAME = `territory_${TERRITORYID}_admin_channel`

                                                mm.sendDynamicEmail(21, results[0][0].NEW_ORDER_ID, supportKey)
                                                const formattedDate = formatDate(resultsCart[0].ORDER_DATE_TIME);

                                                var wBparams = [
                                                    {
                                                        "type": "text",
                                                        "text": resultsCart[0].CUSTOMER_NAME
                                                    },
                                                    {
                                                        "type": "text",
                                                        "text": resultsCart[0].ORDER_NUMBER
                                                    },
                                                    {
                                                        "type": "text",
                                                        "text": resultsCart[0].TOTAL_AMOUNT
                                                    },
                                                    {
                                                        "type": "text",
                                                        "text": resultsCart[0].ORDER_DATE_TIME
                                                    }
                                                ]

                                                var wparams = [
                                                    {
                                                        "type": "body",
                                                        "parameters": wBparams
                                                    }
                                                ]

                                                mm.sendWAToolSMS(resultsCart[0].MOBILE_NO, templateName, wparams, 'en', (error, resultswsms) => {
                                                    if (error) {
                                                        console.log(error)
                                                    }
                                                    else {
                                                        console.log("Successfully send SMS", resultswsms)
                                                    }
                                                })
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", supportKey, "", "O", req.body);
                                                const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created a order.`;
                                                logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results[0][0].NEW_ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Order placed successfully", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                                                module = technicianActionLog
                                            } else {
                                                mm.sendDynamicEmail(18, results[0][0].NEW_ORDER_ID, supportKey)
                                                console.log("\n\n\n\n\n SP DATA RETURN", results[0][0])
                                                var TOPIC_NAME = `territory_${TERRITORYID}_admin_channel`
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", supportKey, "", "SH", req.body);
                                                var TOPIC_NAME = `territory_warehouse_${TERRITORYID}_channel`
                                                mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", supportKey, "", "SH", req.body);
                                                const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created a order.`;
                                                logdata = { ORDER_ID: results[0][0].NEW_ORDER_ID, DATE_TIME: mm.getSystemDate(), CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Order placed successfully", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: paymentMetod, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                                                module = shopActionLog
                                            }
                                            dbm.saveLog(logdata, module)
                                            mm.commitConnection(connection);
                                            res.send({
                                                "code": 200,
                                                "message": "Order created successfully...",
                                            });
                                        }
                                    });
                                }
                                else {
                                    const formattedDate = formatDate(resultsCart[0].ORDER_DATE_TIME);
                                    var wBparams = [
                                        {
                                            "type": "text",
                                            "text": resultsCart[0].CUSTOMER_NAME
                                        },
                                        {
                                            "type": "text",
                                            "text": resultsCart[0].ORDER_NUMBER
                                        },
                                        {
                                            "type": "text",
                                            "text": resultsCart[0].TOTAL_AMOUNT
                                        },
                                        {
                                            "type": "text",
                                            "text": resultsCart[0].ORDER_DATE_TIME
                                        }
                                    ]

                                    var wparams = [
                                        {
                                            "type": "body",
                                            "parameters": wBparams
                                        }
                                    ]

                                    mm.sendWAToolSMS(resultsCart[0].MOBILE_NO, templateName, wparams, 'en', (error, resultswsms) => {
                                        if (error) {
                                            console.log(error)
                                        }
                                        else {
                                            console.log("Successfully send SMS", resultswsms)
                                        }
                                    })
                                    let dataResult = JSON.stringify(results);
                                    mm.sendNotificationToAdmin(8, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", "N", supportKey, "O", req.body);
                                    var module = ''
                                    if (TYPE == 'S') {
                                        var TOPIC_NAME = `territory_${TERRITORYID}_admin_channel`
                                        mm.sendDynamicEmail(21, results[0][0].NEW_ORDER_ID, supportKey)
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", supportKey, "", "O", req.body);
                                        const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created a order.`;
                                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: results[0][0].NEW_ORDER_ID, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Order placed successfully", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                                        module = technicianActionLog
                                    } else {
                                        mm.sendDynamicEmail(18, results[0][0].NEW_ORDER_ID, supportKey)
                                        var TOPIC_NAME = `territory_${TERRITORYID}_admin_channel`
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", supportKey, "", "SH", req.body);
                                        var TOPIC_NAME = `territory_warehouse_${TERRITORYID}_channel`
                                        mm.sendNotificationToChannel(req.body.authData.data.UserData[0].USER_ID, TOPIC_NAME, "Order Created", `Hello Admin, a new order has been created by ${req.body.authData.data.UserData[0].USER_NAME}, kindly take action over it`, "", "TA", supportKey, "", "SH", req.body);
                                        const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created a order.`;
                                        logdata = { ORDER_ID: results[0][0].NEW_ORDER_ID, DATE_TIME: mm.getSystemDate(), CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Order placed successfully", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: paymentMetod, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                                        module = shopActionLog
                                    }
                                    dbm.saveLog(logdata, module)
                                    mm.commitConnection(connection);
                                    res.send({
                                        "code": 200,
                                        "message": "Order created successfully...",
                                    });
                                }

                            } else {
                                mm.rollbackConnection(connection);
                                res.send({
                                    "code": 200,
                                    "message": "Order created successfully...",
                                });
                            }
                        }
                    });
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, cartid, paymentMethod ",
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

exports.getSlots = (req, res) => {
    try {

        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const TERRITORY_ID = req.body.TERRITORY_ID;

        var supportKey = req.headers['supportkey'];

        if (CUSTOMER_ID && TERRITORY_ID) {

            mm.executeQueryData(`select ID, CUSTOMER_TYPE from customer_master where ID = ?; `, [CUSTOMER_ID], supportKey, (error, resultsCustomer) => {
                if (error) {

                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get slots."
                    });
                }
                else {
                    if (resultsCustomer.length > 0) {
                        var data = [];
                        var filter = resultsCustomer[0].CUSTOMER_TYPE == 'B' ? ` AND(MAPPING_FOR = 'C' and MAPPING_ID = ? )   ` : ` and(MAPPING_FOR = 'T' and MAPPING_ID = ? )  `;

                        resultsCustomer[0].CUSTOMER_TYPE == 'B' ? data.push(CUSTOMER_ID) : data.push(TERRITORY_ID);

                        mm.executeQueryData(`select * from view_global_time_slots_mapping where 1 ` + filter, data, supportKey, (error, resultsSlots) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get slots."
                                });
                            }
                            else {
                                if (resultsSlots.length > 0) {
                                    res.send({
                                        "code": 200,
                                        "message": "Slots fetched successfully...",
                                        "data": resultsSlots
                                    });
                                }
                                else {
                                    res.send({
                                        "code": 200,
                                        "message": "No slots available...",
                                        "data": []
                                    });
                                }
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "Invalid Customer ID",
                        });
                    }
                }
            });
        }
        else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, territoryID",
            });
        }
    }
    catch (error) {
        console.log("Error in getSlots :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.getCouponList = (req, res) => {
    try {

        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        const COUNTRY_ID = req.body.COUNTRY_ID;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';

        var supportKey = req.headers['supportkey'];

        if (CUSTOMER_ID && CART_ID && COUNTRY_ID && TYPE) {
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `SELECT ID AS COUPON_ID, NAME AS COUPON_NAME, COUPON_CODE, COUPON_VALUE_TYPE, COUPON_VALUE FROM coupon_master a WHERE ID IN(SELECT COUPON_ID FROM view_coupon_code_service_mapping a where STATUS = 1 AND COUPON_STATUS = 1 AND COUNTRY_ID = ? and SERVICE_ID in (select SERVICE_ID from view_cart_item_details where CART_ID = ?)) and CURRENT_TIMESTAMP >= START_DATE and CURRENT_TIMESTAMP <= EXPIRY_DATE AND MAX_USES_COUNT > (select IFNULL(count(ID), 0) from coupon_transactions where COUPON_ID = a.ID and CART_ID in (select ID from cart_master where STATUS IN('O') and CUSTOMER_ID = ? ) and STATUS = 'A') AND PERUSER_MAX_COUNT > (select IFNULL(COUNT(ID), 0) FROM cart_master WHERE COUPON_ID = a.ID and STATUS = 'O' AND CUSTOMER_ID = ? ) AND MIN_CART_AMOUNT <= (SELECT  TOTAL_AMOUNT FROM cart_master  WHERE ID = ?)`;
                qdata = [COUNTRY_ID, CART_ID, CUSTOMER_ID, CUSTOMER_ID, CART_ID];
            } else {
                Queryz = `SELECT ID AS COUPON_ID, NAME AS COUPON_NAME, COUPON_CODE, COUPON_VALUE_TYPE, COUPON_VALUE FROM coupon_master a WHERE ID IN(SELECT COUPON_ID FROM view_coupon_code_inventory_mapping a where STATUS = 1 AND COUPON_STATUS = 1 AND COUNTRY_ID = ? and INVENTORY_ID in (select INVENTORY_ID from view_cart_item_details where CART_ID = ? and ITEM_TYPE = 'P')) and CURRENT_TIMESTAMP >= START_DATE and CURRENT_TIMESTAMP <= EXPIRY_DATE AND MAX_USES_COUNT > (select IFNULL(count(ID), 0) from coupon_transactions where COUPON_ID = a.ID and CART_ID in (select ID from cart_master where STATUS IN('O') and CUSTOMER_ID = ? ) and STATUS = 'A') AND PERUSER_MAX_COUNT > (select IFNULL(COUNT(ID), 0) FROM cart_master WHERE COUPON_ID = a.ID and STATUS = 'O' AND CUSTOMER_ID = ? ) AND MIN_CART_AMOUNT <= (SELECT  TOTAL_AMOUNT FROM cart_master  WHERE ID = ?)`;
                qdata = [COUNTRY_ID, CART_ID, CUSTOMER_ID, CUSTOMER_ID, CART_ID];
            }

            mm.executeQueryData(Queryz, qdata, supportKey, (error, resultsCoupon) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get coupon list."
                    });
                }
                else {
                    if (resultsCoupon.length > 0) {
                        res.send({
                            "code": 200,
                            "message": "Coupon list fetched successfully...",
                            "data": resultsCoupon
                        });
                    }
                    else {
                        res.send({
                            "code": 200,
                            "message": "No coupon available...",
                            "data": []
                        });
                    }

                }
            });
        }
        else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID",
            });
        }
    }
    catch (error) {
        console.log("Error in getCouponList :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.applyCoupon = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const COUNTRY_ID = req.body.COUNTRY_ID;
        const CART_ID = req.body.CART_ID;
        const COUPON_CODE = req.body.COUPON_CODE;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID && CART_ID && COUPON_CODE && COUNTRY_ID && TYPE) {
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spValidateCoupon(?,?,?,?)`;
                qdata = [COUPON_CODE, CUSTOMER_ID, CART_ID, COUNTRY_ID];
            } else {
                Queryz = `call spValidateCoupon_shop(?,?,?,?)`;
                qdata = [COUPON_CODE, CUSTOMER_ID, CART_ID, COUNTRY_ID];
            }

            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to apply coupon..."
                    });
                }
                else {
                    var ACTION_DETAILS = '';
                    var logdata = {};
                    var module = ''
                    if (TYPE == 'S') {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has applied a coupon.`;
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon applied", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                        module = technicianActionLog
                    } else {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has applied a coupon.`;
                        logdata = { ORDER_ID: 0, CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon applied", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: null, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                        module = shopActionLog
                    }

                    dbm.saveLog(logdata, module)
                    if (results && results[0][0].status_code == 200) {
                        res.send({
                            "code": 200,
                            "message": "Coupon applied successfully...",
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": results[0][0].coupon_status,
                        });
                    }
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, cartid, couponCode",
            });
        }
    } catch (error) {
        console.log("Error in applyCoupon :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.removeCoupon = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        const COUPON_CODE = req.body.COUPON_CODE;
        const TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID && CART_ID && COUPON_CODE && TYPE) {
            var Queryz = '';
            var qdata = [];

            if (TYPE == 'S') {
                Queryz = `call spCancelCoupon(?,?,?)`;
                qdata = [CUSTOMER_ID, COUPON_CODE, CART_ID];
            } else {
                Queryz = `call spCancelCoupon_shop(?,?,?)`;
                qdata = [CUSTOMER_ID, COUPON_CODE, CART_ID];
            }

            mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to remove coupon..."
                    });
                }
                else {
                    var ACTION_DETAILS = '';
                    var logdata = {};
                    if (TYPE == 'S') {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has removed a coupon.`
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon removed", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                    } else {
                        ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].NAME} has removed a coupon.`
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Cart', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Coupon removed", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                    }

                    dbm.saveLog(logdata, technicianActionLog)
                    res.send({
                        "code": 200,
                        "message": "Coupon removed successfully...",
                    });
                }
            }
            );
        }
        else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, cartid",
            });
        }
    }
    catch (error) {
        console.log("Error in removeCoupon :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.updateAddress = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const ADDRESS_ID = req.body.ADDRESS_ID;
        const CART_ID = req.body.CART_ID;
        const NEW_TERRITORY_ID = req.body.NEW_TERRITORY_ID
        const OLD_TERRITORY_ID = req.body.OLD_TERRITORY_ID
        const TYPE = req.body.TYPE

        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID && ADDRESS_ID && CART_ID && (NEW_TERRITORY_ID || NEW_TERRITORY_ID == 0) && (OLD_TERRITORY_ID || OLD_TERRITORY_ID == 0) && TYPE) {
            if (TYPE == "S") {
                if (NEW_TERRITORY_ID == OLD_TERRITORY_ID) {
                    mm.executeQueryData(`update cart_master set ADDRESS_ID = ?, CREATED_MODIFIED_DATE = ? where ID = ? `, [ADDRESS_ID, systemDate, CART_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to update address..."
                            });
                        }
                        else {
                            const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated an address.`;
                            logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Address', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Address updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                            console.log("\n\n Your old address territory id and new address territory id is same hence update address id");

                            dbm.saveLog(logdata, technicianActionLog)
                            res.send({
                                "code": 200,
                                "message": "Address updated successfully...",
                            });
                        }
                    });
                } else {
                    mm.executeQueryData(`update cart_master set STATUS = ?, CREATED_MODIFIED_DATE = ? where ID = ? `, ["D", systemDate, CART_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to update address..."
                            });
                        }
                        else {
                            const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated an address.`;
                            logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Address', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Address updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                            console.log("\n\n Your cart has been discarded due to an address change. Please add the items again.");
                            dbm.saveLog(logdata, technicianActionLog)
                            res.send({
                                "code": 200,
                                "message": "Your cart has been discarded due to an address change. Please add the items again.",
                            });
                        }
                    });
                }
            } else {
                mm.executeQueryData(`update cart_master set ADDRESS_ID = ?, CREATED_MODIFIED_DATE = ? where ID = ? `, [ADDRESS_ID, systemDate, CART_ID], supportKey, (error, results) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to update address..."
                        });
                    }
                    else {
                        const ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has updated an address.`;
                        logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Address', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Address updated", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }

                        dbm.saveLog(logdata, technicianActionLog)
                        res.send({
                            "code": 200,
                            "message": "Address updated successfully...",
                        });
                    }
                });
            }
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, addressID, addressType, address,TYPE ,OLD_TERRITORY_ID, NEW_TERRITORY_ID",
            });
        }
    }
    catch (error) {
        console.log("Error in updateAddress :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}

exports.discardCart = (req, res) => {
    try {
        const CUSTOMER_ID = req.body.CUSTOMER_ID;
        const CART_ID = req.body.CART_ID;
        var TYPE = req.body.TYPE ? req.body.TYPE : 'S';
        var supportKey = req.headers['supportkey'];
        var systemDate = mm.getSystemDate();

        if (CUSTOMER_ID && CART_ID && TYPE) {
            var Queryz = '';
            var qdata = [];
            mm.executeQueryData(`select  TYPE FROM cart_master where ID =  ? `, [CART_ID], supportKey, (error, resultste) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to discard cart..."
                    });
                }
                else {
                    if (resultste.length > 0) {
                        TYPE = resultste[0].TYPE;
                        if (TYPE == 'S') {
                            Queryz = `call spDiscardTempCart(?,?); `;
                            qdata = [CART_ID, CUSTOMER_ID];
                        } else {
                            var Queryz = `call spDiscardTempCart_shop(?,?); `;
                            qdata = [CART_ID, CUSTOMER_ID]
                        }
                        mm.executeQueryData(Queryz, qdata, supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to discard cart..."
                                });
                            }
                            else {
                                var module = ''
                                var logdata = ''
                                var ACTION_DETAILS = ''
                                if (TYPE == 'S') {

                                    ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created an order for a service.`;
                                    logdata = { TECHNICIAN_ID: 0, VENDOR_ID: 0, ORDER_ID: 0, JOB_CARD_ID: 0, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: req.body.authData.data.UserData[0].USER_ID, TECHNICIAN_NAME: null, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Order placed successfully", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: null, TASK_DESCRIPTION: null, ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, DATE_TIME: systemDate, supportKey: 0 }
                                    module = technicianActionLog
                                } else {
                                    ACTION_DETAILS = `Customer ${req.body.authData.data.UserData[0].USER_NAME} has created an order for a shop.`;
                                    logdata = { ORDER_ID: 0, DATE_TIME: mm.getSystemDate(), CUSTOMER_ID: CUSTOMER_ID, DATE_TIME: systemDate, LOG_TYPE: 'order', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, CLIENT_ID: 1, USER_ID: req.body.authData.data.UserData[0].USER_ID, ORDER_DATE_TIME: null, CART_ID: CART_ID, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Order placed successfully", TOTAL_AMOUNT: 0, ORDER_NUMBER: null, PAYMENT_MODE: paymentMetod, PAYMENT_STATUS: null, USER_NAME: req.body.authData.data.UserData[0].USER_NAME, EXPECTED_PREAPARATION_DATETIME: null, EXPECTED_PACKAGING_DATETIME: null, EXPECTED_DISPATCH_DATETIME: null, ACTUAL_PREAPARATION_DATETIME: null, ACTUAL_PACKAGING_DATETIME: null, ACTUAL_DISPATCH_DATETIME: null }
                                    module = shopActionLog
                                }
                                dbm.saveLog(logdata, module)
                                res.send({
                                    "code": 200,
                                    "message": "Cart discarded successfully...",
                                });
                            }
                        });
                    }
                    else {
                        res.send({
                            "code": 400,
                            "message": "Invalid cart"
                        });
                    }
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- customerID, cartid",
            });
        }
    } catch (error) {
        console.log("Error in discardCart :- ", error)
        res.send({
            "code": 400,
            "message": "Something went wrong, Please try again ."
        });
    }
}