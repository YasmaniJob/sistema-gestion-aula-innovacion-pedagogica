'use client';

import { createContext, useContext, ReactNode, useState } from 'react';
import { useAuth } from '@/context/auth-provider';
import { useSessionManager } from '@/hooks/use-session-manager';
import { LoadingWithTimeout } from '@/components/ui/loading-with-timeout';
import { TIMEOUTS } from '@/config/timeouts';

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
  const { isLoadingUser, refreshUserSession } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  
  const sessionManager = useSessionManager({
    autoRefresh,
    refreshInterval: refreshInterval * 60 * 1000, // Convertir minutos a ms
    inactivityTimeout: inactivityTimeout * 60 * 1000, // Convertir minutos a ms
    warningBeforeTimeout: warningBeforeTimeout * 60 * 1000 // Convertir minutos a ms
  });

  const handleRetry = async () => {
    setRetryCount(prev => prev + 1);
    try {
      await refreshUserSession();
    } catch (error) {
      console.error('Error al reintentar carga de sesión:', error);
    }
  };

  const handleTimeout = () => {
    console.warn('Timeout en carga de sesión después de 15 segundos');
  };

  // Mostrar loading solo si realmente está cargando
  if (isLoadingUser) {
    return (
      <LoadingWithTimeout
        timeout={TIMEOUTS.UI.LOADING_SCREEN}
        onTimeout={handleTimeout}
        onRetry={handleRetry}
        message="Cargando sesión..."
        timeoutMessage="La carga de la sesión está tomando más tiempo del esperado. Esto puede deberse a problemas de conexión con el servidor."
      />
    );
  }

  return (
    <SessionContext.Provider value={sessionManager}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
}