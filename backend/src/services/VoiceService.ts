import { VoiceSessionRepository, VoiceSessionCreateData } from '../repositories/VoiceSessionRepository';

// ============================================================================
// DTOs
// ============================================================================

export interface VoiceCommandDTO {
  audioUrl?: string; // URL del archivo de audio
  audioBuffer?: Buffer; // Buffer de audio directo
  transcript?: string; // Transcripción ya hecha (opcional)
  contextData?: any; // Contexto adicional
  previousSessionId?: string; // Para conversaciones en cadena
}

export interface VoiceResult {
  sessionId: string;
  transcript: string;
  intent: string | null;
  entities: any;
  response: string;
  confidence: number;
  successful: boolean;
  action?: {
    type: string;
    result: any;
  };
  suggestedFollowUps?: string[];
}

export interface TranscriptionResult {
  text: string;
  confidence: number;
  language?: string;
  duration?: number;
}

export interface NLPResult {
  intent: string;
  entities: any;
  confidence: number;
  sentiment?: string;
}

export interface VoiceStats {
  total: number;
  successful: number;
  failed: number;
  successRate: number;
  avgConfidence: number;
  avgDuration: number;
  totalDuration: number;
  byIntent: { [key: string]: number };
  withAudio: number;
  lowConfidence: number;
  topIntents: Array<{ intent: string; count: number; successRate: number }>;
}

export interface IntentAccuracy {
  intent: string;
  accuracy: number;
  total: number;
  avgConfidence: number;
}

// ============================================================================
// VoiceService
// ============================================================================

export class VoiceService {
  constructor(
    private voiceRepo: VoiceSessionRepository
  ) {}

  // ==========================================================================
  // PROCESAMIENTO DE COMANDOS DE VOZ
  // ==========================================================================

  /**
   * Procesar comando de voz completo
   * 1. Transcribir audio → texto
   * 2. Analizar intent y entidades (NLP)
   * 3. Ejecutar acción correspondiente
   * 4. Generar respuesta
   * 5. Guardar sesión
   */
  async processVoiceCommand(userId: string, data: VoiceCommandDTO): Promise<VoiceResult> {
    const startTime = Date.now();
    let transcript = '';
    let transcriptionConfidence = 0;

    try {
      // 1. TRANSCRIPCIÓN DE AUDIO
      if (data.transcript) {
        // Ya viene transcrito
        transcript = data.transcript;
        transcriptionConfidence = 1.0;
      } else if (data.audioUrl || data.audioBuffer) {
        // Transcribir audio
        const transcriptionResult = await this.transcribeAudio(data);
        transcript = transcriptionResult.text;
        transcriptionConfidence = transcriptionResult.confidence;
      } else {
        throw new Error('Either audioUrl, audioBuffer, or transcript is required');
      }

      // 2. ANÁLISIS NLP (Intent + Entities)
      const nlpResult = await this.analyzeIntent(transcript, data.contextData);

      // 3. EJECUTAR ACCIÓN
      const actionResult = await this.executeAction(
        userId,
        nlpResult.intent,
        nlpResult.entities,
        data.contextData
      );

      // 4. GENERAR RESPUESTA
      const response = this.generateResponse(
        nlpResult.intent,
        nlpResult.entities,
        actionResult
      );

      // 5. CALCULAR DURACIÓN
      const duration = Math.round((Date.now() - startTime) / 1000);

      // 6. GUARDAR SESIÓN
      const session = await this.voiceRepo.create({
        userId,
        transcript,
        intent: nlpResult.intent,
        entities: nlpResult.entities,
        response,
        confidence: Math.min(transcriptionConfidence, nlpResult.confidence),
        successful: true,
        duration,
        audioUrl: data.audioUrl,
        previousSessionId: data.previousSessionId,
        contextData: {
          ...data.contextData,
          actionType: actionResult?.type,
          nlpSentiment: nlpResult.sentiment
        }
      });

      return {
        sessionId: session.id,
        transcript,
        intent: nlpResult.intent,
        entities: nlpResult.entities,
        response,
        confidence: session.confidence || 0,
        successful: true,
        action: actionResult,
        suggestedFollowUps: this.generateFollowUpSuggestions(nlpResult.intent)
      };
    } catch (error) {
      // Guardar sesión fallida
      const duration = Math.round((Date.now() - startTime) / 1000);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      const session = await this.voiceRepo.create({
        userId,
        transcript: transcript || 'Failed to transcribe',
        intent: null,
        entities: null,
        response: `Lo siento, no pude procesar tu comando: ${errorMessage}`,
        confidence: 0,
        successful: false,
        duration,
        audioUrl: data.audioUrl,
        previousSessionId: data.previousSessionId,
        contextData: {
          ...data.contextData,
          error: errorMessage
        }
      });

      return {
        sessionId: session.id,
        transcript: transcript || '',
        intent: null,
        entities: null,
        response: session.response || '',
        confidence: 0,
        successful: false
      };
    }
  }

