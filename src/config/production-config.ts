'use client';

// Configuración optimizada para producción - Plan gratuito
interface ProductionConfig {
  database: {
    poolSize: number;
    timeout: number;
    maxConnections: number;
    queryTimeout: number;
  };
  cache: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
    persistToDisk: boolean;
  };
  images: {
    optimization: boolean;
    quality: number;
    formats: string[];
    lazyLoading: boolean;
  };
  realtime: {
    enabled: boolean;
    debounceMs: number;
    maxRetries: number;
    heartbeatInterval: number;
  };
  polling: {
    intervalMs: number;
    maxRetries: number;
    enabled: boolean;
  };
  compression: {
    enabled: boolean;
    level: number;
    gzip: boolean;
    brotli: boolean;
  };
  performance: {
    analytics: boolean;
    debugging: boolean;
    bundleAnalyzer: boolean;
    treeshaking: boolean;
    codeSplitting: boolean;
    minification: boolean;
    sourceMaps: boolean;
  };
  limits: {
    maxRequestsPerMinute: number;
    maxDbConnections: number;
    maxStorageSizeMB: number;
    maxBandwidthMB: number;
  };
  timeouts: {
    api: number;
    dbQuery: number;
    request: number;
    dataLoad: number;
  };
  vercel: {
    enabled: boolean;
    region: string;
    maxDuration: number;
    retries: number;
  };
  rateLimit: {
    enabled: boolean;
    requests: number;
    windowMs: number;
  };
}

