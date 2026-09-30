import apiClient from './apiClient';
import type { Inventario } from './inventoryService';
import type { Usuario } from './userService';

export type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'TRASPASO_ENTRADA' | 'TRASPASO_SALIDA' | 'VENTA' | 'COMPRA' | 'DEVOLUCION' | string;

export interface MovimientoInventario {
    id: number;
    inventario: Inventario;
    tipo: TipoMovimiento;
    cantidad: number;
    motivo: string;
    numeroDocumento?: string;
    observaciones?: string;
    costoUnitario?: number;
    usuario?: Usuario;
    creadoEn: string;
}

export interface MovimientoFilters {
    inventarioId?: number;
    tipo?: string;
    sucursalId?: number;
    ciudadId?: number;
}

export const movimientoService = {
    getAll: async (filters?: MovimientoFilters) => {
        const params = new URLSearchParams();
        if (filters?.inventarioId) params.append('inventarioId', String(filters.inventarioId));
        if (filters?.tipo) params.append('tipo', filters.tipo);
        if (filters?.sucursalId) params.append('sucursalId', String(filters.sucursalId));
        if (filters?.ciudadId) params.append('ciudadId', String(filters.ciudadId));
        
        const qs = params.toString();
        const url = qs ? `/movimientos-inventario?${qs}` : '/movimientos-inventario';
        const response = await apiClient.get<MovimientoInventario[]>(url);
        return response.data;
    },
    getByInventario: async (inventarioId: number) => {
        const response = await apiClient.get<MovimientoInventario[]>(`/movimientos-inventario?inventarioId=${inventarioId}`);
        return response.data;
    },
    update: async (id: number, data: { motivo?: string; observaciones?: string }) => {
        const response = await apiClient.put<MovimientoInventario>(`/movimientos-inventario/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/movimientos-inventario/${id}`);
        return response.data;
    },
};
