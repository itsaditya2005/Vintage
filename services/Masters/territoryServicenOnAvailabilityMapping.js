const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const async = require('async');
const servicelog = require("../../modules/serviceLog")
const systemLog = require("../../modules/systemLog")
const applicationkey = process.env.APPLICATION_KEY;
const dbm = require('../../utilities/dbMongo');

var territoryServiceNonAvailabilityMapping = "territory_service_non_availability_mapping";
var viewTerritoryServiceNonAvailabilityMapping = "view_" + territoryServiceNonAvailabilityMapping;

function reqData(req) {

	var data = {
		TERRITORY_ID: req.body.TERRITORY_ID,
		SERVICE_ID: req.body.SERVICE_ID,
		IS_AVAILABLE: req.body.IS_AVAILABLE ? "1" : "0",
		START_TIME: req.body.START_TIME,
		END_TIME: req.body.END_TIME,
		B2B_PRICE: req.body.B2B_PRICE,
		B2C_PRICE: req.body.B2C_PRICE,
		TECHNICIAN_COST: req.body.TECHNICIAN_COST,
		VENDOR_COST: req.body.VENDOR_COST,
		EXPRESS_COST: req.body.EXPRESS_COST,
		CLIENT_ID: req.body.CLIENT_ID,
		CATEGORY_NAME: req.body.CATEGORY_NAME,
		SUB_CATEGORY_NAME: req.body.SUB_CATEGORY_NAME,
		IS_EXPRESS: req.body.IS_EXPRESS ? "1" : "0",
		NAME: req.body.NAME,
		DESCRIPTION: req.body.DESCRIPTION,
		SERVICE_IMAGE: req.body.SERVICE_IMAGE,
		SERVICE_TYPE: req.body.SERVICE_TYPE,
		PREPARATION_MINUTES: req.body.PREPARATION_MINUTES,
		PREPARATION_HOURS: req.body.PREPARATION_HOURS,
		HSN_CODE_ID: req.body.HSN_CODE_ID,
		HSN_CODE: req.body.HSN_CODE,
		TAX_ID: req.body.TAX_ID,
		UNIT_ID: req.body.UNIT_ID


	}

	return data;
}


