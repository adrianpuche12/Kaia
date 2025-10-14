import { ContactRepository, ContactCreateData } from '../repositories/ContactRepository';

// ============================================================================
// DTOs
// ============================================================================

export interface CreateContactDTO {
  name: string;
  nickname?: string;
  phoneNumbers?: string[];
  emails?: string[];
  avatarUrl?: string;
  tags?: string[];
  notes?: string;
  hasWhatsApp?: boolean;
  source?: 'DEVICE' | 'MANUAL' | 'IMPORTED';
}

export interface UpdateContactDTO {
  name?: string;
  nickname?: string;
  phoneNumbers?: string[];
  emails?: string[];
  avatarUrl?: string;
  tags?: string[];
  notes?: string;
  hasWhatsApp?: boolean;
}

export interface DeviceContact {
  deviceId: string;
  name: string;
  nickname?: string;
  phoneNumbers?: string[];
  emails?: string[];
  avatarUrl?: string;
}

export interface SearchContactDTO {
  query: string;
  filters?: {
    hasWhatsApp?: boolean;
    tag?: string;
    hasPhone?: boolean;
    hasEmail?: boolean;
  };
}

export interface SyncResult {
  created: number;
  updated: number;
  total: number;
  errors: Array<{ deviceId: string; error: string }>;
}

export interface ContactStats {
  total: number;
  withWhatsApp: number;
  withPhone: number;
  withEmail: number;
  withMessages: number;
  mostFrequent: {
    id: string;
    name: string;
    messageCount: number;
  } | null;
  avgMessageCount: number;
  allTags: string[];
  recentlyAdded: number; // Últimos 7 días
}

// ============================================================================
// ContactService
// ============================================================================

export class ContactService {
  constructor(private contactRepo: ContactRepository) {}

  // ==========================================================================
  // CRUD BÁSICO
  // ==========================================================================

  /**
   * Crear un nuevo contacto
   */
  async createContact(userId: string, data: CreateContactDTO) {
    // Validar datos
    this.validateContactData(data);

    // Validar teléfonos y emails
    if (data.phoneNumbers) {
      data.phoneNumbers.forEach(phone => this.validatePhone(phone));
    }
    if (data.emails) {
      data.emails.forEach(email => this.validateEmail(email));
    }

    // Crear contacto
    const contact = await this.contactRepo.create({
      userId,
      ...data,
      source: data.source || 'MANUAL'
    });

    return this.formatContact(contact);
  }

  /**
   * Actualizar contacto existente
   */
  async updateContact(contactId: string, data: UpdateContactDTO) {
    // Verificar que el contacto existe
    const existing = await this.contactRepo.findById(contactId);
    if (!existing) {
      throw new Error('Contact not found');
    }

    // Validar teléfonos y emails si se actualizan
    if (data.phoneNumbers) {
      data.phoneNumbers.forEach(phone => this.validatePhone(phone));
    }
    if (data.emails) {
      data.emails.forEach(email => this.validateEmail(email));
    }

    // Actualizar
    const contact = await this.contactRepo.update(contactId, data);

    return this.formatContact(contact);
  }

  /**
   * Eliminar contacto
   */
  async deleteContact(contactId: string): Promise<void> {
    await this.contactRepo.delete(contactId);
  }

  /**
   * Obtener contacto por ID
   */
  async getContactById(contactId: string) {
    const contact = await this.contactRepo.findById(contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    return this.formatContact(contact);
  }

  // ==========================================================================
  // BÚSQUEDA Y FILTRADO
  // ==========================================================================

  /**
   * Obtener todos los contactos del usuario
   */
  async getUserContacts(userId: string) {
    const contacts = await this.contactRepo.findByUser(userId);
    return contacts.map(c => this.formatContact(c));
  }

  /**
   * Buscar contactos por nombre o nickname
   */
  async searchByName(userId: string, query: string) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const contacts = await this.contactRepo.searchByName(query.trim(), userId);
    return contacts.map(c => this.formatContact(c));
  }

  /**
   * Buscar contacto por número de teléfono
   */
  async findByPhone(userId: string, phone: string) {
    this.validatePhone(phone);

    const contact = await this.contactRepo.findByPhone(phone, userId);
    return contact ? this.formatContact(contact) : null;
  }

  /**
   * Buscar contacto por email
   */
  async findByEmail(userId: string, email: string) {
    this.validateEmail(email);

    const contact = await this.contactRepo.findByEmail(email, userId);
    return contact ? this.formatContact(contact) : null;
  }

