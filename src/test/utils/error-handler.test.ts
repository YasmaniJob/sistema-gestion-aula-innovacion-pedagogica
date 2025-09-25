import { describe, it, expect, vi } from 'vitest';
import {
  AppError,
  ErrorType,
  withErrorHandling,
  handleAuthError,
  handleSupabaseError,
  validateRequiredFields,
  validateEmail,
  validatePassword
} from '@/utils/error-handler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('debe crear un error de aplicación correctamente', () => {
      const error = new AppError('Error personalizado', ErrorType.VALIDATION, 'CUSTOM_CODE', { field: 'email' });
      
      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Error personalizado');
      expect(error.type).toBe(ErrorType.VALIDATION);
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.details).toEqual({ field: 'email' });
      expect(error.name).toBe('AppError');
    });

    it('debe usar valores por defecto', () => {
      const error = new AppError('Error simple');
      
      expect(error.type).toBe(ErrorType.UNKNOWN);
      expect(error.code).toBeUndefined();
      expect(error.details).toBeUndefined();
    });
  });

  describe('handleSupabaseError', () => {
    it('debe manejar error PGRST116 (no encontrado)', () => {
      const supabaseError = { code: 'PGRST116', message: 'No rows found' };
      const result = handleSupabaseError(supabaseError, 'Test context');
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Test context: No se encontraron registros');
      expect(result.type).toBe(ErrorType.DATABASE);
      expect(result.code).toBe('PGRST116');
    });

    it('debe manejar error 23505 (duplicado)', () => {
      const supabaseError = { code: '23505', message: 'Duplicate key' };
      const result = handleSupabaseError(supabaseError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Ya existe un registro con estos datos');
      expect(result.type).toBe(ErrorType.DATABASE);
      expect(result.code).toBe('23505');
    });

    it('debe manejar errores genéricos', () => {
      const genericError = { message: 'Generic error' };
      const result = handleSupabaseError(genericError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Generic error');
      expect(result.type).toBe(ErrorType.DATABASE);
    });
  });

  describe('handleAuthError', () => {
    it('debe manejar credenciales inválidas', () => {
      const authError = { message: 'Invalid login credentials' };
      const result = handleAuthError(authError, 'Test context');
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Test context: Email o contraseña incorrectos');
      expect(result.type).toBe(ErrorType.AUTHENTICATION);
      expect(result.code).toBe('INVALID_CREDENTIALS');
    });

    it('debe manejar error de email no confirmado', () => {
      const authError = { message: 'Email not confirmed' };
      const result = handleAuthError(authError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Debes confirmar tu email antes de iniciar sesión');
      expect(result.type).toBe(ErrorType.AUTHENTICATION);
    });

    it('debe manejar error de contraseña débil', () => {
      const authError = { message: 'Password should be at least 6 characters' };
      const result = handleAuthError(authError, 'Registration');
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Registration: Password should be at least 6 characters');
      expect(result.type).toBe(ErrorType.AUTHENTICATION);
    });

    it('debe manejar errores genéricos de autenticación', () => {
      const authError = { message: 'Unknown auth error' };
      const result = handleAuthError(authError);
      
      expect(result).toBeInstanceOf(AppError);
      expect(result.message).toBe('Unknown auth error');
      expect(result.type).toBe(ErrorType.AUTHENTICATION);
    });
  });

  describe('withErrorHandling', () => {
    it('debe ejecutar operación exitosa', async () => {
      const mockOperation = vi.fn().mockResolvedValue('success');
      
      const result = await withErrorHandling(mockOperation, 'Test operation');
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('debe manejar errores y convertirlos a AppError', async () => {
      const mockOperation = vi.fn().mockRejectedValue(new Error('Original error'));
      
      await expect(withErrorHandling(mockOperation, 'Test operation'))
        .rejects.toThrow(AppError);
      
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('debe preservar AppError existentes', async () => {
      const originalError = new AppError('Custom error', ErrorType.VALIDATION);
      const mockOperation = vi.fn().mockRejectedValue(originalError);
      
      await expect(withErrorHandling(mockOperation))
        .rejects.toThrow(originalError);
    });
  });

  describe('validateRequiredFields', () => {
    it('debe pasar validación con todos los campos requeridos', () => {
      const data = { name: 'John', email: 'john@test.com', age: 25 };
      const required = ['name', 'email', 'age'];
      
      expect(() => validateRequiredFields(data, required)).not.toThrow();
    });

    it('debe lanzar AppError para campos faltantes', () => {
      const data = { name: 'John' };
      const required = ['name', 'email', 'age'];
      
      expect(() => validateRequiredFields(data, required)).toThrow(AppError);
    });

    it('debe rechazar campos con valores falsy', () => {
      const data = { name: 'John', isActive: false, count: 0 };
      const required = ['name', 'isActive', 'count'];
      
      expect(() => validateRequiredFields(data, required)).toThrow(AppError);
    });

    it('debe rechazar campos null o undefined', () => {
      const data = { name: 'John', email: null, age: undefined };
      const required = ['name', 'email', 'age'];
      
      expect(() => validateRequiredFields(data, required)).toThrow(AppError);
    });
  });

  describe('validateEmail', () => {
    it('debe aceptar emails válidos', () => {
      const validEmails = [
        'user@example.com',
        'test.email@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(() => validateEmail(email)).not.toThrow();
      });
    });

    it('debe rechazar emails inválidos', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => validateEmail(email)).toThrow(AppError);
      });
    });
  });

  describe('validatePassword', () => {
    it('debe aceptar contraseñas válidas', () => {
      expect(() => validatePassword('123456')).not.toThrow();
      expect(() => validatePassword('password123')).not.toThrow();
      expect(() => validatePassword('verylongpassword')).not.toThrow();
    });

    it('debe rechazar contraseñas inválidas', () => {
      expect(() => validatePassword('')).toThrow(AppError);
      expect(() => validatePassword('123')).toThrow(AppError);
      expect(() => validatePassword('12345')).toThrow(AppError);
    });

    it('debe aceptar contraseñas válidas con longitud personalizada', () => {
      expect(() => validatePassword('12345678', 8)).not.toThrow();
      expect(() => validatePassword('1234567', 8)).toThrow(AppError);
    });

    it('debe usar longitud mínima por defecto de 6', () => {
      expect(() => validatePassword('123456')).not.toThrow();
      expect(() => validatePassword('12345')).toThrow(AppError);
    });
  });
});