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
};
