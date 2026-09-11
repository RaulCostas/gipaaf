import apiClient from './apiClient';
import type { Personal } from './personalService';
import type { Sucursal } from './sucursalService';

export interface Ruta {
    id: number;
    nombre: string;
    descripcion: string;
    sucursal?: Partial<Sucursal>;
    activo: boolean;
    vendedor: Personal | null;
    clientes?: any[];
    clienteIds?: number[];
}

export const rutaService = {
    getAll: async () => {
        const response = await apiClient.get<Ruta[]>('/rutas');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get<Ruta>(`/rutas/${id}`);
        return response.data;
    },
    create: async (data: Partial<Ruta>) => {
        const response = await apiClient.post<Ruta>('/rutas', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Ruta>) => {
        const response = await apiClient.put<Ruta>(`/rutas/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete<void>(`/rutas/${id}`);
        return response.data;
    },
};
