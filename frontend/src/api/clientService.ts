import apiClient from './apiClient';
import type { Sucursal } from './sucursalService';
import type { Ruta } from './rutaService';

export interface Persona {
    id: number;
    nombres: string;
    apellidos: string;
    ci?: string;
    telefono?: string;
    direccion?: string;
    email?: string;
    activo: boolean;
}

export interface Cliente {
    id: number;
    persona: Persona;
    creditoDisponible: number;
    deudaActual?: number;
    codigo?: string;
    plazoCreditoDias?: number;
    limiteCredito: number;
    observaciones?: string;
    latitud?: number | null;
    longitud?: number | null;
    ruta?: Partial<Ruta> & { vendedor?: any };
    sucursal?: Partial<Sucursal>;
    activo: boolean;
}


const cleanPayload = (data: any) => {
    const payload = JSON.parse(JSON.stringify(data));
    if (payload.persona) {
        if (payload.persona.ci === '') payload.persona.ci = null;
        if (payload.persona.email === '') payload.persona.email = null;
    }
    return payload;
};

export const clientService = {
    getAll: async (search?: string) => {
        const response = await apiClient.get<Cliente[]>('/clientes', {
            params: { search },
        });
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Cliente>(`/clientes/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<any>('/clientes', cleanPayload(data));
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<any>(`/clientes/${id}`, cleanPayload(data));
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/clientes/${id}`);
        return response.data;
    },
};
