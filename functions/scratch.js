const admin = require("firebase-admin");
admin.initializeApp({
  projectId: "yggdrasil-497923"
});
const db = admin.firestore();
async function run() {
  const userRef = db.collection('users').doc('8j1UCFkpOLZ6EskTZIPGKkRcszw1');
  await userRef.set({ stripeSubscriptionId: 'lifetime_mock_id', billingPeriod: 'lifetime' }, { merge: true });
  console.log("Done");
}
run().catch(console.error);
