import { PrismaClient, VoiceSession } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import { RepositoryEvent } from './base/IRepository';

export interface VoiceSessionCreateData {
  userId: string;
  transcript: string;
  intent?: string;
  entities?: any; // JSON object
  response?: string;
  confidence?: number;
  successful?: boolean;
  duration?: number; // En segundos
  audioUrl?: string;
  previousSessionId?: string;
  contextData?: any; // JSON object
}

export interface VoiceSessionUpdateData {
  transcript?: string;
  intent?: string;
  entities?: any;
  response?: string;
  confidence?: number;
  successful?: boolean;
  duration?: number;
  audioUrl?: string;
  contextData?: any;
}

export interface VoiceSessionFilters {
  userId?: string;
  intent?: string;
  successful?: boolean;
  minConfidence?: number;
  maxConfidence?: number;
  dateFrom?: Date;
  dateTo?: Date;
  hasAudio?: boolean;
}

/**
 * VoiceSessionRepository
 * Gestiona sesiones de voz con funcionalidades avanzadas:
 * - Historial de transcripciones
 * - Análisis de intents y entidades
 * - Estadísticas de precisión
 * - Seguimiento de sesiones conversacionales
 */
export class VoiceSessionRepository extends BaseRepository<VoiceSession> {
  /**
   * Crear una nueva sesión de voz
   */
  async create(data: VoiceSessionCreateData): Promise<VoiceSession> {
    const session = await this.prisma.voiceSession.create({
      data: {
        userId: data.userId,
        transcript: data.transcript,
        intent: data.intent,
        entities: data.entities ? JSON.stringify(data.entities) : null,
        response: data.response,
        confidence: data.confidence,
        successful: data.successful ?? false,
        duration: data.duration,
        audioUrl: data.audioUrl,
        previousSessionId: data.previousSessionId,
        contextData: data.contextData ? JSON.stringify(data.contextData) : null
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'CREATE',
      entityType: 'VOICE_SESSION',
      entityId: session.id,
      userId: session.userId,
      data: session,
      timestamp: new Date()
    });

    return session;
  }

  /**
   * Buscar sesión por ID
   */
  async findById(id: string): Promise<VoiceSession | null> {
    return await this.prisma.voiceSession.findUnique({
      where: { id }
    });
  }

  /**
   * Actualizar sesión
   */
  async update(id: string, data: VoiceSessionUpdateData): Promise<VoiceSession> {
    const updateData: any = { ...data };

    // Convertir objetos a JSON strings
    if (data.entities) {
      updateData.entities = JSON.stringify(data.entities);
    }
    if (data.contextData) {
      updateData.contextData = JSON.stringify(data.contextData);
    }

    const session = await this.prisma.voiceSession.update({
      where: { id },
      data: updateData
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'VOICE_SESSION',
      entityId: session.id,
      userId: session.userId,
      data: session,
      timestamp: new Date()
    });

    return session;
  }

  /**
   * Eliminar sesión
   */
  async delete(id: string): Promise<void> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error('Voice session not found');
    }

    await this.prisma.voiceSession.delete({
      where: { id }
    });

