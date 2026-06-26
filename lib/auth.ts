import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import {
  createMissingFirebaseConfigError,
  hasFirebaseClientConfig,
} from './firebase/config';
export { getFriendlyAuthErrorMessage, type FriendlyAuthErrorMessage } from './auth-errors';

async function getConfiguredAuth() {
  if (!hasFirebaseClientConfig) {
    throw createMissingFirebaseConfigError();
  }

  const { auth } = await import('./firebase/client');
  return auth;
}

export const signInWithGoogle = async () => {
  const auth = await getConfiguredAuth();
  const provider = new GoogleAuthProvider();
  // Optional: Add scopes or custom parameters here if needed
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
  const auth = await getConfiguredAuth();
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  const auth = await getConfiguredAuth();
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  const auth = await getConfiguredAuth();
  return firebaseSignOut(auth);
};
