import { BaseProvider } from './base.provider.interface';

/**
 * Interface para providers de IA
 * Define el contrato que todos los AI providers deben implementar
 */
export interface AIProvider extends BaseProvider {
  /**
   * Generar respuesta de IA
   */
  generateAnswer(options: AIGenerationOptions): Promise<AIResult>;

  /**
   * Estimar tokens de un texto
   */
  estimateTokens(text: string): number;

  /**
   * Obtener máximo de tokens de contexto
   */
  getMaxContextTokens(): number;

  /**
   * Generar embeddings (opcional)
   */
  generateEmbedding?(text: string): Promise<number[]>;
}

/**
 * Opciones para generación de respuesta
 */
export interface AIGenerationOptions {
  /**
   * Prompt del usuario
   */
  prompt: string;

  /**
   * Contexto adicional (documentación, historial, etc.)
   */
  context?: string;

  /**
   * Modo de respuesta
   */
  mode?: ResponseMode;

  /**
   * System prompt personalizado (opcional)
   */
  systemPrompt?: string;

  /**
   * Temperatura (0-1, creatividad)
   */
  temperature?: number;

  /**
   * Máximo de tokens a generar
   */
  maxTokens?: number;

  /**
   * Top P (núcleo de probabilidad)
   */
  topP?: number;

  /**
   * Penalización de frecuencia
   */
  frequencyPenalty?: number;

  /**
   * Penalización de presencia
   */
  presencePenalty?: number;
}

/**
 * Resultado de generación de IA
 */
export interface AIResult {
  /**
   * Respuesta generada
   */
  answer: string;

  /**
   * Provider que generó la respuesta
   */
  provider: string;

  /**
   * Modelo usado
   */
  model: string;

  /**
   * Modo de respuesta usado
   */
  mode: ResponseMode;

  /**
   * Tokens consumidos
   */
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };

  /**
   * Tiempo de respuesta (ms)
   */
  responseTime: number;

  /**
   * Timestamp
   */
  timestamp: Date;

  /**
   * Costo estimado (USD)
   */
  estimatedCost?: number;

  /**
   * Metadata adicional
   */
  metadata?: Record<string, any>;
}

/**
 * Modos de respuesta
 */
export type ResponseMode = 'strict' | 'enhanced' | 'expert' | 'creative';

/**
 * Configuración base para AI providers
 */
export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  baseURL?: string;
}
