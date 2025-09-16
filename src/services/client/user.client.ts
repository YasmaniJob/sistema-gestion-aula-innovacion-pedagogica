import type { LoanUser } from '@/domain/types';

const API_BASE = '/api/users';

export async function getUsers(): Promise<LoanUser[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

export async function addUser(userData: Omit<LoanUser, 'id'> & { password?: string }): Promise<LoanUser> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'add', ...userData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add user');
  }
  return response.json();
}

export async function addMultipleUsers(usersData: (Omit<LoanUser, 'id'> & { password?: string })[]): Promise<LoanUser[]> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'addMultiple', users: usersData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add multiple users');
  }
  return response.json();
}

export async function registerUser(userData: Omit<LoanUser, 'id'> & { password: string }): Promise<LoanUser> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'register', ...userData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to register user');
  }
  return response.json();
}

export async function updateUser(userId: string, userData: Partial<Omit<LoanUser, 'id'>>): Promise<LoanUser> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ userId, ...userData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update user');
  }
  return response.json();
}

export async function deleteUser(userId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?userId=${userId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete user');
  }
  
  const result = await response.json();
  return result.success;
}