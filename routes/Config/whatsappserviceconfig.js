const express = require('express');
const router = express.Router();
const whatsAppServiceConfigService = require('../../services/Config/whatsappserviceconfig');

router
.post('/get',whatsAppServiceConfigService.get)
.post('/create',whatsAppServiceConfigService.validate(),whatsAppServiceConfigService.create)
.put('/update',whatsAppServiceConfigService.validate(),whatsAppServiceConfigService.update)


module.exports = router;