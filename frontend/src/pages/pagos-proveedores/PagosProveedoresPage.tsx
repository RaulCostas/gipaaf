import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pagoProveedorService, type PagoProveedor } from '../../api/pagoProveedorService';
import { 
    Search, Plus, Trash2, Receipt, 
    X, Save, AlignLeft, ChevronLeft, ChevronRight,
    Printer, FileText, FileSpreadsheet, AlertTriangle,
    UserCircle, ShoppingBag, CreditCard, DollarSign, Calendar, ArrowRightLeft, Pencil,
    Upload, Image as ImageIcon, ExternalLink, Eye, RotateCcw
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DetalleCompraModal from '../../components/compras/DetalleCompraModal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';
import { useFilters } from '../../context/FilterContext';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';

const PagosProveedoresPage: React.FC = () => {
    const { selectedSucursal, selectedCiudad } = useFilters();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [filtroProveedor, setFiltroProveedor] = useState<string>('');
    const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVO' | 'ANULADO'>('TODOS');
    const [filtroMetodo, setFiltroMetodo] = useState<string>('TODOS');
    const [filtroMoneda, setFiltroMoneda] = useState<string>('TODOS');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [viewingComprobante, setViewingComprobante] = useState<string | null>(null);
    const [viewingDetalleCompra, setViewingDetalleCompra] = useState<any | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        proveedorId: '',
        notaId: '',
        moneda: 'BOB',
        tipoCambio: '6.96' as string | number,
        monto: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        metodoPago: 'Transferencia Bancaria',
        referencia: '',
        observaciones: '',
        comprobanteUrl: ''
    });

    const [error, setError] = useState<string | null>(null);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);

    // Queries
    const { data: pagosList, isLoading } = useQuery({
        queryKey: ['pagosProveedoresList'],
        queryFn: pagoProveedorService.getAll,
    });
    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });

    // Query all purchases with pending debt (saldo > 0)
    const { data: todasLasDeudas, isLoading: loadingDeudas } = useQuery({
        queryKey: ['todasLasDeudas'],
        queryFn: () => pagoProveedorService.getDeudas(),
    });

    // Purchases filtered by global city/branch selector
    const deudasFiltradas = useMemo(() => {
        if (!todasLasDeudas) return [];
        let filtered = todasLasDeudas;
        if (selectedSucursal) {
            filtered = filtered.filter(d => (d.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(d => (d.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }
        return filtered;
    }, [todasLasDeudas, selectedSucursal, selectedCiudad]);

    // Suppliers that actually have pending purchases with debt
    const proveedoresConDeuda = useMemo(() => {
        const map = new Map<number, any>();
        
        if (deudasFiltradas) {
            deudasFiltradas.forEach(nota => {
                if (nota.proveedor && !map.has(nota.proveedor.id)) {
                    map.set(nota.proveedor.id, nota.proveedor);
                }
            });
        }

        // If editing an existing payment, ensure its supplier is present
        if (editingId && pagosList) {
            const pago = pagosList.find(p => p.id === editingId);
            if (pago?.proveedor && !map.has(pago.proveedor.id)) {
                map.set(pago.proveedor.id, pago.proveedor);
            }
        }

        return Array.from(map.values());
    }, [deudasFiltradas, editingId, pagosList]);

    const proveedoresUnicos = useMemo(() => {
        if (!pagosList) return [];
        const map = new Map<number, any>();
        pagosList.forEach(p => {
            if (p.proveedor && !map.has(p.proveedor.id)) map.set(p.proveedor.id, p.proveedor);
        });
        return Array.from(map.values()).sort((a, b) => {
            const na = a.empresa || (a.persona ? `${a.persona.nombres} ${a.persona.apellidos}` : '');
            const nb = b.empresa || (b.persona ? `${b.persona.nombres} ${b.persona.apellidos}` : '');
            return na.localeCompare(nb);
        });
    }, [pagosList]);

    // Pending purchases for currently selected provider
    const deudasDelProveedor = useMemo(() => {
        if (!deudasFiltradas || !formData.proveedorId) return [];
        return deudasFiltradas.filter(d => d.proveedor?.id === Number(formData.proveedorId));
    }, [deudasFiltradas, formData.proveedorId]);

    // Selected purchase details for payment calculation
    const selectedCompra = useMemo(() => {
        if (!formData.notaId) return null;
        if (editingId && pagosList) {
            const pago = pagosList.find(p => p.id === editingId);
            if (pago?.nota?.id === Number(formData.notaId)) return pago.nota;
        }
        if (!todasLasDeudas) return null;
        return todasLasDeudas.find(d => d.id === Number(formData.notaId));
    }, [todasLasDeudas, formData.notaId, editingId, pagosList]);

    // Conversion and balance calculation
    const conversion = useMemo(() => {
        if (!selectedCompra) {
            return { montoEquivalente: 0, saldoRestante: 0, simboloCompra: 'Bs.', simboloPago: 'Bs.' };
        }
        const montoNum = parseFloat(formData.monto) || 0;
        const tc = parseFloat(String(formData.tipoCambio).replace(',', '.')) || 6.96;
        const monedaCompra = selectedCompra.moneda || 'BOB';
        const monedaPago = formData.moneda || 'BOB';

        let montoEquivalente = montoNum;
        if (monedaCompra === 'USD' && monedaPago === 'BOB') {
            montoEquivalente = tc > 0 ? Number((montoNum / tc).toFixed(2)) : 0;
        } else if (monedaCompra === 'BOB' && monedaPago === 'USD') {
            montoEquivalente = Number((montoNum * tc).toFixed(2));
        }

        const saldoActual = Number(selectedCompra.saldo) || 0;
        const saldoRestante = Math.max(0, saldoActual - montoEquivalente);
        const simboloCompra = monedaCompra === 'USD' ? '$us' : 'Bs.';
        const simboloPago = monedaPago === 'USD' ? '$us' : 'Bs.';

        return {
            montoEquivalente,
            saldoRestante,
            simboloCompra,
            simboloPago,
            monedaCompra,
            monedaPago,
            diferenteMoneda: monedaCompra !== monedaPago
        };
    }, [selectedCompra, formData.monto, formData.moneda, formData.tipoCambio]);

    const exportColumns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Nro Compra', dataKey: 'notaNumero' },
        { header: 'Proveedor', dataKey: 'proveedorNombre' },
        { header: 'Moneda Pago', dataKey: 'moneda' },
        { header: 'Método', dataKey: 'metodoPago' },
        { header: 'Referencia', dataKey: 'referencia' },
        { header: 'Total Compra', dataKey: 'totalCompraFormateado' },
        { header: 'Monto Pagado', dataKey: 'montoFormateado' },
        { header: 'Saldo Pendiente', dataKey: 'saldoFormateado' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    // Mutations
    const createMutation = useMutation({
        mutationFn: pagoProveedorService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pagosProveedoresList'] });
            queryClient.invalidateQueries({ queryKey: ['todasLasDeudas'] });
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            setIsCreating(false);
            resetForm();
            toast.success('Pago registrado exitosamente');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al registrar el pago';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => pagoProveedorService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pagosProveedoresList'] });
            queryClient.invalidateQueries({ queryKey: ['todasLasDeudas'] });
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            setIsCreating(false);
            resetForm();
            toast.success('Pago actualizado exitosamente');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al actualizar el pago';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const anularMutation = useMutation({
        mutationFn: pagoProveedorService.anular,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pagosProveedoresList'] });
            queryClient.invalidateQueries({ queryKey: ['todasLasDeudas'] });
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Pago anulado exitosamente');
            setAnularConfirmId(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Error al anular el pago');
        }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        setError(null);
        try {
            const res = await pagoProveedorService.uploadComprobante(file);
            if (res.error) {
                setError(res.message || res.error);
                toast.error(res.message || res.error);
            } else if (res.url) {
                setFormData(prev => ({ ...prev, comprobanteUrl: res.url || '' }));
                toast.success('Comprobante subido correctamente');
            }
        } catch (err: any) {
            const msg = err?.response?.data?.message || 'Error al subir el comprobante';
            setError(msg);
            toast.error(msg);
        } finally {
            setIsUploadingFile(false);
        }
    };

    const resetForm = () => {
        setFormData({
            proveedorId: '',
            notaId: '',
            moneda: 'BOB',
            tipoCambio: '6.96',
            monto: '',
            fecha: format(new Date(), 'yyyy-MM-dd'),
            metodoPago: 'Transferencia Bancaria',
            referencia: '',
            observaciones: '',
            comprobanteUrl: ''
        });
        setEditingId(null);
        setError(null);
    };

    const openEditModal = (pago: PagoProveedor) => {
        setEditingId(pago.id);
        setFormData({
            proveedorId: pago.proveedor?.id?.toString() || '',
            notaId: pago.nota?.id?.toString() || '',
            moneda: pago.moneda || 'BOB',
            tipoCambio: pago.tipoCambio != null ? String(pago.tipoCambio) : '6.96',
            monto: pago.monto?.toString() || '',
            fecha: pago.fecha ? pago.fecha.substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
            metodoPago: pago.metodoPago || 'Transferencia Bancaria',
            referencia: pago.referencia || '',
            observaciones: pago.observaciones || '',
            comprobanteUrl: pago.comprobanteUrl || ''
        });
        setError(null);
        setIsCreating(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.proveedorId) {
            setError('Debe seleccionar un proveedor');
            return;
        }

        if (!formData.notaId) {
            setError('Debe seleccionar una compra pendiente');
            return;
        }

        const montoNum = parseFloat(formData.monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            setError('El monto debe ser un valor numérico mayor a 0');
            return;
        }

        const tcNum = parseFloat(String(formData.tipoCambio).replace(',', '.'));
        if (isNaN(tcNum) || tcNum <= 0) {
            setError('El tipo de cambio debe ser mayor a 0');
            return;
        }

        if (editingId) {
            updateMutation.mutate({
                id: editingId,
                data: {
                    monto: montoNum,
                    moneda: formData.moneda,
                    tipoCambio: tcNum,
                    fecha: formData.fecha,
                    metodoPago: formData.metodoPago,
                    referencia: formData.referencia,
                    observaciones: formData.observaciones,
                    comprobanteUrl: formData.comprobanteUrl || null
                }
            });
        } else {
            createMutation.mutate({
                proveedorId: Number(formData.proveedorId),
                notaId: Number(formData.notaId),
                monto: montoNum,
                moneda: formData.moneda,
                tipoCambio: tcNum,
                fecha: formData.fecha,
                metodoPago: formData.metodoPago,
                referencia: formData.referencia,
                observaciones: formData.observaciones,
                comprobanteUrl: formData.comprobanteUrl || null
            });
        }
    };

    // Filter payments table by global filter & search
    const filteredPagos = useMemo(() => {
        if (!pagosList) return [];
        let filtered = pagosList;

        if (selectedSucursal) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (filtroProveedor) filtered = filtered.filter(p => String(p.proveedor?.id) === filtroProveedor);
        if (filtroEstado === 'ACTIVO') filtered = filtered.filter(p => p.activo);
        else if (filtroEstado === 'ANULADO') filtered = filtered.filter(p => !p.activo);
        if (filtroMetodo !== 'TODOS') filtered = filtered.filter(p => (p.metodoPago || 'Transferencia Bancaria') === filtroMetodo);
        if (filtroMoneda !== 'TODOS') filtered = filtered.filter(p => p.moneda === filtroMoneda);
        if (fechaDesde) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) >= fechaDesde);
        if (fechaHasta) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) <= fechaHasta);

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const provNombre = p.proveedor?.persona 
                    ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.toLowerCase() 
                    : (p.proveedor?.empresa || '').toLowerCase();
                const compraNum = (p.nota?.numero || '').toLowerCase();
                const ref = (p.referencia || '').toLowerCase();
                const metodo = (p.metodoPago || '').toLowerCase();
                return provNombre.includes(s) || compraNum.includes(s) || ref.includes(s) || metodo.includes(s);
            });
        }

        return filtered;
    }, [pagosList, selectedSucursal, selectedCiudad, searchTerm, filtroProveedor, filtroEstado, filtroMetodo, filtroMoneda, fechaDesde, fechaHasta]);

    const mappedExportData = useMemo(() => {
        return filteredPagos.map(p => {
            const simbolo = p.moneda === 'USD' ? '$us' : 'Bs.';
            const montoFormateado = `${simbolo} ${Number(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const compraMoneda = p.nota?.moneda || 'BOB';
            const saldoSimbolo = compraMoneda === 'USD' ? '$us' : 'Bs.';
            const saldoFormateado = p.nota ? `${saldoSimbolo} ${Number(p.nota.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            const totalCompraFormateado = p.nota ? `${compraMoneda === 'USD' ? '$us' : 'Bs.'} ${Number(p.nota.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            const estado = !p.activo ? 'Anulado' : (Number(p.nota?.saldo) <= 0.001 ? 'Pagada' : 'Aplicado');
            return {
                ...p,
                proveedorNombre: p.proveedor?.empresa
                    ? `${p.proveedor.empresa}${p.proveedor.persona ? ` (${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos})` : ''}`
                    : (p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}` : 'Proveedor'),
                notaNumero: p.nota?.numero || '-',
                totalCompraFormateado,
                montoFormateado,
                saldoFormateado,
                estado
            };
        });
    }, [filteredPagos]);

    const getFiltersText = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre || selectedSucursal}`);
        }
        if (filtroProveedor) {
            const prov = proveedoresUnicos.find(p => String(p.id) === filtroProveedor);
            if (prov) {
                const pName = prov.persona ? `${prov.persona.nombres} ${prov.persona.apellidos}`.trim() : '';
                const label = prov.empresa ? `${prov.empresa}${pName ? ` (${pName})` : ''}` : pName;
                texts.push(`Proveedor: ${label}`);
            }
        }
        if (filtroEstado === 'ACTIVO') texts.push('Estado: Activos');
        else if (filtroEstado === 'ANULADO') texts.push('Estado: Anulados');
        
        if (filtroMetodo !== 'TODOS') texts.push(`Método: ${filtroMetodo}`);
        if (filtroMoneda !== 'TODOS') texts.push(`Moneda: ${filtroMoneda === 'USD' ? 'Dólares ($us)' : 'Bolivianos (Bs.)'}`);

        if (fechaDesde && fechaHasta) {
            texts.push(`Rango: ${fechaDesde.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`);
        } else if (fechaDesde) {
            texts.push(`Desde: ${fechaDesde.split('-').reverse().join('/')}`);
        } else if (fechaHasta) {
            texts.push(`Hasta: ${fechaHasta.split('-').reverse().join('/')}`);
        }
        return texts.length > 0 ? texts.join(' | ') : 'Todos los pagos a proveedores';
    };

    const getTotalsFooter = () => {
        let totalPagadoBOB = 0;
        let totalPagadoUSD = 0;

        filteredPagos.forEach(p => {
            if (!p.activo) return;
            const monto = Number(p.monto) || 0;
            if (p.moneda === 'USD') {
                totalPagadoUSD += monto;
            } else {
                totalPagadoBOB += monto;
            }
        });

        let montoStr = '';
        if (totalPagadoBOB > 0 && totalPagadoUSD > 0) {
            montoStr = `Bs. ${totalPagadoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | $us ${totalPagadoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (totalPagadoUSD > 0) {
            montoStr = `$us ${totalPagadoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            montoStr = `Bs. ${totalPagadoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        return {
            fecha: 'TOTALES',
            notaNumero: '',
            proveedorNombre: '',
            moneda: '',
            metodoPago: '',
            referencia: '',
            totalCompraFormateado: '',
            montoFormateado: montoStr,
            saldoFormateado: '',
            estado: `${totals.activosCount} pagos`
        };
    };

    const getExportColumns = () => {
        if (filtroProveedor) return exportColumns.filter(c => c.dataKey !== 'proveedorNombre');
        return exportColumns;
    };

    const handlePrint = () => {
        if (!mappedExportData.length) return;
        printData('Reporte de Pagos a Proveedores', getExportColumns(), mappedExportData, getFiltersText(), getTotalsFooter());
    };
    const handleExportPDF = () => {
        if (!mappedExportData.length) return;
        exportToPDF('Reporte de Pagos a Proveedores', getExportColumns(), mappedExportData, 'pagos_proveedores_reporte', getFiltersText(), getTotalsFooter());
    };
    const handleExportExcel = () => {
        if (!mappedExportData.length) return;
        exportToExcel(getExportColumns(), mappedExportData, 'pagos_proveedores_reporte', getTotalsFooter());
    };


    // Financial KPI Totals
    const totals = useMemo(() => {
        let totalPagadoBOB = 0;
        let totalPagadoUSD = 0;

        filteredPagos.forEach(p => {
            if (!p.activo) return;
            const monto = Number(p.monto) || 0;
            if (p.moneda === 'USD') {
                totalPagadoUSD += monto;
            } else {
                totalPagadoBOB += monto;
            }
        });

        return {
            totalPagadoBOB,
            totalPagadoUSD,
            totalCount: filteredPagos.length,
            activosCount: filteredPagos.filter(p => p.activo).length
        };
    }, [filteredPagos]);

    // Pagination
    const totalPages = Math.ceil(filteredPagos.length / itemsPerPage) || 1;
    const paginatedPagos = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPagos.slice(start, start + itemsPerPage);
    }, [filteredPagos, currentPage]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando pagos a proveedores...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Receipt className="w-8 h-8 text-primary/80" />
                        Pagos a Proveedores
                    </h1>
                    <p className="text-muted-foreground italic">Registro y gestión de pagos y amortizaciones de compras a crédito.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer"
                            title="Imprimir"
                        >
                            <Printer className="w-4 h-4 text-muted-foreground" />
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer"
                            title="Exportar a PDF"
                        >
                            <FileText className="w-4 h-4 text-red-500" />
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button
                            onClick={handleExportExcel}
                            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer"
                            title="Exportar a Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-600" />
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>

                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Pago
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-primary" /> Total Pagado (Bs.)
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        Bs. {totals.totalPagadoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Pagos activos en Bolivianos</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-primary" /> Total Pagado ($us)
                    </span>
                    <div className="text-2xl font-black text-primary">
                        $us {totals.totalPagadoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Pagos activos en Dólares</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-primary" /> Total de Pagos
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        {totals.activosCount} <span className="text-sm font-normal text-muted-foreground">/ {totals.totalCount} registros</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Pagos registrados</p>
                </div>
            </div>

            {/* Toolbar: Buscador, Filtros & Limpiar */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por proveedor, nro de compra, ref..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-muted-foreground/70"
                    />
                    {searchTerm && (
                        <button onClick={() => setSearchTerm('')} className="p-1 hover:bg-accent rounded-md text-muted-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filtro Proveedor */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <UserCircle className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={filtroProveedor}
                        onChange={(e) => { setFiltroProveedor(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm max-w-[200px] truncate"
                    >
                        <option value="" className="bg-background text-foreground">Todos los Proveedores</option>
                        {proveedoresUnicos.map(p => {
                            const pName = p.persona ? `${p.persona.nombres} ${p.persona.apellidos}`.trim() : '';
                            const label = p.empresa ? `${p.empresa}${pName ? ` (${pName})` : ''}` : (pName || 'Proveedor');
                            return (
                                <option key={p.id} value={p.id} className="bg-background text-foreground">
                                    {label}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Filtro Fecha Desde */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs text-muted-foreground font-medium">Desde:</span>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => { setFechaDesde(e.target.value); setCurrentPage(1); }}
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
                        onChange={(e) => { setFechaHasta(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    />
                </div>

                {/* Botón Limpiar Filtros */}
                {(searchTerm || filtroProveedor || fechaDesde || fechaHasta) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFiltroProveedor('');
                            setFechaDesde('');
                            setFechaHasta('');
                            setCurrentPage(1);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg border border-dashed transition-colors cursor-pointer"
                        title="Limpiar todos los filtros"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span>Limpiar</span>
                    </button>
                )}
            </div>

            {/* Tabla de Pagos */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Compra</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedor</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Moneda</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Comprobante</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Compra</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Monto Pagado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo Pendiente</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-36">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedPagos.length === 0 ? (
                                <tr>
                                    <td colSpan={13} className="p-8 text-center text-muted-foreground text-sm">
                                        No se encontraron pagos registrados.
                                    </td>
                                </tr>
                            ) : paginatedPagos.map((p, index) => {
                                const provEmpresa = p.proveedor?.empresa || '';
                                const provPersona = p.proveedor?.persona
                                    ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.trim()
                                    : '';
                                const provNombre = provEmpresa || provPersona || 'Proveedor';
                                const isUSD = p.moneda === 'USD';
                                const simbolo = isUSD ? '$us' : 'Bs.';
                                const compraMoneda = p.nota?.moneda || 'BOB';
                                const esMonedaCruzada = p.moneda !== compraMoneda;
                                const saldoSimbolo = compraMoneda === 'USD' ? '$us' : 'Bs.';
                                const saldoNota = Number(p.nota?.saldo || 0);

                                return (
                                    <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-sm font-medium">
                                            {p.fecha ? format(new Date(p.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            {p.nota ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setViewingDetalleCompra(p.nota)}
                                                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                    title="Ver detalle y productos de la compra"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    {p.nota.numero}
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground font-mono text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-foreground">
                                            {provNombre}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-bold text-muted-foreground">
                                                {p.moneda || 'BOB'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {p.metodoPago || 'Efectivo'}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground font-mono text-xs">
                                            {p.referencia || '-'}
                                        </td>
                                        <td className="p-4 text-center">
                                            {p.comprobanteUrl ? (
                                                p.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                                    <a 
                                                        href={`http://127.0.0.1:3001${p.comprobanteUrl}`} 
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
                                                        onClick={() => setViewingComprobante(p.comprobanteUrl || '')}
                                                        className="inline-flex items-center gap-1 p-0.5 rounded hover:ring-2 hover:ring-primary/40 transition-all group/thumb"
                                                        title="Ver comprobante de pago"
                                                    >
                                                        <img 
                                                            src={`http://127.0.0.1:3001${p.comprobanteUrl}`} 
                                                            alt="Voucher" 
                                                            className="w-7 h-7 object-cover rounded border" 
                                                        />
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            {p.nota ? (
                                                <div className="text-sm font-semibold text-foreground">
                                                    {compraMoneda === 'USD' ? '$us' : 'Bs.'} {Number(p.nota.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-sm font-bold text-primary">
                                                {simbolo} {Number(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            {esMonedaCruzada && p.montoEquivalente > 0 && (
                                                <div className="text-[10px] text-muted-foreground font-normal">
                                                    ≈ {compraMoneda === 'USD' ? '$us' : 'Bs.'} {Number(p.montoEquivalente).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {p.nota ? (
                                                saldoNota <= 0.001 ? (
                                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                                        {saldoSimbolo} 0,00
                                                    </span>
                                                ) : (
                                                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                                                        {saldoSimbolo} {saldoNota.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-xs text-muted-foreground font-mono">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {!p.activo ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                                                    Anulado
                                                </span>
                                            ) : saldoNota <= 0.001 ? (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                                    Pagada
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                                                    Aplicado
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 flex-wrap">
                                                {p.activo && (
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5"
                                                        title="Editar Pago"
                                                    >
                                                        <Pencil className="w-3 h-3" /> Editar
                                                    </button>
                                                )}
                                                {p.activo && (
                                                    <button
                                                        onClick={() => setAnularConfirmId(p.id)}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5"
                                                        title="Anular Pago"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Anular
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPagos.length)} de {filteredPagos.length}
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

            {/* Modal de Registro/Edición de Pago */}
            <Modal
                isOpen={isCreating}
                onClose={() => { setIsCreating(false); resetForm(); }}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Receipt className="w-6 h-6 text-primary/80" />
                        {editingId ? 'Editar Pago a Proveedor' : 'Registrar Pago a Proveedor'}
                    </span>
                }
                className="max-w-lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4 max-h-[65vh] overflow-y-auto px-1.5 py-1 custom-scrollbar">
                        {/* Selector de Proveedor */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <UserCircle className="w-4 h-4 text-primary" />
                                Proveedor con Saldo Pendiente <span className="text-destructive">*</span>
                            </label>
                            {loadingDeudas && !editingId ? (
                                <div className="p-2.5 text-xs text-muted-foreground animate-pulse border rounded-lg">Cargando proveedores con deuda...</div>
                            ) : (
                                <select
                                    value={formData.proveedorId}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            proveedorId: e.target.value,
                                            notaId: ''
                                        });
                                        setError(null);
                                    }}
                                    disabled={!!editingId}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm disabled:opacity-60"
                                    required
                                >
                                    <option value="">Seleccione un proveedor...</option>
                                    {proveedoresConDeuda?.map(p => {
                                        const nombre = p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : (p.empresa || 'Proveedor');
                                        return (
                                            <option key={p.id} value={p.id}>
                                                {nombre} {p.empresa && p.persona ? `(${p.empresa})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                            {!editingId && proveedoresConDeuda && proveedoresConDeuda.length === 0 && !loadingDeudas && (
                                <p className="text-xs text-amber-600 font-medium">No se encontraron proveedores con saldo pendiente de pago.</p>
                            )}
                        </div>

                        {/* Selector de Compra / Nota */}
                        {formData.proveedorId && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                    <ShoppingBag className="w-4 h-4 text-primary" />
                                    Compra con Saldo Pendiente <span className="text-destructive">*</span>
                                </label>
                                {loadingDeudas && !editingId ? (
                                    <div className="p-2.5 text-xs text-muted-foreground animate-pulse border rounded-lg">Cargando compras...</div>
                                ) : (
                                    <select
                                        value={formData.notaId}
                                        disabled={!!editingId}
                                        onChange={(e) => {
                                            const nId = e.target.value;
                                            const n = todasLasDeudas?.find(d => d.id === Number(nId));
                                            setFormData({
                                                ...formData,
                                                notaId: nId,
                                                moneda: n?.moneda || formData.moneda,
                                                tipoCambio: n?.tipoCambio != null ? String(n.tipoCambio) : formData.tipoCambio
                                            });
                                            setError(null);
                                        }}
                                        className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm disabled:opacity-60"
                                        required
                                    >
                                        <option value="">Seleccione una compra...</option>
                                        {editingId && selectedCompra && (
                                            <option value={selectedCompra.id}>
                                                {selectedCompra.numero} - Fecha: {format(new Date(selectedCompra.fecha + 'T00:00:00'), 'dd/MM/yyyy')} | ({selectedCompra.moneda})
                                            </option>
                                        )}
                                        {!editingId && deudasDelProveedor?.map(d => {
                                            const sim = d.moneda === 'USD' ? '$us' : 'Bs.';
                                            return (
                                                <option key={d.id} value={d.id}>
                                                    {d.numero} - Fecha: {format(new Date(d.fecha + 'T00:00:00'), 'dd/MM/yyyy')} | Saldo: {sim} {Number(d.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })} ({d.moneda})
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                                {!editingId && deudasDelProveedor && deudasDelProveedor.length === 0 && (
                                    <p className="text-xs text-green-600 font-medium">Este proveedor no tiene compras con saldo pendiente.</p>
                                )}
                            </div>
                        )}

                        {/* Moneda y Tipo de Cambio */}
                        {selectedCompra && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 border rounded-xl">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5 text-primary" />
                                        Moneda del Pago
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, moneda: 'BOB' })}
                                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                                                formData.moneda === 'BOB'
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-background hover:bg-accent text-muted-foreground'
                                            }`}
                                        >
                                            Bolivianos (Bs.)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, moneda: 'USD' })}
                                            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border ${
                                                formData.moneda === 'USD'
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                                    : 'bg-background hover:bg-accent text-muted-foreground'
                                            }`}
                                        >
                                            Dólares ($us)
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <ArrowRightLeft className="w-3.5 h-3.5 text-primary" />
                                        Tipo de Cambio
                                    </label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={formData.tipoCambio}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.,]/g, '');
                                            setFormData({ ...formData, tipoCambio: val });
                                        }}
                                        className="w-full p-2 border rounded-lg bg-background text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Resumen de la Compra y Saldo */}
                        {selectedCompra && (
                            <div className="p-3.5 bg-muted/40 rounded-xl border space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Moneda de Registro Compra:</span>
                                    <span className="font-bold px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px]">
                                        {selectedCompra.moneda || 'BOB'} ({conversion.simboloCompra})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Total Compra:</span>
                                    <span className="font-semibold">
                                        {conversion.simboloCompra} {Number(selectedCompra.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Saldo Pendiente:</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        {conversion.simboloCompra} {Number(selectedCompra.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {conversion.diferenteMoneda && conversion.montoEquivalente > 0 && (
                                    <div className="flex items-center justify-between text-xs py-1 border-t border-dashed">
                                        <span className="text-muted-foreground">Equivalencia a aplicar en compra:</span>
                                        <span className="font-bold text-primary">
                                            {conversion.simboloCompra} {conversion.montoEquivalente.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                                    <span className="text-muted-foreground">Saldo tras este pago:</span>
                                    <span className={`font-bold ${conversion.saldoRestante === 0 ? 'text-green-600' : 'text-primary'}`}>
                                        {conversion.simboloCompra} {conversion.saldoRestante.toLocaleString('es-BO', { minimumFractionDigits: 2 })} {conversion.saldoRestante === 0 && '(Saldado)'}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Monto a Pagar */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Monto a Pagar ({conversion.simboloPago}) <span className="text-destructive">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground pointer-events-none select-none">
                                    {conversion.simboloPago}
                                </span>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    value={formData.monto}
                                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                                    className="w-full pl-12 pr-3 py-2.5 border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-primary/20 outline-none font-bold text-base transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Fila Fecha y Método */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-primary" /> Fecha <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                    <CreditCard className="w-4 h-4 text-primary" /> Método de Pago
                                </label>
                                <select
                                    value={formData.metodoPago}
                                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                >
                                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                                    <option value="QR">QR</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Tarjeta de Débito/Crédito">Tarjeta de Débito/Crédito</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        {/* Referencia */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nro. de Transferencia / Transacción QR / Recibo</label>
                            <input
                                type="text"
                                placeholder="Ej. TRF-48192, QR-99412, REC-041..."
                                value={formData.referencia}
                                onChange={(e) => setFormData({ ...formData, referencia: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                            />
                        </div>

                        {/* Comprobante / Voucher QR */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                    <Receipt className="w-4 h-4 text-primary" /> Comprobante / Voucher QR (Imagen o PDF)
                                </span>
                                {formData.comprobanteUrl && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, comprobanteUrl: '' }))}
                                        className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1 font-semibold"
                                    >
                                        <Trash2 className="w-3 h-3" /> Quitar archivo
                                    </button>
                                )}
                            </label>

                            {formData.comprobanteUrl ? (
                                <div className="p-3 border rounded-xl bg-muted/20 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {formData.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                            <div className="p-2 bg-red-100 dark:bg-red-950/40 rounded-lg text-red-600 dark:text-red-400">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                        ) : (
                                            <img 
                                                src={`http://127.0.0.1:3001${formData.comprobanteUrl}`} 
                                                alt="Comprobante" 
                                                className="w-12 h-12 object-cover rounded-lg border shadow-sm" 
                                            />
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-foreground truncate">
                                                {formData.comprobanteUrl.split('/').pop()}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {formData.comprobanteUrl.toLowerCase().endsWith('.pdf') ? 'Documento PDF' : 'Imagen adjunta'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`http://127.0.0.1:3001${formData.comprobanteUrl}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-2.5 py-1.5 text-xs font-bold bg-card border rounded-lg hover:bg-accent text-primary transition-all flex items-center gap-1 shadow-sm"
                                        >
                                            <ExternalLink className="w-3.5 h-3.5" /> Abrir
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp,application/pdf"
                                        onChange={handleFileUpload}
                                        disabled={isUploadingFile}
                                        className="hidden"
                                        id="pago-comprobante-upload"
                                    />
                                    <label
                                        htmlFor="pago-comprobante-upload"
                                        className={`flex flex-col items-center justify-center gap-1.5 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all hover:bg-muted/40 hover:border-primary/50 text-center ${
                                            isUploadingFile ? 'opacity-50 pointer-events-none' : ''
                                        }`}
                                    >
                                        <Upload className="w-5 h-5 text-primary" />
                                        <span className="text-xs font-semibold text-foreground">
                                            {isUploadingFile ? 'Subiendo comprobante...' : 'Haga clic para adjuntar comprobante / voucher QR'}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground">
                                            JPG, PNG, WebP o PDF (hasta 10MB)
                                        </span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* Observaciones */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Observaciones / Glosa</label>
                            <div className="relative group">
                                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                <textarea
                                    placeholder="Detalles adicionales del pago..."
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm min-h-[60px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => { setIsCreating(false); resetForm(); }}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending || isUploadingFile}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Registrar Pago')}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal de Vista de Comprobante / Imagen */}
            <Modal
                isOpen={viewingComprobante !== null}
                onClose={() => setViewingComprobante(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <ImageIcon className="w-6 h-6 text-primary/80" />
                        Comprobante de Pago / Voucher QR
                    </span>
                }
                className="max-w-xl"
            >
                {viewingComprobante && (
                    <div className="space-y-4">
                        <div className="border rounded-xl overflow-hidden bg-black/5 flex items-center justify-center p-2">
                            <img
                                src={`http://127.0.0.1:3001${viewingComprobante}`}
                                alt="Comprobante Completo"
                                className="max-h-[70vh] object-contain rounded-lg shadow-md"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <a
                                href={`http://127.0.0.1:3001${viewingComprobante}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> Abrir en tamaño completo
                            </a>
                            <button
                                type="button"
                                onClick={() => setViewingComprobante(null)}
                                className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Confirmar Anulación */}
            <Modal
                isOpen={anularConfirmId !== null}
                onClose={() => setAnularConfirmId(null)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Confirmar Anulación de Pago
                    </span>
                }
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        ¿Estás seguro de anular este pago? Esta acción revertirá el saldo adeudado en la orden de compra correspondiente.
                    </p>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={() => setAnularConfirmId(null)}
                            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (anularConfirmId) {
                                    anularMutation.mutate(anularConfirmId);
                                }
                            }}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Sí, Anular Pago
                        </button>
                    </div>
                </div>
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

export default PagosProveedoresPage;
