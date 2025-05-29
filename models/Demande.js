const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Transaction = require("./Transaction");

const Demande = sequelize.define("Demande", {
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
  message_reponse: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
});

Transaction.hasOne(Demande, { foreignKey: "id", onDelete: "CASCADE" });
Demande.belongsTo(Transaction, { foreignKey: "id" });

module.exports = Demande;
