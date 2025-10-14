// Hook personalizado para comandos de voz
import { useState, useCallback } from 'react';
import { voiceAPI } from '../services/api';
import { unifiedVoiceService } from '../services/unifiedVoiceService';
import { NLPResponse } from '../types';

export const useVoice = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [nlpResponse, setNlpResponse] = useState<NLPResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startListening = useCallback(async () => {
    setIsListening(true);
    setError(null);

    try {
      // Aquí integrarías el servicio de reconocimiento de voz
      // Por ahora es un placeholder
      unifiedVoiceService.speak('Escuchando...');

      // Simular escucha (en producción usarías expo-speech o similar)
      // const result = await SomeVoiceRecognitionService.start();
      // setTranscript(result.transcript);

    } catch (err: any) {
      setError(err.message || 'Error al iniciar reconocimiento de voz');
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
    // Aquí detendrías el servicio de reconocimiento
  }, []);

  const processCommand = useCallback(async (text: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const response = await voiceAPI.processCommand({
        transcript: text,
        context: {},
      });

      setNlpResponse(response);
      setTranscript(text);

      // Si hay respuesta clara, ejecutar acción sugerida
      if (!response.needsClarification && response.suggestedActions.length > 0) {
        // Aquí ejecutarías las acciones sugeridas
        unifiedVoiceService.speak('Comando procesado correctamente');
      } else if (response.needsClarification) {
        // Pedir clarificación
        if (response.clarificationQuestion) {
          unifiedVoiceService.speak(response.clarificationQuestion);
        }
      }

      setIsProcessing(false);
      return { success: true, response };
    } catch (err: any) {
      setError(err.message || 'Error al procesar comando');
      setIsProcessing(false);
      return { success: false, error: err.message };
    }
  }, []);

  const speak = useCallback((text: string) => {
    unifiedVoiceService.speak(text);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setNlpResponse(null);
    setError(null);
  }, []);

  return {
    isListening,
    isProcessing,
    transcript,
    nlpResponse,
    error,
    startListening,
    stopListening,
    processCommand,
    speak,
    clearTranscript,
  };
};

export default useVoice;
