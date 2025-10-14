import { TemporalContextAnalyzer } from './analyzers/TemporalContextAnalyzer';
import { SpatialContextAnalyzer } from './analyzers/SpatialContextAnalyzer';
import { PriorityContextAnalyzer } from './analyzers/PriorityContextAnalyzer';
import { RelationalContextAnalyzer } from './analyzers/RelationalContextAnalyzer';
import { IntentionalContextAnalyzer } from './analyzers/IntentionalContextAnalyzer';
import { IUnifiedContext } from '../interfaces/context/IUnifiedContext';
import { ContextRepository } from '../../../repositories/ContextRepository';
import { TimeOfDay } from '../enums/TimeOfDay';

/**
 * ContextBuilder
 * Construye y enriquece contextos unificados para entidades
 * Integra los 5 analyzers de contexto y calcula scores contextuales
 */
export class ContextBuilder {
  constructor(
    private temporalAnalyzer: TemporalContextAnalyzer,
    private spatialAnalyzer: SpatialContextAnalyzer,
    private priorityAnalyzer: PriorityContextAnalyzer,
    private relationalAnalyzer: RelationalContextAnalyzer,
    private intentionalAnalyzer: IntentionalContextAnalyzer,
    private contextRepo: ContextRepository
  ) {}

  /**
   * Construir contexto unificado para una entidad
   * @param entity Entidad a analizar (Task, Event, etc)
   * @returns Contexto unificado enriquecido
   */
  async buildContext(entity: any): Promise<IUnifiedContext> {
    // 1. Extraer contextos base
    const temporal = entity.extractTemporalContext
      ? entity.extractTemporalContext()
      : this.getDefaultTemporalContext();

    const spatial = entity.extractSpatialContext
      ? entity.extractSpatialContext()
      : this.getDefaultSpatialContext();

    const priority = entity.extractPriorityContext
      ? entity.extractPriorityContext()
      : this.getDefaultPriorityContext();

    const relational = entity.extractRelationalContext
      ? entity.extractRelationalContext()
      : this.getDefaultRelationalContext();

    const intentional = entity.extractIntentionalContext
      ? entity.extractIntentionalContext()
      : this.getDefaultIntentionalContext();

    // 2. Enriquecer con analyzers
    const enrichedTemporal = await this.temporalAnalyzer.analyze(
      temporal,
      entity
    );
    const enrichedSpatial = await this.spatialAnalyzer.analyze(spatial, entity);
    const enrichedPriority = await this.priorityAnalyzer.analyze(
      priority,
      entity
    );
    const enrichedRelational = await this.relationalAnalyzer.analyze(
      relational,
      entity
    );
    const enrichedIntentional = await this.intentionalAnalyzer.analyze(
      intentional,
      entity
    );

    // 3. Calcular score contextual
    const contextScore = this.calculateContextScore({
      temporal: enrichedTemporal,
      spatial: enrichedSpatial,
      priority: enrichedPriority,
      relational: enrichedRelational,
      intentional: enrichedIntentional,
    });

    // 4. Crear contexto unificado
    const context: IUnifiedContext = {
      entityId: entity.id,
      userId: entity.userId,
      timestamp: new Date(),
      temporal: enrichedTemporal,
      spatial: enrichedSpatial,
      priority: enrichedPriority,
      relational: enrichedRelational,
      intentional: enrichedIntentional,
      contextScore,
      version: 1,
      lastUpdated: new Date(),
    };

    // 5. Guardar
    await this.contextRepo.save(context);

    return context;
  }

  /**
   * Obtener contexto de una entidad
   * @param entityId ID de la entidad
   * @returns Contexto unificado o null
   */
  async get(entityId: string): Promise<IUnifiedContext | null> {
    return await this.contextRepo.get(entityId);
  }

  /**
   * Invalidar y eliminar contexto de una entidad
   * @param entityId ID de la entidad
   */
  async invalidateContext(entityId: string): Promise<void> {
    await this.contextRepo.delete(entityId);
  }

  /**
   * Calcular score contextual combinado
   * @param context Contexto completo
   * @returns Score de 0-100
   */
  private calculateContextScore(context: any): number {
    // Score base
    let score = 50;

    // Bonus por deadline cercano
    if (context.temporal.relativeTime?.hoursUntil !== undefined) {
      if (context.temporal.relativeTime.hoursUntil < 24) score += 20;
      else if (context.temporal.relativeTime.hoursUntil < 48) score += 10;
    }

    // Bonus por alta prioridad
    if (context.priority.computedPriority > 70) score += 15;
    else if (context.priority.computedPriority > 50) score += 5;

    // Bonus por relaciones importantes
    if (context.relational.dependencies?.blocks?.length > 0) score += 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Contexto temporal por defecto
   */
  private getDefaultTemporalContext() {
    return {
      timestamp: new Date(),
      timeOfDay: TimeOfDay.MORNING,
      dayOfWeek: new Date().getDay(),
      isWorkday: true,
      isHoliday: false,
      relativeTime: {
        isPast: false,
        isCurrent: true,
        isFuture: false,
      },
    };
  }

  /**
   * Contexto espacial por defecto
   */
  private getDefaultSpatialContext() {
    return {
      proximity: {
        nearbyEntities: [],
      },
    };
  }

  /**
   * Contexto de prioridad por defecto
   */
  private getDefaultPriorityContext() {
    return {
      basePriority: 50,
      computedPriority: 50,
      factors: {
        urgency: 0,
        importance: 0,
        dependencies: [],
        blockingOthers: false,
      },
      priorityDecay: {
        decayRate: 0,
        lastRecalculated: new Date(),
      },
    };
  }

  /**
   * Contexto relacional por defecto
   */
  private getDefaultRelationalContext() {
    return {
      relationships: {
        childrenIds: [],
        relatedEntityIds: [],
        conflictingEntityIds: [],
      },
      clusters: [],
      dependencies: {
        blockedBy: [],
        blocks: [],
        prerequisiteFor: [],
      },
    };
  }

  /**
   * Contexto intencional por defecto
   */
  private getDefaultIntentionalContext() {
    return {
      userIntent: {
        primaryGoal: '',
        secondaryGoals: [],
        actionType: 'create' as any,
      },
      behaviorPatterns: {
        preferredTimeSlots: [],
        completionRate: 0,
        postponementFrequency: 0,
      },
    };
  }
}
