import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Modal from '../../components/ui/Modal';
import { 
    Warehouse, Calendar, Printer, FileText, FileSpreadsheet,
    Lock, MapPin, Search, Tag, Layers, RefreshCw,
    CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getCiudades } from '../../api/ciudadService';
import { sucursalService } from '../../api/sucursalService';
import { marcaService } from '../../api/marcaService';
import { lineaService } from '../../api/lineaService';
import { inventoryService } from '../../api/inventoryService';
import { useFilters } from '../../context/FilterContext';
import { formatQuantity } from '../../utils/currencyUtils';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';

interface InventarioAlmacenModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const InventarioAlmacenModal: React.FC<InventarioAlmacenModalProps> = ({ isOpen, onClose }) => {
    const { isRestrictedToBranch, userSucursal, userCiudad, selectedSucursal: globalSucursal } = useFilters();

    // Default cutoff date is today's local date
    const getTodayDateStr = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const [fechaCorte, setFechaCorte] = useState<string>(getTodayDateStr());
    const [modalSucursalId, setModalSucursalId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedMarca, setSelectedMarca] = useState<number | 'all'>('all');
    const [selectedLinea, setSelectedLinea] = useState<number | 'all'>('all');
    const [soloConStock, setSoloConStock] = useState<boolean>(false);
    const [conteosFisicos, setConteosFisicos] = useState<Record<number, string>>({});
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 20;

