import { PrismaClient, Message } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import { RepositoryEvent } from './base/IRepository';

export interface MessageCreateData {
  userId: string;
  contactId: string;
  platform: 'WHATSAPP' | 'EMAIL' | 'SMS';
  direction: 'INCOMING' | 'OUTGOING';
  content: string;
  subject?: string; // Para emails
  mediaUrl?: string;
  mediaType?: string;
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  externalId?: string; // ID de la plataforma externa
  threadId?: string; // Para agrupar mensajes
}

export interface MessageUpdateData {
  content?: string;
  subject?: string;
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  read?: boolean;
  readAt?: Date;
  errorMessage?: string;
}

export interface MessageFilters {
  userId?: string;
  contactId?: string;
  platform?: 'WHATSAPP' | 'EMAIL' | 'SMS';
  direction?: 'INCOMING' | 'OUTGOING';
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  read?: boolean;
  threadId?: string;
  hasMedia?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * MessageRepository
 * Gestiona mensajes de diferentes plataformas (WhatsApp, Email, SMS):
 * - CRUD de mensajes
 * - Búsqueda por contacto, plataforma, estado
 * - Hilos de conversación (threading)
 * - Historial de comunicación
 * - Estadísticas de mensajería
 */
export class MessageRepository extends BaseRepository<Message> {
  /**
   * Crear un nuevo mensaje
   */
  async create(data: MessageCreateData): Promise<Message> {
    const message = await this.prisma.message.create({
      data: {
        userId: data.userId,
        contactId: data.contactId,
        platform: data.platform,
        direction: data.direction,
        content: data.content,
        subject: data.subject,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        status: data.status || 'SENT',
        read: false,
        externalId: data.externalId,
        threadId: data.threadId
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'CREATE',
      entityType: 'MESSAGE',
      entityId: message.id,
      userId: message.userId,
      data: message,
      timestamp: new Date()
    });

    return message;
  }

  /**
   * Buscar mensaje por ID
   */
  async findById(id: string): Promise<Message | null> {
    return await this.prisma.message.findUnique({
      where: { id },
      include: {
        contact: true,
        user: true
      }
    });
  }

  /**
   * Actualizar mensaje
   */
  async update(id: string, data: MessageUpdateData): Promise<Message> {
    const message = await this.prisma.message.update({
      where: { id },
      data
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'MESSAGE',
      entityId: message.id,
      userId: message.userId,
      data: message,
      timestamp: new Date()
    });

    return message;
  }

  /**
   * Eliminar mensaje
   */
  async delete(id: string): Promise<void> {
    const message = await this.findById(id);
    if (!message) {
      throw new Error('Message not found');
    }

    await this.prisma.message.delete({
      where: { id }
    });

    await this.notifyObservers({
      type: 'DELETE',
      entityType: 'MESSAGE',
      entityId: id,
      userId: message.userId,
      data: null,
      timestamp: new Date()
    });
  }

  /**
   * Buscar múltiples mensajes con filtros
   */
  async findMany(filters: MessageFilters): Promise<Message[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    if (filters.platform) {
      where.platform = filters.platform;
    }

    if (filters.direction) {
      where.direction = filters.direction;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.read !== undefined) {
      where.read = filters.read;
    }

    if (filters.threadId) {
      where.threadId = filters.threadId;
    }

    if (filters.hasMedia !== undefined) {
      where.mediaUrl = filters.hasMedia ? { not: null } : null;
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

    return await this.prisma.message.findMany({
      where,
      include: { contact: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Buscar mensajes de un usuario
   */
  async findByUser(userId: string, limit?: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: { userId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar conversación con un contacto
   * Retorna todos los mensajes ordenados por fecha
   */
  async findConversation(
    userId: string,
    contactId: string,
    limit?: number
  ): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        userId,
        contactId
      },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar mensajes por plataforma
   */
  async findByPlatform(
    platform: 'WHATSAPP' | 'EMAIL' | 'SMS',
    userId: string,
    limit?: number
  ): Promise<Message[]> {
    return await this.findMany({ userId, platform });
  }

  /**
   * Buscar mensajes no leídos
   */
  async findUnread(userId: string): Promise<Message[]> {
    return await this.findMany({ userId, read: false, direction: 'INCOMING' });
  }

  /**
   * Buscar mensajes de un thread (hilo de conversación)
   */
  async findByThread(threadId: string): Promise<Message[]> {
    return await this.findMany({ threadId });
  }

  /**
   * Buscar mensajes entrantes
   */
  async findIncoming(userId: string, limit?: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        userId,
        direction: 'INCOMING'
      },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar mensajes salientes
   */
  async findOutgoing(userId: string, limit?: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        userId,
        direction: 'OUTGOING'
      },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar mensajes fallidos
   */
  async findFailed(userId: string): Promise<Message[]> {
    return await this.findMany({ userId, status: 'FAILED' });
  }

  /**
   * Buscar mensajes con media (imágenes, videos, etc.)
   */
  async findWithMedia(userId: string, limit?: number): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        userId,
        mediaUrl: { not: null }
      },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar último mensaje con un contacto
   */
  async findLastWithContact(
    userId: string,
    contactId: string
  ): Promise<Message | null> {
    const messages = await this.findConversation(userId, contactId, 1);
    return messages.length > 0 ? messages[0] : null;
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(id: string): Promise<Message> {
    return await this.update(id, {
      read: true,
      readAt: new Date()
    });
  }

  /**
   * Marcar múltiples mensajes como leídos
   */
  async markManyAsRead(ids: string[]): Promise<number> {
    const result = await this.prisma.message.updateMany({
      where: { id: { in: ids } },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return result.count;
  }

  /**
   * Marcar conversación como leída
   */
  async markConversationAsRead(
    userId: string,
    contactId: string
  ): Promise<number> {
    const result = await this.prisma.message.updateMany({
      where: {
        userId,
        contactId,
        read: false
      },
      data: {
        read: true,
        readAt: new Date()
      }
    });

    return result.count;
  }

  /**
   * Actualizar estado del mensaje
   */
  async updateStatus(
    id: string,
    status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED',
    errorMessage?: string
  ): Promise<Message> {
    return await this.update(id, { status, errorMessage });
  }

  /**
   * Buscar mensajes por contenido (búsqueda de texto)
   */
  async searchByContent(query: string, userId: string): Promise<Message[]> {
    return await this.prisma.message.findMany({
      where: {
        userId,
        content: { contains: query }
      },
      include: { contact: true },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Buscar mensajes por rango de fechas
   */
  async findByDateRange(
    userId: string,
    dateFrom: Date,
    dateTo: Date
  ): Promise<Message[]> {
    return await this.findMany({ userId, dateFrom, dateTo });
  }

  /**
   * Obtener conversaciones recientes (últimos mensajes por contacto)
   */
  async getRecentConversations(
    userId: string,
    limit: number = 20
  ): Promise<Array<{ contact: any; lastMessage: Message; unreadCount: number }>> {
    // Obtener todos los mensajes del usuario
    const messages = await this.findByUser(userId);

    // Agrupar por contacto
    const conversationsMap = new Map<string, {
      contact: any;
      lastMessage: Message;
      unreadCount: number;
    }>();

    for (const message of messages) {
      const contactId = message.contactId;

      if (!conversationsMap.has(contactId)) {
        conversationsMap.set(contactId, {
          contact: (message as any).contact,
          lastMessage: message,
          unreadCount: !message.read && message.direction === 'INCOMING' ? 1 : 0
        });
      } else {
        const conv = conversationsMap.get(contactId)!;
        if (!message.read && message.direction === 'INCOMING') {
          conv.unreadCount++;
        }
      }
    }

    // Convertir a array y ordenar por último mensaje
    const conversations = Array.from(conversationsMap.values())
      .sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime())
      .slice(0, limit);

    return conversations;
  }

  /**
   * Obtener estadísticas de mensajes del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    incoming: number;
    outgoing: number;
    unread: number;
    byPlatform: { whatsapp: number; email: number; sms: number };
    failed: number;
    withMedia: number;
    conversations: number;
  }> {
    const messages = await this.findByUser(userId);

    const incoming = messages.filter(m => m.direction === 'INCOMING').length;
    const outgoing = messages.filter(m => m.direction === 'OUTGOING').length;
    const unread = messages.filter(m => !m.read && m.direction === 'INCOMING').length;
    const failed = messages.filter(m => m.status === 'FAILED').length;
    const withMedia = messages.filter(m => m.mediaUrl).length;

    const byPlatform = {
      whatsapp: messages.filter(m => m.platform === 'WHATSAPP').length,
      email: messages.filter(m => m.platform === 'EMAIL').length,
      sms: messages.filter(m => m.platform === 'SMS').length
    };

    // Contar conversaciones únicas
    const uniqueContacts = new Set(messages.map(m => m.contactId));

    return {
      total: messages.length,
      incoming,
      outgoing,
      unread,
      byPlatform,
      failed,
      withMedia,
      conversations: uniqueContacts.size
    };
  }

  /**
   * Contar mensajes no leídos por contacto
   */
  async countUnreadByContact(
    userId: string,
    contactId: string
  ): Promise<number> {
    return await this.count('message', {
      userId,
      contactId,
      read: false,
      direction: 'INCOMING'
    });
  }

  /**
   * Contar todos los mensajes
   */
  async countAll(userId?: string): Promise<number> {
    return await this.count('message', userId ? { userId } : {});
  }

  /**
   * Limpiar mensajes antiguos
   * Útil para mantenimiento de BD
   */
  async cleanupOld(userId: string, maxAgeDays: number = 90): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const result = await this.prisma.message.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }

  /**
   * Obtener mensajes agrupados por thread
   */
  async getThreads(userId: string): Promise<Map<string, Message[]>> {
    const messages = await this.prisma.message.findMany({
      where: {
        userId,
        threadId: { not: null }
      },
      include: { contact: true },
      orderBy: { createdAt: 'asc' }
    });

    const threads = new Map<string, Message[]>();

    messages.forEach(message => {
      if (message.threadId) {
        if (!threads.has(message.threadId)) {
          threads.set(message.threadId, []);
        }
        threads.get(message.threadId)!.push(message);
      }
    });

    return threads;
  }

  /**
   * Crear thread de conversación automáticamente
   * Agrupa mensajes relacionados bajo un threadId
   */
  async createThread(messageIds: string[]): Promise<string> {
    const threadId = `thread_${Date.now()}`;

    await this.prisma.message.updateMany({
      where: { id: { in: messageIds } },
      data: { threadId }
    });

    return threadId;
  }
}
