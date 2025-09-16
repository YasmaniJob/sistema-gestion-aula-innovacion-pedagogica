

'use server';

import type { Area } from '@/domain/types';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';

/**
 * Fetches all areas from the database.
 * @returns A promise that resolves to an array of areas.
 */
export async function getAreas(): Promise<Area[]> {
    const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('name', { ascending: true });
    
    if (error) {
        console.error('Error fetching areas:', error);
        return [];
    }

    return data as Area[];
}


/**
 * Adds new areas to the database.
 * @param names - An array of area names to add.
 * @returns The newly created areas or null on error.
 */
export async function addAreas(names: string[]): Promise<Area[] | null> {
    if (!supabaseAdmin) {
        throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
    }

    const newAreasToInsert = names.map(name => ({ name }));

    const { data, error } = await supabaseAdmin
        .from('areas')
        .insert(newAreasToInsert)
        .select();

    if (error) {
        console.error("Error adding areas:", error);
        throw error;
    }
    return data as Area[];
}


/**
 * Updates an existing area in the database.
 * @param areaId - The ID of the area to update.
 * @param newName - The new name for the area.
 * @returns The updated area or null on error.
 */
export async function updateArea(areaId: string, newName: string): Promise<Area | null> {
     if (!supabaseAdmin) {
        throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
    }
    const { data, error } = await supabaseAdmin
        .from('areas')
        .update({ name: newName })
        .eq('id', areaId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating area:", error);
        throw error;
    }
    return data as Area;
}


/**
 * Deletes an area from the database.
 * @param areaId - The ID of the area to delete.
 * @returns A boolean indicating success.
 */
export async function deleteArea(areaId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
  }
  const { error } = await supabaseAdmin.from('areas').delete().eq('id', areaId);
  if (error) {
    console.error('Error deleting area:', error);
    throw error;
  }
  return true;
}
