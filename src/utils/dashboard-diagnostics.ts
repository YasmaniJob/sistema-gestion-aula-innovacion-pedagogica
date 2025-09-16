'use client';

import { LoanUser, Resource, Loan, Reservation, Meeting } from '@/domain/types';

interface DiagnosticResult {
  component: string;
  issue: string;
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export function diagnoseDashboardData(data: {
  users: LoanUser[];
  resources: Resource[];
  loans: Loan[];
  reservations: Reservation[];
  meetings: Meeting[];
  isLoadingData: boolean;
}): DiagnosticResult[] {
  const results: DiagnosticResult[] = [];

  // Verificar si los datos están cargando
  if (data.isLoadingData) {
    results.push({
      component: 'DataProvider',
      issue: 'Los datos aún se están cargando',
      severity: 'medium',
      suggestion: 'Esperar a que termine la carga inicial'
    });
  }

  // Verificar datos vacíos
  if (!data.users || data.users.length === 0) {
    results.push({
      component: 'Users',
      issue: 'No hay usuarios cargados',
      severity: 'high',
      suggestion: 'Verificar la API de usuarios y la conexión a la base de datos'
    });
  }

  if (!data.resources || data.resources.length === 0) {
    results.push({
      component: 'Resources',
      issue: 'No hay recursos cargados',
      severity: 'high',
      suggestion: 'Verificar la API de recursos y agregar recursos al sistema'
    });
  }

  if (!data.loans || data.loans.length === 0) {
    results.push({
      component: 'Loans',
      issue: 'No hay préstamos cargados',
      severity: 'medium',
      suggestion: 'Verificar la API de préstamos o crear préstamos de prueba'
    });
  }

  if (!data.reservations || data.reservations.length === 0) {
    results.push({
      component: 'Reservations',
      issue: 'No hay reservas cargadas',
      severity: 'medium',
      suggestion: 'Verificar la API de reservas o crear reservas de prueba'
    });
  }

  if (!data.meetings || data.meetings.length === 0) {
    results.push({
      component: 'Meetings',
      issue: 'No hay reuniones cargadas',
      severity: 'medium',
      suggestion: 'Verificar la API de reuniones o crear reuniones de prueba'
    });
  }

  // Verificar integridad de datos
  if (data.loans && data.loans.length > 0) {
    const loansWithoutUsers = data.loans.filter(loan => 
      !loan.user || !loan.user.id || loan.user.name === 'Usuario Desconocido'
    );
    
    if (loansWithoutUsers.length > 0) {
      results.push({
        component: 'Loans',
        issue: `${loansWithoutUsers.length} préstamos tienen usuarios inválidos o desconocidos`,
        severity: 'high',
        suggestion: 'Verificar la relación entre préstamos y usuarios en la base de datos'
      });
    }
  }

  if (data.reservations && data.reservations.length > 0) {
    const reservationsWithoutUsers = data.reservations.filter(reservation => 
      !reservation.user || !reservation.user.id || reservation.user.name === 'Usuario Desconocido'
    );
    
    if (reservationsWithoutUsers.length > 0) {
      results.push({
        component: 'Reservations',
        issue: `${reservationsWithoutUsers.length} reservas tienen usuarios inválidos o desconocidos`,
        severity: 'high',
        suggestion: 'Verificar la relación entre reservas y usuarios en la base de datos'
      });
    }
  }

  // Verificar fechas inválidas
  if (data.loans && data.loans.length > 0) {
    const loansWithInvalidDates = data.loans.filter(loan => 
      !loan.loanDate || isNaN(new Date(loan.loanDate).getTime())
    );
    
    if (loansWithInvalidDates.length > 0) {
      results.push({
        component: 'Loans',
        issue: `${loansWithInvalidDates.length} préstamos tienen fechas inválidas`,
        severity: 'medium',
        suggestion: 'Verificar el formato de fechas en la base de datos'
      });
    }
  }

  if (data.reservations && data.reservations.length > 0) {
    const reservationsWithInvalidDates = data.reservations.filter(reservation => 
      !reservation.startTime || isNaN(new Date(reservation.startTime).getTime())
    );
    
    if (reservationsWithInvalidDates.length > 0) {
      results.push({
        component: 'Reservations',
        issue: `${reservationsWithInvalidDates.length} reservas tienen fechas inválidas`,
        severity: 'medium',
        suggestion: 'Verificar el formato de fechas en la base de datos'
      });
    }
  }

  return results;
}

export function logDashboardDiagnostics(data: {
  users: LoanUser[];
  resources: Resource[];
  loans: Loan[];
  reservations: Reservation[];
  meetings: Meeting[];
  isLoadingData: boolean;
}) {
  const diagnostics = diagnoseDashboardData(data);
  
  console.group('🔍 Dashboard Data Diagnostics');
  console.log('📊 Data Summary:', {
    users: data.users?.length || 0,
    resources: data.resources?.length || 0,
    loans: data.loans?.length || 0,
    reservations: data.reservations?.length || 0,
    meetings: data.meetings?.length || 0,
    isLoading: data.isLoadingData
  });
  
  if (diagnostics.length === 0) {
    console.log('✅ No se encontraron problemas de sincronización');
  } else {
    console.log(`⚠️ Se encontraron ${diagnostics.length} problemas:`);
    diagnostics.forEach((diagnostic, index) => {
      const icon = diagnostic.severity === 'high' ? '🔴' : diagnostic.severity === 'medium' ? '🟡' : '🟢';
      console.log(`${icon} ${index + 1}. [${diagnostic.component}] ${diagnostic.issue}`);
      console.log(`   💡 Sugerencia: ${diagnostic.suggestion}`);
    });
  }
  
  console.groupEnd();
  
  return diagnostics;
}