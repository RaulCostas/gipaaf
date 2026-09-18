import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { movimientoService } from '../../api/movimientoService';
import type { MovimientoInventario } from '../../api/movimientoService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { productService } from '../../api/productService';
import { format } from 'date-fns';
import { 
    Search, History, FileText, FileSpreadsheet, Printer, 
    X, ChevronLeft, ChevronRight, ArrowUpRight, ArrowDownRight, RefreshCw, Filter, Calendar, Package, Loader2
} from 'lucide-react';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatQuantity } from '../../utils/currencyUtils';
import { useFilters } from '../../context/FilterContext';

const MovimientosPage: React.FC = () => {
    const { selectedCiudad, selectedSucursal } = useFilters();
    
    // Pagination, Filter and Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string>('');
    const [tipoFilter, setTipoFilter] = useState<string>('TODOS');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const { data: movimientos, isLoading } = useQuery({
        queryKey: ['movimientos'],
        queryFn: movimientoService.getAll,
        staleTime: 30000,
    });

    const { data: productos } = useQuery({
        queryKey: ['productosList'],
        queryFn: () => productService.getAll(),
        staleTime: 60000,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursalesList'],
        queryFn: sucursalService.getAll,
        staleTime: 60000,
    });

    const { data: ciudades } = useQuery({
        queryKey: ['ciudadesList'],
        queryFn: getCiudades,
        staleTime: 60000,
    });

    const selectedProduct = useMemo(() => {
        if (!selectedProductId || !productos) return null;
        return productos.find(p => p.id === Number(selectedProductId)) || null;
    }, [productos, selectedProductId]);

    // Helpers to extract document number, observations, and user
    const getDocNumber = (m: MovimientoInventario): string => {
        if (m.numeroDocumento && m.numeroDocumento.trim()) return m.numeroDocumento.trim();
        const match = m.motivo?.match(/\[(.*?)\]/);
        if (match && match[1]) return match[1];
        return '-';
    };

    const getObservacion = (m: MovimientoInventario): string => {
        if (m.observaciones && m.observaciones.trim()) return m.observaciones.trim();
        if (m.motivo) {
            const parts = m.motivo.split(' - ');
            if (parts.length > 1) return parts.slice(1).join(' - ').trim();
            return m.motivo;
        }
        return '-';
    };

    const getUsuarioNombre = (m: MovimientoInventario): string => {
        if (m.usuario?.persona) {
            const nombres = m.usuario.persona.nombres || '';
            const apellidos = m.usuario.persona.apellidos || '';
            const full = `${nombres} ${apellidos}`.trim();
            if (full) return full.toUpperCase();
        }
        if (m.usuario?.username) return m.usuario.username.toUpperCase();
        return 'SISTEMA';
    };

    const getPrecioCompra = (m: MovimientoInventario): number => {
        if (m.tipo === 'COMPRA' && m.costoUnitario != null && Number(m.costoUnitario) > 0) {
            return Number(m.costoUnitario);
        }
        if (m.inventario?.precioCompra != null && Number(m.inventario.precioCompra) > 0) {
            return Number(m.inventario.precioCompra);
        }
        if (m.inventario?.producto?.precioCompra != null && Number(m.inventario.producto.precioCompra) > 0) {
            return Number(m.inventario.producto.precioCompra);
        }
        if (m.costoUnitario != null && Number(m.costoUnitario) > 0) {
            return Number(m.costoUnitario);
        }
        return 0;
    };

    const getPrecioVenta = (m: MovimientoInventario): number => {
        if (m.inventario?.precioVenta != null && Number(m.inventario.precioVenta) > 0) return Number(m.inventario.precioVenta);
        if (m.inventario?.producto?.precioVenta != null) return Number(m.inventario.producto.precioVenta);
        return 0;
    };

    // Calculate running balance (Saldo) chronologically
    const allMovimientosWithSaldo = useMemo(() => {
        if (!movimientos) return [];

        // Sort chronologically ascending to calculate cumulative running stock
        const sorted = [...movimientos].sort((a, b) => {
            const timeA = new Date(a.creadoEn).getTime();
            const timeB = new Date(b.creadoEn).getTime();
            return timeA - timeB;
        });

        // Track running saldo per inventory / product
        const saldoPerKey: Record<string, number> = {};

        const withSaldo = sorted.map(m => {
            const prodId = m.inventario?.producto?.id || 0;
            const sucId = (m.inventario?.sucursal as any)?.id || 0;
            // Key for running balance: by product and sucursal
            const key = `${prodId}_${sucId}`;
            const cant = Number(m.cantidad) || 0;

            saldoPerKey[key] = (saldoPerKey[key] || 0) + cant;
            const currentSaldo = saldoPerKey[key];

            const ingreso = cant > 0 ? cant : 0;
            const salida = cant < 0 ? Math.abs(cant) : 0;

            return {
                ...m,
                ingreso,
                salida,
                saldoCalculado: currentSaldo,
                precioCompraVal: getPrecioCompra(m),
                precioVentaVal: getPrecioVenta(m),
                docNumero: getDocNumber(m),
                observacionText: getObservacion(m),
                usuarioText: getUsuarioNombre(m),
            };
        });

        // Return descending for display (most recent first)
        return withSaldo.reverse();
    }, [movimientos]);

    // Apply active filters
    const filteredMovimientos = useMemo(() => {
        return allMovimientosWithSaldo.filter(m => {
            const prod = m.inventario?.producto;
            const prodId = prod?.id;
            const prodNombre = (prod?.nombre || '').toLowerCase();
            const prodCodigo = (prod?.codigo || '').toLowerCase();
            const motivo = (m.motivo || '').toLowerCase();
            const obs = (m.observacionText || '').toLowerCase();
            const user = (m.usuarioText || '').toLowerCase();
            const doc = (m.docNumero || '').toLowerCase();

            // Product filter
            if (selectedProductId && prodId !== Number(selectedProductId)) {
                return false;
            }

            // Search filter
            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const matchesSearch = 
                    prodNombre.includes(term) ||
                    prodCodigo.includes(term) ||
                    motivo.includes(term) ||
                    obs.includes(term) ||
                    user.includes(term) ||
                    doc.includes(term);
                if (!matchesSearch) return false;
            }

            // Location filters
            const suc = m.inventario?.sucursal as any;
            if (selectedCiudad) {
                const ciudadId = suc?.ciudad?.id || suc?.ciudadId;
                if (ciudadId !== Number(selectedCiudad)) return false;
            }

            if (selectedSucursal) {
                const sucursalId = suc?.id || suc?.sucursalId;
                if (sucursalId !== Number(selectedSucursal)) return false;
            }

            // Type filter
            if (tipoFilter !== 'TODOS') {
                if (tipoFilter === 'TRASPASOS') {
                    if (!m.tipo.startsWith('TRASPASO')) return false;
                } else if (m.tipo !== tipoFilter) {
                    return false;
                }
            }

            // Date range filter
            if (m.creadoEn) {
                const fechaStr = format(new Date(m.creadoEn), 'yyyy-MM-dd');
                if (fechaDesde && fechaHasta) {
                    if (fechaStr < fechaDesde || fechaStr > fechaHasta) return false;
                } else if (fechaDesde) {
                    if (fechaStr < fechaDesde) return false;
                } else if (fechaHasta) {
                    if (fechaStr > fechaHasta) return false;
                }
            }

            return true;
        });
    }, [allMovimientosWithSaldo, selectedProductId, searchTerm, selectedCiudad, selectedSucursal, tipoFilter, fechaDesde, fechaHasta]);

    // Financial & Quantity Totals of current filtered list
    const totals = useMemo(() => {
        let totalIngresos = 0;
        let totalSalidas = 0;

        filteredMovimientos.forEach(m => {
            totalIngresos += m.ingreso;
            totalSalidas += m.salida;
        });

        // If a specific product is filtered, the latest balance is the top item's saldo
        const latestSaldo = filteredMovimientos.length > 0 ? filteredMovimientos[0].saldoCalculado : 0;

        return {
            totalIngresos,
            totalSalidas,
            saldoNeto: totalIngresos - totalSalidas,
            latestSaldo,
            count: filteredMovimientos.length
        };
    }, [filteredMovimientos]);

    // Export configurations
    const exportColumns = useMemo(() => {
        const cols: { header: string; dataKey: string }[] = [
            { header: 'Fecha', dataKey: 'fecha' },
            { header: 'Tipo', dataKey: 'tipo' },
            { header: 'Nro Doc', dataKey: 'docNumero' },
        ];

        if (!selectedProductId) {
            cols.push({ header: 'Producto', dataKey: 'producto' });
        }

        if (!selectedSucursal) {
            cols.push({ header: 'Sucursal', dataKey: 'sucursal' });
        }

        cols.push(
            { header: 'Observación', dataKey: 'observacionText' },
            { header: 'Usuario', dataKey: 'usuarioText' },
            { header: 'P. Compra', dataKey: 'precioCompraFmt' },
            { header: 'P. Venta', dataKey: 'precioVentaFmt' },
            { header: 'Ingreso', dataKey: 'ingresoFmt' },
            { header: 'Salida', dataKey: 'salidaFmt' },
            { header: 'Saldo', dataKey: 'saldoFmt' }
        );

        return cols;
    }, [selectedProductId, selectedSucursal]);

    const mappedExportData = useMemo(() => {
        return filteredMovimientos.map((m, idx) => {
            const suc = m.inventario?.sucursal as any;
            const sucursalNombre = suc?.nombre || '-';
            const ciudadNombre = suc?.ciudad?.nombre || (suc?.ciudadId ? ciudades?.find(c => c.id === suc.ciudadId)?.nombre : '');
            const sucursalDisplay = ciudadNombre ? `${sucursalNombre} (${ciudadNombre})` : sucursalNombre;
            const prod = m.inventario?.producto;
            const prodDisplay = prod ? `${prod.nombre}${prod.codigo ? ` [${prod.codigo}]` : ''}` : '-';

            return {
                id: m.id,
                nro: idx + 1,
                fecha: format(new Date(m.creadoEn), 'dd/MM/yyyy HH:mm'),
                tipo: m.tipo.replace(/_/g, ' '),
                docNumero: m.docNumero,
                producto: prodDisplay,
                sucursal: sucursalDisplay,
                observacionText: m.observacionText,
                usuarioText: m.usuarioText,
                precioCompraFmt: `Bs. ${m.precioCompraVal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                precioVentaFmt: `Bs. ${m.precioVentaVal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                ingresoFmt: m.ingreso > 0 ? formatQuantity(m.ingreso) : '',
                salidaFmt: m.salida > 0 ? formatQuantity(m.salida) : '',
                saldoFmt: formatQuantity(m.saldoCalculado),
            };
        });
    }, [filteredMovimientos, ciudades]);

    const getReportTitle = () => {
        if (selectedProduct) {
            return `KARDEX INDIVIDUAL DE PRODUCTO`;
        }
        return 'Reporte de Movimientos de Inventario (Kardex)';
    };

    const getFiltersText = () => {
        const texts: string[] = [];

        if (selectedProduct) {
            texts.push(`Producto: ${selectedProduct.codigo ? `[${selectedProduct.codigo}] ` : ''}${selectedProduct.nombre}`);
        }

        if (selectedCiudad) {
            const c = ciudades?.find(ci => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }

        if (selectedSucursal) {
            const s = sucursales?.find(su => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }

        if (tipoFilter !== 'TODOS') {
            const tipoMap: Record<string, string> = {
                VENTA: 'Ventas',
                COMPRA: 'Compras',
                AJUSTE: 'Ajustes Manuales',
                TRASPASOS: 'Todos los Traspasos',
                TRASPASO_ENTRADA: 'Traspasos (Entrada)',
                TRASPASO_SALIDA: 'Traspasos (Salida)',
                ENTRADA: 'Entradas Directas',
                SALIDA: 'Salidas Directas',
                DEVOLUCION: 'Devoluciones',
                ANULACION_VENTA: 'Anulaciones de Venta',
                ANULACION_COMPRA: 'Anulaciones de Compra'
            };
            texts.push(`Tipo: ${tipoMap[tipoFilter] || tipoFilter}`);
        }

        if (fechaDesde && fechaHasta) {
            texts.push(`Rango: ${fechaDesde.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`);
        } else if (fechaDesde) {
            texts.push(`Desde: ${fechaDesde.split('-').reverse().join('/')}`);
        } else if (fechaHasta) {
            texts.push(`Hasta: ${fechaHasta.split('-').reverse().join('/')}`);
        }

        if (searchTerm.trim()) {
            texts.push(`Búsqueda: "${searchTerm.trim()}"`);
        }

        return texts.length > 0 ? texts.join(' | ') : 'Todos los movimientos';
    };

    const totalsFooter = useMemo(() => {
        const foot: Record<string, string> = {};
        exportColumns.forEach(c => {
            foot[c.dataKey] = '';
        });
        foot['fecha'] = 'TOTAL:';
        foot['ingresoFmt'] = totals.totalIngresos > 0 ? formatQuantity(totals.totalIngresos) : '0';
        foot['salidaFmt'] = totals.totalSalidas > 0 ? formatQuantity(totals.totalSalidas) : '0';
        foot['saldoFmt'] = formatQuantity(totals.latestSaldo);
        return foot;
    }, [exportColumns, totals]);

    const handlePrint = () => {
        if (!filteredMovimientos.length) return;
        printData(getReportTitle(), exportColumns, mappedExportData, getFiltersText(), totalsFooter);
    };

    const handleExportPDF = () => {
        if (!filteredMovimientos.length) return;
        exportToPDF(getReportTitle(), exportColumns, mappedExportData, 'kardex_movimientos', getFiltersText(), totalsFooter);
    };

    const handleExportExcel = () => {
        if (!filteredMovimientos.length) return;
        exportToExcel(exportColumns, mappedExportData, 'kardex_movimientos', totalsFooter);
    };

    const totalPages = Math.ceil(filteredMovimientos.length / itemsPerPage) || 1;
    
    const paginatedMovimientos = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredMovimientos.slice(start, start + itemsPerPage);
    }, [filteredMovimientos, currentPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedProductId, selectedCiudad, selectedSucursal, tipoFilter, fechaDesde, fechaHasta]);

    const getTipoIcon = (tipo: string, cantidad: number) => {
        if (tipo === 'ENTRADA' || tipo === 'COMPRA' || tipo === 'TRASPASO_ENTRADA' || tipo === 'DEVOLUCION' || tipo === 'ANULACION_VENTA' || cantidad > 0) return <ArrowUpRight className="w-3 h-3" />;
        if (tipo === 'SALIDA' || tipo === 'VENTA' || tipo === 'TRASPASO_SALIDA' || tipo === 'ANULACION_COMPRA' || cantidad < 0) return <ArrowDownRight className="w-3 h-3" />;
        return <RefreshCw className="w-3 h-3" />;
    };

    const getTipoColor = (tipo: string, cantidad: number) => {
        const t = (tipo || '').toUpperCase();
        if (t === 'VENTA') {
            return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
        }
        if (t === 'COMPRA') {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
        }
        if (t.startsWith('TRASPASO')) {
            return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800';
        }
        if (t === 'DEVOLUCION') {
            return 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
        }
        if (t === 'AJUSTE') {
            return 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800';
        }
        if (t.startsWith('ANULACION')) {
            return 'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800';
        }
        if (cantidad > 0) {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
        }
        if (cantidad < 0) {
            return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
        }
        return 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800';
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <History className="w-8 h-8 text-primary/80" />
                        {selectedProduct ? 'Kardex de Inventario' : 'Movimientos de Inventario (Kardex)'}
                    </h1>
                    <p className="text-muted-foreground italic">
                        Auditoría y trazabilidad de ingresos, salidas, saldos acumulados y costos.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Imprimir reporte Kardex"
                    >
                        <Printer className="w-4 h-4 text-muted-foreground" />
                        <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Exportar a PDF"
                    >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                </div>
            </div>

            {/* Banner de Producto Seleccionado (Estilo Kardex Individual) */}
            {selectedProduct && (
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded bg-primary text-primary-foreground font-mono font-bold text-xs shadow-sm">
                                {selectedProduct.codigo || 'SIN CÓDIGO'}
                            </span>
                            <h2 className="text-base sm:text-lg font-bold text-foreground">
                                {selectedProduct.nombre}
                            </h2>
                        </div>
                        <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-3 pt-0.5">
                            <span>Unidad: <strong className="text-foreground">{selectedProduct.unidadMedida || 'Unidad'}</strong></span>
                            <span>•</span>
                            <span>Costo Unitario Ref.: <strong className="text-foreground">Bs. {Number(selectedProduct.precioCompra || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong></span>
                            <span>•</span>
                            <span>Precio Venta: <strong className="text-foreground">Bs. {Number(selectedProduct.precioVenta || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong></span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 bg-background/80 backdrop-blur px-4 py-2.5 rounded-xl border shadow-sm">
                        <div className="text-right">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Saldo Actual</span>
                            <span className="text-lg font-black text-primary font-mono">
                                {formatQuantity(totals.latestSaldo)} {selectedProduct.unidadMedida || ''}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Buscador */}
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por doc, obs o usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Filtro por Producto (Antes de Tipo) */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm min-w-[220px] max-w-sm flex-1">
                    <Package className="w-4 h-4 text-primary shrink-0" />
                    <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer w-full text-sm truncate"
                    >
                        <option value="" className="bg-background text-foreground">Todos los Productos</option>
                        {productos?.map(p => (
                            <option key={p.id} value={p.id} className="bg-background text-foreground">
                                {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Tipo de Movimiento */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={tipoFilter}
                        onChange={(e) => setTipoFilter(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    >
                        <option value="TODOS" className="bg-background text-foreground">Todos los Tipos</option>
                        <option value="VENTA" className="bg-background text-foreground">Ventas</option>
                        <option value="COMPRA" className="bg-background text-foreground">Compras</option>
                        <option value="AJUSTE" className="bg-background text-foreground">Ajustes Manuales</option>
                        <option value="TRASPASOS" className="bg-background text-foreground">Traspasos (Todos)</option>
                        <option value="TRASPASO_ENTRADA" className="bg-background text-foreground">Traspasos (Entrada)</option>
                        <option value="TRASPASO_SALIDA" className="bg-background text-foreground">Traspasos (Salida)</option>
                        <option value="DEVOLUCION" className="bg-background text-foreground">Devoluciones</option>
                    </select>
                </div>

                {/* Filtro Fecha Desde */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Desde:</span>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    />
                </div>

                {/* Filtro Fecha Hasta */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Hasta:</span>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    />
                </div>

                {/* Botón Limpiar */}
                {(selectedProductId || tipoFilter !== 'TODOS' || !!searchTerm || !!fechaDesde || !!fechaHasta) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedProductId('');
                            setTipoFilter('TODOS');
                            setFechaDesde('');
                            setFechaHasta('');
                            setSearchTerm('');
                        }}
                        className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Limpiar filtros"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Limpiar</span>
                    </button>
                )}
            </div>

            {/* Tabla Kardex de Movimientos */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1100px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28">Fecha</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-28">Tipo</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24">Nro Doc</th>
                                {!selectedProductId && (
                                    <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                )}
                                {!selectedSucursal && (
                                    <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sucursal</th>
                                )}
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observación</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-36">Usuario</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">P. Compra</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">P. Venta</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-green-700 dark:text-green-400 text-right w-24">Ingreso</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-red-700 dark:text-red-400 text-right w-24">Salida</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-24">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10 + (!selectedProductId ? 1 : 0) + (!selectedSucursal ? 1 : 0)} className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2.5">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            <span className="text-sm font-medium">Cargando movimientos de inventario...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedMovimientos.length === 0 ? (
                                <tr>
                                    <td colSpan={10 + (!selectedProductId ? 1 : 0) + (!selectedSucursal ? 1 : 0)} className="p-8 text-center text-muted-foreground text-sm">
                                        No se encontraron movimientos de inventario con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : paginatedMovimientos.map((m, index) => {
                                const prod = m.inventario?.producto;
                                const suc = m.inventario?.sucursal as any;

                                return (
                                    <tr key={m.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-3 text-xs font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-foreground">
                                                    {m.creadoEn ? format(new Date(m.creadoEn), 'dd/MM/yyyy') : '-'}
                                                </span>
                                                <span className="text-[10px]">
                                                    {m.creadoEn ? format(new Date(m.creadoEn), 'HH:mm') : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 text-center whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${getTipoColor(m.tipo, m.cantidad)}`}>
                                                {getTipoIcon(m.tipo, m.cantidad)} {m.tipo.replace(/_/g, ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs font-mono font-bold text-primary whitespace-nowrap">
                                            {m.docNumero}
                                        </td>
                                        {!selectedProductId && (
                                            <td className="p-3 text-xs">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground line-clamp-1">
                                                        {prod?.nombre || 'Producto'}
                                                    </span>
                                                    {prod?.codigo && (
                                                        <span className="text-[11px] font-mono text-muted-foreground">
                                                            {prod.codigo}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {!selectedSucursal && (
                                            <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                                {suc?.nombre || 'Principal'} {suc?.ciudad?.nombre ? `(${suc.ciudad.nombre})` : ''}
                                            </td>
                                        )}
                                        <td className="p-3 text-xs text-muted-foreground max-w-xs">
                                            <span className="line-clamp-2" title={m.observacionText}>
                                                {m.observacionText}
                                            </span>
                                        </td>
                                        <td className="p-3 text-xs font-medium text-foreground whitespace-nowrap">
                                            {m.usuarioText}
                                        </td>
                                        <td className="p-3 text-xs font-mono text-right text-muted-foreground whitespace-nowrap">
                                            Bs. {m.precioCompraVal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 text-xs font-mono text-right text-muted-foreground whitespace-nowrap">
                                            Bs. {m.precioVentaVal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-3 text-xs font-mono font-bold text-right text-green-600 dark:text-green-400 whitespace-nowrap">
                                            {m.ingreso > 0 ? formatQuantity(m.ingreso) : '-'}
                                        </td>
                                        <td className="p-3 text-xs font-mono font-bold text-right text-red-600 dark:text-red-400 whitespace-nowrap">
                                            {m.salida > 0 ? formatQuantity(m.salida) : '-'}
                                        </td>
                                        <td className="p-3 text-xs font-mono font-black text-right text-foreground whitespace-nowrap">
                                            {formatQuantity(m.saldoCalculado)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        {filteredMovimientos.length > 0 && (
                            <tfoot className="bg-muted/70 font-bold border-t-2 border-border">
                                <tr>
                                    <td 
                                        colSpan={4 + (!selectedProductId ? 1 : 0) + (!selectedSucursal ? 1 : 0) + 4} 
                                        className="p-3 text-xs text-right uppercase tracking-wider text-foreground font-black"
                                    >
                                        TOTALES:
                                    </td>
                                    <td className="p-3 text-right text-green-600 dark:text-green-400 font-black font-mono text-xs whitespace-nowrap">
                                        {formatQuantity(totals.totalIngresos)}
                                    </td>
                                    <td className="p-3 text-right text-red-600 dark:text-red-400 font-black font-mono text-xs whitespace-nowrap">
                                        {formatQuantity(totals.totalSalidas)}
                                    </td>
                                    <td className="p-3 text-right text-foreground font-black font-mono text-xs whitespace-nowrap">
                                        {formatQuantity(totals.latestSaldo)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredMovimientos.length)} de {filteredMovimientos.length} movimientos
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium px-2">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovimientosPage;
