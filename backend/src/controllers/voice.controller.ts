import { Request, Response } from 'express';
import { VoiceService } from '../services/VoiceService';
import { VoiceSessionRepository } from '../repositories/VoiceSessionRepository';
import { PrismaClient } from '@prisma/client';

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
}

export default VoiceController;
