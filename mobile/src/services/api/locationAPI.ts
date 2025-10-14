// API de ubicación
import { apiClient } from './apiClient';
import {
  Location,
  Place,
  SavePlaceRequest,
  GeocodeResponse,
  ETAResponse,
  TrafficInfo,
  TravelMode,
} from '../../types';

class LocationAPI {
  async logLocation(
    latitude: number,
    longitude: number,
    accuracy?: number,
    context?: string
  ): Promise<Location> {
    const response = await apiClient.post<{ location: Location }>('/location/log', {
      latitude,
      longitude,
      accuracy,
      context,
    });
    return response.data!.location;
  }

  async getCurrentLocation(): Promise<Location | null> {
    const response = await apiClient.get<{ location: Location | null }>('/location/current');
    return response.data!.location;
  }

  async geocode(address: string): Promise<GeocodeResponse> {
    const response = await apiClient.post<GeocodeResponse>('/location/geocode', { address });
    return response.data!;
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<string> {
    const response = await apiClient.post<{ address: string }>('/location/reverse-geocode', {
      latitude,
      longitude,
    });
    return response.data!.address;
  }

  async calculateETA(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number,
    mode: TravelMode = 'driving'
  ): Promise<ETAResponse> {
    const response = await apiClient.post<{ eta: ETAResponse }>('/location/eta', {
      originLat,
      originLng,
      destLat,
      destLng,
      mode,
    });
    return response.data!.eta;
  }

  async getTrafficInfo(
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ): Promise<TrafficInfo> {
    const response = await apiClient.post<{ traffic: TrafficInfo }>('/location/traffic', {
      originLat,
      originLng,
      destLat,
      destLng,
    });
    return response.data!.traffic;
  }

  async savePlace(data: SavePlaceRequest): Promise<Place> {
    const response = await apiClient.post<{ place: Place }>('/location/places', data);
    return response.data!.place;
  }

  async listPlaces(filters?: {
    category?: string;
    searchQuery?: string;
  }): Promise<Place[]> {
    const response = await apiClient.get<{ places: Place[] }>('/location/places', filters);
    return response.data!.places;
  }

  async getPlaceById(id: string): Promise<Place> {
    const response = await apiClient.get<{ place: Place }>(`/location/places/${id}`);
    return response.data!.place;
  }

  async updatePlace(id: string, data: Partial<SavePlaceRequest>): Promise<Place> {
    const response = await apiClient.put<{ place: Place }>(`/location/places/${id}`, data);
    return response.data!.place;
  }

  async deletePlace(id: string): Promise<void> {
    await apiClient.delete(`/location/places/${id}`);
  }

  async findNearbyPlaces(
    latitude: number,
    longitude: number,
    radius?: number
  ): Promise<Place[]> {
    const response = await apiClient.get<{ places: Place[] }>('/location/places/nearby', {
      latitude,
      longitude,
      radius,
    });
    return response.data!.places;
  }
}

export const locationAPI = new LocationAPI();
export default locationAPI;
