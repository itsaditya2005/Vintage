const express = require('express');
const router = express.Router();
const orderMasterService = require('../../services/Order/order');

router
    .post('/get', orderMasterService.get)
    .post('/create', orderMasterService.validate(), orderMasterService.create)
    .post('/createOrder', orderMasterService.createOrder)
    .put('/update', orderMasterService.validate(), orderMasterService.update)
    .post('/getOrderDetails', orderMasterService.getOrderDetails)
    .post('/getPaymentOrdeDetails', orderMasterService.getPaymentOrdeDetails)
    .patch('/orderUpdateStatus', orderMasterService.orderUpdateStatus)
    .post('/getCategories',orderMasterService.getCategoriesHierarchy)
    .post('/getServices',orderMasterService.getServices)
    .post('/getServicesForWeb',orderMasterService.getServicesForWeb)
    .post('/updateDetails',orderMasterService.updateOrder)
    .post('/requestForReschedule',orderMasterService.requestForReschedule)
    .post('/sendWatsappMsgs',orderMasterService.sendWatsappMsgs)
	
module.exports = router;