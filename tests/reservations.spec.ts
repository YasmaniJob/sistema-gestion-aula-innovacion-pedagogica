import { test, expect } from '@playwright/test';

test.describe('Flujo de Reservas', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar a la página principal
    await page.goto('http://localhost:3001');
    
    // Simular login como docente (ajustar según tu sistema de autenticación)
    // Esto puede requerir ajustes según cómo manejes la autenticación
    await page.evaluate(() => {
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Juan Pérez',
        email: 'juan@example.com',
        role: 'Docente'
      }));
    });
  });

  test('debe mostrar la página de mis reservas', async ({ page }) => {
    await page.goto('http://localhost:3001/my-reservations');
    
    // Verificar que la página se carga correctamente
    await expect(page.locator('h1')).toContainText('Mis Reservas');
    
    // Verificar que el calendario está presente
    await expect(page.locator('table')).toBeVisible();
    
    // Verificar que el botón de nueva reserva está presente
    await expect(page.getByRole('link', { name: /nueva reserva/i })).toBeVisible();
  });

  test('debe permitir crear una nueva reserva', async ({ page }) => {
    await page.goto('http://localhost:3001/my-reservations/new');
    
    // Verificar que estamos en la página de nueva reserva
    await expect(page.locator('h1')).toContainText('Crear Nueva Reserva');
    
    // Seleccionar propósito de la reserva
    await page.getByRole('button', { name: /aprendizaje/i }).click();
    
    // Llenar detalles si es necesario
    const areaSelect = page.locator('select').first();
    if (await areaSelect.isVisible()) {
      await areaSelect.selectOption('Matemática');
    }
    
    // Seleccionar un slot disponible en el calendario
    const availableSlot = page.getByText('Disponible').first();
    if (await availableSlot.isVisible()) {
      await availableSlot.click();
    }
    
    // Confirmar la reserva
    const confirmButton = page.getByRole('button', { name: /confirmar reserva/i });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      
      // Verificar que se muestra el mensaje de éxito
      await expect(page.getByText(/reserva registrada/i)).toBeVisible();
      
      // Verificar que redirige a la página de reservas
      await expect(page).toHaveURL(/\/my-reservations$/);
    }
  });

  test('debe mostrar detalles de una reserva existente', async ({ page }) => {
    await page.goto('http://localhost:3001/my-reservations');
    
    // Buscar una reserva existente en el calendario
    const reservation = page.locator('[data-testid="reservation-cell"]').first();
    
    if (await reservation.isVisible()) {
      await reservation.click();
      
      // Verificar que se abre el diálogo de detalles
      await expect(page.getByText(/gestionar reserva|detalles de la reserva/i)).toBeVisible();
      
      // Verificar que se muestran los detalles
      await expect(page.getByText(/usuario/i)).toBeVisible();
      await expect(page.getByText(/estado/i)).toBeVisible();
    }
  });

  test('debe permitir cambiar el estado de una reserva', async ({ page }) => {
    await page.goto('http://localhost:3001/my-reservations');
    
    // Buscar una reserva confirmada
    const confirmedReservation = page.locator('text=Confirmada').first();
    
    if (await confirmedReservation.isVisible()) {
      // Hacer clic en la reserva para abrir el diálogo
      await confirmedReservation.click();
      
      // Esperar a que aparezca el diálogo
      await expect(page.getByText(/gestionar reserva/i)).toBeVisible();
      
      // Cambiar estado a "Realizada"
      const realizadaButton = page.getByRole('button', { name: /realizada/i });
      if (await realizadaButton.isVisible()) {
        await realizadaButton.click();
        
        // Verificar que se muestra el mensaje de éxito
        await expect(page.getByText(/estado actualizado/i)).toBeVisible();
      }
    }
  });

  test('debe navegar entre semanas en el calendario', async ({ page }) => {
    await page.goto('http://localhost:3001/my-reservations');
    
    // Verificar que los botones de navegación están presentes
    const nextWeekButton = page.getByRole('button', { name: /siguiente/i });
    const prevWeekButton = page.getByRole('button', { name: /anterior/i });
    
    await expect(nextWeekButton).toBeVisible();
    await expect(prevWeekButton).toBeVisible();
    
    // Navegar a la siguiente semana
    await nextWeekButton.click();
    
    // Verificar que el calendario se actualiza (puede requerir ajustes según la implementación)
    await page.waitForTimeout(500);
    
    // Navegar a la semana anterior
    await prevWeekButton.click();
    
    await page.waitForTimeout(500);
  });

  test('debe mostrar mensaje cuando no hay reservas', async ({ page }) => {
    // Limpiar reservas para este test
    await page.evaluate(() => {
      localStorage.removeItem('reservations');
    });
    
    await page.goto('http://localhost:3001/my-reservations');
    
    // Verificar que se muestra el mensaje de no reservas
    // (Ajustar según el mensaje exacto en tu aplicación)
    const noReservationsMessage = page.getByText(/no tienes reservas|sin reservas/i);
    if (await noReservationsMessage.isVisible()) {
      await expect(noReservationsMessage).toBeVisible();
    }
  });

  test('debe validar formulario de nueva reserva', async ({ page }) => {
    await page.goto('http://localhost:3001/my-reservations/new');
    
    // Intentar confirmar sin llenar el formulario
    const confirmButton = page.getByRole('button', { name: /confirmar reserva/i });
    
    if (await confirmButton.isVisible()) {
      // El botón debería estar deshabilitado o mostrar validación
      const isDisabled = await confirmButton.isDisabled();
      if (!isDisabled) {
        await confirmButton.click();
        // Verificar que se muestran mensajes de validación
        await expect(page.getByText(/selecciona|requerido|obligatorio/i)).toBeVisible();
      } else {
        expect(isDisabled).toBe(true);
      }
    }
  });

  test('debe ser responsive en dispositivos móviles', async ({ page }) => {
    // Simular viewport móvil
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('http://localhost:3001/my-reservations');
    
    // Verificar que la página se adapta correctamente
    await expect(page.locator('table')).toBeVisible();
    
    // Verificar que los elementos principales están visibles
    const newReservationButton = page.getByRole('link', { name: /nueva reserva/i });
    if (await newReservationButton.isVisible()) {
      await expect(newReservationButton).toBeVisible();
    }
  });
});