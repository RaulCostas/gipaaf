import apiClient from './apiClient';
import type { Producto } from './productService';
import type { Cliente } from './clientService';
import type { Proveedor } from './supplierService';

export enum TipoNota {
    COMPRA = 'COMPRA',
    VENTA = 'VENTA',
    DEVOLUCION = 'DEVOLUCION',
    PROFORMA = 'PROFORMA',
}

export enum EstadoNota {
    PENDIENTE = 'PENDIENTE',
    CONFIRMADA = 'CONFIRMADA',
    ANULADA = 'ANULADA',
}

export interface DetalleNota {
    id?: number;
    producto: Producto;
    cantidad: number;
    precioUnitario: number;
    descuento: number;
    descuentoPorcentaje?: number;
    descuentoPromocionPorcentaje?: number;
    descuentoPromocion?: number;
    subtotal: number;
    numeroLote?: string;
    fechaVencimiento?: string;
}

export interface Nota {
    id: number;
    numero: string;
    tipo: TipoNota;
    estado: EstadoNota;
    fecha: string;
    subtotal: number;
    descuento: number;
    descuentoPorcentaje?: number;
    descuentoPromocionPorcentaje?: number;
    descuentoPromocion?: number;
    impuesto: number;
    total: number;
    saldo: number;
    observaciones?: string;
    moneda?: 'BOB' | 'USD';
    tipoCambio?: number;
    almacenId?: number;
    almacen?: any;
    conFactura?: boolean;
    numeroFactura?: string;
    tipoPago?: string;
    diasCredito?: number;
    fechaVencimiento?: string;
    cliente?: Cliente;
    proveedor?: Proveedor;
    vendedor?: any;
    usuario?: any;
    sucursal?: any;
    detalles: DetalleNota[];
    costoImportacion?: any;
    creadoEn: string;
}

export const purchaseService = {
    getAll: async () => {
        const response = await apiClient.get<Nota[]>('/notas', {
            params: { tipo: TipoNota.COMPRA },
        });
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Nota>(`/notas/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<Nota>('/notas', { ...data, tipo: TipoNota.COMPRA });
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<Nota>(`/notas/${id}`, { ...data, tipo: TipoNota.COMPRA });
        return response.data;
    },
    confirmar: async (id: number) => {
        const response = await apiClient.put<Nota>(`/notas/${id}/confirmar`);
        return response.data;
    },
    anular: async (id: number) => {
        const response = await apiClient.put<Nota>(`/notas/${id}/anular`);
        return response.data;
    },
    sendWhatsApp: async (id: number, phone?: string, sucursalId?: number, message?: string) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-compra', {
            compraId: id,
            phone,
            sucursalId,
            message,
        });
        return response.data;
    },
};
