import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, MoreThan, Brackets } from 'typeorm';
import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    WASocket,
} from '@whiskeysockets/baileys';
import pino from 'pino';
import * as QRCode from 'qrcode';
import * as path from 'path';
import * as fs from 'fs';
import PDFDocument from 'pdfkit';

// Entities
import { Producto } from '../productos/producto.entity';
import { Inventario } from '../inventario/inventario.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Nota, EstadoNota, TipoNota } from '../notas/nota.entity';
import { Personal, Cargo } from '../personal/personal.entity';
import { Ruta } from '../rutas/ruta.entity';
import { PagoCobranza } from '../cobranzas/pago.entity';
import { Egreso } from '../egresos/egreso.entity';
import { CuentaBancariaBot } from './cuenta-bancaria-bot.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { PagoProveedor } from '../pagos-proveedores/pago-proveedor.entity';
import { CostoImportacion } from '../notas/costo-importacion.entity';
import { Traspaso } from '../traspasos/traspaso.entity';

export interface WhatsAppMessageLog {
    id: string;
    from: string;
    to: string;
    text: string;
    direction: 'in' | 'out';
    senderName?: string;
    timestamp: Date;
    status?: string;
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

export interface UserSession {
    state: string;
    data?: any;
    expiresAt: number;
}

export interface WhatsAppConfig {
    autoReplyEnabled: boolean;
    ignoreGroups: boolean;
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

export interface BranchSession {
    sucursalId: number;
    sucursalNombre: string;
    ciudadNombre?: string;
    sock: WASocket | null;
    connectionStatus: 'DISCONNECTED' | 'CONNECTING' | 'QR_READY' | 'CONNECTED';
    currentQrCode: string | null;
    connectedUser: { id: string; name: string } | null;
    isManualDisconnect: boolean;
    authDir: string;
    configFile: string;
    config: WhatsAppConfig;
    messageLogs: WhatsAppMessageLog[];
    userSessions: Map<string, UserSession>;
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

@Injectable()
export class WhatsAppService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(WhatsAppService.name);
    private sessions: Map<number, BranchSession> = new Map();
    private baseAuthDir = path.join(process.cwd(), 'whatsapp_auth');

    constructor(
        @InjectRepository(Producto)
        private productoRepo: Repository<Producto>,
        @InjectRepository(Inventario)
        private inventarioRepo: Repository<Inventario>,
        @InjectRepository(Cliente)
        private clienteRepo: Repository<Cliente>,
        @InjectRepository(Nota)
        private notaRepo: Repository<Nota>,
        @InjectRepository(Personal)
        private personalRepo: Repository<Personal>,
        @InjectRepository(Ruta)
        private rutaRepo: Repository<Ruta>,
        @InjectRepository(PagoCobranza)
        private pagoCobranzaRepo: Repository<PagoCobranza>,
        @InjectRepository(Egreso)
        private egresoRepo: Repository<Egreso>,
        @InjectRepository(CuentaBancariaBot)
        private cuentaBancariaRepo: Repository<CuentaBancariaBot>,
        @InjectRepository(Sucursal)
        private sucursalRepo: Repository<Sucursal>,
        @InjectRepository(PagoProveedor)
        private pagoProveedorRepo: Repository<PagoProveedor>,
        @InjectRepository(CostoImportacion)
        private costoImportacionRepo: Repository<CostoImportacion>,
        @InjectRepository(Traspaso)
        private traspasoRepo: Repository<Traspaso>,
    ) {}

    async onModuleInit() {
        if (!fs.existsSync(this.baseAuthDir)) {
            fs.mkdirSync(this.baseAuthDir, { recursive: true });
        }

        // Seed bank accounts in DB if empty
        try {
            const count = await this.cuentaBancariaRepo.count();
            if (count === 0) {
                await this.cuentaBancariaRepo.save([
                    {
                        banco: 'Banco Nacional de Bolivia (BNB)',
                        tipoCuenta: 'Cuenta Corriente BOB',
                        numeroCuenta: '100-01928374',
                        titular: 'GIPAAF S.R.L.',
                        documentoIdentidad: 'NIT: 1029384756',
                        qrImage: null,
                        activo: true,
                        orden: 1
                    },
                    {
                        banco: 'Banco de Crédito de Bolivia (BCP)',
                        tipoCuenta: 'Cuenta Corriente BOB',
                        numeroCuenta: '201-50982736',
                        titular: 'GIPAAF S.R.L.',
                        documentoIdentidad: 'NIT: 1029384756',
                        qrImage: null,
                        activo: true,
                        orden: 2
                    }
                ]);
                this.logger.log('Cuentas bancarias iniciales creadas en PostgreSQL.');
            }
        } catch (dbErr) {
            this.logger.error('Error al verificar/sembrar cuentas bancarias en BD:', dbErr);
        }

        // Initialize sessions for all active sucursales
        try {
            const sucursales = await this.sucursalRepo.find({
                where: { activo: true },
                relations: ['ciudad'],
                order: { id: 'ASC' }
            });

            for (const s of sucursales) {
                const session = await this.getOrCreateSession(s.id);
                const credsFile = path.join(session.authDir, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    this.logger.log(`Credenciales encontradas para sucursal "${s.nombre}" (ID: ${s.id}). Autoconectando WhatsApp...`);
                    this.connectToWhatsApp(s.id).catch(err => {
                        this.logger.error(`Error al autoconectar WhatsApp en sucursal ${s.nombre}:`, err);
                    });
                }
            }
        } catch (initErr) {
            this.logger.error('Error al inicializar sesiones de sucursales en WhatsAppService:', initErr);
        }
    }

    async onModuleDestroy() {
        for (const [sucursalId, session] of this.sessions.entries()) {
            if (session.sock) {
                try {
                    session.sock.end(undefined);
                } catch (e) {}
            }
        }
    }

    // ==========================================
    // GESTIÓN DE SESIONES POR SUCURSAL
    // ==========================================
    private async getOrCreateSession(sucursalId?: number): Promise<BranchSession> {
        let targetId = sucursalId;

        // If no sucursalId specified, find first active sucursal
        if (!targetId || isNaN(targetId) || targetId <= 0) {
            const firstSuc = await this.sucursalRepo.findOne({
                where: { activo: true },
                relations: ['ciudad'],
                order: { id: 'ASC' }
            });
            targetId = firstSuc ? firstSuc.id : 1;
        }

        if (this.sessions.has(targetId)) {
            return this.sessions.get(targetId)!;
        }

        const sucursal = await this.sucursalRepo.findOne({
            where: { id: targetId },
            relations: ['ciudad']
        });

        const sucursalNombre = sucursal?.nombre || `Sucursal #${targetId}`;
        const ciudadNombre = sucursal?.ciudad?.nombre || '';
        const authDir = path.join(this.baseAuthDir, `sucursal_${targetId}`);
        const configFile = path.join(process.cwd(), `whatsapp_config_sucursal_${targetId}.json`);

        if (!fs.existsSync(authDir)) {
            fs.mkdirSync(authDir, { recursive: true });
        }

        const defaultConfig: WhatsAppConfig = {
            autoReplyEnabled: true,
            ignoreGroups: true,
            allowClientQueries: true,
            allowSellerQueries: true,
            allowAdminReports: true,
            botName: `GIPAAF Bot (${sucursalNombre})`,
            customWelcomeMessage: `¡Hola! Bienvenido al canal oficial de *GIPAAF - ${sucursalNombre}*.`,
            bankAccountsInfo: `*CUENTAS BANCARIAS OFICIALES - GIPAAF*\n\n` +
                `🏦 *Banco Nacional de Bolivia (BNB)*\n` +
                `• Cuenta Corriente BOB: 100-01928374\n` +
                `• Titular: GIPAAF S.R.L. - NIT: 1029384756\n\n` +
                `🏦 *Banco de Crédito de Bolivia (BCP)*\n` +
                `• Cuenta Corriente BOB: 201-50982736\n` +
                `• Titular: GIPAAF S.R.L. - NIT: 1029384756\n\n` +
                `📌 _Una vez realizada tu transferencia, envía la foto del comprobante aquí para su validación._`,
            bankAccounts: []
        };

        // Load config from file if exists
        let loadedConfig = { ...defaultConfig };
        try {
            if (fs.existsSync(configFile)) {
                const raw = fs.readFileSync(configFile, 'utf-8');
                const parsed = JSON.parse(raw);
                loadedConfig = { ...loadedConfig, ...parsed };
            } else {
                // Check if old global config file exists and import
                const oldConfigFile = path.join(process.cwd(), 'whatsapp_config.json');
                if (fs.existsSync(oldConfigFile)) {
                    const raw = fs.readFileSync(oldConfigFile, 'utf-8');
                    const parsed = JSON.parse(raw);
                    loadedConfig = { ...loadedConfig, ...parsed };
                }
            }
        } catch (e) {
            this.logger.error(`Error al cargar configuración para sucursal ${targetId}:`, e);
        }

        const newSession: BranchSession = {
            sucursalId: targetId,
            sucursalNombre,
            ciudadNombre,
            sock: null,
            connectionStatus: 'DISCONNECTED',
            currentQrCode: null,
            connectedUser: null,
            isManualDisconnect: false,
            authDir,
            configFile,
            config: loadedConfig,
            messageLogs: [],
            userSessions: new Map()
        };

        this.sessions.set(targetId, newSession);
        return newSession;
    }

