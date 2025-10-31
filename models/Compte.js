const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");

const Compte = sequelize.define(
  "Compte",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Utilisateur,
        key: "id",
      },
    },
    solde: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0, // Initial balance
    },
    status: {
      type: DataTypes.ENUM("actif", "inactif", "suspendu"),
      allowNull: false,
      defaultValue: "actif", // Default status
    },
  },
  {
    timestamps: true,
    tableName: "comptes",
  }
);

Utilisateur.hasOne(Compte, { foreignKey: "userId", onDelete: "CASCADE" });
Compte.belongsTo(Utilisateur, { foreignKey: "userId" });

module.exports = Compte;
