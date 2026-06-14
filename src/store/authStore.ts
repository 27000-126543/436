import { create } from 'zustand';
import type { User, UserRole } from '../types';
import { mockUsers } from '../mock/data';

interface AuthState {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  login: (username: string, role: UserRole) => boolean;
  logout: () => void;
  switchRole: (role: UserRole) => boolean;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isAuthenticated: false,
  users: mockUsers,

  login: (username, role) => {
    const user = mockUsers.find(u => u.username === username && u.role === role);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      localStorage.setItem('currentUser', JSON.stringify(user));
      return true;
    }
    const fallback = mockUsers.find(u => u.role === role);
    if (fallback) {
      set({ currentUser: fallback, isAuthenticated: true });
      localStorage.setItem('currentUser', JSON.stringify(fallback));
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
    localStorage.removeItem('currentUser');
  },

  switchRole: (role) => {
    const currentUser = get().currentUser;
    if (!currentUser) return false;
    const newUser = mockUsers.find(u => u.role === role);
    if (newUser) {
      set({ currentUser: newUser });
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      return true;
    }
    return false;
  },

  updateUser: (updates) => {
    const currentUser = get().currentUser;
    if (currentUser) {
      const updated = { ...currentUser, ...updates };
      set({ currentUser: updated });
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  },
}));

const storedUser = localStorage.getItem('currentUser');
if (storedUser) {
  try {
    const user = JSON.parse(storedUser);
    useAuthStore.setState({ currentUser: user, isAuthenticated: true });
  } catch {}
}
