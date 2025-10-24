const express = require('express');
const router = express.Router();
const couponDetailsService = require('../../services/Masters/couponDetails');

router
.post('/get',couponDetailsService.get)
.post('/create',couponDetailsService.validate(),couponDetailsService.create)
.put('/update',couponDetailsService.validate(),couponDetailsService.update)


module.exports = router;