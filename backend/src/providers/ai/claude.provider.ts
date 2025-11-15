import Anthropic from '@anthropic-ai/sdk';
import {
  AIProvider,
  AIGenerationOptions,
  AIResult,
  ResponseMode,
  AIProviderConfig,
} from '../interfaces/ai.provider.interface';
import { ProviderInfo } from '../interfaces/base.provider.interface';

/**
 * Claude Provider - Anthropic API
 * Implementa la interface AIProvider para Claude AI
 */
export class ClaudeProvider implements AIProvider {
  private client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly defaultTemperature: number;

  constructor(config: AIProviderConfig) {
    if (!config.apiKey) {
      throw new Error('Claude API key is required');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });

    this.model = config.model || 'claude-3-5-sonnet-20241022';
    this.maxTokens = config.maxTokens || 8000;
    this.defaultTemperature = config.temperature || 0.7;

    console.log(`[ClaudeProvider] Initialized with model: ${this.model}`);
  }

  getName(): string {
    return 'claude';
  }

  async testConnection(): Promise<boolean> {
    try {
      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }],
      });

      return !!message.content[0];
    } catch (error: any) {
      console.error('[ClaudeProvider] Connection test failed:', error.message);
      return false;
    }
  }

  getProviderInfo(): ProviderInfo {
    return {
      name: 'claude',
      model: this.model,
      version: '3.5',
      limits: {
        rateLimit: '50 requests/min',
        maxTokens: this.maxTokens,
        maxRequestSize: 200000, // 200K tokens context
      },
      cost: {
        per1KTokens: 0.003, // $3 per million tokens
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
      const maxTokens = options.maxTokens ?? this.maxTokens;

      // Construir el prompt completo
      const systemPrompt = options.systemPrompt || this.buildSystemPrompt(options.mode);
      const userPrompt = this.buildUserPrompt(options.prompt, options.context);

      console.log(`[ClaudeProvider] Generating answer with mode: ${options.mode || 'expert'}`);

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      // Extraer respuesta
      const answer =
        message.content[0].type === 'text'
          ? message.content[0].text
          : 'No response generated';

      const responseTime = Date.now() - startTime;
      const tokensUsed = {
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
        total: message.usage.input_tokens + message.usage.output_tokens,
      };

      const estimatedCost = this.calculateCost(tokensUsed.total);

      console.log(
        `[ClaudeProvider] Success! Tokens: ${tokensUsed.total}, Time: ${responseTime}ms, Cost: $${estimatedCost.toFixed(4)}`
      );

      return {
        answer,
        provider: 'claude',
        model: this.model,
        mode: options.mode || 'expert',
        tokensUsed,
        responseTime,
        timestamp: new Date(),
        estimatedCost,
        metadata: {
          stopReason: message.stop_reason,
          id: message.id,
        },
      };
    } catch (error: any) {
      console.error('[ClaudeProvider] Generate error:', error.message);
      throw new Error(`Claude generation failed: ${error.message}`);
    }
  }

  estimateTokens(text: string): number {
    // Claude: aproximadamente 1 token = 3.5 caracteres
    return Math.ceil(text.length / 3.5);
  }

  getMaxContextTokens(): number {
    return 200000; // Claude 3.5 Sonnet soporta 200K tokens
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Claude no tiene API de embeddings nativa
    throw new Error('Claude does not support embeddings. Use OpenAI or dedicated embedding models.');
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
        return 0.3; // Más preciso
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
    const costPer1K = 0.003; // $3 per 1M tokens = $0.003 per 1K tokens
    return (totalTokens / 1000) * costPer1K;
  }
}
