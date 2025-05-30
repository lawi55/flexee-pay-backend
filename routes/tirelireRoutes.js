const express = require('express');
const router = express.Router();
const tirelireController = require('../controllers/tirelireController');
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get('/me', authenticateToken, tirelireController.getMyTirelire);
router.get('/solde', authenticateToken, tirelireController.getMyTirelireBalance);
router.post('/transfer-from-compte', authenticateToken, tirelireController.transferFromCompte);
router.post('/transfer-to-compte', authenticateToken, tirelireController.transferToCompte);


module.exports = router;
