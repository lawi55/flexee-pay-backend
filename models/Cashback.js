const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Tirelire = require("./Tirelire");
const Paiement = require("./Paiement");

const Cashback = sequelize.define(
  "Cashback",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_paiement: {
      type: DataTypes.UUID,
      references: {
        model: Paiement,
        key: "id",
      },
    },
    id_tirelire: {
      type: DataTypes.UUID,
      references: {
        model: Tirelire,
        key: "id",
      },
    },
    montant: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
  },
  {
    tableName: "cashbacks",
  }
);

Cashback.belongsTo(Paiement, { foreignKey: "id_paiement" });
Paiement.hasOne(Cashback, { foreignKey: "id_paiement" });

Cashback.belongsTo(Tirelire, { foreignKey: "id_tirelire" });
Tirelire.hasMany(Cashback, { foreignKey: "id_tirelire" });

module.exports = Cashback;
