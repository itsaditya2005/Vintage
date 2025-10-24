const express = require('express');
const router = express.Router();
const categoryService = require('../../services/Masters/category');

router
.post('/get',categoryService.get)
.post('/create',categoryService.validate(),categoryService.create)
.put('/update',categoryService.validate(),categoryService.update)


module.exports = router;