const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Badge = require("./Badge");

const Utilisateur = sequelize.define(
  "Utilisateur",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    badgeId: {
      type: DataTypes.UUID,
      references: {
        model: Badge,
        key: "id",
      },
      allowNull: true, // car il peut ne pas avoir de badge au départ
    },
    type: {
      type: DataTypes.ENUM("Parent", "Jeune", "Commercant"),
      allowNull: true,
    },
    numTelephone: {
      type: DataTypes.CHAR(8),
      allowNull: true,
      unique: true,
    },
    otpCode: {
      type: DataTypes.STRING(6),
      allowNull: true,
    },
    otpExpiration: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isPhoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false, // ✅ Becomes `true` after OTP verification
    },
    nom: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    prenom: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true,
      validate: { isEmail: true },
    },
    ville: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    motDePasse: {
      type: DataTypes.STRING(100),
      allowNull: true, // Set after phone verification
    },
    codePin: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    authentificationBio: {
      type: DataTypes.ENUM("E", "F"),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    deviceToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "utilisateurs",
    timestamps: true,
  }
);

module.exports = Utilisateur;
