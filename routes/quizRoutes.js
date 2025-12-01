const express = require("express");
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get("/start", quizController.startQuiz);

module.exports = router;
