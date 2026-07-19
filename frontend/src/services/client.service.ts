import api from './api';
import type { Client, ClientRequest, PaginatedResponse, ClientActivity } from '../types/client.types';

export const clientService = {
  getClients: async (
    page = 0,
    size = 10,
    search?: string,
    sortBy = 'createdAt',
    direction = 'desc'
  ): Promise<PaginatedResponse<Client>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });
    
    if (search) {
      params.append('search', search);
    }

    const response = await api.get<PaginatedResponse<Client>>(`/clients?${params.toString()}`);
    return response.data;
  },

  getClient: async (id: number): Promise<Client> => {
    const response = await api.get<Client>(`/clients/${id}`);
    return response.data;
  },

  getClientActivity: async (id: number): Promise<ClientActivity[]> => {
    const response = await api.get<ClientActivity[]>(`/clients/${id}/activity`);
    return response.data;
  },

  createClient: async (data: ClientRequest): Promise<Client> => {
    const response = await api.post<Client>('/clients', data);
    return response.data;
  },

  updateClient: async (id: number, data: ClientRequest): Promise<Client> => {
    const response = await api.put<Client>(`/clients/${id}`, data);
    return response.data;
  },

  deleteClient: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/clients/${id}`);
    return response.data;
  }
};
