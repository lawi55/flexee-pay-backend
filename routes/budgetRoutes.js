const express = require("express");
const router = express.Router();
const budgetController = require("../controllers/budgetController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get('/check-budgets', authenticateToken, budgetController.checkBudgetsDepasses);

// Récupérer tous les budgets liés à l'utilisateur connecté
router.get('/', authenticateToken, budgetController.getBudgets);

// Créer un nouveau budget
router.post('/', authenticateToken, budgetController.createBudget);

router.post('/forChild', authenticateToken, budgetController.createBudgetForChild);

// Récupérer tous les budgets liés à l'utilisateur connecté
router.get('/current/:enfantId?', authenticateToken, budgetController.getCurrentBudget);


module.exports = router;
