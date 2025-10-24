const express = require('express');
const router = express.Router();
const warehouseLocationsService = require('../../services/Inventory/warehouseLocations');

router
.post('/get',warehouseLocationsService.get)
.post('/create',warehouseLocationsService.validate(),warehouseLocationsService.create)
.put('/update',warehouseLocationsService.validate(),warehouseLocationsService.update)


module.exports = router;