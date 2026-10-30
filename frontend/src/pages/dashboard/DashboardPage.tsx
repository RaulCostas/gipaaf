import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../api/reportService';
import { muestraService } from '../../api/muestraService';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currencyUtils';
import Modal from '../../components/ui/Modal';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { 
    TrendingUp, Package, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, 
    ExternalLink, Search, RotateCcw, Sparkles, ShoppingCart, Calculator, 
    Wallet, Boxes, ArrowLeftRight, Tag, ShoppingBag, DollarSign, KeyRound, ArrowRight,
    ShieldCheck, Calendar, MapPin, Building2, UserCircle
} from 'lucide-react';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAdmin, hasPermission } = useAuth();
    const { selectedCiudad, selectedSucursal } = useFilters();
    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const [searchLowStock, setSearchLowStock] = useState('');
    
    const canViewDashboard = isAdmin || hasPermission('DASHBOARD');

    // We pass the parameters to React Query
    const queryParams = { 
        ciudadId: selectedCiudad || undefined, 
        sucursalId: selectedSucursal || undefined 
    };

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['dashboard-stats', queryParams],
        queryFn: () => reportService.getStats(queryParams),
        enabled: canViewDashboard
    });

    const { data: lowStockItems, isLoading: loadingLowStock } = useQuery({
        queryKey: ['dashboard-low-stock', queryParams],
        queryFn: () => reportService.getLowStock(queryParams),
        enabled: canViewDashboard && showLowStockModal
    });

    const { data: trend, isLoading: loadingTrend } = useQuery({
        queryKey: ['dashboard-trend', queryParams],
        queryFn: () => reportService.getTrend(queryParams),
        enabled: canViewDashboard
    });

    const { data: topProducts, isLoading: loadingTop } = useQuery({
        queryKey: ['dashboard-top-products', queryParams],
        queryFn: () => reportService.getTopProducts(queryParams),
        enabled: canViewDashboard
    });

    const { data: muestrasList } = useQuery({
        queryKey: ['dashboard-muestras', queryParams],
        queryFn: () => muestraService.getAll(),
        enabled: canViewDashboard
    });

    const pendingMuestras = useMemo(() => {
        if (!muestrasList) return [];
        return muestrasList.filter(m => {
            if (selectedSucursal && m.sucursal?.id !== Number(selectedSucursal)) return false;
            if (selectedCiudad && (m.sucursal?.ciudad as any)?.id !== Number(selectedCiudad)) return false;
            return m.estado === 'ENTREGADO' || m.estado === 'DEVUELTO_PARCIAL';
        });
    }, [muestrasList, selectedSucursal, selectedCiudad]);

    const totalUnidadesPendientes = useMemo(() => {
        return pendingMuestras.reduce((acc, m) => {
            const sumDetalles = (m.detalles || []).reduce((sum, d) => {
                const entregada = Number(d.cantidadEntregada) || 0;
                const devuelta = Number(d.cantidadDevuelta) || 0;
                return sum + Math.max(0, entregada - devuelta);
            }, 0);
            return acc + sumDetalles;
        }, 0);
    }, [pendingMuestras]);

    const filteredLowStock = useMemo(() => {
        if (!lowStockItems) return [];
        if (!searchLowStock.trim()) return lowStockItems;
        const q = searchLowStock.toLowerCase();
        return lowStockItems.filter((inv: any) => 
            inv.producto?.nombre?.toLowerCase().includes(q) ||
            inv.producto?.codigo?.toLowerCase().includes(q) ||
            (inv.producto?.linea?.nombre || inv.producto?.categoria?.nombre || '').toLowerCase().includes(q) ||
            inv.sucursal?.nombre?.toLowerCase().includes(q)
        );
    }, [lowStockItems, searchLowStock]);

    const DAY_MAP_ES: Record<string, string> = {
        'Mon': 'Lun',
        'Tue': 'Mar',
        'Wed': 'Mié',
        'Thu': 'Jue',
        'Fri': 'Vie',
        'Sat': 'Sáb',
        'Sun': 'Dom',
        'Monday': 'Lunes',
        'Tuesday': 'Martes',
        'Wednesday': 'Miércoles',
        'Thursday': 'Jueves',
        'Friday': 'Viernes',
        'Saturday': 'Sábado',
        'Sunday': 'Domingo',
    };

    const formattedTrend = trend?.map(item => ({
        ...item,
        name: DAY_MAP_ES[item.name] || item.name,
    }));

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

    const displayName = useMemo(() => {
        if (user?.persona) {
            const nom = `${user.persona.nombres || ''} ${user.persona.apellidos || ''}`.trim();
            if (nom) return nom;
        }
        return user?.username || 'Usuario';
    }, [user]);

    const userRoleNames = useMemo(() => {
        if (!user?.roles || !Array.isArray(user.roles)) return 'Usuario';
        return user.roles.map((r: any) => (typeof r === 'string' ? r : r.nombre)).filter(Boolean).join(', ') || 'Usuario';
    }, [user]);

    const userBranchName = useMemo(() => {
        if (!user?.sucursal) return null;
        const ciudad = user.sucursal.ciudad?.nombre ? ` - ${user.sucursal.ciudad.nombre}` : '';
        return `${user.sucursal.nombre || 'Sucursal'}${ciudad}`;
    }, [user]);

    const formattedToday = useMemo(() => {
        try {
            return new Intl.DateTimeFormat('es-BO', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            }).format(new Date());
        } catch {
            return new Date().toLocaleDateString();
        }
    }, []);

    const quickModules = useMemo(() => [
        {
            title: 'Proformas',
            desc: 'Cotizaciones y proformas de ventas para clientes',
            icon: Calculator,
            path: '/proformas',
            perm: 'PROFORMAS',
            color: 'text-indigo-500 bg-indigo-500/10 hover:border-indigo-500/40',
        },
        {
            title: 'Ventas',
            desc: 'Emisión de notas de venta y facturación',
            icon: ShoppingCart,
            path: '/ventas',
            perm: 'VENTAS',
            color: 'text-emerald-500 bg-emerald-500/10 hover:border-emerald-500/40',
        },
        {
            title: 'Cobranzas',
            desc: 'Registro de pagos y cobros de clientes a crédito',
            icon: Wallet,
            path: '/cobranzas',
            perm: 'COBRANZAS',
            color: 'text-amber-500 bg-amber-500/10 hover:border-amber-500/40',
        },
        {
            title: 'Clientes',
            desc: 'Directorio y gestión de cartera de clientes',
            icon: Users,
            path: '/clientes',
            perm: 'CLIENTES',
            color: 'text-blue-500 bg-blue-500/10 hover:border-blue-500/40',
        },
        {
            title: 'Existencias (Stock)',
            desc: 'Consulta de stock actual e inventario por almacén',
            icon: Boxes,
            path: '/inventario',
            perm: 'INVENTARIO',
            color: 'text-purple-500 bg-purple-500/10 hover:border-purple-500/40',
        },
        {
            title: 'Productos',
            desc: 'Catálogo de medicamentos y productos registrados',
            icon: Package,
            path: '/productos',
            perm: 'PRODUCTOS',
            color: 'text-sky-500 bg-sky-500/10 hover:border-sky-500/40',
        },
        {
            title: 'Traspasos',
            desc: 'Transferencias de mercadería entre sucursales',
            icon: ArrowLeftRight,
            path: '/traspasos',
            perm: 'TRASPASOS',
            color: 'text-cyan-500 bg-cyan-500/10 hover:border-cyan-500/40',
        },
        {
            title: 'Muestras Médicas',
            desc: 'Entregas y seguimiento de muestras a médicos',
            icon: Tag,
            path: '/muestras',
            perm: 'MUESTRAS',
            color: 'text-pink-500 bg-pink-500/10 hover:border-pink-500/40',
        },
        {
            title: 'Compras',
            desc: 'Ingreso de mercancía y pedidos a proveedores',
            icon: ShoppingBag,
            path: '/compras',
            perm: 'COMPRAS',
            color: 'text-orange-500 bg-orange-500/10 hover:border-orange-500/40',
        },
        {
            title: 'Egresos Diarios',
            desc: 'Control de gastos diarios y egresos operativos',
            icon: DollarSign,
            path: '/egresos',
            perm: 'EGRESOS',
            color: 'text-rose-500 bg-rose-500/10 hover:border-rose-500/40',
        },
    ], []);

    const availableModules = useMemo(() => {
        return quickModules.filter(m => hasPermission(m.perm));
    }, [quickModules, hasPermission]);

    // Vista de Bienvenida cuando el usuario NO tiene permiso para ver el Dashboard
    if (!canViewDashboard) {
        return (
            <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
                {/* Hero / Banner de Bienvenida */}
                <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-6 sm:p-10 shadow-lg">
                    <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-3 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-primary/15 text-primary">
                                <Sparkles className="w-3.5 h-3.5" />
                                Sistema GIPAAF
                            </div>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                                ¡Bienvenido, <span className="text-primary">{displayName}</span>!
                            </h1>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                                Tu sesión ha sido iniciada con éxito. Utiliza los accesos directos a continuación o explora el menú lateral para acceder a los módulos autorizados para tu puesto de trabajo.
                            </p>
                        </div>

                        {/* Ficha de Información de Usuario */}
                        <div className="w-full md:w-auto shrink-0 bg-background/80 backdrop-blur-md border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 min-w-[260px]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-black">
                                    <UserCircle className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium">Perfil / Rol Asignado</p>
                                    <p className="text-sm font-bold text-foreground uppercase">{userRoleNames}</p>
                                </div>
                            </div>
                            {userBranchName && (
                                <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                                    <span className="font-medium text-foreground truncate">{userBranchName}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2.5 text-xs text-muted-foreground border-t border-border/50 pt-2.5">
                                <Calendar className="w-4 h-4 text-primary shrink-0" />
                                <span className="capitalize">{formattedToday}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Accesos Rápidos Autorizados */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                            Módulos Disponibles
                        </h2>
                        <p className="text-xs sm:text-sm text-muted-foreground">Accesos directos rápidos habilitados según tus permisos de rol.</p>
                    </div>

                    {availableModules.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {availableModules.map((m) => {
                                const Icon = m.icon;
                                return (
                                    <button
                                        key={m.path}
                                        type="button"
                                        onClick={() => navigate(m.path)}
                                        className="group text-left p-5 bg-card border rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
                                    >
                                        <div className="space-y-3 w-full">
                                            <div className="flex items-center justify-between">
                                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${m.color}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <span className="text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                                    Abrir <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                                                    {m.title}
                                                </h3>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {m.desc}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-8 text-center bg-card border rounded-2xl space-y-2">
                            <p className="text-sm font-semibold text-foreground">No tienes módulos operativos asignados en este momento.</p>
                            <p className="text-xs text-muted-foreground">Si consideras que deberías tener acceso a algún módulo, comunícate con el administrador del sistema.</p>
                        </div>
                    )}
                </div>

                {/* Footer Informativo */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/40 border rounded-2xl gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Sesión segura activa en GIPAAF
                    </span>
                    <button
                        type="button"
                        onClick={() => navigate('/cambiar-password')}
                        className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer"
                    >
                        <KeyRound className="w-3.5 h-3.5" />
                        Cambiar mi contraseña
                    </button>
                </div>
            </div>
        );
    }

    if (loadingStats || loadingTrend || loadingTop) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-primary flex items-center gap-2.5 sm:gap-3">
                    <Activity className="w-7 h-7 sm:w-8 h-8 text-primary shrink-0" />
                    Inicio
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground italic mt-1 font-medium">Resumen ejecutivo del rendimiento del negocio y alertas clave.</p>
            </div>

            {/* KPI Cards */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 ${pendingMuestras.length > 0 ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'} gap-4 sm:gap-6`}>
                <div className="relative overflow-hidden group p-4 sm:p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-primary" />
                    </div>
                    <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Ventas Hoy</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 text-primary">{formatCurrency(stats?.totalSalesToday)}</p>
                        <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3" /> 12%
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 sm:mt-4 font-medium uppercase tracking-tighter">Comparado con ayer</p>
                </div>

                <div className="relative overflow-hidden group p-4 sm:p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-amber-500" />
                        </div>
                        <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Stock Bajo</h3>
                        <p className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 text-amber-600">{stats?.lowStock}</p>
                        <p className="text-[10px] text-muted-foreground mt-3 sm:mt-4 font-medium uppercase tracking-tighter">Requiere reposición inmediata</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setShowLowStockModal(true)}
                            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 hover:underline flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                            Ver Detalles <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                <div className="relative overflow-hidden group p-4 sm:p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Package className="w-12 h-12 sm:w-16 sm:h-16 text-indigo-500" />
                    </div>
                    <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Productos</h3>
                    <p className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 text-indigo-600">{stats?.totalProducts}</p>
                    <p className="text-[10px] text-muted-foreground mt-3 sm:mt-4 font-medium uppercase tracking-tighter">Catálogo activo</p>
                </div>

                <div className="relative overflow-hidden group p-4 sm:p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-500" />
                    </div>
                    <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Ventas Mensuales</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 text-emerald-600">{formatCurrency(stats?.totalSalesMonth)}</p>
                        <span className="flex items-center text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                            <ArrowDownRight className="w-3 h-3" /> 4%
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-3 sm:mt-4 font-medium uppercase tracking-tighter">Meta del mes: Bs. 10.000,00</p>
                </div>

                {pendingMuestras.length > 0 && (
                    <div className="relative overflow-hidden group p-4 sm:p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                            <div className="absolute top-0 right-0 p-3 sm:p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <RotateCcw className="w-12 h-12 sm:w-16 sm:h-16 text-purple-500" />
                            </div>
                            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Muestras Pendientes</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-2xl sm:text-3xl font-black mt-1 sm:mt-2 text-purple-600 dark:text-purple-400">{pendingMuestras.length}</p>
                                <span className="flex items-center text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                                    {totalUnidadesPendientes} unid{totalUnidadesPendientes === 1 ? '' : 'es'}.
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-3 sm:mt-4 font-medium uppercase tracking-tighter">
                                {pendingMuestras.length === 1 ? '1 muestra pendiente' : `${pendingMuestras.length} muestras pendientes`} de retorno
                            </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => navigate('/muestras')}
                                className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex items-center gap-1.5 cursor-pointer transition-all"
                            >
                                Ver Muestras <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-card border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 sm:mb-8">
                        <div>
                            <h3 className="text-base sm:text-lg font-black tracking-tight">Tendencia de Ventas</h3>
                            <p className="text-xs text-muted-foreground font-medium">Histórico de los últimos 7 días</p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-primary rounded-full"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ingresos</span>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <AreaChart data={formattedTrend}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }}
                                    className="text-slate-500 dark:text-slate-400"
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }}
                                    className="text-slate-500 dark:text-slate-400"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '16px',
                                        boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.25)',
                                        padding: '12px',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                                    formatter={(value: any) => [formatCurrency(Number(value) || 0), 'Ingresos']}
                                />
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-card border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm min-w-0">
                    <h3 className="text-base sm:text-lg font-black tracking-tight mb-1">Más Vendidos</h3>
                    <p className="text-xs text-muted-foreground font-medium mb-6 sm:mb-8">Top 5 productos por cantidad</p>
                    <div className="h-[250px] sm:h-[300px] w-full min-w-0">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 10, fontWeight: 700 }}
                                    className="text-slate-700 dark:text-slate-200"
                                    width={90}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: '12px',
                                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                                        color: 'hsl(var(--foreground))'
                                    }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: 'hsl(var(--foreground))' }}
                                    labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 'bold', marginBottom: '4px' }}
                                    formatter={(value: any) => [value, 'Cantidad']}
                                />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={22}>
                                    {topProducts?.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Modal de Detalles de Stock Bajo */}
            <Modal
                isOpen={showLowStockModal}
                onClose={() => setShowLowStockModal(false)}
                title={
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="w-5 h-5" />
                        <span>Productos con Stock Bajo ({lowStockItems?.length || 0})</span>
                    </div>
                }
                className="max-w-4xl"
            >
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        Listado de productos cuyo stock actual es menor o igual al stock mínimo configurado.
                    </p>

                    {/* Buscador */}
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por código, producto o sucursal..."
                            value={searchLowStock}
                            onChange={(e) => setSearchLowStock(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-muted/40 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                        />
                    </div>

                    {/* Tabla de Productos */}
                    <div className="max-h-[420px] overflow-y-auto overflow-x-auto border rounded-xl">
                        {loadingLowStock ? (
                            <div className="p-8 text-center text-muted-foreground animate-pulse">
                                Cargando alertas de stock...
                            </div>
                        ) : filteredLowStock.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">
                                {lowStockItems && lowStockItems.length > 0
                                    ? 'No se encontraron productos con el filtro aplicado.'
                                    : '¡Excelente! No hay productos con stock bajo en este momento.'}
                            </div>
                        ) : (
                            <table className="w-full min-w-[580px] text-left border-collapse">
                                <thead className="bg-muted/60 sticky top-0 border-b backdrop-blur-sm z-10">
                                    <tr className="text-xs font-semibold text-muted-foreground">
                                        <th className="p-3">Código</th>
                                        <th className="p-3">Producto</th>
                                        <th className="p-3">Sucursal / Ciudad</th>
                                        <th className="p-3 text-center">Stock Mínimo</th>
                                        <th className="p-3 text-center">Stock Actual</th>
                                        <th className="p-3 text-center">Estado / Déficit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {filteredLowStock.map((inv: any) => {
                                        const actual = Number(inv.stockActual || 0);
                                        const minimo = Number(inv.stockMinimo || 0);
                                        const deficit = minimo - actual;
                                        return (
                                            <tr key={inv.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3 font-mono text-xs font-bold text-muted-foreground">
                                                    {inv.producto?.codigo || '-'}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-semibold text-foreground">
                                                        {inv.producto?.nombre}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground">
                                                        {inv.producto?.linea?.nombre || inv.producto?.categoria?.nombre || 'General'}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-xs">
                                                    <div className="font-medium text-foreground">
                                                        {inv.sucursal?.nombre || 'Central'}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {inv.sucursal?.ciudad?.nombre || ''}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center font-mono font-medium text-muted-foreground">
                                                    {minimo} {inv.producto?.unidadMedida || 'u.'}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${actual === 0 ? 'bg-red-500/10 text-red-600' : 'bg-amber-500/10 text-amber-600'}`}>
                                                        {actual} {inv.producto?.unidadMedida || 'u.'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={`text-xs font-bold ${actual === 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {actual === 0 ? 'Agotado' : `-${deficit > 0 ? deficit : 0} ${inv.producto?.unidadMedida || 'u.'}`}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={() => setShowLowStockModal(false)}
                            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DashboardPage;
