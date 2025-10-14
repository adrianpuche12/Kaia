import { PlaceRepository } from '../repositories/PlaceRepository';
import { Place } from '@prisma/client';

export interface CreatePlaceDTO {
  userId: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  placeId?: string; // Google Place ID
  type?: string;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  openingHours?: any;
}

export interface UpdatePlaceDTO {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  openingHours?: any;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface SearchNearbyDTO {
  location: Location;
  radiusKm?: number;
  type?: string;
  limit?: number;
}

/**
 * PlaceService
 * Capa de lógica de negocio para lugares
 *
 * Responsabilidades:
 * - Validación de coordenadas
 * - Integración con Google Places API
 * - Búsqueda de lugares cercanos
 * - Cálculo de distancias y rutas
 * - Gestión de cache de lugares
 * - Detección de proximidad
 */
export class PlaceService {
  constructor(private placeRepo: PlaceRepository) {}

  /**
   * Crear un nuevo lugar
   * - Valida coordenadas
   * - Verifica si ya existe por placeId
   */
  async createPlace(data: CreatePlaceDTO): Promise<Place> {
    // 1. Validar datos
    this.validatePlaceData(data);

    // 2. Si tiene placeId, verificar si ya existe
    if (data.placeId) {
      const existing = await this.placeRepo.findByPlaceId(data.placeId);
      if (existing) {
        // Actualizar visitas y retornar existente
        await this.placeRepo.incrementVisitCount(existing.id);
        return existing;
      }
    }

    // 3. Crear lugar
    return await this.placeRepo.create({
      userId: data.userId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      placeId: data.placeId,
      placeType: data.type || 'OTHER',
      phone: data.phone,
      website: data.website,
      rating: data.rating,
      priceLevel: data.priceLevel,
      openingHours: data.openingHours,
    });
  }

  /**
   * Actualizar lugar existente
   */
  async updatePlace(placeId: string, data: UpdatePlaceDTO): Promise<Place> {
    const existing = await this.placeRepo.findById(placeId);
    if (!existing) {
      throw new Error('Place not found');
    }

    // Validar coordenadas si se actualizan
    if (data.latitude !== undefined || data.longitude !== undefined) {
      const lat = data.latitude ?? existing.latitude;
      const lng = data.longitude ?? existing.longitude;
      this.validateCoordinates(lat, lng);
    }

    return await this.placeRepo.update(placeId, data);
  }

  /**
   * Eliminar lugar
   */
  async deletePlace(placeId: string): Promise<void> {
    const place = await this.placeRepo.findById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    await this.placeRepo.delete(placeId);
  }

  /**
   * Obtener lugar por ID
   */
  async getPlaceById(placeId: string): Promise<Place | null> {
    return await this.placeRepo.findById(placeId);
  }

  /**
   * Obtener o crear lugar desde Google Places
   * - Si existe en cache y está fresco, retorna cache
   * - Si está desactualizado, actualiza desde Google
   * - Si no existe, lo crea desde Google
   */
  async getOrCreateFromGoogle(
    userId: string,
    googlePlaceId: string
  ): Promise<Place> {
    // Intentar obtener de cache
    const cached = await this.placeRepo.findByPlaceId(googlePlaceId);

    if (cached) {
      // Verificar si cache está fresco
      const isStale = this.placeRepo.isCacheStale(cached);

      if (!isStale) {
        // Cache fresco, retornar
        await this.placeRepo.incrementVisitCount(cached.id);
        return cached;
      }

      // Cache desactualizado, actualizar desde Google
      const updated = await this.updateFromGooglePlaces(cached.id);
      await this.placeRepo.incrementVisitCount(updated.id);
      return updated;
    }

    // No existe en cache, crear desde Google
    // TODO: Integrar con Google Places API
    // Por ahora, lanzar error indicando que se necesita integración
    throw new Error(
      'Place not found in cache. Google Places integration required.'
    );
  }

  /**
   * Actualizar información de lugar desde Google Places API
   */
  async updateFromGooglePlaces(placeId: string): Promise<Place> {
    const place = await this.placeRepo.findById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    if (!place.placeId) {
      throw new Error('Place does not have a Google Place ID');
    }

    // TODO: Implementar llamada a Google Places API
    // Por ahora, solo actualizar lastFetchedAt
    return await this.placeRepo.update(placeId, {
      lastFetchedAt: new Date(),
    });
  }

  /**
   * Buscar lugares del usuario
   */
  async getUserPlaces(userId: string): Promise<Place[]> {
    return await this.placeRepo.findByUser(userId);
  }

  /**
   * Buscar lugares frecuentes del usuario
   */
  async getFrequentPlaces(userId: string, limit?: number): Promise<Place[]> {
    return await this.placeRepo.findFrequent(userId, limit);
  }

