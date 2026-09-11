import apiClient from './apiClient';

export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    padreId?: number;
    subcategorias?: Categoria[];
}

export const categoryService = {
    getAll: async () => {
        const response = await apiClient.get<Categoria[]>('/categorias');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Categoria>(`/categorias/${id}`);
        return response.data;
    },
    create: async (data: Partial<Categoria>) => {
        const response = await apiClient.post<Categoria>('/categorias', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Categoria>) => {
        // Sanitize relations that cause TypeORM errors
        const { subcategorias, ...safeData } = data as any;
        const response = await apiClient.put<Categoria>(`/categorias/${id}`, safeData);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/categorias/${id}`);
        return response.data;
    },
};
