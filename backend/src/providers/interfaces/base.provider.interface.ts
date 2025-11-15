/**
 * Interface base para todos los providers
 * Garantiza métodos comunes de health check y metadata
 */
export interface BaseProvider {
  /**
   * Nombre del provider (ej: 'claude', 'gemini')
   */
  getName(): string;

  /**
   * Test de conectividad con el servicio
   */
  testConnection(): Promise<boolean>;

  /**
   * Información del provider
   */
  getProviderInfo(): ProviderInfo;
}

export interface ProviderInfo {
  name: string;
  model?: string;
  version?: string;
  limits?: {
    rateLimit?: string;
    maxTokens?: number;
    maxRequestSize?: number;
  };
  cost?: {
    perToken?: number;
    per1KTokens?: number;
    currency?: string;
  };
  features?: {
    streaming?: boolean;
    multimodal?: boolean;
    functionCalling?: boolean;
  };
}
