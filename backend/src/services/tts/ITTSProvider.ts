/**
 * Text-to-Speech Provider Interface
 *
 * Abstract interface for TTS providers.
 * Allows easy swapping between providers (ElevenLabs, Google, OpenAI, etc.)
 */

export interface TTSOptions {
  voice_id?: string;
  model_id?: string;
  stability?: number;
  similarity_boost?: number;
  language?: string;
}

export interface TTSResponse {
  audio: Buffer;
  contentType: string;
  provider: string;
  charactersUsed: number;
}

export interface ITTSProvider {
  /**
   * Convert text to speech
   * @param text Text to convert to speech
   * @param options TTS options
   * @returns Audio buffer and metadata
   */
  synthesize(text: string, options?: TTSOptions): Promise<TTSResponse>;

  /**
   * Get provider name
   */
  getProviderName(): string;

  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;
}
