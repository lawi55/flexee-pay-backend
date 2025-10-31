const Quiz = require("../models/Quiz");
const QuizQuestion = require("../models/QuizQuestion");

exports.getAllQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.findAll({
      where: { isActive: true },
      include: [{
        model: QuizQuestion,
        as: 'questions',
        order: [['questionNumber', 'ASC']]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ quizzes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des quiz", 
      error 
    });
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const { id } = req.params;

    const quiz = await Quiz.findByPk(id, {
      include: [{
        model: QuizQuestion,
        as: 'questions',
        order: [['questionNumber', 'ASC']]
      }]
    });

    if (!quiz) {
      return res.status(404).json({
        success: false,
        message: "Quiz non trouvé",
      });
    }

    res.status(200).json(quiz);
  } catch (error) {
    console.error("Erreur dans getQuizById :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};