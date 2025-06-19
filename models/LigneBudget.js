const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Categorie = require("./Categorie");
const Budget = require("./Budget");

const LigneBudget = sequelize.define(
  "LigneBudget",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_budget: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Budget,
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
  },
  {
    tableName: "lignesBudgets",
  }
);

Budget.hasMany(LigneBudget, { foreignKey: "id_budget",});
LigneBudget.belongsTo(Budget, { foreignKey: "id_budget" });
Categorie.hasMany(LigneBudget, { foreignKey: "id_categorie" });
LigneBudget.belongsTo(Categorie, { foreignKey: "id_categorie" });

module.exports = LigneBudget;