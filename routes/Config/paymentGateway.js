const express = require('express');
const router = express.Router();
const paymentGatewayService = require('../../services/Config/paymentGateway');

router
.post('/get',paymentGatewayService.get)
.post('/create',paymentGatewayService.validate(),paymentGatewayService.create)
.put('/update',paymentGatewayService.validate(),paymentGatewayService.update)


module.exports = router;