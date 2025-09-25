

'use server';

// --- ATENCIÓN: POLÍTICA DE SEGURIDAD DE SUPABASE (RLS) ---
// Por defecto, Supabase protege tus tablas y no permite leerlas.
// Para que esta función `getUsers` funcione, necesitas crear una política
// que permita la lectura pública de la tabla `users`.
//
// Ve a tu proyecto de Supabase > SQL Editor > New query
// y ejecuta el siguiente comando:
//
// CREATE POLICY "Enable read access for all users"
// ON public.users FOR SELECT
// USING (true);
//
// -------------------------------------------------------------

import type { LoanUser } from '@/domain/types';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';
import { 
  withErrorHandling, 
  handleSupabaseError, 
  handleAuthorizationError, 
  requireAdminPrivileges, 
  validateRequiredFields 
} from '@/utils/error-handler';

/**
 * Fetches users from the database with optional pagination and optimization.
 * @param limit - Maximum number of users to fetch (default: 100 for performance)
 * @param offset - Number of users to skip (default: 0)
 * @returns A promise that resolves to an array of users.
 */
export async function getUsers(limit: number = 100, offset: number = 0): Promise<LoanUser[]> {
    try {
        return await withErrorHandling(async () => {
            const { data, error } = await supabase
                .from('users')
                .select('id, name, email, role, dni, created_at')
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);
            
            if (error) {
                throw handleSupabaseError(error, 'Obtener usuarios');
            }
            return data as LoanUser[];
        }, 'Obtener usuarios');
    } catch (error) {
        // En caso de error, retornar array vacío para mantener compatibilidad
        return [];
    }
}

/**
 * Fetches all users from the database (use with caution for large datasets).
 * @returns A promise that resolves to an array of users.
 */
export async function getAllUsers(): Promise<LoanUser[]> {
    try {
        return await withErrorHandling(async () => {
            const { data, error } = await supabase.from('users').select('*');
            if (error) {
                throw handleSupabaseError(error, 'Obtener todos los usuarios');
            }
            return data as LoanUser[];
        }, 'Obtener todos los usuarios');
    } catch (error) {
        // En caso de error, retornar array vacío para mantener compatibilidad
        return [];
    }
}


/**
 * Adds a new user to the database, creating an auth entry if a password is provided.
 * @param data - The data for the new user, without an ID. Can include a password.
 * @returns The newly created user with an ID.
 */
export async function addUser(data: Omit<LoanUser, 'id'> & { password?: string }): Promise<LoanUser | null> {
  if (data.password) {
    // If a password is provided, we treat this as a full registration.
    return registerUser(data);
  }

  // Otherwise, just add to the public table (less common case).
  const { data: newUser, error } = await supabase
    .from('users')
    .insert([data])
    .select()
    .single();

  if (error) {
    // Error adding user to public table: error
    return null;
  }
  return newUser as LoanUser;
}

/**
 * Registers a new user in Supabase Auth and creates a corresponding public profile.
 * This is the primary way to create any new user that needs to log in.
 * @param data - The data for the new user, including email and password.
 * @returns The newly created public user profile.
 */
export async function registerUser(data: Omit<LoanUser, 'id'> & { password?: string }): Promise<LoanUser | null> {
    return withErrorHandling(async () => {
        validateRequiredFields(data, ['email', 'password', 'dni']);
        requireAdminPrivileges(supabaseAdmin);

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
            // Optional: Data to be stored in the user's metadata
            data: { 
                full_name: data.name,
                role: data.role,
                dni: data.dni
            }
        }
    });

        if (authError) {
            // Handle case where user might already exist in Auth but not in public table
            if (authError.message.includes('User already registered')) {
                const { data: { user } } = await supabaseAdmin.auth.admin.getUserByEmail(data.email);
                if (user) {
                     const { data: existingProfile } = await supabase.from('users').select('id').eq('id', user.id).single();
                     if (!existingProfile) {
                         // Auth user exists, but profile doesn't. Create profile.
                         return await createProfileForExistingAuthUser(user.id, data);
                     }
                }
            }
            throw handleSupabaseError(authError, 'Crear usuario de autenticación');
        }
        
        const authUser = authData.user;
        if (!authUser) {
            throw handleSupabaseError({ message: 'User was not created in Supabase Auth.' }, 'Crear usuario de autenticación');
        }
        
        // 2. Create the user profile in the public.users table
        return createProfileForExistingAuthUser(authUser.id, data);
    }, 'Registrar usuario');
}

// Helper to create a profile, used by registerUser and for handling edge cases.
async function createProfileForExistingAuthUser(userId: string, data: Omit<LoanUser, 'id'>): Promise<LoanUser> {
     const profileData: Omit<LoanUser, 'id'> = {
        name: data.name,
        email: data.email,
        role: data.role,
        dni: data.dni,
    };

    const { data: newUser, error: profileError } = await supabase
        .from('users')
        .insert([{ id: userId, ...profileData }])
        .select()
        .single();
    
    if (profileError) {
        // If profile creation fails, we should ideally delete the auth user to avoid orphans, but this can be complex.
        // For now, we'll throw the error.
        throw handleSupabaseError(profileError, 'Crear perfil de usuario');
    }
    return newUser as LoanUser;
}


/**
 * Updates an existing user in the database.
 * @param userId - The ID of the user to update.
 * @param dataToUpdate - An object with the user properties to update.
 * @returns The updated user.
 */
export async function updateUser(userId: string, dataToUpdate: Partial<Omit<LoanUser, 'id'>>): Promise<LoanUser | null> {
  try {
    return await withErrorHandling(async () => {
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(dataToUpdate)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error, 'Actualizar usuario');
      }
      return updatedUser as LoanUser;
    }, 'Actualizar usuario');
  } catch (error) {
    // En caso de error, retornar null para mantener compatibilidad
    return null;
  }
}

/**
 * Deletes a user from the database.
 * @param userId - The ID of the user to delete.
 * @returns A boolean indicating success.
 */
export async function deleteUser(userId: string): Promise<boolean> {
  try {
    return await withErrorHandling(async () => {
      requireAdminPrivileges(supabaseAdmin);
      
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        // If the error is "User not found", it's okay, maybe it was already deleted.
        if (!authError.message.includes('User not found')) {
          throw handleSupabaseError(authError, 'Eliminar usuario de autenticación');
        }
      }

      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (error) {
        throw handleSupabaseError(error, 'Eliminar perfil de usuario');
      }
      return true;
    }, 'Eliminar usuario');
  } catch (error) {
    // En caso de error, retornar false para mantener compatibilidad
    return false;
  }
}


/**
 * Adds multiple new users to the database and creates auth entries for them.
 * @param newUsersData - An array of new user data, including a password for each.
 * @returns An array of the newly created user profiles.
 */
export async function addMultipleUsers(newUsersData: (Omit<LoanUser, 'id'> & { password?: string })[]): Promise<LoanUser[] | null> {
  return withErrorHandling(async () => {
    requireAdminPrivileges(supabaseAdmin);

    const createdUsers: LoanUser[] = [];

    for (const userData of newUsersData) {
        try {
            const newUser = await registerUser(userData);
            if (newUser) {
                createdUsers.push(newUser);
            }
        } catch (error: any) {
            // Failed to import user, but continue with the rest
            // Decide if you want to stop the whole batch or continue.
            // For now, we'll just continue.
        }
    }
    
    return createdUsers;
  }, 'Agregar múltiples usuarios');
}
