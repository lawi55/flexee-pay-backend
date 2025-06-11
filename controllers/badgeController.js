const { Op, fn, col, literal, Sequelize } = require("sequelize");
const Transaction = require("../models/Transaction");
const Paiement = require("../models/Paiement");
const Tirelire = require("../models/Tirelire");
const Objectif = require("../models/Objectif");
const Compte = require("../models/Compte");
const Utilisateur = require("../models/Utilisateur");

exports.getBadgeStatus = async (req, res) => {
  try {
    const jeuneId = req.user.id;

    // Trouver le compte du jeune
    const compte = await Compte.findOne({ where: { userId: jeuneId } });
    if (!compte) return res.status(404).json({ error: "Compte non trouvé" });

    // Nombre total de transactions
    const totalTransactions = await Transaction.count({
      where: { compteId: compte.id, type_transaction: 'Paiement' },
    });

    // Total argent dépensé
    const totalSpentResult = await Paiement.findOne({
      attributes: [[fn("SUM", col("Transaction.montant")), "totalSpent"]],
      where: { id_compteJeune: compte.id },
      include: [
        {
          model: Transaction,
          attributes: [],
          required: true,
          where: { type_transaction: "Paiement" },
        },
      ],
      raw: true,
    });
    const totalSpent = parseFloat(totalSpentResult.totalSpent || 0);

    // Solde de la tirelire
    const tirelire = await Tirelire.findOne({ where: { userId: jeuneId } });
    const soldeTirelire = tirelire ? tirelire.solde : 0;

    // Objectifs atteints créés par un parent
    const objectifsAtteints = await Objectif.count({
      where: {
        id_tirelire: tirelire?.id,
        statut: "Atteint",
        id_parent: { [Op.ne]: null },
      },
    });

    // Total jours d'utilisation (paiement effectué ce jour-là)
    const joursUtilisation = await Paiement.findAll({
      attributes: [
        [
          Sequelize.fn("DATE", Sequelize.col("Transaction.date_transaction")),
          "jour",
        ],
      ],
      where: { id_compteJeune: compte.id },
      include: [
        {
          model: Transaction,
          attributes: [],
          required: true,
          where: { type_transaction: "Paiement" },
        },
      ],
      group: [
        Sequelize.fn("DATE", Sequelize.col("Transaction.date_transaction")),
      ],
      raw: true,
    });

    const totalJoursUtilisation = joursUtilisation.length;

    // Résultat final
    return res.json({
      totalTransactions,
      totalSpent,
      soldeTirelire,
      objectifsAtteints,
      totalJoursUtilisation,
    });
  } catch (error) {
    console.error("Erreur badgeStatus:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
