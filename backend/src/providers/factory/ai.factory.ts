import { AIProvider, AIGenerationOptions, AIResult } from '../interfaces/ai.provider.interface';
import { ClaudeProvider } from '../ai/claude.provider';
import { GeminiProvider } from '../ai/gemini.provider';

/**
 * AI Provider Factory
 * Gestiona múltiples providers de IA con fallback automático
 */
export class AIProviderFactory {
  private providers: Map<string, AIProvider> = new Map();
  private primaryProvider: AIProvider;
  private fallbackProvider: AIProvider | null = null;
  private fallbackEnabled: boolean;

  constructor() {
    this.initializeProviders();
    this.fallbackEnabled = process.env.AI_FALLBACK_ENABLED === 'true';

    // Configurar provider primario
    const primaryName = process.env.AI_PROVIDER || 'claude';
    this.primaryProvider = this.getProviderByName(primaryName);

    // Configurar fallback si está habilitado
    if (this.fallbackEnabled) {
      const fallbackName = process.env.AI_FALLBACK_PROVIDER || 'gemini';
      this.fallbackProvider = this.getProviderByName(fallbackName);
    }

    console.log(`[AIProviderFactory] Primary: ${this.primaryProvider.getName()}`);
    if (this.fallbackProvider) {
      console.log(`[AIProviderFactory] Fallback: ${this.fallbackProvider.getName()}`);
    }
  }

  /**
   * Inicializar todos los providers disponibles
   */
  private initializeProviders(): void {
    // Claude Provider
    if (process.env.CLAUDE_API_KEY) {
      try {
        const claude = new ClaudeProvider({
          apiKey: process.env.CLAUDE_API_KEY,
          model: process.env.CLAUDE_MODEL,
          maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '8000'),
          temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),
        });
        this.providers.set('claude', claude);
        console.log('[AIProviderFactory] Claude provider registered');
      } catch (error: any) {
        console.error('[AIProviderFactory] Failed to initialize Claude:', error.message);
      }
    }

    // Gemini Provider
    if (process.env.GEMINI_API_KEY) {
      try {
        const gemini = new GeminiProvider({
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_MODEL,
          maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '8000'),
          temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
        });
        this.providers.set('gemini', gemini);
        console.log('[AIProviderFactory] Gemini provider registered');
      } catch (error: any) {
        console.error('[AIProviderFactory] Failed to initialize Gemini:', error.message);
      }
    }

    if (this.providers.size === 0) {
      throw new Error('No AI providers configured. Please set up at least one provider.');
    }
  }

  /**
   * Generar respuesta con fallback automático
   */
  async generateAnswer(options: AIGenerationOptions): Promise<AIResult> {
    const mode = options.mode || (process.env.AI_RESPONSE_MODE as any) || 'expert';
    const optionsWithMode = { ...options, mode };

    console.log(`[AIProviderFactory] Generating answer with ${this.primaryProvider.getName()} (mode: ${mode})`);

    try {
      const result = await this.primaryProvider.generateAnswer(optionsWithMode);
      console.log(`[AIProviderFactory] Primary provider success`);
      return result;
    } catch (primaryError: any) {
      console.error(`[AIProviderFactory] Primary provider failed:`, primaryError.message);

      // Intentar fallback si está habilitado
      if (this.fallbackEnabled && this.fallbackProvider) {
        console.log(`[AIProviderFactory] Trying fallback: ${this.fallbackProvider.getName()}`);
        try {
          const result = await this.fallbackProvider.generateAnswer(optionsWithMode);
          console.log(`[AIProviderFactory] Fallback provider success`);
          return result;
        } catch (fallbackError: any) {
          console.error(`[AIProviderFactory] Fallback provider also failed:`, fallbackError.message);
          throw new Error(
            `All AI providers failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`
          );
        }
      }

      // Si no hay fallback, lanzar el error original
      throw primaryError;
    }
  }

  /**
   * Test de conectividad de todos los providers
   */
  async testAllProviders(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of this.providers) {
      console.log(`[AIProviderFactory] Testing ${name}...`);
      results[name] = await provider.testConnection();
    }

    return results;
  }

  /**
   * Obtener información de todos los providers
   */
  getAllProvidersInfo() {
    const info: Record<string, any> = {};

    for (const [name, provider] of this.providers) {
      info[name] = provider.getProviderInfo();
    }

    return info;
  }

  /**
   * Obtener provider actual (primario)
   */
  getCurrentProvider(): AIProvider {
    return this.primaryProvider;
  }

  /**
   * Obtener provider por nombre
   */
  getProvider(name: string): AIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Cambiar provider primario en runtime (para testing)
   */
  switchPrimaryProvider(name: string): void {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider '${name}' not found`);
    }
    this.primaryProvider = provider;
    console.log(`[AIProviderFactory] Switched primary provider to: ${name}`);
  }

  /**
   * Obtener provider por nombre (privado)
   */
  private getProviderByName(name: string): AIProvider {
    const provider = this.providers.get(name.toLowerCase());
    if (!provider) {
      console.warn(`[AIProviderFactory] Provider '${name}' not found, using first available`);
      const firstProvider = this.providers.values().next().value;
      if (!firstProvider) {
        throw new Error('No AI providers available');
      }
      return firstProvider;
    }
    return provider;
  }

  /**
   * Estimar tokens de un texto usando el provider actual
   */
  estimateTokens(text: string): number {
    return this.primaryProvider.estimateTokens(text);
  }

  /**
   * Obtener máximo de tokens de contexto del provider actual
   */
  getMaxContextTokens(): number {
    return this.primaryProvider.getMaxContextTokens();
  }
}

/**
 * Singleton - Instance única de AIProviderFactory
 */
let aiFactoryInstance: AIProviderFactory | null = null;

export function getAIProviderFactory(): AIProviderFactory {
  if (!aiFactoryInstance) {
    aiFactoryInstance = new AIProviderFactory();
  }
  return aiFactoryInstance;
}

/**
 * Reset factory (útil para testing)
 */
export function resetAIProviderFactory(): void {
  aiFactoryInstance = null;
}
