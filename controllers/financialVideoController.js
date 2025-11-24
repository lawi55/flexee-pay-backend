const FinancialVideo = require("../models/FinancialVideo");

// GET /edu/videos  -> list all active videos
exports.getAllFinancialVideos = async (req, res) => {
  try {
    const videos = await FinancialVideo.findAll({
      where: { isActive: true },
      order: [
        ['orderIndex', 'ASC'],      // if null, goes last
        ['createdAt', 'DESC']
      ],
    });

    res.status(200).json({ videos });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Erreur lors de la récupération des vidéos éducatives",
      error
    });
  }
};

// GET /edu/videos/:id -> one video
exports.getFinancialVideoById = async (req, res) => {
  try {
    const { id } = req.params;

    const video = await FinancialVideo.findByPk(id);

    if (!video || !video.isActive) {
      return res.status(404).json({
        success: false,
        message: "Vidéo éducative non trouvée",
      });
    }

    res.status(200).json(video);
  } catch (error) {
    console.error("Erreur dans getFinancialVideoById :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};
