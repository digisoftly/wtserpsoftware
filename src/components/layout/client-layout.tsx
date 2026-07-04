'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useUser } from '@/firebase';
import { SessionTimeoutHandler } from '@/components/auth/session-timeout-handler';
import { cn } from '@/lib/utils';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  
  // Normalize path for consistent shell rendering logic (handles trailing slashes)
  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  const isLoginPage = normalizedPath === '/login';
  
  // Only show the shell (sidebar and header) if the user is authenticated and not on the login page.
  const showShell = user && !isLoginPage;

  if (!showShell) {
    return (
      <div className="h-screen w-full overflow-hidden bg-background">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden bg-background">
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 custom-scrollbar relative">
            <div className="max-w-[1600px] mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
        <SessionTimeoutHandler />
      </div>
    </SidebarProvider>
  );
}
