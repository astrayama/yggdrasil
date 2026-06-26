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
  'auth/missing-client-config': 'Authentication is not configured in this environment.',
} as const;

type FriendlyAuthErrorCode = keyof typeof friendlyAuthErrorMessages;

export type FriendlyAuthErrorMessage =
  | (typeof friendlyAuthErrorMessages)[FriendlyAuthErrorCode]
  | 'Something went wrong. Please try again.';

function isFriendlyAuthErrorCode(code: string): code is FriendlyAuthErrorCode {
  return code in friendlyAuthErrorMessages;
}

function hasAuthErrorCode(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

export function getFriendlyAuthErrorMessage(error: unknown): FriendlyAuthErrorMessage {
  if (hasAuthErrorCode(error) && isFriendlyAuthErrorCode(error.code)) {
    return friendlyAuthErrorMessages[error.code];
  }

  return 'Something went wrong. Please try again.';
}
