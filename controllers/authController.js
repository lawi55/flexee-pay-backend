const nodemailer = require("nodemailer");
const Utilisateur = require("../models/Utilisateur");
const Parent = require("../models/Parent");
const Jeune = require("../models/Jeune");
const Invitation = require("../models/Invitation");
const Compte = require("../models/Compte");
const Tirelire = require("../models/Tirelire");
const { generateOTP } = require("../utils/otpUtils");
const { sendOTP } = require("../utils/twilio");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { loadTemplate } = require('../utils/email-templates');


const transporter = nodemailer.createTransport({
  host: "mail.flexeepay.tn",
  port: 587,
  secure: false, // STARTTLS = false ici, mais STARTTLS s'active automatiquement
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // facultatif : utile pour des certificats auto-signés
  },
});

exports.signup = async (req, res) => {
  try {
    const { numTelephone } = req.body;

    // Générer un OTP
    const otpCode = generateOTP();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000); // Expire après 5 min

    // Vérifier si le numéro existe déjà
    let user = await Utilisateur.findOne({ where: { numTelephone } });

    if (user) {
      if (!user.isPhoneVerified) {
        // ✅ Si le téléphone existe mais non vérifié, mettre à jour l'OTP
        await user.update({ otpCode, otpExpiration });
      } else if (!user.nom) {
        // ✅ Si le téléphone est vérifié mais l'inscription incomplète, réinitialiser l'OTP
        await user.update({ otpCode, otpExpiration });
      } else {
        return res.status(400).json({ message: "Numéro déjà utilisé." });
      }
    } else {
      // ✅ Créer un nouvel utilisateur avec OTP si inexistant
      user = await Utilisateur.create({ numTelephone, otpCode, otpExpiration });
    }

    // Envoyer l'OTP par SMS
    const sendResponse = await sendOTP(numTelephone, otpCode);

    return res.status(200).json({
      message: sendResponse.success
        ? sendResponse.message
        : "OTP non envoyé, mais généré avec succès.", // always success because of twilio problem
      numTelephone,
    });

    if (sendResponse.success) {
      return res
        .status(200)
        .json({ message: sendResponse.message, numTelephone });
    } else {
      return res.status(500).json({ message: sendResponse.message });
    }
  } catch (error) {
    console.error("Erreur serveur:", error.message);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { numTelephone, otpCode, context } = req.body; // context: 'login' or 'reset'

    // Check if the user with this phone number exists
    let user = await Utilisateur.findOne({ where: { numTelephone } });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }

    // Check if the OTP matches and hasn't expired
    if (user.otpCode !== otpCode) {
      return res.status(400).json({ message: "Le code OTP est incorrect." });
    }

    if (new Date() > new Date(user.otpExpiration)) {
      return res.status(400).json({ message: "Le code OTP a expiré." });
    }

    // Reset OTP fields
    await user.update({
      otpCode: null,
      otpExpiration: null,
    });

    if (context === "reset") {
      // ✅ For password reset: allow the next step
      return res.status(200).json({
        message: "OTP vérifié, procédez au changement de mot de passe.",
      });
    }

    // ✅ For login: mark phone as verified
    await user.update({ isPhoneVerified: true });
    return res.status(200).json({
      message: "Numéro vérifié avec succès",
      type: user.type, // ✅ Send the user type
    });
  } catch (error) {
    console.error("Erreur lors de la vérification de l'OTP:", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { numTelephone } = req.body;

    let user = await Utilisateur.findOne({ where: { numTelephone } });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({ message: "Ce numéro est déjà vérifié." });
    }

    // Générer un nouvel OTP
    const otpCode = generateOTP();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);

    await user.update({ otpCode, otpExpiration });

    const sendResponse = await sendOTP(numTelephone, otpCode);

    if (sendResponse.success) {
      return res
        .status(200)
        .json({ message: sendResponse.message, numTelephone });
    } else {
      return res.status(500).json({ message: sendResponse.message });
    }
  } catch (error) {
    console.error("Erreur lors du renvoi de l'OTP:", error.message);
    return res
      .status(500)
      .json({ message: "Erreur serveur", error: error.message });
  }
};

