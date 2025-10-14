import { PlaceRepository } from '../repositories/PlaceRepository';

// ============================================================================
// DTOs
// ============================================================================

export interface LocationDTO {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
  timestamp?: Date;
}

export interface UpdateLocationDTO {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

export interface GeofenceDTO {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number; // metros
  placeId?: string;
}

export interface GeofenceEvent {
  type: 'ENTER' | 'EXIT' | 'DWELL';
  geofence: GeofenceDTO;
  location: LocationDTO;
  timestamp: Date;
  userId: string;
}

export interface NearbyResult {
  place: any;
  distance: number; // metros
  bearing?: number; // grados desde norte
  travelTime?: number; // minutos estimados
}

export interface LocationHistoryEntry {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  activity?: 'STILL' | 'WALKING' | 'RUNNING' | 'DRIVING' | 'CYCLING';
}

export interface LocationStats {
  totalLogs: number;
  distanceTraveled: number; // metros
  uniquePlacesVisited: number;
  mostVisitedPlace: any | null;
  averageSpeed: number; // km/h
  timeTracking: number; // minutos
}

export interface TripDTO {
  startLocation: LocationDTO;
  endLocation: LocationDTO;
  waypoints: LocationDTO[];
  distance: number; // metros
  duration: number; // minutos
  startTime: Date;
  endTime: Date;
  mode?: 'WALKING' | 'DRIVING' | 'TRANSIT' | 'CYCLING';
}

// ============================================================================
// LocationService
// ============================================================================

export class LocationService {
  private geofences: Map<string, GeofenceDTO> = new Map();
  private lastKnownLocations: Map<string, LocationDTO> = new Map();

  constructor(
    private placeRepo: PlaceRepository
  ) {}

  // ==========================================================================
  // TRACKING DE UBICACIÓN
  // ==========================================================================

  /**
   * Actualizar ubicación actual del usuario
   */
  async updateLocation(userId: string, location: UpdateLocationDTO): Promise<LocationDTO> {
    // Validar coordenadas
    this.validateCoordinates(location.latitude, location.longitude);

    const locationDTO: LocationDTO = {
      ...location,
      timestamp: new Date()
    };

    // Guardar en caché
    this.lastKnownLocations.set(userId, locationDTO);

    // TODO: Guardar en LocationLog de BD si es necesario
    // await this.locationLogRepo.create({
    //   userId,
    //   latitude: location.latitude,
    //   longitude: location.longitude,
    //   accuracy: location.accuracy,
    //   altitude: location.altitude,
    //   speed: location.speed,
    //   heading: location.heading
    // });

    // Verificar geofences
    await this.checkGeofences(userId, locationDTO);

    return locationDTO;
  }

  /**
   * Obtener última ubicación conocida
   */
  async getLastKnownLocation(userId: string): Promise<LocationDTO | null> {
    // Primero intentar desde caché
    const cached = this.lastKnownLocations.get(userId);
    if (cached) {
      return cached;
    }

    // TODO: Buscar en BD si no está en caché
    // const lastLog = await this.locationLogRepo.findLastByUser(userId);
    // if (lastLog) {
    //   return this.formatLocationLog(lastLog);
    // }

    return null;
  }

  /**
   * Obtener historial de ubicaciones
   */
  async getLocationHistory(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100
  ): Promise<LocationHistoryEntry[]> {
    // TODO: Implementar con LocationLog repository
    // const logs = await this.locationLogRepo.findByUser(userId, {
    //   dateFrom: startDate,
    //   dateTo: endDate,
    //   limit
    // });
    // return logs.map(l => this.formatLocationLog(l));

    return [];
  }

  /**
   * Calcular distancia recorrida en un período
   */
  async calculateDistanceTraveled(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const history = await this.getLocationHistory(userId, startDate, endDate);

    if (history.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];

      totalDistance += this.calculateDistance(
        { latitude: prev.latitude, longitude: prev.longitude },
        { latitude: curr.latitude, longitude: curr.longitude }
      );
    }

    return totalDistance;
  }

  // ==========================================================================
  // GEOFENCING
  // ==========================================================================

  /**
   * Crear geofence (cerca geográfica)
   */
  async createGeofence(userId: string, geofence: Omit<GeofenceDTO, 'id'>): Promise<GeofenceDTO> {
    // Validar coordenadas
    this.validateCoordinates(geofence.latitude, geofence.longitude);

    // Validar radio
    if (geofence.radius <= 0 || geofence.radius > 10000) {
      throw new Error('Radius must be between 1 and 10000 meters');
    }

    const geofenceDTO: GeofenceDTO = {
      id: `geofence_${Date.now()}`,
      ...geofence
    };

    // Guardar en memoria (TODO: persistir en BD)
    this.geofences.set(geofenceDTO.id, geofenceDTO);

    return geofenceDTO;
  }

  /**
   * Eliminar geofence
   */
  async deleteGeofence(geofenceId: string): Promise<void> {
    this.geofences.delete(geofenceId);
    // TODO: Eliminar de BD
  }

