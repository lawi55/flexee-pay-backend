// controllers/transactionController.js
const Transaction = require("../../models/Transaction");
const Paiement = require("../../models/Paiement");
const Magasin = require("../../models/Magasin");
const Commercant = require("../../models/Commercant");
const Utilisateur = require("../../models/Utilisateur");
const Compte = require("../../models/Compte");
const Categorie = require("../../models/Categorie");

exports.getStatsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Trouver le compte lié à l'utilisateur
    const compte = await Compte.findOne({ where: { userId } });
    if (!compte) return res.status(404).json({ message: "Compte non trouvé" });

    // Récupérer les transactions liées au compte avec le commerçant si Paiement
    const transactions = await Transaction.findAll({
      where: { compteId: compte.id },
      order: [["createdAt", "DESC"]],
      include: [
        {
          model: Paiement,
          attributes: ["id"],
          include: [
            {
              model: Magasin,
              include: [
                {
                  model: Commercant,
                  attributes: ["id", "logo",],
                  include: [
                    {
                      model: Utilisateur,
                      attributes: ["prenom"],
                    },
                  ],
                },
              ],
            },
            {
              model: Categorie,
              attributes: ["id", "nom_categorie"],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
