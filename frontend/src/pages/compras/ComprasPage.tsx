import { formatCurrency } from '../../utils/currencyUtils';
import { toast } from 'sonner';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseService, EstadoNota } from '../../api/purchaseService';
import { supplierService } from '../../api/supplierService';
import { productService } from '../../api/productService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import Sheet from '../../components/ui/Sheet';
import Modal from '../../components/ui/Modal';
import { CostoImportacionModal } from '../../components/compras/CostoImportacionModal';
import { X, Search, Plus, Trash2, CheckCircle, CheckCircle2, Check, Package, Calculator, Calendar, ChevronRight, Eye, Edit, Ban, Printer, AlertTriangle, Building2, FileText, FileSpreadsheet, Filter, Users, Lock, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromURL, exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';
import { formatDate } from '../../utils/dateUtils';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';

const ComprasPage: React.FC = () => {
    const { isAdmin, hasAction } = useAuth();
    const canCreate = isAdmin || hasAction('COMPRAS', 'CREAR');
    const canEdit = isAdmin || hasAction('COMPRAS', 'EDITAR');
    const canConfirm = isAdmin || hasAction('COMPRAS', 'CONFIRMAR');
    const canAnular = isAdmin || hasAction('COMPRAS', 'ANULAR');
    const canGestionarCostoImportacion = isAdmin || hasAction('COMPRAS', 'GESTIONAR_COSTO_IMPORTACION');
    const canVerCostoImportacion = isAdmin || hasAction('COMPRAS', 'VER_COSTO_IMPORTACION') || canGestionarCostoImportacion;
    const canCostosImportacion = canVerCostoImportacion;

    const { selectedSucursal, selectedCiudad } = useFilters();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isCostoImportacionOpen, setIsCostoImportacionOpen] = useState(false);
    const [selectedCompraForImportacion, setSelectedCompraForImportacion] = useState<any>(null);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState('all');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [newNota, setNewNota] = useState<any>({
        proveedorId: '',
        sucursalId: '',
        moneda: 'BOB',
        tipoCambio: 6.96,
        fecha: format(new Date(), 'yyyy-MM-dd'),
        observaciones: '',
        descuentoPorcentaje: 0,
        descuentoPromocionPorcentaje: 0,
        detalles: []
    });

    const { data: purchases, isLoading } = useQuery({
        queryKey: ['purchases'],
        queryFn: purchaseService.getAll,
    });

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => supplierService.getAll(),
    });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getAll(),
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const { data: ciudades } = useQuery({
        queryKey: ['ciudades'],
        queryFn: getCiudades,
    });

    const anularMutation = useMutation({
        mutationFn: purchaseService.anular,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Compra anulada exitosamente');
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Error al anular la compra')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => purchaseService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            toast.success('Compra actualizada exitosamente');
            resetForm();
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message;
            toast.error(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al actualizar compra'));
        }
    });

    const createMutation = useMutation({
        mutationFn: purchaseService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            setIsCreating(false);
            resetForm();
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Error al crear compra'),
    });

    const confirmMutation = useMutation({
        mutationFn: purchaseService.confirmar,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['purchases'] }),
    });

    const resetForm = () => {
        setNewNota({
            proveedorId: '',
            sucursalId: selectedSucursal || '',
            moneda: 'BOB',
            tipoCambio: 6.96,
            fecha: format(new Date(), 'yyyy-MM-dd'),
            observaciones: '',
            descuentoPorcentaje: 0,
            descuentoPromocionPorcentaje: 0,
            detalles: []
        });
        setError(null);
        setIsCreating(false);
        setIsViewing(false);
        setIsEditing(false);
    };

    const addProductToDetail = (prodId: string) => {
        const prod = products?.find(p => p.id === Number(prodId));
        if (!prod) return;

        if (newNota.detalles.some((d: any) => d.productoId === prod.id)) return;

        setNewNota({
            ...newNota,
            detalles: [...newNota.detalles, {
                productoId: prod.id,
                producto: prod,
                cantidad: 1,
                precioUnitario: prod.precioCompra,
                descuento: 0,
                subtotal: prod.precioCompra
            }]
        });
    };

    const removeDetail = (index: number) => {
        const newDetails = [...newNota.detalles];
        newDetails.splice(index, 1);
        setNewNota({ ...newNota, detalles: newDetails });
    };

    const updateDetail = (index: number, field: string, value: any) => {
        const newDetails = [...newNota.detalles];
        const det = { ...newDetails[index], [field]: value };
        det.subtotal = det.cantidad * det.precioUnitario;
        newDetails[index] = det;
        setNewNota({ ...newNota, detalles: newDetails });
    };

    const calculateTotals = () => {
        const subtotal = newNota.detalles.reduce((acc: number, det: any) => acc + (det.cantidad * det.precioUnitario), 0);
        const desc1 = (subtotal * Number(newNota.descuentoPorcentaje || 0)) / 100;
        const total = subtotal - desc1;
        return { subtotal, desc1, total };
    };

    const handlePrintIndividualCompra = async () => {
        const doc = new jsPDF();
        try {
            const logoBase64 = await getBase64ImageFromURL('/logo.jpeg');
            doc.addImage(logoBase64, 'JPEG', 14, 10, 45, 15);
        } catch (e) {
            console.warn('Could not load logo', e);
        }

        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.text(`Nota de Compra Nro ${newNota.id || 'S/N'}`, 196, 18, { align: 'right' });

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        let currentY = 38;
        
        const fechaFormatted = newNota.fecha ? newNota.fecha.split('T')[0].split('-').reverse().join('/') : '';
        doc.text(`Fecha: ${fechaFormatted}`, 14, currentY);
        
        const sucursalName = sucursales?.find(s => s.id === Number(newNota.sucursalId))?.nombre || '';
        if (sucursalName) doc.text(`Sucursal: ${sucursalName}`, 80, currentY);
        
        currentY += 6;
        const proveedorName = suppliers?.find(s => s.id === Number(newNota.proveedorId))?.empresa || '';
        doc.text(`Proveedor: ${proveedorName}`, 14, currentY);
        doc.text(`Moneda: ${newNota.moneda === 'USD' ? 'Dólares (USD)' : 'Bolivianos (BOB)'}`, 80, currentY);
        
        if (newNota.moneda === 'USD') {
            currentY += 6;
            doc.text(`Tipo de Cambio: ${newNota.tipoCambio}`, 14, currentY);
        }

        currentY += 12;

        const tableData = newNota.detalles.map((d: any) => {
            const prod = products?.find(p => p.id === d.productoId);
            return [
                prod ? `${prod.codigo} - ${prod.nombre}` : 'Producto',
                d.numeroLote || '-',
                d.fechaVencimiento ? d.fechaVencimiento.split('T')[0].split('-').reverse().join('/') : '-',
                d.cantidad,
                formatCurrency(d.precioUnitario, newNota.moneda),
                formatCurrency(d.subtotal, newNota.moneda)
            ];
        });

        autoTable(doc, {
            startY: currentY,
            head: [['Producto', 'Lote', 'Venc.', 'Cant.', 'P. Unit', 'Subtotal']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8 },
            columnStyles: {
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total: ${formatCurrency(calculateTotals().total, newNota.moneda)}`, 196, finalY, { align: 'right' });

        window.open(doc.output('bloburl'), '_blank');
    };

    const openEditModal = (nota: any) => {
        setNewNota({
            id: nota.id,
            estado: nota.estado,
            proveedorId: nota.proveedor?.id || '',
            sucursalId: nota.sucursal?.id || '',
            moneda: nota.moneda || 'BOB',
            tipoCambio: nota.tipoCambio || 6.96,
            fecha: nota.fecha ? nota.fecha.split('T')[0] : '',
            observaciones: nota.observaciones || '',
            descuentoPorcentaje: Number(nota.descuentoPorcentaje || 0),
            descuentoPromocionPorcentaje: Number(nota.descuentoPromocionPorcentaje || 0),
            detalles: (nota.detalles || []).map((d: any) => ({
                producto: d.producto,
                productoId: d.producto?.id || d.id,
                cantidad: Number(d.cantidad) || 0,
                precioUnitario: Number(d.precioUnitario) || 0,
                descuento: Number(d.descuento) || 0,
                numeroLote: d.numeroLote,
                fechaVencimiento: d.fechaVencimiento ? d.fechaVencimiento.split('T')[0] : '',
                subtotal: Number(d.subtotal) || 0
            }))
        });
        setIsEditing(true);
        setIsViewing(false);
        setIsCreating(true);
    };

    const openViewModal = (nota: any) => {
        setNewNota({
            id: nota.id,
            proveedorId: nota.proveedor?.id || '',
            sucursalId: nota.sucursal?.id || '',
            moneda: nota.moneda || 'BOB',
            tipoCambio: nota.tipoCambio || 6.96,
            fecha: nota.fecha ? nota.fecha.split('T')[0] : '',
            observaciones: nota.observaciones || '',
            descuentoPorcentaje: Number(nota.descuentoPorcentaje || 0),
            descuentoPromocionPorcentaje: Number(nota.descuentoPromocionPorcentaje || 0),
            detalles: nota.detalles.map((d: any) => ({
                producto: d.producto,
                productoId: d.producto.id,
                cantidad: Number(d.cantidad) || 0,
                precioUnitario: Number(d.precioUnitario) || 0,
                descuento: Number(d.descuento) || 0,
                numeroLote: d.numeroLote,
                fechaVencimiento: d.fechaVencimiento ? d.fechaVencimiento.split('T')[0] : '',
                subtotal: Number(d.subtotal) || 0
            }))
        });
        setIsViewing(true);
        setIsEditing(false);
        setIsCreating(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newNota.detalles.length === 0) {
            setError('Debe agregar al menos un producto');
            return;
        }
        if (!newNota.proveedorId) {
            setError('Debe seleccionar un proveedor');
            return;
        }

        if (isEditing && !newNota.id) {
            setError('Error: ID de compra no encontrado');
            return;
        }

        const payload = {
            proveedor: { id: Number(newNota.proveedorId) },
            fecha: newNota.fecha,
            observaciones: newNota.observaciones,
            moneda: newNota.moneda,
            tipoCambio: newNota.moneda === 'USD' ? Number(newNota.tipoCambio) : 1,
            sucursal: newNota.sucursalId ? { id: Number(newNota.sucursalId) } : (selectedSucursal ? { id: Number(selectedSucursal) } : null),
            descuentoPorcentaje: newNota.descuentoPorcentaje,
            descuentoPromocionPorcentaje: 0,
            detalles: newNota.detalles.map((d: any) => ({
                producto: { id: d.productoId },
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                descuento: d.descuento,
                numeroLote: d.numeroLote || null,
                fechaVencimiento: d.fechaVencimiento || null
            }))
        };
        if (isEditing) {
            updateMutation.mutate({ id: newNota.id!, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const filteredSucursales = useMemo(() => {
        if (!sucursales) return [];
        let filtered = sucursales;
        if (selectedSucursal) {
            filtered = filtered.filter(s => s.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(s => (s.ciudad as any)?.id === Number(selectedCiudad));
        }
        return filtered;
    }, [sucursales, selectedSucursal, selectedCiudad]);

    const filteredPurchases = useMemo(() => {
        if (!purchases) return [];
        let filtered = purchases;

        if (selectedSucursal) {
            filtered = filtered.filter(p => p.sucursal?.id === Number(selectedSucursal) || (p.almacen as any)?.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.almacen as any)?.sucursal?.ciudad?.id === Number(selectedCiudad));
        }

        if (selectedSupplier !== 'all') {
            filtered = filtered.filter(p => p.proveedor?.id === Number(selectedSupplier));
        }

        if (fechaDesde) {
            filtered = filtered.filter(p => {
                const pFecha = p.fecha ? p.fecha.split('T')[0] : '';
                return pFecha >= fechaDesde;
            });
        }

        if (fechaHasta) {
            filtered = filtered.filter(p => {
                const pFecha = p.fecha ? p.fecha.split('T')[0] : '';
                return pFecha <= fechaHasta;
            });
        }

        if (search.trim()) {
            const s = search.toLowerCase();
            filtered = filtered.filter(p => {
                const num = p.numero?.toLowerCase() || '';
                const provEmpresa = p.proveedor?.empresa?.toLowerCase() || '';
                const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.toLowerCase() : '';
                return num.includes(s) || provEmpresa.includes(s) || provPersona.includes(s);
            });
        }

        return filtered;
    }, [purchases, search, selectedSucursal, selectedCiudad, selectedSupplier, fechaDesde, fechaHasta]);

    const exportColumns = [
        { header: 'N° Compra', dataKey: 'numero' },
        { header: 'Fecha', dataKey: 'fechaFormatted' },
        { header: 'Proveedor', dataKey: 'proveedorNombre' },
        { header: 'Sucursal', dataKey: 'sucursalNombre' },
        { header: 'Moneda', dataKey: 'moneda' },
        { header: 'SubTotal', dataKey: 'subtotalFormatted' },
        { header: 'Descuento', dataKey: 'descuentoFormatted' },
        { header: 'Total', dataKey: 'totalFormatted' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const getFormattedData = () => {
        return filteredPurchases.map(s => {
            const subTotalCalc = (Number(s.total) || 0) + (Number(s.descuento) || 0);
            const descCalc = Number(s.descuento) || 0;
            const provPersona = s.proveedor?.persona ? `${s.proveedor.persona.nombres} ${s.proveedor.persona.apellidos}`.trim() : '';
            const provNombre = s.proveedor?.empresa ? `${s.proveedor.empresa}${provPersona ? ` (${provPersona})` : ''}` : (provPersona || 'Proveedor');
            return {
                id: s.id,
                numero: s.numero || '-',
                fechaFormatted: s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '-',
                proveedorNombre: provNombre,
                sucursalNombre: s.sucursal?.nombre || (s.almacen as any)?.nombre || '-',
                moneda: s.moneda || 'BOB',
                subtotalFormatted: formatCurrency(subTotalCalc, s.moneda || 'BOB'),
                descuentoFormatted: formatCurrency(descCalc, s.moneda || 'BOB'),
                totalFormatted: formatCurrency(s.total || 0, s.moneda || 'BOB'),
                estado: s.estado
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

        if (selectedSupplier !== 'all') {
            const sup = suppliers?.find(sp => sp.id === Number(selectedSupplier));
            const supName = sup?.empresa || (sup?.persona ? `${sup.persona.nombres} ${sup.persona.apellidos}` : selectedSupplier);
            texts.push(`Proveedor: ${supName}`);
        }

        if (fechaDesde && fechaHasta) {
            texts.push(`Rango: ${fechaDesde.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`);
        } else if (fechaDesde) {
            texts.push(`Desde: ${fechaDesde.split('-').reverse().join('/')}`);
        } else if (fechaHasta) {
            texts.push(`Hasta: ${fechaHasta.split('-').reverse().join('/')}`);
        }

        if (search.trim()) {
            texts.push(`Búsqueda: "${search.trim()}"`);
        }

        return texts.length > 0 ? texts.join(' | ') : 'Todas las compras';
    };

    const handlePrintReport = () => {
        if (!filteredPurchases.length) {
            toast.error('No hay compras para imprimir');
            return;
        }
        printData('Reporte de Compras', exportColumns, getFormattedData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!filteredPurchases.length) {
            toast.error('No hay compras para exportar');
            return;
        }
        exportToPDF('Reporte de Compras', exportColumns, getFormattedData(), 'compras_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!filteredPurchases.length) {
            toast.error('No hay compras para exportar');
            return;
        }
        exportToExcel(exportColumns, getFormattedData(), 'compras_reporte');
    };

    const hasActiveFilters = selectedSupplier !== 'all' || !!fechaDesde || !!fechaHasta || !!search;
    const handleClearFilters = () => {
        setSelectedSupplier('all');
        setFechaDesde('');
        setFechaHasta('');
        setSearch('');
    };

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando compras...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Package className="w-8 h-8 text-primary/80" />
                        Compras
                    </h1>
                    <p className="text-muted-foreground italic">Registre entradas de mercancía y gestione facturas de proveedores.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrintReport} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Imprimir Reporte">
                            <Printer className="w-4 h-4 text-muted-foreground" /> <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a PDF">
                            <FileText className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a Excel">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>

                    {canCreate && (
                        <button
                            onClick={() => { resetForm(); setIsCreating(true); }}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Compra
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search, Proveedor, Fechas & Limpiar */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
                    <Search className="w-5 h-5 text-muted-foreground ml-1 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por nro o proveedor..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-muted-foreground/70"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="p-1 hover:bg-accent rounded-md text-muted-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Filtro por Proveedor */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Proveedores</option>
                        {suppliers?.map(s => {
                            const pName = s.persona ? `${s.persona.nombres} ${s.persona.apellidos}`.trim() : '';
                            const label = s.empresa ? `${s.empresa}${pName ? ` (${pName})` : ''}` : pName;
                            return (
                                <option key={s.id} value={s.id} className="bg-background text-foreground">
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
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Limpiar filtros"
                    >
                        <X className="w-3.5 h-3.5" /> Limpiar
                    </button>
                )}
            </div>

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Número / Fecha</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Proveedor</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Moneda</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">SubTotal</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Descuento</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Total</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Estado</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredPurchases?.map((p) => (
                            <tr key={p.id} className="hover:bg-accent/50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{p.numero}</span>
                                        <span className="text-xs text-muted-foreground">{formatDate(p.fecha)}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-medium">{p.proveedor?.empresa || 'Final'}</span>
                                        <span className="text-xs text-muted-foreground">{p.proveedor?.persona?.nombres || ''} {p.proveedor?.persona?.apellidos || ''}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {p.sucursal || (p.almacen as any)?.sucursal ? (
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                {(p.sucursal || (p.almacen as any)?.sucursal)?.ciudad?.nombre || ''}
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {(p.sucursal || (p.almacen as any)?.sucursal)?.nombre}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground font-medium">-</span>
                                    )}
                                </td>
                                <td className="p-4 text-center">
                                    <span className="px-2 py-1 bg-muted rounded text-xs font-bold text-muted-foreground">{p.moneda}</span>
                                </td>
                                <td className="p-4 text-right text-sm font-medium text-muted-foreground">
                                    {formatCurrency((Number(p.total) || 0) + (Number(p.descuento) || 0), p.moneda)}
                                </td>
                                <td className="p-4 text-right text-sm font-medium text-red-600 dark:text-red-400">
                                    {formatCurrency(Number(p.descuento) || 0, p.moneda)}
                                </td>
                                <td className="p-4 text-right text-sm font-bold text-primary">
                                    {formatCurrency(p.total, p.moneda)}
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                            ${p.estado === EstadoNota.CONFIRMADA ? 'bg-green-100 text-green-700' :
                                                p.estado === EstadoNota.PENDIENTE ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'}`}>
                                            {p.estado}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        <button
                                            onClick={() => openViewModal(p)}
                                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5"
                                            title="Ver Compra"
                                        >
                                            <Eye className="w-3" /> Ver
                                        </button>
                                        {canCostosImportacion && p.estado === EstadoNota.CONFIRMADA && (() => {
                                            const hasImportCost = Boolean(
                                                p.costoImportacion && (
                                                    p.costoImportacion.id ||
                                                    Number(p.costoImportacion.totalGastosBob) > 0 ||
                                                    (p.costoImportacion.gastos && p.costoImportacion.gastos.length > 0)
                                                )
                                            );

                                            return (
                                                <button
                                                    onClick={() => {
                                                        setSelectedCompraForImportacion(p);
                                                        setIsCostoImportacionOpen(true);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                                        hasImportCost
                                                            ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                                            : 'bg-indigo-600 text-white hover:bg-indigo-700'
                                                    }`}
                                                    title={hasImportCost ? "Costo de Importación Aplicado (Ver / Modificar)" : "Calcular Costo de Importación y actualizar precios de compra"}
                                                >
                                                    {hasImportCost ? (
                                                        <>
                                                            <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3]" />
                                                            <span>Costo de Import.</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Calculator className="w-3.5 h-3.5" />
                                                            <span>Costo de Importación</span>
                                                        </>
                                                    )}
                                                </button>
                                            );
                                        })()}
                                        {canEdit && p.estado !== EstadoNota.ANULADA && (
                                            <button
                                                onClick={() => openEditModal(p)}
                                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                title="Editar Compra"
                                            >
                                                <Edit className="w-3" /> Editar
                                            </button>
                                        )}
                                        {canConfirm && p.estado === EstadoNota.PENDIENTE && (
                                            <button
                                                onClick={() => confirmMutation.mutate(p.id)}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1.5"
                                                title="Confirmar Compra (Ingresar stock)"
                                            >
                                                <CheckCircle className="w-3" /> Confirmar
                                            </button>
                                        )}
                                        {canAnular && p.estado !== EstadoNota.ANULADA && (
                                            Number(p.saldo) < Number(p.total) ? (
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="px-3 py-1.5 bg-muted text-muted-foreground border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-not-allowed opacity-60"
                                                    title={Number(p.saldo) <= 0.001 
                                                        ? "Compra 100% Pagada: Está protegida contra anulación. Debe anular sus pagos en Pagos a Proveedores primero." 
                                                        : "Compra con Pagos Registrados: Debe anular sus pagos en Pagos a Proveedores antes de anular la compra."}
                                                >
                                                    <Lock className="w-3 h-3" /> Anular
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setAnularConfirmId(p.id)}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer"
                                                    title="Anular Compra"
                                                >
                                                    <Trash2 className="w-3" /> Anular
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Sheet
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Package className="w-6 h-6 text-primary/80" />
                        {isViewing ? 'Detalle de Compra' : isEditing ? (newNota.estado === EstadoNota.CONFIRMADA ? 'Editar Compra (Confirmada)' : 'Editar Compra') : 'Registrar Nueva Compra'}
                    </span>
                }
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pb-24">
                    {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 italic">
                                    <Calendar className="w-3 h-3 text-primary" /> Fecha
                                </label>
                                <input
                                    type="date"
                                    value={newNota.fecha}
                                    onChange={(e) => setNewNota({ ...newNota, fecha: e.target.value })}
                                    disabled={isViewing}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 italic">Proveedor</label>
                                <select
                                    value={newNota.proveedorId}
                                    onChange={(e) => setNewNota({ ...newNota, proveedorId: Number(e.target.value) })}
                                    disabled={isViewing}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                    required
                                >
                                    <option value="">Seleccione un proveedor...</option>
                                    {suppliers?.map(s => <option key={s.id} value={s.id}>{s.empresa} {s.persona ? '(' + s.persona.nombres + ')' : ''}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 italic">
                                    <Building2 className="w-3 h-3 text-primary" /> Sucursal Destino
                                </label>
                                <select
                                    value={newNota.sucursalId}
                                    onChange={(e) => setNewNota({ ...newNota, sucursalId: Number(e.target.value) })}
                                    disabled={isViewing}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                >
                                    <option value="">Seleccione sucursal...</option>
                                    {filteredSucursales?.map(s => <option key={s.id} value={s.id}>{s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium flex items-center gap-2 italic">Moneda</label>
                                <select
                                    value={newNota.moneda}
                                    onChange={(e) => setNewNota({ ...newNota, moneda: e.target.value })}
                                    disabled={isViewing}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                >
                                    <option value="BOB">Bs. (Bolivianos)</option>
                                    <option value="USD">$us (Dólares)</option>
                                </select>
                            </div>
                            {newNota.moneda === 'USD' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2 italic">Tipo de Cambio</label>
                                    <input disabled={isViewing} type="number" step="0.01" value={newNota.tipoCambio}
                                        onChange={(e) => setNewNota({ ...newNota, tipoCambio: parseFloat(e.target.value) || 6.96 })}
                                        className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
                        <div className="p-4 bg-muted/30 border-b flex items-center gap-3">
                            <Package className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Productos en esta Nota</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {!isViewing && (
                                <div className="flex gap-2">
                                    <select 
                                        id="compraProductSelect"
                                        className="flex-1 p-2.5 border rounded-lg bg-background text-sm outline-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Seleccione un producto para agregar...</option>
                                        {products?.filter(p => p.activo).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.codigo} - {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const select = document.getElementById('compraProductSelect') as HTMLSelectElement;
                                            if (select && select.value) {
                                                addProductToDetail(select.value);
                                                select.value = '';
                                            }
                                        }}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap cursor-pointer"
                                    >
                                        Añadir
                                    </button>
                                </div>
                            )}

                            <div className="bg-muted/30 border rounded-xl overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-y">
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Lote</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Venc.</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Cant.</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">P.Unit</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Subtotal</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {newNota.detalles.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="p-8 text-center text-muted-foreground italic">
                                                No hay productos agregados.
                                            </td>
                                        </tr>
                                    )}
                                    {newNota.detalles.map((det: any, index: number) => (
                                        <tr key={index} className="hover:bg-accent/30 transition-colors">
                                            <td className="p-3">
                                                <div className="font-medium text-xs">{det.producto?.nombre}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{det.producto?.codigo}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <input disabled={isViewing} type="text" value={det.numeroLote || ''}
                                                    onChange={(e) => updateDetail(index, 'numeroLote', e.target.value)}
                                                    className="w-24 p-2 border rounded-lg bg-background text-center text-xs text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-mono disabled:opacity-75 disabled:bg-muted/30"
                                                    placeholder="Lote"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <input disabled={isViewing} type="date" value={det.fechaVencimiento ? det.fechaVencimiento.split('T')[0] : ''}
                                                    onChange={(e) => updateDetail(index, 'fechaVencimiento', e.target.value)}
                                                    className="w-32 p-2 border rounded-lg bg-background text-center text-xs text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all disabled:opacity-75 disabled:bg-muted/30"
                                                    title="Fecha de Vencimiento"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <input disabled={isViewing} type="number" min="1" value={det.cantidad}
                                                    onChange={(e) => updateDetail(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                    className="w-20 p-2 border rounded-lg bg-background text-center text-sm text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-medium disabled:opacity-75 disabled:bg-muted/30"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <input disabled={isViewing} type="number" min="0" step="0.01" value={det.precioUnitario}
                                                    onChange={(e) => updateDetail(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                    className="w-24 p-2 border rounded-lg bg-background text-center text-sm text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-medium disabled:opacity-75 disabled:bg-muted/30"
                                                />
                                            </td>
                                            <td className="p-3 text-center font-bold text-xs">
                                                {formatCurrency(det.subtotal, newNota.moneda)}
                                            </td>
                                            <td className="p-3 text-right">
                                                {!isViewing && (
                                                    <button type="button" onClick={() => removeDetail(index)} className="text-destructive hover:scale-110 transition-transform cursor-pointer">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">Observaciones Internas</label>
                        <textarea disabled={isViewing} value={newNota.observaciones}
                            onChange={(e) => setNewNota({ ...newNota, observaciones: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 outline-none min-h-[60px] transition-all hover:border-primary/50"
                            placeholder="Ej: Factura #12345, entrega parcial, etc."
                        />
                    </div>

                    <div className="fixed bottom-0 right-0 w-full max-w-4xl p-4 md:p-6 bg-card border-t flex flex-wrap items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-1.5 items-end pr-6 border-r text-xs font-bold w-60">
                                <div className="flex justify-between w-full">
                                    <span className="text-muted-foreground font-medium">Subtotal:</span>
                                    <span>{formatCurrency(calculateTotals().subtotal, newNota.moneda)}</span>
                                </div>
                                <div className="flex justify-between w-full items-center gap-2">
                                    <span className="text-muted-foreground font-medium">Descuento (%):</span>
                                    <input disabled={isViewing} type="number" min="0" max="100" step="0.1"
                                        className="w-16 px-2.5 py-1 border rounded-lg bg-background text-left text-xs text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-semibold"
                                        value={newNota.descuentoPorcentaje}
                                        onChange={(e) => setNewNota({ ...newNota, descuentoPorcentaje: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                {calculateTotals().desc1 > 0 && (
                                    <div className="flex justify-between w-full text-red-600 dark:text-red-400">
                                        <span>Desc. aplicado:</span>
                                        <span>-{formatCurrency(calculateTotals().desc1, newNota.moneda)}</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                                    <Calculator className="w-3 h-3 text-primary" /> Total Compra
                                </span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(calculateTotals().total, newNota.moneda)}</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setIsCreating(false)}
                                className="px-6 py-2.5 border rounded-xl text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                            >
                                {isViewing ? 'Cerrar' : 'Cancelar'}
                            </button>
                            
                            {isViewing && (
                                <button
                                    type="button"
                                    onClick={handlePrintIndividualCompra}
                                    className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold shadow-md hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Imprimir
                                </button>
                            )}

                            {!isViewing && (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {isEditing ? 'Actualizar' : 'Registrar'}
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            </Sheet>

            {/* Modal de Confirmación de Anulación */}
            <Modal
                isOpen={!!anularConfirmId}
                onClose={() => setAnularConfirmId(null)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Confirmar Anulación
                    </span>
                }
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        ¿Estás seguro de que deseas anular esta compra? Esta acción revertirá el stock de los productos ingresados y cambiará el estado de la nota a <span className="font-bold text-destructive">ANULADA</span>.
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
                                    setAnularConfirmId(null);
                                }
                            }}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-all flex items-center gap-2"
                        >
                            <Trash2 className="w-4 h-4" />
                            Sí, Anular
                        </button>
                    </div>
                </div>
            </Modal>

            <CostoImportacionModal
                isOpen={isCostoImportacionOpen}
                onClose={() => {
                    setIsCostoImportacionOpen(false);
                    setSelectedCompraForImportacion(null);
                }}
                compra={selectedCompraForImportacion}
                sucursales={sucursales || []}
                ciudades={ciudades || []}
                canManage={canGestionarCostoImportacion}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ['purchases'] });
                    queryClient.invalidateQueries({ queryKey: ['products'] });
                }}
            />
        </div>
    );
};

export default ComprasPage;










