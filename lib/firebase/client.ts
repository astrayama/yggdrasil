import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import {
  createMissingFirebaseConfigError,
  firebaseConfig,
  hasFirebaseClientConfig,
} from './config';

if (!hasFirebaseClientConfig) {
  throw createMissingFirebaseConfigError();
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const storage = getStorage(app);

let analytics: Analytics | null = null;
const analyticsReady = typeof window !== 'undefined'
  ? isSupported().then((supported) => {
      if (supported) {
        analytics = getAnalytics(app);
      }

      return analytics;
    })
  : Promise.resolve(null);

export { app, auth, db, functions, storage, analytics, analyticsReady };
