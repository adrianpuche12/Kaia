// Funciones helper generales
import bcrypt from 'bcryptjs';
import { ApiResponse, ApiError, PaginatedResponse } from '../types';
import { HTTP_STATUS, ERROR_CODES } from '../config/constants';

/**
 * Hashea un password con bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compara un password con su hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Genera una respuesta de éxito estandarizada
 */
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    ...(message && { message }),
  };
}

/**
 * Genera una respuesta de error estandarizada
 */
export function errorResponse(code: string, message: string, details?: any): ApiResponse {
  const error: ApiError = {
    code,
    message,
    ...(details && { details }),
  };

  return {
    success: false,
    error,
  };
}

/**
 * Genera una respuesta paginada
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<PaginatedResponse<T>> {
  return successResponse({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

/**
 * Calcula offset para paginación
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Valida y normaliza parámetros de paginación
 */
export function normalizePagination(page?: string | number, limit?: string | number) {
  const DEFAULT_PAGE = 1;
  const DEFAULT_LIMIT = 50;
  const MAX_LIMIT = 100;

  const parsedPage = typeof page === 'string' ? parseInt(page, 10) : page;
  const parsedLimit = typeof limit === 'string' ? parseInt(limit, 10) : limit;

  const normalizedPage = parsedPage && parsedPage > 0 ? parsedPage : DEFAULT_PAGE;
  const normalizedLimit = parsedLimit && parsedLimit > 0
    ? Math.min(parsedLimit, MAX_LIMIT)
    : DEFAULT_LIMIT;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset: calculateOffset(normalizedPage, normalizedLimit),
  };
}

/**
 * Delay (para testing, rate limiting, etc.)
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Genera un ID aleatorio simple (para uso temporal)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Trunca un string a longitud máxima
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitiza un string para evitar XSS básico
 */
export function sanitizeString(str: string): string {
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Parsea JSON de forma segura
 */
export function safeJSONParse<T = any>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
}

/**
 * Convierte objeto a JSON string de forma segura
 */
export function safeJSONStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}

/**
 * Calcula distancia entre dos coordenadas (fórmula de Haversine)
 * Retorna distancia en kilómetros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radio de la Tierra en km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Formatea duración en ms a string legible
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
  return `${(ms / 3600000).toFixed(2)}h`;
}

/**
 * Extrae información del User-Agent
 */
export function parseUserAgent(userAgent: string) {
  const isMobile = /mobile/i.test(userAgent);
  const isAndroid = /android/i.test(userAgent);
  const isIOS = /iphone|ipad|ipod/i.test(userAgent);

  return {
    isMobile,
    isAndroid,
    isIOS,
    platform: isAndroid ? 'android' : isIOS ? 'ios' : 'web',
  };
}

export default {
  hashPassword,
  comparePassword,
  successResponse,
  errorResponse,
  paginatedResponse,
  calculateOffset,
  normalizePagination,
  delay,
  generateId,
  truncate,
  sanitizeString,
  safeJSONParse,
  safeJSONStringify,
  calculateDistance,
  formatDuration,
  parseUserAgent,
};
