import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import { eventAPI } from '../services/api';
import { Event } from '../types';
import { notificationService } from '../services/notificationService';

export default function AgendaScreen() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'today' | 'week' | 'all'>('today');

  useEffect(() => {
    loadEvents();
  }, [selectedView]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let loadedEvents: Event[] = [];

      switch (selectedView) {
        case 'today':
          loadedEvents = await eventAPI.getTodayEvents();
          break;
        case 'week':
          loadedEvents = await eventAPI.getWeekEvents();
          break;
        default:
          const response = await eventAPI.getUpcomingEvents(20);
          loadedEvents = response;
      }

      setEvents(loadedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadEvents();
      return;
    }

    try {
      setLoading(true);
      const results = await eventAPI.searchEvents(searchQuery);
      setEvents(results);
    } catch (error) {
      console.error('Error searching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatEventTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Mañana';
    } else {
      return date.toLocaleDateString('es-ES', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      });
    }
  };

  // Función de prueba para notificación inmediata
  const handleTestNotification = async () => {
    try {
      await notificationService.sendLocalNotification({
        title: '🎉 Notificación de Prueba',
        body: 'Esta es una notificación de prueba de Kaia. ¡Funciona correctamente!',
        data: { type: 'test' },
      });
      Alert.alert('Éxito', 'Notificación enviada. Revisa la barra de notificaciones.');
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la notificación');
      console.error(error);
    }
  };

  // Función de prueba para notificación programada (5 segundos)
  const handleTestScheduledNotification = async () => {
    try {
      const triggerDate = new Date(Date.now() + 5000); // 5 segundos
      await notificationService.scheduleNotification(
        {
          title: '⏰ Notificación Programada',
          body: 'Esta notificación fue programada para 5 segundos después.',
          data: { type: 'scheduled_test' },
        },
        triggerDate
      );
      Alert.alert(
        'Notificación Programada',
        'Recibirás una notificación en 5 segundos. Puedes minimizar la app para probar.'
      );
    } catch (error) {
      Alert.alert('Error', 'No se pudo programar la notificación');
      console.error(error);
    }
  };

  // Función para programar notificaciones de un evento real
  const handleScheduleEventNotifications = async (event: Event) => {
    try {
      const results = await notificationService.scheduleEventNotifications({
        id: event.id,
        title: event.title,
        startTime: new Date(event.startTime),
        location: event.location,
      });

      let message = 'Notificaciones programadas:\n\n';
      if (results.before15min) {
        message += '✅ 15 minutos antes\n';
      }
      if (results.dayBefore) {
        message += '✅ 1 día antes\n';
      }
      if (!results.before15min && !results.dayBefore) {
        message = 'El evento es muy pronto. No se pudieron programar notificaciones.';
      }

      Alert.alert('Notificaciones Programadas', message);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron programar las notificaciones');
      console.error(error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const EventCard = ({ event }: { event: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventInfo}>
        <View style={styles.eventTime}>
          <Text style={styles.timeText}>{formatEventTime(event.startTime.toString())}</Text>
          <Text style={styles.dateText}>{formatEventDate(event.startTime.toString())}</Text>
        </View>
        <View style={styles.eventDetails}>
          <Text style={styles.eventTitle}>{event.title}</Text>
          {event.location && (
            <Text style={styles.eventLocation}>📍 {event.location}</Text>
          )}
          {event.attendees && event.attendees.length > 0 && (
            <Text style={styles.participantsText}>
              👥 {event.attendees.length} participante(s)
            </Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        style={styles.notificationButton}
        onPress={() => handleScheduleEventNotifications(event)}
      >
        <Text style={styles.notificationButtonText}>🔔</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={brandStyles.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header con branding */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
            </View>
            <Text style={styles.subtitle}>{brandStyles.brandText.tagline}</Text>
            <Text style={styles.dateText}>
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </Text>
          </View>

          {/* Botones de Prueba de Notificaciones */}
          <View style={styles.testButtonsContainer}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestNotification}
            >
              <Text style={styles.testButtonText}>🔔 Test Inmediato</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestScheduledNotification}
            >
              <Text style={styles.testButtonText}>⏰ Test 5 seg</Text>
            </TouchableOpacity>
          </View>

          {/* Barra de búsqueda */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar eventos..."
              placeholderTextColor="rgba(255, 255, 255, 0.6)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>

          {/* Filtros de vista */}
          <View style={styles.filtersContainer}>
            <TouchableOpacity
              style={[styles.filterButton, selectedView === 'today' && styles.filterButtonActive]}
              onPress={() => setSelectedView('today')}
            >
              <Text style={[styles.filterText, selectedView === 'today' && styles.filterTextActive]}>
                Hoy
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedView === 'week' && styles.filterButtonActive]}
              onPress={() => setSelectedView('week')}
            >
              <Text style={[styles.filterText, selectedView === 'week' && styles.filterTextActive]}>
                Esta Semana
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, selectedView === 'all' && styles.filterButtonActive]}
              onPress={() => setSelectedView('all')}
            >
              <Text style={[styles.filterText, selectedView === 'all' && styles.filterTextActive]}>
                Todos
              </Text>
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.loadingText}>Cargando eventos...</Text>
              </View>
            ) : events.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Próximos eventos</Text>
                {events.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>📅</Text>
                <Text style={styles.emptyTitle}>No hay eventos programados</Text>
                <Text style={styles.emptySubtitle}>
                  Ve a la pestaña Chat para crear tu primer evento con voz
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.lg,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  logoContainer: {
    ...brandStyles.logoContainer,
    marginBottom: theme.spacing.md,
  },
  logo: brandStyles.logo,
  subtitle: {
    ...brandStyles.subtitle,
    marginBottom: theme.spacing.sm,
  },
  dateText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    textTransform: 'capitalize',
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  eventCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...theme.shadows.md,
  },
  eventInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  eventTime: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
    minWidth: 60,
  },
  timeText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  eventLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  searchContainer: {
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF',
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  filterButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  filterText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.medium,
  },
  filterTextActive: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF',
  },
  participantsText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  notificationButtonText: {
    fontSize: 20,
  },
  testButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  testButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  testButtonText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
});