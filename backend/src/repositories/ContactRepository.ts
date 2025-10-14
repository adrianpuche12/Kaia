import { PrismaClient, Contact } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import { RepositoryEvent } from './base/IRepository';

export interface ContactCreateData {
  userId: string;
  deviceId?: string;
  name: string;
  nickname?: string;
  phoneNumbers?: string[]; // Array de números
  emails?: string[]; // Array de emails
  avatarUrl?: string;
  tags?: string[]; // Array de tags
  notes?: string;
  hasWhatsApp?: boolean;
  source?: string; // 'DEVICE', 'MANUAL', 'IMPORTED'
}

export interface ContactUpdateData {
  deviceId?: string;
  name?: string;
  nickname?: string;
  phoneNumbers?: string[];
  emails?: string[];
  avatarUrl?: string;
  tags?: string[];
  notes?: string;
  hasWhatsApp?: boolean;
  messageCount?: number;
  lastContactAt?: Date;
  syncedAt?: Date;
}

export interface ContactFilters {
  userId?: string;
  hasWhatsApp?: boolean;
  tag?: string;
  source?: string;
  hasPhone?: boolean;
  hasEmail?: boolean;
}

/**
 * ContactRepository
 * Gestiona contactos con funcionalidades avanzadas:
 * - Sincronización con contactos del dispositivo
 * - Búsqueda por nombre, teléfono, email
 * - Tags y categorización
 * - Historial de comunicación
 * - Detección de WhatsApp
 */
export class ContactRepository extends BaseRepository<Contact> {
  /**
   * Crear un nuevo contacto
   */
  async create(data: ContactCreateData): Promise<Contact> {
    const contact = await this.prisma.contact.create({
      data: {
        userId: data.userId,
        deviceId: data.deviceId,
        name: data.name,
        nickname: data.nickname,
        phoneNumbers: JSON.stringify(data.phoneNumbers || []),
        emails: JSON.stringify(data.emails || []),
        avatarUrl: data.avatarUrl,
        tags: JSON.stringify(data.tags || []),
        notes: data.notes,
        hasWhatsApp: data.hasWhatsApp ?? false,
        messageCount: 0,
        source: data.source,
        syncedAt: new Date()
      }
    });

    // Notificar a observers
    await this.notifyObservers({
      type: 'CREATE',
      entityType: 'CONTACT',
      entityId: contact.id,
      userId: contact.userId,
      data: contact,
      timestamp: new Date()
    });

    return contact;
  }

  /**
   * Buscar contacto por ID
   */
  async findById(id: string): Promise<Contact | null> {
    return await this.prisma.contact.findUnique({
      where: { id },
      include: { messages: true }
    });
  }

  /**
   * Actualizar contacto
   */
  async update(id: string, data: ContactUpdateData): Promise<Contact> {
    const updateData: any = { ...data };

    // Convertir arrays a JSON strings
    if (data.phoneNumbers) {
      updateData.phoneNumbers = JSON.stringify(data.phoneNumbers);
    }
    if (data.emails) {
      updateData.emails = JSON.stringify(data.emails);
    }
    if (data.tags) {
      updateData.tags = JSON.stringify(data.tags);
    }

    const contact = await this.prisma.contact.update({
      where: { id },
      data: updateData
    });

    await this.notifyObservers({
      type: 'UPDATE',
      entityType: 'CONTACT',
      entityId: contact.id,
      userId: contact.userId,
      data: contact,
      timestamp: new Date()
    });

    return contact;
  }

