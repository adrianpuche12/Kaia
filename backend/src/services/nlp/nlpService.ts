// Servicio de Procesamiento de Lenguaje Natural
import { ParsedIntent, NLPRequest, NLPResponse } from '../../types';
import { NLP_INTENTS } from '../../config/constants';
import { parseRelativeDate, parseTime, combineDateAndTime } from '../../utils/dateParser';
import { logger } from '../../utils/logger';

export class NLPService {
  /**
   * Procesa un comando de voz en lenguaje natural
   */
  static async processCommand(input: string, context?: any): Promise<NLPResponse> {
    const normalized = input.toLowerCase().trim();

    // Detectar intención
    const intent = this.detectIntent(normalized);

    // Extraer entidades según la intención
    const entities = this.extractEntities(normalized, intent);

    // Calcular confianza
    const confidence = this.calculateConfidence(normalized, intent, entities);

    // Determinar si necesita clarificación
    const needsClarification = confidence < 0.7 || this.hasAmbiguousEntities(entities);
    const clarificationQuestion = needsClarification
      ? this.generateClarificationQuestion(intent, entities)
      : undefined;

    logger.info('NLP command processed', {
      input,
      intent,
      confidence,
      needsClarification
    });

    return {
      originalText: input,
      intent,
      entities,
      confidence,
      needsClarification,
      clarificationQuestion,
      suggestedActions: this.generateSuggestedActions(intent, entities),
    };
  }

  /**
   * Detecta la intención del usuario
   */
  private static detectIntent(text: string): string {
    // Crear evento
    if (
      /\b(crear|agendar|programa|agregar|nueva?|poner)\b.*\b(cita|evento|reunión|junta|encuentro)\b/i.test(text) ||
      /\b(recordar(?:me)?|recorda)\b.*\b(que|de)\b/i.test(text) ||
      /\bteng[oa]\s+(una?\s+)?(cita|reunión|evento|junta)/i.test(text)
    ) {
      return NLP_INTENTS.CREATE_EVENT;
    }

    // Crear recordatorio
    if (
      /\b(recordar(?:me)?|recordatorio|avisa(?:me)?|notifica(?:me)?)\b/i.test(text) &&
      !/\b(evento|cita|reunión)\b/i.test(text)
    ) {
      return NLP_INTENTS.CREATE_REMINDER;
    }

    // Crear alarma
    if (/\b(alarma|despertador|despierta(?:me)?)\b/i.test(text)) {
      return NLP_INTENTS.CREATE_ALARM;
    }

    // Consultar eventos
    if (
      /\b(qué|que|cuál|cual|cuáles|cuales|tengo|hay)\b.*\b(eventos?|citas?|reuniones?|pendientes?|agenda)\b/i.test(text) ||
      /\b(mi|ver|mostrar|lista)\b.*\b(agenda|calendario|eventos?|citas?)\b/i.test(text)
    ) {
      return NLP_INTENTS.QUERY_EVENTS;
    }

    // Enviar mensaje
    if (
      /\b(enviar|mandar|escribir|manda)\b.*\b(mensaje|whatsapp|email|correo|sms)\b/i.test(text) ||
      /\b(decir(?:le)?|avisar(?:le)?|comunicar(?:le)?)\b.*\ba\s+\w+/i.test(text)
    ) {
      return NLP_INTENTS.SEND_MESSAGE;
    }

    // Leer mensajes
    if (
      /\b(leer|revisar|ver|mostrar|tengo|hay)\b.*\b(mensajes?|whatsapp|correos?|emails?)\b/i.test(text) ||
      /\b(mensajes?|correos?)\b.*\b(nuevos?|sin leer|pendientes?)\b/i.test(text)
    ) {
      return NLP_INTENTS.READ_MESSAGES;
    }

    // Información de ubicación
    if (
      /\b(dónde|donde|ubicación|dirección|cómo llegar|llegar a)\b/i.test(text) ||
      /\b(tráfico|traffic|ruta|camino)\b.*\b(hacia|a|para)\b/i.test(text) ||
      /\b(cuánto (tiempo )?tarda|cuanto (tiempo )?tarda|eta|tiempo estimado)\b/i.test(text)
    ) {
      return NLP_INTENTS.GET_LOCATION_INFO;
    }

    // Ejecutar MCP personalizado
    if (/\b(ejecutar|correr|activar|usar)\b.*\b(mcp|conector|integración)\b/i.test(text)) {
      return NLP_INTENTS.EXECUTE_MCP;
    }

    // Configuración
    if (/\b(configurar|ajustar|cambiar|modificar)\b.*\b(preferencias?|ajustes?|configuración)\b/i.test(text)) {
      return NLP_INTENTS.UPDATE_PREFERENCES;
    }

    // Por defecto
    return NLP_INTENTS.UNKNOWN;
  }

