const express = require('express');
const router = express.Router();
const inventoryPurchaseDetailsService = require('../../services/Inventory/inventoryPurchaseDetails');

router
.post('/get',inventoryPurchaseDetailsService.get)
.post('/create',inventoryPurchaseDetailsService.validate(),inventoryPurchaseDetailsService.create)
.put('/update',inventoryPurchaseDetailsService.validate(),inventoryPurchaseDetailsService.update)


module.exports = router;