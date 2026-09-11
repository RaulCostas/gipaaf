import { getFileUrl } from '../../api/apiClient';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { purchaseService } from '../../api/purchaseService';
import { supplierService } from '../../api/supplierService';
import { pagoProveedorService } from '../../api/pagoProveedorService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { 
    Search, Receipt, X, ChevronLeft, ChevronRight,
    Printer, FileText, FileSpreadsheet,
    UserCircle, ShoppingBag, DollarSign, Calendar, Clock, CheckCircle2, Eye
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DetalleCompraModal from '../../components/compras/DetalleCompraModal';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';
import { useFilters } from '../../context/FilterContext';

const EstadoCuentaProveedoresPage: React.FC = () => {
    const { selectedSucursal, selectedCiudad } = useFilters();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProveedorId, setSelectedProveedorId] = useState<string>('');
    const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | 'PENDIENTE' | 'SALDADO'>('TODOS');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state for viewing purchase payment history
    const [viewingNota, setViewingNota] = useState<any | null>(null);
    const [viewingDetalleCompra, setViewingDetalleCompra] = useState<any | null>(null);

    // Queries
    const { data: purchasesList, isLoading: loadingPurchases } = useQuery({
        queryKey: ['purchases'],
        queryFn: purchaseService.getAll,
    });

    const { data: suppliersList } = useQuery({
        queryKey: ['suppliersList'],
        queryFn: () => supplierService.getAll(),
    });

    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });

    const { data: notaPagos, isLoading: loadingNotaPagos } = useQuery({
        queryKey: ['pagosNotaProveedor', viewingNota?.id],
        queryFn: () => pagoProveedorService.getByNota(viewingNota.id),
        enabled: !!viewingNota?.id
    });

    // Filter purchases by global filters, supplier, date range, status, and search term
    const filteredPurchases = useMemo(() => {
        if (!purchasesList) return [];
        let filtered = purchasesList.filter(p => p.tipo === 'COMPRA' && p.estado === 'CONFIRMADA');

        // Global branch and city filter
        if (selectedSucursal) {
            filtered = filtered.filter(p => (p.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        // Specific Supplier filter
        if (selectedProveedorId) {
            filtered = filtered.filter(p => p.proveedor?.id === Number(selectedProveedorId));
        }

        // Debt status filter
        if (estadoFiltro === 'PENDIENTE') {
            filtered = filtered.filter(p => Number(p.saldo) > 0);
        } else if (estadoFiltro === 'SALDADO') {
            filtered = filtered.filter(p => Number(p.saldo) === 0);
        }

        // Date range filter
        if (fechaDesde) {
            filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) >= fechaDesde);
        }
        if (fechaHasta) {
            filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) <= fechaHasta);
        }

        // Search bar
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                const num = (item.numero || '').toLowerCase();
                const provName = item.proveedor?.persona 
                    ? `${item.proveedor.persona.nombres} ${item.proveedor.persona.apellidos}`.toLowerCase()
                    : (item.proveedor?.empresa || '').toLowerCase();
                return num.includes(s) || provName.includes(s);
            });
        }

        return filtered;
    }, [purchasesList, selectedSucursal, selectedCiudad, selectedProveedorId, estadoFiltro, fechaDesde, fechaHasta, searchTerm]);

    // Financial Metrics Calculation
    const metrics = useMemo(() => {
        let totalComprasBOB = 0;
        let totalSaldoBOB = 0;
        let totalPagadoBOB = 0;

        let totalComprasUSD = 0;
        let totalSaldoUSD = 0;
        let totalPagadoUSD = 0;

        filteredPurchases.forEach(p => {
            const total = Number(p.total) || 0;
            const saldo = Number(p.saldo) || 0;
            const pagado = Math.max(0, total - saldo);
            const isUSD = p.moneda === 'USD';

            if (isUSD) {
                totalComprasUSD += total;
                totalSaldoUSD += saldo;
                totalPagadoUSD += pagado;
            } else {
                totalComprasBOB += total;
                totalSaldoBOB += saldo;
                totalPagadoBOB += pagado;
            }
        });

        return {
            totalComprasBOB,
            totalSaldoBOB,
            totalPagadoBOB,
            totalComprasUSD,
            totalSaldoUSD,
            totalPagadoUSD,
            count: filteredPurchases.length
        };
    }, [filteredPurchases]);

    // Pagination
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage) || 1;
    const paginatedPurchases = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPurchases.slice(start, start + itemsPerPage);
    }, [filteredPurchases, currentPage]);

    React.useEffect(() => setCurrentPage(1), [selectedProveedorId, estadoFiltro, fechaDesde, fechaHasta, searchTerm]);

    // Export reports
    const exportColumns = [
        { header: 'Fecha', dataKey: 'fechaFormateada' },
        { header: 'Nro Compra', dataKey: 'numero' },
        { header: 'Proveedor', dataKey: 'proveedorNombre' },
        { header: 'Observaciones', dataKey: 'observaciones' },
        { header: 'Moneda', dataKey: 'moneda' },
        { header: 'Total Compra', dataKey: 'totalFormateado' },
        { header: 'Total Pagado', dataKey: 'pagadoFormateado' },
        { header: 'Saldo Pendiente', dataKey: 'saldoFormateado' },
        { header: 'Estado Saldo', dataKey: 'estadoSaldo' }
    ];

    const mappedExportData = useMemo(() => {
        return filteredPurchases.map(p => {
            const isUSD = p.moneda === 'USD';
            const sim = isUSD ? '$us' : 'Bs.';
            const total = Number(p.total) || 0;
            const saldo = Number(p.saldo) || 0;
            const pagado = Math.max(0, total - saldo);
            const pName = p.proveedor?.persona
                ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.trim()
                : '';
            const provName = p.proveedor?.empresa
                ? `${p.proveedor.empresa}${pName ? ` (${pName})` : ''}`
                : (pName || 'Proveedor');

            return {
                ...p,
                fechaFormateada: p.fecha ? format(new Date(p.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-',
                proveedorNombre: provName,
                observaciones: p.proveedor?.observaciones || '-',
                totalFormateado: `${sim} ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
                pagadoFormateado: `${sim} ${pagado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
                saldoFormateado: `${sim} ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
                estadoSaldo: saldo === 0 ? 'Pagado' : 'Por Pagar'
            };
        });
    }, [filteredPurchases]);

    const getFiltersText = () => {
        const texts: string[] = [];

        // Ciudad
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }

        // Sucursal
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }

        // Proveedor
        if (selectedProveedorId) {
            const prov = suppliersList?.find(s => String(s.id) === String(selectedProveedorId));
            if (prov) {
                const pName = prov.persona ? `${prov.persona.nombres} ${prov.persona.apellidos}`.trim() : '';
                const label = prov.empresa ? `${prov.empresa}${pName ? ` (${pName})` : ''}` : pName;
                texts.push(`Proveedor: ${label}`);
            }
        }

        // Estado de deuda
        if (estadoFiltro === 'PENDIENTE') {
            texts.push('Estado Deuda: Por Pagar');
        } else if (estadoFiltro === 'SALDADO') {
            texts.push('Estado Deuda: Pagados');
        }

        // Fechas
        if (fechaDesde && fechaHasta) {
            texts.push(`Rango: ${fechaDesde.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`);
        } else if (fechaDesde) {
            texts.push(`Desde: ${fechaDesde.split('-').reverse().join('/')}`);
        } else if (fechaHasta) {
            texts.push(`Hasta: ${fechaHasta.split('-').reverse().join('/')}`);
        }

        return texts.length > 0 ? texts.join(' | ') : 'Todas las cuentas por pagar';
    };


    const getExportColumns = () => {
        let cols = [...exportColumns];
        if (selectedProveedorId) {
            cols = cols.filter(c => c.dataKey !== 'proveedorNombre');
        }
        if (estadoFiltro !== 'TODOS') {
            cols = cols.filter(c => c.dataKey !== 'estadoSaldo');
        }
        return cols;
    };

    const getTotalsFooter = (): Record<string, string> => {
        // Calcular totales en BOB (convertir USD al tipo de cambio de cada compra)
        let totalCompra = 0;
        let totalPagado = 0;
        let totalSaldo = 0;

        filteredPurchases.forEach(p => {
            const total = Number(p.total) || 0;
            const saldo = Number(p.saldo) || 0;
            const pagado = Math.max(0, total - saldo);
            const tc = Number(p.tipoCambio) || 6.96;
            const isUSD = p.moneda === 'USD';
            totalCompra  += isUSD ? total  * tc : total;
            totalPagado  += isUSD ? pagado * tc : pagado;
            totalSaldo   += isUSD ? saldo  * tc : saldo;
        });

        const fmt = (n: number) => `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return {
            fechaFormateada: 'TOTALES',
            numero: '',
            proveedorNombre: '',
            observaciones: '',
            moneda: '',
            totalFormateado: fmt(totalCompra),
            pagadoFormateado: fmt(totalPagado),
            saldoFormateado: fmt(totalSaldo),
            estadoSaldo: '',
        };
    };

    const handlePrint = () => {
        if (!mappedExportData.length) return;
        printData('Estado de Cuentas por Pagar - Proveedores', getExportColumns(), mappedExportData, getFiltersText(), getTotalsFooter());
    };

    const handleExportPDF = () => {
        if (!mappedExportData.length) return;
        exportToPDF('Estado de Cuentas por Pagar - Proveedores', getExportColumns(), mappedExportData, 'estado_cuenta_proveedores', getFiltersText(), getTotalsFooter());
    };

    const handleExportExcel = () => {
        if (!mappedExportData.length) return;
        exportToExcel(getExportColumns(), mappedExportData, 'estado_cuenta_proveedores');
    };


    if (loadingPurchases) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando estado de cuentas de proveedores...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Receipt className="w-8 h-8 text-primary/80" />
                        Estado de Cuentas - Proveedores
                    </h1>
                    <p className="text-muted-foreground italic">Historial de compras, abonos y saldos pendientes por proveedor.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Imprimir">
                            <Printer className="w-4 h-4 text-muted-foreground" /> <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a PDF">
                            <FileText className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a Excel">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-4 h-4 text-primary" /> Total en Compras
                    </span>
                    <div className="space-y-0.5">
                        <div className="text-lg font-bold text-foreground">
                            Bs. {metrics.totalComprasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm font-semibold text-muted-foreground">
                            $us {metrics.totalComprasUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{metrics.count} compras analizadas</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Total Pagado / Abonado
                    </span>
                    <div className="space-y-0.5">
                        <div className="text-lg font-bold text-green-600">
                            Bs. {metrics.totalPagadoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm font-semibold text-green-700/80 dark:text-green-500">
                            $us {metrics.totalPagadoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Pagos efectivamente aplicados</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-red-600 dark:text-red-400" /> Saldo Total por Pagar
                    </span>
                    <div className="space-y-0.5">
                        <div className="text-lg font-bold text-red-600 dark:text-red-400">
                            Bs. {metrics.totalSaldoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-sm font-semibold text-red-700/80 dark:text-red-300">
                            $us {metrics.totalSaldoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Cuentas por pagar pendientes</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Selector de Proveedor */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <UserCircle className="w-3.5 h-3.5 text-primary" /> Filtrar por Proveedor
                        </label>
                        <select
                            value={selectedProveedorId}
                            onChange={(e) => setSelectedProveedorId(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/50"
                        >
                            <option value="">Todos los Proveedores</option>
                            {suppliersList?.map(p => {
                                const pName = p.persona ? `${p.persona.nombres} ${p.persona.apellidos}`.trim() : '';
                                const label = p.empresa ? `${p.empresa}${pName ? ` (${pName})` : ''}` : pName;
                                return (
                                    <option key={p.id} value={p.id}>
                                        {label}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Filtro de Estado de Saldo */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-primary" /> Estado de Deuda
                        </label>
                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value as any)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="TODOS">Todos (Por Pagar y Pagados)</option>
                            <option value="PENDIENTE">Solo Por Pagar</option>
                            <option value="SALDADO">Solo Pagados</option>
                        </select>
                    </div>

                    {/* Fecha Desde */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Fecha Hasta */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {(fechaDesde || fechaHasta || selectedProveedorId || estadoFiltro !== 'TODOS') && (
                                <button
                                    onClick={() => {
                                        setSelectedProveedorId('');
                                        setEstadoFiltro('TODOS');
                                        setFechaDesde('');
                                        setFechaHasta('');
                                        setSearchTerm('');
                                    }}
                                    className="p-2 border rounded-lg hover:bg-accent text-xs font-semibold text-muted-foreground whitespace-nowrap"
                                    title="Limpiar Filtros"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search text */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nro. de compra o nombre de proveedor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabla de Estados de Cuenta */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Compra</th>
                                {!selectedProveedorId && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedor</th>
                                )}
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Moneda</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Compra</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Pagado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo Deuda</th>
                                {estadoFiltro === 'TODOS' && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-28">Estado</th>
                                )}
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedPurchases.length === 0 ? (
                                <tr>
                                    <td colSpan={9 + (!selectedProveedorId ? 1 : 0) + (estadoFiltro === 'TODOS' ? 1 : 0)} className="p-8 text-center text-muted-foreground text-sm">
                                        No se encontraron compras para los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : paginatedPurchases.map((p, index) => {
                                const provLabel = p.proveedor?.persona 
                                    ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}` 
                                    : (p.proveedor?.empresa || 'Proveedor');
                                const isUSD = p.moneda === 'USD';
                                const sim = isUSD ? '$us' : 'Bs.';
                                const total = Number(p.total) || 0;
                                const saldo = Number(p.saldo) || 0;
                                const pagado = Math.max(0, total - saldo);

                                return (
                                    <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-sm font-medium">
                                            {p.fecha ? format(new Date(p.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <button
                                                type="button"
                                                onClick={() => setViewingDetalleCompra(p)}
                                                className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                title="Ver detalle y productos de la compra"
                                            >
                                                <Eye className="w-3 h-3" />
                                                {p.numero}
                                            </button>
                                        </td>
                                        {!selectedProveedorId && (
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{p.proveedor?.empresa || provLabel}</span>
                                                    <span className="text-xs text-muted-foreground">{p.proveedor?.persona?.nombres || ''} {p.proveedor?.persona?.apellidos || ''}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4 text-sm text-muted-foreground max-w-[160px]">
                                            {p.proveedor?.observaciones ? (
                                                <span className="block truncate" title={p.proveedor.observaciones}>
                                                    {p.proveedor.observaciones}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground/40">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-1 bg-muted rounded text-xs font-bold text-muted-foreground">
                                                {p.moneda || 'BOB'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right">
                                            {sim} {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right text-green-600">
                                            {sim} {pagado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right">
                                            <span className={saldo > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}>
                                                {sim} {saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        {estadoFiltro === 'TODOS' && (
                                            <td className="p-4 text-center">
                                                {saldo === 0 ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                                        Pagado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                                                        Por Pagar
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setViewingNota(p)}
                                                className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 ml-auto shadow-sm"
                                                title="Ver Historial de Pagos"
                                            >
                                                <Receipt className="w-3.5 h-3.5" /> Ver Pagos
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPurchases.length)} de {filteredPurchases.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium px-2">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Historial de Pagos de la Compra */}
            <Modal
                isOpen={viewingNota !== null}
                onClose={() => setViewingNota(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Receipt className="w-6 h-6 text-primary/80" />
                        Historial de Pagos - Compra {viewingNota?.numero}
                    </span>
                }
                className="max-w-2xl"
            >
                {viewingNota && (
                    <div className="space-y-4">
                        {/* Cabecera de la Compra */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-muted/40 rounded-xl border text-xs">
                            <div>
                                <span className="text-muted-foreground block">Proveedor:</span>
                                <span className="font-bold text-foreground">
                                    {viewingNota.proveedor?.persona ? `${viewingNota.proveedor.persona.nombres} ${viewingNota.proveedor.persona.apellidos}` : (viewingNota.proveedor?.empresa || 'Proveedor')}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Fecha Compra:</span>
                                <span className="font-semibold">
                                    {viewingNota.fecha ? format(new Date(viewingNota.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Total Compra:</span>
                                <span className="font-bold text-primary">
                                    {viewingNota.moneda === 'USD' ? '$us' : 'Bs.'} {Number(viewingNota.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Saldo Pendiente:</span>
                                <span className={`font-bold ${Number(viewingNota.saldo) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {viewingNota.moneda === 'USD' ? '$us' : 'Bs.'} {Number(viewingNota.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Listado de Pagos */}
                        <div className="border rounded-xl overflow-hidden">
                            <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-primary" /> Pagos y Abonos Realizados
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {notaPagos?.length || 0} pagos
                                </span>
                            </div>

                            {loadingNotaPagos ? (
                                <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">Cargando pagos...</div>
                            ) : notaPagos && notaPagos.length > 0 ? (
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-muted/20 border-b">
                                            <th className="p-3 font-semibold text-muted-foreground">Fecha</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Método</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Referencia</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-center">Comprobante</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-right">Monto Pagado</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {notaPagos.map((p) => {
                                            const isUSD = p.moneda === 'USD';
                                            const sim = isUSD ? '$us' : 'Bs.';
                                            const esCruzada = p.moneda !== viewingNota.moneda;

                                            return (
                                                <tr key={p.id} className="hover:bg-accent/30">
                                                    <td className="p-3 font-medium">
                                                        {p.fecha ? format(new Date(p.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{p.metodoPago || 'Efectivo'}</td>
                                                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{p.referencia || '-'}</td>
                                                    <td className="p-3 text-center">
                                                        {p.comprobanteUrl ? (
                                                            p.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                                                <a 
                                                                    href={getFileUrl(p.comprobanteUrl)} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                                    title="Ver comprobante PDF"
                                                                >
                                                                    <FileText className="w-3 h-3" /> PDF
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={getFileUrl(p.comprobanteUrl)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 p-0.5 rounded hover:ring-2 hover:ring-primary/40 transition-all"
                                                                    title="Ver comprobante de pago"
                                                                >
                                                                    <img 
                                                                        src={getFileUrl(p.comprobanteUrl)} 
                                                                        alt="Voucher" 
                                                                        className="w-6 h-6 object-cover rounded border" 
                                                                    />
                                                                </a>
                                                            )
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-primary">
                                                        {sim} {Number(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                        {esCruzada && p.montoEquivalente > 0 && (
                                                            <div className="text-[10px] text-muted-foreground font-normal">
                                                                ≈ {viewingNota.moneda === 'USD' ? '$us' : 'Bs.'} {Number(p.montoEquivalente).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {p.activo ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                                Aplicado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                                                Anulado
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    No se han registrado pagos o amortizaciones para esta compra todavía.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => setViewingNota(null)}
                                className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Detalle de Productos de la Compra */}
            <DetalleCompraModal
                isOpen={viewingDetalleCompra !== null}
                onClose={() => setViewingDetalleCompra(null)}
                nota={viewingDetalleCompra}
            />
        </div>
    );
};

export default EstadoCuentaProveedoresPage;
