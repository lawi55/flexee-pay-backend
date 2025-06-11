const Magasin = require("../models/Magasin");

exports.getMagasinsWithQrCodes = async (req, res) => {
  try {
    const magasins = await Magasin.findAll({
      attributes: ["id", "nomMagasin", "adresse", "qrcode"],
    });

    res.status(200).json({ magasins });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des magasins", error });
  }
};

exports.getMagasinById = async (req, res) => {
  try {
    const { id } = req.params;

    const magasin = await Magasin.findByPk(id, {
      attributes: ["nomMagasin"],
    });

    if (!magasin) {
      return res.status(404).json({
        success: false,
        message: "Magasin non trouvé",
      });
    }

    res.status(200).json({
      success: true,
      nom: magasin.nomMagasin,
    });
  } catch (error) {
    console.error("Erreur dans getMagasinById :", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

exports.getMagasinsLocations = async (req, res) => {
  try {
    const magasins = await Magasin.findAll({
      attributes: ["nomMagasin", "latitude", "longitude"],
    });

    res.json(magasins);
  } catch (error) {
    console.error("Erreur getMagasinsLocations:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
