const Alimentation = require("../../models/Alimentation");
const Transaction = require("../../models/Transaction");
const Compte = require("../../models/Compte");

exports.createAlimentation = async (req, res) => {
  try {
    const userId = req.user.id;
    const montant = req.body.montant;

    const compte = await Compte.findOne({ where: { userId: userId } });
    if (!compte) return res.status(404).json({ message: "Compte introuvable" });

    const soldeAvant = compte.solde;
    const soldeApres = soldeAvant + montant;

    // 1. Créer une transaction
    const transaction = await Transaction.create({
      compteId: compte.id,
      type_transaction: "Alimentation",
      montant,
      statut: "Succès",
      solde_avant: soldeAvant,
      solde_apres: soldeApres,
    });

    // 2. Créer l’alimentation liée
    await Alimentation.create({ id: transaction.id });

    res.status(201).json({ message: "Alimentation enregistrée avec succès" });
  } catch (error) {
    console.error("Erreur createAlimentation:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