    private saveSessionConfig(session: BranchSession) {
        try {
            fs.writeFileSync(session.configFile, JSON.stringify(session.config, null, 2), 'utf-8');
            this.logger.log(`Configuración guardada para sucursal ${session.sucursalNombre} (ID: ${session.sucursalId}).`);
        } catch (e) {
            this.logger.error(`Error al guardar configuración de sucursal ${session.sucursalId}:`, e);
        }
    }

    // ==========================================
    // API ENDPOINTS HANDLERS
    // ==========================================
    async getBranchesStatus(): Promise<BranchStatusSummary[]> {
        const sucursales = await this.sucursalRepo.find({
            where: { activo: true },
            relations: ['ciudad'],
            order: { id: 'ASC' }
        });

        const list: BranchStatusSummary[] = [];

        for (const s of sucursales) {
            const session = await this.getOrCreateSession(s.id);
            list.push({
                sucursalId: s.id,
                sucursalNombre: s.nombre,
                ciudadNombre: s.ciudad?.nombre,
                status: session.connectionStatus,
                hasQr: !!session.currentQrCode,
                qrCode: session.currentQrCode,
                user: session.connectedUser,
                botName: session.config.botName,
                logsCount: session.messageLogs.length
            });
        }

        return list;
    }

    async getStatus(sucursalId?: number) {
        const session = await this.getOrCreateSession(sucursalId);
        let dbAccounts: BankAccountItem[] = [];
        try {
            const rawAccounts = await this.cuentaBancariaRepo.find({ order: { orden: 'ASC', id: 'ASC' } });
            dbAccounts = rawAccounts.map(a => ({
                id: String(a.id),
                banco: a.banco,
                tipoCuenta: a.tipoCuenta,
                numeroCuenta: a.numeroCuenta,
                titular: a.titular,
                documentoIdentidad: a.documentoIdentidad,
                qrImage: a.qrImage,
                activo: a.activo
            }));
        } catch (e) {
            this.logger.error('Error al consultar cuentas bancarias en BD:', e);
        }

        return {
            sucursalId: session.sucursalId,
            sucursalNombre: session.sucursalNombre,
            ciudadNombre: session.ciudadNombre,
            status: session.connectionStatus,
            hasQr: !!session.currentQrCode,
            qrCode: session.currentQrCode,
            user: session.connectedUser,
            config: {
                ...session.config,
                bankAccounts: dbAccounts
            },
            logsCount: session.messageLogs.length,
        };
    }

    async getQr(sucursalId?: number) {
        const session = await this.getOrCreateSession(sucursalId);
        return {
            sucursalId: session.sucursalId,
            qrCode: session.currentQrCode,
            status: session.connectionStatus,
            hasQr: !!session.currentQrCode
        };
    }

    async getLogs(sucursalId?: number, limit = 30): Promise<WhatsAppMessageLog[]> {
        const session = await this.getOrCreateSession(sucursalId);
        return session.messageLogs.slice(-limit).reverse();
    }

    async getConfig(sucursalId?: number): Promise<WhatsAppConfig> {
        const session = await this.getOrCreateSession(sucursalId);
        let dbAccounts: BankAccountItem[] = [];
        try {
            const rawAccounts = await this.cuentaBancariaRepo.find({ order: { orden: 'ASC', id: 'ASC' } });
            dbAccounts = rawAccounts.map(a => ({
                id: String(a.id),
                banco: a.banco,
                tipoCuenta: a.tipoCuenta,
                numeroCuenta: a.numeroCuenta,
                titular: a.titular,
                documentoIdentidad: a.documentoIdentidad,
                qrImage: a.qrImage,
                activo: a.activo
            }));
        } catch (e) {
            this.logger.error('Error al obtener cuentas bancarias para configuración:', e);
        }

        return {
            ...session.config,
            bankAccounts: dbAccounts
        };
    }

    async updateConfig(sucursalId: number | undefined, newConfig: Partial<WhatsAppConfig>): Promise<WhatsAppConfig> {
        const session = await this.getOrCreateSession(sucursalId);
        
        // Manejar subida o eliminación de Catálogo PDF personalizado
        if (newConfig.customCatalogPdf !== undefined) {
            const pdfFilePath = path.join(session.authDir, 'catalog.pdf');
            if (newConfig.customCatalogPdf && (newConfig.customCatalogPdf.startsWith('data:application/pdf') || newConfig.customCatalogPdf.includes('base64,'))) {
                try {
                    const base64Data = newConfig.customCatalogPdf.includes('base64,') 
                        ? newConfig.customCatalogPdf.split('base64,')[1] 
                        : newConfig.customCatalogPdf;
                    fs.writeFileSync(pdfFilePath, Buffer.from(base64Data, 'base64'));
                    session.config.customCatalogPdf = 'FILE_SAVED';
                    session.config.catalogPdfName = newConfig.catalogPdfName || 'Catalogo_Oficial.pdf';
                    this.logger.log(`Catálogo PDF oficial guardado en disco para sucursal ${session.sucursalNombre} (${pdfFilePath})`);
                } catch (pdfErr) {
                    this.logger.error(`Error al guardar archivo PDF en disco para sucursal ${session.sucursalId}:`, pdfErr);
                }
            } else if (newConfig.customCatalogPdf === null || newConfig.customCatalogPdf === '') {
                if (fs.existsSync(pdfFilePath)) {
                    try { fs.unlinkSync(pdfFilePath); } catch (e) {}
                }
                session.config.customCatalogPdf = null;
                session.config.catalogPdfName = undefined;
                this.logger.log(`Catálogo PDF personalizado eliminado para sucursal ${session.sucursalNombre}. Se usará generador dinámico.`);
            }
        }

        // Actualizar resto de propiedades excluyendo el customCatalogPdf crudo
        const { customCatalogPdf, ...otherConfig } = newConfig;
        session.config = { ...session.config, ...otherConfig };
        this.saveSessionConfig(session);

        if (Array.isArray(newConfig.bankAccounts)) {
            try {
                const currentAccounts = await this.cuentaBancariaRepo.find();
                const incomingIds = new Set<number>();

                for (let i = 0; i < newConfig.bankAccounts.length; i++) {
                    const item = newConfig.bankAccounts[i];
                    const numericId = item.id && !isNaN(Number(item.id)) && Number(item.id) > 0 ? Number(item.id) : null;

                    let accEntity: CuentaBancariaBot | null = null;
                    if (numericId) {
                        accEntity = currentAccounts.find(a => a.id === numericId) || null;
                    }

                    if (!accEntity) {
                        accEntity = new CuentaBancariaBot();
                    }

                    accEntity.banco = item.banco || 'Banco';
                    accEntity.tipoCuenta = item.tipoCuenta || 'Cuenta Bancaria';
                    accEntity.numeroCuenta = item.numeroCuenta || '';
                    accEntity.titular = item.titular || '';
                    accEntity.documentoIdentidad = item.documentoIdentidad || '';
                    accEntity.qrImage = item.qrImage || null;
                    accEntity.activo = item.activo !== false;
                    accEntity.orden = i + 1;

                    const saved = await this.cuentaBancariaRepo.save(accEntity);
                    incomingIds.add(saved.id);
                }

                // Delete accounts removed by user in UI
                for (const cur of currentAccounts) {
                    if (!incomingIds.has(cur.id)) {
                        await this.cuentaBancariaRepo.delete(cur.id);
                    }
                }
                this.logger.log(`Cuentas bancarias actualizadas en PostgreSQL (${newConfig.bankAccounts.length} cuentas procesadas).`);
            } catch (dbErr) {
                this.logger.error('Error al guardar cuentas bancarias en PostgreSQL:', dbErr);
            }
        }

        return await this.getConfig(session.sucursalId);
    }

    async connectToWhatsApp(sucursalId?: number): Promise<void> {
        const session = await this.getOrCreateSession(sucursalId);

        if (session.connectionStatus === 'CONNECTED' || session.connectionStatus === 'CONNECTING') {
            return;
        }

        session.isManualDisconnect = false;
        session.connectionStatus = 'CONNECTING';

        try {
            const { state, saveCreds } = await useMultiFileAuthState(session.authDir);

            session.sock = makeWASocket({
                auth: state,
                printQRInTerminal: false,
                logger: pino({ level: 'silent' }) as any,
                browser: [`GIPAAF ERP (${session.sucursalNombre})`, 'Chrome', '1.0.0'],
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
            });

            session.sock.ev.on('creds.update', saveCreds);

            session.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;

                if (qr) {
                    try {
                        session.currentQrCode = await QRCode.toDataURL(qr);
                        session.connectionStatus = 'QR_READY';
                        this.logger.log(`Nuevo código QR generado para vinculación de WhatsApp en sucursal "${session.sucursalNombre}" (ID: ${session.sucursalId})`);
                    } catch (qrErr) {
                        this.logger.error(`Error al generar código QR en Base64 para sucursal ${session.sucursalId}:`, qrErr);
                    }
                }

                if (connection === 'close') {
                    const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
                    const shouldReconnect = statusCode !== DisconnectReason.loggedOut && !session.isManualDisconnect;

                    this.logger.warn(`Conexión de WhatsApp cerrada en sucursal ${session.sucursalNombre}. Razón: ${statusCode}, Reconectar: ${shouldReconnect}`);
                    session.connectionStatus = 'DISCONNECTED';
                    session.currentQrCode = null;
                    session.connectedUser = null;

                    if (statusCode === DisconnectReason.loggedOut) {
                        this.logger.log(`Sesión cerrada desde el teléfono en sucursal ${session.sucursalNombre}. Limpiando credenciales...`);
                        this.clearBranchAuthDir(session);
                    } else if (shouldReconnect) {
                        setTimeout(() => this.connectToWhatsApp(session.sucursalId), 4000);
                    }
                } else if (connection === 'open') {
                    session.connectionStatus = 'CONNECTED';
                    session.currentQrCode = null;
                    const userPhone = session.sock?.user?.id ? session.sock.user.id.split(':')[0] : 'Desconocido';
                    session.connectedUser = {
                        id: userPhone,
                        name: session.sock?.user?.name || `WhatsApp (+${userPhone})`,
                    };
                    this.logger.log(`¡WhatsApp Conectado exitosamente en sucursal "${session.sucursalNombre}" como ${session.connectedUser.name} (+${userPhone})!`);
                }
            });

