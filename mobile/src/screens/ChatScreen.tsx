import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import VoiceButton from '../components/VoiceButton';
import { unifiedVoiceService } from '../services/unifiedVoiceService';
import { nlpService } from '../services/nlpService';
import { messageAPI, voiceAPI, eventAPI } from '../services/api';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import { Message, Event } from '../types';

interface LocalMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  events?: Event[]; // eventos asociados a la respuesta (para consultas)
}

export default function ChatScreen() {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: '1',
      text: '¡Hola! Soy Kaia, tu asistente de agenda inteligente. Puedes hablarme naturalmente, por ejemplo: "Tengo turno con el dentista mañana a las 3", "Agendar reunión de trabajo para el viernes a las 10", o "¿Qué tengo programado para hoy?". ¡Estoy aquí para ayudarte a organizar tu tiempo!',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [conversations, setConversations] = useState<any[]>([]);
  const [messageStats, setMessageStats] = useState<any>(null);

  useEffect(() => {
    // Check voice support on component mount
    setVoiceSupported(unifiedVoiceService.isSupported());

    const platformInfo = unifiedVoiceService.getPlatformInfo();
    console.log('Platform Info:', platformInfo);

    // Show available voices for debugging
    setTimeout(() => {
      if (unifiedVoiceService.currentService?.getAvailableVoices) {
        const voices = unifiedVoiceService.currentService.getAvailableVoices();
        console.log('🔊 Available Spanish voices:', voices);
      }
    }, 2000);

    // Load conversations and stats
    loadConversations();
    loadStats();

    // Optional: Auto-speak welcome message after a short delay
    setTimeout(() => {
      if (voiceEnabled && voiceSupported && messages.length > 0) {
        setIsSpeaking(true);
        unifiedVoiceService.speak(messages[0].text)
          .catch(error => console.error('Error speaking welcome message:', error))
          .finally(() => setIsSpeaking(false));
      }
    }, 3000);
  }, []);

  const loadConversations = async () => {
    try {
      const convos = await messageAPI.getConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await messageAPI.getStats();
      setMessageStats(stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: LocalMessage = {
      id: Date.now().toString(),
      text,
      isUser,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleVoiceStart = async () => {
    // Check if voice is supported
    if (!unifiedVoiceService.isSupported()) {
      Alert.alert(
        'No Soportado',
        'Tu navegador no soporta reconocimiento de voz. Prueba con Chrome o Edge.'
      );
      return;
    }

    setIsListening(true);

    try {
      await unifiedVoiceService.startListening(
        (transcription) => {
          // Usuario habló
          addMessage(transcription, true);
          setIsListening(false);

          // Procesar la transcripción
          processUserInput(transcription);
        },
        (error) => {
          setIsListening(false);
          Alert.alert('Error', error);
        }
      );
    } catch (error) {
      setIsListening(false);
      Alert.alert('Error', 'No se pudo iniciar el reconocimiento de voz');
    }
  };

  const handleVoiceStop = async () => {
    setIsListening(false);
    await unifiedVoiceService.stopListening();
  };

  const processUserInput = async (text: string) => {
    console.log('🧠 Processing:', text);

    // Detectar la intención usando el NLP local
    const parsed = nlpService.parseInput(text);
    console.log('🧠 Parsed result:', parsed);

    try {
      let response = '';
      let eventsToShow: Event[] | undefined = undefined;

      // Caso 1: CONSULTA - "¿Qué tengo hoy?"
      if (parsed.intent === 'query_agenda') {
        console.log('🔍 Processing query with backend...');

        const result = await voiceAPI.processQuery(text);
        response = result.answer;
        eventsToShow = result.events;

        console.log('✅ Query result:', { answer: result.answer, eventCount: result.eventCount });
      }
      // Caso 2: CREAR EVENTO - "Cita con el dentista mañana a las 3"
      else if (parsed.intent === 'create_event' && parsed.confidence > 0.6) {
        console.log('📅 Creating event with backend...');

        try {
          const result = await eventAPI.processVoiceCommand(text);
          response = result.confirmation;

          console.log('✅ Event created:', result.event);
        } catch (error: any) {
          console.error('❌ Error creating event:', error);
          // Si falla, usar respuesta del NLP local
          response = nlpService.generateResponse(parsed);
        }
      }
      // Caso 3: Otros (saludos, modificaciones, etc.)
      else {
        // Usar respuesta local del NLP
        response = nlpService.generateResponse(parsed);
      }

      // Agregar respuesta de Kaia con eventos si los hay
      setTimeout(async () => {
        const newMessage: LocalMessage = {
          id: Date.now().toString(),
          text: response,
          isUser: false,
          timestamp: new Date(),
          events: eventsToShow,
        };
        setMessages(prev => [...prev, newMessage]);

        // Hablar la respuesta si está habilitado
        if (voiceEnabled) {
          setIsSpeaking(true);
          try {
            await unifiedVoiceService.speak(response);
          } catch (error) {
            console.error('Error speaking:', error);
          } finally {
            setIsSpeaking(false);
          }
        }
      }, 1000);

    } catch (error) {
      console.error('❌ Error processing input:', error);

      // Fallback a respuesta local
      const fallbackResponse = nlpService.generateResponse(parsed);
      setTimeout(async () => {
        addMessage(fallbackResponse, false);

        if (voiceEnabled) {
          setIsSpeaking(true);
          try {
            await unifiedVoiceService.speak(fallbackResponse);
          } catch (error) {
            console.error('Error speaking:', error);
          } finally {
            setIsSpeaking(false);
          }
        }
      }, 1000);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  const EventCard = ({ event }: { event: Event }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventCardHeader}>
        <Text style={styles.eventCardTitle}>{event.title}</Text>
        {event.allDay ? (
          <Text style={styles.eventCardTime}>Todo el día</Text>
        ) : (
          <Text style={styles.eventCardTime}>
            {new Date(event.startTime).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        )}
      </View>
      {event.description && (
        <Text style={styles.eventCardDescription}>{event.description}</Text>
      )}
      {event.location && (
        <Text style={styles.eventCardLocation}>📍 {event.location}</Text>
      )}
      <Text style={styles.eventCardDate}>
        {new Date(event.startTime).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
      </Text>
    </View>
  );

  const MessageBubble = ({ message }: { message: LocalMessage }) => (
    <View
      style={[
        styles.messageBubble,
        message.isUser ? styles.userMessage : styles.assistantMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.assistantMessageText,
        ]}
      >
        {message.text}
      </Text>

      {/* Mostrar eventos si los hay */}
      {message.events && message.events.length > 0 && (
        <View style={styles.eventsContainer}>
          {message.events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </View>
      )}

      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  const StatsPanel = () => {
    if (!messageStats) return null;

    return (
      <View style={styles.statsPanel}>
        <Text style={styles.statsPanelTitle}>Estadísticas de Mensajes</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{messageStats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{messageStats.sent}</Text>
            <Text style={styles.statLabel}>Enviados</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{messageStats.received}</Text>
            <Text style={styles.statLabel}>Recibidos</Text>
          </View>
          {messageStats.failed > 0 && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.statError]}>{messageStats.failed}</Text>
              <Text style={styles.statLabel}>Fallidos</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={brandStyles.gradients.secondary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        {/* Header con branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
            {isSpeaking && (
              <View style={styles.speakingIndicator}>
                <Text style={styles.speakingText}>🔊</Text>
                <View style={styles.voiceWave}>
                  <View style={[styles.waveLine, styles.wave1]} />
                  <View style={[styles.waveLine, styles.wave2]} />
                  <View style={[styles.waveLine, styles.wave3]} />
                </View>
              </View>
            )}
          </View>
          <Text style={styles.subtitle}>{brandStyles.brandText.tagline}</Text>

          {/* Voice Controls */}
          <View style={styles.voiceControls}>
            <TouchableOpacity
              style={[styles.voiceToggle, voiceEnabled ? styles.voiceEnabled : styles.voiceDisabled]}
              onPress={() => setVoiceEnabled(!voiceEnabled)}
            >
              <Text style={styles.voiceToggleText}>
                {voiceEnabled ? '🔊 Voz ON' : '🔇 Voz OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Panel */}
        <StatsPanel />

        <ScrollView
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          {!voiceSupported && (
            <View style={styles.warningContainer}>
              <Text style={styles.warningText}>
                ⚠️ Para usar reconocimiento de voz en web, prueba con Chrome o Edge
              </Text>
            </View>
          )}
          <VoiceButton
            onPress={isListening ? handleVoiceStop : handleVoiceStart}
            isListening={isListening}
          />
          {isListening && (
            <Text style={styles.listeningText}>
              Escuchando... Habla ahora
            </Text>
          )}
          {!isListening && voiceSupported && (
            <Text style={styles.instructionText}>
              Presiona el botón y habla para interactuar con Kaia
            </Text>
          )}
        </View>
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
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    ...brandStyles.logoContainer,
    marginBottom: theme.spacing.md,
  },
  logo: brandStyles.logo,
  speakingIndicator: {
    marginLeft: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: theme.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakingText: {
    fontSize: theme.typography.fontSize.base,
    marginRight: theme.spacing.xs,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLine: {
    width: 3,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  wave1: {
    height: 8,
  },
  wave2: {
    height: 12,
  },
  wave3: {
    height: 6,
  },
  subtitle: {
    ...brandStyles.subtitle,
    marginBottom: theme.spacing.md,
  },
  voiceControls: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  voiceToggle: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
  },
  voiceEnabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: '#FFFFFF',
  },
  voiceDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  voiceToggleText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: theme.spacing.xl,
    paddingBottom: theme.spacing['2xl'],
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.xl,
    marginVertical: theme.spacing.xs,
  },
  userMessage: {
    backgroundColor: theme.colors.primary.main,
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    ...theme.shadows.sm,
  },
  messageText: {
    fontSize: theme.typography.fontSize.base,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: theme.colors.text.primary,
  },
  timestamp: {
    fontSize: theme.typography.fontSize.xs,
    marginTop: theme.spacing.xs,
    opacity: 0.7,
  },
  inputContainer: {
    padding: theme.spacing.xl,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  listeningText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.base,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.semibold,
  },
  instructionText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  warningContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.tertiary.dark,
  },
  warningText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
  statsPanel: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  statsPanelTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: theme.spacing.xs,
  },
  statError: {
    color: theme.colors.tertiary.main,
  },
  eventsContainer: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  eventCard: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary.main,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginVertical: theme.spacing.xs,
  },
  eventCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  eventCardTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    flex: 1,
    marginRight: theme.spacing.sm,
  },
  eventCardTime: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary.main,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  eventCardDescription: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  eventCardLocation: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
  },
  eventCardDate: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    fontStyle: 'italic',
  },
});