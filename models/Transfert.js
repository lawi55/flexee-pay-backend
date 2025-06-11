const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Transaction = require("./Transaction");
const Jeune = require("./Jeune");
const Parent = require("./Parent");


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
      model: Parent,
      key: "id",
    },
  },
  id_jeune: {
    type: DataTypes.UUID,
    references: {
      model: Jeune,
      key: "id",
    },
  },
  message: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
},
  {
    tableName: "transferts",
    timestamps: false,
  });

Transaction.hasOne(Transfert, { foreignKey: "id", onDelete: "CASCADE" });
Transfert.belongsTo(Transaction, { foreignKey: "id" });
Transfert.belongsTo(Parent, {foreignKey: "id_parent"});
Transfert.belongsTo(Jeune, {foreignKey: "id_jeune"});



module.exports = Transfert;
