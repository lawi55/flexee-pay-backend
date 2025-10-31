const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Transaction = require("./Transaction");
const Compte = require("./Compte");
const Magasin = require("./Magasin");
const Categorie = require("./Categorie");

const Paiement = sequelize.define("Paiement", {
  id: {
    type: DataTypes.UUID,
    primaryKey: true,
    references: {
      model: Transaction,
      key: "id",
    },
  },
  id_compteJeune: {
    type: DataTypes.UUID,
    references: {
      model: Compte,
      key: "id",
    },
  },
  id_compteCommercant: {
    type: DataTypes.UUID,
    references: {
      model: Compte,
      key: "id",
    },
  },
  id_magasin: {
    type: DataTypes.UUID,
    references: {
      model: Magasin,
      key: "id",
    },
  },
  id_categorie: {
    type: DataTypes.UUID,
    references: {
      model: Categorie,
      key: "id",
    },
    allowNull: true,
  },
},
  {
    tableName: "paiements",
    timestamps: true,
  });

Transaction.hasOne(Paiement, { foreignKey: "id", onDelete: "CASCADE" });
Paiement.belongsTo(Transaction, { foreignKey: "id" });

Paiement.belongsTo(Magasin, { foreignKey: "id_magasin" });
Magasin.hasMany(Paiement, { foreignKey: "id_magasin" });

Paiement.belongsTo(Categorie, { foreignKey: "id_categorie" });
Categorie.hasMany(Paiement, { foreignKey: "id_categorie" });

module.exports = Paiement;
