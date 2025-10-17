// Configuración de variables de entorno
import dotenv from 'dotenv';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',

  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // External APIs
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  claudeApiKey: process.env.CLAUDE_API_KEY || '',
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  googleSpeechApiKey: process.env.GOOGLE_SPEECH_API_KEY || '',

  // Communication
  whatsappApiUrl: process.env.WHATSAPP_API_URL || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',

  gmailClientId: process.env.GMAIL_CLIENT_ID || '',
  gmailClientSecret: process.env.GMAIL_CLIENT_SECRET || '',

  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER || '',

  // Redis Cache
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  cacheEnabled: process.env.CACHE_ENABLED === 'true',
  cacheDefaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '60', 10),

  // Firebase Cloud Messaging
  fcmServerKey: process.env.FCM_SERVER_KEY || '',

  // Spotify
  spotifyClientId: process.env.SPOTIFY_CLIENT_ID || '',
  spotifyClientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8081',
};

// Validar variables críticas en producción
if (config.nodeEnv === 'production') {
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL',
  ];

  const missingVars = requiredVars.filter(varName => {
    const key = varName.toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    return !config[key as keyof typeof config];
  });

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}

export default config;
