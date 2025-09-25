import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as resourceService from '@/services/resource.service';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';
import type { Resource } from '@/domain/types';

// Mock Supabase client
vi.mock('@/infrastructure/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        order: vi.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  },
}));

const mockResource: Resource = {
  id: '1',
  name: 'Laptop HP Pavilion',
  category: 'Laptops',
  brand: 'HP',
  model: 'Pavilion 15',
  status: 'Disponible',
  stock: 1,
  damageNotes: null,
  attributes: {
    'Procesador': 'Intel Core i5',
    'RAM': '8 GB',
    'Almacenamiento': '256 GB SSD',
  },
  notes: 'En buen estado',
  relatedAccessories: [],
  isAccessory: false,
  compatibleWith: [],
};

// Mock data que simula la respuesta de la base de datos
const mockDbResource = {
  id: '1',
  name: 'Laptop HP Pavilion',
  brand: 'HP',
  model: 'Pavilion 15',
  status: 'Disponible',
  stock: 1,
  damage_notes: null,
  attributes: {
    'Procesador': 'Intel Core i5',
    'RAM': '8 GB',
    'Almacenamiento': '256 GB SSD',
  },
  notes: 'En buen estado',
  categories: { name: 'Laptops' },
  related_accessories: [],
  is_accessory: false,
  compatible_with: [],
};

// Mock para el resultado transformado de getAllResources
const mockAllResourcesResult = {
  id: '1',
  name: 'Laptop HP Pavilion',
  brand: 'HP',
  model: 'Pavilion 15',
  status: 'Disponible',
  stock: 1,
  damageNotes: null,
  category: 'Laptops',
  attributes: {
    'Procesador': 'Intel Core i5',
    'RAM': '8 GB',
    'Almacenamiento': '256 GB SSD',
  },
  notes: 'En buen estado',
};