  // ==========================================================================
  // HISTORIAL Y CONSULTAS
  // ==========================================================================

  /**
   * Obtener historial de comandos de voz
   */
  async getVoiceHistory(userId: string, limit: number = 50) {
    const sessions = await this.voiceRepo.findByUser(userId, limit);
    return sessions.map(s => this.formatSession(s));
  }

  /**
   * Obtener sesión por ID
   */
  async getSessionById(sessionId: string) {
    const session = await this.voiceRepo.findById(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    return this.formatSession(session);
  }

  /**
   * Obtener cadena conversacional (seguir previousSessionId)
   */
  async getConversationChain(sessionId: string) {
    const chain = await this.voiceRepo.findConversationChain(sessionId);
    return chain.map(s => this.formatSession(s));
  }

  /**
   * Buscar sesiones por transcripción
   */
  async searchByTranscript(userId: string, query: string) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const sessions = await this.voiceRepo.searchByTranscript(query.trim(), userId);
    return sessions.map(s => this.formatSession(s));
  }

  /**
   * Obtener sesiones por intent
   */
  async getSessionsByIntent(userId: string, intent: string) {
    const sessions = await this.voiceRepo.findByIntent(intent, userId);
    return sessions.map(s => this.formatSession(s));
  }

  /**
   * Obtener sesiones exitosas
   */
  async getSuccessfulSessions(userId: string, limit?: number) {
    const sessions = await this.voiceRepo.findSuccessful(userId, limit);
    return sessions.map(s => this.formatSession(s));
  }

  /**
   * Obtener sesiones fallidas
   */
  async getFailedSessions(userId: string, limit?: number) {
    const sessions = await this.voiceRepo.findFailed(userId, limit);
    return sessions.map(s => this.formatSession(s));
  }

  /**
   * Obtener sesiones con baja confianza (requieren revisión)
   */
  async getLowConfidenceSessions(userId: string, threshold: number = 0.5) {
    const sessions = await this.voiceRepo.findLowConfidence(userId, threshold);
    return sessions.map(s => this.formatSession(s));
  }

  // ==========================================================================
  // ESTADÍSTICAS Y MÉTRICAS
  // ==========================================================================

  /**
   * Obtener estadísticas de voz del usuario
   */
  async getVoiceStats(userId: string): Promise<VoiceStats> {
    const stats = await this.voiceRepo.getStats(userId);
    const topIntents = await this.voiceRepo.getMostCommonIntents(userId, 5);

    return {
      ...stats,
      topIntents
    };
  }

  /**
   * Obtener precisión por intent
   */
  async getAccuracyByIntent(userId: string): Promise<IntentAccuracy[]> {
    return await this.voiceRepo.getAccuracyByIntent(userId);
  }

  /**
   * Obtener tendencias de uso
   */
  async getUsageTrend(userId: string, days: number = 7) {
    return await this.voiceRepo.getUsageTrend(userId, days);
  }

  /**
   * Obtener resumen semanal
   */
  async getWeeklySummary(userId: string) {
    return await this.voiceRepo.getWeeklySummary(userId);
  }

  /**
   * Obtener intents más comunes
   */
  async getMostCommonIntents(userId: string, limit: number = 10) {
    return await this.voiceRepo.getMostCommonIntents(userId, limit);
  }

  // ==========================================================================
  // REINTENTOS Y CORRECCIONES
  // ==========================================================================

