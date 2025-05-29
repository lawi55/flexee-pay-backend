const admin = require("firebase-admin");
const serviceAccount = require("../firebase/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
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