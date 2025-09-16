'use client';

// Servicio de compresión y minificación para plan gratuito
interface CompressionConfig {
  enabled: boolean;
  level: number;
  threshold: number; // Tamaño mínimo en bytes para comprimir
  algorithms: ('gzip' | 'brotli' | 'deflate')[];
  mimeTypes: string[];
}

interface MinificationConfig {
  css: boolean;
  js: boolean;
  html: boolean;
  json: boolean;
  svg: boolean;
}

class CompressionService {
  private config: CompressionConfig;
  private minificationConfig: MinificationConfig;
  private compressionCache = new Map<string, string>();

  constructor() {
    this.config = {
      enabled: true,
      level: 6, // Nivel balanceado entre compresión y velocidad
      threshold: 1024, // Solo comprimir archivos > 1KB
      algorithms: ['gzip', 'brotli'],
      mimeTypes: [
        'text/html',
        'text/css',
        'text/javascript',
        'application/javascript',
        'application/json',
        'text/xml',
        'application/xml',
        'image/svg+xml'
      ]
    };

    this.minificationConfig = {
      css: true,
      js: true,
      html: true,
      json: true,
      svg: true
    };
  }

  // Minificar CSS
  minifyCSS(css: string): string {
    if (!this.minificationConfig.css) return css;

    return css
      // Remover comentarios
      .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
      // Remover espacios innecesarios
      .replace(/\s+/g, ' ')
      // Remover espacios alrededor de operadores
      .replace(/\s*([{}:;,>+~])\s*/g, '$1')
      // Remover punto y coma antes de llave de cierre
      .replace(/;}/g, '}')
      // Remover espacios al inicio y final
      .trim()
      // Remover líneas vacías
      .replace(/\n\s*\n/g, '\n');
  }

  // Minificar JavaScript básico (solo espacios y comentarios)
  minifyJS(js: string): string {
    if (!this.minificationConfig.js) return js;

    return js
      // Remover comentarios de línea
      .replace(/\/\/.*$/gm, '')
      // Remover comentarios de bloque
      .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '')
      // Remover espacios múltiples
      .replace(/\s+/g, ' ')
      // Remover espacios alrededor de operadores
      .replace(/\s*([{}();,])\s*/g, '$1')
      .trim();
  }

  // Minificar HTML
  minifyHTML(html: string): string {
    if (!this.minificationConfig.html) return html;

    return html
      // Remover comentarios HTML
      .replace(/<!--[^>]*-->/g, '')
      // Remover espacios entre tags
      .replace(/>\s+</g, '><')
      // Remover espacios múltiples
      .replace(/\s+/g, ' ')
      // Remover espacios al inicio de líneas
      .replace(/^\s+/gm, '')
      // Remover líneas vacías
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  // Minificar JSON
  minifyJSON(json: string): string {
    if (!this.minificationConfig.json) return json;

    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed);
    } catch {
      return json;
    }
  }

  // Minificar SVG
  minifySVG(svg: string): string {
    if (!this.minificationConfig.svg) return svg;

    return svg
      // Remover comentarios XML
      .replace(/<!--[^>]*-->/g, '')
      // Remover espacios entre atributos
      .replace(/\s+/g, ' ')
      // Remover espacios alrededor de =
      .replace(/\s*=\s*/g, '=')
      // Remover espacios entre tags
      .replace(/>\s+</g, '><')
      // Remover atributos innecesarios
      .replace(/\s*(xmlns:xlink|version|baseProfile)="[^"]*"/g, '')
      .trim();
  }

  // Comprimir texto usando algoritmo simple (simulación)
  compressText(text: string, algorithm: 'gzip' | 'brotli' | 'deflate' = 'gzip'): string {
    if (!this.config.enabled || text.length < this.config.threshold) {
      return text;
    }

    const cacheKey = `${algorithm}:${this.hashString(text)}`;
    
    if (this.compressionCache.has(cacheKey)) {
      return this.compressionCache.get(cacheKey)!;
    }

    // Simulación de compresión (en producción usarías librerías reales)
    let compressed = text;
    
    switch (algorithm) {
      case 'gzip':
        compressed = this.simulateGzipCompression(text);
        break;
      case 'brotli':
        compressed = this.simulateBrotliCompression(text);
        break;
      case 'deflate':
        compressed = this.simulateDeflateCompression(text);
        break;
    }

    this.compressionCache.set(cacheKey, compressed);
    return compressed;
  }

  // Simulación de compresión GZIP
  private simulateGzipCompression(text: string): string {
    // Remover patrones repetitivos comunes
    return text
      .replace(/\s{2,}/g, ' ') // Espacios múltiples
      .replace(/\n{2,}/g, '\n') // Saltos de línea múltiples
      .replace(/([a-zA-Z])\1{2,}/g, '$1$1'); // Caracteres repetidos
  }

  // Simulación de compresión Brotli
  private simulateBrotliCompression(text: string): string {
    // Brotli es más eficiente, simulamos mejor compresión
    return this.simulateGzipCompression(text)
      .replace(/\b(the|and|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|may|new|now|old|see|two|way|who|boy|did|man|men|put|say|she|too|use)\b/g, (match) => {
        // Reemplazar palabras comunes con versiones más cortas
        const dict: { [key: string]: string } = {
          'the': 't', 'and': '&', 'for': '4', 'are': 'r', 'you': 'u'
        };
        return dict[match] || match;
      });
  }

  // Simulación de compresión Deflate
  private simulateDeflateCompression(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/([.,;:!?])\s+/g, '$1');
  }

  // Función hash simple para caché
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32bit
    }
    return hash.toString(36);
  }

  // Comprimir respuesta completa
  compressResponse(data: any, contentType: string): string {
    let content = typeof data === 'string' ? data : JSON.stringify(data);
    
    // Aplicar minificación según el tipo de contenido
    if (contentType.includes('text/css')) {
      content = this.minifyCSS(content);
    } else if (contentType.includes('javascript')) {
      content = this.minifyJS(content);
    } else if (contentType.includes('text/html')) {
      content = this.minifyHTML(content);
    } else if (contentType.includes('application/json')) {
      content = this.minifyJSON(content);
    } else if (contentType.includes('image/svg+xml')) {
      content = this.minifySVG(content);
    }

    // Aplicar compresión
    if (this.shouldCompress(content, contentType)) {
      content = this.compressText(content, 'gzip');
    }

    return content;
  }

  // Verificar si debe comprimir
  private shouldCompress(content: string, contentType: string): boolean {
    return (
      this.config.enabled &&
      content.length >= this.config.threshold &&
      this.config.mimeTypes.some(type => contentType.includes(type))
    );
  }

  // Obtener headers de compresión
  getCompressionHeaders(contentType: string, originalSize: number, compressedSize: number) {
    const headers: { [key: string]: string } = {};
    
    if (this.shouldCompress('x'.repeat(originalSize), contentType)) {
      headers['Content-Encoding'] = 'gzip';
      headers['Vary'] = 'Accept-Encoding';
      headers['X-Original-Size'] = originalSize.toString();
      headers['X-Compressed-Size'] = compressedSize.toString();
      headers['X-Compression-Ratio'] = ((1 - compressedSize / originalSize) * 100).toFixed(2) + '%';
    }
    
    return headers;
  }

  // Optimizar bundle de JavaScript
  optimizeJSBundle(code: string): string {
    return code
      // Remover console.log en producción
      .replace(/console\.log\([^)]*\);?/g, '')
      // Remover debugger statements
      .replace(/debugger;?/g, '')
      // Remover comentarios TODO/FIXME
      .replace(/\/\/\s*(TODO|FIXME|HACK).*$/gm, '')
      // Minificar
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Optimizar CSS para producción
  optimizeCSSForProduction(css: string): string {
    return css
      // Remover vendor prefixes innecesarios (simplificado)
      .replace(/-webkit-|-moz-|-ms-|-o-/g, '')
      // Remover propiedades duplicadas
      .replace(/(\w+):\s*([^;]+);[^}]*\1:\s*([^;]+);/g, '$1: $3;')
      // Minificar
      .replace(/\s+/g, ' ')
      .replace(/;\s*}/g, '}')
      .trim();
  }

  // Obtener estadísticas de compresión
  getCompressionStats() {
    return {
      enabled: this.config.enabled,
      level: this.config.level,
      threshold: this.config.threshold,
      algorithms: this.config.algorithms,
      cacheSize: this.compressionCache.size,
      minificationEnabled: this.minificationConfig,
      supportedMimeTypes: this.config.mimeTypes.length
    };
  }

  // Limpiar caché de compresión
  clearCache(): void {
    this.compressionCache.clear();
  }

  // Configurar compresión
  configure(config: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Configurar minificación
  configureMinification(config: Partial<MinificationConfig>): void {
    this.minificationConfig = { ...this.minificationConfig, ...config };
  }
}

