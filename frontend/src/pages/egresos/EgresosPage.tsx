import { getFileUrl } from '../../api/apiClient';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { egresoService, type Egreso, type CreateEgresoDto } from '../../api/egresoService';
import { sucursalService } from '../../api/sucursalService';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { 
    Search, Plus, Pencil, Trash2, DollarSign, 
    X, Save, AlignLeft, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, Calendar,
    Building2, Upload, CreditCard, ArrowDownRight,
    FileCheck
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';

const METODOS_PAGO = [
    'Efectivo',
    'Transferencia Bancaria',
    'QR',
    'Tarjeta de Débito/Crédito',
    'Otro'
];

const EgresosPage: React.FC = () => {
    const { isAdmin, hasAction } = useAuth();
    const canCreate = isAdmin || hasAction('EGRESOS', 'CREAR');
    const canEdit = isAdmin || hasAction('EGRESOS', 'EDITAR');
    const canAnular = isAdmin || hasAction('EGRESOS', 'ANULAR') || hasAction('EGRESOS', 'ELIMINAR');

    const queryClient = useQueryClient();
    const { selectedSucursal, selectedCiudad } = useFilters();

    const [isEditing, setIsEditing] = useState(false);
    const [currentEgreso, setCurrentEgreso] = useState<Partial<Omit<CreateEgresoDto, 'tipoCambio'> & { id?: number; tipoCambio?: number | string }>>({});
    
    // Filtros
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroMetodo, setFiltroMetodo] = useState('TODOS');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Subida de comprobante
    const [uploadingFile, setUploadingFile] = useState(false);
    const [viewingComprobante, setViewingComprobante] = useState<string | null>(null);

    const { data: egresosList, isLoading } = useQuery({
        queryKey: ['egresosList'],
        queryFn: egresoService.getAll,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    // Reset Form
    const resetForm = () => {
        setCurrentEgreso({
            fecha: format(new Date(), 'yyyy-MM-dd'),
            detalle: '',
            monto: undefined,
            moneda: 'BOB',
            tipoCambio: 6.96,
            formaPago: 'Efectivo',
            nroComprobante: '',
            comprobanteUrl: '',
            observaciones: '',
            sucursalId: selectedSucursal ? Number(selectedSucursal) : (sucursales && sucursales.length > 0 ? sucursales[0].id : undefined),
            activo: true
        });
    };

    // Export Columns
    const exportColumns = [
        { header: 'Fecha', dataKey: 'fechaFormatted' },
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Detalle / Concepto', dataKey: 'detalle' },
        { header: 'Sucursal', dataKey: 'sucursalNombre' },
        { header: 'Forma de Pago', dataKey: 'formaPago' },
        { header: 'Nro. Comprobante', dataKey: 'nroComprobante' },
        { header: 'Monto', dataKey: 'montoFormatted' },
        { header: 'Estado', dataKey: 'estadoFormatted' }
    ];

    const mappedExportData = useMemo(() => {
        if (!egresosList) return [];
        return egresosList.map(e => {
            const simbolo = e.moneda === 'USD' ? '$us' : 'Bs.';
            const montoFormatted = `${simbolo} ${Number(e.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const fechaFormatted = e.fecha ? format(new Date(e.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-';
            const sucursalNombre = e.sucursal?.nombre ? `${e.sucursal.nombre}${e.sucursal.ciudad?.nombre ? ` (${e.sucursal.ciudad.nombre})` : ''}` : '-';

            return {
                ...e,
                fechaFormatted,
                montoFormatted,
                sucursalNombre,
                nroComprobante: e.nroComprobante || '-',
                estadoFormatted: e.activo ? 'Activo' : 'Inactivo'
            };
        });
    }, [egresosList]);

    const getFiltersText = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const s = sucursales?.find(suc => suc.ciudad?.id === Number(selectedCiudad));
            if (s?.ciudad?.nombre) texts.push(`Ciudad: ${s.ciudad.nombre}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find(suc => suc.id === Number(selectedSucursal));
            if (s?.nombre) texts.push(`Sucursal: ${s.nombre}`);
        }
        if (filtroMetodo !== 'TODOS') texts.push(`Método: ${filtroMetodo}`);
        if (fechaDesde && fechaHasta) texts.push(`Rango: ${fechaDesde.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`);
        else if (fechaDesde) texts.push(`Desde: ${fechaDesde.split('-').reverse().join('/')}`);
        else if (fechaHasta) texts.push(`Hasta: ${fechaHasta.split('-').reverse().join('/')}`);
        if (searchTerm) texts.push(`Búsqueda: "${searchTerm}"`);
        return texts.join(' | ') || 'Todos los egresos';
    };

    const handlePrint = () => {
        if (!mappedExportData.length) return;
        printData('Reporte de Egresos Diarios y Gastos Operativos', exportColumns, filteredEgresosMapped, getFiltersText());
    };

    const handleExportPDF = () => {
        if (!mappedExportData.length) return;
        exportToPDF('Reporte de Egresos Diarios', exportColumns, filteredEgresosMapped, 'egresos_diarios_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!mappedExportData.length) return;
        exportToExcel(exportColumns, filteredEgresosMapped, 'egresos_diarios_reporte');
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: egresoService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['egresosList'] });
            setIsEditing(false);
            setCurrentEgreso({});
            toast.success('Egreso registrado con éxito');
        },
        onError: () => toast.error('Ocurrió un error al registrar el egreso')
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; data: Partial<CreateEgresoDto> }) => egresoService.update(data.id, data.data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['egresosList'] });
            setIsEditing(false);
            setCurrentEgreso({});
            toast.success('Egreso actualizado con éxito');
        },
        onError: () => toast.error('Ocurrió un error al actualizar el egreso')
    });

    const anularMutation = useMutation({
        mutationFn: egresoService.anular,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['egresosList'] });
            toast.error('Egreso desactivado');
        },
        onError: () => toast.error('Ocurrió un error al desactivar el egreso')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentEgreso.detalle || !currentEgreso.detalle.trim()) {
            toast.error('Por favor ingresa el detalle o concepto del egreso');
            return;
        }
        if (!currentEgreso.monto || Number(currentEgreso.monto) <= 0) {
            toast.error('Por favor ingresa un monto válido mayor a 0');
            return;
        }

        const dataToSend: CreateEgresoDto = {
            fecha: currentEgreso.fecha,
            detalle: currentEgreso.detalle.trim(),
            monto: Number(currentEgreso.monto),
            moneda: currentEgreso.moneda || 'BOB',
            tipoCambio: Number(currentEgreso.tipoCambio) || 6.96,
            formaPago: currentEgreso.formaPago || 'Efectivo',
            nroComprobante: currentEgreso.nroComprobante?.trim() || undefined,
            comprobanteUrl: currentEgreso.comprobanteUrl || undefined,
            observaciones: currentEgreso.observaciones?.trim() || undefined,
            sucursalId: currentEgreso.sucursalId ? Number(currentEgreso.sucursalId) : undefined,
            activo: currentEgreso.activo !== false
        };

        if (currentEgreso.id) {
            updateMutation.mutate({ id: currentEgreso.id, data: dataToSend });
        } else {
            createMutation.mutate(dataToSend);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingFile(true);
            const res = await egresoService.uploadComprobante(file);
            if (res?.url) {
                setCurrentEgreso(prev => ({ ...prev, comprobanteUrl: res.url }));
                toast.success('Comprobante subido correctamente');
            } else {
                toast.error('No se pudo obtener la URL del archivo');
            }
        } catch (error) {
            toast.error('Error al subir el comprobante');
        } finally {
            setUploadingFile(false);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
    const handleDelete = (id: number) => setDeleteConfirmId(id);
    const confirmDelete = () => {
        if (deleteConfirmId) {
            anularMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    // Filter Logic
    const filteredEgresos = useMemo(() => {
        if (!egresosList) return [];
        let filtered = egresosList;

        if (selectedSucursal) {
            filtered = filtered.filter(e => e.sucursal?.id === Number(selectedSucursal) || e.sucursalId === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(e => (e.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (filtroMetodo !== 'TODOS') {
            filtered = filtered.filter(e => (e.formaPago || 'Efectivo') === filtroMetodo);
        }

        if (fechaDesde) {
            filtered = filtered.filter(e => e.fecha && e.fecha >= fechaDesde);
        }
        if (fechaHasta) {
            filtered = filtered.filter(e => e.fecha && e.fecha <= fechaHasta);
        }

        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(e => 
                (e.codigo && e.codigo.toLowerCase().includes(s)) ||
                (e.detalle && e.detalle.toLowerCase().includes(s)) ||
                (e.nroComprobante && e.nroComprobante.toLowerCase().includes(s)) ||
                (e.formaPago && e.formaPago.toLowerCase().includes(s)) ||
                (e.sucursal?.nombre && e.sucursal.nombre.toLowerCase().includes(s))
            );
        }

        return filtered;
    }, [egresosList, selectedSucursal, selectedCiudad, filtroMetodo, fechaDesde, fechaHasta, searchTerm]);

    const filteredEgresosMapped = useMemo(() => {
        const ids = new Set(filteredEgresos.map(e => e.id));
        return mappedExportData.filter(m => ids.has(m.id));
    }, [filteredEgresos, mappedExportData]);

    // KPI Totals
    const totals = useMemo(() => {
        let totalBOB = 0;
        let totalUSD = 0;
        let activosCount = 0;

        filteredEgresos.forEach(e => {
            if (e.activo) {
                activosCount++;
                if (e.moneda === 'USD') {
                    totalUSD += Number(e.monto || 0);
                } else {
                    totalBOB += Number(e.monto || 0);
                }
            }
        });

        return {
            totalBOB,
            totalUSD,
            activosCount,
            totalCount: filteredEgresos.length
        };
    }, [filteredEgresos]);

    const totalPages = Math.ceil(filteredEgresos.length / itemsPerPage) || 1;
    const paginatedEgresos = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEgresos.slice(start, start + itemsPerPage);
    }, [filteredEgresos, currentPage]);

    React.useEffect(() => setCurrentPage(1), [searchTerm, filtroMetodo, fechaDesde, fechaHasta]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando egresos diarios...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <DollarSign className="w-8 h-8 text-primary/80" />
                        Egresos Diarios
                    </h1>
                    <p className="text-muted-foreground italic">Registro y control de gastos operativos, alquileres, servicios y compras menores.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Imprimir">
                            <Printer className="w-4 h-4 text-muted-foreground" /> <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Exportar a PDF">
                            <FileText className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Exportar a Excel">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>
                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>
                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setIsEditing(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> Nuevo Egreso
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowDownRight className="w-4 h-4 text-rose-500" /> Total Egresos (Bs.)
                    </span>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                        Bs. {totals.totalBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Gastos activos en Bolivianos</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowDownRight className="w-4 h-4 text-rose-500" /> Total Egresos ($us)
                    </span>
                    <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                        $us {totals.totalUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Gastos activos en Dólares</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-primary" /> Total Registros
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        {totals.activosCount} <span className="text-sm font-normal text-muted-foreground">/ {totals.totalCount} registros</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Egresos registrados en el periodo</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-primary" /> Forma de Pago
                        </label>
                        <select
                            value={filtroMetodo}
                            onChange={(e) => setFiltroMetodo(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="TODOS">Todas las Formas</option>
                            {METODOS_PAGO.map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Desde
                        </label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Hasta
                        </label>
                        <input
                            type="date"
                            value={fechaHasta}
                            onChange={(e) => setFechaHasta(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t">
                    <div className="bg-background border rounded-lg shadow-sm flex items-center gap-2 p-2 w-full sm:max-w-md">
                        <Search className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="Buscar por código, detalle, comprobante..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground/70"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-accent rounded-md text-muted-foreground cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        {(filtroMetodo !== 'TODOS' || fechaDesde || fechaHasta || searchTerm) && (
                            <button
                                onClick={() => {
                                    setFiltroMetodo('TODOS');
                                    setFechaDesde('');
                                    setFechaHasta('');
                                    setSearchTerm('');
                                }}
                                className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground border rounded-lg hover:bg-accent transition-colors cursor-pointer"
                            >
                                Limpiar Filtros
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Formulario Egreso */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <DollarSign className="w-6 h-6 text-primary/80" />
                        {currentEgreso.id ? 'Editar Egreso Diario' : 'Registrar Nuevo Egreso'}
                    </span>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-primary" /> Fecha <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="date"
                                value={currentEgreso.fecha || ''}
                                onChange={(e) => setCurrentEgreso({ ...currentEgreso, fecha: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Building2 className="w-4 h-4 text-primary" /> Sucursal
                            </label>
                            <select
                                value={currentEgreso.sucursalId || ''}
                                onChange={(e) => setCurrentEgreso({ ...currentEgreso, sucursalId: Number(e.target.value) })}
                                className="w-full p-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            >
                                <option value="">Seleccione una sucursal...</option>
                                {sucursales?.filter(s => s.activo !== false || s.id === currentEgreso.sucursalId).map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre}{s.ciudad?.nombre ? ` (${s.ciudad.nombre})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <AlignLeft className="w-4 h-4 text-primary" /> Detalle / Concepto del Gasto <span className="text-destructive">*</span>
                        </label>
                        <textarea
                            placeholder="Ej. Pago de alquiler de la tienda mes de agosto, Pago de factura de luz, Compra de refrigerio para personal..."
                            value={currentEgreso.detalle || ''}
                            onChange={(e) => setCurrentEgreso({ ...currentEgreso, detalle: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[85px] resize-none"
                            required
                        />
                    </div>

                    {/* Fila Monto, Moneda y Tipo de Cambio */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/20 border rounded-xl">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <DollarSign className="w-3.5 h-3.5 text-primary" /> Monto <span className="text-destructive">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                placeholder="0.00"
                                value={currentEgreso.monto ?? ''}
                                onChange={(e) => setCurrentEgreso({ ...currentEgreso, monto: Number(e.target.value) })}
                                className="w-full p-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none font-bold text-sm"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Moneda</label>
                            <div className="grid grid-cols-2 gap-1">
                                <button
                                    type="button"
                                    onClick={() => setCurrentEgreso({ ...currentEgreso, moneda: 'BOB' })}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                        currentEgreso.moneda === 'BOB'
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background hover:bg-accent text-muted-foreground'
                                    }`}
                                >
                                    Bs. (BOB)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentEgreso({ ...currentEgreso, moneda: 'USD' })}
                                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                        currentEgreso.moneda === 'USD'
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-background hover:bg-accent text-muted-foreground'
                                    }`}
                                >
                                    $us (USD)
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Tipo de Cambio</label>
                            <input
                                type="text"
                                inputMode="decimal"
                                placeholder="6.96"
                                value={currentEgreso.tipoCambio !== undefined && currentEgreso.tipoCambio !== null ? currentEgreso.tipoCambio : ''}
                                onChange={(e) => {
                                    const val = e.target.value.replace(',', '.');
                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                        setCurrentEgreso({ ...currentEgreso, tipoCambio: val });
                                    }
                                }}
                                className="w-full p-2 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none text-xs"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-primary" /> Forma de Pago
                            </label>
                            <select
                                value={currentEgreso.formaPago || 'Efectivo'}
                                onChange={(e) => setCurrentEgreso({ ...currentEgreso, formaPago: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            >
                                {METODOS_PAGO.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nro. de Recibo / Factura / Ref.</label>
                            <input
                                type="text"
                                placeholder="Ej. REC-0041, FAC-1092, TRF-8812..."
                                value={currentEgreso.nroComprobante || ''}
                                onChange={(e) => setCurrentEgreso({ ...currentEgreso, nroComprobante: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                        </div>
                    </div>

                    {/* Subida de Comprobante / Recibo */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                            <Upload className="w-4 h-4 text-primary" /> Comprobante / Recibo (Foto o PDF)
                        </label>
                        <div className="flex items-center gap-3">
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                onChange={handleFileUpload}
                                disabled={uploadingFile}
                                className="text-xs file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                            />
                            {uploadingFile && <span className="text-xs text-muted-foreground animate-pulse">Subiendo...</span>}
                        </div>
                        {currentEgreso.comprobanteUrl && (
                            <div className="flex items-center gap-2 p-2 bg-muted/40 rounded-lg text-xs">
                                <FileCheck className="w-4 h-4 text-green-600" />
                                <span className="truncate flex-1 font-mono text-[11px] text-muted-foreground">{currentEgreso.comprobanteUrl}</span>
                                <button
                                    type="button"
                                    onClick={() => setViewingComprobante(currentEgreso.comprobanteUrl || '')}
                                    className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-bold hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer"
                                >
                                    Ver
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentEgreso({ ...currentEgreso, comprobanteUrl: '' })}
                                    className="p-1 text-destructive hover:bg-destructive/10 rounded cursor-pointer"
                                    title="Quitar comprobante"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground">Observaciones Adicionales</label>
                        <input
                            type="text"
                            placeholder="Opcional..."
                            value={currentEgreso.observaciones || ''}
                            onChange={(e) => setCurrentEgreso({ ...currentEgreso, observaciones: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                        <div className="space-y-0.5">
                            <label className="text-sm font-semibold text-foreground">Estado del Registro</label>
                            <p className="text-[11px] text-muted-foreground">Activo (afecta caja) o Inactivo</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer"
                                checked={currentEgreso.activo !== false}
                                onChange={(e) => setCurrentEgreso({ ...currentEgreso, activo: e.target.checked })}
                            />
                            <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            <Save className="w-4 h-4" /> {currentEgreso.id ? 'Guardar Cambios' : 'Registrar Egreso'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal Confirmar Desactivación */}
            <Modal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                title="Desactivar Egreso Diario"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Este egreso pasará a estado Inactivo</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">Este registro dejará de estar disponible y no se contabilizará en los cálculos de flujo de caja, pero no se borrará para preservar el historial.</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
                        >
                            Sí, Desactivar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal Ver Comprobante */}
            <Modal
                isOpen={viewingComprobante !== null}
                onClose={() => setViewingComprobante(null)}
                title="Comprobante de Egreso"
            >
                <div className="space-y-4 flex flex-col items-center">
                    {viewingComprobante ? (
                        viewingComprobante.toLowerCase().endsWith('.pdf') ? (
                            <div className="p-8 text-center space-y-4">
                                <FileText className="w-16 h-16 text-red-500 mx-auto" />
                                <p className="text-sm text-muted-foreground">Este comprobante es un documento PDF.</p>
                                <a 
                                    href={getFileUrl(viewingComprobante)} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-bold shadow-sm"
                                >
                                    Abrir PDF en nueva pestaña
                                </a>
                            </div>
                        ) : (
                            <img 
                                src={getFileUrl(viewingComprobante)} 
                                alt="Comprobante" 
                                className="max-h-[500px] w-auto object-contain rounded-lg border shadow-sm" 
                            />
                        )
                    ) : null}
                    <div className="flex justify-end w-full pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setViewingComprobante(null)}
                            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Tabla de Egresos */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Fecha</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Código</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Detalle / Concepto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Forma de Pago</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Comprobante</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Monto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28 text-center">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedEgresos.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                        No se encontraron egresos diarios registrados.
                                    </td>
                                </tr>
                            ) : (
                                paginatedEgresos.map((egreso, index) => {
                                    const isUSD = egreso.moneda === 'USD';
                                    const simbolo = isUSD ? '$us' : 'Bs.';
                                    const sucursalNombre = egreso.sucursal?.nombre ? `${egreso.sucursal.nombre}${egreso.sucursal.ciudad?.nombre ? ` (${egreso.sucursal.ciudad.nombre})` : ''}` : '-';

                                    return (
                                        <tr key={egreso.id} className="hover:bg-accent/30 transition-colors group">
                                            <td className="p-4 text-sm font-mono text-muted-foreground">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </td>
                                            <td className="p-4 text-sm font-medium">
                                                {egreso.fecha ? format(new Date(egreso.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary">
                                                    {egreso.codigo}
                                                </span>
                                            </td>
                                            <td className="p-4 text-sm font-medium max-w-sm">
                                                <div className="font-semibold text-foreground truncate" title={egreso.detalle}>
                                                    {egreso.detalle}
                                                </div>
                                                {egreso.nroComprobante && (
                                                    <div className="text-[11px] text-muted-foreground font-mono">
                                                        Ref: {egreso.nroComprobante}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {sucursalNombre}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {egreso.formaPago || 'Efectivo'}
                                            </td>
                                            <td className="p-4 text-center">
                                                {egreso.comprobanteUrl ? (
                                                    egreso.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                                        <a 
                                                            href={getFileUrl(egreso.comprobanteUrl)} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                            title="Ver comprobante PDF"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" /> PDF
                                                        </a>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingComprobante(egreso.comprobanteUrl || '')}
                                                            className="inline-flex items-center gap-1 p-0.5 rounded hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                                                            title="Ver comprobante"
                                                        >
                                                            <img 
                                                                src={getFileUrl(egreso.comprobanteUrl)} 
                                                                alt="Comprobante" 
                                                                className="w-7 h-7 object-cover rounded border" 
                                                            />
                                                        </button>
                                                    )
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold text-rose-600 dark:text-rose-400">
                                                <div className="text-sm">
                                                    {simbolo} {Number(egreso.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                                {isUSD && egreso.montoEquivalente > 0 && (
                                                    <div className="text-[10px] text-muted-foreground font-normal">
                                                        ≈ Bs. {Number(egreso.montoEquivalente).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-center">
                                                {egreso.activo ? (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest">
                                                        Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                <div className="flex justify-end gap-2 transition-opacity">
                                                    {canEdit && (
                                                        <button
                                                            onClick={() => {
                                                                setCurrentEgreso({
                                                                    id: egreso.id,
                                                                    codigo: egreso.codigo,
                                                                    fecha: egreso.fecha,
                                                                    detalle: egreso.detalle,
                                                                    monto: Number(egreso.monto),
                                                                    moneda: egreso.moneda,
                                                                    tipoCambio: Number(egreso.tipoCambio),
                                                                    formaPago: egreso.formaPago,
                                                                    nroComprobante: egreso.nroComprobante || '',
                                                                    comprobanteUrl: egreso.comprobanteUrl || '',
                                                                    observaciones: egreso.observaciones || '',
                                                                    sucursalId: egreso.sucursal?.id || egreso.sucursalId,
                                                                    activo: egreso.activo
                                                                });
                                                                setIsEditing(true);
                                                            }}
                                                            title="Editar"
                                                            className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {canAnular && (
                                                        egreso.activo ? (
                                                            <button
                                                                onClick={() => handleDelete(egreso.id)}
                                                                title="Desactivar"
                                                                className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        ) : (
                                                            <button
                                                                onClick={() => updateMutation.mutate({ id: egreso.id, data: { activo: true } }, {
                                                                    onSuccess: () => toast.success('Egreso activado con éxito')
                                                                })}
                                                                title="Activar"
                                                                className="p-2 text-green-600 dark:text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredEgresos.length)} de {filteredEgresos.length}
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

export default EgresosPage;
