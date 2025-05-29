const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Categorie = require("./Categorie");
const Jeune = require("./Jeune");

const Budget = sequelize.define("Budget", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  id_jeune: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Jeune,
      key: "id",
    },
  },
  id_categorie: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Categorie,
      key: "id",
    },
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  periode: {
    type: DataTypes.ENUM("Hebdomadaire", "Mensuelle"),
    allowNull: false,
  },
  dateDebut: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  dateFin: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
});

Jeune.hasMany(Budget, { foreignKey: "id_jeune"});
Budget.belongsTo(Jeune, { foreignKey: "id_jeune" });
Categorie.hasMany(Budget, { foreignKey: "id_categorie" });
Budget.belongsTo(Categorie, { foreignKey: "id_categorie" });

module.exports = Budget;
