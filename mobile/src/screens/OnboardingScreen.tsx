// Pantalla de Onboarding - Primera vez
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Button, Input, Loading } from '../components/common';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import userAPI, { OnboardingData } from '../services/api/userAPI';
import { useAuth } from '../hooks';

type OnboardingScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding'>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

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

const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Datos del formulario
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const totalSteps = 3;

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

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Completar onboarding sin datos opcionales
    handleComplete();
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      const onboardingData: OnboardingData = {
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        interests: selectedInterests,
        favoriteCategories: selectedCategories,
        notificationsEnabled,
        locationEnabled,
      };

      const response = await userAPI.completeOnboarding(onboardingData);

      console.log('📥 Onboarding response:', response);

      if (response.success && response.data) {
        const { user } = response.data;

        if (setUser && user) {
          setUser(user);
        }
      } else {
        setError('Error al completar el onboarding');
      }
    } catch (err: any) {
      console.error('Error completing onboarding:', err);
      setError(err.response?.data?.error || 'Error al completar el onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📍 Información de Contacto</Text>
      <Text style={styles.stepSubtitle}>
        Ayúdanos a personalizar tu experiencia (opcional)
      </Text>

      <Input
        label="Teléfono"
        placeholder="11 1234-5678"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <Input
        label="País"
        placeholder="Ej: Argentina"
        value={country}
        onChangeText={setCountry}
      />

      <Input
        label="Ciudad"
        placeholder="Ej: Buenos Aires"
        value={city}
        onChangeText={setCity}
      />

      <Input
        label="Dirección"
        placeholder="Ej: Av. Corrientes 1234, Piso 5"
        value={address}
        onChangeText={setAddress}
      />
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>🎯 Tus Intereses</Text>
      <Text style={styles.stepSubtitle}>
        Selecciona lo que te gusta para mejorar tus sugerencias
      </Text>

      <View style={styles.optionsGrid}>
        {INTERESTS_OPTIONS.map(interest => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.optionCard,
              selectedInterests.includes(interest.id) && styles.optionCardSelected,
            ]}
            onPress={() => toggleInterest(interest.id)}
          >
            <Text style={styles.optionIcon}>{interest.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                selectedInterests.includes(interest.id) && styles.optionLabelSelected,
              ]}
            >
              {interest.label.replace(interest.icon, '').trim()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>📋 Categorías Favoritas</Text>
      <Text style={styles.stepSubtitle}>
        ¿Qué tipo de eventos organizas más?
      </Text>

      <View style={styles.optionsGrid}>
        {EVENT_CATEGORIES.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.optionCard,
              selectedCategories.includes(category.id) && styles.optionCardSelected,
            ]}
            onPress={() => toggleCategory(category.id)}
          >
            <Text style={styles.optionIcon}>{category.icon}</Text>
            <Text
              style={[
                styles.optionLabel,
                selectedCategories.includes(category.id) && styles.optionLabelSelected,
              ]}
            >
              {category.label.replace(category.icon, '').trim()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.permissionsContainer}>
        <Text style={styles.permissionsTitle}>Permisos</Text>

        <TouchableOpacity
          style={styles.permissionRow}
          onPress={() => setNotificationsEnabled(!notificationsEnabled)}
        >
          <Text style={styles.permissionIcon}>
            {notificationsEnabled ? '🔔' : '🔕'}
          </Text>
          <View style={styles.permissionText}>
            <Text style={styles.permissionLabel}>Notificaciones</Text>
            <Text style={styles.permissionDesc}>
              Recibe recordatorios de tus eventos
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              notificationsEnabled && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                notificationsEnabled && styles.toggleThumbActive,
              ]}
            />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.permissionRow}
          onPress={() => setLocationEnabled(!locationEnabled)}
        >
          <Text style={styles.permissionIcon}>
            {locationEnabled ? '📍' : '🚫'}
          </Text>
          <View style={styles.permissionText}>
            <Text style={styles.permissionLabel}>Ubicación</Text>
            <Text style={styles.permissionDesc}>
              Sugerencias basadas en tu ubicación
            </Text>
          </View>
          <View
            style={[
              styles.toggle,
              locationEnabled && styles.toggleActive,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                locationEnabled && styles.toggleThumbActive,
              ]}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return renderStep1();
    }
  };

  return (
    <LinearGradient
      colors={brandStyles.gradients.home}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={false}
          removeClippedSubviews={false}
          scrollEventThrottle={16}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
            </View>
            <Text style={styles.title}>¡Bienvenido!</Text>
            <Text style={styles.subtitle}>
              Personalicemos tu experiencia
            </Text>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {[...Array(totalSteps)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index + 1 <= currentStep && styles.progressDotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.progressText}>
            Paso {currentStep} de {totalSteps}
          </Text>

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Navigation Buttons */}
          <View style={styles.navigationContainer}>
            {currentStep > 1 && (
              <Button
                title="Atrás"
                onPress={handleBack}
                variant="secondary"
                style={styles.navButton}
              />
            )}

            <Button
              title={currentStep === totalSteps ? 'Completar' : 'Siguiente'}
              onPress={handleNext}
              loading={isLoading}
              style={[styles.navButton, currentStep === 1 && styles.navButtonFull]}
            />
          </View>

          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Saltar por ahora</Text>
          </TouchableOpacity>
        </ScrollView>

        {isLoading && <Loading fullScreen text="Guardando preferencias..." />}
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
    paddingHorizontal: theme.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoContainer: {
    ...brandStyles.logoContainer,
    marginBottom: theme.spacing.md,
  },
  logo: brandStyles.logo,
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: theme.spacing.xs,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  progressText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  stepContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  stepTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  stepSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  optionCard: {
    width: '30%',
    minWidth: 90,
    backgroundColor: theme.colors.background.paper,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.border.light,
  },
  optionCardSelected: {
    backgroundColor: theme.colors.primary.light,
    borderColor: theme.colors.primary.main,
  },
  optionIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  optionLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    fontWeight: theme.typography.fontWeight.medium,
  },
  optionLabelSelected: {
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.bold,
  },
  permissionsContainer: {
    marginTop: theme.spacing.lg,
  },
  permissionsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: theme.colors.background.default,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  permissionIcon: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  permissionText: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  permissionDesc: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
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
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.status.error,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    textAlign: 'center',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  navButton: {
    flex: 1,
  },
  navButtonFull: {
    flex: 1,
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  skipText: {
    fontSize: theme.typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: theme.typography.fontWeight.medium,
  },
  inputWrapper: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  basicInput: {
    backgroundColor: theme.colors.background.paper,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
  },
});

export default OnboardingScreen;
