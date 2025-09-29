export const COLORS = {
  primary: '#007AFF',
  secondary: '#FF3B30',
  background: '#FFFFFF',
  text: {
    primary: '#333333',
    secondary: '#666666',
    light: '#999999',
  },
  border: '#E1E1E1',
};

export const SIZES = {
  small: 12,
  medium: 16,
  large: 20,
  xlarge: 24,
  xxlarge: 32,
};

export const API_ENDPOINTS = {
  HEALTH: '/health',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  EVENTS: {
    GET_ALL: '/events',
    CREATE: '/events',
    UPDATE: '/events',
    DELETE: '/events',
  },
};