'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-provider';
// Client-side auth functions with improved error handling
const getSession = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
  
  try {
    const response = await fetch('/api/auth?action=getSession', {
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return null; // Session expired
      }
      throw new Error(`Failed to get session: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Session check timeout');
    }
    throw error;
  }
};

const refreshSession = async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch('/api/auth', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify({ action: 'refreshSession' }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        return null; // Session expired
      }
      throw new Error(`Failed to refresh session: ${response.status}`);
    }
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Session refresh timeout');
    }
    throw error;
  }
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
  
  // Estado para controlar la hidratación
  const [isHydrated, setIsHydrated] = useState(false);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isWarningShownRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  // Efecto para manejar la hidratación
  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
      
      if (!session || !session.user) {
        console.log('SessionManager: Sesión expirada, cerrando sesión y redirigiendo');
        await signOut();
        toast({
          title: 'Sesión expirada',
          description: 'Tu sesión ha expirado. Redirigiendo a la página de inicio...',
          variant: 'destructive'
        });
        // Redirección automática cuando la sesión expira
        router.push('/');
        return;
      }

      // Intentar refrescar la sesión si está habilitado
      if (config.autoRefresh) {
        try {
          const refreshResult = await refreshSession();
          if (!refreshResult) {
            console.log('SessionManager: Refresh retornó null, sesión expirada');
            await signOut();
            toast({
              title: 'Sesión expirada',
              description: 'Tu sesión ha expirado. Redirigiendo a la página de inicio...',
              variant: 'destructive'
            });
            router.push('/');
            return;
          }
          await refreshUserSession();
          console.log('SessionManager: Sesión refrescada exitosamente');
        } catch (refreshError) {
          console.warn('SessionManager: Error al refrescar sesión:', refreshError);
          // Si falla el refresh, verificar si la sesión sigue siendo válida
          const currentSession = await getSession();
          if (!currentSession || !currentSession.user) {
            console.log('SessionManager: Sesión inválida después de fallo en refresh, cerrando sesión');
            await signOut();
            toast({
              title: 'Sesión expirada',
              description: 'Tu sesión ha expirado. Redirigiendo a la página de inicio...',
              variant: 'destructive'
            });
            router.push('/');
          }
        }
      }
    } catch (error) {
      console.error('SessionManager: Error al verificar sesión:', error);
      // Si hay error de red o timeout, intentar verificar la sesión una vez más
      if (error.message === 'Session check timeout' || error.message.includes('fetch')) {
        console.log('SessionManager: Error de conectividad detectado, posible sesión expirada');
        toast({
          title: 'Problema de conectividad',
          description: 'Se detectó un problema de conexión. Redirigiendo a la página de inicio...',
          variant: 'destructive'
        });
        await signOut();
        router.push('/');
      }
    }
  }, [currentUser, signOut, refreshUserSession, config.autoRefresh, toast, router]);

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

    // Heartbeat para detectar si la app se queda colgada
    let lastHeartbeat = Date.now();
    const heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastHeartbeat = now - lastHeartbeat;
      
      // Si han pasado más de 2 minutos sin heartbeat, algo está mal
      if (timeSinceLastHeartbeat > 120000) {
        console.warn('SessionManager: Aplicación posiblemente colgada, redirigiendo a inicio');
        window.location.href = '/';
        return;
      }
      
      lastHeartbeat = now;
    }, 30000); // Check every 30 seconds

    // Agregar listener para errores no manejados que podrían colgar la app
    const handleUnhandledError = (event: ErrorEvent) => {
      console.error('SessionManager: Error no manejado detectado:', event.error);
      if (event.error?.message?.includes('session') || 
          event.error?.message?.includes('auth') ||
          event.error?.message?.includes('fetch')) {
        console.log('SessionManager: Error relacionado con sesión, redirigiendo a inicio');
        router.push('/');
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('SessionManager: Promise rechazada no manejada:', event.reason);
      if (event.reason?.message?.includes('session') || 
          event.reason?.message?.includes('auth') ||
          event.reason?.message?.includes('fetch')) {
        console.log('SessionManager: Error de promesa relacionado con sesión, redirigiendo a inicio');
        router.push('/');
      }
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      // Limpiar listeners
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      clearInterval(heartbeatInterval);
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [currentUser, updateLastActivity, setupInactivityTimers, router]);

  // Configurar refresh automático
  useEffect(() => {
    // Solo ejecutar después de la hidratación
    if (!isHydrated) return;
    
    // Evitar múltiples inicializaciones
    if (isInitializedRef.current) return;
    
    if (!currentUser) {
      return;
    }

    isInitializedRef.current = true;
    setupAutoRefresh();
    
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      isInitializedRef.current = false;
    };
  }, [isHydrated, currentUser, setupAutoRefresh]);

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