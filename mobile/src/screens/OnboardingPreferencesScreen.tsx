import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Ionicons } from '@expo/vector-icons';
import { Loading } from '../components/common';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import userAPI from '../services/api/userAPI';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/MainNavigator';

type OnboardingPreferencesScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'OnboardingPreferences'
>;

type Props = {
  navigation: OnboardingPreferencesScreenNavigationProp;
};

const INTERESTS_OPTIONS = [
  { id: 'sports', label: '⚽ Deportes', icon: '⚽' },
  { id: 'music', label: '🎵 Música', icon: '🎵' },
  { id: 'tech', label: '💻 Tecnología', icon: '💻' },
  { id: 'food', label: '🍕 Gastronomía', icon: '🍕' },
  { id: 'travel', label: '✈️ Viajes', icon: '✈️' },
  { id: 'art', label: '🎨 Arte', icon: '🎨' },
  { id: 'reading', label: '📚 Lectura', icon: '📚' },
  { id: 'movies', label: '🎬 Cine', icon: '🎬' },
  { id: 'fitness', label: '💪 Fitness', icon: '💪' },
  { id: 'gaming', label: '🎮 Videojuegos', icon: '🎮' },
];

const EVENT_CATEGORIES = [
  { id: 'medical', label: '🏥 Médicos', icon: '🏥' },
  { id: 'work', label: '💼 Trabajo', icon: '💼' },
  { id: 'personal', label: '👤 Personales', icon: '👤' },
  { id: 'social', label: '👥 Sociales', icon: '👥' },
  { id: 'family', label: '👨‍👩‍👧 Familia', icon: '👨‍👩‍👧' },
];

const OnboardingPreferencesScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Estados del formulario
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Estados originales para comparación
  const [originalValues, setOriginalValues] = useState({
    interests: [] as string[],
    categories: [] as string[],
    push: true,
    location: true,
  });

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  useEffect(() => {
    // Detectar cambios
    const changed =
      JSON.stringify(selectedInterests) !== JSON.stringify(originalValues.interests) ||
      JSON.stringify(selectedCategories) !== JSON.stringify(originalValues.categories) ||
      pushEnabled !== originalValues.push ||
      locationEnabled !== originalValues.location;

    setHasChanges(changed);
  }, [selectedInterests, selectedCategories, pushEnabled, locationEnabled, originalValues]);

  const loadPreferences = async () => {
    try {
      const response = await userAPI.getPreferences();
      const preferences = response.preferences;

      // Parsear JSON strings
      const interests = JSON.parse(preferences.interests || '[]');
      const categories = JSON.parse(preferences.favoriteCategories || '[]');

      setSelectedInterests(interests);
      setSelectedCategories(categories);
      setPushEnabled(preferences.pushEnabled !== undefined ? preferences.pushEnabled : true);
      setLocationEnabled(preferences.locationTrackingEnabled !== undefined ? preferences.locationTrackingEnabled : true);

      // Guardar valores originales
      setOriginalValues({
        interests,
        categories,
        push: preferences.pushEnabled !== undefined ? preferences.pushEnabled : true,
        location: preferences.locationTrackingEnabled !== undefined ? preferences.locationTrackingEnabled : true,
      });
    } catch (error) {
      console.error('Error loading preferences:', error);
      Alert.alert('Error', 'No se pudieron cargar las preferencias');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleCategory = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    const changedFields: string[] = [];
    if (JSON.stringify(selectedInterests) !== JSON.stringify(originalValues.interests)) {
      changedFields.push('intereses');
    }
    if (JSON.stringify(selectedCategories) !== JSON.stringify(originalValues.categories)) {
      changedFields.push('categorías');
    }
    if (pushEnabled !== originalValues.push) {
      changedFields.push('notificaciones');
    }
    if (locationEnabled !== originalValues.location) {
      changedFields.push('ubicación');
    }

    Alert.alert(
      'Confirmar Cambios',
      `Has modificado: ${changedFields.join(', ')}.\n\n¿Deseas guardar estos cambios?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Guardar',
          style: 'default',
          onPress: () => saveChanges(),
        },
      ]
    );
  };

  const saveChanges = async () => {
    setSaving(true);

    try {
      await userAPI.updatePreferences({
        interests: JSON.stringify(selectedInterests),
        favoriteCategories: JSON.stringify(selectedCategories),
        pushEnabled,
        locationTrackingEnabled: locationEnabled,
      });

      Alert.alert(
        'Éxito',
        'Tus preferencias han sido actualizadas correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      Alert.alert('Error', error.response?.data?.error || 'No se pudieron guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleGoBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Cambios sin guardar',
        'Tienes cambios sin guardar. ¿Deseas salir sin guardar?',
        [
          {
            text: 'Cancelar',
            style: 'cancel',
          },
          {
            text: 'Salir sin guardar',
            style: 'destructive',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  if (!fontsLoaded || loading) {
    return <Loading fullScreen text="Cargando preferencias..." />;
  }

  return (
    <LinearGradient
      colors={brandStyles.gradients.primary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
            </View>
            <Text style={styles.subtitle}>Mis Preferencias</Text>
          </View>

          {/* Interests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Intereses Personales</Text>
            <Text style={styles.sectionSubtitle}>
              Selecciona tus intereses para personalizar tu experiencia
            </Text>
            <View style={styles.chipsContainer}>
              {INTERESTS_OPTIONS.map((interest) => (
                <TouchableOpacity
                  key={interest.id}
                  style={[
                    styles.chip,
                    selectedInterests.includes(interest.id) && styles.chipSelected,
                  ]}
                  onPress={() => toggleInterest(interest.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipIcon}>{interest.icon}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      selectedInterests.includes(interest.id) && styles.chipTextSelected,
                    ]}
                  >
                    {interest.label.replace(interest.icon + ' ', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Categories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📌 Categorías Favoritas</Text>
            <Text style={styles.sectionSubtitle}>
              Categorías de eventos que te interesan más
            </Text>
            <View style={styles.chipsContainer}>
              {EVENT_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.chip,
                    selectedCategories.includes(category.id) && styles.chipSelected,
                  ]}
                  onPress={() => toggleCategory(category.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.chipIcon}>{category.icon}</Text>
                  <Text
                    style={[
                      styles.chipText,
                      selectedCategories.includes(category.id) && styles.chipTextSelected,
                    ]}
                  >
                    {category.label.replace(category.icon + ' ', '')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Settings Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Configuración</Text>
            <View style={styles.settingsCard}>
              {/* Push Notifications Toggle */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setPushEnabled(!pushEnabled)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="notifications-outline"
                    size={24}
                    color={theme.colors.primary.main}
                  />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Notificaciones Push</Text>
                    <Text style={styles.settingSubtitle}>
                      Recibir notificaciones de eventos y alarmas
                    </Text>
                  </View>
                </View>
                <View style={[styles.toggle, pushEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, pushEnabled && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>

              {/* Location Toggle */}
              <TouchableOpacity
                style={styles.settingItem}
                onPress={() => setLocationEnabled(!locationEnabled)}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <Ionicons
                    name="location-outline"
                    size={24}
                    color={theme.colors.primary.main}
                  />
                  <View style={styles.settingText}>
                    <Text style={styles.settingTitle}>Rastreo de Ubicación</Text>
                    <Text style={styles.settingSubtitle}>
                      Permitir acceso a tu ubicación para funciones basadas en contexto
                    </Text>
                  </View>
                </View>
                <View style={[styles.toggle, locationEnabled && styles.toggleActive]}>
                  <View style={[styles.toggleThumb, locationEnabled && styles.toggleThumbActive]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              !hasChanges && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || saving}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                hasChanges && !saving
                  ? [theme.colors.primary.main, theme.colors.secondary.main]
                  : ['#CCCCCC', '#AAAAAA']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Helper Text */}
          {hasChanges && (
            <View style={styles.helperContainer}>
              <Text style={styles.changesText}>
                Tienes cambios sin guardar
              </Text>
            </View>
          )}
        </ScrollView>

        {saving && <Loading fullScreen text="Guardando preferencias..." />}
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
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: theme.spacing.lg,
    top: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    ...brandStyles.logoContainerSmall,
    marginBottom: theme.spacing.md,
  },
  logo: brandStyles.logoSmall,
  subtitle: {
    ...brandStyles.subtitleSmall,
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '400',
  },

  // Section
  section: {
    marginBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  sectionSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: theme.spacing.lg,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: theme.borderRadius.full,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: theme.colors.secondary.main,
  },
  chipIcon: {
    fontSize: 18,
    marginRight: theme.spacing.xs,
  },
  chipText: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.secondary,
  },
  chipTextSelected: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
  },

  // Settings
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    ...theme.shadows.lg,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutral.gray100,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: theme.spacing.md,
  },
  settingText: {
    flex: 1,
    marginLeft: theme.spacing.md,
  },
  settingTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
  },

  // Toggle
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.neutral.gray300,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: theme.colors.primary.main,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    ...theme.shadows.sm,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },

  // Save Button
  saveButton: {
    marginHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
    ...theme.shadows.lg,
    marginBottom: theme.spacing.md,
  },
  saveButtonDisabled: {
    ...theme.shadows.base,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
  },

  // Helper
  helperContainer: {
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  changesText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
});

export default OnboardingPreferencesScreen;
