import api from './api';
import type { JwtAuthResponse, ApiResponse } from '../types/auth.types';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const authService = {
  login: async (data: z.infer<typeof loginSchema>) => {
    const response = await api.post<JwtAuthResponse>('/auth/login', data);
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    return response.data;
  },

  register: async (data: z.infer<typeof registerSchema>) => {
    const response = await api.post<ApiResponse>('/auth/register', data);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  verifyEmail: async (token: string) => {
    const response = await api.get<ApiResponse>(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', { token, newPassword });
    return response.data;
  },
};
