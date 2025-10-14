import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';

interface Event {
  id: string;
  title: string;
  time: string;
  date: string;
  location?: string;
}

export default function AgendaScreen() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  // Datos de ejemplo
  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'Reunión de equipo',
      time: '09:00',
      date: 'Hoy',
      location: 'Sala de conferencias',
    },
    {
      id: '2',
      title: 'Cita médica',
      time: '15:30',
      date: 'Mañana',
      location: 'Clínica San Juan',
    },
    {
      id: '3',
      title: 'Almuerzo con María',
      time: '13:00',
      date: 'Viernes',
      location: 'Restaurante El Jardín',
    },
  ]);

  if (!fontsLoaded) {
    return null;
  }

  const EventCard = ({ event }: { event: Event }) => (
    <TouchableOpacity style={styles.eventCard}>
      <View style={styles.eventTime}>
        <Text style={styles.timeText}>{event.time}</Text>
        <Text style={styles.dateText}>{event.date}</Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{event.title}</Text>
        {event.location && (
          <Text style={styles.eventLocation}>📍 {event.location}</Text>
        )}
      </View>
    </TouchableOpacity>
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

          {/* Contenido */}
          <View style={styles.content}>
            {events.length > 0 ? (
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
    ...theme.shadows.md,
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
});