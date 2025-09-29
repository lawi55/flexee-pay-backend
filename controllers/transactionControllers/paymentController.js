const Magasin = require("../../models/Magasin");
const Transaction = require("../../models/Transaction");
const Paiement = require("../../models/Paiement");
const Compte = require("../../models/Compte");
const Utilisateur = require("../../models/Utilisateur");
const Commercant = require("../../models/Commercant");
const Categorie = require("../../models/Categorie");
const Tirelire = require("../../models/Tirelire");

const Notification = require("../../models/Notification");
const ParentJeune = require("../../models/ParentJeune");
const sendPushNotification = require("../../firebase/firebase");
const { Op } = require("sequelize");
const Cashback = require("../../models/Cashback");

exports.payerParQrCode = async (req, res) => {
  try {
    const { idMagasin, montant } = req.body;
    const utilisateurId = req.user.id;

    if (!idMagasin || !montant || montant <= 0) {
      return res.status(400).json({ message: "Données invalides" });
    }

    // 1. Récupérer le compte de l'utilisateur connecté
    const enfant = await Utilisateur.findOne({
      where: { id: utilisateurId },
    });
    const compteSource = await Compte.findOne({
      where: { userId: utilisateurId },
    });
    if (!compteSource) {
      return res
        .status(404)
        .json({ message: "Compte utilisateur introuvable" });
    }

    // 2. Vérifier solde suffisant
    if (compteSource.solde < montant) {
      return res.status(400).json({ message: "Solde insuffisant" });
    }

    // 3. Récupérer le magasin + commerçant + compte du commerçant
    const magasin = await Magasin.findByPk(idMagasin, {
      include: {
        model: Commercant,
        attributes: ["id", "id_categorie"], // 🔥 AJOUTE ÇA !
        include: {
          model: Categorie,
        },
      },
    });
    if (!magasin) {
      return res.status(404).json({ message: "Magasin introuvable" });
    }

    const compteDestination = await Compte.findOne({
      where: { userId: magasin.commercantId },
    });
    if (!compteDestination) {
      return res.status(404).json({ message: "Compte commerçant introuvable" });
    }

    // 4. Effectuer le transfert
    compteSource.solde -= montant;
    compteDestination.solde += montant;

    await compteSource.save();
    await compteDestination.save();

    // 5️⃣ Créer la transaction pour le jeune (entrée d'argent)
    await Transaction.create({
      compteId: compteDestination.id,
      type_transaction: "Paiement",
      montant: montant,
      statut: "Effectué",
      solde_avant: compteDestination.solde - montant,
      solde_apres: compteDestination.solde,
    });

    // 5️⃣ Créer la transaction pour le jeune (entrée d'argent)
    const transactionJeune = await Transaction.create({
      compteId: compteSource.id,
      type_transaction: "Paiement",
      montant: montant,
      statut: "Effectué",
      solde_avant: compteSource.solde + montant,
      solde_apres: compteSource.solde,
    });

    // 7️⃣ Créer l'enregistrement spécifique pour le transfert
    const paiement = await Paiement.create({
      id: transactionJeune.id, // Le transfert utilise l'ID de la transaction parent
      id_compteJeune: compteSource.id,
      id_compteCommercant: compteDestination.id,
      id_magasin: idMagasin,
      id_categorie: magasin.Commercant.id_categorie,
    });

    await Notification.create({
      userId: utilisateurId,
      type: "Paiement",
      message: `Votre paiement de ${montant}DT chez ${magasin.nomMagasin} a été validé.`,
      transactionId: transactionJeune.id,
    });

    // 5. Chercher le parent lié et envoyer la notification
    const relation = await ParentJeune.findOne({
      where: { id_jeune: utilisateurId },
    });

    if (relation) {
      const parent = await Utilisateur.findByPk(relation.id_parent);
      await Notification.create({
        userId: relation.id_parent,
        type: "Paiement enfant",
        message: `${enfant.prenom} a payé ${montant} DT chez ${magasin.nomMagasin}.`,
        transactionId: transactionJeune.id,
      });

      if (parent?.deviceToken) {
        await sendPushNotification(
          parent.deviceToken,
          `${enfant.prenom} a payé ${montant} DT chez ${magasin.nomMagasin} 🛒`
        );
      }
    }

    // 6. Cashback
    const tirelire = await Tirelire.findOne({
      where: { userId: utilisateurId },
    });
    const commercant = await Commercant.findOne({
      where: { id: magasin.commercantId },
    });

    if (commercant.cashback > 0) {
      const cashbackAmount = (montant * commercant.cashback) / 100;

      tirelire.solde += cashbackAmount;
      await tirelire.save();

      await Cashback.create({
        id_paiement: transactionJeune.id,
        id_tirelire: tirelire.id,
        montant: cashbackAmount,
      });
    }

    return res
      .status(200)
      .json({ paiement: paiement, message: "Paiement effectué avec succès" });
  } catch (error) {
    console.error("Erreur lors du paiement :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getAllPaiements = async (req, res) => {
  try {
    const { startDate, endDate, category } = req.query;

    const whereTransaction = {
      type_transaction: "Paiement",
    };

    if (startDate && endDate) {
      whereTransaction.date_transaction = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Prepare category filter
    let categoryFilter = {};
    if (category && category !== "All") {
      const categoryArray = category.split(",").map((c) => c.trim());
      categoryFilter = {
        nom_categorie: {
          [Op.in]: categoryArray,
        },
      };
    }

    const paiements = await Transaction.findAll({
      where: whereTransaction,
      include: [
        {
          model: Compte,
          where: { userId: req.user.id },
          attributes: [],
        },
        {
          model: Paiement,
          required: true,
          include: [
            {
              model: Magasin,
              include: [
                {
                  model: Commercant,
                  include: [
                    {
                      model: Utilisateur,
                    },
                  ],
                },
              ],
            },
            {
              model: Categorie,
              required: !!category && category !== "All",
              where: category !== "All" ? categoryFilter : undefined,
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(paiements);
  } catch (error) {
    console.error("Erreur getAllPaiements:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération des paiements" });
  }
};

exports.getPaiementsByCategory = async (req, res) => {
  const { range = "7d" } = req.query;

  // Trouver le compte lié à l'utilisateur connecté
  try {
    const compte = await Compte.findOne({ where: { userId: req.user.id } });
    if (!compte) return res.status(404).json({ message: "Compte non trouvé" });

    const compteId = compte.id;

    // Détermine la date de début
    let startDate = new Date();
    switch (range) {
      case "15d":
        startDate.setDate(startDate.getDate() - 15);
        break;
      case "1m":
        // Set to the 1st day of the current month
        startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        break;
      case "7d":
      default:
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    const paiements = await Paiement.findAll({
      include: [
        {
          model: Transaction,
          where: {
            date_transaction: { [Op.gte]: startDate },
            type_transaction: "Paiement",
            compteId: compteId,
          },
          attributes: ["montant"],
        },
        {
          model: Categorie,
          attributes: ["nom_categorie"],
        },
      ],
    });

    const grouped = {};
    paiements.forEach((paiement) => {
      const categorie = paiement.Categorie?.nom_categorie || "Autre";
      if (!grouped[categorie]) {
        grouped[categorie] = 0;
      }
      grouped[categorie] += paiement.Transaction.montant;
    });

    const result = Object.entries(grouped).map(([categorie, total]) => ({
      categorie,
      total,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getPaymentsByJeune = async (req, res) => {
  const { idJeune } = req.params;

  try {
    // Step 1: Fetch the compte (compteId) using the userId (idJeune)
    const compte = await Compte.findOne({
      where: { userId: idJeune },
      attributes: ["id"], // Only retrieve the compte id
    });

    if (!compte) {
      return res
        .status(404)
        .json({ message: "Compte not found with the given userId" });
    }

    const compteId = compte.id; // Get the compteId

    // Step 2: Fetch the payments related to the compteId, include the necessary relations
    const paiements = await Paiement.findAll({
      where: { id_compteJeune: compteId }, // Use compteId to fetch the payments
      include: [
        {
          model: Transaction,
          attributes: [
            "montant",
            "date_transaction",
            "type_transaction",
            "statut",
          ],
        },
        {
          model: Categorie,
          attributes: ["nom_categorie"],
        },
        {
          model: Magasin,
          attributes: ["nomMagasin", "latitude", "longitude"],
          include: [
            {
              model: Commercant,
              attributes: ["logo"], // Add logo here
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Return the payments with the necessary associated data
    res.status(200).json(paiements);
  } catch (error) {
    console.error("Erreur lors de la récupération des paiements:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getJeuneAccountsSolde = async (req, res) => {
  const { idJeune } = req.params;

  try {
    // Récupération du compte
    const compte = await Compte.findOne({
      where: { userId: idJeune },
      attributes: ["id", "solde"],
    });

    if (!compte) {
      return res
        .status(404)
        .json({ message: "Compte not found with the given userId" });
    }

    // Récupération de la tirelire
    const tirelire = await Tirelire.findOne({
      where: { userId: idJeune },
      attributes: ["id", "solde"],
    });

    if (!tirelire) {
      return res
        .status(404)
        .json({ message: "Tirelire not found with the given userId" });
    }

    // ✅ Retourne les deux soldes
    res.status(200).json({
      compteSolde: compte.solde,
      tirelireSolde: tirelire.solde,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des soldes:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
