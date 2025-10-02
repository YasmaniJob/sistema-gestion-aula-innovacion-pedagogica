

'use server';

import type { Loan, Resource, DamageReport, SuggestionReport, MissingResourceReport, LoanUser } from '@/domain/types';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';

const isValidDate = (d: any): d is Date => d instanceof Date && !isNaN(d.getTime());

// Helper function to get current date with system year (2025)
const getCurrentDate = (): Date => {
    return new Date();
};

/**
 * Fetches all loans from the database with complete user information.
 * @returns A promise that resolves to an array of loans with full user objects.
 */
export async function getLoans(): Promise<any[]> {
    const { data: loanData, error: loanError } = await supabase
        .from('loans')
        .select('*, user:users!loans_user_id_fkey(*)')
        .order('return_date', { ascending: false, nullsFirst: false })
        .order('loan_date', { ascending: false });

    if (loanError) {
        // Error fetching loans: loanError
        return [];
    }
    
    const processedLoans = loanData.map(loan => {
        const loanDate = new Date(loan.loan_date);
        const returnDate = loan.return_date ? new Date(loan.return_date) : undefined;
        return {
            ...loan,
            loanDate: isValidDate(loanDate) ? loanDate : new Date(),
            returnDate: returnDate && isValidDate(returnDate) ? returnDate : undefined,
            purposeDetails: loan.purpose_details || {},
            damageReports: loan.damage_reports || {},
            suggestionReports: loan.suggestion_reports || {},
            missingResources: loan.missing_resources || [],
        }
    });
    
    return processedLoans;
}


/**
 * Creates a new loan and adds it to the database.
 * If created by an Admin, the loan is automatically approved.
 * If created by a Docente, it's set to 'pendiente'.
 * @param data - The data for the new loan, without ID, date, or status.
 * @param creatorRole - The role of the user creating the loan.
 * @returns The newly created loan.
 */
export async function addLoan(
  data: Omit<Loan, 'id' | 'loanDate' | 'status'>,
  creatorRole: LoanUser['role']
): Promise<Loan | null> {
    if (!supabaseAdmin) {
        // Admin client not available. Cannot create loan.
        throw new Error('No se puede crear el préstamo. La configuración del servidor es incorrecta.');
    }

    const isDirectApproval = creatorRole === 'Admin';
    const initialStatus = isDirectApproval ? 'active' : 'pending';

    const { data: newLoanData, error } = await supabaseAdmin
        .from('loans')
        .insert([{
            user_id: data.user.id,
            purpose: data.purpose,
            purpose_details: data.purposeDetails,
            resources: data.resources,
            status: initialStatus,
            loan_date: getCurrentDate().toISOString(), // Set loan date on creation
            return_date: getCurrentDate().toISOString(), // Set return date as today for direct loans
        }])
        .select(`
            *,
            user:users!loans_user_id_fkey(*)
        `)
        .single();
    
    if (error) {
        // Error adding loan: error
        throw error;
    }
    
    // If it was a direct approval, update the resources' status to 'prestado'
    if (isDirectApproval) {
        const resourceIds = data.resources.map(r => r.id);
        const { error: resourceError } = await supabaseAdmin
            .from('resources')
            .update({ status: 'prestado' })
            .in('id', resourceIds);
        
        if (resourceError) {
            // Error updating resources for direct loan approval: resourceError
            // Non-fatal error, we can continue. The loan is created.
        }
    }

    return {
        ...newLoanData,
        user: data.user, // Use the user object passed in, as the insert doesn't return it.
        loanDate: new Date(newLoanData.loan_date),
        returnDate: newLoanData.return_date ? new Date(newLoanData.return_date) : undefined,
        // Asegurar que purposeDetails esté correctamente estructurado
        purposeDetails: newLoanData.purpose_details || data.purposeDetails,
    } as Loan;
}

/**
 * Updates the status of a specific loan.
 * @param loanId - The ID of the loan to update.
 * @param status - The new status for the loan.
 * @returns The updated loan and any affected resources.
 */
