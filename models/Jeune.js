const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");

const Jeune = sequelize.define(
  "Jeune",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: Utilisateur,
        key: "id",
      },
    },
  },
  {
    timestamps: false,
    tableName: "jeunes",
  }
);

Utilisateur.hasOne(Jeune, { foreignKey: "id", onDelete: "CASCADE" });
Jeune.belongsTo(Utilisateur, { foreignKey: "id" });

module.exports = Jeune;
