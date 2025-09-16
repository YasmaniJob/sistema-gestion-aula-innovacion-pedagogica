import type { Reservation } from '@/domain/types';

const API_BASE = '/api/reservations';

export async function getReservations(): Promise<any[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch reservations');
  }
  return response.json();
}

export async function addReservation(reservationData: any): Promise<any> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'add', ...reservationData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add reservation');
  }
  return response.json();
}

export async function updateReservationStatus(reservationId: string, status: string): Promise<any> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'updateStatus', reservationId, status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update reservation status');
  }
  return response.json();
}

export async function deleteReservation(reservationId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?reservationId=${reservationId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete reservation');
  }
  
  const result = await response.json();
  return result.success;
}