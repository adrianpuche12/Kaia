// Navegador raíz que decide entre Auth, Onboarding y Main
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import OnboardingScreen from '../screens/OnboardingScreen';
import { Loading } from '../components/common';
import { useAuth } from '../hooks';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Simular inicialización (verificar token, etc.)
    const initialize = async () => {
      // Aquí podrías hacer verificaciones adicionales
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsInitializing(false);
    };

    initialize();
  }, []);

  if (isInitializing || isLoading) {
    return <Loading fullScreen text="Cargando Kaia..." />;
  }

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthNavigator />
      ) : !user?.onboardingCompleted ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        </Stack.Navigator>
      ) : (
        <MainNavigator />
      )}
    </NavigationContainer>
  );
};

export default RootNavigator;