    // Queries
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: marcas } = useQuery({ queryKey: ['marcas'], queryFn: marcaService.getAll });
    const { data: lineas } = useQuery({ queryKey: ['lineasList'], queryFn: lineaService.getAll });

    // Synchronize initial branch based on user permissions
    useEffect(() => {
        if (!isOpen) return;

        if (isRestrictedToBranch && userSucursal?.id) {
            setModalSucursalId(String(userSucursal.id));
        } else {
            if (globalSucursal) {
                setModalSucursalId(String(globalSucursal));
            } else if (userSucursal?.id) {
                setModalSucursalId(String(userSucursal.id));
            }
        }
    }, [isOpen, isRestrictedToBranch, userSucursal?.id, globalSucursal]);

    // Query warehouse inventory for cutoff date and selected branch
    const { 
        data: items = [], 
        isLoading, 
        isFetching,
        refetch 
    } = useQuery({
        queryKey: ['inventario-almacen', modalSucursalId, fechaCorte],
        queryFn: () => inventoryService.getInventarioAlmacen({
            sucursalId: modalSucursalId ? Number(modalSucursalId) : undefined,
            fechaCorte
        }),
        enabled: isOpen,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    // Check if selected date is today
    const isHoy = fechaCorte === getTodayDateStr();

    // Filter items based on user inputs
    const filteredItems = useMemo(() => {
        if (!items) return [];

        return items.filter(item => {
            const term = searchTerm.trim().toLowerCase();
            const matchesSearch = !term ||
                item.nombre.toLowerCase().includes(term) ||
                item.codigo.toLowerCase().includes(term) ||
                item.marca.toLowerCase().includes(term) ||
                item.linea.toLowerCase().includes(term);

            const matchesMarca = selectedMarca === 'all' || 
                (marcas?.find(m => m.id === selectedMarca)?.nombre && 
                 item.marca.toLowerCase() === marcas.find(m => m.id === selectedMarca)?.nombre.toLowerCase());

            const matchesLinea = selectedLinea === 'all' || 
                (lineas?.find(l => l.id === selectedLinea)?.nombre && 
                 item.linea.toLowerCase() === lineas.find(l => l.id === selectedLinea)?.nombre.toLowerCase());

            const matchesStock = !soloConStock || item.stockCorte > 0;

            return matchesSearch && matchesMarca && matchesLinea && matchesStock;
        });
    }, [items, searchTerm, selectedMarca, selectedLinea, soloConStock, marcas, lineas]);

    // Summary metrics
    const stats = useMemo(() => {
        const totalProductos = items.length;
        const conStock = items.filter(i => i.stockCorte > 0).length;
        const totalUnidades = items.reduce((acc, i) => acc + (Number(i.stockCorte) || 0), 0);
        return { totalProductos, conStock, totalUnidades };
    }, [items]);

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
    const paginatedItems = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredItems.slice(start, start + itemsPerPage);
    }, [filteredItems, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedMarca, selectedLinea, soloConStock, modalSucursalId, fechaCorte]);

    // Branch label description for header & export
    const getSucursalLabel = () => {
        if (modalSucursalId) {
            const s = sucursales?.find((suc: any) => String(suc.id) === modalSucursalId);
            const c = ciudades?.find((ci: any) => ci.id === (s?.ciudadId || s?.ciudad?.id));
            const cityName = c?.nombre || s?.ciudad?.nombre || '';
            return cityName ? `${cityName} - ${s?.nombre || 'Sucursal'}` : (s?.nombre || `Sucursal #${modalSucursalId}`);
        }
        return 'Todas las Sucursales (Consolidado)';
    };

    const getFormattedFechaCorte = () => {
        if (!fechaCorte) return '-';
        return fechaCorte.split('-').reverse().join('/');
    };

    const getSubtitleText = () => {
        const fechaTxt = isHoy 
            ? `${getFormattedFechaCorte()} (actual)` 
            : `${getFormattedFechaCorte()} (al cierre)`;
        return `Sucursal: ${getSucursalLabel()} | Existencias al: ${fechaTxt}`;
    };

    // Prepare data for Export / Print
    const getPreparedExportData = () => {
        return filteredItems.map((item, idx) => {
            const conteoVal = conteosFisicos[item.productoId];
            const conteoNum = conteoVal !== undefined && conteoVal !== '' ? parseFloat(conteoVal) : null;
            const diffNum = conteoNum !== null ? Number((conteoNum - item.stockCorte).toFixed(2)) : null;

            return {
                numero: idx + 1,
                codigo: item.codigo,
                producto: item.nombre,
                marca: item.marca,
                linea: item.linea,
                unidadMedida: item.unidadMedida,
                stockCorte: item.stockCorte,
                stockCorteFormatted: formatQuantity(item.stockCorte),
                stockActualHoy: item.stockActualHoy,
                stockActualHoyFormatted: formatQuantity(item.stockActualHoy),
                conteoFisico: conteoNum !== null ? formatQuantity(conteoNum) : '',
                diferencia: diffNum !== null ? (diffNum > 0 ? `+${formatQuantity(diffNum)}` : formatQuantity(diffNum)) : '',
            };
        });
    };

    // Vertical (portrait) columns optimized for printed paper
    const printColumns = [
        { header: 'N°', dataKey: 'numero' },
        { header: 'Cód.', dataKey: 'codigo' },
        { header: 'Marca', dataKey: 'marca' },
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Stock Sist.', dataKey: 'stockCorteFormatted' },
        { header: 'Físico', dataKey: 'conteoFisico' },
        { header: 'Dif.', dataKey: 'diferencia' }
    ];

    const excelColumns = [
        { header: 'N°', dataKey: 'numero' },
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Marca', dataKey: 'marca' },
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Línea', dataKey: 'linea' },
        { header: 'Unidad', dataKey: 'unidadMedida' },
        { header: 'Stock Sistema (Al Corte)', dataKey: 'stockCorte' },
        { header: 'Stock Actual (Hoy)', dataKey: 'stockActualHoy' },
        { header: 'Conteo Físico', dataKey: 'conteoFisico' },
        { header: 'Diferencia', dataKey: 'diferencia' }
    ];

    const handlePrint = () => {
        if (!filteredItems.length) {
            toast.error('No hay datos para imprimir');
            return;
        }
        printData('Reporte de Inventario de Almacén', printColumns, getPreparedExportData(), getSubtitleText(), undefined, 'portrait');
    };

    const handleExportPDF = () => {
        if (!filteredItems.length) {
            toast.error('No hay datos para exportar');
            return;
        }
        exportToPDF('Reporte de Inventario de Almacén', printColumns, getPreparedExportData(), `inventario_almacen_${fechaCorte}`, getSubtitleText(), undefined, 'portrait');
    };

    const handleExportExcel = () => {
        if (!filteredItems.length) {
            toast.error('No hay datos para exportar');
            return;
        }
        exportToExcel(excelColumns, getPreparedExportData(), `inventario_almacen_${fechaCorte}`);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={
                <div className="flex items-center gap-2 text-primary font-bold">
                    <Warehouse className="w-5 h-5 text-primary" />
                    <span>Inventario de Almacén (Toma de Existencias)</span>
                </div>
            }
            className="max-w-7xl w-full max-h-[94vh] flex flex-col"
        >
            <div className="space-y-4 flex flex-col flex-1 min-h-0">
                {/* Control Panel: Filters, Branch Selector, Cutoff Date */}
                <div className="bg-muted/40 border rounded-xl p-4 space-y-3 shrink-0">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
                        
                        {/* Selector Único de Ciudad (Sucursal) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    Ciudad (Sucursal)
                                </span>
                                {isRestrictedToBranch && (
                                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                        <Lock className="w-2.5 h-2.5" /> Asignada
                                    </span>
                                )}
                            </label>
                            {isRestrictedToBranch ? (
                                <div className="p-2 border rounded-lg bg-background text-sm font-semibold text-foreground flex items-center justify-between opacity-90 cursor-not-allowed">
                                    <span className="truncate">
                                        {userCiudad?.nombre ? `${userCiudad.nombre} - ` : ''}{userSucursal?.nombre || 'Mi Sucursal'}
                                    </span>
                                    <span className="text-xs text-muted-foreground font-normal">Fija</span>
                                </div>
                            ) : (
                                <select
                                    value={modalSucursalId}
                                    onChange={(e) => setModalSucursalId(e.target.value)}
                                    className="w-full p-2 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-all cursor-pointer"
                                >
                                    <option value="">Todas las Sucursales (Consolidado)</option>
                                    {sucursales?.map((s: any) => {
                                        const cObj = ciudades?.find((ci: any) => ci.id === (s.ciudadId || s.ciudad?.id));
                                        const cityName = cObj?.nombre || s.ciudad?.nombre || '';
                                        const label = cityName ? `${cityName} - ${s.nombre}` : s.nombre;
                                        return (
                                            <option key={s.id} value={s.id}>
                                                {label}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>

                        {/* Fecha hasta o al (Fecha de corte) */}
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                Existencias al (Fecha de corte):
                            </label>
                            <input
                                type="date"
                                value={fechaCorte}
                                onChange={(e) => setFechaCorte(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-background text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 transition-all cursor-pointer"
                            />
                        </div>

                        {/* Export Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                disabled={isLoading || filteredItems.length === 0}
                                className="flex-1 py-2 px-2.5 bg-card border rounded-lg text-xs font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                title="Imprimir hoja de toma física (Vertical)"
                            >
                                <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Imprimir</span>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                disabled={isLoading || filteredItems.length === 0}
                                className="flex-1 py-2 px-2.5 bg-card border rounded-lg text-xs font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                title="Exportar a PDF (Vertical)"
                            >
                                <FileText className="w-3.5 h-3.5 text-red-500" />
                                <span>PDF</span>
                            </button>
                            <button
                                onClick={handleExportExcel}
                                disabled={isLoading || filteredItems.length === 0}
                                className="flex-1 py-2 px-2.5 bg-card border rounded-lg text-xs font-semibold hover:bg-accent transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                                title="Exportar a Excel"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                                <span>Excel</span>
                            </button>
                            <button
                                onClick={() => refetch()}
                                disabled={isFetching}
                                className="p-2 border rounded-lg bg-card hover:bg-accent transition-colors text-muted-foreground cursor-pointer"
                                title="Refrescar datos"
                            >
                                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-primary' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Secondary Filter Bar: Quick Search, Marca, Linea, Zero-stock Toggle */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-xs">
                        {/* Buscador */}
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar código, producto, marca..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 bg-background border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')} 
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* Filtro Marca */}
                        <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-1">
                            <Tag className="w-3 h-3 text-muted-foreground" />
                            <select
                                value={selectedMarca}
                                onChange={(e) => setSelectedMarca(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="bg-transparent border-none outline-none font-medium text-xs cursor-pointer"
                            >
                                <option value="all">Todas las Marcas</option>
                                {marcas?.map((m: any) => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Filtro Línea */}
                        <div className="flex items-center gap-1 bg-background border rounded-lg px-2 py-1">
                            <Layers className="w-3 h-3 text-muted-foreground" />
                            <select
                                value={selectedLinea}
                                onChange={(e) => setSelectedLinea(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                                className="bg-transparent border-none outline-none font-medium text-xs cursor-pointer"
                            >
                                <option value="all">Todas las Líneas</option>
                                {lineas?.map((l: any) => (
                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {/* Toggle para mostrar con 0 de existencia o solo con stock */}
                        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-background cursor-pointer select-none font-medium">
                            <input
                                type="checkbox"
                                checked={soloConStock}
                                onChange={(e) => setSoloConStock(e.target.checked)}
                                className="rounded text-primary focus:ring-primary w-3.5 h-3.5"
                            />
                            <span className="text-muted-foreground">Ocultar productos en 0</span>
                        </label>
                    </div>
                </div>

                {/* Summary / Stats Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 bg-accent/40 rounded-lg text-xs shrink-0">
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Productos mostrados: <strong className="text-foreground">{filteredItems.length}</strong> de {stats.totalProductos}</span>
                        <span>Con existencia a la fecha: <strong className="text-foreground">{stats.conStock}</strong></span>
                        <span>Total Unidades: <strong className="text-primary font-bold">{formatQuantity(stats.totalUnidades)}</strong></span>
                    </div>
                    <div className="text-[11px] text-muted-foreground italic">
                        {isHoy 
                            ? `Mostrando existencias actuales en tiempo real (al ${getFormattedFechaCorte()})`
                            : `Mostrando existencias al cierre del ${getFormattedFechaCorte()}`
                        }
                    </div>
                </div>

                {/* Products Table */}
                <div className="border rounded-xl overflow-hidden flex-1 flex flex-col min-h-0 bg-card shadow-xs">
                    <div className="overflow-x-auto overflow-y-auto flex-1">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-muted/80 text-muted-foreground text-xs font-semibold sticky top-0 z-10 backdrop-blur-xs border-b">
                                <tr>
                                    <th className="p-3 w-12 text-center">#</th>
                                    <th className="p-3 w-28">Código</th>
                                    <th className="p-3 w-32">Marca</th>
                                    <th className="p-3">Producto</th>
                                    <th className="p-3 w-28">Línea</th>
                                    <th className="p-3 w-28 text-right bg-primary/5 font-bold text-foreground">Stock Sistema</th>
                                    <th className="p-3 w-24 text-right text-muted-foreground">Hoy</th>
                                    <th className="p-3 w-32 text-center">Conteo Físico</th>
                                    <th className="p-3 w-28 text-right">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            <div className="flex items-center justify-center gap-2">
                                                <RefreshCw className="w-5 h-5 animate-spin text-primary" />
                                                <span>Calculando inventario histórico de almacén...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : paginatedItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                            No se encontraron productos con los filtros seleccionados.
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedItems.map((item, idx) => {
                                        const globalIdx = (currentPage - 1) * itemsPerPage + idx + 1;
                                        const conteoVal = conteosFisicos[item.productoId] ?? '';
                                        const conteoNum = conteoVal !== '' ? parseFloat(conteoVal) : null;
                                        const diff = conteoNum !== null ? Number((conteoNum - item.stockCorte).toFixed(2)) : null;
                                        const hasVariacion = item.stockCorte !== item.stockActualHoy;

                                        return (
                                            <tr key={item.productoId} className="hover:bg-accent/40 transition-colors">
                                                <td className="p-3 text-center text-xs text-muted-foreground">
                                                    {globalIdx}
                                                </td>
                                                <td className="p-3 font-mono text-xs font-semibold text-primary">
                                                    {item.codigo}
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground font-medium">
                                                    {item.marca}
                                                </td>
                                                <td className="p-3">
                                                    <div className="font-medium text-foreground text-xs sm:text-sm">
                                                        {item.nombre}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Unidad: {item.unidadMedida}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    {item.linea}
                                                </td>
                                                
                                                {/* Stock Sistema a la fecha de corte */}
                                                <td className="p-3 text-right bg-primary/5">
                                                    <span className={`inline-block font-mono font-bold text-xs sm:text-sm px-2 py-0.5 rounded ${
                                                        item.stockCorte > 0 
                                                            ? 'text-emerald-700 bg-emerald-500/10 dark:text-emerald-400' 
                                                            : 'text-muted-foreground bg-muted'
                                                    }`}>
                                                        {formatQuantity(item.stockCorte)}
                                                    </span>
                                                </td>

                                                {/* Stock actual hoy (informativo) */}
                                                <td className="p-3 text-right text-xs font-mono text-muted-foreground">
                                                    <span title={hasVariacion ? `Variación posterior: ${formatQuantity(item.stockActualHoy - item.stockCorte)} u.` : 'Sin cambios posteriores'}>
                                                        {formatQuantity(item.stockActualHoy)}
                                                        {hasVariacion && (
                                                            <span className="ml-1 text-[10px] text-amber-600 font-bold">*</span>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Input para conteo físico en pantalla */}
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        step="any"
                                                        placeholder="0"
                                                        value={conteoVal}
                                                        onChange={(e) => setConteosFisicos(prev => ({
                                                            ...prev,
                                                            [item.productoId]: e.target.value
                                                        }))}
                                                        className="w-24 p-1.5 border rounded text-center text-xs font-mono bg-background focus:ring-2 focus:ring-primary/20 outline-none"
                                                    />
                                                </td>

                                                {/* Diferencia calculada */}
                                                <td className="p-3 text-right text-xs font-mono font-semibold">
                                                    {diff === null ? (
                                                        <span className="text-muted-foreground">-</span>
                                                    ) : diff === 0 ? (
                                                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> 0
                                                        </span>
                                                    ) : diff > 0 ? (
                                                        <span className="text-blue-600 dark:text-blue-400">
                                                            +{formatQuantity(diff)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-red-600 dark:text-red-400 flex items-center justify-end gap-1">
                                                            <AlertCircle className="w-3.5 h-3.5" /> {formatQuantity(diff)}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="p-3 border-t bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs shrink-0">
                        <div className="text-muted-foreground">
                            Mostrando {paginatedItems.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} a {Math.min(currentPage * itemsPerPage, filteredItems.length)} de {filteredItems.length} productos
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                                title="Página anterior"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-medium text-foreground">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 border rounded-lg hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                                title="Página siguiente"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default InventarioAlmacenModal;
