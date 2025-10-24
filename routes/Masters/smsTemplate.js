const express = require('express');
const router = express.Router();
const smsTemplateService = require('../../services/Masters/smsTemplate');

router
.post('/get',smsTemplateService.get)
.post('/create',smsTemplateService.validate(),smsTemplateService.create)
.put('/update',smsTemplateService.validate(),smsTemplateService.update)


module.exports = router;