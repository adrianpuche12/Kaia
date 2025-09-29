// Natural Language Processing Service for Kaia
interface ParsedIntent {
  intent: 'create_event' | 'query_agenda' | 'modify_event' | 'delete_event' | 'greeting' | 'unknown';
  entities: {
    title?: string;
    date?: string;
    time?: string;
    location?: string;
    type?: string;
  };
  confidence: number;
}

export class NLPService {
  // Patrones para detectar intenciones
  private intentPatterns = {
    create_event: [
      /tengo\s+(cita|turno|reunión|evento|compromiso)/i,
      /agendar\s+(cita|turno|reunión|evento|compromiso)/i,
      /programar\s+(cita|turno|reunión|evento|compromiso)/i,
      /crear\s+(cita|turno|reunión|evento|compromiso)/i,
      /quiero\s+(agendar|programar|crear)/i,
      /necesito\s+(agendar|programar)/i,
      /(dentista|doctor|médico|veterinario|trabajo|oficina|universidad)/i,
    ],
    query_agenda: [
      /qué\s+tengo/i,
      /mi\s+agenda/i,
      /mis\s+(citas|eventos|compromisos|turnos)/i,
      /programado/i,
      /eventos/i,
      /horario/i,
    ],
    modify_event: [
      /cambiar\s+(cita|turno|reunión|evento)/i,
      /mover\s+(cita|turno|reunión|evento)/i,
      /reprogramar/i,
      /modificar/i,
    ],
    delete_event: [
      /cancelar\s+(cita|turno|reunión|evento)/i,
      /eliminar\s+(cita|turno|reunión|evento)/i,
      /borrar/i,
    ],
    greeting: [
      /^(hola|hey|buenos?\s+días|buenas?\s+tardes|buenas?\s+noches)/i,
      /^(cómo\s+estás|qué\s+tal)/i,
    ],
  };

