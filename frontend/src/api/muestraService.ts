import apiClient from './apiClient';
import type { Cliente } from './clientService';
import type { Sucursal } from './sucursalService';
import type { Personal } from './personalService';
import type { Usuario } from './userService';
import type { Producto } from './productService';

export type EstadoMuestra = 'ENTREGADO' | 'DEVUELTO_PARCIAL' | 'DEVUELTO_TOTAL' | 'ANULADO';

export interface DetalleMuestra {
    id: number;
    producto: Producto;
    cantidadEntregada: number;
    cantidadDevuelta: number;
    numeroLote?: string;
    fechaVencimiento?: string;
    estado: 'ENTREGADO' | 'DEVUELTO_PARCIAL' | 'DEVUELTO';
    observaciones?: string;
}

export interface Muestra {
    id: number;
    numero: string;
    fecha: string;
    fechaEstimadaDevolucion?: string;
    fechaDevolucion?: string;
    estado: EstadoMuestra;
    cliente: Cliente;
    sucursal?: Sucursal;
    usuario?: Usuario;
    vendedor?: Personal;
    observaciones?: string;
    detalles: DetalleMuestra[];
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateMuestraDto {
    fecha?: string;
    fechaEstimadaDevolucion?: string;
    clienteId: number;
    sucursalId?: number;
    vendedorId?: number;
    observaciones?: string;
    detalles: {
        productoId: number;
        cantidadEntregada: number;
        numeroLote?: string;
        fechaVencimiento?: string;
        observaciones?: string;
    }[];
}

export interface UpdateMuestraDto {
    fecha?: string;
    fechaEstimadaDevolucion?: string;
    clienteId?: number;
    sucursalId?: number;
    vendedorId?: number;
    observaciones?: string;
    detalles?: {
        productoId: number;
        cantidadEntregada: number;
        numeroLote?: string;
        fechaVencimiento?: string;
        observaciones?: string;
    }[];
}

export interface RegistrarDevolucionDto {
    fechaDevolucion?: string;
    observaciones?: string;
    items: {
        id: number;
        cantidadDevuelta: number;
        observaciones?: string;
    }[];
}

export const muestraService = {
    getAll: async (params?: {
        clienteId?: number;
        sucursalId?: number;
        vendedorId?: number;
        estado?: string;
        fechaDesde?: string;
        fechaHasta?: string;
        search?: string;
    }) => {
        const response = await apiClient.get<Muestra[]>('/muestras', { params });
        return response.data;
    },

    getById: async (id: number) => {
        const response = await apiClient.get<Muestra>(`/muestras/${id}`);
        return response.data;
    },

    create: async (data: CreateMuestraDto) => {
        const response = await apiClient.post<Muestra>('/muestras', data);
        return response.data;
    },

    update: async (id: number, data: UpdateMuestraDto) => {
        const response = await apiClient.put<Muestra>(`/muestras/${id}`, data);
        return response.data;
    },

    registrarDevolucion: async (id: number, data: RegistrarDevolucionDto) => {
        const response = await apiClient.put<Muestra>(`/muestras/${id}/devolucion`, data);
        return response.data;
    },

    anular: async (id: number) => {
        const response = await apiClient.put<Muestra>(`/muestras/${id}/anular`);
        return response.data;
    },

    sendWhatsApp: async (muestraId: number, phone?: string, sucursalId?: number, message?: string) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-muestra', {
            muestraId,
            phone,
            sucursalId,
            message,
        });
        return response.data;
    },
};
