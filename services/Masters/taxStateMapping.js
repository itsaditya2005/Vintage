const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")

const applicationkey = process.env.APPLICATION_KEY;
const async = require('async');
var taxStateMapping = "tax_state_mapping";
var viewTaxStateMapping = "view_" + taxStateMapping;


function reqData(req) {

	var data = {
		TAX_ID: req.body.TAX_ID,
		STATE_ID: req.body.STATE_ID,
		IS_ACTIVE: req.body.IS_ACTIVE ? '1' : '0',
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('TAX_ID').isInt().optional(),
		body('STATE_ID').isInt().optional(),
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
			mm.executeQuery('select count(*) as cnt from ' + viewTaxStateMapping + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get taxStateMapping count.",
					});
				}
				else {
					mm.executeQuery('select * from ' + viewTaxStateMapping + ' where 1 ' + criteria, supportKey, (error, results) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get taxStateMapping information."
							});
						}
						else {
							res.send({
								"code": 200,
								"message": "success",
								"TAB_ID": 106,
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
			mm.executeQueryData('INSERT INTO ' + taxStateMapping + ' SET ?', data, supportKey, (error, results) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to save taxStateMapping information..."
					});
				}
				else {
					var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has created tax state mapping`;

					var logCategory = "tax state mapping"

					let actionLog = {
						"SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
					}

					dbm.saveLog(actionLog, systemLog)
					res.send({
						"code": 200,
						"message": "TaxStateMapping information saved successfully...",
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
			mm.executeQueryData(`UPDATE ` + taxStateMapping + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
				if (error) {
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					console.log(error);
					res.send({
						"code": 400,
						"message": "Failed to update taxStateMapping information."
					});
				}
				else {
					var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has updated tax state mapping.`;
					var logCategory = "tax state mapping"

					let actionLog = {
						"SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
					}

					dbm.saveLog(actionLog, systemLog)
					res.send({
						"code": 200,
						"message": "TaxStateMapping information updated successfully...",
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

exports.addBulk = (req, res) => {

	var TAX_ID = req.body.TAX_ID;
	var data = req.body.data;
	var CLIENT_ID = req.body.CLIENT_ID;
	var supportKey = req.headers['supportkey'];

	try {
		const connection = mm.openConnection()
		async.eachSeries(data, function iteratorOverElems(roleDetailsItem, inner_callback) {
			mm.executeDML(`select * from tax_State_Mapping where STATE_ID=? and TAX_ID=?`, [roleDetailsItem.STATE_ID, TAX_ID], supportKey, connection, (error, resultsIsDataPresent) => {
				if (error) {
					console.log(error);
					inner_callback(error);
				} else {
					if (resultsIsDataPresent.length > 0) {
						mm.executeDML(`update tax_State_Mapping set IS_ACTIVE = ? where  ID = ?`, [roleDetailsItem.IS_ACTIVE, resultsIsDataPresent[0].ID], supportKey, connection, (error, resultsUpdate) => {
							if (error) {
								console.log("error", error);
								inner_callback(error);
							} else {
								inner_callback(null);
							}
						});
					} else {
						mm.executeDML('INSERT INTO tax_State_Mapping (STATE_ID,TAX_ID,IS_ACTIVE,CLIENT_ID) VALUES (?,?,?,?)', [roleDetailsItem.STATE_ID, TAX_ID, roleDetailsItem.IS_ACTIVE, CLIENT_ID], supportKey, connection, (error, resultsInsert) => {
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
					"message": "Failed to Insert taxStateMapping information..."
				});
			} else {
				var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has mapped tax to state`;

				var logCategory = "tax state mapping"

				let actionLog = {
					"SOURCE_ID": TAX_ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
				}

				dbm.saveLog(actionLog, systemLog)
				mm.commitConnection(connection);
				res.send({
					"code": 200,
					"message": "New taxStateMapping Successfully added",
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

