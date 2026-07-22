const admin = require('firebase-admin');
const serviceAccount = require('./yggdrasil-497923-firebase-adminsdk-3g86w-b040e34b9d.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const uid = '8j1UCFkpOLZ6EskTZIPGKkRcszw1';

async function run() {
  await db.collection('subscriptions').doc(uid).set({
    userId: uid,
    status: 'active',
    billingPeriod: 'lifetime',
    stripeCustomerId: 'cus_mock_lifetime'
  }, { merge: true });
  
  await db.collection('users').doc(uid).set({
    billingPeriod: 'lifetime',
  }, { merge: true });
  
  console.log("SUCCESS");
}
run();
