import apiClient from './apiClient';
import type { Nota } from './purchaseService';

export interface PagoCobranza {
    id: number;
    nota: Nota;
    cliente: any;
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

export const cobranzaService = {
    getAll: async () => {
        const response = await apiClient.get<PagoCobranza[]>('/cobranzas');
        return response.data;
    },
    getDeudas: async (clienteId?: number) => {
        const response = await apiClient.get<Nota[]>('/cobranzas/deudas', { params: { clienteId } });
        return response.data;
    },
    getByNota: async (notaId: number) => {
        const response = await apiClient.get<PagoCobranza[]>(`/cobranzas/nota/${notaId}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<PagoCobranza>('/cobranzas', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<PagoCobranza>(`/cobranzas/${id}`, data);
        return response.data;
    },
    anular: async (id: number) => {
        const response = await apiClient.put<PagoCobranza>(`/cobranzas/${id}/anular`);
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
    sendWhatsApp: async (pagoId: number, phone?: string, message?: string, sucursalId?: number) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-cobranza', {
            pagoId,
            phone,
            message,
            sucursalId
        });
        return response.data;
    }
};
