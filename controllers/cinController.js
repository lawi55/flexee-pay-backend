// controllers/cinController.js
const multer = require("multer");
const path = require("path");
const streamifier = require("streamifier");
const { v4: uuidv4 } = require("uuid");
const Utilisateur = require("../models/Utilisateur");
const Parent = require("../models/Parent");

const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// -------- Multer: memory storage (no local files) --------
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    // Optional: basic mime-type guard
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg","image/jfif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Format d’image non supporté (jpeg/png/webp)."));
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB/file
});

// Helper: upload a single buffer to Cloudinary (folder: 'cin')
function uploadBufferToCloudinary({ buffer, publicId }) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "cin",
        public_id: publicId, // e.g., `${userId}_cin_front`
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result); // contains .secure_url
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

// Upload CIN function
exports.uploadCIN = async (req, res) => {
  try {
    const { id } = req.user; // from JWT
    const files = req.files || {};

    const cinFrontFile = files["cinFront"]?.[0];
    const cinBackFile = files["cinBack"]?.[0];

    if (!cinFrontFile || !cinBackFile) {
      return res
        .status(400)
        .json({ message: "Les deux images de la CIN sont requises." });
    }

    // 1) Check user & role
    const user = await Utilisateur.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    if (user.type !== "Parent") {
      return res
        .status(403)
        .json({ message: "Seuls les parents peuvent soumettre une CIN." });
    }

    // 2) Load parent row
    const parent = await Parent.findOne({ where: { id } });
    if (!parent) {
      return res.status(404).json({ message: "Parent non trouvé." });
    }

    // 3) Upload to Cloudinary
    // Use deterministic IDs so each new upload overwrites the old one
    const frontPublicId = `${id}_cin_front`;
    const backPublicId = `${id}_cin_back`;

    const [frontUpload, backUpload] = await Promise.all([
      uploadBufferToCloudinary({
        buffer: cinFrontFile.buffer,
        publicId: frontPublicId,
      }),
      uploadBufferToCloudinary({
        buffer: cinBackFile.buffer,
        publicId: backPublicId,
      }),
    ]);

    // 4) Save URLs to DB
    await parent.update({
      cinFront: frontUpload.secure_url,
      cinBack: backUpload.secure_url,
      isIdentityVerified: false, // Admin must verify
    });

    return res.status(200).json({
      message: "CIN soumise pour vérification.",
      cinFrontUrl: frontUpload.secure_url,
      cinBackUrl: backUpload.secure_url,
    });
  } catch (error) {
    console.error("Erreur lors de la soumission du CIN :", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

// Export multer upload middleware
exports.uploadMiddleware = upload.fields([
  { name: "cinFront", maxCount: 1 },
  { name: "cinBack", maxCount: 1 },
]);
