const Parent = require("./Parent");
const Jeune = require("./Jeune");
const ParentJeune = require("./ParentJeune");
const Utilisateur = require("./Utilisateur");
const Badge = require("./Badge");


// Set up the many-to-many relationships
Parent.belongsToMany(Jeune, { through: ParentJeune, foreignKey: 'id_parent', onDelete: 'CASCADE', });
Jeune.belongsToMany(Parent, { through: ParentJeune, foreignKey: 'id_jeune', onDelete: 'CASCADE', });
Utilisateur.belongsTo(Badge, { foreignKey: "badgeId" });
Badge.hasMany(Utilisateur, { foreignKey: "badgeId" });

module.exports = { Parent, Jeune, ParentJeune, Utilisateur, Badge };