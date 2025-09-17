

'use server';

import type { Reservation, LoanUser } from '@/domain/types';
import { supabase } from '@/infrastructure/supabase/client';
import { getUsers } from './user.service';

/**
 * Fetches all reservations and maps user data.
 * @returns A promise that resolves to an array of reservations.
 */
export async function getReservations(): Promise<any[]> {
    try {
        // Optimizar consulta con límite y rango de fechas
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const { data, error } = await supabase
            .from('reservations')
            .select(`
                *,
                users!reservations_user_id_fkey(*)
            `)
            .gte('start_time', thirtyDaysAgo.toISOString())
            .order('start_time', { ascending: false })
            .limit(500); // Limitar resultados para evitar sobrecarga

        if (error) {
            console.error('Error fetching reservations:', error);
            return [];
        }

        if (!data) {
            return [];
        }

        return data.map(r => {
            // Asegurar que siempre haya un objeto user válido
            const user = r.users || { 
                id: r.user_id || 'unknown', 
                name: 'Usuario Desconocido', 
                role: 'Docente' as const 
            };
            
            return {
                id: r.id,
                user_id: r.user_id,
                user: user,
                purpose: r.purpose,
                purposeDetails: r.purpose_details || {},
                startTime: new Date(r.start_time),
                endTime: new Date(r.end_time),
                status: r.status,
            }
        });
    } catch (error) {
        console.error('Unexpected error in getReservations:', error);
        return [];
    }
}


/**
 * Creates a new reservation in the database.
 * @param newReservationData - The data for the new reservation, without an ID.
 * @returns The newly created reservation or null on error.
 */
export async function addReservation(
    newReservationData: Omit<Reservation, 'id'>
): Promise<Reservation | null> {
    // Preparar datos para inserción
    // Asegurar que las fechas sean objetos Date válidos
    const startTime = newReservationData.startTime instanceof Date ? newReservationData.startTime : new Date(newReservationData.startTime);
    const endTime = newReservationData.endTime instanceof Date ? newReservationData.endTime : new Date(newReservationData.endTime);
    
    const insertData: any = {
        user_id: newReservationData.user?.id || newReservationData.user_id,
        purpose: newReservationData.purpose,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        status: newReservationData.status,
    };
    
    // Validar que tenemos un user_id válido
    if (!insertData.user_id) {
        console.error('Error: No user ID provided for reservation');
        return null;
    }
    
    // Validar que las fechas sean válidas
    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        console.error('Error: Invalid date provided for reservation');
        return null;
    }
    
    // Agregar purpose_details solo si existe y no está vacío
    if (newReservationData.purposeDetails && Object.keys(newReservationData.purposeDetails).length > 0) {
        insertData.purpose_details = newReservationData.purposeDetails;
    }
    
    const { data, error } = await supabase
        .from('reservations')
        .insert([insertData])
        .select()
        .single();
    
    if (error) {
        console.error('Error adding reservation:', error);
        return null;
    }
    
    return {
        ...newReservationData,
        id: data.id,
    };
}


/**
 * Updates the status of a reservation.
 * @param reservationId - The ID of the reservation to update.
 * @param status - The new status for the reservation.
 * @returns The updated reservation or null on error.
 */
export async function updateReservationStatus(
  reservationId: string,
  status: Reservation['status']
): Promise<Reservation | null> {
    const { data: reservation, error: fetchError } = await supabase
        .from('reservations')
        .select('*, user:users!reservations_user_id_fkey(*)')
        .eq('id', reservationId)
        .single();
    
    if(fetchError || !reservation) {
        console.error('Error fetching reservation to update:', fetchError);
        return null;
    }

    const { data, error } = await supabase
        .from('reservations')
        .update({ status })
        .eq('id', reservationId)
        .select()
        .single();

    if (error) {
        console.error('Error updating reservation status:', error);
        return null;
    }

    // Asegurar que siempre haya un objeto user válido
    const user = reservation.users || { 
        id: reservation.user_id || 'unknown', 
        name: 'Usuario Desconocido', 
        role: 'Docente' as const 
    };

    return {
        ...data,
        user: user,
        startTime: new Date(data.start_time),
        endTime: new Date(data.end_time),
    } as Reservation;
}

/**
 * Deletes a reservation from the database.
 * @param reservationId - The ID of the reservation to delete.
 * @returns A boolean indicating success or failure.
 */
export async function deleteReservation(reservationId: string): Promise<boolean> {
    const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', reservationId);

    if (error) {
        console.error('Error deleting reservation:', error);
        return false;
    }

    return true;
}
