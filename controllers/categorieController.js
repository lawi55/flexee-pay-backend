const Categorie = require("../models/Categorie");
const Paiement = require("../models/Paiement");

const { Op } = require('sequelize');


exports.getCategories = async (req, res) => {
    try {
      const categories = await Categorie.findAll({
        attributes: ['id', 'nom_categorie'], // Récupérer l'id et le nom
      });
      res.status(200).json(categories);
    } catch (error) {
      console.error('Erreur lors de la récupération des catégories :', error);
      res.status(500).json({ message: 'Erreur serveur' });
    }
  };

  exports.addCategorie = async (req, res) => {
    try {
        const { nom, description } = req.body;

        // Validate input
        if (!nom || !description) {
            return res.status(400).json({ 
                message: 'Le nom et la description sont requis' 
            });
        }

        // Create new category
        const newCategory = await Categorie.create({
            nom_categorie: nom,
            description: description
        });

        res.status(201).json({
            message: 'Catégorie ajoutée avec succès',
            category: newCategory
        });
    } catch (error) {
        console.error('Erreur lors de l\'ajout de la catégorie :', error);
        res.status(500).json({ 
            message: 'Erreur serveur',
            error: error.message 
        });
    }
};
  exports.updateCategory = async (req, res) => {
    try {
      const { paiementId } = req.params;
      const { categorie_id } = req.body;
  
      // Find the payment
      const paiement = await Paiement.findByPk(paiementId);
  
      if (!paiement) {
        return res.status(404).json({ error: 'Paiement introuvable' });
      }
  
      // Check if the category exists
      const category = await Categorie.findByPk(categorie_id);
      if (!category) {
        return res.status(400).json({ error: 'Catégorie introuvable' });
      }
  
      // Update the category of the paiement
      paiement.id_categorie = categorie_id;
      await paiement.save();
  
      res.status(200).json({ message: 'Catégorie mise à jour avec succès' });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la catégorie:", error);
      res.status(500).json({ error: 'Erreur lors de la mise à jour de la catégorie' });
    }
  };