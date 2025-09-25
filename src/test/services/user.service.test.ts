import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllUsers, addUser, updateUser, deleteUser, addMultipleUsers } from '@/services/user.service';
import { supabase, supabaseAdmin } from '@/infrastructure/supabase/client';
import type { LoanUser } from '@/domain/types';

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
    auth: {
      admin: {
        deleteUser: vi.fn().mockResolvedValue({ error: null })
      }
    },
    from: vi.fn(() => ({
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    }))
  }
}));

const mockUser: LoanUser = {
  id: '1',
  name: 'Juan Pérez',
  email: 'juan@example.com',
  role: 'Docente',
};

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllUsers', () => {
    it('debe obtener todos los usuarios correctamente', async () => {
      const mockUsers = [mockUser];
      const mockSelect = vi.fn().mockResolvedValue({
        data: mockUsers,
        error: null,
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getAllUsers();
      
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result).toEqual(mockUsers);
    });

    it('debe manejar errores al obtener usuarios', async () => {
      const mockSelect = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: mockSelect,
      } as any);

      const result = await getAllUsers();
      expect(result).toEqual([]);
    });
  });

  describe('addUser', () => {
    it('debe crear un usuario correctamente', async () => {
      const newUser = {
        name: 'María García',
        email: 'maria@example.com',
        role: 'Docente' as const,
      };
      
      const createdUser = { ...newUser, id: '2' };
      
      const mockSingle = vi.fn().mockResolvedValue({
        data: createdUser,
        error: null,
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await addUser(newUser);
      
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockInsert).toHaveBeenCalledWith([newUser]);
      expect(result).toEqual(createdUser);
    });

    it('debe manejar errores al crear usuario', async () => {
      const newUser = {
        name: 'Error User',
        email: 'error@example.com',
        role: 'Docente' as const,
      };
      
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Validation error' },
      });
      const mockSelect = vi.fn().mockReturnValue({
        single: mockSingle,
      });
      const mockInsert = vi.fn().mockReturnValue({
        select: mockSelect,
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: mockInsert,
      } as any);

      const result = await addUser(newUser);
      expect(result).toBeNull();
    });
  });

  describe('updateUser', () => {
    it('debe actualizar un usuario correctamente', async () => {
      const updates = {
        name: 'Juan Carlos Pérez',
        email: 'juan.carlos@example.com',
      };
      
      const updatedUser = { ...mockUser, ...updates };
      
      const mockSingle = vi.fn().mockResolvedValue({
        data: updatedUser,
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

      const result = await updateUser('1', updates);
      
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockUpdate).toHaveBeenCalledWith(updates);
      expect(mockEq).toHaveBeenCalledWith('id', '1');
      expect(result).toEqual(updatedUser);
    });
  });

  describe('deleteUser', () => {
    it('debe eliminar un usuario correctamente', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);
      
      vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValue({ error: null });

      const result = await deleteUser('1');
      
      expect(result).toBe(true);
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith('id', '1');
    });

    it('debe manejar errores al eliminar usuario', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Delete error' },
      });
      const mockDelete = vi.fn().mockReturnValue({
        eq: mockEq,
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        delete: mockDelete,
      } as any);
      
      vi.mocked(supabaseAdmin.auth.admin.deleteUser).mockResolvedValue({ error: null });

      const result = await deleteUser('1');
      expect(result).toBe(false);
    });
  });
});