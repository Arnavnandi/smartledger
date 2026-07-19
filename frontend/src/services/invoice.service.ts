import api from './api';
import type { Invoice, InvoiceRequest, InvoiceStatusUpdateRequest, PaginatedResponse, InvoiceActivity } from '../types/invoice.types';

export const invoiceService = {
  getInvoices: async (
    page = 0,
    size = 10,
    search?: string,
    status?: string,
    sortBy = 'createdAt',
    direction = 'desc'
  ): Promise<PaginatedResponse<Invoice>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sortBy,
      direction,
    });
    
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);

    const response = await api.get<PaginatedResponse<Invoice>>(`/invoices?${params.toString()}`);
    return response.data;
  },

  searchInvoices: async (
    page = 0,
    size = 10,
    filter: any
  ): Promise<PaginatedResponse<Invoice>> => {
    const response = await api.post<PaginatedResponse<Invoice>>(`/invoices/search?page=${page}&size=${size}`, filter);
    return response.data;
  },

  getInvoice: async (id: number): Promise<Invoice> => {
    const response = await api.get<Invoice>(`/invoices/${id}`);
    return response.data;
  },

  getInvoiceActivity: async (id: number): Promise<InvoiceActivity[]> => {
    const response = await api.get<InvoiceActivity[]>(`/invoices/${id}/activity`);
    return response.data;
  },

  createInvoice: async (data: InvoiceRequest): Promise<Invoice> => {
    const response = await api.post<Invoice>('/invoices', data);
    return response.data;
  },

  updateInvoice: async (id: number, data: InvoiceRequest): Promise<Invoice> => {
    const response = await api.put<Invoice>(`/invoices/${id}`, data);
    return response.data;
  },

  updateInvoiceStatus: async (id: number, data: InvoiceStatusUpdateRequest): Promise<Invoice> => {
    const response = await api.patch<Invoice>(`/invoices/${id}/status`, data);
    return response.data;
  },

  deleteInvoice: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/invoices/${id}`);
    return response.data;
  },

  downloadPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
    return response.data;
  },

  sendEmail: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/invoices/${id}/send`);
    return response.data;
  }
};
