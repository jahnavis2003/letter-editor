const admin = require("firebase-admin");
// const serviceAccount = require("./serviceAccountKey.json");
// Parse JSON from environment variable
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

module.exports = admin;
