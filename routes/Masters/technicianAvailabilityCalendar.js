const express = require('express');
const router = express.Router();
const technicianAvailabilityCalendarService = require('../../services/Masters/technicianAvailabilityCalendar');

router
.post('/get',technicianAvailabilityCalendarService.get)
.post('/create',technicianAvailabilityCalendarService.validate(),technicianAvailabilityCalendarService.create)
.put('/update',technicianAvailabilityCalendarService.validate(),technicianAvailabilityCalendarService.update)


module.exports = router;