  /**
   * Reintentar sesión fallida
   */
  async retryFailedSession(sessionId: string, userId: string): Promise<VoiceResult> {
    const session = await this.voiceRepo.findById(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    if (session.successful) {
      throw new Error('Session was already successful');
    }

    // Reintentar con el mismo transcript
    return await this.processVoiceCommand(userId, {
      transcript: session.transcript,
      contextData: this.voiceRepo.parseContextData(session),
      previousSessionId: session.previousSessionId || undefined
    });
  }

  /**
   * Actualizar sesión con feedback del usuario
   */
  async updateSessionWithFeedback(
    sessionId: string,
    feedback: {
      correctIntent?: string;
      correctEntities?: any;
      wasSuccessful?: boolean;
    }
  ) {
    const session = await this.voiceRepo.findById(sessionId);
    if (!session) {
      throw new Error('Voice session not found');
    }

    const contextData = this.voiceRepo.parseContextData(session) || {};
    contextData.userFeedback = feedback;

    await this.voiceRepo.update(sessionId, {
      intent: feedback.correctIntent || session.intent || undefined,
      entities: feedback.correctEntities || this.voiceRepo.parseEntities(session),
      successful: feedback.wasSuccessful ?? session.successful,
      contextData
    });

    return this.getSessionById(sessionId);
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - PROCESAMIENTO
  // ==========================================================================

  /**
   * Transcribir audio a texto
   * TODO: Integrar con Google Speech-to-Text o OpenAI Whisper
   */
  private async transcribeAudio(data: VoiceCommandDTO): Promise<TranscriptionResult> {
    // TODO: Integración real con API de transcripción
    // Ejemplo con Google Speech-to-Text:
    // const speech = require('@google-cloud/speech');
    // const client = new speech.SpeechClient();
    // const audio = { content: data.audioBuffer.toString('base64') };
    // const config = { encoding: 'LINEAR16', languageCode: 'es-ES' };
    // const [response] = await client.recognize({ audio, config });
    // const transcription = response.results.map(r => r.alternatives[0].transcript).join('\n');

    // Mock por ahora
    console.log('[TRANSCRIPTION] Processing audio...');

    return {
      text: 'Mock transcription: Crear recordatorio para mañana a las 3pm',
      confidence: 0.95,
      language: 'es-ES',
      duration: 2.5
    };
  }

  /**
   * Analizar intent y extraer entidades (NLP)
   * TODO: Integrar con servicio NLP real
   */
  private async analyzeIntent(transcript: string, context?: any): Promise<NLPResult> {
    // TODO: Integración con NLP Service real
    // Podría usar OpenAI, Dialogflow, Rasa, etc.

    // Mock: Detección simple de intents
    const lowerTranscript = transcript.toLowerCase();

    let intent = 'UNKNOWN';
    let entities: any = {};

    if (lowerTranscript.includes('recordatorio') || lowerTranscript.includes('recordar')) {
      intent = 'CREATE_REMINDER';
      entities = {
        title: 'Reunión importante',
        time: '15:00',
        date: 'tomorrow'
      };
    } else if (lowerTranscript.includes('evento') || lowerTranscript.includes('agendar')) {
      intent = 'CREATE_EVENT';
      entities = {
        title: 'Evento extraído',
        date: 'tomorrow',
        time: '15:00'
      };
    } else if (lowerTranscript.includes('alarma') || lowerTranscript.includes('despertar')) {
      intent = 'CREATE_ALARM';
      entities = {
        time: '07:00',
        days: [1, 2, 3, 4, 5] // Weekdays
      };
    } else if (lowerTranscript.includes('mensaje') || lowerTranscript.includes('enviar')) {
      intent = 'SEND_MESSAGE';
      entities = {
        contact: 'John Doe',
        message: 'Hola, ¿cómo estás?',
        platform: 'WHATSAPP'
      };
    } else if (lowerTranscript.includes('buscar') || lowerTranscript.includes('encontrar')) {
      intent = 'SEARCH';
      entities = {
        query: 'eventos de mañana'
      };
    }

    console.log(`[NLP] Intent detected: ${intent}`, entities);

    return {
      intent,
      entities,
      confidence: 0.87,
      sentiment: 'neutral'
    };
  }

  /**
   * Ejecutar acción según el intent detectado
   */
  private async executeAction(
    userId: string,
    intent: string,
    entities: any,
    context?: any
  ): Promise<{ type: string; result: any } | undefined> {
    // TODO: Integrar con otros servicios (EventService, ReminderService, etc.)

    console.log(`[ACTION] Executing action for intent: ${intent}`, entities);

    switch (intent) {
      case 'CREATE_REMINDER':
        // TODO: Llamar a ReminderService.createReminder()
        return {
          type: 'REMINDER_CREATED',
          result: {
            id: 'reminder_mock_123',
            title: entities.title,
            time: entities.time
          }
        };

      case 'CREATE_EVENT':
        // TODO: Llamar a EventService.createEvent()
        return {
          type: 'EVENT_CREATED',
          result: {
            id: 'event_mock_456',
            title: entities.title,
            date: entities.date
          }
        };

      case 'CREATE_ALARM':
        // TODO: Llamar a AlarmService.createAlarm()
        return {
          type: 'ALARM_CREATED',
          result: {
            id: 'alarm_mock_789',
            time: entities.time
          }
        };

      case 'SEND_MESSAGE':
        // TODO: Llamar a MessageService.sendMessage()
        return {
          type: 'MESSAGE_SENT',
          result: {
            id: 'message_mock_111',
            to: entities.contact,
            platform: entities.platform
          }
        };

      case 'SEARCH':
        // TODO: Implementar búsqueda
        return {
          type: 'SEARCH_RESULTS',
          result: {
            query: entities.query,
            results: []
          }
        };

      default:
        return undefined;
    }
  }

  /**
   * Generar respuesta natural al usuario
   */
  private generateResponse(intent: string, entities: any, actionResult?: any): string {
    if (!actionResult) {
      return 'Lo siento, no entendí tu comando. ¿Puedes repetirlo?';
    }

    switch (actionResult.type) {
      case 'REMINDER_CREATED':
        return `He creado un recordatorio para "${entities.title}" ${entities.date} a las ${entities.time}.`;

      case 'EVENT_CREATED':
        return `He agendado el evento "${entities.title}" para ${entities.date} a las ${entities.time}.`;

      case 'ALARM_CREATED':
        return `Alarma configurada para las ${entities.time}.`;

      case 'MESSAGE_SENT':
        return `Mensaje enviado a ${entities.contact} por ${entities.platform}.`;

      case 'SEARCH_RESULTS':
        return `He encontrado ${actionResult.result.results.length} resultados para "${entities.query}".`;

      default:
        return 'Comando procesado exitosamente.';
    }
  }

  /**
   * Generar sugerencias de seguimiento según el intent
   */
  private generateFollowUpSuggestions(intent: string): string[] {
    const suggestions: { [key: string]: string[] } = {
      'CREATE_REMINDER': [
        '¿Quieres crear otro recordatorio?',
        '¿Ver todos mis recordatorios?',
        '¿Modificar el recordatorio?'
      ],
      'CREATE_EVENT': [
        '¿Agregar invitados al evento?',
        '¿Crear otro evento?',
        '¿Ver mi calendario?'
      ],
      'CREATE_ALARM': [
        '¿Configurar otra alarma?',
        '¿Ver todas mis alarmas?',
        '¿Cambiar el tono de alarma?'
      ],
      'SEND_MESSAGE': [
        '¿Enviar otro mensaje?',
        '¿Ver conversación?',
        '¿Marcar como importante?'
      ],
      'SEARCH': [
        '¿Refinar búsqueda?',
        '¿Buscar otra cosa?',
        '¿Exportar resultados?'
      ]
    };

    return suggestions[intent] || [
      '¿En qué más puedo ayudarte?',
      '¿Quieres hacer otra consulta?'
    ];
  }

  /**
   * Formatear sesión para respuesta
   */
  private formatSession(session: any) {
    return {
      id: session.id,
      userId: session.userId,
      transcript: session.transcript,
      intent: session.intent,
      entities: this.voiceRepo.parseEntities(session),
      response: session.response,
      confidence: session.confidence,
      successful: session.successful,
      duration: session.duration,
      audioUrl: session.audioUrl,
      previousSessionId: session.previousSessionId,
      contextData: this.voiceRepo.parseContextData(session),
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    };
  }
}
