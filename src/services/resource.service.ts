

'use server';

import type { Resource, Category } from '@/domain/types';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';

/**
 * Fetches all categories from the database.
 * @returns A promise that resolves to an array of categories.
 */
export async function getCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) {
        console.error('Error fetching categories:', error);
        return [];
    }
    // Map the DB result to the domain type
    return data.map(c => ({ id: c.id, name: c.name, resources: [] }));
}

/**
 * Fetches all resources from the database and maps their category.
 * @returns A promise that resolves to an array of resources.
 */
export async function getResources(): Promise<Resource[]> {
    const { data, error } = await supabase.from('resources').select(`
        *,
        categories ( name )
    `);

    if (error) {
        console.error('Error fetching resources:', error);
        return [];
    }
    
    // Transform the data to match the Resource domain type
    return data.map((r: any) => ({
        id: r.id,
        name: r.name,
        brand: r.brand,
        model: r.model,
        status: r.status,
        stock: r.stock,
        damageNotes: r.damage_notes,
        category: r.categories?.name || 'Sin categoría', // Handle null category
        attributes: r.attributes,
        notes: r.notes,
    }));
}


/**
 * Adds one or more resources to the list.
 * This is a more complex operation that requires finding the category first.
 * IMPORTANT: This operation requires admin privileges because it needs to query categories.
 * @param data - The data for the new resource(s), including quantity and category name.
 * @returns An array of new resources or null if an error occurred.
 */
export async function addResource(
  data: Omit<Resource, 'id' | 'name' | 'stock'> & { quantity: number }
): Promise<Resource[] | null> {
  // 1. Find the category ID from the category name. This requires admin client.
  if (!supabaseAdmin) {
    console.error('Supabase admin client not initialized. Cannot add resource.');
    return null;
  }
  
  const { data: categoryData, error: categoryError } = await supabaseAdmin
    .from('categories')
    .select('id')
    .eq('name', data.category)
    .single();

  if (categoryError || !categoryData) {
    console.error('Error finding category:', categoryError);
    return null;
  }

  const categoryId = categoryData.id;
  const categorySingular = data.category?.slice(0, -1) || 'Recurso';

  // 2. Find the last number for this category
  let { data: lastResource, error: rpcError } = await supabaseAdmin.rpc('get_last_resource_number_for_category', {
      p_category_name: data.category
  });

  if (rpcError) {
      console.error('Error getting last resource number:', rpcError);
      // Fallback to a less accurate method if RPC fails
      lastResource = 0;
  }
  
  let lastNumber = lastResource || 0;

  // 3. Prepare the new resources
  const newResourcesToInsert = [];
  for (let i = 0; i < data.quantity; i++) {
    const newNumber = lastNumber + i + 1;
    newResourcesToInsert.push({
      brand: data.brand,
      model: data.model,
      notes: data.notes,
      attributes: data.attributes,
      category_id: categoryId,
      name: `${categorySingular} ${newNumber}`,
      stock: 1,
      status: 'disponible',
    });
  }

  // 4. Insert new resources
  const { data: insertedResources, error: insertError } = await supabaseAdmin
    .from('resources')
    .insert(newResourcesToInsert)
    .select();
  
  if (insertError) {
    console.error('Error inserting new resources:', insertError);
    return null;
  }
  
  return insertedResources.map(r => ({ ...r, category: data.category })) as Resource[];
}

/**
 * Updates an existing resource in the list.
 * @param resourceId - The ID of the resource to update.
 * @param dataToUpdate - An object with the resource properties to update.
 * @returns The updated resource or null on error.
 */
export async function updateResource(
  resourceId: string,
  dataToUpdate: Partial<Omit<Resource, 'id' | 'category'>>
): Promise<Resource | null> {
    const dbUpdateData: any = {};
    if (dataToUpdate.brand) dbUpdateData.brand = dataToUpdate.brand;
    if (dataToUpdate.model) dbUpdateData.model = dataToUpdate.model;
    if (dataToUpdate.notes) dbUpdateData.notes = dataToUpdate.notes;
    if (dataToUpdate.attributes) dbUpdateData.attributes = dataToUpdate.attributes;

    const { data, error } = await supabase
        .from('resources')
        .update(dbUpdateData)
        .eq('id', resourceId)
        .select()
        .single();
    
    if (error) {
        console.error('Error updating resource:', error);
        return null;
    }
    return data as Resource;
}

/**
 * Deletes a resource from the list.
 * @param resourceId - The ID of the resource to delete.
 * @returns A boolean indicating success.
 */
export async function deleteResource(resourceId: string): Promise<boolean> {
  const { error } = await supabase.from('resources').delete().eq('id', resourceId);
  if (error) {
      console.error('Error deleting resource:', error);
      return false;
  }
  return true;
}

/**
 * Updates the status of a resource.
 * @param resourceId - The ID of the resource to update.
 * @param status - The new status.
 * @param notes - Optional notes, e.g., for maintenance or damage.
 * @returns The updated resource or null on error.
 */
export async function updateResourceStatus(
  resourceId: string,
  status: Resource['status'],
  notes?: string
): Promise<Resource | null> {
  const updateData: any = { status };
  if (status === 'mantenimiento' || status === 'dañado') {
    updateData.damage_notes = notes;
  }

  const { data, error } = await supabase
    .from('resources')
    .update(updateData)
    .eq('id', resourceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating resource status:', error);
    return null;
  }
  return data as Resource;
}


// --- Category Services ---

/**
 * Adds new categories to the list.
 * @param newCategoryNames - An array of names for the new categories.
 * @returns The new categories or null on error.
 */
export async function addCategories(newCategoryNames: string[]): Promise<Category[] | null> {
    if (!supabaseAdmin) {
        throw new Error("Supabase admin client not initialized. Cannot add categories.");
    }
    
    const newCategoriesToInsert = newCategoryNames.map(name => ({ 
        name: name,
    }));

    try {
        const { data, error } = await supabaseAdmin
            .from('categories')
            .insert(newCategoriesToInsert)
            .select();

        if (error) {
            console.error('Error adding categories in service:', error);
            // Throw the error so it can be caught by the calling function
            throw error;
        }

        // Map the result to the domain type, ensuring 'id' is included.
        return data.map(c => ({ id: c.id, name: c.name, resources: [] }));
    } catch(err) {
        throw err;
    }
}

/**
 * Deletes a category. Supabase handles cascading deletion of resources via foreign key constraints.
 * @param categoryName - The name of the category to delete.
 * @returns A boolean indicating success.
 */
export async function deleteCategory(
  categoryName: string
): Promise<boolean> {
    // Note: The ON DELETE SET NULL on the foreign key means resources will NOT be deleted,
    // their category_id will just be set to null. If you want to delete them,
    // the foreign key constraint in the database should be ON DELETE CASCADE.
    // For this prototype, we'll assume we need to delete resources manually if the category is deleted.
    if (!supabaseAdmin) {
        console.error("Admin client not available for deleting category resources.");
        return false;
    }

    const { data: category, error: catError } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('name', categoryName)
        .single();
    
    if (catError || !category) {
        console.error('Error finding category to delete:', catError);
        return false;
    }

    // Delete resources associated with the category
    const { error: resError } = await supabaseAdmin
        .from('resources')
        .delete()
        .eq('category_id', category.id);
    
    if (resError) {
        console.error('Error deleting resources for category:', resError);
        return false;
    }
    
    // Delete the category itself
    const { error: delError } = await supabaseAdmin
        .from('categories')
        .delete()
        .eq('id', category.id);

    if (delError) {
        console.error('Error deleting category:', delError);
        return false;
    }
    return true;
}
