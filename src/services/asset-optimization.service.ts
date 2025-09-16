'use client';

// Servicio de optimización de assets para plan gratuito
interface ImageOptimizationConfig {
  quality: number;
  format: 'webp' | 'avif' | 'jpeg' | 'png';
  sizes: number[];
  lazy: boolean;
  placeholder: 'blur' | 'empty';
}

interface AssetConfig {
  images: ImageOptimizationConfig;
  fonts: {
    preload: string[];
    display: 'swap' | 'fallback' | 'optional';
  };
  icons: {
    format: 'svg' | 'webp';
    sizes: number[];
  };
}

class AssetOptimizationService {
  private config: AssetConfig;
  private imageCache = new Map<string, string>();
  private fontCache = new Set<string>();

  constructor() {
    this.config = {
      images: {
        quality: 75, // Calidad optimizada para plan gratuito
        format: 'webp',
        sizes: [320, 640, 768, 1024, 1280],
        lazy: true,
        placeholder: 'blur'
      },
      fonts: {
        preload: ['Inter-Regular.woff2', 'Inter-Medium.woff2'],
        display: 'swap'
      },
      icons: {
        format: 'svg',
        sizes: [16, 24, 32, 48]
      }
    };
  }

  // Optimizar URL de imagen
  optimizeImageUrl(src: string, width?: number, height?: number): string {
    if (!src) return '';
    
    // Si es una imagen externa, usar el servicio de Next.js
    if (src.startsWith('http')) {
      const params = new URLSearchParams();
      params.set('url', src);
      params.set('q', this.config.images.quality.toString());
      params.set('w', (width || 800).toString());
      
      if (height) {
        params.set('h', height.toString());
      }
      
      return `/_next/image?${params.toString()}`;
    }
    
    // Para imágenes locales, retornar tal como están
    return src;
  }

  // Generar srcSet para imágenes responsivas
  generateSrcSet(src: string, baseWidth = 800): string {
    if (!src || src.startsWith('data:')) return '';
    
    const srcSet = this.config.images.sizes
      .filter(size => size <= baseWidth * 2) // No generar tamaños muy grandes
      .map(size => {
        const optimizedUrl = this.optimizeImageUrl(src, size);
        return `${optimizedUrl} ${size}w`;
      })
      .join(', ');
    
    return srcSet;
  }

  // Generar sizes attribute para imágenes responsivas
  generateSizes(breakpoints?: { [key: string]: string }): string {
    const defaultBreakpoints = {
      '(max-width: 320px)': '280px',
      '(max-width: 640px)': '600px',
      '(max-width: 768px)': '720px',
      '(max-width: 1024px)': '960px',
      '(max-width: 1280px)': '1200px'
    };
    
    const sizes = breakpoints || defaultBreakpoints;
    
    return Object.entries(sizes)
      .map(([query, size]) => `${query} ${size}`)
      .join(', ') + ', 100vw';
  }

