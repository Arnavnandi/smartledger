import api from './api';
import type { InvoiceItem } from '../types/invoice.types';

export interface AiExecutiveSummary {
  financialScore: number;
  healthStatus: string;
  topInsight: string;
  biggestRisk: string;
  biggestOpportunity: string;
  suggestedAction: string;
}

export interface AiHealthAnalysis {
  score: number;
  status: string;
  strengths: string[];
  risks: string[];
  recommendations: string[];
}

export interface AiCashFlowPrediction {
  nextMonthRevenue: number;
  nextMonthExpenses: number;
  expectedProfit: number;
  confidenceLevel: number;
  reasoning: string;
}

export interface AiAutofillResponse {
  clientName?: string;
  issueDate?: string;
  dueDate?: string;
  items?: Array<{
    description: string;
    quantity: number;
    price: number;
    taxPercent: number;
    discountPercent: number;
  }>;
  notes?: string;
  terms?: string;
}

export const aiService = {
  autofillInvoice: async (prompt: string): Promise<AiAutofillResponse> => {
    const response = await api.post<AiAutofillResponse>('/ai/autofill-invoice', { prompt });
    return response.data;
  },

  suggestItems: async (prompt: string): Promise<InvoiceItem[]> => {
    const response = await api.post('/ai/suggest-items', { prompt });
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
  },

  getExecutiveSummary: async (): Promise<AiExecutiveSummary> => {
    const response = await api.get<AiExecutiveSummary>('/ai/executive-summary');
    return response.data;
  },

  getFinancialHealth: async (): Promise<AiHealthAnalysis> => {
    const response = await api.get<AiHealthAnalysis>('/ai/health');
    return response.data;
  },

  getCashFlowPrediction: async (): Promise<AiCashFlowPrediction> => {
    const response = await api.get<AiCashFlowPrediction>('/ai/cash-flow-prediction');
    return response.data;
  },

  explainKpi: async (kpiName: string, currentValue: number): Promise<string> => {
    const response = await api.post<{ text: string }>('/ai/explain-kpi', { kpiName, currentValue });
    return response.data.text;
  }
};
