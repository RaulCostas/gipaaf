import apiClient from './apiClient';

export interface Marca {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

export const marcaService = {
    getAll: async () => {
        const response = await apiClient.get<Marca[]>('/marcas');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Marca>(`/marcas/${id}`);
        return response.data;
    },
    create: async (data: Partial<Marca>) => {
        const response = await apiClient.post<Marca>('/marcas', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Marca>) => {
        const response = await apiClient.put<Marca>(`/marcas/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/marcas/${id}`);
        return response.data;
    },
};
