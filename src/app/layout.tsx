
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthGate } from '@/components/auth/auth-gate';
import { TenantProvider } from '@/context/tenant-context';
import { ClientLayout } from '@/components/layout/client-layout';

export const metadata: Metadata = {
  title: 'WarriorERP | Enterprise Resource Planning',
  description: 'Production-ready SaaS ERP system for Warrior Tech System',
  robots: 'noindex, nofollow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background">
        <FirebaseClientProvider>
          <AuthGate>
            <TenantProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </TenantProvider>
          </AuthGate>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
