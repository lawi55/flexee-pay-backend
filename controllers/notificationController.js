const Notification = require("../models/Notification");

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
    });

    res.status(200).json(notifications);
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    await notification.update({ isRead: true });
    res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    await notification.destroy();
    res.status(200).json({ message: "Notification supprimée" });
  } catch (error) {
    console.error("Erreur suppression notification:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.countUnreadNotifications = async (req, res) => {
  try {
    const count = await Notification.count({
      where: {
        userId: req.user.id,
        isRead: false,
      },
    });

    res.status(200).json({ unreadCount: count });
  } catch (error) {
    console.error("Error counting unread notifications:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};