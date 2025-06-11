const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Tirelire = require("./Tirelire");
const Parent = require("./Parent");

const Objectif = sequelize.define(
  "Objectif",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    id_tirelire: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: Tirelire,
        key: "id",
      },
    },
    id_parent: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: Parent,
        key: "id",
      },
    },
    montant: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    progress: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0.0,
    },
    date_debut: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    date_fin: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    statut: {
      type: DataTypes.ENUM("En cours", "Atteint", "Annulé"),
      defaultValue: "En cours",
    },
    recompense: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
  },
  {
    tableName: "objectifs",
    timestamps: false,
  }
);

Objectif.belongsTo(Tirelire, { foreignKey: "id_tirelire" });
Tirelire.hasMany(Objectif, { foreignKey: "id_tirelire" });

module.exports = Objectif;
