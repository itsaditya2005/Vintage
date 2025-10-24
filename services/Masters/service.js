const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const fs = require('fs');
const path = require('path');
const servicelog = require("../../modules/serviceLog")
const systemLog = require("../../modules/systemLog")
const globalData = require("../../modules/globalData");
const dbm = require('../../utilities/dbMongo');


const applicationkey = process.env.APPLICATION_KEY;

var serviceMaster = "service_master";
var viewserviceMaster = "view_" + serviceMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        SUB_CATEGORY_ID: req.body.SUB_CATEGORY_ID,
        B2B_PRICE: req.body.B2B_PRICE,
        B2C_PRICE: req.body.B2C_PRICE,
        EXPRESS_COST: req.body.EXPRESS_COST,
        DURARTION_HOUR: req.body.DURARTION_HOUR,
        DURARTION_MIN: req.body.DURARTION_MIN,
        SERVICE_IMAGE: req.body.SERVICE_IMAGE,
        STATUS: req.body.STATUS ? "1" : "0",
        UNIT_ID: req.body.UNIT_ID,

        SHORT_CODE: req.body.SHORT_CODE,
        MAX_QTY: req.body.MAX_QTY,
        VENDOR_COST: req.body.VENDOR_COST,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST,
        TAX_ID: req.body.TAX_ID,

        DETAILS_DESIGNER: req.body.DETAILS_DESIGNER,
        IS_EXPRESS: req.body.IS_EXPRESS ? "1" : "0",
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        IS_NEW: req.body.IS_NEW ? "1" : "0",
        PARENT_ID: req.body.PARENT_ID,
        IS_PARENT: req.body.IS_PARENT ? "1" : "0",
        CLIENT_ID: req.body.CLIENT_ID,
        ORG_ID: req.body.ORG_ID,
        QTY: req.body.QTY,
        SERVICE_TYPE: req.body.SERVICE_TYPE,
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        IS_FOR_B2B: req.body.IS_FOR_B2B,
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_HTML_URL: req.body.SERVICE_HTML_URL,
        IS_JOB_CREATED_DIRECTLY: req.body.IS_JOB_CREATED_DIRECTLY ? '1' : '0',
        CREATED_DATE: req.body.CREATED_DATE,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,
        SERVICE_DETAILS_IMAGE: req.body.SERVICE_DETAILS_IMAGE,
        WARRANTY_ALLOWED: req.body.WARRANTY_ALLOWED,
        GUARANTEE_ALLOWED: req.body.GUARANTEE_ALLOWED,
        WARRANTY_PERIOD: req.body.WARRANTY_PERIOD,
        GUARANTEE_PERIOD: req.body.GUARANTEE_PERIOD



    }

    return data;
}

