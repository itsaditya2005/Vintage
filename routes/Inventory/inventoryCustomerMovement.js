const express = require('express');
const router = express.Router();
const inventoryCustomerMovement = require('../../services/Inventory/inventoryCustomerMovement');
const inventoryCustomerMovementDetailsService = require('../../services/Inventory/inventoryCustomerMovementDetails');


router
.post('/get',inventoryCustomerMovement.getAll)
.post('/detailedList',inventoryCustomerMovement.detailedList)
.post('/create',inventoryCustomerMovement.validate(),inventoryCustomerMovement.create)
.put('/update',inventoryCustomerMovement.validate(),inventoryCustomerMovement.update)
.post('/createMovement',inventoryCustomerMovement.createMovement)
.post('/counts',inventoryCustomerMovement.counts)

.get('/:id/movementDetails',inventoryCustomerMovementDetailsService.movementDetails)
.get('/:id',inventoryCustomerMovement.get)
.get('/:id/movementList',inventoryCustomerMovementDetailsService.movementList)
.post('/getCustomers',inventoryCustomerMovementDetailsService.getCustomers)
.post('/getTechnicians',inventoryCustomerMovementDetailsService.getTechnicians)
.post('/getItemsToMovement',inventoryCustomerMovementDetailsService.getItemsToMovement)


module.exports = router;