    await this.notifyObservers({
      type: 'DELETE',
      entityType: 'VOICE_SESSION',
      entityId: id,
      userId: session.userId,
      data: null,
      timestamp: new Date()
    });
  }

  /**
   * Buscar múltiples sesiones con filtros
   */
  async findMany(filters: VoiceSessionFilters): Promise<VoiceSession[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.intent) {
      where.intent = filters.intent;
    }

    if (filters.successful !== undefined) {
      where.successful = filters.successful;
    }

    if (filters.minConfidence !== undefined || filters.maxConfidence !== undefined) {
      where.confidence = {};
      if (filters.minConfidence !== undefined) {
        where.confidence.gte = filters.minConfidence;
      }
      if (filters.maxConfidence !== undefined) {
        where.confidence.lte = filters.maxConfidence;
      }
    }

    if (filters.hasAudio !== undefined) {
      where.audioUrl = filters.hasAudio ? { not: null } : null;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    return await this.prisma.voiceSession.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Buscar sesiones de un usuario
   */
  async findByUser(userId: string, limit?: number): Promise<VoiceSession[]> {
    return await this.prisma.voiceSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar sesiones por intent
   */
  async findByIntent(intent: string, userId?: string): Promise<VoiceSession[]> {
    const where: any = { intent };
    if (userId) {
      where.userId = userId;
    }

    return await this.prisma.voiceSession.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Buscar sesiones exitosas
   */
  async findSuccessful(userId: string, limit?: number): Promise<VoiceSession[]> {
    return await this.findMany({ userId, successful: true });
  }

  /**
   * Buscar sesiones fallidas
   */
  async findFailed(userId: string, limit?: number): Promise<VoiceSession[]> {
    return await this.findMany({ userId, successful: false });
  }

  /**
   * Buscar sesiones con audio
   */
  async findWithAudio(userId: string, limit?: number): Promise<VoiceSession[]> {
    return await this.prisma.voiceSession.findMany({
      where: {
        userId,
        audioUrl: { not: null }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar sesiones por rango de fechas
   */
  async findByDateRange(
    userId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<VoiceSession[]> {
    return await this.findMany({ userId, dateFrom, dateTo });
  }

  /**
   * Buscar última sesión del usuario
   */
  async findLastSession(userId: string): Promise<VoiceSession | null> {
    const sessions = await this.findByUser(userId, 1);
    return sessions.length > 0 ? sessions[0] : null;
  }

  /**
   * Buscar cadena de sesiones conversacionales
   * Sigue el hilo de previousSessionId
   */
  async findConversationChain(sessionId: string): Promise<VoiceSession[]> {
    const sessions: VoiceSession[] = [];
    let currentSession = await this.findById(sessionId);

    while (currentSession) {
      sessions.unshift(currentSession);

      if (currentSession.previousSessionId) {
        currentSession = await this.findById(currentSession.previousSessionId);
      } else {
        currentSession = null;
      }
    }

    return sessions;
  }

  /**
   * Buscar sesiones con baja confianza (requieren revisión)
   */
  async findLowConfidence(
    userId: string,
    threshold: number = 0.5
  ): Promise<VoiceSession[]> {
    return await this.findMany({ userId, maxConfidence: threshold });
  }

  /**
   * Buscar por transcripción (búsqueda de texto)
   */
  async searchByTranscript(query: string, userId: string): Promise<VoiceSession[]> {
    return await this.prisma.voiceSession.findMany({
      where: {
        userId,
        transcript: { contains: query }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Parsear entities de JSON string a objeto
   */
  parseEntities(session: VoiceSession): any {
    if (!session.entities) return null;
    try {
      return JSON.parse(session.entities);
    } catch {
      return null;
    }
  }

  /**
   * Parsear contextData de JSON string a objeto
   */
  parseContextData(session: VoiceSession): any {
    if (!session.contextData) return null;
    try {
      return JSON.parse(session.contextData);
    } catch {
      return null;
    }
  }

  /**
   * Obtener estadísticas de sesiones del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    avgConfidence: number;
    avgDuration: number;
    totalDuration: number;
    byIntent: { [key: string]: number };
    withAudio: number;
    lowConfidence: number;
  }> {
    const sessions = await this.findByUser(userId);

    const successful = sessions.filter(s => s.successful).length;
    const failed = sessions.length - successful;
    const successRate = sessions.length > 0 ? (successful / sessions.length) * 100 : 0;

    // Calcular confianza promedio (solo sesiones con confidence)
    const sessionsWithConfidence = sessions.filter(s => s.confidence !== null);
    const avgConfidence = sessionsWithConfidence.length > 0
      ? sessionsWithConfidence.reduce((sum, s) => sum + (s.confidence || 0), 0) / sessionsWithConfidence.length
      : 0;

    // Calcular duración promedio
    const sessionsWithDuration = sessions.filter(s => s.duration !== null);
    const totalDuration = sessionsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0);
    const avgDuration = sessionsWithDuration.length > 0
      ? totalDuration / sessionsWithDuration.length
      : 0;

    // Contar por intent
    const byIntent: { [key: string]: number } = {};
    sessions.forEach(session => {
      if (session.intent) {
        byIntent[session.intent] = (byIntent[session.intent] || 0) + 1;
      }
    });

    const withAudio = sessions.filter(s => s.audioUrl).length;
    const lowConfidence = sessions.filter(s => s.confidence !== null && s.confidence < 0.5).length;

    return {
      total: sessions.length,
      successful,
      failed,
      successRate: Math.round(successRate * 10) / 10,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      avgDuration: Math.round(avgDuration * 10) / 10,
      totalDuration: Math.round(totalDuration),
      byIntent,
      withAudio,
      lowConfidence
    };
  }

  /**
   * Obtener intents más comunes del usuario
   */
  async getMostCommonIntents(userId: string, limit: number = 10): Promise<Array<{
    intent: string;
    count: number;
    successRate: number;
  }>> {
    const sessions = await this.findByUser(userId);

    // Agrupar por intent
    const intentMap = new Map<string, { total: number; successful: number }>();

    sessions.forEach(session => {
      if (session.intent) {
        const existing = intentMap.get(session.intent) || { total: 0, successful: 0 };
        existing.total++;
        if (session.successful) {
          existing.successful++;
        }
        intentMap.set(session.intent, existing);
      }
    });

    // Convertir a array y ordenar por count
    const intents = Array.from(intentMap.entries())
      .map(([intent, data]) => ({
        intent,
        count: data.total,
        successRate: (data.successful / data.total) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);

    return intents;
  }

  /**
   * Obtener precisión por intent
   */
  async getAccuracyByIntent(userId: string): Promise<Array<{
    intent: string;
    accuracy: number;
    total: number;
    avgConfidence: number;
  }>> {
    const sessions = await this.findByUser(userId);

    // Agrupar por intent
    const intentMap = new Map<string, {
      total: number;
      successful: number;
      confidenceSum: number;
      confidenceCount: number;
    }>();

    sessions.forEach(session => {
      if (session.intent) {
        const existing = intentMap.get(session.intent) || {
          total: 0,
          successful: 0,
          confidenceSum: 0,
          confidenceCount: 0
        };

        existing.total++;
        if (session.successful) {
          existing.successful++;
        }
        if (session.confidence !== null) {
          existing.confidenceSum += session.confidence;
          existing.confidenceCount++;
        }

        intentMap.set(session.intent, existing);
      }
    });

    // Convertir a array con métricas
    const intents = Array.from(intentMap.entries())
      .map(([intent, data]) => ({
        intent,
        accuracy: (data.successful / data.total) * 100,
        total: data.total,
        avgConfidence: data.confidenceCount > 0
          ? data.confidenceSum / data.confidenceCount
          : 0
      }))
      .sort((a, b) => b.total - a.total);

    return intents;
  }

  /**
   * Obtener tendencias de uso por día
   */
  async getUsageTrend(userId: string, days: number = 7): Promise<Array<{
    date: string;
    count: number;
    successRate: number;
  }>> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const sessions = await this.findMany({
      userId,
      dateFrom: cutoffDate
    });

    // Agrupar por día
    const dayMap = new Map<string, { total: number; successful: number }>();

    sessions.forEach(session => {
      const dateKey = session.createdAt.toISOString().split('T')[0];
      const existing = dayMap.get(dateKey) || { total: 0, successful: 0 };
      existing.total++;
      if (session.successful) {
        existing.successful++;
      }
      dayMap.set(dateKey, existing);
    });

    // Convertir a array
    const trend = Array.from(dayMap.entries())
      .map(([date, data]) => ({
        date,
        count: data.total,
        successRate: (data.successful / data.total) * 100
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return trend;
  }

  /**
   * Contar todas las sesiones
   */
  async countAll(userId?: string): Promise<number> {
    return await this.count('voiceSession', userId ? { userId } : {});
  }

  /**
   * Limpiar sesiones antiguas
   * Útil para mantenimiento de BD
   */
  async cleanupOld(userId: string, maxAgeDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const result = await this.prisma.voiceSession.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }

  /**
   * Obtener resumen de la última semana
   */
  async getWeeklySummary(userId: string): Promise<{
    totalSessions: number;
    successRate: number;
    avgConfidence: number;
    topIntents: Array<{ intent: string; count: number }>;
    totalDuration: number;
    trend: string; // 'up', 'down', 'stable'
  }> {
    const stats = await this.getStats(userId);
    const topIntents = await this.getMostCommonIntents(userId, 5);
    const trend = await this.getUsageTrend(userId, 7);

    // Calcular tendencia (comparar últimos 3 días vs 3 días anteriores)
    let trendDirection: string = 'stable';
    if (trend.length >= 6) {
      const recentAvg = (trend[trend.length - 1].count + trend[trend.length - 2].count + trend[trend.length - 3].count) / 3;
      const previousAvg = (trend[trend.length - 4].count + trend[trend.length - 5].count + trend[trend.length - 6].count) / 3;

      if (recentAvg > previousAvg * 1.1) {
        trendDirection = 'up';
      } else if (recentAvg < previousAvg * 0.9) {
        trendDirection = 'down';
      }
    }

    return {
      totalSessions: stats.total,
      successRate: stats.successRate,
      avgConfidence: stats.avgConfidence,
      topIntents: topIntents.map(i => ({ intent: i.intent, count: i.count })),
      totalDuration: stats.totalDuration,
      trend: trendDirection
    };
  }
}
