const admin = require('firebase-admin');

// Reads the service account JSON from an environment variable instead of a
// committed file, so it never sits in the repo or the build image. Render's
// env var UI takes a single line, so we store the whole JSON minified and
// parse it back here.
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'nvgo-cea2f.firebasestorage.app',
});

const bucket = admin.storage().bucket();

module.exports = bucket;
