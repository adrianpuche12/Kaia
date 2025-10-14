// Tipos relacionados con mensajes
export interface Message {
  id: string;
  userId: string;
  contactId?: string;
  type: MessageType;
  direction: MessageDirection;
  content: string;
  recipient?: string;
  sender?: string;
  subject?: string;
  mediaUrl?: string;
  deliveryStatus: DeliveryStatus;
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
  externalId?: string;
  contact?: Contact;
}

export type MessageType = 'WHATSAPP' | 'EMAIL' | 'SMS';
export type MessageDirection = 'INCOMING' | 'OUTGOING';
export type DeliveryStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'READ';

export interface Contact {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  isFavorite: boolean;
  createdAt: Date;
}

export interface SendMessageRequest {
  type: MessageType;
  recipient?: string;
  contactId?: string;
  content: string;
  subject?: string;
  mediaUrl?: string;
}

export interface CreateContactRequest {
  name: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  isFavorite?: boolean;
}

export interface UpdateContactRequest {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  notes?: string;
  isFavorite?: boolean;
}
