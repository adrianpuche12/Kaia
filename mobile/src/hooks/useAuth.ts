// Hook personalizado para autenticación
import { useStore } from '../store/store';
import { LoginRequest, RegisterRequest, UpdateProfileRequest } from '../types';

export const useAuth = () => {
  // Obtener propiedades individuales del store
  const user = useStore((state) => state.user);
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const isLoading = useStore((state) => state.authLoading);
  const error = useStore((state) => state.authError);

  // Obtener funciones del store (estas no cambian)
  const loginFn = useStore((state) => state.login);
  const registerFn = useStore((state) => state.register);
  const logoutFn = useStore((state) => state.logout);
  const refreshUserFn = useStore((state) => state.refreshUser);
  const updateProfileFn = useStore((state) => state.updateProfile);
  const clearErrorFn = useStore((state) => state.clearAuthError);
  const setUserFn = useStore((state) => state.setUser);

  // Debug log
  console.log('useAuth hook - registerFn:', typeof registerFn, registerFn);

  const login = async (data: LoginRequest) => {
    try {
      if (!loginFn) throw new Error('Login function not available');
      const result = await loginFn(data);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const register = async (data: RegisterRequest) => {
    try {
      if (!registerFn) throw new Error('Register function not available');
      const result = await registerFn(data);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await logoutFn();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateProfile = async (data: UpdateProfileRequest) => {
    try {
      await updateProfileFn(data);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const returnValue = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    refreshUser: refreshUserFn,
    clearError: clearErrorFn,
    setUser: setUserFn,
  };

  console.log('✅ useAuth returning:', Object.keys(returnValue));
  console.log('✅ register function:', typeof register);

  return returnValue;
};

export default useAuth;
