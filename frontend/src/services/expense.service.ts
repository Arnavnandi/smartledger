import api from './api';
import type { Expense, ExpenseRequest } from '../types/expense.types';

export const expenseService = {
  getExpenses: async (page = 0, size = 10, search = '') => {
    const response = await api.get('/expenses', {
      params: { page, size, search }
    });
    return response.data;
  },

  searchExpenses: async (page = 0, size = 10, filter: any) => {
    const response = await api.post(`/expenses/search?page=${page}&size=${size}`, filter);
    return response.data;
  },

  createExpense: async (data: ExpenseRequest): Promise<Expense> => {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  updateExpense: async (id: number, data: ExpenseRequest): Promise<Expense> => {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: number) => {
    const response = await api.delete(`/expenses/${id}`);
    return response.data;
  },

  uploadReceipt: async (file: File): Promise<ExpenseRequest> => {
    const formData = new FormData();
    formData.append('file', file);
    
    // We send as multipart/form-data
    const response = await api.post('/expenses/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};
