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

export interface InventarioAlmacenItem {
    productoId: number;
    codigo: string;
    nombre: string;
    marca: string;
    linea: string;
    grupo: string;
    unidadMedida: string;
    precioVenta: number;
    precioCompra: number;
    stockActualHoy: number;
    movimientosDespues: number;
    stockCorte: number;
    lotes?: Array<{
        numeroLote: string;
        cantidadActual: number;
        fechaVencimiento: string | null;
    }>;
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
    getInventarioAlmacen: async (params?: { sucursalId?: number; ciudadId?: number; fechaCorte?: string }) => {
        const queryParams = new URLSearchParams();
        if (params?.sucursalId) queryParams.append('sucursalId', String(params.sucursalId));
        if (params?.ciudadId) queryParams.append('ciudadId', String(params.ciudadId));
        if (params?.fechaCorte) queryParams.append('fechaCorte', params.fechaCorte);
        const qs = queryParams.toString();
        const response = await apiClient.get<InventarioAlmacenItem[]>(`/inventario/almacen${qs ? `?${qs}` : ''}`);
        return response.data;
    },
    ajustarStock: async (id: number, cantidad: number, observaciones?: string) => {
        const response = await apiClient.put<Inventario>(`/inventario/${id}/ajustar`, { cantidad, observaciones });
        return response.data;
    },
    registrarMerma: async (id: number, cantidad: number, motivo?: string, observaciones?: string) => {
        const response = await apiClient.put<Inventario>(`/inventario/${id}/merma`, { cantidad, motivo, observaciones });
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
