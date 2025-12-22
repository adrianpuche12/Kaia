import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Event } from '../types';
import { theme } from '../theme';
import { eventAPI } from '../services/api';

interface EventDetailModalProps {
  visible: boolean;
  event: Event | null;
  onClose: () => void;
  onEventUpdated: () => void;
}

export default function EventDetailModal({
  visible,
  event,
  onClose,
  onEventUpdated,
}: EventDetailModalProps) {
  const [newParticipant, setNewParticipant] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (event) {
      // Parsear participantes del evento
      try {
        const parsedParticipants = event.participants
          ? (typeof event.participants === 'string'
              ? JSON.parse(event.participants)
              : event.participants)
          : [];
        setParticipants(parsedParticipants);
      } catch (error) {
        console.error('Error parsing participants:', error);
        setParticipants([]);
      }
    }
  }, [event]);

  if (!event) return null;

  const handleAddParticipant = async () => {
    if (!newParticipant.trim()) {
      Alert.alert('Error', 'Por favor ingresa un nombre');
      return;
    }

    try {
      setLoading(true);
      await eventAPI.addParticipant(event.id, newParticipant.trim());

      // Actualizar lista local
      setParticipants(prev => [...prev, newParticipant.trim()]);
      setNewParticipant('');

      Alert.alert('Éxito', 'Participante agregado correctamente');
      onEventUpdated();
    } catch (error: any) {
      console.error('Error adding participant:', error);
      Alert.alert('Error', error.message || 'No se pudo agregar el participante');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveParticipant = async (participantName: string) => {
    Alert.alert(
      'Confirmar',
      `¿Eliminar a ${participantName} de este evento?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await eventAPI.removeParticipant(event.id, participantName);

              // Actualizar lista local
              setParticipants(prev => prev.filter(p => p !== participantName));

              Alert.alert('Éxito', 'Participante eliminado');
              onEventUpdated();
            } catch (error: any) {
              console.error('Error removing participant:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el participante');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeleteEvent = async () => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de eliminar "${event.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await eventAPI.deleteEvent(event.id);
              Alert.alert('Éxito', 'Evento eliminado');
              onEventUpdated();
              onClose();
            } catch (error: any) {
              console.error('Error deleting event:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar el evento');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Evento</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Event Info */}
            <View style={styles.section}>
              <Text style={styles.eventTitle}>{event.title}</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoIcon}>📅</Text>
                <Text style={styles.infoText}>{formatDateTime(event.startTime.toString())}</Text>
              </View>

              {event.location && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📍</Text>
                  <Text style={styles.infoText}>{event.location}</Text>
                </View>
              )}

              {event.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoIcon}>📝</Text>
                  <Text style={styles.infoText}>{event.description}</Text>
                </View>
              )}

              {event.allDay && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Todo el día</Text>
                </View>
              )}
            </View>

            {/* Participants Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Participantes ({participants.length})</Text>

              {/* Add Participant */}
              <View style={styles.addParticipantContainer}>
                <TextInput
                  style={styles.participantInput}
                  placeholder="Nombre del participante"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={newParticipant}
                  onChangeText={setNewParticipant}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={[styles.addButton, loading && styles.buttonDisabled]}
                  onPress={handleAddParticipant}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.addButtonText}>+</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Participants List */}
              {participants.length > 0 ? (
                <View style={styles.participantsList}>
                  {participants.map((participant, index) => (
                    <View key={index} style={styles.participantItem}>
                      <Text style={styles.participantIcon}>👤</Text>
                      <Text style={styles.participantName}>{participant}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveParticipant(participant)}
                        disabled={loading}
                        style={styles.removeButton}
                      >
                        <Text style={styles.removeButtonText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>No hay participantes agregados</Text>
              )}
            </View>

            {/* Actions */}
            <View style={styles.actionsSection}>
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={async () => {
                  try {
                    setLoading(true);
                    await eventAPI.completeEvent(event.id);
                    Alert.alert('Éxito', 'Evento marcado como completado');
                    onEventUpdated();
                    onClose();
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'No se pudo completar el evento');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✓ Marcar como completado</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={async () => {
                  try {
                    setLoading(true);
                    await eventAPI.cancelEvent(event.id);
                    Alert.alert('Éxito', 'Evento cancelado');
                    onEventUpdated();
                    onClose();
                  } catch (error: any) {
                    Alert.alert('Error', error.message || 'No se pudo cancelar el evento');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
              >
                <Text style={styles.actionButtonText}>✕ Cancelar evento</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteEvent}
                disabled={loading}
              >
                <Text style={[styles.actionButtonText, styles.deleteButtonText]}>🗑 Eliminar evento</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: theme.borderRadius['2xl'],
    borderTopRightRadius: theme.borderRadius['2xl'],
    maxHeight: '90%',
    paddingBottom: theme.spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  closeButton: {
    padding: theme.spacing.sm,
  },
  closeButtonText: {
    fontSize: 28,
    color: theme.colors.text.secondary,
    fontWeight: theme.typography.fontWeight.bold,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: theme.spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  eventTitle: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
    marginBottom: theme.spacing.lg,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  infoText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
  badge: {
    backgroundColor: theme.colors.primary.light,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: theme.spacing.sm,
  },
  badgeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  addParticipantContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  participantInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  addButton: {
    backgroundColor: theme.colors.primary.main,
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.bold,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  participantsList: {
    gap: theme.spacing.sm,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  participantIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  participantName: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
  removeButton: {
    padding: theme.spacing.xs,
  },
  removeButtonText: {
    fontSize: 20,
    color: theme.colors.error,
    fontWeight: theme.typography.fontWeight.bold,
  },
  emptyText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: theme.spacing.lg,
  },
  actionsSection: {
    padding: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  actionButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: theme.colors.success,
  },
  cancelButton: {
    backgroundColor: theme.colors.tertiary.main,
  },
  deleteButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  actionButtonText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  deleteButtonText: {
    color: theme.colors.error,
  },
});
