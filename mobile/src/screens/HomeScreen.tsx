import React from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import VoiceButton from '../components/VoiceButton';
import { COLORS, SIZES } from '../utils/constants';

import { unifiedVoiceService } from '../services/unifiedVoiceService';

export default function HomeScreen() {
  const handleQuickVoice = () => {
    // TODO: Implementar acción rápida de voz
    console.log('Quick voice action');

    // For now, just show platform info
    const info = unifiedVoiceService.getPlatformInfo();
    console.log('Voice Service Info:', info);

    if (info.supported) {
      unifiedVoiceService.speak('¡Hola! Esta es una prueba rápida de Kaia.');
    }
  };

  const stats = [
    { label: 'Eventos hoy', value: '3' },
    { label: 'Esta semana', value: '12' },
    { label: 'Próximo mes', value: '28' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.greeting}>
          ¡Hola! 👋
        </Text>
        <Text style={styles.title}>Bienvenido a Kaia</Text>
        <Text style={styles.subtitle}>Tu asistente de agenda inteligente</Text>
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statCard}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Acción rápida</Text>
        <Text style={styles.sectionSubtitle}>
          Presiona para crear un evento por voz
        </Text>
        <VoiceButton onPress={handleQuickVoice} />
      </View>

      <View style={styles.tips}>
        <Text style={styles.sectionTitle}>💡 Tip del día</Text>
        <Text style={styles.tipText}>
          Puedes decir "Tengo cita con el dentista mañana a las 3" y Kaia lo agendará automáticamente.
        </Text>
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
  },
  greeting: {
    fontSize: SIZES.xxlarge,
    marginBottom: 10,
  },
  title: {
    fontSize: SIZES.xxlarge,
    fontWeight: 'bold',
    color: COLORS.text.primary,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  statCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statValue: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: SIZES.small,
    color: COLORS.text.secondary,
    marginTop: 4,
    textAlign: 'center',
  },
  quickActions: {
    padding: 20,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontWeight: '600',
    color: COLORS.text.primary,
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: SIZES.medium,
    color: COLORS.text.secondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  tips: {
    margin: 20,
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  tipText: {
    fontSize: SIZES.medium,
    color: COLORS.text.primary,
    lineHeight: 20,
  },
});