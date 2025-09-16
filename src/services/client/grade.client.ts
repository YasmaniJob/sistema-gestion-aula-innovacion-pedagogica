import type { Grade, Section } from '@/domain/types';

const API_BASE = '/api/grades';

export async function getGradesAndSections(): Promise<Grade[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch grades and sections');
  }
  return response.json();
}

export async function addGrade(name: string): Promise<Grade> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'addGrade', name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add grade');
  }
  return response.json();
}

export async function addSection(gradeId: string, name: string): Promise<Section> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'addSection', gradeId, name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add section');
  }
  return response.json();
}

export async function updateGrade(gradeId: string, name: string): Promise<Grade> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'grade', id: gradeId, name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update grade');
  }
  return response.json();
}

export async function updateSection(sectionId: string, name: string): Promise<Section> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'section', id: sectionId, name }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update section');
  }
  return response.json();
}

export async function deleteGrade(gradeId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?type=grade&id=${gradeId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete grade');
  }
  
  const result = await response.json();
  return result.success;
}

export async function deleteSection(sectionId: string): Promise<boolean> {
  const response = await fetch(`${API_BASE}?type=section&id=${sectionId}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete section');
  }
  
  const result = await response.json();
  return result.success;
}