import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface VoiceButtonProps {
  onPress: () => void;
  isListening?: boolean;
}

export default function VoiceButton({ onPress, isListening = false }: VoiceButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.button, isListening && styles.listening]}
      onPress={onPress}
    >
      <Text style={styles.buttonText}>
        {isListening ? '🎤 Escuchando...' : '🎤 Hablar'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  listening: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});