// Instancia singleton
export const compressionService = new CompressionService();

// Hook para usar en componentes React
export function useCompression() {
  return {
    minifyCSS: (css: string) => compressionService.minifyCSS(css),
    minifyJS: (js: string) => compressionService.minifyJS(js),
    minifyHTML: (html: string) => compressionService.minifyHTML(html),
    minifyJSON: (json: string) => compressionService.minifyJSON(json),
    minifySVG: (svg: string) => compressionService.minifySVG(svg),
    compress: (text: string, algorithm?: 'gzip' | 'brotli' | 'deflate') => 
      compressionService.compressText(text, algorithm),
    compressResponse: (data: any, contentType: string) => 
      compressionService.compressResponse(data, contentType),
    stats: () => compressionService.getCompressionStats(),
    clearCache: () => compressionService.clearCache()
  };
}

// Middleware para Next.js API routes
export function withCompression(handler: any) {
  return async (req: any, res: any) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Interceptar res.send
    res.send = function(data: any) {
      const contentType = res.getHeader('content-type') || 'text/plain';
      const compressed = compressionService.compressResponse(data, contentType);
      
      const headers = compressionService.getCompressionHeaders(
        contentType,
        data.length || 0,
        compressed.length
      );
      
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      return originalSend.call(this, compressed);
    };
    
    // Interceptar res.json
    res.json = function(data: any) {
      const jsonString = JSON.stringify(data);
      const compressed = compressionService.compressResponse(jsonString, 'application/json');
      
      const headers = compressionService.getCompressionHeaders(
        'application/json',
        jsonString.length,
        compressed.length
      );
      
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      res.setHeader('content-type', 'application/json');
      return originalSend.call(this, compressed);
    };
    
    return handler(req, res);
  };
}

export default compressionService;