
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/sidebar';
import { SidebarProvider } from '@/components/layout/sidebar-provider';
import { MobileNav } from '@/components/layout/mobile-nav';
import { MobileHeader } from '@/components/layout/mobile-header';
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
  const { isLoading: isLoadingUser, user: currentUser } = useAuth();
  const [isHydrated, setIsHydrated] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const isAuthPage = pathname === '/' || pathname === '/register';
  
  // Manejar hidratación del cliente
  useEffect(() => {
    setIsHydrated(true);
    
    // Timeout de seguridad para evitar carga infinita
    const timeout = setTimeout(() => {
      if (isLoadingUser || isLoadingData) {
        console.warn('AppProvider: Timeout de carga detectado, forzando renderizado');
        setLoadingTimeout(true);
      }
    }, 20000); // 20 segundos timeout
    
    return () => clearTimeout(timeout);
  }, [isLoadingUser, isLoadingData]);
  
  // En el servidor, renderizar solo el loader
  if (!isHydrated) {
    return <FullPageLoader />;
  }
  
  // For auth pages, just render the children without the main layout.
  if (isAuthPage) {
    return <>{children}</>;
  }

  // If we are on a protected page and the user or app data is still loading, show a full-page loader.
  // This prevents content flashing before we know if a user is logged in and all data is ready.
  // Pero si hay timeout, continuar con el renderizado
  if ((isLoadingUser || isLoadingData) && !loadingTimeout) {
    return <FullPageLoader />;
  }
  
  // If data is loaded but there's no current user, it means they should be redirected.
  // We can show a loader while the redirect from useAuthorization kicks in.
  if (!currentUser && !loadingTimeout) {
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
