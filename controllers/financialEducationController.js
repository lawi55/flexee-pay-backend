const FinancialEducation = require("../models/FinancialEducation");
const FinancialSlide = require("../models/FinancialSlide");

exports.getAllFinancialModules = async (req, res) => {
  try {
    const modules = await FinancialEducation.findAll({
      where: { isActive: true },
      include: [{
        model: FinancialSlide,
        as: 'slides',
        order: [['slideNumber', 'ASC']]
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({ modules });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      message: "Erreur lors de la récupération des modules d'éducation financière", 
      error 
    });
  }
};

// ADD THIS FUNCTION - Get single module by ID
exports.getFinancialModuleById = async (req, res) => {
  try {
    const { id } = req.params;

    const module = await FinancialEducation.findByPk(id, {
      include: [{
        model: FinancialSlide,
        as: 'slides',
        order: [['slideNumber', 'ASC']]
      }]
    });

    if (!module) {
      return res.status(404).json({
        success: false,
        message: "Module d'éducation financière non trouvé",
      });
    }

    res.status(200).json(module);
  } catch (error) {
    console.error("Erreur dans getFinancialModuleById :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};