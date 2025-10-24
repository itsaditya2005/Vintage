const express = require('express');
const router = express.Router();
const ticketService = require('../../services/Support/ticket');

router
.post('/get',ticketService.get)
.post('/create',ticketService.validate(),ticketService.create)
.put('/update',ticketService.validate(),ticketService.update)


module.exports = router;