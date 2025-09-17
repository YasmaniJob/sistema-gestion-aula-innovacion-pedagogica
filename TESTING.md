# Guía de Testing - Sistema de Gestión AIP

Este proyecto cuenta con un stack completo de testing configurado con las mejores herramientas recomendadas para aplicaciones Next.js en 2024.

## 🛠️ Herramientas Configuradas

### Testing Unitario y de Componentes
- **Vitest**: Framework de testing rápido y moderno
- **React Testing Library**: Para testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para DOM
- **@testing-library/user-event**: Simulación de eventos de usuario
- **jsdom**: Entorno DOM para Node.js

### Testing E2E (End-to-End)
- **Playwright**: Testing E2E en múltiples navegadores
- Soporte para Chromium, Firefox y WebKit
- Testing visual y de interacciones

## 📁 Estructura de Carpetas

```
src/test/
├── setup.ts              # Configuración global de tests
├── components/           # Tests de componentes React
├── utils/               # Tests de utilidades
└── __mocks__/           # Mocks personalizados

tests/                   # Tests E2E con Playwright
└── reservations.spec.ts # Tests del flujo de reservas
```

## 🚀 Scripts Disponibles

### Testing Unitario (Vitest)
```bash
# Ejecutar tests en modo watch
npm run test

# Ejecutar tests una vez
npm run test:run

# Ejecutar tests con interfaz visual
npm run test:ui

# Ejecutar tests con coverage
npm run test:coverage
```

### Testing E2E (Playwright)
```bash
# Ejecutar tests E2E
npm run test:e2e

# Ejecutar tests E2E con interfaz visual
npm run test:e2e:ui
```

## 📝 Ejemplos de Tests

### Test Unitario de Componente
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MyComponent } from '@/components/my-component';

describe('MyComponent', () => {
  it('renderiza correctamente', () => {
    render(<MyComponent />);
    expect(screen.getByText('Texto esperado')).toBeInTheDocument();
  });

  it('maneja eventos de click', () => {
    const mockOnClick = vi.fn();
    render(<MyComponent onClick={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnClick).toHaveBeenCalled();
  });
});
```

### Test E2E con Playwright
```typescript
import { test, expect } from '@playwright/test';

test('flujo de usuario completo', async ({ page }) => {
  await page.goto('http://localhost:3001');
  
  // Interactuar con la página
  await page.click('button[data-testid="login-button"]');
  
  // Verificar resultado
  await expect(page.locator('h1')).toContainText('Dashboard');
});
```

## 🔧 Configuración

### Vitest (vitest.config.ts)
- Entorno jsdom para simulación de DOM
- Alias de rutas configurado (@/)
- Setup automático con mocks de Next.js
- Soporte para TypeScript

### Playwright (playwright.config.ts)
- Tests en Chromium, Firefox y WebKit
- Servidor de desarrollo automático
- Screenshots en fallos
- Videos de tests

## 🎯 Estrategia de Testing Recomendada

### 1. Tests Unitarios (70%)
- Funciones de utilidad
- Hooks personalizados
- Lógica de negocio
- Componentes simples

### 2. Tests de Integración (20%)
- Componentes complejos
- Interacciones entre componentes
- Context providers
- Servicios con mocks

### 3. Tests E2E (10%)
- Flujos críticos de usuario
- Funcionalidades principales
- Casos de uso completos

## 📊 Coverage y Reportes

Para generar reportes de cobertura:
```bash
npm run test:coverage
```

Esto generará un reporte HTML en `coverage/` con métricas detalladas.

## 🐛 Debugging

### Vitest
- Usar `console.log()` en tests
- Ejecutar con `--reporter=verbose` para más detalles
- Usar `screen.debug()` para ver el DOM renderizado

### Playwright
- Usar `--debug` para modo paso a paso
- `--headed` para ver el navegador
- Screenshots automáticos en fallos

## 📚 Recursos Adicionales

- [Documentación de Vitest](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## ✅ Tests Incluidos

### Tests Unitarios
- ✅ Configuración básica funcional
- ✅ Test de componente ReservationCalendar (con algunos ajustes pendientes)

### Tests E2E
- ✅ Flujo completo de reservas
- ✅ Navegación entre páginas
- ✅ Interacciones de usuario
- ✅ Responsive design

¡El sistema de testing está listo para usar! 🎉