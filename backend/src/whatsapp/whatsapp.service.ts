import { Injectable, OnModuleInit, OnModuleDestroy, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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
import { Traspaso, EstadoTraspaso, CargoCostoTraspaso } from '../traspasos/traspaso.entity';
import { Muestra, EstadoMuestra } from '../muestras/muestra.entity';

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
        @InjectRepository(Muestra)
        private muestraRepo: Repository<Muestra>,
    ) {}

    async onModuleInit() {
        if (!fs.existsSync(this.baseAuthDir)) {
            fs.mkdirSync(this.baseAuthDir, { recursive: true });
        }

        // Seed or activate bank accounts in DB
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
            } else {
                // Asegurar que las cuentas bancarias existentes en BD queden activadas por defecto
                await this.cuentaBancariaRepo.createQueryBuilder()
                    .update(CuentaBancariaBot)
                    .set({ activo: true })
                    .where('activo = false OR activo IS NULL')
                    .execute();
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
    // HELPERS DE FORMATO DE SUCURSAL
    // ==========================================
    private formatBranchName(sucursalNombre: string, ciudadNombre?: string): string {
        if (!sucursalNombre) return 'Sucursal';
        if (ciudadNombre && !sucursalNombre.toLowerCase().includes(ciudadNombre.toLowerCase())) {
            return `${sucursalNombre} (${ciudadNombre})`;
        }
        return sucursalNombre;
    }

    private getSessionBranchDisplay(session: BranchSession): string {
        return this.formatBranchName(session.sucursalNombre, session.ciudadNombre);
    }

    private formatSucursalDisplay(sucursal?: Sucursal | null): string {
        if (!sucursal) return 'Sucursal Central';
        return this.formatBranchName(sucursal.nombre, sucursal.ciudad?.nombre);
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

        const branchDisplay = this.formatBranchName(sucursalNombre, ciudadNombre);

        const defaultBankAccounts: BankAccountItem[] = [
            {
                id: 'acc_bnb_default',
                banco: 'Banco Nacional de Bolivia (BNB)',
                tipoCuenta: 'Cuenta Corriente BOB',
                numeroCuenta: '100-01928374',
                titular: 'GIPAAF S.R.L.',
                documentoIdentidad: 'NIT: 1029384756',
                qrImage: null,
                activo: true
            },
            {
                id: 'acc_bcp_default',
                banco: 'Banco de Crédito de Bolivia (BCP)',
                tipoCuenta: 'Cuenta Corriente BOB',
                numeroCuenta: '201-50982736',
                titular: 'GIPAAF S.R.L.',
                documentoIdentidad: 'NIT: 1029384756',
                qrImage: null,
                activo: true
            }
        ];

        const defaultConfig: WhatsAppConfig = {
            autoReplyEnabled: true,
            ignoreGroups: true,
            allowClientQueries: true,
            allowSellerQueries: true,
            allowAdminReports: true,
            botName: `GIPAAF Bot (${branchDisplay})`,
            customWelcomeMessage: `¡Hola! Bienvenido al canal oficial de *GIPAAF - ${branchDisplay}*.`,
            bankAccountsInfo: `*CUENTAS BANCARIAS OFICIALES - GIPAAF*\n\n` +
                `🏦 *Banco Nacional de Bolivia (BNB)*\n` +
                `• Cuenta Corriente BOB: 100-01928374\n` +
                `• Titular: GIPAAF S.R.L. - NIT: 1029384756\n\n` +
                `🏦 *Banco de Crédito de Bolivia (BCP)*\n` +
                `• Cuenta Corriente BOB: 201-50982736\n` +
                `• Titular: GIPAAF S.R.L. - NIT: 1029384756\n\n` +
                `📌 _Una vez realizada tu transferencia, envía la foto del comprobante aquí para su validación._`,
            bankAccounts: defaultBankAccounts
        };

        // Load config from file if exists
        let loadedConfig = { ...defaultConfig };
        try {
            if (fs.existsSync(configFile)) {
                const raw = fs.readFileSync(configFile, 'utf-8');
                const parsed = JSON.parse(raw);
                loadedConfig = { ...loadedConfig, ...parsed };
            }
        } catch (e) {
            this.logger.error(`Error al cargar configuración para sucursal ${targetId}:`, e);
        }

        // Asegurar que autoReplyEnabled sea true por defecto para todas las sucursales (actuales y futuras)
        if (loadedConfig.autoReplyEnabled === undefined || loadedConfig.autoReplyEnabled === null || !fs.existsSync(configFile)) {
            loadedConfig.autoReplyEnabled = true;
        }
        if (!loadedConfig.bankAccounts || loadedConfig.bankAccounts.length === 0) {
            loadedConfig.bankAccounts = defaultBankAccounts;
        } else {
            loadedConfig.bankAccounts = loadedConfig.bankAccounts.map(acc => ({
                ...acc,
                activo: acc.activo !== false
            }));
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
                activo: a.activo !== false
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
                autoReplyEnabled: session.config.autoReplyEnabled !== false,
                bankAccounts: dbAccounts.length > 0 ? dbAccounts : session.config.bankAccounts
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
                activo: a.activo !== false
            }));
        } catch (e) {
            this.logger.error('Error al obtener cuentas bancarias para configuración:', e);
        }

        return {
            ...session.config,
            autoReplyEnabled: session.config.autoReplyEnabled !== false,
            bankAccounts: dbAccounts.length > 0 ? dbAccounts : session.config.bankAccounts
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

    public formatClienteDisplay(cliente: any): string {
        if (!cliente) return 'Cliente Final';
        if (cliente.nombreTienda && cliente.nombreTienda.trim()) {
            return cliente.nombreTienda.trim();
        }
        const persona = cliente.persona;
        const personaNombre = persona ? `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() : '';
        return personaNombre || 'Cliente Final';
    }

    // ==========================================
    // ENVÍO DE PROFORMAS EN PDF POR WHATSAPP
    // ==========================================
    async sendProformaPdf(
        proformaId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const proforma = await this.notaRepo.findOne({
            where: { id: proformaId, tipo: TipoNota.PROFORMA },
            relations: [
                'cliente',
                'cliente.persona',
                'vendedor',
                'sucursal',
                'sucursal.ciudad',
                'detalles',
                'detalles.producto',
                'detalles.producto.marca'
            ]
        });

        if (!proforma) {
            throw new NotFoundException(`No se encontró la proforma con ID #${proformaId}`);
        }

        // Determinar teléfono destino
        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && proforma.cliente?.persona?.telefono) {
            phone = proforma.cliente.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el cliente no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        // Determinar sesión de WhatsApp de la sucursal correspondiente o fallback
        let targetSucursalId = sucursalId || proforma.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        // Fallback a cualquier sesión activa si la seleccionada no está conectada
        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = proforma.sucursal?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(proforma.sucursal);
        const pdfBuffer = await this.generateProformaPdfInMemory(proforma, branchDisplay);

        const clienteNombre = this.formatClienteDisplay(proforma.cliente);
        const totalFormatted = Number(proforma.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fechaFormatted = proforma.fecha ? String(proforma.fecha).split('T')[0].split('-').reverse().join('/') : '-';

        const caption = customMessage?.trim() || 
            `📄 *PROFORMA / COTIZACIÓN - ${proforma.numero || 'S/N'}*\n\n` +
            `Hola *${clienteNombre}*,\n` +
            `Le adjuntamos la proforma/cotización emitida por *GIPAAF (${branchDisplay})* por un monto total de *Bs. ${totalFormatted}*.\n\n` +
            `📅 *Fecha:* ${fechaFormatted}\n` +
            `🏢 *Sucursal:* ${branchDisplay}\n` +
            (proforma.vendedor ? `👤 *Asesor Comercial:* ${proforma.vendedor.nombres} ${proforma.vendedor.apellidos}\n` : '') +
            `\n_En el documento PDF adjunto encontrará el detalle de ítems y precios. Si desea confirmar su pedido o requiere alguna modificación, por favor responda a este mensaje._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Proforma_${proforma.numero || proforma.id}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Proforma ${proforma.numero || proforma.id}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Proforma ${proforma.numero || ''} enviada exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    // ==========================================
    // ENVÍO DE NOTAS DE VENTA EN PDF POR WHATSAPP
    // ==========================================
    async sendVentaPdf(
        ventaId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const venta = await this.notaRepo.findOne({
            where: { id: ventaId, tipo: TipoNota.VENTA },
            relations: [
                'cliente',
                'cliente.persona',
                'vendedor',
                'sucursal',
                'sucursal.ciudad',
                'detalles',
                'detalles.producto',
                'detalles.movimientosLote',
                'detalles.movimientosLote.lote'
            ]
        });

        if (!venta) {
            throw new NotFoundException(`No se encontró la nota de venta con ID #${ventaId}`);
        }

        // Determinar teléfono destino
        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && venta.cliente?.persona?.telefono) {
            phone = venta.cliente.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el cliente no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        // Determinar sesión de WhatsApp de la sucursal correspondiente o fallback
        let targetSucursalId = sucursalId || venta.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        // Fallback a cualquier sesión activa si la seleccionada no está conectada
        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = venta.sucursal?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(venta.sucursal);
        const pdfBuffer = await this.generateVentaPdfInMemory(venta, branchDisplay);

        const clienteNombre = this.formatClienteDisplay(venta.cliente);
        const totalFormatted = Number(venta.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fechaFormatted = venta.fecha ? String(venta.fecha).split('T')[0].split('-').reverse().join('/') : '-';

        const caption = customMessage?.trim() || 
            `📄 *NOTA DE VENTA - ${venta.numero || venta.id}*\n\n` +
            `Hola *${clienteNombre}*,\n` +
            `Le adjuntamos el comprobante de su compra emitida por *GIPAAF (${branchDisplay})* por un monto total de *Bs. ${totalFormatted}*.\n\n` +
            `📅 *Fecha:* ${fechaFormatted}\n` +
            `🏢 *Sucursal:* ${branchDisplay}\n` +
            (venta.vendedor ? `👤 *Atendido por:* ${venta.vendedor.nombres} ${venta.vendedor.apellidos}\n` : '') +
            (venta.conFactura ? `📑 *Documento:* CF:${venta.numeroFactura || 'S/N'}\n` : `📑 *Documento:* XF\n`) +
            `\n_En el documento PDF adjunto encontrará el desglose detallado de su compra. ¡Agradecemos su preferencia!_`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Nota_Venta_${venta.numero || venta.id}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Nota Venta ${venta.numero || venta.id}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Nota de Venta ${venta.numero || ''} enviada exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generateVentaPdfInMemory(venta: Nota, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = venta.fecha 
                ? String(venta.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const clientName = this.formatClienteDisplay(venta.cliente);
            const vendedorName = venta.vendedor 
                ? `${venta.vendedor.nombres || ''} ${venta.vendedor.apellidos || ''}`.trim() 
                : 'Sin asignar';

            const formatMoney = (val: number | string) => {
                const num = Number(val) || 0;
                return `Bs. ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const drawHeader = (isFirstPage: boolean) => {
                // Logo a la izquierda
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 130 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }

                // Título a la derecha
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
                doc.text(`Nota de Venta Nro ${venta.numero || venta.id || 'S/N'}`, 245, 34, { width: 314, align: 'right' });

                if (isFirstPage) {
                    // Metadatos (Fecha, Sucursal, Cliente, Vendedor, Documento)
                    doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                    
                    // Fila 1 (Y = 82)
                    doc.text(`Fecha: ${dateStr}`, 36, 82, { width: 250 });
                    doc.text(`Sucursal: ${sucursalNombre}`, 250, 82, { width: 309 });

                    // Fila 2 (Y = 96)
                    doc.text(`Cliente: ${clientName}`, 36, 96, { width: 250, ellipsis: true });
                    if (vendedorName && vendedorName !== 'Sin asignar') {
                        doc.text(`Vendedor: ${vendedorName}`, 250, 96, { width: 309, ellipsis: true });
                    }

                    // Fila 3 (Y = 110)
                    if (venta.conFactura) {
                        doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#333333');
                        doc.text(`Documento: CF:${venta.numeroFactura || 'S/N'}`, 36, 110, { width: 350 });
                    } else {
                        doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                        doc.text(`Documento: XF`, 36, 110, { width: 350 });
                    }
                }
            };

            const drawTableHeader = (startY: number) => {
                // Barra azul del encabezado (#2980b9 / RGB: 41, 128, 185)
                doc.rect(36, startY, 523, 24).fill('#2980b9');
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
                doc.text('Código', 46, startY + 7, { width: 75, align: 'left' });
                doc.text('Producto', 126, startY + 7, { width: 175, align: 'left' });
                doc.text('Lote / Venc.', 306, startY + 7, { width: 90, align: 'left' });
                doc.text('Cant.', 401, startY + 7, { width: 35, align: 'center' });
                doc.text('P.Unit', 441, startY + 7, { width: 55, align: 'right' });
                doc.text('Subtotal', 501, startY + 7, { width: 48, align: 'right' });
            };

            // Página 1
            drawHeader(true);
            let currentY = 136;
            drawTableHeader(currentY);
            currentY += 24;

            const rowHeight = 22;
            const maxY = 680;
            const detalles = venta.detalles || [];

            detalles.forEach((det, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 80;
                    drawTableHeader(currentY);
                    currentY += 24;
                }

                // Fondo alternado (#f5f7fa / [245, 247, 250])
                if (idx % 2 === 0) {
                    doc.rect(36, currentY, 523, rowHeight).fill('#f5f7fa');
                }

                const prodCodigo = det.producto?.codigo || '-';
                const prodNombre = det.producto?.nombre || '-';
                
                const loteInfo = det.movimientosLote && det.movimientosLote.length > 0
                    ? det.movimientosLote.map((m: any) => `${m.lote?.numeroLote || 'S/N'}${m.lote?.fechaVencimiento ? ' (' + String(m.lote.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') + ')' : ''}`).join(', ')
                    : (det.numeroLote ? `${det.numeroLote}${det.fechaVencimiento ? ' (' + String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') + ')' : ''}` : '-');

                const cantNum = Number(det.cantidad || 0);
                const precioNum = Number(det.precioUnitario || 0);
                const subtotalNum = Number(det.subtotal || cantNum * precioNum);

                doc.font('Helvetica').fontSize(9).fillColor('#333333');
                doc.text(prodCodigo, 46, currentY + 6, { width: 75, lineBreak: false, ellipsis: true });
                doc.text(prodNombre, 126, currentY + 6, { width: 175, lineBreak: false, ellipsis: true });
                doc.text(loteInfo, 306, currentY + 6, { width: 90, lineBreak: false, ellipsis: true });
                doc.text(String(cantNum), 401, currentY + 6, { width: 35, align: 'center' });
                doc.text(formatMoney(precioNum), 441, currentY + 6, { width: 55, align: 'right' });
                doc.text(formatMoney(subtotalNum), 501, currentY + 6, { width: 48, align: 'right' });

                currentY += rowHeight;
            });

            // Totales y Son en letras
            const subtotalCalc = detalles.reduce((acc, d) => acc + (Number(d.cantidad || 0) * Number(d.precioUnitario || 0)), 0);
            const desc1 = (subtotalCalc * Number(venta.descuentoPorcentaje || 0)) / 100;
            const sub1 = subtotalCalc - desc1;
            const desc2 = (sub1 * Number(venta.descuentoPromocionPorcentaje || 0)) / 100;
            const totalCalc = Number(venta.total || (sub1 - desc2));

            if (currentY + 100 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 80;
            } else {
                currentY += 16;
            }

            const totalsStartY = currentY;

            // Lado izquierdo: Son en letras y Notas
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Son: ${this.numeroALetras(totalCalc)}`, 36, totalsStartY, { width: 300 });

            if (venta.observaciones) {
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050').text('Notas:', 36, totalsStartY + 20);
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#505050').text(venta.observaciones, 36, totalsStartY + 34, { width: 300 });
            }

            // Lado derecho: Desglose de Totales
            let rightTotalsY = totalsStartY;
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Subtotal: ${formatMoney(subtotalCalc)}`, 320, rightTotalsY, { width: 239, align: 'right' });
            rightTotalsY += 16;

            if (desc1 > 0) {
                doc.text(`Descuento (${venta.descuentoPorcentaje}%): -${formatMoney(desc1)}`, 320, rightTotalsY, { width: 239, align: 'right' });
                rightTotalsY += 16;
            }

            if (desc2 > 0) {
                doc.text(`Promoción (${venta.descuentoPromocionPorcentaje}%): -${formatMoney(desc2)}`, 320, rightTotalsY, { width: 239, align: 'right' });
                rightTotalsY += 16;
            }

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
            doc.text(`Total: ${formatMoney(totalCalc)}`, 320, rightTotalsY, { width: 239, align: 'right' });

            // Numeración de páginas en pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Comprobante de Venta • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    private generateProformaPdfInMemory(proforma: Nota, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = proforma.fecha 
                ? String(proforma.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const clientName = this.formatClienteDisplay(proforma.cliente);
            const vendedorName = proforma.vendedor 
                ? `${proforma.vendedor.nombres || ''} ${proforma.vendedor.apellidos || ''}`.trim() 
                : 'Sin asignar';

            const formatMoney = (val: number | string) => {
                const num = Number(val) || 0;
                return `Bs. ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const drawHeader = (isFirstPage: boolean) => {
                // Logo a la izquierda
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 130 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }

                // Título a la derecha
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
                doc.text(`PROFORMA - ${proforma.numero || 'S/N'}`, 295, 34, { width: 264, align: 'right' });

                if (isFirstPage) {
                    // Metadatos (Fecha, Sucursal, Cliente, Vendedor)
                    doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                    
                    // Fila 1 (Y = 82)
                    doc.text(`Fecha: ${dateStr}`, 36, 82, { width: 250 });
                    doc.text(`Sucursal: ${sucursalNombre}`, 250, 82, { width: 309 });

                    // Fila 2 (Y = 98)
                    doc.text(`Cliente: ${clientName}`, 36, 98, { width: 250, ellipsis: true });
                    if (vendedorName && vendedorName !== 'Sin asignar') {
                        doc.text(`Vendedor: ${vendedorName}`, 250, 98, { width: 309, ellipsis: true });
                    }
                }
            };

            const drawTableHeader = (startY: number) => {
                // Barra azul del encabezado (#2980b9 / RGB: 41, 128, 185)
                doc.rect(36, startY, 523, 24).fill('#2980b9');
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
                doc.text('Código', 46, startY + 7, { width: 85, align: 'left' });
                doc.text('Producto', 136, startY + 7, { width: 200, align: 'left' });
                doc.text('Cant.', 341, startY + 7, { width: 45, align: 'center' });
                doc.text('P.Unit', 391, startY + 7, { width: 75, align: 'right' });
                doc.text('Subtotal', 471, startY + 7, { width: 78, align: 'right' });
            };

            // Página 1
            drawHeader(true);
            let currentY = 126;
            drawTableHeader(currentY);
            currentY += 24;

            const rowHeight = 22;
            const maxY = 680;
            const detalles = proforma.detalles || [];

            detalles.forEach((det, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 80;
                    drawTableHeader(currentY);
                    currentY += 24;
                }

                // Fondo alternado (#f5f7fa / [245, 247, 250])
                if (idx % 2 === 0) {
                    doc.rect(36, currentY, 523, rowHeight).fill('#f5f7fa');
                }

                const prodCodigo = det.producto?.codigo || '-';
                const prodNombre = det.producto?.nombre || '-';
                const cantNum = Number(det.cantidad || 0);
                const precioNum = Number(det.precioUnitario || 0);
                const subtotalNum = Number(det.subtotal || cantNum * precioNum);

                doc.font('Helvetica').fontSize(9).fillColor('#333333');
                doc.text(prodCodigo, 46, currentY + 6, { width: 85, lineBreak: false, ellipsis: true });
                doc.text(prodNombre, 136, currentY + 6, { width: 200, lineBreak: false, ellipsis: true });
                doc.text(String(cantNum), 341, currentY + 6, { width: 45, align: 'center' });
                doc.text(formatMoney(precioNum), 391, currentY + 6, { width: 75, align: 'right' });
                doc.text(formatMoney(subtotalNum), 471, currentY + 6, { width: 78, align: 'right' });

                currentY += rowHeight;
            });

            // Totales y Son en letras
            const subtotalCalc = detalles.reduce((acc, d) => acc + (Number(d.cantidad || 0) * Number(d.precioUnitario || 0)), 0);
            const desc1 = (subtotalCalc * Number(proforma.descuentoPorcentaje || 0)) / 100;
            const sub1 = subtotalCalc - desc1;
            const desc2 = (sub1 * Number(proforma.descuentoPromocionPorcentaje || 0)) / 100;
            const totalCalc = Number(proforma.total || (sub1 - desc2));

            if (currentY + 100 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 80;
            } else {
                currentY += 16;
            }

            const totalsStartY = currentY;

            // Lado izquierdo: Son en letras y Notas
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Son: ${this.numeroALetras(totalCalc)}`, 36, totalsStartY, { width: 300 });

            if (proforma.observaciones) {
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050').text('Notas:', 36, totalsStartY + 20);
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#505050').text(proforma.observaciones, 36, totalsStartY + 34, { width: 300 });
            }

            // Lado derecho: Desglose de Totales
            let rightTotalsY = totalsStartY;
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Subtotal: ${formatMoney(subtotalCalc)}`, 320, rightTotalsY, { width: 239, align: 'right' });
            rightTotalsY += 16;

            if (desc1 > 0) {
                doc.text(`Descuento (${proforma.descuentoPorcentaje}%): -${formatMoney(desc1)}`, 320, rightTotalsY, { width: 239, align: 'right' });
                rightTotalsY += 16;
            }

            if (desc2 > 0) {
                doc.text(`Promoción (${proforma.descuentoPromocionPorcentaje}%): -${formatMoney(desc2)}`, 320, rightTotalsY, { width: 239, align: 'right' });
                rightTotalsY += 16;
            }

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
            doc.text(`Total: ${formatMoney(totalCalc)}`, 320, rightTotalsY, { width: 239, align: 'right' });

            // Numeración de páginas en pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Documento Informativo de Cotización • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // 3. ENVÍO DE RECIBOS DE COBRANZA EN PDF POR WHATSAPP
    // ==========================================
    async sendCobranzaPdf(
        pagoId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const pago = await this.pagoCobranzaRepo.findOne({
            where: { id: pagoId },
            relations: [
                'nota',
                'nota.vendedor',
                'nota.sucursal',
                'nota.sucursal.ciudad',
                'cliente',
                'cliente.persona',
                'cliente.sucursal',
                'cliente.sucursal.ciudad'
            ]
        });

        if (!pago) {
            throw new NotFoundException(`No se encontró el pago de cobranza con ID #${pagoId}`);
        }

        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && pago.cliente?.persona?.telefono) {
            phone = pago.cliente.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el cliente no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        const targetSucursalObj = pago.nota?.sucursal || pago.cliente?.sucursal;
        let targetSucursalId = sucursalId || targetSucursalObj?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = targetSucursalObj?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(targetSucursalObj);
        const pdfBuffer = await this.generateCobranzaPdfInMemory(pago, branchDisplay);

        const folio = `REC-${String(pago.id).padStart(6, '0')}`;
        const clienteNombre = this.formatClienteDisplay(pago.cliente);
        const isUSD = pago.moneda === 'USD';
        const simbolo = isUSD ? '$us' : 'Bs.';
        const montoFormatted = Number(pago.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fechaFormatted = pago.fecha ? String(pago.fecha).split('T')[0].split('-').reverse().join('/') : '-';
        const saldoVenta = pago.nota?.saldo !== undefined ? Number(pago.nota.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

        const caption = customMessage?.trim() || 
            `💵 *RECIBO DE COBRANZA - ${folio}*\n\n` +
            `Hola *${clienteNombre}*,\n` +
            `Confirmamos la recepción de su pago por un monto de *${simbolo} ${montoFormatted}* (${pago.metodoPago || 'Efectivo'}).\n\n` +
            `📅 *Fecha de Pago:* ${fechaFormatted}\n` +
            `🏢 *Sucursal:* ${branchDisplay}\n` +
            (pago.referencia ? `🔖 *Referencia / N° Transacción:* ${pago.referencia}\n` : '') +
            (pago.nota?.numero ? `🧾 *Venta Asociada:* N° ${pago.nota.numero}\n` : '') +
            (saldoVenta !== null ? `⚖️ *Saldo Restante:* Bs. ${saldoVenta}\n` : '') +
            `\n_Adjuntamos su Recibo Oficial en formato PDF. ¡Muchas gracias por su puntualidad!_`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Recibo_Cobranza_${folio}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Recibo ${folio}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Recibo ${folio} enviado exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generateCobranzaPdfInMemory(pago: PagoCobranza, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const folio = `REC-${String(pago.id).padStart(6, '0')}`;
            const dateStr = pago.fecha 
                ? String(pago.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const clientName = this.formatClienteDisplay(pago.cliente);
            const nitCi = pago.cliente?.persona?.ci || '-';
            const tel = pago.cliente?.persona?.telefono || '-';
            const vendedorName = pago.nota?.vendedor 
                ? `${pago.nota.vendedor.nombres || ''} ${pago.nota.vendedor.apellidos || ''}`.trim() 
                : 'Caja / General';

            const formatMoney = (val: number | string) => {
                const num = Number(val) || 0;
                return `Bs. ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const isUSD = pago.moneda === 'USD';
            const simbolo = isUSD ? '$us' : 'Bs.';
            const montoNum = Number(pago.monto || 0);

            // 1. Logo
            const possibleLogoPaths = [
                path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                path.join(process.cwd(), '../logo.JPEG'),
                path.join(process.cwd(), 'logo.jpeg'),
                path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
            ];
            const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
            if (logoFile) {
                try {
                    doc.image(logoFile, 36, 26, { width: 130 });
                } catch (e) {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }
            } else {
                doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
            }

            // 2. Título a la derecha
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
            doc.text(`Recibo de Cobranza Nro ${folio}`, 245, 34, { width: 314, align: 'right' });

            // 3. Metadatos
            doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
            doc.text(`Fecha de Pago: ${dateStr}`, 36, 82, { width: 250 });
            doc.text(`Sucursal: ${sucursalNombre}`, 250, 82, { width: 309 });

            doc.text(`Recibido de: ${clientName}`, 36, 96, { width: 250, ellipsis: true });
            doc.text(`Atendido por: ${vendedorName}`, 250, 96, { width: 309, ellipsis: true });

            doc.text(`NIT / CI: ${nitCi}`, 36, 110, { width: 250 });
            doc.text(`Teléfono: ${tel}`, 250, 110, { width: 309 });

            // 4. Tabla azul (#2980b9)
            const tableY = 136;
            doc.rect(36, tableY, 523, 24).fill('#2980b9');
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
            doc.text('Concepto / Venta Asociada', 46, tableY + 7, { width: 170, align: 'left' });
            doc.text('Método de Pago', 220, tableY + 7, { width: 85, align: 'left' });
            doc.text('N° Referencia', 310, tableY + 7, { width: 75, align: 'left' });
            doc.text('Total Venta', 390, tableY + 7, { width: 75, align: 'right' });
            doc.text('Monto Pagado', 470, tableY + 7, { width: 79, align: 'right' });

            // Fila de detalle
            const rowY = tableY + 24;
            const rowHeight = 26;
            doc.rect(36, rowY, 523, rowHeight).fill('#ffffff');

            const concepto = pago.nota?.numero 
                ? `Abono a Venta N° ${pago.nota.numero}` 
                : (pago.observaciones || 'Cobranza de Cuenta por Cobrar');

            doc.font('Helvetica').fontSize(9).fillColor('#333333');
            doc.text(concepto, 46, rowY + 8, { width: 170, ellipsis: true });
            doc.text(pago.metodoPago || 'Efectivo', 220, rowY + 8, { width: 85 });
            doc.text(pago.referencia || '-', 310, rowY + 8, { width: 75 });

            const totalVentaStr = pago.nota?.total !== undefined ? formatMoney(pago.nota.total) : '-';
            doc.text(totalVentaStr, 390, rowY + 8, { width: 75, align: 'right' });

            doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827');
            doc.text(`${simbolo} ${montoNum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 470, rowY + 8, { width: 79, align: 'right' });

            // 5. Bloque de Saldos y Totales
            let totalsY = rowY + rowHeight + 16;

            // Son en letras
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Son: ${this.numeroALetras(montoNum)}`, 36, totalsY, { width: 300 });

            if (pago.observaciones) {
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050').text('Notas / Observaciones:', 36, totalsY + 20);
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#505050').text(pago.observaciones, 36, totalsY + 34, { width: 300 });
            }

            // Totales a la derecha
            let rightTotalsY = totalsY;
            if (pago.nota?.saldo !== undefined) {
                const saldoRestante = Number(pago.nota.saldo);
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                doc.text(`Saldo Restante de Venta:`, 300, rightTotalsY, { width: 160, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(saldoRestante <= 0.001 ? '#16a34a' : '#dc2626');
                doc.text(formatMoney(saldoRestante), 465, rightTotalsY, { width: 94, align: 'right' });
                rightTotalsY += 18;
            }

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
            doc.text(`Total Cobrado:`, 300, rightTotalsY, { width: 160, align: 'right' });
            doc.text(`${simbolo} ${montoNum.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 465, rightTotalsY, { width: 94, align: 'right' });

            // 6. Firmas de conformidad
            const signY = 620;
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // Firma Cliente
            doc.moveTo(60, signY).lineTo(220, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('ENTREGUÉ CONFORME', 60, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Firma del Cliente', 60, signY + 18, { width: 160, align: 'center' });

            // Firma Cobrador
            doc.moveTo(340, signY).lineTo(500, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('RECIBÍ CONFORME', 340, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Caja / Cobranzas GIPAAF', 340, signY + 18, { width: 160, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Comprobante de Cobranza • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // 4. ENVÍO DE ORDEN DE COMPRA EN PDF POR WHATSAPP
    // ==========================================
    async sendCompraPdf(
        compraId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const compra = await this.notaRepo.findOne({
            where: { id: compraId, tipo: TipoNota.COMPRA },
            relations: [
                'proveedor',
                'proveedor.persona',
                'sucursal',
                'sucursal.ciudad',
                'detalles',
                'detalles.producto'
            ]
        });

        if (!compra) {
            throw new NotFoundException(`No se encontró la orden de compra con ID #${compraId}`);
        }

        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && compra.proveedor?.persona?.telefono) {
            phone = compra.proveedor.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el proveedor no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        let targetSucursalId = sucursalId || compra.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = compra.sucursal?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(compra.sucursal);
        const pdfBuffer = await this.generateCompraPdfInMemory(compra, branchDisplay);

        const provNombre = compra.proveedor?.empresa 
            ? `${compra.proveedor.empresa}` 
            : (compra.proveedor?.persona ? `${compra.proveedor.persona.nombres || ''} ${compra.proveedor.persona.apellidos || ''}`.trim() : 'Estimado Proveedor');
        const isUSD = compra.moneda === 'USD';
        const simbolo = isUSD ? '$us' : 'Bs.';
        const totalFormatted = Number(compra.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fechaFormatted = compra.fecha ? String(compra.fecha).split('T')[0].split('-').reverse().join('/') : '-';

        const caption = customMessage?.trim() || 
            `📦 *ORDEN DE COMPRA - ${compra.numero || compra.id}*\n\n` +
            `Hola *${provNombre}*,\n` +
            `Le enviamos la Orden de Compra emitida por *GIPAAF (${branchDisplay})* por un monto total de *${simbolo} ${totalFormatted}*.\n\n` +
            `📅 *Fecha:* ${fechaFormatted}\n` +
            `🏢 *Sucursal Solicitante:* ${branchDisplay}\n` +
            `\n_En el documento PDF adjunto encontrará el detalle de productos, cantidades y especificaciones requeridas._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Orden_Compra_${compra.numero || compra.id}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Orden de Compra ${compra.numero || compra.id}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Orden de Compra ${compra.numero || ''} enviada exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generateCompraPdfInMemory(compra: Nota, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = compra.fecha 
                ? String(compra.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const provEmpresa = compra.proveedor?.empresa || 'Proveedor';
            const provContacto = compra.proveedor?.persona 
                ? `${compra.proveedor.persona.nombres || ''} ${compra.proveedor.persona.apellidos || ''}`.trim() 
                : '-';
            const provRuc = compra.proveedor?.ruc || compra.proveedor?.persona?.ci || '-';
            const provTel = compra.proveedor?.persona?.telefono || '-';
            const provPais = compra.proveedor?.pais || 'Bolivia';

            const isUSD = compra.moneda === 'USD';
            const simbolo = isUSD ? '$us' : 'Bs.';
            const formatMoney = (val: number | string) => {
                const num = Number(val) || 0;
                return `${simbolo} ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            const drawHeader = (isFirstPage: boolean) => {
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 130 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }

                // Título a la derecha
                doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
                doc.text(`ORDEN DE COMPRA Nro ${compra.numero || compra.id || 'S/N'}`, 245, 34, { width: 314, align: 'right' });

                if (isFirstPage) {
                    doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                    // Fila 1
                    doc.text(`Fecha: ${dateStr}`, 36, 82, { width: 250 });
                    doc.text(`Sucursal Solicitante: ${sucursalNombre}`, 250, 82, { width: 309 });

                    // Fila 2
                    doc.text(`Proveedor: ${provEmpresa}`, 36, 96, { width: 250, ellipsis: true });
                    doc.text(`Contacto: ${provContacto}`, 250, 96, { width: 309, ellipsis: true });

                    // Fila 3
                    doc.text(`RUC / NIT: ${provRuc}`, 36, 110, { width: 250 });
                    doc.text(`Teléfono / País: ${provTel} (${provPais})`, 250, 110, { width: 309 });
                }
            };

            const drawTableHeader = (startY: number) => {
                doc.rect(36, startY, 523, 24).fill('#2980b9');
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
                doc.text('Código', 46, startY + 7, { width: 75, align: 'left' });
                doc.text('Producto / Descripción', 126, startY + 7, { width: 175, align: 'left' });
                doc.text('Lote / Venc.', 306, startY + 7, { width: 90, align: 'left' });
                doc.text('Cant.', 401, startY + 7, { width: 35, align: 'center' });
                doc.text('P.Unit', 441, startY + 7, { width: 55, align: 'right' });
                doc.text('Subtotal', 501, startY + 7, { width: 48, align: 'right' });
            };

            drawHeader(true);
            let currentY = 136;
            drawTableHeader(currentY);
            currentY += 24;

            const rowHeight = 22;
            const maxY = 680;
            const detalles = compra.detalles || [];

            detalles.forEach((det, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 80;
                    drawTableHeader(currentY);
                    currentY += 24;
                }

                if (idx % 2 === 0) {
                    doc.rect(36, currentY, 523, rowHeight).fill('#f5f7fa');
                }

                const prodCodigo = det.producto?.codigo || '-';
                const prodNombre = det.producto?.nombre || '-';
                const loteInfo = det.numeroLote ? `${det.numeroLote}${det.fechaVencimiento ? ' (' + String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') + ')' : ''}` : '-';

                const cantNum = Number(det.cantidad || 0);
                const precioNum = Number(det.precioUnitario || 0);
                const subtotalNum = Number(det.subtotal || cantNum * precioNum);

                doc.font('Helvetica').fontSize(9).fillColor('#333333');
                doc.text(prodCodigo, 46, currentY + 6, { width: 75, lineBreak: false, ellipsis: true });
                doc.text(prodNombre, 126, currentY + 6, { width: 175, lineBreak: false, ellipsis: true });
                doc.text(loteInfo, 306, currentY + 6, { width: 90, lineBreak: false, ellipsis: true });
                doc.text(String(cantNum), 401, currentY + 6, { width: 35, align: 'center' });
                doc.text(formatMoney(precioNum), 441, currentY + 6, { width: 55, align: 'right' });
                doc.text(formatMoney(subtotalNum), 501, currentY + 6, { width: 48, align: 'right' });

                currentY += rowHeight;
            });

            const subtotalCalc = detalles.reduce((acc, d) => acc + (Number(d.cantidad || 0) * Number(d.precioUnitario || 0)), 0);
            const desc1 = (subtotalCalc * Number(compra.descuentoPorcentaje || 0)) / 100;
            const totalCalc = Number(compra.total || (subtotalCalc - desc1));

            if (currentY + 100 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 80;
            } else {
                currentY += 16;
            }

            const totalsStartY = currentY;

            // Son en letras y notas
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            const literal = this.numeroALetras(totalCalc);
            doc.text(`Son: ${literal} ${isUSD ? 'DÓLARES AMERICANOS' : 'BOLIVIANOS'}`, 36, totalsStartY, { width: 300 });

            if (compra.observaciones) {
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050').text('Notas:', 36, totalsStartY + 20);
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#505050').text(compra.observaciones, 36, totalsStartY + 34, { width: 300 });
            }

            // Desglose de Totales
            let rightTotalsY = totalsStartY;
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Subtotal: ${formatMoney(subtotalCalc)}`, 320, rightTotalsY, { width: 239, align: 'right' });
            rightTotalsY += 16;

            if (desc1 > 0) {
                doc.text(`Descuento (${compra.descuentoPorcentaje}%): -${formatMoney(desc1)}`, 320, rightTotalsY, { width: 239, align: 'right' });
                rightTotalsY += 16;
            }

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
            doc.text(`Total Orden: ${formatMoney(totalCalc)}`, 320, rightTotalsY, { width: 239, align: 'right' });

            // Numeración de páginas
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Orden Oficial de Compra • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // 5. ENVÍO DE COMPROBANTE DE PAGO A PROVEEDOR EN PDF POR WHATSAPP
    // ==========================================
    async sendPagoProveedorPdf(
        pagoId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const pago = await this.pagoProveedorRepo.findOne({
            where: { id: pagoId },
            relations: [
                'nota',
                'nota.sucursal',
                'nota.sucursal.ciudad',
                'proveedor',
                'proveedor.persona'
            ]
        });

        if (!pago) {
            throw new NotFoundException(`No se encontró el pago a proveedor con ID #${pagoId}`);
        }

        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && pago.proveedor?.persona?.telefono) {
            phone = pago.proveedor.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el proveedor no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        const targetSucursalObj = pago.nota?.sucursal;
        let targetSucursalId = sucursalId || targetSucursalObj?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = targetSucursalObj?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(targetSucursalObj);
        const pdfBuffer = await this.generatePagoProveedorPdfInMemory(pago, branchDisplay);

        const folio = `PAG-${String(pago.id).padStart(6, '0')}`;
        const provNombre = pago.proveedor?.empresa 
            ? `${pago.proveedor.empresa}` 
            : (pago.proveedor?.persona ? `${pago.proveedor.persona.nombres || ''} ${pago.proveedor.persona.apellidos || ''}`.trim() : 'Estimado Proveedor');
        const isUSD = pago.moneda === 'USD';
        const simbolo = isUSD ? '$us' : 'Bs.';
        const montoFormatted = Number(pago.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const fechaFormatted = pago.fecha ? String(pago.fecha).split('T')[0].split('-').reverse().join('/') : '-';
        const saldoCompra = pago.nota?.saldo !== undefined ? Number(pago.nota.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : null;

        const caption = customMessage?.trim() || 
            `💵 *COMPROBANTE DE PAGO A PROVEEDOR - ${folio}*\n\n` +
            `Hola *${provNombre}*,\n` +
            `Le adjuntamos el comprobante del pago emitido por *GIPAAF (${branchDisplay})* por un monto de *${simbolo} ${montoFormatted}* (${pago.metodoPago || 'Transferencia Bancaria'}).\n\n` +
            `📅 *Fecha de Pago:* ${fechaFormatted}\n` +
            `🏢 *Sucursal:* ${branchDisplay}\n` +
            (pago.referencia ? `🔖 *N° Transferencia / Referencia:* ${pago.referencia}\n` : '') +
            (pago.nota?.numero ? `🧾 *Orden de Compra:* N° ${pago.nota.numero}\n` : '') +
            (saldoCompra !== null ? `⚖️ *Saldo Restante de la Compra:* ${simbolo} ${saldoCompra}\n` : '') +
            `\n_En el documento PDF adjunto encontrará el respaldo oficial del desembolso._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Comprobante_Pago_${folio}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Pago Proveedor ${folio}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Comprobante de Pago ${folio} enviado exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generatePagoProveedorPdfInMemory(pago: PagoProveedor, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const folio = `PAG-${String(pago.id).padStart(6, '0')}`;
            const dateStr = pago.fecha 
                ? String(pago.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const provEmpresa = pago.proveedor?.empresa || 'Proveedor';
            const provContacto = pago.proveedor?.persona 
                ? `${pago.proveedor.persona.nombres || ''} ${pago.proveedor.persona.apellidos || ''}`.trim() 
                : '-';
            const provRuc = pago.proveedor?.ruc || pago.proveedor?.persona?.ci || '-';
            const provTel = pago.proveedor?.persona?.telefono || '-';

            const isUSD = pago.moneda === 'USD';
            const simbolo = isUSD ? '$us' : 'Bs.';
            const montoNum = Number(pago.monto || 0);

            const formatMoney = (val: number | string) => {
                const num = Number(val) || 0;
                return `${simbolo} ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            // 1. Logo
            const possibleLogoPaths = [
                path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                path.join(process.cwd(), '../logo.JPEG'),
                path.join(process.cwd(), 'logo.jpeg'),
                path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
            ];
            const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
            if (logoFile) {
                try {
                    doc.image(logoFile, 36, 26, { width: 130 });
                } catch (e) {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }
            } else {
                doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
            }

            // 2. Título a la derecha
            doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
            doc.text(`Comprobante de Pago Nro ${folio}`, 245, 34, { width: 314, align: 'right' });

            // 3. Metadatos
            doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
            doc.text(`Fecha de Pago: ${dateStr}`, 36, 82, { width: 250 });
            doc.text(`Sucursal: ${sucursalNombre}`, 250, 82, { width: 309 });

            doc.text(`Proveedor: ${provEmpresa}`, 36, 96, { width: 250, ellipsis: true });
            doc.text(`Contacto: ${provContacto}`, 250, 96, { width: 309, ellipsis: true });

            doc.text(`RUC / NIT: ${provRuc}`, 36, 110, { width: 250 });
            doc.text(`Teléfono: ${provTel}`, 250, 110, { width: 309 });

            // 4. Tabla azul (#2980b9)
            const tableY = 136;
            doc.rect(36, tableY, 523, 24).fill('#2980b9');
            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
            doc.text('Concepto / Orden de Compra', 46, tableY + 7, { width: 170, align: 'left' });
            doc.text('Método de Pago', 220, tableY + 7, { width: 85, align: 'left' });
            doc.text('N° Referencia', 310, tableY + 7, { width: 75, align: 'left' });
            doc.text('Total Compra', 390, tableY + 7, { width: 75, align: 'right' });
            doc.text('Monto Pagado', 470, tableY + 7, { width: 79, align: 'right' });

            // Fila de detalle
            const rowY = tableY + 24;
            const rowHeight = 26;
            doc.rect(36, rowY, 523, rowHeight).fill('#ffffff');

            const concepto = pago.nota?.numero 
                ? `Pago a Orden de Compra N° ${pago.nota.numero}` 
                : (pago.observaciones || 'Pago general a proveedor');

            doc.font('Helvetica').fontSize(9).fillColor('#333333');
            doc.text(concepto, 46, rowY + 8, { width: 170, ellipsis: true });
            doc.text(pago.metodoPago || 'Transferencia', 220, rowY + 8, { width: 85 });
            doc.text(pago.referencia || '-', 310, rowY + 8, { width: 75 });

            const totalCompraStr = pago.nota?.total !== undefined ? formatMoney(pago.nota.total) : '-';
            doc.text(totalCompraStr, 390, rowY + 8, { width: 75, align: 'right' });

            doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827');
            doc.text(formatMoney(montoNum), 470, rowY + 8, { width: 79, align: 'right' });

            // 5. Bloque de Saldos y Totales
            let totalsY = rowY + rowHeight + 16;

            // Son en letras
            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            const literal = this.numeroALetras(montoNum);
            doc.text(`Son: ${literal} ${isUSD ? 'DÓLARES AMERICANOS' : 'BOLIVIANOS'}`, 36, totalsY, { width: 300 });

            if (pago.observaciones) {
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050').text('Notas / Observaciones:', 36, totalsY + 20);
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#505050').text(pago.observaciones, 36, totalsY + 34, { width: 300 });
            }

            // Totales a la derecha
            let rightTotalsY = totalsY;
            if (pago.nota?.saldo !== undefined) {
                const saldoRestante = Number(pago.nota.saldo);
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                doc.text(`Saldo Restante de Compra:`, 300, rightTotalsY, { width: 160, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor(saldoRestante <= 0.001 ? '#16a34a' : '#dc2626');
                doc.text(formatMoney(saldoRestante), 465, rightTotalsY, { width: 94, align: 'right' });
                rightTotalsY += 18;
            }

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
            doc.text(`Total Pagado:`, 300, rightTotalsY, { width: 160, align: 'right' });
            doc.text(formatMoney(montoNum), 465, rightTotalsY, { width: 94, align: 'right' });

            // 6. Firmas
            const signY = 620;
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // Firma Administración
            doc.moveTo(60, signY).lineTo(220, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('EMITIDO POR', 60, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Administración / Finanzas GIPAAF', 60, signY + 18, { width: 160, align: 'center' });

            // Firma Proveedor
            doc.moveTo(340, signY).lineTo(500, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('RECIBIDO POR', 340, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Proveedor / Beneficiario', 340, signY + 18, { width: 160, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Comprobante de Pago a Proveedor • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // 6. ENVÍO DE GUÍA DE TRASPASO EN PDF POR WHATSAPP
    // ==========================================
    async sendTraspasoPdf(
        traspasoId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const traspaso = await this.traspasoRepo.findOne({
            where: { id: traspasoId },
            relations: [
                'sucursalOrigen',
                'sucursalOrigen.ciudad',
                'sucursalDestino',
                'sucursalDestino.ciudad',
                'usuario',
                'detalles',
                'detalles.producto',
                'detalles.producto.marca'
            ]
        });

        if (!traspaso) {
            throw new NotFoundException(`No se encontró el traspaso con ID #${traspasoId}`);
        }

        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone) {
            phone = traspaso.sucursalDestino?.telefono || traspaso.sucursalOrigen?.telefono || '';
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino para enviar la guía de traspaso.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        const targetSucursalObj = traspaso.sucursalOrigen || traspaso.sucursalDestino;
        let targetSucursalId = sucursalId || targetSucursalObj?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = targetSucursalObj?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const pdfBuffer = await this.generateTraspasoPdfInMemory(traspaso);

        const codigoStr = traspaso.codigo || `TR-${traspaso.id}`;
        const fechaFormatted = traspaso.fecha ? String(traspaso.fecha).split('T')[0].split('-').reverse().join('/') : '-';
        const origName = this.formatSucursalDisplay(traspaso.sucursalOrigen);
        const destName = this.formatSucursalDisplay(traspaso.sucursalDestino);
        const totalItems = traspaso.detalles?.reduce((acc, d) => acc + Number(d.cantidad || 0), 0) || 0;

        const caption = customMessage?.trim() || 
            `🚚 *GUÍA DE TRASPASO ENTRE SUCURSALES - ${codigoStr}*\n\n` +
            `Se ha generado la Guía de Traspaso de mercadería desde *${origName}* hacia *${destName}*.\n\n` +
            `📅 *Fecha:* ${fechaFormatted}\n` +
            `📦 *Total Unidades:* ${totalItems.toLocaleString('es-BO')}\n` +
            (traspaso.motivo ? `📝 *Motivo:* ${traspaso.motivo}\n` : '') +
            (Number(traspaso.costoTransporte) > 0 ? `💰 *Costo Transporte:* Bs. ${Number(traspaso.costoTransporte).toLocaleString('es-BO', { minimumFractionDigits: 2 })} (Asume: ${traspaso.sucursalCargoCosto === CargoCostoTraspaso.DESTINO ? 'Destino' : 'Origen'})\n` : '') +
            `\n_En el documento PDF adjunto encontrará la relación completa de productos, lotes y cantidades._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Guia_Traspaso_${codigoStr}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Guía Traspaso ${codigoStr}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Guía de Traspaso ${codigoStr} enviada exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generateTraspasoPdfInMemory(traspaso: Traspaso): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const codigo = traspaso.codigo || `TR-${traspaso.id}`;
            const dateStr = traspaso.fecha 
                ? String(traspaso.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const origName = this.formatSucursalDisplay(traspaso.sucursalOrigen);
            const destName = this.formatSucursalDisplay(traspaso.sucursalDestino);
            const usuarioName = traspaso.usuario ? `${(traspaso.usuario as any).nombres || ''} ${(traspaso.usuario as any).apellidos || (traspaso.usuario as any).username || ''}`.trim() : 'Sistema';

            const drawHeader = (isFirstPage: boolean) => {
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 130 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }

                doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
                doc.text(`GUÍA DE TRASPASO Nro ${codigo}`, 245, 34, { width: 314, align: 'right' });

                if (isFirstPage) {
                    doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                    // Fila 1: Fecha y Estado
                    doc.text(`Fecha: ${dateStr}`, 36, 80, { width: 220 });
                    doc.text(`Estado: ${traspaso.estado === EstadoTraspaso.COMPLETADO ? 'COMPLETADO' : 'ANULADO'}`, 270, 80, { width: 280 });

                    // Fila 2: Sucursal Origen (Salida) en su propia línea
                    doc.text(`Sucursal Origen (Salida): ${origName}`, 36, 94, { width: 523 });

                    // Fila 3: Sucursal Destino (Ingreso) en la siguiente línea
                    doc.text(`Sucursal Destino (Ingreso): ${destName}`, 36, 108, { width: 523 });

                    // Fila 4: Responsable y Flete / Motivo
                    doc.text(`Responsable: ${usuarioName}`, 36, 122, { width: 220, ellipsis: true });
                    const costoTrans = Number(traspaso.costoTransporte) || 0;
                    if (costoTrans > 0) {
                        doc.text(`Flete/Transporte: Bs. ${costoTrans.toFixed(2)} (Asume ${traspaso.sucursalCargoCosto === CargoCostoTraspaso.DESTINO ? 'Destino' : 'Origen'})`, 270, 122, { width: 280, ellipsis: true });
                    } else {
                        doc.text(`Motivo: ${traspaso.motivo || 'Traspaso de Stock'}`, 270, 122, { width: 280, ellipsis: true });
                    }
                }
            };

            const drawTableHeader = (startY: number) => {
                doc.rect(36, startY, 523, 24).fill('#2980b9');
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#ffffff');
                doc.text('Código', 46, startY + 7, { width: 75, align: 'left' });
                doc.text('Producto', 126, startY + 7, { width: 175, align: 'left' });
                doc.text('Lote / Venc.', 306, startY + 7, { width: 105, align: 'left' });
                doc.text('U.M.', 416, startY + 7, { width: 45, align: 'center' });
                doc.text('Cantidad', 466, startY + 7, { width: 83, align: 'right' });
            };

            drawHeader(true);
            let currentY = 148;
            drawTableHeader(currentY);
            currentY += 24;

            const rowHeight = 22;
            const maxY = 680;
            const detalles = traspaso.detalles || [];
            let totalUnidades = 0;

            detalles.forEach((det, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 80;
                    drawTableHeader(currentY);
                    currentY += 24;
                }

                if (idx % 2 === 0) {
                    doc.rect(36, currentY, 523, rowHeight).fill('#f5f7fa');
                }

                const prodCodigo = det.producto?.codigo || '-';
                const prodNombre = det.producto?.nombre || '-';
                const um = det.producto?.unidadMedida || 'u.';
                const cantNum = Number(det.cantidad || 0);
                totalUnidades += cantNum;

                let loteStr = '-';
                if (det.lotesDetalle) {
                    try {
                        const parsed = JSON.parse(det.lotesDetalle);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            loteStr = parsed.map((l: any) => `${l.numeroLote || 'S/N'}${l.fechaVencimiento ? ' (' + String(l.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') + ')' : ''}`).join(', ');
                        }
                    } catch (e) {}
                }
                if (loteStr === '-' && det.numeroLote) {
                    loteStr = `${det.numeroLote}${det.fechaVencimiento ? ' (' + String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') + ')' : ''}`;
                }

                doc.font('Helvetica').fontSize(9).fillColor('#333333');
                doc.text(prodCodigo, 46, currentY + 6, { width: 75, lineBreak: false, ellipsis: true });
                doc.text(prodNombre, 126, currentY + 6, { width: 175, lineBreak: false, ellipsis: true });
                doc.text(loteStr, 306, currentY + 6, { width: 105, lineBreak: false, ellipsis: true });
                doc.text(um, 416, currentY + 6, { width: 45, align: 'center' });
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827');
                doc.text(cantNum.toLocaleString('es-BO'), 466, currentY + 6, { width: 83, align: 'right' });

                currentY += rowHeight;
            });

            // Resumen de Totales y Observaciones
            if (currentY + 120 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 80;
            } else {
                currentY += 16;
            }

            const totalsStartY = currentY;

            doc.font('Helvetica').fontSize(9.5).fillColor('#333333');
            doc.text(`Total Ítems Transferidos: ${detalles.length} ${detalles.length === 1 ? 'ítem' : 'ítems'}`, 36, totalsStartY, { width: 300 });

            if (traspaso.observaciones || traspaso.motivo) {
                doc.font('Helvetica').fontSize(9.5).fillColor('#505050').text('Motivo / Observaciones:', 36, totalsStartY + 20);
                doc.font('Helvetica-Oblique').fontSize(9).fillColor('#505050').text(`${traspaso.motivo ? traspaso.motivo + ' - ' : ''}${traspaso.observaciones || ''}`, 36, totalsStartY + 34, { width: 300 });
            }

            doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827');
            doc.text(`Total Unidades:`, 300, totalsStartY, { width: 160, align: 'right' });
            doc.text(`${totalUnidades.toLocaleString('es-BO')}`, 465, totalsStartY, { width: 94, align: 'right' });

            // Firmas (3 columnas)
            const signY = 640;
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // 1. Origen
            doc.moveTo(40, signY).lineTo(180, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('ENTREGADO POR', 40, signY + 6, { width: 140, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('Sucursal Origen (Salida)', 40, signY + 18, { width: 140, align: 'center' });

            // 2. Transportista
            doc.moveTo(225, signY).lineTo(365, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('TRANSPORTADO POR', 225, signY + 6, { width: 140, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('Chofer / Courier', 225, signY + 18, { width: 140, align: 'center' });

            // 3. Destino
            doc.moveTo(410, signY).lineTo(550, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('RECIBIDO CONFORME', 410, signY + 6, { width: 140, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('Sucursal Destino (Ingreso)', 410, signY + 18, { width: 140, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Guía de Traspaso entre Sucursales • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // 7. ENVÍO DE NOTA DE DEVOLUCIÓN EN PDF POR WHATSAPP
    // ==========================================
    async sendDevolucionPdf(
        devolucionId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const devolucion = await this.notaRepo.findOne({
            where: { id: devolucionId, tipo: TipoNota.DEVOLUCION },
            relations: [
                'cliente',
                'cliente.persona',
                'vendedor',
                'sucursal',
                'sucursal.ciudad',
                'detalles',
                'detalles.producto'
            ]
        });

        if (!devolucion) {
            throw new NotFoundException(`No se encontró la nota de devolución con ID #${devolucionId}`);
        }

        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && devolucion.cliente?.persona?.telefono) {
            phone = devolucion.cliente.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el cliente no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        let targetSucursalId = sucursalId || devolucion.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = devolucion.sucursal?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(devolucion.sucursal);
        const pdfBuffer = await this.generateDevolucionPdfInMemory(devolucion, branchDisplay);

        const clientName = this.formatClienteDisplay(devolucion.cliente);
        const fechaFormatted = devolucion.fecha ? String(devolucion.fecha).split('T')[0].split('-').reverse().join('/') : '-';
        const devueltosCount = devolucion.detalles?.filter(d => d.tipoMovimiento !== 'SALIDA_REPOSICION').reduce((acc, d) => acc + Number(d.cantidad || 0), 0) || 0;
        const repuestosCount = devolucion.detalles?.filter(d => d.tipoMovimiento === 'SALIDA_REPOSICION').reduce((acc, d) => acc + Number(d.cantidad || 0), 0) || 0;

        const caption = customMessage?.trim() || 
            `🔄 *COMPROBANTE DE DEVOLUCIÓN DE PRODUCTOS - ${devolucion.numero || devolucion.id}*\n\n` +
            `Hola *${clientName}*,\n` +
            `Le adjuntamos el comprobante de su Nota de Devolución emitida por *GIPAAF (${branchDisplay})*.\n\n` +
            `📅 *Fecha:* ${fechaFormatted}\n` +
            `🏢 *Sucursal:* ${branchDisplay}\n` +
            `📦 *Unidades Devueltas:* ${devueltosCount.toLocaleString('es-BO')}\n` +
            (repuestosCount > 0 ? `✨ *Unidades Reposición / Entregadas:* ${repuestosCount.toLocaleString('es-BO')}\n` : '') +
            (devolucion.observaciones ? `💬 *Observaciones:* ${devolucion.observaciones}\n` : '') +
            `\n_En el documento PDF adjunto encontrará el detalle de los productos devueltos y su disposición física._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Nota_Devolucion_${devolucion.numero || devolucion.id}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Nota Devolución ${devolucion.numero || devolucion.id}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Nota de Devolución ${devolucion.numero || ''} enviada exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generateDevolucionPdfInMemory(devolucion: Nota, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const folio = devolucion.numero || `DEV-${devolucion.id}`;
            const dateStr = devolucion.fecha 
                ? String(devolucion.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');

            const clientName = this.formatClienteDisplay(devolucion.cliente);
            const nitCi = devolucion.cliente?.persona?.ci || '-';
            const tel = devolucion.cliente?.persona?.telefono || '-';
            const vendedorName = devolucion.vendedor 
                ? `${devolucion.vendedor.nombres || ''} ${devolucion.vendedor.apellidos || ''}`.trim() 
                : 'Sin asignar';

            const drawHeader = (isFirstPage: boolean) => {
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 130 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }

                doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
                doc.text(`NOTA DE DEVOLUCIÓN Nro ${folio}`, 245, 34, { width: 314, align: 'right' });

                if (isFirstPage) {
                    doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                    doc.text(`Fecha: ${dateStr}`, 36, 82, { width: 250 });
                    doc.text(`Sucursal: ${sucursalNombre}`, 250, 82, { width: 309 });

                    doc.text(`Cliente: ${clientName}`, 36, 96, { width: 250, ellipsis: true });
                    doc.text(`Atendido por: ${vendedorName}`, 250, 96, { width: 309, ellipsis: true });

                    doc.text(`NIT / CI: ${nitCi}`, 36, 110, { width: 250 });
                    doc.text(`Teléfono: ${tel}`, 250, 110, { width: 309 });
                }
            };

            const formatDestino = (dest?: string) => {
                if (!dest) return '-';
                if (dest === 'REINGRESO_STOCK') return 'Reingreso a Stock';
                if (dest === 'DESCARTE_MERMA') return 'Descarte / Merma';
                if (dest === 'RECLAMO_PROVEEDOR') return 'Garantía Proveedor';
                return dest;
            };

            drawHeader(true);
            let currentY = 136;
            const maxY = 680;
            const rowHeight = 22;

            const detalles = devolucion.detalles || [];
            const devueltos = detalles.filter(d => d.tipoMovimiento !== 'SALIDA_REPOSICION');
            const entregados = detalles.filter(d => d.tipoMovimiento === 'SALIDA_REPOSICION');

            let totalCantDevuelta = 0;
            let totalCantEntregada = 0;

            // ==========================================
            // TABLA 1: PRODUCTOS DEVUELTOS (CLIENTE -> GIPAAF)
            // ==========================================
            const drawTableDevueltosHeader = (startY: number) => {
                doc.rect(36, startY, 523, 20).fill('#c0392b');
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
                doc.text('PRODUCTOS DEVUELTOS (POR EL CLIENTE)', 46, startY + 5, { width: 503, align: 'left' });

                const colY = startY + 20;
                doc.rect(36, colY, 523, 22).fill('#e74c3c');
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
                doc.text('#', 44, colY + 6, { width: 20, align: 'center' });
                doc.text('Código', 68, colY + 6, { width: 70, align: 'left' });
                doc.text('Producto Devuelto', 142, colY + 6, { width: 160, align: 'left' });
                doc.text('Cant.', 306, colY + 6, { width: 40, align: 'center' });
                doc.text('Motivo / Defecto', 350, colY + 6, { width: 105, align: 'left' });
                doc.text('Destino Físico', 460, colY + 6, { width: 95, align: 'left' });
            };

            drawTableDevueltosHeader(currentY);
            currentY += 42;

            if (devueltos.length === 0) {
                doc.rect(36, currentY, 523, rowHeight).fill('#f9f9f9');
                doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#666666').text('No se registraron productos devueltos en esta nota.', 46, currentY + 6);
                currentY += rowHeight;
            } else {
                devueltos.forEach((det, idx) => {
                    if (currentY + rowHeight > maxY) {
                        doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                        drawHeader(false);
                        currentY = 80;
                        drawTableDevueltosHeader(currentY);
                        currentY += 42;
                    }

                    if (idx % 2 === 0) {
                        doc.rect(36, currentY, 523, rowHeight).fill('#fdf2f2');
                    }

                    const cantNum = Number(det.cantidad || 0);
                    totalCantDevuelta += cantNum;
                    const prodCodigo = det.producto?.codigo || '-';
                    const prodNombre = det.producto?.nombre || '-';
                    const motivo = det.motivoDefecto || 'Devolución de cliente';
                    const destino = formatDestino(det.destinoProducto);

                    doc.font('Helvetica').fontSize(8.5).fillColor('#333333');
                    doc.text(String(idx + 1), 44, currentY + 6, { width: 20, align: 'center' });
                    doc.text(prodCodigo, 68, currentY + 6, { width: 70, lineBreak: false, ellipsis: true });
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111827');
                    doc.text(prodNombre, 142, currentY + 6, { width: 160, lineBreak: false, ellipsis: true });
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#c0392b');
                    doc.text(String(cantNum), 306, currentY + 6, { width: 40, align: 'center' });
                    doc.font('Helvetica').fontSize(8).fillColor('#4b5563');
                    doc.text(motivo, 350, currentY + 6, { width: 105, lineBreak: false, ellipsis: true });
                    doc.text(destino, 460, currentY + 6, { width: 95, lineBreak: false, ellipsis: true });

                    currentY += rowHeight;
                });
            }

            // ==========================================
            // TABLA 2: PRODUCTOS ENTREGADOS / REPOSICIÓN (SI EXISTEN)
            // ==========================================
            if (entregados.length > 0) {
                currentY += 12;

                const drawTableEntregadosHeader = (startY: number) => {
                    doc.rect(36, startY, 523, 20).fill('#27ae60');
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff');
                    doc.text('PRODUCTOS ENTREGADOS EN REPOSICIÓN (AL CLIENTE)', 46, startY + 5, { width: 503, align: 'left' });

                    const colY = startY + 20;
                    doc.rect(36, colY, 523, 22).fill('#2ecc71');
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
                    doc.text('#', 44, colY + 6, { width: 20, align: 'center' });
                    doc.text('Código', 68, colY + 6, { width: 75, align: 'left' });
                    doc.text('Producto Repuesto', 147, colY + 6, { width: 175, align: 'left' });
                    doc.text('Cant.', 326, colY + 6, { width: 45, align: 'center' });
                    doc.text('N° Lote', 375, colY + 6, { width: 85, align: 'left' });
                    doc.text('F. Vencimiento', 464, colY + 6, { width: 90, align: 'left' });
                };

                if (currentY + 64 > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 80;
                }

                drawTableEntregadosHeader(currentY);
                currentY += 42;

                entregados.forEach((det, idx) => {
                    if (currentY + rowHeight > maxY) {
                        doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                        drawHeader(false);
                        currentY = 80;
                        drawTableEntregadosHeader(currentY);
                        currentY += 42;
                    }

                    if (idx % 2 === 0) {
                        doc.rect(36, currentY, 523, rowHeight).fill('#f0fdf4');
                    }

                    const cantNum = Number(det.cantidad || 0);
                    totalCantEntregada += cantNum;
                    const prodCodigo = det.producto?.codigo || '-';
                    const prodNombre = det.producto?.nombre || '-';
                    const lote = det.numeroLote || '-';
                    const venc = det.fechaVencimiento ? String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : '-';

                    doc.font('Helvetica').fontSize(8.5).fillColor('#333333');
                    doc.text(String(idx + 1), 44, currentY + 6, { width: 20, align: 'center' });
                    doc.text(prodCodigo, 68, currentY + 6, { width: 75, lineBreak: false, ellipsis: true });
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#111827');
                    doc.text(prodNombre, 147, currentY + 6, { width: 175, lineBreak: false, ellipsis: true });
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#15803d');
                    doc.text(String(cantNum), 326, currentY + 6, { width: 45, align: 'center' });
                    doc.font('Helvetica').fontSize(8).fillColor('#4b5563');
                    doc.text(lote, 375, currentY + 6, { width: 85, lineBreak: false, ellipsis: true });
                    doc.text(venc, 464, currentY + 6, { width: 90, lineBreak: false, ellipsis: true });

                    currentY += rowHeight;
                });
            }

            // ==========================================
            // TOTALES Y OBSERVACIONES
            // ==========================================
            if (currentY + 100 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 80;
            } else {
                currentY += 16;
            }

            const totalsStartY = currentY;

            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827');
            doc.text(`Total Ítems Devueltos: ${devueltos.length} ${devueltos.length === 1 ? 'producto' : 'productos'} (${totalCantDevuelta} unidades)`, 36, totalsStartY, { width: 320 });
            if (entregados.length > 0) {
                doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#15803d');
                doc.text(`Total Ítems Repuestos: ${entregados.length} ${entregados.length === 1 ? 'producto' : 'productos'} (${totalCantEntregada} unidades)`, 36, totalsStartY + 16, { width: 320 });
            }

            if (devolucion.observaciones) {
                const obsY = totalsStartY + (entregados.length > 0 ? 34 : 20);
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('Observaciones:', 36, obsY);
                doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text(
                    `${devolucion.observaciones || ''}`,
                    36,
                    obsY + 12,
                    { width: 523 }
                );
            }

            // Firmas (2 columnas)
            const signY = 640;
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // Firma Cliente
            doc.moveTo(60, signY).lineTo(220, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('ENTREGADO POR', 60, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Cliente / Solicitante', 60, signY + 18, { width: 160, align: 'center' });

            // Firma GIPAAF
            doc.moveTo(340, signY).lineTo(500, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('RECIBIDO Y REVISADO POR', 340, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Almacén / Control de Calidad GIPAAF', 340, signY + 18, { width: 160, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Nota de Devolución de Productos • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // 8. ENVÍO DE ACTA DE MUESTRAS EN PDF POR WHATSAPP
    // ==========================================
    async sendMuestraPdf(
        muestraId: number,
        targetPhone?: string,
        sucursalId?: number,
        customMessage?: string
    ): Promise<{ success: boolean; message: string; phone: string }> {
        const muestra = await this.muestraRepo.findOne({
            where: { id: muestraId },
            relations: [
                'cliente',
                'cliente.persona',
                'vendedor',
                'sucursal',
                'sucursal.ciudad',
                'usuario',
                'detalles',
                'detalles.producto'
            ]
        });

        if (!muestra) {
            throw new NotFoundException(`No se encontró el registro de muestra con ID #${muestraId}`);
        }

        let phone = targetPhone ? targetPhone.trim() : '';
        if (!phone && muestra.cliente?.persona?.telefono) {
            phone = muestra.cliente.persona.telefono.trim();
        }

        if (!phone) {
            throw new BadRequestException('No se especificó un número de teléfono de destino y el cliente no tiene un teléfono registrado.');
        }

        let cleanedPhone = phone.replace(/\D/g, '');
        if (cleanedPhone.length === 8) {
            cleanedPhone = `591${cleanedPhone}`;
        }
        const jid = `${cleanedPhone}@s.whatsapp.net`;

        let targetSucursalId = sucursalId || muestra.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            const branchName = muestra.sucursal?.nombre || 'la sucursal';
            throw new BadRequestException(`El bot de WhatsApp no está conectado en ${branchName}. Por favor vincule el bot en la sección de WhatsApp para enviar el PDF.`);
        }

        const branchDisplay = this.formatSucursalDisplay(muestra.sucursal);
        const pdfBuffer = await this.generateMuestraPdfInMemory(muestra, branchDisplay);

        const clientName = this.formatClienteDisplay(muestra.cliente);
        const fechaFormatted = muestra.fecha ? String(muestra.fecha).split('T')[0].split('-').reverse().join('/') : '-';
        const fechaEstFormatted = muestra.fechaEstimadaDevolucion ? String(muestra.fechaEstimadaDevolucion).split('T')[0].split('-').reverse().join('/') : 'Sin definir';
        const totalEntregados = muestra.detalles?.reduce((acc, d) => acc + Number(d.cantidadEntregada || 0), 0) || 0;
        const totalDevueltos = muestra.detalles?.reduce((acc, d) => acc + Number(d.cantidadDevuelta || 0), 0) || 0;
        const totalPendientes = Math.max(0, totalEntregados - totalDevueltos);

        const caption = customMessage?.trim() || 
            `🧪 *ACTA DE ENTREGA DE MUESTRAS - ${muestra.numero || `MUE-${muestra.id}`}*\n\n` +
            `Hola *${clientName}*,\n` +
            `Le adjuntamos el Acta Oficial de Entrega de Muestras de Productos de *GIPAAF (${branchDisplay})*.\n\n` +
            `📅 *Fecha Entrega:* ${fechaFormatted}\n` +
            `⏳ *F. Estimada Devolución:* ${fechaEstFormatted}\n` +
            `🏢 *Sucursal:* ${branchDisplay}\n` +
            `📦 *Total Entregado:* ${totalEntregados.toLocaleString('es-BO')} unidades\n` +
            (totalDevueltos > 0 ? `✅ *Devuelto:* ${totalDevueltos.toLocaleString('es-BO')} un. | ⚠️ *Pendiente:* ${totalPendientes.toLocaleString('es-BO')} un.\n` : '') +
            (muestra.observaciones ? `📝 *Observaciones:* ${muestra.observaciones}\n` : '') +
            `\n_En el documento PDF adjunto encontrará el detalle de los productos, lotes y compromisos de prueba._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Acta_Muestras_${muestra.numero || `MUE-${muestra.id}`}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Acta Muestras ${muestra.numero || muestra.id}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Acta de Muestras ${muestra.numero || ''} enviada exitosamente por WhatsApp a +${cleanedPhone}`,
            phone: cleanedPhone
        };
    }

    private generateMuestraPdfInMemory(muestra: Muestra, sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const folio = muestra.numero || `MUE-${muestra.id}`;
            const dateStr = muestra.fecha 
                ? String(muestra.fecha).split('T')[0].split('-').reverse().join('/') 
                : new Date().toLocaleDateString('es-BO');
            const fechaEst = muestra.fechaEstimadaDevolucion 
                ? String(muestra.fechaEstimadaDevolucion).split('T')[0].split('-').reverse().join('/') 
                : 'No definida';
            const fechaDev = muestra.fechaDevolucion 
                ? String(muestra.fechaDevolucion).split('T')[0].split('-').reverse().join('/') 
                : null;

            const clientName = this.formatClienteDisplay(muestra.cliente);
            const nitCi = muestra.cliente?.persona?.ci || '-';
            const tel = muestra.cliente?.persona?.telefono || '-';
            const vendedorName = muestra.vendedor 
                ? `${muestra.vendedor.nombres || ''} ${muestra.vendedor.apellidos || ''}`.trim() 
                : (muestra.usuario ? `${(muestra.usuario as any).nombres || ''} ${(muestra.usuario as any).apellidos || (muestra.usuario as any).username || ''}`.trim() : 'No asignado');

            const drawHeader = (isFirstPage: boolean) => {
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 130 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 32);
                }

                doc.font('Helvetica-Bold').fontSize(14).fillColor('#323232');
                doc.text(`ACTA DE ENTREGA DE MUESTRAS`, 245, 30, { width: 314, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(11).fillColor('#4b5563');
                doc.text(`Nro ${folio}`, 245, 48, { width: 314, align: 'right' });

                if (isFirstPage) {
                    doc.font('Helvetica').fontSize(9.5).fillColor('#505050');
                    // Fila 1: Fecha y Sucursal
                    doc.text(`Fecha Entrega: ${dateStr}`, 36, 80, { width: 220 });
                    doc.text(`Sucursal: ${sucursalNombre}`, 270, 80, { width: 280, ellipsis: true });

                    // Fila 2: Cliente y Responsable
                    doc.text(`Cliente: ${clientName}`, 36, 94, { width: 220, ellipsis: true });
                    doc.text(`Vendedor / Responsable: ${vendedorName}`, 270, 94, { width: 280, ellipsis: true });

                    // Fila 3: F. Estimada y Estado
                    doc.text(`F. Estimada Devolución: ${fechaEst}`, 36, 108, { width: 220 });
                    doc.text(`Estado: ${muestra.estado || 'ENTREGADO'}`, 270, 108, { width: 280 });

                    // Fila 4: NIT/CI y Teléfono
                    doc.text(`NIT / CI: ${nitCi}`, 36, 122, { width: 220 });
                    doc.text(`Teléfono: ${tel}`, 270, 122, { width: 280 });

                    if (fechaDev) {
                        doc.text(`F. Devolución Real: ${fechaDev}`, 36, 136, { width: 523 });
                    }
                }
            };

            const drawTableHeader = (startY: number) => {
                doc.rect(36, startY, 523, 24).fill('#2980b9');
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#ffffff');
                doc.text('#', 44, startY + 7, { width: 20, align: 'center' });
                doc.text('Código', 68, startY + 7, { width: 65, align: 'left' });
                doc.text('Producto / Descripción', 137, startY + 7, { width: 155, align: 'left' });
                doc.text('Lote / Venc.', 296, startY + 7, { width: 95, align: 'left' });
                doc.text('Entregado', 395, startY + 7, { width: 50, align: 'center' });
                doc.text('Devuelto', 449, startY + 7, { width: 50, align: 'center' });
                doc.text('Pendiente', 503, startY + 7, { width: 50, align: 'center' });
            };

            drawHeader(true);
            let currentY = fechaDev ? 162 : 148;
            drawTableHeader(currentY);
            currentY += 24;

            const rowHeight = 22;
            const maxY = 680;
            const detalles = muestra.detalles || [];
            let totalEntregado = 0;
            let totalDevuelto = 0;

            detalles.forEach((det, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 80;
                    drawTableHeader(currentY);
                    currentY += 24;
                }

                if (idx % 2 === 0) {
                    doc.rect(36, currentY, 523, rowHeight).fill('#f8fafc');
                }

                const cantEnt = Number(det.cantidadEntregada || 0);
                const cantDev = Number(det.cantidadDevuelta || 0);
                const cantPend = Math.max(0, cantEnt - cantDev);

                totalEntregado += cantEnt;
                totalDevuelto += cantDev;

                const prodCodigo = det.producto?.codigo || '-';
                const prodNombre = det.producto?.nombre || '-';
                const loteInfo = det.numeroLote ? `${det.numeroLote}${det.fechaVencimiento ? ' (' + String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') + ')' : ''}` : '-';

                doc.font('Helvetica').fontSize(8.5).fillColor('#333333');
                doc.text(String(idx + 1), 44, currentY + 6, { width: 20, align: 'center' });
                doc.text(prodCodigo, 68, currentY + 6, { width: 65, lineBreak: false, ellipsis: true });
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a');
                doc.text(prodNombre, 137, currentY + 6, { width: 155, lineBreak: false, ellipsis: true });
                doc.font('Helvetica').fontSize(8).fillColor('#4b5563');
                doc.text(loteInfo, 296, currentY + 6, { width: 95, lineBreak: false, ellipsis: true });

                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a');
                doc.text(String(cantEnt), 395, currentY + 6, { width: 50, align: 'center' });
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#16a34a');
                doc.text(String(cantDev), 449, currentY + 6, { width: 50, align: 'center' });
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor(cantPend > 0 ? '#ea580c' : '#64748b');
                doc.text(String(cantPend), 503, currentY + 6, { width: 50, align: 'center' });

                currentY += rowHeight;
            });

            // Totales
            if (currentY + 110 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 80;
            } else {
                currentY += 16;
            }

            const totalsStartY = currentY;

            doc.font('Helvetica-Bold').fontSize(9.5).fillColor('#111827');
            doc.text(`Total Ítems: ${detalles.length} ${detalles.length === 1 ? 'producto' : 'productos'}`, 36, totalsStartY, { width: 250 });
            doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569');
            doc.text(`Entregadas: ${totalEntregado} un.  |  Devueltas: ${totalDevuelto} un.  |  Pendientes: ${Math.max(0, totalEntregado - totalDevuelto)} un.`, 36, totalsStartY + 14, { width: 523 });

            if (muestra.observaciones) {
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('Observaciones:', 36, totalsStartY + 32);
                doc.font('Helvetica-Oblique').fontSize(8.5).fillColor('#64748b').text(
                    muestra.observaciones,
                    36,
                    totalsStartY + 44,
                    { width: 523 }
                );
            }

            // Firmas (2 columnas)
            const signY = 640;
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // Firma GIPAAF
            doc.moveTo(60, signY).lineTo(220, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('ENTREGADO POR', 60, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('GIPAAF S.R.L. - Responsable', 60, signY + 18, { width: 160, align: 'center' });

            // Firma Cliente
            doc.moveTo(340, signY).lineTo(500, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#475569').text('RECIBIDO CONFORME', 340, signY + 6, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('Cliente / Solicitante', 340, signY + 18, { width: 160, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Acta de Entrega de Muestras • Generado el ${new Date().toLocaleDateString('es-BO')} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    async sendCarteraVendedorPdf(dto: { vendedorId: number; phone?: string; sucursalId?: number; message?: string }): Promise<any> {
        const { vendedorId, phone, sucursalId, message } = dto;

        const vendedor = await this.personalRepo.findOne({
            where: { id: vendedorId },
            relations: ['sucursal', 'sucursal.ciudad']
        });

        if (!vendedor) {
            throw new NotFoundException(`Personal/Vendedor con ID ${vendedorId} no encontrado`);
        }

        const qb = this.notaRepo.createQueryBuilder('nota')
            .leftJoinAndSelect('nota.cliente', 'cliente')
            .leftJoinAndSelect('cliente.persona', 'persona')
            .leftJoinAndSelect('cliente.sucursal', 'clienteSucursal')
            .leftJoinAndSelect('clienteSucursal.ciudad', 'clienteCiudad')
            .leftJoinAndSelect('nota.vendedor', 'vendedor')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .andWhere('nota.saldo > 0')
            .andWhere('nota.vendedorId = :vendedorId', { vendedorId });

        if (sucursalId) {
            qb.andWhere('nota.sucursalId = :sucursalId', { sucursalId });
        }

        const notas = await qb.orderBy('nota.fecha', 'ASC').getMany();

        const vendedorNombre = `${vendedor.nombres || ''} ${vendedor.apellidos || ''}`.trim() || 'Vendedor';

        if (notas.length === 0) {
            throw new BadRequestException(`El vendedor ${vendedorNombre} no tiene cuentas o saldos pendientes por cobrar.`);
        }

        const targetSucursalId = sucursalId || vendedor.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;
        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            throw new BadRequestException(`El canal de WhatsApp no está conectado. Por favor inicie sesión o escanee el código QR.`);
        }

        const rawPhone = (phone || vendedor.telefono || '').trim();
        if (!rawPhone) {
            throw new BadRequestException('No se especificó un número de teléfono para el vendedor.');
        }

        const cleanedPhone = rawPhone.replace(/\D/g, '');
        const phoneWithCountry = cleanedPhone.length === 8 ? `591${cleanedPhone}` : cleanedPhone;
        const jid = `${phoneWithCountry}@s.whatsapp.net`;

        const branchDisplay = session.sucursalNombre + (session.ciudadNombre ? ` (${session.ciudadNombre})` : '');

        const clientesSet = new Set<number>();
        let saldoTotalBOB = 0;
        let totalMoraBOB = 0;
        let totalVigenteBOB = 0;
        let notasEnMoraCount = 0;

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        notas.forEach(n => {
            if (n.cliente?.id) clientesSet.add(n.cliente.id);
            const saldoBOB = n.moneda === 'USD' ? Number(n.saldo) * (Number(n.tipoCambio) || 6.96) : Number(n.saldo || 0);
            saldoTotalBOB += saldoBOB;

            let fechaVenc: Date | null = null;
            if (n.fechaVencimiento) {
                fechaVenc = new Date(String(n.fechaVencimiento).substring(0, 10) + 'T00:00:00');
            } else if (Number(n.diasCredito || 0) > 0 && n.fecha) {
                const d = new Date(String(n.fecha).substring(0, 10) + 'T00:00:00');
                d.setDate(d.getDate() + Number(n.diasCredito));
                fechaVenc = d;
            } else if (n.cliente?.plazoCreditoDias && Number(n.cliente.plazoCreditoDias) > 0 && n.fecha) {
                const d = new Date(String(n.fecha).substring(0, 10) + 'T00:00:00');
                d.setDate(d.getDate() + Number(n.cliente.plazoCreditoDias));
                fechaVenc = d;
            }

            let diffDias = 0;
            if (fechaVenc) {
                diffDias = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
            }

            if (diffDias > 0) {
                totalMoraBOB += saldoBOB;
                notasEnMoraCount++;
            } else {
                totalVigenteBOB += saldoBOB;
            }
        });

        const pdfBuffer = await this.generateCarteraVendedorPdfInMemory(
            vendedor,
            notas,
            branchDisplay,
            saldoTotalBOB,
            totalMoraBOB,
            totalVigenteBOB
        );

        const fechaFormatted = new Date().toLocaleDateString('es-BO');
        const caption = message?.trim() || 
            `📊 *PLANILLA DE CARTERA Y SALDOS PENDIENTES*\n\n` +
            `Hola *${vendedorNombre}*,\n` +
            `Te enviamos el reporte actualizado de tus clientes con saldo pendiente de cobro en *GIPAAF (${branchDisplay})* al *${fechaFormatted}*.\n\n` +
            `👥 *Clientes con Saldo:* ${clientesSet.size}\n` +
            `📋 *Ventas por Cobrar:* ${notas.length}\n` +
            `💰 *Cartera Total por Cobrar:* *Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` +
            (totalMoraBOB > 0 ? `⚠️ *Saldo en Mora (Vencido):* *Bs. ${totalMoraBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}* (${notasEnMoraCount} ${notasEnMoraCount === 1 ? 'nota' : 'notas'})\n` : '') +
            `✅ *Saldo Vigente (Al Día):* Bs. ${totalVigenteBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n\n` +
            `_En el PDF adjunto encontrarás el detalle cliente por cliente con teléfonos y fechas de vencimiento para tu gestión de cobranzas._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Cartera_${vendedorNombre.replace(/\s+/g, '_')}_${fechaFormatted.replace(/\//g, '-')}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Cartera Vendedor ${vendedorNombre}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Planilla de cartera enviada exitosamente por WhatsApp a ${vendedorNombre} (+${cleanedPhone})`,
            phone: cleanedPhone,
            totalSaldo: saldoTotalBOB,
            totalClientes: clientesSet.size,
            totalNotas: notas.length
        };
    }

    private generateCarteraVendedorPdfInMemory(
        vendedor: Personal,
        notas: Nota[],
        sucursalNombre: string,
        saldoTotalBOB: number,
        totalMoraBOB: number,
        totalVigenteBOB: number
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = new Date().toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const vendedorNombre = `${vendedor.nombres || ''} ${vendedor.apellidos || ''}`.trim() || 'Vendedor';
            const vendedorTel = vendedor.telefono || '-';

            const clientesSet = new Set<number>();
            notas.forEach(n => { if (n.cliente?.id) clientesSet.add(n.cliente.id); });

            const drawHeader = (isFirstPage: boolean) => {
                // Banner superior corporativo (Azul Petróleo #0f172a)
                doc.rect(36, 28, 770, 52).fill('#0f172a');

                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 46, 34, { width: 100 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff').text('GIPAAF S.R.L.', 46, 38);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(14).fillColor('#ffffff').text('GIPAAF S.R.L.', 46, 38);
                }

                doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text('PLANILLA DE CARTERA Y COBRANZAS POR VENDEDOR', 160, 36, { width: 380 });
                doc.font('Helvetica').fontSize(8.5).fillColor('#94a3b8').text(`Vendedor: ${vendedorNombre} (Tel: ${vendedorTel})`, 160, 52, { width: 380 });

                doc.font('Helvetica-Bold').fontSize(9).fillColor('#38bdf8').text(`Fecha Emisión: ${dateStr}`, 550, 36, { width: 240, align: 'right' });
                doc.font('Helvetica').fontSize(8.5).fillColor('#cbd5e1').text(`Sucursal: ${sucursalNombre}`, 550, 52, { width: 240, align: 'right' });
            };

            const drawSummaryCards = (startY: number) => {
                const cardWidth = 186;
                const cardHeight = 44;
                const gap = 8;

                // Card 1: Cartera Total
                doc.rect(36, startY, cardWidth, cardHeight).fillAndStroke('#f8fafc', '#e2e8f0');
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text('CARTERA TOTAL POR COBRAR', 44, startY + 8);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#0284c7').text(`Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 44, startY + 22);

                // Card 2: Clientes con Saldo
                const x2 = 36 + cardWidth + gap;
                doc.rect(x2, startY, cardWidth, cardHeight).fillAndStroke('#f8fafc', '#e2e8f0');
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text('CLIENTES CON SALDO PENDIENTE', x2 + 8, startY + 8);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#334155').text(`${clientesSet.size} Clientes (${notas.length} notas)`, x2 + 8, startY + 22);

                // Card 3: Saldo en Mora
                const x3 = x2 + cardWidth + gap;
                doc.rect(x3, startY, cardWidth, cardHeight).fillAndStroke('#fef2f2', '#fecaca');
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#991b1b').text('SALDO VENCIDO / EN MORA', x3 + 8, startY + 8);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#dc2626').text(`Bs. ${totalMoraBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, x3 + 8, startY + 22);

                // Card 4: Saldo Vigente
                const x4 = x3 + cardWidth + gap;
                doc.rect(x4, startY, cardWidth, cardHeight).fillAndStroke('#f0fdf4', '#bbf7d0');
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#166534').text('SALDO VIGENTE / AL DÍA', x4 + 8, startY + 8);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#16a34a').text(`Bs. ${totalVigenteBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, x4 + 8, startY + 22);
            };

            const drawTableHeader = (startY: number) => {
                doc.rect(36, startY, 770, 20).fill('#0284c7');
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
                doc.text('#', 42, startY + 6, { width: 18, align: 'center' });
                doc.text('Cliente / Razón Social', 62, startY + 6, { width: 145, align: 'left' });
                doc.text('Teléfono', 210, startY + 6, { width: 58, align: 'left' });
                doc.text('N° Venta', 270, startY + 6, { width: 50, align: 'left' });
                doc.text('Emisión', 322, startY + 6, { width: 52, align: 'center' });
                doc.text('Vencimiento', 376, startY + 6, { width: 54, align: 'center' });
                doc.text('Estado / Mora', 432, startY + 6, { width: 68, align: 'center' });
                doc.text('Total Venta', 502, startY + 6, { width: 64, align: 'right' });
                doc.text('Cobrado', 568, startY + 6, { width: 64, align: 'right' });
                doc.text('Saldo Pendiente', 634, startY + 6, { width: 72, align: 'right' });
                doc.text('Observaciones', 710, startY + 6, { width: 92, align: 'left' });
            };

            drawHeader(true);
            drawSummaryCards(86);

            let currentY = 138;
            const maxY = 515;
            const rowHeight = 20;

            drawTableHeader(currentY);
            currentY += 20;

            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            let sumTotalVentasBOB = 0;
            let sumTotalCobradoBOB = 0;

            notas.forEach((n, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                    drawHeader(false);
                    currentY = 88;
                    drawTableHeader(currentY);
                    currentY += 20;
                }

                if (idx % 2 === 0) {
                    doc.rect(36, currentY, 770, rowHeight).fill('#f8fafc');
                }

                const clientName = n.cliente?.persona 
                    ? `${n.cliente.persona.nombres} ${n.cliente.persona.apellidos}`.trim() 
                    : (n.cliente?.codigo || 'Cliente Final');
                const clientTel = n.cliente?.persona?.telefono || '-';
                const folio = n.numero || `VNT-${n.id}`;
                const fechaEmision = n.fecha ? String(n.fecha).split('T')[0].split('-').reverse().join('/') : '-';

                let fechaVenc: Date | null = null;
                if (n.fechaVencimiento) {
                    fechaVenc = new Date(String(n.fechaVencimiento).substring(0, 10) + 'T00:00:00');
                } else if (Number(n.diasCredito || 0) > 0 && n.fecha) {
                    const d = new Date(String(n.fecha).substring(0, 10) + 'T00:00:00');
                    d.setDate(d.getDate() + Number(n.diasCredito));
                    fechaVenc = d;
                } else if (n.cliente?.plazoCreditoDias && Number(n.cliente.plazoCreditoDias) > 0 && n.fecha) {
                    const d = new Date(String(n.fecha).substring(0, 10) + 'T00:00:00');
                    d.setDate(d.getDate() + Number(n.cliente.plazoCreditoDias));
                    fechaVenc = d;
                }

                const fechaVencStr = fechaVenc ? fechaVenc.toLocaleDateString('es-BO') : 'Contado';
                let diffDias = 0;
                if (fechaVenc) {
                    diffDias = Math.floor((hoy.getTime() - fechaVenc.getTime()) / (1000 * 60 * 60 * 24));
                }

                const saldoBOB = n.moneda === 'USD' ? Number(n.saldo) * (Number(n.tipoCambio) || 6.96) : Number(n.saldo || 0);
                const totalBOB = n.moneda === 'USD' ? Number(n.total) * (Number(n.tipoCambio) || 6.96) : Number(n.total || 0);
                const cobradoBOB = Math.max(0, totalBOB - saldoBOB);
                sumTotalVentasBOB += totalBOB;
                sumTotalCobradoBOB += cobradoBOB;

                doc.font('Helvetica').fontSize(8).fillColor('#475569');
                doc.text(String(idx + 1), 42, currentY + 5, { width: 18, align: 'center' });

                doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
                doc.text(clientName, 62, currentY + 5, { width: 145, lineBreak: false, ellipsis: true });

                doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
                doc.text(clientTel, 210, currentY + 5, { width: 58, lineBreak: false, ellipsis: true });

                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0284c7');
                doc.text(folio, 270, currentY + 5, { width: 50, lineBreak: false, ellipsis: true });

                doc.font('Helvetica').fontSize(7.5).fillColor('#475569');
                doc.text(fechaEmision, 322, currentY + 5, { width: 52, align: 'center' });
                doc.text(fechaVencStr, 376, currentY + 5, { width: 54, align: 'center' });

                if (diffDias > 0) {
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#dc2626');
                    doc.text(`En Mora (+${diffDias}d)`, 432, currentY + 5, { width: 68, align: 'center' });
                } else if (diffDias === 0) {
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#d97706');
                    doc.text('Vence Hoy', 432, currentY + 5, { width: 68, align: 'center' });
                } else {
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#16a34a');
                    doc.text('Al Día', 432, currentY + 5, { width: 68, align: 'center' });
                }

                doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
                doc.text(`Bs. ${totalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 502, currentY + 5, { width: 64, align: 'right' });

                doc.font('Helvetica').fontSize(7.5).fillColor('#16a34a');
                doc.text(`Bs. ${cobradoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 568, currentY + 5, { width: 64, align: 'right' });

                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#dc2626');
                doc.text(`Bs. ${saldoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 634, currentY + 5, { width: 72, align: 'right' });

                doc.font('Helvetica').fontSize(7.5).fillColor('#64748b');
                doc.text(n.observaciones || '-', 710, currentY + 5, { width: 92, lineBreak: false, ellipsis: true });

                currentY += rowHeight;
            });

            // Fila de totales
            if (currentY + 60 > maxY) {
                doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                drawHeader(false);
                currentY = 88;
            }

            currentY += 6;
            doc.rect(36, currentY, 770, 22).fill('#f1f5f9');
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a');
            doc.text(`TOTAL GENERAL: ${notas.length} notas pendientes (${clientesSet.size} clientes)`, 46, currentY + 6, { width: 250 });

            doc.font('Helvetica-Bold').fontSize(8).fillColor('#334155');
            doc.text(`Ventas: Bs. ${sumTotalVentasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 290, currentY + 6, { width: 140, align: 'right' });

            doc.font('Helvetica-Bold').fontSize(8).fillColor('#16a34a');
            doc.text(`Cobrado: Bs. ${sumTotalCobradoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 435, currentY + 6, { width: 140, align: 'right' });

            doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#dc2626');
            doc.text(`Saldo Total: Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, 580, currentY + 6, { width: 215, align: 'right' });

            currentY += 45;

            // Firmas
            if (currentY + 40 > maxY) {
                doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                drawHeader(false);
                currentY = 88;
            }

            const signY = Math.max(currentY + 20, 520);
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // Firma Encargado Sucursal
            doc.moveTo(120, signY).lineTo(320, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('ENCARGADO DE COBRANZAS / SUCURSAL', 120, signY + 5, { width: 200, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text('GIPAAF S.R.L.', 120, signY + 16, { width: 200, align: 'center' });

            // Firma Vendedor
            doc.moveTo(520, signY).lineTo(720, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('VENDEDOR / RESPONSABLE DE CARTERA', 520, signY + 5, { width: 200, align: 'center' });
            doc.font('Helvetica').fontSize(7.5).fillColor('#94a3b8').text(vendedorNombre, 520, signY + 16, { width: 200, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Planilla de Cartera de Vendedor • Generado el ${dateStr} • Página ${i + 1} de ${range.count}`,
                    36,
                    555,
                    { width: 770, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    // ==========================================
    // ENVÍO DE ESTADO DE CUENTA / EXTRACTO DE VENTA EN PDF
    // ==========================================
    async sendEstadoCuentaVentaPdf(dto: { ventaId: number; phone?: string; sucursalId?: number; message?: string }): Promise<any> {
        const { ventaId, phone, sucursalId, message } = dto;
        const venta = await this.notaRepo.findOne({
            where: { id: ventaId },
            relations: [
                'cliente',
                'cliente.persona',
                'vendedor',
                'sucursal',
                'sucursal.ciudad',
                'detalles',
                'detalles.producto',
                'detalles.movimientosLote',
                'detalles.movimientosLote.lote'
            ]
        });

        if (!venta) {
            throw new NotFoundException(`Nota de venta con ID ${ventaId} no encontrada`);
        }

        const pagos = await this.pagoCobranzaRepo.find({
            where: { nota: { id: ventaId }, activo: true },
            order: { fecha: 'ASC', id: 'ASC' }
        });

        const targetSucursalId = sucursalId || venta.sucursal?.id || venta.cliente?.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;
        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            throw new BadRequestException('El canal de WhatsApp no está conectado para enviar el estado de cuenta.');
        }

        const rawPhone = (phone || venta.cliente?.persona?.telefono || '').trim();
        if (!rawPhone) {
            throw new BadRequestException('No se especificó un número de teléfono para enviar el estado de cuenta.');
        }

        const cleanedPhone = rawPhone.replace(/\D/g, '');
        const phoneWithCountry = cleanedPhone.length === 8 ? `591${cleanedPhone}` : cleanedPhone;
        const jid = `${phoneWithCountry}@s.whatsapp.net`;

        const branchDisplay = session.sucursalNombre + (session.ciudadNombre ? ` (${session.ciudadNombre})` : '');
        const clientName = venta.cliente?.persona 
            ? `${venta.cliente.persona.nombres || ''} ${venta.cliente.persona.apellidos || ''}`.trim() 
            : (venta.cliente?.codigo || 'Cliente');
        const folioVenta = venta.numero || `VEN-${venta.id}`;

        const pdfBuffer = await this.generateEstadoCuentaVentaPdfInMemory(venta, pagos, branchDisplay);
        const fechaFormatted = new Date().toLocaleDateString('es-BO');
        const saldoNum = Number(venta.saldo || 0);
        const totalNum = Number(venta.total || 0);
        const sim = venta.moneda === 'USD' ? '$us' : 'Bs.';

        const caption = message?.trim() || 
            `📋 *ESTADO DE CUENTA - EXTRACTO DE CRÉDITO*\n` +
            `🏢 *GIPAAF S.R.L.* (${branchDisplay})\n\n` +
            `Estimado(a) *${clientName}*,\n` +
            `Le adjuntamos el Extracto de Cuenta y Detalle de Pagos correspondiente a su *Venta N° ${folioVenta}* emitido al *${fechaFormatted}*.\n\n` +
            `💵 *Importe Total Venta:* ${sim} ${totalNum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
            `💰 *Saldo Actual Pendiente:* *${sim} ${saldoNum.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` +
            `📥 *Amortizaciones Registradas:* ${pagos.length} ${pagos.length === 1 ? 'pago' : 'pagos'}\n\n` +
            `_En el PDF adjunto encontrará el desglose completo de amortizaciones realizadas, fechas de vencimiento y saldo pendiente._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1200));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Estado_Cuenta_${folioVenta}_${clientName.replace(/\s+/g, '_')}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Estado de Cuenta ${folioVenta} a ${clientName}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Estado de cuenta de la venta ${folioVenta} enviado exitosamente por WhatsApp a ${clientName} (+${cleanedPhone})`,
            phone: cleanedPhone
        };
    }

    private generateEstadoCuentaVentaPdfInMemory(venta: Nota, pagos: PagoCobranza[], sucursalNombre: string): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'portrait',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = new Date().toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const fechaEmisionStr = venta.fecha 
                ? String(venta.fecha).split('T')[0].split('-').reverse().join('/') 
                : dateStr;

            const clientName = venta.cliente?.persona 
                ? `${venta.cliente.persona.nombres || ''} ${venta.cliente.persona.apellidos || ''}`.trim() 
                : (venta.cliente?.codigo || 'Cliente Final');
            const nitCi = venta.cliente?.persona?.ci || '-';
            const clientPhone = venta.cliente?.persona?.telefono || '-';
            const vendedorName = venta.vendedor 
                ? `${venta.vendedor.nombres || ''} ${venta.vendedor.apellidos || ''}`.trim() 
                : 'Sin asignar';
            const folioVenta = venta.numero || `VEN-${venta.id}`;

            const totalVenta = Number(venta.total || 0);
            const saldoVenta = Number(venta.saldo || 0);
            const cobradoVenta = Math.max(0, totalVenta - saldoVenta);
            const sim = venta.moneda === 'USD' ? '$us' : 'Bs.';

            const formatMoney = (val: number | string) => {
                const num = Number(val) || 0;
                return `${sim} ${num.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            };

            // Cálculo de Vencimiento y Mora
            let fechaVenc: Date | null = null;
            let diasCred = Number(venta.diasCredito) || 0;
            if (venta.fechaVencimiento) {
                fechaVenc = new Date(String(venta.fechaVencimiento).substring(0, 10) + 'T00:00:00');
            } else if (diasCred > 0 && venta.fecha) {
                const d = new Date(String(venta.fecha).substring(0, 10) + 'T00:00:00');
                d.setDate(d.getDate() + diasCred);
                fechaVenc = d;
            } else if (venta.cliente?.plazoCreditoDias && Number(venta.cliente.plazoCreditoDias) > 0 && venta.fecha) {
                diasCred = Number(venta.cliente.plazoCreditoDias);
                const d = new Date(String(venta.fecha).substring(0, 10) + 'T00:00:00');
                d.setDate(d.getDate() + diasCred);
                fechaVenc = d;
            }

            let estadoMoraTexto = 'AL DÍA (CONTADO)';
            let estadoMoraColor = '#16a34a';
            if (saldoVenta <= 0.001) {
                estadoMoraTexto = 'CANCELADO TOTAL';
                estadoMoraColor = '#16a34a';
            } else if (fechaVenc) {
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                const diffMs = hoy.getTime() - fechaVenc.getTime();
                const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                if (diffDias > 0) {
                    estadoMoraTexto = `EN MORA (${diffDias} DÍAS)`;
                    estadoMoraColor = '#dc2626';
                } else if (diffDias === 0) {
                    estadoMoraTexto = 'VENCE HOY';
                    estadoMoraColor = '#d97706';
                } else {
                    estadoMoraTexto = `AL DÍA (${Math.abs(diffDias)} DÍAS)`;
                    estadoMoraColor = '#2563eb';
                }
            }

            const drawHeader = (isFirstPage: boolean) => {
                // Logo a la izquierda
                const possibleLogoPaths = [
                    path.join(process.cwd(), '../frontend/public/logo.jpeg'),
                    path.join(process.cwd(), '../logo.JPEG'),
                    path.join(process.cwd(), 'logo.jpeg'),
                    path.join(process.cwd(), '../frontend/dist/logo.jpeg'),
                ];
                const logoFile = possibleLogoPaths.find(p => fs.existsSync(p));
                if (logoFile) {
                    try {
                        doc.image(logoFile, 36, 26, { width: 120 });
                    } catch (e) {
                        doc.font('Helvetica-Bold').fontSize(15).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 30);
                    }
                } else {
                    doc.font('Helvetica-Bold').fontSize(15).fillColor('#0f172a').text('GIPAAF S.R.L.', 36, 30);
                }

                // Título y folio a la derecha
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#0b132b').text('ESTADO DE CUENTA • EXTRACTO DE CRÉDITO', 200, 28, { width: 359, align: 'right' });
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#2563eb').text(`Comprobante de Venta: ${folioVenta}`, 200, 43, { width: 359, align: 'right' });
                doc.font('Helvetica').fontSize(8).fillColor('#64748b').text(`Emisión: ${dateStr}   |   Sucursal: ${sucursalNombre}`, 200, 56, { width: 359, align: 'right' });
            };

            const drawInfoBox = (startY: number) => {
                // Cuadro de información del Cliente y de la Operación
                doc.rect(36, startY, 523, 62).fillAndStroke('#f8fafc', '#cbd5e1');

                // Fila 1: Cliente | CI/NIT
                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a');
                doc.text(`CLIENTE: ${clientName.toUpperCase()}`, 46, startY + 7, { width: 300, ellipsis: true });
                doc.font('Helvetica').fontSize(8).fillColor('#475569');
                doc.text(`NIT / CI: ${nitCi}`, 360, startY + 7, { width: 190 });

                // Fila 2: Teléfono | Sucursal
                doc.text(`Teléfono: ${clientPhone}`, 46, startY + 20, { width: 200 });
                doc.text(`Sucursal: ${sucursalNombre}`, 250, startY + 20, { width: 300, ellipsis: true });

                // Fila 3: Vendedor | Tipo Documento
                const docTipo = venta.conFactura ? `CF:${venta.numeroFactura || 'S/N'}` : 'XF';
                doc.text(`Vendedor: ${vendedorName}`, 46, startY + 33, { width: 200, ellipsis: true });
                doc.text(`Documento: ${docTipo}`, 250, startY + 33, { width: 300 });

                // Fila 4: Fecha Emisión | Vencimiento | Estado
                const vencStr = fechaVenc ? fechaVenc.toLocaleDateString('es-BO') : 'Contado';
                doc.text(`Emisión: ${fechaEmisionStr}   |   Vencimiento: ${vencStr} (Plazo: ${diasCred} d)`, 46, startY + 46, { width: 310 });
                doc.font('Helvetica-Bold').fontSize(8).fillColor(estadoMoraColor);
                doc.text(`ESTADO: ${estadoMoraTexto}`, 360, startY + 46, { width: 190, align: 'right' });
            };

            // Página 1
            drawHeader(true);
            drawInfoBox(72);

            let currentY = 144;
            const maxY = 715;

            // ==========================================
            // SECCIÓN 1: HISTORIAL DE PAGOS / COBRANZAS
            // ==========================================
            doc.rect(36, currentY, 523, 16).fill('#0f172a');
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text('1. HISTORIAL CRONOLÓGICO DE AMORTIZACIONES Y COBROS REGISTRADOS', 44, currentY + 4);
            currentY += 16;

            // Cabecera Tabla Pagos
            doc.rect(36, currentY, 523, 18).fill('#334155');
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
            doc.text('#', 42, currentY + 5, { width: 18 });
            doc.text('RECIBO / NRO', 64, currentY + 5, { width: 66 });
            doc.text('FECHA PAGO', 132, currentY + 5, { width: 62 });
            doc.text('MÉTODO DE PAGO', 196, currentY + 5, { width: 78 });
            doc.text('REFERENCIA / BANCO', 276, currentY + 5, { width: 90 });
            doc.text('MONTO PAGADO', 368, currentY + 5, { width: 88, align: 'right' });
            doc.text('SALDO RESTANTE', 458, currentY + 5, { width: 95, align: 'right', lineBreak: false });
            currentY += 18;

            if (pagos.length === 0) {
                // Sin pagos previos
                doc.rect(36, currentY, 523, 20).fillAndStroke('#f8fafc', '#e2e8f0');
                doc.font('Helvetica-Oblique').fontSize(8).fillColor('#64748b').text(
                    'No se registran amortizaciones ni cobros previos a la fecha. El importe total de la venta permanece pendiente de pago.',
                    46,
                    currentY + 6,
                    { width: 503, align: 'center' }
                );
                currentY += 24;
            } else {
                let runningSaldo = totalVenta;
                pagos.forEach((pago, idx) => {
                    const rowHeight = 18;
                    if (currentY + rowHeight > maxY) {
                        doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                        drawHeader(false);
                        currentY = 72;
                    }

                    if (idx % 2 === 0) {
                        doc.rect(36, currentY, 523, rowHeight).fill('#f8fafc');
                    }

                    const montoPago = Number(pago.monto || 0);
                    const montoEq = (pago.moneda === venta.moneda) ? montoPago : Number(pago.montoEquivalente || montoPago);
                    runningSaldo = Math.max(0, runningSaldo - montoEq);

                    const fechaPagoStr = pago.fecha 
                        ? String(pago.fecha).split('T')[0].split('-').reverse().join('/') 
                        : '-';
                    const metodoStr = pago.metodoPago || 'Efectivo';
                    const refStr = pago.referencia || pago.observaciones || '-';

                    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
                    doc.text(String(idx + 1), 42, currentY + 5, { width: 18 });
                    doc.text(`COB-${String(pago.id).padStart(5, '0')}`, 64, currentY + 5, { width: 66 });
                    doc.text(fechaPagoStr, 132, currentY + 5, { width: 62 });
                    doc.text(metodoStr, 196, currentY + 5, { width: 78, lineBreak: false, ellipsis: true });
                    doc.text(refStr, 276, currentY + 5, { width: 90, lineBreak: false, ellipsis: true });
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#16a34a');
                    doc.text(formatMoney(montoEq), 368, currentY + 5, { width: 88, align: 'right' });
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor(runningSaldo > 0.001 ? '#dc2626' : '#16a34a');
                    doc.text(formatMoney(runningSaldo), 458, currentY + 5, { width: 95, align: 'right' });

                    currentY += rowHeight;
                });
                currentY += 8;
            }

            // ==========================================
            // SECCIÓN 2: DETALLE DE PRODUCTOS EN LA VENTA
            // ==========================================
            const detalles = venta.detalles || [];
            if (detalles.length > 0) {
                if (currentY + 50 > maxY) {
                    doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                    drawHeader(false);
                    currentY = 72;
                }

                doc.rect(36, currentY, 523, 16).fill('#1e3a8a');
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff').text('2. DETALLE DE PRODUCTOS ENTREGADOS EN LA VENTA', 44, currentY + 4);
                currentY += 16;

                // Cabecera Tabla Productos
                doc.rect(36, currentY, 523, 18).fill('#2563eb');
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
                doc.text('#', 42, currentY + 5, { width: 18 });
                doc.text('CÓDIGO', 64, currentY + 5, { width: 66 });
                doc.text('PRODUCTO / DESCRIPCIÓN', 132, currentY + 5, { width: 185 });
                doc.text('LOTE / VENC.', 320, currentY + 5, { width: 85 });
                doc.text('CANT.', 410, currentY + 5, { width: 35, align: 'center' });
                doc.text('P. UNIT', 450, currentY + 5, { width: 50, align: 'right' });
                doc.text('SUBTOTAL', 504, currentY + 5, { width: 50, align: 'right', lineBreak: false });
                currentY += 18;

                detalles.forEach((det, idx) => {
                    const rowHeight = 16;
                    if (currentY + rowHeight > maxY) {
                        doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                        drawHeader(false);
                        currentY = 72;
                    }

                    if (idx % 2 === 0) {
                        doc.rect(36, currentY, 523, rowHeight).fill('#f8fafc');
                    }

                    const prodCodigo = det.producto?.codigo || '-';
                    const prodNombre = det.producto?.nombre || '-';
                    const loteInfo = det.movimientosLote && det.movimientosLote.length > 0
                        ? det.movimientosLote.map((m: any) => `${m.lote?.numeroLote || 'S/N'}`).join(', ')
                        : (det.numeroLote || '-');

                    const cantNum = Number(det.cantidad || 0);
                    const precioNum = Number(det.precioUnitario || 0);
                    const subtotalNum = Number(det.subtotal || cantNum * precioNum);

                    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
                    doc.text(String(idx + 1), 42, currentY + 4, { width: 18 });
                    doc.text(prodCodigo, 64, currentY + 4, { width: 66, lineBreak: false, ellipsis: true });
                    doc.text(prodNombre, 132, currentY + 4, { width: 185, lineBreak: false, ellipsis: true });
                    doc.text(loteInfo, 320, currentY + 4, { width: 85, lineBreak: false, ellipsis: true });
                    doc.text(String(cantNum), 410, currentY + 4, { width: 35, align: 'center' });
                    doc.text(Number(precioNum).toFixed(2), 450, currentY + 4, { width: 50, align: 'right' });
                    doc.text(Number(subtotalNum).toFixed(2), 504, currentY + 4, { width: 50, align: 'right' });

                    currentY += rowHeight;
                });
                currentY += 8;
            }

            // ==========================================
            // SECCIÓN 3: TOTALES, SON EN LETRAS Y CUENTAS BANCARIAS
            // ==========================================
            if (currentY + 100 > maxY) {
                doc.addPage({ size: 'A4', layout: 'portrait', margin: 36 });
                drawHeader(false);
                currentY = 72;
            }

            const totalBoxY = currentY;
            doc.rect(36, totalBoxY, 523, 44).fillAndStroke('#f1f5f9', '#cbd5e1');

            // Lado Izquierdo: Son en Letras y Notas
            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a');
            doc.text(`SON: ${this.numeroALetras(saldoVenta > 0.001 ? saldoVenta : totalVenta)}`, 44, totalBoxY + 7, { width: 310 });
            if (venta.observaciones) {
                doc.font('Helvetica-Oblique').fontSize(7).fillColor('#64748b').text(`Observaciones: ${venta.observaciones}`, 44, totalBoxY + 22, { width: 310, ellipsis: true });
            }

            // Lado Derecho: Resumen Financiero
            doc.font('Helvetica').fontSize(8).fillColor('#475569').text('Total Venta:', 360, totalBoxY + 6, { width: 100, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(formatMoney(totalVenta), 465, totalBoxY + 6, { width: 88, align: 'right' });

            doc.font('Helvetica').fontSize(8).fillColor('#15803d').text('Total Cobrado:', 360, totalBoxY + 18, { width: 100, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#16a34a').text(formatMoney(cobradoVenta), 465, totalBoxY + 18, { width: 88, align: 'right' });

            doc.font('Helvetica-Bold').fontSize(9).fillColor(saldoVenta > 0.001 ? '#dc2626' : '#16a34a').text('SALDO PENDIENTE:', 340, totalBoxY + 30, { width: 120, align: 'right' });
            doc.font('Helvetica-Bold').fontSize(9).fillColor(saldoVenta > 0.001 ? '#dc2626' : '#16a34a').text(formatMoney(saldoVenta), 465, totalBoxY + 30, { width: 88, align: 'right' });

            currentY = totalBoxY + 54;

            // Firmas de Conformidad (posicionadas abajo con amplio espacio para firmar)
            const signY = Math.max(currentY + 50, 740);
            doc.strokeColor('#cbd5e1').lineWidth(1);

            // Firma Cliente
            doc.moveTo(60, signY).lineTo(220, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('CONFORMIDAD DEL CLIENTE', 60, signY + 5, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(clientName, 60, signY + 15, { width: 160, align: 'center', ellipsis: true });

            // Firma Cobranzas
            doc.moveTo(340, signY).lineTo(500, signY).stroke();
            doc.font('Helvetica-Bold').fontSize(8).fillColor('#475569').text('CAJA Y COBRANZAS', 340, signY + 5, { width: 160, align: 'center' });
            doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text('GIPAAF S.R.L.', 340, signY + 15, { width: 160, align: 'center' });

            // Pie de página
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Extracto de Cuenta y Saldo • Generado el ${dateStr} • Página ${i + 1} de ${range.count}`,
                    36,
                    790,
                    { width: 523, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

            doc.end();
        });
    }

    async sendEstadoCuentaClientePdf(dto: { clienteId: number; phone?: string; sucursalId?: number; message?: string }): Promise<any> {
        const { clienteId, phone, sucursalId, message } = dto;

        const cliente = await this.clienteRepo.findOne({
            where: { id: clienteId },
            relations: ['persona', 'sucursal', 'sucursal.ciudad']
        });

        if (!cliente) {
            throw new NotFoundException(`Cliente con ID ${clienteId} no encontrado`);
        }

        const qb = this.notaRepo.createQueryBuilder('nota')
            .leftJoinAndSelect('nota.cliente', 'cliente')
            .leftJoinAndSelect('cliente.persona', 'persona')
            .leftJoinAndSelect('nota.vendedor', 'vendedor')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
            .where('nota.tipo = :tipo', { tipo: TipoNota.VENTA })
            .andWhere('nota.estado = :estado', { estado: EstadoNota.CONFIRMADA })
            .andWhere('nota.saldo > 0')
            .andWhere('nota.clienteId = :clienteId', { clienteId });

        if (sucursalId) {
            qb.andWhere('nota.sucursalId = :sucursalId', { sucursalId });
        }

        const notas = await qb.orderBy('nota.fecha', 'ASC').getMany();

        if (notas.length === 0) {
            throw new BadRequestException(`El cliente ${cliente.persona ? `${cliente.persona.nombres} ${cliente.persona.apellidos}` : cliente.codigo} no tiene cuentas o saldos pendientes por pagar.`);
        }

        const targetSucursalId = sucursalId || cliente.sucursal?.id;
        let session = targetSucursalId ? await this.getOrCreateSession(targetSucursalId) : null;
        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            for (const [, s] of this.sessions.entries()) {
                if (s.connectionStatus === 'CONNECTED' && s.sock) {
                    session = s;
                    break;
                }
            }
        }

        if (!session || session.connectionStatus !== 'CONNECTED' || !session.sock) {
            throw new BadRequestException(`El canal de WhatsApp no está conectado.`);
        }

        const rawPhone = (phone || cliente.persona?.telefono || '').trim();
        if (!rawPhone) {
            throw new BadRequestException('No se especificó un número de teléfono para el cliente.');
        }

        const cleanedPhone = rawPhone.replace(/\D/g, '');
        const phoneWithCountry = cleanedPhone.length === 8 ? `591${cleanedPhone}` : cleanedPhone;
        const jid = `${phoneWithCountry}@s.whatsapp.net`;

        const branchDisplay = session.sucursalNombre + (session.ciudadNombre ? ` (${session.ciudadNombre})` : '');
        const clientName = this.formatClienteDisplay(cliente);

        let saldoTotalBOB = 0;
        notas.forEach(n => {
            saldoTotalBOB += n.moneda === 'USD' ? Number(n.saldo) * (Number(n.tipoCambio) || 6.96) : Number(n.saldo || 0);
        });

        const pdfBuffer = await this.generateAccountStatementPdfInMemory(cliente, notas, saldoTotalBOB, branchDisplay);
        const fechaFormatted = new Date().toLocaleDateString('es-BO');

        const caption = message?.trim() || 
            `📋 *ESTADO DE CUENTA DE CRÉDITO - GIPAAF (${branchDisplay})*\n\n` +
            `Estimado(a) *${clientName}*,\n` +
            `Le adjuntamos su Estado de Cuenta oficial emitido al *${fechaFormatted}*.\n\n` +
            `💰 *Saldo Total Pendiente:* *Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}*\n` +
            `📦 *Ventas / Notas Pendientes:* ${notas.length}\n\n` +
            `_En el PDF adjunto encontrará el detalle de compras, fechas de vencimiento y saldos pendientes._`;

        try {
            await session.sock.sendPresenceUpdate('composing', jid);
            await new Promise(r => setTimeout(r, 1500));
        } catch (e) {}

        await session.sock.sendMessage(jid, {
            document: pdfBuffer,
            mimetype: 'application/pdf',
            fileName: `Estado_Cuenta_${clientName.replace(/\s+/g, '_')}_${fechaFormatted.replace(/\//g, '-')}.pdf`,
            caption
        });

        this.logBranchMessage(session, {
            id: String(Date.now()),
            from: 'BOT',
            to: jid,
            text: `[PDF Estado de Cuenta Cliente ${clientName}] ${caption}`,
            direction: 'out',
            timestamp: new Date()
        });

        return {
            success: true,
            message: `Estado de cuenta enviado exitosamente por WhatsApp a ${clientName} (+${cleanedPhone})`,
            phone: cleanedPhone
        };
    }

    private numeroALetras(num: number): string {
        if (num === 0) return 'CERO 00/100 BOLIVIANOS';

        const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
        const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
        const dieces = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
        const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

        const getDecenas = (n: number) => {
            if (n < 10) return unidades[n];
            if (n >= 10 && n < 20) return dieces[n - 10];
            const decena = Math.floor(n / 10);
            const resto = n - (decena * 10);
            if (n === 20) return 'VEINTE';
            if (n > 20 && n < 30) return `VEINTI${unidades[resto]}`;
            return resto > 0 ? `${decenas[decena]} Y ${unidades[resto]}` : decenas[decena];
        };

        const getCentenas = (n: number) => {
            if (n === 100) return 'CIEN';
            const centena = Math.floor(n / 100);
            const resto = n - (centena * 100);
            return `${centenas[centena]} ${getDecenas(resto)}`.trim();
        };

        const getMiles = (n: number) => {
            const miles = Math.floor(n / 1000);
            const resto = n - (miles * 1000);
            let strMiles = '';
            if (miles === 1) strMiles = 'MIL';
            else if (miles > 1) strMiles = `${getCentenas(miles)} MIL`;
            return `${strMiles} ${getCentenas(resto)}`.trim();
        };

        const entero = Math.floor(Math.abs(num));
        const centavos = Math.round((Math.abs(num) - entero) * 100);
        const centavosStr = centavos.toString().padStart(2, '0');

        let letras = '';
        if (entero < 100) letras = getDecenas(entero);
        else if (entero < 1000) letras = getCentenas(entero);
        else if (entero < 1000000) letras = getMiles(entero);
        else letras = 'MILLONES...';

        return `${letras} ${centavosStr}/100 BOLIVIANOS`.trim();
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
                    `🏢 *${this.getSessionBranchDisplay(session)}*\n` +
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
                    `Escribe directamente el nombre o código del producto que buscas (ej. *barniz*, *thinner*, *catalizador*, *masilla*) para ver su precio y stock disponible en *${this.getSessionBranchDisplay(session)}*.`;
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
                `Escribe el nombre o código del producto que deseas consultar (ej. *barniz*, *thinner*, *catalizador*) para ver las existencias en *${this.getSessionBranchDisplay(session)}*.`;
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

        const branchDisplay = this.getSessionBranchDisplay(session);

        try {
            const pdfFilePath = path.join(session.authDir, 'catalog.pdf');
            if (session.config.customCatalogPdf && fs.existsSync(pdfFilePath)) {
                const pdfBuffer = fs.readFileSync(pdfFilePath);
                const docName = session.config.catalogPdfName || `Catalogo_GIPAAF_${branchDisplay.replace(/\s+/g, '_')}.pdf`;

                await session.sock.sendMessage(jid, {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: docName,
                    caption: `📄 *Catálogo Oficial de Productos - GIPAAF*\nSucursal: *${branchDisplay}*\nDescárgalo para consultar nuestra línea completa de pinturas y acabados.`
                });
                return true;
            } else if (session.config.customCatalogPdf && !session.config.customCatalogPdf.startsWith('FILE_SAVED')) {
                const base64Data = session.config.customCatalogPdf.includes('base64,')
                    ? session.config.customCatalogPdf.split('base64,')[1]
                    : session.config.customCatalogPdf;
                const pdfBuffer = Buffer.from(base64Data, 'base64');
                const docName = session.config.catalogPdfName || `Catalogo_GIPAAF_${branchDisplay.replace(/\s+/g, '_')}.pdf`;

                await session.sock.sendMessage(jid, {
                    document: pdfBuffer,
                    mimetype: 'application/pdf',
                    fileName: docName,
                    caption: `📄 *Catálogo Oficial de Productos - GIPAAF*\nSucursal: *${branchDisplay}*\nDescárgalo para consultar nuestra línea completa de pinturas y acabados.`
                });
                return true;
            }

            // Generación dinámica en memoria de catálogo PDF con diseño corporativo elegante
            const productos = await this.productoRepo.find({
                where: { activo: true },
                relations: ['categoria', 'marca', 'grupo'],
                order: { nombre: 'ASC' }
            });

            const pdfBuffer = await this.generateCatalogPdfInMemory(productos, branchDisplay);
            await session.sock.sendMessage(jid, {
                document: pdfBuffer,
                mimetype: 'application/pdf',
                fileName: `Catalogo_GIPAAF_${branchDisplay.replace(/\s+/g, '_')}.pdf`,
                caption: `📄 *Catálogo de Productos - GIPAAF (${branchDisplay})*\nLínea automotriz, ferretería y complementos (${productos.length} items activos).`
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
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = new Date().toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const drawHeaderAndBanner = (isFirstPage: boolean) => {
                // Banner superior azul oscuro corporativo (#0b132b)
                doc.rect(36, 30, 770, 56).fill('#0b132b');

                // Lado izquierdo del banner: Nombre de la empresa y eslogan
                doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text('GIPAAF S.R.L.', 50, 41);
                doc.font('Helvetica').fontSize(8.5).fillColor('#94a3b8').text('Grupo Importador de Pinturas Automotrices y Artículos de Ferretería', 50, 61);

                // Lado derecho del banner: Catálogo oficial y sucursal
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#38bdf8').text(`Catálogo Oficial • Vigente: ${dateStr}`, 480, 42, { width: 310, align: 'right' });
                doc.font('Helvetica').fontSize(8.5).fillColor('#cbd5e1').text(`Sucursal: ${sucursalNombre}`, 480, 58, { width: 310, align: 'right' });

                if (isFirstPage) {
                    // Título del documento
                    doc.font('Helvetica-Bold').fontSize(13).fillColor('#0f172a').text('CATÁLOGO GENERAL DE PRODUCTOS Y PRECIOS', 36, 100);
                    doc.font('Helvetica').fontSize(9).fillColor('#64748b').text(`Total de referencias activas: ${productos.length} productos`, 36, 116);
                }
            };

            const drawTableHeader = (startY: number) => {
                doc.rect(36, startY, 770, 22).fill('#2563eb');
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#ffffff');
                doc.text('CÓDIGO', 44, startY + 6, { width: 80, align: 'left' });
                doc.text('DESCRIPCIÓN DEL PRODUCTO', 130, startY + 6, { width: 220, align: 'left' });
                doc.text('MARCA', 355, startY + 6, { width: 90, align: 'left' });
                doc.text('CATEGORÍA', 450, startY + 6, { width: 90, align: 'left' });
                doc.text('GRUPO', 545, startY + 6, { width: 80, align: 'left' });
                doc.text('PRECIO (BS.)', 630, startY + 6, { width: 80, align: 'right' });
                doc.text('ESTADO', 715, startY + 6, { width: 85, align: 'center' });
            };

            // Página 1
            drawHeaderAndBanner(true);
            let currentY = 134;
            drawTableHeader(currentY);
            currentY += 22;

            const rowHeight = 19;
            const maxY = 540;

            productos.forEach((p, idx) => {
                if (currentY + rowHeight > maxY) {
                    doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                    drawHeaderAndBanner(false);
                    currentY = 100;
                    drawTableHeader(currentY);
                    currentY += 22;
                }

                // Fondo alternado de fila
                if (idx % 2 === 1) {
                    doc.rect(36, currentY, 770, rowHeight).fill('#f8fafc');
                }

                // Línea divisoria inferior
                doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(36, currentY + rowHeight).lineTo(806, currentY + rowHeight).stroke();

                // Columnas
                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a').text(p.codigo || '-', 44, currentY + 5, { width: 80, lineBreak: false });
                doc.font('Helvetica').fontSize(7.5).fillColor('#1e293b').text(p.nombre || '-', 130, currentY + 5, { width: 220, lineBreak: false, ellipsis: true });
                doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(p.marca?.nombre || '-', 355, currentY + 5, { width: 90, lineBreak: false, ellipsis: true });
                doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(p.categoria?.nombre || '-', 450, currentY + 5, { width: 90, lineBreak: false, ellipsis: true });
                doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(p.grupo?.nombre || '-', 545, currentY + 5, { width: 80, lineBreak: false, ellipsis: true });

                const precioStr = `Bs. ${Number(p.precioVenta || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                doc.font('Helvetica-Bold').fontSize(8).fillColor('#2563eb').text(precioStr, 630, currentY + 5, { width: 80, align: 'right' });

                doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#16a34a').text('Activo', 715, currentY + 5, { width: 85, align: 'center' });

                currentY += rowHeight;
            });

            // Pie de página en todas las páginas
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Documento generado automáticamente el ${dateStr} • Página ${i + 1} de ${range.count}`,
                    36,
                    555,
                    { width: 770, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

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
        const branchDisplay = this.getSessionBranchDisplay(session);

        let resp = `🏢 *INFORMACIÓN DE SUCURSAL - ${branchDisplay.toUpperCase()}*\n\n`;

        if (currentSucursal) {
            resp += `📍 *${this.formatSucursalDisplay(currentSucursal)}*\n`;
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
                resp += `🏢 *${this.formatSucursalDisplay(s)}*\n`;
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

        const branchDisplay = this.getSessionBranchDisplay(session);

        let resp = `💼 *ASESORES COMERCIALES - SUCURSAL ${branchDisplay.toUpperCase()}*\n\n` +
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
            const currentSuc = await this.sucursalRepo.findOne({ where: { id: session.sucursalId }, relations: ['ciudad'] });
            resp += `🏢 *Atención Directa ${this.formatSucursalDisplay(currentSuc)}*: 📱 ${currentSuc?.telefono || 'Oficina Central'}\n`;
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
        const branchDisplay = this.getSessionBranchDisplay(session);

        if (!isPersonal && !isCliente) {
            return `🤖 *${session.config.botName}*\n` +
                `_${session.config.customWelcomeMessage}_\n\n` +
                `👋 ¡Hola *${userName}*! Te damos la bienvenida a *GIPAAF - ${branchDisplay}*.\n` +
                `Por favor selecciona una opción respondiendo con el número:\n\n` +
                `1️⃣ *🏢 Dirección, Contacto y Horarios de Sucursal*\n` +
                `2️⃣ *📄 Descargar Catálogo General de Productos (PDF)*\n` +
                `3️⃣ *🔍 Consultar Productos y Precios en Tiempo Real*\n` +
                `4️⃣ *💼 Contactar a un Asesor Comercial de ${branchDisplay}*\n\n` +
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
            menu += `5️⃣ *🗺️ Mi Ruta de Clientes Asignados (${branchDisplay})*\n`;
        } else if (isCliente) {
            menu += `5️⃣ *🏢 Dirección, Contacto y Horarios de Sucursales*\n`;
        }

        if (isGerente || (isAdmin && !sucursal)) {
            menu += `6️⃣ *📊 Resumen Ejecutivo del Día (Por Sucursal o Consolidado)*\n`;
        } else if ((isAdmin || isJefeVentas) && sucursal) {
            menu += `6️⃣ *📊 Resumen Ejecutivo del Día (${this.formatSucursalDisplay(sucursal)})*\n`;
        }

        menu += `\n💬 _También puedes escribir directamente el nombre de un producto (ej. catalizador, barniz, thinner) para buscarlo al instante._`;
        return menu;
    }

    private buildBranchSelectionMenu(sucursales: Sucursal[]): string {
        let text = `🏢 *RESUMEN EJECUTIVO - SELECCIÓN DE SUCURSAL*\n\n` +
            `Por favor selecciona la sucursal que deseas consultar respondiendo con el número:\n\n`;

        sucursales.forEach((s, idx) => {
            text += `*${idx + 1}️⃣* ${this.formatSucursalDisplay(s)}\n`;
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

        const branchDisplay = this.getSessionBranchDisplay(session);
        let resp = `📦 *Resultados para: "${term}" en ${branchDisplay}*\n\n`;

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
                `• Stock en *${branchDisplay}*: *${stockSucursal} ${p.unidadMedida || 'Unid.'}*\n` +
                `• Stock Global: ${stockTotal} ${p.unidadMedida || 'Unid.'}\n`;

            if (inventarios.length > 0) {
                const stockDetails = inventarios.map(inv => {
                    return `  ▫️ ${this.formatSucursalDisplay(inv.sucursal)}: ${inv.stockActual}`;
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

        const branchDisplay = this.getSessionBranchDisplay(session);

        // Asegurar que cliente.sucursal esté cargada con su ciudad
        if (!cliente.sucursal) {
            try {
                const fullCli = await this.clienteRepo.findOne({
                    where: { id: cliente.id },
                    relations: ['sucursal', 'sucursal.ciudad']
                });
                if (fullCli?.sucursal) cliente.sucursal = fullCli.sucursal;
            } catch (e) {}
        }

        const allNotas = await this.notaRepo.find({
            where: {
                cliente: { id: cliente.id },
                tipo: TipoNota.VENTA,
                estado: EstadoNota.CONFIRMADA
            },
            relations: ['sucursal', 'sucursal.ciudad', 'vendedor', 'detalles', 'detalles.producto'],
            order: { fecha: 'ASC' }
        });

        // Filtrar notas con saldo estrictamente pertenecientes a la sucursal actual del bot (Opción A)
        const notasSucursalActual = allNotas.filter(n => n.sucursal?.id === session.sucursalId);
        const notasConSaldo = notasSucursalActual.filter(n => Number(n.saldo || 0) > 0.01);
        const saldoTotalBOB = notasConSaldo.reduce((acc, n) => {
            const s = Number(n.saldo || 0);
            return acc + (n.moneda === 'USD' ? (s * (Number(n.tipoCambio) || 6.96)) : s);
        }, 0);

        // Deudas en otras sucursales
        const notasOtrasSucursales = allNotas.filter(n => n.sucursal?.id !== session.sucursalId && Number(n.saldo || 0) > 0.01);

        // CASO 1: No tiene saldo pendiente en esta sucursal
        if (notasConSaldo.length === 0) {
            const isOtroSucursal = cliente.sucursal && cliente.sucursal.id !== session.sucursalId;
            let respNoDebt = `✅ *ESTADO DE CUENTA - ${branchDisplay.toUpperCase()}*\n\n` +
                `Hola *${clientName}*, actualmente *no registras deudas ni compras pendientes* en *${branchDisplay}*.\n`;

            if (isOtroSucursal) {
                const sucRegDisplay = this.formatSucursalDisplay(cliente.sucursal!);
                const telReg = cliente.sucursal?.telefono ? `\n📱 *Teléfono de atención:* ${cliente.sucursal.telefono}` : '';
                respNoDebt += `\n🏢 *Sucursal de Registro:* Tu cuenta de cliente está asignada a *${sucRegDisplay}*.`;

                if (notasOtrasSucursales.length > 0) {
                    respNoDebt += `\n\n📌 Para consultar tu estado de cuenta o pagos pendientes de *${sucRegDisplay}*, por favor comunícate directamente con la línea de WhatsApp de esa sucursal.${telReg}`;
                }
            } else {
                respNoDebt += `\n¡Gracias por tu puntualidad y confianza! 🤝`;
            }

            return {
                text: respNoDebt,
                pdfBuffer: null
            };
        }

        // CASO 2: Sí tiene saldo pendiente en esta sucursal
        let resp = `📋 *ESTADO DE CUENTA DE CRÉDITO - ${branchDisplay.toUpperCase()}*\n\n` +
            `Cliente: *${clientName}*\n` +
            `Código: \`${cliente.codigo || '-'}\`\n` +
            `💰 *Saldo Pendiente en ${branchDisplay}:* *Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2 })}*\n\n` +
            `*Detalle de Notas de Venta con Saldo:*\n`;

        notasConSaldo.forEach((n, idx) => {
            const fechaStr = n.fecha ? new Date(n.fecha).toLocaleDateString('es-BO') : '-';
            const monedaSimbolo = n.moneda === 'USD' ? '$us' : 'Bs.';
            const totalFmt = Number(n.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });
            const saldoFmt = Number(n.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 });

            resp += `\n*${idx + 1}. Nota #${n.numero || n.id}*\n` +
                `  📅 Fecha: ${fechaStr}\n` +
                `  💵 Total Venta: ${monedaSimbolo} ${totalFmt}\n` +
                `  ⚠️ *Saldo Pendiente:* *${monedaSimbolo} ${saldoFmt}*\n` +
                (n.moneda === 'USD' ? `     _(Equiv: Bs. ${(Number(n.saldo) * (Number(n.tipoCambio) || 6.96)).toFixed(2)})_\n` : '') +
                `───────────────────`;
        });

        if (notasOtrasSucursales.length > 0) {
            resp += `\n\n📌 _Nota: Este estado de cuenta contiene únicamente tus compras en *${branchDisplay}*._`;
        }

        resp += `\n\n📌 _Para abonar a tu cuenta, responde *4* para ver los números de cuenta bancaria y códigos QR._`;

        let pdfBuffer: Buffer | null = null;
        try {
            pdfBuffer = await this.generateAccountStatementPdfInMemory(cliente, notasConSaldo, saldoTotalBOB, branchDisplay);
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
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
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
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margin: 36,
                bufferPages: true,
                autoFirstPage: true
            });
            const chunks: Buffer[] = [];

            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            const dateStr = new Date().toLocaleDateString('es-BO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });

            const clientName = this.formatClienteDisplay(cliente);

            const drawHeaderAndBanner = (isFirstPage: boolean) => {
                // Banner superior azul oscuro corporativo (#0b132b)
                doc.rect(36, 30, 770, 56).fill('#0b132b');

                // Lado izquierdo del banner
                doc.font('Helvetica-Bold').fontSize(16).fillColor('#ffffff').text('GIPAAF S.R.L.', 50, 41);
                doc.font('Helvetica').fontSize(8.5).fillColor('#94a3b8').text('Grupo Importador de Pinturas Automotrices y Artículos de Ferretería', 50, 61);

                // Lado derecho del banner
                doc.font('Helvetica-Bold').fontSize(9).fillColor('#38bdf8').text(`Estado de Cuenta Oficial • ${dateStr}`, 480, 42, { width: 310, align: 'right' });
                doc.font('Helvetica').fontSize(8.5).fillColor('#cbd5e1').text(`Sucursal: ${sucursalNombre}`, 480, 58, { width: 310, align: 'right' });
            };

            const drawClientInfoBox = (startY: number) => {
                // Tarjeta de información del cliente y líneas de crédito
                doc.rect(36, startY, 770, 48).fillAndStroke('#ffffff', '#e2e8f0');

                // Línea 1: Cliente
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#0f172a').text(`CLIENTE: ${clientName.toUpperCase()}`, 48, startY + 8);

                // Línea 2: Código | NIT/CI | Teléfono
                doc.font('Helvetica').fontSize(8).fillColor('#475569').text(
                    `Código: ${cliente.codigo || 'C-001'}   |   NIT/CI: ${cliente.persona?.ci || '-'}   |   Teléfono: ${cliente.persona?.telefono || '-'}`,
                    48,
                    startY + 21
                );

                // Línea 3: Límite Crédito | Deuda Total | Crédito Disponible
                const limiteCred = Number(cliente.limiteCredito || 0);
                const dispCred = Math.max(0, limiteCred - saldoTotalBOB);

                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#0f172a').text(
                    `Límite Crédito: Bs. ${limiteCred.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    48,
                    startY + 33
                );

                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#dc2626').text(
                    `Deuda Total: Bs. ${saldoTotalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    280,
                    startY + 33
                );

                doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#16a34a').text(
                    `Crédito Disponible: Bs. ${dispCred.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    520,
                    startY + 33
                );
            };

            // Página 1
            drawHeaderAndBanner(true);
            drawClientInfoBox(96);

            let currentY = 154;
            const maxY = 540;

            if (notasConSaldo.length === 0) {
                doc.rect(36, currentY, 770, 40).fillAndStroke('#f0fdf4', '#bbf7d0');
                doc.font('Helvetica-Bold').fontSize(10).fillColor('#15803d').text(
                    '✓ El cliente no registra notas de venta pendientes de pago. ¡Cuenta al día!',
                    36,
                    currentY + 14,
                    { width: 770, align: 'center' }
                );
            } else {
                notasConSaldo.forEach((n) => {
                    const detallesCount = n.detalles && n.detalles.length > 0 ? n.detalles.length : 1;
                    // Altura estimada: cabecera nota (22) + subcabecera (18) + cabecera tabla (18) + items (18*detallesCount) + resumen (46) + margen (16)
                    const noteHeight = 22 + 18 + 18 + (18 * detallesCount) + 46 + 14;

                    if (currentY + noteHeight > maxY && currentY > 154) {
                        doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                        drawHeaderAndBanner(false);
                        currentY = 96;
                    }

                    // 1. Barra de cabecera de la nota de venta (Azul oscuro + Badge Naranja de Saldo)
                    doc.rect(36, currentY, 530, 22).fill('#1e293b');
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text(`NOTA DE VENTA: ${n.numero || 'VEN-' + n.id}`, 46, currentY + 6);

                    doc.rect(566, currentY, 240, 22).fill('#ea580c');
                    const saldoNotaStr = `SALDO: Bs. ${Number(n.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text(saldoNotaStr, 566, currentY + 6, { width: 240, align: 'center' });
                    currentY += 22;

                    // 2. Subcabecera con metadatos (Fecha, Sucursal, Vendedor, Facturación)
                    doc.rect(36, currentY, 770, 18).fillAndStroke('#f1f5f9', '#e2e8f0');
                    const fechaStr = n.fecha ? new Date(n.fecha).toLocaleDateString('es-BO') : '-';
                    const sucStr = n.sucursal ? this.formatSucursalDisplay(n.sucursal) : sucursalNombre;
                    const vendStr = n.vendedor ? `${n.vendedor.nombres || ''} ${n.vendedor.apellidos || ''}`.trim() : 'Asignado';
                    const facStr = (n.impuesto && Number(n.impuesto) > 0) ? 'Con Factura' : 'Sin Factura';

                    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
                    doc.text(`Fecha: ${fechaStr}`, 46, currentY + 4, { width: 130 });
                    doc.text(`Sucursal: ${sucStr}`, 180, currentY + 4, { width: 230, lineBreak: false, ellipsis: true });
                    doc.text(`Vendedor: ${vendStr}`, 415, currentY + 4, { width: 180, lineBreak: false, ellipsis: true });
                    doc.text(`Facturación: ${facStr}`, 600, currentY + 4, { width: 195 });
                    currentY += 18;

                    // 3. Encabezado de la tabla de items (#, CÓDIGO, PRODUCTO / DESCRIPCIÓN, CANTIDAD, P. UNITARIO, SUBTOTAL)
                    doc.rect(36, currentY, 770, 18).fill('#2563eb');
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#ffffff');
                    doc.text('#', 44, currentY + 5, { width: 25 });
                    doc.text('CÓDIGO', 72, currentY + 5, { width: 85 });
                    doc.text('PRODUCTO / DESCRIPCIÓN', 160, currentY + 5, { width: 310 });
                    doc.text('CANTIDAD', 475, currentY + 5, { width: 75, align: 'right' });
                    doc.text('P. UNITARIO', 555, currentY + 5, { width: 95, align: 'right' });
                    doc.text('SUBTOTAL', 655, currentY + 5, { width: 140, align: 'right' });
                    currentY += 18;

                    // 4. Filas de productos
                    if (n.detalles && n.detalles.length > 0) {
                        n.detalles.forEach((det, dIdx) => {
                            if (currentY + 18 > maxY) {
                                doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                                drawHeaderAndBanner(false);
                                currentY = 96;
                            }

                            if (dIdx % 2 === 1) {
                                doc.rect(36, currentY, 770, 18).fill('#f8fafc');
                            }

                            doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(36, currentY + 18).lineTo(806, currentY + 18).stroke();

                            doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(String(dIdx + 1), 44, currentY + 4);
                            doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text(det.producto?.codigo || '-', 72, currentY + 4, { width: 85, lineBreak: false });
                            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#0f172a').text(det.producto?.nombre || 'Producto', 160, currentY + 4, { width: 310, lineBreak: false, ellipsis: true });
                            doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a').text(Number(det.cantidad || 0).toFixed(2), 475, currentY + 4, { width: 75, align: 'right' });

                            const puStr = `Bs. ${Number(det.precioUnitario || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            doc.font('Helvetica').fontSize(7.5).fillColor('#0f172a').text(puStr, 555, currentY + 4, { width: 95, align: 'right' });

                            const subStr = `Bs. ${Number(det.subtotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                            doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#2563eb').text(subStr, 655, currentY + 4, { width: 140, align: 'right' });

                            currentY += 18;
                        });
                    } else {
                        doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#64748b').text('Detalle de items según nota de entrega.', 72, currentY + 4);
                        currentY += 18;
                    }

                    // 5. Cuadro de resumen inferior (Observaciones a la izquierda + Resumen montos a la derecha)
                    if (currentY + 48 > maxY) {
                        doc.addPage({ size: 'A4', layout: 'landscape', margin: 36 });
                        drawHeaderAndBanner(false);
                        currentY = 96;
                    }

                    doc.rect(36, currentY, 390, 46).fillAndStroke('#f8fafc', '#e2e8f0');
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#475569').text('OBSERVACIONES / NOTAS:', 46, currentY + 6);
                    doc.font('Helvetica-Oblique').fontSize(7.5).fillColor('#64748b').text(
                        n.observaciones || 'PRUEBA DE NOTA DE VENTA',
                        46,
                        currentY + 18,
                        { width: 370 }
                    );

                    doc.rect(430, currentY, 376, 46).fillAndStroke('#ffffff', '#e2e8f0');

                    // Fila 1: Total Venta
                    doc.font('Helvetica').fontSize(7.5).fillColor('#475569').text('Total Venta:', 440, currentY + 6);
                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#0f172a').text(
                        `Bs. ${Number(n.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        440,
                        currentY + 6,
                        { width: 356, align: 'right' }
                    );

                    // Fila 2: Monto Cobrado / Amortizado
                    const amortizado = Math.max(0, Number(n.total || 0) - Number(n.saldo || 0));
                    doc.font('Helvetica-Bold').fontSize(7.5).fillColor('#16a34a').text('Monto Cobrado / Amortizado:', 440, currentY + 19);
                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#16a34a').text(
                        `Bs. ${amortizado.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        440,
                        currentY + 19,
                        { width: 356, align: 'right' }
                    );

                    // Fila 3: Saldo Deuda Pendiente
                    doc.font('Helvetica-Bold').fontSize(8).fillColor('#dc2626').text('Saldo Deuda Pendiente:', 440, currentY + 32);
                    doc.font('Helvetica-Bold').fontSize(8.5).fillColor('#dc2626').text(
                        `Bs. ${Number(n.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        440,
                        currentY + 32,
                        { width: 356, align: 'right' }
                    );

                    currentY += 46 + 16;
                });
            }

            // Pie de página en todas las páginas
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const oldBottom = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font('Helvetica').fontSize(7).fillColor('#94a3b8').text(
                    `GIPAAF S.R.L. • Documento generado automáticamente el ${dateStr} • Página ${i + 1} de ${range.count}`,
                    36,
                    555,
                    { width: 770, align: 'center', lineBreak: false }
                );
                doc.page.margins.bottom = oldBottom;
            }

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
            relations: ['clientes', 'clientes.persona', 'sucursal', 'sucursal.ciudad']
        });

        const branchDisplay = this.getSessionBranchDisplay(session);

        if (!rutas || rutas.length === 0) {
            // Check in other branches
            const allRutas = await this.rutaRepo.find({
                where: { vendedor: { id: vendedorId }, activo: true },
                relations: ['clientes', 'clientes.persona', 'sucursal', 'sucursal.ciudad']
            });

            if (allRutas.length > 0) {
                let resp = `📍 *RUTAS ASIGNADAS - ASESOR COMERCIAL*\n👤 Asesor: *${userName}*\n\n`;
                allRutas.forEach(r => {
                    resp += `🗺️ *Ruta: ${r.nombre} (${this.formatSucursalDisplay(r.sucursal)})*\n`;
                    resp += `* Total Clientes: ${r.clientes?.length || 0}\n`;
                    (r.clientes || []).slice(0, 10).forEach((c, idx) => {
                        const name = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : 'Cliente';
                        resp += `  ${idx + 1}. ${name} 📱 ${c.persona?.telefono || '-'}\n`;
                    });
                    resp += `───────────────────\n`;
                });
                return resp;
            }

            return `📍 *RUTAS ASIGNADAS*\n\nHola *${userName}*, actualmente no tienes rutas con clientes asignadas en *${branchDisplay}*.\n\nComunícate con tu Jefe de Ventas para asignar tu ruta.`;
        }

        let resp = `📍 *TUS RUTAS Y CLIENTES ASIGNADOS (${branchDisplay.toUpperCase()})*\n\n`;

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

        // 1. VENTAS
        const ventasQuery = this.notaRepo.createQueryBuilder('nota')
            .leftJoinAndSelect('nota.sucursal', 'sucursal')
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
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
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
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
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
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
            .leftJoinAndSelect('sucursal.ciudad', 'ciudad')
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
        const ambitoStr = targetSucursal 
            ? this.formatSucursalDisplay(targetSucursal)
            : (session && sucursalId ? this.getSessionBranchDisplay(session) : 'Consolidado General (Todas las Sucursales)');

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
