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
import VoiceButton from '../components/VoiceButton';
import { unifiedVoiceService } from '../services/unifiedVoiceService';
import { nlpService } from '../services/nlpService';
import { COLORS, SIZES } from '../utils/constants';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([
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

  const addMessage = (text: string, isUser: boolean) => {
    const newMessage: Message = {
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
    // Usar el nuevo servicio de NLP
    console.log('🧠 Processing:', text);

    const parsed = nlpService.parseInput(text);
    console.log('🧠 Parsed result:', parsed);

    // Generar respuesta inteligente
    const response = nlpService.generateResponse(parsed);

    // Si se detectó una intención de crear evento con suficientes datos, simular guardado
    if (parsed.intent === 'create_event' && parsed.confidence > 0.7) {
      console.log('📅 Event detected:', parsed.entities);

      // Aquí más adelante conectaremos con el backend para guardar el evento
      if (parsed.entities.title && parsed.entities.date && parsed.entities.time) {
        // Evento completo, simular guardado exitoso
        const eventSummary = `✅ Evento guardado: "${parsed.entities.title}" para ${parsed.entities.date} a las ${parsed.entities.time}`;
        console.log(eventSummary);
      }
    }

    // Agregar respuesta de Kaia
    setTimeout(async () => {
      addMessage(response, false);

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
  };

  const MessageBubble = ({ message }: { message: Message }) => (
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
      <Text style={styles.timestamp}>
        {message.timestamp.toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Kaia</Text>
          {isSpeaking && (
            <View style={styles.speakingIndicator}>
              <Text style={styles.speakingText}>🔊 Hablando...</Text>
              <View style={styles.voiceWave}>
                <View style={[styles.waveLine, styles.wave1]} />
                <View style={[styles.waveLine, styles.wave2]} />
                <View style={[styles.waveLine, styles.wave3]} />
              </View>
            </View>
          )}
        </View>
        <Text style={styles.subtitle}>Tu asistente de agenda</Text>

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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text.primary,
  },
  speakingIndicator: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },
  speakingText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontWeight: '600',
    marginRight: 8,
  },
  voiceWave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLine: {
    width: 3,
    backgroundColor: COLORS.primary,
    marginHorizontal: 1,
    borderRadius: 2,
  },
  wave1: {
    height: 8,
    backgroundColor: COLORS.primary,
  },
  wave2: {
    height: 12,
    backgroundColor: COLORS.secondary,
  },
  wave3: {
    height: 6,
    backgroundColor: COLORS.primary,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.text.secondary,
    marginTop: 5,
  },
  voiceControls: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  voiceToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  voiceEnabled: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  voiceDisabled: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  voiceToggleText: {
    fontSize: SIZES.small,
    fontWeight: '600',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    paddingBottom: 40,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 15,
    borderRadius: 20,
    marginVertical: 5,
  },
  userMessage: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: SIZES.medium,
    lineHeight: 20,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: COLORS.text.primary,
  },
  timestamp: {
    fontSize: SIZES.small,
    marginTop: 5,
    opacity: 0.7,
  },
  inputContainer: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  listeningText: {
    marginTop: 10,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  instructionText: {
    marginTop: 10,
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  warningText: {
    fontSize: SIZES.small,
    color: '#E65100',
    textAlign: 'center',
  },
});