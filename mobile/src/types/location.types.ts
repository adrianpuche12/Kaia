// Tipos relacionados con ubicación
export interface Location {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  context?: string;
  timestamp: Date;
}

export interface Place {
  id: string;
  userId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  category: PlaceCategory;
  notes?: string;
  createdAt: Date;
}

export type PlaceCategory =
  | 'HOME'
  | 'WORK'
  | 'SCHOOL'
  | 'GYM'
  | 'RESTAURANT'
  | 'SHOP'
  | 'HOSPITAL'
  | 'OTHER';

export interface SavePlaceRequest {
  name: string;
  address: string;
  latitude?: number;
  longitude?: number;
  category?: PlaceCategory;
  notes?: string;
}

export interface GeocodeResponse {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export interface ETAResponse {
  distance: number;
  duration: number;
  durationInTraffic?: number;
  mode: TravelMode;
  hasTrafficData: boolean;
  route?: RouteInfo;
}

export type TravelMode = 'driving' | 'walking' | 'transit';

export interface RouteInfo {
  summary: string;
  startAddress: string;
  endAddress: string;
  steps: RouteStep[];
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface TrafficInfo {
  currentDuration: number;
  normalDuration: number;
  trafficLevel: TrafficLevel;
  delayMinutes: number;
}

export type TrafficLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'SEVERE';
