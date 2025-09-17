'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { LoanUser } from '@/domain/types';
import { getUsers } from '@/services/client/user.client';

// Client-side auth functions
const signInSvc = async (email: string, password: string) => {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signIn', email, password })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to sign in');
  }
  
  return response.json();
};

const signOutSvc = async () => {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'signOut' })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to sign out');
  }
  
  return response.json();
};

const getCurrentUser = async () => {
  const response = await fetch('/api/auth?action=getCurrentUser');
  if (!response.ok) throw new Error('Failed to get current user');
  return response.json();
};

const getSession = async () => {
  const response = await fetch('/api/auth?action=getSession');
  if (!response.ok) throw new Error('Failed to get session');
  return response.json();
};

interface AuthContextType {
  currentUser: LoanUser | null;
  isLoadingUser: boolean;
  setCurrentUser: React.Dispatch<React.SetStateAction<LoanUser | null>>;
  signIn: (credentials: { email: string; password: string }) => Promise<LoanUser>;
  signOut: () => Promise<void>;
  refreshUserSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<LoanUser | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  // Verificar sesión inicial
  useEffect(() => {
    // Marcar como hidratado
    setIsHydrated(true);
    
    // Evitar múltiples verificaciones
    if (sessionChecked) {
      return;
    }
    
    const checkUserSession = async () => {
      console.log('AuthProvider: Iniciando verificación de sesión');
      setIsLoadingUser(true);
      
      try {
        console.log('AuthProvider: Verificando sesión activa...');
        
        // Crear un timeout para evitar carga infinita
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout en verificación de sesión')), 8000);
        });
        
        // Verificar si hay sesión activa con timeout
        const sessionPromise = getSession();
        const session = await Promise.race([sessionPromise, timeoutPromise]);
        
        if (session?.user) {
          console.log('AuthProvider: Sesión activa encontrada para usuario:', session.user.id);
          
          // Si hay sesión activa, verificar si tenemos el perfil en localStorage
          const storedUser = localStorage.getItem('currentUser');
          console.log('AuthProvider: Usuario en localStorage:', storedUser ? 'Encontrado' : 'No encontrado');
          
          if (storedUser) {
            try {
              const parsedUser = JSON.parse(storedUser);
              // Verificar que el usuario almacenado coincida con la sesión
              if (parsedUser.id === session.user.id) {
                console.log('AuthProvider: Usuario válido encontrado en localStorage, estableciendo usuario');
                setCurrentUser(parsedUser);
              } else {
                console.log('AuthProvider: Usuario en localStorage no coincide con sesión, limpiando');
                localStorage.removeItem('currentUser');
                await signOutSvc(); // Limpiar sesión inconsistente
              }
            } catch (error) {
              console.error("AuthProvider: Error al parsear usuario de localStorage:", error);
              localStorage.removeItem('currentUser');
            }
          } else {
            console.log('AuthProvider: Sesión activa pero sin perfil local, cerrando sesión');
            await signOutSvc();
          }
        } else {
          // No hay sesión activa, limpiar localStorage si existe
          const storedUser = localStorage.getItem('currentUser');
          if (storedUser) {
            console.log('AuthProvider: Limpiando usuario obsoleto de localStorage');
            localStorage.removeItem('currentUser');
          }
          console.log('AuthProvider: No hay sesión activa');
        }
      } catch (error) {
        console.error('AuthProvider: Error al verificar sesión:', error);
        // En caso de error o timeout, limpiar todo
        localStorage.removeItem('currentUser');
        setCurrentUser(null);
      } finally {
        console.log('AuthProvider: Finalizando carga de usuario');
        setIsLoadingUser(false);
        setSessionChecked(true);
        console.log('AuthProvider: Verificación de sesión completada');
      }
    };
    
    // Solo ejecutar si estamos en el cliente
    if (typeof window !== 'undefined') {
      console.log('AuthProvider: Ejecutando verificación de sesión en cliente');
      checkUserSession();
    } else {
      // En el servidor, marcar como no cargando
      console.log('AuthProvider: Ejecutando en servidor, saltando verificación');
      setIsLoadingUser(false);
      setSessionChecked(true);
    }
  }, [sessionChecked]);

  const signIn = useCallback(async (credentials: { email: string; password: string }) => {
    try {
      const authUser = await signInSvc(credentials.email, credentials.password);
      
      if (authUser) {
        // Obtener lista de usuarios para encontrar el perfil
        const users = await getUsers();
        const userProfile = users.find(u => u.id === authUser.id);
        
        if (!userProfile) {
          throw new Error("El perfil de usuario no se encontró en la base de datos pública.");
        }
        
        // Actualizar estado y localStorage
        setCurrentUser(userProfile);
        localStorage.setItem('currentUser', JSON.stringify(userProfile));
        
        return userProfile;
      } else {
        throw new Error("No se pudo obtener el usuario autenticado.");
      }
    } catch (error) {
      console.error('Error en signIn del contexto de autenticación:', error);
      throw error;
    }
  }, []);
  
  const signOut = useCallback(async () => {
    try {
      await signOutSvc();
      
      // Limpiar estado local
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      
      console.log('AuthProvider: Sesión cerrada exitosamente');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Aún así limpiar el estado local
      setCurrentUser(null);
      localStorage.removeItem('currentUser');
      throw error;
    }
  }, []);
  
  const refreshUserSession = useCallback(async () => {
    try {
      const session = await getSession();
      
      if (session?.user) {
        // Obtener datos frescos del usuario
        const users = await getUsers();
        const userProfile = users.find(u => u.id === session.user.id);
        
        if (userProfile) {
          setCurrentUser(userProfile);
          localStorage.setItem('currentUser', JSON.stringify(userProfile));
        } else {
          console.warn('Perfil de usuario no encontrado para sesión activa');
          await signOut();
        }
      } else {
        await signOut();
      }
    } catch (error) {
      console.error('Error al refrescar sesión de usuario:', error);
      await signOut();
    }
  }, [signOut]);

  const value: AuthContextType = {
    currentUser,
    isLoadingUser,
    setCurrentUser,
    signIn,
    signOut,
    refreshUserSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}