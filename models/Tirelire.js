const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");
const Compte = require("./Compte");

const Tirelire = sequelize.define(
  "Tirelire",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      references: {
        model: Utilisateur,
        key: "id",
      },
    },
    compteId: {
      type: DataTypes.UUID,
      references: {
        model: Compte,
        key: "id",
      },
    },
    solde: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    timestamps: false,
    tableName: "tirelires",
  }
);

module.exports = Tirelire;
