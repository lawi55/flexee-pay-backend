const Transaction = require("../models/Transaction");
const Paiement = require("../models/Paiement");
const Budget = require("../models/Budget");
const Categorie = require("../models/Categorie");
const LigneBudget = require("../models/LigneBudget");
const Compte = require("../models/Compte");

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
exports.getCurrentBudget = async (req, res) => {
  // 1. Normalize the parameter - treat undefined as null
  const enfantId = req.params.enfantId ?? null;

  // 2. Get jeuneId - prioritize enfantId if provided, otherwise use user.id
  const jeuneId = enfantId !== null ? enfantId : req.user.id;
  console.log("req.params.enfantId:", req.params.enfantId);
  console.log("req.user.id:", req.user.id);
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Find current budget
    const budget = await Budget.findOne({
      where: {
        id_jeune: jeuneId,
        dateDebut: { [Op.lte]: today },
        dateFin: { [Op.gte]: today },
      },
      include: [
        {
          model: LigneBudget,
          include: [Categorie],
        },
      ],
    });

    if (!budget) {
      return res.status(404).json({
        message: "Aucun budget actif trouvé",
      });
    }

    // 2. Get user's compte (account)
    const compte = await Compte.findOne({
      where: { userId: jeuneId },
    });

    if (!compte) {
      return res.status(404).json({
        message: "Compte utilisateur non trouvé",
      });
    }

    // 3. Calculate spent amounts per category
    const categories = await Promise.all(
      budget.LigneBudgets.map(async (line) => {
        const paiements = await Paiement.findAll({
          include: [
            {
              model: Transaction,
              where: {
                compteId: compte.id,
                date_transaction: {
                  [Op.between]: [budget.dateDebut, budget.dateFin],
                },
                statut: "Effectué",
              },
            },
          ],
          where: {
            id_categorie: line.id_categorie,
          },
        });

        const spent = paiements.reduce(
          (sum, paiement) => sum + paiement.Transaction.montant,
          0
        );

        return {
          id: line.id,
          id_categorie: line.id_categorie,
          nom_categorie: line.Categorie.nom_categorie,
          allocated: line.montant,
          spent: spent,
        };
      })
    );

    // 4. Calculate total spent
    const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);

    res.json({
      id: budget.id,
      dateDebut: budget.dateDebut,
      dateFin: budget.dateFin,
      montantTotal: budget.montantTotal,
      totalSpent: totalSpent,
      categories: categories,
    });
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
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
    const { montant, periode, dateDebut, dateFin, id_categorie, id_jeune } =
      req.body;

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
    const { dateDebut, dateFin, id_jeune, lignes } = req.body;

    // Calculate total amount from all lines
    const montantTotal = lignes.reduce((sum, ligne) => sum + ligne.montant, 0);

    try {
      // Create budget header
      const budget = await Budget.create({
        dateDebut,
        dateFin,
        id_jeune,
        montantTotal,
      });

      // Create all budget lines
      const lignesToCreate = lignes.map((ligne) => ({
        id_budget: budget.id,
        id_categorie: ligne.id_categorie,
        montant: ligne.montant,
      }));

      await LigneBudget.bulkCreate(lignesToCreate);

      // Get the full budget with lines to return
      const budgetWithLines = await Budget.findByPk(budget.id, {
        include: [{ model: LigneBudget }],
      });

      res.status(201).json(budgetWithLines);
    } catch (error) {
      // Rollback transaction if any error occurs
      throw error;
    }
  } catch (error) {
    console.error("Erreur lors de la création du budget :", error);
    res.status(500).json({
      message: "Erreur serveur",
      error: error.message,
    });
  }
};
