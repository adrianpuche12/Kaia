import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import { locationAPI } from '../services/api';
import { Location } from '../types';

export default function LocationHistoryScreen() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastLocation, setLastLocation] = useState<Location | null>(null);
  const [selectedLimit, setSelectedLimit] = useState<number>(20);

  useEffect(() => {
    loadLocations();
    loadLastLocation();
  }, [selectedLimit]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const history = await locationAPI.getLocationHistory(selectedLimit);
      setLocations(history);
    } catch (error) {
      console.error('Error loading location history:', error);
      Alert.alert('Error', 'No se pudo cargar el historial de ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadLastLocation = async () => {
    try {
      const last = await locationAPI.getLastLocation();
      setLastLocation(last);
    } catch (error) {
      console.error('Error loading last location:', error);
    }
  };

  const handleUpdateLocation = async () => {
    // En producción, esto usaría el GPS del dispositivo
    // Por ahora, simulamos con coordenadas de ejemplo
    Alert.alert(
      'Actualizar Ubicación',
      '¿Deseas actualizar tu ubicación actual?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Actualizar',
          onPress: async () => {
            try {
              // Coordenadas de ejemplo (Madrid, España)
              await locationAPI.updateLocation(40.4168, -3.7038, 10);
              Alert.alert('Éxito', 'Ubicación actualizada');
              loadLocations();
              loadLastLocation();
            } catch (error) {
              Alert.alert('Error', 'No se pudo actualizar la ubicación');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!fontsLoaded) {
    return null;
  }

  const LocationCard = ({ location }: { location: Location }) => (
    <TouchableOpacity style={styles.locationCard}>
      <View style={styles.locationIcon}>
        <Text style={styles.iconText}>📍</Text>
      </View>
      <View style={styles.locationDetails}>
        <Text style={styles.locationCoords}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        <Text style={styles.locationTime}>
          {formatDate(location.timestamp)} - {formatTime(location.timestamp)}
        </Text>
        {location.accuracy && (
          <Text style={styles.locationAccuracy}>
            Precisión: ±{location.accuracy.toFixed(0)}m
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const LastLocationCard = () => {
    if (!lastLocation) return null;

    return (
      <View style={styles.lastLocationContainer}>
        <Text style={styles.lastLocationTitle}>Ubicación Actual</Text>
        <View style={styles.lastLocationCard}>
          <View style={styles.lastLocationIcon}>
            <Text style={styles.lastLocationIconText}>📍</Text>
          </View>
          <View style={styles.lastLocationDetails}>
            <Text style={styles.lastLocationCoords}>
              {lastLocation.latitude.toFixed(6)}, {lastLocation.longitude.toFixed(6)}
            </Text>
            <Text style={styles.lastLocationTime}>
              Actualizada: {formatTime(lastLocation.timestamp)}
            </Text>
            {lastLocation.accuracy && (
              <Text style={styles.lastLocationAccuracy}>
                ±{lastLocation.accuracy.toFixed(0)}m de precisión
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={brandStyles.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily: 'Caveat_700Bold' }]}>
            Historial de Ubicaciones
          </Text>
        </View>

        {/* Last Location */}
        <LastLocationCard />

        {/* Update Button */}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateLocation}>
          <Text style={styles.updateButtonText}>🔄 Actualizar Ubicación</Text>
        </TouchableOpacity>

        {/* Limit Filters */}
        <View style={styles.filtersContainer}>
          <TouchableOpacity
            style={[styles.filterButton, selectedLimit === 10 && styles.filterButtonActive]}
            onPress={() => setSelectedLimit(10)}
          >
            <Text
              style={[
                styles.filterText,
                selectedLimit === 10 && styles.filterTextActive,
              ]}
            >
              Últimas 10
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedLimit === 20 && styles.filterButtonActive]}
            onPress={() => setSelectedLimit(20)}
          >
            <Text
              style={[
                styles.filterText,
                selectedLimit === 20 && styles.filterTextActive,
              ]}
            >
              Últimas 20
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterButton, selectedLimit === 50 && styles.filterButtonActive]}
            onPress={() => setSelectedLimit(50)}
          >
            <Text
              style={[
                styles.filterText,
                selectedLimit === 50 && styles.filterTextActive,
              ]}
            >
              Últimas 50
            </Text>
          </TouchableOpacity>
        </View>

        {/* Location History List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Cargando ubicaciones...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {locations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>📍</Text>
                <Text style={styles.emptyTitle}>No hay ubicaciones registradas</Text>
                <Text style={styles.emptySubtitle}>
                  Actualiza tu ubicación para comenzar
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionTitle}>
                  Historial ({locations.length})
                </Text>
                {locations.map((location, index) => (
                  <LocationCard key={location.id || index} location={location} />
                ))}
              </>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 36,
    color: theme.colors.white,
    textAlign: 'center',
  },
  lastLocationContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  lastLocationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 8,
  },
  lastLocationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  lastLocationIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  lastLocationIconText: {
    fontSize: 30,
  },
  lastLocationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  lastLocationCoords: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  lastLocationTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  lastLocationAccuracy: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  updateButton: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: theme.colors.secondary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.white,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: theme.colors.white,
  },
  filterText: {
    fontSize: 14,
    color: theme.colors.white,
  },
  filterTextActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 12,
  },
  locationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
  },
  locationDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 2,
  },
  locationTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  locationAccuracy: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: theme.colors.white,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
