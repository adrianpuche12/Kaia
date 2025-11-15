import { getAIProviderFactory } from '../providers';
import { parseNaturalDate } from '../shared/utils/date-parser.util';

/**
 * AIService
 * Procesa comandos de voz usando Claude AI
 * Extrae información estructurada de eventos
 */

export interface VoiceCommandInput {
  transcript: string;
  userId: string;
  currentDate?: Date;
}

export interface ExtractedEventInfo {
  title: string;
  description?: string;
  type: string;
  dateText?: string;
  parsedDate?: Date;
  hasTime: boolean;
  location?: string;
  participants?: string[];
  confidence: number;
}

export interface ProcessedCommand {
  success: boolean;
  eventInfo?: ExtractedEventInfo;
  message: string;
  error?: string;
  tokensUsed?: number;
  processingTime?: number;
}

export class AIService {
  private aiFactory;

  constructor() {
    this.aiFactory = getAIProviderFactory();
  }

  /**
   * Procesar comando de voz y extraer información de evento
   */
  async processVoiceCommand(input: VoiceCommandInput): Promise<ProcessedCommand> {
    const startTime = Date.now();

    try {
      // 1. Construir prompt para Claude
      const prompt = this.buildExtractionPrompt(input.transcript, input.currentDate);

      // 2. Enviar a Claude para extracción
      const aiResult = await this.aiFactory.generateAnswer({
        prompt,
        mode: 'expert',
        temperature: 0.3, // Más preciso para extracción
        maxTokens: 500,
      });

      // 3. Parsear respuesta de Claude (esperamos JSON)
      const eventInfo = this.parseAIResponse(aiResult.answer);

      // 4. Parsear fecha natural si existe
      if (eventInfo.dateText) {
        const parsedDate = parseNaturalDate(eventInfo.dateText, input.currentDate);
        if (parsedDate) {
          eventInfo.parsedDate = parsedDate;
        }
      }

      // 5. Validar que tengamos información mínima
      if (!eventInfo.title || !eventInfo.parsedDate) {
        return {
          success: false,
          message: 'No pude extraer información suficiente del comando',
          error: 'Missing required fields: title or date',
          tokensUsed: aiResult.tokensUsed.total,
          processingTime: Date.now() - startTime,
        };
      }

      return {
        success: true,
        eventInfo,
        message: `Evento extraído: ${eventInfo.title} para ${eventInfo.parsedDate.toLocaleString('es-ES')}`,
        tokensUsed: aiResult.tokensUsed.total,
        processingTime: Date.now() - startTime,
      };
    } catch (error: any) {
      console.error('[AIService] Error processing voice command:', error);
      return {
        success: false,
        message: 'Error al procesar el comando de voz',
        error: error.message,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Construir prompt optimizado para extracción de eventos
   */
  private buildExtractionPrompt(transcript: string, currentDate?: Date): string {
    const refDate = currentDate || new Date();
    const dateStr = refDate.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `Eres Kaia, un asistente que extrae información de eventos de comandos de voz.

FECHA DE REFERENCIA: ${dateStr}

COMANDO: "${transcript}"

INSTRUCCIONES:
1. Extrae la siguiente información del comando:
   - title: El título o descripción del evento (obligatorio)
   - description: Detalles adicionales si los hay
   - type: Categoría del evento (MEDICAL, MEETING, PERSONAL, WORK, BIRTHDAY, OTHER)
   - dateText: La expresión de fecha/hora EXACTAMENTE como aparece ("mañana", "el viernes", "15 de diciembre", etc.)
   - hasTime: true si menciona hora específica, false si no
   - location: Ubicación si se menciona
   - participants: Array de nombres de personas mencionadas
   - confidence: Tu nivel de confianza (0-100)

2. REGLAS IMPORTANTES:
   - NO inventes información que no esté en el comando
   - Si no hay fecha explícita, usa null para dateText
   - Si no hay hora específica, hasTime debe ser false
   - El title debe ser descriptivo pero conciso

3. FORMATO DE RESPUESTA (JSON estricto):
{
  "title": "string",
  "description": "string o null",
  "type": "MEDICAL|MEETING|PERSONAL|WORK|BIRTHDAY|OTHER",
  "dateText": "string o null",
  "hasTime": boolean,
  "location": "string o null",
  "participants": ["string"] o [],
  "confidence": number
}

RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL.`;
  }

  /**
   * Parsear respuesta JSON de Claude
   */
  private parseAIResponse(response: string): ExtractedEventInfo {
    try {
      // Limpiar respuesta (quitar markdown code blocks si existen)
      let cleanResponse = response.trim();

      if (cleanResponse.startsWith('```json')) {
        cleanResponse = cleanResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanResponse.startsWith('```')) {
        cleanResponse = cleanResponse.replace(/```\n?/g, '');
      }

      const parsed = JSON.parse(cleanResponse);

      return {
        title: parsed.title || 'Evento sin título',
        description: parsed.description || undefined,
        type: parsed.type || 'OTHER',
        dateText: parsed.dateText || undefined,
        hasTime: parsed.hasTime || false,
        location: parsed.location || undefined,
        participants: parsed.participants || [],
        confidence: parsed.confidence || 50,
      };
    } catch (error) {
      console.error('[AIService] Error parsing AI response:', error);
      console.error('[AIService] Response was:', response);

      // Fallback: intentar extraer información básica
      return {
        title: 'Evento',
        type: 'OTHER',
        hasTime: false,
        participants: [],
        confidence: 20,
      };
    }
  }

  /**
   * Generar confirmación en lenguaje natural
   */
  async generateConfirmation(eventInfo: ExtractedEventInfo): Promise<string> {
    const dateStr = eventInfo.parsedDate
      ? eventInfo.parsedDate.toLocaleString('es-ES', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: eventInfo.hasTime ? '2-digit' : undefined,
          minute: eventInfo.hasTime ? '2-digit' : undefined,
        })
      : 'fecha no especificada';

    let confirmation = `He agendado "${eventInfo.title}" para el ${dateStr}`;

    if (eventInfo.location) {
      confirmation += ` en ${eventInfo.location}`;
    }

    if (eventInfo.participants && eventInfo.participants.length > 0) {
      confirmation += ` con ${eventInfo.participants.join(', ')}`;
    }

    return confirmation;
  }
}
