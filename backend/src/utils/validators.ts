// Validadores personalizados
import { z } from 'zod';

// Email regex más permisivo
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password: mínimo 8 caracteres, al menos una mayúscula, una minúscula y un número
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Teléfono internacional (formato flexible)
const phoneRegex = /^\+?[1-9]\d{1,14}$/;

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

/**
 * Valida password seguro
 */
export function isValidPassword(password: string): boolean {
  return passwordRegex.test(password);
}

/**
 * Valida teléfono
 */
export function isValidPhone(phone: string): boolean {
  return phoneRegex.test(phone);
}

/**
 * Valida fecha ISO
 */
export function isValidISODate(date: string): boolean {
  const parsed = new Date(date);
  return !isNaN(parsed.getTime());
}

/**
 * Schemas de Zod para validación
 */
export const schemas = {
  // Auth
  register: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(8, 'Password debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Password debe tener al menos una mayúscula')
      .regex(/[a-z]/, 'Password debe tener al menos una minúscula')
      .regex(/\d/, 'Password debe tener al menos un número'),
    name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres'),
    lastName: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Teléfono inválido').optional(),
    birthDate: z.string().refine(isValidISODate, 'Fecha inválida').optional(),
  }),

  login: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1, 'Password requerido'),
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token requerido'),
  }),

  updateProfile: z.object({
    name: z.string().min(2).optional(),
    lastName: z.string().optional(),
    phone: z.string().regex(phoneRegex, 'Teléfono inválido').optional(),
    birthDate: z.string().refine(isValidISODate, 'Fecha inválida').optional(),
    avatar: z.string().url().optional(),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Password actual requerido'),
    newPassword: z.string().min(8, 'Password debe tener al menos 8 caracteres')
      .regex(/[A-Z]/, 'Password debe tener al menos una mayúscula')
      .regex(/[a-z]/, 'Password debe tener al menos una minúscula')
      .regex(/\d/, 'Password debe tener al menos un número'),
  }),

  updatePreferences: z.object({
    notificationsEnabled: z.boolean().optional(),
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
    voiceEnabled: z.boolean().optional(),
    language: z.string().length(2).optional(),
    timezone: z.string().optional(),
  }),

  // Event
  createEvent: z.object({
    title: z.string().min(1, 'Título requerido').max(200),
    description: z.string().max(1000).optional(),
    type: z.string().optional(),
    startTime: z.string().refine(isValidISODate, 'Fecha de inicio inválida'),
    endTime: z.string().refine(isValidISODate, 'Fecha de fin inválida').optional(),
    location: z.string().max(500).optional(),
    allDay: z.boolean().optional(),
  }),

  updateEvent: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(1000).optional(),
    type: z.string().optional(),
    startTime: z.string().refine(isValidISODate).optional(),
    endTime: z.string().refine(isValidISODate).optional(),
    location: z.string().max(500).optional(),
    allDay: z.boolean().optional(),
    completed: z.boolean().optional(),
  }),

  // Reminder
  createReminder: z.object({
    title: z.string().min(1).max(200),
    message: z.string().max(1000).optional(),
    remindAt: z.string().refine(isValidISODate),
    channel: z.enum(['PUSH', 'EMAIL', 'SMS', 'VOICE']).optional(),
    eventId: z.string().optional(),
  }),

  // Alarm
  createAlarm: z.object({
    name: z.string().max(100).optional(),
    time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Formato de hora inválido (HH:mm)' }),
    daysActive: z.record(z.string(), z.boolean()),
    soundType: z.enum(['DEFAULT', 'MUSIC', 'VOICE', 'GENTLE', 'NATURE']).optional(),
    musicId: z.string().optional(),
    musicName: z.string().optional(),
    wakeMessage: z.string().max(500).optional(),
    vibration: z.boolean().optional(),
    snooze: z.boolean().optional(),
    snoozeTime: z.number().min(1).max(30).optional(),
    readAgenda: z.boolean().optional(),
  }),

  // Message
  sendMessage: z.object({
    platform: z.enum(['WHATSAPP', 'EMAIL', 'SMS']),
    contactId: z.string().optional(),
    contactName: z.string().optional(),
    to: z.string().optional(), // Número o email directo
    content: z.string().min(1, 'Contenido requerido').max(5000),
    subject: z.string().max(200).optional(),
    scheduledFor: z.string().refine(isValidISODate, 'Fecha inválida').optional(),
  }).refine(
    data => data.contactId || data.contactName || data.to,
    { message: 'Debe proporcionar contactId, contactName o destinatario (to)' }
  ),

  // Contact
  createContact: z.object({
    name: z.string().min(1, 'Nombre requerido').max(200),
    nickname: z.string().max(100).optional(),
    phoneNumbers: z.array(z.string().regex(phoneRegex, 'Teléfono inválido')).optional(),
    emails: z.array(z.string().email('Email inválido')).optional(),
    tags: z.array(z.string().max(50)).optional(),
    address: z.string().max(500).optional(),
    company: z.string().max(200).optional(),
    jobTitle: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    birthday: z.string().refine(isValidISODate, 'Fecha inválida').optional(),
    hasWhatsApp: z.boolean().optional(),
  }),

  updateContact: z.object({
    name: z.string().min(1).max(200).optional(),
    nickname: z.string().max(100).optional(),
    phoneNumbers: z.array(z.string().regex(phoneRegex, 'Teléfono inválido')).optional(),
    emails: z.array(z.string().email('Email inválido')).optional(),
    tags: z.array(z.string().max(50)).optional(),
    address: z.string().max(500).optional(),
    company: z.string().max(200).optional(),
    jobTitle: z.string().max(200).optional(),
    notes: z.string().max(2000).optional(),
    birthday: z.string().refine(isValidISODate, 'Fecha inválida').optional(),
    hasWhatsApp: z.boolean().optional(),
  }),

  addTag: z.object({
    tag: z.string().min(1, 'Tag requerido').max(50),
  }),

  syncContacts: z.object({
    contacts: z.array(z.object({
      deviceId: z.string().optional(),
      name: z.string().min(1).max(200),
      nickname: z.string().max(100).optional(),
      phoneNumbers: z.array(z.string()).optional(),
      emails: z.array(z.string().email()).optional(),
      address: z.string().max(500).optional(),
      company: z.string().max(200).optional(),
      jobTitle: z.string().max(200).optional(),
      birthday: z.string().optional(),
      hasWhatsApp: z.boolean().optional(),
    })).min(1, 'Debe proporcionar al menos un contacto'),
  }),

  cleanupContacts: z.object({
    maxAgeDays: z.number().min(1).max(365).optional(),
  }),

  // Location
  updateLocation: z.object({
    latitude: z.number().min(-90, 'Latitud debe estar entre -90 y 90').max(90),
    longitude: z.number().min(-180, 'Longitud debe estar entre -180 y 180').max(180),
    accuracy: z.number().min(0).optional(),
    altitude: z.number().optional(),
    speed: z.number().min(0).optional(),
    heading: z.number().min(0).max(360).optional(),
  }),

  createGeofence: z.object({
    name: z.string().min(1, 'Nombre requerido').max(200),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    radiusMeters: z.number().min(10, 'Radio mínimo: 10 metros').max(10000, 'Radio máximo: 10km'),
    type: z.string().max(50).optional(),
    notifyOnEnter: z.boolean().optional(),
    notifyOnExit: z.boolean().optional(),
    enabled: z.boolean().optional(),
  }),

  calculateRoute: z.object({
    from: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    to: z.object({
      latitude: z.number().min(-90).max(90),
      longitude: z.number().min(-180).max(180),
    }),
    mode: z.enum(['DRIVING', 'WALKING', 'TRANSIT', 'BICYCLING']).optional(),
  }),

  geocode: z.object({
    address: z.string().min(3, 'Dirección debe tener al menos 3 caracteres').max(500),
  }),

  reverseGeocode: z.object({
    latitude: z.number().min(-90, 'Latitud inválida').max(90),
    longitude: z.number().min(-180, 'Longitud inválida').max(180),
  }),

  // Voice
  processVoice: z.object({
    transcript: z.string().min(1, 'Transcripción requerida').max(5000),
    audioUrl: z.string().url('URL de audio inválida').optional(),
    duration: z.number().min(0).max(300).optional(), // Máximo 5 minutos
    language: z.string().length(2).optional(), // Código ISO de idioma (ej: 'es', 'en')
    confidence: z.number().min(0).max(1).optional(), // Confianza de transcripción
  }),

  // MCP
  registerMCP: z.object({
    name: z.string().min(1, 'Nombre requerido').max(200),
    type: z.enum(['SYSTEM', 'USER_CREATED', 'AUTO_GENERATED']).optional(),
    category: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    capabilities: z.array(z.string()).optional(),
    inputSchema: z.any().optional(),
    outputSchema: z.any().optional(),
    executorCode: z.string().optional(),
    enabled: z.boolean().optional(),
  }),

  updateMCP: z.object({
    name: z.string().min(1).max(200).optional(),
    category: z.string().max(100).optional(),
    description: z.string().max(1000).optional(),
    capabilities: z.array(z.string()).optional(),
    inputSchema: z.any().optional(),
    outputSchema: z.any().optional(),
    executorCode: z.string().optional(),
    enabled: z.boolean().optional(),
  }),

  executeMCP: z.object({
    mcpId: z.string().min(1, 'MCP ID requerido'),
    input: z.any(),
    userId: z.string().optional(),
  }),

  toggleMCP: z.object({
    enabled: z.boolean(),
  }),

  rateMCP: z.object({
    rating: z.number().min(1, 'Rating mínimo: 1').max(5, 'Rating máximo: 5'),
  }),
};

/**
 * Valida datos contra un schema de Zod
 */
export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Valida datos y retorna errores en formato amigable
 */
export function validateSafe<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return { success: false, errors };
}

export default {
  isValidEmail,
  isValidPassword,
  isValidPhone,
  isValidISODate,
  schemas,
  validate,
  validateSafe,
};
