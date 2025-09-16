

'use server';

import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';

// Define the shape of the settings object
interface AppSettings {
  appName: string;
  schoolName: string;
  logoUrl: string;
  primaryColor: string;
  isPublicRegistrationEnabled: boolean;
  backgroundImageUrl: string;
}

/**
 * Fetches the application settings from the database.
 * There should only ever be one row in the app_settings table.
 * @returns A promise that resolves to the app settings object or null.
 */
export async function getAppSettings(): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching app settings:', error);
    return null;
  }
  
  if (!data) return null;

  return {
    appName: data.app_name,
    schoolName: data.school_name,
    logoUrl: data.logo_url || '',
    primaryColor: data.primary_color,
    isPublicRegistrationEnabled: data.is_public_registration_enabled,
    backgroundImageUrl: data.background_image_url || '',
  };
}

/**
 * Updates the application settings in the database.
 * This function requires admin privileges.
 * @param newSettings - An object containing the settings to update.
 * @returns The updated settings object or throws an error.
 */
export async function updateAppSettings(newSettings: Partial<AppSettings>): Promise<AppSettings | null> {
    if (!supabaseAdmin) {
        throw new Error("Operación no permitida. Se requieren privilegios de administrador.");
    }
    
    const dbUpdateData: any = {};
    if (newSettings.appName !== undefined) dbUpdateData.app_name = newSettings.appName;
    if (newSettings.schoolName !== undefined) dbUpdateData.school_name = newSettings.schoolName;
    if (newSettings.logoUrl !== undefined) dbUpdateData.logo_url = newSettings.logoUrl;
    if (newSettings.primaryColor !== undefined) dbUpdateData.primary_color = newSettings.primaryColor;
    if (newSettings.isPublicRegistrationEnabled !== undefined) dbUpdateData.is_public_registration_enabled = newSettings.isPublicRegistrationEnabled;
    if (newSettings.backgroundImageUrl !== undefined) dbUpdateData.background_image_url = newSettings.backgroundImageUrl;
    
    if (Object.keys(dbUpdateData).length === 0) {
        return await getAppSettings();
    }

    // Since we know there's only one row, we can update it using a filter.
    // We'll use the `id` of 1, as it's the only one we inserted.
    const { data, error } = await supabaseAdmin
        .from('app_settings')
        .update(dbUpdateData)
        .eq('id', 1) 
        .select()
        .single();
    
    if (error) {
        console.error('Error updating app settings:', error);
        throw new Error('No se pudieron guardar los ajustes.');
    }
    
     if (!data) return null;

    return {
        appName: data.app_name,
        schoolName: data.school_name,
        logoUrl: data.logo_url || '',
        primaryColor: data.primary_color,
        isPublicRegistrationEnabled: data.is_public_registration_enabled,
        backgroundImageUrl: data.background_image_url || '',
    };
}
