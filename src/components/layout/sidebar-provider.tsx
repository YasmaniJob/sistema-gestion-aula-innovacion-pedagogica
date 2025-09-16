
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
  isSidebarCollapsed: boolean;
  toggleSidebarCollapse: () => void;
  isMobile: boolean;
  pageTitle: string;
  setPageTitle: (title: string) => void;
  headerActions: React.ReactNode | null;
  setHeaderActions: (actions: React.ReactNode | null) => void;
};

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const [pageTitle, setPageTitle] = useState('');
  const [headerActions, setHeaderActions] = useState<React.ReactNode | null>(null);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };
  
  return (
    <SidebarContext.Provider
      value={{
        isSidebarCollapsed,
        toggleSidebarCollapse,
        isMobile,
        pageTitle,
        setPageTitle,
        headerActions,
        setHeaderActions,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
