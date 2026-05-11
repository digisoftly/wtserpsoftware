
'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useUser } from '@/firebase';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  
  // Normalize path for consistent shell rendering logic (handles trailing slashes)
  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  const isLoginPage = normalizedPath === '/login';
  
  // Only show the shell (sidebar and header) if the user is authenticated and not on the login page.
  const showShell = user && !isLoginPage;

  if (!showShell) {
    return <div className="h-screen w-full overflow-hidden bg-background">{children}</div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
