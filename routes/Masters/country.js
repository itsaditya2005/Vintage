const express = require('express');
const router = express.Router();
const countryService = require('../../services/Masters/country');

router
.post('/get',countryService.get)
.post('/create',countryService.validate(),countryService.create)
.put('/update',countryService.validate(),countryService.update)


module.exports = router;