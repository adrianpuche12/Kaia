import { PrismaClient, Place } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import { RepositoryEvent } from './base/IRepository';

export interface PlaceCreateData {
  userId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string; // Google Place ID
  placeType?: string;
  openingHours?: any;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
}

export interface PlaceUpdateData {
  name?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
  placeType?: string;
  openingHours?: any;
  phone?: string;
  website?: string;
  rating?: number;
  priceLevel?: number;
  visitCount?: number;
  lastVisitAt?: Date;
  lastFetchedAt?: Date;
}

export interface PlaceFilters {
  userId?: string;
  placeType?: string;
  minRating?: number;
  maxPriceLevel?: number;
  hasPhone?: boolean;
  hasWebsite?: boolean;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * PlaceRepository
 * Gestiona lugares y ubicaciones con funcionalidades avanzadas:
 * - Integración con Google Places API
 * - Cache de información de lugares
 * - Lugares frecuentes
 * - Geolocalización y proximidad
 * - Cálculo de distancias
 */
export class PlaceRepository extends BaseRepository<Place> {
  /**
   * Crear un nuevo lugar
   */
  async create(data: PlaceCreateData): Promise<Place> {
    const place = await this.prisma.place.create({
      data: {
        userId: data.userId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        placeId: data.placeId,
        placeType: data.placeType,
        openingHours: data.openingHours ? JSON.stringify(data.openingHours) : null,
        phone: data.phone,
        website: data.website,
        rating: data.rating,
        priceLevel: data.priceLevel,
        visitCount: 0,
        lastFetchedAt: new Date()
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'CREATE',
      entityType: 'PLACE',
      entityId: place.id,
      userId: place.userId || 'system',
      data: place,
      timestamp: new Date()
    });

    return place;
  }

  /**
   * Buscar lugar por ID
   */
  async findById(id: string): Promise<Place | null> {
    return await this.prisma.place.findUnique({
      where: { id }
    });
  }

  /**
   * Actualizar lugar
   */
  async update(id: string, data: PlaceUpdateData): Promise<Place> {
    const updateData: any = { ...data };

    // Convertir openingHours a JSON string si está presente
    if (data.openingHours) {
      updateData.openingHours = JSON.stringify(data.openingHours);
    }

    const place = await this.prisma.place.update({
      where: { id },
      data: updateData
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'PLACE',
      entityId: place.id,
      userId: place.userId || 'system',
      data: place,
      timestamp: new Date()
    });

    return place;
  }

  /**
   * Eliminar lugar
   */
  async delete(id: string): Promise<void> {
    const place = await this.findById(id);
    if (!place) {
      throw new Error('Place not found');
    }

    await this.prisma.place.delete({
      where: { id }
    });

    await this.notifyObservers({
      type: 'DELETE',
      entityType: 'PLACE',
      entityId: id,
      userId: place.userId || 'system',
      data: null,
      timestamp: new Date()
    });
  }

  /**
   * Buscar múltiples lugares con filtros
   */
  async findMany(filters: PlaceFilters): Promise<Place[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.placeType) {
      where.placeType = filters.placeType;
    }

    if (filters.minRating !== undefined) {
      where.rating = { gte: filters.minRating };
    }

    if (filters.maxPriceLevel !== undefined) {
      where.priceLevel = { lte: filters.maxPriceLevel };
    }

    if (filters.hasPhone !== undefined) {
      where.phone = filters.hasPhone ? { not: null } : null;
    }

    if (filters.hasWebsite !== undefined) {
      where.website = filters.hasWebsite ? { not: null } : null;
    }

    return await this.prisma.place.findMany({
      where,
      orderBy: { visitCount: 'desc' }
    });
  }

  /**
   * Buscar lugares de un usuario
   */
  async findByUser(userId: string): Promise<Place[]> {
    return await this.prisma.place.findMany({
      where: { userId },
      orderBy: { lastVisitAt: 'desc' }
    });
  }

  /**
   * Buscar lugar por Google Place ID
   */
  async findByPlaceId(placeId: string): Promise<Place | null> {
    return await this.prisma.place.findUnique({
      where: { placeId }
    });
  }

  /**
   * Buscar o crear lugar por Google Place ID
   * Útil para cachear información de Google Places
   */
  async findOrCreateByPlaceId(
    placeId: string,
    data: PlaceCreateData
  ): Promise<Place> {
    const existing = await this.findByPlaceId(placeId);
    if (existing) {
      // Actualizar última vez que se consultó
      return await this.update(existing.id, {
        lastFetchedAt: new Date()
      });
    }

    return await this.create({
      ...data,
      placeId
    });
  }

