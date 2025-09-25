'use client';

import { useEffect, useCallback } from 'react';
import { useSessionStore } from '@/stores/session-store';
import { signIn as signInSvc, signOut as signOutSvc, getSession } from '@/services/auth.client.ts';
import { getAllUsers } from '@/services/user.service';
import type { LoanUser } from '@/domain/types';

// Hook para gestionar la sesión de usuario
export function useSession() {
  const { user, isLoading, setUser, setLoading, isAuthenticated } = useSessionStore();

  const checkUserSession = useCallback(async () => {
    // useSession: Iniciando verificación de sesión
    setLoading(true);
    try {
      const session = await getSession();
      if (session?.user) {
        // useSession: Sesión activa encontrada para: session.user.id
        const users = await getAllUsers();
        const userProfile = users.find(u => u.id === session.user.id);

        if (userProfile) {
          // useSession: Perfil de usuario encontrado
          setUser(userProfile);
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
        } else {
          // useSession: Perfil de usuario no encontrado para sesión activa, cerrando sesión.
          await signOutSvc();
          setUser(null);
          localStorage.removeItem('currentUser');
        }
      } else {
        // useSession: No hay sesión activa.
        setUser(null);
        localStorage.removeItem('currentUser');
      }
    } catch (error) {
      // useSession: Error al verificar sesión: error
      setUser(null);
      localStorage.removeItem('currentUser');
    } finally {
      setLoading(false);
      // useSession: Verificación de sesión completada.
    }
  }, [setUser, setLoading]);

  // Efecto para verificar la sesión una sola vez al montar el hook
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkUserSession();
    }
  }, [checkUserSession]);

  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const authUser = await signInSvc(credentials);
      if (!authUser) throw new Error('Authentication failed');

      const users = await getAllUsers();
      const userProfile = users.find(u => u.id === authUser.id);

      if (!userProfile) {
        throw new Error("El perfil de usuario no se encontró.");
      }

      setUser(userProfile);
      localStorage.setItem('currentUser', JSON.stringify(userProfile));
      return userProfile;
    } catch (error) {
      // Error en signIn (useSession): error
      throw error;
    }
  }, [setUser]);

  const signOut = useCallback(async () => {
    try {
      await signOutSvc();
      setUser(null);
      localStorage.removeItem('currentUser');
      // useSession: Sesión cerrada exitosamente
    } catch (error) {
      // Error al cerrar sesión (useSession): error
      // Asegurarse de limpiar el estado local incluso si falla la llamada a la API
      setUser(null);
      localStorage.removeItem('currentUser');
      throw error;
    }
  }, [setUser]);

  return {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    checkUserSession, // Exponer por si se necesita refrescar manualmente
  };
}
