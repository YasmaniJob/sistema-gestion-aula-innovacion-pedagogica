'use client';

import { useEffect, useRef, useCallback } from 'react';
import { supabaseAdmin } from '@/infrastructure/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface UseRealtimeSubscriptionsProps {
  onLoansChange: () => void;
  onReservationsChange: () => void;
  onResourcesChange: () => void;
  enabled?: boolean; // Permitir deshabilitar suscripciones
}

// Configuración optimizada para plan gratuito
const REALTIME_CONFIG = {
  debounceDelay: 3000, // Aumentar debounce a 3 segundos
  maxRetries: 2, // Reducir reintentos
  reconnectDelay: 5000, // Aumentar delay de reconexión
  heartbeatInterval: 30000, // Heartbeat cada 30 segundos
};

export function useRealtimeSubscriptions({
  onLoansChange,
  onReservationsChange,
  onResourcesChange,
  enabled = true, // Por defecto habilitado
}: UseRealtimeSubscriptionsProps) {
  const channelsRef = useRef<RealtimeChannel[]>([]);
  const debounceTimersRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const isActiveRef = useRef(true);
  const callbacksRef = useRef({ onLoansChange, onReservationsChange, onResourcesChange });
  const isSubscribedRef = useRef(false);
  
  // Update callbacks ref without triggering re-subscriptions
  callbacksRef.current = { onLoansChange, onReservationsChange, onResourcesChange };

  // Debounce optimizado con mayor delay
  const debounce = useCallback((key: string, callback: () => void, delay: number = REALTIME_CONFIG.debounceDelay) => {
    if (debounceTimersRef.current[key]) {
      clearTimeout(debounceTimersRef.current[key]);
    }
    debounceTimersRef.current[key] = setTimeout(() => {
      if (isActiveRef.current) {
        callback();
      }
    }, delay);
  }, []);

  // Cleanup function optimizada
  const cleanup = useCallback(() => {
    isActiveRef.current = false;
    isSubscribedRef.current = false;
    
    // Limpiar todos los timers de debounce
    Object.values(debounceTimersRef.current).forEach(timer => {
      clearTimeout(timer);
    });
    debounceTimersRef.current = {};
    
    // Desuscribir todos los canales
    channelsRef.current.forEach(channel => {
      try {
        supabaseAdmin.removeChannel(channel);
      } catch (error) {
        console.warn('Error removing channel:', error);
      }
    });
    channelsRef.current = [];
  }, []);

  // Función para verificar el estado de la conexión
  const checkConnectionHealth = useCallback(() => {
    const activeChannels = channelsRef.current.filter(channel => 
      channel.state === 'joined' || channel.state === 'joining'
    );
    
    if (activeChannels.length === 0 && enabled && isSubscribedRef.current) {
      console.warn('No active channels detected, may need reconnection');
      // Opcional: implementar lógica de reconexión automática
    }
    
    return activeChannels.length;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (isSubscribedRef.current) {
      return;
    }

    console.log('Setting up optimized realtime subscriptions...');
    isSubscribedRef.current = true;
    isActiveRef.current = true;

    // Configuración optimizada para reducir uso de recursos
    const channelConfig = {
      config: {
        broadcast: { self: false }, // No recibir nuestros propios cambios
        presence: { key: 'user_id' },
      }
    };

    // Suscripción optimizada a loans (solo eventos críticos)
    const loansChannel = supabaseAdmin
      .channel('loans-optimized', channelConfig)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'loans',
          // Filtrar solo cambios importantes
          filter: 'status=in.(pending,active,returned)'
        },
        (payload) => {
          console.log('Loans change:', payload.eventType);
          debounce('loans', () => callbacksRef.current.onLoansChange());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Loans subscription active');
        }
      });

    // Suscripción optimizada a reservations
    const reservationsChannel = supabaseAdmin
      .channel('reservations-optimized', channelConfig)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservations',
          // Solo cambios de estado importantes
          filter: 'status=in.(pending,approved,rejected)'
        },
        (payload) => {
          console.log('Reservations change:', payload.eventType);
          debounce('reservations', () => callbacksRef.current.onReservationsChange());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Reservations subscription active');
        }
      });

    // Suscripción optimizada a resources (solo cambios de estado)
    const resourcesChannel = supabaseAdmin
      .channel('resources-optimized', channelConfig)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'resources',
          // Solo cuando cambia el estado o stock
          filter: 'status=neq.null'
        },
        (payload) => {
          console.log('Resources change:', payload.eventType);
          debounce('resources', () => callbacksRef.current.onResourcesChange());
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Resources subscription active');
        }
      });

    // Guardar referencias para cleanup
    channelsRef.current = [loansChannel, reservationsChannel, resourcesChannel];

    // Heartbeat para mantener conexión activa pero eficiente
    const heartbeatInterval = setInterval(() => {
      if (isActiveRef.current) {
        // Ping silencioso para mantener conexión
        channelsRef.current.forEach(channel => {
          if (channel.state === 'joined') {
            channel.send({ type: 'heartbeat', payload: {} });
          }
        });
      }
    }, REALTIME_CONFIG.heartbeatInterval);

    return () => {
      console.log('Cleaning up optimized realtime subscriptions...');
      isSubscribedRef.current = false;
      isActiveRef.current = false;
      
      // Limpiar timers
      Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
      debounceTimersRef.current = {};
      
      // Limpiar heartbeat
      clearInterval(heartbeatInterval);
      
      // Desuscribir canales
      channelsRef.current.forEach(channel => {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing channel:', error);
        }
      });
      channelsRef.current = [];
    };
  }, [enabled, debounce]);
}