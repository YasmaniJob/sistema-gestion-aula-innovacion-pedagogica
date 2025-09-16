

'use server';

import type { PedagogicalHour } from '@/domain/types';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';

if (!supabaseAdmin) {
    console.warn("Supabase admin client is not initialized. Write/delete services for pedagogical hours will fail.");
}

/**
 * Fetches all pedagogical hours from the database.
 * @returns A promise that resolves to an array of pedagogical hours.
 */
export async function getPedagogicalHours(): Promise<PedagogicalHour[]> {
    const { data, error } = await supabase
        .from('pedagogical_hours')
        .select('*');
        // Simple numbered hours don't need complex sorting, default order is fine.
    
    if (error) {
        console.error('Error fetching pedagogical hours:', error);
        return [];
    }

    return data as PedagogicalHour[];
}


/**
 * Adds a new pedagogical hour to the database.
 * @param name - The name of the hour to add (e.g., "1ra Hora").
 * @returns The newly created pedagogical hour or null on error.
 */
export async function addPedagogicalHour(name: string): Promise<PedagogicalHour | null> {
    if (!supabaseAdmin) {
        throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
    }

    const { data, error } = await supabaseAdmin
        .from('pedagogical_hours')
        .insert({ name })
        .select()
        .single();

    if (error) {
        console.error("Error adding pedagogical hour:", error);
        throw error;
    }
    return data as PedagogicalHour;
}

/**
 * Updates a pedagogical hour in the database.
 * @param hourId - The ID of the hour to update.
 * @param name - The new name for the hour.
 * @returns The updated pedagogical hour or null on error.
 */
export async function updatePedagogicalHour(hourId: string, name: string): Promise<PedagogicalHour | null> {
    if (!supabaseAdmin) {
        throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
    }

    const { data, error } = await supabaseAdmin
        .from('pedagogical_hours')
        .update({ name })
        .eq('id', hourId)
        .select()
        .single();

    if (error) {
        console.error("Error updating pedagogical hour:", error);
        throw error;
    }

    return data as PedagogicalHour;
}

/**
 * Deletes a pedagogical hour from the database.
 * @param hourId - The ID of the hour to delete.
 * @returns A boolean indicating success.
 */
export async function deletePedagogicalHour(hourId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
  }
  const { error } = await supabaseAdmin.from('pedagogical_hours').delete().eq('id', hourId);
  if (error) {
    console.error('Error deleting pedagogical hour:', error);
    throw error;
  }
  return true;
}
