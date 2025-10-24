const express = require('express');
const router = express.Router();
const tectechniciaDyaLogs = require('../mongoServices/inventoryActivityLogs');

router
    .post('/get', tectechniciaDyaLogs.get)
    .post('/getDateWiseLogs',tectechniciaDyaLogs.getDateWiseLogs)
    .post('/create', tectechniciaDyaLogs.validate(), tectechniciaDyaLogs.create)
    .put('/update', tectechniciaDyaLogs.validate(), tectechniciaDyaLogs.update)


module.exports = router;