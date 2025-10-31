const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Transaction = require("./Transaction");

const Alimentation = sequelize.define(
  "Alimentation",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      references: {
        model: Transaction,
        key: "id",
      },
    },
  },
  {
    tableName: "alimentations",
  }
);

Transaction.hasOne(Alimentation, { foreignKey: "id", onDelete: "CASCADE" });
Alimentation.belongsTo(Transaction, { foreignKey: "id" });

module.exports = Alimentation;
