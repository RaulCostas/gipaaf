import apiClient from './apiClient';
import type { Persona } from './clientService';

export interface Proveedor {
    id: number;
    persona: Persona;
    empresa?: string;
    ruc?: string;
    observaciones?: string;
    activo: boolean;
    marca?: string;
    pais?: string;
}


const cleanPayload = (data: any) => {
    const payload = JSON.parse(JSON.stringify(data));
    if (payload.persona) {
        if (payload.persona.ci === '') payload.persona.ci = null;
        if (payload.persona.email === '') payload.persona.email = null;
    }
    return payload;
};

export const supplierService = {
    getAll: async (search?: string) => {
        const response = await apiClient.get<Proveedor[]>('/proveedores', {
            params: { search },
        });
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Proveedor>(`/proveedores/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<any>('/proveedores', cleanPayload(data));
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<any>(`/proveedores/${id}`, cleanPayload(data));
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/proveedores/${id}`);
        return response.data;
    },
};
