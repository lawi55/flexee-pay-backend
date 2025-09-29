const express = require('express');
const router = express.Router();
const { aiChat, getHistory } = require('../controllers/chatController');
const { authenticateToken } = require("../middlewares/authMiddleware");


router.post('/ai-chat', authenticateToken, aiChat);
router.get('/ai-chat/history', authenticateToken, getHistory);

module.exports = router;
