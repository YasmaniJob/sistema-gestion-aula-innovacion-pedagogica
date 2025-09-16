import type { PedagogicalHour } from '@/domain/types';

const API_BASE = '/api/pedagogical-hours';

export async function getPedagogicalHours(): Promise<PedagogicalHour[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch pedagogical hours');
  }
  return response.json();
}

export async function addPedagogicalHour(pedagogicalHourData: Omit<PedagogicalHour, 'id'>): Promise<PedagogicalHour> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'add', ...pedagogicalHourData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add pedagogical hour');
  }
  return response.json();
}

export async function updatePedagogicalHour(pedagogicalHourId: string, updateData: Partial<Omit<PedagogicalHour, 'id'>>): Promise<PedagogicalHour> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pedagogicalHourId, ...updateData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update pedagogical hour');
  }
  return response.json();
}

export async function deletePedagogicalHour(pedagogicalHourId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?pedagogicalHourId=${pedagogicalHourId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete pedagogical hour');
  }
  
  const result = await response.json();
  return result.success;
}