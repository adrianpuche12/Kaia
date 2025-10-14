// API de usuarios - Perfil y preferencias
import { apiClient } from './apiClient';

export interface OnboardingData {
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  birthDate?: string;
  interests?: string[];
  favoriteCategories?: string[];
  notificationsEnabled?: boolean;
  locationEnabled?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  birthDate?: string;
  avatar?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

const userAPI = {
  // Completar onboarding
  completeOnboarding: async (data: OnboardingData) => {
    const response = await apiClient.post('/users/onboarding', data);
    return response;
  },

  // Obtener perfil
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Actualizar perfil
  updateProfile: async (data: Partial<UserProfile>) => {
    const response = await apiClient.put('/users/profile', data);
    return response.data;
  },

  // Actualizar preferencias
  updatePreferences: async (preferences: any) => {
    const response = await apiClient.put('/users/preferences', preferences);
    return response.data;
  },
};

export default userAPI;
