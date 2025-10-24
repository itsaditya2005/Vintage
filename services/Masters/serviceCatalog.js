const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var serviceCatalogMaster = "service_catalog_master";
var viewServiceCatalogMaster = "view_" + serviceCatalogMaster;


function reqData(req) {

    var data = {
        NAME: req.body.NAME,
        DESCRIPTION: req.body.DESCRIPTION,
        CATEGORY_ID: req.body.CATEGORY_ID,
        SUBCATEGORY_ID: req.body.SUBCATEGORY_ID,
        REGULAR_PRICE_B2B: req.body.REGULAR_PRICE_B2B ? req.body.REGULAR_PRICE_B2B : 0,
        REGULAR_PRICE_B2C: req.body.REGULAR_PRICE_B2C ? req.body.REGULAR_PRICE_B2C : 0,
        EXPRESS_PRICE_B2B: req.body.EXPRESS_PRICE_B2B ? req.body.EXPRESS_PRICE_B2B : 0,
        EXPRESS_PRICE_B2C: req.body.EXPRESS_PRICE_B2C ? req.body.EXPRESS_PRICE_B2C : 0,
        DURATION: req.body.DURATION,
        SERVICE_IMAGE_URL: req.body.SERVICE_IMAGE_URL,
        AVAILABILITY_STATUS: req.body.AVAILABILITY_STATUS ? '1' : '0',
        CLIENT_ID: req.body.CLIENT_ID
    }
    return data;
}


exports.validate = function () {
    return [
        body('NAME').optional(),
        body('DESCRIPTION').optional(),
        body('CATEGORY_ID').isInt().optional(),
        body('SUBCATEGORY_ID').isInt().optional(),
        body('SERVICE_CODE').optional(),
        body('REGULAR_PRICE_B2B').isDecimal().optional(),
        body('REGULAR_PRICE_B2C').isDecimal().optional(),
        body('EXPRESS_PRICE_B2B').isDecimal().optional(),
        body('EXPRESS_PRICE_B2C').isDecimal().optional(),
        body('CURRENCY_ID').isInt().optional(),
        body('SERVICE_IMAGE_URL').optional(),
        body('TERMS_AND_CONDITIONS').optional(),
        body('AVAILABILITY_STATUS').optional(),
        body('DISPLAY_ORDER').optional(),
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
            mm.executeQuery('select count(*) as cnt from ' + viewServiceCatalogMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to get serviceCatalog count.",
                    });
                }
                else {
                    mm.executeQuery('select * from ' + viewServiceCatalogMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
                        if (error) {
                            console.log(error);
                            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                            res.send({
                                "code": 400,
                                "message": "Failed to get serviceCatalog information."
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
            mm.executeQueryData('INSERT INTO ' + serviceCatalogMaster + ' SET ?', data, supportKey, (error, results) => {
                if (error) {
                    console.log(error);
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    res.send({
                        "code": 400,
                        "message": "Failed to save serviceCatalog information..."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "ServiceCatalog information saved successfully...",
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
            mm.executeQueryData(`UPDATE ` + serviceCatalogMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
                if (error) {
                    logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
                    console.log(error);
                    res.send({
                        "code": 400,
                        "message": "Failed to update serviceCatalog information."
                    });
                }
                else {
                    res.send({
                        "code": 200,
                        "message": "ServiceCatalog information updated successfully...",
                    });
                }
            });
        } catch (error) {
            logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
            console.log(error);
            res.send({
                "code": 400,
                "message": "Something went wrong."
            });
        }
    }
}

exports.getMappedServices = (req, res) => {

    let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
    let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
    let TERRITORY_ID = req.body.TERRITORY_ID

    var supportKey = req.headers['supportkey'];
    try {
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
    COALESCE(T.CLIENT_ID, S.CLIENT_ID) AS CLIENT_ID
FROM 
    service_master S
LEFT JOIN 
    territory_service_non_availability_mapping T 
    ON S.ID = T.SERVICE_ID AND T.TERRITORY_ID = ${TERRITORY_ID}
WHERE 
    S.STATUS = 1`
        mm.executeQuery(Query + " ORDER BY " + sortKey + " " + sortValue, supportKey, (error, results1) => {
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
    } catch (error) {
        logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
        console.log(error);
        res.send({
            "code": 500,
            "message": "Something went wrong."
        });
    }
}

