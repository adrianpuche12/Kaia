import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SIZES } from '../utils/constants';

interface Event {
  id: string;
  title: string;
  time: string;
  date: string;
  location?: string;
}

export default function AgendaScreen() {
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Agenda</Text>
        <Text style={styles.subtitle}>
          {new Date().toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.text.secondary,
    marginTop: 5,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 15,
  },
  eventCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  eventTime: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
    minWidth: 60,
  },
  timeText: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  dateText: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: SIZES.medium,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});