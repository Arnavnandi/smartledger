import api from './api';
import type { DashboardSummary, ChartDataPoint, TopClient, AiInsightsResponse } from '../types/dashboard.types';

export const dashboardService = {
  getSummary: async (): Promise<DashboardSummary> => {
    const response = await api.get('/dashboard/summary');
    return response.data;
  },

  getCashFlow: async (months: number = 6): Promise<ChartDataPoint[]> => {
    const response = await api.get('/dashboard/cash-flow', { params: { months } });
    return response.data;
  },

  getTopClients: async (limit: number = 5): Promise<TopClient[]> => {
    const response = await api.get('/dashboard/top-clients', { params: { limit } });
    return response.data;
  },

  getInsights: async (): Promise<AiInsightsResponse> => {
    const response = await api.get('/dashboard/insights');
    return response.data;
  }
};
