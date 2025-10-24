const express = require('express');
const router = express.Router();
const serviceItemService = require('../../services/Masters/service');
const serviceSkillMappingService = require('../../services/Masters/serviceSkillMapping');

router
    .post('/get', serviceItemService.get)
    .get('/getPoppulerServices', serviceItemService.getPoppulerServices)
    .post('/getServiceLogs', serviceItemService.getServiceLogs)
    .post('/getData', serviceItemService.getData)
    .post('/create', serviceItemService.validate(), serviceItemService.create)
    .put('/update', serviceItemService.validate(), serviceItemService.update)
    .post('/serviceHirarchy', serviceItemService.serviceHirarchy)
    .post('/serviceList', serviceItemService.serviceList)

    .post('/unMappedSkills', serviceItemService.unMappedSkills)
    .post('/mapSkills', serviceSkillMappingService.mapSkills)
    .post('/unMapSkills', serviceSkillMappingService.unMapSkills)
    .post('/getMappedServices', serviceItemService.getMappedServices)
    .post('/getServiceHirechy', serviceItemService.getServiceHirechy)

    .post('/b2bserviceList', serviceItemService.b2bserviceList)
    .post('/getb2bServiceHirechy', serviceItemService.getb2bServiceHirechy)
    .get('/getCategories', serviceItemService.getCategoriesHierarchy)
    .post('/importTechnicianExcel', serviceItemService.importTechnicianExcel)
    .post('/importServiceExcel', serviceItemService.importServiceExcel)


module.exports = router;