  // Patrones para extraer fechas
  private datePatterns = {
    mañana: () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    },
    hoy: () => {
      return new Date().toISOString().split('T')[0];
    },
    'pasado mañana': () => {
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 2);
      return dayAfter.toISOString().split('T')[0];
    },
  };

  // Patrones para extraer horas
  private timePatterns = [
    { pattern: /(\d{1,2})\s*(de\s+la\s+)?(mañana|tarde|noche)/i, format: 'descriptive' },
    { pattern: /(\d{1,2}):(\d{2})\s*(am|pm)?/i, format: 'time' },
    { pattern: /(\d{1,2})\s*(am|pm)/i, format: 'ampm' },
    { pattern: /(\d{1,2})\s*h(oras?)?/i, format: 'hours' },
  ];

  // Extraer tipos de eventos comunes
  private eventTypes = {
    'dentista': 'Cita con dentista',
    'doctor': 'Cita médica',
    'médico': 'Cita médica',
    'trabajo': 'Reunión de trabajo',
    'oficina': 'Reunión de trabajo',
    'universidad': 'Clase/Universidad',
    'veterinario': 'Cita veterinario',
    'gimnasio': 'Ejercicio',
    'cine': 'Entretenimiento',
    'restaurante': 'Comida',
    'almuerzo': 'Almuerzo',
    'desayuno': 'Desayuno',
    'cena': 'Cena',
    'reunión': 'Reunión',
    'junta': 'Reunión',
  };

  parseInput(text: string): ParsedIntent {
    const normalizedText = text.toLowerCase().trim();

    // Detectar intención principal
    const intent = this.detectIntent(normalizedText);

    // Extraer entidades
    const entities = this.extractEntities(normalizedText);

    // Calcular confianza
    const confidence = this.calculateConfidence(intent, entities, normalizedText);

    return {
      intent,
      entities,
      confidence,
    };
  }

  private detectIntent(text: string): ParsedIntent['intent'] {
    for (const [intentName, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return intentName as ParsedIntent['intent'];
        }
      }
    }
    return 'unknown';
  }

  private extractEntities(text: string): ParsedIntent['entities'] {
    const entities: ParsedIntent['entities'] = {};

    // Extraer fecha
    entities.date = this.extractDate(text);

    // Extraer hora
    entities.time = this.extractTime(text);

    // Extraer tipo/título del evento
    const eventInfo = this.extractEventType(text);
    entities.title = eventInfo.title;
    entities.type = eventInfo.type;

    // Extraer ubicación (básico)
    entities.location = this.extractLocation(text);

    return entities;
  }

  private extractDate(text: string): string | undefined {
    // Primero buscar fechas relativas
    for (const [dateWord, dateFunc] of Object.entries(this.datePatterns)) {
      if (text.includes(dateWord)) {
        return dateFunc();
      }
    }

    // Buscar fechas específicas (dd/mm, dd-mm, etc.)
    const dateMatch = text.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?/);
    if (dateMatch) {
      const [, day, month, year] = dateMatch;
      const currentYear = new Date().getFullYear();
      return `${year || currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    return undefined;
  }

  private extractTime(text: string): string | undefined {
    for (const { pattern, format } of this.timePatterns) {
      const match = text.match(pattern);
      if (match) {
        switch (format) {
          case 'descriptive':
            const hour = parseInt(match[1]);
            const period = match[3];
            if (period === 'tarde' && hour < 12) {
              return `${hour + 12}:00`;
            } else if (period === 'noche' && hour < 12) {
              return `${hour + 12}:00`;
            }
            return `${hour.toString().padStart(2, '0')}:00`;

          case 'time':
            const [, hours, minutes, ampm] = match;
            let hour24 = parseInt(hours);
            if (ampm?.toLowerCase() === 'pm' && hour24 < 12) hour24 += 12;
            if (ampm?.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;
            return `${hour24.toString().padStart(2, '0')}:${minutes}`;

          case 'ampm':
            const [, h, period2] = match;
            let hour24_2 = parseInt(h);
            if (period2?.toLowerCase() === 'pm' && hour24_2 < 12) hour24_2 += 12;
            if (period2?.toLowerCase() === 'am' && hour24_2 === 12) hour24_2 = 0;
            return `${hour24_2.toString().padStart(2, '0')}:00`;

          case 'hours':
            return `${parseInt(match[1]).toString().padStart(2, '0')}:00`;
        }
      }
    }
    return undefined;
  }

  private extractEventType(text: string): { title?: string; type?: string } {
    for (const [keyword, eventType] of Object.entries(this.eventTypes)) {
      if (text.includes(keyword)) {
        return {
          title: eventType,
          type: keyword,
        };
      }
    }

    // Si no encuentra un tipo específico, buscar palabras clave generales
    const generalMatch = text.match(/(cita|turno|reunión|evento|compromiso)\s+(con\s+)?(\w+)/i);
    if (generalMatch) {
      return {
        title: `${generalMatch[1]} con ${generalMatch[3]}`,
        type: 'general',
      };
    }

    return {};
  }

  private extractLocation(text: string): string | undefined {
    // Buscar patrones de ubicación básicos
    const locationMatch = text.match(/en\s+(la\s+)?([\w\s]+)/i);
    if (locationMatch) {
      const location = locationMatch[2].trim();
      // Filtrar palabras que no son ubicaciones
      const excludeWords = ['la', 'el', 'tarde', 'mañana', 'noche'];
      if (!excludeWords.includes(location.toLowerCase())) {
        return location;
      }
    }
    return undefined;
  }

  private calculateConfidence(intent: string, entities: ParsedIntent['entities'], text: string): number {
    let confidence = 0.5; // Base confidence

    // Incrementar confianza según la intención detectada
    if (intent !== 'unknown') confidence += 0.3;

    // Incrementar confianza según entidades extraídas
    if (entities.date) confidence += 0.1;
    if (entities.time) confidence += 0.1;
    if (entities.title) confidence += 0.1;

    // Incrementar si el texto contiene palabras clave relevantes
    const keywordCount = (text.match(/(agendar|programar|cita|turno|evento|mañana|tarde|hora)/gi) || []).length;
    confidence += Math.min(keywordCount * 0.05, 0.2);

    return Math.min(confidence, 1.0);
  }

  // Generar respuesta basada en la intención
  generateResponse(parsed: ParsedIntent): string {
    const responses = this.getResponseVariations(parsed);
    // Select a random response for more natural interaction
    return responses[Math.floor(Math.random() * responses.length)];
  }

  private getResponseVariations(parsed: ParsedIntent): string[] {
    switch (parsed.intent) {
      case 'create_event':
        if (parsed.entities.title && parsed.entities.date && parsed.entities.time) {
          return [
            `¡Perfecto! He agendado tu ${parsed.entities.title} para ${this.formatDate(parsed.entities.date)} a las ${parsed.entities.time}. ¿Todo correcto?`,
            `Listo, he programado tu ${parsed.entities.title} el ${this.formatDate(parsed.entities.date)} a las ${parsed.entities.time}. ¿Es así como lo querías?`,
            `¡Excelente! Tu ${parsed.entities.title} está agendado para ${this.formatDate(parsed.entities.date)} a las ${parsed.entities.time}. ¿Confirmas?`,
          ];
        } else if (parsed.entities.title && parsed.entities.date) {
          return [
            `Entiendo que quieres agendar tu ${parsed.entities.title} para ${this.formatDate(parsed.entities.date)}. ¿A qué hora sería?`,
            `Perfecto, he entendido que necesitas programar tu ${parsed.entities.title} el ${this.formatDate(parsed.entities.date)}. ¿Podrías decirme la hora?`,
            `Claro, vamos a agendar tu ${parsed.entities.title} para ${this.formatDate(parsed.entities.date)}. ¿Qué hora te conviene?`,
          ];
        } else if (parsed.entities.title) {
          return [
            `Entiendo que quieres agendar tu ${parsed.entities.title}. ¿Para qué día y hora?`,
            `¡Por supuesto! Vamos a programar tu ${parsed.entities.title}. ¿Cuándo te viene bien?`,
            `Claro, agendemos tu ${parsed.entities.title}. ¿Qué día y hora prefieres?`,
          ];
        } else {
          return [
            'Entiendo que quieres agendar algo. ¿Podrías decirme qué tipo de cita es y para cuándo?',
            'Por supuesto, te ayudo a crear un evento. ¿Qué necesitas agendar y para cuándo?',
            'Claro, vamos a programar algo en tu agenda. ¿Qué evento quieres crear?',
          ];
        }

      case 'query_agenda':
        return [
          'Déjame revisar tu agenda... Por ahora no tienes eventos programados. ¿Te gustaría crear uno?',
          'Veo que tu agenda está libre en este momento. ¿Quieres que agendemos algo?',
          'Tu agenda está disponible. ¿Hay algo que quisieras programar?',
        ];

      case 'greeting':
        return [
          '¡Hola! ¿En qué puedo ayudarte con tu agenda hoy?',
          '¡Hola! Soy Kaia, tu asistente de agenda. ¿Qué necesitas organizar?',
          '¡Hola! ¿Cómo puedo ayudarte a organizar tu tiempo hoy?',
          '¡Hola! ¿Qué eventos quieres programar en tu agenda?',
        ];

      case 'modify_event':
        return [
          'Entiendo que quieres modificar un evento. ¿Cuál evento quieres cambiar y qué modificación necesitas?',
          'Claro, puedo ayudarte a cambiar un evento. ¿Qué evento quieres modificar?',
          'Por supuesto, vamos a cambiar ese evento. ¿Cuál es y qué necesitas modificar?',
        ];

      case 'delete_event':
        return [
          'Entiendo que quieres cancelar un evento. ¿Cuál evento quieres eliminar?',
          'Claro, puedo ayudarte a cancelar un evento. ¿Cuál quieres eliminar?',
          'Por supuesto, vamos a cancelar ese evento. ¿Cuál es el que quieres borrar?',
        ];

      default:
        return [
          'No estoy segura de haber entendido bien. ¿Podrías reformular tu solicitud?',
          'Disculpa, no logré entender completamente. ¿Podrías decírmelo de otra manera?',
          'Hmm, no estoy segura de qué necesitas. Por ejemplo, puedes decir "Agendar cita con el dentista mañana a las 3"',
          'Lo siento, no capté bien tu solicitud. ¿Podrías explicármelo otra vez?',
        ];
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'mañana';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    }
  }
}

export const nlpService = new NLPService();