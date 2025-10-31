const Tirelire = require("../models/Tirelire");
const Cashback = require("../models/Cashback");
const Paiement = require("../models/Paiement");
const Transaction = require("../models/Transaction");
const Magasin = require("../models/Magasin");

exports.getMyCashbacks = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1️⃣ Trouver la tirelire du user
    const tirelire = await Tirelire.findOne({ where: { userId } });

    if (!tirelire) {
      return res.status(404).json({ message: "Tirelire non trouvée." });
    }

    // 2️⃣ Récupérer les cashbacks liés à cette tirelire
    const cashbacks = await Cashback.findAll({
      where: { id_tirelire: tirelire.id },
      include: [
        {
          model: Paiement,
          include: [
            {
              model: Transaction,
              attributes: [
                "type_transaction",
                "montant",
                "date_transaction",
                "statut",
              ],
            },
            {
              model: Magasin,
              attributes: ["nomMagasin"],
            },
          ],
        },
      ],
      order: [["id", "DESC"]], // tu peux trier par un champ temporel si tu veux
    });

    res.json(cashbacks);
  } catch (err) {
    console.error("❌ Erreur getMyCashbacks:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getCashbackSumByUser = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware

    // Find user's tirelire
    const tirelire = await Tirelire.findOne({ where: { userId } });

    if (!tirelire) {
      return res.status(404).json({ message: "Tirelire non trouvée" });
    }

    // Sum of all cashbacks related to this tirelire
    const { sum } = await Cashback.findOne({
      where: { id_tirelire: tirelire.id },
      attributes: [[Cashback.sequelize.fn('SUM', Cashback.sequelize.col('montant')), 'sum']],
      raw: true,
    });

    res.json({ totalCashback: parseFloat(sum) || 0.0 });
  } catch (err) {
    console.error("Erreur cashback sum:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};