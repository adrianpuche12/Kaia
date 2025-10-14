// Controlador de eventos
import { Request, Response } from 'express';
import { EventService } from '../services/event/eventService';
import { successResponse } from '../utils/helpers';
import { asyncHandler } from '../middleware/errorHandler';
import { HTTP_STATUS } from '../config/constants';

export class EventController {
  /**
   * POST /api/events
   */
  static createEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const event = await EventService.createEvent(userId, req.body);

    res.status(HTTP_STATUS.CREATED).json(
      successResponse({ event }, 'Evento creado')
    );
  });

  /**
   * GET /api/events
   */
  static listEvents = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const filters = {
      startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      category: req.query.category as string,
      status: req.query.status as string,
      searchQuery: req.query.q as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    };

    const result = await EventService.listEvents(userId, filters);

    res.status(HTTP_STATUS.OK).json(successResponse(result));
  });

  /**
   * GET /api/events/today
   */
  static getTodayEvents = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const events = await EventService.getTodayEvents(userId);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ events })
    );
  });

  /**
   * GET /api/events/week
   */
  static getWeekEvents = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const events = await EventService.getWeekEvents(userId);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ events })
    );
  });

  /**
   * GET /api/events/upcoming
   */
  static getUpcomingEvents = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const events = await EventService.getUpcomingEvents(userId, limit);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ events })
    );
  });

  /**
   * GET /api/events/:id
   */
  static getEventById = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = await EventService.getEventById(userId, id);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ event })
    );
  });

  /**
   * PUT /api/events/:id
   */
  static updateEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = await EventService.updateEvent(userId, id, req.body);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ event }, 'Evento actualizado')
    );
  });

  /**
   * POST /api/events/:id/cancel
   */
  static cancelEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = await EventService.cancelEvent(userId, id);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ event }, 'Evento cancelado')
    );
  });

  /**
   * POST /api/events/:id/complete
   */
  static completeEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    const event = await EventService.completeEvent(userId, id);

    res.status(HTTP_STATUS.OK).json(
      successResponse({ event }, 'Evento completado')
    );
  });

  /**
   * DELETE /api/events/:id
   */
  static deleteEvent = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { id } = req.params;

    await EventService.deleteEvent(userId, id);

    res.status(HTTP_STATUS.OK).json(
      successResponse(null, 'Evento eliminado')
    );
  });
}

export default EventController;
