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

export const movimientoService = {
    getAll: async () => {
        const response = await apiClient.get<MovimientoInventario[]>('/movimientos-inventario');
        return response.data;
    },
    getByInventario: async (inventarioId: number) => {
        const response = await apiClient.get<MovimientoInventario[]>(`/movimientos-inventario?inventarioId=${inventarioId}`);
        return response.data;
    },
};
