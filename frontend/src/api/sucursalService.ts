import apiClient from './apiClient';

export interface Sucursal {
    id: number;
    nombre: string;
    direccion: string;
    telefono: string;
    email: string;
    horarioAtencion?: string;
    latitud?: number | null;
    longitud?: number | null;
    activo: boolean;
    ciudad?: { id: number; nombre: string };
    ciudadId?: number;
    creadoEn: string;
}

export const sucursalService = {
    getAll: async () => {
        const response = await apiClient.get<Sucursal[]>('/sucursales');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Sucursal>(`/sucursales/${id}`);
        return response.data;
    },
    create: async (data: Partial<Sucursal>) => {
        const response = await apiClient.post<Sucursal>('/sucursales', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Sucursal>) => {
        const response = await apiClient.put<Sucursal>(`/sucursales/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/sucursales/${id}`);
        return response.data;
    },
};
