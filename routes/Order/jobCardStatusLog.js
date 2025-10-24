const express = require('express');
const router = express.Router();
const jobCardStatusLogService = require('../../services/Order/jobCardStatusLog');

router
.post('/get',jobCardStatusLogService.get)
.post('/create',jobCardStatusLogService.validate(),jobCardStatusLogService.create)
.put('/update',jobCardStatusLogService.validate(),jobCardStatusLogService.update)


module.exports = router;