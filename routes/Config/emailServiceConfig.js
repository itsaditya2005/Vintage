const express = require('express');
const router = express.Router();
const emailServiceConfigService = require('../../services/Config/emailServiceConfig');

router
.post('/get',emailServiceConfigService.get)
.post('/create',emailServiceConfigService.validate(),emailServiceConfigService.create)
.put('/update',emailServiceConfigService.validate(),emailServiceConfigService.update)


module.exports = router;