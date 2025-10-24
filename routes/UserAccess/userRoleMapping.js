const express = require('express');
const router = express.Router();
const userRoleMappingService = require('../../services/UserAccess/userRoleMapping');

router
    .post('/get', userRoleMappingService.get)

module.exports = router;