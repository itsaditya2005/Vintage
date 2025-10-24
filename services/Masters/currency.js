const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const systemLog = require("../../modules/systemLog")
const dbm = require('../../utilities/dbMongo');

const applicationkey = process.env.APPLICATION_KEY;

var currencyMaster = "currency_master";
var viewCurrencyMaster = "view_" + currencyMaster;

function reqData(req) {
	var data = {
		CURRENCY_NAME: req.body.CURRENCY_NAME,
		SHORT_CODE: req.body.SHORT_CODE,
		DECIMAL_SEPARATOR: req.body.DECIMAL_SEPARATOR,
		EXCHANGE_RATE: req.body.EXCHANGE_RATE,
		DECIMAL_SPACE: req.body.DECIMAL_SPACE,
		THOUSAND_SEPERATOR: req.body.THOUSAND_SEPERATOR,
		SYMBOL: req.body.SYMBOL,
		COUNTRY_ID: req.body.COUNTRY_ID,
		IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
		ICON: req.body.ICON,
		SEQ_NO: req.body.SEQ_NO,
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('CURRENCY_NAME').optional(),
		body('SHORT_CODE').optional(),
		body('SIGN').optional(),
		body('SEQ_NO').isInt().optional(),
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
			mm.executeQuery('select count(*) as cnt from ' + viewCurrencyMaster + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get currency count.",
					});
				}
				else {
					mm.executeQuery('select * from ' + viewCurrencyMaster + ' where 1 ' + criteria, supportKey, (error, results) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get currency information."
							});
						}
						else {
							res.send({
								"code": 200,
								"message": "success",
								"TAB_ID": 16,
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
			mm.executeQueryData('SELECT SHORT_CODE FROM ' + currencyMaster + ' WHERE SHORT_CODE = ?', [data.SHORT_CODE], supportKey, (error, resultsCheck) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to save currency information..."
					});
				}
				else if (resultsCheck.length > 0) {
					return res.send({
						"code": 300,
						"message": "A currency with the same short code already exists."
					});
				}
				else {
					mm.executeQueryData('INSERT INTO ' + currencyMaster + ' SET ?', data, supportKey, (error, results) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to save currency information..."
							});
						}
						else {
							var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has created a new currency ,${data.CURRENCY_NAME}.`;
							var logCategory = "Currency"

							let actionLog = {
								"SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
							}
							dbm.saveLog(actionLog, systemLog)

							res.send({
								"code": 200,
								"message": "currency information saved successfully...",
							});
						}
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
			mm.executeQueryData('SELECT SHORT_CODE FROM ' + currencyMaster + ' WHERE SHORT_CODE = ? AND ID != ?', [data.SHORT_CODE, criteria.ID], supportKey, (error, resultsCheck) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to save currency information..."
					});
				}
				else if (resultsCheck.length > 0) {
					return res.send({
						"code": 300,
						"message": "A currency with the same short code already exists."
					});
				}
				else {
					mm.executeQueryData(`UPDATE ` + currencyMaster + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
						if (error) {
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							console.log(error);
							res.send({
								"code": 400,
								"message": "Failed to update currency information."
							});
						}
						else {
							var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated the details of the currency ${data.CURRENCY_NAME}..`;
							var logCategory = "Currency"

							let actionLog = {
								"SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
							}
							dbm.saveLog(actionLog, systemLog)

							res.send({
								"code": 200,
								"message": "currency information updated successfully...",
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
