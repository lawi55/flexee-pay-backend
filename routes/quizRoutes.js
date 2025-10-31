const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get('/', quizController.getAllQuizzes);
router.get('/:id', quizController.getQuizById);

module.exports = router;