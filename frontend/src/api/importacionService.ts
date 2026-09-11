import apiClient from './apiClient';

export interface GastoImportacionItem {
    motivo: string;
    montoUsd?: number;
    montoBob: number;
    porcentaje: number;
}

export interface CostoImportacionData {
    id?: number;
    notaId: number;
    sucursalId?: number;
    usuarioId?: number;
    fecha?: string;
    tipoCambio: number;
    costoFobUsd: number;
    costoFobBob: number;
    totalGastosBob: number;
    costoTotalBob: number;
    porcentajeGastos: number;
    gastos: GastoImportacionItem[];
    monedaGastos?: 'BOB' | 'USD';
    metodoPago?: string;
    referencia?: string;
    comprobanteUrl?: string;
    sucursal?: { id: number; nombre: string };
    usuario?: { id: number; nombre?: string; email?: string };
}

export const importacionService = {
    getAll: async (): Promise<CostoImportacionData[]> => {
        const response = await apiClient.get<CostoImportacionData[]>('/notas/costos-importacion/all');
        return response.data;
    },

    getByNotaId: async (notaId: number): Promise<CostoImportacionData | null> => {
        const response = await apiClient.get<CostoImportacionData>(`/notas/${notaId}/costo-importacion`);
        return response.data;
    },

    guardar: async (notaId: number, data: Partial<CostoImportacionData>): Promise<CostoImportacionData> => {
        const response = await apiClient.post<CostoImportacionData>(`/notas/${notaId}/costo-importacion`, data);
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
