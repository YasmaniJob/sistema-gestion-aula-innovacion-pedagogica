
'use server';

import type { Grade, Section } from '@/domain/types';
import { supabaseAdmin } from '@/infrastructure/supabase/client';

if (!supabaseAdmin) {
    console.warn("Supabase admin client is not initialized. Grade services will not be available in client components.");
}

/**
 * Fetches all grades and their associated sections.
 */
export async function getGradesAndSections(): Promise<Grade[]> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { data: gradesData, error: gradesError } = await supabaseAdmin
        .from('grades')
        .select('id, name');
        
    if (gradesError) throw gradesError;

    const { data: sectionsData, error: sectionsError } = await supabaseAdmin
        .from('sections')
        .select('id, name, grade_id');

    if (sectionsError) throw sectionsError;

    return gradesData.map(grade => ({
        ...grade,
        sections: sectionsData.filter(section => section.grade_id === grade.id),
    }));
}

/**
 * Adds a new grade.
 */
export async function addGrade(name: string): Promise<Grade | null> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { data, error } = await supabaseAdmin
        .from('grades')
        .insert({ name })
        .select()
        .single();
    
    if (error) throw error;
    return { ...data, sections: [] };
}

/**
 * Updates a grade.
 */
export async function updateGrade(gradeId: string, name: string): Promise<Grade | null> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { data, error } = await supabaseAdmin
        .from('grades')
        .update({ name })
        .eq('id', gradeId)
        .select()
        .single();
    
    if (error) throw error;
    
    // Get sections for this grade
    const { data: sectionsData } = await supabaseAdmin
        .from('sections')
        .select('id, name, grade_id')
        .eq('grade_id', gradeId);
    
    return { ...data, sections: sectionsData || [] };
}

/**
 * Deletes a grade and its sections (due to CASCADE).
 */
export async function deleteGrade(gradeId: string): Promise<void> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { error } = await supabaseAdmin
        .from('grades')
        .delete()
        .eq('id', gradeId);

    if (error) throw error;
}

/**
 * Adds a new section to a grade.
 */
export async function addSection(gradeId: string, name: string): Promise<Section | null> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { data, error } = await supabaseAdmin
        .from('sections')
        .insert({ grade_id: gradeId, name })
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Updates a section (e.g., its alias).
 */
export async function updateSection(sectionId: string, updateData: Partial<Omit<Section, 'id' | 'grade_id'>>): Promise<Section | null> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { data, error } = await supabaseAdmin
        .from('sections')
        .update(updateData)
        .eq('id', sectionId)
        .select()
        .single();
    
    if (error) throw error;
    return data;
}

/**
 * Deletes a section.
 */
export async function deleteSection(sectionId: string): Promise<void> {
    if (!supabaseAdmin) throw new Error('Admin privileges required.');

    const { error } = await supabaseAdmin
        .from('sections')
        .delete()
        .eq('id', sectionId);

    if (error) throw error;
}