  // Crear placeholder blur para imágenes
  createBlurPlaceholder(width = 8, height = 8): string {
    // Generar un placeholder SVG simple
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `;
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // Precargar imagen crítica
  preloadImage(src: string, priority = false): void {
    if (typeof window === 'undefined' || this.imageCache.has(src)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = priority ? 'preload' : 'prefetch';
    link.as = 'image';
    link.href = this.optimizeImageUrl(src);
    
    // Agregar soporte para formatos modernos
    if (this.supportsWebP()) {
      link.type = 'image/webp';
    }
    
    document.head.appendChild(link);
    this.imageCache.set(src, link.href);
  }

  // Precargar fuente
  preloadFont(fontPath: string): void {
    if (typeof window === 'undefined' || this.fontCache.has(fontPath)) {
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.href = fontPath;
    link.crossOrigin = 'anonymous';
    
    document.head.appendChild(link);
    this.fontCache.add(fontPath);
  }

  // Verificar soporte para WebP
  supportsWebP(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  // Verificar soporte para AVIF
  supportsAVIF(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      return canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;
    } catch {
      return false;
    }
  }

  // Optimizar CSS crítico
  inlineCriticalCSS(css: string): string {
    // Remover comentarios y espacios innecesarios
    return css
      .replace(/\/\*[^*]*\*+(?:[^/*][^*]*\*+)*\//g, '') // Comentarios
      .replace(/\s+/g, ' ') // Espacios múltiples
      .replace(/;\s*}/g, '}') // Punto y coma antes de llave
      .replace(/\s*{\s*/g, '{') // Espacios alrededor de llaves
      .replace(/;\s*/g, ';') // Espacios después de punto y coma
      .trim();
  }

  // Generar CSS para lazy loading
  generateLazyLoadCSS(): string {
    return this.inlineCriticalCSS(`
      .lazy-image {
        opacity: 0;
        transition: opacity 0.3s ease-in-out;
      }
      
      .lazy-image.loaded {
        opacity: 1;
      }
      
      .lazy-placeholder {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: loading 1.5s infinite;
      }
      
      @keyframes loading {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      @media (prefers-reduced-motion: reduce) {
        .lazy-image { transition: none; }
        .lazy-placeholder { animation: none; }
      }
    `);
  }

  // Comprimir SVG
  compressSVG(svgString: string): string {
    return svgString
      .replace(/\s+/g, ' ') // Espacios múltiples
      .replace(/> </g, '><') // Espacios entre tags
      .replace(/\s*=\s*/g, '=') // Espacios alrededor de =
      .replace(/"\s+/g, '" ') // Espacios después de comillas
      .replace(/<!--[^>]*-->/g, '') // Comentarios
      .trim();
  }

  // Obtener configuración optimizada para Next.js Image
  getNextImageConfig() {
    return {
      quality: this.config.images.quality,
      formats: ['image/webp', 'image/jpeg'],
      sizes: this.generateSizes(),
      placeholder: this.config.images.placeholder,
      loading: 'lazy' as const,
      priority: false
    };
  }

  // Obtener estadísticas de optimización
  getOptimizationStats() {
    return {
      imagesPreloaded: this.imageCache.size,
      fontsPreloaded: this.fontCache.size,
      webpSupport: this.supportsWebP(),
      avifSupport: this.supportsAVIF(),
      config: this.config
    };
  }
}

// Instancia singleton
export const assetOptimizer = new AssetOptimizationService();

// Hook para usar en componentes React
export function useAssetOptimization() {
  return {
    optimizeImage: (src: string, width?: number, height?: number) => 
      assetOptimizer.optimizeImageUrl(src, width, height),
    generateSrcSet: (src: string, baseWidth?: number) => 
      assetOptimizer.generateSrcSet(src, baseWidth),
    generateSizes: (breakpoints?: { [key: string]: string }) => 
      assetOptimizer.generateSizes(breakpoints),
    createPlaceholder: (width?: number, height?: number) => 
      assetOptimizer.createBlurPlaceholder(width, height),
    preloadImage: (src: string, priority?: boolean) => 
      assetOptimizer.preloadImage(src, priority),
    preloadFont: (fontPath: string) => 
      assetOptimizer.preloadFont(fontPath),
    getImageConfig: () => assetOptimizer.getNextImageConfig(),
    stats: () => assetOptimizer.getOptimizationStats()
  };
}

// Componente optimizado de imagen
export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
  quality?: number;
}

// Configuraciones predefinidas para diferentes casos de uso
export const ImagePresets = {
  // Avatar pequeño
  AVATAR_SM: {
    width: 32,
    height: 32,
    quality: 80,
    sizes: '32px'
  },
  
  // Avatar mediano
  AVATAR_MD: {
    width: 64,
    height: 64,
    quality: 80,
    sizes: '64px'
  },
  
  // Imagen de recurso en lista
  RESOURCE_THUMB: {
    width: 120,
    height: 120,
    quality: 75,
    sizes: '(max-width: 640px) 80px, 120px'
  },
  
  // Imagen de recurso en detalle
  RESOURCE_DETAIL: {
    width: 400,
    height: 300,
    quality: 80,
    sizes: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px'
  },
  
  // Logo de la aplicación
  LOGO: {
    width: 200,
    height: 60,
    quality: 90,
    priority: true,
    sizes: '200px'
  }
};

export default assetOptimizer;