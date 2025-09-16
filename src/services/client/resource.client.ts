import type { Resource } from '@/domain/types';

const API_BASE = '/api/resources';

export async function getResources(): Promise<Resource[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch resources');
  }
  return response.json();
}

export async function getCategories(): Promise<any[]> {
  const response = await fetch(`${API_BASE}?action=getCategories`);
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
}

export async function addResource(data: Omit<Resource, 'id' | 'name' | 'stock'> & { quantity: number }): Promise<Resource[]> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'add', ...data }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add resource');
  }
  return response.json();
}

export async function updateResource(resourceId: string, data: Partial<Omit<Resource, 'id'>>): Promise<Resource> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ resourceId, ...data }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update resource');
  }
  return response.json();
}

export async function updateResourceStatus(resourceId: string, status: Resource['status'], notes?: string): Promise<Resource> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'updateStatus', resourceId, status, notes }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update resource status');
  }
  return response.json();
}

export async function deleteResource(resourceId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?resourceId=${resourceId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete resource');
  }
  
  const result = await response.json();
  return result.success;
}

export async function addCategories(categoryNames: string[]): Promise<any[] | null> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'addCategories', categoryNames }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add categories');
  }
  return response.json();
}

export async function deleteCategory(categoryName: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?action=deleteCategory&categoryName=${encodeURIComponent(categoryName)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete category');
  }
  
  const result = await response.json();
  return result.success;
}