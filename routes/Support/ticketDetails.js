const express = require('express');
const router = express.Router();
const ticketDetailService = require('../../services/Support/ticketDetails');

router
    .post('/get', ticketDetailService.get)
    .post('/create', ticketDetailService.validate(), ticketDetailService.create)
    .put('/update', ticketDetailService.validate(), ticketDetailService.update)

module.exports = router;