'use client';

import React from 'react';
import { useSession } from '@/hooks/use-session';

// El nuevo hook useAuth es ahora un simple intermediario hacia useSession.
// Esto evita tener que refactorizar todos los componentes que usan useAuth de inmediato.
export function useAuth() {
  return useSession();
}

// El AuthProvider ahora es un componente simple que asegura que el hook useSession se inicialice.
// Ya no necesita proveer un contexto.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Al llamar a useSession aquí, nos aseguramos de que la verificación de sesión se inicie
  // para todos los componentes hijos.
  useSession();

  return <>{children}</>;
}
