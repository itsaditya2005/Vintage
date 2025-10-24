const express = require('express');
const router = express.Router();
const serviceCatalogService = require('../../services/Masters/serviceCatalog');

router
.post('/get',serviceCatalogService.get)
.post('/create',serviceCatalogService.validate(),serviceCatalogService.create)
.put('/update',serviceCatalogService.validate(),serviceCatalogService.update)
.post('/getMappedServices',serviceCatalogService.getMappedServices)


module.exports = router;