/**
 * TTS Service
 *
 * Main service that coordinates TTS providers with fallback support
 */

import { ITTSProvider, TTSOptions, TTSResponse } from './ITTSProvider';
import { ElevenLabsProvider } from './ElevenLabsProvider';

type ProviderType = 'elevenlabs' | 'fallback';

export class TTSService {
  private primaryProvider: ITTSProvider | null = null;
  private fallbackEnabled: boolean;
  private usageStats: Map<string, { characters: number; requests: number }> = new Map();

  constructor() {
    this.fallbackEnabled = process.env.TTS_FALLBACK_ENABLED === 'true';
    this.initializePrimaryProvider();
  }

  private initializePrimaryProvider(): void {
    const providerType = (process.env.TTS_PROVIDER || 'elevenlabs') as ProviderType;

    try {
      switch (providerType) {
        case 'elevenlabs':
          this.primaryProvider = new ElevenLabsProvider();
          console.log('✅ TTS Service initialized with ElevenLabs provider');
          break;
        case 'fallback':
          console.log('⚠️  TTS Service running in fallback mode (no TTS provider)');
          break;
        default:
          console.warn(`Unknown TTS provider: ${providerType}, using fallback`);
      }
    } catch (error) {
      console.error('Failed to initialize TTS provider:', error);
      if (!this.fallbackEnabled) {
        throw error;
      }
    }
  }

  /**
   * Convert text to speech
   */
  async speak(text: string, options?: TTSOptions): Promise<TTSResponse> {
    // Validate input
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Try primary provider
    if (this.primaryProvider && this.primaryProvider.isAvailable()) {
      try {
        const result = await this.primaryProvider.synthesize(text, options);

        // Track usage
        this.trackUsage(result.provider, result.charactersUsed);

        return result;
      } catch (error) {
        console.error('Primary TTS provider failed:', error);

        if (!this.fallbackEnabled) {
          throw error;
        }

        // Fall through to fallback
        console.log('Falling back to client-side TTS');
      }
    }

    // Fallback: Return empty buffer with instruction for client
    // Client will use expo-speech or Web Speech API
    return {
      audio: Buffer.from(''),
      contentType: 'text/plain',
      provider: 'client-fallback',
      charactersUsed: text.length,
    };
  }

  /**
   * Get available voices (if supported by provider)
   */
  async getAvailableVoices(): Promise<any[]> {
    // TODO: Implement when needed
    return [];
  }

  /**
   * Get usage statistics
   */
  getUsageStats(): Record<string, { characters: number; requests: number }> {
    return Object.fromEntries(this.usageStats);
  }

  /**
   * Track usage for monitoring
   */
  private trackUsage(provider: string, characters: number): void {
    const stats = this.usageStats.get(provider) || { characters: 0, requests: 0 };
    stats.characters += characters;
    stats.requests += 1;
    this.usageStats.set(provider, stats);
  }

  /**
   * Check if TTS is available
   */
  isAvailable(): boolean {
    return this.primaryProvider?.isAvailable() ?? false;
  }

  /**
   * Get current provider name
   */
  getProviderName(): string {
    return this.primaryProvider?.getProviderName() ?? 'None';
  }
}

// Singleton instance
export const ttsService = new TTSService();
