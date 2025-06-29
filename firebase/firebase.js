const admin = require("firebase-admin");
require("dotenv").config(); // pour charger la variable FIREBASE_CONFIG

const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const sendPushNotification = (deviceToken, message) => {
  return admin.messaging().send({
    token: deviceToken,
    notification: {
      title: "Notification",
      body: message,
    },
  });
};

module.exports = sendPushNotification;