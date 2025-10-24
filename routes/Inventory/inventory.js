const express = require('express');
const router = express.Router();
const inventoryService = require('../../services/Inventory/inventory');
const inventoryImageMappingService = require('../../services/Inventory/inventoryImageMapping');

router
    .post('/get', inventoryService.get)
    .post('/getForCart', inventoryService.getForCart)
    .post('/getItemsForTechnician', inventoryService.getItemsForTechnician)
    .post('/getInventoryUniqueNo', inventoryService.getInventoryUniqueNo)
    .post('/getInventoryStock', inventoryService.getInventoryStock)
    .post('/getDetailedInventoryStock', inventoryService.getDetailedInventoryStock)
    .get('/getInventoryHirarchy', inventoryService.getInventoryHirarchy)
    .post('/getCustomItemHirarchy', inventoryService.getCustomItemHirarchy)
    .post('/create', inventoryService.validate(), inventoryService.createInventory)
    .put('/update', inventoryService.validate(), inventoryService.update)
    .post('/addOrUpdateInventory', inventoryService.addOrUpdateInventory)
    .post('/mapUnitToInventory', inventoryService.mapUnitToInventory)
    .post('/updateStockforOrder', inventoryService.updateStockforOrder)
    .post('/:inventoryId/mapImagesToInventory', inventoryImageMappingService.mapImagesToInventory)
    .post('/:inventoryId/:id/deleteInventoryImage', inventoryImageMappingService.deleteInventoryImage)
    .post('/importInventoryExcel', inventoryService.importInventoryExcel)


module.exports = router;