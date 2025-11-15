import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import {
  AIProvider,
  AIGenerationOptions,
  AIResult,
  ResponseMode,
  AIProviderConfig,
} from '../interfaces/ai.provider.interface';
import { ProviderInfo } from '../interfaces/base.provider.interface';

/**
 * Gemini Provider - Google AI
 * Implementa la interface AIProvider para Google Gemini
 */
export class GeminiProvider implements AIProvider {
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;
  private readonly modelName: string;
  private readonly maxTokens: number;
  private readonly defaultTemperature: number;

  constructor(config: AIProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }

    this.client = new GoogleGenerativeAI(config.apiKey);
    this.modelName = config.model || 'gemini-1.5-pro';
    this.maxTokens = config.maxTokens || 8000;
    this.defaultTemperature = config.temperature || 0.7;

    this.model = this.client.getGenerativeModel({
      model: this.modelName,
    });

    console.log(`[GeminiProvider] Initialized with model: ${this.modelName}`);
  }

  getName(): string {
    return 'gemini';
  }

  async testConnection(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('test');
      return !!result.response.text();
    } catch (error: any) {
      console.error('[GeminiProvider] Connection test failed:', error.message);
      return false;
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'gemini',
      model: this.modelName,
      version: '1.5',
      limits: {
        rateLimit: '60 requests/min',
        maxTokens: this.maxTokens,
        maxRequestSize: 1000000, // 1M tokens context
      },
      cost: {
        per1KTokens: 0.00125, // $1.25 per million tokens
        currency: 'USD',
      },
      features: {
        streaming: true,
        multimodal: true,
        functionCalling: true,
      },
    };
  }

  async generateAnswer(options: AIGenerationOptions): Promise<AIResult> {
    const startTime = Date.now();

    try {
      const temperature = options.temperature ?? this.getTemperatureForMode(options.mode);

      // Construir el prompt completo
      const systemPrompt = options.systemPrompt || this.buildSystemPrompt(options.mode);
      const userPrompt = this.buildUserPrompt(options.prompt, options.context);
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`;

      console.log(`[GeminiProvider] Generating answer with mode: ${options.mode || 'expert'}`);

      // Configurar generación
      const generationConfig = {
        temperature,
        maxOutputTokens: options.maxTokens ?? this.maxTokens,
        topP: options.topP ?? 0.95,
      };

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
        generationConfig,
      });

      const response = result.response;
      const answer = response.text();

      const responseTime = Date.now() - startTime;

      // Estimar tokens (Gemini no devuelve exactamente el conteo)
      const inputTokens = this.estimateTokens(fullPrompt);
      const outputTokens = this.estimateTokens(answer);
      const tokensUsed = {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens,
      };

      const estimatedCost = this.calculateCost(tokensUsed.total);

      console.log(
        `[GeminiProvider] Success! Tokens: ${tokensUsed.total} (est), Time: ${responseTime}ms, Cost: $${estimatedCost.toFixed(4)}`
      );

      return {
        answer,
        provider: 'gemini',
        model: this.modelName,
        mode: options.mode || 'expert',
        tokensUsed,
        responseTime,
        timestamp: new Date(),
        estimatedCost,
        metadata: {
          candidates: response.candidates?.length || 1,
          safetyRatings: response.candidates?.[0]?.safetyRatings,
        },
      };
    } catch (error: any) {
      console.error('[GeminiProvider] Generate error:', error.message);
      throw new Error(`Gemini generation failed: ${error.message}`);
    }
  }

  estimateTokens(text: string): number {
    // Gemini: aproximadamente 1 token = 4 caracteres
    return Math.ceil(text.length / 4);
  }

  getMaxContextTokens(): number {
    return 1000000; // Gemini 1.5 Pro soporta 1M tokens
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = this.client.getGenerativeModel({
        model: 'embedding-001',
      });

      const result = await embeddingModel.embedContent(text);
      return result.embedding.values;
    } catch (error: any) {
      console.error('[GeminiProvider] Embedding error:', error.message);
      throw new Error(`Gemini embedding failed: ${error.message}`);
    }
  }

  /**
   * Construir system prompt basado en modo
   */
  private buildSystemPrompt(mode?: ResponseMode): string {
    const basePrompt = 'You are Kaia, an intelligent voice-powered personal assistant.';

    switch (mode) {
      case 'strict':
        return `${basePrompt}

FUNDAMENTAL RULE: Only answer based on the provided context.
DO NOT use general knowledge. DO NOT invent information.
If the context does not contain the answer, clearly state:
"I don't have information about this in my current context."`;

      case 'enhanced':
        return `${basePrompt}

YOUR APPROACH:
1. PRIORITY 1: Answer based on the provided context
2. PRIORITY 2: If context is incomplete, complement with best practices
3. ALWAYS distinguish between context-based info and complementary knowledge

RESPONSE FORMAT:
[FROM CONTEXT]:
- Information from provided context

[ADDITIONAL INSIGHTS] (only if relevant):
- Best practices that enhance the context`;

      case 'expert':
        return `${basePrompt}

YOUR ROLE:
1. Analyze questions deeply using provided context
2. Identify patterns and implications
3. Provide expert-level recommendations
4. Suggest optimizations when relevant
5. Explain trade-offs and alternatives

Be comprehensive, insightful, and actionable.`;

      case 'creative':
        return `${basePrompt}

YOUR ROLE:
1. Think creatively and explore possibilities
2. Suggest innovative solutions
3. Challenge assumptions when appropriate
4. Provide unique perspectives
5. Be imaginative while staying practical`;

      default:
        return `${basePrompt}\n\nProvide helpful, accurate, and concise responses.`;
    }
  }

  /**
   * Construir user prompt con contexto
   */
  private buildUserPrompt(prompt: string, context?: string): string {
    if (!context) {
      return prompt;
    }

    return `CONTEXT:
${context}

QUESTION:
${prompt}`;
  }

  /**
   * Obtener temperatura según modo
   */
  private getTemperatureForMode(mode?: ResponseMode): number {
    switch (mode) {
      case 'strict':
        return 0.2; // Más preciso
      case 'enhanced':
        return 0.5; // Balanceado
      case 'expert':
        return 0.7; // Más creativo
      case 'creative':
        return 0.9; // Muy creativo
      default:
        return this.defaultTemperature;
    }
  }

  /**
   * Calcular costo estimado
   */
  private calculateCost(totalTokens: number): number {
    const costPer1K = 0.00125; // $1.25 per 1M tokens = $0.00125 per 1K tokens
    return (totalTokens / 1000) * costPer1K;
  }
}
