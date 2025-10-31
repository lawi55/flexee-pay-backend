const express = require('express');
const router = express.Router();
const financialEducationController = require('../controllers/financialEducationController');

router.get('/', financialEducationController.getAllFinancialModules);
router.get('/:id', financialEducationController.getFinancialModuleById);


module.exports = router;