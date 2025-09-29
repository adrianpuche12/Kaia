import { Platform } from 'react-native';
import { voiceService } from './voiceService';
import { webVoiceService } from './webVoiceService';

class UnifiedVoiceService {
  private currentService: any;

  constructor() {
    // Detect platform and choose appropriate service
    if (Platform.OS === 'web') {
      this.currentService = webVoiceService;
      console.log('🌐 Using Web Voice Service');
    } else {
      this.currentService = voiceService;
      console.log('📱 Using Native Voice Service');
    }
  }

  async startListening(
    onResult: (text: string) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    return this.currentService.startListening(onResult, onError);
  }

  async stopListening(): Promise<void> {
    return this.currentService.stopListening();
  }

  async speak(text: string, options?: any): Promise<void> {
    if (Platform.OS === 'web') {
      return this.currentService.speak(text);
    } else {
      return this.currentService.speak(text, options);
    }
  }

  getIsListening(): boolean {
    return this.currentService.getIsListening();
  }

  isSupported(): boolean {
    if (Platform.OS === 'web') {
      return this.currentService.isSupported();
    }
    return true; // Native always supported
  }

  async destroy(): Promise<void> {
    return this.currentService.destroy();
  }

  // Get platform-specific info
  getPlatformInfo(): { platform: string; service: string; supported: boolean } {
    return {
      platform: Platform.OS,
      service: Platform.OS === 'web' ? 'Web Speech API' : 'React Native Voice',
      supported: this.isSupported(),
    };
  }
}

export const unifiedVoiceService = new UnifiedVoiceService();