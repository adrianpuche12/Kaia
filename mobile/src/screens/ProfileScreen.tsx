import React, { useEffect, useState } from 'react';
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
import { useAuth } from '../hooks';
import { Loading } from '../components/common';
import { theme } from '../theme';
import { brandStyles } from '../theme/brandStyles';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from '../navigation/MainNavigator';

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  ProfileStackParamList,
  'Profile'
>;

type Props = {
  navigation: ProfileScreenNavigationProp;
};

const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout, isLoading } = useAuth();
  const [localLoading, setLocalLoading] = useState(false);

  const [fontsLoaded] = useFonts({
    Caveat_400Regular,
    Caveat_700Bold,
  });

  if (!fontsLoaded || !user) {
    return <Loading fullScreen text="Cargando perfil..." />;
  }

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLocalLoading(true);
            try {
              await logout();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión. Intenta de nuevo.');
              setLocalLoading(false);
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateInput: string | Date) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const menuItems = [
    {
      icon: 'pencil-outline',
      title: 'Editar Perfil',
      subtitle: 'Actualiza tu nombre y email',
      onPress: () => navigation.navigate('EditProfile'),
      color: theme.colors.primary.main,
    },
    {
      icon: 'settings-outline',
      title: 'Preferencias',
      subtitle: 'Intereses y configuración',
      onPress: () => navigation.navigate('OnboardingPreferences'),
      color: theme.colors.secondary.main,
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacidad y Seguridad',
      subtitle: 'Cambiar contraseña y permisos',
      onPress: () => Alert.alert('Próximamente', 'Privacidad estará disponible en v1.8.0'),
      color: theme.colors.tertiary.main,
    },
  ];

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
            <View style={styles.logoContainer}>
              <Text style={styles.logo}>{brandStyles.brandText.name}</Text>
            </View>
            <Text style={styles.subtitle}>Mi Perfil</Text>
          </View>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            {/* Avatar Circle */}
            <View style={styles.avatarContainer}>
              <LinearGradient
                colors={[theme.colors.primary.main, theme.colors.secondary.main]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Text>
              </LinearGradient>
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.name || 'Usuario'}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              {user.createdAt && (
                <View style={styles.memberSince}>
                  <Ionicons
                    name="calendar-outline"
                    size={14}
                    color={theme.colors.text.secondary}
                  />
                  <Text style={styles.memberSinceText}>
                    Miembro desde {formatDate(user.createdAt)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Menu Options */}
          <View style={styles.menuContainer}>
            <Text style={styles.menuTitle}>Configuración</Text>

            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}15` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuItemTitle}>{item.title}</Text>
                  <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons
                  name="chevron-forward-outline"
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.8}
            disabled={localLoading}
          >
            <Ionicons name="log-out-outline" size={24} color={theme.colors.status.error} />
            <Text style={styles.logoutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          {/* Version Info */}
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Kaia v1.9.0</Text>
            <Text style={styles.versionSubtext}>Su asistente ideal</Text>
          </View>
        </ScrollView>

        {(isLoading || localLoading) && <Loading fullScreen text="Cerrando sesión..." />}
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

  // Profile Card
  profileCard: {
    marginHorizontal: theme.spacing.xl,
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing['2xl'],
    alignItems: 'center',
    ...theme.shadows.lg,
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    ...theme.shadows.md,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
  },
  userName: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  userEmail: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.md,
  },
  memberSince: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.neutral.gray100,
    borderRadius: theme.borderRadius.full,
  },
  memberSinceText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Menu
  menuContainer: {
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  menuTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: '#FFFFFF',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.base,
  },
  menuIconContainer: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },

  // Logout Button
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: theme.spacing.xl,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 2,
    borderColor: theme.colors.status.error,
    gap: theme.spacing.sm,
    ...theme.shadows.base,
  },
  logoutText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.status.error,
  },

  // Version Info
  versionContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  versionText: {
    fontSize: theme.typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: theme.typography.fontWeight.medium,
  },
  versionSubtext: {
    fontSize: theme.typography.fontSize.xs,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
});

export default ProfileScreen;
