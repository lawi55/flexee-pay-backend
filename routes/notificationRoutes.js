const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, notificationController.getUserNotifications);
router.patch("/:id/notread", authenticateToken, notificationController.markAsNotRead);
router.delete('/:id', authenticateToken, notificationController.deleteNotification);
router.get("/unread-count", authenticateToken, notificationController.countUnreadNotifications);
router.patch("/read-all", authenticateToken, notificationController.markAllAsRead);




module.exports = router;