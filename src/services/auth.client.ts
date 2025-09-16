'use client';

import { supabase } from '@/infrastructure/supabase/client';
import type { User } from '@supabase/supabase-js';

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

/**
 * Inicia sesión con email y contraseña (versión cliente)
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
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim().toLowerCase(),
            password: password
        });

        if (error) {
            console.error('Error de autenticación:', error);
            
            // Mensajes de error más específicos
            if (error.message.includes('Invalid login credentials')) {
                throw new Error('Email o contraseña incorrectos');
            }
            if (error.message.includes('Email not confirmed')) {
                throw new Error('Por favor confirma tu email antes de iniciar sesión');
            }
            if (error.message.includes('Too many requests')) {
                throw new Error('Demasiados intentos. Intenta de nuevo más tarde');
            }
            
            throw new Error(error.message || 'Error al iniciar sesión');
        }

        if (!data.user) {
            throw new Error('No se pudo autenticar el usuario');
        }

        return data.user;
    } catch (error: any) {
        console.error('Error en signIn:', error);
        throw error;
    }
}

/**
 * Cierra la sesión del usuario actual (versión cliente)
 */
export async function signOut(): Promise<{ success: boolean }> {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error al cerrar sesión:', error);
            throw new Error('Error al cerrar sesión');
        }
        return { success: true };
    } catch (error: any) {
        console.error('Error en signOut:', error);
        throw error;
    }
}

/**
 * Obtiene el usuario actual (versión cliente)
 * @returns Usuario actual o null si no está autenticado
 */
export async function getCurrentUser(): Promise<User | null> {
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Error al obtener usuario:', error);
            return null;
        }
        
        return user;
    } catch (error) {
        console.error('Error en getCurrentUser:', error);
        return null;
    }
}

/**
 * Obtiene la sesión actual (versión cliente)
 * @returns Sesión actual o null
 */
export async function getSession(): Promise<any> {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Error al obtener sesión:', error);
            return null;
        }
        
        return session;
    } catch (error) {
        console.error('Error en getSession:', error);
        return null;
    }
}

/**
 * Refresca la sesión actual (versión cliente)
 * @returns Nueva sesión o null
 */
export async function refreshSession(): Promise<AuthResponse | null> {
    try {
        const { data, error } = await supabase.auth.refreshSession();
        
        if (error) {
            console.error('Error al refrescar sesión:', error);
            return null;
        }
        
        return {
            user: data.user,
            session: data.session
        };
    } catch (error) {
        console.error('Error en refreshSession:', error);
        return null;
    }
}