  /**
   * Eliminar contacto
   */
  async delete(id: string): Promise<void> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error('Contact not found');
    }

    await this.prisma.contact.delete({
      where: { id }
    });

    await this.notifyObservers({
      type: 'DELETE',
      entityType: 'CONTACT',
      entityId: id,
      userId: contact.userId,
      data: null,
      timestamp: new Date()
    });
  }

  /**
   * Buscar múltiples contactos con filtros
   */
  async findMany(filters: ContactFilters): Promise<Contact[]> {
    const where: any = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.hasWhatsApp !== undefined) {
      where.hasWhatsApp = filters.hasWhatsApp;
    }

    if (filters.source) {
      where.source = filters.source;
    }

    let contacts = await this.prisma.contact.findMany({
      where,
      orderBy: { lastContactAt: 'desc' }
    });

    // Filtros adicionales que requieren parsing de JSON
    if (filters.tag) {
      contacts = contacts.filter(contact => {
        const tags = this.parseTags(contact);
        return tags.includes(filters.tag!);
      });
    }

    if (filters.hasPhone !== undefined) {
      contacts = contacts.filter(contact => {
        const phones = this.parsePhoneNumbers(contact);
        return filters.hasPhone ? phones.length > 0 : phones.length === 0;
      });
    }

    if (filters.hasEmail !== undefined) {
      contacts = contacts.filter(contact => {
        const emails = this.parseEmails(contact);
        return filters.hasEmail ? emails.length > 0 : emails.length === 0;
      });
    }

    return contacts;
  }

  /**
   * Buscar contactos de un usuario
   */
  async findByUser(userId: string): Promise<Contact[]> {
    return await this.prisma.contact.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Buscar contacto por deviceId (ID del dispositivo)
   */
  async findByDeviceId(deviceId: string, userId: string): Promise<Contact | null> {
    return await this.prisma.contact.findFirst({
      where: {
        deviceId,
        userId
      }
    });
  }

  /**
   * Buscar o crear contacto por deviceId
   * Útil para sincronización con dispositivo
   */
  async findOrCreateByDeviceId(
    deviceId: string,
    userId: string,
    data: ContactCreateData
  ): Promise<Contact> {
    const existing = await this.findByDeviceId(deviceId, userId);
    if (existing) {
      return await this.update(existing.id, {
        ...data,
        syncedAt: new Date()
      });
    }

    return await this.create({
      ...data,
      deviceId,
      userId
    });
  }

  /**
   * Buscar contacto por número de teléfono
   */
  async findByPhone(phone: string, userId: string): Promise<Contact | null> {
    const contacts = await this.findByUser(userId);

    for (const contact of contacts) {
      const phones = this.parsePhoneNumbers(contact);
      if (phones.includes(phone)) {
        return contact;
      }
    }

    return null;
  }

  /**
   * Buscar contacto por email
   */
  async findByEmail(email: string, userId: string): Promise<Contact | null> {
    const contacts = await this.findByUser(userId);

    for (const contact of contacts) {
      const emails = this.parseEmails(contact);
      if (emails.includes(email)) {
        return contact;
      }
    }

    return null;
  }

  /**
   * Buscar contactos por nombre (búsqueda parcial)
   */
  async searchByName(query: string, userId: string): Promise<Contact[]> {
    return await this.prisma.contact.findMany({
      where: {
        userId,
        OR: [
          { name: { contains: query } },
          { nickname: { contains: query } }
        ]
      },
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Buscar contactos frecuentes (más mensajes)
   */
  async findFrequent(userId: string, limit: number = 10): Promise<Contact[]> {
    return await this.prisma.contact.findMany({
      where: { userId },
      orderBy: { messageCount: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar contactos recientes (última comunicación)
   */
  async findRecent(userId: string, limit: number = 10): Promise<Contact[]> {
    return await this.prisma.contact.findMany({
      where: {
        userId,
        lastContactAt: { not: null }
      },
      orderBy: { lastContactAt: 'desc' },
      take: limit
    });
  }

  /**
   * Buscar contactos con WhatsApp
   */
  async findWithWhatsApp(userId: string): Promise<Contact[]> {
    return await this.findMany({ userId, hasWhatsApp: true });
  }

  /**
   * Buscar contactos por tag
   */
  async findByTag(tag: string, userId: string): Promise<Contact[]> {
    return await this.findMany({ userId, tag });
  }

  /**
   * Incrementar contador de mensajes
   */
  async incrementMessageCount(id: string): Promise<Contact> {
    const contact = await this.prisma.contact.update({
      where: { id },
      data: {
        messageCount: { increment: 1 },
        lastContactAt: new Date()
      }
    });

    return contact;
  }

  /**
   * Agregar tag a contacto
   */
  async addTag(id: string, tag: string): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error('Contact not found');
    }

    const tags = this.parseTags(contact);
    if (!tags.includes(tag)) {
      tags.push(tag);
      return await this.update(id, { tags });
    }

    return contact;
  }

  /**
   * Remover tag de contacto
   */
  async removeTag(id: string, tag: string): Promise<Contact> {
    const contact = await this.findById(id);
    if (!contact) {
      throw new Error('Contact not found');
    }

    const tags = this.parseTags(contact);
    const newTags = tags.filter(t => t !== tag);
    return await this.update(id, { tags: newTags });
  }

  /**
   * Parsear phoneNumbers de JSON string a array
   */
  parsePhoneNumbers(contact: Contact): string[] {
    try {
      return JSON.parse(contact.phoneNumbers);
    } catch {
      return [];
    }
  }

  /**
   * Parsear emails de JSON string a array
   */
  parseEmails(contact: Contact): string[] {
    try {
      return JSON.parse(contact.emails);
    } catch {
      return [];
    }
  }

  /**
   * Parsear tags de JSON string a array
   */
  parseTags(contact: Contact): string[] {
    try {
      return JSON.parse(contact.tags);
    } catch {
      return [];
    }
  }

  /**
   * Obtener estadísticas de contactos del usuario
   */
  async getStats(userId: string): Promise<{
    total: number;
    withWhatsApp: number;
    withPhone: number;
    withEmail: number;
    withMessages: number;
    mostFrequent: Contact | null;
    avgMessageCount: number;
    allTags: string[];
  }> {
    const contacts = await this.findByUser(userId);

    const withWhatsApp = contacts.filter(c => c.hasWhatsApp).length;
    const withPhone = contacts.filter(c => this.parsePhoneNumbers(c).length > 0).length;
    const withEmail = contacts.filter(c => this.parseEmails(c).length > 0).length;
    const withMessages = contacts.filter(c => c.messageCount > 0).length;

    const mostFrequent = contacts.length > 0
      ? contacts.reduce((prev, curr) => (prev.messageCount > curr.messageCount ? prev : curr))
      : null;

    const avgMessageCount = contacts.length > 0
      ? contacts.reduce((sum, c) => sum + c.messageCount, 0) / contacts.length
      : 0;

    // Recolectar todos los tags únicos
    const allTagsSet = new Set<string>();
    contacts.forEach(contact => {
      const tags = this.parseTags(contact);
      tags.forEach(tag => allTagsSet.add(tag));
    });

    return {
      total: contacts.length,
      withWhatsApp,
      withPhone,
      withEmail,
      withMessages,
      mostFrequent,
      avgMessageCount: Math.round(avgMessageCount * 10) / 10,
      allTags: Array.from(allTagsSet)
    };
  }

  /**
   * Sincronizar contactos desde dispositivo
   * Recibe array de contactos del dispositivo y los sincroniza
   */
  async syncFromDevice(
    userId: string,
    deviceContacts: ContactCreateData[]
  ): Promise<{
    created: number;
    updated: number;
    total: number;
  }> {
    let created = 0;
    let updated = 0;

    for (const contactData of deviceContacts) {
      if (!contactData.deviceId) continue;

      const existing = await this.findByDeviceId(contactData.deviceId, userId);

      if (existing) {
        await this.update(existing.id, {
          ...contactData,
          syncedAt: new Date()
        });
        updated++;
      } else {
        await this.create({
          ...contactData,
          userId,
          source: 'DEVICE'
        });
        created++;
      }
    }

    return {
      created,
      updated,
      total: created + updated
    };
  }

  /**
   * Contar todos los contactos
   */
  async countAll(userId?: string): Promise<number> {
    return await this.count('contact', userId ? { userId } : {});
  }

  /**
   * Limpiar contactos sin actividad
   * Útil para mantenimiento de BD
   */
  async cleanupInactive(userId: string, maxAgeDays: number = 180): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    const result = await this.prisma.contact.deleteMany({
      where: {
        userId,
        messageCount: 0,
        lastContactAt: null,
        createdAt: { lt: cutoffDate }
      }
    });

    return result.count;
  }
}
