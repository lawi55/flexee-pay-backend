const Transaction = require("../../models/Transaction");
const Transfert = require("../../models/Transfert");
const Compte = require("../../models/Compte");
const ParentJeune = require("../../models/ParentJeune");
const Jeune = require("../../models/Jeune");
const Utilisateur = require("../../models/Utilisateur");
const Notification = require("../../models/Utilisateur");

const sendPushNotification = require("../../firebase/firebase");

exports.createTransfert = async (req, res) => {
  const { id_jeune, montant } = req.body;
  const id_parent = req.user.id; // Parent connecté

  try {
    // 1️⃣ Vérifier que le parent possède un compte
    const compteParent = await Compte.findOne({ where: { userId: id_parent } });
    const parent = await Utilisateur.findOne({ where: { id: id_parent } });

    if (!compteParent) {
      return res.status(404).json({ message: "Compte du parent non trouvé." });
    }

    // 2️⃣ Vérifier que le jeune possède un compte
    const compteJeune = await Compte.findOne({ where: { userId: id_jeune } });
    if (!compteJeune) {
      return res.status(404).json({ message: "Compte du jeune non trouvé." });
    }

    // 3️⃣ Vérifier que le parent a assez d'argent
    if (compteParent.solde < montant) {
      return res.status(400).json({ message: "Solde insuffisant." });
    }

    // 4️⃣ Créer la transaction pour le parent (sortie d'argent)
    const transactionParent = await Transaction.create({
      compteId: compteParent.id,
      type_transaction: "Transfert",
      montant: montant,
      statut: "Effectué",
      solde_avant: compteParent.solde,
      solde_apres: compteParent.solde - montant,
    });

    // 5️⃣ Créer la transaction pour le jeune (entrée d'argent)
    const transactionJeune = await Transaction.create({
      compteId: compteJeune.id,
      type_transaction: "Transfert",
      montant: montant,
      statut: "Effectué",
      solde_avant: compteJeune.solde,
      solde_apres: compteJeune.solde + montant,
    });

    // 6️⃣ Mettre à jour les soldes des comptes
    await compteParent.update({ solde: compteParent.solde - montant });
    await compteJeune.update({ solde: compteJeune.solde + montant });

    // 7️⃣ Créer l'enregistrement spécifique pour le transfert
    await Transfert.create({
      id: transactionParent.id, // Le transfert utilise l'ID de la transaction parent
      id_parent,
      id_jeune,
    });

    await Transfert.create({
      id: transactionJeune.id, // Le transfert utilise l'ID de la transaction parent
      id_parent,
      id_jeune,
    });

    await Notification.create({
      userId: id_jeune,
      type: "Transfert",
      message: `${parent.prenom} vous a envoyé ${montant} DT.`,
    });

    // 8️⃣ Envoyer une notification push au jeune
    const jeune = await Utilisateur.findOne({ where: { id: id_jeune } });
    if (jeune && jeune.deviceToken) {
      const notificationMessage = `Vous avez reçu ${montant} DT de votre parent. 💸`;
      await sendPushNotification(jeune.deviceToken, notificationMessage);
      console.log(`Notification envoyée au jeune: ${jeune.deviceToken}`);
    } else {
      console.log("Aucun token FCM trouvé pour ce jeune.");
    }

    // ✅ Réponse de succès
    return res.status(201).json({
      message: "Transfert effectué avec succès.",
      transfert: {
        parentTransaction: transactionParent,
        jeuneTransaction: transactionJeune,
      },
    });
  } catch (error) {
    console.error("Erreur lors du transfert :", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors de l'envoi du transfert." });
  }
};

exports.getMesEnfants = async (req, res) => {
  try {
    const parentId = req.user.id;

    const enfants = await ParentJeune.findAll({
      where: { id_parent: parentId },
      include: [
        {
          model: Jeune,
          include: [
            {
              model: Utilisateur,
              attributes: ["id", "prenom"],
            },
          ],
        },
      ],
    });

    res.status(200).json(enfants);
  } catch (error) {
    console.error("Erreur lors de la récupération des enfants:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};
