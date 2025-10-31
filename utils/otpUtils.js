const crypto = require("crypto");

exports.generateOTP = () => {
  return crypto.randomInt(111111, 999999).toString(); // Génère un OTP à 6 chiffres
};
