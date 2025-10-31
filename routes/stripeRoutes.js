// routes/stripeRoutes.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middlewares/authMiddleware");
const {
  createPaymentIntent,
  handlePaymentSuccess,
  getAccountBalance
} = require("../controllers/stripeController");

router.post("/create-payment-intent", authenticateToken, createPaymentIntent);
router.post("/confirm-recharge", authenticateToken, handlePaymentSuccess);
router.get("/solde-compte", authenticateToken, getAccountBalance);

module.exports = router;