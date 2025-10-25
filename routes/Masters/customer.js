const express = require('express');
const router = express.Router();
const customerService = require('../../services/Masters/customer');
const customerTechnicianMapping = require('../../services/Masters/customerTechnicianMapping');
const customerBackofficeMapping = require('../../services/Masters/customerBackofficeMapping');
const customerEmailMaster = require('../../services/Masters/customerEmailMaster');


router
    .post('/get', customerService.get)
    .post('/getCustomerDetails', customerService.getCustomerDetails)
    .post('/create', customerService.validate(), customerService.create)
    .put('/update', customerService.validate(), customerService.update)
    .post('/changePassword', customerService.changePassword)
    .post('/addCustomer', customerService.addCustomer)
    .post('/logout', customerService.logout)
    .post('/importCustomerExcel', customerService.importCustomerExcel)
    .post('/unMappedTechnicians', customerService.unMappedTechnicians)
    .post('/mapTechnicians', customerTechnicianMapping.mapTechnicians)
    .post('/unMapTechnicians', customerTechnicianMapping.unMapTechnicians)
    .post('/deleteProfile', customerService.deleteProfile)
    .post('/activateProfile', customerService.activateProfile)
    .post('/unMappedBackOffices', customerService.unMappedBackOffices)
    .post('/mapBackOffices', customerBackofficeMapping.mapBackOffice)
    .post('/unMapBackOffices', customerBackofficeMapping.unMapBackOffice)



module.exports = router;
