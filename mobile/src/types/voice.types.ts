// Tipos relacionados con voz y NLP
export interface VoiceSession {
  id: string;
  userId: string;
  transcript: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  wasSuccessful: boolean;
  timestamp: Date;
}

export interface VoiceCommandRequest {
  transcript: string;
  context?: any;
}

export interface NLPResponse {
  originalText: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  needsClarification: boolean;
  clarificationQuestion?: string;
  suggestedActions: string[];
}

export type VoiceIntent =
  | 'CREATE_EVENT'
  | 'CREATE_REMINDER'
  | 'CREATE_ALARM'
  | 'QUERY_EVENTS'
  | 'SEND_MESSAGE'
  | 'READ_MESSAGES'
  | 'GET_LOCATION_INFO'
  | 'EXECUTE_MCP'
  | 'UPDATE_PREFERENCES'
  | 'UNKNOWN';

export interface VoiceStats {
  totalCommands: number;
  successfulCommands: number;
  successRate: number;
  topIntents: Array<{
    intent: string;
    count: number;
  }>;
}
