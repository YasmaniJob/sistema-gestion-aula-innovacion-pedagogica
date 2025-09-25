
'use client';

import { useData } from '@/context/data-provider-refactored';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef } from 'react';
import { LoanUser } from '@/domain/types';

interface UseAuthorizationProps {
  requiredRole?: LoanUser['role'];
  redirectTo?: string;
  autoRedirect?: boolean; // Nueva opción para controlar redirección automática
}

export function useAuthorization({ 
  requiredRole, 
  redirectTo = '/login',
  autoRedirect = true 
}: UseAuthorizationProps = {}) {
  const { currentUser, isLoadingUser } = useData();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);
  const previousUserRef = useRef(currentUser);

  // Memoizar el estado de autorización para evitar re-renders innecesarios
  const authorizationState = useMemo(() => {
    const isAuthenticated = !!currentUser;
    const hasRequiredRole = !requiredRole || (currentUser?.role === requiredRole);
    const isAuthorized = isAuthenticated && hasRequiredRole;
    
    return {
      isAuthenticated,
      hasRequiredRole,
      isAuthorized,
      isLoading: isLoadingUser
    };
  }, [currentUser, requiredRole, isLoadingUser]);

  // Optimizar la lógica de redirección
  useEffect(() => {
    // Solo ejecutar si no estamos cargando y la redirección automática está habilitada
    if (isLoadingUser || !autoRedirect) {
      return;
    }

    // Resetear flag de redirección si el usuario cambió
    if (previousUserRef.current !== currentUser) {
      hasRedirectedRef.current = false;
      previousUserRef.current = currentUser;
    }

    // Evitar redirecciones múltiples
    if (hasRedirectedRef.current) {
      return;
    }

    // Caso 1: Usuario no autenticado
    if (!currentUser) {
      // useAuthorization: Usuario no autenticado, redirigiendo a: redirectTo
      hasRedirectedRef.current = true;
      // Usar window.location para evitar problemas con Next.js router
      window.location.href = redirectTo;
      return;
    }

    // Caso 2: Usuario autenticado pero sin el rol requerido
    if (requiredRole && currentUser.role !== requiredRole) {
      // useAuthorization: Rol de usuario '${currentUser.role}' no coincide con rol requerido '${requiredRole}'
      hasRedirectedRef.current = true;
      // Usar window.location para evitar problemas con Next.js router
      window.location.href = '/unauthorized';
      return;
    }

    // Usuario autorizado
    // useAuthorization: Usuario autorizado: { email: currentUser.email, role: currentUser.role, requiredRole: requiredRole || 'ninguno' }
  }, [currentUser, isLoadingUser, requiredRole, redirectTo, router, autoRedirect]);

  // Función para verificar permisos específicos
  const hasPermission = useMemo(() => {
    return (permission: string) => {
      if (!currentUser) return false;
      
      // Lógica de permisos basada en roles
      switch (currentUser.role) {
        case 'Admin':
          return true; // Admin tiene todos los permisos
        case 'Docente':
          return ['view_resources', 'create_loan', 'view_loans', 'create_reservation'].includes(permission);
        case 'Estudiante':
          return ['view_resources', 'create_reservation'].includes(permission);
        default:
          return false;
      }
    };
  }, [currentUser]);

  return {
    user: currentUser,
    isLoading: isLoadingUser,
    isAuthenticated: authorizationState.isAuthenticated,
    hasRequiredRole: authorizationState.hasRequiredRole,
    isAuthorized: authorizationState.isAuthorized,
    hasPermission,
    // Función para forzar una nueva verificación
    recheck: () => {
      hasRedirectedRef.current = false;
    }
  };
}
