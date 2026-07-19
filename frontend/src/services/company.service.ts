import api from './api';
import type { CompanyProfile, CompanyProfileUpdateRequest } from '../types/company.types';

export const companyService = {
  getProfile: async (): Promise<CompanyProfile> => {
    const response = await api.get<CompanyProfile>('/company/me');
    return response.data;
  },

  updateProfile: async (data: CompanyProfileUpdateRequest): Promise<CompanyProfile> => {
    const response = await api.put<CompanyProfile>('/company/me', data);
    return response.data;
  },

  uploadLogo: async (file: File): Promise<CompanyProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<CompanyProfile>('/company/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};
