const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Commercant = require("./Commercant");

const Magasin = sequelize.define("Magasin", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  commercantId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: Commercant,
      key: "id",
    },
  },
  nomMagasin: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  adresse: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  codePostal: {
    type: DataTypes.STRING(10),
    allowNull: this.truncate,
  },
  ville: {
    type: DataTypes.STRING(1000),
    defaultValue: false,
  },
  numTelephone: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
  latitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  longitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  qrcode: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
  },
},
  {
    timestamps: false,
    tableName: "magasins",
  });

Commercant.hasMany(Magasin, {
  foreignKey: "commercantId",
  onDelete: "CASCADE",
});
Magasin.belongsTo(Commercant, { foreignKey: "commercantId" });

module.exports = Magasin;
