const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Utilisateur = require("./Utilisateur");
const Categorie = require("./Categorie");

const Commercant = sequelize.define("Commercant", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: Utilisateur,
      key: "id",
    },
  },
  id_categorie: {
    type: DataTypes.UUID,
    references: {
      model: Categorie,
      key: "id",
    },
  },
  raisonSociale: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  rib: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  logo: {
    type: DataTypes.STRING, // Stocke l'URL de l'image
    allowNull: true,
  },
  comm: {
    type: DataTypes.FLOAT,
    defaultValue: 0.0,
  },
  secteur: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  cashback: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.0,
  },
},
{
    tableName: "commercants",
  }
);

Utilisateur.hasOne(Commercant, { foreignKey: "id", onDelete: "CASCADE" });
Commercant.belongsTo(Utilisateur, { foreignKey: "id" });

Categorie.hasMany(Commercant, { foreignKey: "id_categorie" });
Commercant.belongsTo(Categorie, { foreignKey: "id_categorie" });

module.exports = Commercant;