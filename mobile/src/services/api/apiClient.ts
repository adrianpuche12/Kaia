// Cliente HTTP base usando fetch
import { ApiResponse, ApiError } from '../../types';
import { secureStorage } from '../storage/secureStorage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api';

console.log('🌐 API_URL configured as:', API_URL);

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    console.log('🔧 ApiClient initialized with baseURL:', this.baseURL);
  }

  private async getHeaders(includeAuth: boolean = true): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = await secureStorage.getAccessToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        code: data.error?.code || 'UNKNOWN_ERROR',
        message: data.error?.message || data.message || 'Error desconocido',
        details: data.error?.details,
      };

      // Si es 401, refrescar token
      if (response.status === 401) {
        // TODO: Implementar refresh token
        await secureStorage.clearTokens();
      }

      throw error;
    }

    return {
      success: data.success ?? true,
      data: data.data,
      message: data.message,
    };
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.append(key, String(params[key]));
        }
      });
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: await this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('📡 POST request to:', url);
    console.log('📦 Request body:', body);

    const response = await fetch(url, {
      method: 'POST',
      headers: await this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    console.log('📥 Response status:', response.status);
    return this.handleResponse<T>(response);
  }

  async put<T>(
    endpoint: string,
    body?: any,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: await this.getHeaders(includeAuth),
      body: body ? JSON.stringify(body) : undefined,
    });

    return this.handleResponse<T>(response);
  }

  async delete<T>(
    endpoint: string,
    includeAuth: boolean = true
  ): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
      headers: await this.getHeaders(includeAuth),
    });

    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient(API_URL);
export default apiClient;
