
'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/layout/sidebar-provider';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MobileHeader } from '@/components/layout/mobile-header';
import { useEffect, useState } from 'react';
import { useData } from '@/context/data-provider-refactored';
import { useAuth } from '@/context/auth-provider';
import { Loader2 } from 'lucide-react';

function FullPageLoader() {
    return (
        <div className="h-screen w-full flex items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoadingData } = useData();
  const { isLoadingUser, currentUser } = useAuth();
  const isAuthPage = pathname === '/' || pathname === '/register';
  
  // For auth pages, just render the children without the main layout.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If we are on a protected page and the user or app data is still loading, show a full-page loader.
  // This prevents content flashing before we know if a user is logged in and all data is ready.
  if (isLoadingUser || isLoadingData) {
    return <FullPageLoader />;
  }
  
  // If data is loaded but there's no current user, it means they should be redirected.
  // We can show a loader while the redirect from useAuthorization kicks in.
  if (!currentUser) {
    return <FullPageLoader />;
  }

  return (
    <SidebarProvider>
      <div className="h-screen w-full flex">
        <Sidebar />
        <div className="flex flex-1 flex-col">
          <MobileHeader />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-24 sm:pb-8">
            {children}
          </main>
        </div>
        <MobileNav />
      </div>
    </SidebarProvider>
  );
}
