
'use server';

import { supabase } from '@/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';
import { TIMEOUTS, withTimeout } from '@/config/timeouts';

// Tipos para mejor tipado
interface SignInCredentials {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User | null;
  session: any;
}

// Validación de email mejorada
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validación de contraseña mejorada
function isValidPassword(password: string): boolean {
  return password.length >= 6; // Mínimo 6 caracteres
}

// Las funciones de timeout ahora están centralizadas en @/config/timeouts

/**
 * Inicia sesión con email y contraseña
 * @param credentials - Credenciales de usuario
 * @returns Usuario autenticado
 */
export async function signIn({ email, password }: SignInCredentials): Promise<User> {
    // Validaciones mejoradas
    if (!email?.trim()) {
        throw new Error("El email es obligatorio");
    }
    
    if (!password?.trim()) {
        throw new Error("La contraseña es obligatoria");
    }
    
    if (!isValidEmail(email.trim())) {
        throw new Error("El formato del email no es válido");
    }
    
    if (!isValidPassword(password)) {
        throw new Error("La contraseña debe tener al menos 6 caracteres");
    }

    try {
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
            console.error('Error al iniciar sesión:', error.message);
            
            // Manejo específico de errores comunes
            if (error.message.includes('Invalid login credentials')) {
                throw new Error("Email o contraseña incorrectos");
            } else if (error.message.includes('Email not confirmed')) {
                throw new Error("Debes confirmar tu email antes de iniciar sesión.");
            } else if (error.message.includes('Too many requests')) {
                throw new Error("Demasiados intentos. Intenta nuevamente en unos minutos.");
            } else {
                throw new Error(`Failed to sign in: ${error.message}`);
            }
        }
        
        if (!data.user) {
            throw new Error("No se pudo obtener la información del usuario");
        }
        
        return data.user;
    } catch (error: any) {
        console.error('Error en signIn:', error);
        throw error;
    }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function signOut(): Promise<{ success: boolean }> {
    try {
        const { error } = await supabase.auth.signOut();
        
        if (error) {
            console.error('Error al cerrar sesión:', error.message);
            throw new Error(`Error al cerrar sesión: ${error.message}`);
        }
        
        return { success: true };
    } catch (error: any) {
        console.error('Error en signOut:', error);
        throw error;
    }
}

/**
 * Obtiene el usuario actual de la sesión
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Error al obtener usuario actual:', error.message);
            return null;
        }
        
        return user;
    } catch (error: any) {
        console.error('Error en getCurrentUser:', error);
        return null;
    }
}

/**
 * Verifica si hay una sesión activa
 */
export async function getSession(): Promise<any> {
    try {
        // Usar timeout centralizado para obtener sesión
        const { data: { session }, error } = await withTimeout(
            supabase.auth.getSession(),
            TIMEOUTS.AUTH.GET_SESSION,
            'obtener sesión'
        );
        
        if (error) {
            console.error('Error al obtener sesión:', error.message);
            return null;
        }
        
        return session;
    } catch (error: any) {
        console.error('Error en getSession:', error);
        return null;
    }
}

/**
 * Refresca el token de acceso
 */
export async function refreshSession(): Promise<AuthResponse | null> {
    try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
            console.error('Error al refrescar sesión:', error.message);
            return null;
        }
        
        return data;
    } catch (error: any) {
        console.error('Error en refreshSession:', error);
        return null;
    }
}
