import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReservationCalendar } from '@/components/reservation-calendar';
import { useData } from '@/context/data-provider-refactored';
import type { Reservation, User } from '@/domain/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { vi } from 'vitest';

// Mock del contexto de datos
vi.mock('@/context/data-provider-refactored');
const mockUseData = useData as ReturnType<typeof vi.fn>;

// Mock de date-fns
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    format: vi.fn(),
  };
});

// Mock de useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUser: User = {
  id: '1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  role: 'Docente',
};

const mockReservation: Reservation = {
  id: '1',
  user: mockUser,
  purpose: 'aprendizaje',
  purposeDetails: {
    activityName: 'Matemáticas',
    timeSlot: '08:00 - 09:30',
    area: 'Matemática',
    grade: '5to',
    section: 'A',
  },
  startTime: new Date('2024-01-15T08:00:00'),
  endTime: new Date('2024-01-15T09:30:00'),
  status: 'Confirmada',
};

const mockPedagogicalHours = [
  {
    id: '1',
    name: '1ra Hora',
    startTime: '08:00',
    endTime: '09:30',
  },
  {
    id: '2',
    name: '2da Hora',
    startTime: '09:30',
    endTime: '11:00',
  },
];

describe('ReservationCalendar', () => {
  beforeEach(() => {
    mockUseData.mockReturnValue({
      pedagogicalHours: mockPedagogicalHours,
      currentUser: mockUser,
      reservations: [mockReservation],
      users: [mockUser],
      updateReservationStatus: vi.fn(),
      addReservation: vi.fn(),
      deleteReservation: vi.fn(),
      addUser: vi.fn(),
      updateUser: vi.fn(),
      deleteUser: vi.fn(),
      refreshReservations: vi.fn(),
      refreshUsers: vi.fn(),
      isLoading: false,
    });

    (format as ReturnType<typeof vi.fn>).mockImplementation((date, formatStr, options) => {
      if (formatStr === 'eeee') return 'lunes';
      if (formatStr === "d 'de' MMMM") return '15 de enero';
      return 'mocked date';
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el calendario correctamente', () => {
    render(
      <ReservationCalendar
        mode="view"
        reservations={[mockReservation]}
      />
    );

    // Verificar que se muestra el calendario
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('muestra las reservas en el calendario', () => {
    render(
      <ReservationCalendar
        mode="view"
        reservations={[mockReservation]}
      />
    );

    // Verificar que se muestra el nombre del usuario
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    
    // Verificar que se muestra el estado de la reserva
    expect(screen.getByText('Confirmada')).toBeInTheDocument();
  });

  it('permite seleccionar slots en modo nuevo', () => {
    const mockOnSlotToggle = vi.fn();
    
    render(
      <ReservationCalendar
        mode="new"
        reservations={[]}
        selectedSlots={[]}
        onSlotToggle={mockOnSlotToggle}
      />
    );

    // Buscar un slot disponible y hacer clic
    const availableSlots = screen.getAllByText('Disponible');
    if (availableSlots.length > 0) {
      fireEvent.click(availableSlots[0]);
      expect(mockOnSlotToggle).toHaveBeenCalled();
    }
  });

  it('abre el diálogo de detalles al hacer clic en una reserva', async () => {
    const mockOnUpdateStatus = vi.fn();
    
    render(
      <ReservationCalendar
        mode="view"
        reservations={[mockReservation]}
        onUpdateReservationStatus={mockOnUpdateStatus}
        currentUserId="1"
      />
    );

    // Hacer clic en la reserva
    const reservationElement = screen.getByText('Juan Pérez');
    fireEvent.click(reservationElement);

    // Verificar que se abre el diálogo
    await waitFor(() => {
      expect(screen.getByText('Gestionar Reserva')).toBeInTheDocument();
    });
  });

  it('permite actualizar el estado de una reserva', async () => {
    const mockOnUpdateStatus = vi.fn().mockResolvedValue(undefined);
    
    render(
      <ReservationCalendar
        mode="view"
        reservations={[mockReservation]}
        onUpdateReservationStatus={mockOnUpdateStatus}
        currentUserId="1"
      />
    );

    // Abrir el diálogo
    const reservationElement = screen.getByText('Juan Pérez');
    fireEvent.click(reservationElement);

    // Esperar a que aparezca el diálogo
    await waitFor(() => {
      expect(screen.getByText('Gestionar Reserva')).toBeInTheDocument();
    });

    // Buscar y hacer clic en el botón de "Realizada"
    const realizadaButton = screen.getByRole('button', { name: /realizada/i });
    fireEvent.click(realizadaButton);

    // Verificar que se llamó la función de actualización
    await waitFor(() => {
      expect(mockOnUpdateStatus).toHaveBeenCalledWith('1', 'Realizada');
    });
  });

  it('navega entre semanas correctamente', () => {
    const mockOnDateChange = vi.fn();
    
    render(
      <ReservationCalendar
        mode="view"
        reservations={[mockReservation]}
        currentDate={new Date('2024-01-15')}
        onDateChange={mockOnDateChange}
      />
    );

    // Buscar botones de navegación
    const nextButton = screen.getByRole('button', { name: /siguiente/i });
    const prevButton = screen.getByRole('button', { name: /anterior/i });

    // Hacer clic en siguiente semana
    fireEvent.click(nextButton);
    expect(mockOnDateChange).toHaveBeenCalled();

    // Hacer clic en semana anterior
    fireEvent.click(prevButton);
    expect(mockOnDateChange).toHaveBeenCalled();
  });
});