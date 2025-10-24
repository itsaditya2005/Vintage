const express = require('express');
const router = express.Router();
const ticketService = require('../../services/Support/ticket');

router
    .post('/get', ticketService.get)
    .post('/create', ticketService.validate(), ticketService.create)
    .put('/update', ticketService.validate(), ticketService.update)
    .post('/getDashboardReport', ticketService.getDashboardReport)
    .post('/getDepartmentwiseReport', ticketService.getDepartmentwiseReport)
    .post('/getUserwiseReport', ticketService.getUserwiseReport)
    .post('/getTicketReport', ticketService.getTicketReport)
    .post('/getLogDetails', ticketService.getLogDetails)
    .post('/getLogDetailsByTicketNo', ticketService.getLogDetailsByTicketNo)
    .post('/getOptionWiseCount', ticketService.getOptionWiseCount)
    .post('/getAutoCloseTicketReport', ticketService.getAutoCloseTicketReport)
    .post('/getGroupWiseAutoCloseTicketCount', ticketService.getGroupWiseAutoCloseTicketCount)
    .post('/getCreatorWiseAutoCloseTicketCount', ticketService.getCreatorWiseAutoCloseTicketCount)
    .post('/getGroupWiseAutoCloseTicketReport', ticketService.getGroupWiseAutoCloseTicketReport)

module.exports = router;