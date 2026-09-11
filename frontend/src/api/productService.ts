import apiClient from './apiClient';
import type { Categoria } from './categoryService';

export interface Producto {
    id: number;
    codigo: string;
    nombre: string;
    descripcion?: string;
    precioCompra: number;
    fechaUltimaCompra?: string;
    precioVenta: number;
    unidadMedida: string;
    activo: boolean;
    categoria?: Categoria;
    categoriaId?: number;
    marcaId?: number;
    marca?: any;
    grupoId?: number;
    grupo?: any;
    imagen?: string;
}

export const productService = {
    getAll: async (search?: string) => {
        const response = await apiClient.get<Producto[]>('/productos', {
            params: { search },
        });
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Producto>(`/productos/${id}`);
        return response.data;
    },
    create: async (data: Partial<Producto>) => {
        const response = await apiClient.post<Producto>('/productos', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Producto>) => {
        const response = await apiClient.put<Producto>(`/productos/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/productos/${id}`);
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
