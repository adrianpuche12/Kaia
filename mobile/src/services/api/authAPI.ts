// API de autenticación
import { apiClient } from './apiClient';
import {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  UserPreferences,
  UpdateProfileRequest,
  ChangePasswordRequest,
  AuthTokens,
} from '../../types';
import { secureStorage } from '../storage/secureStorage';

class AuthAPI {
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, false);

    if (response.data) {
      await this.saveAuthData(response.data);
    }

    return response.data!;
  }

  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, false);

    if (response.data) {
      await this.saveAuthData(response.data);
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    await secureStorage.clearAll();
  }

  async refreshToken(): Promise<AuthTokens> {
    const refreshToken = await secureStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ tokens: AuthTokens }>(
      '/auth/refresh',
      { refreshToken },
      false
    );

    if (response.data?.tokens) {
      await secureStorage.saveAccessToken(response.data.tokens.accessToken);
      await secureStorage.saveRefreshToken(response.data.tokens.refreshToken);
    }

    return response.data!.tokens;
  }

  async getProfile(): Promise<User> {
    const response = await apiClient.get<{ user: User }>('/auth/profile');
    return response.data!.user;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await apiClient.put<{ user: User }>('/auth/profile', data);

    if (response.data?.user) {
      await secureStorage.saveUser(response.data.user);
    }

    return response.data!.user;
  }

  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  }

  async deleteAccount(): Promise<void> {
    await apiClient.delete('/auth/account');
    await this.logout();
  }

  private async saveAuthData(authResponse: AuthResponse): Promise<void> {
    await secureStorage.saveAccessToken(authResponse.tokens.accessToken);
    await secureStorage.saveRefreshToken(authResponse.tokens.refreshToken);
    await secureStorage.saveUser(authResponse.user);
  }

  async isAuthenticated(): Promise<boolean> {
    const token = await secureStorage.getAccessToken();
    return !!token;
  }

  async getCurrentUser(): Promise<User | null> {
    return await secureStorage.getUser();
  }
}

export const authAPI = new AuthAPI();
export default authAPI;
