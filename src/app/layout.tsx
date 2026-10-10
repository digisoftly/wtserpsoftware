
'use client';

import * as React from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGate } from '@/components/auth/auth-gate';
import { TenantProvider, useTenant } from '@/context/tenant-context';
import { ClientLayout } from '@/components/layout/client-layout';
import { ErrorBoundary } from '@/components/error-boundary';

/**
 * FaviconManager is a small client component that injects 
 * the custom favicon from settings into the document head.
 */
function FaviconManager() {
  const { settings } = useTenant();
  
  React.useEffect(() => {
    if (settings?.companyFavicon) {
      const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      // @ts-ignore
      link.type = 'image/x-icon';
      // @ts-ignore
      link.rel = 'shortcut icon';
      // @ts-ignore
      link.href = settings.companyFavicon;
      document.getElementsByTagName('head')[0].appendChild(link);
    }
  }, [settings]);

  return null;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <title>WarriorERP | Enterprise Resource Planning</title>
      </head>
      <body className="font-body antialiased bg-background min-h-screen" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            <TenantProvider>
              <AuthGate>
                <FaviconManager />
                <ClientLayout>
                  {children}
                </ClientLayout>
                <Toaster />
              </AuthGate>
            </TenantProvider>
          </FirebaseClientProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
