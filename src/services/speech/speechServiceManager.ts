import { ISpeechToTextService } from '../../types/voice';
import { WebSpeechRecognitionService } from './webSpeechService';
import { FallbackSpeechRecognitionService } from './fallbackSpeechService';

export type SpeechEngineType = 'web-speech' | 'fallback' | 'custom';

export class SpeechServiceManager {
  private static instance: SpeechServiceManager | null = null;
  private services: Map<string, ISpeechToTextService> = new Map();
  private activeServiceId: string = 'web-speech-api';

  private constructor() {
    // Register default implementations
    const webSpeech = new WebSpeechRecognitionService();
    const fallback = new FallbackSpeechRecognitionService();

    this.registerService(webSpeech);
    this.registerService(fallback);

    // Auto-select best supported service
    if (webSpeech.isSupported()) {
      this.activeServiceId = webSpeech.id;
    } else {
      this.activeServiceId = fallback.id;
    }
  }

  public static getInstance(): SpeechServiceManager {
    if (!SpeechServiceManager.instance) {
      SpeechServiceManager.instance = new SpeechServiceManager();
    }
    return SpeechServiceManager.instance;
  }

  /**
   * Register a new or custom speech recognition service implementation
   * (e.g. OpenAI Whisper, Google Cloud Speech, Gemini Audio API, or On-Device)
   */
  public registerService(service: ISpeechToTextService): void {
    this.services.set(service.id, service);
  }

  /**
   * Get all registered speech services with support status
   */
  public getAvailableServices(): { id: string; name: string; description: string; supported: boolean; active: boolean }[] {
    return Array.from(this.services.values()).map(s => ({
      id: s.id,
      name: s.name,
      description: s.description,
      supported: s.isSupported(),
      active: s.id === this.activeServiceId,
    }));
  }

  /**
   * Set the active speech-to-text provider
   */
  public setActiveService(serviceId: string): boolean {
    if (this.services.has(serviceId)) {
      this.activeServiceId = serviceId;
      return true;
    }
    return false;
  }

  /**
   * Retrieve the currently active speech-to-text service
   */
  public getActiveService(): ISpeechToTextService {
    let service = this.services.get(this.activeServiceId);
    if (!service || !service.isSupported()) {
      // Fallback to first supported service
      for (const s of this.services.values()) {
        if (s.isSupported()) {
          this.activeServiceId = s.id;
          return s;
        }
      }
      // Ultimate fallback
      service = this.services.get('fallback-speech-service') || new FallbackSpeechRecognitionService();
    }
    return service;
  }
}

// Export singleton convenience getter
export const getSpeechService = (): ISpeechToTextService => {
  return SpeechServiceManager.getInstance().getActiveService();
};
