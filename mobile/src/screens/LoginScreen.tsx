// Pantalla de Login
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
import { useAuth } from '../hooks';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  console.log('🔤 LoginScreen - Fonts loaded:', fontsLoaded);

  if (!fontsLoaded) {
    return <Loading fullScreen text="Cargando fuentes..." />;
  }

  const handleLogin = async () => {
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Por favor completa todos los campos');
      return;
    }

    const result = await login({ email, password });

    if (!result.success) {
      setLocalError(result.error || 'Error al iniciar sesión');
    }
  };

  const goToRegister = () => {
    navigation.navigate('Register');
  };

  console.log('🎨 LoginScreen - Rendering with gradient colors:', brandStyles.gradients.primary);

  return (
    <View style={[styles.gradient, { backgroundColor: '#FF0000' }]}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          enabled={Platform.OS === 'ios'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.content}>
              {/* Logo/Header */}
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
                label="Email"
                placeholder="tu@email.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={localError && !email ? 'El email es requerido' : undefined}
              />

              <Input
                label="Contraseña"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                showPasswordToggle
                error={localError && !password ? 'La contraseña es requerida' : undefined}
              />

              {(localError || error) && (
                <Text style={styles.errorText}>{localError || error}</Text>
              )}

              <Button
                title="Iniciar Sesión"
                onPress={handleLogin}
                loading={isLoading}
                fullWidth
                style={styles.loginButton}
              />

              {/* Register Link */}
              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes cuenta? </Text>
                <TouchableOpacity onPress={goToRegister}>
                  <Text style={styles.registerLink}>Regístrate</Text>
                </TouchableOpacity>
              </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {isLoading && <Loading fullScreen text="Iniciando sesión..." />}
      </SafeAreaView>
    </View>
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
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing['2xl'],
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing['3xl'],
  },
  logoContainer: {
    ...brandStyles.logoContainer,
    marginBottom: theme.spacing.lg,
  },
  logo: brandStyles.logo,
  subtitle: brandStyles.subtitle,
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius['2xl'],
    padding: theme.spacing['2xl'],
    ...theme.shadows.lg,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: theme.spacing.lg,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  registerText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
  },
  registerLink: {
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

export default LoginScreen;
