import { Request, Response } from 'express';
import { LocationService } from '../services/LocationService';
import { PlaceRepository } from '../repositories/PlaceRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const placeRepo = new PlaceRepository(prisma);
const locationService = new LocationService(placeRepo);

const successResponse = (data: any, message?: string) => ({ success: true, message, data });
const asyncHandler = (fn: (req: Request, res: Response, next: any) => Promise<any>) =>
  (req: Request, res: Response, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export class LocationController {
  /**
   * POST /api/location - Actualizar ubicación actual
   */
  static updateLocation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const location = await locationService.updateLocation(userId, req.body);

    res.status(200).json(successResponse(location, 'Ubicación actualizada'));
  });

  /**
   * GET /api/location - Obtener última ubicación
   */
  static getLastLocation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const location = await locationService.getLastKnownLocation(userId);

    res.status(200).json(successResponse({ location }));
  });

  /**
   * GET /api/location/history - Historial de ubicaciones
   */
  static getLocationHistory = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { startDate, endDate, limit } = req.query;

    const history = await locationService.getLocationHistory(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      limit ? parseInt(limit as string) : 100
    );

    res.status(200).json(successResponse({ history, total: history.length }));
  });

  /**
   * GET /api/location/stats - Estadísticas de ubicación
   */
  static getLocationStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const stats = await locationService.getLocationStats(userId);

    res.status(200).json(successResponse({ stats }));
  });

  /**
   * POST /api/location/geofence - Crear geofence
   */
  static createGeofence = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const geofence = await locationService.createGeofence(userId, req.body);

    res.status(201).json(successResponse(geofence, 'Geofence creado'));
  });

  /**
   * GET /api/location/geofences - Listar geofences
   */
  static listGeofences = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const geofences = await locationService.getUserGeofences(userId);

    res.status(200).json(successResponse({ geofences, total: geofences.length }));
  });

  /**
   * DELETE /api/location/geofence/:id - Eliminar geofence
   */
  static deleteGeofence = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await locationService.deleteGeofence(id);

    res.status(200).json(successResponse(null, 'Geofence eliminado'));
  });

  /**
   * GET /api/location/nearby - Buscar lugares cercanos
   */
  static findNearbyPlaces = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const radiusKm = req.query.radius ? parseFloat(req.query.radius as string) : 5;
    const type = req.query.type as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const places = await locationService.findNearbyPlaces(userId, radiusKm, type, limit);

    res.status(200).json(successResponse({ places, total: places.length }));
  });

  /**
   * GET /api/location/closest - Encontrar lugar más cercano
   */
  static findClosestPlace = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const result = await locationService.findClosestPlace(userId);

    res.status(200).json(successResponse(result));
  });

  /**
   * GET /api/location/near/:placeId - Verificar si está cerca de lugar
   */
  static isNearPlace = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user!.id;
    const { placeId } = req.params;
    const radius = req.query.radius ? parseInt(req.query.radius as string) : 100;

    const result = await locationService.isNearPlace(userId, placeId, radius);

    res.status(200).json(successResponse(result));
  });

  /**
   * POST /api/location/route - Calcular ruta
   */
  static calculateRoute = asyncHandler(async (req: Request, res: Response) => {
    const { from, to, mode } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'From and to coordinates are required'
      });
    }

    const route = await locationService.calculateRoute(from, to, mode);

    res.status(200).json(successResponse({ route }));
  });

  /**
   * POST /api/location/geocode - Geocodificar dirección
   */
  static geocode = asyncHandler(async (req: Request, res: Response) => {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: 'Address is required'
      });
    }

    const result = await locationService.geocode(address);

    res.status(200).json(successResponse(result));
  });

  /**
   * POST /api/location/reverse-geocode - Geocodificación inversa
   */
  static reverseGeocode = asyncHandler(async (req: Request, res: Response) => {
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const result = await locationService.reverseGeocode(latitude, longitude);

    res.status(200).json(successResponse(result));
  });
}

export default LocationController;
