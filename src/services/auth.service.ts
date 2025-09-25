
'use server';

import { supabase } from '@/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';
import { TIMEOUTS, withTimeout } from '@/config/timeouts';
import { 
  withErrorHandling, 
  handleAuthError, 
  validateRequiredFields, 
  validateEmail, 
  validatePassword 
} from '@/utils/error-handler';

// Tipos para mejor tipado
interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User | null;
  session: any;
}

// Las validaciones ahora están centralizadas en @/utils/error-handler

// Las funciones de timeout ahora están centralizadas en @/config/timeouts

/**
 * Inicia sesión con email y contraseña
 * @param credentials - Credenciales de usuario
 * @returns Usuario autenticado
 */
export async function signIn({ email, password }: SignInCredentials): Promise<User> {
    return withErrorHandling(async () => {
        // Validaciones centralizadas
        validateRequiredFields({ email, password }, ['email', 'password']);
        validateEmail(email.trim());
        validatePassword(password);

        // Usar timeout centralizado para inicio de sesión
        const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            }),
            TIMEOUTS.AUTH.SIGN_IN,
            'inicio de sesión'
        );

        if (error) {
            throw handleAuthError(error, 'Inicio de sesión');
        }
        
        if (!data.user) {
            throw handleAuthError({ message: 'No se pudo obtener la información del usuario' }, 'Inicio de sesión');
        }
        
        return data.user;
    }, 'Inicio de sesión');
}

/**
 * Cierra la sesión del usuario actual
 */
export async function signOut(): Promise<{ success: boolean }> {
    return withErrorHandling(async () => {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            throw handleAuthError(error, 'Cierre de sesión');
        }
        
        return { success: true };
    }, 'Cierre de sesión');
}

/**
 * Obtiene el usuario actual de la sesión
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        return await withErrorHandling(async () => {
            const { data: { user }, error } = await supabase.auth.getUser();
            
            if (error) {
                throw handleAuthError(error, 'Obtener usuario actual');
            }
            
            return user;
        }, 'Obtener usuario actual');
    } catch (error) {
        // En caso de error, retornar null para mantener compatibilidad
        return null;
    }
}

/**
 * Verifica si hay una sesión activa
 */
export async function getSession(): Promise<any> {
    try {
        return await withErrorHandling(async () => {
            // Usar timeout centralizado para obtener sesión
            const { data: { session }, error } = await withTimeout(
                supabase.auth.getSession(),
                TIMEOUTS.AUTH.GET_SESSION,
                'obtener sesión'
            );
            
            if (error) {
                throw handleAuthError(error, 'Obtener sesión');
            }
            
            return session;
        }, 'Obtener sesión');
    } catch (error) {
        // En caso de error, retornar null para mantener compatibilidad
        return null;
    }
}

/**
 * Refresca el token de acceso
 */
export async function refreshSession(): Promise<AuthResponse | null> {
    try {
        return await withErrorHandling(async () => {
            const { data, error } = await supabase.auth.refreshSession();
            
            if (error) {
                throw handleAuthError(error, 'Refrescar sesión');
            }
            
            return data;
        }, 'Refrescar sesión');
    } catch (error) {
        // En caso de error, retornar null para mantener compatibilidad
        return null;
    }
}
