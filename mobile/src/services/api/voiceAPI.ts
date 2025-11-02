// API de voz y NLP
import { apiClient } from './apiClient';
import {
  VoiceCommandRequest,
  NLPResponse,
  VoiceSession,
  VoiceStats,
} from '../../types';

class VoiceAPI {
  async processCommand(data: VoiceCommandRequest): Promise<NLPResponse> {
    const response = await apiClient.post<NLPResponse & { sessionId: string }>(
      '/voice/process',
      data
    );
    return response.data!;
  }

  async getHistory(limit: number = 50): Promise<VoiceSession[]> {
    const response = await apiClient.get<{ history: VoiceSession[] }>('/voice/history', { limit });
    return response.data!.history;
  }

  async getStats(): Promise<VoiceStats> {
    const response = await apiClient.get<{ stats: VoiceStats }>('/voice/stats');
    return response.data!.stats;
  }

  // Nuevos endpoints agregados - Fase 1
  async getAccuracyByIntent(): Promise<Record<string, number>> {
    const response = await apiClient.get<{ accuracy: Record<string, number> }>('/voice/accuracy');
    return response.data!.accuracy;
  }

  async getCommonIntents(limit: number = 10): Promise<Array<{ intent: string; count: number }>> {
    const response = await apiClient.get<{ intents: Array<{ intent: string; count: number }> }>('/voice/intents', { limit });
    return response.data!.intents;
  }
}

export const voiceAPI = new VoiceAPI();
export default voiceAPI;
