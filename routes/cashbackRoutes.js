// routes/cashbackRoutes.js
const express = require("express");
const router = express.Router();
const cashbackController = require("../controllers/cashbackController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.get("/mine", authenticateToken, cashbackController.getMyCashbacks);
router.get("/sum", authenticateToken, cashbackController.getCashbackSumByUser);


module.exports = router;
