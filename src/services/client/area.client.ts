import type { Area } from '@/domain/types';

const API_BASE = '/api/areas';

export async function getAreas(): Promise<Area[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch areas');
  }
  return response.json();
}

export async function addAreas(names: string[]): Promise<Area[]> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'addMultiple', names }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add areas');
  }
  return response.json();
}

export async function updateArea(areaId: string, name: string): Promise<Area> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ areaId, name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update area');
  }
  return response.json();
}

export async function deleteArea(areaId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?areaId=${areaId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete area');
  }
  
  const result = await response.json();
  return result.success;
}