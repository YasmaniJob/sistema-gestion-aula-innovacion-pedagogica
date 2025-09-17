import { describe, it, expect } from 'vitest';

describe('Configuración básica de testing', () => {
  it('debe ejecutar un test simple', () => {
    expect(1 + 1).toBe(2);
  });

  it('debe poder usar funciones de JavaScript', () => {
    const array = [1, 2, 3];
    expect(array.length).toBe(3);
    expect(array.includes(2)).toBe(true);
  });

  it('debe poder trabajar con objetos', () => {
    const user = {
      id: '1',
      name: 'Juan Pérez',
      role: 'Docente'
    };
    
    expect(user.name).toBe('Juan Pérez');
    expect(user.role).toBe('Docente');
  });
});