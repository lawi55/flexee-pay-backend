const express = require("express");
const router = express.Router();
const inviteController = require("../controllers/inviteController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/invite", authenticateToken, inviteController.sendInvite);
router.post("/accept", authenticateToken, inviteController.acceptPairing);
router.get("/searchUser", inviteController.searchUser); // Search users by name


module.exports = router;