  /**
   * Buscar lugares recientes del usuario
   */
  async getRecentPlaces(userId: string, limit?: number): Promise<Place[]> {
    return await this.placeRepo.findRecent(userId, limit);
  }

  /**
   * Buscar lugares por nombre
   */
  async searchByName(userId: string, query: string): Promise<Place[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    return await this.placeRepo.searchByName(query, userId);
  }

  /**
   * Buscar lugares por dirección
   */
  async searchByAddress(userId: string, query: string): Promise<Place[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    return await this.placeRepo.searchByAddress(query, userId);
  }

  /**
   * Buscar lugares por tipo
   */
  async getPlacesByType(userId: string, type: string): Promise<Place[]> {
    return await this.placeRepo.findByType(type, userId);
  }

  /**
   * Buscar lugares cercanos a una ubicación
   */
  async searchNearby(params: SearchNearbyDTO): Promise<
    Array<Place & { distance: number }>
  > {
    const radiusKm = params.radiusKm || 5; // 5 km por defecto
    const radiusMeters = radiusKm * 1000;

    // Obtener lugares cercanos (ya incluye distancia)
    const places = await this.placeRepo.findNearby(
      params.location,
      radiusMeters
    );

    return places;
  }

  /**
   * Obtener lugar más cercano del usuario
   */
  async getClosestPlace(
    userId: string,
    currentLocation: Location
  ): Promise<{ place: Place; distance: number } | null> {
    const closest = await this.placeRepo.findClosest(currentLocation, userId);

    if (!closest) {
      return null;
    }

    return {
      place: closest,
      distance: closest.distance,
    };
  }

  /**
   * Calcular distancia entre dos ubicaciones
   */
  calculateDistance(from: Location, to: Location): number {
    return this.placeRepo.calculateDistance(from, to);
  }

  /**
   * Verificar si usuario está cerca de un lugar
   */
  async isNearPlace(
    placeId: string,
    currentLocation: Location,
    radiusMeters?: number
  ): Promise<{
    isNear: boolean;
    distance: number;
    place: Place;
  }> {
    const place = await this.placeRepo.findById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    const isNear = await this.placeRepo.isNearPlace(
      currentLocation,
      placeId,
      radiusMeters
    );

    const distance = this.placeRepo.calculateDistance(currentLocation, {
      latitude: place.latitude,
      longitude: place.longitude,
    });

    return {
      isNear,
      distance,
      place,
    };
  }

  /**
   * Registrar visita a un lugar
   */
  async recordVisit(placeId: string): Promise<Place> {
    const place = await this.placeRepo.findById(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    // incrementVisitCount ya actualiza lastVisitAt automáticamente
    return await this.placeRepo.incrementVisitCount(placeId);
  }

  /**
   * Obtener estadísticas de lugares del usuario
   */
  async getPlaceStats(userId: string) {
    return await this.placeRepo.getStats(userId);
  }

  /**
   * Limpiar lugares antiguos no visitados
   */
  async cleanupOldPlaces(daysOld?: number): Promise<number> {
    return await this.placeRepo.cleanupOldUnvisited(daysOld);
  }

  /**
   * Calcular tiempo estimado de viaje
   * (Cálculo simple basado en distancia)
   */
  calculateTravelTime(
    from: Location,
    to: Location,
    mode: 'walking' | 'driving' | 'transit' | 'cycling' = 'driving'
  ): {
    distance: number;
    estimatedMinutes: number;
    mode: string;
  } {
    const distance = this.calculateDistance(from, to);

    // Velocidades promedio en km/h
    const speeds = {
      walking: 5,
      cycling: 15,
      driving: 40,
      transit: 30,
    };

    const speedKmh = speeds[mode];
    const estimatedMinutes = Math.ceil((distance / 1000 / speedKmh) * 60);

    return {
      distance,
      estimatedMinutes,
      mode,
    };
  }

  /**
   * VALIDACIONES PRIVADAS
   */

  /**
   * Validar datos de lugar
   */
  private validatePlaceData(data: CreatePlaceDTO): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Place name is required');
    }

    this.validateCoordinates(data.latitude, data.longitude);

    if (data.rating && (data.rating < 0 || data.rating > 5)) {
      throw new Error('Rating must be between 0 and 5');
    }

    if (data.priceLevel && (data.priceLevel < 0 || data.priceLevel > 4)) {
      throw new Error('Price level must be between 0 and 4');
    }
  }

  /**
   * Validar coordenadas geográficas
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (
      typeof latitude !== 'number' ||
      latitude < -90 ||
      latitude > 90
    ) {
      throw new Error('Latitude must be a number between -90 and 90');
    }

    if (
      typeof longitude !== 'number' ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new Error('Longitude must be a number between -180 and 180');
    }
  }
}
