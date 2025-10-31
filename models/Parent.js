const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");

const Parent = sequelize.define(
  "Parent",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: Utilisateur,
        key: "id",
      },
    },
    cinNumber: {
      type: DataTypes.STRING(10),
      allowNull: true,
      unique: true,
    },
    cinFront: {
      type: DataTypes.STRING, // Stocke l'URL de l'image
      allowNull: true,
    },
    cinBack: {
      type: DataTypes.STRING, // Stocke l'URL de l'image
      allowNull: true,
    },
    isIdentityVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: "parents",
    timestamps: false,
  }
);

Utilisateur.hasOne(Parent, { foreignKey: "id", onDelete: "CASCADE" });
Parent.belongsTo(Utilisateur, { foreignKey: "id" });

module.exports = Parent;
