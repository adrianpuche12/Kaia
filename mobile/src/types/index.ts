// Exportación centralizada de tipos
export * from './user.types';
export * from './event.types';
export * from './alarm.types';
export * from './message.types';
export * from './mcp.types';
export * from './location.types';
export * from './voice.types';

// Tipos de API comunes
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
