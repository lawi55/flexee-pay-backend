const Notification = require("../models/Notification");
const Transaction = require("../models/Transaction");
const Demande = require("../models/Demande");
const Utilisateur = require("../models/Utilisateur");
const Jeune = require("../models/Jeune");


exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      include: [
        {
          model: Transaction,
          attributes: ["montant", "statut", "type_transaction"],
          required: false,
          include: [
            {
              model: Demande,
              attributes: ["message", "id_jeune"],
              required: false,
              include: [
                {
                  model: Jeune,
                  required: false,
                  include: [{
                    model: Utilisateur,
                    as: 'Utilisateur',  // Match your association name
                    attributes: ["prenom", "nom"],  // Get fields from parent
                    required: false
                  }]
                }
              ]
            },
          ],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const enrichedNotifications = notifications.map((notification) => {
      const notificationData = notification.get({ plain: true });
      const transaction = notificationData.Transaction || {};
      const demande = transaction.Demande || {};
      const jeune = demande.Jeune || {};
      const utilisateur = jeune.Utilisateur || {};

      return {
        ...notificationData,
        montant: transaction.montant ?? null,
        statutTransaction: transaction.statut ?? null,
        typeTransaction: transaction.type_transaction ?? null,
        messageDemande: demande.message ?? null,
        jeuneInfo: utilisateur.prenom ? {
          prenom: utilisateur.prenom,
          nom: utilisateur.nom
        } : null
      };
    });

    res.status(200).json(enrichedNotifications);
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.markAsNotRead = async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    if (notification.userId !== req.user.id) {
      return res.status(403).json({ message: "Non autorisé" });
    }

    await notification.update({ isRead: false });
    res.status(200).json({ message: "Notification marquée comme lue" });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.markAllAsRead = async (req, res) => {
try {
    const userId = req.user.id;
    await Notification.update(
      { isRead: true },
      { where: { userId: userId, isRead: false } }
    );
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark all as read' });
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