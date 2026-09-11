import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../api/reportService';
import { muestraService } from '../../api/muestraService';
import { useFilters } from '../../context/FilterContext';
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
import { TrendingUp, Package, Users, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity, ExternalLink, Search, RotateCcw } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const navigate = useNavigate();
    const { selectedCiudad, selectedSucursal } = useFilters();
    const [showLowStockModal, setShowLowStockModal] = useState(false);
    const [searchLowStock, setSearchLowStock] = useState('');
    
    // We pass the parameters to React Query
    const queryParams = { 
        ciudadId: selectedCiudad || undefined, 
        sucursalId: selectedSucursal || undefined 
    };

    const { data: stats, isLoading: loadingStats } = useQuery({
        queryKey: ['dashboard-stats', queryParams],
        queryFn: () => reportService.getStats(queryParams)
    });

    const { data: lowStockItems, isLoading: loadingLowStock } = useQuery({
        queryKey: ['dashboard-low-stock', queryParams],
        queryFn: () => reportService.getLowStock(queryParams),
        enabled: showLowStockModal
    });

    const { data: trend, isLoading: loadingTrend } = useQuery({
        queryKey: ['dashboard-trend', queryParams],
        queryFn: () => reportService.getTrend(queryParams)
    });

    const { data: topProducts, isLoading: loadingTop } = useQuery({
        queryKey: ['dashboard-top-products', queryParams],
        queryFn: () => reportService.getTopProducts(queryParams)
    });

    const { data: muestrasList } = useQuery({
        queryKey: ['dashboard-muestras', queryParams],
        queryFn: () => muestraService.getAll()
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
            inv.producto?.categoria?.nombre?.toLowerCase().includes(q) ||
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

    if (loadingStats || loadingTrend || loadingTop) {
        return (
            <div className="h-full w-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black tracking-tight text-primary flex items-center gap-3">
                    <Activity className="w-8 h-8 text-primary" />
                    Inicio
                </h1>
                <p className="text-muted-foreground italic mt-1 font-medium">Resumen ejecutivo del rendimiento del negocio y alertas clave.</p>
            </div>

            {/* KPI Cards */}
            <div className={`grid grid-cols-1 md:grid-cols-2 ${pendingMuestras.length > 0 ? 'lg:grid-cols-3 xl:grid-cols-5' : 'lg:grid-cols-4'} gap-6`}>
                <div className="relative overflow-hidden group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-16 h-16 text-primary" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Ventas Hoy</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black mt-2 text-primary">{formatCurrency(stats?.totalSalesToday)}</p>
                        <span className="flex items-center text-[10px] font-bold text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                            <ArrowUpRight className="w-3 h-3" /> 12%
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-tighter">Comparado con ayer</p>
                </div>

                <div className="relative overflow-hidden group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <AlertTriangle className="w-16 h-16 text-amber-500" />
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Stock Bajo</h3>
                        <p className="text-3xl font-black mt-2 text-amber-600">{stats?.lowStock}</p>
                        <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-tighter">Requiere reposición inmediata</p>
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

                <div className="relative overflow-hidden group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <Package className="w-16 h-16 text-indigo-500" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Productos</h3>
                    <p className="text-3xl font-black mt-2 text-indigo-600">{stats?.totalProducts}</p>
                    <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-tighter">Catálogo activo</p>
                </div>

                <div className="relative overflow-hidden group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-16 h-16 text-emerald-500" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Ventas Mensuales</h3>
                    <div className="flex items-baseline gap-2">
                        <p className="text-3xl font-black mt-2 text-emerald-600">{formatCurrency(stats?.totalSalesMonth)}</p>
                        <span className="flex items-center text-[10px] font-bold text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded-full">
                            <ArrowDownRight className="w-3 h-3" /> 4%
                        </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-tighter">Meta del mes: Bs. 10.000,00</p>
                </div>

                {pendingMuestras.length > 0 && (
                    <div className="relative overflow-hidden group p-6 bg-card border rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
                        <div>
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                <RotateCcw className="w-16 h-16 text-purple-500" />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Muestras Pendientes</h3>
                            <div className="flex items-baseline gap-2">
                                <p className="text-3xl font-black mt-2 text-purple-600 dark:text-purple-400">{pendingMuestras.length}</p>
                                <span className="flex items-center text-[10px] font-bold text-purple-600 dark:text-purple-300 bg-purple-500/10 px-1.5 py-0.5 rounded-full">
                                    {totalUnidadesPendientes} unid{totalUnidadesPendientes === 1 ? '' : 'es'}.
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-tighter">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sales Trend */}
                <div className="lg:col-span-2 bg-card border rounded-3xl p-8 shadow-sm">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black tracking-tight">Tendencia de Ventas</h3>
                            <p className="text-xs text-muted-foreground font-medium">Histórico de los últimos 7 días</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 bg-primary rounded-full"></span>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Ingresos</span>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
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
                                <Area type="monotone" dataKey="total" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Products */}
                <div className="bg-card border rounded-3xl p-8 shadow-sm">
                    <h3 className="text-lg font-black tracking-tight mb-2">Más Vendidos</h3>
                    <p className="text-xs text-muted-foreground font-medium mb-8">Top 5 productos por cantidad</p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" strokeOpacity={0.1} />
                                <XAxis type="number" hide />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', fontSize: 11, fontWeight: 700 }}
                                    className="text-slate-700 dark:text-slate-200"
                                    width={110}
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
                                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
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
                    <div className="max-h-[420px] overflow-y-auto border rounded-xl">
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
                            <table className="w-full text-left border-collapse">
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
                                                        {inv.producto?.categoria?.nombre || 'General'}
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
