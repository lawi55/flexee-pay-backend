const express = require("express");
const router = express.Router();
const magasinController = require("../controllers/magasinController");
const { authenticateToken } = require("../middlewares/authMiddleware");


router.get("/all", magasinController.getMagasinsWithQrCodes);
router.get(
  '/:id',
  authenticateToken,
  magasinController.getMagasinById
);
router.get("/", magasinController.getMagasinsLocations);


module.exports = router;