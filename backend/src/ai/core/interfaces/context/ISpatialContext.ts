/**
 * Contexto Espacial
 * Dimensión 2: Información sobre ubicación y lugares
 */
export interface ISpatialContext {
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
    city?: string;
    country?: string;
  };

  proximity: {
    nearbyEntities: string[]; // IDs de otras entidades cercanas
    distanceFromHome?: number; // metros
    distanceFromWork?: number; // metros
  };

  mobility?: {
    requiresTravel: boolean;
    estimatedTravelTime?: number; // minutos
    transportMode?: 'walking' | 'driving' | 'transit' | 'cycling';
  };
}