  /**
   * Obtener todos los geofences del usuario
   */
  async getUserGeofences(userId: string): Promise<GeofenceDTO[]> {
    // TODO: Filtrar por userId cuando se persista en BD
    return Array.from(this.geofences.values());
  }

  /**
   * Verificar si usuario está dentro de algún geofence
   */
  private async checkGeofences(userId: string, location: LocationDTO): Promise<void> {
    const userGeofences = await this.getUserGeofences(userId);

    for (const geofence of userGeofences) {
      const distance = this.calculateDistance(
        { latitude: location.latitude, longitude: location.longitude },
        { latitude: geofence.latitude, longitude: geofence.longitude }
      );

      if (distance <= geofence.radius) {
        // Usuario dentro del geofence
        await this.onGeofenceEnter(userId, geofence, location);
      } else {
        // Usuario fuera del geofence
        await this.onGeofenceExit(userId, geofence, location);
      }
    }
  }

  /**
   * Evento: Usuario entra a geofence
   */
  private async onGeofenceEnter(
    userId: string,
    geofence: GeofenceDTO,
    location: LocationDTO
  ): Promise<void> {
    const event: GeofenceEvent = {
      type: 'ENTER',
      geofence,
      location,
      timestamp: new Date(),
      userId
    };

    console.log(`[GEOFENCE] User ${userId} entered geofence: ${geofence.name}`);

    // TODO: Trigger acciones (notificaciones, webhooks, etc.)
    // await this.eventBus.emit({ type: 'GEOFENCE_ENTER', data: event });
  }

  /**
   * Evento: Usuario sale de geofence
   */
  private async onGeofenceExit(
    userId: string,
    geofence: GeofenceDTO,
    location: LocationDTO
  ): Promise<void> {
    const event: GeofenceEvent = {
      type: 'EXIT',
      geofence,
      location,
      timestamp: new Date(),
      userId
    };

    console.log(`[GEOFENCE] User ${userId} exited geofence: ${geofence.name}`);

    // TODO: Trigger acciones
    // await this.eventBus.emit({ type: 'GEOFENCE_EXIT', data: event });
  }

  // ==========================================================================
  // BÚSQUEDA Y PROXIMIDAD
  // ==========================================================================

  /**
   * Buscar lugares cercanos a ubicación actual
   */
  async findNearbyPlaces(
    userId: string,
    radiusKm: number = 5,
    type?: string,
    limit: number = 10
  ): Promise<NearbyResult[]> {
    const currentLocation = await this.getLastKnownLocation(userId);
    if (!currentLocation) {
      throw new Error('No location data available for user');
    }

    const radiusMeters = radiusKm * 1000;
    const places = await this.placeRepo.findNearby(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      },
      radiusMeters
    );

