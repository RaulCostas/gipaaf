import { formatCurrency } from '../../utils/currencyUtils';
import { toast } from 'sonner';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { returnService } from '../../api/returnService';
import { clientService } from '../../api/clientService';
import { productService } from '../../api/productService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { EstadoNota } from '../../api/purchaseService';
import Sheet from '../../components/ui/Sheet';
import Modal from '../../components/ui/Modal';
import { 
    X, Search, Plus, Trash2, CheckCircle, Package, 
    Calculator, Calendar, RotateCcw, User, Building2, 
    Printer, FileText, FileSpreadsheet, Eye, Edit, 
    Ban, AlertTriangle, Users, ArrowRightLeft, Sparkles,
    ShieldAlert, RefreshCw, Check, AlertCircle, ArrowDownLeft, ArrowUpRight,
    Undo2
} from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromURL, exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';

const DEFECT_PRESETS = [
    'Abollado / Dañado',
    'Falla de fábrica / Defecto',
    'Empaque roto / Sellado defectuoso',
    'Vencido / Por vencer',
    'Producto equivocado',
    'Otro motivo'
];

export const DESTINOS_PRODUCTO = [
    { value: 'REINGRESO_STOCK', label: 'Reingreso a Stock Vendible', badge: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 font-bold' },
    { value: 'DESCARTE_MERMA', label: 'Descarte / Merma (No apto)', badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border-amber-300 dark:border-amber-700 font-bold' },
    { value: 'RECLAMO_PROVEEDOR', label: 'Reclamo / Garantía Proveedor', badge: 'bg-blue-100 text-blue-900 dark:bg-blue-950/70 dark:text-blue-200 border-blue-300 dark:border-blue-700 font-bold' }
];

const DevolucionesPage: React.FC = () => {
    const { isAdmin, hasAction } = useAuth();
    const canCreate = isAdmin || hasAction('DEVOLUCIONES', 'CREAR');
    const canConfirm = isAdmin || hasAction('DEVOLUCIONES', 'CONFIRMAR') || hasAction('DEVOLUCIONES', 'CREAR');
    const canEdit = isAdmin || hasAction('DEVOLUCIONES', 'EDITAR') || hasAction('DEVOLUCIONES', 'CREAR');
    const canAnular = isAdmin || hasAction('DEVOLUCIONES', 'ANULAR');

    const { selectedSucursal, selectedCiudad } = useFilters();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedClientFilter, setSelectedClientFilter] = useState('all');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Product selectors for adding
    const [selectedDevueltoToAdd, setSelectedDevueltoToAdd] = useState('');
    const [selectedRepuestoToAdd, setSelectedRepuestoToAdd] = useState('');

    // Form State (Dual section: Devolución + Reposición)
    const [newReturn, setNewReturn] = useState<any>({
        id: null,
        numero: '',
        clienteId: '',
        sucursalId: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        observaciones: '',
        detallesDevueltos: [],
        detallesReposicion: []
    });

    const { data: returns, isLoading } = useQuery({
        queryKey: ['returns'],
        queryFn: returnService.getAll,
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientService.getAll(),
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

    const createMutation = useMutation({
        mutationFn: returnService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['returns'] });
            queryClient.invalidateQueries({ queryKey: ['inventarios'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            setIsCreating(false);
            resetForm();
            toast.success('Devolución y reposición registrada exitosamente');
        },
        onError: (err: any) => {
            setError(err.response?.data?.message || 'Error al registrar la devolución');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number, data: any }) => returnService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['returns'] });
            queryClient.invalidateQueries({ queryKey: ['inventarios'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            setIsCreating(false);
            resetForm();
            toast.success('Devolución actualizada exitosamente');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message;
            setError(Array.isArray(msg) ? msg.join(', ') : (msg || 'Error al actualizar la devolución'));
        }
    });

    const confirmMutation = useMutation({
        mutationFn: returnService.confirmar,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['returns'] });
            queryClient.invalidateQueries({ queryKey: ['inventarios'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            toast.success('Devolución confirmada. Stock de reposición e ingreso actualizados.');
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Error al confirmar la devolución')
    });

    const anularMutation = useMutation({
        mutationFn: returnService.anular,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['returns'] });
            queryClient.invalidateQueries({ queryKey: ['inventarios'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            toast.success('Devolución anulada exitosamente');
            setAnularConfirmId(null);
        },
        onError: (e: any) => toast.error(e.response?.data?.message || 'Error al anular la devolución')
    });

    const resetForm = () => {
        setNewReturn({
            id: null,
            numero: '',
            clienteId: '',
            sucursalId: selectedSucursal ? String(selectedSucursal) : (filteredSucursales.length > 0 ? String(filteredSucursales[0].id) : ''),
            fecha: format(new Date(), 'yyyy-MM-dd'),
            observaciones: '',
            detallesDevueltos: [],
            detallesReposicion: []
        });
        setSelectedDevueltoToAdd('');
        setSelectedRepuestoToAdd('');
        setIsEditing(false);
        setIsViewing(false);
        setError(null);
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreating(true);
    };

    const openViewModal = (nota: any) => {
        const devueltos = (nota.detalles || [])
            .filter((d: any) => d.tipoMovimiento !== 'SALIDA_REPOSICION')
            .map((d: any) => ({
                id: d.id,
                producto: d.producto,
                productoId: d.producto?.id,
                cantidad: Number(d.cantidad || 1),
                precioUnitario: Number(d.precioUnitario || 0),
                motivoDefecto: d.motivoDefecto || 'Abollado / Dañado',
                destinoProducto: d.destinoProducto || 'REINGRESO_STOCK',
            }));

        const reposicion = (nota.detalles || [])
            .filter((d: any) => d.tipoMovimiento === 'SALIDA_REPOSICION')
            .map((d: any) => ({
                id: d.id,
                producto: d.producto,
                productoId: d.producto?.id,
                cantidad: Number(d.cantidad || 1),
                precioUnitario: Number(d.precioUnitario || 0),
                numeroLote: d.numeroLote || '',
                fechaVencimiento: d.fechaVencimiento ? String(d.fechaVencimiento).substring(0, 10) : '',
            }));

        setNewReturn({
            id: nota.id,
            numero: nota.numero,
            clienteId: nota.cliente?.id || '',
            sucursalId: nota.sucursal?.id || '',
            fecha: nota.fecha ? String(nota.fecha).substring(0, 10) : '',
            observaciones: nota.observaciones || '',
            detallesDevueltos: devueltos,
            detallesReposicion: reposicion
        });
        setIsEditing(false);
        setIsViewing(true);
        setIsCreating(true);
    };

    const openEditModal = (nota: any) => {
        const devueltos = (nota.detalles || [])
            .filter((d: any) => d.tipoMovimiento !== 'SALIDA_REPOSICION')
            .map((d: any) => ({
                id: d.id,
                producto: d.producto,
                productoId: d.producto?.id,
                cantidad: Number(d.cantidad || 1),
                precioUnitario: Number(d.precioUnitario || 0),
                motivoDefecto: d.motivoDefecto || 'Abollado / Dañado',
                destinoProducto: d.destinoProducto || 'REINGRESO_STOCK',
            }));

        const reposicion = (nota.detalles || [])
            .filter((d: any) => d.tipoMovimiento === 'SALIDA_REPOSICION')
            .map((d: any) => ({
                id: d.id,
                producto: d.producto,
                productoId: d.producto?.id,
                cantidad: Number(d.cantidad || 1),
                precioUnitario: Number(d.precioUnitario || 0),
                numeroLote: d.numeroLote || '',
                fechaVencimiento: d.fechaVencimiento ? String(d.fechaVencimiento).substring(0, 10) : '',
            }));

        setNewReturn({
            id: nota.id,
            numero: nota.numero,
            clienteId: nota.cliente?.id || '',
            sucursalId: nota.sucursal?.id || '',
            fecha: nota.fecha ? String(nota.fecha).substring(0, 10) : '',
            observaciones: nota.observaciones || '',
            detallesDevueltos: devueltos,
            detallesReposicion: reposicion
        });
        setIsEditing(true);
        setIsViewing(false);
        setIsCreating(true);
    };

    // Handlers for Devueltos
    const handleAddDevuelto = () => {
        if (!selectedDevueltoToAdd) return;
        const prod = products?.find(p => p.id === Number(selectedDevueltoToAdd));
        if (!prod) return;

        const exists = newReturn.detallesDevueltos.find((d: any) => (d.producto?.id || d.productoId) === prod.id);
        if (exists) {
            toast.info('El producto ya está en la lista de devueltos');
            return;
        }

        const precio = Number(prod.precioVenta) || 0;
        setNewReturn({
            ...newReturn,
            detallesDevueltos: [
                ...newReturn.detallesDevueltos,
                {
                    producto: prod,
                    productoId: prod.id,
                    cantidad: 1,
                    precioUnitario: precio,
                    motivoDefecto: 'Abollado / Dañado',
                    destinoProducto: 'REINGRESO_STOCK'
                }
            ]
        });
        setSelectedDevueltoToAdd('');
    };

    const updateDevuelto = (index: number, field: string, value: any) => {
        const list = [...newReturn.detallesDevueltos];
        list[index] = { ...list[index], [field]: value };
        setNewReturn({ ...newReturn, detallesDevueltos: list });
    };

    const removeDevuelto = (index: number) => {
        const list = newReturn.detallesDevueltos.filter((_: any, i: number) => i !== index);
        setNewReturn({ ...newReturn, detallesDevueltos: list });
    };

    // Handlers for Reposición
    const handleAddRepuesto = () => {
        if (!selectedRepuestoToAdd) return;
        const prod = products?.find(p => p.id === Number(selectedRepuestoToAdd));
        if (!prod) return;

        const exists = newReturn.detallesReposicion.find((d: any) => (d.producto?.id || d.productoId) === prod.id);
        if (exists) {
            toast.info('El producto ya está en la lista de reposición');
            return;
        }

        const precio = Number(prod.precioVenta) || 0;
        setNewReturn({
            ...newReturn,
            detallesReposicion: [
                ...newReturn.detallesReposicion,
                {
                    producto: prod,
                    productoId: prod.id,
                    cantidad: 1,
                    precioUnitario: precio,
                    numeroLote: '',
                    fechaVencimiento: ''
                }
            ]
        });
        setSelectedRepuestoToAdd('');
    };

    const updateRepuesto = (index: number, field: string, value: any) => {
        const list = [...newReturn.detallesReposicion];
        list[index] = { ...list[index], [field]: value };
        setNewReturn({ ...newReturn, detallesReposicion: list });
    };

    const removeRepuesto = (index: number) => {
        const list = newReturn.detallesReposicion.filter((_: any, i: number) => i !== index);
        setNewReturn({ ...newReturn, detallesReposicion: list });
    };

    // Quick Action: Copy Devueltos to Reposición 1-to-1
    const handleCopyDevueltosToReposicion = () => {
        if (newReturn.detallesDevueltos.length === 0) {
            toast.info('Añade primero los productos devueltos por el cliente');
            return;
        }
        const copied = newReturn.detallesDevueltos.map((d: any) => ({
            producto: d.producto,
            productoId: d.productoId || d.producto?.id,
            cantidad: Number(d.cantidad || 1),
            precioUnitario: Number(d.precioUnitario || 0),
            numeroLote: '',
            fechaVencimiento: ''
        }));
        setNewReturn({ ...newReturn, detallesReposicion: copied });
        toast.success('Se agregaron los mismos productos a la lista de reposición');
    };

    // Totals calculations
    const totals = useMemo(() => {
        const totalDevueltoCant = (newReturn.detallesDevueltos || []).reduce((sum: number, d: any) => sum + (Number(d.cantidad) || 0), 0);
        const totalRepuestoCant = (newReturn.detallesReposicion || []).reduce((sum: number, d: any) => sum + (Number(d.cantidad) || 0), 0);
        const valorDevuelto = (newReturn.detallesDevueltos || []).reduce((sum: number, d: any) => sum + ((Number(d.cantidad) || 0) * (Number(d.precioUnitario) || 0)), 0);
        const valorRepuesto = (newReturn.detallesReposicion || []).reduce((sum: number, d: any) => sum + ((Number(d.cantidad) || 0) * (Number(d.precioUnitario) || 0)), 0);

        return {
            totalDevueltoCant,
            totalRepuestoCant,
            valorDevuelto,
            valorRepuesto,
        };
    }, [newReturn.detallesDevueltos, newReturn.detallesReposicion]);

    // Submit handler
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newReturn.detallesDevueltos || newReturn.detallesDevueltos.length === 0) {
            setError('Debe añadir al menos un producto devuelto por el cliente');
            return;
        }

        const allDetalles = [
            ...newReturn.detallesDevueltos.map((d: any) => ({
                producto: { id: d.productoId || d.producto?.id },
                cantidad: Number(d.cantidad || 1),
                precioUnitario: Number(d.precioUnitario || 0),
                descuento: 0,
                tipoMovimiento: 'ENTRADA_DEVOLUCION',
                motivoDefecto: d.motivoDefecto || 'Abollado / Dañado',
                destinoProducto: d.destinoProducto || 'REINGRESO_STOCK',
            })),
            ...newReturn.detallesReposicion.map((d: any) => ({
                producto: { id: d.productoId || d.producto?.id },
                cantidad: Number(d.cantidad || 1),
                precioUnitario: Number(d.precioUnitario || 0),
                descuento: 0,
                tipoMovimiento: 'SALIDA_REPOSICION',
                numeroLote: d.numeroLote || null,
                fechaVencimiento: d.fechaVencimiento || null,
            }))
        ];

        const payload = {
            cliente: newReturn.clienteId ? { id: Number(newReturn.clienteId) } : null,
            sucursal: newReturn.sucursalId ? { id: Number(newReturn.sucursalId) } : (selectedSucursal ? { id: Number(selectedSucursal) } : null),
            fecha: newReturn.fecha,
            observaciones: newReturn.observaciones,
            descuentoPorcentaje: 0,
            descuentoPromocionPorcentaje: 0,
            total: 0,
            subtotal: 0,
            saldo: 0,
            detalles: allDetalles
        };

        if (isEditing && newReturn.id) {
            updateMutation.mutate({ id: newReturn.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    // Print Individual Return & Replacement Voucher PDF
    const handlePrintIndividualDevolucion = async () => {
        const doc = new jsPDF();
        try {
            const logoBase64 = await getBase64ImageFromURL('/logo.jpeg');
            doc.addImage(logoBase64, 'JPEG', 14, 10, 38, 16);
        } catch (e) {
            console.warn('Could not load logo for PDF', e);
        }

        doc.setFontSize(14);
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.text(`ACTA DE DEVOLUCIÓN Y REPOSICIÓN`, 196, 16, { align: 'right' });
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.text(`N° ${newReturn.numero || (newReturn.id ? 'DEV-' + String(newReturn.id).padStart(6, '0') : 'S/N')}`, 196, 22, { align: 'right' });

        doc.setTextColor(70, 70, 70);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        let currentY = 34;
        
        const fechaFormatted = newReturn.fecha ? newReturn.fecha.split('T')[0].split('-').reverse().join('/') : '-';
        doc.text(`Fecha: ${fechaFormatted}`, 14, currentY);
        
        let sucursalNombre = '-';
        if (newReturn.sucursalId) {
            const s = sucursales?.find(su => su.id.toString() === newReturn.sucursalId.toString());
            if (s) sucursalNombre = `${s.nombre} ${(s.ciudad as any)?.nombre ? `(${(s.ciudad as any).nombre})` : ''}`;
        } else if (newReturn.sucursal?.nombre) {
            sucursalNombre = `${newReturn.sucursal.nombre} ${(newReturn.sucursal.ciudad as any)?.nombre ? `(${(newReturn.sucursal.ciudad as any).nombre})` : ''}`;
        }
        doc.text(`Sucursal: ${sucursalNombre}`, 105, currentY);
        currentY += 5;

        let clienteNombre = 'Cliente Final';
        if (newReturn.clienteId) {
            const c = clients?.find(cl => cl.id.toString() === newReturn.clienteId.toString());
            if (c) clienteNombre = `${c.persona.nombres} ${c.persona.apellidos}`;
        } else if (newReturn.cliente?.persona) {
            clienteNombre = `${newReturn.cliente.persona.nombres} ${newReturn.cliente.persona.apellidos}`;
        }
        doc.text(`Cliente: ${clienteNombre}`, 14, currentY);
        doc.text(`Tipo: Cambio / Reposición por Garantía (Sin Dinero)`, 105, currentY);
        currentY += 5;

        if (newReturn.observaciones) {
            doc.text(`Observaciones: ${newReturn.observaciones}`, 14, currentY);
            currentY += 5;
        }

        // 1. Tabla de Productos Devueltos
        currentY += 3;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38);
        doc.text(`1. PRODUCTOS RECIBIDOS DEL CLIENTE (DEVOLUCIÓN POR DEFECTO)`, 14, currentY);
        currentY += 2;

        const tableDevueltosCol = ["Código", "Producto", "Cant.", "Motivo Defecto", "Destino Producto"];
        const tableDevueltosRows = (newReturn.detallesDevueltos || []).map((det: any) => {
            const destinoLabel = DESTINOS_PRODUCTO.find(d => d.value === det.destinoProducto)?.label || 'Reingreso a Stock';
            return [
                det.producto?.codigo || '-',
                det.producto?.nombre || '-',
                det.cantidad.toString(),
                det.motivoDefecto || 'Abollado / Defectuoso',
                destinoLabel
            ];
        });

        autoTable(doc, {
            startY: currentY + 1,
            head: [tableDevueltosCol],
            body: tableDevueltosRows.length > 0 ? tableDevueltosRows : [["-", "Sin productos devueltos", "0", "-", "-"]],
            styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5 },
            headStyles: { fillColor: [220, 38, 38], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [254, 242, 242] },
            columnStyles: {
                0: { cellWidth: 26 },
                2: { halign: 'center', cellWidth: 16 },
                3: { cellWidth: 45 },
                4: { cellWidth: 45 }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;

        // 2. Tabla de Productos de Reposición
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(16, 185, 129);
        doc.text(`2. PRODUCTOS ENTREGADOS EN REPOSICIÓN (SALIDA DE ALMACÉN)`, 14, currentY);
        currentY += 2;

        const tableRepuestosCol = ["Código", "Producto", "Cant.", "N° Lote", "F. Venc."];
        const tableRepuestosRows = (newReturn.detallesReposicion || []).map((det: any) => {
            const fVenc = det.fechaVencimiento ? String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : '-';
            return [
                det.producto?.codigo || '-',
                det.producto?.nombre || '-',
                det.cantidad.toString(),
                det.numeroLote || '-',
                fVenc
            ];
        });

        autoTable(doc, {
            startY: currentY + 1,
            head: [tableRepuestosCol],
            body: tableRepuestosRows.length > 0 ? tableRepuestosRows : [["-", "Sin productos de reposición", "0", "-", "-"]],
            styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.5 },
            headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            columnStyles: {
                0: { cellWidth: 26 },
                2: { halign: 'center', cellWidth: 16 },
                3: { cellWidth: 35 },
                4: { cellWidth: 30 }
            }
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;

        // Resumen Financiero: 0 Bs
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(14, currentY, 182, 14, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Total Unidades Devueltas: ${totals.totalDevueltoCant}`, 18, currentY + 9);
        doc.text(`Total Unidades Repuestas: ${totals.totalRepuestoCant}`, 75, currentY + 9);
        doc.setTextColor(5, 122, 85);
        doc.text(`Movimiento de Dinero: Bs. 0.00 (Garantía)`, 192, currentY + 9, { align: 'right' });

        // Firmas (Espacio amplio para firma y sello)
        currentY += 40;
        doc.setDrawColor(160, 160, 160);
        doc.line(24, currentY, 84, currentY);
        doc.line(126, currentY, 186, currentY);

        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text("Entregué Conforme (Almacén)", 54, currentY + 5, { align: 'center' });
        doc.text("Recibí Conforme (Cliente)", 156, currentY + 5, { align: 'center' });

        window.open(doc.output('bloburl'), '_blank');
    };

    // Filter data for main table
    const filteredReturns = useMemo(() => {
        if (!returns) return [];
        let filtered = returns;

        if (selectedSucursal) {
            filtered = filtered.filter(r => r.sucursal?.id === Number(selectedSucursal) || (r.almacen as any)?.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(r => (r.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (r.almacen as any)?.sucursal?.ciudad?.id === Number(selectedCiudad));
        }

        if (selectedClientFilter !== 'all') {
            filtered = filtered.filter(r => r.cliente?.id === Number(selectedClientFilter));
        }

        if (fechaDesde) {
            filtered = filtered.filter(r => {
                const rFecha = r.fecha ? String(r.fecha).substring(0, 10) : '';
                return rFecha >= fechaDesde;
            });
        }

        if (fechaHasta) {
            filtered = filtered.filter(r => {
                const rFecha = r.fecha ? String(r.fecha).substring(0, 10) : '';
                return rFecha <= fechaHasta;
            });
        }

        if (search.trim()) {
            const s = search.toLowerCase();
            filtered = filtered.filter(r => {
                const num = r.numero?.toLowerCase() || '';
                const cliNombre = r.cliente?.persona ? `${r.cliente.persona.nombres} ${r.cliente.persona.apellidos}`.toLowerCase() : '';
                const obs = (r.observaciones || '').toLowerCase();
                return num.includes(s) || cliNombre.includes(s) || obs.includes(s);
            });
        }

        return filtered;
    }, [returns, search, selectedSucursal, selectedCiudad, selectedClientFilter, fechaDesde, fechaHasta]);

    const hasActiveFilters = Boolean(search || selectedClientFilter !== 'all' || fechaDesde || fechaHasta);

    const handleClearFilters = () => {
        setSearch('');
        setSelectedClientFilter('all');
        setFechaDesde('');
        setFechaHasta('');
    };

    // Export Data & Reports
    const exportColumns = [
        { header: 'N° Devolución', dataKey: 'numero' },
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Cliente', dataKey: 'cliente_nombre' },
        { header: 'Sucursal', dataKey: 'sucursal_nombre' },
        { header: 'Cant. Devuelta', dataKey: 'cant_devuelta' },
        { header: 'Cant. Repuesta', dataKey: 'cant_repuesta' },
        { header: 'Estado', dataKey: 'estado' },
    ];

    const getExportData = () => {
        return (filteredReturns || []).map(r => {
            const devueltos = (r.detalles || []).filter((d: any) => d.tipoMovimiento !== 'SALIDA_REPOSICION');
            const repuestos = (r.detalles || []).filter((d: any) => d.tipoMovimiento === 'SALIDA_REPOSICION');
            const totalDevCant = devueltos.reduce((s: number, d: any) => s + Number(d.cantidad || 0), 0);
            const totalRepCant = repuestos.reduce((s: number, d: any) => s + Number(d.cantidad || 0), 0);
            const sucursalNombre = r.sucursal ? `${r.sucursal.nombre}${(r.sucursal.ciudad as any)?.nombre ? ` (${(r.sucursal.ciudad as any).nombre})` : ''}` : '-';

            return {
                numero: r.numero || '-',
                fecha: r.fecha ? String(r.fecha).substring(0, 10) : '-',
                cliente_nombre: r.cliente?.persona ? `${r.cliente.persona.nombres} ${r.cliente.persona.apellidos}` : 'Cliente Final',
                sucursal_nombre: sucursalNombre,
                cant_devuelta: totalDevCant.toString(),
                cant_repuesta: totalRepCant.toString(),
                estado: r.estado || '-',
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

        if (selectedClientFilter !== 'all') {
            const cli = clients?.find(cl => cl.id === Number(selectedClientFilter));
            const cliName = cli?.persona ? `${cli.persona.nombres} ${cli.persona.apellidos}`.trim() : 'Cliente Seleccionado';
            texts.push(`Cliente: ${cliName}`);
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

        return texts.length > 0 ? texts.join(' | ') : 'Todas las devoluciones';
    };

    const handlePrintReport = () => {
        if (!returns) return;
        printData('Reporte de Devoluciones y Reposición', exportColumns, getExportData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!returns) return;
        exportToPDF('Reporte de Devoluciones y Reposición', exportColumns, getExportData(), 'devoluciones_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!returns) return;
        exportToExcel(exportColumns, getExportData(), 'devoluciones_reporte');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Undo2 className="w-8 h-8 text-primary/80" />
                        Devoluciones
                    </h1>
                    <p className="text-muted-foreground italic">Gestión de cambio de productos defectuosos y reposición a clientes.</p>
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
                            onClick={openCreateModal}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Nueva Devolución
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search, Cliente, Fechas & Limpiar */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
                    <Search className="w-5 h-5 text-muted-foreground ml-1 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por nro, cliente u observaciones..."
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

                {/* Filtro por Cliente */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedClientFilter}
                        onChange={(e) => setSelectedClientFilter(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Clientes</option>
                        {clients?.map(c => {
                            const cName = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}`.trim() : '';
                            return (
                                <option key={c.id} value={c.id} className="bg-background text-foreground">
                                    {cName || 'Cliente Final'}
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

            {/* Main Table */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                            <th className="p-4">N° / Fecha</th>
                            <th className="p-4">Cliente</th>
                            {!selectedSucursal && <th className="p-4">Sucursal</th>}
                            <th className="p-4">Productos Devueltos</th>
                            <th className="p-4">Productos Repuestos</th>
                            <th className="p-4 text-center">Estado</th>
                            <th className="p-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y text-xs">
                        {isLoading && (
                            <tr>
                                <td colSpan={6 + (!selectedSucursal ? 1 : 0)} className="p-8 text-center text-muted-foreground animate-pulse">
                                    Cargando devoluciones...
                                </td>
                            </tr>
                        )}
                        {!isLoading && filteredReturns?.length === 0 && (
                            <tr>
                                <td colSpan={6 + (!selectedSucursal ? 1 : 0)} className="p-8 text-center text-muted-foreground italic">
                                    No se encontraron devoluciones registradas.
                                </td>
                            </tr>
                        )}
                        {filteredReturns?.map((r) => {
                            const devueltos = (r.detalles || []).filter((d: any) => d.tipoMovimiento !== 'SALIDA_REPOSICION');
                            const repuestos = (r.detalles || []).filter((d: any) => d.tipoMovimiento === 'SALIDA_REPOSICION');

                            const totalDevCant = devueltos.reduce((s: number, d: any) => s + Number(d.cantidad || 0), 0);
                            const totalRepCant = repuestos.reduce((s: number, d: any) => s + Number(d.cantidad || 0), 0);

                            return (
                                <tr key={r.id} className="hover:bg-accent/40 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-primary text-xs">{r.numero}</span>
                                            <span className="text-[11px] text-muted-foreground">{r.fecha ? String(r.fecha).substring(0, 10).split('-').reverse().join('/') : '---'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">
                                                {r.cliente?.persona ? `${r.cliente.persona.nombres} ${r.cliente.persona.apellidos}` : 'Cliente Final'}
                                            </span>
                                            {r.cliente?.persona?.ci && <span className="text-[10px] text-muted-foreground font-mono">CI: {r.cliente.persona.ci}</span>}
                                        </div>
                                    </td>
                                    {!selectedSucursal && (
                                        <td className="p-4">
                                            <span className="font-medium text-muted-foreground">
                                                {r.sucursal ? `${r.sucursal.nombre} ${(r.sucursal.ciudad as any)?.nombre ? `(${(r.sucursal.ciudad as any).nombre})` : ''}` : '---'}
                                            </span>
                                        </td>
                                    )}
                                    <td className="p-4">
                                        <div className="space-y-1 max-w-[280px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-700 shadow-2xs">
                                                    <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" /> {totalDevCant} devuelto{totalDevCant === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate">
                                                {devueltos.map((d: any) => `${d.producto?.nombre || 'Prod.'} (x${d.cantidad})`).join(', ') || 'Sin items'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="space-y-1 max-w-[280px]">
                                            <div className="flex items-center gap-1.5">
                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                                                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> {totalRepCant} repuesto{totalRepCant === 1 ? '' : 's'}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-muted-foreground truncate">
                                                {repuestos.map((d: any) => `${d.producto?.nombre || 'Prod.'} (x${d.cantidad})`).join(', ') || 'Sin reposición'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                            ${r.estado === EstadoNota.CONFIRMADA ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' :
                                                r.estado === EstadoNota.PENDIENTE ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-700' :
                                                    'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-700'}`}>
                                            {r.estado}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2 flex-wrap">
                                            {/* Ver detalle */}
                                            <button
                                                onClick={() => openViewModal(r)}
                                                className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                title="Ver Detalle"
                                            >
                                                <Eye className="w-3" /> Ver
                                            </button>

                                            {/* Confirmar (solo pendientes) */}
                                            {r.estado === EstadoNota.PENDIENTE && (
                                                <button
                                                    onClick={() => confirmMutation.mutate(r.id)}
                                                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    title="Confirmar Devolución e Intercambio"
                                                >
                                                    <CheckCircle className="w-3" /> Confirmar
                                                </button>
                                            )}

                                            {/* Editar (solo pendientes) */}
                                            {r.estado === EstadoNota.PENDIENTE && (
                                                <button
                                                    onClick={() => openEditModal(r)}
                                                    className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                                                    title="Editar Devolución"
                                                >
                                                    <Edit className="w-3" /> Editar
                                                </button>
                                            )}

                                            {/* Anular (solo confirmadas o pendientes) */}
                                            {r.estado !== EstadoNota.ANULADA && (
                                                <button
                                                    onClick={() => setAnularConfirmId(r.id)}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    title="Anular Devolución"
                                                >
                                                    <Ban className="w-3" /> Anular
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

            {/* Modal Sheet de Registro / Edición / Vista */}
            <Sheet
                isOpen={isCreating}
                onClose={() => { setIsCreating(false); resetForm(); }}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Undo2 className="w-6 h-6 text-primary/80" />
                        {isViewing ? `Detalle de Devolución (${newReturn.numero})` : (isEditing ? `Editar Devolución (${newReturn.numero})` : 'Nueva Devolución')}
                    </span>
                }
                className="max-w-5xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pb-28">
                    {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

                    {/* Cabecera: 1. Fecha | 2. Sucursal | 3. Cliente */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-muted/20 p-4 rounded-xl border">
                        {/* 1. Fecha */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha
                            </label>
                            <input
                                type="date"
                                disabled={isViewing}
                                value={newReturn.fecha}
                                onChange={(e) => setNewReturn({ ...newReturn, fecha: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                                required
                            />
                        </div>

                        {/* 2. Sucursal */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary" /> Sucursal
                            </label>
                            <select
                                disabled={isViewing}
                                value={newReturn.sucursalId}
                                onChange={(e) => setNewReturn({ ...newReturn, sucursalId: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                            >
                                <option value="">Seleccione sucursal...</option>
                                {filteredSucursales?.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre} {(s.ciudad as any)?.nombre ? `(${(s.ciudad as any).nombre})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* 3. Cliente */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-primary" /> Cliente
                            </label>
                            <select
                                disabled={isViewing}
                                value={newReturn.clienteId}
                                onChange={(e) => setNewReturn({ ...newReturn, clienteId: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-75"
                            >
                                <option value="">Cliente Final (Sin registrar)</option>
                                {clients?.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.persona.nombres} {c.persona.apellidos} {c.persona.ci ? `(CI: ${c.persona.ci})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* SECCIÓN 1: PRODUCTOS DEVUELTOS POR EL CLIENTE (ENTRADA) */}
                    <div className="space-y-3 p-5 rounded-2xl border bg-card shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                    <ArrowDownLeft className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">1. Productos Devueltos por el Cliente (Entrada)</h3>
                                    <p className="text-xs text-muted-foreground">Indica el producto con defecto recibido y su destino físico.</p>
                                </div>
                            </div>
                            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-700 px-3 py-1 rounded-full shadow-2xs">
                                {totals.totalDevueltoCant} unid{totals.totalDevueltoCant === 1 ? '' : 'es'}. recibida{totals.totalDevueltoCant === 1 ? '' : 's'}
                            </span>
                        </div>

                        {/* Selector de Producto Devuelto */}
                        {!isViewing && (
                            <div className="flex gap-2 pt-1">
                                <select
                                    value={selectedDevueltoToAdd}
                                    onChange={(e) => setSelectedDevueltoToAdd(e.target.value)}
                                    className="flex-1 p-2.5 border rounded-lg bg-background text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Selecciona el producto defectuoso que entrega el cliente...</option>
                                    {products?.filter(p => p.activo).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddDevuelto}
                                    disabled={!selectedDevueltoToAdd}
                                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>
                        )}

                        {/* Tabla de Devueltos */}
                        <div className="border rounded-xl overflow-hidden bg-background">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b text-[10px] font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Producto Defectuoso</th>
                                        <th className="p-3 text-center w-20">Cant.</th>
                                        <th className="p-3 w-48">Motivo del Defecto</th>
                                        <th className="p-3 w-56">Destino del Producto</th>
                                        {!isViewing && <th className="p-3 text-right w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {newReturn.detallesDevueltos.length === 0 && (
                                        <tr>
                                            <td colSpan={isViewing ? 4 : 5} className="p-6 text-center text-muted-foreground italic text-xs">
                                                No hay productos devueltos añadidos.
                                            </td>
                                        </tr>
                                    )}
                                    {newReturn.detallesDevueltos.map((det: any, index: number) => (
                                        <tr key={index} className="hover:bg-accent/30 transition-colors">
                                            <td className="p-3">
                                                <div className="font-semibold text-xs text-foreground">{det.producto?.nombre}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{det.producto?.codigo || '---'}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                {isViewing ? (
                                                    <span className="font-bold text-xs">{det.cantidad}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={det.cantidad}
                                                        onChange={(e) => updateDevuelto(index, 'cantidad', parseFloat(e.target.value) || 1)}
                                                        className="w-16 p-1.5 border rounded text-center text-xs font-bold"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {isViewing ? (
                                                    <span className="text-xs font-medium text-foreground">{det.motivoDefecto || 'Abollado'}</span>
                                                ) : (
                                                    <div className="space-y-1">
                                                        <select
                                                            value={det.motivoDefecto}
                                                            onChange={(e) => updateDevuelto(index, 'motivoDefecto', e.target.value)}
                                                            className="w-full p-1.5 border rounded text-xs bg-background outline-none font-medium"
                                                        >
                                                            {DEFECT_PRESETS.map(m => (
                                                                <option key={m} value={m}>{m}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {isViewing ? (
                                                    <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold border ${DESTINOS_PRODUCTO.find(d => d.value === det.destinoProducto)?.badge}`}>
                                                        {DESTINOS_PRODUCTO.find(d => d.value === det.destinoProducto)?.label || 'Reingreso Stock'}
                                                    </span>
                                                ) : (
                                                    <select
                                                        value={det.destinoProducto || 'REINGRESO_STOCK'}
                                                        onChange={(e) => updateDevuelto(index, 'destinoProducto', e.target.value)}
                                                        className="w-full p-1.5 border rounded text-xs bg-background outline-none font-semibold text-foreground"
                                                    >
                                                        {DESTINOS_PRODUCTO.map(dest => (
                                                            <option key={dest.value} value={dest.value}>{dest.label}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </td>
                                            {!isViewing && (
                                                <td className="p-3 text-right">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeDevuelto(index)} 
                                                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* SECCIÓN 2: PRODUCTOS ENTREGADOS EN REPOSICIÓN (SALIDA) */}
                    <div className="space-y-3 p-5 rounded-2xl border bg-card shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                    <ArrowUpRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-foreground">2. Productos Entregados en Reposición (Salida)</h3>
                                    <p className="text-xs text-muted-foreground">Selecciona los productos nuevos que se entregan al cliente para reponer el defectuoso.</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!isViewing && newReturn.detallesDevueltos.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleCopyDevueltosToReposicion}
                                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                        title="Copiar los mismos productos devueltos a la reposición 1 a 1"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Reponer mismos productos (1 a 1)
                                    </button>
                                )}
                                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 px-3 py-1 rounded-full shadow-2xs">
                                    {totals.totalRepuestoCant} unid{totals.totalRepuestoCant === 1 ? '' : 'es'}. entregada{totals.totalRepuestoCant === 1 ? '' : 's'}
                                </span>
                            </div>
                        </div>

                        {/* Selector de Producto de Reposición */}
                        {!isViewing && (
                            <div className="flex gap-2 pt-1">
                                <select
                                    value={selectedRepuestoToAdd}
                                    onChange={(e) => setSelectedRepuestoToAdd(e.target.value)}
                                    className="flex-1 p-2.5 border rounded-lg bg-background text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Selecciona el producto nuevo a entregar al cliente...</option>
                                    {products?.filter(p => p.activo).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.codigo ? `[${p.codigo}] ` : ''}{p.nombre}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={handleAddRepuesto}
                                    disabled={!selectedRepuestoToAdd}
                                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>
                        )}

                        {/* Tabla de Repuestos */}
                        <div className="border rounded-xl overflow-hidden bg-background">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/50 border-b text-[10px] font-bold uppercase text-muted-foreground">
                                    <tr>
                                        <th className="p-3">Producto Nuevo (Reposición)</th>
                                        <th className="p-3 text-center w-20">Cant.</th>
                                        <th className="p-3 w-40">N° Lote (Opcional)</th>
                                        <th className="p-3 w-36">F. Vencimiento</th>
                                        {!isViewing && <th className="p-3 text-right w-10"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {newReturn.detallesReposicion.length === 0 && (
                                        <tr>
                                            <td colSpan={isViewing ? 4 : 5} className="p-6 text-center text-muted-foreground italic text-xs">
                                                No hay productos de reposición añadidos.
                                            </td>
                                        </tr>
                                    )}
                                    {newReturn.detallesReposicion.map((det: any, index: number) => (
                                        <tr key={index} className="hover:bg-accent/30 transition-colors">
                                            <td className="p-3">
                                                <div className="font-semibold text-xs text-foreground">{det.producto?.nombre}</div>
                                                <div className="text-[10px] text-muted-foreground font-mono">{det.producto?.codigo || '---'}</div>
                                            </td>
                                            <td className="p-3 text-center">
                                                {isViewing ? (
                                                    <span className="font-bold text-xs">{det.cantidad}</span>
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={det.cantidad}
                                                        onChange={(e) => updateRepuesto(index, 'cantidad', parseFloat(e.target.value) || 1)}
                                                        className="w-16 p-1.5 border rounded text-center text-xs font-bold"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {isViewing ? (
                                                    <span className="text-xs text-muted-foreground font-mono">{det.numeroLote || '-'}</span>
                                                ) : (
                                                    <input
                                                        type="text"
                                                        placeholder="Lote automático..."
                                                        value={det.numeroLote || ''}
                                                        onChange={(e) => updateRepuesto(index, 'numeroLote', e.target.value)}
                                                        className="w-full p-1.5 border rounded text-xs bg-background"
                                                    />
                                                )}
                                            </td>
                                            <td className="p-3">
                                                {isViewing ? (
                                                    <span className="text-xs text-muted-foreground">{det.fechaVencimiento ? det.fechaVencimiento.split('-').reverse().join('/') : '-'}</span>
                                                ) : (
                                                    <input
                                                        type="date"
                                                        value={det.fechaVencimiento || ''}
                                                        onChange={(e) => updateRepuesto(index, 'fechaVencimiento', e.target.value)}
                                                        className="w-full p-1.5 border rounded text-xs bg-background"
                                                    />
                                                )}
                                            </td>
                                            {!isViewing && (
                                                <td className="p-3 text-right">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeRepuesto(index)} 
                                                        className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Observaciones */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground">Observaciones / Justificación de la Devolución</label>
                        <textarea
                            disabled={isViewing}
                            value={newReturn.observaciones}
                            onChange={(e) => setNewReturn({ ...newReturn, observaciones: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] disabled:opacity-75"
                            placeholder="Ej: Cambio de producto por daño de transporte, cliente solicitó reposición inmediata..."
                        />
                    </div>

                    {/* Footer con Resumen y Acciones */}
                    <div className="fixed bottom-0 right-0 w-full max-w-5xl p-4 md:p-6 bg-card border-t flex flex-wrap items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-20">
                        <div className="flex items-center gap-6">
                            {/* Resumen de Unidades */}
                            <div className="flex flex-col gap-0.5 border-r pr-6">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Balance de Intercambio</span>
                                <div className="flex items-center gap-3 text-xs font-bold">
                                    <span className="text-rose-700 dark:text-rose-400 font-bold">Devueltos: {totals.totalDevueltoCant}</span>
                                    <span className="text-muted-foreground">|</span>
                                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">Repuestos: {totals.totalRepuestoCant}</span>
                                </div>
                            </div>

                            {/* Total Dinero: Bs 0.00 */}
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                                    <Calculator className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" /> Movimiento de Dinero
                                </span>
                                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">Bs. 0.00 <span className="text-xs font-bold text-muted-foreground">(Cambio 1 a 1)</span></span>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => { setIsCreating(false); resetForm(); }}
                                className="px-6 py-2.5 border rounded-xl text-xs font-semibold hover:bg-accent active:scale-95 transition-all shadow-sm cursor-pointer"
                            >
                                {isViewing ? 'Cerrar' : 'Cancelar'}
                            </button>

                            {isViewing && (
                                <button
                                    type="button"
                                    onClick={handlePrintIndividualDevolucion}
                                    className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-xs font-bold shadow-md hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                                >
                                    <Printer className="w-4 h-4" /> Imprimir Comprobante
                                </button>
                            )}

                            {!isViewing && (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                                >
                                    <CheckCircle className="w-4 h-4" /> {isEditing ? 'Actualizar Devolución' : 'Guardar Devolución'}
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
                        Confirmar Anulación de Devolución
                    </span>
                }
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                        ¿Estás seguro de que deseas anular esta devolución? Si ya fue confirmada, el inventario ingresado y los productos de reposición descontados serán revertidos. Esta acción no se puede deshacer.
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => setAnularConfirmId(null)}
                            className="px-4 py-2 border rounded-lg text-xs font-medium hover:bg-accent transition-colors cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => anularConfirmId && anularMutation.mutate(anularConfirmId)}
                            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-2 cursor-pointer"
                        >
                            <Ban className="w-4 h-4" /> Confirmar Anulación
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default DevolucionesPage;
