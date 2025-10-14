import { MessageRepository, MessageCreateData } from '../repositories/MessageRepository';
import { ContactRepository } from '../repositories/ContactRepository';
import { getTwilioClient } from '../integrations/TwilioClient';
import { getSendGridClient } from '../integrations/SendGridClient';

// ============================================================================
// DTOs
// ============================================================================

export interface SendMessageDTO {
  contactId: string;
  platform: 'WHATSAPP' | 'EMAIL' | 'SMS';
  content: string;
  subject?: string; // Solo para emails
  mediaUrl?: string;
  mediaType?: string;
  threadId?: string;
}

export interface MessageFilterDTO {
  contactId?: string;
  platform?: 'WHATSAPP' | 'EMAIL' | 'SMS';
  direction?: 'INCOMING' | 'OUTGOING';
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  read?: boolean;
  hasMedia?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface Conversation {
  contactId: string;
  contactName: string;
  lastMessage: {
    id: string;
    content: string;
    platform: string;
    direction: string;
    createdAt: Date;
  };
  unreadCount: number;
  totalMessages: number;
}

export interface MessageStats {
  total: number;
  incoming: number;
  outgoing: number;
  unread: number;
  byPlatform: {
    whatsapp: number;
    email: number;
    sms: number;
  };
  failed: number;
  withMedia: number;
  conversations: number;
  avgMessagesPerDay: number;
}

export interface SendResult {
  success: boolean;
  messageId: string;
  externalId?: string;
  platform: string;
  status: 'SENT' | 'FAILED';
  errorMessage?: string;
}

// ============================================================================
// MessageService
// ============================================================================

export class MessageService {
  constructor(
    private messageRepo: MessageRepository,
    private contactRepo: ContactRepository
  ) {}

  // ==========================================================================
  // ENVÍO DE MENSAJES MULTI-PLATAFORMA
  // ==========================================================================

