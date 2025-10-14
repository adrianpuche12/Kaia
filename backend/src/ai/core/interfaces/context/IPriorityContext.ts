/**
 * Contexto de Prioridad
 * Dimensión 3: Información sobre importancia y urgencia
 */
export interface IPriorityContext {
  basePriority: number; // 0-100
  computedPriority: number; // 0-100 (calculado por IA)

  factors: {
    urgency: number; // 0-100
    importance: number; // 0-100
    deadline?: Date;
    dependencies: string[]; // IDs de entidades que dependen de esta
    blockingOthers: boolean;
  };

  priorityDecay: {
    decayRate: number; // Qué tan rápido pierde prioridad
    lastRecalculated: Date;
  };
}