  /**
   * Búsqueda avanzada con múltiples filtros
   */
  async searchContacts(userId: string, params: SearchContactDTO) {
    const { query, filters } = params;

    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    // Primero buscar por nombre
    let contacts = await this.contactRepo.searchByName(query.trim(), userId);

    // Aplicar filtros adicionales
    if (filters) {
      if (filters.hasWhatsApp !== undefined) {
        contacts = contacts.filter(c => c.hasWhatsApp === filters.hasWhatsApp);
      }

      if (filters.tag) {
        contacts = contacts.filter(c => {
          const tags = this.contactRepo.parseTags(c);
          return tags.includes(filters.tag!);
        });
      }

      if (filters.hasPhone !== undefined) {
        contacts = contacts.filter(c => {
          const phones = this.contactRepo.parsePhoneNumbers(c);
          return filters.hasPhone ? phones.length > 0 : phones.length === 0;
        });
      }

      if (filters.hasEmail !== undefined) {
        contacts = contacts.filter(c => {
          const emails = this.contactRepo.parseEmails(c);
          return filters.hasEmail ? emails.length > 0 : emails.length === 0;
        });
      }
    }

    return contacts.map(c => this.formatContact(c));
  }

  // ==========================================================================
  // CONTACTOS FRECUENTES Y RECIENTES
  // ==========================================================================

  /**
   * Obtener contactos más frecuentes (más mensajes)
   */
  async getFrequentContacts(userId: string, limit: number = 10) {
    const contacts = await this.contactRepo.findFrequent(userId, limit);
    return contacts.map(c => this.formatContact(c));
  }

  /**
   * Obtener contactos recientes (última comunicación)
   */
  async getRecentContacts(userId: string, limit: number = 10) {
    const contacts = await this.contactRepo.findRecent(userId, limit);
    return contacts.map(c => this.formatContact(c));
  }

  /**
   * Obtener contactos con WhatsApp
   */
  async getWhatsAppContacts(userId: string) {
    const contacts = await this.contactRepo.findWithWhatsApp(userId);
    return contacts.map(c => this.formatContact(c));
  }

  /**
   * Obtener contactos por tag
   */
  async getContactsByTag(userId: string, tag: string) {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag cannot be empty');
    }