export async function updateLoanStatus(
  loanId: string,
  status: 'active' | 'rejected' | 'returned'
): Promise<{ updatedLoan: Loan, updatedResources?: Resource[] } | null> {
    
    if (!supabaseAdmin) {
        throw new Error("Operación no permitida. Se requieren privilegios de administrador.");
    }

    const { data: loan, error: loanError } = await supabaseAdmin.from('loans').select('*, user:users!loans_user_id_fkey(*)').eq('id', loanId).single();
    if (loanError || !loan) {
        // Error fetching loan to update status: loanError?.message
        throw new Error(`No se pudo encontrar el préstamo a actualizar: ${loanError?.message}`);
    }

    const { data: updatedLoanData, error } = await supabaseAdmin
        .from('loans')
        .update({
            status: status,
            ...(status === 'rejected' || status === 'returned' ? { return_date: new Date().toISOString() } : {}),
            ...(status === 'active' ? { loan_date: new Date().toISOString() } : {}),
        })
        .eq('id', loanId)
        .select()
        .single();
    
    if (error) {
        // Error updating loan status: error.message
        throw new Error(`Error al actualizar el estado del préstamo: ${error.message}`);
    }

    const fullUpdatedLoan: Loan = {
        ...updatedLoanData,
        user: loan.user as LoanUser,
        loanDate: new Date(updatedLoanData.loan_date)
    } as Loan;

    if (status === 'active') {
        const resourceIds = (loan.resources as Pick<Resource, 'id'>[]).map(r => r.id);
        
        const { data: currentResources, error: checkError } = await supabaseAdmin
            .from('resources')
            .select('id, status, name')
            .in('id', resourceIds);

        if (checkError) {
            // Error checking resource availability: checkError
            throw new Error('No se pudo verificar la disponibilidad de los recursos.');
        }

        const unavailableResource = currentResources.find(r => r.status !== 'disponible');
        if (unavailableResource) {
            await supabaseAdmin.from('loans').update({ status: 'pending' }).eq('id', loanId);
            throw new Error(`El recurso "${unavailableResource.name}" no está disponible y no puede ser prestado.`);
        }
        
        const { data: updatedResources, error: resourceError } = await supabaseAdmin
            .from('resources')
            .update({ status: 'prestado' })
            .in('id', resourceIds)
            .select(`*, categories ( name )`);

        if (resourceError) {
            // Error updating resources to "prestado": resourceError
            return { updatedLoan: fullUpdatedLoan };
        }
        
        const transformedResources = updatedResources.map((r: any) => ({
            id: r.id,
            name: r.name,
            brand: r.brand,
            model: r.model,
            status: r.status,
            stock: r.stock,
            damageNotes: r.damage_notes,
            category: r.categories?.name || 'Sin categoría',
            attributes: r.attributes,
            notes: r.notes,
        }));
        
        return { updatedLoan: fullUpdatedLoan, updatedResources: transformedResources as Resource[] };
    }

    if (status === 'rejected') {
        // When rejecting a loan, we don't need to update resources since they were never marked as 'prestado'
        // Only loans with status 'pending' can be rejected, so resources should still be 'disponible'
        return { updatedLoan: fullUpdatedLoan };
    }

    return { updatedLoan: fullUpdatedLoan };
}

/**
 * Processes the return of a loan, updating the loan and resource statuses.
 * This requires admin privileges to update resources.
 * @param loanId - The ID of the loan being returned.
 * @param damageReports - A record of damage reports for the resources in the loan.
 * @param suggestionReports - A record of suggestion reports for the resources.
 * @returns An object containing the updated loan and resources.
 */
export async function processReturn(
  loanId: string,
  damageReports: Record<string, DamageReport>,
  suggestionReports: Record<string, SuggestionReport>,
  missingResources?: MissingResourceReport[]
): Promise<{ updatedLoan: Loan, updatedResources: Resource[] } | null> {
    
    if (!supabaseAdmin) {
        // Admin client not initialized. Cannot process return.
        return null;
    }

    const { data: loan, error: loanError } = await supabase
        .from('loans')
        .select('*, user:users!loans_user_id_fkey(*)')
        .eq('id', loanId)
        .single();

    if (loanError || !loan) {
        // Error fetching loan for return: loanError
        return null;
    }
    
    const { data: updatedLoanData, error: updateLoanError } = await supabaseAdmin
        .from('loans')
        .update({
            status: 'returned',
            return_date: getCurrentDate().toISOString(),
            damage_reports: damageReports,
            suggestion_reports: suggestionReports,
            missing_resources: missingResources || []
        })
        .eq('id', loanId)
        .select()
        .single();
    
    if (updateLoanError) {
        // Error updating loan on return: updateLoanError
        return null;
    }

    const loanResources = loan.resources as Pick<Resource, 'id' | 'name' | 'brand'>[];
    const updatedResources: Resource[] = [];

    for (const resource of loanResources) {
        const hasDamage = damageReports[resource.id] && (damageReports[resource.id].commonProblems.length > 0 || damageReports[resource.id].otherNotes.trim() !== '');
        const newStatus = hasDamage ? 'dañado' : 'disponible';
        
        const { data: updatedResource, error: updateResourceError } = await supabaseAdmin
            .from('resources')
            .update({
                status: newStatus,
                damage_notes: hasDamage ? damageReports[resource.id].otherNotes : null
            })
            .eq('id', resource.id)
            .select('*, categories ( name )')
            .single();

        if (updateResourceError) {
            // Error updating resource ${resource.id} status: updateResourceError
        } else if (updatedResource) {
             const transformedResource = {
                id: updatedResource.id,
                name: updatedResource.name,
                brand: updatedResource.brand,
                model: updatedResource.model,
                status: updatedResource.status,
                stock: updatedResource.stock,
                damageNotes: updatedResource.damage_notes,
                category: (updatedResource as any).categories?.name || 'Sin categoría',
                attributes: updatedResource.attributes,
                notes: updatedResource.notes,
            };
            updatedResources.push(transformedResource as Resource);
        }
    }

    const fullUpdatedLoan: Loan = {
        ...updatedLoanData,
        user: loan.user as LoanUser,
        loanDate: new Date(updatedLoanData.loan_date),
        returnDate: updatedLoanData.return_date ? new Date(updatedLoanData.return_date) : undefined
    } as Loan;


    return { updatedLoan: fullUpdatedLoan, updatedResources };
}
