import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { whatsappService, type WhatsAppConfig, type BranchStatusSummary } from '../../api/whatsappService';
import { sucursalService, type Sucursal } from '../../api/sucursalService';
import { useAuth } from '../../context/AuthContext';
import { useFilters } from '../../context/FilterContext';
import {
    MessageSquare, Smartphone, QrCode, Power, RefreshCw, Send,
    Settings, ShieldCheck, CheckCircle2, AlertTriangle, XCircle,
    Activity, Bot, Users, Package, CreditCard, MapPin, BarChart3,
    FileText, Sparkles, Building2, Plus, Trash2, Upload, Lock,
    Check
} from 'lucide-react';
import { toast } from 'sonner';

const WhatsAppPage: React.FC = () => {
    const { isAdmin, userPersonal } = useAuth();
    const { selectedCiudad, selectedSucursal } = useFilters();
    const queryClient = useQueryClient();

    // Queries for sucursales & branch statuses
    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const { data: branchesStatus, refetch: refetchBranches } = useQuery({
        queryKey: ['whatsappBranchesStatus'],
        queryFn: whatsappService.getBranchesStatus,
        refetchInterval: 4000,
    });

    // Active branch selection
    const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);

    // If user has restricted branch, restrict selection
    const isRestrictedBranchUser = !isAdmin && !!userPersonal?.sucursal?.id;

    // Filter available branches (only active and matching global filters)
    const availableBranches = useMemo(() => {
        if (!sucursales) return [];
        let list = sucursales.filter(s => s.activo !== false);
        if (selectedCiudad) {
            list = list.filter(s => s.ciudad?.id === Number(selectedCiudad) || s.ciudadId === Number(selectedCiudad));
        }
        if (selectedSucursal) {
            list = list.filter(s => s.id === Number(selectedSucursal));
        }
        return list;
    }, [sucursales, selectedCiudad, selectedSucursal]);

    const activeSucursalId = useMemo(() => {
        if (isRestrictedBranchUser) {
            return userPersonal.sucursal!.id;
        }
        if (selectedBranchId && availableBranches.some(b => b.id === selectedBranchId)) {
            return selectedBranchId;
        }
        if (selectedSucursal && !isNaN(Number(selectedSucursal)) && availableBranches.some(b => b.id === Number(selectedSucursal))) {
            return Number(selectedSucursal);
        }
        if (availableBranches && availableBranches.length > 0) {
            return availableBranches[0].id;
        }
        return availableBranches[0]?.id || 1;
    }, [isRestrictedBranchUser, userPersonal, selectedBranchId, selectedSucursal, availableBranches]);

    const currentSucursal = useMemo(() => {
        return sucursales?.find(s => s.id === activeSucursalId);
    }, [sucursales, activeSucursalId]);

    // Tab state
    const [activeTab, setActiveTab] = useState<'estado' | 'configuracion' | 'mensajes' | 'comandos'>('estado');

    // Test Message Form
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('¡Hola! Este es un mensaje de prueba desde el sistema GIPAAF.');

    // Config form
    const [configState, setConfigState] = useState<Partial<WhatsAppConfig>>({});
    const [selectedQrPreview, setSelectedQrPreview] = useState<string | null>(null);

    const handleQrUpload = (accountId: string, file: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor selecciona un archivo de imagen válido (PNG, JPG, WEBP)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('La imagen no debe superar los 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setConfigState(prev => {
                const accounts = prev.bankAccounts ? [...prev.bankAccounts] : [];
                const updated = accounts.map(acc => acc.id === accountId ? { ...acc, qrImage: base64 } : acc);
                return { ...prev, bankAccounts: updated };
            });
            toast.success('Imagen QR cargada correctamente');
        };
        reader.readAsDataURL(file);
    };

    const handlePdfUpload = (file: File) => {
        if (!file) return;
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            toast.error('Por favor selecciona un archivo PDF válido');
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            toast.error('El documento PDF no debe superar los 20MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            setConfigState(prev => ({
                ...prev,
                customCatalogPdf: base64,
                catalogPdfName: file.name
            }));
            toast.success(`Catálogo PDF "${file.name}" cargado`);
        };
        reader.readAsDataURL(file);
    };

    const addBankAccount = () => {
        const newAcc = {
            id: `acc_${Date.now()}`,
            banco: 'Banco Nacional de Bolivia (BNB)',
            tipoCuenta: 'Cuenta Corriente BOB',
            numeroCuenta: '',
            titular: 'GIPAAF S.R.L.',
            documentoIdentidad: 'NIT: 1029384756',
            qrImage: null,
            activo: true
        };
        setConfigState(prev => ({
            ...prev,
            bankAccounts: [...(prev.bankAccounts || []), newAcc]
        }));
    };

    const updateBankAccount = (id: string, field: string, value: any) => {
        setConfigState(prev => {
            const accounts = (prev.bankAccounts || []).map(acc => {
                if (acc.id === id) {
                    return { ...acc, [field]: value };
                }
                return acc;
            });
            return { ...prev, bankAccounts: accounts };
        });
    };

    const removeBankAccount = (id: string) => {
        setConfigState(prev => ({
            ...prev,
            bankAccounts: (prev.bankAccounts || []).filter(acc => acc.id !== id)
        }));
        toast.info('Cuenta bancaria eliminada');
    };

    // Polling query for status of current active branch
    const { data: statusData, isLoading, refetch: refetchStatus } = useQuery({
        queryKey: ['whatsappStatus', activeSucursalId],
        queryFn: () => whatsappService.getStatus(activeSucursalId),
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            return status === 'QR_READY' || status === 'CONNECTING' ? 3000 : 6000;
        },
        enabled: !!activeSucursalId
    });

    const { data: logsData, refetch: refetchLogs } = useQuery({
        queryKey: ['whatsappLogs', activeSucursalId],
        queryFn: () => whatsappService.getLogs(activeSucursalId, 50),
        enabled: (activeTab === 'mensajes' || activeTab === 'estado') && !!activeSucursalId,
        refetchInterval: 5000,
    });

    // Mutations
    const connectMutation = useMutation({
        mutationFn: () => whatsappService.connect(activeSucursalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsappStatus', activeSucursalId] });
            queryClient.invalidateQueries({ queryKey: ['whatsappBranchesStatus'] });
            toast.success(`Iniciando vinculación de WhatsApp para ${currentSucursal?.nombre || 'la sucursal'}...`);
        },
        onError: (err: any) => toast.error('Error al iniciar conexión: ' + (err.message || 'Desconocido'))
    });

    const disconnectMutation = useMutation({
        mutationFn: () => whatsappService.disconnect(activeSucursalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsappStatus', activeSucursalId] });
            queryClient.invalidateQueries({ queryKey: ['whatsappBranchesStatus'] });
            toast.success(`Sesión de WhatsApp cerrada para ${currentSucursal?.nombre || 'la sucursal'}`);
        },
        onError: (err: any) => toast.error('Error al desconectar: ' + (err.message || 'Desconocido'))
    });

    const sendTestMutation = useMutation({
        mutationFn: () => whatsappService.sendTestMessage(testPhone, testMessage, activeSucursalId),
        onSuccess: () => {
            toast.success('Mensaje de prueba enviado exitosamente');
            setTestMessage('');
            queryClient.invalidateQueries({ queryKey: ['whatsappLogs', activeSucursalId] });
        },
        onError: (err: any) => toast.error('Error al enviar mensaje: ' + (err.response?.data?.message || err.message))
    });

    const updateConfigMutation = useMutation({
        mutationFn: (newCfg: Partial<WhatsAppConfig>) => whatsappService.updateConfig(newCfg, activeSucursalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['whatsappStatus', activeSucursalId] });
            queryClient.invalidateQueries({ queryKey: ['whatsappBranchesStatus'] });
            toast.success(`Configuración del Bot actualizada para ${currentSucursal?.nombre || 'la sucursal'}`);
        },
        onError: () => toast.error('Error al guardar configuración')
    });

    // Initialize config state when data arrives
    useEffect(() => {
        if (statusData?.config) {
            setConfigState(statusData.config);
        }
    }, [statusData?.config]);

    const isConnected = statusData?.status === 'CONNECTED';
    const isConnecting = statusData?.status === 'CONNECTING';
    const isQrReady = statusData?.status === 'QR_READY';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        Chatbot de WhatsApp por Sucursal
                    </h1>
                    <p className="text-muted-foreground italic">
                        Asistente interactivo independiente por cada sucursal de GIPAAF para clientes, preventistas y administración.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { refetchStatus(); refetchLogs(); refetchBranches(); }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer"
                        title="Actualizar estado"
                    >
                        <RefreshCw className="w-4 h-4 text-muted-foreground" />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                    {isConnected ? (
                        <button
                            onClick={() => {
                                if (window.confirm(`¿Seguro que deseas desconectar la sesión de WhatsApp de ${currentSucursal?.nombre || 'esta sucursal'}?`)) {
                                    disconnectMutation.mutate();
                                }
                            }}
                            disabled={disconnectMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <Power className="w-4 h-4" /> Desconectar
                        </button>
                    ) : (
                        <button
                            onClick={() => connectMutation.mutate()}
                            disabled={connectMutation.isPending || isConnecting}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <QrCode className="w-4 h-4" /> {isConnecting ? 'Conectando...' : 'Vincular WhatsApp'}
                        </button>
                    )}
                </div>
            </div>

            {/* SELECCIÓN DE SUCURSAL / ESTADOS MULTI-SUCURSAL */}
            <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-semibold uppercase tracking-wider flex items-center gap-1.5 text-foreground">
                        <Building2 className="w-4 h-4 text-primary" />
                        Seleccionar Sucursal ({availableBranches.length} activas)
                    </span>
                    {isRestrictedBranchUser && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                            <Lock className="w-3.5 h-3.5" /> Acceso restringido a tu sucursal
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {availableBranches.map(s => {
                        const branchInfo = branchesStatus?.find(b => b.sucursalId === s.id);
                        const isSelected = activeSucursalId === s.id;
                        const bStatus = branchInfo?.status || (isSelected ? statusData?.status : 'DISCONNECTED') || 'DISCONNECTED';
                        const isConn = bStatus === 'CONNECTED';
                        const isQr = bStatus === 'QR_READY';
                        const isConnIng = bStatus === 'CONNECTING';

                        return (
                            <button
                                key={s.id}
                                disabled={isRestrictedBranchUser && userPersonal?.sucursal?.id !== s.id}
                                onClick={() => setSelectedBranchId(s.id)}
                                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 shadow-sm ${
                                    isSelected
                                        ? 'bg-primary/5 border-primary ring-2 ring-primary/20 shadow-md'
                                        : 'bg-card hover:bg-accent/60 border-border'
                                } ${isRestrictedBranchUser && userPersonal?.sucursal?.id !== s.id ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                        <span className="font-semibold text-sm truncate">{s.nombre}</span>
                                    </div>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                                        isConn
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                            : isQr
                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                                                : isConnIng
                                                    ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse'
                                                    : 'bg-muted text-muted-foreground border border-border'
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${
                                            isConn ? 'bg-emerald-500' : isQr ? 'bg-amber-500' : isConnIng ? 'bg-blue-500' : 'bg-muted-foreground'
                                        }`} />
                                        {isConn ? 'Conectado' : isQr ? 'QR Listo' : isConnIng ? 'Conectando...' : 'Desconectado'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1.5 border-t border-border/50">
                                    <span>{s.ciudad?.nombre || 'Central'}</span>
                                    <span className="font-mono text-[11px]">
                                        {branchInfo?.user?.id ? `+${branchInfo.user.id}` : (s.telefono || 'Sin celular')}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b">
                <button
                    onClick={() => setActiveTab('estado')}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                        activeTab === 'estado'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Smartphone className="w-4 h-4" /> Estado & Conexión
                </button>
                <button
                    onClick={() => setActiveTab('configuracion')}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                        activeTab === 'configuracion'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Settings className="w-4 h-4" /> Configuración del Bot ({currentSucursal?.nombre || 'Sucursal'})
                </button>
                <button
                    onClick={() => setActiveTab('comandos')}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                        activeTab === 'comandos'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Bot className="w-4 h-4" /> Menús y Comandos
                </button>
                <button
                    onClick={() => setActiveTab('mensajes')}
                    className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
                        activeTab === 'mensajes'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Activity className="w-4 h-4" /> Registro de Actividad ({logsData?.length || 0})
                </button>
            </div>

            {/* TAB 1: ESTADO Y VINCULACIÓN */}
            {activeTab === 'estado' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Status Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                        <Smartphone className="w-5 h-5 text-primary" />
                                        WhatsApp Bot - {currentSucursal?.nombre || 'Sucursal'}
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {currentSucursal?.direccion || 'Oficina Comercial'} {currentSucursal?.ciudad?.nombre ? `(${currentSucursal.ciudad.nombre})` : ''}
                                    </p>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                                    isConnected
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                        : isQrReady
                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 animate-pulse'
                                        : isConnecting
                                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 animate-pulse'
                                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${
                                        isConnected ? 'bg-emerald-500 animate-ping' : isQrReady ? 'bg-amber-500' : isConnecting ? 'bg-blue-500' : 'bg-zinc-400'
                                    }`}></span>
                                    {isConnected ? 'Conectado y Activo' : isQrReady ? 'Escaneando Código QR' : isConnecting ? 'Iniciando Conexión...' : 'Desconectado'}
                                </span>
                            </div>

                            {isConnected ? (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-emerald-600 text-white rounded-xl">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-foreground">
                                                Línea Vinculada: {statusData?.user?.name || 'WhatsApp'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono">
                                                Número de Teléfono: +{statusData?.user?.id}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                        El bot de <strong>{currentSucursal?.nombre}</strong> está atendiendo consultas de stock, catálogos, cuentas y vendedores en tiempo real.
                                    </p>
                                </div>
                            ) : isQrReady && statusData?.qrCode ? (
                                <div className="p-6 bg-amber-500/5 border border-amber-500/30 rounded-xl flex flex-col md:flex-row items-center gap-6">
                                    <div className="p-2 bg-white rounded-xl shadow-md shrink-0 border">
                                        <img src={statusData.qrCode} alt="Código QR WhatsApp" className="w-56 h-56" />
                                    </div>
                                    <div className="space-y-3">
                                        <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                                            <QrCode className="w-4 h-4 text-amber-500" />
                                            Vincular teléfono de {currentSucursal?.nombre}:
                                        </h3>
                                        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside leading-relaxed">
                                            <li>Abre <strong>WhatsApp</strong> en el teléfono de esta sucursal.</li>
                                            <li>Toca el menú de <strong>tres puntos</strong> o <strong>Configuración</strong>.</li>
                                            <li>Selecciona <strong>Dispositivos vinculados</strong>.</li>
                                            <li>Toca en <strong>Vincular un dispositivo</strong> y apunta tu cámara hacia este código QR.</li>
                                        </ol>
                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                                            El código QR se actualiza automáticamente.
                                        </p>
                                    </div>
                                </div>
                            ) : isConnecting ? (
                                <div className="p-8 border rounded-xl text-center space-y-3">
                                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                                    <div className="text-sm font-semibold text-foreground">Iniciando sesión en {currentSucursal?.nombre}...</div>
                                    <p className="text-xs text-muted-foreground">Generando claves seguras y preparando el código QR.</p>
                                </div>
                            ) : (
                                <div className="p-8 border rounded-xl text-center space-y-4">
                                    <XCircle className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
                                    <div>
                                        <div className="text-base font-bold text-foreground">El bot de {currentSucursal?.nombre} está desconectado</div>
                                        <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                                            Haz clic abajo para generar el código QR y vincular el número de WhatsApp oficial asignado a esta sucursal.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => connectMutation.mutate()}
                                        disabled={connectMutation.isPending}
                                        className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer shadow-md inline-flex items-center gap-2"
                                    >
                                        <QrCode className="w-4 h-4" /> Generar QR de {currentSucursal?.nombre}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Test Message Box */}
                        <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Send className="w-5 h-5 text-primary" />
                                Enviar Mensaje de Prueba ({currentSucursal?.nombre})
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                                <div className="md:col-span-5 space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Número de Teléfono Destino</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. 72002180 o 59172002180"
                                        value={testPhone}
                                        onChange={(e) => setTestPhone(e.target.value)}
                                        className="w-full p-2.5 text-sm bg-background text-foreground border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/90 dark:placeholder:text-zinc-400 placeholder:text-xs"
                                    />
                                </div>
                                <div className="md:col-span-7 space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground">Mensaje</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Escribe el mensaje de prueba..."
                                            value={testMessage}
                                            onChange={(e) => setTestMessage(e.target.value)}
                                            className="flex-1 p-2.5 text-sm bg-background text-foreground border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/90 dark:placeholder:text-zinc-400 placeholder:text-xs"
                                        />
                                        <button
                                            onClick={() => sendTestMutation.mutate()}
                                            disabled={!isConnected || !testPhone || !testMessage || sendTestMutation.isPending}
                                            className="px-4 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer shrink-0 flex items-center gap-1.5 shadow-sm"
                                        >
                                            <Send className="w-4 h-4" /> Enviar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Side Info & Tips */}
                    <div className="space-y-6">
                        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                Arquitectura por Sucursal
                            </h3>
                            <ul className="text-xs text-muted-foreground space-y-2 leading-relaxed">
                                <li>🏢 <strong>Sesiones Aisladas:</strong> Cada sucursal dispone de su propia sesión de WhatsApp en el servidor.</li>
                                <li>📦 <strong>Stock Local:</strong> El bot prioriza la disponibilidad en los almacenes de la sucursal conectada.</li>
                                <li>💼 <strong>Vendedores de Zona:</strong> Las solicitudes de contacto dirigen a los preventistas asignados a esta sucursal.</li>
                            </ul>
                        </div>

                        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-3">
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Datos de la Sucursal Activa
                            </h3>
                            <div className="space-y-2 text-xs text-muted-foreground">
                                <div>
                                    <span className="font-semibold text-foreground">Sucursal:</span> {currentSucursal?.nombre}
                                </div>
                                <div>
                                    <span className="font-semibold text-foreground">Ciudad:</span> {currentSucursal?.ciudad?.nombre || 'Central'}
                                </div>
                                <div>
                                    <span className="font-semibold text-foreground">Dirección:</span> {currentSucursal?.direccion || '-'}
                                </div>
                                <div>
                                    <span className="font-semibold text-foreground">Horario:</span> {currentSucursal?.horarioAtencion || '-'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 2: CONFIGURACIÓN DEL BOT */}
            {activeTab === 'configuracion' && (
                <div className="bg-card border rounded-xl p-6 shadow-sm space-y-6 max-w-4xl">
                    <div>
                        <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                            <Settings className="w-5 h-5 text-primary" />
                            Configuración del Bot ({currentSucursal?.nombre || 'Sucursal'})
                        </h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Personaliza las respuestas automáticas, nombre y datos bancarios que ofrece el bot de esta sucursal.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                            <div>
                                <div className="text-sm font-bold text-foreground">Respuestas Automáticas Activas</div>
                                <div className="text-xs text-muted-foreground">Permite que el bot responda mensajes entrantes automáticamente.</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={configState.autoReplyEnabled ?? true}
                                onChange={(e) => setConfigState(prev => ({ ...prev, autoReplyEnabled: e.target.checked }))}
                                className="w-5 h-5 accent-primary cursor-pointer"
                            />
                        </div>

                        <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20">
                            <div>
                                <div className="text-sm font-bold text-foreground">Ignorar Mensajes de Grupos y Canales (Recomendado)</div>
                                <div className="text-xs text-muted-foreground">El bot nunca responderá en grupos o canales para evitar spam o bloqueos.</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={configState.ignoreGroups ?? true}
                                onChange={(e) => setConfigState(prev => ({ ...prev, ignoreGroups: e.target.checked }))}
                                className="w-5 h-5 accent-primary cursor-pointer"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Nombre del Bot</label>
                                <input
                                    type="text"
                                    value={configState.botName || ''}
                                    onChange={(e) => setConfigState(prev => ({ ...prev, botName: e.target.value }))}
                                    placeholder={`Ej. GIPAAF Bot (${currentSucursal?.nombre})`}
                                    className="w-full p-2.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground">Mensaje de Bienvenida</label>
                                <input
                                    type="text"
                                    value={configState.customWelcomeMessage || ''}
                                    onChange={(e) => setConfigState(prev => ({ ...prev, customWelcomeMessage: e.target.value }))}
                                    placeholder="Mensaje de saludo inicial..."
                                    className="w-full p-2.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>
                        </div>

                        {/* PDF CATALOG CONFIGURATION */}
                        <div className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b">
                                <div>
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary" />
                                        Catálogo General de Productos (Opción 2 del Bot)
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        El bot enviará este documento PDF automáticamente cuando los clientes o vendedores respondan con <strong>2</strong> o escriban <strong>catálogo / pdf</strong>.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="border rounded-xl p-4 bg-card space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-blue-500" />
                                            Generador Dinámico Automático
                                        </div>
                                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                                            !configState.customCatalogPdf
                                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300'
                                                : 'bg-muted text-muted-foreground border-muted'
                                        }`}>
                                            {!configState.customCatalogPdf ? 'Activo por Defecto' : 'En espera'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Genera en tiempo real un PDF con todos los productos activos registrados en el catálogo de GIPAAF con sus códigos, categorías, marcas y precios de lista vigentes.
                                    </p>
                                </div>

                                <div className="border rounded-xl p-4 bg-card space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="font-bold text-xs text-foreground flex items-center gap-1.5">
                                            <Upload className="w-4 h-4 text-purple-500" />
                                            Subir Catálogo Oficial (PDF Personalizado)
                                        </div>
                                        {configState.customCatalogPdf && (
                                            <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 border border-purple-300 text-[10px] font-bold rounded-full">
                                                PDF Activo
                                            </span>
                                        )}
                                    </div>

                                    {configState.customCatalogPdf ? (
                                        <div className="flex items-center justify-between p-2.5 bg-muted/30 border rounded-lg">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="w-4 h-4 text-red-500 shrink-0" />
                                                <span className="text-xs font-semibold text-foreground truncate">
                                                    {configState.catalogPdfName || 'Catalogo_GIPAAF.pdf'}
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setConfigState(prev => ({ ...prev, customCatalogPdf: null, catalogPdfName: undefined }))}
                                                className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1 hover:bg-red-50 dark:hover:bg-red-950/40 rounded transition-colors cursor-pointer"
                                            >
                                                Usar Dinámico
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="block p-3 border border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 rounded-lg cursor-pointer text-center transition-all">
                                            <Upload className="w-5 h-5 text-primary mx-auto mb-1 opacity-80" />
                                            <div className="text-xs font-semibold text-primary">Subir documento PDF oficial</div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">PDF (Máx 20MB)</p>
                                            <input
                                                type="file"
                                                accept="application/pdf"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handlePdfUpload(file);
                                                }}
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* CUENTAS BANCARIAS */}
                        <div className="space-y-4 pt-2">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b">
                                <div>
                                    <label className="text-sm font-bold text-foreground flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-primary" />
                                        Cuentas Bancarias & Códigos QR de Pago
                                    </label>
                                    <p className="text-xs text-muted-foreground">
                                        Configura las cuentas y sube la imagen del código QR para que el bot las envíe automáticamente por WhatsApp cuando el cliente escriba <strong>4</strong> o <strong>pagar</strong>.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={addBankAccount}
                                    className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 w-fit"
                                >
                                    <Plus className="w-4 h-4" /> Agregar Cuenta Bancaria
                                </button>
                            </div>

                            {/* List of bank accounts */}
                            <div className="space-y-4">
                                {(configState.bankAccounts && configState.bankAccounts.length > 0) ? (
                                    configState.bankAccounts.map((account, index) => (
                                        <div
                                            key={account.id || index}
                                            className={`border rounded-xl p-4 transition-all shadow-sm ${
                                                account.activo !== false
                                                    ? 'bg-card border-border'
                                                    : 'bg-muted/30 border-muted opacity-60'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-3 mb-3 border-b">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold font-mono">
                                                        #{index + 1}
                                                    </div>
                                                    <span className="text-sm font-bold text-foreground">
                                                        {account.banco || 'Nueva Cuenta Bancaria'}
                                                    </span>
                                                    {account.qrImage && (
                                                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1">
                                                            <QrCode className="w-3 h-3" /> QR Adjunto
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={account.activo !== false}
                                                            onChange={(e) => updateBankAccount(account.id, 'activo', e.target.checked)}
                                                            className="w-4 h-4 accent-primary cursor-pointer"
                                                        />
                                                        <span>{account.activo !== false ? 'Habilitada' : 'Pausada'}</span>
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBankAccount(account.id)}
                                                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                                                        title="Eliminar cuenta"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground">Entidad Bancaria</label>
                                                    <input
                                                        type="text"
                                                        value={account.banco}
                                                        onChange={(e) => updateBankAccount(account.id, 'banco', e.target.value)}
                                                        placeholder="Ej. Banco Nacional de Bolivia (BNB)"
                                                        className="w-full p-2 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground">Tipo de Cuenta</label>
                                                    <input
                                                        type="text"
                                                        value={account.tipoCuenta}
                                                        onChange={(e) => updateBankAccount(account.id, 'tipoCuenta', e.target.value)}
                                                        placeholder="Ej. Cuenta Corriente BOB"
                                                        className="w-full p-2 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground">Número de Cuenta</label>
                                                    <input
                                                        type="text"
                                                        value={account.numeroCuenta}
                                                        onChange={(e) => updateBankAccount(account.id, 'numeroCuenta', e.target.value)}
                                                        placeholder="Ej. 100-01928374"
                                                        className="w-full p-2 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary font-mono font-medium"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground">Titular de la Cuenta</label>
                                                    <input
                                                        type="text"
                                                        value={account.titular}
                                                        onChange={(e) => updateBankAccount(account.id, 'titular', e.target.value)}
                                                        placeholder="Ej. GIPAAF S.R.L."
                                                        className="w-full p-2 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground">Doc. Identidad / NIT</label>
                                                    <input
                                                        type="text"
                                                        value={account.documentoIdentidad || ''}
                                                        onChange={(e) => updateBankAccount(account.id, 'documentoIdentidad', e.target.value)}
                                                        placeholder="Ej. NIT: 1029384756"
                                                        className="w-full p-2 text-xs bg-background border rounded-lg outline-none focus:ring-1 focus:ring-primary"
                                                    />
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[11px] font-semibold text-muted-foreground">Imagen QR de Cobro</label>
                                                    <div className="flex items-center gap-2">
                                                        {account.qrImage ? (
                                                            <div className="flex items-center gap-2 w-full">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedQrPreview(account.qrImage || null)}
                                                                    className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer truncate flex-1"
                                                                >
                                                                    <QrCode className="w-3.5 h-3.5 shrink-0" /> Ver QR
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => updateBankAccount(account.id, 'qrImage', null)}
                                                                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded cursor-pointer"
                                                                    title="Quitar QR"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <label className="w-full p-1.5 border border-dashed border-primary/40 hover:border-primary rounded-lg text-center cursor-pointer transition-colors bg-primary/5 hover:bg-primary/10 flex items-center justify-center gap-1 text-xs text-primary font-medium">
                                                                <Upload className="w-3.5 h-3.5" /> Subir QR
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) handleQrUpload(account.id, file);
                                                                    }}
                                                                />
                                                            </label>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-6 border border-dashed rounded-xl text-center text-muted-foreground space-y-2">
                                        <Building2 className="w-8 h-8 mx-auto opacity-40" />
                                        <p className="text-xs">No hay cuentas bancarias registradas aún.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={() => updateConfigMutation.mutate(configState)}
                                disabled={updateConfigMutation.isPending}
                                className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-2"
                            >
                                <Check className="w-4 h-4" />
                                {updateConfigMutation.isPending ? 'Guardando...' : `Guardar Configuración (${currentSucursal?.nombre})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: MENÚS Y COMANDOS */}
            {activeTab === 'comandos' && (
                <div className="space-y-6 max-w-4xl">
                    <div className="bg-card border rounded-xl p-6 shadow-sm space-y-4">
                        <div>
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Bot className="w-5 h-5 text-primary" />
                                Flujo de Respuestas Contextualizado a {currentSucursal?.nombre}
                            </h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Menús inteligentes que reciben los usuarios al interactuar con el bot de esta sucursal.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="border rounded-xl p-4 bg-muted/10 space-y-2">
                                <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                                    <Users className="w-4 h-4" /> Menú para Clientes Nuevos / Público
                                </h3>
                                <pre className="text-[11px] p-3 bg-background border rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground leading-relaxed">
{`1️⃣ 🏢 Dirección, Contacto y Horarios de Sucursal
2️⃣ 📄 Descargar Catálogo General de Productos (PDF)
3️⃣ 🔍 Consultar Productos y Precios en Tiempo Real
4️⃣ 💼 Contactar a un Asesor Comercial de ${currentSucursal?.nombre || 'Sucursal'}

💬 O escribe directamente el nombre de un producto para ver su precio y stock disponible.`}
                                </pre>
                            </div>

                            <div className="border rounded-xl p-4 bg-muted/10 space-y-2">
                                <h3 className="font-bold text-xs text-primary flex items-center gap-1.5">
                                    <ShieldCheck className="w-4 h-4" /> Menú para Clientes y Personal Registrado
                                </h3>
                                <pre className="text-[11px] p-3 bg-background border rounded-lg overflow-x-auto whitespace-pre-wrap font-mono text-muted-foreground leading-relaxed">
{`1️⃣ 📄 Descargar Catálogo General de Productos (PDF)
2️⃣ 🔍 Consultar Precios y Stock en Tiempo Real
3️⃣ 💳 Consultar Saldo y Deudas Pendientes (+ PDF)
4️⃣ 🏦 Cuentas Bancarias e Instrucciones de Pago
5️⃣ 🗺️ Mi Ruta de Clientes Asignados (${currentSucursal?.nombre || 'Sucursal'})
6️⃣ 📊 Resumen Ejecutivo del Día (Administración)`}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: REGISTRO DE ACTIVIDAD */}
            {activeTab === 'mensajes' && (
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden space-y-4 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                                <Activity className="w-5 h-5 text-primary" />
                                Mensajes Atendidos por el Bot de {currentSucursal?.nombre}
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Registro en tiempo real de interacciones en esta sucursal.
                            </p>
                        </div>
                        <button
                            onClick={() => refetchLogs()}
                            className="p-2 border rounded-lg hover:bg-accent text-muted-foreground cursor-pointer"
                            title="Actualizar registro"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="border rounded-xl overflow-hidden divide-y">
                        {logsData && logsData.length > 0 ? (
                            logsData.map((log) => (
                                <div key={log.id} className="p-3.5 text-xs flex items-start justify-between gap-3 hover:bg-muted/20 transition-colors">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                log.direction === 'in'
                                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                            }`}>
                                                {log.direction === 'in' ? 'Entrante (Cliente)' : 'Saliente (Bot)'}
                                            </span>
                                            <span className="font-semibold text-foreground">
                                                {log.senderName || log.from}
                                            </span>
                                            <span className="text-muted-foreground font-mono text-[10px]">
                                                {log.from}
                                            </span>
                                        </div>
                                        <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">
                                            {log.text}
                                        </p>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                        {new Date(log.timestamp).toLocaleTimeString('es-BO')}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-muted-foreground text-xs">
                                No hay actividad reciente registrada en el bot de {currentSucursal?.nombre}.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Previsualización QR */}
            {selectedQrPreview && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
                    onClick={() => setSelectedQrPreview(null)}
                >
                    <div
                        className="bg-card border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-base font-bold text-foreground">Código QR Bancario</h3>
                        <div className="p-3 bg-white rounded-xl border shadow-inner">
                            <img src={selectedQrPreview} alt="QR Preview" className="w-full h-auto object-contain rounded-lg" />
                        </div>
                        <button
                            onClick={() => setSelectedQrPreview(null)}
                            className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:opacity-90 transition-opacity cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WhatsAppPage;
