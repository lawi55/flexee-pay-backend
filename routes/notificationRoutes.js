const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, notificationController.getUserNotifications);
router.patch("/:id/read", authenticateToken, notificationController.markAsRead);
router.delete('/:id', authenticateToken, notificationController.deleteNotification);
router.get("/unread-count", authenticateToken, notificationController.countUnreadNotifications);



module.exports = router;