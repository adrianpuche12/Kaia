import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../hooks';
import { Loading } from '../components/common';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import { authAPI } from '../services/api/authAPI';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/MainNavigator';

type EditProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'EditProfile'
>;

type Props = {
  navigation: EditProfileScreenNavigationProp;
};

const EditProfileScreen = ({ navigation }: Props) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Original values for comparison
  const [originalValues, setOriginalValues] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: undefined as Date | undefined,
  });

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  useEffect(() => {
    if (user) {
      const initialValues = {
        name: user.name || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        birthDate: user.birthDate ? new Date(user.birthDate) : undefined,
      };

      setName(initialValues.name);
      setLastName(initialValues.lastName);
      setEmail(initialValues.email);
      setPhone(initialValues.phone);
      setBirthDate(initialValues.birthDate);
      setOriginalValues(initialValues);
    }
  }, [user]);

  useEffect(() => {
    // Check if there are any changes
    const changed =
      name !== originalValues.name ||
      lastName !== originalValues.lastName ||
      email !== originalValues.email ||
      phone !== originalValues.phone ||
      (birthDate?.getTime() !== originalValues.birthDate?.getTime() &&
        !(birthDate === undefined && originalValues.birthDate === undefined));

    setHasChanges(changed);
  }, [name, lastName, email, phone, birthDate, originalValues]);

  if (!fontsLoaded || !user) {
    return <Loading fullScreen text="Cargando..." />;
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /\S+@\S+\.\S+/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone || phone.trim().length === 0) return true; // Phone is optional
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const getChangedFields = () => {
    const changes: string[] = [];
    if (name !== originalValues.name) changes.push('nombre');
    if (lastName !== originalValues.lastName) changes.push('apellido');
    if (email !== originalValues.email) changes.push('email');
    if (phone !== originalValues.phone) changes.push('teléfono');
    if (birthDate?.getTime() !== originalValues.birthDate?.getTime()) {
      changes.push('fecha de nacimiento');
    }
    return changes;
  };

  const handleSave = async () => {
    // Validations
    if (name.trim().length === 0) {
      Alert.alert('Error', 'El nombre no puede estar vacío');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('Error', 'El formato del email no es válido');
      return;
    }

    if (!validatePhone(phone)) {
      Alert.alert('Error', 'El formato del teléfono no es válido. Usa formato internacional (+34...)');
      return;
    }

    // Get changed fields for confirmation
    const changedFields = getChangedFields();

    if (changedFields.length === 0) {
      Alert.alert('Sin cambios', 'No has realizado ningún cambio');
      return;
    }

    // Confirmation dialog
    const changedFieldsText = changedFields.join(', ');
    Alert.alert(
      'Confirmar Cambios',
      `Has modificado: ${changedFieldsText}.\n\n¿Deseas guardar estos cambios?`,
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
    setLoading(true);

    try {
      const updateData: any = {};

      // Only send changed fields
      if (name !== originalValues.name) updateData.name = name;
      if (lastName !== originalValues.lastName) updateData.lastName = lastName;
      if (email !== originalValues.email) updateData.email = email;
      if (phone !== originalValues.phone) updateData.phone = phone || undefined;
      if (birthDate?.getTime() !== originalValues.birthDate?.getTime()) {
        updateData.birthDate = birthDate ? birthDate.toISOString() : undefined;
      }

      const updatedUser = await authAPI.updateProfile(updateData);

      // Update user in auth context
      if (setUser) {
        setUser(updatedUser);
      }

      Alert.alert(
        'Éxito',
        'Tu perfil ha sido actualizado correctamente',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error updating profile:', error);

      let errorMessage = 'No se pudo actualizar el perfil. Intenta de nuevo.';

      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      setBirthDate(selectedDate);
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'No especificada';
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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
            <Text style={styles.subtitle}>Editar Perfil</Text>
          </View>

          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.colors.primary.main, theme.colors.secondary.main]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {name ? name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            </View>
            <Text style={styles.avatarHint}>Cambiar foto (próximamente)</Text>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Nombre <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Tu nombre"
                  placeholderTextColor={theme.colors.text.placeholder}
                />
              </View>
            </View>

            {/* LastName Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Apellido</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Tu apellido"
                  placeholderTextColor={theme.colors.text.placeholder}
                />
              </View>
            </View>

            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email <Text style={styles.required}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="tu@email.com"
                  placeholderTextColor={theme.colors.text.placeholder}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Teléfono</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+34 612 345 678"
                  placeholderTextColor={theme.colors.text.placeholder}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* BirthDate Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Fecha de Nacimiento</Text>
              <TouchableOpacity
                style={styles.inputContainer}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <Text
                  style={[
                    styles.input,
                    { paddingTop: Platform.OS === 'ios' ? 12 : 0 },
                    !birthDate && { color: theme.colors.text.placeholder },
                  ]}
                >
                  {formatDate(birthDate)}
                </Text>
                <Ionicons
                  name="chevron-down-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={birthDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
                minimumDate={new Date(1900, 0, 1)}
              />
            )}

            {/* Change Password Button */}
            <TouchableOpacity
              style={styles.changePasswordButton}
              onPress={() => Alert.alert('Próximamente', 'Cambiar contraseña estará disponible en v1.8.0')}
              activeOpacity={0.7}
            >
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary.main} />
              <Text style={styles.changePasswordText}>Cambiar Contraseña</Text>
              <Ionicons
                name="chevron-forward-outline"
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              !hasChanges && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!hasChanges || loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={
                hasChanges && !loading
                  ? [theme.colors.primary.main, theme.colors.secondary.main]
                  : ['#CCCCCC', '#AAAAAA']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Helper Text */}
          <View style={styles.helperContainer}>
            <Text style={styles.helperText}>
              Los campos marcados con * son obligatorios
            </Text>
            {hasChanges && (
              <Text style={styles.changesText}>
                Tienes cambios sin guardar
              </Text>
            )}
          </View>
        </ScrollView>

        {loading && <Loading fullScreen text="Guardando cambios..." />}
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

  // Avatar Section
  avatarSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    ...theme.shadows.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  avatarHint: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },

  // Form Card
  formCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
    marginBottom: theme.spacing.xl,
  },
  inputGroup: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.xs,
  },
  required: {
    color: theme.colors.status.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.neutral.gray50,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.neutral.gray200,
    paddingHorizontal: theme.spacing.md,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.primary,
    paddingVertical: theme.spacing.sm,
  },
  changePasswordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.colors.primary.main}10`,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.md,
    borderWidth: 1,
    borderColor: `${theme.colors.primary.main}30`,
  },
  changePasswordText: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.primary.main,
    marginLeft: theme.spacing.sm,
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
  helperText: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  changesText: {
    fontSize: theme.typography.fontSize.sm,
    color: '#FFFFFF',
    fontWeight: theme.typography.fontWeight.medium,
    marginTop: theme.spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
  },
});

export default EditProfileScreen;
