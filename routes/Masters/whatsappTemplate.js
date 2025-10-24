const express = require('express');
const router = express.Router();
const whatsAppTemplateService = require('../../services/Masters/whatsappTemplate');

router
.post('/get',whatsAppTemplateService.get)
.post('/create',whatsAppTemplateService.validate(),whatsAppTemplateService.create)
.put('/update',whatsAppTemplateService.validate(),whatsAppTemplateService.update)


module.exports = router;