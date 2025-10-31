const express = require("express");
const demandeController = require("../controllers/transactionControllers/demandeController");
const transfertController = require("../controllers/transactionControllers/transfertController");
const paymentController = require("../controllers/transactionControllers/paymentController");

const transactionController = require("../controllers/transactionControllers/transactionController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

// Créer une demande d'argent (Jeune vers Parent)
router.post("/demandes", authenticateToken, demandeController.createDemande);
// Créer une transfert d'argent (Parent vers jeune)
router.post('/transferts', authenticateToken, transfertController.createTransfert);
// Liste des parents liés à un jeune
router.get("/jeunes/mes-parents", authenticateToken, demandeController.getMesParents);
// Récupérer mes enfants (Parent connecté)
router.get('/mes-enfants', authenticateToken, transfertController.getMesEnfants);
// Accepter une demande
router.post('/:demandeId/accept', authenticateToken, demandeController.acceptDemande); 
// Refuser une demande
router.post('/:demandeId/decline', authenticateToken, demandeController.declineDemande);

router.get("/stats", authenticateToken, transactionController.getStatsByUser);

router.get("/paiements", authenticateToken, paymentController.getAllPaiements);






module.exports = router;
