import apiClient from './apiClient';
import type { Sucursal } from './sucursalService';
import type { Producto } from './productService';

export interface DetalleTraspaso {
    id?: number;
    producto: Producto;
    cantidad: number;
    numeroLote?: string;
    fechaVencimiento?: string;
    lotesDetalle?: string;
    observacion?: string;
}

export interface Traspaso {
    id: number;
    codigo: string;
    fecha: string;
    sucursalOrigen: Sucursal;
    sucursalDestino: Sucursal;
    almacenOrigen?: Sucursal; // For backwards compatibility
    almacenDestino?: Sucursal; // For backwards compatibility
    costoTransporte: number;
    sucursalCargoCosto?: 'ORIGEN' | 'DESTINO';
    egreso?: any;
    motivo: string;
    observaciones: string;
    estado: 'COMPLETADO' | 'ANULADO';
    usuario?: any;
    detalles: DetalleTraspaso[];
    activo: boolean;
    creadoEn: string;
    actualizadoEn?: string;
}

export interface CreateTraspasoDto {
    codigo?: string;
    fecha?: string;
    sucursalOrigenId?: number;
    sucursalDestinoId?: number;
    almacenOrigenId?: number;
    almacenDestinoId?: number;
    costoTransporte?: number;
    sucursalCargoCosto?: 'ORIGEN' | 'DESTINO';
    motivo?: string;
    observaciones?: string;
    detalles: {
        productoId: number;
        cantidad: number;
        numeroLote?: string;
        observacion?: string;
    }[];
}

export const traspasoService = {
    getAll: async () => {
        const response = await apiClient.get<Traspaso[]>('/traspasos');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get<Traspaso>(`/traspasos/${id}`);
        return response.data;
    },
    create: async (data: CreateTraspasoDto) => {
        const response = await apiClient.post<Traspaso>('/traspasos', data);
        return response.data;
    },
    update: async (id: number, data: CreateTraspasoDto) => {
        const response = await apiClient.put<Traspaso>(`/traspasos/${id}`, data);
        return response.data;
    },
    anular: async (id: number) => {
        const response = await apiClient.put<Traspaso>(`/traspasos/${id}/anular`);
        return response.data;
    },
    sendWhatsApp: async (id: number, phone?: string, sucursalId?: number, message?: string) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-traspaso', {
            traspasoId: id,
            phone,
            sucursalId,
            message,
        });
        return response.data;
    },
};