            session.sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return;
                for (const m of messages) {
                    if (!m.message || m.key.fromMe) continue;
                    const jid = m.key.remoteJid;
                    if (!jid) continue;

                    // Restricción estricta de Grupos, Canales y Listas de Difusión
                    const isGroup = jid.endsWith('@g.us') || jid.includes('@g.us') || !!m.key.participant;
                    const isBroadcast = jid.endsWith('@broadcast') || jid.includes('@broadcast');
                    const isNewsletter = jid.endsWith('@newsletter') || jid.includes('@newsletter');

                    if (isBroadcast || isNewsletter) continue;
                    if (session.config.ignoreGroups && isGroup) continue;

                    const msg = m.message;
                    const text = msg?.conversation ||
                        msg?.extendedTextMessage?.text ||
                        msg?.imageMessage?.caption ||
                        msg?.videoMessage?.caption ||
                        msg?.ephemeralMessage?.message?.conversation ||
                        msg?.ephemeralMessage?.message?.extendedTextMessage?.text ||
                        msg?.viewOnceMessage?.message?.conversation ||
                        msg?.viewOnceMessage?.message?.extendedTextMessage?.text ||
                        msg?.viewOnceMessageV2?.message?.conversation ||
                        msg?.viewOnceMessageV2?.message?.extendedTextMessage?.text ||
                        msg?.documentWithCaptionMessage?.message?.documentMessage?.caption;

                    if (!text || !text.trim()) continue;

                    const pushName = m.pushName || 'Usuario';
                    this.logBranchMessage(session, {
                        id: m.key.id || String(Date.now()),
                        from: jid,
                        to: 'BOT',
                        text: text.trim(),
                        direction: 'in',
                        senderName: pushName,
                        timestamp: new Date()
                    });

                    if (session.config.autoReplyEnabled) {
                        this.handleIncomingMessage(session, jid, text.trim(), pushName).catch(err => {
                            this.logger.error(`Error procesando mensaje de ${jid} en sucursal ${session.sucursalNombre}:`, err);
                        });
                    }
                }
            });

        } catch (error) {
            this.logger.error(`Error al inicializar Baileys en sucursal ${session.sucursalNombre}:`, error);
            session.connectionStatus = 'DISCONNECTED';
        }
    }

    async disconnect(sucursalId?: number): Promise<void> {
        const session = await this.getOrCreateSession(sucursalId);
        session.isManualDisconnect = true;
        if (session.sock) {
            try {
                session.sock.end(undefined);
            } catch (e) {}
            session.sock = null;
        }
        session.connectionStatus = 'DISCONNECTED';
        session.currentQrCode = null;
        session.connectedUser = null;
        this.clearBranchAuthDir(session);
    }

    private clearBranchAuthDir(session: BranchSession) {
        try {
            if (fs.existsSync(session.authDir)) {
                fs.rmSync(session.authDir, { recursive: true, force: true });
                fs.mkdirSync(session.authDir, { recursive: true });
            }
        } catch (e) {
            this.logger.error(`Error al limpiar directorio de autenticación para sucursal ${session.sucursalId}:`, e);
        }
    }

    private logBranchMessage(session: BranchSession, msg: WhatsAppMessageLog) {
        session.messageLogs.push(msg);
        if (session.messageLogs.length > 100) {
            session.messageLogs.shift();
        }
    }

    private resolvePhoneNumberFromJid(session: BranchSession, jid: string): string | null {
        if (!jid) return null;
        if (jid.endsWith('@s.whatsapp.net')) {
            return jid.split('@')[0].split(':')[0].replace(/\D/g, '');
        }
        if (jid.endsWith('@lid')) {
            const lid = jid.split('@')[0].split(':')[0].replace(/\D/g, '');
            const mappingFile = path.join(session.authDir, `lid-mapping-${lid}_reverse.json`);
            if (fs.existsSync(mappingFile)) {
                try {
                    const content = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
                    if (content) return String(content).replace(/\D/g, '');
                } catch (e) {}
            }
        }
        return null;
    }

    // ==========================================
    // ENVÍO DE MENSAJES MANUAL / EXTERNO
    // ==========================================
    async sendMessage(target: string, text: string, sucursalId?: number): Promise<boolean> {
        const session = await this.getOrCreateSession(sucursalId);
        if (!session.sock || session.connectionStatus !== 'CONNECTED') {
            throw new Error(`WhatsApp no está conectado en la sucursal ${session.sucursalNombre}`);
        }

        let jid = target.trim();
        if (!jid.includes('@')) {
            let cleanedPhone = jid.replace(/\D/g, '');
            if (cleanedPhone.length === 8) {
                cleanedPhone = `591${cleanedPhone}`;
            }
            jid = `${cleanedPhone}@s.whatsapp.net`;
        }

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 2000));
        } catch (e) {}

        await session.sock.sendMessage(jid, { text });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text,
            direction: 'out',
            timestamp: new Date()
        });

        return true;
    }

    async sendTestMessage(phone: string, message: string, sucursalId?: number): Promise<boolean> {
        return await this.sendMessage(phone, message, sucursalId);
    }

    // ==========================================
    // PROCESAMIENTO INTELIGENTE DE MENSAJES (BOT)
    // ==========================================
    private async handleIncomingMessage(session: BranchSession, jid: string, rawText: string, pushName: string) {
        if (!session.sock) return;
        if (!jid) return;

        // Solo responder en chats directos privados
        const isGroup = jid.endsWith('@g.us') || jid.includes('@g.us');
        const isBroadcast = jid.endsWith('@broadcast') || jid.includes('@broadcast');
        const isNewsletter = jid.endsWith('@newsletter') || jid.includes('@newsletter');
        if (isBroadcast || isNewsletter) return;
        if (session.config.ignoreGroups && isGroup) return;

        // Extraer identificadores y resolver número real de teléfono
        const resolvedPhone = this.resolvePhoneNumberFromJid(session, jid);
        const digitsOnly = resolvedPhone 
            ? resolvedPhone.replace(/\D/g, '') 
            : jid.split('@')[0].split(':')[0].replace(/\D/g, '');
        const last8 = digitsOnly.length >= 8 ? digitsOnly.slice(-8) : digitsOnly;

        this.logger.log(`[Sucursal ${session.sucursalNombre}] Mensaje de ${jid} (Tel: ${digitsOnly}, Last8: ${last8}, PushName: ${pushName})`);

        // 1. Identificar si es Personal o Cliente
        let personal = await this.personalRepo.findOne({
            where: [
                { telefono: ILike(`%${last8}%`), activo: true },
                { telefono: ILike(`%${digitsOnly}%`), activo: true }
            ],
            relations: ['sucursal', 'sucursal.ciudad']
        });

        let cliente = !personal ? await this.clienteRepo.findOne({
            relations: ['persona', 'sucursal', 'sucursal.ciudad'],
            where: [
                { persona: { telefono: ILike(`%${last8}%`) }, activo: true },
                { persona: { telefono: ILike(`%${digitsOnly}%`) }, activo: true }
            ]
        }) : null;

        // Búsqueda alternativa por nombre si no se encontró por teléfono
        if (!personal && !cliente && pushName && pushName.trim() !== 'Usuario') {
            const cleanName = pushName.trim().toLowerCase();
            const nameWords = cleanName.split(/\s+/).filter(w => w.length > 0);

            personal = await this.personalRepo.createQueryBuilder('personal')
                .leftJoinAndSelect('personal.sucursal', 'sucursal')
                .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
                .where('personal.activo = :activo', { activo: true })
                .andWhere(new Brackets(b => {
                    b.where("LOWER(CONCAT(COALESCE(personal.nombres, ''), ' ', COALESCE(personal.apellidos, ''))) LIKE :full", { full: `%${cleanName}%` })
                     .orWhere("LOWER(CONCAT(COALESCE(personal.apellidos, ''), ' ', COALESCE(personal.nombres, ''))) LIKE :full", { full: `%${cleanName}%` });
                    if (nameWords.length > 1) {
                        let andC = '';
                        const prms: Record<string, string> = {};
                        nameWords.forEach((w, idx) => {
                            prms[`pw_${idx}`] = `%${w}%`;
                            const cond = `(LOWER(personal.nombres) LIKE :pw_${idx} OR LOWER(personal.apellidos) LIKE :pw_${idx})`;
                            andC = andC ? `${andC} AND ${cond}` : cond;
                        });
                        b.orWhere(`(${andC})`, prms);
                    }
                }))
                .getOne();

            if (!personal) {
                cliente = await this.clienteRepo.createQueryBuilder('cliente')
                    .leftJoinAndSelect('cliente.persona', 'persona')
                    .leftJoinAndSelect('cliente.sucursal', 'sucursal')
                    .where('cliente.activo = :activo', { activo: true })
                    .andWhere(new Brackets(b => {
                        b.where("LOWER(CONCAT(COALESCE(persona.nombres, ''), ' ', COALESCE(persona.apellidos, ''))) LIKE :full", { full: `%${cleanName}%` })
                         .orWhere("LOWER(CONCAT(COALESCE(persona.apellidos, ''), ' ', COALESCE(persona.nombres, ''))) LIKE :full", { full: `%${cleanName}%` })
                         .orWhere("LOWER(COALESCE(cliente.codigo, '')) LIKE :full", { full: `%${cleanName}%` });
                        if (nameWords.length > 1) {
                            let andC = '';
                            const prms: Record<string, string> = {};
                            nameWords.forEach((w, idx) => {
                                prms[`cw_${idx}`] = `%${w}%`;
                                const cond = `(LOWER(persona.nombres) LIKE :cw_${idx} OR LOWER(persona.apellidos) LIKE :cw_${idx})`;
                                andC = andC ? `${andC} AND ${cond}` : cond;
                            });
                            b.orWhere(`(${andC})`, prms);
                        }
                    }))
                    .getOne();
            }
        }

        // Si está inactivo (baja) -> Mensaje de bloqueo
        if (!personal && !cliente) {
            let inactivePersonal = await this.personalRepo.findOne({
                where: [
                    { telefono: ILike(`%${last8}%`), activo: false },
                    { telefono: ILike(`%${digitsOnly}%`), activo: false }
                ]
            });

            let inactiveCliente = !inactivePersonal ? await this.clienteRepo.findOne({
                relations: ['persona'],
                where: [
                    { persona: { telefono: ILike(`%${last8}%`) }, activo: false },
                    { persona: { telefono: ILike(`%${digitsOnly}%`) }, activo: false }
                ]
            }) : null;

            if (inactivePersonal || inactiveCliente) {
                const personName = inactivePersonal 
                    ? `${inactivePersonal.nombres} ${inactivePersonal.apellidos || ''}`.trim()
                    : (inactiveCliente?.persona ? `${inactiveCliente.persona.nombres} ${inactiveCliente.persona.apellidos || ''}`.trim() : 'Usuario');

                const sucursalActual = await this.sucursalRepo.findOne({ where: { id: session.sucursalId } });

                let msg = `⛔ *ACCESO DESHABILITADO / REGISTRO INACTIVO*\n\n` +
                    `Hola *${personName}*, tu registro se encuentra actualmente *inactivo* en el sistema de *GIPAAF*.\n\n` +
                    `Para reactivar tu cuenta o coordinar asistencia, comunícate con nuestra sucursal:\n\n` +
                    `🏢 *${session.sucursalNombre}*\n` +
                    `📍 Dirección: ${sucursalActual?.direccion || 'Oficina Central'}\n` +
                    `📱 Teléfono: ${sucursalActual?.telefono || 'Central'}\n`;

                try {
                    await session.sock.sendMessage(jid, { text: msg });
                    this.logBranchMessage(session, {
                        id: String(Date.now()),
                        from: 'BOT',
                        to: jid,
                        text: msg,
                        direction: 'out',
                        timestamp: new Date()
                    });
                } catch (sendErr) {}
                return;
            }
        }

        const isPersonal = !!personal;
        const isGerente = personal?.cargo === Cargo.GERENTE;
        const isAdmin = personal?.cargo === Cargo.ADMINISTRATIVO;
        const isJefeVentas = personal?.cargo === Cargo.JEFE_VENTAS;
        const isVendedor = personal?.cargo === Cargo.VENDEDOR;
        const isCliente = !isPersonal && !!cliente;
        const canAccessExecutive = isGerente || isAdmin || isJefeVentas;

        const userName = personal 
            ? `${personal.nombres} ${personal.apellidos || ''}`.trim()
            : cliente?.persona 
                ? `${cliente.persona.nombres} ${cliente.persona.apellidos || ''}`.trim()
                : (pushName && pushName !== 'Usuario' ? pushName : 'Cliente');

        const query = rawText.toLowerCase().trim();

        // Delay simulando escritura
        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 2000));
        } catch (presErr) {}

        // =============================================================
        // INTERCEPTOR DE SESIÓN ACTIVA
        // =============================================================
        const activeUserSession = session.userSessions.get(jid);
        if (activeUserSession && activeUserSession.expiresAt > Date.now()) {
            if (activeUserSession.state === 'WAITING_EXECUTIVE_BRANCH') {
                let sessionResp = '';
                if (query === 'cancelar' || query === 'salir' || query === 'menu') {
                    session.userSessions.delete(jid);
                    sessionResp = `Operación cancelada.\n\n` + this.buildMenu(session, userName, isPersonal, isGerente, isAdmin, isJefeVentas, isVendedor, isCliente, personal?.sucursal);
                } else if (query === '0' || query === 'todo' || query === 'todas' || query === 'general' || query === 'consolidado') {
                    session.userSessions.delete(jid);
                    sessionResp = await this.handleAdminDailySummary(null, session);
                } else {
                    const sucursales: Sucursal[] = activeUserSession.data?.sucursales || [];
                    const numIdx = parseInt(query, 10);
                    let selectedSucursal: Sucursal | undefined;

                    if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= sucursales.length) {
                        selectedSucursal = sucursales[numIdx - 1];
                    } else {
                        selectedSucursal = sucursales.find(s => 
                            s.nombre.toLowerCase().includes(query) || 
                            (s.ciudad?.nombre && s.ciudad.nombre.toLowerCase().includes(query))
                        );
                    }

                    if (selectedSucursal) {
                        session.userSessions.delete(jid);
                        sessionResp = await this.handleAdminDailySummary(selectedSucursal, session);
                    } else {
                        sessionResp = `⚠️ Opción no válida.\n\n` +
                            `Por favor ingresa un número de la lista (ej. 1, 2) o *0* para consolidado general, o escribe *cancelar*.`;
                    }
                }

                await session.sock.sendMessage(jid, { text: sessionResp });
                this.logBranchMessage(session, {
                    id: String(Date.now()),
                    from: 'BOT',
                    to: jid,
                    text: sessionResp,
                    direction: 'out',
                    timestamp: new Date()
                });
                return;
            }

            if (activeUserSession.state === 'WAITING_CLIENT_SEARCH') {
                if (query === 'cancelar' || query === 'salir' || query === 'menu') {
                    session.userSessions.delete(jid);
                    const cancelMsg = `Búsqueda cancelada.\n\n` + this.buildMenu(session, userName, isPersonal, isGerente, isAdmin, isJefeVentas, isVendedor, isCliente, personal?.sucursal);
                    await session.sock.sendMessage(jid, { text: cancelMsg });
                    this.logBranchMessage(session, { id: String(Date.now()), from: 'BOT', to: jid, text: cancelMsg, direction: 'out', timestamp: new Date() });
                    return;
                }

                session.userSessions.delete(jid);
                const sellerDebtResult = await this.handleSellerClientDebtQuery(rawText.trim(), session);
                await session.sock.sendMessage(jid, { text: sellerDebtResult.text });
                this.logBranchMessage(session, { id: String(Date.now()), from: 'BOT', to: jid, text: sellerDebtResult.text, direction: 'out', timestamp: new Date() });

                if (sellerDebtResult.pdfBuffer) {
                    try {
                        const fileName = sellerDebtResult.fileName || `Estado_Cuenta_${sellerDebtResult.clientName || 'Cliente'}.pdf`;
                        await session.sock.sendMessage(jid, {
                            document: sellerDebtResult.pdfBuffer,
                            mimetype: 'application/pdf',
                            fileName,
                            caption: `📄 *Estado de Cuenta Detallado (PDF)*\nCliente: *${sellerDebtResult.clientName || rawText.trim()}*`
                        });
                    } catch (pdfSendErr) {
                        this.logger.error(`Error enviando PDF a ${jid}:`, pdfSendErr);
                    }
                }
                return;
            }
        }

        // Palabras clave de navegación
        const isMenuQuery = ['hola', 'menu', 'menú', 'opciones', 'inicio', 'ayuda', 'start', 'buenas', 'buenos dias', 'buenas tardes', 'buenas noches', 'hi', 'hello'].includes(query);

        // ==========================================
        // CASO A: USUARIO GENERAL / CLIENTE NO REGISTRADO
        // ==========================================
        if (!isPersonal && !isCliente) {
            let responseText = '';

            if (isMenuQuery) {
                responseText = this.buildMenu(session, userName, false, false, false, false, false, false);
            } else if (query === '1' || query.includes('direccion') || query.includes('dirección') || query.includes('sucursal') || query.includes('contacto') || query.includes('ubicacion') || query.includes('ubicación') || query.includes('horario')) {
                responseText = await this.handleBranchContactsQuery(session);
            } else if (query === '2' || query.includes('catalogo') || query.includes('catálogo') || query.includes('pdf')) {
                await this.sendCatalogPdf(session, jid);
                return;
            } else if (query === '3' || query.includes('producto') || query.includes('precio') || query.includes('precios') || query.includes('stock')) {
                responseText = `🔍 *CONSULTA DE PRODUCTOS Y PRECIOS*\n\n` +
                    `Escribe directamente el nombre o código del producto que buscas (ej. *barniz*, *thinner*, *catalizador*, *masilla*) para ver su precio y stock disponible en *${session.sucursalNombre}*.`;
            } else if (query === '4' || query.includes('asesor') || query.includes('vendedor') || query.includes('registro') || query.includes('visita')) {
                responseText = await this.handleSellerContactListQuery(session);
            } else {
                // Búsqueda directa de producto
                const directProductStock = await this.handleStockQuery(rawText.trim(), session, true);
                if (directProductStock) {
                    responseText = directProductStock;
                } else {
                    responseText = this.buildMenu(session, userName, false, false, false, false, false, false);
                }
            }

            if (responseText) {
                await session.sock.sendMessage(jid, { text: responseText });
                this.logBranchMessage(session, {
                    id: String(Date.now()),
                    from: 'BOT',
                    to: jid,
                    text: responseText,
                    direction: 'out',
                    timestamp: new Date()
                });
            }
            return;
        }

        // ==========================================
        // CASO B: USUARIOS REGISTRADOS (PERSONAL O CLIENTES)
        // ==========================================
        let responseText = '';

        if (isMenuQuery) {
            responseText = this.buildMenu(session, userName, isPersonal, isGerente, isAdmin, isJefeVentas, isVendedor, isCliente, personal?.sucursal);
        } else if (query === '1' || query === 'catalogo' || query === 'catálogo') {
            await this.sendCatalogPdf(session, jid);
            return;
        } else if (query === '2' || query === 'stock' || query === 'precios') {
            responseText = `🔍 *CONSULTA DE PRECIOS Y STOCK EN TIEMPO REAL*\n\n` +
                `Escribe el nombre o código del producto que deseas consultar (ej. *barniz*, *thinner*, *catalizador*) para ver las existencias en *${session.sucursalNombre}*.`;
        } else if (query === '3' || query.includes('saldo') || query.includes('deuda') || query.includes('cuenta')) {
            if (isCliente && cliente) {
                const debtResult = await this.handleClientDebtQuery(cliente, session);
                await session.sock.sendMessage(jid, { text: debtResult.text });
                this.logBranchMessage(session, { id: String(Date.now()), from: 'BOT', to: jid, text: debtResult.text, direction: 'out', timestamp: new Date() });

                if (debtResult.pdfBuffer) {
                    try {
                        const fileName = debtResult.fileName || `Estado_Cuenta_${cliente.persona?.nombres || 'Cliente'}.pdf`;
                        await session.sock.sendMessage(jid, {
                            document: debtResult.pdfBuffer,
                            mimetype: 'application/pdf',
                            fileName,
                            caption: `📄 *Estado de Cuenta Detallado (PDF)*\nCliente: *${cliente.persona ? `${cliente.persona.nombres} ${cliente.persona.apellidos}` : 'Cliente'}*`
                        });
                    } catch (pdfSendErr) {
                        this.logger.error(`Error enviando PDF de estado de cuenta a ${jid}:`, pdfSendErr);
                    }
                }
                return;
            } else if (isVendedor || isJefeVentas || isAdmin) {
                session.userSessions.set(jid, {
                    state: 'WAITING_CLIENT_SEARCH',
                    expiresAt: Date.now() + (5 * 60 * 1000)
                });
                responseText = `💳 *CONSULTA DE SALDO DE CLIENTE*\n\n` +
                    `Por favor escribe el *Nombre*, *Apellido*, *Razón Social* o *Código* del cliente que deseas consultar (o escribe *cancelar* para volver al menú):`;
            } else {
                responseText = `ℹ️ No tienes cuentas de crédito asociadas directamente. Comunícate con administración para mayor información.`;
            }
        } else if (query === '4' || query.includes('banco') || query.includes('cuenta bancaria') || query.includes('qr')) {
            await this.sendBankAccounts(session, jid);
            return;
        } else if (query === '5') {
            if (isVendedor || isJefeVentas || isAdmin) {
                if (personal) {
                    responseText = await this.handleSellerRouteQuery(personal.id, userName, session);
                } else {
                    responseText = `❌ No se encontró tu perfil de asesor comercial.`;
                }
            } else if (isCliente) {
                responseText = await this.handleBranchContactsQuery(session);
            }
        } else if (query === '6' && canAccessExecutive) {
            if (isGerente || (isAdmin && !personal?.sucursal)) {
                const sucursales = await this.sucursalRepo.find({
                    where: { activo: true },
                    relations: ['ciudad'],
                    order: { id: 'ASC' }
                });

                if (sucursales.length > 1) {
                    session.userSessions.set(jid, {
                        state: 'WAITING_EXECUTIVE_BRANCH',
                        data: { sucursales },
                        expiresAt: Date.now() + (5 * 60 * 1000)
                    });
                    responseText = this.buildBranchSelectionMenu(sucursales);
                } else {
                    responseText = await this.handleAdminDailySummary(sucursales[0] || null, session);
                }
            } else {
                responseText = await this.handleAdminDailySummary(personal?.sucursal || null, session);
            }
        } else {
            // Consulta directa de stock
            const directProductStock = await this.handleStockQuery(rawText.trim(), session, true);
            if (directProductStock) {
                responseText = directProductStock;
            } else {
                responseText = this.buildMenu(session, userName, isPersonal, isGerente, isAdmin, isJefeVentas, isVendedor, isCliente, personal?.sucursal);
            }
        }

        if (responseText) {
            await session.sock.sendMessage(jid, { text: responseText });
            this.logBranchMessage(session, {
                id: String(Date.now()),
                from: 'BOT',
                to: jid,
                text: responseText,
                direction: 'out',
                timestamp: new Date()
            });
        }
    }

    // ==========================================
    // ENVÍO DE CATÁLOGO PDF
    // ==========================================
    private async sendCatalogPdf(session: BranchSession, jid: string): Promise<boolean> {
        if (!session.sock) return false;

        try {
            const pdfFilePath = path.join(session.authDir, 'catalog.pdf');
            if (session.config.customCatalogPdf && fs.existsSync(pdfFilePath)) {
                const pdfBuffer = fs.readFileSync(pdfFilePath);
                const docName = session.config.catalogPdfName || `Catalogo_GIPAAF_${session.sucursalNombre.replace(/\s+/g, '_')}.pdf`;

                await session.sock.sendMessage(jid, {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: docName,
                    caption: `📄 *Catálogo Oficial de Productos - GIPAAF*\nSucursal: *${session.sucursalNombre}*\nDescárgalo para consultar nuestra línea completa de pinturas y acabados.`
                });
                return true;
            } else if (session.config.customCatalogPdf && !session.config.customCatalogPdf.startsWith('FILE_SAVED')) {
                const base64Data = session.config.customCatalogPdf.includes('base64,')
                    ? session.config.customCatalogPdf.split('base64,')[1]
                    : session.config.customCatalogPdf;
                const pdfBuffer = Buffer.from(base64Data, 'base64');
                const docName = session.config.catalogPdfName || `Catalogo_GIPAAF_${session.sucursalNombre.replace(/\s+/g, '_')}.pdf`;

                await session.sock.sendMessage(jid, {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: docName,
                    caption: `📄 *Catálogo Oficial de Productos - GIPAAF*\nSucursal: *${session.sucursalNombre}*\nDescárgalo para consultar nuestra línea completa de pinturas y acabados.`
                });
                return true;
            }

            // Generación dinámica en memoria de catálogo PDF
            const productos = await this.productoRepo.find({
                where: { activo: true },
                relations: ['categoria', 'marca'],
                order: { nombre: 'ASC' },
                take: 150
            });

            const pdfBuffer = await this.generateCatalogPdfInMemory(productos, session.sucursalNombre);
            await session.sock.sendMessage(jid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Catalogo_GIPAAF_${session.sucursalNombre.replace(/\s+/g, '_')}.pdf`,
                caption: `📄 *Catálogo de Productos - GIPAAF (${session.sucursalNombre})*\nLínea automotriz, ferretería y complementos.`
            });

            return true;
        } catch (err) {
            this.logger.error(`Error enviando catálogo PDF a ${jid}:`, err);
            await session.sock.sendMessage(jid, {
                text: `❌ Lo sentimos, ocurrió un problema al enviar el archivo PDF. Puedes consultar precios escribiendo el nombre del producto.`
            });
            return false;
        }
    }

    private generateCatalogPdfInMemory(productos: Producto[], sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 36, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Encabezado
            doc.fontSize(18).fillColor('#1e3a8a').text('GIPAAF - Catálogo de Productos', { align: 'center' });
            doc.fontSize(10).fillColor('#475569').text(`Sucursal: ${sucursalNombre} | Fecha: ${new Date().toLocaleDateString('es-BO')}`, { align: 'center' });
            doc.moveDown(1);
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(36, doc.y).lineTo(559, doc.y).stroke();
            doc.moveDown(1);

            productos.forEach((p, idx) => {
                if (doc.y > 720) {
                    doc.addPage();
                }
                const cat = p.categoria?.nombre ? ` [${p.categoria.nombre}]` : '';
                const marca = p.marca?.nombre ? ` (${p.marca.nombre})` : '';
                doc.fontSize(11).fillColor('#0f172a').text(`${idx + 1}. ${p.nombre}${marca}${cat}`, { bold: true } as any);
                doc.fontSize(9).fillColor('#334155').text(`   Código: ${p.codigo || 'S/C'} | Precio Ref: Bs. ${Number(p.precioVenta || 0).toFixed(2)} | Unidad: ${p.unidadMedida || 'Pza'}`);
                doc.moveDown(0.5);
            });

            doc.end();
        });
    }

    // ==========================================
    // ENVÍO DE CUENTAS BANCARIAS
    // ==========================================
    private async sendBankAccounts(session: BranchSession, jid: string): Promise<boolean> {
        if (!session.sock) return false;

        let accounts = await this.cuentaBancariaRepo.find({
            where: { activo: true },
            order: { orden: 'ASC', id: 'ASC' }
        });

        if (accounts.length > 0) {
            let msg = `🏦 *CUENTAS BANCARIAS OFICIALES - GIPAAF*\n\n` +
                `Para realizar tus pagos o abonos de cuenta, ponemos a tu disposición nuestras cuentas autorizadas:\n\n`;

            accounts.forEach((acc, idx) => {
                msg += `*${idx + 1}. ${acc.banco}*\n` +
                    `  • *Tipo:* ${acc.tipoCuenta}\n` +
                    `  • *Nro. de Cuenta:* \`${acc.numeroCuenta}\`\n` +
                    `  • *Titular:* ${acc.titular}\n`;
                if (acc.documentoIdentidad) {
                    msg += `  • *Doc / NIT:* ${acc.documentoIdentidad}\n`;
                }
                msg += `───────────────────\n`;
            });

            msg += `\n📌 *Instrucciones:* Envía la fotografía o captura del comprobante por este medio para validar tu pago.`;

            await session.sock.sendMessage(jid, { text: msg });
            this.logBranchMessage(session, {
                id: String(Date.now()),
                from: 'BOT',
                to: jid,
                text: msg,
                direction: 'out',
                timestamp: new Date()
            });

            // Enviar imágenes QR si existen
            for (const acc of accounts) {
                if (acc.qrImage) {
                    try {
                        const base64Data = acc.qrImage.includes('base64,') ? acc.qrImage.split('base64,')[1] : acc.qrImage;
                        const buffer = Buffer.from(base64Data, 'base64');
                        await session.sock.sendMessage(jid, {
                            image: buffer,
                            caption: `📲 *Código QR Simple - ${acc.banco}*\nCuenta: \`${acc.numeroCuenta}\`\nTitular: *${acc.titular}*`
                        });
                    } catch (qrErr) {
                        this.logger.error(`Error enviando imagen QR de ${acc.banco} a ${jid}:`, qrErr);
                    }
                }
            }
            return true;
        } else {
            const fallback = session.config.bankAccountsInfo || 'Información de cuentas bancarias no disponible temporalmente.';
            await session.sock.sendMessage(jid, { text: fallback });
            return true;
        }
    }

    // ==========================================
    // CONSULTAS CONTEXTUALIZADAS POR SUCURSAL
    // ==========================================
    private async handleBranchContactsQuery(session: BranchSession): Promise<string> {
        const sucursales = await this.sucursalRepo.find({
            where: { activo: true },
            relations: ['ciudad'],
            order: { id: 'ASC' }
        });

        const currentSucursal = sucursales.find(s => s.id === session.sucursalId);
        const otherSucursales = sucursales.filter(s => s.id !== session.sucursalId);

        let resp = `🏢 *INFORMACIÓN DE SUCURSAL - ${session.sucursalNombre.toUpperCase()}*\n\n`;

        if (currentSucursal) {
            const ciu = currentSucursal.ciudad?.nombre ? ` (${currentSucursal.ciudad.nombre})` : '';
            resp += `📍 *${currentSucursal.nombre}${ciu}*\n`;
            if (currentSucursal.direccion) resp += `  🏠 Dirección: ${currentSucursal.direccion}\n`;
            if (currentSucursal.telefono) resp += `  📱 Teléfono / WhatsApp: *${currentSucursal.telefono}*\n`;
            if (currentSucursal.email) resp += `  ✉️ Email: ${currentSucursal.email}\n`;
            if (currentSucursal.horarioAtencion) resp += `  ⏰ Horario: ${currentSucursal.horarioAtencion}\n`;
            if (currentSucursal.latitud && currentSucursal.longitud) {
                resp += `  🗺️ *Maps:* https://maps.google.com/?q=${currentSucursal.latitud},${currentSucursal.longitud}\n`;
            }
            resp += `───────────────────\n\n`;
        }

        if (otherSucursales.length > 0) {
            resp += `📍 *OTRAS SUCURSALES GIPAAF EN EL PAÍS:*\n\n`;
            otherSucursales.forEach(s => {
                const ciu = s.ciudad?.nombre ? ` - ${s.ciudad.nombre}` : '';
                resp += `🏢 *${s.nombre}${ciu}*\n`;
                if (s.direccion) resp += `  🏠 Dirección: ${s.direccion}\n`;
                if (s.telefono) resp += `  📱 Contacto: ${s.telefono}\n`;
                if (s.latitud && s.longitud) {
                    resp += `  🗺️ Maps: https://maps.google.com/?q=${s.latitud},${s.longitud}\n`;
                }
                resp += `───────────────────\n`;
            });
        }

        resp += `\n💬 _Para descargar el catálogo de productos responde *2* o escribe el nombre de un producto para consultar su precio._`;
        return resp;
    }

    private async handleSellerContactListQuery(session: BranchSession): Promise<string> {
        const branchVendedores = await this.personalRepo.find({
            where: { cargo: Cargo.VENDEDOR, activo: true, sucursal: { id: session.sucursalId } },
            relations: ['sucursal', 'sucursal.ciudad'],
            order: { nombres: 'ASC' }
        });

        let resp = `💼 *ASESORES COMERCIALES - SUCURSAL ${session.sucursalNombre.toUpperCase()}*\n\n` +
            `Para registrar tu taller, compras por mayor o coordinar la visita de un asesor comercial en tu zona:\n\n`;

        if (branchVendedores.length > 0) {
            branchVendedores.forEach(v => {
                const tel = v.telefono || 'Sin celular registrado';
                const cleanPhone = tel.replace(/\D/g, '');
                const waLink = cleanPhone ? `https://wa.me/${cleanPhone.length === 8 ? '591' + cleanPhone : cleanPhone}` : '';
                resp += `👤 *${v.nombres} ${v.apellidos}*\n` +
                    `  📱 Celular / WhatsApp: *${tel}*\n` +
                    (waLink ? `  💬 Chat directo: ${waLink}\n` : '') +
                    `───────────────────\n`;
            });
        } else {
            const currentSuc = await this.sucursalRepo.findOne({ where: { id: session.sucursalId } });
            resp += `🏢 *Atención Directa ${session.sucursalNombre}*: 📱 ${currentSuc?.telefono || 'Oficina Central'}\n`;
        }

        resp += `\n✨ _Comunícate directamente con tu asesor para dar de alta tu cuenta o coordinar despachos._`;
        return resp;
    }

    private buildMenu(
        session: BranchSession,
        userName: string, 
        isPersonal: boolean, 
        isGerente: boolean, 
        isAdmin: boolean, 
        isJefeVentas: boolean, 
        isVendedor: boolean, 
        isCliente: boolean,
        sucursal?: Sucursal
    ): string {
        if (!isPersonal && !isCliente) {
            return `🤖 *${session.config.botName}*\n` +
                `_${session.config.customWelcomeMessage}_\n\n` +
                `👋 ¡Hola *${userName}*! Te damos la bienvenida a *GIPAAF - ${session.sucursalNombre}*.\n` +
                `Por favor selecciona una opción respondiendo con el número:\n\n` +
                `1️⃣ *🏢 Dirección, Contacto y Horarios de Sucursal*\n` +
                `2️⃣ *📄 Descargar Catálogo General de Productos (PDF)*\n` +
                `3️⃣ *🔍 Consultar Productos y Precios en Tiempo Real*\n` +
                `4️⃣ *💼 Contactar a un Asesor Comercial de ${session.sucursalNombre}*\n\n` +
                `💬 _O escribe directamente el nombre de un producto (ej. catalizador, barniz, thinner) para consultar su precio y stock._`;
        }

        let roleBadge = '👤 Cliente Registrado';
        if (isGerente) roleBadge = '⭐ Gerencia General';
        else if (isAdmin) roleBadge = '⭐ Administración';
        else if (isJefeVentas) roleBadge = '💼 Jefe de Ventas';
        else if (isVendedor) roleBadge = '💼 Asesor Comercial';

        let menu = `🤖 *${session.config.botName}*\n` +
            `_${session.config.customWelcomeMessage}_\n\n` +
            `Hola *${userName}* (${roleBadge})\n` +
            `Por favor selecciona una opción respondiendo con el número:\n\n` +
            `1️⃣ *📄 Descargar Catálogo General de Productos (PDF)*\n` +
            `2️⃣ *🔍 Consultar Precios y Stock en Tiempo Real*\n` +
            `3️⃣ *💳 Consultar Saldo y Deudas Pendientes*\n` +
            `4️⃣ *🏦 Cuentas Bancarias e Instrucciones de Pago*\n`;

        if (isVendedor || isJefeVentas || isAdmin) {
            menu += `5️⃣ *🗺️ Mi Ruta de Clientes Asignados (${session.sucursalNombre})*\n`;
        } else if (isCliente) {
            menu += `5️⃣ *🏢 Dirección, Contacto y Horarios de Sucursales*\n`;
        }

        if (isGerente || (isAdmin && !sucursal)) {
            menu += `6️⃣ *📊 Resumen Ejecutivo del Día (Por Sucursal o Consolidado)*\n`;
        } else if ((isAdmin || isJefeVentas) && sucursal) {
            const sucNom = sucursal.nombre || session.sucursalNombre;
            menu += `6️⃣ *📊 Resumen Ejecutivo del Día (${sucNom})*\n`;
        }

        menu += `\n💬 _También puedes escribir directamente el nombre de un producto (ej. catalizador, barniz, thinner) para buscarlo al instante._`;
        return menu;
    }

    private buildBranchSelectionMenu(sucursales: Sucursal[]): string {
        let text = `🏢 *RESUMEN EJECUTIVO - SELECCIÓN DE SUCURSAL*\n\n` +
            `Por favor selecciona la sucursal que deseas consultar respondiendo con el número:\n\n`;

        sucursales.forEach((s, idx) => {
            const ciu = s.ciudad?.nombre ? ` (${s.ciudad.nombre})` : '';
            text += `*${idx + 1}️⃣* ${s.nombre}${ciu}\n`;
        });

        text += `*0️⃣* 🌐 *Consolidado General (Todas las Sucursales)*\n\n` +
            `_Responde con el número de la opción (ej. 1, 2 o 0) o escribe cancelar._`;

        return text;
    }

    private async handleStockQuery(term: string, session: BranchSession, isDirect = false): Promise<string | null> {
        const productos = await this.productoRepo.find({
            where: [
                { nombre: ILike(`%${term}%`), activo: true },
                { codigo: ILike(`%${term}%`), activo: true }
            ],
            take: 5
        });

        if (!productos || productos.length === 0) {
            return isDirect ? null : `❌ No encontramos productos que coincidan con "*${term}*".\n\nVerifica el nombre o código y vuelve a intentar.`;
        }

        let resp = `📦 *Resultados para: "${term}" en ${session.sucursalNombre}*\n\n`;

        for (const p of productos) {
            const inventarios = await this.inventarioRepo.find({
                where: { producto: { id: p.id }, stockActual: MoreThan(0) },
                relations: ['sucursal', 'sucursal.ciudad']
            });

            const invSucursal = inventarios.find(i => i.sucursal?.id === session.sucursalId);
            const stockSucursal = invSucursal ? Number(invSucursal.stockActual || 0) : 0;
            const stockTotal = inventarios.reduce((acc, inv) => acc + Number(inv.stockActual || 0), 0);

            resp += `🔹 *${p.nombre}*\n` +
                `• Código: \`${p.codigo}\`\n` +
                `• Precio Venta: *Bs. ${Number(p.precioVenta || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}*\n` +
                `• Stock en *${session.sucursalNombre}*: *${stockSucursal} ${p.unidadMedida || 'Unid.'}*\n` +
                `• Stock Global: ${stockTotal} ${p.unidadMedida || 'Unid.'}\n`;

            if (inventarios.length > 0) {
                const stockDetails = inventarios.map(inv => {
                    const sucNom = inv.sucursal?.nombre || 'Sucursal';
                    const ciuNom = inv.sucursal?.ciudad?.nombre ? ` (${inv.sucursal.ciudad.nombre})` : '';
                    return `  ▫️ ${sucNom}${ciuNom}: ${inv.stockActual}`;
                }).join('\n');
                resp += `${stockDetails}\n`;
            } else {
                resp += `  ▫️ _Sin existencias en almacén actualmente_\n`;
            }
            resp += `───────────────────\n`;
        }

        return resp;
    }

    private async handleClientDebtQuery(cliente: Cliente, session: BranchSession): Promise<{ text: string; pdfBuffer: Buffer | null; fileName?: string }> {
        const clientName = cliente.persona 
            ? `${cliente.persona.nombres} ${cliente.persona.apellidos}`.trim()
            : 'Estimado Cliente';

        const notas = await this.notaRepo.find({
            where: {
                cliente: { id: cliente.id },
                tipo: TipoNota.VENTA,
                estado: EstadoNota.CONFIRMADA
            },
            relations: ['sucursal', 'detalles', 'detalles.producto'],
            order: { fecha: 'ASC' }
        });

        const notasConSaldo = notas.filter(n => Number(n.saldo || 0) > 0.01);
        const saldoTotalBOB = notasConSaldo.reduce((acc, n) => {
            const s = Number(n.saldo || 0);
            return acc + (n.moneda === 'USD' ? (s * (Number(n.tipoCambio) || 6.96)) : s);
        }, 0);

        if (notasConSaldo.length === 0) {
            return {
                text: `✅ *ESTADO DE CUENTA - ${session.sucursalNombre.toUpperCase()}*\n\n` +
                    `¡Buenas noticias, *${clientName}*! Actualmente *no tienes deudas pendientes* con GIPAAF.\n\n` +
                    `¡Gracias por tu puntualidad y confianza! 🤝`,
                pdfBuffer: null
            };
        }

        let resp = `📋 *ESTADO DE CUENTA DE CRÉDITO*\n\n` +
            `Cliente: *${clientName}*\n` +
            `Código: \`${cliente.codigo || '-'}\`\n` +
            `💰 *Saldo Total Pendiente:* *Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}*\n\n` +
            `*Detalle de Notas de Venta con Saldo:*\n`;

        notasConSaldo.forEach((n, idx) => {
            const fechaStr = n.fecha ? new Date(n.fecha).toLocaleDateString('es-BO') : '-';
            const monedaSimbolo = n.moneda === 'USD' ? '$us' : 'Bs.';
            const totalFmt = Number(n.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
            const saldoFmt = Number(n.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
            const sucNom = n.sucursal?.nombre ? ` (${n.sucursal.nombre})` : '';

            resp += `\n*${idx + 1}. Nota #${n.numero || n.id}*${sucNom}\n` +
                `  📅 Fecha: ${fechaStr}\n` +
                `  💵 Total Venta: ${monedaSimbolo} ${totalFmt}\n` +
                `  ⚠️ *Saldo Pendiente:* *${monedaSimbolo} ${saldoFmt}*\n` +
                (n.moneda === 'USD' ? `     _(Equiv: Bs. ${(Number(n.saldo) * (Number(n.tipoCambio) || 6.96)).toFixed(2)})_\n` : '') +
                `───────────────────`;
        });

        resp += `\n\n📌 _Para abonar a tu cuenta, responde *4* para ver los números de cuenta bancaria y códigos QR._`;

        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await this.generateAccountStatementPdfInMemory(cliente, notasConSaldo, saldoTotalBOB, session.sucursalNombre);
        } catch (pdfErr) {
            this.logger.error(`Error generando PDF de estado de cuenta para cliente ${cliente.id}:`, pdfErr);
        }

        return {
            text: resp,
            pdfBuffer,
            fileName: `Estado_Cuenta_${clientName.replace(/\s+/g, '_')}.pdf`
        };
    }

    private async handleSellerClientDebtQuery(clientTerm: string, session: BranchSession): Promise<{ text: string; pdfBuffer: Buffer | null; fileName?: string; clientName?: string }> {
        const cliente = await this.clienteRepo.createQueryBuilder('cliente')
            .leftJoinAndSelect('cliente.persona', 'persona')
            .leftJoinAndSelect('cliente.sucursal', 'sucursal')
            .where('cliente.activo = :activo', { activo: true })
            .andWhere(new Brackets(b => {
                b.where("LOWER(CONCAT(COALESCE(persona.nombres, ''), ' ', COALESCE(persona.apellidos, ''))) LIKE :term", { term: `%${clientTerm.toLowerCase()}%` })
                 .orWhere("LOWER(CONCAT(COALESCE(persona.apellidos, ''), ' ', COALESCE(persona.nombres, ''))) LIKE :term", { term: `%${clientTerm.toLowerCase()}%` })
                 .orWhere("LOWER(COALESCE(cliente.codigo, '')) LIKE :term", { term: `%${clientTerm.toLowerCase()}%` });
            }))
            .getOne();

        if (!cliente) {
            return {
                text: `❌ No encontramos ningún cliente activo que coincida con "*${clientTerm}*".\n\nVerifica el nombre o código e intenta nuevamente desde el menú.`,
                pdfBuffer: null
            };
        }

        return await this.handleClientDebtQuery(cliente, session);
    }

    private generateAccountStatementPdfInMemory(cliente: Cliente, notasConSaldo: Nota[], saldoTotalBOB: number, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ margin: 36, size: 'A4' });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const clientName = cliente.persona ? `${cliente.persona.nombres} ${cliente.persona.apellidos}`.trim() : 'Cliente';

            doc.fontSize(16).fillColor('#1e3a8a').text('GIPAAF - Estado de Cuenta de Crédito', { align: 'center' });
            doc.fontSize(10).fillColor('#475569').text(`Sucursal: ${sucursalNombre} | Fecha de emisión: ${new Date().toLocaleDateString('es-BO')}`, { align: 'center' });
            doc.moveDown(1);
            doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(36, doc.y).lineTo(559, doc.y).stroke();
            doc.moveDown(1);

            doc.fontSize(11).fillColor('#0f172a').text(`Cliente: ${clientName}`);
            doc.fontSize(9).fillColor('#475569').text(`Código: ${cliente.codigo || '-'} | Teléfono: ${cliente.persona?.telefono || '-'} | CI: ${cliente.persona?.ci || '-'}`);
            doc.fontSize(12).fillColor('#dc2626').text(`Saldo Total Adeudado: Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, { bold: true } as any);
            doc.moveDown(1);

            doc.fontSize(10).fillColor('#1e293b').text('Detalle de Ventas Pendientes de Pago:', { underline: true });
            doc.moveDown(0.5);

            notasConSaldo.forEach((n, idx) => {
                if (doc.y > 700) doc.addPage();
                const fechaStr = n.fecha ? new Date(n.fecha).toLocaleDateString('es-BO') : '-';
                const moneda = n.moneda === 'USD' ? '$us' : 'Bs.';
                doc.fontSize(10).fillColor('#0f172a').text(`${idx + 1}. Nota #${n.numero || n.id} - Fecha: ${fechaStr}`);
                doc.fontSize(9).fillColor('#334155').text(`   Total Venta: ${moneda} ${Number(n.total || 0).toFixed(2)} | Saldo Adeudado: ${moneda} ${Number(n.saldo || 0).toFixed(2)}`);
                doc.moveDown(0.5);
            });

            doc.end();
        });
    }

    private async handleSellerRouteQuery(vendedorId: number, userName: string, session: BranchSession): Promise<string> {
        const rutas = await this.rutaRepo.find({
            where: {
                vendedor: { id: vendedorId },
                activo: true,
                sucursal: { id: session.sucursalId }
            },
            relations: ['clientes', 'clientes.persona', 'sucursal']
        });

        if (!rutas || rutas.length === 0) {
            // Check in other branches
            const allRutas = await this.rutaRepo.find({
                where: { vendedor: { id: vendedorId }, activo: true },
                relations: ['clientes', 'clientes.persona', 'sucursal']
            });

            if (allRutas.length > 0) {
                let resp = `📍 *RUTAS ASIGNADAS - ASESOR COMERCIAL*\n👤 Asesor: *${userName}*\n\n`;
                allRutas.forEach(r => {
                    resp += `🗺️ *Ruta: ${r.nombre} (${r.sucursal?.nombre || 'Sucursal'})*\n`;
                    resp += `* Total Clientes: ${r.clientes?.length || 0}\n`;
                    (r.clientes || []).slice(0, 10).forEach((c, idx) => {
                        const name = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : 'Cliente';
                        resp += `  ${idx + 1}. ${name} 📱 ${c.persona?.telefono || '-'}\n`;
                    });
                    resp += `───────────────────\n`;
                });
                return resp;
            }

            return `📍 *RUTAS ASIGNADAS*\n\nHola *${userName}*, actualmente no tienes rutas con clientes asignadas en *${session.sucursalNombre}*.\n\nComunícate con tu Jefe de Ventas para asignar tu ruta.`;
        }

        let resp = `📍 *TUS RUTAS Y CLIENTES ASIGNADOS (${session.sucursalNombre.toUpperCase()})*\n\n`;

        rutas.forEach(r => {
            resp += `🗺️ *Ruta: ${r.nombre}*\n`;
            resp += `* Total Clientes: ${r.clientes?.length || 0}\n`;

            if (r.clientes && r.clientes.length > 0) {
                r.clientes.forEach((c, idx) => {
                    const cName = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : 'Cliente';
                    const tel = c.persona?.telefono ? ` 📱 ${c.persona.telefono}` : '';
                    const dir = c.persona?.direccion ? ` (🏠 ${c.persona.direccion})` : '';
                    resp += `  ${idx + 1}. ${cName}${tel}${dir}\n`;
                    if (c.latitud && c.longitud) {
                        resp += `     🗺️ GPS: https://maps.google.com/?q=${c.latitud},${c.longitud}\n`;
                    }
                });
            } else {
                resp += `  ▫️ _Sin clientes asignados en esta ruta_\n`;
            }
            resp += `───────────────────\n`;
        });

        return resp;
    }

    private async handleAdminDailySummary(targetSucursal: Sucursal | null, session?: BranchSession): Promise<string> {
        const todayStr = new Date().toISOString().substring(0, 10);
        const sucursalId = targetSucursal ? targetSucursal.id : (session ? session.sucursalId : null);
        const sucursalNom = targetSucursal ? targetSucursal.nombre : (session ? session.sucursalNombre : null);
        const ciudadNom = targetSucursal?.ciudad?.nombre || '';

        // 1. VENTAS
        const ventasQuery = this.notaRepo.createQueryBuilder('nota')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.activo = :activo', { activo: true })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .andWhere('DATE(nota.fecha) = :today', { today: todayStr });

        if (sucursalId) {
            ventasQuery.andWhere('nota.sucursal.id = :sucursalId', { sucursalId });
        }
        const ventasHoy = await ventasQuery.getMany();

        const totalVentas = ventasHoy.reduce((acc, v) => {
            const t = Number(v.total) || 0;
            const tc = (v.moneda === 'USD') ? (Number(v.tipoCambio) || 6.96) : 1;
            return acc + (t * tc);
        }, 0);

        // 2. COBRANZAS
        const cobQuery = this.pagoCobranzaRepo.createQueryBuilder('pago')
            .leftJoinAndSelect('pago.nota', 'nota')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .where('pago.activo = :activo', { activo: true })
            .andWhere('DATE(pago.fecha) = :today', { today: todayStr });

        if (sucursalId) {
            cobQuery.andWhere('nota.sucursal.id = :sucursalId', { sucursalId });
        }
        const cobHoy = await cobQuery.getMany();

        let totalCobranzas = 0;
        const cobByMetodo: Record<string, { total: number; count: number }> = {};

        cobHoy.forEach(c => {
            const monto = Number(c.monto) || 0;
            const tc = (c.moneda === 'USD') ? (Number(c.tipoCambio) || 6.96) : 1;
            const montoBob = monto * tc;
            totalCobranzas += montoBob;

            const met = (c.metodoPago || 'Efectivo').trim();
            if (!cobByMetodo[met]) {
                cobByMetodo[met] = { total: 0, count: 0 };
            }
            cobByMetodo[met].total += montoBob;
            cobByMetodo[met].count += 1;
        });

        // 3. EGRESOS OPERATIVOS
        const pagosProvQuery = this.pagoProveedorRepo.createQueryBuilder('pago')
            .leftJoinAndSelect('pago.nota', 'nota')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .where('pago.activo = :activo', { activo: true })
            .andWhere('DATE(pago.fecha) = :today', { today: todayStr });
        if (sucursalId) pagosProvQuery.andWhere('nota.sucursal.id = :sucursalId', { sucursalId });
        const pagosProvHoy = await pagosProvQuery.getMany();

        const totalPagosProv = pagosProvHoy.reduce((acc, p) => {
            const monto = Number(p.monto) || 0;
            const tc = (p.moneda === 'USD') ? (Number(p.tipoCambio) || 6.96) : 1;
            return acc + (monto * tc);
        }, 0);

        const egrQuery = this.egresoRepo.createQueryBuilder('egreso')
            .leftJoinAndSelect('egreso.sucursal', 'sucursal')
            .where('egreso.activo = :activo', { activo: true })
            .andWhere('DATE(egreso.fecha) = :today', { today: todayStr });
        if (sucursalId) egrQuery.andWhere('egreso.sucursal.id = :sucursalId', { sucursalId });
        const egrHoy = await egrQuery.getMany();

        const totalEgresosDiarios = egrHoy.reduce((acc, e) => {
            const monto = Number(e.monto) || 0;
            const tc = (e.moneda === 'USD') ? (Number(e.tipoCambio) || 6.96) : 1;
            return acc + (monto * tc);
        }, 0);

        const totalEgresos = totalPagosProv + totalEgresosDiarios;
        const totalMovimientosEgresos = pagosProvHoy.length + egrHoy.length;
        const flujoNeto = totalCobranzas - totalEgresos;

        const fechaFormateada = todayStr.split('-').reverse().join('/');
        const ambitoStr = sucursalId 
            ? `${sucursalNom || 'Sucursal'}${ciudadNom ? ` (${ciudadNom})` : ''}`
            : 'Consolidado General (Todas las Sucursales)';

        let msg = `📊 *RESUMEN EJECUTIVO DIARIO - GIPAAF*\n` +
            `📍 Ámbito: *${ambitoStr}*\n` +
            `📅 Fecha: *${fechaFormateada}*\n` +
            `───────────────────\n\n` +
            `📈 *VENTAS CONFIRMADAS*\n` +
            `• Pedidos Facturados: *${ventasHoy.length} ${ventasHoy.length === 1 ? 'nota' : 'notas'}*\n` +
            `💰 Total Facturado: *Bs. ${totalVentas.toLocaleString('es-BO', { minimumFractionDigits: 2 })}*\n\n` +
            `📥 *COBRANZAS RECAUDADAS*\n` +
            `💵 Recaudación Total: *Bs. ${totalCobranzas.toLocaleString('es-BO', { minimumFractionDigits: 2 })}* (${cobHoy.length} ${cobHoy.length === 1 ? 'recibo' : 'recibos'})\n`;

        const metodosEntries = Object.entries(cobByMetodo);
        if (metodosEntries.length > 0) {
            metodosEntries.forEach(([met, data]) => {
                msg += `  ▫️ ${met}: Bs. ${data.total.toLocaleString('es-BO', { minimumFractionDigits: 2 })} (${data.count} ${data.count === 1 ? 'recibo' : 'recibos'})\n`;
            });
        } else {
            msg += `  ▫️ _Sin cobranzas registradas hoy_\n`;
        }

        msg += `\n📤 *EGRESOS OPERATIVOS*\n` +
            `💸 Desembolso Total: *Bs. ${totalEgresos.toLocaleString('es-BO', { minimumFractionDigits: 2 })}* (${totalMovimientosEgresos} ${totalMovimientosEgresos === 1 ? 'movimiento' : 'movimientos'})\n` +
            `  ▫️ Pagos a Proveedores: Bs. ${totalPagosProv.toLocaleString('es-BO', { minimumFractionDigits: 2 })} (${pagosProvHoy.length} ${pagosProvHoy.length === 1 ? 'pago' : 'pagos'})\n` +
            `  ▫️ Egresos Diarios / Caja: Bs. ${totalEgresosDiarios.toLocaleString('es-BO', { minimumFractionDigits: 2 })} (${egrHoy.length} ${egrHoy.length === 1 ? 'egreso' : 'egresos'})\n\n` +
            `───────────────────\n` +
            `✨ *FLUJO NETO DEL DÍA:* *Bs. ${flujoNeto.toLocaleString('es-BO', { minimumFractionDigits: 2 })}*\n` +
            `_(Cobranzas Reales - Total Egresos Operativos)_`;

        return msg;
    }
}
