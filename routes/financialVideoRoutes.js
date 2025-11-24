const express = require('express');
const router = express.Router();
const financialVideoController = require('../controllers/financialVideoController');

router.get('/', financialVideoController.getAllFinancialVideos);
router.get('/:id', financialVideoController.getFinancialVideoById);

module.exports = router;
