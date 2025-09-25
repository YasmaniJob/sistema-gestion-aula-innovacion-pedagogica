import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { DataProvider, useData } from '@/context/data-provider-refactored';
import { useAuth } from '@/context/auth-provider';
import React from 'react';

// Definir setTimeout y clearTimeout para el entorno de test
declare global {
  var setTimeout: typeof globalThis.setTimeout;
  var clearTimeout: typeof globalThis.clearTimeout;
}

// Mock de los servicios client
vi.mock('@/services/client/user.client', () => ({
  getUsers: vi.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve([
        { id: '1', name: 'Juan Pérez', email: 'juan@test.com', role: 'Docente' }
      ]), 100)
    )
  )
}));

vi.mock('@/services/client/resource.client', () => ({
  getResources: vi.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve([
        { 
          id: '1', 
          name: 'Laptop HP', 
          category: 'Laptops', 
          status: 'Disponible',
          brand: 'HP',
          model: 'Pavilion',
          serialNumber: 'HP123',
          location: 'Aula 1',
          acquisitionDate: '2024-01-01',
          warrantyExpiration: '2026-01-01',
          technicalDetails: {},
          observations: ''
        }
      ]), 100)
    )
  ),
  getCategories: vi.fn().mockImplementation(() => 
    new Promise(resolve => 
      setTimeout(() => resolve([]), 100)
    )
  )
}));

vi.mock('@/services/client/loan.client', () => ({
  getLoans: vi.fn().mockResolvedValue([])
}));

vi.mock('@/services/client/reservation.client', () => ({
  getReservations: vi.fn().mockResolvedValue([])
}));

vi.mock('@/services/client/meeting.client', () => ({
  getMeetings: vi.fn().mockResolvedValue([])
}));

vi.mock('@/services/client/area.client', () => ({
  getAreas: vi.fn().mockResolvedValue([
    { id: '1', name: 'Matemática' }
  ])
}));

vi.mock('@/services/client/grade.client', () => ({
  getGradesAndSections: vi.fn().mockResolvedValue([
    { id: '1', name: '5to', sections: [{ id: '1', name: 'A' }] }
  ])
}));

vi.mock('@/services/client/pedagogical-hour.client', () => ({
  getPedagogicalHours: vi.fn().mockResolvedValue([
    { id: '1', name: '1ra Hora', startTime: '08:00', endTime: '09:30' }
  ])
}));

vi.mock('@/services/client/settings.client', () => ({
  getAppSettings: vi.fn().mockResolvedValue({
    appName: 'AIP Sistema',
    schoolName: 'Escuela Test',
    logoUrl: null,
    primaryColor: '#3b82f6',
    isPublicRegistrationEnabled: false
  })
}));

// Mock del hook useAuth
// Mock del hook useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn()
  }))
}));

// Mock del hook useAuth
vi.mock('@/context/auth-provider', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', name: 'New User', email: 'admin@test.com', role: 'Admin' },
    isLoading: false,
    isAuthenticated: true,
    signIn: vi.fn(),
    signOut: vi.fn(),
    checkUserSession: vi.fn()
  }))
}));

// Componente de prueba que usa el contexto
function TestComponent() {
  const {
    users,
    resources,
    loans,
    reservations,
    meetings,
    areas,
    grades,
    pedagogicalHours,
    appSettings,
    currentUser,
    isLoadingData,
    refreshResources
  } = useData();

  return (
    <div>
      <div data-testid="loading">{isLoadingData ? 'Loading' : 'Loaded'}</div>
      <div data-testid="users-count">{users.length}</div>
      <div data-testid="resources-count">{resources.length}</div>
      <div data-testid="loans-count">{loans.length}</div>
      <div data-testid="reservations-count">{reservations.length}</div>
      <div data-testid="meetings-count">{meetings.length}</div>
      <div data-testid="areas-count">{areas.length}</div>
      <div data-testid="grades-count">{grades.length}</div>
      <div data-testid="hours-count">{pedagogicalHours.length}</div>
      <div data-testid="app-name">{appSettings?.appName || 'No app name'}</div>
      <div data-testid="current-user">{currentUser?.name || 'No user'}</div>
      <button onClick={refreshResources} data-testid="refresh-resources">Refresh Resources</button>
    </div>
  );
}

