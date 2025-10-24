const express = require('express');
const router = express.Router();
const technicianServiceCostMappingService = require('../../services/Masters/technicianServiceCostMapping');

router
.post('/get',technicianServiceCostMappingService.get)
.post('/create',technicianServiceCostMappingService.validate(),technicianServiceCostMappingService.create)
.put('/update',technicianServiceCostMappingService.validate(),technicianServiceCostMappingService.update)
.post('/addBulk',technicianServiceCostMappingService.addBulk)


module.exports = router;