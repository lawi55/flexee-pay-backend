// models/ParentJeune.js
const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const Parent = require("./Parent");
const Jeune = require("./Jeune");

const ParentJeune = sequelize.define("ParentJeune", {
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
}, {
  timestamps: false, // No need for createdAt and updatedAt for the junction table
  tableName: "ParentJeune",
});

// 💡 Relations nécessaires pour faire des includes
ParentJeune.belongsTo(Parent, { foreignKey: "id_parent" });
ParentJeune.belongsTo(Jeune, { foreignKey: "id_jeune" });

module.exports = ParentJeune;