class ProductionConfigService {
  private config: ProductionConfig;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.config = this.loadConfig();
  }

  private loadConfig(): ProductionConfig {
    return {
      database: {
        poolSize: this.getEnvNumber('SUPABASE_DB_POOL_SIZE', 5),
        timeout: this.getEnvNumber('SUPABASE_DB_TIMEOUT', 10000),
        maxConnections: this.getEnvNumber('SUPABASE_MAX_CONNECTIONS', 10),
        queryTimeout: this.getEnvNumber('DB_QUERY_TIMEOUT', 3000)
      },
      cache: {
        enabled: this.getEnvBoolean('CACHE_ENABLED', true),
        defaultTTL: this.getEnvNumber('CACHE_TTL_DEFAULT', 900),
        maxSize: this.getEnvNumber('CACHE_MAX_SIZE', 50),
        persistToDisk: this.getEnvBoolean('CACHE_PERSIST_TO_DISK', true)
      },
      images: {
        optimization: this.getEnvBoolean('NEXT_PUBLIC_IMAGE_OPTIMIZATION', true),
        quality: this.getEnvNumber('NEXT_PUBLIC_IMAGE_QUALITY', 75),
        formats: this.getEnvArray('NEXT_PUBLIC_IMAGE_FORMATS', ['webp', 'jpeg']),
        lazyLoading: this.getEnvBoolean('NEXT_PUBLIC_IMAGE_LAZY_LOADING', true)
      },
      realtime: {
        enabled: this.getEnvBoolean('REALTIME_ENABLED', true),
        debounceMs: this.getEnvNumber('REALTIME_DEBOUNCE_MS', 2000),
        maxRetries: this.getEnvNumber('REALTIME_MAX_RETRIES', 3),
        heartbeatInterval: this.getEnvNumber('REALTIME_HEARTBEAT_INTERVAL', 30000)
      },
      polling: {
        intervalMs: this.getEnvNumber('POLLING_INTERVAL_MS', 30000),
        maxRetries: this.getEnvNumber('POLLING_MAX_RETRIES', 3),
        enabled: this.getEnvBoolean('POLLING_ENABLED', false)
      },
      compression: {
        enabled: this.getEnvBoolean('COMPRESSION_ENABLED', true),
        level: this.getEnvNumber('COMPRESSION_LEVEL', 6),
        gzip: this.getEnvBoolean('GZIP_ENABLED', true),
        brotli: this.getEnvBoolean('BROTLI_ENABLED', true)
      },
      performance: {
        analytics: this.getEnvBoolean('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
        debugging: this.getEnvBoolean('NEXT_PUBLIC_ENABLE_DEBUGGING', false),
        bundleAnalyzer: this.getEnvBoolean('NEXT_PUBLIC_BUNDLE_ANALYZER', false),
        treeshaking: this.getEnvBoolean('TREE_SHAKING', true),
        codeSplitting: this.getEnvBoolean('CODE_SPLITTING', true),
        minification: this.getEnvBoolean('MINIFICATION', true),
        sourceMaps: this.getEnvBoolean('SOURCE_MAPS', false)
      },
      limits: {
        maxRequestsPerMinute: this.getEnvNumber('MAX_REQUESTS_PER_MINUTE', 100),
        maxDbConnections: this.getEnvNumber('MAX_DB_CONNECTIONS', 5),
        maxStorageSizeMB: this.getEnvNumber('MAX_STORAGE_SIZE_MB', 500),
        maxBandwidthMB: this.getEnvNumber('MAX_BANDWIDTH_MB', 100)
      },
      timeouts: {
        api: this.getEnvNumber('API_TIMEOUT', 5000),
        dbQuery: this.getEnvNumber('DB_QUERY_TIMEOUT', 3000),
        request: this.getEnvNumber('REQUEST_TIMEOUT', 10000),
        dataLoad: this.getEnvNumber('DATA_LOAD_TIMEOUT', this.isProduction ? 30000 : 45000)
      },
      vercel: {
        enabled: this.getEnvBoolean('VERCEL', false) || this.getEnvBoolean('NEXT_PUBLIC_VERCEL_ENV', false),
        region: this.getEnvString('VERCEL_REGION', 'iad1'),
        maxDuration: this.getEnvNumber('VERCEL_MAX_DURATION', 10),
        retries: this.getEnvNumber('VERCEL_RETRIES', this.isProduction ? 3 : 1)
      },
      rateLimit: {
        enabled: this.getEnvBoolean('RATE_LIMIT_ENABLED', true),
        requests: this.getEnvNumber('RATE_LIMIT_REQUESTS', 60),
        windowMs: this.getEnvNumber('RATE_LIMIT_WINDOW', 60000)
      }
    };
  }

  private getEnvBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  private getEnvNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private getEnvArray(key: string, defaultValue: string[]): string[] {
    const value = process.env[key];
    if (value === undefined) return defaultValue;
    return value.split(',').map(item => item.trim());
  }

  private getEnvString(key: string, defaultValue: string): string {
    const value = process.env[key];
    return value !== undefined ? value : defaultValue;
  }

  // Getters para acceder a la configuración
  get database() {
    return this.config.database;
  }

  get cache() {
    return this.config.cache;
  }

  get images() {
    return this.config.images;
  }

  get realtime() {
    return this.config.realtime;
  }

  get polling() {
    return this.config.polling;
  }

  get compression() {
    return this.config.compression;
  }

  get performance() {
    return this.config.performance;
  }

  get limits() {
    return this.config.limits;
  }

  get timeouts() {
    return this.config.timeouts;
  }

  get vercel() {
    return this.config.vercel;
  }

  get rateLimit() {
    return this.config.rateLimit;
  }

  // Verificar si estamos en producción
  get isProductionMode() {
    return this.isProduction;
  }

  // Obtener configuración completa
  getFullConfig() {
    return { ...this.config };
  }

  // Validar configuración para plan gratuito
  validateFreeTierLimits(): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    let valid = true;

    // Verificar límites de Supabase gratuito
    if (this.config.database.maxConnections > 10) {
      warnings.push('Database max connections exceeds free tier limit (10)');
      valid = false;
    }

    if (this.config.limits.maxStorageSizeMB > 500) {
      warnings.push('Storage size exceeds free tier limit (500MB)');
      valid = false;
    }

    if (this.config.limits.maxBandwidthMB > 5000) {
      warnings.push('Bandwidth exceeds free tier limit (5GB)');
      valid = false;
    }

    // Verificar límites de Vercel gratuito
    if (this.config.limits.maxRequestsPerMinute > 100) {
      warnings.push('Requests per minute may exceed Vercel free tier limits');
    }

    // Verificar configuración de caché
    if (this.config.cache.maxSize > 100) {
      warnings.push('Cache size is high, may impact memory usage');
    }

    // Verificar configuración de tiempo real
    if (this.config.realtime.debounceMs < 1000) {
      warnings.push('Realtime debounce is too low, may increase API usage');
    }

    return { valid, warnings };
  }

  // Aplicar configuración optimizada automáticamente
  applyOptimizedSettings(): void {
    if (!this.isProduction) {
      console.log('Skipping production optimizations in development mode');
      return;
    }

    const validation = this.validateFreeTierLimits();
    
    if (!validation.valid) {
      console.warn('Configuration may exceed free tier limits:', validation.warnings);
    }

    // Aplicar configuraciones específicas
    this.applyDatabaseOptimizations();
    this.applyCacheOptimizations();
    this.applyRealtimeOptimizations();
    
    console.log('Production optimizations applied successfully');
  }

  private applyDatabaseOptimizations(): void {
    // Configurar timeouts de base de datos
    if (typeof window === 'undefined') {
      // Solo en servidor
      process.env.SUPABASE_DB_TIMEOUT = this.config.database.timeout.toString();
    }
  }

  private applyCacheOptimizations(): void {
    // La configuración de caché se aplica automáticamente a través del servicio
    console.log('Cache optimizations: enabled =', this.config.cache.enabled);
  }

  private applyRealtimeOptimizations(): void {
    // La configuración de tiempo real se aplica en el hook correspondiente
    console.log('Realtime optimizations: debounce =', this.config.realtime.debounceMs, 'ms');
  }

  // Obtener estadísticas de uso
  getUsageStats() {
    return {
      environment: this.isProduction ? 'production' : 'development',
      cacheEnabled: this.config.cache.enabled,
      realtimeEnabled: this.config.realtime.enabled,
      compressionEnabled: this.config.compression.enabled,
      imageOptimization: this.config.images.optimization,
      limits: this.config.limits,
      validation: this.validateFreeTierLimits()
    };
  }
}

// Instancia singleton
export const productionConfig = new ProductionConfigService();

// Hook para usar en componentes React
export function useProductionConfig() {
  return {
    config: productionConfig.getFullConfig(),
    isProduction: productionConfig.isProductionMode,
    database: productionConfig.database,
    cache: productionConfig.cache,
    images: productionConfig.images,
    realtime: productionConfig.realtime,
    polling: productionConfig.polling,
    limits: productionConfig.limits,
    timeouts: productionConfig.timeouts,
    vercel: productionConfig.vercel,
    validate: () => productionConfig.validateFreeTierLimits(),
    stats: () => productionConfig.getUsageStats()
  };
}

// Aplicar configuraciones al inicializar
if (typeof window === 'undefined') {
  // Solo en servidor
  productionConfig.applyOptimizedSettings();
}

export default productionConfig;