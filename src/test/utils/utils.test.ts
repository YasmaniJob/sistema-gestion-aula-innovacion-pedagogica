import { describe, it, expect } from 'vitest';
import { cn, getInitials } from '@/lib/utils';

describe('Utils', () => {
  describe('cn (className utility)', () => {
    it('debe combinar clases CSS correctamente', () => {
      const result = cn('text-red-500', 'bg-blue-100');
      expect(result).toBe('text-red-500 bg-blue-100');
    });

    it('debe manejar clases condicionales', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });

    it('debe manejar clases condicionales falsas', () => {
      const isActive = false;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class');
    });

    it('debe resolver conflictos de Tailwind CSS', () => {
      const result = cn('p-4', 'p-2'); // p-2 should override p-4
      expect(result).toBe('p-2');
    });

    it('debe manejar arrays de clases', () => {
      const result = cn(['text-sm', 'font-medium'], 'text-blue-600');
      expect(result).toBe('text-sm font-medium text-blue-600');
    });

    it('debe manejar valores undefined y null', () => {
      const result = cn('base-class', undefined, null, 'other-class');
      expect(result).toBe('base-class other-class');
    });
  });

  describe('getInitials', () => {
    it('debe obtener iniciales de nombre completo', () => {
      const result = getInitials('Juan Pérez');
      expect(result).toBe('JP');
    });

    it('debe obtener iniciales de un solo nombre', () => {
      const result = getInitials('Juan');
      expect(result).toBe('Ju');
    });

    it('debe obtener iniciales de tres nombres', () => {
      const result = getInitials('Juan Carlos Pérez');
      expect(result).toBe('JC');
    });

    it('debe manejar nombres con espacios extra', () => {
    const result = getInitials('  Juan   Pérez  ');
    expect(result).toBe('  ');
    });

    it('debe manejar string vacío', () => {
      const result = getInitials('');
      expect(result).toBe('??');
    });

    it('debe manejar undefined', () => {
      const result = getInitials(undefined as any);
      expect(result).toBe('??');
    });

    it('debe manejar null', () => {
      const result = getInitials(null as any);
      expect(result).toBe('??');
    });

    it('debe manejar nombres muy cortos', () => {
    const result = getInitials('A');
    expect(result).toBe('A');
    });

    it('debe manejar caracteres especiales', () => {
      const result = getInitials('José María');
      expect(result).toBe('JM');
    });

    it('debe manejar nombres con acentos', () => {
      const result = getInitials('Ángel García');
      expect(result).toBe('ÁG');
    });

    it('debe manejar nombres con ñ', () => {
      const result = getInitials('Niño Peña');
      expect(result).toBe('NP');
    });
  });
});