  /**
   * Extrae entidades del texto según la intención
   */
  private static extractEntities(text: string, intent: string): Record<string, any> {
    const entities: Record<string, any> = {};

    switch (intent) {
      case NLP_INTENTS.CREATE_EVENT:
        return this.extractEventEntities(text);

      case NLP_INTENTS.CREATE_REMINDER:
        return this.extractReminderEntities(text);

      case NLP_INTENTS.CREATE_ALARM:
        return this.extractAlarmEntities(text);

      case NLP_INTENTS.QUERY_EVENTS:
        return this.extractQueryEntities(text);

      case NLP_INTENTS.SEND_MESSAGE:
        return this.extractMessageEntities(text);

      case NLP_INTENTS.GET_LOCATION_INFO:
        return this.extractLocationEntities(text);

      default:
        return entities;
    }
  }

  /**
   * Extrae entidades de eventos
   */
  private static extractEventEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer título del evento (entre comillas o después de palabras clave)
    const titleMatch = text.match(/"([^"]+)"|'([^']+)'|(?:titulad[ao]|llamad[ao]|de nombre)\s+([^,\.]+)/i);
    if (titleMatch) {
      entities.title = (titleMatch[1] || titleMatch[2] || titleMatch[3]).trim();
    } else {
      // Intenta extraer después de "evento", "cita", "reunión"
      const fallbackMatch = text.match(/(?:evento|cita|reunión|junta)\s+(?:de\s+|con\s+)?([^,\.]+)/i);
      if (fallbackMatch) {
        entities.title = fallbackMatch[1].trim();
      }
    }

    // Extraer fecha
    const dateMatch = text.match(/\b(hoy|mañana|pasado mañana|el\s+\w+|próxim[ao]\s+\w+|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i);
    if (dateMatch) {
      const parsedDate = parseRelativeDate(dateMatch[1]);
      if (parsedDate) {
        entities.date = parsedDate;
      }
    }

    // Extraer hora
    const timeMatch = text.match(/\b(a las?|a la)\s+(\d{1,2}(?::\d{2})?)\s*(am|pm|de la mañana|de la tarde|de la noche)?/i);
    if (timeMatch) {
      const parsedTime = parseTime(`${timeMatch[2]} ${timeMatch[3] || ''}`);
      if (parsedTime) {
        entities.time = parsedTime;
      }
    }

    // Combinar fecha y hora
    if (entities.date && entities.time) {
      entities.startTime = combineDateAndTime(entities.date, entities.time.hour, entities.time.minute);
    }

    // Extraer ubicación
    const locationMatch = text.match(/\b(?:en|ubicación|lugar|dirección)\s+([^,\.]+)/i);
    if (locationMatch) {
      entities.location = locationMatch[1].trim();
    }

    // Extraer duración
    const durationMatch = text.match(/\b(?:duración|dura|por)\s+(\d+)\s*(horas?|minutos?|h|min)/i);
    if (durationMatch) {
      const value = parseInt(durationMatch[1], 10);
      const unit = durationMatch[2].toLowerCase();
      entities.duration = unit.startsWith('h') ? value * 60 : value; // En minutos
    }

    // Extraer descripción
    const descMatch = text.match(/\b(?:descripción|nota|acerca de|sobre)\s+([^,\.]+)/i);
    if (descMatch) {
      entities.description = descMatch[1].trim();
    }

    return entities;
  }

  /**
   * Extrae entidades de recordatorios
   */
  private static extractReminderEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer contenido del recordatorio
    const contentMatch = text.match(/(?:recordar(?:me)?|que)\s+(.+?)(?:\s+(?:mañana|hoy|el|a las?)|$)/i);
    if (contentMatch) {
      entities.content = contentMatch[1].trim();
    }

    // Extraer fecha/hora
    const dateMatch = text.match(/\b(hoy|mañana|pasado mañana|el\s+\w+|próxim[ao]\s+\w+|\d{1,2}\/\d{1,2})/i);
    if (dateMatch) {
      const parsedDate = parseRelativeDate(dateMatch[1]);
      if (parsedDate) {
        entities.date = parsedDate;
      }
    }

    const timeMatch = text.match(/\b(a las?|a la)\s+(\d{1,2}(?::\d{2})?)\s*(am|pm|de la mañana|de la tarde)?/i);
    if (timeMatch) {
      const parsedTime = parseTime(`${timeMatch[2]} ${timeMatch[3] || ''}`);
      if (parsedTime) {
        entities.time = parsedTime;
      }
    }

    if (entities.date && entities.time) {
      entities.remindAt = combineDateAndTime(entities.date, entities.time.hour, entities.time.minute);
    }

    return entities;
  }

  /**
   * Extrae entidades de alarmas
   */
  private static extractAlarmEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer hora
    const timeMatch = text.match(/\b(a las?|a la)\s+(\d{1,2}(?::\d{2})?)\s*(am|pm|de la mañana|de la tarde)?/i);
    if (timeMatch) {
      const parsedTime = parseTime(`${timeMatch[2]} ${timeMatch[3] || ''}`);
      if (parsedTime) {
        entities.time = parsedTime;
      }
    }

    // Extraer días de la semana
    const daysMatch = text.match(/\b(lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo|diario|todos los días)\b/gi);
    if (daysMatch) {
      entities.days = daysMatch.map(day => day.toLowerCase());
    }

    // Extraer etiqueta
    const labelMatch = text.match(/\b(?:llamad[ao]|etiquet[ao]|nombre)\s+([^,\.]+)/i);
    if (labelMatch) {
      entities.label = labelMatch[1].trim();
    }

    return entities;
  }

  /**
   * Extrae entidades de consultas de eventos
   */
  private static extractQueryEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer rango de fecha
    if (/\bhoy\b/i.test(text)) {
      entities.dateFilter = 'today';
    } else if (/\bmañana\b/i.test(text)) {
      entities.dateFilter = 'tomorrow';
    } else if (/\b(esta\s+)?semana\b/i.test(text)) {
      entities.dateFilter = 'this_week';
    } else if (/\b(este\s+)?mes\b/i.test(text)) {
      entities.dateFilter = 'this_month';
    }

    return entities;
  }

  /**
   * Extrae entidades de mensajes
   */
  private static extractMessageEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer destinatario
    const recipientMatch = text.match(/\b(?:a|para)\s+([A-Za-zÀ-ÿ\s]+?)(?:\s+(?:que|diciendo|el mensaje|:|,))/i);
    if (recipientMatch) {
      entities.recipient = recipientMatch[1].trim();
    }

    // Extraer contenido del mensaje
    const contentMatch = text.match(/(?:que|diciendo|mensaje|:|")\s*([^"]+)/i);
    if (contentMatch) {
      entities.content = contentMatch[1].trim().replace(/["']/g, '');
    }

    // Extraer tipo de mensaje
    if (/\bwhatsapp\b/i.test(text)) {
      entities.type = 'WHATSAPP';
    } else if (/\b(email|correo)\b/i.test(text)) {
      entities.type = 'EMAIL';
    } else if (/\bsms\b/i.test(text)) {
      entities.type = 'SMS';
    }

    return entities;
  }

  /**
   * Extrae entidades de ubicación
   */
  private static extractLocationEntities(text: string): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extraer destino
    const destinationMatch = text.match(/\b(?:a|hacia|para|de|en)\s+([^,\.?]+)/i);
    if (destinationMatch) {
      entities.destination = destinationMatch[1].trim();
    }

    // Detectar si pide ETA
    if (/\b(cuánto|cuanto|tiempo|tarda|eta|estimado)\b/i.test(text)) {
      entities.needsETA = true;
    }

    // Detectar si pide tráfico
    if (/\b(tráfico|traffic|congestión)\b/i.test(text)) {
      entities.needsTraffic = true;
    }

    // Detectar si pide ruta
    if (/\b(ruta|camino|cómo llegar|como llegar)\b/i.test(text)) {
      entities.needsRoute = true;
    }

    return entities;
  }

  /**
   * Calcula la confianza de la interpretación
   */
  private static calculateConfidence(text: string, intent: string, entities: Record<string, any>): number {
    let confidence = 0.5; // Base

    // Incrementar por intención clara
    if (intent !== NLP_INTENTS.UNKNOWN) {
      confidence += 0.2;
    }

    // Incrementar por entidades extraídas
    const entityCount = Object.keys(entities).length;
    confidence += Math.min(entityCount * 0.1, 0.3);

    // Ajustar por ambigüedad
    if (this.hasAmbiguousEntities(entities)) {
      confidence -= 0.2;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Verifica si hay entidades ambiguas
   */
  private static hasAmbiguousEntities(entities: Record<string, any>): boolean {
    // Faltan entidades críticas según el contexto
    if (entities.recipient && !entities.content) return true;
    if (entities.content && !entities.recipient && entities.type) return true;

    return false;
  }

  /**
   * Genera pregunta de clarificación
   */
  private static generateClarificationQuestion(intent: string, entities: Record<string, any>): string {
    switch (intent) {
      case NLP_INTENTS.CREATE_EVENT:
        if (!entities.title) return '¿Cuál es el título del evento?';
        if (!entities.startTime) return '¿Cuándo será el evento?';
        if (!entities.location) return '¿Dónde será el evento?';
        break;

      case NLP_INTENTS.SEND_MESSAGE:
        if (!entities.recipient) return '¿A quién quieres enviar el mensaje?';
        if (!entities.content) return '¿Qué mensaje quieres enviar?';
        if (!entities.type) return '¿Por qué medio? (WhatsApp, Email, SMS)';
        break;

      case NLP_INTENTS.CREATE_REMINDER:
        if (!entities.content) return '¿Qué te recuerdo?';
        if (!entities.remindAt) return '¿Cuándo quieres que te lo recuerde?';
        break;

      case NLP_INTENTS.CREATE_ALARM:
        if (!entities.time) return '¿A qué hora quieres la alarma?';
        break;

      case NLP_INTENTS.GET_LOCATION_INFO:
        if (!entities.destination) return '¿A dónde quieres ir?';
        break;
    }

    return '¿Podrías darme más detalles?';
  }

  /**
   * Genera acciones sugeridas
   */
  private static generateSuggestedActions(intent: string, entities: Record<string, any>): string[] {
    const actions: string[] = [];

    switch (intent) {
      case NLP_INTENTS.CREATE_EVENT:
        if (entities.startTime) {
          actions.push('create_event');
          if (entities.location) {
            actions.push('add_location_to_calendar');
          }
        }
        break;

      case NLP_INTENTS.SEND_MESSAGE:
        if (entities.recipient && entities.content && entities.type) {
          actions.push('send_message');
        }
        break;

      case NLP_INTENTS.GET_LOCATION_INFO:
        if (entities.destination) {
          if (entities.needsETA) actions.push('calculate_eta');
          if (entities.needsRoute) actions.push('show_route');
          if (entities.needsTraffic) actions.push('check_traffic');
        }
        break;

      case NLP_INTENTS.CREATE_REMINDER:
        if (entities.content && entities.remindAt) {
          actions.push('create_reminder');
        }
        break;

      case NLP_INTENTS.CREATE_ALARM:
        if (entities.time) {
          actions.push('create_alarm');
        }
        break;
    }

    return actions;
  }
}

export default NLPService;
