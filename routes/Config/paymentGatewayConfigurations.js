const express = require('express');
const router = express.Router();
const paymentGatewayConfigurationsService = require('../../services/Config/paymentGatewayConfigurations');

router
.post('/get',paymentGatewayConfigurationsService.get)
.post('/create',paymentGatewayConfigurationsService.validate(),paymentGatewayConfigurationsService.create)
.put('/update',paymentGatewayConfigurationsService.validate(),paymentGatewayConfigurationsService.update)


module.exports = router;