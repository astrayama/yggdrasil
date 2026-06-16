'use client';

import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import {
  getFriendlyAuthErrorMessage,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
  type FriendlyAuthErrorMessage,
} from '@/lib/auth';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: FriendlyAuthErrorMessage | null;
  signInWithGoogle: typeof signInWithGoogle;
  signInWithEmail: typeof signInWithEmail;
  signUpWithEmail: typeof signUpWithEmail;
  signOut: typeof signOut;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FriendlyAuthErrorMessage | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setError(null);
        setLoading(false);
      },
      (listenerError) => {
        setError(getFriendlyAuthErrorMessage(listenerError));
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      error,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [user, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
