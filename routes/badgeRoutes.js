const express = require("express");
const router = express.Router();
const badgeController = require("../controllers/badgeController");
const { authenticateToken } = require("../middlewares/authMiddleware");


// GET /badge-status/:jeuneId
router.get("/badge-status", authenticateToken, badgeController.getBadgeStatus);

module.exports = router;
