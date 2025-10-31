const express = require("express");
const router = express.Router();
const { createAlimentation } = require("../controllers/transactionControllers/alimentationController");
const { authenticateToken } = require("../middlewares/authMiddleware");

router.post("/create", authenticateToken, createAlimentation);

module.exports = router;
