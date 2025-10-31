const express = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware"); // Importe le middleware


const router = express.Router();

router.post("/signup", authController.signup);
router.post("/verify-otp", authController.verifyOTP); // For verifying OTP
router.post("/resend-otp", authController.resendOTP); // For resending OTP
router.post("/complete-information", authController.completeInformation);
router.post('/login', authController.login);
router.put("/updateAuthMethod", authenticateToken, authController.updateAuthMethod); // Ajoute cette route ✅
router.get("/getAuthMethod", authenticateToken, authController.getAuthMethod);
router.post('/validateToken', authController.validateToken);
router.post('/send-reset-otp', authController.passwordResetReq);
router.post("/reset-password", authController.resetPassword);
router.post("/device-token", authenticateToken, authController.saveDeviceToken);
router.get('/extract-id', authController.getUserIdFromToken);
router.post(
  '/verify-password',
  authenticateToken,  // Middleware to verify JWT
  authController.verifyPassword
);
router.get("/getName", authenticateToken, authController.getName
);



module.exports = router;