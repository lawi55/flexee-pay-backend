const express = require("express");
const router = express.Router();
const commercantController = require("../controllers/commercantController");

router.post("/register", commercantController.registerCommercant);
router.post("/magasins", commercantController.createMagasin);

module.exports = router;
