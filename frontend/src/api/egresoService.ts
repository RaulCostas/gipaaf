import apiClient from './apiClient';
import type { Sucursal } from './sucursalService';

export interface Egreso {
    id: number;
    codigo: string;
    fecha: string;
    detalle: string;
    monto: number;
    moneda: 'BOB' | 'USD';
    tipoCambio: number;
    montoEquivalente: number;
    formaPago: string;
    nroComprobante?: string;
    comprobanteUrl?: string;
    observaciones?: string;
    sucursal?: Sucursal;
    sucursalId?: number;
    usuario?: any;
    usuarioId?: number;
    activo: boolean;
    creadoEn: string;
    actualizadoEn?: string;
    eliminadoEn?: string;
}

export interface CreateEgresoDto {
    codigo?: string;
    fecha?: string;
    detalle: string;
    monto: number;
    moneda?: 'BOB' | 'USD';
    tipoCambio?: number;
    formaPago?: string;
    nroComprobante?: string;
    comprobanteUrl?: string;
    observaciones?: string;
    sucursalId?: number;
    activo?: boolean;
}

export const egresoService = {
    getAll: async () => {
        const response = await apiClient.get<Egreso[]>('/egresos');
        return response.data;
    },
    getById: async (id: number) => {
        const response = await apiClient.get<Egreso>(`/egresos/${id}`);
        return response.data;
    },
    create: async (data: CreateEgresoDto) => {
        const response = await apiClient.post<Egreso>('/egresos', data);
        return response.data;
    },
    update: async (id: number, data: Partial<CreateEgresoDto>) => {
        const response = await apiClient.put<Egreso>(`/egresos/${id}`, data);
        return response.data;
    },
    anular: async (id: number) => {
        const response = await apiClient.put<Egreso>(`/egresos/${id}/anular`);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete<Egreso>(`/egresos/${id}`);
        return response.data;
    },
    uploadComprobante: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await apiClient.post<{ url?: string; error?: string; message?: string }>('/uploads', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }
};
