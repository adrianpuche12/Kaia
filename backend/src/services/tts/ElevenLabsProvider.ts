/**
 * ElevenLabs TTS Provider
 *
 * Implementation of ITTSProvider using ElevenLabs API
 * https://elevenlabs.io/docs/api-reference/text-to-speech
 */

import { ElevenLabsClient } from 'elevenlabs';
import { ITTSProvider, TTSOptions, TTSResponse } from './ITTSProvider';

export class ElevenLabsProvider implements ITTSProvider {
  private client: ElevenLabsClient;
  private defaultVoiceId: string;
  private defaultModelId: string;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY is not configured');
    }

    this.client = new ElevenLabsClient({ apiKey });
    this.defaultVoiceId = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'; // Matilda
    this.defaultModelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2';
  }

  async synthesize(text: string, options?: TTSOptions): Promise<TTSResponse> {
    try {
      const voiceId = options?.voice_id || this.defaultVoiceId;
      const modelId = options?.model_id || this.defaultModelId;

      // Call ElevenLabs API
      const audio = await this.client.generate({
        voice: voiceId,
        text,
        model_id: modelId,
        voice_settings: {
          stability: options?.stability ?? 0.5,
          similarity_boost: options?.similarity_boost ?? 0.75,
        },
      });

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of audio) {
        chunks.push(Buffer.from(chunk));
      }
      const audioBuffer = Buffer.concat(chunks);

      return {
        audio: audioBuffer,
        contentType: 'audio/mpeg',
        provider: 'elevenlabs',
        charactersUsed: text.length,
      };
    } catch (error) {
      console.error('ElevenLabs TTS error:', error);
      throw new Error(`Failed to generate speech with ElevenLabs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getProviderName(): string {
    return 'ElevenLabs';
  }

  isAvailable(): boolean {
    return !!process.env.ELEVENLABS_API_KEY;
  }
}
