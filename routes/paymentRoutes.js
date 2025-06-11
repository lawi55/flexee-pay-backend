const express = require("express");
const router = express.Router();
const { payerParQrCode, getPaiementsByCategory, getPaymentsByJeune } = require("../controllers/transactionControllers/paymentController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/payer", authenticateToken, payerParQrCode);
router.get("/by-category", authenticateToken, getPaiementsByCategory);
// 🧒 Paiements d’un enfant
router.get('/enfant/:idJeune', authenticateToken, getPaymentsByJeune);

module.exports = router;
