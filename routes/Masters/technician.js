const express = require('express');
const router = express.Router();
const technicianService = require('../../services/Masters/technician');
const technicianPincodeMappingService = require('../../services/Masters/technicianPincodeMapping');
const technicianSkillMappingService = require('../../services/Masters/technicianSkillMapping');

router
    .post('/get', technicianService.get)
    .post('/getData', technicianService.getdata)
    .post('/create', technicianService.validate(), technicianService.create)
    .put('/update', technicianService.validate(), technicianService.update)
    .post('/changePassword', technicianService.changePassword)
    .post('/createTechnician', technicianService.createTechnician)
    .post('/updateTechnician', technicianService.updateTechnician)

    .post('/unMappedpincodes', technicianService.unMappedpincodes)
    .post('/mapPincodes', technicianPincodeMappingService.mapPincodes)
    .post('/unMapPincodes', technicianPincodeMappingService.unMapPincodes)

    .post('/unMappedSkills', technicianService.unMappedSkills)
    .post('/mapSkills', technicianSkillMappingService.mapSkills)
    .post('/unMapSkills', technicianSkillMappingService.unMapSkills)

    .post('/getTechnicianCalendar', technicianService.getTechnicianCalendar)
    .post('/dayTrack', technicianService.dayTrack)
    .post('/getDayTrack', technicianService.getDayTrack)
    .post('/updateJobStatus', technicianService.updateJobStatus)
    .post('/getInvoice', technicianService.getInvoice)
    .post('/logout', technicianService.logout)

    .post('/updateTechnicianProfile', technicianService.updateTechnicianProfile)
    .post('/verifyOTP', technicianService.verifyProfileOTP)
    .post('/clearId', technicianService.clearId)
    .post('/importTechnicianExcel', technicianService.importTechnicianExcel)
    .post('/checkEmail', technicianService.checkEmail)

    .post('/getUnAvailablityOfTechnician', technicianService.getUnAvailablityOfTechnician)


module.exports = router;