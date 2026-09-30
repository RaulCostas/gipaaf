import apiClient from './apiClient';

export interface Linea {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    padreId?: number;
    sublineas?: Linea[];
}

export const lineaService = {
    getAll: async () => {
        const response = await apiClient.get<Linea[]>('/lineas');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Linea>(`/lineas/${id}`);
        return response.data;
    },
    create: async (data: Partial<Linea>) => {
        const response = await apiClient.post<Linea>('/lineas', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Linea>) => {
        // Sanitize relations that cause TypeORM errors
        const { sublineas, ...safeData } = data as any;
        const response = await apiClient.put<Linea>(`/lineas/${id}`, safeData);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/lineas/${id}`);
        return response.data;
    },
};

// Aliases for backwards compatibility if needed
export type Categoria = Linea;
export const categoryService = lineaService;
