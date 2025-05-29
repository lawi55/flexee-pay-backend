const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Utilisateur,
        key: "id",
      },
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      // Example values: 'paiement', 'objectif', 'cashback', etc.
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "Notifications",
  }
);

Notification.belongsTo(Utilisateur, { foreignKey: "userId" });

module.exports = Notification;