function reqDataB2b(req) {

    var data = {
        CUSTOMER_ID: req.body.CUSTOMER_ID,
        SERVICE_ID: req.body.SERVICE_ID,
        IS_AVAILABLE: req.body.IS_AVAILABLE ? '1' : '0',
        START_TIME: req.body.START_TIME,
        END_TIME: req.body.END_TIME,
        B2B_PRICE: req.body.B2B_PRICE ? req.body.B2B_PRICE : 0,
        B2C_PRICE: req.body.B2C_PRICE ? req.body.B2C_PRICE : 0,
        TECHNICIAN_COST: req.body.TECHNICIAN_COST ? req.body.TECHNICIAN_COST : 0,
        VENDOR_COST: req.body.VENDOR_COST ? req.body.VENDOR_COST : 0,
        EXPRESS_COST: req.body.EXPRESS_COST ? req.body.EXPRESS_COST : 0,
        CATEGORY_NAME: req.body.CATEGORY_NAME,
        SUB_CATEGORY_NAME: req.body.SUB_CATEGORY_NAME,
        IS_EXPRESS: req.body.IS_EXPRESS ? '1' : '0',
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        SERVICE_IMAGE: req.body.SERVICE_IMAGE,
        SERVICE_TYPE: req.body.SERVICE_TYPE,
        PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
        PREPARATION_HOURS: req.body.PREPARATION_HOURS,
        HSN_CODE_ID: req.body.HSN_CODE_ID,
        HSN_CODE: req.body.HSN_CODE,

        CLIENT_ID: req.body.CLIENT_ID

    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('SERVICE_ID').isInt().optional(),
        body('ITEM_CODE').optional(),
        body('UNIT_ID').optional(),
        body('SEQ_NO').isInt().optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewserviceMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewserviceMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceItem information."
                            });
                        }
                        else {
                            // let data1 = ''
                            // // const filePath = path.join('uploads/ServiceHtml', results[0].SERVICE_HTML_CONTENT).toString()
                            // if (results[0].SERVICE_HTML_URL != null) {
                            //     const filePath = `uploads/ServiceHtml/${results[0].SERVICE_HTML_URL}`
                            //     data1 = fs.readFileSync(filePath, 'utf-8')
                            // } else {
                            //     data1 = null
                            // }

                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 89,
                                "count": results1[0].cnt,
                                "data": results,
                                // "FILE_CONTENT": data1
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


exports.getPoppulerServices = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let TERRITORY_ID = 0; //req.params.TERRITORY_ID ? req.params.TERRITORY_ID : 0;
    let CUSTOMER_ID = 0; //req.params.CUSTOMER_ID ? req.params.CUSTOMER_ID : 0;
    let CUSTOMER_TYPE = req.params.CUSTOMER_TYPE ? req.params.CUSTOMER_TYPE : "";

    if (CUSTOMER_TYPE == 'I') {
        TERRITORY_ID = req.params.TERRITORY_ID;
    }
    else {
        CUSTOMER_ID = req.params.TERRITORY_ID;
    }


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
        console.log("\n\n\n\n\nTERRITORY_ID", TERRITORY_ID);
        if (IS_FILTER_WRONG == "0" && (TERRITORY_ID != '' || CUSTOMER_ID != '') && (CUSTOMER_TYPE == 'I' || CUSTOMER_TYPE == 'B')) {


            var Queryz = ``;
            var dataz = [];

            if (CUSTOMER_TYPE == 'I') {
                Queryz = 'select count(*) as cnt from ' + viewserviceMaster + ' where 1 AND PARENT_ID=0 AND ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) AND  ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ?  and IS_AVAILABLE = 1 ) ' + countCriteria;
                dataz = [TERRITORY_ID];
            } else {
                Queryz = 'select count(*) as cnt from ' + viewserviceMaster + ' where 1 AND PARENT_ID=0 AND ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) AND  ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where  CUSTOMER_ID = ?  and IS_AVAILABLE = 1 ) ' + countCriteria;
                dataz = [CUSTOMER_ID];
            }

            mm.executeQueryData(Queryz, dataz, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {

                    var Queryzz = ``;
                    var datazz = [];

                    if (CUSTOMER_TYPE == 'I') {
                        Queryzz = `select * from ${viewserviceMaster} where 1 AND PARENT_ID=0 AND ID IN (SELECT DISTINCT SERVICE_ITEM_ID FROM order_details)  AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ?  and IS_AVAILABLE = 1 ) ` + criteria
                        datazz = [TERRITORY_ID];
                    } else {
                        Queryzz = `select * from ${viewserviceMaster} where 1 AND PARENT_ID=0 AND ID IN (SELECT DISTINCT SERVICE_ITEM_ID FROM order_details)  AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ?  and IS_AVAILABLE = 1 ) ` + criteria
                        datazz = [CUSTOMER_ID];
                    }

                    mm.executeQueryData(Queryzz, datazz, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get serviceItem information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 89,
                                "count": results1[0].cnt,
                                "data": results,
                            });
                        }
                    });
                }
            });
        }
        else {
            console.log("\n\n\n\n\n\nasdasdsadjasdkjhashjsad");

            res.status(400).send({
                message: "Invalid filter parameter or territory id or customerId"
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.getPoppulerServicesForWebOLD = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.query.pageIndex ? req.query.pageIndex : '';
    var pageSize = req.query.pageSize ? req.query.pageSize : '';
    let sortKey = req.query.sortKey ? req.query.sortKey : 'ID';
    let sortValue = req.query.sortValue ? req.query.sortValue : 'DESC';
    let filter = req.query.filter ? req.query.filter : '';
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    let TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';
    let CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : '';
    let customerCategoryType = req.body.CUSTOMER_TYPE ? req.body.CUSTOMER_TYPE : "I";

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
        let customerFilter = '';
        if (CUSTOMER_ID) {
            customerFilter = ` AND CUSTOMER_ID = ${CUSTOMER_ID}`
        }
        if (IS_FILTER_WRONG == "0" && TERRITORY_ID != '') {
            mm.executeQueryData('select count(*) as cnt from ' + viewserviceMaster + ' where 1 AND ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) AND  ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ?  and IS_AVAILABLE = 1 ) ' + countCriteria, [TERRITORY_ID], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {
                    let Query = ` SELECT
                    S.*,
                    0 AS QUANTITY,
                    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS KEY_PRICE,
                    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
                    COALESCE(T.ID, NULL) AS MAPPING_ID,
                    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
                    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
                    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
                    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
                    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
                    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
                    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
                    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
                    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
                    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
                    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
                    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
                    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
                    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
                    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
                    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
                    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
                    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
                    S.CATEGORY_NAME,
                    S.SUB_CATEGORY_NAME,
                    S.IS_JOB_CREATED_DIRECTLY,
                    0 AS CHILD_COUNT,
                    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S" AND CART_STATUS = "C" ORDER BY S.ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
                FROM
                    view_service_master S
                JOIN
                    territory_service_non_availability_mapping T 
                    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${TERRITORY_ID}
                WHERE
                    S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE = 1 AND S.IS_PARENT = 0 AND S.ID IN (SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) AND S.ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERRITORY_ID = ${TERRITORY_ID} AND IS_AVAILABLE = 1) ${filter}
                UNION ALL
                SELECT
                    S.*,
                    0 AS QUANTITY,
                    NULL AS KEY_PRICE,
                    NULL AS TERRITORY_ID,
                    NULL AS MAPPING_ID,
                    NULL AS START_TIME,
                    NULL AS END_TIME,
                    NULL AS IS_AVAILABLE,
                    NULL AS B2B_PRICE,
                    NULL AS B2C_PRICE,
                    NULL AS TECHNICIAN_COST,
                    NULL AS VENDOR_COST,
                    NULL AS EXPRESS_COST,
                    NULL AS IS_EXPRESS,
                    NULL AS DESCRIPTION,
                    NULL AS SERVICE_IMAGE,
                    NULL AS CREATED_MODIFIED_DATE,
                    NULL AS READ_ONLY,
                    NULL AS ARCHIVE_FLAG,
                    NULL AS CLIENT_ID,
                    NULL AS T_SERVICE_TYPE,
                    NULL AS T_PREPARATION_MINUTES,
                    NULL AS T_PREPARATION_HOURS,
                    S.CATEGORY_NAME,
                    S.SUB_CATEGORY_NAME,
                    S.IS_JOB_CREATED_DIRECTLY,
                    (SELECT COUNT(ID) FROM service_master WHERE PARENT_ID = S.ID AND STATUS = 1 AND S.ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERRITORY_ID = ${TERRITORY_ID} AND IS_AVAILABLE = 1) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) AS CHILD_COUNT,
                    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S" AND CART_STATUS = "C" ORDER BY S.ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
                FROM
                    view_service_master S
                WHERE
                    S.PARENT_ID = 0
                    AND EXISTS (
                        SELECT 1
                        FROM
                            view_service_master Sub
                        JOIN
                            territory_service_non_availability_mapping T 
                            ON Sub.ID = T.SERVICE_ID
                        WHERE
                            Sub.PARENT_ID = S.ID
                            AND T.TERRITORY_ID = ${TERRITORY_ID}  AND T.IS_AVAILABLE = 1  AND S.ID IN (SELECT DISTINCT SERVICE_ITEM_ID FROM order_details)  AND Sub.ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERRITORY_ID = ${TERRITORY_ID} AND IS_AVAILABLE = 1) ${filter} 
                            )  AND S.IS_FOR_B2B = 0
                            ORDER BY
                    ID ASC;`;
                    //old Query
                    // select *,IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S"  AND CART_STATUS = "C" ORDER BY ID DESC LIMIT 1),0)>0,1,0) AS IS_ALREADY_IN_CART from ${viewserviceMaster} S where 1 AND ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details)  AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${TERRITORY_ID}  and IS_AVAILABLE = 1 ) ${criteria}
                    mm.executeQueryData(Query, [TERRITORY_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "message": "Failed to get serviceItem information."
                            });
                        }
                        else {
                            res.status(200).send({
                                "message": "success",
                                "TAB_ID": 89,
                                "count": results1[0].cnt,
                                "data": results,
                            });
                        }
                    });
                }
            });
        }
        else {
            console.log("\n\n\n\n\n\nasdasdsadjasdkjhashjsad");

            res.status(400).send({
                message: "Invalid filter parameter or territory id."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.getPoppulerServicesForWeb = (req, res) => {
    try {
        console.log(req.body)
        var teritory_id = req.body.TERRITORY_ID;
        var customer_id = req.body.CUSTOMER_ID;
        var subcategory_id = req.body.SUB_CATEGORY_ID;
        var searchkey = req.body.SEARCHKEY;
        var parentID = req.body.PARENT_ID;
        var customerCategoryType = req.body.CUSTOMER_TYPE ? req.body.CUSTOMER_TYPE : "I";

        var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
        var pageSize = req.body.pageSize ? req.body.pageSize : '';
        let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
        let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';


        // var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
        if (((customerCategoryType == 'I' && teritory_id) || (customerCategoryType != 'I' && customer_id))) {
            var start = 0;
            var end = 0;
            var filter = ` AND S.ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) ` + (parentID ? `AND S.PARENT_ID = ${parentID} ` : ` AND S.PARENT_ID=0 `) + (searchkey ? `AND S.NAME LIKE ${searchkey}` : ``)
            var filterAll = filter + (customerCategoryType == 'I' ? ` AND S.SERVICE_TYPE IN ('C','O')` : ` AND S.SERVICE_TYPE IN ('B','O')`) + ``;
            let criteria = '';
            let countCriteria = filter;

            if (pageIndex != '' && pageSize != '') {
                start = (pageIndex - 1) * pageSize;
                end = pageSize;
            }
            let customerFilter = '';
            if (customer_id) {
                customerFilter = ` AND CUSTOMER_ID = ${customer_id}`
            }

            var dataquery = []
            dataquery.push(teritory_id)
            dataquery.push(subcategory_id)
            parentID ? dataquery.push(parentID) : true;
            searchkey ? dataquery.push(searchkey) : true;

            var keyData = customerCategoryType == 'I' ? 'B2C_PRICE' : 'B2B_PRICE';

            if (pageIndex === '' && pageSize === '')
                criteria = filter + " order by " + sortKey + " " + sortValue;
            else
                criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

            var supportKey = req.headers['supportkey'];

            var deviceid = req.headers['deviceid'];
            let TypeFilter = '';
            if (customerCategoryType == 'I') {
                TypeFilter = ` AND S.ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) AND  S.ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id}  and IS_AVAILABLE = 1 ) ${countCriteria}`;
            } else {
                TypeFilter = ` AND S.ID IN(SELECT DISTINCT SERVICE_ITEM_ID FROM order_details) AND  S.ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where  CUSTOMER_ID = ${customer_id}  and IS_AVAILABLE = 1 ) ${countCriteria}`;
            }

            mm.executeQueryData('select count(*) as cnt from view_service_master S where 1 ' + TypeFilter + countCriteria, dataquery, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get services count.",
                    });
                }
                else {
                    var Query = ``;
                    if (customerCategoryType == 'I') {
                        Query = ` SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S" AND CART_STATUS = "C" ORDER BY S.ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${teritory_id}
WHERE 
     S.IS_FOR_B2B = 0 AND T.IS_AVAILABLE =1 AND S.IS_PARENT = 0  ${filterAll}
UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
    NULL AS KEY_PRICE,
    NULL AS TERRITORY_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
     (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping where TERRITORY_ID = ${teritory_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
     IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S" AND CART_STATUS = "C" ORDER BY S.ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID <> 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN territory_service_non_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.TERRITORY_ID = ${teritory_id}  AND T.IS_AVAILABLE =1   ${filter}
    ) and S.IS_FOR_B2B = 0
ORDER BY 
    ID ASC;`;

                        mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);

                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services information."
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
                    else {
                        Query = `SELECT 
S.*,
    0 AS QUANTITY,
COALESCE(T.${keyData}, S.${keyData}) AS KEY_PRICE,
    COALESCE(T.CUSTOMER_ID, NULL) AS CUSTOMER_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(S.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(S.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS T_SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS T_PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS) AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
        0 as CHILD_COUNT,
        IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S" AND CART_STATUS = "C" ORDER BY S.ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
JOIN 
    b2b_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.CUSTOMER_ID = ${customer_id}
WHERE 
  S.IS_PARENT = 0 AND T.IS_AVAILABLE =1  ${filterAll}

UNION ALL

SELECT 
S.*,
    0 AS QUANTITY,
    NULL AS KEY_PRICE,
    NULL AS CUSTOMER_ID,
    NULL AS MAPPING_ID,
    NULL AS START_TIME,
    NULL AS END_TIME,
    NULL AS IS_AVAILABLE,
    NULL AS B2B_PRICE,
    NULL AS B2C_PRICE,
    NULL AS TECHNICIAN_COST,
    NULL AS VENDOR_COST,
    NULL AS EXPRESS_COST,
    NULL AS IS_EXPRESS,
    NULL AS DESCRIPTION,
    NULL AS SERVICE_IMAGE,
    NULL AS CREATED_MODIFIED_DATE,
    NULL AS READ_ONLY,
    NULL AS ARCHIVE_FLAG,
    NULL AS CLIENT_ID,
    NULL AS T_SERVICE_TYPE,
    NULL AS T_PREPARATION_MINUTES,
    NULL AS T_PREPARATION_HOURS,
    S.CATEGORY_NAME,
    S.SUB_CATEGORY_NAME,
    S.IS_JOB_CREATED_DIRECTLY,
    (select count(ID) FROM service_master where PARENT_ID = S.ID and STATUS = 1 AND ID IN (SELECT SERVICE_ID FROM b2b_availability_mapping where CUSTOMER_ID = ${customer_id} and IS_AVAILABLE = 1 ) ${(customerCategoryType == 'I' ? " AND SERVICE_TYPE IN ('C','O')" : " AND SERVICE_TYPE IN ('B','O')")}) as CHILD_COUNT,
    IF(IFNULL((SELECT SERVICE_ID FROM view_cart_item_details WHERE SERVICE_ID = S.ID ${customerFilter} AND TYPE = "S" AND CART_STATUS = "C" ORDER BY S.ID DESC LIMIT 1), 0) > 0, 1, 0) AS IS_ALREADY_IN_CART
FROM 
    view_service_master S
WHERE 
    S.PARENT_ID <> 0
    AND EXISTS (
        SELECT 1
        FROM view_service_master Sub
        JOIN b2b_availability_mapping T 
            ON Sub.ID = T.SERVICE_ID 
        WHERE 
            Sub.PARENT_ID = S.ID
            AND T.CUSTOMER_ID = ${customer_id} AND T.IS_AVAILABLE =1 
    ) ${filter}
ORDER BY 
    ID ASC;`
                        mm.executeQueryData(`${Query}`, [], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);

                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get services information."
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
                }
            });
        } else {
            res.send({
                "code": 400,
                "message": "parameter missing- teritory_id, subcategory_id ."
            });
        }
    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}



exports.getData = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    let ID = req.body.ID
    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);


    var start = 0;
    var end = 0;
    let criteria = '';
    let countCriteria = filter;

    if (pageIndex != '' && pageSize != '') {
        start = (pageIndex - 1) * pageSize;
        end = pageSize;
    }

    if (!ID) {
        res.send({
            code: 400,
            message: "ID is required."
        })
        return;
    }

    if (pageIndex === '' && pageSize === '')
        criteria = filter + " order by " + sortKey + " " + sortValue;
    else
        criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
    try {
        if (IS_FILTER_WRONG == "0") {
            mm.executeQueryData('select count(*) as cnt from ' + viewserviceMaster + ' where 1 AND  ID=? ' + countCriteria, [ID], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewserviceMaster + ' where 1 AND  ID=? ' + criteria, [ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceItem information."
                            });
                        }
                        else {
                            let data1 = ''
                            // console.log('results[0].SERVICE_HTML_URL', results[0].SERVICE_HTML_URL)
                            // // const filePath = path.join('uploads/ServiceHtml', results[0].SERVICE_HTML_CONTENT).toString()
                            // if (results[0].SERVICE_HTML_URL != null) {
                            //     const filePath = `uploads/ServiceHtml/${results[0].SERVICE_HTML_URL}`
                            //     data1 = fs.readFileSync(filePath, 'utf-8')
                            // } else {
                            //     data1 = null
                            // }
                            results[0].FILE_CONTENT = data1
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 89,
                                "count": results1[0].cnt,
                                "data": results,
                                // "FILE_CONTENT": data1
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


exports.create = async (req, res) => {
    var data = reqData(req);
    var dataB2b = reqDataB2b(req);
    var TERRITORY_ID = req.body.TERRITORY_ID;
    var SERVICE_SKILLS = req.body.SERVICE_SKILLS;
    var UNIT_NAME = req.body.UNIT_NAME
    var TAX_NAME = req.body.TAX_NAME
    const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
    const CATEGORY_NAME = req.body.CATEGORY_NAME;
    const errors = validationResult(req);
    var supportKey = req.headers['supportkey'];
    var systemDate = mm.getSystemDate();
    const fileName = `${data.NAME.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`; const filePath = path.join('uploads/ServiceHtml', fileName);
    data.SERVICE_HTML_URL = fileName;
    console.log("\n\n\n req body:", data)
    if (!errors.isEmpty()) {
        console.log(errors);
        return res.send({
            code: 422,
            message: errors.errors
        });
    }
    try {
        const connection = mm.openConnection();
        data.CREATED_DATE = systemDate;
        mm.executeDML('SELECT SHORT_CODE FROM ' + serviceMaster + ' WHERE SHORT_CODE = ?', data.SHORT_CODE, supportKey, connection, (error, resultsCheck) => {
            if (error) {
                console.log(error);
                mm.rollbackConnection(connection);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                res.send({
                    "code": 400,
                    "message": "Failed to save service information..."
                });
            }
            else if (resultsCheck.length > 0) {
                mm.rollbackConnection(connection);
                return res.send({
                    "code": 300,
                    "message": "A service with the same short code already exists."
                });
            }
            else {
                mm.executeDML('INSERT INTO ' + serviceMaster + ' SET ?', data, supportKey, connection, (error, results) => {
                    if (error) {
                        mm.rollbackConnection(connection);
                        console.log(error);
                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                        return res.send({
                            code: 400,
                            message: "Failed to save serviceItem information..."
                        });
                    } else {
                        var logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                        var logCategory = data.IS_FOR_B2B == 1 ? "b2bAvailabilityMapping" : "serviceMaster"
                        var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service ${data.NAME}.`;
                        let logData = {
                            "LOG_DATE_TIME": systemDate,
                            "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": logType, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": results.insertId, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID, "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
                            "SUB_CATEGORY_ID": data.SUB_CATEGORY_ID, "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST,
                            "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                            "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": data.DURARTION_HOUR, "DURATION_MIN": data.DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                            "UNIT_ID": data.UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": data.SHORT_CODE, "MAX_QTY": data.MAX_QTY, "TAX_ID": data.TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                            "END_TIME": data.END_TIME, "IS_NEW": data.IS_NEW, "PARENT_ID": data.PARENT_ID, "IS_PARENT": data.IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": data.IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": data.IS_JOB_CREATED_DIRECTLY, "IS_AVAILABLE": 1, "ORG_ID": data.ORG_ID, "QTY": data.QTY, "STATUS": data.STATUS, "CLIENT_ID": 1, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE,
                            "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE, "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED, "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED, "WARRANTY_PERIOD": data.WARRANTY_PERIOD, "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD
                        }
                        let actionLog = {
                            "SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                        }
                        dbm.saveLog(logData, servicelog)
                        if (data.IS_FOR_B2B == 1) {
                            dataB2b.SERVICE_ID = results.insertId;
                            mm.executeDML('INSERT INTO b2b_availability_mapping SET ?', dataB2b, supportKey, connection, (error, resultsB2b) => {
                                if (error) {
                                    mm.rollbackConnection(connection);
                                    console.log(error);
                                    logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                    return res.status(400).json({
                                        code: 400,
                                        message: "Failed to save b2bAvailabilityMapping information..."
                                    });
                                } else {
                                    addGlobalData(resultsB2b.insertId, "B2B", supportKey)
                                    if (SERVICE_SKILLS) {
                                        let Skills = SERVICE_SKILLS.map(skill => [results.insertId, skill, 1, 'M', 1]);
                                        mm.executeDML('INSERT INTO service_skill_mapping(SERVICE_ID, SKILL_ID, IS_ACTIVE, STATUS, CLIENT_ID) VALUES ?', [Skills], supportKey, connection, (error) => {
                                            if (error) {
                                                mm.rollbackConnection(connection);
                                                console.log(error);
                                                logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                                return res.status(400).json({
                                                    code: 400,
                                                    message: "Failed to save service skill mapping..."
                                                });
                                            } else {
                                                mm.commitConnection(connection);
                                                return res.send({
                                                    code: 200,
                                                    message: "ServiceItem information created and logged successfully."
                                                });
                                            }
                                        });
                                    } else {
                                        mm.commitConnection(connection);
                                        return res.send({
                                            code: 200,
                                            message: "ServiceItem information created and logged successfully."
                                        });
                                    }
                                }
                            });
                        } else {
                            addGlobalData(results.insertId, "MAIN", supportKey)
                            if (SERVICE_SKILLS) {
                                let Skills = SERVICE_SKILLS.map(skill => [results.insertId, skill, 1, 'M', 1]);
                                mm.executeDML('INSERT INTO service_skill_mapping(SERVICE_ID, SKILL_ID, IS_ACTIVE, STATUS, CLIENT_ID) VALUES ?', [Skills], supportKey, connection, (error) => {
                                    if (error) {
                                        mm.rollbackConnection(connection);
                                        console.log(error);
                                        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
                                        return res.status(400).json({
                                            code: 400,
                                            message: "Failed to save service skill mapping..."
                                        });
                                    } else {
                                        mm.commitConnection(connection);
                                        return res.send({
                                            code: 200,
                                            message: "ServiceItem information created and logged successfully."
                                        });
                                    }
                                });
                            } else {
                                mm.commitConnection(connection);
                                return res.send({
                                    code: 200,
                                    message: "ServiceItem information created and logged successfully."
                                });
                            }
                        }
                        //     }
                        // });
                    }
                });
            }
        })
    } catch (error) {
        logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
        console.log(error);
        res.send({
            code: 500,
            message: "Something went wrong."
        });
    }
};


exports.update = (req, res) => {
    const errors = validationResult(req);
    const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
    const CATEGORY_NAME = req.body.CATEGORY_NAME;
    var TERRITORY_ID = req.body.TERRITORY_ID;
    var data = reqData(req);
    const oldservicename = req.body.OLD_SERVICE_NAME
    const FILE_CONTENT = req.body.FILE_CONTENT ? req.body.FILE_CONTENT : null
    var UNIT_NAME = req.body.UNIT_NAME
    var TAX_NAME = req.body.TAX_NAME
    var supportKey = req.headers['supportkey'];
    var criteria = {
        ID: req.body.ID,
    };
    var systemDate = mm.getSystemDate();
    var setData = "";
    var recordData = [];
    Object.keys(data).forEach(key => {
        setData += `${key}= ? , `;
        recordData.push(data[key]);
    });
    if (data.DESCRIPTION == null) {
        setData += `DESCRIPTION = ?, `;
        recordData.push(null);
    }

    if (!errors.isEmpty()) {
        console.log(errors);
        res.send({
            "code": 422,
            "message": errors.errors
        });
    }
    else {
        try {
            const connection = mm.openConnection();
            const serviceName = data.NAME || 'service';
            const oldfileName = `${oldservicename ? oldservicename.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service') : serviceName.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
            const fileName = `${serviceName.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
            const filePath = path.join('uploads/ServiceHtml', fileName);
            const oldfilePath = path.join('uploads/ServiceHtml', oldfileName);
            console.log("\n\nfileName", fileName);
            mm.executeDML('SELECT SHORT_CODE FROM ' + serviceMaster + ' WHERE SHORT_CODE = ? AND ID != ?', [data.SHORT_CODE, criteria.ID], supportKey, connection, (error, resultsCheck) => {
                if (error) {
                    console.log(error);
                    mm.rollbackConnection(connection);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save service information..."
                    });
                }
                else if (resultsCheck.length > 0) {
                    console.log("\n\nresultsCheck", resultsCheck);
                    mm.rollbackConnection(connection);
                    return res.send({
                        "code": 300,
                        "message": "A service with the same short code already exists."
                    });
                }
                else {
                    mm.executeDML(`UPDATE ` + serviceMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}',SERVICE_HTML_URL='${fileName}' where ID = ${criteria.ID} `, recordData, supportKey, connection, (error, results) => {
                        if (error) {
                            mm.rollbackConnection(connection);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            console.log(error);
                            res.send({
                                "code": 400,
                                "message": "Failed to update serviceItem information."
                            });
                        }
                        else {
                            console.log(req.body.authData.data.UserData[0]);
                            var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of ${data.NAME}.`;
                            var logType = data.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                            let logData = {
                                "LOG_DATE_TIME": systemDate,
                                "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": logType, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": criteria.ID, "CUSTOMER_ID": data.CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID, "NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
                                "SUB_CATEGORY_ID": data.SUB_CATEGORY_ID, "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST,
                                "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
                                "IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": data.DURARTION_HOUR, "DURATION_MIN": data.DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS,
                                "UNIT_ID": data.UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": data.SHORT_CODE, "MAX_QTY": data.MAX_QTY, "TAX_ID": data.TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME,
                                "END_TIME": data.END_TIME, "IS_NEW": data.IS_NEW, "PARENT_ID": data.PARENT_ID, "IS_PARENT": data.IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": data.IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": data.IS_JOB_CREATED_DIRECTLY, "IS_AVAILABLE": 1, "ORG_ID": data.ORG_ID, "QTY": data.QTY, "STATUS": data.STATUS, "CLIENT_ID": 1, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE,
                                "SERVICE_DETAILS_IMAGE": data.SERVICE_DETAILS_IMAGE, "WARRANTY_ALLOWED": data.WARRANTY_ALLOWED, "GUARANTEE_ALLOWED": data.GUARANTEE_ALLOWED, "WARRANTY_PERIOD": data.WARRANTY_PERIOD, "GUARANTEE_PERIOD": data.GUARANTEE_PERIOD
                            }
                            let actionLog = {
                                "SOURCE_ID": criteria.ID, "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "serviceMaster", "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
                            }
                            // dbm.saveLog(actionLog, systemLog);
                            dbm.saveLog(logData, servicelog);
                            addGlobalData(criteria.ID, "MAIN", supportKey)
                            mm.commitConnection(connection);
                            return res.send({
                                code: 200,
                                message: "ServiceItem information updated and logged successfully."
                            });
                        }
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


exports.serviceHirarchy = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from ' + viewserviceMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {
                    mm.executeQuery(`SELECT *,(SELECT IFNULL(JSON_ARRAYAGG(JSON_OBJECT('ID', child.ID,'NAME', child.NAME,'DESCRIPTION', child.DESCRIPTION,'SUB_CATEGORY_ID', child.SUB_CATEGORY_ID,'B2B_PRICE', child.B2B_PRICE,'B2C_PRICE', child.B2C_PRICE,'DURATION', CONCAT(child.DURARTION_HOUR, 'h ', child.DURARTION_MIN, 'm'))),JSON_ARRAY()) FROM service_master AS child WHERE child.PARENT_ID = parent.ID )SUB_SERVICES FROM view_service_master AS parent WHERE parent.PARENT_ID IS NULL OR parent.PARENT_ID = 0 ` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceItem information."
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
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

exports.serviceList = (req, res) => {
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
            mm.executeQueryData('select count(*) as cnt from view_service_master where 1 and ID NOT IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERRITORY_ID=?) AND IS_PARENT = 0' + countCriteria, [req.body.TERRITORY_ID], supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {
                    mm.executeQueryData('select * from ' + viewserviceMaster + ' where 1 and ID NOT IN (SELECT SERVICE_ID FROM territory_service_non_availability_mapping WHERE TERRITORY_ID=?) AND IS_PARENT = 0' + criteria, [req.body.TERRITORY_ID], supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceItem information."
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
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.unMappedSkills = (req, res) => {
    var supportKey = req.headers['supportkey'];
    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';
    var SERVICE_ID = req.body.SERVICE_ID;
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
        if (IS_FILTER_WRONG == "0" && SERVICE_ID != '') {
            mm.executeQuery(`select count(*) as cnt from skill_master p where 1 AND ID NOT IN (select SKILL_ID from service_skill_mapping where SERVICE_ID = ${SERVICE_ID})` + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.status(400).send({
                        "code": 400,
                        "message": "Failed to get skill count.",
                    });
                }
                else {
                    mm.executeQuery(`select * from skill_master p where 1 AND ID NOT IN (select SKILL_ID from service_skill_mapping where SERVICE_ID = ${SERVICE_ID})` + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.status(400).send({
                                "code": 400,
                                "message": "Failed to get Skill information."
                            });
                        }
                        else {
                            res.status(200).send({
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
            res.status(400).send({
                code: 400,
                message: "Invalid filter parameter or service id."
            })
        }
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.status(500).send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}


exports.getMappedServices = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    const TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';

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
            const Query = `SELECT
    S.ID AS SERVICE_ID,
    S.NAME,
    COALESCE(T.TERRITORY_ID, NULL) AS TERRITORY_ID,
    COALESCE(T.ID, NULL) AS MAPPING_ID,
    COALESCE(T.START_TIME, S.START_TIME) AS START_TIME,
    COALESCE(T.END_TIME, S.END_TIME) AS END_TIME,
    COALESCE(T.IS_AVAILABLE, 1) AS IS_AVAILABLE,
    COALESCE(T.B2B_PRICE, S.B2B_PRICE) AS B2B_PRICE,
    COALESCE(T.B2C_PRICE, S.B2C_PRICE) AS B2C_PRICE,
    COALESCE(T.TECHNICIAN_COST, S.TECHNICIAN_COST) AS TECHNICIAN_COST,
    COALESCE(T.VENDOR_COST, S.VENDOR_COST) AS VENDOR_COST,
    COALESCE(T.EXPRESS_COST, S.EXPRESS_COST) AS EXPRESS_COST,
    COALESCE(T.IS_EXPRESS, S.IS_EXPRESS) AS IS_EXPRESS,
    COALESCE(T.DESCRIPTION, S.DESCRIPTION) AS DESCRIPTION,
    COALESCE(T.SERVICE_IMAGE, S.SERVICE_IMAGE) AS SERVICE_IMAGE,
    COALESCE(T.CREATED_MODIFIED_DATE, S.CREATED_MODIFIED_DATE) AS CREATED_MODIFIED_DATE,
    COALESCE(T.READ_ONLY, S.READ_ONLY) AS READ_ONLY,
    COALESCE(T.ARCHIVE_FLAG, S.ARCHIVE_FLAG) AS ARCHIVE_FLAG,
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID,
    COALESCE(T.SERVICE_TYPE, S.SERVICE_TYPE) AS SERVICE_TYPE,
    COALESCE(T.PREPARATION_MINUTES, S.PREPARATION_MINUTES) AS PREPARATION_MINUTES,
    COALESCE(T.PREPARATION_HOURS, S.PREPARATION_HOURS)AS PREPARATION_HOURS,
    COALESCE(S.CATEGORY_NAME) AS CATEGORY_NAME,
    COALESCE(S.SUB_CATEGORY_NAME) AS SUB_CATEGORY_NAME
FROM
    view_service_master S
LEFT JOIN 
    territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${TERRITORY_ID}
WHERE 
    S.STATUS = 1 AND S.IS_PARENT=0`
            mm.executeQuery(Query + criteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceCatalog count.",
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
        } else {
            res.send({
                "code": 400,
                "message": "Invalid filter.",
            });
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


exports.getServiceHirechyOLD = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];
        var TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : 0;

        var query = `SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'key', CAST(cm.ID AS CHAR),
        'title', cm.NAME,
        'disabled', CASE
            WHEN NOT EXISTS (
                SELECT 1
                FROM sub_category_master scm
                WHERE scm.CATEGORY_ID = cm.ID
            ) THEN 1
            WHEN NOT EXISTS (
                SELECT 1
                FROM sub_category_master scm
                WHERE scm.CATEGORY_ID = cm.ID
                AND EXISTS (
                    SELECT 1
                    FROM service_master s
                    WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 
                )
            ) THEN 1
            ELSE 0
        END,
        'children', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR)),
                    'title', scm.NAME,
                    'disabled', CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM service_master s
                            WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 
                        ) THEN 1
                        ELSE 0
                    END,
                    'children', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR), '-', CAST(s.ID AS CHAR)),
                                'title', s.NAME,
                                'isLeaf', true
                            )
                        )
                        FROM service_master s
                        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0 AND s.IS_PARENT =0 
                        AND NOT EXISTS (
                            SELECT 1
                            FROM territory_service_non_availability_mapping tsnm
                            WHERE tsnm.SERVICE_ID = s.ID AND tsnm.TERRITORY_ID = ${TERRITORY_ID}
                        )
                    )
                )
            )
            FROM sub_category_master scm
            WHERE scm.CATEGORY_ID = cm.ID
            AND EXISTS (
                SELECT 1
                FROM service_master s
                WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 
            )
        )
    )
) AS categories
FROM category_master cm
WHERE EXISTS (
    SELECT 1
    FROM sub_category_master scm
    WHERE scm.CATEGORY_ID = cm.ID
)
AND EXISTS (
    SELECT 1
    FROM sub_category_master scm
    WHERE scm.CATEGORY_ID = cm.ID
    AND EXISTS (
        SELECT 1
        FROM service_master s
        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 
    )
)
HAVING categories IS NOT NULL`
        // Execute the query
        mm.executeQuery(query, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    code: 400,
                    message: "Failed to get Data",
                });
            } else {
                // Clean up the response to remove any subchildren or servicechildren that have no valid data and treat them as 'children'
                const cleanedResults = results.map(category => {
                    if (category.categories) {
                        category.categories = category.categories.filter(categoryItem => {
                            if (categoryItem.children) {
                                categoryItem.children = categoryItem.children.filter(subchild => {
                                    // For each subchild, we are now consolidating subchildren and servicechildren into children
                                    // Check if servicechildren exists
                                    if (subchild.children && subchild.children.length > 0) {
                                        return true; // Keep subchild if it has servicechildren (now treated as children)
                                    }
                                    return false; // Remove subchild if it has no servicechildren
                                });
                                return categoryItem.children.length > 0; // Keep category item if it has children
                            }
                            return false; // Remove category if it has no valid children
                        });
                    }
                    return category;
                });

                res.send({
                    code: 200,
                    message: "Success",
                    data: cleanedResults,
                });
            }
        });

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
    }
}


exports.b2bserviceList = (req, res) => {
    var supportKey = req.headers['supportkey'];

    var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
    var pageSize = req.body.pageSize ? req.body.pageSize : '';
    let sortKey = req.body.sortKey ? req.body.sortKey : 'ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let filter = req.body.filter ? req.body.filter : '';

    var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
    var CUSTOMER_ID = req.body.CUSTOMER_ID

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
        if (CUSTOMER_ID) {
            if (IS_FILTER_WRONG == "0") {
                mm.executeQueryData(`select count(*) as cnt from view_service_master where 1 and ID NOT IN (SELECT SERVICE_ID FROM b2b_availability_mapping WHERE CUSTOMER_ID=? AND SERVICE_ID IS NOT NULL) AND IS_PARENT = 0 and SERVICE_TYPE in ('B','O') AND CUSTOMER_ID IN (0,${CUSTOMER_ID}) ` + countCriteria, [CUSTOMER_ID], supportKey, (error, results1) => {
                    if (error) {
                        console.log(error);
                        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                        res.send({
                            "code": 400,
                            "message": "Failed to get serviceItem count.",
                        });
                    }
                    else {
                        mm.executeQueryData(`select * from view_service_master where 1 and ID NOT IN (SELECT SERVICE_ID FROM b2b_availability_mapping WHERE CUSTOMER_ID=? AND SERVICE_ID IS NOT NULL) AND IS_PARENT = 0 and SERVICE_TYPE in ('B','O') AND CUSTOMER_ID IN (0,${CUSTOMER_ID}) ` + criteria, [CUSTOMER_ID], supportKey, (error, results) => {
                            if (error) {
                                console.log(error);
                                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                                res.send({
                                    "code": 400,
                                    "message": "Failed to get serviceItem information."
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
        } else {
            res.send({
                code: 400,
                message: "Invalid parameter."
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


exports.getb2bServiceHirechyOLD = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];
        var CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : 0;

        if (CUSTOMER_ID) {


            var query = `SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'key', CAST(cm.ID AS CHAR),
        'title', cm.NAME,
        'disabled', CASE
            WHEN NOT EXISTS (
                SELECT 1 
                FROM sub_category_master scm 
                WHERE scm.CATEGORY_ID = cm.ID
            ) THEN 1
            WHEN NOT EXISTS (
                SELECT 1 
                FROM sub_category_master scm 
                WHERE scm.CATEGORY_ID = cm.ID 
                AND EXISTS (
                    SELECT 1 
                    FROM service_master s 
                    WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID}) 
                )
            ) THEN 1
            ELSE 0
        END,
        'children', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR)),
                    'title', scm.NAME,
                    'disabled', CASE
                        WHEN NOT EXISTS (
                            SELECT 1 
                            FROM service_master s 
                            WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
                        ) THEN 1
                        ELSE 0
                    END,
                    'children', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR), '-', CAST(s.ID AS CHAR)),
                                'title', s.NAME,
                                'isLeaf', true
                            )
                        )
                        FROM service_master s
                        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
                        AND NOT EXISTS (
                            SELECT 1 
                            FROM b2b_availability_mapping tsnm 
                            WHERE tsnm.SERVICE_ID = s.ID AND tsnm.CUSTOMER_ID = ${CUSTOMER_ID} AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
                        )
                    )
                )
            )
            FROM sub_category_master scm
            WHERE scm.CATEGORY_ID = cm.ID
            AND EXISTS (
                SELECT 1 
                FROM service_master s 
                WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
            )
        )
    )
) AS categories
FROM category_master cm
WHERE EXISTS (
    SELECT 1 
    FROM sub_category_master scm 
    WHERE scm.CATEGORY_ID = cm.ID
)
AND EXISTS (
    SELECT 1 
    FROM sub_category_master scm 
    WHERE scm.CATEGORY_ID = cm.ID 
    AND EXISTS (
        SELECT 1 
        FROM service_master s 
        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
    )
)
HAVING categories IS NOT NULL;`

            // Execute the query
            mm.executeQuery(query, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        code: 400,
                        message: "Failed to get Data",
                    });
                } else {
                    // Clean up the response to remove any subchildren or servicechildren that have no valid data and treat them as 'children'
                    const cleanedResults = results.map(category => {
                        if (category.categories) {
                            category.categories = category.categories.filter(categoryItem => {
                                if (categoryItem.children) {
                                    categoryItem.children = categoryItem.children.filter(subchild => {
                                        // For each subchild, we are now consolidating subchildren and servicechildren into children
                                        // Check if servicechildren exists
                                        if (subchild.children && subchild.children.length > 0) {
                                            return true; // Keep subchild if it has servicechildren (now treated as children)
                                        }
                                        return false; // Remove subchild if it has no servicechildren
                                    });
                                    return categoryItem.children.length > 0; // Keep category item if it has children
                                }
                                return false; // Remove category if it has no valid children
                            });
                        }
                        return category;
                    });

                    res.send({
                        code: 200,
                        message: "Success",
                        data: cleanedResults,
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid parameter."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
    }
}


exports.getCategoriesHierarchy = (req, res) => {
    try {

        var supportKey = req.headers['supportkey'];

        var deviceid = req.headers['deviceid'];

        var query = `SET SESSION group_concat_max_len =10000000; 
SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', c.ID, 'title', c.NAME, 'disabled', 'true', 'children', IFNULL((SELECT REPLACE(REPLACE(CONCAT('[',GROUP_CONCAT(JSON_OBJECT('key', s.ID, 'title', s.NAME, 'isLeaf', 'true')),']'),'"[', '['),']"', ']') FROM sub_category_master s WHERE s.CATEGORY_ID = c.ID and STATUS = 1), '[]'))),']'),'"[', '['), ']"', ']') AS data FROM category_master c where STATUS = 1 AND EXISTS (SELECT 1 FROM sub_category_master s WHERE s.CATEGORY_ID = c.ID AND s.STATUS = 1)`;


        mm.executeQuery(query, supportKey, (error, results) => {
            if (error) {
                console.log(error)
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    code: 400,
                    message: "Failed to get Data",
                });
            }
            else {
                var json = results[1][0].data
                if (json) {
                    json = json.replace(/\\/g, '');
                    json = json.replace(/\"true\"/g, true).replace(/\"false\"/g, false)
                }
                //console.log(json);}
                res.send({
                    code: 200,
                    message: "success",
                    data: JSON.parse(json)
                })
            }
        });

    } catch (error) {
        console.log(error)
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
        res.send({
            code: 500,
            message: "Something went wrong.",
        });
    }
}

