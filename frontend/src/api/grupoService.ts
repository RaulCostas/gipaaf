import apiClient from './apiClient';

export interface Grupo {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

export const grupoService = {
    getAll: async () => {
        const response = await apiClient.get<Grupo[]>('/grupos');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Grupo>(`/grupos/${id}`);
        return response.data;
    },
    create: async (data: Partial<Grupo>) => {
        const response = await apiClient.post<Grupo>('/grupos', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Grupo>) => {
        const response = await apiClient.put<Grupo>(`/grupos/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/grupos/${id}`);
        return response.data;
    },
};
