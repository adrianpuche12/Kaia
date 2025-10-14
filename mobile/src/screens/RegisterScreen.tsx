// Pantalla de Registro
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts, Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../navigation/AuthNavigator';
import { Button, Input, Loading } from '../components/common';
import { PasswordRequirements } from '../components/auth';
import { useAuth } from '../hooks';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';

type RegisterScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

interface Props {
  navigation: RegisterScreenNavigationProp;
}

const RegisterScreen: React.FC<Props> = ({ navigation }) => {
  const { register, isLoading, error, clearError } = useAuth();
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  const handleRegister = async () => {
    setLocalError('');
    clearError();

    // Validaciones
    if (!name || !email || !password || !confirmPassword) {
      setLocalError('Por favor completa todos los campos obligatorios');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      setLocalError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const result = await register({
      name,
      lastName,
      email,
      password,
    });

    if (!result.success) {
      setLocalError(result.error || 'Error al registrarse');
    }
    // If success, RootNavigator will automatically redirect to Onboarding
  };

  const goToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <LinearGradient
      colors={brandStyles.gradients.secondary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
                </View>
                <Text style={styles.subtitle}>{brandStyles.brandText.tagline}</Text>
              </View>

              {/* Form Card */}
              <View style={styles.formCard}>
                <View style={styles.form}>
              <Input
                label="Nombre *"
                placeholder="Juan"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <Input
                label="Apellido"
                placeholder="Pérez"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
              />

              <Input
                label="Email *"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Input
                label="Contraseña *"
                placeholder="Mínimo 8 caracteres"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showPasswordToggle
              />

              <Input
                label="Confirmar Contraseña *"
                placeholder="Repite tu contraseña"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                showPasswordToggle
              />

              {/* Mostrar requisitos solo cuando hay texto en password */}
              {password.length > 0 && (
                <PasswordRequirements
                  password={password}
                  confirmPassword={confirmPassword}
                />
              )}

              {(localError || error) && (
                <Text style={styles.errorText}>{localError || error}</Text>
              )}

              <Button
                title="Registrarse"
                onPress={handleRegister}
                loading={isLoading}
                fullWidth
                style={styles.registerButton}
              />

              {/* Login Link */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                <TouchableOpacity onPress={goToLogin}>
                  <Text style={styles.loginLink}>Inicia Sesión</Text>
                </TouchableOpacity>
              </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {isLoading && <Loading fullScreen text="Creando cuenta..." />}
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: theme.spacing.xl,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['2xl'],
    marginTop: theme.spacing.lg,
  },
  logoContainer: {
    ...brandStyles.logoContainerSmall,
    marginBottom: theme.spacing.md,
  },
  logo: brandStyles.logoSmall,
  subtitle: brandStyles.subtitleSmall,
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing.xl,
    ...theme.shadows.lg,
  },
  form: {
    width: '100%',
  },
  registerButton: {
    marginTop: theme.spacing.lg,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  loginText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  loginLink: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.primary.main,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  errorText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.status.error,
    marginTop: theme.spacing.sm,
    textAlign: 'center',
  },
});

export default RegisterScreen;
