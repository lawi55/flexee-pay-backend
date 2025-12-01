const QuizQuestion = require("../models/QuizQuestion");
const { Op, fn } = require("sequelize");
const sequelize = require("../config/database");

exports.startQuiz = async (req, res) => {
  try {
    // Difficulty can be sent as:
    // GET /quiz/start?difficulty=easy
    const difficulty = req.query.difficulty;

    if (!difficulty || !["easy", "medium", "hard"].includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message: "Invalid difficulty. Must be 'easy', 'medium' or 'hard'."
      });
    }

    // Fetch 10 random questions
    const questions = await QuizQuestion.findAll({
      where: { difficulty },
      order: sequelize.random(),
      limit: 10
    });

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aucune question disponible pour cette difficulté."
      });
    }

    return res.status(200).json({
      difficulty,
      count: questions.length,
      questions
    });

  } catch (error) {
    console.error("Error in startQuiz:", error);
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors du démarrage du quiz.",
      error
    });
  }
};
