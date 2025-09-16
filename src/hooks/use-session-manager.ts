'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/context/auth-provider';
// Client-side auth functions
const getSession = async () => {
  const response = await fetch('/api/auth?action=getSession');
  if (!response.ok) throw new Error('Failed to get session');
  return response.json();
};

const refreshSession = async () => {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'refreshSession' })
  });
  if (!response.ok) throw new Error('Failed to refresh session');
  return response.json();
};
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface UseSessionManagerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // en minutos
  inactivityTimeout?: number; // en minutos
  warningBeforeTimeout?: number; // en minutos
}

const DEFAULT_OPTIONS: Required<UseSessionManagerOptions> = {
  autoRefresh: true,
  refreshInterval: 30, // 30 minutos
  inactivityTimeout: 60, // 1 hora
  warningBeforeTimeout: 5, // 5 minutos antes
};

export function useSessionManager(options: UseSessionManagerOptions = {}) {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { currentUser, signOut, refreshUserSession } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);

  // Actualizar última actividad
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    isWarningShownRef.current = false;
  }, []);

  // Verificar y refrescar sesión
  const checkAndRefreshSession = useCallback(async () => {
    if (!currentUser) return;

    try {
      const session = await getSession();
      
      if (!session?.user) {
        console.log('SessionManager: Sesión expirada, cerrando sesión');
        await signOut();
        toast({
          title: 'Sesión expirada',
          description: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
          variant: 'destructive'
        });
        return;
      }

      // Intentar refrescar la sesión si está habilitado
      if (config.autoRefresh) {
        try {
          await refreshSession();
          await refreshUserSession();
          console.log('SessionManager: Sesión refrescada exitosamente');
        } catch (refreshError) {
          console.warn('SessionManager: Error al refrescar sesión:', refreshError);
          // No cerrar sesión inmediatamente, solo registrar el error
        }
      }
    } catch (error) {
      console.error('SessionManager: Error al verificar sesión:', error);
    }
  }, [currentUser, signOut, refreshUserSession, config.autoRefresh]);

  // Manejar logout por inactividad
  const handleInactivityLogout = useCallback(async () => {
    if (!currentUser) return;

    console.log('SessionManager: Cerrando sesión por inactividad');
    await signOut();
    
    toast({
      title: 'Sesión cerrada por inactividad',
      description: `Tu sesión se cerró después de ${config.inactivityTimeout} minutos de inactividad.`,
      variant: 'destructive'
    });
    
    router.push('/');
  }, [currentUser, signOut, toast, router, config.inactivityTimeout]);

  // Mostrar advertencia antes del logout
  const showInactivityWarning = useCallback(() => {
    if (!currentUser || isWarningShownRef.current) return;

    isWarningShownRef.current = true;
    
    toast({
      title: 'Sesión por expirar',
      description: `Tu sesión se cerrará en ${config.warningBeforeTimeout} minutos por inactividad. Realiza alguna acción para mantenerla activa.`,
      duration: 10000, // 10 segundos
    });
  }, [currentUser, toast, config.warningBeforeTimeout]);

  // Configurar timers de inactividad
  const setupInactivityTimers = useCallback(() => {
    // Limpiar timers existentes
    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current);
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }

    if (!currentUser) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;
    const inactivityMs = config.inactivityTimeout * 60 * 1000;
    const warningMs = (config.inactivityTimeout - config.warningBeforeTimeout) * 60 * 1000;

    // Configurar advertencia
    const timeUntilWarning = Math.max(0, warningMs - timeSinceLastActivity);
    warningTimeoutRef.current = setTimeout(showInactivityWarning, timeUntilWarning);

    // Configurar logout automático
    const timeUntilLogout = Math.max(0, inactivityMs - timeSinceLastActivity);
    inactivityTimeoutRef.current = setTimeout(handleInactivityLogout, timeUntilLogout);
  }, [currentUser, config.inactivityTimeout, config.warningBeforeTimeout, showInactivityWarning, handleInactivityLogout]);

  // Configurar refresh automático
  const setupAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    if (!currentUser || !config.autoRefresh || config.refreshInterval <= 0) {
      console.log('SessionManager: Auto-refresh deshabilitado o usuario no autenticado');
      return;
    }

    const intervalMs = config.refreshInterval * 60 * 1000;
    console.log(`SessionManager: Configurando auto-refresh cada ${config.refreshInterval} minutos`);
    refreshIntervalRef.current = setInterval(checkAndRefreshSession, intervalMs);
  }, [currentUser, config.autoRefresh, config.refreshInterval, checkAndRefreshSession]);

  // Manejar eventos de actividad del usuario
  useEffect(() => {
    if (!currentUser) return;

    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateLastActivity();
      setupInactivityTimers();
    };

    // Agregar listeners de actividad
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Configurar timers iniciales
    setupInactivityTimers();

    return () => {
      // Limpiar listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [currentUser, updateLastActivity, setupInactivityTimers]);

  // Configurar refresh automático
  useEffect(() => {
    setupAutoRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [setupAutoRefresh]);

  // Limpiar todos los timers al desmontar
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearTimeout(inactivityTimeoutRef.current);
      }
      if (warningTimeoutRef.current) {
        clearTimeout(warningTimeoutRef.current);
      }
    };
  }, []);

  // Función manual para refrescar sesión
  const manualRefresh = useCallback(async () => {
    updateLastActivity();
    await checkAndRefreshSession();
  }, [updateLastActivity, checkAndRefreshSession]);

  // Función para extender sesión (resetear timers)
  const extendSession = useCallback(() => {
    updateLastActivity();
    setupInactivityTimers();
  }, [updateLastActivity, setupInactivityTimers]);

  return {
    manualRefresh,
    extendSession,
    isSessionActive: !!currentUser,
    lastActivity: lastActivityRef.current,
  };
}