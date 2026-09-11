import apiClient from './apiClient';

export interface UtilidadesDataResponse {
    cobranzas: any[];
    pagosProveedores: any[];
    egresos: any[];
    costosImportacion: any[];
    traspasos: any[];
}

export const utilidadesService = {
    getData: async (): Promise<UtilidadesDataResponse> => {
        const res = await apiClient.get<UtilidadesDataResponse>('/notas/utilidades/data');
        return res.data;
    },
};
