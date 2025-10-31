const express = require("express");
const { uploadCIN, uploadMiddleware } = require("../controllers/cinController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Protect the upload route
router.post("/upload-cin", authenticateToken, uploadMiddleware, uploadCIN);

module.exports = router;