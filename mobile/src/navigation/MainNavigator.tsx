// Navegador principal con tabs (Home, Agenda, Chat, Alarms, Contacts)
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import AgendaScreen from '../screens/AgendaScreen';
import ChatScreen from '../screens/ChatScreen';
import AlarmsScreen from '../screens/AlarmsScreen';
import ContactsScreen from '../screens/ContactsScreen';
import ContactDetailScreen from '../screens/ContactDetailScreen';
import LocationHistoryScreen from '../screens/LocationHistoryScreen';
import { theme } from '../theme';

export type MainTabParamList = {
  Home: undefined;
  Agenda: undefined;
  Chat: undefined;
  Alarms: undefined;
  ContactsStack: undefined;
};

export type ContactsStackParamList = {
  ContactsList: undefined;
  ContactDetail: { contactId?: string };
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const ContactsStack = createNativeStackNavigator<ContactsStackParamList>();

// Stack Navigator for Contacts (includes ContactsList and ContactDetail)
const ContactsStackNavigator: React.FC = () => {
  return (
    <ContactsStack.Navigator screenOptions={{ headerShown: false }}>
      <ContactsStack.Screen name="ContactsList" component={ContactsScreen} />
      <ContactsStack.Screen name="ContactDetail" component={ContactDetailScreen} />
    </ContactsStack.Navigator>
  );
};

const MainNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: theme.colors.primary.main,
        tabBarInactiveTintColor: theme.colors.text.secondary,
        tabBarStyle: {
          backgroundColor: theme.colors.background.paper,
          borderTopColor: theme.colors.border.light,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.fontSize.xs,
          fontWeight: theme.typography.fontWeight.medium,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Agenda"
        component={AgendaScreen}
        options={{
          headerShown: false,
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          title: 'Chat',
          tabBarIcon: ({ color, size }) => (
            <MessageIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Alarms"
        component={AlarmsScreen}
        options={{
          headerShown: false,
          title: 'Alarmas',
          tabBarIcon: ({ color, size }) => (
            <AlarmIcon color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ContactsStack"
        component={ContactsStackNavigator}
        options={{
          headerShown: false,
          title: 'Contactos',
          tabBarIcon: ({ color, size }) => (
            <ContactsIcon color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Iconos simples usando Text (puedes reemplazarlos con react-native-vector-icons)
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>🏠</Text>
);

const CalendarIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>📅</Text>
);

const MessageIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>💬</Text>
);

const AlarmIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>⏰</Text>
);

const ContactsIcon = ({ color, size }: { color: string; size: number }) => (
  <Text style={{ fontSize: size, color }}>👥</Text>
);

export default MainNavigator;