    // Calcular bearing y tiempo de viaje
    const results: NearbyResult[] = places.map(place => ({
      place,
      distance: place.distance || 0,
      bearing: this.calculateBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        place.latitude,
        place.longitude
      ),
      travelTime: this.estimateTravelTime(place.distance || 0, 'DRIVING')
    }));

    return results.slice(0, limit);
  }

  /**
   * Encontrar lugar más cercano
   */
  async findClosestPlace(userId: string): Promise<NearbyResult | null> {
    const currentLocation = await this.getLastKnownLocation(userId);
    if (!currentLocation) {
      throw new Error('No location data available for user');
    }

    const result = await this.placeRepo.findClosest(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      },
      userId
    );

    if (!result) {
      return null;
    }

    // result es { place: Place, distance: number }
    const place = (result as any).place || result;
    const distance = (result as any).distance || 0;

    return {
      place: place,
      distance: distance,
      bearing: this.calculateBearing(
        currentLocation.latitude,
        currentLocation.longitude,
        place.latitude,
        place.longitude
      ),
      travelTime: this.estimateTravelTime(distance, 'DRIVING')
    };
  }

  /**
   * Verificar si usuario está cerca de un lugar
   */
  async isNearPlace(
    userId: string,
    placeId: string,
    radiusMeters: number = 100
  ): Promise<{
    isNear: boolean;
    distance: number;
    place: any;
  }> {
    const currentLocation = await this.getLastKnownLocation(userId);
    if (!currentLocation) {
      throw new Error('No location data available for user');
    }

    const result = await this.placeRepo.isNearPlace(
      {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude
      },
      placeId,
      radiusMeters
    );

    // Asegurar que result tenga la estructura correcta
    if (typeof result === 'boolean') {
      // Si solo retorna boolean, buscar el lugar para completar la respuesta
      const place = await this.placeRepo.findById(placeId);
      const distance = place ? this.calculateDistance(
        currentLocation,
        { latitude: place.latitude, longitude: place.longitude }
      ) : 0;

      return {
        isNear: result,
        distance,
        place
      };
    }

    return result as any;
  }

  // ==========================================================================
  // RUTAS Y VIAJES
  // ==========================================================================

  /**
   * Calcular ruta entre dos puntos
   */
  async calculateRoute(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number },
    mode: 'WALKING' | 'DRIVING' | 'TRANSIT' | 'CYCLING' = 'DRIVING'
  ): Promise<{
    distance: number; // metros
    duration: number; // minutos
    bounds: {
      northeast: { latitude: number; longitude: number };
      southwest: { latitude: number; longitude: number };
    };
  }> {
    // Validar coordenadas
    this.validateCoordinates(from.latitude, from.longitude);
    this.validateCoordinates(to.latitude, to.longitude);

    // Calcular distancia directa
    const distance = this.calculateDistance(from, to);

    // Estimar duración según modo de transporte
    const speeds = {
      WALKING: 5,    // km/h
      DRIVING: 40,   // km/h
      TRANSIT: 30,   // km/h
      CYCLING: 15    // km/h
    };

    const speed = speeds[mode];
    const duration = (distance / 1000 / speed) * 60; // minutos

    // TODO: Integrar con Google Maps Directions API para rutas reales
    // const directionsResult = await googleMaps.directions({
    //   origin: from,
    //   destination: to,
    //   mode: mode.toLowerCase()
    // });

    return {
      distance,
      duration: Math.round(duration),
      bounds: {
        northeast: {
          latitude: Math.max(from.latitude, to.latitude),
          longitude: Math.max(from.longitude, to.longitude)
        },
        southwest: {
          latitude: Math.min(from.latitude, to.latitude),
          longitude: Math.min(from.longitude, to.longitude)
        }
      }
    };
  }

  /**
   * Obtener dirección desde coordenadas (Reverse Geocoding)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<{
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  }> {
    this.validateCoordinates(latitude, longitude);

    // TODO: Integrar con Google Maps Geocoding API
    // const geocodeResult = await googleMaps.reverseGeocode({
    //   latlng: { lat: latitude, lng: longitude }
    // });

    // Mock por ahora
    return {
      address: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
      city: 'Unknown',
      country: 'Unknown'
    };
  }

  /**
   * Obtener coordenadas desde dirección (Geocoding)
   */
  async geocode(address: string): Promise<{
    latitude: number;
    longitude: number;
    formattedAddress: string;
  }> {
    if (!address || address.trim().length === 0) {
      throw new Error('Address is required');
    }

    // TODO: Integrar con Google Maps Geocoding API
    // const geocodeResult = await googleMaps.geocode({ address });

    // Mock por ahora
    return {
      latitude: 0,
      longitude: 0,
      formattedAddress: address
    };
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas de ubicación del usuario
   */
  async getLocationStats(userId: string): Promise<LocationStats> {
    // TODO: Calcular desde LocationLog
    const history = await this.getLocationHistory(userId);

    // Calcular distancia total
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const distanceTraveled = await this.calculateDistanceTraveled(userId, monthAgo, now);

    // TODO: Obtener lugares visitados desde PlaceRepository
    const placesVisited = await this.placeRepo.findByUser(userId);

    return {
      totalLogs: history.length,
      distanceTraveled,
      uniquePlacesVisited: placesVisited.length,
      mostVisitedPlace: placesVisited[0] || null,
      averageSpeed: 0, // TODO: Calcular desde logs con speed
      timeTracking: history.length * 5 // Asumiendo 5 min entre logs
    };
  }

  // ==========================================================================
  // UTILIDADES PRIVADAS
  // ==========================================================================

  /**
   * Calcular distancia entre dos puntos (Haversine)
   */
  private calculateDistance(
    from: { latitude: number; longitude: number },
    to: { latitude: number; longitude: number }
  ): number {
    return this.placeRepo.calculateDistance(from, to);
  }

  /**
   * Calcular bearing (rumbo) entre dos puntos
   * Retorna grados desde el norte (0-360)
   */
  private calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const toRadians = (deg: number) => deg * (Math.PI / 180);
    const toDegrees = (rad: number) => rad * (180 / Math.PI);

    const dLon = toRadians(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRadians(lat2));
    const x = Math.cos(toRadians(lat1)) * Math.sin(toRadians(lat2)) -
              Math.sin(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.cos(dLon);

    let bearing = toDegrees(Math.atan2(y, x));
    bearing = (bearing + 360) % 360; // Normalizar a 0-360

    return bearing;
  }

  /**
   * Estimar tiempo de viaje
   */
  private estimateTravelTime(distanceMeters: number, mode: string): number {
    const speeds = {
      WALKING: 5,
      DRIVING: 40,
      TRANSIT: 30,
      CYCLING: 15
    };

    const speed = speeds[mode as keyof typeof speeds] || 40;
    const distanceKm = distanceMeters / 1000;
    return Math.round((distanceKm / speed) * 60); // minutos
  }

  /**
   * Validar coordenadas
   */
  private validateCoordinates(latitude: number, longitude: number): void {
    if (latitude < -90 || latitude > 90) {
      throw new Error('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error('Longitude must be between -180 and 180');
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new Error('Coordinates must be numbers');
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new Error('Coordinates cannot be NaN');
    }
  }
}
