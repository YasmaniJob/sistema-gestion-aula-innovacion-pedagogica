'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSessionManager } from '@/hooks/use-session-manager';

interface SessionContextType {
  manualRefresh: () => Promise<void>;
  extendSession: () => void;
  isSessionActive: boolean;
  lastActivity: number;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: ReactNode;
  autoRefresh?: boolean;
  refreshInterval?: number;
  inactivityTimeout?: number;
  warningBeforeTimeout?: number;
}

export function SessionProvider({ 
  children, 
  autoRefresh = true,
  refreshInterval = 30,
  inactivityTimeout = 60,
  warningBeforeTimeout = 5
}: SessionProviderProps) {
  const sessionManager = useSessionManager({
    autoRefresh,
    refreshInterval,
    inactivityTimeout,
    warningBeforeTimeout
  });

  return (
    <SessionContext.Provider value={sessionManager}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}