exports.validate = function () {
	return [
		body('TERRITORY_ID').isInt().optional(),
		body('SERVICE_ID').isInt().optional(),
		body('DATE').optional(),
		body('START_TIME').optional(),
		body('END_TIME').optional(),
		body('RECURRING').optional(),
		body('REMARKS').optional(),
		body('UPDATED_DATE').optional(),
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
			mm.executeQuery('select count(*) as cnt from ' + viewTerritoryServiceNonAvailabilityMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get territoryServiceNonAvailabilityMapping count.",
					});
				}
				else {
					mm.executeQuery('select * from ' + viewTerritoryServiceNonAvailabilityMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get territoryServiceNonAvailabilityMapping information."
							});
						}
						else {
							res.send({
								"code": 200,
								"message": "success",
								"TAB_ID": 125,
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
	const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
	const CATEGORY_NAME = req.body.CATEGORY_NAME;
	const SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
	const DURARTION_HOUR = req.body.DURARTION_HOUR;
	const DURARTION_MIN = req.body.DURARTION_MIN;
	const CUSTOMER_ID = req.body.CUSTOMER_ID;
	const UNIT_ID = req.body.UNIT_ID;
	const UNIT_NAME = req.body.UNIT_NAME
	const SHORT_CODE = req.body.SHORT_CODE;
	const MAX_QTY = req.body.MAX_QTY;
	const TAX_ID = req.body.TAX_ID;
	const TAX_NAME = req.body.TAX_NAME;
	const IS_NEW = req.body.IS_NEW;
	const PARENT_ID = req.body.PARENT_ID;
	const IS_PARENT = req.body.IS_PARENT;
	const IS_FOR_B2B = req.body.IS_FOR_B2B;
	const IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY;
	const ORG_ID = req.body.ORG_ID;
	const QTY = req.body.QTY;
	const STATUS = req.body.STATUS;
	const TERRITORY_ID = req.body.TERRITORY_ID;
	var supportKey = req.headers['supportkey'];

	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		console.log(errors);
		return res.status(422).json({
			code: 422,
			message: errors.errors
		});
	} else {
		try {
			mm.executeQueryData('INSERT INTO ' + territoryServiceNonAvailabilityMapping + ' SET ?', data, supportKey, (error, results) => {
				if (error) {
					console.error(error);
					logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
					return res.status(400).json({
						code: 400,
						message: "Failed to save territoryServiceNonAvailabilityMapping information..."
					});
				} else {
					console.log(req.body.authData.data.UserData[0]);
					const systemDate = mm.getSystemDate();
					const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has mapped new territory non-availability service`;

					const logData2 = {
						"LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'TERS',
						"USER_ID": req.body.authData.data.UserData[0].USER_ID, "ADDED_BY": req.body.authData.data.UserData[0].NAME,
						"SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": CUSTOMER_ID, "TERRITORY_ID": TERRITORY_ID, "NAME": data.NAME,
						"DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME,
						"SUB_CATEGORY_ID": SUB_CATEGORY_ID, "B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE,
						"TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
						"IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR,
						"DURATION_MIN": DURARTION_MIN, "PREPARATION_MINUTES": data.PREPARATION_MINUTES,
						"PREPARATION_HOURS": data.PREPARATION_HOURS, "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE,
						"MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME, "END_TIME": data.END_TIME,
						"IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID, "IS_PARENT": IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE,
						"IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
						"IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE, "SUPPORT_KEY": supportKey
					};

					const actionLog = {
						"SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(),
						"LOG_TEXT": `User ${req.body.authData.data.UserData[0].NAME} has mapped new territory non-availability service`,
						"CATEGORY": "Territorynonavailablitymapping", "CLIENT_ID": 1,
						"USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": supportKey
					};
					addGlobalData(results.insertId, supportKey)

					dbm.saveLog(logData2, servicelog);
					return res.status(200).json({
						code: 200,
						message: "ServiceItem information updated and logged successfully."
					});
				}
			});
		} catch (error) {
			logger.error(supportKey + ' ' + req.method + ' ' + req.url + ' ' + JSON.stringify(error), applicationkey);
			console.error(error);
			return res.status(500).json({
				code: 500,
				message: "Something went wrong."
			});
		}
	}
};


exports.update = (req, res) => {
	const errors = validationResult(req);
	var data = reqData(req);
	const SUB_CATEGORY_NAME = req.body.SUB_CATEGORY_NAME;
	const CATEGORY_NAME = req.body.CATEGORY_NAME;
	const SUB_CATEGORY_ID = req.body.SUB_CATEGORY_ID;
	const DURARTION_HOUR = req.body.DURARTION_HOUR
	const DURARTION_MIN = req.body.DURARTION_MIN
	const CUSTOMER_ID = req.body.CUSTOMER_ID
	const UNIT_ID = req.body.UNIT_ID
	const UNIT_NAME = req.body.UNIT_NAME
	const SHORT_CODE = req.body.SHORT_CODE
	const MAX_QTY = req.body.MAX_QTY
	const TAX_ID = req.body.TAX_ID
	const TAX_NAME = req.body.TAX_NAME
	const IS_NEW = req.body.IS_NEW
	const PARENT_ID = req.body.PARENT_ID
	const IS_PARENT = req.body.IS_PARENT
	const IS_FOR_B2B = req.body.IS_FOR_B2B
	const IS_JOB_CREATED_DIRECTLY = req.body.IS_JOB_CREATED_DIRECTLY
	const ORG_ID = req.body.ORG_ID
	const QTY = req.body.QTY
	const STATUS = req.body.STATUS
	const supportKey = req.headers['supportkey'];
	const criteria = { ID: req.body.ID };
	const systemDate = mm.getSystemDate();
	let setData = "";
	let recordData = [];

	Object.keys(data).forEach(key => {
		if (data[key]) {
			setData += `${key}= ? , `;
			recordData.push(data[key]);
		}
	});

	if (!errors.isEmpty()) {
		console.log(errors);
		return res.status(422).json({
			"code": 422,
			"message": errors.errors
		});
	}

	try {
		mm.executeQueryData(
			`UPDATE ${territoryServiceNonAvailabilityMapping} SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' WHERE ID = ${criteria.ID}`,
			recordData,
			supportKey,
			(error, results) => {
				if (error) {
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					console.log(error);
					return res.status(400).json({
						"code": 400,
						"message": "Failed to update territoryServiceNonAvailabilityMapping information."
					});
				} else {
					const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of the territory non-availability service mapping.`;

					let logData2 = {
						"LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "LOG_TYPE": 'TERS', "USER_ID": req.body.authData.data.UserData[0].USER_ID,
						"ADDED_BY": req.body.authData.data.UserData[0].NAME, "SERVICE_ID": data.SERVICE_ID, "CUSTOMER_ID": CUSTOMER_ID, "TERRITORY_ID": data.TERRITORY_ID,
						"NAME": data.NAME, "DESCRIPTION": data.DESCRIPTION, "CATEGORY_NAME": CATEGORY_NAME, "SUB_CATEGORY_NAME": SUB_CATEGORY_NAME, "SUB_CATEGORY_ID": SUB_CATEGORY_ID,
						"B2B_PRICE": data.B2B_PRICE, "B2C_PRICE": data.B2C_PRICE, "TECHNICIAN_COST": data.TECHNICIAN_COST, "VENDOR_COST": data.VENDOR_COST, "EXPRESS_COST": data.EXPRESS_COST,
						"IS_EXPRESS": data.IS_EXPRESS, "SERVICE_TYPE": data.SERVICE_TYPE, "DURATION_HOUR": DURARTION_HOUR, "DURATION_MIN": DURARTION_MIN,
						"PREPARATION_MINUTES": data.PREPARATION_MINUTES, "PREPARATION_HOURS": data.PREPARATION_HOURS, "UNIT_ID": UNIT_ID, "UNIT_NAME": UNIT_NAME, "SHORT_CODE": SHORT_CODE,
						"MAX_QTY": MAX_QTY, "TAX_ID": TAX_ID, "TAX_NAME": TAX_NAME, "START_TIME": data.START_TIME, "END_TIME": data.END_TIME, "IS_NEW": IS_NEW, "PARENT_ID": PARENT_ID,
						"IS_PARENT": IS_PARENT, "SERVICE_IMAGE": data.SERVICE_IMAGE, "IS_FOR_B2B": IS_FOR_B2B, "IS_JOB_CREATED_DIRECTLY": IS_JOB_CREATED_DIRECTLY,
						"IS_AVAILABLE": data.IS_AVAILABLE, "ORG_ID": ORG_ID, "QTY": QTY, "STATUS": STATUS, "HSN_CODE_ID": data.HSN_CODE_ID, "HSN_CODE": data.HSN_CODE, "SUPPORT_KEY": supportKey
					};

					let actionLog = {
						"SOURCE_ID": criteria.ID, "LOG_DATE_TIME": systemDate, "LOG_TEXT": ACTION_DETAILS, "CATEGORY": "territoryServiceNonAvailabilityMapping",
						"CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": supportKey
					};
					addGlobalData(criteria.ID, supportKey)

					dbm.saveLog(logData2, servicelog);
					return res.send({
						code: 200,
						message: "ServiceItem information updated and logged successfully."
					});
				}
			}
		);
	} catch (error) {
		logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
		console.log(error);
		return res.status(500).json({
			message: "Something went wrong."
		});
	}
};


exports.addBulk = (req, res) => {

	var TERITORY_ID = req.body.TERITORY_ID;
	var data = req.body.data;
	var CLIENT_ID = req.body.CLIENT_ID;
	var supportKey = req.headers['supportkey'];

	try {
		const connection = mm.openConnection()
		async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {

			mm.executeDML(`select * from territory_service_non_availability_mapping where TERRITORY_ID=? and SERVICE_ID=?`, [TERITORY_ID, roleDetailsItem.SERVICE_ID], supportKey, connection, (error, resultsIsDataPresent) => {
				if (error) {
					console.log(error);
					inner_callback(error);
				} else {
					if (resultsIsDataPresent.length > 0) {
						mm.executeDML(`update territory_service_non_availability_mapping set SERVICE_ID = ?,DATE=?,START_TIME=?,END_TIME=?,REMARKS=?,IS_ACTIVE=?,IS_AVAILABLE=?,HSN_CODE_ID = ?, HSN_CODE = ?,UNIT_ID = ?,TAX_ID = ?  where  ID = ?`, [roleDetailsItem.SERVICE_ID, roleDetailsItem.DATE, roleDetailsItem.START_TIME, roleDetailsItem.END_TIME, roleDetailsItem.REMARKS, roleDetailsItem.IS_ACTIVE, roleDetailsItem.IS_AVAILABLE, roleDetailsItem.HSN_CODE_ID, roleDetailsItem.HSN_CODE, roleDetailsItem.UNIT_ID, roleDetailsItem.TAX_ID, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
							if (error) {
								console.log("error", error);
								inner_callback(error);
							} else {
								inner_callback(null);
							}
						});
					} else {
						mm.executeDML('INSERT INTO territory_service_non_availability_mapping (TERRITORY_ID,SERVICE_ID,DATE,START_TIME,END_TIME,REMARKS,IS_ACTIVE,IS_AVAILABLE,CLIENT_ID,HSN_CODE_ID,HSN_CODE,TAX_ID,UNIT_ID) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)', [TERITORY_ID, roleDetailsItem.SERVICE_ID, roleDetailsItem.DATE, roleDetailsItem.START_TIME, roleDetailsItem.END_TIME, roleDetailsItem.REMARKS, roleDetailsItem.IS_ACTIVE, roleDetailsItem.IS_AVAILABLE, CLIENT_ID, roleDetailsItem.HSN_CODE_ID, roleDetailsItem.HSN_CODE, roleDetailsItem.TAX_IS, roleDetailsItem.UNIT_ID], supportKey, connection, (error, resultsInsert) => {
							if (error) {
								console.log("error", error);
								inner_callback(error);
							} else {
								inner_callback(null);
							}
						});
					}
				}
			});
		}, function subCb(error) {
			if (error) {
				mm.rollbackConnection(connection);
				res.send({
					"code": 400,
					"message": "Failed to Insert territoryServiceNonAvailabilityMapping information..."
				});
			} else {
				var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped the territory non-availability service.`;
				var logCategory = "territory service non availablity ";
				let actionLog = {
					"SOURCE_ID": TERITORY_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
				}
				dbm.saveLog(actionLog, systemLog)
				mm.commitConnection(connection);
				res.send({
					"code": 200,
					"message": "New territoryServiceNonAvailabilityMapping Successfully added",
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


exports.serviceDetails = (req, res) => {

	var pageIndex = req.body.pageIndex ? req.body.pageIndex : '';
	var pageSize = req.body.pageSize ? req.body.pageSize : '';
	var start = 0;
	var end = 0;

	if (pageIndex != '' && pageSize != '') {
		start = (pageIndex - 1) * pageSize;
		end = pageSize;
	}

	let sortKey = req.body.sortKey ? req.body.sortKey : 'SERVICE_ID';
	let sortValue = req.body.sortValue ? req.body.sortValue : 'DESC';
	let filter = req.body.filter ? req.body.filter : '';
	let TERRITORY_ID = req.body.TERRITORY_ID ? req.body.TERRITORY_ID : '';
	var IS_FILTER_WRONG = mm.sanitizeFilter(filter);
	let criteria = '';

	if (pageIndex === '' && pageSize === '')
		criteria = filter + " order by " + sortKey + " " + sortValue;
	else
		criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;

	var supportKey = req.headers['supportkey'];
	var countCriteria = filter
	try {
		if (IS_FILTER_WRONG == "0") {
			mm.executeQueryData(`SELECT COUNT(*) AS TOTAL_COUNT from view_service_details WHERE 1  ${countCriteria}`, TERRITORY_ID, supportKey, (error, results1) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get territoryServiceNonAvailabilityMapping count.",
					});
				}
				else {
					var Query = `SELECT * from view_service_details WHERE 1 `
					mm.executeQueryData(Query + criteria, [], supportKey, (error, results2) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get territoryServiceNonAvailabilityMapping count.",
							});
						}
						else {
							res.send({
								"code": 200,
								"message": "success",
								"count": results1[0].TOTAL_COUNT,
								"data": results2,
								"TAB_ID": 141
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


exports.addBulkService = (req, res) => {
	const TERRITORY_ID = req.body.TERRITORY_ID;
	const systemDate = mm.getSystemDate();
	const data = req.body.data;
	const CLIENT_ID = req.body.CLIENT_ID;
	const supportKey = req.headers['supportkey'];

	try {
		if (!TERRITORY_ID) {
			return res.send({
				"code": 400,
				"message": "Please provide Territory ID"
			});
		} else {
			var SERVICE_LOGS = [];
			const connection = mm.openConnection();

			async.eachSeries(data, (service, callback) => {
				const serviceId = service.SERVICE_ID;
				mm.executeDML(`SELECT * FROM territory_service_non_availability_mapping WHERE TERRITORY_ID = ? AND SERVICE_ID = ?`, [TERRITORY_ID, serviceId], supportKey, connection, (error, results) => {
					if (error) {
						console.log(error);
						logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
						return callback(error);
					} else {
						if (results.length > 0) {
							mm.executeDML(`UPDATE territory_service_non_availability_mapping SET IS_AVAILABLE = ?, START_TIME = ?, END_TIME = ?, B2B_PRICE = ?, B2C_PRICE = ?, TECHNICIAN_COST = ?, VENDOR_COST = ?, EXPRESS_COST = ?, IS_EXPRESS = ?, NAME = ?, DESCRIPTION = ?, SERVICE_IMAGE = ?, SERVICE_TYPE = ?, PREPARATION_MINUTES = ?, PREPARATION_HOURS = ?, CLIENT_ID = ?, CATEGORY_NAME = ?, SUB_CATEGORY_NAME = ?,HSN_CODE_ID = ?, HSN_CODE = ?,UNIT_ID = ?,TAX_ID = ? WHERE TERRITORY_ID = ? AND SERVICE_ID = ?`, [service.IS_AVAILABLE ? 1 : 0, service.START_TIME, service.END_TIME, service.B2B_PRICE, service.B2C_PRICE, service.TECHNICIAN_COST, service.VENDOR_COST, service.EXPRESS_COST, service.IS_EXPRESS ? 1 : 0, service.NAME, service.DESCRIPTION, service.SERVICE_IMAGE, service.SERVICE_TYPE, service.PREPARATION_MINUTES, service.PREPARATION_HOURS, CLIENT_ID, service.CATEGORY_NAME, service.SUB_CATEGORY_NAME, service.HSN_CODE_ID, service.HSN_CODE, service.UNIT_ID, service.TAX_ID, TERRITORY_ID, serviceId], supportKey, connection, (error) => {
								if (error) {
									console.log(error);
									logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
									return callback(error);
								}

								const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME}  has updated the service named ${service.NAME}.`;
								const logData = {
									LOG_DATE_TIME: systemDate,
									LOG_TEXT: ACTION_DETAILS,
									LOG_TYPE: 'TERS',
									USER_ID: req.body.authData.data.UserData[0].USER_ID,
									ADDED_BY: req.body.authData.data.UserData[0].NAME,
									SERVICE_ID: serviceId,
									CUSTOMER_ID: service.CUSTOMER_ID ? service.CUSTOMER_ID : '0',
									TERRITORY_ID: service.TERRITORY_ID,
									NAME: service.NAME,
									DESCRIPTION: service.DESCRIPTION,
									CATEGORY_NAME: service.CATEGORY_NAME,
									SUB_CATEGORY_NAME: service.SUB_CATEGORY_NAME,
									SUB_CATEGORY_ID: service.SUB_CATEGORY_ID,
									B2B_PRICE: service.B2B_PRICE,
									B2C_PRICE: service.B2C_PRICE,
									TECHNICIAN_COST: service.TECHNICIAN_COST,
									VENDOR_COST: service.VENDOR_COST,
									EXPRESS_COST: service.EXPRESS_COST,
									IS_EXPRESS: service.IS_EXPRESS,
									SERVICE_TYPE: service.SERVICE_TYPE,
									DURATION_HOUR: service.DURATION_HOUR,
									DURATION_MIN: service.DURATION_MIN,
									PREPARATION_MINUTES: service.PREPARATION_MINUTES,
									PREPARATION_HOURS: service.PREPARATION_HOURS,
									UNIT_ID: service.UNIT_ID,
									UNIT_NAME: service.UNIT_NAME,
									SHORT_CODE: service.SHORT_CODE,
									MAX_QTY: service.MAX_QTY,
									TAX_ID: service.TAX_ID,
									TAX_NAME: service.TAX_NAME,
									START_TIME: service.START_TIME,
									END_TIME: service.END_TIME,
									IS_NEW: service.IS_NEW,
									PARENT_ID: service.PARENT_ID,
									IS_PARENT: service.IS_PARENT,
									SERVICE_IMAGE: service.SERVICE_IMAGE,
									IS_FOR_B2B: service.IS_FOR_B2B,
									IS_JOB_CREATED_DIRECTLY: service.IS_JOB_CREATED_DIRECTLY,
									IS_AVAILABLE: service.IS_AVAILABLE,
									ORG_ID: service.ORG_ID ? service.ORG_ID : '0',
									QTY: service.QTY,
									STATUS: service.STATUS,
									HSN_CODE_ID: service.HSN_CODE_ID,
									HSN_CODE: service.HSN_CODE,
									SUPPORT_KEY: supportKey
								};
								addGlobalData(results[0].ID, supportKey)
								SERVICE_LOGS.push(logData)
								const actionLog = {
									SOURCE_ID: serviceId,
									LOG_DATE_TIME: systemDate,
									LOG_TEXT: ACTION_DETAILS,
									CATEGORY: "territoryServiceNonAvailabilityMapping",
									CLIENT_ID: CLIENT_ID,
									USER_ID: req.body.authData.data.UserData[0].USER_ID,
									SUPPORT_KEY: supportKey,
								};
								callback();

							});
						} else {
							mm.executeDML(`INSERT INTO territory_service_non_availability_mapping (TERRITORY_ID, SERVICE_ID, IS_AVAILABLE, START_TIME, END_TIME, B2B_PRICE, B2C_PRICE, TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, IS_EXPRESS, NAME, DESCRIPTION, SERVICE_IMAGE, SERVICE_TYPE, PREPARATION_MINUTES, PREPARATION_HOURS, CLIENT_ID, CATEGORY_NAME, SUB_CATEGORY_NAME,HSN_CODE_ID,HSN_CODE,UNIT_ID,TAX_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)`, [TERRITORY_ID, service.SERVICE_ID, service.IS_AVAILABLE ? 1 : 0, service.START_TIME, service.END_TIME, service.B2B_PRICE, service.B2C_PRICE, service.TECHNICIAN_COST, service.VENDOR_COST, service.EXPRESS_COST, service.IS_EXPRESS ? 1 : 0, service.NAME, service.DESCRIPTION, service.SERVICE_IMAGE, service.SERVICE_TYPE, service.PREPARATION_MINUTES, service.PREPARATION_HOURS, CLIENT_ID, service.CATEGORY_NAME, service.SUB_CATEGORY_NAME, service.HSN_CODE_ID, service.HSN_CODE, service.UNIT_ID, service.TAX_ID], supportKey, connection, (error, resultsService) => {
								if (error) {
									console.log(error);
									logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
									return callback(error);
								}

								const ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created a new service named ${service.NAME}.`;
								addGlobalData(resultsService.insertId, supportKey)
								const logData = {
									LOG_DATE_TIME: systemDate,
									LOG_TEXT: ACTION_DETAILS,
									LOG_TYPE: 'TERS',
									USER_ID: req.body.authData.data.UserData[0].USER_ID,
									ADDED_BY: req.body.authData.data.UserData[0].NAME,
									SERVICE_ID: resultsService.insertId,
									CUSTOMER_ID: service.CUSTOMER_ID,
									TERRITORY_ID: service.TERRITORY_ID,
									NAME: service.NAME,
									DESCRIPTION: service.DESCRIPTION,
									CATEGORY_NAME: service.CATEGORY_NAME,
									SUB_CATEGORY_NAME: service.SUB_CATEGORY_NAME,
									SUB_CATEGORY_ID: service.SUB_CATEGORY_ID,
									B2B_PRICE: service.B2B_PRICE,
									B2C_PRICE: service.B2C_PRICE,
									TECHNICIAN_COST: service.TECHNICIAN_COST,
									VENDOR_COST: service.VENDOR_COST,
									EXPRESS_COST: service.EXPRESS_COST,
									IS_EXPRESS: service.IS_EXPRESS,
									SERVICE_TYPE: service.SERVICE_TYPE,
									DURATION_HOUR: service.DURATION_HOUR,
									DURATION_MIN: service.DURATION_MIN,
									PREPARATION_MINUTES: service.PREPARATION_MINUTES,
									PREPARATION_HOURS: service.PREPARATION_HOURS,
									UNIT_ID: service.UNIT_ID,
									UNIT_NAME: service.UNIT_NAME,
									SHORT_CODE: service.SHORT_CODE,
									MAX_QTY: service.MAX_QTY,
									TAX_ID: service.TAX_ID,
									TAX_NAME: service.TAX_NAME,
									START_TIME: service.START_TIME,
									END_TIME: service.END_TIME,
									IS_NEW: service.IS_NEW,
									PARENT_ID: service.PARENT_ID,
									IS_PARENT: service.IS_PARENT,
									SERVICE_IMAGE: service.SERVICE_IMAGE,
									IS_FOR_B2B: service.IS_FOR_B2B,
									IS_JOB_CREATED_DIRECTLY: service.IS_JOB_CREATED_DIRECTly,
									IS_AVAILABLE: service.IS_AVAILABLE,
									ORG_ID: service.ORG_ID,
									QTY: service.QTY,
									STATUS: service.STATUS,
									HSN_CODE_ID: service.HSN_CODE_ID,
									HSN_CODE: service.HSN_CODE,
									SUPPORT_KEY: supportKey
								};
								SERVICE_LOGS.push(logData)
								const actionLog = {
									SOURCE_ID: resultsService.insertId,
									LOG_DATE_TIME: systemDate,
									LOG_TEXT: ACTION_DETAILS,
									CATEGORY: "territoryServiceNonAvailabilityMapping",
									CLIENT_ID: CLIENT_ID,
									USER_ID: req.body.authData.data.UserData[0].USER_ID,
									SUPPORT_KEY: supportKey,
								};
								callback();
							});
						}
					}
				});
			}, (err) => {
				if (err) {
					mm.rollbackConnection(connection);
					res.send({
						"code": 400,
						"message": "Failed to save vendor information."
					});
				} else {
					dbm.saveLog(SERVICE_LOGS, servicelog);
					mm.commitConnection(connection);
					res.send({
						"code": 200,
						"message": "Vendor information updated/inserted successfully."
					});
				}
			});
		}
	} catch (error) {
		logger.error(`${supportKey} ${req.method} ${req.url} ${JSON.stringify(error)}`, applicationkey);
		console.log(error);
		res.send({
			"code": 500,
			"message": "Something went wrong."
		});
	}
};


exports.mapNonServiceTeritory = (req, res) => {
	const { TERRITORY_ID, service_ids, CLIENT_ID } = req.body;
	const supportKey = req.headers['supportkey'];
	const systemDate = mm.getSystemDate();

	if (!Array.isArray(service_ids) || service_ids.length === 0) {
		return res.status(400).send({
			code: 400,
			message: "service_ids must be a non-empty array."
		});
	}

	if (!TERRITORY_ID) {
		return res.send({
			code: 400,
			message: "Missing required fields in the request body.",
		});
	}

	try {
		var SERVICE_LOGS = []
		const connection = mm.openConnection();
		async.eachSeries(service_ids, (SERVICE_ID, inner_callback) => {
			mm.executeDML(`SELECT * FROM view_service_master WHERE ID = ?`, [SERVICE_ID], supportKey, connection, (error, serviceData) => {
				if (error || !serviceData || serviceData.length === 0) {
					console.log(`Error or no data found for SERVICE_ID ${SERVICE_ID}:`, error);
					return inner_callback(error || new Error(`No service data found for SERVICE_ID: ${SERVICE_ID}`));
				}

				const service = serviceData[0];


				mm.executeDML(`SELECT * FROM territory_service_non_availability_mapping WHERE TERRITORY_ID = ? AND SERVICE_ID = ?`, [TERRITORY_ID, SERVICE_ID], supportKey, connection, (error, mappingData) => {
					if (error) {
						console.log("Error checking existing mapping:", error);
						return inner_callback(error);
					}

					const actionDetails = `${req.body.authData.data.UserData[0].NAME} has ${mappingData.length > 0 ? 'updated' : 'created'} TERS for service ${service.NAME}.`;

					if (mappingData.length > 0) {

						mm.executeDML(`UPDATE territory_service_non_availability_mapping SET START_TIME = ?, END_TIME = ?, B2B_PRICE = ?, B2C_PRICE = ?, TECHNICIAN_COST = ?, VENDOR_COST = ?, EXPRESS_COST = ?, CATEGORY_NAME = ?, SUB_CATEGORY_NAME = ?, IS_EXPRESS = ?, NAME = ?, DESCRIPTION = ?, SERVICE_IMAGE = ?, SERVICE_TYPE = ?, PREPARATION_MINUTES = ?, PREPARATION_HOURS = ?, IS_AVAILABLE = ?,HSN_CODE_ID = ?, HSN_CODE = ?,UNIT_ID = ?,TAX_ID = ? WHERE ID = ?`,
							[service.START_TIME, service.END_TIME, service.B2B_PRICE, service.B2C_PRICE, service.TECHNICIAN_COST, service.VENDOR_COST, service.EXPRESS_COST, service.CATEGORY_NAME, service.SUB_CATEGORY_NAME, service.IS_EXPRESS, service.NAME, service.DESCRIPTION, service.SERVICE_IMAGE, service.SERVICE_TYPE, service.PREPARATION_MINUTES, service.PREPARATION_HOURS, service.STATUS, service.HSN_CODE_ID, service.HSN_CODE, service.UNIT_ID, service.TAX_ID, mappingData[0].ID], supportKey, connection, (error) => {
								if (error) {
									console.log("Error updating mapping:", error);
									return inner_callback(error);
								} else {
									const logData = {
										LOG_DATE_TIME: mm.getSystemDate(),
										LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} has updated TERS for service ${serviceData[0].NAME}.`,
										LOG_TYPE: 'TERS',
										USER_ID: req.body.authData.data.UserData[0].USER_ID,
										ADDED_BY: req.body.authData.data.UserData[0].NAME,
										SERVICE_ID: SERVICE_ID,
										CUSTOMER_ID: serviceData[0].CUSTOMER_ID,
										TERRITORY_ID: TERRITORY_ID,
										NAME: serviceData[0].NAME,
										DESCRIPTION: serviceData[0].DESCRIPTION,
										CATEGORY_NAME: serviceData[0].CATEGORY_NAME,
										SUB_CATEGORY_NAME: serviceData[0].SUB_CATEGORY_NAME,
										SUB_CATEGORY_ID: serviceData[0].SUB_CATEGORY_ID,
										B2B_PRICE: serviceData[0].B2B_PRICE,
										B2C_PRICE: serviceData[0].B2C_PRICE,
										TECHNICIAN_COST: serviceData[0].TECHNICIAN_COST,
										VENDOR_COST: serviceData[0].VENDOR_COST,
										EXPRESS_COST: serviceData[0].EXPRESS_COST,
										IS_EXPRESS: serviceData[0].IS_EXPRESS,
										SERVICE_TYPE: serviceData[0].SERVICE_TYPE,
										DURATION_HOUR: serviceData[0].DURARTION_HOUR,
										DURATION_MIN: serviceData[0].DURARTION_MIN,
										PREPARATION_MINUTES: serviceData[0].PREPARATION_MINUTES,
										PREPARATION_HOURS: serviceData[0].PREPARATION_HOURS,
										UNIT_ID: serviceData[0].UNIT_ID,
										UNIT_NAME: serviceData[0].UNIT_NAME,
										SHORT_CODE: serviceData[0].SHORT_CODE,
										MAX_QTY: serviceData[0].MAX_QTY,
										TAX_ID: serviceData[0].TAX_ID,
										TAX_NAME: serviceData[0].TAX_NAME,
										START_TIME: serviceData[0].START_TIME,
										END_TIME: serviceData[0].END_TIME,
										IS_NEW: serviceData[0].IS_NEW,
										PARENT_ID: serviceData[0].PARENT_ID,
										IS_PARENT: serviceData[0].IS_PARENT,
										SERVICE_IMAGE: serviceData[0].SERVICE_IMAGE,
										IS_FOR_B2B: serviceData[0].IS_FOR_B2B,
										IS_JOB_CREATED_DIRECTLY: serviceData[0].IS_JOB_CREATED_DIRECTLY,
										IS_AVAILABLE: serviceData[0].IS_AVAILABLE,
										ORG_ID: serviceData[0].ORG_ID,
										QTY: serviceData[0].QTY,
										STATUS: serviceData[0].STATUS,
										HSN_CODE_ID: serviceData[0].HSN_CODE_ID,
										HSN_CODE: serviceData[0].HSN_CODE,
										SUPPORT_KEY: supportKey
									};

									SERVICE_LOGS.push(logData)
									addGlobalData(mappingData[0].ID, supportKey)

									const actionLog = {
										SOURCE_ID: SERVICE_ID,
										LOG_DATE_TIME: systemDate,
										LOG_TEXT: actionDetails,
										CATEGORY: "TERS",
										CLIENT_ID: CLIENT_ID,
										USER_ID: req.body.authData.data.UserData[0].USER_ID,
										supportKey,
									};
									inner_callback();
								}
							});
					} else {
						mm.executeDML(`INSERT INTO territory_service_non_availability_mapping (TERRITORY_ID, SERVICE_ID, IS_AVAILABLE, START_TIME, END_TIME, B2B_PRICE, B2C_PRICE, TECHNICIAN_COST, VENDOR_COST, EXPRESS_COST, CATEGORY_NAME, SUB_CATEGORY_NAME, IS_EXPRESS, NAME, DESCRIPTION, SERVICE_IMAGE, CLIENT_ID, SERVICE_TYPE, PREPARATION_MINUTES, PREPARATION_HOURS,HSN_CODE_ID,HSN_CODE,UNIT_ID,TAX_ID) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?,?)`,
							[TERRITORY_ID, SERVICE_ID, service.STATUS, service.START_TIME, service.END_TIME, service.B2B_PRICE, service.B2C_PRICE, service.TECHNICIAN_COST, service.VENDOR_COST, service.EXPRESS_COST, service.CATEGORY_NAME, service.SUB_CATEGORY_NAME, service.IS_EXPRESS, service.NAME, service.DESCRIPTION, service.SERVICE_IMAGE, CLIENT_ID, service.SERVICE_TYPE, service.PREPARATION_MINUTES, service.PREPARATION_HOURS, service.HSN_CODE_ID, service.HSN_CODE, service.UNIT_ID, service.TAX_ID,], supportKey, connection, (error, resultsTer) => {
								if (error) {
									console.log("Error inserting mapping:", error);
									return inner_callback(error);
								} else {
									const logData = {
										LOG_DATE_TIME: mm.getSystemDate(),
										LOG_TEXT: `${req.body.authData.data.UserData[0].NAME} has updated TERS for service ${serviceData[0].NAME}.`,
										LOG_TYPE: 'TERS',
										USER_ID: req.body.authData.data.UserData[0].USER_ID,
										ADDED_BY: req.body.authData.data.UserData[0].NAME,
										SERVICE_ID: SERVICE_ID,
										CUSTOMER_ID: serviceData[0].CUSTOMER_ID,
										TERRITORY_ID: TERRITORY_ID,
										NAME: serviceData[0].NAME,
										DESCRIPTION: serviceData[0].DESCRIPTION,
										CATEGORY_NAME: serviceData[0].CATEGORY_NAME,
										SUB_CATEGORY_NAME: serviceData[0].SUB_CATEGORY_NAME,
										SUB_CATEGORY_ID: serviceData[0].SUB_CATEGORY_ID,
										B2B_PRICE: serviceData[0].B2B_PRICE,
										B2C_PRICE: serviceData[0].B2C_PRICE,
										TECHNICIAN_COST: serviceData[0].TECHNICIAN_COST,
										VENDOR_COST: serviceData[0].VENDOR_COST,
										EXPRESS_COST: serviceData[0].EXPRESS_COST,
										IS_EXPRESS: serviceData[0].IS_EXPRESS,
										SERVICE_TYPE: serviceData[0].SERVICE_TYPE,
										DURATION_HOUR: serviceData[0].DURARTION_HOUR,
										DURATION_MIN: serviceData[0].DURARTION_MIN,
										PREPARATION_MINUTES: serviceData[0].PREPARATION_MINUTES,
										PREPARATION_HOURS: serviceData[0].PREPARATION_HOURS,
										UNIT_ID: serviceData[0].UNIT_ID,
										UNIT_NAME: serviceData[0].UNIT_NAME,
										SHORT_CODE: serviceData[0].SHORT_CODE,
										MAX_QTY: serviceData[0].MAX_QTY,
										TAX_ID: serviceData[0].TAX_ID,
										TAX_NAME: serviceData[0].TAX_NAME,
										START_TIME: serviceData[0].START_TIME,
										END_TIME: serviceData[0].END_TIME,
										IS_NEW: serviceData[0].IS_NEW,
										PARENT_ID: serviceData[0].PARENT_ID,
										IS_PARENT: serviceData[0].IS_PARENT,
										SERVICE_IMAGE: serviceData[0].SERVICE_IMAGE,
										IS_FOR_B2B: serviceData[0].IS_FOR_B2B,
										IS_JOB_CREATED_DIRECTLY: serviceData[0].IS_JOB_CREATED_DIRECTLY,
										ORG_ID: serviceData[0].ORG_ID,
										QTY: serviceData[0].QTY,
										STATUS: serviceData[0].STATUS,
										HSN_CODE_ID: serviceData[0].HSN_CODE_ID,
										HSN_CODE: serviceData[0].HSN_CODE,
										SUPPORT_KEY: supportKey
									};
									addGlobalData(resultsTer.insertId, supportKey)
									SERVICE_LOGS.push(logData)
									const actionLog = {
										SOURCE_ID: SERVICE_ID,
										LOG_DATE_TIME: systemDate,
										LOG_TEXT: actionDetails,
										CATEGORY: "TERS",
										CLIENT_ID: CLIENT_ID,
										USER_ID: req.body.authData.data.UserData[0].USER_ID,
										supportKey,
									};
									inner_callback();
								}
							});
					}
				});
			});
		}, (error) => {
			if (error) {
				mm.rollbackConnection(connection);
				res.send({
					code: 400,
					message: "Failed to insert/update territory_service_non_availability_mapping."
				});
			} else {
				dbm.saveLog(SERVICE_LOGS, servicelog);
				mm.commitConnection(connection);
				res.send({
					code: 200,
					message: "Territory service non-availability mappings successfully updated."
				});
			}
		});
	} catch (error) {
		console.error("Unexpected error:", error);
		res.send({
			code: 500,
			message: "Something went wrong."
		});
	}
};



function addGlobalData(data_Id, supportKey) {
	try {
		console.log("\n\n\n\nim in Global Data")
		mm.executeQueryData(`select * from territory_service_non_availability_mapping where ID = ?`, [data_Id], supportKey, (error, results5) => {
			if (error) {
				console.error(error);
			} else {
				if (results5.length > 0) {
					let logData = { ID: results5[0].SERVICE_ID, CATEGORY: "Service", TITLE: results5[0].NAME, DATA: JSON.stringify(results5[0]), ROUTE: "/masters/service-master", TERRITORY_ID: results5[0].TERRITORY_ID };
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