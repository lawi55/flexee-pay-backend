// controllers/transactionController.js
const Transaction = require("../../models/Transaction");
const Paiement = require("../../models/Paiement");
const Magasin = require("../../models/Magasin");
const Commercant = require("../../models/Commercant");
const Utilisateur = require("../../models/Utilisateur");
const Compte = require("../../models/Compte");
const Categorie = require("../../models/Categorie");
const Transfert = require("../../models/Transfert");

const Jeune = require("../../models/Jeune");
const Parent = require("../../models/Parent");

exports.getStatsByUser = async (req, res) => {
  try {
    const userId = req.user.id;

    const compte = await Compte.findOne({ where: { userId } });
    const user = await Utilisateur.findOne({
      where: { id: userId },
      attributes: ["type"], // Only fetch the role
    });

    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    if (!compte) return res.status(404).json({ message: "Compte non trouvé" });

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
              attributes: ["nomMagasin"],
              include: [
                {
                  model: Commercant,
                  attributes: ["id", "logo"],
                  include: [
                    {
                      model: Utilisateur,
                      attributes: ["prenom", "nom"],
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
        {
          model: Transfert,
          include: [
            user.type === "Parent"
              ? {
                  model: Jeune,
                  include: [
                    {
                      model: Utilisateur,
                      attributes: ["prenom"],
                    },
                  ],
                }
              : user.type === "Jeune" // Explicit Jeune check
              ? {
                  model: Parent,
                  include: [
                    {
                      model: Utilisateur,
                      attributes: ["prenom"],
                    },
                  ],
                }
              : {}, // Fallback for other user types
          ],
        },
      ],
      raw: true,
      nest: true,
    });
    console.log(JSON.stringify(transactions));
    console.log(user.type);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
