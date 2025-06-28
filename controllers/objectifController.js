const Objectif = require("../models/Objectif");
const Tirelire = require("../models/Tirelire");
const Parent = require("../models/Parent");

exports.createObjectif = async (req, res) => {
  try {
    const userId = req.user.id;
    const { montant, date_debut, date_fin, recompense, enfantId } = req.body;

    // Si le parent crée un objectif pour un enfant
    if (enfantId) {
      const tirelireEnfant = await Tirelire.findOne({
        where: { userId: enfantId },
      });

      if (!tirelireEnfant) {
        return res
          .status(404)
          .json({ message: "Tirelire non trouvée pour cet enfant." });
      }

      const objectif = await Objectif.create({
        id_tirelire: tirelireEnfant.id,
        montant,
        date_debut,
        date_fin,
        recompense,
        id_parent: userId, // <- parent qui crée le challenge
      });

      return res.status(201).json(objectif);
    }

    // Sinon : c’est un enfant qui crée pour lui-même
    const tirelire = await Tirelire.findOne({
      where: { userId: userId },
    });

    if (!tirelire) {
      return res
        .status(404)
        .json({ message: "Tirelire non trouvée pour cet utilisateur." });
    }

    const objectif = await Objectif.create({
      id_tirelire: tirelire.id,
      montant,
      date_debut,
      date_fin,
      recompense,
      id_parent: null, // <- reste null pour l’enfant
    });

    res.status(201).json(objectif);
  } catch (error) {
    console.error("Erreur création objectif:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getMyObjectifs = async (req, res) => {
  try {
    const userId = req.user.id;
    const jeuneId = req.params.enfantId;

    // Vérifie si c'est un parent
    const parent = await Parent.findOne({ where: { id: userId } });

    if (parent) {
      const tirelire = await Tirelire.findOne({
        where: { userId: jeuneId },
      });
      // Si c'est un parent, récupère les objectifs qu'il a créés pour ses enfants
      const objectifs = await Objectif.findAll({
        where: { id_parent: parent.id, id_tirelire: tirelire.id },
      });
      return res.json(objectifs);
    }

    // Sinon, c’est un jeune, cherche sa tirelire
    const tirelire = await Tirelire.findOne({
      where: { userId: userId },
    });

    if (!tirelire)
      return res.status(404).json({ message: "Tirelire non trouvée" });

    const objectifs = await Objectif.findAll({
      where: { id_tirelire: tirelire.id },
    });

    res.json(objectifs);
  } catch (error) {
    console.error("Erreur getMyObjectifs:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.updateStatut = async (req, res) => {
  const objectifId = req.params.id;
  const { statut } = req.body;

  const allowedStatus = ["En cours", "Atteint", "Annulé"];
  if (!allowedStatus.includes(statut)) {
    return res.status(400).json({ message: "Statut invalide." });
  }

  try {
    const objectif = await Objectif.findByPk(objectifId);

    if (!objectif) {
      return res.status(404).json({ message: "Objectif non trouvé" });
    }

    if (objectif.statut !== "En cours") {
      return res.status(400).json({
        message: "Seuls les objectifs en cours peuvent être mis à jour.",
      });
    }

    objectif.statut = statut;
    await objectif.save();

    res.json({ message: "Statut mis à jour avec succès", objectif });
  } catch (error) {
    console.error("Erreur updateStatut:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