exports.completeInformation = async (req, res) => {
  try {
    const {
      numTelephone,
      type, // ✅ Add user type (should be 'Parent' or 'Jeune')
      nom,
      prenom,
      email,
      ville,
      motDePasse,
    } = req.body;

    console.log("🔍 Received Data: ", req.body);

    // Ensure that the phone number is verified
    let user = await Utilisateur.findOne({ where: { numTelephone } });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }

    if (!user.isPhoneVerified) {
      return res.status(400).json({
        message:
          "Veuillez vérifier votre numéro de téléphone avant de continuer.",
      });
    }

    // Validate user type
    if (!["Parent", "Jeune"].includes(type)) {
      return res.status(400).json({ message: "Type d'utilisateur invalide." });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    // Update the user's information
    await user.update({
      nom,
      prenom,
      email,
      ville,
      motDePasse: hashedPassword,
      codePin: hashedPassword, // Optionally, set the codePin to the hashed password as well
      type, // ✅ Store the user type
    });

    console.log("✅ User updated successfully: ", user.id);

    if (type === "Parent") {
      await Parent.create({ id: user.id });
    } else if (type === "Jeune") {
      await Jeune.create({ id: user.id }); // Add Jeune entry to Jeune table
    }

    // ✅ Create a Compte for the user
    const compte = await Compte.create({
      userId: user.id,
      status: "actif", // Default status
    });

    // ✅ Create a Compte for the user
    await Tirelire.create({
      userId: user.id,
      compteId: compte.id,
    });

    console.log("✅ Compte created for user: ", user.id);

    // Respond with success
    res.status(200).json({
      message: "Informations complètes ajoutées avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout des informations :", error.message);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

exports.login = async (req, res) => {
  const { numTelephone, motDePasse } = req.body;

  try {
    // Find the user by phone number (numTelephone)
    const utilisateur = await Utilisateur.findOne({ where: { numTelephone } });

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Compare the provided password (motDePasse) with the stored password (hashed)
    const isPasswordCorrect = await bcrypt.compare(
      motDePasse,
      utilisateur.motDePasse
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // Generate a JWT token
    const token = jwt.sign(
      { id: utilisateur.id, type: utilisateur.type },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // ✅ Check if user has a pending invitation
    const invitation = await Invitation.findOne({
      where: { recipientPhone: numTelephone, status: "pending" },
    });

    let requiresCinVerification = false;
    let isIdentityVerified = true; // Default to true (only relevant for parents)

    // If the user is a Parent, check their CIN verification status
    if (utilisateur.type === "Parent") {
      const parent = await Parent.findOne({ where: { id: utilisateur.id } });

      if (parent) {
        requiresCinVerification = !parent.cinFront || !parent.cinBack;
        isIdentityVerified = parent.isIdentityVerified; // Get identity verification status
      }
    }

    // Return response with user type, CIN verification status, and identity verification status
    return res.status(200).json({
      message: "Connexion réussie!",
      id: utilisateur.id,
      token,
      userType: utilisateur.type,
      requiresCinVerification,
      isIdentityVerified,
      invitation: invitation
        ? {
          id: invitation.id,
          senderId: invitation.senderId,
        }
        : null,
    });
  } catch (err) {
    console.error("Erreur lors de la connexion:", err);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.updateAuthMethod = async (req, res) => {
  try {
    const { authentificationBio } = req.body;
    const userId = req.user.id; // Récupérer l'ID utilisateur depuis le token

    // Vérifier si la valeur est valide ("E", "F", ou null)
    if (!["E", "F", null].includes(authentificationBio)) {
      return res
        .status(400)
        .json({ message: "Méthode d'authentification invalide." });
    }

    // Mettre à jour la méthode d'authentification dans la base de données
    await Utilisateur.update(
      { authentificationBio },
      { where: { id: userId } }
    );

    return res.json({
      message: "Méthode d'authentification mise à jour avec succès !",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de l'authentification :",
      error
    );
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

exports.getAuthMethod = async (req, res) => {
  try {
    const userId = req.user.id; // Extract user ID from token

    const utilisateur = await Utilisateur.findOne({
      where: { id: userId },
      attributes: ["authentificationBio"], // Only fetch the auth method
    });

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    return res.json({ authentificationBio: utilisateur.authentificationBio });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la méthode d'authentification :",
      error
    );
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

exports.getName = async (req, res) => {
  try {
    const userId = req.user.id;

    const utilisateur = await Utilisateur.findOne({
      where: { id: userId },
      attributes: ["nom", "prenom"],
    });

    if (!utilisateur) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    return res.json({ nom: `${utilisateur.prenom} ${utilisateur.nom}` });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de la méthode d'authentification :",
      error
    );
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
};

exports.validateToken = async (req, res) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Extract token from Authorization header
  if (!token) return res.status(401).json({ error: "No token provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify the token
    console.log("Decoded Payload:", decoded); // Debug log

    const user = await Utilisateur.findByPk(decoded.id); // Ensure this matches your payload

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ message: "Valid user." });
  } catch (error) {
    console.error("Token verification error:", error);
    return res.status(401).json({ error: "Invalid or expired token." });
  }
};

exports.passwordResetReq = async (req, res) => {
  try {
    const { numTelephone } = req.body;
    const user = await Utilisateur.findOne({ where: { numTelephone } });

    if (!user) {
      return res.status(400).json({ message: "Utilisateur non trouvé." });
    }

    // Generate OTP
    const otpCode = generateOTP();
    const otpExpiration = new Date(Date.now() + 5 * 60 * 1000);
    await user.update({ otpCode, otpExpiration });

    // Load email template
    const emailHtml = await loadTemplate("password-reset-email", {
      prenom: user.prenom,
      otpCode,
      logoUrl: "https://res.cloudinary.com/drijzyk4h/image/upload/v1750098891/logo_with_text_blue_toiyvf.png",
      currentYear: new Date().getFullYear(),
    });

    // Plain text version
    const textContent = `
    Bonjour ${user.prenom},

    Votre code de réinitialisation est : ${otpCode}
    Ce code expire dans 5 minutes.

    Cordialement,
    Flexee Pay
    `;

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Réinitialisation de mot de passe Flexee Pay",
      text: textContent,
      html: emailHtml,
    });

    // Send SMS
    const sendResponse = await sendOTP(numTelephone, otpCode);

    return res.status(200).json({
      message: sendResponse.success
        ? "Code de vérification envoyé par email et SMS"
        : "Code envoyé par email uniquement",
      numTelephone,
    });
  } catch (error) {
    console.error("Erreur réinitialisation mot de passe:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { numTelephone, newPassword } = req.body;

    // Check if the user exists
    const user = await Utilisateur.findOne({ where: { numTelephone } });
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password and clear OTP fields
    await user.update({
      motDePasse: hashedPassword,
    });
    return res
      .status(200)
      .json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (error) {
    console.error(
      "Erreur lors de la réinitialisation du mot de passe :",
      error.message
    );
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.saveDeviceToken = async (req, res) => {
  const userId = req.user.id;
  const { deviceToken } = req.body;

  try {
    const user = await Utilisateur.findByPk(userId);
    if (!user)
      return res.status(404).json({ message: "Utilisateur non trouvé." });

    user.deviceToken = deviceToken;
    await user.save();

    return res
      .status(200)
      .json({ message: "Device token enregistré avec succès." });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du deviceToken:", error);
    return res.status(500).json({ message: "Erreur serveur." });
  }
};

exports.getUserIdFromToken = (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Expecting: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return res.status(200).json({ userId: decoded.id });
  } catch (err) {
    return res.status(403).json({ error: "Invalid token" });
  }
};

exports.verifyPassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await Utilisateur.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Compare provided password with hashed password
    const isMatch = await bcrypt.compare(req.body.password, user.motDePasse);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Mot de passe incorrect",
      });
    }

    res.status(200).json({
      success: true,
      isValid: true,
    });
  } catch (error) {
    console.error("Error in verifyPassword:", error);
    res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la vérification du mot de passe",
    });
  }
};
