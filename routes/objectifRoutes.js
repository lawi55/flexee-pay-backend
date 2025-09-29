const express = require("express");
const router = express.Router();
const objectifController = require("../controllers/objectifController");
const { authenticateToken } = require("../middlewares/authMiddleware");


router.post("/", authenticateToken, objectifController.createObjectif);
router.get('/mine/:enfantId?', authenticateToken, objectifController.getMyObjectifs);
router.put('/:id/status', authenticateToken, objectifController.updateStatut);


module.exports = router;
