
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';

/**
 * AuthGate protects authenticated routes and handles redirection to login.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();

  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  const isLoginPage = normalizedPath === '/login';

  React.useEffect(() => {
    if (!isUserLoading && !user && !isLoginPage) {
      router.push('/login');
    }
  }, [user, isUserLoading, isLoginPage, router]);

  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-blue-600/10 flex items-center justify-center animate-pulse">
              <div className="h-8 w-8 rounded-lg bg-blue-600" />
            </div>
            <Loader2 className="absolute -bottom-1 -right-1 h-6 w-6 animate-spin text-blue-600 bg-slate-50 rounded-full p-0.5" />
          </div>
          <p className="text-[10px] uppercase font-black tracking-[0.3em] text-blue-600 animate-pulse">
            {t('auth.establishingSession')}
          </p>
        </div>
      </div>
    );
  }

  if (!user && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
