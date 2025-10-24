const express = require('express');
const router = express.Router();
const districtService = require('../../services/Masters/district');

router
.post('/get',districtService.get)
.post('/create',districtService.validate(),districtService.create)
.put('/update',districtService.validate(),districtService.update)


module.exports = router;