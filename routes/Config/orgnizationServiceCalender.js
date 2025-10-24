const express = require('express');
const router = express.Router();
const orgnizationServiceCalenderService = require('../../services/Config/orgnizationServiceCalender');

router
.post('/get',orgnizationServiceCalenderService.get)
.post('/create',orgnizationServiceCalenderService.validate(),orgnizationServiceCalenderService.create)
.put('/update',orgnizationServiceCalenderService.validate(),orgnizationServiceCalenderService.update)


module.exports = router;