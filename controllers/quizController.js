const QuizQuestion = require("../models/QuizQuestion");

exports.startQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByPk(req.params.id);

    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const questions = await QuizQuestion.findAll({
      where: { difficulty: quiz.difficulty },
      order: sequelize.random(),
      limit: 10
    });

    res.json({
      quizId: quiz.id,
      difficulty: quiz.difficulty,
      questions
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
