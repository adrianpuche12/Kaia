/**
 * TimeSlot para preferencias de tiempo
 */
export interface TimeSlot {
  dayOfWeek: number; // 0-6
  startHour: number; // 0-23
  endHour: number; // 0-23
}

/**
 * Contexto Intencional
 * Dimensión 5: Información sobre intenciones del usuario y patrones de comportamiento
 */
export interface IIntentionalContext {
  userIntent: {
    primaryGoal: string;
    secondaryGoals: string[];
    actionType: 'create' | 'complete' | 'postpone' | 'delete' | 'update';
  };

  behaviorPatterns: {
    typicalCompletionTime?: number; // minutos promedio
    preferredTimeSlots: TimeSlot[];
    completionRate: number; // 0-100
    postponementFrequency: number; // 0-100
  };

  emotionalContext?: {
    stressLevel: number; // 0-100
    motivation: number; // 0-100
    satisfaction: number; // 0-100
  };
}
