// Tipos TypeScript centralizados para el backend
import { Request } from 'express';

// ========================================
// Request Types con Usuario Autenticado
// ========================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ========================================
// User & Auth Types
// ========================================

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  lastName?: string;
  phone?: string;
  birthDate?: Date;
  onboardingCompleted?: boolean;
  createdAt: Date;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  phone?: string;
  birthDate?: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

// ========================================
// Event Types
// ========================================

export interface EventDTO {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  type: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  allDay: boolean;
  completed: boolean;
  reminders?: ReminderDTO[];
}

export interface CreateEventDTO {
  title: string;
  description?: string;
  type?: string;
  startTime: string | Date;
  endTime?: string | Date;
  duration?: number;
  location?: string;
  allDay?: boolean;
  timezone?: string;
  placeId?: string;
  participants?: string[];
  checkConflicts?: boolean;
  reminders?: CreateReminderDTO[];
}

export interface UpdateEventDTO {
  title?: string;
  description?: string;
  type?: string;
  startTime?: string | Date;
  endTime?: string | Date;
  location?: string;
  allDay?: boolean;
  completed?: boolean;
  latitude?: number;
  longitude?: number;
  category?: string;
  reminderMinutes?: number;
  status?: string;
  attendees?: string[];
}

// ========================================
// Reminder Types
// ========================================

export interface ReminderDTO {
  id: string;
  title: string;
  message?: string;
  remindAt: Date;
  channel: string;
  sent: boolean;
  read: boolean;
}

export interface CreateReminderDTO {
  title: string;
  message?: string;
  remindAt: string | Date;
  channel?: string;
  eventId?: string;
  minutesBefore?: number;
}

// ========================================
// Alarm Types
// ========================================

export interface AlarmDTO {
  id: string;
  name?: string;
  time: string;
  daysActive: Record<string, boolean>;
  soundType: string;
  musicName?: string;
  wakeMessage?: string;
  enabled: boolean;
}

export interface CreateAlarmDTO {
  name?: string;
  time: string;
  daysActive: Record<string, boolean>;
  soundType?: string;
  musicId?: string;
  musicName?: string;
  wakeMessage?: string;
  vibration?: boolean;
  snooze?: boolean;
  snoozeTime?: number;
  readAgenda?: boolean;
}

// ========================================
// MCP Types
// ========================================

export interface MCPDTO {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  capabilities: string[];
  usageCount: number;
  rating?: number;
  enabled: boolean;
}

export interface MCPDefinition {
  name: string;
  type: string;
  category: string;
  description: string;
  capabilities: string[];
  inputSchema: any;
  outputSchema: any;
  executorCode: string;
  config?: any;
}

export interface MCPExecutionRequest {
  mcpId: string;
  input: any;
}

export interface MCPExecutionResult {
  success: boolean;
  output?: any;
  error?: string;
  executionTimeMs: number;
}

export interface GenerateMCPRequest {
  userRequest: string;
  taskType: string;
  targetService: string;
  targetData: string;
  context?: any;
}

// ========================================
// Message & Contact Types
// ========================================

export interface MessageDTO {
  id: string;
  platform: string;
  direction: string;
  content: string;
  subject?: string;
  read: boolean;
  contact: ContactDTO;
  createdAt: Date;
}

export interface SendMessageDTO {
  platform: string;
  contactId?: string;
  contactName?: string;
  content: string;
  subject?: string;
}

export interface ContactDTO {
  id: string;
  name: string;
  nickname?: string;
  phoneNumbers: string[];
  emails: string[];
  hasWhatsApp: boolean;
  messageCount: number;
}

export interface CreateContactDTO {
  name: string;
  nickname?: string;
  phoneNumbers?: string[];
  emails?: string[];
  tags?: string[];
}

// ========================================
// Location Types
// ========================================

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface LocationLogDTO {
  latitude: number;
  longitude: number;
  accuracy?: number;
  action?: string;
  eventId?: string;
}

export interface PlaceDTO {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeType?: string;
  openingHours?: any;
  phone?: string;
  rating?: number;
  distanceKm?: number;
}

export interface ETAResult {
  distanceMeters: number;
  distanceText: string;
  durationMinutes: number;
  durationText: string;
  trafficDelay: number;
}

export interface CalculateETARequest {
  origin: Coordinates;
  destination: Coordinates;
  mode?: string;
}

// ========================================
// Voice & NLP Types
// ========================================

export interface VoiceProcessRequest {
  transcript: string;
  audioUrl?: string;
  duration?: number;
}

export interface ParsedIntent {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  rawText: string;
}

export interface NLPRequest {
  text: string;
  context?: any;
}

export interface NLPResponse {
  originalText?: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  suggestedActions?: string[];
  response?: {
    text: string;
    tts?: string;
    actions?: Array<{
      type: string;
      data?: any;
    }>;
  };
}

// ========================================
// Analytics Types
// ========================================

export interface DashboardMetrics {
  eventsThisMonth: number;
  voiceCommandsThisWeek: number;
  messagesSent: number;
  mcpsUsed: number;
  mostUsedMCP?: {
    id: string;
    name: string;
    usageCount: number;
  };
  upcomingEvents: number;
}

export interface UsageStats {
  totalSessions: number;
  avgSessionDuration: number;
  voiceCommandsTotal: number;
  voiceSuccessRate: number;
  eventsCreated: number;
  messagesSent: number;
  topFeatures: Array<{
    feature: string;
    usage: number;
  }>;
}

// ========================================
// Utility Types
// ========================================

export interface QueryFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
}

export interface EventFilters extends QueryFilters {
  type?: string;
  completed?: boolean;
}

export interface MessageFilters extends QueryFilters {
  platform?: string;
  direction?: string;
  read?: boolean;
  contactId?: string;
}

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
