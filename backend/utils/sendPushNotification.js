// Sends push notifications through Expo's push service.
//
// The mobile app registers with Notifications.getExpoPushTokenAsync(), which
// returns an Expo push token (e.g. "ExponentPushToken[xxxxxxxxxxxx]") — not a
// raw FCM/APNs token. Expo's push API is the service that's actually built to
// accept that token format; it forwards the notification to FCM (Android) or
// APNs (iOS) on our behalf, so we don't need Firebase Admin credentials here.
//
// Docs: https://docs.expo.dev/push-notifications/sending-notifications/

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_REGEX = /^Expo(nent)?PushToken\[.+\]$/;

// Expo recommends batching up to 100 messages per request.
function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function sendPushNotification(expoPushTokens, title, body, imageUrl = null) {
  if (!expoPushTokens || expoPushTokens.length === 0) return;

  // Drop anything that isn't actually a valid Expo push token (null,
  // empty string, or a stray native token from elsewhere).
  const validTokens = expoPushTokens.filter(t => t && EXPO_TOKEN_REGEX.test(t));
  if (validTokens.length === 0) return;

  const messages = validTokens.map(to => ({
    to,
    title,
    body,
    sound: 'default',
    priority: 'high',
    // Shows the announcement/news picture in the notification itself.
    // Android renders this automatically. iOS needs a Notification Service
    // Extension in the native build to actually download and display it —
    // without one, iOS silently ignores this field and just shows text.
    ...(imageUrl ? { richContent: { image: imageUrl } } : {}),
  }));

  for (const batch of chunk(messages, 100)) {
    try {
      const res = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });

      const data = await res.json();

      // Expo returns one "ticket" per message, in the same order.
      const tickets = Array.isArray(data?.data) ? data.data : [];
      tickets.forEach((ticket, i) => {
        if (ticket.status === 'error') {
          console.error(
            'Push error:', ticket.message,
            '| token:', batch[i]?.to,
            '| details:', ticket.details
          );
        }
      });

      console.log(`Notification sent: "${title}" to ${batch.length} device(s)`);
    } catch (err) {
      console.error('Push request failed:', err.message);
    }
  }
}

module.exports = sendPushNotification;