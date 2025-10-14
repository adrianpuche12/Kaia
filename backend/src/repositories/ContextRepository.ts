import { PrismaClient } from '@prisma/client';

/**
 * Contexto unificado de una entidad
 * Incluye las 5 dimensiones de contexto
 */
export interface IUnifiedContext {
  entityId: string;
  userId: string;
  timestamp: Date;
  temporal: any;
  spatial: any;
  priority: any;
  relational: any;
  intentional: any;
  contextScore: number;
  version: number;
  lastUpdated: Date;
}

/**
 * Filtros para buscar contextos
 */
export interface ContextFilters {
  entityType?: string;
  minContextScore?: number;
  timeWindow?: {
    start: Date;
    end: Date;
  };
  hasLocation?: boolean;
  clusterId?: string;
}

/**
 * Repositorio para manejar el contexto de IA de las entidades
 * Este repositorio NO extiende BaseRepository porque tiene lógica específica
 */
export class ContextRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Guardar o actualizar contexto
   * Usa upsert para evitar duplicados
   */
  async save(context: IUnifiedContext): Promise<void> {
    await this.prisma.context.upsert({
      where: { entityId: context.entityId },
      create: {
        entityId: context.entityId,
        userId: context.userId,
        entityType: 'TASK', // TODO: inferir del context
        temporal: JSON.stringify(context.temporal),
        spatial: JSON.stringify(context.spatial),
        priority: JSON.stringify(context.priority),
        relational: JSON.stringify(context.relational),
        intentional: JSON.stringify(context.intentional),
        contextScore: context.contextScore,
        version: context.version,
        lastUpdated: context.lastUpdated
      },
      update: {
        temporal: JSON.stringify(context.temporal),
        spatial: JSON.stringify(context.spatial),
        priority: JSON.stringify(context.priority),
        relational: JSON.stringify(context.relational),
        intentional: JSON.stringify(context.intentional),
        contextScore: context.contextScore,
        version: { increment: 1 },
        lastUpdated: new Date()
      }
    });
  }

  /**
   * Obtener contexto por entityId
   */
  async get(entityId: string): Promise<IUnifiedContext | null> {
    const ctx = await this.prisma.context.findUnique({
      where: { entityId }
    });

    if (!ctx) return null;

    return {
      entityId: ctx.entityId,
      userId: ctx.userId,
      timestamp: ctx.createdAt,
      temporal: JSON.parse(ctx.temporal),
      spatial: JSON.parse(ctx.spatial),
      priority: JSON.parse(ctx.priority),
      relational: JSON.parse(ctx.relational),
      intentional: JSON.parse(ctx.intentional),
      contextScore: ctx.contextScore,
      version: ctx.version,
      lastUpdated: ctx.lastUpdated
    };
  }

  /**
   * Obtener todos los contextos de un usuario
   * Con filtros opcionales
   */
  async getByUser(
    userId: string,
    filters?: ContextFilters
  ): Promise<IUnifiedContext[]> {
    const where: any = { userId };

    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }

    if (filters?.minContextScore) {
      where.contextScore = { gte: filters.minContextScore };
    }

    const contexts = await this.prisma.context.findMany({
      where,
      orderBy: { contextScore: 'desc' }
    });

    return contexts.map(ctx => ({
      entityId: ctx.entityId,
      userId: ctx.userId,
      timestamp: ctx.createdAt,
      temporal: JSON.parse(ctx.temporal),
      spatial: JSON.parse(ctx.spatial),
      priority: JSON.parse(ctx.priority),
      relational: JSON.parse(ctx.relational),
      intentional: JSON.parse(ctx.intentional),
      contextScore: ctx.contextScore,
      version: ctx.version,
      lastUpdated: ctx.lastUpdated
    }));
  }

  /**
   * Eliminar contexto
   */
  async delete(entityId: string): Promise<void> {
    await this.prisma.context.delete({
      where: { entityId }
    });
  }

  /**
   * Actualizar parcialmente un contexto
   */
  async update(
    entityId: string,
    updates: Partial<IUnifiedContext>
  ): Promise<IUnifiedContext> {
    const updateData: any = {};

    if (updates.temporal) {
      updateData.temporal = JSON.stringify(updates.temporal);
    }
    if (updates.spatial) {
      updateData.spatial = JSON.stringify(updates.spatial);
    }
    if (updates.priority) {
      updateData.priority = JSON.stringify(updates.priority);
    }
    if (updates.relational) {
      updateData.relational = JSON.stringify(updates.relational);
    }
    if (updates.intentional) {
      updateData.intentional = JSON.stringify(updates.intentional);
    }
    if (updates.contextScore !== undefined) {
      updateData.contextScore = updates.contextScore;
    }

    updateData.lastUpdated = new Date();
    updateData.version = { increment: 1 };

    await this.prisma.context.update({
      where: { entityId },
      data: updateData
    });

    return this.get(entityId) as Promise<IUnifiedContext>;
  }

  /**
   * Obtener contextos con alto score
   * Útil para determinar qué tareas son más importantes
   */
  async getHighPriority(userId: string, limit: number = 10): Promise<IUnifiedContext[]> {
    return this.getByUser(userId, {
      minContextScore: 70
    });
  }

  /**
   * Limpiar contextos antiguos
   * Útil para mantenimiento
   */
  async cleanOldContexts(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.context.deleteMany({
      where: {
        lastUpdated: {
          lt: cutoffDate
        }
      }
    });

    return result.count;
  }
}
