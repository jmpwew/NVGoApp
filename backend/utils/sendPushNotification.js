const admin = require('firebase-admin');
const serviceAccount = require('../firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

async function sendPushNotification(expoPushTokens, title, body) {
  if (!expoPushTokens || expoPushTokens.length === 0) return;

  const messages = expoPushTokens.map(token => ({
    token,
    notification: { title, body },
    android: {
      notification: {
        sound: 'default',
        priority: 'high'
      }
    }
  }));

  for (const message of messages) {
    try {
      await admin.messaging().send(message);
      console.log('Notification sent:', message.notification.title);
    } catch (err) {
      console.error('Push error:', err.message);
    }
  }
}

module.exports = sendPushNotification;