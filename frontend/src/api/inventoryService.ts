import apiClient from './apiClient';
import type { Producto } from './productService';
import type { Sucursal } from './sucursalService';

export interface Inventario {
    id: number;
    producto: Producto;
    sucursal: Sucursal;
    almacen?: Sucursal; // For backwards compatibility
    stockActual: number;
    stockMinimo: number;
    stockMaximo: number;
    precioCompra: number;
    precioVenta: number;
}

export const inventoryService = {
    getAll: async () => {
        const response = await apiClient.get<Inventario[]>('/inventario');
        return response.data;
    },
    getBySucursal: async (sucursalId: number) => {
        const response = await apiClient.get<Inventario[]>(`/inventario?sucursalId=${sucursalId}`);
        return response.data;
    },
    getByAlmacen: async (almacenId: number) => {
        const response = await apiClient.get<Inventario[]>(`/inventario?sucursalId=${almacenId}`);
        return response.data;
    },
    getByProducto: async (productoId: number) => {
        const response = await apiClient.get<Inventario[]>(`/inventario?productoId=${productoId}`);
        return response.data;
    },
    ajustarStock: async (id: number, cantidad: number, observaciones?: string) => {
        const response = await apiClient.put<Inventario>(`/inventario/${id}/ajustar`, { cantidad, observaciones });
        return response.data;
    },
    create: async (data: Partial<Inventario>) => {
        const response = await apiClient.post<Inventario>('/inventario', data);
        return response.data;
    },
    update: async (id: number, data: Partial<Inventario>) => {
        const response = await apiClient.put<Inventario>(`/inventario/${id}`, data);
        return response.data;
    },
};
