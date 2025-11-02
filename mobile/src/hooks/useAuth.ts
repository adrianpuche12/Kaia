// Hook personalizado para autenticación
import { useStore } from '../store/store';
import { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../types';

export const useAuth = () => {
  // ✅ Suscripciones simples - solo valores primitivos que cambian
  const user = useStore(state => state.user);
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const isLoading = useStore(state => state.authLoading);
  const error = useStore(state => state.authError);

  // ✅ Funciones directamente del store (son estables, no cambian)
  const login = useStore(state => state.login);
  const register = useStore(state => state.register);
  const logout = useStore(state => state.logout);
  const refreshUser = useStore(state => state.refreshUser);
  const updateProfile = useStore(state => state.updateProfile);
  const clearError = useStore(state => state.clearAuthError);
  const setUser = useStore(state => state.setUser);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    refreshUser,
    updateProfile,
    clearError,
    setUser,
  };
};

export default useAuth;
