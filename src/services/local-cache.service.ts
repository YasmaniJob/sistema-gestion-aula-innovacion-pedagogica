'use client';

// Sistema de caché local optimizado para plan gratuito
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live en milisegundos
  version: string;
}

interface CacheConfig {
  maxSize: number; // Máximo número de elementos
  defaultTTL: number; // TTL por defecto en minutos
  persistToDisk: boolean; // Guardar en localStorage
  compressionEnabled: boolean; // Comprimir datos grandes
}

class LocalCacheService {
  private cache = new Map<string, CacheItem<any>>();
  private config: CacheConfig;
  private storageKey = 'aip_cache_v1';
  private maxStorageSize = 5 * 1024 * 1024; // 5MB máximo en localStorage

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      maxSize: 100,
      defaultTTL: 10, // 10 minutos por defecto
      persistToDisk: true,
      compressionEnabled: true,
      ...config
    };

    // Cargar caché desde localStorage al inicializar
    this.loadFromStorage();
    
    // Limpiar caché expirado cada 5 minutos
    setInterval(() => this.cleanExpired(), 5 * 60 * 1000);
  }

  // Obtener datos del caché
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // Verificar si el item ha expirado
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      this.saveToStorage();
      return null;
    }

    return item.data;
  }

  // Guardar datos en el caché
  set<T>(key: string, data: T, ttlMinutes?: number): void {
    const ttl = (ttlMinutes || this.config.defaultTTL) * 60 * 1000;
    
    // Verificar tamaño máximo del caché
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      version: '1.0'
    };

    this.cache.set(key, item);
    
    if (this.config.persistToDisk) {
      this.saveToStorage();
    }
  }

  // Invalidar caché por patrón
  invalidate(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.cache.keys())
        .filter(key => key.includes(pattern));
      
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    
    this.saveToStorage();
  }

  // Verificar si existe en caché
  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;
    
    // Verificar expiración
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Obtener estadísticas del caché
  getStats() {
    const now = Date.now();
    const items = Array.from(this.cache.values());
    const expired = items.filter(item => now - item.timestamp > item.ttl).length;
    
    return {
      totalItems: this.cache.size,
      expiredItems: expired,
      activeItems: this.cache.size - expired,
      maxSize: this.config.maxSize,
      storageUsed: this.getStorageSize()
    };
  }

  // Limpiar elementos expirados
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache: Cleaned ${keysToDelete.length} expired items`);
      this.saveToStorage();
    }
  }

  // Eliminar el elemento más antiguo
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.cache.delete(oldestKey);
      console.log(`Cache: Evicted oldest item: ${oldestKey}`);
    }
  }

  // Guardar caché en localStorage
  private saveToStorage(): void {
    if (!this.config.persistToDisk || typeof window === 'undefined') {
      return;
    }

    try {
      const cacheData = Object.fromEntries(this.cache.entries());
      const serialized = JSON.stringify(cacheData);
      
      // Verificar tamaño antes de guardar
      if (serialized.length > this.maxStorageSize) {
        console.warn('Cache too large for localStorage, skipping save');
        return;
      }
      
      localStorage.setItem(this.storageKey, serialized);
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  // Cargar caché desde localStorage
  private loadFromStorage(): void {
    if (!this.config.persistToDisk || typeof window === 'undefined') {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const cacheData = JSON.parse(stored);
        this.cache = new Map(Object.entries(cacheData));
        
        // Limpiar elementos expirados al cargar
        this.cleanExpired();
        
        console.log(`Cache: Loaded ${this.cache.size} items from storage`);
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
      // Limpiar localStorage corrupto
      localStorage.removeItem(this.storageKey);
    }
  }

  // Obtener tamaño del storage usado
  private getStorageSize(): number {
    if (typeof window === 'undefined') return 0;
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? stored.length : 0;
    } catch {
      return 0;
    }
  }

  // Limpiar todo el caché
  clear(): void {
    this.cache.clear();
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.storageKey);
    }
  }
}

// Instancia singleton del caché
export const localCache = new LocalCacheService({
  maxSize: 50, // Reducido para plan gratuito
  defaultTTL: 15, // 15 minutos por defecto
  persistToDisk: true,
  compressionEnabled: false // Deshabilitado para simplicidad
});

// Hook para usar el caché en componentes React
export function useLocalCache() {
  return {
    get: <T>(key: string) => localCache.get<T>(key),
    set: <T>(key: string, data: T, ttl?: number) => localCache.set(key, data, ttl),
    has: (key: string) => localCache.has(key),
    invalidate: (pattern?: string) => localCache.invalidate(pattern),
    stats: () => localCache.getStats()
  };
}

// Wrapper para funciones que pueden usar caché
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMinutes = 10
): Promise<T> {
  // Intentar obtener del caché primero
  const cached = localCache.get<T>(key);
  if (cached !== null) {
    console.log(`Cache hit: ${key}`);
    return cached;
  }

  // Si no está en caché, ejecutar fetcher
  console.log(`Cache miss: ${key}`);
  const data = await fetcher();
  
  // Guardar en caché
  localCache.set(key, data, ttlMinutes);
  
  return data;
}

// Configuraciones específicas para diferentes tipos de datos
export const CacheConfigs = {
  // Datos que cambian poco
  USERS: 30, // 30 minutos
  CATEGORIES: 60, // 1 hora
  AREAS: 60, // 1 hora
  GRADES: 60, // 1 hora
  PEDAGOGICAL_HOURS: 60, // 1 hora
  
  // Configuración de la app
  APP_SETTINGS: 120, // 2 horas
  
  // Recursos (cambian moderadamente)
  RESOURCES: 15, // 15 minutos
  
  // Préstamos activos (cambian frecuentemente)
  LOANS: 5, // 5 minutos
  
  // Reservaciones (cambian frecuentemente)
  RESERVATIONS: 3, // 3 minutos
  
  // Reuniones
  MEETINGS: 10, // 10 minutos
  
  // Estadísticas del dashboard
  DASHBOARD_STATS: 20, // 20 minutos
  
  // Búsquedas
  SEARCH_RESULTS: 10 // 10 minutos
};

// Claves de caché estandarizadas
export const CacheKeys = {
  USERS: 'users',
  RESOURCES: 'resources',
  CATEGORIES: 'categories',
  LOANS: 'loans',
  RESERVATIONS: 'reservations',
  MEETINGS: 'meetings',
  AREAS: 'areas',
  GRADES: 'grades',
  PEDAGOGICAL_HOURS: 'pedagogical_hours',
  DASHBOARD_STATS: 'dashboard_stats',
  APP_SETTINGS: 'app_settings',
  SEARCH_RESOURCES: (term: string, category?: string) => `search_${term}_${category || 'all'}`,
  ACTIVE_LOANS: 'active_loans'
};

export default localCache;