describe('ResourceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllResources', () => {
    it('debe obtener todos los recursos correctamente', async () => {
      const mockDbResources = [mockDbResource];
      const mockSelect = vi.fn().mockResolvedValue({
        data: mockDbResources,
        error: null,
      });
      
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await resourceService.getAllResources();
      
      expect(supabase.from).toHaveBeenCalledWith('resources');
      expect(mockSelect).toHaveBeenCalledWith(`
        *,
        categories ( name )
    `);
      expect(result).toEqual([mockAllResourcesResult]);
    });

    it('debe manejar errores al obtener recursos', async () => {
      const mockError = new Error('Database error');
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      });
      
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await resourceService.getAllResources();
      expect(result).toEqual([]);
    });
  });



  describe('addResource', () => {
    it('debe crear un recurso correctamente', async () => {
      const newResourceData = {
        category: 'Tablets',
        brand: 'Samsung',
        model: 'Galaxy Tab S8',
        notes: 'Nuevo',
        attributes: {
          'Pantalla': '11 pulgadas',
          'Almacenamiento': '128 GB',
        },
        quantity: 1,
      };
      
      const mockDbResources = [{
        id: '2',
        name: 'Tablet 1',
        brand: 'Samsung',
        model: 'Galaxy Tab S8',
        status: 'disponible',
        stock: 1,
        damage_notes: null,
        attributes: {
          'Pantalla': '11 pulgadas',
          'Almacenamiento': '128 GB',
        },
        notes: 'Nuevo',
        category_id: 'cat-1',
      }];
      
      // Mock para obtener categoría
       const mockCategorySingle = vi.fn().mockResolvedValue({
         data: { id: 'cat-1', name: 'Tablets' },
         error: null,
       });
       const mockCategoryEq = vi.fn().mockReturnValue({
         single: mockCategorySingle,
       });
       const mockCategorySelect = vi.fn().mockReturnValue({
         eq: mockCategoryEq,
       });
      
      // Mock para obtener último número
       const mockResourcesOrder = vi.fn().mockResolvedValue({
         data: [],
         error: null,
       });
       const mockResourcesEq = vi.fn().mockReturnValue({
         order: mockResourcesOrder,
       });
       const mockResourcesSelect = vi.fn().mockReturnValue({
         eq: mockResourcesEq,
       });
      
      // Mock para insertar
      const mockInsertSelect = vi.fn().mockResolvedValue({
        data: mockDbResources,
        error: null,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockInsertSelect,
      });
      
      (supabaseAdmin.from as any).mockImplementation((table: string) => {
         if (table === 'categories') {
           return { select: mockCategorySelect };
         }
         if (table === 'resources') {
           return {
             select: mockResourcesSelect,
             insert: mockInsert,
           };
         }
       });

      const result = await resourceService.addResource(newResourceData);
      
      expect(result).toHaveLength(1);
      expect(result?.[0]).toMatchObject({
        name: 'Tablet 1',
        brand: 'Samsung',
        model: 'Galaxy Tab S8',
        category: 'Tablets',
      });
    });

    it('debe manejar errores al crear recurso', async () => {
      const newResourceData = {
        category: 'Tablets',
        brand: 'Samsung',
        model: 'Galaxy Tab S8',
        notes: 'Nuevo',
        attributes: {},
        quantity: 1,
      };
      
      const mockError = new Error('Validation error');
       const mockCategorySingle = vi.fn().mockResolvedValue({
         data: null,
         error: mockError,
       });
       const mockCategoryEq = vi.fn().mockReturnValue({
         single: mockCategorySingle,
       });
       const mockCategorySelect = vi.fn().mockReturnValue({
         eq: mockCategoryEq,
       });
      
      (supabaseAdmin.from as any).mockReturnValue({
         select: mockCategorySelect,
       });

      const result = await resourceService.addResource(newResourceData);
      expect(result).toBeNull();
    });
  });

  describe('updateResource', () => {
    it('debe actualizar un recurso correctamente', async () => {
      const updates = {
        name: 'Laptop HP Pavilion Updated',
        notes: 'Requiere revisión técnica',
      };
      
      const updatedDbResource = { ...mockDbResource, ...updates };
      const expectedResource = { ...mockResource, ...updates };
      
      const mockSingle = vi.fn().mockResolvedValue({
        data: updatedDbResource,
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockEq = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      const mockUpdate = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await resourceService.updateResource('1', updates);
      
      expect(supabase.from).toHaveBeenCalledWith('resources');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updatedDbResource);
    });
  });

  describe('deleteResource', () => {
    it('debe eliminar un recurso correctamente', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: null,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      await resourceService.deleteResource('1');
      
      expect(supabase.from).toHaveBeenCalledWith('resources');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('debe manejar errores al eliminar recurso', async () => {
      const mockError = new Error('Delete error');
      const mockEq = vi.fn().mockResolvedValue({
        error: mockError,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      (supabase.from as any).mockReturnValue({
        delete: mockDelete,
      });

      const result = await resourceService.deleteResource('1');
      expect(result).toBe(false);
    });
  });

  describe('getResourcesByCategory', () => {
    it('debe obtener recursos por categoría correctamente', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockDbResource],
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await resourceService.getResourcesByCategory('Laptops');
      
      expect(supabase.from).toHaveBeenCalledWith('resources');
      expect(mockSelect).toHaveBeenCalledWith(`
      id,
      name,
      brand,
      model,
      status,
      stock,
      damage_notes,
      attributes,
      notes,
      categories ( name )
    `);
      expect(mockEq).toHaveBeenCalledWith('categories.name', 'Laptops');
      expect(result).toEqual([mockResource]);
    });
  });

  describe('getAvailableResources', () => {
    it('debe obtener solo recursos disponibles', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: [mockDbResource],
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await resourceService.getAvailableResources();
      
      expect(supabase.from).toHaveBeenCalledWith('resources');
      expect(mockSelect).toHaveBeenCalledWith(`
      id,
      name,
      brand,
      model,
      status,
      stock,
      damage_notes,
      attributes,
      notes,
      categories ( name )
    `);
      expect(mockEq).toHaveBeenCalledWith('status', 'Disponible');
      expect(result).toEqual([mockResource]);
    });
  });
});