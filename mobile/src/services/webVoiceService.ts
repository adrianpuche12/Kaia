// Web Speech API service for browser compatibility
export class WebVoiceService {
  private recognition: any = null;
  private synthesis: any = null;
  private isListening = false;
  private onResultCallback: ((text: string) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;

  constructor() {
    // Check if browser supports Web Speech API
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupRecognition();
      }

      // Speech Synthesis
      this.synthesis = window.speechSynthesis;
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'es-ES';

    this.recognition.onstart = () => {
      console.log('🎤 Web Speech: Started listening');
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎤 Web Speech: Result:', transcript);

      if (this.onResultCallback) {
        this.onResultCallback(transcript);
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Web Speech Error:', event.error);
      this.isListening = false;

      let errorMessage = 'Error en reconocimiento de voz';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No se detectó voz. Inténtalo de nuevo.';
          break;
        case 'audio-capture':
          errorMessage = 'No se pudo acceder al micrófono.';
          break;
        case 'not-allowed':
          errorMessage = 'Permiso de micrófono denegado.';
          break;
        case 'network':
          errorMessage = 'Error de red. Verifica tu conexión.';
          break;
      }

      if (this.onErrorCallback) {
        this.onErrorCallback(errorMessage);
      }
    };

    this.recognition.onend = () => {
      console.log('🎤 Web Speech: Ended');
      this.isListening = false;
    };
  }