  /**
   * Buscar lugares frecuentes del usuario
   * Ordenados por cantidad de visitas
   */
  async findFrequent(userId: string, limit: number = 10): Promise<Place[]> {
    return await this.prisma.place.findMany({
      where: { userId },
      orderBy: { visitCount: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar lugares recientes del usuario
   */
  async findRecent(userId: string, limit: number = 10): Promise<Place[]> {
    return await this.prisma.place.findMany({
      where: {
        userId,
        lastVisitAt: { not: null }
      },
      orderBy: { lastVisitAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar lugares por tipo
   */
  async findByType(placeType: string, userId?: string): Promise<Place[]> {
    const where: any = { placeType };
    if (userId) {
      where.userId = userId;
    }

    return await this.prisma.place.findMany({
      where,
      orderBy: { visitCount: 'desc' }
    });
  }

  /**
   * Incrementar contador de visitas
   */
  async incrementVisitCount(id: string): Promise<Place> {
    const place = await this.prisma.place.update({
      where: { id },
      data: {
        visitCount: { increment: 1 },
        lastVisitAt: new Date()
      }
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'PLACE',
      entityId: place.id,
      userId: place.userId || 'system',
      data: { ...place, event: 'VISIT_INCREMENTED' },
      timestamp: new Date()
    });

    return place;
  }

  /**
   * Calcular distancia entre dos coordenadas usando fórmula de Haversine
   * Retorna distancia en metros
   */
  calculateDistance(coords1: Coordinates, coords2: Coordinates): number {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = (coords1.latitude * Math.PI) / 180;
    const φ2 = (coords2.latitude * Math.PI) / 180;
    const Δφ = ((coords2.latitude - coords1.latitude) * Math.PI) / 180;
    const Δλ = ((coords2.longitude - coords1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
  }

  /**
   * Buscar lugares cercanos a una ubicación
   * radiusMeters: radio de búsqueda en metros
   */
  async findNearby(
    coords: Coordinates,
    radiusMeters: number = 500,
    userId?: string
  ): Promise<Array<Place & { distance: number }>> {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    const allPlaces = await this.prisma.place.findMany({ where });

    // Calcular distancia y filtrar
    const placesWithDistance = allPlaces
      .map(place => ({
        ...place,
        distance: this.calculateDistance(coords, {
          latitude: place.latitude,
          longitude: place.longitude
        })
      }))
      .filter(place => place.distance <= radiusMeters)
      .sort((a, b) => a.distance - b.distance);

    return placesWithDistance;
  }

  /**
   * Verificar si una ubicación está cerca de un lugar guardado
   */
  async isNearPlace(
    coords: Coordinates,
    placeId: string,
    thresholdMeters: number = 100
  ): Promise<boolean> {
    const place = await this.findById(placeId);
    if (!place) return false;

    const distance = this.calculateDistance(coords, {
      latitude: place.latitude,
      longitude: place.longitude
    });

    return distance <= thresholdMeters;
  }

  /**
   * Buscar el lugar más cercano del usuario
   */
  async findClosest(coords: Coordinates, userId: string): Promise<(Place & { distance: number }) | null> {
    const nearbyPlaces = await this.findNearby(coords, 10000, userId); // 10km
    return nearbyPlaces.length > 0 ? nearbyPlaces[0] : null;
  }

  /**
   * Actualizar información desde Google Places API
   * (simulado - en producción conectar con API real)
   */
  async updateFromGooglePlaces(
    placeId: string,
    googleData: Partial<PlaceUpdateData>
  ): Promise<Place> {
    const place = await this.findByPlaceId(placeId);
    if (!place) {
      throw new Error('Place not found');
    }

    return await this.update(place.id, {
      ...googleData,
      lastFetchedAt: new Date()
    });
  }

  /**
   * Verificar si el cache del lugar está desactualizado
   * Considera desactualizado si han pasado más de 7 días
   */
  isCacheStale(place: Place, maxAgeDays: number = 7): boolean {
    if (!place.lastFetchedAt) return true;

    const now = new Date();
    const daysSinceLastFetch =
      (now.getTime() - place.lastFetchedAt.getTime()) / (1000 * 60 * 60 * 24);

    return daysSinceLastFetch > maxAgeDays;
  }

  /**
   * Parsear openingHours de JSON string a objeto
   */
  parseOpeningHours(place: Place): any {
    if (!place.openingHours) return null;
    try {
      return JSON.parse(place.openingHours);
    } catch {
      return null;
    }
  }

  /**
   * Obtener estadísticas de lugares del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    visited: number;
    notVisited: number;
    mostVisited: Place | null;
    avgVisitCount: number;
    placeTypes: { [key: string]: number };
  }> {
    const places = await this.findByUser(userId);

    const visited = places.filter(p => p.visitCount > 0).length;
    const mostVisited = places.length > 0
      ? places.reduce((prev, curr) => (prev.visitCount > curr.visitCount ? prev : curr))
      : null;

    const avgVisitCount = places.length > 0
      ? places.reduce((sum, p) => sum + p.visitCount, 0) / places.length
      : 0;

    // Contar por tipo
    const placeTypes: { [key: string]: number } = {};
    places.forEach(place => {
      if (place.placeType) {
        placeTypes[place.placeType] = (placeTypes[place.placeType] || 0) + 1;
      }
    });

    return {
      total: places.length,
      visited,
      notVisited: places.length - visited,
      mostVisited,
      avgVisitCount: Math.round(avgVisitCount * 10) / 10,
      placeTypes
    };
  }

  /**
   * Contar todos los lugares
   */
  async countAll(userId?: string): Promise<number> {
    return await this.count('place', userId ? { userId } : {});
  }

  /**
   * Buscar lugares por nombre (búsqueda parcial)
   */
  async searchByName(query: string, userId?: string): Promise<Place[]> {
    const where: any = {
      name: { contains: query, mode: 'insensitive' as any }
    };

    if (userId) {
      where.userId = userId;
    }

    return await this.prisma.place.findMany({
      where,
      orderBy: { visitCount: 'desc' }
    });
  }

  /**
   * Buscar lugares por dirección (búsqueda parcial)
   */
  async searchByAddress(query: string, userId?: string): Promise<Place[]> {
    const where: any = {
      address: { contains: query, mode: 'insensitive' as any }
    };

    if (userId) {
      where.userId = userId;
    }

    return await this.prisma.place.findMany({
      where,
      orderBy: { visitCount: 'desc' }
    });
  }

  /**
   * Limpiar lugares antiguos sin visitas
   * Útil para mantenimiento de BD
   */
  async cleanupOldUnvisited(maxAgeDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const result = await this.prisma.place.deleteMany({
      where: {
        visitCount: 0,
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}
