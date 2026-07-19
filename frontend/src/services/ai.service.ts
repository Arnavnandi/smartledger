import api from './api';
import type { InvoiceItem } from '../types/invoice.types';

export const aiService = {
  suggestItems: async (prompt: string): Promise<InvoiceItem[]> => {
    const response = await api.post('/ai/suggest-items', { prompt });
    // The backend returns a JSON string, which Axios might parse automatically,
    // but just in case it's a string, we parse it.
    if (typeof response.data === 'string') {
        try {
            return JSON.parse(response.data);
        } catch (e) {
            console.error("Failed to parse AI response:", response.data);
            return [];
        }
    }
    return response.data;
  },

  enhanceText: async (prompt: string): Promise<string> => {
    const response = await api.post<{ text: string }>('/ai/enhance-text', { prompt });
    return response.data.text;
  },

  getInvoiceSummary: async (invoiceId: number): Promise<string> => {
    const response = await api.get<{ text: string }>(`/ai/invoice-summary/${invoiceId}`);
    return response.data.text;
  }
};
