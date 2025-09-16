import type { Meeting } from '@/domain/types';

const API_BASE = '/api/meetings';

export async function getMeetings(): Promise<Meeting[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch meetings');
  }
  return response.json();
}

export async function addMeeting(meetingData: Omit<Meeting, 'id' | 'date'>, organizerId: string): Promise<Meeting> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'add', organizerId, ...meetingData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add meeting');
  }
  return response.json();
}

export async function toggleTaskStatus(meetingId: string, taskId: string): Promise<Meeting> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'toggleTaskStatus', meetingId, taskId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle task status');
  }
  return response.json();
}