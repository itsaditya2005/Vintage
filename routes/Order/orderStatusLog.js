const express = require('express');
const router = express.Router();
const orderStatusLogService = require('../../services/Order/orderStatusLog');

router
.post('/get',orderStatusLogService.get)
.post('/create',orderStatusLogService.validate(),orderStatusLogService.create)
.put('/update',orderStatusLogService.validate(),orderStatusLogService.update)


module.exports = router;