  /**
   * Enviar mensaje (WhatsApp, Email o SMS)
   */
  async sendMessage(userId: string, data: SendMessageDTO): Promise<SendResult> {
    // Validar datos
    this.validateSendData(data);

    // Verificar que el contacto existe
    const contact = await this.contactRepo.findById(data.contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // Obtener información del contacto según plataforma
    const contactInfo = this.getContactInfo(contact, data.platform);
    if (!contactInfo) {
      throw new Error(`Contact has no ${data.platform} information`);
    }

    let result: SendResult;

    try {
      // Enviar según plataforma
      switch (data.platform) {
        case 'WHATSAPP':
          result = await this.sendWhatsApp(contactInfo, data);
          break;
        case 'EMAIL':
          result = await this.sendEmail(contactInfo, data);
          break;
        case 'SMS':
          result = await this.sendSMS(contactInfo, data);
          break;
        default:
          throw new Error('Invalid platform');
      }

      // Guardar mensaje en BD
      const message = await this.messageRepo.create({
        userId,
        contactId: data.contactId,
        platform: data.platform,
        direction: 'OUTGOING',
        content: data.content,
        subject: data.subject,
        mediaUrl: data.mediaUrl,
        mediaType: data.mediaType,
        status: result.status,
        externalId: result.externalId,
        threadId: data.threadId
      });

      // Incrementar contador de mensajes del contacto
      await this.contactRepo.incrementMessageCount(data.contactId);

      return {
        ...result,
        messageId: message.id
      };
    } catch (error) {
      // Guardar mensaje fallido
      const message = await this.messageRepo.create({
        userId,
        contactId: data.contactId,
        platform: data.platform,
        direction: 'OUTGOING',
        content: data.content,
        subject: data.subject,
        status: 'FAILED'
      });

      return {
        success: false,
        messageId: message.id,
        platform: data.platform,
        status: 'FAILED',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Recibir mensaje entrante (webhook)
   */
  async receiveMessage(
    userId: string,
    data: {
      contactId: string;
      platform: 'WHATSAPP' | 'EMAIL' | 'SMS';
      content: string;
      subject?: string;
      mediaUrl?: string;
      mediaType?: string;
      externalId?: string;
      threadId?: string;
    }
  ) {
    // Validar contacto
    const contact = await this.contactRepo.findById(data.contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // Guardar mensaje
    const message = await this.messageRepo.create({
      userId,
      contactId: data.contactId,
      platform: data.platform,
      direction: 'INCOMING',
      content: data.content,
      subject: data.subject,
      mediaUrl: data.mediaUrl,
      mediaType: data.mediaType,
      status: 'DELIVERED',
      externalId: data.externalId,
      threadId: data.threadId
    });

    // Incrementar contador
    await this.contactRepo.incrementMessageCount(data.contactId);

    return this.formatMessage(message);
  }

  // ==========================================================================
  // GESTIÓN DE CONVERSACIONES
  // ==========================================================================

  /**
   * Obtener conversación con un contacto
   */
  async getConversation(
    userId: string,
    contactId: string,
    limit: number = 50
  ) {
    const messages = await this.messageRepo.findConversation(
      userId,
      contactId,
      limit
    );

    return messages.map(m => this.formatMessage(m)).reverse(); // Orden cronológico
  }

  /**
   * Obtener conversaciones recientes
   */
  async getRecentConversations(
    userId: string,
    limit: number = 20
  ): Promise<Conversation[]> {
    const conversations = await this.messageRepo.getRecentConversations(
      userId,
      limit
    );

    return conversations.map(conv => ({
      contactId: conv.contact.id,
      contactName: conv.contact.name,
      lastMessage: {
        id: conv.lastMessage.id,
        content: this.truncateContent(conv.lastMessage.content),
        platform: conv.lastMessage.platform,
        direction: conv.lastMessage.direction,
        createdAt: conv.lastMessage.createdAt
      },
      unreadCount: conv.unreadCount,
      totalMessages: 0 // TODO: Calcular si es necesario
    }));
  }

  /**
   * Obtener threads de conversación
   */
  async getThreads(userId: string) {
    const threads = await this.messageRepo.getThreads(userId);

    const result: any = {};
    threads.forEach((messages, threadId) => {
      result[threadId] = messages.map(m => this.formatMessage(m));
    });

    return result;
  }

  // ==========================================================================
  // MARCADO DE LECTURA
  // ==========================================================================

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(messageId: string) {
    const message = await this.messageRepo.markAsRead(messageId);
    return this.formatMessage(message);
  }

  /**
   * Marcar múltiples mensajes como leídos
   */
  async markManyAsRead(messageIds: string[]): Promise<number> {
    return await this.messageRepo.markManyAsRead(messageIds);
  }

  /**
   * Marcar toda la conversación como leída
   */
  async markConversationAsRead(userId: string, contactId: string): Promise<number> {
    return await this.messageRepo.markConversationAsRead(userId, contactId);
  }

  // ==========================================================================
  // BÚSQUEDA Y FILTRADO
  // ==========================================================================

  /**
   * Buscar mensajes por contenido
   */
  async searchMessages(userId: string, query: string) {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const messages = await this.messageRepo.searchByContent(query.trim(), userId);
    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Filtrar mensajes
   */
  async filterMessages(userId: string, filters: MessageFilterDTO) {
    const messages = await this.messageRepo.findMany({
      userId,
      ...filters
    });

    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Obtener mensajes no leídos
   */
  async getUnreadMessages(userId: string) {
    const messages = await this.messageRepo.findUnread(userId);
    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Contar mensajes no leídos
   */
  async getUnreadCount(userId: string): Promise<number> {
    const messages = await this.messageRepo.findUnread(userId);
    return messages.length;
  }

  /**
   * Contar mensajes no leídos por contacto
   */
  async getUnreadCountByContact(userId: string, contactId: string): Promise<number> {
    return await this.messageRepo.countUnreadByContact(userId, contactId);
  }

  // ==========================================================================
  // GESTIÓN DE MENSAJES
  // ==========================================================================

  /**
   * Obtener mensaje por ID
   */
  async getMessageById(messageId: string) {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    return this.formatMessage(message);
  }

  /**
   * Obtener mensajes del usuario
   */
  async getUserMessages(userId: string, limit?: number) {
    const messages = await this.messageRepo.findByUser(userId, limit);
    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Obtener mensajes por plataforma
   */
  async getMessagesByPlatform(
    userId: string,
    platform: 'WHATSAPP' | 'EMAIL' | 'SMS',
    limit?: number
  ) {
    const messages = await this.messageRepo.findByPlatform(platform, userId, limit);
    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Obtener mensajes con media
   */
  async getMessagesWithMedia(userId: string, limit?: number) {
    const messages = await this.messageRepo.findWithMedia(userId, limit);
    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Obtener mensajes fallidos
   */
  async getFailedMessages(userId: string) {
    const messages = await this.messageRepo.findFailed(userId);
    return messages.map(m => this.formatMessage(m));
  }

  /**
   * Reintentar envío de mensaje fallido
   */
  async retryFailedMessage(messageId: string): Promise<SendResult> {
    const message = await this.messageRepo.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    if (message.status !== 'FAILED') {
      throw new Error('Message is not in failed status');
    }

    // Obtener contacto
    const contact = await this.contactRepo.findById(message.contactId);
    if (!contact) {
      throw new Error('Contact not found');
    }

    // Reintentar envío
    return await this.sendMessage(message.userId, {
      contactId: message.contactId,
      platform: message.platform as 'WHATSAPP' | 'EMAIL' | 'SMS',
      content: message.content,
      subject: message.subject || undefined,
      mediaUrl: message.mediaUrl || undefined,
      mediaType: message.mediaType || undefined
    });
  }

  /**
   * Eliminar mensaje
   */
  async deleteMessage(messageId: string): Promise<void> {
    await this.messageRepo.delete(messageId);
  }

  // ==========================================================================
  // ESTADÍSTICAS
  // ==========================================================================

  /**
   * Obtener estadísticas de mensajes
   */
  async getMessageStats(userId: string): Promise<MessageStats> {
    const stats = await this.messageRepo.getStats(userId);

    // Calcular promedio de mensajes por día
    const messages = await this.messageRepo.findByUser(userId);
    let avgMessagesPerDay = 0;

    if (messages.length > 0) {
      const oldestMessage = messages[messages.length - 1];
      const daysSinceOldest = Math.ceil(
        (Date.now() - oldestMessage.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      avgMessagesPerDay = daysSinceOldest > 0
        ? Math.round((messages.length / daysSinceOldest) * 10) / 10
        : 0;
    }

    return {
      ...stats,
      avgMessagesPerDay
    };
  }

  // ==========================================================================
  // MÉTODOS PRIVADOS - ENVÍO POR PLATAFORMA
  // ==========================================================================

  /**
   * Enviar mensaje por WhatsApp (Twilio)
   */
  private async sendWhatsApp(to: string, data: SendMessageDTO): Promise<SendResult> {
    try {
      const twilioClient = getTwilioClient();

      const result = await twilioClient.sendWhatsApp({
        to,
        message: data.content
      });

      console.log(`[WHATSAPP] Sent to ${to}: ${result.sid}`);

      return {
        success: true,
        messageId: '', // Se llenará después
        externalId: result.sid,
        platform: 'WHATSAPP',
        status: 'SENT'
      };
    } catch (error) {
      console.error('[WHATSAPP] Error:', error);

      // Si Twilio no está configurado, usar mock
      if (error instanceof Error && error.message.includes('not configured')) {
        console.warn('[WHATSAPP] Using mock - Twilio not configured');
        return {
          success: true,
          messageId: '',
          externalId: `whatsapp_mock_${Date.now()}`,
          platform: 'WHATSAPP',
          status: 'SENT'
        };
      }

      throw error;
    }
  }

  /**
   * Enviar email (SendGrid)
   */
  private async sendEmail(to: string, data: SendMessageDTO): Promise<SendResult> {
    // Validar que tenga subject
    if (!data.subject) {
      throw new Error('Subject is required for emails');
    }

    try {
      const sendGridClient = getSendGridClient();

      // Crear HTML desde el contenido
      const html = sendGridClient.createHTMLEmail({
        title: data.subject,
        content: data.content.replace(/\n/g, '<br>')
      });

      const result = await sendGridClient.sendEmail({
        to,
        subject: data.subject,
        text: data.content,
        html
      });

      console.log(`[EMAIL] Sent to ${to}: ${result.messageId}`);

      return {
        success: true,
        messageId: '',
        externalId: result.messageId,
        platform: 'EMAIL',
        status: 'SENT'
      };
    } catch (error) {
      console.error('[EMAIL] Error:', error);

      // Si SendGrid no está configurado, usar mock
      if (error instanceof Error && error.message.includes('not configured')) {
        console.warn('[EMAIL] Using mock - SendGrid not configured');
        return {
          success: true,
          messageId: '',
          externalId: `email_mock_${Date.now()}`,
          platform: 'EMAIL',
          status: 'SENT'
        };
      }

      throw error;
    }
  }

  /**
   * Enviar SMS (Twilio)
   */
  private async sendSMS(to: string, data: SendMessageDTO): Promise<SendResult> {
    try {
      const twilioClient = getTwilioClient();

      const result = await twilioClient.sendSMS({
        to,
        message: data.content
      });

      console.log(`[SMS] Sent to ${to}: ${result.sid}`);

      return {
        success: true,
        messageId: '',
        externalId: result.sid,
        platform: 'SMS',
        status: 'SENT'
      };
    } catch (error) {
      console.error('[SMS] Error:', error);

      // Si Twilio no está configurado, usar mock
      if (error instanceof Error && error.message.includes('not configured')) {
        console.warn('[SMS] Using mock - Twilio not configured');
        return {
          success: true,
          messageId: '',
          externalId: `sms_mock_${Date.now()}`,
          platform: 'SMS',
          status: 'SENT'
        };
      }

      throw error;
    }
  }

  // ==========================================================================
  // UTILIDADES PRIVADAS
  // ==========================================================================

  /**
   * Obtener información de contacto según plataforma
   */
  private getContactInfo(
    contact: any,
    platform: 'WHATSAPP' | 'EMAIL' | 'SMS'
  ): string | null {
    switch (platform) {
      case 'WHATSAPP':
      case 'SMS':
        const phones = this.contactRepo.parsePhoneNumbers(contact);
        return phones.length > 0 ? phones[0] : null;

      case 'EMAIL':
        const emails = this.contactRepo.parseEmails(contact);
        return emails.length > 0 ? emails[0] : null;

      default:
        return null;
    }
  }

  /**
   * Validar datos de envío
   */
  private validateSendData(data: SendMessageDTO): void {
    if (!data.contactId) {
      throw new Error('Contact ID is required');
    }

    if (!data.platform) {
      throw new Error('Platform is required');
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Message content is required');
    }

    if (data.content.length > 5000) {
      throw new Error('Message content is too long (max 5000 characters)');
    }

    // Para emails, subject es requerido
    if (data.platform === 'EMAIL' && !data.subject) {
      throw new Error('Subject is required for emails');
    }

    // Para SMS, limitar a 160 caracteres
    if (data.platform === 'SMS' && data.content.length > 160) {
      throw new Error('SMS content must be 160 characters or less');
    }
  }

  /**
   * Truncar contenido para preview
   */
  private truncateContent(content: string, maxLength: number = 50): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }

  /**
   * Formatear mensaje para respuesta
   */
  private formatMessage(message: any) {
    return {
      id: message.id,
      userId: message.userId,
      contactId: message.contactId,
      contactName: message.contact?.name,
      platform: message.platform,
      direction: message.direction,
      content: message.content,
      subject: message.subject,
      mediaUrl: message.mediaUrl,
      mediaType: message.mediaType,
      status: message.status,
      read: message.read,
      readAt: message.readAt,
      externalId: message.externalId,
      threadId: message.threadId,
      errorMessage: message.errorMessage,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt
    };
  }
}
