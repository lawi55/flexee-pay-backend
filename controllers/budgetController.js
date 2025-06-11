const Transaction = require("../models/Transaction");
const Paiement = require("../models/Paiement");
const Budget = require("../models/Budget");
const Categorie = require("../models/Categorie");
const { Op } = require("sequelize");

exports.checkBudgetsDepasses = async (req, res) => {
  try {
    const utilisateurId = req.user.id;

    const budgets = await Budget.findAll({
      where: { id_jeune: utilisateurId },
      include: [{ model: Categorie }],
    });

    const result = [];

    for (const budget of budgets) {
      const paiements = await Paiement.findAll({
        include: [
          {
            model: Transaction,
            where: {
              date_transaction: {
                [Op.between]: [budget.dateDebut, budget.dateFin],
              },
            },
          },
        ],
        where: {
          id_categorie: budget.id_categorie,
          id_compteJeune: {
            [Op.ne]: null,
          },
        },
      });

      const totalDepense = paiements.reduce(
        (acc, p) => acc + (p.Transaction?.montant || 0),
        0
      );

      result.push({
        id_budget: budget.id,
        nom_categorie: budget.Categorie.nom_categorie,
        montant_budget: budget.montant,
        total_depense: totalDepense,
        isDepasse: totalDepense >= budget.montant,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error("Erreur checkBudgetsDepasses:", error);
    return res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.getBudgets = async (req, res) => {
  try {
    const whereClause = {};

    if (req.user.type === "Parent") {
      whereClause.id_parent = req.user.id;
    } else if (req.user.type === "Jeune") {
      whereClause.id_jeune = req.user.id;
    }

    const budgets = await Budget.findAll({ where: whereClause });
    res.status(200).json(budgets);
  } catch (error) {
    console.error("Erreur lors de la récupération des budgets :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.createBudget = async (req, res) => {
  try {
    const { montant, periode, dateDebut, dateFin, id_categorie, id_jeune } = req.body;

    const budget = await Budget.create({
      montant,
      periode,
      dateDebut,
      dateFin,
      id_categorie,
      id_jeune: req.user.id, // Ensures the logged-in user's ID is used
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error("Erreur lors de la création du budget :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

exports.createBudgetForChild = async (req, res) => {
  try {
    const { montant, periode, dateDebut, dateFin, id_categorie, id_jeune } = req.body;

    const budget = await Budget.create({
      montant,
      periode,
      dateDebut,
      dateFin,
      id_categorie,
      id_jeune: id_jeune, // Ensures the logged-in user's ID is used
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error("Erreur lors de la création du budget :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};