import { Request, Response } from 'express';
import { MessageService } from '../services/MessageService';
import { ContactRepository } from '../repositories/ContactRepository';
import { MessageRepository } from '../repositories/MessageRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const messageRepo = new MessageRepository(prisma);
const contactRepo = new ContactRepository(prisma);
const messageService = new MessageService(messageRepo, contactRepo);

const successResponse = (data: any, message?: string) => ({ success: true, message, data });
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) =>
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class MessageController {
  /**
   * POST /api/messages - Enviar mensaje
   */
  static sendMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const result = await messageService.sendMessage(userId, req.body);

    res.status(201).json(successResponse(result, 'Mensaje enviado'));
  });

  /**
   * GET /api/messages - Listar mensajes
   */
  static listMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

    const messages = await messageService.getUserMessages(userId, limit);
    res.status(200).json(successResponse({ messages, total: messages.length }));
  });

  /**
   * GET /api/messages/conversations - Conversaciones recientes
   */
  static getConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

    const conversations = await messageService.getRecentConversations(userId, limit);
    res.status(200).json(successResponse({ conversations }));
  });

  /**
   * GET /api/messages/conversation/:contactId - Conversación con contacto
   */
  static getConversation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { contactId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const messages = await messageService.getConversation(userId, contactId, limit);
    res.status(200).json(successResponse({ messages }));
  });

  /**
   * GET /api/messages/unread - Mensajes no leídos
   */
  static getUnreadMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const messages = await messageService.getUnreadMessages(userId);

    res.status(200).json(successResponse({ messages, count: messages.length }));
  });

  /**
   * GET /api/messages/unread/count - Contador de no leídos
   */
  static getUnreadCount = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const count = await messageService.getUnreadCount(userId);

    res.status(200).json(successResponse({ count }));
  });

  /**
   * POST /api/messages/:id/read - Marcar como leído
   */
  static markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const message = await messageService.markAsRead(id);

    res.status(200).json(successResponse({ message }, 'Marcado como leído'));
  });

  /**
   * POST /api/messages/conversation/:contactId/read - Marcar conversación como leída
   */
  static markConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { contactId } = req.params;

    const count = await messageService.markConversationAsRead(userId, contactId);
    res.status(200).json(successResponse({ count }, `${count} mensajes marcados como leídos`));
  });

  /**
   * GET /api/messages/search - Buscar mensajes
   */
  static searchMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ success: false, message: 'Query "q" es requerido' });
    }

    const messages = await messageService.searchMessages(userId, q as string);
    res.status(200).json(successResponse({ messages, total: messages.length }));
  });

  /**
   * GET /api/messages/stats - Estadísticas
   */
  static getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const stats = await messageService.getMessageStats(userId);

    res.status(200).json(successResponse({ stats }));
  });

  /**
   * POST /api/messages/:id/retry - Reintentar mensaje fallido
   */
  static retryMessage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await messageService.retryFailedMessage(id);

    res.status(200).json(successResponse(result, 'Mensaje reenviado'));
  });

  /**
   * DELETE /api/messages/:id - Eliminar mensaje
   */
  static deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await messageService.deleteMessage(id);

    res.status(200).json(successResponse(null, 'Mensaje eliminado'));
  });
}

export default MessageController;
