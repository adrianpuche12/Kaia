// Slice de autenticación
import { StateCreator } from 'zustand';
import { User, LoginRequest, RegisterRequest } from '../../types';
import authAPI from '../../services/api/authAPI';

export interface AuthSlice {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  authError: string | null;

  login: (data: LoginRequest) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterRequest) => Promise<{ success: boolean; error?: string; user?: User }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  setUser: (user: User | null) => void;
  setAuthError: (error: string | null) => void;
  clearAuthError: () => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  authLoading: false,
  authError: null,

  login: async (data: LoginRequest) => {
    set({ authLoading: true, authError: null });
    try {
      const response = await authAPI.login(data);
      set({
        user: response.user,
        isAuthenticated: true,
        authLoading: false,
      });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Error al iniciar sesión';
      set({
        authError: errorMessage,
        authLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  register: async (data: RegisterRequest) => {
    console.log('🔍 register called - authAPI:', authAPI);
    console.log('🔍 register called - authAPI.register:', authAPI?.register);
    set({ authLoading: true, authError: null });
    try {
      const response = await authAPI.register(data);
      // Set user AND isAuthenticated - RootNavigator will handle onboarding redirect
      set({
        user: response.user,
        isAuthenticated: true,
        authLoading: false,
      });
      return { success: true, user: response.user };
    } catch (error: any) {
      console.error('❌ Register error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      const errorMessage = error.message || 'Error al registrarse';
      set({
        authError: errorMessage,
        authLoading: false,
      });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    set({ authLoading: true });
    try {
      await authAPI.logout();
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
        authError: null,
      });
    } catch (error: any) {
      set({ authLoading: false });
      throw error;
    }
  },

  refreshUser: async () => {
    set({ authLoading: true });
    try {
      const user = await authAPI.getProfile();
      set({
        user,
        isAuthenticated: true,
        authLoading: false,
      });
    } catch (error: any) {
      set({
        user: null,
        isAuthenticated: false,
        authLoading: false,
      });
    }
  },

  updateProfile: async (data: any) => {
    set({ authLoading: true, authError: null });
    try {
      const user = await authAPI.updateProfile(data);
      set({
        user,
        authLoading: false,
      });
    } catch (error: any) {
      set({
        authError: error.message || 'Error al actualizar perfil',
        authLoading: false,
      });
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user, isAuthenticated: !!user });
  },

  setAuthError: (error: string | null) => {
    set({ authError: error });
  },

  clearAuthError: () => {
    set({ authError: null });
  },
});
