'use client';

import { AuthForm } from '@/components/auth/AuthForm';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user && !loading) {
      router.push('/journal');
    }
  }, [user, loading, router]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-primary text-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-2xl shadow-xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back to Yggdrasil
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/signup" className="font-medium text-primary hover:text-primary-focus transition-colors">
              create a new account
            </Link>
          </p>
        </div>
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
