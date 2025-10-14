// Pantalla de Alarmas
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Card, Button } from '../components/common';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';

interface Alarm {
  id: string;
  time: string;
  label: string;
  enabled: boolean;
  daysOfWeek: string[];
}

const AlarmsScreen: React.FC = () => {
  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  // Estado de ejemplo (en producción vendría del store/API)
  const [alarms, setAlarms] = useState<Alarm[]>([
    {
      id: '1',
      time: '07:00',
      label: 'Despertar',
      enabled: true,
      daysOfWeek: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    },
    {
      id: '2',
      time: '22:00',
      label: 'Dormir',
      enabled: false,
      daysOfWeek: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    },
  ]);

  const toggleAlarm = (id: string) => {
    setAlarms(prev =>
      prev.map(alarm =>
        alarm.id === id ? { ...alarm, enabled: !alarm.enabled } : alarm
      )
    );
  };

  const handleAddAlarm = () => {
    // TODO: Abrir modal o navegar a pantalla de crear alarma
    console.log('Crear nueva alarma');
  };

  if (!fontsLoaded) {
    return null;
  }

  const renderAlarm = ({ item }: { item: Alarm }) => (
    <Card style={styles.alarmCard}>
      <View style={styles.alarmHeader}>
        <View style={styles.alarmInfo}>
          <Text style={styles.alarmTime}>{item.time}</Text>
          <Text style={styles.alarmLabel}>{item.label}</Text>
        </View>
        <Switch
          value={item.enabled}
          onValueChange={() => toggleAlarm(item.id)}
          trackColor={{
            false: theme.colors.neutral.gray300,
            true: theme.colors.tertiary.light,
          }}
          thumbColor={item.enabled ? theme.colors.tertiary.main : theme.colors.neutral.gray400}
        />
      </View>

      <View style={styles.daysContainer}>
        {item.daysOfWeek.map((day, index) => (
          <View key={index} style={styles.dayBadge}>
            <Text style={styles.dayText}>{day}</Text>
          </View>
        ))}
      </View>
    </Card>
  );

  return (
    <LinearGradient
      colors={brandStyles.gradients.home}
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
          </View>

          {/* Contenido */}
          <View style={styles.content}>
            {/* Action Header */}
            <View style={styles.actionHeader}>
              <Text style={styles.sectionTitle}>Mis Alarmas</Text>
              <Button
                title="+ Nueva"
                onPress={handleAddAlarm}
                size="sm"
                variant="primary"
              />
            </View>

            {/* Lista de alarmas */}
            {alarms.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>⏰</Text>
                <Text style={styles.emptyTitle}>No tienes alarmas</Text>
                <Text style={styles.emptyText}>
                  Crea tu primera alarma para nunca olvidar tus momentos importantes
                </Text>
                <Button
                  title="Crear Alarma"
                  onPress={handleAddAlarm}
                  style={styles.emptyButton}
                />
              </View>
            ) : (
              <View style={styles.listContainer}>
                {alarms.map((item) => (
                  <View key={item.id}>
                    {renderAlarm({ item })}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

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
  content: {
    paddingHorizontal: theme.spacing.xl,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  listContainer: {
    paddingBottom: theme.spacing.xl,
  },
  alarmCard: {
    marginBottom: theme.spacing.md,
  },
  alarmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTime: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  alarmLabel: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  dayBadge: {
    backgroundColor: theme.colors.tertiary.light,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  dayText: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.tertiary.dark,
    fontWeight: theme.typography.fontWeight.medium,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
});

export default AlarmsScreen;
