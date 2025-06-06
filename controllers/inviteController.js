const nodemailer = require("nodemailer");
const Utilisateur = require("../models/Utilisateur");
const Invitation = require("../models/Invitation");
const Parent = require("../models/Parent");
const Jeune = require("../models/Jeune");
const ParentJeune = require("../models/ParentJeune");
const { Op } = require("sequelize");

// Configure email transport
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendInvite = async (req, res) => {
  try {
    const { firstName, email, numTelephone, message, senderType } = req.body;
    const senderId = req.user.id; // Ensure authenticateToken is used

    if (!firstName || !email || !numTelephone) {
      return res
        .status(400)
        .json({ error: "Prénom, email et téléphone sont obligatoires." });
    }

    // Check if the user already exists
    let recipient = await Utilisateur.findOne({ where: { numTelephone } });

    // If not, create a new user with phone number only
    if (!recipient) {
      recipient = await Utilisateur.create({
        prenom: firstName,
        email,
        numTelephone,
        type: senderType === "Jeune" ? "Parent" : "Jeune",
      });
    }

    // Check for existing invitation
    const existingInvitation = await Invitation.findOne({
      where: {
        senderId,
        recipientPhone: numTelephone,
        status: "pending",
      },
    });

    if (existingInvitation) {
      return res
        .status(400)
        .json({ error: "Une invitation est déjà en attente pour ce numéro." });
    }

    // Create invitation
    await Invitation.create({
      senderId,
      recipientPhone: numTelephone,
      message,
    });

    // Send email
    const subject =
      senderType === "Jeune"
        ? "Invitation à rejoindre Flexee Pay en tant que Parent"
        : "Invitation à rejoindre Flexee Pay en tant que Jeune";

    const emailContent = `
      Bonjour ${firstName},

      Vous avez reçu une invitation à rejoindre Flexee Pay.

      Message : ${message || "Pas de message ajouté."}

      Cliquez ici pour télécharger l'application : [Lien de téléchargement]

      Cordialement,
      L'équipe Flexee Pay
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      text: emailContent,
    });

    res.status(200).json({ message: "Invitation envoyée avec succès !" });
  } catch (error) {
    console.error("Erreur lors de l'invitation :", error);
    res
      .status(500)
      .json({ error: error.message || "Erreur interne du serveur." });
  }
};

exports.searchUser = async (req, res) => {
  try {
    const { name, userType } = req.query;

    if (!name || !userType) {
      return res.status(400).json({ error: "Nom et type requis." });
    }

    const users = await Utilisateur.findAll({
      where: {
        type: userType === "Jeune" ? "Parent" : "Jeune",
        [Op.or]: [
          { prenom: { [Op.like]: `%${name}%` } },
          { nom: { [Op.like]: `%${name}%` } },
        ],
      },
      attributes: ["id", "prenom", "nom", "email", "type"],
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Search User Error: ", error); // Log the error
    res.status(500).json({ error: error.message });
  }
};

exports.acceptPairing = async (req, res) => {
  try {
    const { invitationId } = req.body;
    const userId = req.user.id;

    // ✅ Find the invitation
    const invitation = await Invitation.findByPk(invitationId);
    if (!invitation) {
      return res.status(404).json({ message: "Invitation non trouvée." });
    }

    if (invitation.status === "accepted") {
      return res.status(400).json({ message: "Invitation déjà acceptée." });
    }

    // ✅ Identify the inviter and logged-in user
    const inviter =
      (await Parent.findByPk(invitation.senderId)) ||
      (await Jeune.findByPk(invitation.senderId));
    if (!inviter) {
      return res.status(404).json({ message: "Inviteur non trouvé." });
    }

    const user =
      (await Parent.findByPk(userId)) || (await Jeune.findByPk(userId));
    if (!user) {
      return res
        .status(404)
        .json({ message: "Utilisateur connecté non trouvé." });
    }

    // ✅ Determine who is Parent and who is Jeune
    let id_parent, id_jeune;
    if (inviter instanceof Parent) {
      id_parent = inviter.id;
      id_jeune = user.id;
    } else {
      id_parent = user.id;
      id_jeune = inviter.id;
    }

    // ✅ Check if the relationship already exists
    const existingPair = await ParentJeune.findOne({
      where: { id_parent, id_jeune },
    });
    if (existingPair) {
      return res.status(400).json({ message: "Relation déjà existante." });
    }

    // ✅ Create the parent-child relationship
    await ParentJeune.create({ id_parent, id_jeune });

    // ✅ Update invitation status to "accepted"
    await invitation.update({ status: "accepted" });

    return res.status(200).json({
      message: "Invitation acceptée avec succès!",
      id_parent,
      id_jeune,
    });
  } catch (err) {
    console.error("Erreur lors de l'acceptation du pairing:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};
