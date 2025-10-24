const express = require('express');
const router = express.Router();
const technicianActivityCalenderService = require('../../services/Masters/technicianActivityCalenderMongo');

router
    .post('/get', technicianActivityCalenderService.get)
    .post('/getCalenderData', technicianActivityCalenderService.getCalenderData)
    .post('/create', technicianActivityCalenderService.validate(), technicianActivityCalenderService.create)
    .put('/update', technicianActivityCalenderService.validate(), technicianActivityCalenderService.update)


module.exports = router;