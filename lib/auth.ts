import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from './firebase/client';

const friendlyAuthErrorMessages = {
  'auth/invalid-credential': 'Invalid email or password.',
  'auth/user-not-found': 'Invalid email or password.',
  'auth/wrong-password': 'Invalid email or password.',
  'auth/email-already-in-use': 'An account with this email already exists.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
  'auth/popup-closed-by-user': 'The Google sign-in window was closed before finishing.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Please allow popups and try again.',
  'auth/network-request-failed': 'Network connection failed. Please check your connection and try again.',
  'auth/account-exists-with-different-credential': 'An account already exists with this email. Try another sign-in method.',
} as const;

type FriendlyAuthErrorCode = keyof typeof friendlyAuthErrorMessages;
export type FriendlyAuthErrorMessage =
  | (typeof friendlyAuthErrorMessages)[FriendlyAuthErrorCode]
  | 'Something went wrong. Please try again.';

function isFriendlyAuthErrorCode(code: string): code is FriendlyAuthErrorCode {
  return code in friendlyAuthErrorMessages;
}

export function getFriendlyAuthErrorMessage(error: unknown): FriendlyAuthErrorMessage {
  if (error instanceof FirebaseError && isFriendlyAuthErrorCode(error.code)) {
    return friendlyAuthErrorMessages[error.code];
  }

  return 'Something went wrong. Please try again.';
}

export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  // Optional: Add scopes or custom parameters here if needed
  return signInWithPopup(auth, provider);
};

export const signInWithEmail = async (email: string, password: string) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const signUpWithEmail = async (email: string, password: string) => {
  return createUserWithEmailAndPassword(auth, email, password);
};

export const signOut = async () => {
  return firebaseSignOut(auth);
};
