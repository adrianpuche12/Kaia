// API de contactos
import { apiClient } from './apiClient';
import {
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  PaginatedResponse,
} from '../../types';

class ContactAPI {
  async listContacts(filters?: {
    favorite?: boolean;
    hasWhatsApp?: boolean;
    hasEmail?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Contact>> {
    const response = await apiClient.get<PaginatedResponse<Contact>>('/contacts', filters);
    return response.data!;
  }

  async getContactById(id: string): Promise<Contact> {
    const response = await apiClient.get<{ contact: Contact }>(`/contacts/${id}`);
    return response.data!.contact;
  }

  async createContact(data: CreateContactRequest): Promise<Contact> {
    const response = await apiClient.post<{ contact: Contact }>('/contacts', data);
    return response.data!.contact;
  }

  async updateContact(id: string, data: UpdateContactRequest): Promise<Contact> {
    const response = await apiClient.put<{ contact: Contact }>(`/contacts/${id}`, data);
    return response.data!.contact;
  }

  async deleteContact(id: string): Promise<void> {
    await apiClient.delete(`/contacts/${id}`);
  }

  async searchContacts(query: string): Promise<Contact[]> {
    const response = await apiClient.get<{ contacts: Contact[] }>('/contacts/search', { q: query });
    return response.data!.contacts;
  }

  async getFrequentContacts(limit: number = 10): Promise<Contact[]> {
    const response = await apiClient.get<{ contacts: Contact[] }>('/contacts/frequent', { limit });
    return response.data!.contacts;
  }

  async getRecentContacts(limit: number = 10): Promise<Contact[]> {
    const response = await apiClient.get<{ contacts: Contact[] }>('/contacts/recent', { limit });
    return response.data!.contacts;
  }

  async getWhatsAppContacts(): Promise<Contact[]> {
    const response = await apiClient.get<{ contacts: Contact[] }>('/contacts/whatsapp');
    return response.data!.contacts;
  }

  async getAllTags(): Promise<string[]> {
    const response = await apiClient.get<{ tags: string[] }>('/contacts/tags');
    return response.data!.tags;
  }

  async getContactsByTag(tag: string): Promise<Contact[]> {
    const response = await apiClient.get<{ contacts: Contact[] }>(`/contacts/tags/${tag}`);
    return response.data!.contacts;
  }

  async getContactStats(): Promise<{
    total: number;
    withWhatsApp: number;
    withEmail: number;
    favorites: number;
  }> {
    const response = await apiClient.get<{
      stats: {
        total: number;
        withWhatsApp: number;
        withEmail: number;
        favorites: number;
      };
    }>('/contacts/stats');
    return response.data!.stats;
  }

  async syncFromDevice(contacts: any[]): Promise<{ created: number; updated: number }> {
    const response = await apiClient.post<{ created: number; updated: number }>(
      '/contacts/sync',
      { contacts }
    );
    return response.data!;
  }

  async cleanupInactive(daysInactive: number): Promise<{ deleted: number }> {
    const response = await apiClient.post<{ deleted: number }>(
      '/contacts/cleanup',
      { daysInactive }
    );
    return response.data!;
  }

  async addTag(id: string, tag: string): Promise<Contact> {
    const response = await apiClient.post<{ contact: Contact }>(
      `/contacts/${id}/tags`,
      { tag }
    );
    return response.data!.contact;
  }

  async removeTag(id: string, tag: string): Promise<Contact> {
    const response = await apiClient.delete<{ contact: Contact }>(
      `/contacts/${id}/tags/${tag}`
    );
    return response.data!.contact;
  }
}

export const contactAPI = new ContactAPI();
export default contactAPI;
