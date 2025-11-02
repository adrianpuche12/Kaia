// API de mensajes
import { apiClient } from './apiClient';
import {
  Message,
  SendMessageRequest,
  PaginatedResponse,
} from '../../types';

class MessageAPI {
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    const response = await apiClient.post<{ message: Message }>('/messages', data);
    return response.data!.message;
  }

  async listMessages(filters?: {
    type?: string;
    direction?: string;
    contactId?: string;
    deliveryStatus?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Message>> {
    const response = await apiClient.get<PaginatedResponse<Message>>('/messages', filters);
    return response.data!;
  }

  async getUnreadMessages(): Promise<Message[]> {
    const response = await apiClient.get<{ messages: Message[] }>('/messages/unread');
    return response.data!.messages;
  }

  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ count: number }>('/messages/unread/count');
    return response.data!.count;
  }

  async getMessageById(id: string): Promise<Message> {
    const response = await apiClient.get<{ message: Message }>(`/messages/${id}`);
    return response.data!.message;
  }

  async markAsRead(id: string): Promise<Message> {
    const response = await apiClient.post<{ message: Message }>(`/messages/${id}/read`);
    return response.data!.message;
  }

  async deleteMessage(id: string): Promise<void> {
    await apiClient.delete(`/messages/${id}`);
  }

  // Nuevos endpoints agregados - Fase 1
  async getConversations(): Promise<Array<{ contactId: string; lastMessage: Message; unreadCount: number }>> {
    const response = await apiClient.get<{ conversations: Array<{ contactId: string; lastMessage: Message; unreadCount: number }> }>('/messages/conversations');
    return response.data!.conversations;
  }

  async getConversation(contactId: string): Promise<Message[]> {
    const response = await apiClient.get<{ messages: Message[] }>(`/messages/conversation/${contactId}`);
    return response.data!.messages;
  }

  async searchMessages(query: string): Promise<Message[]> {
    const response = await apiClient.get<{ messages: Message[] }>('/messages/search', { q: query });
    return response.data!.messages;
  }

  async getStats(): Promise<{ total: number; sent: number; received: number; failed: number }> {
    const response = await apiClient.get<{ stats: { total: number; sent: number; received: number; failed: number } }>('/messages/stats');
    return response.data!.stats;
  }

  async markConversationAsRead(contactId: string): Promise<{ updated: number }> {
    const response = await apiClient.post<{ updated: number }>(`/messages/conversation/${contactId}/read`);
    return response.data!;
  }

  async retryMessage(id: string): Promise<Message> {
    const response = await apiClient.post<{ message: Message }>(`/messages/${id}/retry`);
    return response.data!.message;
  }
}

export const messageAPI = new MessageAPI();
export default messageAPI;
