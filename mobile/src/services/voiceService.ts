import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
  addSpeechRecognitionListener,
} from '@jamsch/expo-speech-recognition';
import * as Speech from 'expo-speech';

export class VoiceService {
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private listeners: any[] = [];

  constructor() {
    this.setupListeners();
  }

  private setupListeners() {
    // Listener para cuando empieza el reconocimiento
    const startListener = addSpeechRecognitionListener('start', () => {
      console.log('🎤 Voice: Speech started');
      this.isListening = true;
    });

    // Listener para cuando termina el reconocimiento
    const endListener = addSpeechRecognitionListener('end', () => {
      console.log('🎤 Voice: Speech ended');
      this.isListening = false;
    });

    // Listener para resultados
    const resultListener = addSpeechRecognitionListener('result', (event) => {
      console.log('🎤 Voice Results:', event.results);
      if (event.results && event.results.length > 0 && this.onResultCallback) {
        const transcript = event.results[0]?.transcript;
        if (transcript) {
          this.onResultCallback(transcript);
        }
      }
    });

    // Listener para errores
    const errorListener = addSpeechRecognitionListener('error', (event) => {
      console.log('❌ Voice Error:', event.error);
      this.isListening = false;
      if (this.onErrorCallback) {
        this.onErrorCallback(event.error || 'Error en reconocimiento de voz');
      }
    });

    this.listeners = [startListener, endListener, resultListener, errorListener];
  }

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
      // Solicitar permisos primero
      const { granted } = await ExpoSpeechRecognitionModule.requestPermissionsAsync();

      if (!granted) {
        console.log('❌ Permissions not granted');
        if (onError) {
          onError('Permisos de micrófono no concedidos');
        }
        return;
      }

      // Iniciar reconocimiento en español
      ExpoSpeechRecognitionModule.start({
        lang: 'es-ES',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        requiresOnDeviceRecognition: false,
        addsPunctuation: false,
        contextualStrings: [],
      });

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
      ExpoSpeechRecognitionModule.stop();
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
      // Remover todos los listeners
      this.listeners.forEach(listener => {
        if (listener && listener.remove) {
          listener.remove();
        }
      });
      this.listeners = [];

      // Detener reconocimiento si está activo
      if (this.isListening) {
        ExpoSpeechRecognitionModule.stop();
      }
    } catch (error) {
      console.error('❌ Error destroying voice service:', error);
    }
  }
}

export const voiceService = new VoiceService();
