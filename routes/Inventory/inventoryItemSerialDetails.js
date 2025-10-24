const express = require('express');
const router = express.Router();
const inventoryItemSerialDetailsService = require('../../services/Inventory/inventoryItemSerialDetails');

router
.post('/get',inventoryItemSerialDetailsService.get)
.post('/create',inventoryItemSerialDetailsService.validate(),inventoryItemSerialDetailsService.create)
.put('/update',inventoryItemSerialDetailsService.validate(),inventoryItemSerialDetailsService.update)


module.exports = router;