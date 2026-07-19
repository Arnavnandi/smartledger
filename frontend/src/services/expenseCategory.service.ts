import api from './api';

export interface ExpenseCategory {
  id: number;
  name: string;
  description: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export const expenseCategoryService = {
  getCategories: async (): Promise<ExpenseCategory[]> => {
    const response = await api.get('/expense-categories');
    return response.data;
  },

  createCategory: async (data: { name: string; description?: string; color?: string }): Promise<ExpenseCategory> => {
    const response = await api.post('/expense-categories', data);
    return response.data;
  },

  updateCategory: async (id: number, data: { name: string; description?: string; color?: string }): Promise<ExpenseCategory> => {
    const response = await api.put(`/expense-categories/${id}`, data);
    return response.data;
  },

  deleteCategory: async (id: number) => {
    const response = await api.delete(`/expense-categories/${id}`);
    return response.data;
  }
};
