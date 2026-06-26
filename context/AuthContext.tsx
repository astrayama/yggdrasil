'use client';

import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import type { User, UserCredential } from 'firebase/auth';
import {
  getFriendlyAuthErrorMessage,
  type FriendlyAuthErrorMessage,
} from '@/lib/auth-errors';
import { hasFirebaseClientConfig } from '@/lib/firebase/config';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: FriendlyAuthErrorMessage | null;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, password: string) => Promise<UserCredential>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const firebaseUnavailableMessage: FriendlyAuthErrorMessage =
  'Something went wrong. Please try again.';

const signInWithGoogle = async () => {
  const authModule = await import('@/lib/auth');
  return authModule.signInWithGoogle();
};

const signInWithEmail = async (email: string, password: string) => {
  const authModule = await import('@/lib/auth');
  return authModule.signInWithEmail(email, password);
};

const signUpWithEmail = async (email: string, password: string) => {
  const authModule = await import('@/lib/auth');
  return authModule.signUpWithEmail(email, password);
};

const signOut = async () => {
  const authModule = await import('@/lib/auth');
  return authModule.signOut();
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FriendlyAuthErrorMessage | null>(null);

  useEffect(() => {
    if (pathname === '/') {
      setUser(null);
      setError(null);
      setLoading(false);
      return;
    }

    if (!hasFirebaseClientConfig) {
      setUser(null);
      setError(firebaseUnavailableMessage);
      setLoading(false);
      return;
    }

    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    async function subscribeToAuth() {
      try {
        const [{ onAuthStateChanged }, { auth }] = await Promise.all([
          import('firebase/auth'),
          import('@/lib/firebase/client'),
        ]);

        if (!isMounted) return;

        unsubscribe = onAuthStateChanged(
          auth,
          (currentUser) => {
            setUser(currentUser);
            setError(null);
            setLoading(false);
          },
          (listenerError) => {
            console.error('[AuthContext] onAuthStateChanged error:', listenerError);
            setError(getFriendlyAuthErrorMessage(listenerError));
            setLoading(false);
          }
        );
      } catch (authError) {
        console.error('[AuthContext] Firebase auth initialization error:', authError);
        if (!isMounted) return;
        setUser(null);
        setError(firebaseUnavailableMessage);
        setLoading(false);
      }
    }

    void subscribeToAuth();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, [pathname]);

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
