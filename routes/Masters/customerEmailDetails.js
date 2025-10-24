const express = require('express');
const router = express.Router();
const customerEmailDetailsService = require('../../services/Masters/customerEmailDetails');

router
.post('/get',customerEmailDetailsService.get)
.post('/create',customerEmailDetailsService.validate(),customerEmailDetailsService.create)
.put('/update',customerEmailDetailsService.validate(),customerEmailDetailsService.update)
.post('/createDetails',customerEmailDetailsService.validate(),customerEmailDetailsService.createDetails)
.post('/updateDetails',customerEmailDetailsService.validate(),customerEmailDetailsService.updateDetails)


module.exports = router;