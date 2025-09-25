import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePageTitle } from '@/hooks/use-page-title';
import React from 'react';

import { useSidebar } from '@/components/layout/sidebar-provider';

// Mock del useSidebar hook
vi.mock('@/components/layout/sidebar-provider', () => ({
  useSidebar: vi.fn()
}));

// Mock del document.title
Object.defineProperty(document, 'title', {
  writable: true,
  value: ''
});

describe('usePageTitle', () => {
  let mockSetPageTitle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetPageTitle = vi.fn();
    vi.mocked(useSidebar).mockReturnValue({
      isSidebarCollapsed: false,
      toggleSidebarCollapse: vi.fn(),
      isMobile: false,
      pageTitle: '',
      setPageTitle: mockSetPageTitle,
      headerActions: null,
      setHeaderActions: vi.fn()
    });
  });

  it('debe establecer el título de la página', () => {
    renderHook(() => usePageTitle('Dashboard'));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith('Dashboard');
  });

  it('debe actualizar el título cuando cambia', () => {
    const { rerender } = renderHook(
      ({ title }) => usePageTitle(title),
      { initialProps: { title: 'Inventario' } }
    );
    
    expect(mockSetPageTitle).toHaveBeenCalledWith('Inventario');
    
    rerender({ title: 'Préstamos' });
    expect(mockSetPageTitle).toHaveBeenCalledWith('Préstamos');
  });

  it('debe manejar títulos vacíos', () => {
    renderHook(() => usePageTitle(''));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith('');
  });

  it('debe manejar títulos con caracteres especiales', () => {
    renderHook(() => usePageTitle('Configuración & Ajustes'));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith('Configuración & Ajustes');
  });

  it('debe manejar títulos largos', () => {
    const longTitle = 'Este es un título muy largo que podría causar problemas';
    renderHook(() => usePageTitle(longTitle));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith(longTitle);
  });

  it('debe limpiar el título al desmontar el componente', () => {
    const { unmount } = renderHook(() => usePageTitle('Test Title'));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith('Test Title');
    
    unmount();
    // El hook debería limpiar el título al desmontar
    expect(mockSetPageTitle).toHaveBeenCalledWith('');
    expect(mockSetPageTitle).toHaveBeenCalledTimes(2);
  });

  it('debe manejar múltiples instancias del hook', () => {
    const { unmount: unmount1 } = renderHook(() => usePageTitle('Título 1'));
    expect(mockSetPageTitle).toHaveBeenCalledWith('Título 1');
    
    const { unmount: unmount2 } = renderHook(() => usePageTitle('Título 2'));
    expect(mockSetPageTitle).toHaveBeenCalledWith('Título 2');
    
    unmount1();
    // Después de desmontar la primera instancia, se llama con string vacío
    expect(mockSetPageTitle).toHaveBeenCalledWith('');
    expect(mockSetPageTitle).toHaveBeenCalledTimes(3);
    
    unmount2();
    // Después de desmontar la segunda instancia, se llama nuevamente con string vacío
    expect(mockSetPageTitle).toHaveBeenCalledTimes(4);
  });

  it('debe manejar valores undefined', () => {
    renderHook(() => usePageTitle(undefined as any));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith(undefined);
  });

  it('debe manejar valores null', () => {
    renderHook(() => usePageTitle(null as any));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith(null);
  });

  it('debe manejar números como título', () => {
    renderHook(() => usePageTitle(123 as any));
    
    expect(mockSetPageTitle).toHaveBeenCalledWith(123);
  });
});