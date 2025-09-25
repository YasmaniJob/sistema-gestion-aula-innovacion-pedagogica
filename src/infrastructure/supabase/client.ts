import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/domain/types';

// Lee las variables de entorno públicas (para el cliente)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Valida que las variables de entorno públicas estén presentes
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and anonymous key are required in your .env.local file.');
}

// Crea y exporta el cliente PÚBLICO de Supabase.
// Este será el cliente que usaremos en toda la aplicación del lado del cliente.
// Utiliza la 'anon key' que es segura para usar en el navegador.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});


// --- Cliente de Administrador (para uso exclusivo en el servidor) ---

// Lee la variable de entorno secreta (solo para el servidor)
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Crea y exporta un cliente de Supabase con permisos de administrador.
// **ADVERTENCIA:** Este cliente NUNCA debe ser usado o expuesto en el lado del cliente (navegador).
// Solo debe usarse en rutas de API del lado del servidor o funciones server-side.
// Ignora todas las políticas de Row-Level Security.
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;
