const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categorieController');

// Récupérer toutes les catégories (pas besoin de middleware d'authentification)
router.get('/', categoryController.getCategories);
router.patch('/:paiementId', categoryController.updateCategory);


module.exports = router;
