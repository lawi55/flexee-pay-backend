const multer = require("multer");
const path = require("path");
const Utilisateur = require("../models/Utilisateur");
const Parent = require("../models/Parent");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/cin/"); // Save files in 'uploads/cin/' directory
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${req.user.id}_${file.fieldname}${path.extname(file.originalname)}`
    );
  },
});

// Multer middleware for handling file uploads
const upload = multer({ storage: storage });

// Upload CIN function
exports.uploadCIN = async (req, res) => {
  try {
    const { id } = req.user; // Extract user ID from token
    const cinFront = req.files["cinFront"]
      ? req.files["cinFront"][0].path
      : null;
    const cinBack = req.files["cinBack"] ? req.files["cinBack"][0].path : null;

    if (!cinFront || !cinBack) {
      return res
        .status(400)
        .json({ message: "Les deux images de la CIN sont requises." });
    }

    // Find the user
    let user = await Utilisateur.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    // Check if the user is a Parent
    if (user.type !== "Parent") {
      return res
        .status(403)
        .json({ message: "Seuls les parents peuvent soumettre une CIN." });
    }

    // Find the corresponding Parent entry
    let parent = await Parent.findOne({ where: { id: id } });
    if (!parent) {
      return res.status(404).json({ message: "Parent non trouvé." });
    }

    // Update the parent's CIN images and set verification as pending
    await parent.update({
      cinFront,
      cinBack,
      isIdentityVerified: false, // Admin needs to verify
    });

    res.status(200).json({ message: "CIN soumis pour vérification." });
  } catch (error) {
    console.error("Erreur lors de la soumission du CIN :", error.message);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// Export multer upload middleware
exports.uploadMiddleware = upload.fields([
  { name: "cinFront" },
  { name: "cinBack" },
]);
