import api from './api';

export interface AdminDashboardMetricsResponse {
    totalUsers: number;
    totalCompanies: number;
    totalInvoices: number;
    totalPlatformRevenue: number;
}

export interface AdminUserResponse {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isEmailVerified: boolean;
    createdAt: string;
}

export interface AdminCompanyResponse {
    id: number;
    name: string;
    ownerEmail: string;
}

export interface AuditLog {
    id: number;
    userEmail: string;
    action: string;
    resourceType: string;
    resourceId: string;
    details: string;
    timestamp: string;
}

export const adminService = {
    getMetrics: async (): Promise<AdminDashboardMetricsResponse> => {
        const response = await api.get('/admin/metrics');
        return response.data;
    },

    getUsers: async (page = 0, size = 20) => {
        const response = await api.get('/admin/users', { params: { page, size } });
        return response.data;
    },

    getCompanies: async (page = 0, size = 20) => {
        const response = await api.get('/admin/companies', { params: { page, size } });
        return response.data;
    },

    getLogs: async (page = 0, size = 50) => {
        const response = await api.get('/admin/logs', { params: { page, size } });
        return response.data;
    }
};
