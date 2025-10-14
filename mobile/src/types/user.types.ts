// Tipos relacionados con usuarios
export interface User {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  phone?: string;
  birthDate?: Date;
  onboardingCompleted?: boolean;
  createdAt: Date;
}

export interface UserPreferences {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  voiceEnabled: boolean;
  voiceLanguage: string;
  notificationsEnabled: boolean;
  defaultReminderMinutes: number;
  theme: 'light' | 'dark' | 'auto';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface UpdateProfileRequest {
  name?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
