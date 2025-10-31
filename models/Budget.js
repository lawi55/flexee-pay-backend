const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Jeune = require("./Jeune");

const Budget = sequelize.define(
  "Budget",
  {
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
    dateDebut: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    dateFin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    montantTotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
  },
  {
    tableName: "budgets",
  }
);

Jeune.hasMany(Budget, { foreignKey: "id_jeune" });
Budget.belongsTo(Jeune, { foreignKey: "id_jeune" });

module.exports = Budget;