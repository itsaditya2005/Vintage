
const mm = require('../../utilities/globalModule');
const logger = require("../../utilities/logger");
const { validationResult, body } = require('express-validator');
const dbm = require('../../utilities/dbMongo');
const systemLog = require("../../modules/systemLog")
const technicianActionlog = require('../../modules/technicianActionLog')
const applicationkey = process.env.APPLICATION_KEY;

var customerTechnicianFeedback = "customer_technician_feedback";
var viewCustomerTechnicianFeedback = "view_" + customerTechnicianFeedback;


function reqData(req) {

	var data = {
		ORDER_ID: req.body.ORDER_ID,
		CUSTOMER_ID: req.body.CUSTOMER_ID,
		JOB_CARD_ID: req.body.JOB_CARD_ID,
		TECHNICIAN_ID: req.body.TECHNICIAN_ID,
		RATING: req.body.RATING,
		COMMENTS: req.body.COMMENTS,
		FEEDBACK_DATE_TIME: req.body.FEEDBACK_DATE_TIME,
		CLIENT_ID: req.body.CLIENT_ID
	}
	return data;
}

exports.validate = function () {
	return [
		body('ORDER_ID').isInt().optional(),
		body('CUSTOMER_ID').isInt().optional(),
		body('JOB_CARD_ID').isInt().optional(),
		body('TECHNICIAN_ID').isInt().optional(),
		body('RATING').isInt().optional(),
		body('COMMENTS').optional(),
		body('FEEDBACK_DATE_TIME').optional(),
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
			mm.executeQuery('select count(*) as cnt from ' + viewCustomerTechnicianFeedback + ' where 1 ' + countCriteria, supportKey, (error, results1) => {
				if (error) {
					console.log(error);

					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get customerTechnicianFeedback count.",
					});
				}
				else {

					mm.executeQuery('select * from ' + viewCustomerTechnicianFeedback + ' where 1 ' + criteria, supportKey, (error, results) => {
						if (error) {
							console.log(error);

							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get customerTechnicianFeedback information."
							});
						}
						else {
							res.send({
								"code": 200,
								"message": "success",
								"TAB_ID": 23,
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
			mm.executeQueryData('INSERT INTO ' + customerTechnicianFeedback + ' SET ?', data, supportKey, (error, results) => {
				if (error) {
					console.log(error);

					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to save customerTechnicianFeedback information..."
					});
				}
				else {
					mm.executeQueryData('SELECT cast(AVG(RATING) as decimal(10,2)) AVG_RATINGS FROM customer_technician_feedback  WHERE TECHNICIAN_ID = ?', [data.TECHNICIAN_ID], supportKey, (error, resultsCheck) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to save customerTechnicianFeedback information..."
							});
						}
						else {
							mm.executeQueryData('UPDATE technician_master SET AVRAGE_REVIEW = ?,LETEST_REVIEW =? WHERE ID = ?', [resultsCheck[0].AVG_RATINGS, data.RATING, data.TECHNICIAN_ID], supportKey, (error, results) => {
								if (error) {
									console.log(error);
									logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
									res.send({
										"code": 400,
										"message": "Failed to save customerTechnicianFeedback information..."
									});
								}
								else {
									var ACTION_DETAILS = `User ${req.body.authData.data.UserData[0].NAME} has added technician feedback.`;

									var logCategory = "customer technicians feedback";

									let actionLog = {
										"SOURCE_ID": results.insertId, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
									}
									dbm.saveLog(actionLog, systemLog)
									res.send({
										"code": 200,
										"message": "CustomerTechnicianFeedback information saved successfully...",
									});
								}
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
	if (data.COMMENTS == null) {
		setData += "COMMENTS = ? , ";
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
			mm.executeQueryData(`UPDATE ` + customerTechnicianFeedback + ` SET ${setData} CREATED_MODIFIED_DATE = '${systemDate}' where ID = ${criteria.ID} `, recordData, supportKey, (error, results) => {
				if (error) {

					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					console.log(error);
					res.send({
						"code": 400,
						"message": "Failed to update customerTechnicianFeedback information."
					});
				}
				else {

					var ACTION_DETAILS = `${req.body.authData.data.UserData[0].NAME} has updated the details of the customer technician feedback.`;


					var logCategory = "customer technicians feedback";

					let actionLog = {
						"SOURCE_ID": criteria.ID, "LOG_DATE_TIME": mm.getSystemDate(), "LOG_TEXT": ACTION_DETAILS, "CATEGORY": logCategory, "CLIENT_ID": 1, "USER_ID": req.body.authData.data.UserData[0].USER_ID, "supportKey": 0
					}
					dbm.saveLog(actionLog, systemLog)
					res.send({
						"code": 200,
						"message": "CustomerTechnicianFeedback information updated successfully...",
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


exports.getCustomerTechnicianFeedback = (req, res) => {
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
	let CUSTOMER_MANAGER_ID = req.body.CUSTOMER_MANAGER_ID ? req.body.CUSTOMER_MANAGER_ID : '';

	let criteria = '';
	if (pageIndex === '' && pageSize === '') {
		criteria = filter + " order by " + sortKey + " " + sortValue;
	} else {
		criteria = filter + " order by " + sortKey + " " + sortValue + " LIMIT " + start + "," + end;
	}
	let FilterManager = '';
	let FilterManager2 = '';
	if (CUSTOMER_MANAGER_ID != '') {
		FilterManager += " AND f.CUSTOMER_MANAGER_ID = " + CUSTOMER_MANAGER_ID;
		FilterManager2 += " AND CUSTOMER_MANAGER_ID = " + CUSTOMER_MANAGER_ID;
	}

	let countCriteria = filter;
	var supportKey = req.headers['supportkey'];

	try {
		if (IS_FILTER_WRONG == "0") {
			mm.executeQuery('select count(*) as cnt from ' + viewCustomerTechnicianFeedback + ' where 1 ' + FilterManager2 + ' ' + countCriteria, supportKey, (error, results1) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					res.send({
						"code": 400,
						"message": "Failed to get customerTechnicianFeedback count.",
					});
				} else {
					mm.executeQuery('select * from ' + viewCustomerTechnicianFeedback + ' where 1 ' + FilterManager2 + ' ' + criteria, supportKey, (error, results) => {
						if (error) {
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to get customerTechnicianFeedback information."
							});
						} else {
							var QUERY = ` SELECT r.rating, COUNT(f.rating) AS rating_count, COALESCE(ROUND((COUNT(f.rating) * 100 / (SELECT COUNT(*) FROM view_customer_technician_feedback WHERE 1 ${filter + FilterManager2}))), 0) AS progress_percentage FROM ( SELECT 1 AS rating UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 ) AS r LEFT JOIN view_customer_technician_feedback f ON r.rating = f.rating AND 1 ${filter + FilterManager} GROUP BY r.rating ORDER BY r.rating;`;
							var AVG_RATING_QUERY = ` SELECT ROUND(AVG(RATING)) AS AVG_RATING FROM view_customer_technician_feedback WHERE 1 ${filter + FilterManager2}; `

							mm.executeQuery(QUERY, supportKey, (error, progressResults) => {
								if (error) {
									console.log(error);
									logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
									res.send({
										"code": 400,
										"message": "Failed to calculate progress."
									});
								} else {
									mm.executeQuery(AVG_RATING_QUERY, supportKey, (error, avgResults) => {
										if (error) {
											console.log(error);
											logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
											res.send({
												"code": 400,
												"message": "Failed to calculate average rating."
											});
										} else {
											res.send({
												"code": 200,
												"message": "success",
												"count": results1[0].cnt,
												"data": results,
												"progress": progressResults,
												"averageRating": avgResults[0].AVG_RATING
											});
										}
									});
								}
							});
						}
					});
				}
			});
		} else {
			res.send({
				code: 400,
				message: "Invalid filter parameter."
			});
		}
	} catch (error) {
		logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
		console.log(error);
		res.send({
			"code": 500,
			"message": "something went wrong"
		});
	}
};


exports.technicianServiceFeedbackByCustomer = (req, res) => {


	const { ORDER_ID, CUSTOMER_ID, SERVICE_ID, JOB_CARD_ID, TECHNICIAN_RATING, SERVICE_RATING, SERVICE_COMMENTS, TECHNICIAN_COMMENTS, TECHNICIAN_ID, TECHNICIAN_NAME, CUSTOMER_NAME, ORDER_NUMBER } = req.body
	FEEDBACK_DATE_TIME = mm.getSystemDate()
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
			const connection = mm.openConnection()
			mm.executeDML(`INSERT INTO customer_service_feedback (ORDER_ID,CUSTOMER_ID,SERVICE_ID,JOB_CARD_ID,RATING,COMMENTS,FEEDBACK_DATE_TIME,CLIENT_ID) values (?,?,?,?,?,?,?,?)`, [ORDER_ID, CUSTOMER_ID, SERVICE_ID, JOB_CARD_ID, SERVICE_RATING, SERVICE_COMMENTS, FEEDBACK_DATE_TIME, 1], supportKey, connection, (error, resultServiceRate) => {
				if (error) {
					console.log(error);
					logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
					mm.rollbackConnection(connection)
					res.send({
						"code": 400,
						"message": "Failed to save customerTechnicianFeedback information..."
					});
				}
				else {
					mm.executeDML(`INSERT INTO customer_technician_feedback (ORDER_ID,CUSTOMER_ID,JOB_CARD_ID,TECHNICIAN_ID,RATING,COMMENTS,FEEDBACK_DATE_TIME,CLIENT_ID) values (?,?,?,?,?,?,?,?)`, [ORDER_ID, CUSTOMER_ID, JOB_CARD_ID, TECHNICIAN_ID, TECHNICIAN_RATING, TECHNICIAN_COMMENTS, FEEDBACK_DATE_TIME, 1], supportKey, connection, (error, resultTechnicianRate) => {
						if (error) {
							mm.rollbackConnection(connection)
							console.log(error);
							logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
							res.send({
								"code": 400,
								"message": "Failed to save customerTechnicianFeedback information..."
							});
						}
						else {
							mm.executeDML('UPDATE technician_master SET AVRAGE_REVIEW = (SELECT cast(AVG(RATING) as decimal(10,2)) AVG_RATINGS FROM customer_technician_feedback  WHERE TECHNICIAN_ID = ?),LETEST_REVIEW =? WHERE ID = ?', [TECHNICIAN_ID, TECHNICIAN_RATING, TECHNICIAN_ID], supportKey, connection, (error, results) => {
								if (error) {
									console.log(error);
									logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
									res.send({
										"code": 400,
										"message": "Failed to save customerTechnicianFeedback information..."
									});
								}
								else {
									mm.executeQueryData('SELECT * FROM view_job_card WHERE ORDER_ID = ? AND ID = ? AND CUSTOMER_ID = ?', [ORDER_ID, JOB_CARD_ID, CUSTOMER_ID], supportKey, (error, resultsGet) => {
										if (error) {
											console.log(error);
											logger.error(supportKey + ' ' + req.method + " " + req.url + ' ' + JSON.stringify(error), applicationkey);
											res.send({
												"code": 400,
												"message": "Failed to save technicianCustomerFeedback information..."
											});
										}
										else {
											var ACTION_DETAILS = `Customer ${CUSTOMER_NAME} has given ratings for the service and technician.`
											const logData = { TECHNICIAN_ID: TECHNICIAN_ID, VENDOR_ID: 0, ORDER_ID: ORDER_ID, JOB_CARD_ID: JOB_CARD_ID, CUSTOMER_ID: CUSTOMER_ID, LOG_TYPE: 'Job', ACTION_LOG_TYPE: 'Customer', ACTION_DETAILS: ACTION_DETAILS, USER_ID: CUSTOMER_ID, TECHNICIAN_NAME: TECHNICIAN_NAME, ORDER_DATE_TIME: null, CART_ID: 0, EXPECTED_DATE_TIME: null, ORDER_MEDIUM: null, ORDER_STATUS: "Feedback given by customer", PAYMENT_MODE: null, PAYMENT_STATUS: null, TOTAL_AMOUNT: 0, ORDER_NUMBER: ORDER_NUMBER, TASK_DESCRIPTION: "", ESTIMATED_TIME_IN_MIN: 0, PRIORITY: null, JOB_CARD_STATUS: "Feedback given by customer", USER_NAME: CUSTOMER_NAME, DATE_TIME: FEEDBACK_DATE_TIME, supportKey: 0 }
											dbm.saveLog(logData, technicianActionlog)
											mm.commitConnection(connection)
											mm.sendNotificationToTechnician(CUSTOMER_ID, TECHNICIAN_ID, "Customer Feedback", `You have received feedback from customer.`, "", "F", supportKey, "N", "F", resultsGet);
											res.send({
												"code": 200,
												"message": "Customer Feedback information saved successfully...",
											});
										}
									});
								}
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
				"message": "something went wrong"
			})
		}
	}
}


