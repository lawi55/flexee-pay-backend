const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Transaction = require("./Transaction");
const Parent = require("./Parent");
const Jeune = require("./Jeune");

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
      model: Parent, // Reference to Parent table
      key: "id",
    },
  },
  id_jeune: {
    type: DataTypes.UUID,
    references: {
      model: Jeune, // Reference to Jeune table
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
},
  {
    tableName: "demandes",
  });

Transaction.hasOne(Demande, { foreignKey: "id", onDelete: "CASCADE" });
Demande.belongsTo(Transaction, { foreignKey: "id" });
Demande.belongsTo(Jeune, { foreignKey: "id_jeune" });
Jeune.hasMany(Demande, { foreignKey: "id_jeune"});

module.exports = Demande;