import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import VoiceButton from '../components/VoiceButton';
import { useAuth } from '../hooks';
import { unifiedVoiceService } from '../services/unifiedVoiceService';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';

export default function HomeScreen() {
  const { user } = useAuth();
  const [greeting, setGreeting] = useState('¡Hola!');

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  useEffect(() => {
    // Determinar saludo según hora del día
    const hour = new Date().getHours();
    let timeGreeting = '¡Hola!';

    if (hour >= 5 && hour < 12) {
      timeGreeting = '¡Buenos días!';
    } else if (hour >= 12 && hour < 19) {
      timeGreeting = '¡Buenas tardes!';
    } else {
      timeGreeting = '¡Buenas noches!';
    }

    setGreeting(timeGreeting);
  }, []);

  if (!fontsLoaded) {
    return null;
  }
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
    <LinearGradient
      colors={brandStyles.gradients.home}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header con branding */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
            </View>
            <Text style={styles.subtitle}>{brandStyles.brandText.tagline}</Text>
            <Text style={styles.greeting}>
              {greeting}, {user?.name || 'Usuario'}
            </Text>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Acción rápida</Text>
            <Text style={styles.sectionSubtitle}>
              Presiona para crear un evento por voz
            </Text>
            <VoiceButton onPress={handleQuickVoice} />
          </View>

          {/* Tips Section */}
          <View style={styles.tips}>
            <Text style={styles.sectionTitle}>💡 Tip del día</Text>
            <Text style={styles.tipText}>
              Puedes decir "Tengo cita con el dentista mañana a las 3" y Kaia lo agendará automáticamente.
            </Text>
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
    marginBottom: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.typography.fontSize.xl,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '400',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.xl,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
    alignItems: 'center',
    minWidth: 80,
    ...theme.shadows.md,
  },
  statValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.primary.main,
  },
  statLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  quickActions: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  tips: {
    marginHorizontal: theme.spacing.xl,
    marginVertical: theme.spacing.lg,
    padding: theme.spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.tertiary.main,
    ...theme.shadows.md,
  },
  tipText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    lineHeight: 22,
  },
});