  async startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      const error = 'Tu navegador no soporta reconocimiento de voz. Prueba Chrome o Edge.';
      console.error(error);
      if (onError) onError(error);
      return;
    }

    if (this.isListening) {
      console.log('⚠️ Already listening');
      return;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError || null;

    try {
      this.recognition.start();
    } catch (error) {
      console.error('❌ Error starting recognition:', error);
      if (onError) {
        onError('No se pudo iniciar el reconocimiento de voz');
      }
    }
  }

  async stopListening(): Promise<void> {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.synthesis) {
      console.error('❌ Speech synthesis not supported');
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    // Wait a bit for cancellation to take effect
    await new Promise(resolve => setTimeout(resolve, 100));

    const utterance = new SpeechSynthesisUtterance();

    // Enhanced voice selection first
    await this.loadVoices();
    const selectedVoice = this.selectBestVoice();

    if (selectedVoice) {
      utterance.voice = selectedVoice;
      console.log('🔊 Selected voice:', selectedVoice.name, selectedVoice.lang);

      // Adjust settings based on voice characteristics
      if (selectedVoice.name.toLowerCase().includes('premium') ||
          selectedVoice.name.toLowerCase().includes('neural')) {
        // Premium/Neural voices sound better with these settings
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
      } else {
        // Standard voices need more adjustment
        utterance.rate = 0.85;
        utterance.pitch = 1.05;
      }
    } else {
      console.log('🔊 Using default voice with fallback settings');
      utterance.rate = 0.8;
      utterance.pitch = 1.0;
    }

    // Common settings for all voices
    utterance.lang = 'es-ES';
    utterance.volume = 0.95;

    // Enhanced text processing for more natural speech
    const processedText = this.enhanceTextForSpeech(text);
    utterance.text = processedText;

    return new Promise((resolve, reject) => {
      utterance.onstart = () => {
        console.log('🔊 Kaia speaking:', text.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        console.log('🔊 Kaia finished speaking');
        resolve();
      };

      utterance.onerror = (event) => {
        console.error('❌ Speech synthesis error:', event.error);
        reject(new Error(event.error));
      };

      this.synthesis.speak(utterance);
    });
  }

  private selectBestVoice(): any {
    const voices = this.synthesis.getVoices();

    // Enhanced voice selection with quality priorities
    const voicePreferences = [
      // Premium/Neural Spanish female voices (highest quality)
      (v: any) => v.lang === 'es-ES' &&
                  (v.name.toLowerCase().includes('neural') || v.name.toLowerCase().includes('premium')) &&
                  (v.name.toLowerCase().includes('maria') || v.name.toLowerCase().includes('female')),

      // High-quality Spanish female voices
      (v: any) => v.lang === 'es-ES' && v.name.toLowerCase().includes('maria'),
      (v: any) => v.lang === 'es-ES' && v.name.toLowerCase().includes('carmen'),
      (v: any) => v.lang === 'es-ES' && v.name.toLowerCase().includes('lucia'),
      (v: any) => v.lang === 'es-ES' && v.name.toLowerCase().includes('elena'),
      (v: any) => v.lang === 'es-ES' && v.name.toLowerCase().includes('isabella'),

      // Any Spanish female voice
      (v: any) => v.lang === 'es-ES' &&
                  (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer')),

      // Any quality Spanish voice
      (v: any) => v.lang === 'es-ES' &&
                  (v.name.toLowerCase().includes('premium') || v.name.toLowerCase().includes('neural')),

      // Standard Spanish voices
      (v: any) => v.lang.startsWith('es-ES'),
      (v: any) => v.lang.startsWith('es-'),

      // Fallback to any Spanish voice
      (v: any) => v.name.toLowerCase().includes('spanish') || v.name.toLowerCase().includes('español'),
    ];

    for (const preference of voicePreferences) {
      const voice = voices.find(preference);
      if (voice) return voice;
    }

    return null;
  }

  private async loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      const voices = this.synthesis.getVoices();
      if (voices.length > 0) {
        resolve();
        return;
      }

      // Some browsers need time to load voices
      const interval = setInterval(() => {
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
          clearInterval(interval);
          resolve();
        }
      }, 100);

      // Timeout after 2 seconds
      setTimeout(() => {
        clearInterval(interval);
        resolve();
      }, 2000);
    });
  }

  private enhanceTextForSpeech(text: string): string {
    // Enhanced text processing for more natural and conversational speech
    let processedText = text;

    // Add strategic pauses for breathing and emphasis
    processedText = processedText
      .replace(/\./g, '. ') // Pause after periods
      .replace(/,/g, ', ') // Pause after commas
      .replace(/\?/g, '? ') // Pause after questions
      .replace(/!/g, '! ') // Pause after exclamations
      .replace(/:/g, ': ') // Pause after colons
      .replace(/;/g, '; ') // Pause after semicolons

    // Add emphasis and natural breaks for better flow
    processedText = processedText
      .replace(/(\d+:\d+)/g, ' $1 ') // Add space around times
      .replace(/(\d+\/\d+|\d+-\d+)/g, ' $1 ') // Add space around dates
      .replace(/(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, ' $1 ') // Space around months
      .replace(/(lunes|martes|miércoles|jueves|viernes|sábado|domingo)/gi, ' $1 ') // Space around weekdays

    // Make numbers more natural
    processedText = processedText
      .replace(/\b1\b/g, 'una')
      .replace(/\b2\b/g, 'dos')
      .replace(/\b3\b/g, 'tres')
      .replace(/\b4\b/g, 'cuatro')
      .replace(/\b5\b/g, 'cinco')
      .replace(/\b6\b/g, 'seis')
      .replace(/\b7\b/g, 'siete')
      .replace(/\b8\b/g, 'ocho')
      .replace(/\b9\b/g, 'nueve')
      .replace(/\b10\b/g, 'diez')

    // Add natural conversation fillers for friendliness
    processedText = processedText
      .replace(/^Perfecto,/i, 'Perfecto... ')
      .replace(/^Entiendo/i, 'Entiendo... ')
      .replace(/^Quieres/i, 'Quieres... ')
      .replace(/¿Es correcto\?/i, '... ¿Es correcto?')

    // Clean up formatting
    processedText = processedText
      .replace(/\n/g, ' ') // Replace newlines with spaces
      .replace(/\s+/g, ' ') // Clean up multiple spaces
      .replace(/\s*\.\s*\.\s*\.\s*/g, '... ') // Normalize ellipsis
      .trim();

    return processedText;
  }

  // Get available voices for debugging
  getAvailableVoices(): any[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices().filter((voice: any) =>
      voice.lang.startsWith('es') || voice.name.toLowerCase().includes('spanish')
    );
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  isSupported(): boolean {
    return !!(this.recognition && this.synthesis);
  }

  async destroy(): Promise<void> {
    if (this.recognition) {
      this.recognition.abort();
    }
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

export const webVoiceService = new WebVoiceService();