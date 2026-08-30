
'use client';

import * as React from 'react';
import { useUser } from '@/firebase';
import { useRouter, usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useTenant } from '@/context/tenant-context';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { settings } = useTenant();
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
      <div className="flex h-screen w-full flex-col items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-8">
          <div className="relative">
            {settings?.loadingLogo ? (
              <div className="w-32 h-32 flex items-center justify-center animate-in fade-in zoom-in-75 duration-1000">
                <img src={settings.loadingLogo} alt="Loading" className="max-w-full max-h-full object-contain animate-pulse" />
              </div>
            ) : (
              <div className="h-16 w-16 rounded-2xl bg-blue-600/10 flex items-center justify-center animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-blue-600" />
              </div>
            )}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <p className="text-[10px] uppercase font-black tracking-[0.4em] text-blue-600 whitespace-nowrap">
                {t('loading')}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user && !isLoginPage) {
    return null;
  }

  return <>{children}</>;
}
