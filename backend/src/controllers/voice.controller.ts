import { Request, Response } from 'express';
import { VoiceService } from '../services/VoiceService';
import { VoiceSessionRepository } from '../repositories/VoiceSessionRepository';
import { AIService } from '../services/AIService';
import { EventService } from '../services/event/eventService';
import { PrismaClient } from '@prisma/client';
import { HTTP_STATUS } from '../config/constants';

const prisma = new PrismaClient();
const voiceSessionRepo = new VoiceSessionRepository(prisma);
const voiceService = new VoiceService(voiceSessionRepo);

const successResponse = (data: any, message?: string) => ({ success: true, message, data });
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) =>
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class VoiceController {
  /**
   * POST /api/voice/process - Procesar comando de voz
   */
  static processCommand = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const result = await voiceService.processVoiceCommand(userId, req.body);

    res.status(200).json(successResponse(result, 'Comando procesado'));
  });

  /**
   * GET /api/voice/history - Historial de comandos
   */
  static getHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const history = await voiceService.getVoiceHistory(userId, limit);
    res.status(200).json(successResponse({ history, total: history.length }));
  });

  /**
   * GET /api/voice/stats - Estadísticas de voz
   */
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const stats = await voiceService.getVoiceStats(userId);

    res.status(200).json(successResponse({ stats }));
  });

  /**
   * GET /api/voice/accuracy - Precisión por intención
   */
  static getAccuracyByIntent = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const accuracy = await voiceService.getAccuracyByIntent(userId);

    res.status(200).json(successResponse({ accuracy }));
  });

  /**
   * GET /api/voice/intents - Intenciones más frecuentes
   */
  static getCommonIntents = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const intents = await voiceService.getMostCommonIntents(userId, limit);
    res.status(200).json(successResponse({ intents }));
  });

  /**
   * POST /api/voice/query - Procesar consulta de voz (preguntas, no comandos)
   * Ejemplos: "¿Qué tengo hoy?", "¿Cuáles son mis citas de mañana?"
   */
  static processQuery = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { transcript } = req.body;

    if (!transcript || typeof transcript !== 'string') {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'El campo transcript es requerido'
      });
      return;
    }

    // 1. Procesar consulta con IA
    const aiService = new AIService();
    const queryResult = await aiService.processVoiceQuery({
      transcript,
      userId,
      currentDate: new Date()
    });

    if (!queryResult.success) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: queryResult.answer,
        error: queryResult.error,
        tokensUsed: queryResult.tokensUsed,
        processingTime: queryResult.processingTime
      });
      return;
    }

    // 2. Obtener eventos según los filtros
    let events: any[] = [];

    if (queryResult.needsData && queryResult.filters) {
      const filters = queryResult.filters;

      switch (filters.timeframe) {
        case 'today':
          events = await EventService.getTodayEvents(userId);
          break;
        case 'tomorrow':
          // Obtener eventos de mañana
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0));
          const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999));
          const result = await EventService.listEvents(userId, {
            startDate: startOfTomorrow,
            endDate: endOfTomorrow
          });
          events = result.items;
          break;
        case 'week':
          events = await EventService.getWeekEvents(userId);
          break;
        case 'custom':
          if (filters.startDate) {
            const result = await EventService.listEvents(userId, {
              startDate: filters.startDate,
              endDate: filters.endDate,
              searchQuery: filters.searchQuery
            });
            events = result.items;
          }
          break;
        default:
          // Próximos eventos
          events = await EventService.getUpcomingEvents(userId, 10);
      }
    }

    // 3. Generar respuesta natural con los eventos encontrados
    const answer = await aiService.generateQueryResponse(queryResult, events);

    res.status(HTTP_STATUS.OK).json(
      successResponse({
        answer,
        queryType: queryResult.queryType,
        events: events.slice(0, 10), // Máximo 10 eventos en la respuesta
        eventCount: events.length,
        filters: queryResult.filters,
        aiMetrics: {
          intent: queryResult.intent,
          tokensUsed: queryResult.tokensUsed,
          processingTime: queryResult.processingTime
        }
      }, 'Consulta procesada')
    );
  });
}

export default VoiceController;