exports.getServiceLogsMYSQL = (req, res) => {
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
            mm.executeQuery('select count(*) as cnt from services_activity_logs where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceItem count.",
                    });
                }
                else {
                    mm.executeQuery('select * from services_activity_logs where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceItem information."
                            });
                        }
                        else {
                            res.send({
                                "code": 200,
                                "message": "success",
                                "TAB_ID": 142,
                                "count": results1[0].cnt,
                                "data": results,
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


exports.getServiceLogs = async (req, res) => {
    try {
        const {
            pageIndex = 1,
            pageSize = 10,
            sortKey = "_id",
            sortValue = "DESC",
            searchValue = "",
        } = req.body;

        const sortOrder = sortValue.toLowerCase() === "desc" ? -1 : 1;
        const skip = (pageIndex - 1) * pageSize;

        let baseFilter = req.body.filter || {};
        // console.log("Base Filter Before Search:", JSON.stringify(baseFilter, null, 2));

        // If searchValue is provided
        if (searchValue) {
            const searchFilter = {
                $or: req.body.searchFields.map(field => ({
                    [field]: { $regex: searchValue, $options: "i" },
                })),
            };

            // Preserve existing filter with `$and`
            baseFilter = {
                $and: [
                    baseFilter,
                    searchFilter,
                ],
            };
        }

        // console.log("Final Filter After Search:", JSON.stringify(baseFilter, null, 2));

        const totalCount = await servicelog.countDocuments(baseFilter);
        const data = await servicelog.find(baseFilter)
            .sort({ [sortKey]: sortOrder })
            .skip(skip)
            .limit(parseInt(pageSize));

        res.status(200).json({
            code: 200,
            message: "success",
            count: totalCount,
            data,
            "TAB_ID": "678c8276d5fa6d645850e972"
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            code: 500,
            message: "Something went wrong.",
        });
    }
};



function addGlobalData(data_Id, TYPE, supportKey) {
    try {
        console.log("\n\n\n\n IN addGlobalData");
        let tableName = '';
        TYPE == "MAIN" ? tableName = 'view_service_master' : tableName = 'view_b2b_availability_mapping';
        mm.executeQueryData(`select * from ${tableName} where ID = ?`, [data_Id], supportKey, (error, results5) => {
            if (error) {
                console.error(error); // Use console.error for errors
            } else {
                console.log("data retrieved");
                if (results5.length > 0) {
                    let logData = { ID: data_Id, CATEGORY: "Service", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/service-master", TERRITORY_ID: 0 };
                    dbm.addDatainGlobalmongo(logData.ID, logData.CATEGORY, logData.TITLE, logData.DATA, logData.ROUTE, logData.TERRITORY_ID)
                        .then(() => {
                            console.log("Data added/updated successfully.");
                        })
                        .catch(err => {
                            console.error("Error in addDatainGlobalmongo:", err);
                        });
                } else {
                    console.log("no data found");
                }
            }
        });
    } catch (error) {
        console.error(error); // Use console.error for errors
    }
}

const xlsx = require('xlsx')
const async = require('async')


exports.importTechnicianExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/serviceExcel/${EXCEL_FILE_NAME}.xlsx`)

        const technician = workbook.SheetNames[0];
        const technicianSheet = workbook.Sheets[technician];
        const technicianExcelData = xlsx.utils.sheet_to_json(technicianSheet);

        const technicianDetails = workbook.SheetNames[1];
        const technicianDetailsSheet = workbook.Sheets[technicianDetails];
        const technicianDetailsExcelData = xlsx.utils.sheet_to_json(technicianDetailsSheet);


        function excelDateToJSDate(serial) {
            return new Date((serial - 25569) * 86400 * 1000);
        }
        technicianExcelData.forEach((row) => {
            ['CREATED_DATE']
                .forEach((field) => {
                    if (typeof row[field] === 'number') {
                        row[field] = excelDateToJSDate(row[field]);
                    }
                });
        });

        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        let LogArray = []
        async.eachSeries(technicianExcelData, function iteratorOverElems(element, inner_callback) {
            // const fileName = `${element.NAME.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
            // const filePath = path.join('uploads/ServiceHtml', fileName);
            mm.executeDML('INSERT INTO service_master (NAME, DESCRIPTION, SUB_CATEGORY_ID, B2B_PRICE, B2C_PRICE, EXPRESS_COST, DURARTION_HOUR, DURARTION_MIN, SERVICE_IMAGE, STATUS, UNIT_ID, SHORT_CODE, MAX_QTY, VENDOR_COST, TECHNICIAN_COST, TAX_ID, DETAILS_DESIGNER, IS_EXPRESS, START_TIME, END_TIME, IS_NEW, PARENT_ID, IS_PARENT, ORG_ID, QTY, SERVICE_TYPE, PREPARATION_MINUTES, PREPARATION_HOURS, IS_FOR_B2B, CUSTOMER_ID, SERVICE_HTML_URL, IS_JOB_CREATED_DIRECTLY, CREATED_DATE, HSN_CODE_ID, HSN_CODE,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)', [element.NAME, element.DESCRIPTION, element.SUB_CATEGORY_ID, element.B2B_PRICE, element.B2C_PRICE, element.EXPRESS_COST, element.DURARTION_HOUR, element.DURARTION_MIN, element.SERVICE_IMAGE, element.STATUS, element.UNIT_ID, element.SHORT_CODE, element.MAX_QTY, element.VENDOR_COST, element.TECHNICIAN_COST, element.TAX_ID, element.DETAILS_DESIGNER, element.IS_EXPRESS, element.START_TIME, element.END_TIME, element.IS_NEW, element.PARENT_ID, element.IS_PARENT, element.ORG_ID, element.QTY, element.SERVICE_TYPE, element.PREPARATION_MINUTES, element.PREPARATION_HOURS, element.IS_FOR_B2B, element.CUSTOMER_ID, fileName, element.IS_JOB_CREATED_DIRECTLY, element.CREATED_DATE, element.HSN_CODE_ID, element.HSN_CODE, "1"], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error)
                    inner_callback(error)
                } else {
                    // fs.writeFile(filePath, " ", 'utf8', (writeErr) => {
                    //     if (writeErr) {
                    //         console.log(writeErr)

                    //         inner_callback(writeErr)
                    //     } else 
                    //     {
                    var logType = element.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service ${element.NAME}.`;
                    let logData = {
                        "LOG_DATE_TIME": systemDate,
                        "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": logType, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": results.insertId, "CUSTOMER_ID": 0, "TERRITORY_ID": 0, "NAME": element.NAME, "DESCRIPTION": element.DESCRIPTION, "CATEGORY_NAME": "", "SUB_CATEGORY_NAME": "",
                        "SUB_CATEGORY_ID": element.SUB_CATEGORY_ID, "B2B_PRICE": element.B2B_PRICE, "B2C_PRICE": element.B2C_PRICE, "TECHNICIAN_COST": element.TECHNICIAN_COST,
                        "VENDOR_COST": element.VENDOR_COST, "EXPRESS_COST": element.EXPRESS_COST,
                        "IS_EXPRESS": element.IS_EXPRESS, "SERVICE_TYPE": element.SERVICE_TYPE, "DURATION_HOUR": element.DURARTION_HOUR, "DURATION_MIN": element.DURARTION_MIN, "PREPARATION_MINUTES": element.PREPARATION_MINUTES, "PREPARATION_HOURS": element.PREPARATION_HOURS,
                        "UNIT_ID": element.UNIT_ID, "UNIT_NAME": "", "SHORT_CODE": element.SHORT_CODE, "MAX_QTY": element.MAX_QTY, "TAX_ID": element.TAX_ID, "TAX_NAME": "", "START_TIME": element.START_TIME,
                        "END_TIME": element.END_TIME, "IS_NEW": element.IS_NEW, "PARENT_ID": element.PARENT_ID, "IS_PARENT": element.IS_PARENT, "SERVICE_IMAGE": element.SERVICE_IMAGE, "IS_FOR_B2B": element.IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": element.IS_JOB_CREATED_DIRECTLY, "IS_AVAILABLE": 1, "ORG_ID": element.ORG_ID, "QTY": element.QTY, "STATUS": element.STATUS, "CLIENT_ID": 1, "HSN_CODE_ID": element.HSN_CODE_ID, "HSN_CODE": element.HSN_CODE
                    }
                    LogArray.push(logData)
                    var SKILL_ID = element.SKILL_IDS
                    console.log("SKILL_ID", SKILL_ID)
                    const SKILL_IDS = SKILL_ID.split(",");
                    let Skills = SKILL_IDS.map(skill => [results.insertId, skill, 1, 'M', 1]);
                    mm.executeDML('INSERT INTO service_skill_mapping(SERVICE_ID, SKILL_ID, IS_ACTIVE, STATUS, CLIENT_ID) VALUES ?', [Skills], supportKey, connection, (error) => {
                        if (error) {
                            console.log(error)
                            inner_callback(error)
                        } else {
                            inner_callback(null)
                        }
                    });
                }
            });
            //     }
            // });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to save data"
                })
            } else {
                dbm.saveLog(LogArray, servicelog)
                mm.commitConnection(connection);
                res.send({
                    code: 200,
                    message: "ServiceItem information created and logged successfully."
                });
            }
        });

    } catch (error) {
        console.log("Error in update method try block: ", error);
        res.send({
            "code": 400,
            "message": "Internal server error "
        });
    }
}


exports.importServiceExcel = (req, res) => {

    var supportKey = req.headers['supportkey'];
    var EXCEL_FILE_NAME = req.body.EXCEL_FILE_NAME
    try {
        const workbook = xlsx.readFile(`./uploads/serviceExcel/${EXCEL_FILE_NAME}.xlsx`)

        const service = workbook.SheetNames[0];
        const serviceSheet = workbook.Sheets[service];
        const ServiceExcelData = xlsx.utils.sheet_to_json(serviceSheet);


        function excelDateToJSDate(serial) {
            return new Date((serial - 25569) * 86400 * 1000);
        }
        ServiceExcelData.forEach((row) => {
            ['CREATED_DATE']
                .forEach((field) => {
                    if (typeof row[field] === 'number') {
                        row[field] = excelDateToJSDate(row[field]);
                    }
                });
        });

        const systemDate = mm.getSystemDate()
        const connection = mm.openConnection()
        let LogArray = []
        async.eachSeries(ServiceExcelData, function iteratorOverElems(element, inner_callback) {
            // const fileName = `${element.NAME.replace(/[\s\/,\.&@\$\%#!^\*\-\+=\\]/g, '_').replace(/_+$/, '').replace(/[^a-zA-Z0-9]$/, 'Service')}.html`;
            // const filePath = path.join('uploads/ServiceHtml', fileName);
            mm.executeDML('INSERT INTO service_master (NAME, DESCRIPTION, SUB_CATEGORY_ID, B2B_PRICE, B2C_PRICE, EXPRESS_COST, DURARTION_HOUR, DURARTION_MIN, SERVICE_IMAGE, STATUS, UNIT_ID, SHORT_CODE, MAX_QTY, VENDOR_COST, TECHNICIAN_COST, TAX_ID, DETAILS_DESIGNER, IS_EXPRESS, START_TIME, END_TIME, IS_NEW, PARENT_ID, IS_PARENT, ORG_ID, QTY, SERVICE_TYPE, PREPARATION_MINUTES, PREPARATION_HOURS, IS_FOR_B2B, CUSTOMER_ID, SERVICE_HTML_URL, IS_JOB_CREATED_DIRECTLY, CREATED_DATE, HSN_CODE_ID, HSN_CODE,CLIENT_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)', [element.NAME, element.DESCRIPTION, element.SUB_CATEGORY_ID, element.B2B_PRICE, element.B2C_PRICE, element.EXPRESS_COST, element.DURARTION_HOUR, element.DURARTION_MIN, element.SERVICE_IMAGE, element.STATUS, element.UNIT_ID, element.SHORT_CODE, element.MAX_QTY, element.VENDOR_COST, element.TECHNICIAN_COST, element.TAX_ID, element.DETAILS_DESIGNER, element.IS_EXPRESS, element.START_TIME, element.END_TIME, element.IS_NEW, element.PARENT_ID, element.IS_PARENT, element.ORG_ID, element.QTY, element.SERVICE_TYPE, element.PREPARATION_MINUTES, element.PREPARATION_HOURS, element.IS_FOR_B2B, element.CUSTOMER_ID, fileName, element.IS_JOB_CREATED_DIRECTLY, element.CREATED_DATE, element.HSN_CODE_ID, element.HSN_CODE, "1"], supportKey, connection, (error, results) => {
                if (error) {
                    console.log(error)
                    inner_callback(error)
                } else {
                    // fs.writeFile(filePath, " ", 'utf8', (writeErr) => {
                    //     if (writeErr) {
                    //         console.log(writeErr)

                    //         inner_callback(writeErr)
                    //     } else
                    //      {
                    var logType = element.IS_FOR_B2B == 1 ? 'B2B' : 'MAIN';
                    var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service ${element.NAME}.`;
                    let logData = {
                        "LOG_DATE_TIME": systemDate,
                        "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": logType, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": results.insertId, "CUSTOMER_ID": 0, "TERRITORY_ID": 0, "NAME": element.NAME, "DESCRIPTION": element.DESCRIPTION, "CATEGORY_NAME": "", "SUB_CATEGORY_NAME": "",
                        "SUB_CATEGORY_ID": element.SUB_CATEGORY_ID, "B2B_PRICE": element.B2B_PRICE, "B2C_PRICE": element.B2C_PRICE, "TECHNICIAN_COST": element.TECHNICIAN_COST,
                        "VENDOR_COST": element.VENDOR_COST, "EXPRESS_COST": element.EXPRESS_COST,
                        "IS_EXPRESS": element.IS_EXPRESS, "SERVICE_TYPE": element.SERVICE_TYPE, "DURATION_HOUR": element.DURARTION_HOUR, "DURATION_MIN": element.DURARTION_MIN, "PREPARATION_MINUTES": element.PREPARATION_MINUTES, "PREPARATION_HOURS": element.PREPARATION_HOURS,
                        "UNIT_ID": element.UNIT_ID, "UNIT_NAME": "", "SHORT_CODE": element.SHORT_CODE, "MAX_QTY": element.MAX_QTY, "TAX_ID": element.TAX_ID, "TAX_NAME": "", "START_TIME": element.START_TIME,
                        "END_TIME": element.END_TIME, "IS_NEW": element.IS_NEW, "PARENT_ID": element.PARENT_ID, "IS_PARENT": element.IS_PARENT, "SERVICE_IMAGE": element.SERVICE_IMAGE, "IS_FOR_B2B": element.IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": element.IS_JOB_CREATED_DIRECTLY, "IS_AVAILABLE": 1, "ORG_ID": element.ORG_ID, "QTY": element.QTY, "STATUS": element.STATUS, "CLIENT_ID": 1, "HSN_CODE_ID": element.HSN_CODE_ID, "HSN_CODE": element.HSN_CODE
                    }
                    LogArray.push(logData)
                    var SKILL_ID = element.SKILL_IDS
                    console.log("SKILL_ID", SKILL_ID)
                    const SKILL_IDS = SKILL_ID.split(",");
                    let Skills = SKILL_IDS.map(skill => [results.insertId, skill, 1, 'M', 1]);
                    mm.executeDML('INSERT INTO service_skill_mapping(SERVICE_ID, SKILL_ID, IS_ACTIVE, STATUS, CLIENT_ID) VALUES ?', [Skills], supportKey, connection, (error) => {
                        if (error) {
                            console.log(error)
                            inner_callback(error)
                        } else {
                            inner_callback(null)
                        }
                    });
                    // }
                    // });
                }
            });
        }, function subCb(error) {
            if (error) {
                mm.rollbackConnection(connection)
                res.send({
                    "code": 400,
                    "message": "Failed to save data"
                })
            } else {
                dbm.saveLog(LogArray, servicelog)
                mm.commitConnection(connection);
                res.send({
                    code: 200,
                    message: "ServiceItem information created and logged successfully."
                });
            }
        });

    } catch (error) {
        console.log("Error in update method try block: ", error);
        res.send({
            "code": 400,
            "message": "Internal server error "
        });
    }
}                                                        



exports.getServiceHirechy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];
        var TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : 0;

        var query = `SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'key', CAST(cm.ID AS CHAR),
        'title', cm.NAME,
        'disabled', CASE
            WHEN NOT EXISTS (
                SELECT 1
                FROM sub_category_master scm
                WHERE scm.CATEGORY_ID = cm.ID
            ) THEN 1
            WHEN NOT EXISTS (
                SELECT 1
                FROM sub_category_master scm
                WHERE scm.CATEGORY_ID = cm.ID
                AND EXISTS (
                    SELECT 1
                    FROM service_master s
                    WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0  AND CUSTOMER_ID=0  AND s.IS_PARENT =0 and SERVICE_TYPE IN ('C','O')
                )
            ) THEN 1
            ELSE 0
        END,
        'children', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR)),
                    'title', scm.NAME,
                    'disabled', CASE
                        WHEN NOT EXISTS (
                            SELECT 1
                            FROM service_master s
                            WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 and SERVICE_TYPE IN ('C','O')
                        ) THEN 1
                        ELSE 0
                    END,
                    'children', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR), '-', CAST(s.ID AS CHAR)),
                                'title', s.NAME,
                                'SERVICE_TYPE', s.SERVICE_TYPE,
                                'isLeaf', true
                            )
                        )
                        FROM service_master s
                        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0 AND s.IS_PARENT =0 and SERVICE_TYPE IN ('C','O')
                        AND NOT EXISTS (
                            SELECT 1
                            FROM territory_service_non_availability_mapping tsnm
                            WHERE tsnm.SERVICE_ID = s.ID AND tsnm.TERRITORY_ID = ${TERRITORY_ID}
                        )
                    )
                )
            )
            FROM sub_category_master scm
            WHERE scm.CATEGORY_ID = cm.ID
            AND EXISTS (
                SELECT 1
                FROM service_master s
                WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 and SERVICE_TYPE IN ('C','O')
            )
        )
    )
) AS categories
FROM category_master cm
WHERE EXISTS (
    SELECT 1
    FROM sub_category_master scm
    WHERE scm.CATEGORY_ID = cm.ID
)
AND EXISTS (
    SELECT 1
    FROM sub_category_master scm
    WHERE scm.CATEGORY_ID = cm.ID
    AND EXISTS (
        SELECT 1
        FROM service_master s
        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.STATUS = 1 AND s.IS_FOR_B2B = 0 AND CUSTOMER_ID=0  AND s.IS_PARENT =0 and SERVICE_TYPE IN ('C','O')
    )
)
HAVING categories IS NOT NULL`
        // Execute the query
        mm.executeQuery(query, supportKey, (error, results) => {
            if (error) {
                console.log(error);
                logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                res.send({
                    code: 400,
                    message: "Failed to get Data",
                });
            } else {
                // Clean up the response to remove any subchildren or servicechildren that have no valid data and treat them as 'children'
                const cleanedResults = results.map(category => {
                    if (category.categories) {
                        category.categories = category.categories.filter(categoryItem => {
                            if (categoryItem.children) {
                                categoryItem.children = categoryItem.children.filter(subchild => {
                                    // For each subchild, we are now consolidating subchildren and servicechildren into children
                                    // Check if servicechildren exists
                                    if (subchild.children && subchild.children.length > 0) {
                                        return true; // Keep subchild if it has servicechildren (now treated as children)
                                    }
                                    return false; // Remove subchild if it has no servicechildren
                                });
                                return categoryItem.children.length > 0; // Keep category item if it has children
                            }
                            return false; // Remove category if it has no valid children
                        });
                    }
                    return category;
                });

                res.send({
                    code: 200,
                    message: "Success",
                    data: cleanedResults,
                });
            }
        });

    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
    }
}



exports.getb2bServiceHirechy = (req, res) => {
    try {
        var supportKey = req.headers['supportkey'];
        var deviceid = req.headers['deviceid'];
        var CUSTOMER_ID = req.body.CUSTOMER_ID ? req.body.CUSTOMER_ID : 0;

        if (CUSTOMER_ID) {


            var query = `SELECT JSON_ARRAYAGG(
    JSON_OBJECT(
        'key', CAST(cm.ID AS CHAR),
        'title', cm.NAME,
        'disabled', CASE
            WHEN NOT EXISTS (
                SELECT 1 
                FROM sub_category_master scm 
                WHERE scm.CATEGORY_ID = cm.ID
            ) THEN 1
            WHEN NOT EXISTS (
                SELECT 1 
                FROM sub_category_master scm 
                WHERE scm.CATEGORY_ID = cm.ID 
                AND EXISTS (
                    SELECT 1 
                    FROM service_master s 
                    WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID}) 
                )
            ) THEN 1
            ELSE 0
        END,
        'children', (
            SELECT JSON_ARRAYAGG(
                JSON_OBJECT(
                    'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR)),
                    'title', scm.NAME,
                    'disabled', CASE
                        WHEN NOT EXISTS (
                            SELECT 1 
                            FROM service_master s 
                            WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
                        ) THEN 1
                        ELSE 0
                    END,
                    'children', (
                        SELECT JSON_ARRAYAGG(
                            JSON_OBJECT(
                                'key', CONCAT(CAST(cm.ID AS CHAR), '-', CAST(scm.ID AS CHAR), '-', CAST(s.ID AS CHAR)),
                                'title', s.NAME,
                                'SERVICE_TYPE', s.SERVICE_TYPE,
                                'isLeaf', true
                            )
                        )
                        FROM service_master s
                        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
                        AND NOT EXISTS (
                            SELECT 1 
                            FROM b2b_availability_mapping tsnm 
                            WHERE tsnm.SERVICE_ID = s.ID AND tsnm.CUSTOMER_ID = ${CUSTOMER_ID} AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
                        )
                    )
                )
            )
            FROM sub_category_master scm
            WHERE scm.CATEGORY_ID = cm.ID
            AND EXISTS (
                SELECT 1 
                FROM service_master s 
                WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
            )
        )
    )
) AS categories
FROM category_master cm
WHERE EXISTS (
    SELECT 1 
    FROM sub_category_master scm 
    WHERE scm.CATEGORY_ID = cm.ID
)
AND EXISTS (
    SELECT 1 
    FROM sub_category_master scm 
    WHERE scm.CATEGORY_ID = cm.ID 
    AND EXISTS (
        SELECT 1 
        FROM service_master s 
        WHERE s.SUB_CATEGORY_ID = scm.ID AND s.IS_PARENT = 0 AND s.STATUS = 1 and (s.SERVICE_TYPE in ('B','O') or s.CUSTOMER_ID = ${CUSTOMER_ID}) AND s.CUSTOMER_ID IN (0,${CUSTOMER_ID})
    )
)
HAVING categories IS NOT NULL;`

            // Execute the query
            mm.executeQuery(query, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
                    res.send({
                        code: 400,
                        message: "Failed to get Data",
                    });
                } else {
                    // Clean up the response to remove any subchildren or servicechildren that have no valid data and treat them as 'children'
                    const cleanedResults = results.map(category => {
                        if (category.categories) {
                            category.categories = category.categories.filter(categoryItem => {
                                if (categoryItem.children) {
                                    categoryItem.children = categoryItem.children.filter(subchild => {
                                        // For each subchild, we are now consolidating subchildren and servicechildren into children
                                        // Check if servicechildren exists
                                        if (subchild.children && subchild.children.length > 0) {
                                            return true; // Keep subchild if it has servicechildren (now treated as children)
                                        }
                                        return false; // Remove subchild if it has no servicechildren
                                    });
                                    return categoryItem.children.length > 0; // Keep category item if it has children
                                }
                                return false; // Remove category if it has no valid children
                            });
                        }
                        return category;
                    });

                    res.send({
                        code: 200,
                        message: "Success",
                        data: cleanedResults,
                    });
                }
            });
        }
        else {
            res.send({
                code: 400,
                message: "Invalid parameter."
            })
        }
    } catch (error) {
        console.log(error);
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey, supportKey, deviceid);
    }
}