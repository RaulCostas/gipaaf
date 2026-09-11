import apiClient from './apiClient';
import type { Sucursal } from './sucursalService';
import type { Personal } from './personalService';

export interface Persona {
    id: number;
    nombres: string;
    apellidos: string;
    ci: string;
    telefono: string;
    direccion: string;
    email: string;
    activo: boolean;
}

export interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
    permisos: Permiso[];
}

export interface Permiso {
    id: number;
    nombre: string;
    recurso: string;
    accion: string;
    descripcion: string;
}

export interface Usuario {
    id: number;
    email: string;
    username: string;
    activo: boolean;
    persona: Persona;
    roles: Rol[];
    sucursal: Sucursal | null;
    personal?: Personal | null;
    creadoEn: string;
}

export const userService = {
    getAll: async () => {
        const response = await apiClient.get<Usuario[]>('/usuarios');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Usuario>(`/usuarios/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<Usuario>('/usuarios', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<Usuario>(`/usuarios/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/usuarios/${id}`);
        return response.data;
    },
    cambiarPassword: async (data: { currentPassword: string; newPassword: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string }>('/auth/cambiar-password', data);
        return response.data;
    },
};

export const roleService = {
    getAll: async () => {
        const response = await apiClient.get<Rol[]>('/roles');
        return response.data;
    },
    getOne: async (id: number) => {
        const response = await apiClient.get<Rol>(`/roles/${id}`);
        return response.data;
    },
    create: async (data: any) => {
        const response = await apiClient.post<Rol>('/roles', data);
        return response.data;
    },
    update: async (id: number, data: any) => {
        const response = await apiClient.put<Rol>(`/roles/${id}`, data);
        return response.data;
    },
    delete: async (id: number) => {
        const response = await apiClient.delete(`/roles/${id}`);
        return response.data;
    },
};

export const permissionService = {
    getAll: async () => {
        const response = await apiClient.get<Permiso[]>('/permisos');
        return response.data;
    },
};
