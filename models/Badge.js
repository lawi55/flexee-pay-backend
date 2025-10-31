const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("../models/Utilisateur");

const Badge = sequelize.define(
  "Badge",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    niveau: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    icone: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    min_transactions: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    min_montant: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    min_tirelire: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    min_nb_challenges_reussi: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    min_jours_utlisation: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "badges",
  }
);



module.exports = Badge;
