const Tirelire = require("../models/Tirelire");
const Compte = require("../models/Compte");
const Objectif = require("../models/Objectif");

exports.getMyTirelire = async (req, res) => {
  try {
    const userId = req.user.id;

    const tirelire = await Tirelire.findOne({ where: { userId } });

    if (!tirelire) {
      return res.status(404).json({ message: "Aucune tirelire trouvée" });
    }

    res.json(tirelire);
  } catch (error) {
    console.error("Erreur lors de la récupération de la tirelire:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getMyTirelireBalance = async (req, res) => {
  try {
    const userId = req.user.id; // Assuming user is attached to req.user by authenticateToken
    // Fetch the account based on userId
    const tirelire = await Tirelire.findOne({ where: { userId: userId } });

    if (!tirelire) {
      return res.status(404).json({ message: "Account not found" });
    }

    // Assuming 'solde' is the balance field in the 'tirelire' table
    const balance = tirelire.solde;

    return res.status(200).json({ balance });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

exports.transferFromCompte = async (req, res) => {
  const { montant } = req.body;
  const userId = req.user.id;

  if (!montant || isNaN(montant) || montant <= 0) {
    return res.status(400).json({ message: "Montant invalide" });
  }

  try {
    const compte = await Compte.findOne({ where: { userId } });
    const tirelire = await Tirelire.findOne({
      where: { userId },
    });

    if (!compte || !tirelire) {
      return res.status(404).json({ message: "Comptes non trouvés" });
    }

    if (compte.solde < montant) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }

    compte.solde -= montant;
    tirelire.solde += montant;

    await compte.save();
    await tirelire.save();

    // NEW: Objectives progress update
    const activeObjectives = await Objectif.findAll({
      where: {
        id_tirelire: tirelire.id,
        statut: "En cours",
      },
    });

    for (const objective of activeObjectives) {
      await objective.update({
        progress: (objective.progress += montant),
      });
      await objective.save();
    }

    return res.status(200).json({ message: "Alimentation effectuée" });
  } catch (error) {
    console.error("Erreur transfert vers tirelire:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.transferToCompte = async (req, res) => {
  const { montant } = req.body;
  const userId = req.user.id;

  if (!montant || isNaN(montant) || montant <= 0) {
    return res.status(400).json({ message: "Montant invalide" });
  }

  try {
    const compte = await Compte.findOne({ where: { userId } });
    const tirelire = await Tirelire.findOne({
      where: { userId },
    });

    if (!compte || !tirelire) {
      return res.status(404).json({ message: "Comptes non trouvés" });
    }

    if (tirelire.solde < montant) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }

    compte.solde += montant;
    tirelire.solde -= montant;

    await compte.save();
    await tirelire.save();

    // NEW: Objectives progress update
    const activeObjectives = await Objectif.findAll({
      where: {
        id_tirelire: tirelire.id,
        statut: "En cours",
      },
    });

    for (const objective of activeObjectives) {
      if (objective.progress > 0) {
        const newProgress = Math.max(0, objective.progress - montant);
        await objective.update({ progress: newProgress });
      }
    }

    return res.status(200).json({ message: "Alimentation effectuée" });
  } catch (error) {
    console.error("Erreur transfert vers tirelire:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};
