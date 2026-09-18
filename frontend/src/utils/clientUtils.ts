import type { Cliente } from '../api/clientService';

/**
 * Retorna el nombre completo de la persona física asociada al cliente
 */
export const getClientPersonName = (cliente?: Partial<Cliente> | null): string => {
    if (!cliente || !cliente.persona) return 'Cliente Final';
    const names = `${cliente.persona.nombres || ''} ${cliente.persona.apellidos || ''}`.trim();
    return names || 'Cliente Final';
};

/**
 * Retorna el nombre de la tienda si existe, o el nombre de la persona
 */
export const getClientDisplayName = (cliente?: Partial<Cliente> | null): string => {
    if (!cliente) return 'Cliente Final';
    if (cliente.nombreTienda && cliente.nombreTienda.trim()) {
        return cliente.nombreTienda.trim();
    }
    const person = getClientPersonName(cliente);
    return person;
};

/**
 * Retorna el nombre de la tienda o vacío si no tiene
 */
export const getClientStoreName = (cliente?: Partial<Cliente> | null): string => {
    return cliente?.nombreTienda?.trim() || '';
};

/**
 * Retorna el CI/NIT de la persona
 */
export const getClientCI = (cliente?: Partial<Cliente> | null): string => {
    return cliente?.persona?.ci?.trim() || '';
};
