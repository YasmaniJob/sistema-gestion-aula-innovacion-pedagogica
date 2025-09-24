import { create } from 'zustand';
import { LoanUser } from '@/domain/types';

interface SessionState {
  user: LoanUser | null;
  isLoading: boolean;
  isAuthenticated: () => boolean;
}

interface SessionActions {
  setUser: (user: LoanUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => void;
}

type SessionStore = SessionState & SessionActions;

export const useSessionStore = create<SessionStore>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: () => !!get().user,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null }),
}));
