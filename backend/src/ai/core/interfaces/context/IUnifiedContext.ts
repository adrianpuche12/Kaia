import { ITemporalContext } from './ITemporalContext';
import { ISpatialContext } from './ISpatialContext';
import { IPriorityContext } from './IPriorityContext';
import { IRelationalContext } from './IRelationalContext';
import { IIntentionalContext } from './IIntentionalContext';

/**
 * Contexto Unificado
 * Combina las 5 dimensiones de contexto en una sola estructura
 *
 * Este es el modelo central del sistema de IA contextual de Kaia.
 * Cada entidad (Event, Task, etc.) tiene un contexto unificado asociado.
 */
export interface IUnifiedContext {
  // Identificación
  entityId: string;
  userId: string;
  timestamp: Date;

  // Las 5 dimensiones de contexto
  temporal: ITemporalContext;
  spatial: ISpatialContext;
  priority: IPriorityContext;
  relational: IRelationalContext;
  intentional: IIntentionalContext;

  // Metadata del contexto
  contextScore: number; // 0-100 (score calculado por IA)
  version: number; // Para tracking de cambios
  lastUpdated: Date;
}
