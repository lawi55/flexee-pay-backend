const Transaction = require("../../models/Transaction");
const Transfert = require("../../models/Transfert");
const Demande = require("../../models/Demande");
const Compte = require("../../models/Compte");
const ParentJeune = require("../../models/ParentJeune");
const Parent = require("../../models/Parent");
const Utilisateur = require("../../models/Utilisateur");
const Notification = require("../../models/Notification");

const sendPushNotification = require("../../firebase/firebase");

exports.createDemande = async (req, res) => {
  const { id_parent, montant, message } = req.body;
  const id_jeune = req.user.id;

  try {
    const compte = await Compte.findOne({ where: { userId: id_jeune } });
    if (!compte) {
      return res.status(404).json({ message: "Compte du jeune non trouvé." });
    }

    const jeune = await Utilisateur.findOne({ where: { id: id_jeune } });
    const parent = await Utilisateur.findOne({ where: { id: id_parent } });

    const transaction = await Transaction.create({
      compteId: compte.id,
      type_transaction: "Demande",
      montant,
      statut: "En attente",
      solde_avant: compte.solde,
      solde_apres: compte.solde,
    });

    const demande = await Demande.create({
      id: transaction.id,
      id_parent,
      id_jeune,
      message,
    });

    await Notification.create({
      userId: id_parent,
      type: "Demande",
      message: `${jeune.prenom} vous a demandé ${montant} DT.`,
      transactionId: transaction.id,
    });

    if (parent && parent.deviceToken) {
      const notificationMessage = `${jeune.prenom} vous a demandé ${montant} DT. 💸🥺`;
      await sendPushNotification(parent.deviceToken, notificationMessage);
      console.log(`Notification envoyée au jeune: ${parent.deviceToken}`);
    } else {
      console.log("Aucun token FCM trouvé pour ce parent.");
    }

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");
    const parentSocketId = connectedUsers.get(id_parent.toString());

    if (parentSocketId) {
      io.to(parentSocketId).emit("nouvelle_demande", {
        id: demande.id,
        montant,
        message,
        id_jeune,
        prenomEnfant: jeune.prenom,
      });
      console.log(`Demande pushed to Parent ${id_parent} via Socket.io`);
    } else {
      console.log(`Parent ${id_parent} is offline — no Socket.io connection.`);
    }

    return res.status(201).json({
      message: "Demande créée et notification envoyée.",
      demande,
    });
  } catch (error) {
    console.error("Erreur lors de la création de la demande :", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getMesParents = async (req, res) => {
  try {
    const jeuneId = req.user.id;

    const parents = await ParentJeune.findAll({
      where: { id_jeune: jeuneId },
      include: [
        {
          model: Parent,
          include: [
            {
              model: Utilisateur,
              attributes: ["prenom"],
            },
          ],
        },
      ],
    });

    res.status(200).json(parents);
  } catch (error) {
    console.error("Erreur lors de la récupération des parents:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.acceptDemande = async (req, res) => {
  const { montant } = req.body;
  const { demandeId } = req.params;
  const id_parent = req.user.id; // Parent connecté

  try {
    // 1️⃣ Vérifier que la demande existe
    const demande = await Demande.findByPk(demandeId, {
      include: [{ model: Transaction }], // Include the related transaction
    });

    const parent = await Utilisateur.findOne({ where: { id: id_parent } });

    if (!demande)
      return res.status(404).json({ message: "Demande introuvable." });

    // 2️⃣ Vérifier que la transaction associée est toujours en attente
    const transaction = demande.Transaction; // Assuming the related transaction is in demande.Transaction
    if (transaction.statut !== "En attente") {
      return res
        .status(400)
        .json({ message: "Cette demande a déjà été traitée." });
    }

    // 3️⃣ Récupérer les comptes du parent et du jeune
    const compteParent = await Compte.findOne({ where: { userId: id_parent } });
    const compteJeune = await Compte.findOne({
      where: { userId: demande.id_jeune },
    });

    if (!compteParent || !compteJeune) {
      return res
        .status(404)
        .json({ message: "Compte parent ou jeune introuvable." });
    }

    const montantFinal = montant ?? demande.montant; // montant personnalisé depuis le slider

    // 4️⃣ Vérifier le solde
    if (compteParent.solde < montantFinal) {
      return res.status(400).json({ message: "Solde insuffisant." });
    }

    // 5️⃣ Créer transaction pour le parent
    const transactionParent = await Transaction.create({
      compteId: compteParent.id,
      type_transaction: "Transfert",
      montant: montantFinal,
      statut: "Effectué",
      solde_avant: compteParent.solde,
      solde_apres: compteParent.solde - montantFinal,
    });

    // 6️⃣ Créer transaction pour le jeune
    const transactionJeune = await Transaction.create({
      compteId: compteJeune.id,
      type_transaction: "Transfert",
      montant: montantFinal,
      statut: "Effectué",
      solde_avant: compteJeune.solde,
      solde_apres: compteJeune.solde + montantFinal,
    });

    // 7️⃣ Mettre à jour les soldes
    await compteParent.update({ solde: compteParent.solde - montantFinal });
    await compteJeune.update({ solde: compteJeune.solde + montantFinal });

    const id_jeune = demande.id_jeune; // montant personnalisé depuis le slider

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

    // 8️⃣ Marquer la demande comme acceptée + enregistrer montant final
    await transaction.update({
      statut: "Acceptée",
    });

    // 9️⃣ Notifier le jeune
    const jeune = await Utilisateur.findOne({
      where: { id: demande.id_jeune },
    });
    if (jeune?.deviceToken) {
      const notificationMessage = `Votre demande de ${montantFinal} DT a été acceptée. ✅`;
      await sendPushNotification(jeune.deviceToken, notificationMessage);
      console.log(`Notification envoyée au jeune: ${jeune.deviceToken}`);
    }

    return res.status(200).json({
      message: "Demande acceptée et montant transféré avec succès.",
      transactionParent,
      transactionJeune,
      demande,
    });
  } catch (error) {
    console.error("Erreur lors de l'acceptation de la demande:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors du traitement de la demande." });
  }
};

exports.declineDemande = async (req, res) => {
  const { demandeId } = req.params;
  const id_parent = req.user.id; // Parent connecté

  try {
    // 1️⃣ Vérifier que la demande existe
    const demande = await Demande.findOne({ where: { id: demandeId } });
    if (!demande) {
      return res.status(404).json({ message: "Demande introuvable." });
    }

    // 2️⃣ Vérifier que le parent est bien concerné
    if (demande.id_parent !== id_parent) {
      return res
        .status(403)
        .json({ message: "Vous n'êtes pas autorisé à refuser cette demande." });
    }

    // 3️⃣ Vérifier la transaction associée
    const transaction = await Transaction.findByPk(demandeId);
    if (!transaction) {
      return res.status(404).json({ message: "Transaction liée introuvable." });
    }

    if (transaction.statut !== "En attente") {
      return res
        .status(400)
        .json({ message: "Cette demande a déjà été traitée." });
    }

    // 4️⃣ Mettre à jour le statut
    await transaction.update({ statut: "Refusée" });

    // 5️⃣ Notifier le jeune concerné
    const jeune = await Utilisateur.findOne({
      where: { id: demande.id_jeune },
    });
    if (jeune?.deviceToken) {
      const notificationMessage = `Votre demande de ${transaction.montant} DT a été refusée. ❌`;
      await sendPushNotification(jeune.deviceToken, notificationMessage);
      console.log(
        `Notification de refus envoyée au jeune: ${jeune.deviceToken}`
      );
    }

    return res.status(200).json({
      message: "Demande refusée avec succès.",
      demande: {
        id: demande.id,
        statut: transaction.statut,
        montant: transaction.montant,
      },
    });
  } catch (error) {
    console.error("Erreur lors du refus de la demande:", error);
    return res
      .status(500)
      .json({ message: "Erreur serveur lors du traitement du refus." });
  }
};
