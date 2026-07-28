'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { useUser } from '@/firebase';
import { SessionTimeoutHandler } from '@/components/auth/session-timeout-handler';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  
  const normalizedPath = pathname?.replace(/\/$/, '') || '';
  const isLoginPage = normalizedPath === '/login';
  
  const showShell = user && !isLoginPage;

  if (!showShell) {
    return (
      <div className="h-screen w-full overflow-hidden bg-white">
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-slate-50/30">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0 w-full overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
            <div className="max-w-[1600px] mx-auto p-4 md:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        <SessionTimeoutHandler />
      </div>
    </SidebarProvider>
  );
}