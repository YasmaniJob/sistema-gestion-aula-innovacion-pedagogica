import { PostgrestError } from '@supabase/supabase-js';

/**
 * Tipos de errores comunes en la aplicación
 */
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  DATABASE = 'DATABASE',
  NETWORK = 'NETWORK',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Clase personalizada para errores de la aplicación
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly details?: any;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

/**
 * Maneja errores de Supabase y los convierte en AppError
 */
export function handleSupabaseError(error: PostgrestError | any, context?: string): AppError {
  const contextMsg = context ? `${context}: ` : '';
  
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        return new AppError(
          `${contextMsg}No se encontraron registros`,
          ErrorType.DATABASE,
          error.code,
          error
        );
      case '23505':
        return new AppError(
          `${contextMsg}Ya existe un registro con estos datos`,
          ErrorType.DATABASE,
          error.code,
          error
        );
      case '23503':
        return new AppError(
          `${contextMsg}No se puede eliminar el registro porque está siendo usado`,
          ErrorType.DATABASE,
          error.code,
          error
        );
      default:
        return new AppError(
          `${contextMsg}${error.message || 'Error de base de datos'}`,
          ErrorType.DATABASE,
          error.code,
          error
        );
    }
  }
  
  return new AppError(
    `${contextMsg}${error?.message || 'Error desconocido'}`,
    ErrorType.DATABASE,
    undefined,
    error
  );
}

/**
 * Maneja errores de autenticación
 */
export function handleAuthError(error: any, context?: string): AppError {
  const contextMsg = context ? `${context}: ` : '';
  
  if (error?.message) {
    if (error.message.includes('Invalid login credentials')) {
      return new AppError(
        `${contextMsg}Email o contraseña incorrectos`,
        ErrorType.AUTHENTICATION,
        'INVALID_CREDENTIALS',
        error
      );
    }
    
    if (error.message.includes('Email not confirmed')) {
      return new AppError(
        `${contextMsg}Debes confirmar tu email antes de iniciar sesión`,
        ErrorType.AUTHENTICATION,
        'EMAIL_NOT_CONFIRMED',
        error
      );
    }
    
    if (error.message.includes('Too many requests')) {
      return new AppError(
        `${contextMsg}Demasiados intentos. Intenta nuevamente en unos minutos`,
        ErrorType.AUTHENTICATION,
        'TOO_MANY_REQUESTS',
        error
      );
    }
  }
  
  return new AppError(
    `${contextMsg}${error?.message || 'Error de autenticación'}`,
    ErrorType.AUTHENTICATION,
    undefined,
    error
  );
}

/**
 * Maneja errores de autorización
 */
export function handleAuthorizationError(message?: string): AppError {
  return new AppError(
    message || 'Operación no permitida. Se requieren privilegios de administrador',
    ErrorType.AUTHORIZATION,
    'INSUFFICIENT_PRIVILEGES'
  );
}

/**
 * Maneja errores de validación
 */
export function handleValidationError(message: string, field?: string): AppError {
  return new AppError(
    message,
    ErrorType.VALIDATION,
    'VALIDATION_ERROR',
    { field }
  );
}

/**
 * Wrapper para ejecutar funciones async con manejo de errores centralizado
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    
    // Si es un error de Supabase
    if (error && typeof error === 'object' && 'code' in error) {
      throw handleSupabaseError(error, context);
    }
    
    // Error genérico
    throw new AppError(
      context ? `${context}: ${error?.message || 'Error desconocido'}` : error?.message || 'Error desconocido',
      ErrorType.UNKNOWN,
      undefined,
      error
    );
  }
}

/**
 * Valida que el usuario tenga privilegios de administrador
 */
export function requireAdminPrivileges(supabaseAdmin: any): void {
  if (!supabaseAdmin) {
    throw handleAuthorizationError();
  }
}

/**
 * Valida campos obligatorios
 */
export function validateRequiredFields(data: Record<string, any>, requiredFields: string[]): void {
  for (const field of requiredFields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      throw handleValidationError(`El campo ${field} es obligatorio`, field);
    }
  }
}

/**
 * Valida formato de email
 */
export function validateEmail(email: string): void {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw handleValidationError('El formato del email no es válido', 'email');
  }
}

/**
 * Valida longitud mínima de contraseña
 */
export function validatePassword(password: string, minLength: number = 6): void {
  if (password.length < minLength) {
    throw handleValidationError(`La contraseña debe tener al menos ${minLength} caracteres`, 'password');
  }
}