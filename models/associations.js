const Parent = require("./Parent");
const Jeune = require("./Jeune");
const ParentJeune = require("./ParentJeune");
const Utilisateur = require("./Utilisateur");
const Badge = require("./Badge");
const FinancialEducation = require("./FinancialEducation");
const FinancialSlide = require("./FinancialSlide");
const Quiz = require("./Quiz");
const QuizQuestion = require("./QuizQuestion");

// Set up the many-to-many relationships
Parent.belongsToMany(Jeune, {
  through: ParentJeune,
  foreignKey: "id_parent",
  onDelete: "CASCADE",
});
Jeune.belongsToMany(Parent, {
  through: ParentJeune,
  foreignKey: "id_jeune",
  onDelete: "CASCADE",
});
Utilisateur.belongsTo(Badge, { foreignKey: "badgeId" });
Badge.hasMany(Utilisateur, { foreignKey: "badgeId" });
FinancialEducation.hasMany(FinancialSlide, {
  foreignKey: "educationId",
  as: "slides",
  onDelete: "CASCADE",
});

FinancialSlide.belongsTo(FinancialEducation, {
  foreignKey: "educationId",
  as: "education",
});
Quiz.hasMany(QuizQuestion, {
  foreignKey: "quizId",
  as: "questions",
  onDelete: "CASCADE",
});

QuizQuestion.belongsTo(Quiz, {
  foreignKey: "quizId",
  as: "quiz",
});

module.exports = { Parent, Jeune, ParentJeune, Utilisateur, Badge };
