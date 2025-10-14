// Sistema de colores de Kaia - Paleta Profesional
export const colors = {
  // Primary colors - Índigo (Confianza, Tecnología, Inteligencia)
  primary: {
    main: '#4F46E5',      // Índigo vibrante
    light: '#818CF8',     // Índigo claro
    dark: '#3730A3',      // Índigo oscuro
    contrast: '#FFFFFF',  // Texto sobre primario
  },

  // Secondary colors - Púrpura (Creatividad, Sofisticación)
  secondary: {
    main: '#7C3AED',      // Púrpura vibrante
    light: '#A78BFA',     // Púrpura claro
    dark: '#5B21B6',      // Púrpura oscuro
    contrast: '#FFFFFF',  // Texto sobre secundario
  },

  // Tertiary colors - Verde Esmeralda (Éxito, Crecimiento)
  tertiary: {
    main: '#10B981',      // Verde esmeralda
    light: '#34D399',     // Verde claro
    dark: '#059669',      // Verde oscuro
    contrast: '#FFFFFF',  // Texto sobre terciario
  },

  // Accent colors - Ámbar (Energía, Atención)
  accent: {
    main: '#F59E0B',      // Ámbar
    light: '#FBBF24',     // Ámbar claro
    dark: '#D97706',      // Ámbar oscuro
    contrast: '#000000',  // Texto sobre accent
  },

  // Neutral colors
  neutral: {
    white: '#FFFFFF',
    black: '#000000',
    gray100: '#F5F5F5',
    gray200: '#EEEEEE',
    gray300: '#E0E0E0',
    gray400: '#BDBDBD',
    gray500: '#9E9E9E',
    gray600: '#757575',
    gray700: '#616161',
    gray800: '#424242',
    gray900: '#212121',
  },

  // Status colors - Mejorados para accesibilidad
  status: {
    success: '#10B981',   // Verde esmeralda (mismo que tertiary)
    warning: '#F59E0B',   // Ámbar
    error: '#EF4444',     // Rojo vibrante
    info: '#3B82F6',      // Azul cielo
  },

  // Background colors
  background: {
    default: '#FAFAFA',
    paper: '#FFFFFF',
    dark: '#121212',
  },

  // Text colors
  text: {
    primary: '#212121',
    secondary: '#757575',
    disabled: '#BDBDBD',
    hint: '#9E9E9E',
    inverse: '#FFFFFF',
  },

  // Border colors
  border: {
    light: '#E0E0E0',
    main: '#BDBDBD',
    dark: '#9E9E9E',
  },

  // Category colors (para eventos) - Actualizados
  category: {
    work: '#3B82F6',      // Azul
    personal: '#10B981',  // Verde
    health: '#EF4444',    // Rojo
    social: '#7C3AED',    // Púrpura
    finance: '#F59E0B',   // Ámbar
    education: '#06B6D4', // Cian
    other: '#6B7280',     // Gris
  },

  // Gradientes (para fondos y efectos visuales)
  gradients: {
    primary: ['#4F46E5', '#7C3AED'],      // Índigo a Púrpura
    secondary: ['#7C3AED', '#A78BFA'],    // Púrpura
    success: ['#10B981', '#34D399'],      // Verde
    sunset: ['#F59E0B', '#EF4444'],       // Ámbar a Rojo
    ocean: ['#3B82F6', '#06B6D4'],        // Azul a Cian
  },
};

export type ColorScheme = typeof colors;

export default colors;
