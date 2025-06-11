const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Categorie = sequelize.define("Categorie", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nom_categorie: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  icone: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
},
{
    tableName: "categories",
  });

module.exports = Categorie;
