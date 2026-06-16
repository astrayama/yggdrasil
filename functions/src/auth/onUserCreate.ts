import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions/v1';
import * as logger from 'firebase-functions/logger';

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const db = admin.firestore();
  const userRef = db.doc(`users/${user.uid}`);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);

    if (snapshot.exists) {
      logger.info('User document already exists; skipping create.', { uid: user.uid });
      return;
    }

    transaction.create(userRef, {
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      tier: 'free',
      entryCount: 0,
    });
  });

  logger.info('User document ensured for new auth user.', { uid: user.uid });
});
