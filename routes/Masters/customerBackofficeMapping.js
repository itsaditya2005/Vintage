const express = require('express');
const router = express.Router();
const customerBackofficeMapping = require('../../services/Masters/customerBackofficeMapping.js');

router
.post('/get',customerBackofficeMapping.get)
.post('/create',customerBackofficeMapping.validate(),customerBackofficeMapping.create)
.put('/update',customerBackofficeMapping.validate(),customerBackofficeMapping.update)
.post('/addBulk',customerBackofficeMapping.addBulk)


module.exports = router;