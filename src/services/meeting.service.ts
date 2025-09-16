

'use server';

import type { Meeting, AgreementTask } from '@/domain/types';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';
import { parseISO } from 'date-fns';

/**
 * Fetches all meetings from the database.
 * @returns A promise that resolves to an array of meetings.
 */
export async function getMeetings(): Promise<Meeting[]> {
    const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .order('start_time', { ascending: false });
    
    if (error) {
        console.error("Error fetching meetings:", error);
        return [];
    }

    // Map database rows to domain types
    return data.map(m => {
        let meetingInfo = {
            genericParticipants: [],
            colegiadoAreas: [],
            otherParticipants: '',
            tasks: []
        };
        
        // Try to parse JSON from description field
        try {
            if (m.description && m.description.startsWith('{')) {
                const parsed = JSON.parse(m.description);
                meetingInfo = {
                    genericParticipants: parsed.genericParticipants || [],
                    colegiadoAreas: parsed.colegiadoAreas || [],
                    otherParticipants: parsed.otherParticipants || '',
                    tasks: parsed.tasks || []
                };
            }
        } catch (e) {
            console.warn('Could not parse meeting description as JSON:', e);
        }
        
        return {
            id: m.id,
            title: m.title,
            date: m.start_time ? parseISO(m.start_time) : new Date(),
            participants: [],
            genericParticipants: meetingInfo.genericParticipants,
            colegiadoAreas: meetingInfo.colegiadoAreas,
            otherParticipants: meetingInfo.otherParticipants,
            tasks: meetingInfo.tasks
        };
    }) as Meeting[];
}


/**
 * Creates a new meeting and adds it to the database.
 * @param meetingData - The data for the new meeting.
 * @returns The newly created meeting or null on error.
 */
export async function addMeeting(
  meetingData: Omit<Meeting, 'id' | 'date'>,
  organizerId: string
): Promise<Meeting | null> {
    console.log('addMeeting called with:');
    console.log('meetingData:', meetingData);
    console.log('organizerId:', organizerId);
    console.log('organizerId type:', typeof organizerId);
    
    if (!supabaseAdmin) {
        throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
    }

    // Use the provided organizer ID
    if (!organizerId) {
        throw new Error('Se requiere un organizador válido para crear la reunión.');
    }

    // Create start and end times (default to 1 hour meeting starting now)
    const now = new Date();
    const startTime = now.toISOString();
    const endTime = new Date(now.getTime() + 60 * 60 * 1000).toISOString(); // 1 hour later

    // Preparar los datos para insertar

    const { data, error } = await supabaseAdmin
        .from('meetings')
        .insert([{
            title: meetingData.title,
            description: JSON.stringify({
                genericParticipants: meetingData.genericParticipants || [],
                colegiadoAreas: meetingData.colegiadoAreas || [],
                otherParticipants: meetingData.otherParticipants || '',
                tasks: meetingData.tasks || []
            }),
            organizer_id: organizerId,
            start_time: startTime,
            end_time: endTime,
            attendees: [], // Para participantes específicos (UUIDs)
            status: 'scheduled',
            meeting_type: 'general'
        }])
        .select()
        .single();
    
    if (error) {
        console.error("Error adding meeting:", error);
        throw new Error(`Error al crear la reunión: ${error.message}`);
    }

    // Parse the description field to get the meeting info
    let meetingInfo = {
        genericParticipants: [],
        colegiadoAreas: [],
        otherParticipants: '',
        tasks: []
    };
    
    try {
        if (data.description) {
            const parsed = JSON.parse(data.description);
            meetingInfo = {
                genericParticipants: parsed.genericParticipants || [],
                colegiadoAreas: parsed.colegiadoAreas || [],
                otherParticipants: parsed.otherParticipants || '',
                tasks: parsed.tasks || []
            };
        }
    } catch (e) {
        console.warn('Could not parse meeting description:', e);
    }

    return {
        id: data.id,
        title: data.title,
        date: parseISO(data.start_time),
        participants: [],
        genericParticipants: meetingInfo.genericParticipants || [],
        colegiadoAreas: meetingInfo.colegiadoAreas || [],
        otherParticipants: meetingInfo.otherParticipants || '',
        tasks: meetingInfo.tasks || []
    } as Meeting;
}

/**
 * Toggles the status of a task within a meeting in the database.
 * @param meetingId - The ID of the meeting containing the task.
 * @param taskId - The ID of the task to toggle.
 * @returns The updated meeting or null on error.
 */
export async function toggleTaskStatus(
  meetingId: string,
  taskId: string
): Promise<Meeting | null> {
    if (!supabaseAdmin) {
        throw new Error('Operación no permitida. Se requieren privilegios de administrador.');
    }

    try {
        // First, get the current meeting
        const { data: meeting, error: fetchError } = await supabaseAdmin
            .from('meetings')
            .select('*')
            .eq('id', meetingId)
            .single();
        
        if (fetchError || !meeting) {
            console.error('Error fetching meeting:', fetchError);
            return null;
        }
        
        // Parse the current meeting info from description
        let meetingInfo = {
            title: meeting.title,
            genericParticipants: [],
            colegiadoAreas: [],
            otherParticipants: '',
            tasks: []
        };
        
        try {
            if (meeting.description && meeting.description.startsWith('{')) {
                const parsed = JSON.parse(meeting.description);
                meetingInfo = {
                    title: parsed.title || meeting.title,
                    genericParticipants: parsed.genericParticipants || [],
                    colegiadoAreas: parsed.colegiadoAreas || [],
                    otherParticipants: parsed.otherParticipants || '',
                    tasks: parsed.tasks || []
                };
            }
        } catch (e) {
            console.warn('Could not parse meeting description as JSON:', e);
        }
        
        // Find and toggle the task status
        const updatedTasks = meetingInfo.tasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    status: task.status === 'completed' ? 'pending' : 'completed'
                };
            }
            return task;
        });
        
        meetingInfo.tasks = updatedTasks;
        
        // Update the meeting with the new task status
        const { data: updatedMeeting, error: updateError } = await supabaseAdmin
            .from('meetings')
            .update({
                description: JSON.stringify(meetingInfo)
            })
            .eq('id', meetingId)
            .select()
            .single();
        
        if (updateError) {
            console.error('Error updating meeting:', updateError);
            return null;
        }
        
        // Return the updated meeting in the expected format
        return {
            id: updatedMeeting.id,
            title: updatedMeeting.title,
            date: parseISO(updatedMeeting.start_time),
            participants: [],
            genericParticipants: meetingInfo.genericParticipants,
            colegiadoAreas: meetingInfo.colegiadoAreas,
            otherParticipants: meetingInfo.otherParticipants,
            tasks: meetingInfo.tasks
        } as Meeting;
        
    } catch (error) {
        console.error('Error in toggleTaskStatus:', error);
        return null;
    }
}
