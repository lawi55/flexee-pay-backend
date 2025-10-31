// controllers/stripeController.js
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Compte = require("../models/Compte");

exports.createPaymentIntent = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id; // from JWT middleware

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount in cents
      currency: "eur",
      metadata: { userId: userId.toString() },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    console.error("Stripe Error:", err);
    res.status(500).json({ error: "Payment failed" });
  }
};

exports.handlePaymentSuccess = async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.id;

    const compte = await Compte.findOne({ where: { userId: userId } });

    if (!compte) {
      return res.status(404).json({ error: "Compte not found" });
    }

    compte.solde += parseFloat(amount) / 100;
    await compte.save();
    
    res.status(200).json({ message: "Recharge successful", newSolde: compte.solde });
  } catch (err) {
    console.error("Recharge Error:", err);
    res.status(500).json({ error: "Recharge failed" });
  }
};

exports.getAccountBalance = async (req, res) => {
    try {
      const userId = req.user.id;  // Assuming user is attached to req.user by authenticateToken
      // Fetch the account based on userId
      const compte = await Compte.findOne({ where: { userId: userId } });
  
      if (!compte) {
        return res.status(404).json({ message: "Account not found" });
      }
  
      // Assuming 'solde' is the balance field in the 'compte' table
      const balance = compte.solde;
  
      return res.status(200).json({ balance });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    }
  };
  