const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');

const applicationkey = process.env.APPLICATION_KEY;

var whatsAppServiceConfig = "whats_app_service_config";
var viewWhatsAppServiceConfig = "view_" + whatsAppServiceConfig;

function reqData(req) {

	var data = {
		SERVICE_PROVIDER: req.body.SERVICE_PROVIDER,
		API_URL: req.body.API_URL,
		API_KEY: req.body.API_KEY,
		AUTHENTICATION_TYPE: req.body.AUTHENTICATION_TYPE,
		PHONE_NUMBER_ID: req.body.PHONE_NUMBER_ID,
		SENDER_PHONE_NUMBER: req.body.SENDER_PHONE_NUMBER,
		DEFAULT_COUNTRY_CODE: req.body.DEFAULT_COUNTRY_CODE,
		RETRY_ATTEMPTS: req.body.RETRY_ATTEMPTS,
		TIMEOUT_SECONDS: req.body.TIMEOUT_SECONDS,
		IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
		CREATED_AT: req.body.CREATED_AT,
		UPDATED_AT: req.body.UPDATED_AT,
		NOTES: req.body.NOTES,
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('SERVICE_PROVIDER').optional(),
		body('API_URL').optional(),
		body('API_KEY').optional(),
		body('AUTHENTICATION_TYPE').optional(),
		body('PHONE_NUMBER_ID').optional(),
		body('SENDER_PHONE_NUMBER').optional(),
		body('SENDER_PHONE_NUMBER').optional(),
		body('DEFAULT_COUNTRY_CODE').optional(),
		body('RETRY_ATTEMPTS').optional(),
		body('TIMEOUT_SECONDS').optional(),
		body('CREATED_AT').optional(),
		body('UPDATED_AT').optional(),
		body('NOTES').optional(),
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
			mm.executeQuery('select count(*) as cnt from ' + viewWhatsAppServiceConfig + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get whatsApp service config count.",
					});
				}
				else {
					mm.executeQuery('select * from ' + viewWhatsAppServiceConfig + ' where 1 ' + criteria, supportKey, (error, results) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get whatsApp service config information."
							});
						}
						else {
							res.send({
								"code": 200,
								"message": "success",
								"TAB_ID": 137,
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
			mm.executeQueryData('INSERT INTO ' + whatsAppServiceConfig + ' SET ?', data, supportKey, (error, results) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to save whatsApp service config information..."
					});
				}
				else {
					res.send({
						"code": 200,
						"message": "WhatsApp service config information saved successfully...",
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
		setData += `${key} = ?, `;
		recordData.push(data[key] !== undefined ? data[key] : null);
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
			mm.executeQueryData(`UPDATE ` + whatsAppServiceConfig + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
				if (error) {
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					console.log(error);
					res.send({
						"code": 400,
						"message": "Failed to update whatsApp service config information."
					});
				}
				else {
					res.send({
						"code": 200,
						"message": "WhatsApp service config information updated successfully...",
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