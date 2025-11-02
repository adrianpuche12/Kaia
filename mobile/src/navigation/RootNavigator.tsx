// Navegador raíz que decide entre Auth, Onboarding y Main
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import { Loading } from '../components/common';
import { useAuth } from '../hooks';
import { useStore } from '../store/store';
import { secureStorage } from '../services/storage/secureStorage';
import { notificationService } from '../services/notificationService';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // SOLO ejecutar al montar el componente - UNA VEZ
    const initialize = async () => {
      try {
        // Cargar usuario desde secureStorage
        const savedUser = await secureStorage.getUser();
        const savedToken = await secureStorage.getAccessToken();

        console.log('🔍 Saved user from storage:', savedUser);
        console.log('🔍 Saved token from storage:', savedToken ? 'EXISTS' : 'NO TOKEN');

        if (savedUser && savedToken) {
          // USAR getState() DIRECTO para evitar re-renders infinitos
          // No usamos setUser del hook porque crea nueva referencia en cada render
          useStore.getState().setUser(savedUser);
        }

        // Inicializar notificaciones
        const pushToken = await notificationService.initialize();
        if (pushToken) {
          console.log('📬 Push notifications initialized, token:', pushToken);
          // TODO: Enviar token al backend para guardar
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();

    // Setup notification listeners
    notificationListener.current = notificationService.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification received:', notification);
      }
    );

    responseListener.current = notificationService.addNotificationResponseListener(
      (response) => {
        console.log('👆 Notification tapped:', response);
        // TODO: Handle notification tap (deep linking)
      }
    );

    // Cleanup
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []); // Array vacío = solo al montar, sin dependencias para evitar loops

  console.log('🔍 RootNavigator state:', { isInitializing, isLoading, isAuthenticated, hasUser: !!user, onboardingCompleted: user?.onboardingCompleted });

  if (isInitializing || isLoading) {
    console.log('🔄 Showing loading screen');
    return <Loading fullScreen text="Cargando Kaia..." />;
  }

  // Decidir qué mostrar sin useMemo para evitar problemas de hooks
  let navigationContent;

  if (!isAuthenticated) {
    console.log('🔓 Not authenticated - showing AuthNavigator');
    navigationContent = <AuthNavigator />;
  } else if (!user?.onboardingCompleted) {
    console.log('📝 Showing Onboarding');
    navigationContent = (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      </Stack.Navigator>
    );
  } else {
    console.log('🏠 Showing MainNavigator');
    navigationContent = <MainNavigator />;
  }

  return <NavigationContainer>{navigationContent}</NavigationContainer>;
};

export default RootNavigator;
