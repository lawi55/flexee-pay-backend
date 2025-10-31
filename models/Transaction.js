const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Compte = require("./Compte");

const Transaction = sequelize.define("Transaction", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  compteId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Compte,
      key: "id",
    },
  },
  type_transaction: {
    type: DataTypes.ENUM(
      "Paiement",
      "Transfert",
      "Recharge",
      "Demande",
      "Alimentation"
    ),
    allowNull: false,
  },
  montant: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  date_transaction: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  statut: {
    type: DataTypes.STRING, // Or ENUM if you want (Ex: 'Succès', 'En attente', 'Échoué')
    allowNull: false,
  },
  solde_avant: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  solde_apres: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
},
  {
    tableName: "transactions",
    timestamps: true,
  });

Compte.hasMany(Transaction, { foreignKey: "compteId", onDelete: "CASCADE" });
Transaction.belongsTo(Compte, { foreignKey: "compteId" });

module.exports = Transaction;
