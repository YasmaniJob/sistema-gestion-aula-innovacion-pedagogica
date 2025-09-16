import type { AppSettings } from '@/domain/types';

const API_BASE = '/api/settings';

export async function getAppSettings(): Promise<AppSettings> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch app settings');
  }
  return response.json();
}

export async function updateAppSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update app settings');
  }
  return response.json();
}