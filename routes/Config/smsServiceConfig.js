const express = require('express');
const router = express.Router();
const smsServiceConfigService = require('../../services/Config/smsServiceConfig');

router
.post('/get',smsServiceConfigService.get)
.post('/create',smsServiceConfigService.validate(),smsServiceConfigService.create)
.put('/update',smsServiceConfigService.validate(),smsServiceConfigService.update)


module.exports = router;