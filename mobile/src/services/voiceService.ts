import Voice, { SpeechRecognizedEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import * as Speech from 'expo-speech';

export class VoiceService {
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    Voice.onSpeechStart = this.onSpeechStart;
    Voice.onSpeechRecognized = this.onSpeechRecognized;
    Voice.onSpeechEnd = this.onSpeechEnd;
    Voice.onSpeechError = this.onSpeechError;
    Voice.onSpeechResults = this.onSpeechResults;
  }

  // Callbacks de Voice
  private onSpeechStart = () => {
    console.log('🎤 Voice: Speech started');
    this.isListening = true;
  };

  private onSpeechRecognized = (e: SpeechRecognizedEvent) => {
    console.log('🎤 Voice: Speech recognized');
  };

  private onSpeechEnd = () => {
    console.log('🎤 Voice: Speech ended');
    this.isListening = false;
  };

  private onSpeechError = (e: any) => {
    console.log('❌ Voice Error:', e.error);
    this.isListening = false;
    if (this.onErrorCallback) {
      this.onErrorCallback(e.error?.message || 'Error en reconocimiento de voz');
    }
  };

  private onSpeechResults = (e: SpeechResultsEvent) => {
    console.log('🎤 Voice Results:', e.value);
    if (e.value && e.value.length > 0 && this.onResultCallback) {
      this.onResultCallback(e.value[0]);
    }
  };

  // Métodos públicos
  async startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Already listening');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;

    try {
      await Voice.start('es-ES'); // Español
      console.log('🎤 Started listening in Spanish');
    } catch (error) {
      console.error('❌ Error starting voice recognition:', error);
      if (onError) {
        onError('No se pudo iniciar el reconocimiento de voz');
      }
    }
  }

  async stopListening(): Promise<void> {
    try {
      await Voice.stop();
      this.isListening = false;
      console.log('🎤 Stopped listening');
    } catch (error) {
      console.error('❌ Error stopping voice recognition:', error);
    }
  }

  // Síntesis de voz (respuesta de Kaia)
  async speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    const defaultOptions: Speech.SpeechOptions = {
      language: 'es-ES',
      pitch: 1.0,
      rate: 0.9,
      ...options,
    };

    try {
      await Speech.speak(text, defaultOptions);
      console.log('🔊 Speaking:', text);
    } catch (error) {
      console.error('❌ Error in text-to-speech:', error);
    }
  }

  // Estado del servicio
  getIsListening(): boolean {
    return this.isListening;
  }

  // Cleanup
  async destroy(): Promise<void> {
    try {
      await Voice.destroy();
    } catch (error) {
      console.error('❌ Error destroying voice service:', error);
    }
  }
}

export const voiceService = new VoiceService();