const express = require('express');
const router = express.Router();
const inventoryPurchaseService = require('../../services/Inventory/inventoryPurchase');

router
    .post('/get', inventoryPurchaseService.get)
    .post('/getData', inventoryPurchaseService.getData)
    .post('/create', inventoryPurchaseService.validate(), inventoryPurchaseService.create)
    .put('/update', inventoryPurchaseService.validate(), inventoryPurchaseService.update)
    .post('/createPurchase', inventoryPurchaseService.createPurchase)
    .put('/updatePurchase', inventoryPurchaseService.updatePurchase)


module.exports = router;