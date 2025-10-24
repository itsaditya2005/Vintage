const express = require('express');
const router = express.Router();
const inventoryMovementService = require('../../services/Inventory/inventoryMovement');
const inventoryMovementDetailsService = require('../../services/Inventory/inventoryMovementDetails');


router
.post('/get',inventoryMovementService.getAll)
.post('/detailedList',inventoryMovementService.detailedList)
.post('/create',inventoryMovementService.validate(),inventoryMovementService.create)
.put('/update',inventoryMovementService.validate(),inventoryMovementService.update)
.post('/createMovement',inventoryMovementService.createMovement)
.post('/counts',inventoryMovementService.counts)

.get('/:id/movementDetails',inventoryMovementDetailsService.movementDetails)
.get('/:id',inventoryMovementService.get)
.get('/:id/movementList',inventoryMovementDetailsService.movementList)


module.exports = router;