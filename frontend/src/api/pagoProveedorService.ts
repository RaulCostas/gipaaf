import apiClient from './apiClient';
import type { Nota } from './purchaseService';

export interface PagoProveedor {
    id: number;
    nota: Nota;
    proveedor: any;
    monto: number;
    moneda: string;
    tipoCambio: number;
    montoEquivalente: number;
    fecha: string;
    metodoPago: string;
    referencia: string;
    observaciones: string;
    comprobanteUrl?: string;
    activo: boolean;
    creadoEn: string;
}

export const pagoProveedorService = {
    getAll: async () => {
        const response = await apiClient.get<PagoProveedor[]>('/pagos-proveedores');
        return response.data;
    },
    getDeudas: async (proveedorId?: number) => {
        const response = await apiClient.get<Nota[]>('/pagos-proveedores/deudas', { params: { proveedorId } });
        return response.data;
    },
    getByNota: async (notaId: number) => {
        const response = await apiClient.get<PagoProveedor[]>(`/pagos-proveedores/nota/${notaId}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<PagoProveedor>('/pagos-proveedores', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<PagoProveedor>(`/pagos-proveedores/${id}`, data);
        return response.data;
    },
    anular: async (id: number) => {
        const response = await apiClient.put<PagoProveedor>(`/pagos-proveedores/${id}/anular`);
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
    },
    sendWhatsApp: async (id: number, phone?: string, sucursalId?: number, message?: string) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-pago-proveedor', {
            pagoId: id,
            phone,
            sucursalId,
            message,
        });
        return response.data;
    },
};
