const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

exports.sendOTP = async (numTelephone, otpCode) => {
  try {
    const message = await client.messages.create({
      body: `Votre code OTP pour l'application Flexee Pay est : ${otpCode}`,
      from: twilioPhone, // Assure-toi que c'est un numéro Twilio valide
      to: `+216${numTelephone}`,
    });

    if (!message.sid) {
      throw new Error("Échec de l'envoi du code OTP.");
    }

    return { success: true, message: "Code OTP envoyé avec succès." };
  } catch (error) {
    console.error("Erreur d'envoi SMS :", error.message);
    return {
      success: false,
      message:
        "Impossible d'envoyer le code OTP. Vérifiez votre numéro ou réessayez plus tard.",
    };
  }
};