    const contacts = await this.contactRepo.findByTag(tag.trim(), userId);
    return contacts.map(c => this.formatContact(c));
  }

  // ==========================================================================
  // GESTIÓN DE TAGS
  // ==========================================================================

  /**
   * Agregar tag a contacto
   */
  async addTag(contactId: string, tag: string) {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag cannot be empty');
    }

    const contact = await this.contactRepo.addTag(contactId, tag.trim().toLowerCase());
    return this.formatContact(contact);
  }

  /**
   * Remover tag de contacto
   */
  async removeTag(contactId: string, tag: string) {
    if (!tag || tag.trim().length === 0) {
      throw new Error('Tag cannot be empty');
    }

    const contact = await this.contactRepo.removeTag(contactId, tag.trim().toLowerCase());
    return this.formatContact(contact);
  }

  /**
   * Obtener todos los tags del usuario
   */
  async getAllTags(userId: string): Promise<string[]> {
    const stats = await this.contactRepo.getStats(userId);
    return stats.allTags;
  }

  // ==========================================================================
  // SINCRONIZACIÓN CON DISPOSITIVO
  // ==========================================================================

  /**
   * Sincronizar contactos desde dispositivo
   */
  async syncFromDevice(userId: string, deviceContacts: DeviceContact[]): Promise<SyncResult> {
    const errors: Array<{ deviceId: string; error: string }> = [];
    let created = 0;
    let updated = 0;

    for (const deviceContact of deviceContacts) {
      try {
        // Validar que tenga deviceId
        if (!deviceContact.deviceId) {
          errors.push({
            deviceId: 'unknown',
            error: 'Missing deviceId'
          });
          continue;
        }

        // Validar datos básicos
        if (!deviceContact.name || deviceContact.name.trim().length === 0) {
          errors.push({
            deviceId: deviceContact.deviceId,
            error: 'Missing name'
          });
          continue;
        }

        // Validar teléfonos si existen
        if (deviceContact.phoneNumbers) {
          for (const phone of deviceContact.phoneNumbers) {
            try {
              this.validatePhone(phone);
            } catch (error) {
              errors.push({
                deviceId: deviceContact.deviceId,
                error: `Invalid phone: ${phone}`
              });
              continue;
            }
          }
        }

        // Validar emails si existen
        if (deviceContact.emails) {
          for (const email of deviceContact.emails) {
            try {
              this.validateEmail(email);
            } catch (error) {
              errors.push({
                deviceId: deviceContact.deviceId,
                error: `Invalid email: ${email}`
              });
              continue;
            }
          }
        }

        // Verificar si existe
        const existing = await this.contactRepo.findByDeviceId(
          deviceContact.deviceId,
          userId
        );

        if (existing) {
          // Actualizar
          await this.contactRepo.update(existing.id, {
            name: deviceContact.name,
            nickname: deviceContact.nickname,
            phoneNumbers: deviceContact.phoneNumbers,
            emails: deviceContact.emails,
            avatarUrl: deviceContact.avatarUrl,
            syncedAt: new Date()
          });
          updated++;
        } else {
          // Crear
          await this.contactRepo.create({
            userId,
            deviceId: deviceContact.deviceId,
            name: deviceContact.name,
            nickname: deviceContact.nickname,
            phoneNumbers: deviceContact.phoneNumbers,
            emails: deviceContact.emails,
            avatarUrl: deviceContact.avatarUrl,
            source: 'DEVICE'
          });
          created++;
        }
      } catch (error) {
        errors.push({
          deviceId: deviceContact.deviceId || 'unknown',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      created,
      updated,
      total: created + updated,
      errors
    };
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas de contactos
   */
  async getContactStats(userId: string): Promise<ContactStats> {
    const stats = await this.contactRepo.getStats(userId);

    // Calcular contactos recientes (últimos 7 días)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const allContacts = await this.contactRepo.findByUser(userId);
    const recentlyAdded = allContacts.filter(
      c => c.createdAt >= sevenDaysAgo
    ).length;

    return {
      total: stats.total,
      withWhatsApp: stats.withWhatsApp,
      withPhone: stats.withPhone,
      withEmail: stats.withEmail,
      withMessages: stats.withMessages,
      mostFrequent: stats.mostFrequent ? {
        id: stats.mostFrequent.id,
        name: stats.mostFrequent.name,
        messageCount: stats.mostFrequent.messageCount
      } : null,
      avgMessageCount: stats.avgMessageCount,
      allTags: stats.allTags,
      recentlyAdded
    };
  }

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Incrementar contador de mensajes de un contacto
   * (Llamado por MessageService cuando se envía/recibe mensaje)
   */
  async recordMessage(contactId: string) {
    await this.contactRepo.incrementMessageCount(contactId);
  }

  /**
   * Limpiar contactos inactivos
   */
  async cleanupInactiveContacts(userId: string, maxAgeDays: number = 180): Promise<number> {
    return await this.contactRepo.cleanupInactive(userId, maxAgeDays);
  }

  // ==========================================================================
  // VALIDACIONES PRIVADAS
  // ==========================================================================

  /**
   * Validar datos de contacto
   */
  private validateContactData(data: CreateContactDTO): void {
    // Nombre es requerido
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    // Nombre no puede ser muy largo
    if (data.name.length > 200) {
      throw new Error('Name is too long (max 200 characters)');
    }

    // Validar que tenga al menos un medio de contacto
    const hasPhone = data.phoneNumbers && data.phoneNumbers.length > 0;
    const hasEmail = data.emails && data.emails.length > 0;

    if (!hasPhone && !hasEmail) {
      throw new Error('Contact must have at least one phone number or email');
    }
  }

  /**
   * Validar formato de teléfono
   * Acepta formatos internacionales: +1234567890 o números simples
   */
  private validatePhone(phone: string): void {
    if (!phone || phone.trim().length === 0) {
      throw new Error('Phone number cannot be empty');
    }

    // Remover espacios y guiones
    const cleaned = phone.replace(/[\s\-()]/g, '');

    // Debe contener solo dígitos y opcionalmente un + al inicio
    const phoneRegex = /^\+?\d{7,15}$/;

    if (!phoneRegex.test(cleaned)) {
      throw new Error(`Invalid phone format: ${phone}`);
    }
  }

  /**
   * Validar formato de email
   */
  private validateEmail(email: string): void {
    if (!email || email.trim().length === 0) {
      throw new Error('Email cannot be empty');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      throw new Error(`Invalid email format: ${email}`);
    }
  }

  /**
   * Formatear contacto para respuesta
   * Convierte JSON strings a arrays
   */
  private formatContact(contact: any) {
    return {
      id: contact.id,
      userId: contact.userId,
      deviceId: contact.deviceId,
      name: contact.name,
      nickname: contact.nickname,
      phoneNumbers: this.contactRepo.parsePhoneNumbers(contact),
      emails: this.contactRepo.parseEmails(contact),
      avatarUrl: contact.avatarUrl,
      tags: this.contactRepo.parseTags(contact),
      notes: contact.notes,
      hasWhatsApp: contact.hasWhatsApp,
      messageCount: contact.messageCount,
      lastContactAt: contact.lastContactAt,
      source: contact.source,
      syncedAt: contact.syncedAt,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    };
  }
}
