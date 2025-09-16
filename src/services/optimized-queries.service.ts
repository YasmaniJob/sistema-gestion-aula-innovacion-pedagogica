import { supabaseAdmin } from '@/infrastructure/supabase/client';
import type { Loan, Resource, Reservation, LoanUser, Meeting } from '@/domain/types';

// Cache en memoria para reducir consultas
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttlMinutes = 5) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }
  
  get(key: string) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  invalidate(pattern?: string) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

const queryCache = new QueryCache();

// Optimizaciones para queries de Supabase
export class OptimizedQueriesService {
  
  // Obtener solo los campos necesarios para listas
  static async getLoansOptimized(page = 1, limit = 20, filters?: {
    status?: string;
    userId?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const cacheKey = `loans_${page}_${limit}_${JSON.stringify(filters)}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    let query = supabaseAdmin
      .from('loans')
      .select(`
        id,
        status,
        loan_date,
        return_date,
        notes,
        approved_by,
        user:user_id(
          id,
          name,
          email,
          role
        ),
        resources:loan_resources(
          resource:resource_id(
            id,
            name,
            category
          )
        )
      `)
      .order('loan_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Aplicar filtros solo si son necesarios
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters?.dateRange) {
      query = query
        .gte('loan_date', filters.dateRange.start.toISOString())
        .lte('loan_date', filters.dateRange.end.toISOString());
    }

    const { data, error } = await query;
    if (error) throw error;

    queryCache.set(cacheKey, data, 2); // Cache por 2 minutos
    return data;
  }

  // Obtener recursos con paginación y filtros optimizados
  static async getResourcesOptimized(categoryName?: string, page = 1, limit = 50) {
    const cacheKey = `resources_${categoryName || 'all'}_${page}_${limit}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    let query = supabaseAdmin
      .from('resources')
      .select(`
        id,
        name,
        category,
        status,
        stock,
        notes
      `)
      .order('name')
      .range((page - 1) * limit, page * limit - 1);

    if (categoryName) {
      query = query.eq('category', categoryName);
    }

    const { data, error } = await query;
    if (error) throw error;

    queryCache.set(cacheKey, data, 10); // Cache por 10 minutos
    return data;
  }

  // Obtener reservaciones con menos datos
  static async getReservationsOptimized(filters?: {
    status?: string;
    dateRange?: { start: Date; end: Date };
  }) {
    const cacheKey = `reservations_${JSON.stringify(filters)}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    let query = supabaseAdmin
      .from('reservations')
      .select(`
        id,
        date,
        start_time,
        end_time,
        status,
        purpose,
        user:user_id(
          id,
          name,
          role
        ),
        grade:grade_id(
          id,
          name
        ),
        section:section_id(
          id,
          name
        )
      `)
      .order('date', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.dateRange) {
      query = query
        .gte('date', filters.dateRange.start.toISOString().split('T')[0])
        .lte('date', filters.dateRange.end.toISOString().split('T')[0]);
    }

    const { data, error } = await query;
    if (error) throw error;

    queryCache.set(cacheKey, data, 3); // Cache por 3 minutos
    return data;
  }

  // Obtener usuarios con campos mínimos para selectores
  static async getUsersForSelector() {
    const cacheKey = 'users_selector';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, dni')
      .order('name');

    if (error) throw error;

    queryCache.set(cacheKey, data, 15); // Cache por 15 minutos
    return data;
  }

  // Obtener estadísticas agregadas sin traer todos los datos
  static async getDashboardStats() {
    const cacheKey = 'dashboard_stats';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const [loansCount, resourcesCount, reservationsCount, usersCount] = await Promise.all([
      supabaseAdmin
        .from('loans')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('resources')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('reservations')
        .select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('users')
        .select('id', { count: 'exact', head: true })
    ]);

    const stats = {
      totalLoans: loansCount.count || 0,
      totalResources: resourcesCount.count || 0,
      totalReservations: reservationsCount.count || 0,
      totalUsers: usersCount.count || 0
    };

    queryCache.set(cacheKey, stats, 30); // Cache por 30 minutos
    return stats;
  }

  // Obtener solo los préstamos activos (más eficiente)
  static async getActiveLoans() {
    const cacheKey = 'active_loans';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('loans')
      .select(`
        id,
        loan_date,
        return_date,
        user:user_id(name),
        resources:loan_resources(
          resource:resource_id(name)
        )
      `)
      .eq('status', 'active')
      .order('loan_date', { ascending: false })
      .limit(50); // Limitar a 50 préstamos activos

    if (error) throw error;

    queryCache.set(cacheKey, data, 5); // Cache por 5 minutos
    return data;
  }

  // Búsqueda optimizada con índices
  static async searchResources(searchTerm: string, categoryName?: string) {
    if (!searchTerm || searchTerm.length < 2) return [];

    const cacheKey = `search_${searchTerm}_${categoryName || 'all'}`;
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    let query = supabaseAdmin
      .from('resources')
      .select('id, name, category, status, stock')
      .ilike('name', `%${searchTerm}%`)
      .limit(20); // Limitar resultados de búsqueda

    if (categoryName) {
      query = query.eq('category', categoryName);
    }

    const { data, error } = await query;
    if (error) throw error;

    queryCache.set(cacheKey, data, 5); // Cache por 5 minutos
    return data;
  }

  // Invalidar cache cuando hay cambios
  static invalidateCache(pattern?: string) {
    queryCache.invalidate(pattern);
  }

  // Obtener configuración de la app (cacheable por mucho tiempo)
  static async getAppSettings() {
    const cacheKey = 'app_settings';
    const cached = queryCache.get(cacheKey);
    if (cached) return cached;

    const { data, error } = await supabaseAdmin
      .from('app_settings')
      .select('*')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    const settings = data || {
      app_name: 'Aula Ágil',
      school_name: 'Mi Institución Educativa',
      logo_url: '',
      primary_color: '#673ab7',
      is_public_registration_enabled: false
    };

    queryCache.set(cacheKey, settings, 60); // Cache por 1 hora
    return settings;
  }

  // Batch operations para reducir llamadas
  static async batchUpdateResourceStatus(updates: Array<{ id: string; status: string; notes?: string }>) {
    const promises = updates.map(update => 
      supabaseAdmin
        .from('resources')
        .update({ 
          status: update.status, 
          notes: update.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', update.id)
    );

    const results = await Promise.allSettled(promises);
    
    // Invalidar cache relacionado
    this.invalidateCache('resources');
    
    return results;
  }
}

// Configuración para reducir conexiones
export const connectionConfig = {
  // Reducir el pool de conexiones
  poolSize: 3,
  // Timeout más corto
  timeout: 10000,
  // Retry policy más conservador
  retryAttempts: 2,
  retryDelay: 1000
};

// Helper para queries con timeout
export async function queryWithTimeout<T>(queryPromise: Promise<T>, timeoutMs = 10000): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs);
  });

  return Promise.race([queryPromise, timeoutPromise]);
}

export { queryCache };