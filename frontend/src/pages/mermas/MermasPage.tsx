import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { movimientoService } from '../../api/movimientoService';
import type { MovimientoInventario } from '../../api/movimientoService';
import { inventoryService } from '../../api/inventoryService';
import { lineaService } from '../../api/lineaService';
import { marcaService } from '../../api/marcaService';
import { grupoService } from '../../api/grupoService';
import { getCiudades } from '../../api/ciudadService';
import { sucursalService } from '../../api/sucursalService';
import Modal from '../../components/ui/Modal';
import { 
    AlertOctagon, Search, Filter, Printer, FileText, FileSpreadsheet, 
    X, ChevronLeft, ChevronRight, Check, Tag, Layers, Calendar, 
    DollarSign, Package, Eye, Plus, History, Edit, Trash2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatCurrency, formatQuantity } from '../../utils/currencyUtils';
import { formatDateTime, formatDate } from '../../utils/dateUtils';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';

const MermasPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { selectedCiudad, selectedSucursal } = useFilters();
    const { isAdmin, hasAction } = useAuth();

    const canRegistrarMerma = isAdmin || hasAction('INVENTARIO', 'MERMA') || hasAction('INVENTARIO', 'AJUSTAR');
    const canEditarMerma = isAdmin || hasAction('INVENTARIO', 'EDITAR') || hasAction('INVENTARIO', 'MERMA') || hasAction('INVENTARIO', 'AJUSTAR');
    const canEliminarMerma = isAdmin || hasAction('INVENTARIO', 'ELIMINAR') || hasAction('INVENTARIO', 'MERMA') || hasAction('INVENTARIO', 'AJUSTAR');

    const [selectedProducto, setSelectedProducto] = useState<number | 'all'>('all');
    const [selectedLinea, setSelectedLinea] = useState<number | 'all'>('all');
    const [selectedMarca, setSelectedMarca] = useState<number | 'all'>('all');
    const [selectedGrupo, setSelectedGrupo] = useState<number | 'all'>('all');
    const [selectedMotivo, setSelectedMotivo] = useState<string>('all');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Detalle modal state
    const [selectedMerma, setSelectedMerma] = useState<any | null>(null);

    // Edit modal state
    const [editingMerma, setEditingMerma] = useState<{ id: number; productName: string; motivo: string; observaciones: string } | null>(null);

    // Delete confirmation state
    const [deletingMerma, setDeletingMerma] = useState<any | null>(null);

    // Modal para registrar nueva merma directamente
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedInventoryId, setSelectedInventoryId] = useState<number | ''>('');
    const [cantidadMermaStr, setCantidadMermaStr] = useState('');
    const [motivoMerma, setMotivoMerma] = useState('Vencimiento / Caducidad');
    const [observacionesMerma, setObservacionesMerma] = useState('');

    const { data: lineas } = useQuery({ queryKey: ['lineasList'], queryFn: lineaService.getAll });
    const { data: marcas } = useQuery({ queryKey: ['marcas'], queryFn: marcaService.getAll });
    const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: grupoService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });

    const { data: inventoryList } = useQuery({
        queryKey: ['inventory'],
        queryFn: () => inventoryService.getAll(),
        staleTime: 30000,
    });

    const { data: movimientos, isLoading } = useQuery({
        queryKey: ['movimientos', 'mermas'],
        queryFn: () => movimientoService.getAll({ tipo: 'MERMA' }),
        placeholderData: keepPreviousData,
    });

    const createMermaMutation = useMutation({
        mutationFn: ({ id, cantidad, motivo, observaciones }: { id: number, cantidad: number, motivo?: string, observaciones?: string }) =>
            inventoryService.registrarMerma(id, cantidad, motivo, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsCreateOpen(false);
            setSelectedInventoryId('');
            setCantidadMermaStr('');
            setObservacionesMerma('');
            toast.success('Merma registrada con éxito');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al registrar la merma');
        }
    });

    const updateMermaMutation = useMutation({
        mutationFn: ({ id, motivo, observaciones }: { id: number; motivo: string; observaciones: string }) =>
            movimientoService.update(id, { motivo, observaciones }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            setEditingMerma(null);
            toast.success('Merma actualizada con éxito');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al actualizar la merma');
        }
    });

    const deleteMermaMutation = useMutation({
        mutationFn: (id: number) => movimientoService.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setDeletingMerma(null);
            toast.success('Merma eliminada y stock restaurado con éxito');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al eliminar la merma');
        }
    });

    const getMarcaNombre = (producto: any): string => {
        if (!producto) return '-';
        if (producto.marca && typeof producto.marca === 'object' && producto.marca.nombre) {
            return producto.marca.nombre;
        }
        if (typeof producto.marca === 'string' && producto.marca.trim()) {
            return producto.marca.trim();
        }
        const mId = producto.marcaId || producto.marca?.id;
        if (mId && marcas) {
            const found = marcas.find((m: any) => Number(m.id) === Number(mId));
            if (found?.nombre) return found.nombre;
        }
        return '-';
    };

    const getLineaNombre = (producto: any): string => {
        if (!producto) return '-';
        if (producto.linea && typeof producto.linea === 'object' && producto.linea.nombre) {
            return producto.linea.nombre;
        }
        if (producto.categoria && typeof producto.categoria === 'object' && producto.categoria.nombre) {
            return producto.categoria.nombre;
        }
        const lId = producto.lineaId || producto.categoriaId;
        if (lId && lineas) {
            const found = lineas.find((l: any) => Number(l.id) === Number(lId));
            if (found?.nombre) return found.nombre;
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
        if (m.usuario?.personal) {
            const nombres = m.usuario.personal.nombres || '';
            const apellidos = m.usuario.personal.apellidos || '';
            const full = `${nombres} ${apellidos}`.trim();
            if (full) return full.toUpperCase();
        }
        if (m.usuario?.username) return m.usuario.username.toUpperCase();
        return 'SISTEMA';
    };

    const getCostoUnitario = (m: MovimientoInventario): number => {
        if (m.costoUnitario != null && Number(m.costoUnitario) > 0) {
            return Number(m.costoUnitario);
        }
        if (m.inventario?.precioCompra != null && Number(m.inventario.precioCompra) > 0) {
            return Number(m.inventario.precioCompra);
        }
        if (m.inventario?.producto?.precioCompra != null && Number(m.inventario.producto.precioCompra) > 0) {
            return Number(m.inventario.producto.precioCompra);
        }
        return 0;
    };

    // Filter only MERMA and MERMA_DESCARTE movements
    const mermasData = useMemo(() => {
        if (!movimientos) return [];
        return movimientos.filter(m => m.tipo === 'MERMA' || m.tipo === 'MERMA_DESCARTE');
    }, [movimientos]);

    // Extrae exclusivamente los productos únicos presentes en las mermas registradas
    const availableMermaProducts = useMemo(() => {
        if (!mermasData) return [];
        const productMap = new Map<number, { id: number; nombre: string; codigo?: string }>();

        let scopedMermas = mermasData;
        if (selectedSucursal) {
            scopedMermas = scopedMermas.filter(m => {
                const suc = m.inventario?.sucursal as any;
                return suc?.id === Number(selectedSucursal) || suc?.sucursalId === Number(selectedSucursal);
            });
        } else if (selectedCiudad) {
            scopedMermas = scopedMermas.filter(m => {
                const suc = m.inventario?.sucursal as any;
                return suc?.ciudad?.id === Number(selectedCiudad) || suc?.ciudadId === Number(selectedCiudad);
            });
        }

        scopedMermas.forEach(m => {
            const prod = m.inventario?.producto;
            if (prod && prod.id) {
                if (!productMap.has(prod.id)) {
                    productMap.set(prod.id, {
                        id: prod.id,
                        nombre: prod.nombre || 'Sin Nombre',
                        codigo: prod.codigo || ''
                    });
                }
            }
        });

        return Array.from(productMap.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [mermasData, selectedSucursal, selectedCiudad]);

    const filteredMermas = useMemo(() => {
        const filtered = mermasData.filter(m => {
            const prod = m.inventario?.producto;
            const marcaNombre = getMarcaNombre(prod);
            const lineaNombre = getLineaNombre(prod);
            const motivo = m.motivo || '';
            const obs = m.observaciones || '';
            const user = getUsuarioNombre(m);

            // Búsqueda textual
            const matchesSearch = !searchTerm ||
                prod?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                prod?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marcaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                lineaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                motivo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                obs.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.toLowerCase().includes(searchTerm.toLowerCase());

            // Filtro Producto
            const matchesProducto = selectedProducto === 'all' ||
                prod?.id === Number(selectedProducto);

            // Filtro Ciudad
            const suc = m.inventario?.sucursal as any;
            const matchesCiudad = !selectedCiudad ||
                suc?.ciudad?.id === Number(selectedCiudad) ||
                suc?.ciudadId === Number(selectedCiudad);

            // Filtro Sucursal
            const matchesSucursal = !selectedSucursal ||
                suc?.id === Number(selectedSucursal) ||
                suc?.sucursalId === Number(selectedSucursal);

            // Filtro Línea
            const matchesLinea = selectedLinea === 'all' ||
                prod?.linea?.id === Number(selectedLinea) ||
                prod?.lineaId === Number(selectedLinea) ||
                prod?.categoria?.id === Number(selectedLinea) ||
                prod?.categoriaId === Number(selectedLinea);

            // Filtro Marca
            const matchesMarca = selectedMarca === 'all' ||
                prod?.marca?.id === Number(selectedMarca) ||
                prod?.marcaId === Number(selectedMarca) ||
                (marcas?.find(mr => mr.id === selectedMarca)?.nombre && marcaNombre.toLowerCase() === marcas.find(mr => mr.id === selectedMarca)?.nombre.toLowerCase());

            // Filtro Grupo
            const matchesGrupo = selectedGrupo === 'all' ||
                prod?.grupo?.id === Number(selectedGrupo) ||
                prod?.grupoId === Number(selectedGrupo);

            // Filtro Motivo
            const matchesMotivo = selectedMotivo === 'all' ||
                motivo.toLowerCase().includes(selectedMotivo.toLowerCase());

            // Filtro Fecha
            let matchesFecha = true;
            if (fechaDesde || fechaHasta) {
                const movDate = new Date(m.creadoEn);
                if (fechaDesde) {
                    const dDesde = new Date(`${fechaDesde}T00:00:00`);
                    if (movDate < dDesde) matchesFecha = false;
                }
                if (fechaHasta) {
                    const dHasta = new Date(`${fechaHasta}T23:59:59`);
                    if (movDate > dHasta) matchesFecha = false;
                }
            }

            return matchesSearch && matchesProducto && matchesCiudad && matchesSucursal && matchesLinea && matchesMarca && matchesGrupo && matchesMotivo && matchesFecha;
        });

        return filtered.sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime());
    }, [mermasData, searchTerm, selectedProducto, selectedCiudad, selectedSucursal, selectedLinea, selectedMarca, selectedGrupo, selectedMotivo, fechaDesde, fechaHasta, marcas, lineas]);

    // Resumen KPIs
    const totals = useMemo(() => {
        let totalUnidades = 0;
        let totalCosto = 0;

        filteredMermas.forEach(m => {
            const cant = Math.abs(Number(m.cantidad) || 0);
            const costo = getCostoUnitario(m);
            totalUnidades += cant;
            totalCosto += cant * costo;
        });

        return {
            totalRegistros: filteredMermas.length,
            totalUnidades,
            totalCosto
        };
    }, [filteredMermas]);

    // Exportación
    const exportColumns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Marca', dataKey: 'marca' },
        { header: 'Línea', dataKey: 'linea' },
        { header: 'Sucursal', dataKey: 'sucursal' },
        { header: 'Cantidad', dataKey: 'cantidad' },
        { header: 'Costo Unit. (Bs)', dataKey: 'costoUnitario' },
        { header: 'Total (Bs)', dataKey: 'costoTotal' },
        { header: 'Motivo', dataKey: 'motivo' },
        { header: 'Observaciones', dataKey: 'observaciones' },
        { header: 'Usuario', dataKey: 'usuario' }
    ];

    const getExportColumns = () => {
        let cols = [...exportColumns];
        if (selectedSucursal) cols = cols.filter(c => c.dataKey !== 'sucursal');
        return cols;
    };

    const getExcelColumns = () => {
        return [
            { header: 'ID', dataKey: 'id' },
            ...getExportColumns()
        ];
    };

    const getFormattedData = () => {
        return filteredMermas.map(m => {
            const cant = Math.abs(Number(m.cantidad) || 0);
            const costo = getCostoUnitario(m);
            const total = cant * costo;
            const suc = m.inventario?.sucursal as any;

            return {
                id: m.id,
                fecha: formatDateTime(m.creadoEn),
                producto: m.inventario?.producto?.nombre || '-',
                codigo: m.inventario?.producto?.codigo || '-',
                marca: getMarcaNombre(m.inventario?.producto),
                linea: getLineaNombre(m.inventario?.producto),
                sucursal: `${suc?.nombre || '-'} (${suc?.ciudad?.nombre || '-'})`,
                cantidad: `${formatQuantity(cant)} ${m.inventario?.producto?.unidadMedida || 'u.'}`,
                costoUnitario: formatCurrency(costo),
                costoTotal: formatCurrency(total),
                motivo: m.motivo || '-',
                observaciones: m.observaciones || '-',
                usuario: getUsuarioNombre(m)
            };
        });
    };

    const getFiltersText = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find(ci => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find(su => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }
        if (selectedProducto !== 'all') {
            const p = availableMermaProducts.find(pr => pr.id === selectedProducto);
            if (p) texts.push(`Producto: ${p.nombre}`);
        }
        if (selectedMarca !== 'all') {
            const m = marcas?.find(mr => mr.id === selectedMarca);
            if (m) texts.push(`Marca: ${m.nombre}`);
        }
        if (selectedLinea !== 'all') {
            const l = lineas?.find(li => li.id === selectedLinea);
            if (l) texts.push(`Línea: ${l.nombre}`);
        }
        if (selectedGrupo !== 'all') {
            const g = grupos?.find(gr => gr.id === selectedGrupo);
            if (g) texts.push(`Grupo: ${g.nombre}`);
        }
        if (selectedMotivo !== 'all') {
            texts.push(`Motivo: ${selectedMotivo}`);
        }
        if (fechaDesde) texts.push(`Desde: ${fechaDesde}`);
        if (fechaHasta) texts.push(`Hasta: ${fechaHasta}`);
        if (searchTerm.trim()) texts.push(`Búsqueda: "${searchTerm.trim()}"`);

        return texts.length > 0 ? texts.join(' | ') : 'Todas las mermas registradas';
    };

    const handlePrint = () => {
        if (!mermasData.length) return;
        printData('Reporte de Inventario de Mermas', getExportColumns(), getFormattedData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!mermasData.length) return;
        exportToPDF('Reporte de Inventario de Mermas', getExportColumns(), getFormattedData(), 'mermas_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!mermasData.length) return;
        exportToExcel(getExcelColumns(), getFormattedData(), 'mermas_reporte');
    };

    const totalPages = Math.ceil(filteredMermas.length / itemsPerPage) || 1;
    const paginatedMermas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredMermas.slice(start, start + itemsPerPage);
    }, [filteredMermas, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCiudad, selectedSucursal, selectedProducto, selectedLinea, selectedMarca, selectedGrupo, selectedMotivo, fechaDesde, fechaHasta]);

    const hasActiveFilters = selectedProducto !== 'all' || selectedMarca !== 'all' || selectedLinea !== 'all' || selectedGrupo !== 'all' || selectedMotivo !== 'all' || !!fechaDesde || !!fechaHasta || !!searchTerm;

    // Available products for registration modal
    const availableInventories = useMemo(() => {
        if (!inventoryList) return [];
        return inventoryList.filter(inv => {
            if (selectedCiudad) {
                const suc = inv.sucursal as any;
                if (suc?.ciudad?.id !== Number(selectedCiudad) && suc?.ciudadId !== Number(selectedCiudad)) return false;
            }
            if (selectedSucursal) {
                const suc = inv.sucursal as any;
                if (suc?.id !== Number(selectedSucursal) && suc?.sucursalId !== Number(selectedSucursal)) return false;
            }
            return Number(inv.stockActual) > 0;
        });
    }, [inventoryList, selectedCiudad, selectedSucursal]);

    const selectedInvItem = useMemo(() => {
        if (!selectedInventoryId || !inventoryList) return null;
        return inventoryList.find(i => i.id === Number(selectedInventoryId)) || null;
    }, [selectedInventoryId, inventoryList]);

    const cantidadToCreate = parseFloat(cantidadMermaStr) || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-destructive flex items-center gap-2">
                        <AlertOctagon className="w-8 h-8 text-destructive" />
                        Inventario de Mermas
                    </h1>
                    <p className="text-muted-foreground italic">Historial y control detallado de mermas, deterioro y pérdidas de inventario.</p>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                    {canRegistrarMerma && (
                        <button
                            onClick={() => {
                                setSelectedInventoryId('');
                                setCantidadMermaStr('');
                                setObservacionesMerma('');
                                setIsCreateOpen(true);
                            }}
                            className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                            title="Registrar nueva merma"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Nueva Merma</span>
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Imprimir reporte"
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

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                        <AlertOctagon className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Total Registros</span>
                        <span className="text-2xl font-bold text-foreground">{totals.totalRegistros}</span>
                    </div>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Unidades Mermadas</span>
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{formatQuantity(totals.totalUnidades)}</span>
                    </div>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-xs flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Costo Total Estimado</span>
                        <span className="text-2xl font-bold text-red-600 dark:text-red-400">{formatCurrency(totals.totalCosto)}</span>
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por producto, código o motivo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Filtro por Producto (Solo productos en mermas) */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Package className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedProducto}
                        onChange={(e) => setSelectedProducto(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer max-w-[200px] truncate"
                    >
                        <option value="all" className="bg-background text-foreground">
                            {availableMermaProducts.length === 0 ? 'Sin productos en mermas' : `Todos los Productos (${availableMermaProducts.length})`}
                        </option>
                        {availableMermaProducts.map(p => (
                            <option key={p.id} value={p.id} className="bg-background text-foreground">
                                {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Marca */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedMarca}
                        onChange={(e) => setSelectedMarca(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todas las Marcas</option>
                        {marcas?.map(m => (
                            <option key={m.id} value={m.id} className="bg-background text-foreground">{m.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Línea */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedLinea}
                        onChange={(e) => setSelectedLinea(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todas las Líneas</option>
                        {lineas?.map(l => (
                            <option key={l.id} value={l.id} className="bg-background text-foreground">{l.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Grupo */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedGrupo}
                        onChange={(e) => setSelectedGrupo(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Grupos</option>
                        {grupos?.map(g => (
                            <option key={g.id} value={g.id} className="bg-background text-foreground">{g.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Motivo */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <AlertOctagon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedMotivo}
                        onChange={(e) => setSelectedMotivo(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Motivos</option>
                        <option value="Devolución" className="bg-background text-foreground">Devolución de Cliente (Descarte)</option>
                        <option value="Vencimiento" className="bg-background text-foreground">Vencimiento / Caducidad</option>
                        <option value="Deterioro" className="bg-background text-foreground">Deterioro / Daño físico</option>
                        <option value="Rotura" className="bg-background text-foreground">Rotura / Avería</option>
                        <option value="Pérdida" className="bg-background text-foreground">Pérdida / Extravío</option>
                        <option value="Defecto" className="bg-background text-foreground">Defecto de fábrica</option>
                        <option value="Otro" className="bg-background text-foreground">Otro</option>
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

                {/* Limpiar Filtros */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedProducto('all');
                            setSelectedLinea('all');
                            setSelectedMarca('all');
                            setSelectedGrupo('all');
                            setSelectedMotivo('all');
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

            {/* Tabla */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-14">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Fecha / Hora</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Producto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Marca</th>
                                {!selectedSucursal && <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal / Ciudad</th>}
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Cant. Mermada</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Costo Unit.</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Total Bs</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Motivo</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-36">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9 + (!selectedSucursal ? 1 : 0)} className="p-8 text-center text-muted-foreground animate-pulse">
                                        Cargando inventario de mermas...
                                    </td>
                                </tr>
                            ) : paginatedMermas.length === 0 ? (
                                <tr>
                                    <td colSpan={9 + (!selectedSucursal ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                                        No se encontraron registros de mermas con los filtros aplicados.
                                    </td>
                                </tr>
                            ) : paginatedMermas.map((m, index) => {
                                const cant = Math.abs(Number(m.cantidad) || 0);
                                const costo = getCostoUnitario(m);
                                const total = cant * costo;
                                const suc = m.inventario?.sucursal as any;

                                return (
                                    <tr key={m.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-xs font-mono text-muted-foreground whitespace-nowrap">
                                            {formatDateTime(m.creadoEn)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{m.inventario?.producto?.nombre}</span>
                                                <span className="text-xs font-mono text-muted-foreground">Código: {m.inventario?.producto?.codigo || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                                                {getMarcaNombre(m.inventario?.producto)}
                                            </span>
                                        </td>
                                        {!selectedSucursal && (
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{suc?.nombre || 'Sucursal Principal'}</span>
                                                    <span className="text-xs text-muted-foreground">{suc?.ciudad?.nombre || '-'}</span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-bold">
                                                <AlertOctagon className="w-3 h-3" />
                                                -{formatQuantity(cant)} {m.inventario?.producto?.unidadMedida || 'u.'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right text-xs font-mono">
                                            {formatCurrency(costo)}
                                        </td>
                                        <td className="p-4 text-right text-sm font-bold text-destructive font-mono">
                                            {formatCurrency(total)}
                                        </td>
                                        <td className="p-4 max-w-[220px]">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {m.tipo === 'MERMA_DESCARTE' && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-800 shrink-0">
                                                            Devolución
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-semibold text-foreground truncate" title={m.motivo}>
                                                        {m.motivo || 'Merma'}
                                                    </span>
                                                </div>
                                                {m.observaciones && (
                                                    <span className="text-[11px] text-muted-foreground truncate" title={m.observaciones}>
                                                        {m.observaciones}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => setSelectedMerma(m)}
                                                    className="px-2.5 py-1.5 bg-card border hover:border-primary/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                    title="Ver Detalle de Merma"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-primary" />
                                                </button>
                                                {canEditarMerma && (
                                                    <button
                                                        onClick={() => setEditingMerma({
                                                            id: m.id,
                                                            productName: m.inventario?.producto?.nombre || '',
                                                            motivo: m.motivo || 'Vencimiento / Caducidad',
                                                            observaciones: m.observaciones || ''
                                                        })}
                                                        className="px-2.5 py-1.5 bg-card border hover:border-amber-500/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                        title="Editar Motivo u Observaciones"
                                                    >
                                                        <Edit className="w-3.5 h-3.5 text-amber-500" />
                                                    </button>
                                                )}
                                                {canEliminarMerma && (
                                                    <button
                                                        onClick={() => setDeletingMerma(m)}
                                                        className="px-2.5 py-1.5 bg-card border hover:border-red-500/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                        title="Eliminar Merma y Revertir Stock"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                    </button>
                                                )}
                                            </div>
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredMermas.length)} de {filteredMermas.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm font-medium px-2">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Detalle de Merma */}
            <Modal
                isOpen={!!selectedMerma}
                onClose={() => setSelectedMerma(null)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <AlertOctagon className="w-6 h-6 text-destructive" />
                        Detalle de Registro de Merma
                    </span>
                }
            >
                {selectedMerma && (
                    <div className="space-y-6">
                        <div className="p-4 bg-muted/50 rounded-xl space-y-2 border">
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Producto Afectado</div>
                            <div className="text-lg font-bold">{selectedMerma.inventario?.producto?.nombre}</div>
                            <div className="flex flex-wrap gap-4 pt-2 border-t mt-2 text-xs text-muted-foreground">
                                <div>Código: <span className="font-mono font-bold text-foreground">{selectedMerma.inventario?.producto?.codigo || '-'}</span></div>
                                <div>Marca: <span className="font-bold text-foreground">{getMarcaNombre(selectedMerma.inventario?.producto)}</span></div>
                                <div>Línea: <span className="font-bold text-foreground">{getLineaNombre(selectedMerma.inventario?.producto)}</span></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 border rounded-xl bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Cantidad Mermada</span>
                                <span className="text-lg font-bold text-destructive">
                                    {formatQuantity(Math.abs(selectedMerma.cantidad))} {selectedMerma.inventario?.producto?.unidadMedida || 'u.'}
                                </span>
                            </div>
                            <div className="p-3 border rounded-xl bg-card">
                                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider block">Pérdida Total Estimada</span>
                                <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                    {formatCurrency(Math.abs(selectedMerma.cantidad) * getCostoUnitario(selectedMerma))}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 bg-muted/30 p-4 rounded-xl border text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Fecha y Hora:</span>
                                <span className="font-mono font-medium">{formatDateTime(selectedMerma.creadoEn)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sucursal:</span>
                                <span className="font-medium">
                                    {(selectedMerma.inventario?.sucursal as any)?.nombre} ({(selectedMerma.inventario?.sucursal as any)?.ciudad?.nombre})
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Motivo:</span>
                                <span className="font-bold text-destructive">{selectedMerma.motivo || 'Merma de Stock'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Registrado por:</span>
                                <span className="font-semibold">{getUsuarioNombre(selectedMerma)}</span>
                            </div>
                            {selectedMerma.observaciones && (
                                <div className="pt-2 border-t mt-2">
                                    <span className="text-muted-foreground block mb-1">Observaciones / Justificación:</span>
                                    <p className="p-2.5 bg-background border rounded-lg text-xs italic text-foreground whitespace-pre-wrap">
                                        {selectedMerma.observaciones}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setSelectedMerma(null)}
                                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal para Crear Merma */}
            <Modal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <AlertOctagon className="w-6 h-6 text-destructive" />
                        Registrar Nueva Merma de Inventario
                    </span>
                }
            >
                <div className="space-y-5">
                    <div>
                        <label className="text-sm font-medium block mb-1">Seleccionar Producto en Inventario</label>
                        <select
                            value={selectedInventoryId}
                            onChange={(e) => setSelectedInventoryId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive cursor-pointer"
                        >
                            <option value="">-- Seleccione un producto con stock --</option>
                            {availableInventories.map(inv => (
                                <option key={inv.id} value={inv.id}>
                                    {inv.producto?.nombre} (Cód: {inv.producto?.codigo || '-'}) - Stock: {inv.stockActual} {inv.producto?.unidadMedida} [{(inv.sucursal as any)?.nombre}]
                                </option>
                            ))}
                        </select>
                    </div>

                    {selectedInvItem && (
                        <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Stock Actual:</span>
                                <span className="font-bold text-primary">{formatQuantity(selectedInvItem.stockActual)} {selectedInvItem.producto?.unidadMedida}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sucursal:</span>
                                <span className="font-medium">{(selectedInvItem.sucursal as any)?.nombre}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-sm font-medium block mb-1">Cantidad a Mermar</label>
                        <input
                            type="number"
                            min="1"
                            max={selectedInvItem ? Number(selectedInvItem.stockActual) : undefined}
                            step="any"
                            value={cantidadMermaStr}
                            onChange={(e) => setCantidadMermaStr(e.target.value)}
                            className="w-full p-3 border rounded-xl bg-background text-lg font-bold focus:border-destructive focus:ring-2 focus:ring-destructive/20 outline-none transition-all text-center"
                            placeholder="Ej: 3"
                            disabled={!selectedInvItem}
                        />
                        {selectedInvItem && cantidadToCreate > Number(selectedInvItem.stockActual) && (
                            <p className="text-xs text-destructive font-semibold mt-1">
                                La cantidad no puede superar el stock actual ({selectedInvItem.stockActual}).
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1">Motivo de la Merma</label>
                        <select
                            value={motivoMerma}
                            onChange={(e) => setMotivoMerma(e.target.value)}
                            className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-destructive/20 focus:border-destructive"
                        >
                            <option value="Vencimiento / Caducidad">Vencimiento / Caducidad</option>
                            <option value="Deterioro / Daño físico">Deterioro / Daño físico</option>
                            <option value="Rotura / Avería">Rotura / Avería</option>
                            <option value="Pérdida / Extravío">Pérdida / Extravío</option>
                            <option value="Defecto de fábrica">Defecto de fábrica</option>
                            <option value="Otro">Otro motivo</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium block mb-1 text-muted-foreground">Observaciones (Opcional)</label>
                        <textarea
                            value={observacionesMerma}
                            onChange={(e) => setObservacionesMerma(e.target.value)}
                            className="w-full p-3 border rounded-lg bg-background text-sm focus:border-destructive focus:ring-2 focus:ring-destructive/20 outline-none transition-all resize-none min-h-[75px]"
                            placeholder="Explique el detalle de la merma o lote afectado..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setIsCreateOpen(false)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm cursor-pointer"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (selectedInventoryId && cantidadToCreate > 0) {
                                    createMermaMutation.mutate({
                                        id: Number(selectedInventoryId),
                                        cantidad: cantidadToCreate,
                                        motivo: motivoMerma,
                                        observaciones: observacionesMerma
                                    });
                                }
                            }}
                            disabled={!selectedInventoryId || !cantidadToCreate || (selectedInvItem ? cantidadToCreate > Number(selectedInvItem.stockActual) : true) || createMermaMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" /> {createMermaMutation.isPending ? 'Registrando...' : 'Registrar Merma'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Editar Merma */}
            <Modal
                isOpen={!!editingMerma}
                onClose={() => setEditingMerma(null)}
                title={
                    <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold">
                        <Edit className="w-6 h-6" />
                        Editar Registro de Merma
                    </span>
                }
            >
                {editingMerma && (
                    <div className="space-y-5">
                        <div className="p-4 bg-muted/50 rounded-xl space-y-1 border">
                            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Producto</div>
                            <div className="text-base font-bold">{editingMerma.productName}</div>
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-1">Motivo de la Merma</label>
                            <select
                                value={editingMerma.motivo}
                                onChange={(e) => setEditingMerma({ ...editingMerma, motivo: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
                            >
                                <option value="Vencimiento / Caducidad">Vencimiento / Caducidad</option>
                                <option value="Deterioro / Daño físico">Deterioro / Daño físico</option>
                                <option value="Rotura / Avería">Rotura / Avería</option>
                                <option value="Pérdida / Extravío">Pérdida / Extravío</option>
                                <option value="Defecto de fábrica">Defecto de fábrica</option>
                                <option value="Otro">Otro motivo</option>
                            </select>
                        </div>

                        <div>
                            <label className="text-sm font-medium block mb-1 text-muted-foreground">Observaciones / Justificación</label>
                            <textarea
                                value={editingMerma.observaciones}
                                onChange={(e) => setEditingMerma({ ...editingMerma, observaciones: e.target.value })}
                                className="w-full p-3 border rounded-lg bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[90px]"
                                placeholder="Actualizar motivo, lote o notas de la merma..."
                            />
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setEditingMerma(null)}
                                className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm cursor-pointer"
                            >
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => updateMermaMutation.mutate({
                                    id: editingMerma.id,
                                    motivo: editingMerma.motivo,
                                    observaciones: editingMerma.observaciones
                                })}
                                disabled={updateMermaMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <Check className="w-4 h-4" /> {updateMermaMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Confirmar Eliminación */}
            <Modal
                isOpen={!!deletingMerma}
                onClose={() => setDeletingMerma(null)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                        Eliminar Registro de Merma
                    </span>
                }
            >
                {deletingMerma && (
                    <div className="space-y-5">
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-2">
                            <p className="text-sm font-medium text-foreground">
                                ¿Estás seguro de que deseas eliminar este registro de merma?
                            </p>
                            <div className="text-xs space-y-1 text-muted-foreground pt-1 border-t border-red-500/20">
                                <div><strong>Producto:</strong> {deletingMerma.inventario?.producto?.nombre}</div>
                                <div><strong>Cantidad:</strong> <span className="font-bold text-destructive">-{formatQuantity(Math.abs(deletingMerma.cantidad))} {deletingMerma.inventario?.producto?.unidadMedida || 'u.'}</span></div>
                                <div><strong>Sucursal:</strong> {(deletingMerma.inventario?.sucursal as any)?.nombre}</div>
                                {deletingMerma.tipo === 'MERMA_DESCARTE' && (
                                    <div className="text-purple-600 dark:text-purple-400 font-semibold pt-1">
                                        Origen: Devolución de Cliente ({deletingMerma.numeroDocumento || 'Descarte'})
                                    </div>
                                )}
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            {deletingMerma.tipo === 'MERMA_DESCARTE'
                                ? 'Al confirmar, este registro de merma por devolución será eliminado del historial.'
                                : 'Al confirmar, el registro de merma será eliminado y la cantidad descontada volverá a sumarse automáticamente al stock disponible del inventario.'}
                        </p>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setDeletingMerma(null)}
                                className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm cursor-pointer"
                            >
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={() => deleteMermaMutation.mutate(deletingMerma.id)}
                                disabled={deleteMermaMutation.isPending}
                                className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" /> {deleteMermaMutation.isPending ? 'Eliminando...' : (deletingMerma.tipo === 'MERMA_DESCARTE' ? 'Eliminar Registro' : 'Eliminar y Revertir Stock')}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MermasPage;
