import apiClient from './apiClient';
import type { Nota } from './purchaseService';
import { TipoNota } from './purchaseService';

export const returnService = {
    getAll: async () => {
        const response = await apiClient.get<Nota[]>('/notas', {
            params: { tipo: TipoNota.DEVOLUCION },
        });
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Nota>(`/notas/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<Nota>('/notas', { ...data, tipo: TipoNota.DEVOLUCION });
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<Nota>(`/notas/${id}`, { ...data, tipo: TipoNota.DEVOLUCION });
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
};
