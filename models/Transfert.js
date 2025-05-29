const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Transaction = require("./Transaction");

const Transfert = sequelize.define("Transfert", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: Transaction,
      key: "id",
    },
  },
  id_parent: {
    type: DataTypes.UUID,
    references: {
      model: "Parents", // Reference to Parent table
      key: "id",
    },
  },
  id_jeune: {
    type: DataTypes.UUID,
    references: {
      model: "Jeunes", // Reference to Jeune table
      key: "id",
    },
  },
  message: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
});

Transaction.hasOne(Transfert, { foreignKey: "id", onDelete: "CASCADE" });
Transfert.belongsTo(Transaction, { foreignKey: "id" });

module.exports = Transfert;
