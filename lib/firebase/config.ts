const requiredClientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfig = {
  ...requiredClientConfig,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

export const hasFirebaseClientConfig = Object.values(requiredClientConfig).every(
  (value) => typeof value === 'string' && value.length > 0
);

export function createMissingFirebaseConfigError() {
  return Object.assign(
    new Error('Firebase client configuration is missing. Add the required NEXT_PUBLIC_FIREBASE_* environment variables.'),
    { code: 'auth/missing-client-config' }
  );
}
