import apiClient from './apiClient';

export interface FiltrosReporte {
    clienteId?: number;
    estado?: string;
    metodoPago?: string;
    fechaDesde?: string;
    fechaHasta?: string;
}

export interface ReporteCobranzaItem {
    id: number;
    fecha: string;
    cliente: string;
    monto: number;
    estado: string;
    metodoPago: string;
    referencia?: string;
}

export const reportesService = {
    // Simulando el endpoint hasta que el backend esté listo
    getCobranzas: async (filtros?: FiltrosReporte): Promise<ReporteCobranzaItem[]> => {
        try {
            // Intenta llamar al backend
            const response = await apiClient.get<ReporteCobranzaItem[]>('/reportes/cobranzas', { params: filtros });
            return response.data;
        } catch (error) {
            // Mock de datos si el endpoint no existe
            console.warn("Endpoint de reportes no listo, retornando mock data");
            return [
                { id: 1, fecha: '2023-10-01', cliente: 'Juan Perez', monto: 1500, estado: 'Pagado', metodoPago: 'Transferencia', referencia: 'TRX-001' },
                { id: 2, fecha: '2023-10-05', cliente: 'Maria Lopez', monto: 300, estado: 'Pendiente', metodoPago: 'Efectivo', referencia: '' },
                { id: 3, fecha: '2023-10-10', cliente: 'Carlos Ruiz', monto: 2500, estado: 'Pagado', metodoPago: 'Tarjeta', referencia: 'CC-9902' },
            ];
        }
    }
};