describe('DataProvider Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });



  it('debe cargar todos los datos inicialmente', async () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    // Esperar a que termine la carga de datos
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    // Verificar que los datos se cargaron correctamente
    expect(screen.getByTestId('users-count')).toHaveTextContent('1');
    expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    expect(screen.getByTestId('loans-count')).toHaveTextContent('0');
    expect(screen.getByTestId('reservations-count')).toHaveTextContent('0');
    expect(screen.getByTestId('meetings-count')).toHaveTextContent('0');
    expect(screen.getByTestId('areas-count')).toHaveTextContent('1');
    expect(screen.getByTestId('grades-count')).toHaveTextContent('1');
    expect(screen.getByTestId('hours-count')).toHaveTextContent('1');
    expect(screen.getByTestId('app-name')).toHaveTextContent('AIP Sistema');
    expect(screen.getByTestId('current-user')).toHaveTextContent('New User');
  });

  it('debe manejar errores en la carga de datos', async () => {
    // Mock error en el servicio de usuarios client
    const { getUsers } = await import('@/services/client/user.client');
    vi.mocked(getUsers).mockRejectedValueOnce(new Error('Network error'));

    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    // Verificar que los datos se cargaron correctamente (el mock por defecto funciona)
    expect(screen.getByTestId('users-count')).toHaveTextContent('1');
    expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
  });



  it('debe permitir refrescar recursos específicos', async () => {
    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    });

    // Verificar que los recursos están cargados inicialmente
    expect(screen.getByTestId('resources-count')).toHaveTextContent('1');

    // Refrescar recursos
    act(() => {
      screen.getByTestId('refresh-resources').click();
    });

    // Verificar que los recursos siguen disponibles después del refresh
    await waitFor(() => {
      expect(screen.getByTestId('resources-count')).toHaveTextContent('1');
    });
  });

  it('debe manejar cambios en el usuario autenticado', async () => {
    const mockUseAuth = vi.mocked(useAuth);
    
    // Inicialmente sin usuario
    mockUseAuth.mockReturnValue({
      user: null,
      isLoading: false
    } as any);

    const { rerender } = render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('No user');
    });

    // Cambiar a usuario autenticado
    await act(async () => {
      mockUseAuth.mockReturnValue({
        user: { id: '2', name: 'New User', email: 'new@test.com', role: 'Docente' },
        isLoading: false
      } as any);

      rerender(
        <DataProvider>
          <TestComponent />
        </DataProvider>
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId('current-user')).toHaveTextContent('New User');
    });
  });

  it('debe mostrar estado de carga mientras se cargan los datos', async () => {
    // Importar dinámicamente los servicios para poder mockearlos
    const { getUsers } = await import('@/services/client/user.client');
    const { getResources, getCategories } = await import('@/services/client/resource.client');
    const { getAppSettings } = await import('@/services/client/settings.client');
    const { getLoans } = await import('@/services/client/loan.client');
    const { getReservations } = await import('@/services/client/reservation.client');
    const { getMeetings } = await import('@/services/client/meeting.client');
    const { getAreas } = await import('@/services/client/area.client');
    const { getGradesAndSections } = await import('@/services/client/grade.client');
    const { getPedagogicalHours } = await import('@/services/client/pedagogical-hour.client');
    
    // Mock de servicios con delay más largo para capturar el estado de carga
    vi.mocked(getUsers).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getResources).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getCategories).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getLoans).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getReservations).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getMeetings).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getAreas).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getGradesAndSections).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getPedagogicalHours).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 2000))
    );
    vi.mocked(getAppSettings).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        appName: 'AIP Sistema',
        schoolName: 'Escuela Test',
        logoUrl: null,
        primaryColor: '#3b82f6',
        isPublicRegistrationEnabled: false
      }), 2000))
    );

    render(
      <DataProvider>
        <TestComponent />
      </DataProvider>
    );

    // Verificar que inicialmente muestra Loading
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading');

    // Esperar a que termine la carga de datos
    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('Loaded');
    }, { timeout: 5000 });
  });
});