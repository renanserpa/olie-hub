import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'atendimento' | 'producao';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (requiredRoles: UserRole[]) => boolean;
}

// Mock login - replace with real auth later
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: async (email: string, password: string) => {
        // Mock authentication
        const mockUser: User = {
          id: '1',
          name: 'Admin Olie',
          email,
          role: 'admin',
        };
        
        set({ user: mockUser, isAuthenticated: true });
      },
      
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      
      hasPermission: (requiredRoles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return requiredRoles.includes(user.role);
      },
    }),
    {
      name: 'olie-auth-storage',
    }
  )
);
