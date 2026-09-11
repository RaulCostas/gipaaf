import apiClient from './apiClient';

export interface Ciudad {
  id: number;
  nombre: string;
  activo: boolean;
  creadoEn: string;
}

export const getCiudades = async (): Promise<Ciudad[]> => {
  const { data } = await apiClient.get('/ciudades');
  return data;
};

export const getCiudad = async (id: number): Promise<Ciudad> => {
  const { data } = await apiClient.get(`/ciudades/${id}`);
  return data;
};

export const createCiudad = async (ciudad: Partial<Ciudad>): Promise<Ciudad> => {
  const { data } = await apiClient.post('/ciudades', ciudad);
  return data;
};

export const updateCiudad = async (id: number, ciudad: Partial<Ciudad>): Promise<Ciudad> => {
  const { data } = await apiClient.put(`/ciudades/${id}`, ciudad);
  return data;
};

export const deleteCiudad = async (id: number): Promise<void> => {
  await apiClient.delete(`/ciudades/${id}`);
};
