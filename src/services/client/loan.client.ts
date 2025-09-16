import type { Loan, LoanUser, DamageReport, SuggestionReport } from '@/domain/types';

const API_BASE = '/api/loans';

export async function getLoans(): Promise<Loan[]> {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error('Failed to fetch loans');
  }
  return response.json();
}

export async function addLoan(loanData: Omit<Loan, 'id'|'loanDate'|'status'>, creatorRole: LoanUser['role']): Promise<Loan> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'add', creatorRole, ...loanData }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add loan');
  }
  return response.json();
}

export async function updateLoanStatus(loanId: string, status: Loan['status']): Promise<any> {
  const response = await fetch(API_BASE, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ loanId, status }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update loan status');
  }
  return response.json();
}

export async function approveLoan(loanId: string): Promise<any> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'approve', loanId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to approve loan');
  }
  return response.json();
}

export async function rejectLoan(loanId: string): Promise<any> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'reject', loanId }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to reject loan');
  }
  return response.json();
}

export async function processReturn(
  loanId: string, 
  damageReports: Record<string, DamageReport>, 
  suggestionReports: Record<string, SuggestionReport>
): Promise<any> {
  const response = await fetch(API_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      action: 'processReturn', 
      loanId, 
      damageReports, 
      suggestionReports 
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to process return');
  }
  return response.json();
}