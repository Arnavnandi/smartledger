import api from './api';
import type { Invoice } from '../types/invoice.types';
import type { Expense } from '../types/expense.types';

export interface ChartDataPoint {
  month: string;
  revenue: number;
  expense: number;
}

export interface ReportSummaryResponse {
  period: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  breakdown: ChartDataPoint[];
  topInvoices: Invoice[];
  topExpenses: Expense[];
}

export const reportService = {
  getMonthlyReport: async (year: number, month: number): Promise<ReportSummaryResponse> => {
    const res = await api.get('/reports/monthly', { params: { year, month } });
    return res.data;
  },

  getYearlyReport: async (year: number): Promise<ReportSummaryResponse> => {
    const res = await api.get('/reports/yearly', { params: { year } });
    return res.data;
  },

  exportReport: async (format: 'csv' | 'excel' | 'pdf', year: number, month?: number): Promise<void> => {
    const res = await api.get('/reports/export', {
      params: { format, year, month },
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    
    let extension = format === 'excel' ? 'xlsx' : format;
    let filename = `report_${year}${month ? '_' + month : ''}.${extension}`;
    link.setAttribute('download', filename);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
