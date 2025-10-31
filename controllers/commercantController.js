const QRCode = require("qrcode");
const Utilisateur = require("../models/Utilisateur");
const Commercant = require("../models/Commercant");
const Compte = require("../models/Compte");
const Magasin = require("../models/Magasin");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.registerCommercant = async (req, res) => {
  try {
    const {
      nom,
      prenom,
      email,
      numTelephone,
      motDePasse,
      raisonSociale,
      rib,
      secteur,
      logo,
    } = req.body;

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(motDePasse, 10);

    const utilisateur = await Utilisateur.create({
      nom,
      prenom,
      email,
      numTelephone,
      motDePasse: hashedPassword,
      type: "Commercant",
    });

    const commercant = await Commercant.create({
      id: utilisateur.id,
      raisonSociale,
      rib,
      secteur,
      logo,
    });

    const compte = await Compte.create({
      userId: utilisateur.id,
      solde: 0,
      status: "actif",
    });

    res.status(201).json({ utilisateur, commercant, compte });
  } catch (error) {
    console.error("Erreur création commerçant :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.createMagasin = async (req, res) => {
  try {
    const { nomMagasin, adresse, commercantId, latitude, longitude } = req.body;

    // 1. Create magasin first
    const magasin = await Magasin.create({
      commercantId,
      nomMagasin,
      adresse,
      latitude,
      longitude,
    });

    // 2. Generate QR code PNG file (use magasin.id as unique name)

    const qrBuffer = await QRCode.toBuffer(magasin.id, {
      type: "png",
      width: 300,
      margin: 2,
    });

    // 3. Save only the relative path (to access it from frontend or serve as static)

    // Upload QR code buffer to Cloudinary
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "qrcodes",
        public_id: magasin.id,
        resource_type: "image",
      },
      async (error, result) => {
        if (error) {
          console.error("Cloudinary upload error:", error);
          return res.status(500).json({ message: "QR upload failed", error });
        }

        magasin.qrcode = result.secure_url;
        await magasin.save();

        return res.status(201).json({
          message: "Magasin créé avec succès",
          magasin,
        });
      }
    );

    streamifier.createReadStream(qrBuffer).pipe(uploadStream);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Erreur lors de la création du magasin",
      error,
    });
  }
};
