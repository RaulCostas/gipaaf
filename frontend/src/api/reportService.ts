import apiClient from './apiClient';

export interface DashboardStats {
    totalSalesToday: number;
    lowStock: number;
    totalProducts: number;
    totalSalesMonth: number;
}

export interface ChartData {
    name: string;
    total: number;
}

export interface TopProductData {
    name: string;
    value: number;
}

export const reportService = {
    getStats: async (params?: { ciudadId?: string; sucursalId?: string }) => {
        const response = await apiClient.get<DashboardStats>('/reports/dashboard/stats', { params });
        return response.data;
    },
    getTrend: async (params?: { ciudadId?: string; sucursalId?: string }) => {
        const response = await apiClient.get<ChartData[]>('/reports/dashboard/trend', { params });
        return response.data;
    },
    getTopProducts: async (params?: { ciudadId?: string; sucursalId?: string }) => {
        const response = await apiClient.get<TopProductData[]>('/reports/dashboard/top-products', { params });
        return response.data;
    },
    getLowStock: async (params?: { ciudadId?: string; sucursalId?: string }) => {
        const response = await apiClient.get<any[]>('/reports/dashboard/low-stock', { params });
        return response.data;
    },
};
