// Configuración centralizada de timeouts para evitar carga infinita

export const TIMEOUTS = {
  // Timeouts para operaciones de autenticación (en milisegundos)
  AUTH: {
    SIGN_IN: 10000,        // 10 segundos para login
    SIGN_OUT: 5000,        // 5 segundos para logout
    GET_SESSION: 8000,     // 8 segundos para obtener sesión
    REFRESH_SESSION: 10000, // 10 segundos para refresh
    GET_USER: 6000,        // 6 segundos para obtener usuario
  },
  
  // Timeouts para la UI
  UI: {
    LOADING_SCREEN: 15000,  // 15 segundos antes de mostrar error
    RETRY_DELAY: 2000,      // 2 segundos entre reintentos
    MAX_RETRIES: 3,         // Máximo 3 reintentos
  },
  
  // Timeouts para APIs
  API: {
    DEFAULT_REQUEST: 8000,  // 8 segundos para requests normales
    UPLOAD: 30000,         // 30 segundos para uploads
    DOWNLOAD: 20000,       // 20 segundos para downloads
  },
  
  // Configuración de sesión
  SESSION: {
    REFRESH_INTERVAL: 5 * 60 * 1000,    // 5 minutos
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    WARNING_TIME: 5 * 60 * 1000,        // 5 minutos antes del timeout
  }
} as const;

// Función helper para crear promesas con timeout
export function withTimeout<T>(
  promise: Promise<T>, 
  timeoutMs: number, 
  operation: string
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Timeout: ${operation} tardó más de ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([promise, timeoutPromise]);
}

// Función para reintentos con backoff exponencial
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = TIMEOUTS.UI.MAX_RETRIES,
  baseDelay: number = TIMEOUTS.UI.RETRY_DELAY
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Backoff exponencial: 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}