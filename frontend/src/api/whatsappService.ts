import apiClient from './apiClient';

export interface WhatsAppStatus {
    sucursalId?: number;
    sucursalNombre?: string;
    ciudadNombre?: string;
    status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED';
    hasQr: boolean;
    qrCode: string | null;
    user: { id: string; name: string } | null;
    config: WhatsAppConfig;
    logsCount: number;
}

export interface BranchStatusSummary {
    sucursalId: number;
    sucursalNombre: string;
    ciudadNombre?: string;
    status: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED';
    hasQr: boolean;
    qrCode: string | null;
    user: { id: string; name: string } | null;
    botName: string;
    logsCount: number;
}

export interface BankAccountItem {
    id: string;
    banco: string;
    tipoCuenta: string;
    numeroCuenta: string;
    titular: string;
    documentoIdentidad?: string;
    qrImage?: string | null;
    activo?: boolean;
}

export interface WhatsAppConfig {
    sucursalId?: number;
    autoReplyEnabled: boolean;
    ignoreGroups?: boolean;
    allowClientQueries: boolean;
    allowSellerQueries: boolean;
    allowAdminReports: boolean;
    botName: string;
    customWelcomeMessage?: string;
    bankAccountsInfo?: string;
    bankAccounts?: BankAccountItem[];
    customCatalogPdf?: string | null;
    catalogPdfName?: string;
}

export interface WhatsAppMessageLog {
    id: string;
    from: string;
    to: string;
    text: string;
    direction: 'in' | 'out';
    senderName?: string;
    timestamp: string;
}

export const whatsappService = {
    getBranchesStatus: async () => {
        const response = await apiClient.get<BranchStatusSummary[]>('/whatsapp/branches-status');
        return response.data;
    },
    getStatus: async (sucursalId?: number) => {
        const url = sucursalId ? `/whatsapp/status?sucursalId=${sucursalId}` : '/whatsapp/status';
        const response = await apiClient.get<WhatsAppStatus>(url);
        return response.data;
    },
    getQr: async (sucursalId?: number) => {
        const url = sucursalId ? `/whatsapp/qr?sucursalId=${sucursalId}` : '/whatsapp/qr';
        const response = await apiClient.get<{ sucursalId: number; qrCode: string | null; status: string; hasQr: boolean }>(url);
        return response.data;
    },
    connect: async (sucursalId?: number) => {
        const response = await apiClient.post<{ message: string; status: string; sucursalId?: number }>('/whatsapp/connect', { sucursalId });
        return response.data;
    },
    disconnect: async (sucursalId?: number) => {
        const response = await apiClient.post<{ message: string; status: string; sucursalId?: number }>('/whatsapp/disconnect', { sucursalId });
        return response.data;
    },
    getLogs: async (sucursalId?: number, limit = 30) => {
        const url = sucursalId ? `/whatsapp/logs?sucursalId=${sucursalId}&limit=${limit}` : `/whatsapp/logs?limit=${limit}`;
        const response = await apiClient.get<WhatsAppMessageLog[]>(url);
        return response.data;
    },
    getConfig: async (sucursalId?: number) => {
        const url = sucursalId ? `/whatsapp/config?sucursalId=${sucursalId}` : '/whatsapp/config';
        const response = await apiClient.get<WhatsAppConfig>(url);
        return response.data;
    },
    updateConfig: async (config: Partial<WhatsAppConfig>, sucursalId?: number) => {
        const response = await apiClient.put<WhatsAppConfig>('/whatsapp/config', { ...config, sucursalId });
        return response.data;
    },
    sendTestMessage: async (phone: string, message: string, sucursalId?: number) => {
        const response = await apiClient.post<{ message: string }>('/whatsapp/test', {
            phone,
            message,
            sucursalId
        });
        return response.data;
    },
    sendProformaPdf: async (payload: { proformaId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-proforma', payload);
        return response.data;
    },
    sendVentaPdf: async (payload: { ventaId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-venta', payload);
        return response.data;
    },
    sendCobranzaPdf: async (payload: { pagoId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-cobranza', payload);
        return response.data;
    },
    sendCompraPdf: async (payload: { compraId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-compra', payload);
        return response.data;
    },
    sendPagoProveedorPdf: async (payload: { pagoId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-pago-proveedor', payload);
        return response.data;
    },
    sendTraspasoPdf: async (payload: { traspasoId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-traspaso', payload);
        return response.data;
    },
    sendDevolucionPdf: async (payload: { devolucionId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-devolucion', payload);
        return response.data;
    },
    sendMuestraPdf: async (payload: { muestraId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-muestra', payload);
        return response.data;
    },
    sendCarteraVendedorPdf: async (payload: { vendedorId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string; totalSaldo: number; totalClientes: number; totalNotas: number }>('/whatsapp/send-cartera-vendedor', payload);
        return response.data;
    },
    sendEstadoCuentaClientePdf: async (payload: { clienteId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-estado-cuenta-cliente', payload);
        return response.data;
    },
    sendEstadoCuentaVentaPdf: async (payload: { ventaId: number; phone?: string; sucursalId?: number; message?: string }) => {
        const response = await apiClient.post<{ success: boolean; message: string; phone: string }>('/whatsapp/send-estado-cuenta-venta', payload);
        return response.data;
    },
};
