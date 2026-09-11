import apiClient from './apiClient';
import type { Sucursal } from './sucursalService';

export interface Personal {
    id: number;
    nombres: string;
    apellidos: string;
    ci: string;
    telefono: string;
    direccion?: string;
    fechaIngreso?: string;
    fechaBaja?: string;
    motivoBaja?: string;
    carnetAnverso?: string;
    carnetReverso?: string;
    cargo: 'GERENTE' | 'ADMINISTRATIVO' | 'VENDEDOR' | 'JEFE_VENTAS' | 'RESPONSABLE_ALMACEN';
    sucursal?: Partial<Sucursal>;
    activo: boolean;
}

export const personalService = {
    getAll: async () => {
        const response = await apiClient.get<Personal[]>('/personal');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get<Personal>(`/personal/${id}`);
        return response.data;
    },
    create: async (data: Partial<Personal>) => {
        const response = await apiClient.post<Personal>('/personal', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Personal>) => {
        const response = await apiClient.put<Personal>(`/personal/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete<void>(`/personal/${id}`);
        return response.data;
    },
    darDeBaja: async (id: number, data: { fechaBaja: string; motivoBaja: string }) => {
        const response = await apiClient.post<Personal>(`/personal/${id}/dar-de-baja`, data);
        return response.data;
    },
    uploadImage: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ url: string }>('/uploads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },
};
