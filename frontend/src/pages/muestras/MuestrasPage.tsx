import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { muestraService } from '../../api/muestraService';
import type { Muestra, CreateMuestraDto, UpdateMuestraDto } from '../../api/muestraService';
import { clientService } from '../../api/clientService';
import { productService } from '../../api/productService';
import { sucursalService } from '../../api/sucursalService';
import { personalService } from '../../api/personalService';
import { getCiudades } from '../../api/ciudadService';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import Sheet from '../../components/ui/Sheet';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromURL, exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { whatsappService } from '../../api/whatsappService';
import {
    Search, Plus, Eye, Edit, Trash2, RotateCcw,
    Printer, FileText, FileSpreadsheet, X, Save,
    ChevronLeft, ChevronRight, Check, Ban, Tag,
    User, Building2, Briefcase, Package, Calendar,
    AlertTriangle, ArrowLeft, MessageCircle, Send, Loader2, ExternalLink
} from 'lucide-react';

const MuestrasPage: React.FC = () => {
    const { isAdmin, hasAction, userPersonal } = useAuth();
    const canCreate = isAdmin || hasAction('MUESTRAS', 'CREAR');
    const canEdit = isAdmin || hasAction('MUESTRAS', 'EDITAR');
    const canReturn = isAdmin || hasAction('MUESTRAS', 'RETORNAR') || hasAction('MUESTRAS', 'CREAR');
    const canAnular = isAdmin || hasAction('MUESTRAS', 'ANULAR');

    const queryClient = useQueryClient();
    const { selectedSucursal, selectedCiudad } = useFilters();

    // Modal / Sheet states
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isViewing, setIsViewing] = useState(false);
    const [isReturning, setIsReturning] = useState(false);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);

    // Filters & pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [estadoFilter, setEstadoFilter] = useState<string>('TODOS');
    const [clienteFilter, setClienteFilter] = useState<string>('all');
    const [vendedorFilter, setVendedorFilter] = useState<string>('all');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Selected item
    const [currentMuestra, setCurrentMuestra] = useState<Muestra | null>(null);

    // WhatsApp State & Mutations
    const { data: whatsappBranches } = useQuery({
        queryKey: ['whatsapp-branches-status'],
        queryFn: () => whatsappService.getBranchesStatus(),
        staleTime: 10000,
    });

    const [whatsappModalData, setWhatsappModalData] = useState<{
        isOpen: boolean;
        muestra: Muestra | null;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        muestra: null,
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const sendWhatsAppMutation = useMutation({
        mutationFn: (payload: { muestraId: number; phone?: string; sucursalId?: number; message?: string }) =>
            muestraService.sendWhatsApp(payload.muestraId, payload.phone, payload.sucursalId, payload.message),
        onSuccess: (data) => {
            toast.success(data.message || 'Acta de entrega de muestras enviada exitosamente por WhatsApp');
            setWhatsappModalData(prev => ({ ...prev, isOpen: false, muestra: null }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar acta de muestras por WhatsApp');
        }
    });

    const handleOpenWhatsAppModal = (muestra: Muestra) => {
        const clientPhone = muestra.cliente?.persona?.telefono || '';
        const initialSucursalId = muestra.sucursal?.id 
            ? String(muestra.sucursal.id) 
            : (muestra.cliente?.sucursal?.id 
                ? String(muestra.cliente.sucursal.id) 
                : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : '')));

        setWhatsappModalData({
            isOpen: true,
            muestra,
            phone: clientPhone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    // Form state (Create / Edit)
    const [formFecha, setFormFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [formFechaEstimada, setFormFechaEstimada] = useState('');
    const [formClienteId, setFormClienteId] = useState<string>('');
    const [formSucursalId, setFormSucursalId] = useState<string>('');
    const [formVendedorId, setFormVendedorId] = useState<string>('');
    const [formObservaciones, setFormObservaciones] = useState('');
    const [formDetalles, setFormDetalles] = useState<Array<{
        productoId: number;
        productoNombre: string;
        productoCodigo: string;
        cantidadEntregada: number;
        numeroLote: string;
        fechaVencimiento: string;
        observaciones: string;
    }>>([]);

    // Product item adder state
    const [selectedProdId, setSelectedProdId] = useState<string>('');
    const [itemCantidad, setItemCantidad] = useState<number>(1);
    const [itemLote, setItemLote] = useState<string>('');
    const [itemVencimiento, setItemVencimiento] = useState<string>('');
    const [itemObs, setItemObs] = useState<string>('');

    // Return sheet state
    const [returnFecha, setReturnFecha] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [returnObs, setReturnObs] = useState('');
    const [returnItems, setReturnItems] = useState<Array<{
        id: number;
        productoNombre: string;
        productoCodigo: string;
        numeroLote?: string;
        cantidadEntregada: number;
        cantidadDevueltaPrevia: number;
        cantidadADevolver: number;
        observaciones: string;
    }>>([]);

    // Queries
    const { data: muestrasList, isLoading } = useQuery({
        queryKey: ['muestrasList', selectedSucursal, selectedCiudad],
        queryFn: () => muestraService.getAll(),
    });

    const { data: clientes } = useQuery({
        queryKey: ['clientsList'],
        queryFn: () => clientService.getAll(),
    });

    const { data: productos } = useQuery({
        queryKey: ['productsList'],
        queryFn: () => productService.getAll(),
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursalesList'],
        queryFn: sucursalService.getAll,
    });

    const { data: personal } = useQuery({
        queryKey: ['personalList'],
        queryFn: personalService.getAll,
    });

    const { data: ciudades } = useQuery({
        queryKey: ['ciudadesList'],
        queryFn: getCiudades,
    });

    // Filter sucursales based on global top header filters
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

    // Check active filters
    const hasActiveFilters = Boolean(
        searchTerm ||
        estadoFilter !== 'TODOS' ||
        clienteFilter !== 'all' ||
        vendedorFilter !== 'all' ||
        fechaDesde ||
        fechaHasta
    );

    const handleClearFilters = () => {
        setSearchTerm('');
        setEstadoFilter('TODOS');
        setClienteFilter('all');
        setVendedorFilter('all');
        setFechaDesde('');
        setFechaHasta('');
    };

    // Filtered muestras list
    const filteredMuestras = useMemo(() => {
        if (!muestrasList) return [];
        return muestrasList.filter(m => {
            if (selectedSucursal && m.sucursal?.id !== Number(selectedSucursal)) return false;
            if (selectedCiudad && (m.sucursal?.ciudad as any)?.id !== Number(selectedCiudad)) return false;
            if (estadoFilter !== 'TODOS' && m.estado !== estadoFilter) return false;
            if (clienteFilter !== 'all' && m.cliente?.id !== Number(clienteFilter)) return false;
            if (vendedorFilter !== 'all' && m.vendedor?.id !== Number(vendedorFilter)) return false;

            if (fechaDesde) {
                const fMuestra = m.fecha ? m.fecha.split('T')[0] : '';
                if (fMuestra < fechaDesde) return false;
            }
            if (fechaHasta) {
                const fMuestra = m.fecha ? m.fecha.split('T')[0] : '';
                if (fMuestra > fechaHasta) return false;
            }

            if (searchTerm.trim()) {
                const term = searchTerm.toLowerCase();
                const num = (m.numero || '').toLowerCase();
                const clienteNombre = `${m.cliente?.persona?.nombres || ''} ${m.cliente?.persona?.apellidos || ''}`.toLowerCase();
                const vendedorNombre = `${m.vendedor?.nombres || ''} ${m.vendedor?.apellidos || ''}`.toLowerCase();
                const hasProduct = m.detalles?.some(d =>
                    (d.producto?.nombre || '').toLowerCase().includes(term) ||
                    (d.producto?.codigo || '').toLowerCase().includes(term) ||
                    (d.numeroLote || '').toLowerCase().includes(term)
                );
                return num.includes(term) || clienteNombre.includes(term) || vendedorNombre.includes(term) || hasProduct;
            }
            return true;
        });
    }, [muestrasList, selectedSucursal, selectedCiudad, estadoFilter, clienteFilter, vendedorFilter, fechaDesde, fechaHasta, searchTerm]);

    const totalPages = Math.ceil(filteredMuestras.length / itemsPerPage) || 1;
    const paginatedMuestras = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredMuestras.slice(start, start + itemsPerPage);
    }, [filteredMuestras, currentPage]);

    React.useEffect(() => setCurrentPage(1), [searchTerm, estadoFilter, clienteFilter, vendedorFilter, fechaDesde, fechaHasta]);

    // Mutations
    const createMutation = useMutation({
        mutationFn: (dto: CreateMuestraDto) => muestraService.create(dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['muestrasList'] });
            toast.success('Muestra creada con éxito');
            setIsCreating(false);
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Ocurrió un error al registrar la muestra');
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, dto }: { id: number; dto: UpdateMuestraDto }) => muestraService.update(id, dto),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['muestrasList'] });
            toast.success('Muestra actualizada con éxito');
            setIsEditing(false);
            setCurrentMuestra(null);
            resetForm();
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Ocurrió un error al actualizar la muestra');
        }
    });

    const devolucionMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => muestraService.registrarDevolucion(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['muestrasList'] });
            toast.success('Devolución registrada con éxito');
            setIsReturning(false);
            setCurrentMuestra(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Ocurrió un error al registrar la devolución');
        }
    });

    const anularMutation = useMutation({
        mutationFn: (id: number) => muestraService.anular(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['muestrasList'] });
            toast.error('Muestra anulada');
            setAnularConfirmId(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Ocurrió un error al anular la muestra');
        }
    });

    // Reset Form
    const resetForm = () => {
        setFormFecha(format(new Date(), 'yyyy-MM-dd'));
        setFormFechaEstimada('');
        setFormClienteId('');
        setFormSucursalId(selectedSucursal || (filteredSucursales[0]?.id?.toString() || ''));
        setFormVendedorId('');
        setFormObservaciones('');
        setFormDetalles([]);
        setSelectedProdId('');
        setItemCantidad(1);
        setItemLote('');
        setItemVencimiento('');
        setItemObs('');
    };

    const handleOpenCreate = () => {
        resetForm();
        if (selectedSucursal) {
            setFormSucursalId(selectedSucursal);
        } else if (filteredSucursales.length > 0) {
            setFormSucursalId(filteredSucursales[0].id.toString());
        }
        setIsCreating(true);
    };

    const handleOpenEdit = (m: Muestra) => {
        setCurrentMuestra(m);
        setFormFecha(m.fecha ? m.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
        setFormFechaEstimada(m.fechaEstimadaDevolucion ? m.fechaEstimadaDevolucion.split('T')[0] : '');
        setFormClienteId(m.cliente?.id?.toString() || '');
        setFormSucursalId(m.sucursal?.id?.toString() || '');
        setFormVendedorId(m.vendedor?.id?.toString() || '');
        setFormObservaciones(m.observaciones || '');
        setFormDetalles((m.detalles || []).map(d => ({
            productoId: d.producto?.id,
            productoNombre: d.producto?.nombre,
            productoCodigo: d.producto?.codigo,
            cantidadEntregada: d.cantidadEntregada,
            numeroLote: d.numeroLote || '',
            fechaVencimiento: d.fechaVencimiento ? d.fechaVencimiento.split('T')[0] : '',
            observaciones: d.observaciones || '',
        })));
        setIsEditing(true);
    };

    const handleOpenReturn = (m: Muestra) => {
        setCurrentMuestra(m);
        setReturnFecha(format(new Date(), 'yyyy-MM-dd'));
        setReturnObs('');
        setReturnItems((m.detalles || []).map(d => {
            const restante = Math.max(0, Number(d.cantidadEntregada) - Number(d.cantidadDevuelta || 0));
            return {
                id: d.id,
                productoNombre: d.producto?.nombre || 'Producto',
                productoCodigo: d.producto?.codigo || '-',
                numeroLote: d.numeroLote || '',
                cantidadEntregada: Number(d.cantidadEntregada),
                cantidadDevueltaPrevia: Number(d.cantidadDevuelta || 0),
                cantidadADevolver: restante,
                observaciones: d.observaciones || '',
            };
        }));
        setIsReturning(true);
    };

    const handleAddProduct = () => {
        if (!selectedProdId) {
            toast.error('Selecciona un producto');
            return;
        }
        if (itemCantidad <= 0) {
            toast.error('La cantidad debe ser mayor a 0');
            return;
        }

        const prod = productos?.find(p => p.id === Number(selectedProdId));
        if (!prod) return;

        const exists = formDetalles.find(d => d.productoId === prod.id && d.numeroLote === itemLote);
        if (exists) {
            toast.error('El producto con este lote ya está en la lista');
            return;
        }

        setFormDetalles([
            ...formDetalles,
            {
                productoId: prod.id,
                productoNombre: prod.nombre,
                productoCodigo: prod.codigo,
                cantidadEntregada: itemCantidad,
                numeroLote: itemLote.trim(),
                fechaVencimiento: itemVencimiento,
                observaciones: itemObs.trim(),
            }
        ]);

        setSelectedProdId('');
        setItemCantidad(1);
        setItemLote('');
        setItemVencimiento('');
        setItemObs('');
    };

    const handleRemoveProduct = (index: number) => {
        setFormDetalles(formDetalles.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formClienteId) {
            toast.error('Selecciona un cliente');
            return;
        }
        if (formDetalles.length === 0) {
            toast.error('Debes agregar al menos un producto a la muestra');
            return;
        }

        const payload: CreateMuestraDto = {
            fecha: formFecha,
            fechaEstimadaDevolucion: formFechaEstimada || undefined,
            clienteId: Number(formClienteId),
            sucursalId: formSucursalId ? Number(formSucursalId) : undefined,
            vendedorId: formVendedorId ? Number(formVendedorId) : undefined,
            observaciones: formObservaciones.trim() || undefined,
            detalles: formDetalles.map(d => ({
                productoId: d.productoId,
                cantidadEntregada: d.cantidadEntregada,
                numeroLote: d.numeroLote || undefined,
                fechaVencimiento: d.fechaVencimiento || undefined,
                observaciones: d.observaciones || undefined,
            }))
        };

        if (isEditing && currentMuestra) {
            updateMutation.mutate({ id: currentMuestra.id, dto: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const handleSaveReturn = (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentMuestra) return;

        const itemsPayload = returnItems.map(item => {
            const totalDevuelta = item.cantidadDevueltaPrevia + Number(item.cantidadADevolver || 0);
            return {
                id: item.id,
                cantidadDevuelta: totalDevuelta,
                observaciones: item.observaciones || undefined,
            };
        });

        devolucionMutation.mutate({
            id: currentMuestra.id,
            data: {
                fechaDevolucion: returnFecha,
                observaciones: returnObs.trim() || undefined,
                items: itemsPayload,
            }
        });
    };

    const handleDevolverTodoPendiente = () => {
        setReturnItems(returnItems.map(item => {
            const pendiente = Math.max(0, item.cantidadEntregada - item.cantidadDevueltaPrevia);
            return {
                ...item,
                cantidadADevolver: pendiente
            };
        }));
    };

    // Exports
    const exportColumns = [
        { header: 'N° Muestra', dataKey: 'numero' },
        { header: 'Fecha Entrega', dataKey: 'fecha' },
        { header: 'Cliente', dataKey: 'cliente_nombre' },
        { header: 'Vendedor', dataKey: 'vendedor_nombre' },
        { header: 'Sucursal', dataKey: 'sucursal_nombre' },
        { header: 'F. Est. Devolución', dataKey: 'fechaEstimadaDevolucion' },
        { header: 'Estado', dataKey: 'estado' },
    ];

    const getExportData = () => {
        return filteredMuestras.map(m => {
            const sucursalNombre = m.sucursal ? `${m.sucursal.nombre}${(m.sucursal.ciudad as any)?.nombre ? ` (${(m.sucursal.ciudad as any).nombre})` : ''}` : '-';
            return {
                numero: m.numero,
                fecha: m.fecha ? m.fecha.split('T')[0] : '',
                cliente_nombre: m.cliente?.persona ? `${m.cliente.persona.nombres} ${m.cliente.persona.apellidos}` : 'Cliente Final',
                vendedor_nombre: m.vendedor ? `${m.vendedor.nombres} ${m.vendedor.apellidos}` : 'No asignado',
                sucursal_nombre: sucursalNombre,
                fechaEstimadaDevolucion: m.fechaEstimadaDevolucion ? m.fechaEstimadaDevolucion.split('T')[0] : '-',
                estado: m.estado,
            };
        });
    };

    const getFiltersText = () => {
        const texts: string[] = [];

        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }

        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }

        if (estadoFilter && estadoFilter !== 'TODOS') {
            const estadoLabels: Record<string, string> = {
                'ENTREGADO': 'Entregado',
                'DEVUELTO_PARCIAL': 'Devuelto Parcial',
                'DEVUELTO_TOTAL': 'Devuelto Total',
                'ANULADO': 'Anulado'
            };
            texts.push(`Estado: ${estadoLabels[estadoFilter] || estadoFilter}`);
        }

        if (clienteFilter !== 'all') {
            const cli = clientes?.find((cl: any) => cl.id === Number(clienteFilter));
            const cliName = cli?.persona ? `${cli.persona.nombres} ${cli.persona.apellidos}`.trim() : 'Cliente';
            texts.push(`Cliente: ${cliName}`);
        }

        if (vendedorFilter !== 'all') {
            const vend = personal?.find((v: any) => v.id === Number(vendedorFilter));
            const vendName = vend ? `${vend.nombres} ${vend.apellidos}`.trim() : 'Vendedor';
            texts.push(`Vendedor: ${vendName}`);
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

        return texts.length > 0 ? texts.join(' | ') : 'Todas las muestras';
    };

    const handlePrint = () => {
        if (!muestrasList) return;
        printData('Reporte de Muestras de Productos', exportColumns, getExportData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!muestrasList) return;
        exportToPDF('Reporte de Muestras de Productos', exportColumns, getExportData(), 'muestras_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!muestrasList) return;
        exportToExcel(exportColumns, getExportData(), 'muestras_reporte');
    };

    // Imprimir directa (abre el preview en el navegador sin forzar descarga directa de archivo)
    const handlePrintIndividualMuestra = async (m: Muestra) => {
        const doc = new jsPDF();
        try {
            const logoBase64 = await getBase64ImageFromURL('/logo.jpeg');
            doc.addImage(logoBase64, 'JPEG', 14, 10, 38, 16);
        } catch (e) {
            console.warn('Logo could not be loaded for PDF', e);
        }

        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text(`ACTA DE ENTREGA DE MUESTRAS`, 196, 16, { align: 'right' });
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`${m.numero || 'N° S/N'}`, 196, 22, { align: 'right' });

        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'normal');
        let currentY = 36;

        const fechaEntrega = m.fecha ? m.fecha.split('T')[0].split('-').reverse().join('/') : '-';
        const fechaEstimada = m.fechaEstimadaDevolucion ? m.fechaEstimadaDevolucion.split('T')[0].split('-').reverse().join('/') : 'No definida';
        const fechaDev = m.fechaDevolucion ? m.fechaDevolucion.split('T')[0].split('-').reverse().join('/') : '-';

        const clienteNom = m.cliente?.persona ? `${m.cliente.persona.nombres} ${m.cliente.persona.apellidos}` : 'Cliente Final';
        const vendedorNom = m.vendedor ? `${m.vendedor.nombres} ${m.vendedor.apellidos}` : 'No asignado';
        const sucursalNom = m.sucursal ? `${m.sucursal.nombre}${(m.sucursal.ciudad as any)?.nombre ? ` (${(m.sucursal.ciudad as any).nombre})` : ''}` : '-';

        doc.text(`Fecha Entrega: ${fechaEntrega}`, 14, currentY);
        doc.text(`Sucursal: ${sucursalNom}`, 110, currentY);
        currentY += 6;

        doc.text(`Cliente: ${clienteNom}`, 14, currentY);
        doc.text(`Vendedor / Responsable: ${vendedorNom}`, 110, currentY);
        currentY += 6;

        doc.text(`F. Estimada Devolución: ${fechaEstimada}`, 14, currentY);
        doc.text(`Estado: ${m.estado}`, 110, currentY);
        currentY += 6;

        if (m.fechaDevolucion) {
            doc.text(`F. Efectiva Devolución: ${fechaDev}`, 14, currentY);
            currentY += 6;
        }

        if (m.observaciones) {
            doc.text(`Observaciones: ${m.observaciones}`, 14, currentY);
            currentY += 6;
        }

        const tableColumn = ["Código", "Producto", "N° Lote", "F. Venc.", "Cant. Entregada", "Cant. Devuelta", "Pendiente"];
        const tableRows = (m.detalles || []).map(det => {
            const entregada = Number(det.cantidadEntregada) || 0;
            const devuelta = Number(det.cantidadDevuelta) || 0;
            const pendiente = Math.max(0, entregada - devuelta);
            const venc = det.fechaVencimiento ? det.fechaVencimiento.split('T')[0].split('-').reverse().join('/') : '-';

            return [
                det.producto?.codigo || '-',
                det.producto?.nombre || '-',
                det.numeroLote || '-',
                venc,
                entregada.toString(),
                devuelta.toString(),
                pendiente.toString(),
            ];
        });

        autoTable(doc, {
            startY: currentY + 4,
            head: [tableColumn],
            body: tableRows,
            styles: {
                font: 'helvetica',
                fontSize: 8.5,
                cellPadding: 2.5,
            },
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 22 },
                2: { halign: 'center', cellWidth: 22 },
                3: { halign: 'center', cellWidth: 22 },
                4: { halign: 'center', cellWidth: 25 },
                5: { halign: 'center', cellWidth: 25 },
                6: { halign: 'center', cellWidth: 22 },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 28;
        doc.line(20, finalY, 80, finalY);
        doc.text("Entregué Conforme (Vendedor)", 50, finalY + 5, { align: "center" });

        doc.line(130, finalY, 190, finalY);
        doc.text("Recibí Conforme (Cliente)", 160, finalY + 5, { align: "center" });

        // Abre directamente para imprimir sin descargar
        window.open(doc.output('bloburl'), '_blank');
    };

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando muestras...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Tag className="w-8 h-8 text-primary/80" />
                        Muestras
                    </h1>
                    <p className="text-muted-foreground italic">Control de entrega y devolución de muestras de productos para clientes.</p>
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
                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>
                    {canCreate && (
                        <button
                            onClick={handleOpenCreate}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> Nueva Muestra
                        </button>
                    )}
                </div>
            </div>

            {/* Toolbar: Search, Estado, Cliente, Vendedor, Fechas & Limpiar (pegados como en compras o ventas) */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
                    <Search className="w-5 h-5 text-muted-foreground ml-1 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por nro, cliente, vendedor o producto..."
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

                {/* Filtro por Estado */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={estadoFilter}
                        onChange={(e) => setEstadoFilter(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                    >
                        <option value="TODOS" className="bg-background text-foreground">Todos los Estados</option>
                        <option value="ENTREGADO" className="bg-background text-foreground">Entregado</option>
                        <option value="DEVUELTO_PARCIAL" className="bg-background text-foreground">Devolución Parcial</option>
                        <option value="DEVUELTO_TOTAL" className="bg-background text-foreground">Devuelto Total</option>
                        <option value="ANULADO" className="bg-background text-foreground">Anulado</option>
                    </select>
                </div>

                {/* Filtro por Cliente */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={clienteFilter}
                        onChange={(e) => setClienteFilter(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm max-w-[180px]"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Clientes</option>
                        {clientes?.map(c => (
                            <option key={c.id} value={c.id} className="bg-background text-foreground">
                                {c.persona.nombres} {c.persona.apellidos}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Vendedor */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={vendedorFilter}
                        onChange={(e) => setVendedorFilter(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm max-w-[180px]"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Vendedores</option>
                        {personal?.map(p => (
                            <option key={p.id} value={p.id} className="bg-background text-foreground">
                                {p.nombres} {p.apellidos}
                            </option>
                        ))}
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

            {/* Table Card */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[750px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">N° / Fecha</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Cliente</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Vendedor</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Productos / Cant.</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">F. Estimada</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-center w-32">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedMuestras.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                        No se encontraron registros de muestras.
                                    </td>
                                </tr>
                            ) : paginatedMuestras.map((m, index) => {
                                const fechaFmt = m.fecha ? m.fecha.split('T')[0].split('-').reverse().join('/') : '-';
                                const fechaEstFmt = m.fechaEstimadaDevolucion ? m.fechaEstimadaDevolucion.split('T')[0].split('-').reverse().join('/') : '-';
                                const totalEntregados = m.detalles?.reduce((acc, d) => acc + Number(d.cantidadEntregada || 0), 0) || 0;
                                const totalDevueltos = m.detalles?.reduce((acc, d) => acc + Number(d.cantidadDevuelta || 0), 0) || 0;
                                const sucursalConCiudad = m.sucursal?.nombre 
                                    ? `${m.sucursal.nombre}${(m.sucursal.ciudad as any)?.nombre ? ` (${(m.sucursal.ciudad as any).nombre})` : ''}` 
                                    : '-';

                                return (
                                    <tr key={m.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="font-semibold text-foreground">{m.numero}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                <Calendar className="w-3 h-3" /> {fechaFmt}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm font-medium">
                                            {m.cliente?.persona ? `${m.cliente.persona.nombres} ${m.cliente.persona.apellidos}` : 'Cliente Final'}
                                            {m.cliente?.persona?.telefono && (
                                                <div className="text-xs text-muted-foreground font-normal">
                                                    Tel: {m.cliente.persona.telefono}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {m.vendedor ? `${m.vendedor.nombres} ${m.vendedor.apellidos}` : <span className="italic opacity-50">Sin asignar</span>}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {sucursalConCiudad}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <div className="font-medium text-foreground">
                                                {m.detalles?.length || 0} prod. ({totalEntregados} un.)
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                <span className="text-green-600 font-medium">{totalDevueltos} dev.</span> / <span className="text-amber-600 font-medium">{Math.max(0, totalEntregados - totalDevueltos)} pend.</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {fechaEstFmt}
                                        </td>
                                        <td className="p-4 text-sm text-center">
                                            {m.estado === 'DEVUELTO_TOTAL' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-600 uppercase tracking-widest">
                                                    Devuelto Total
                                                </span>
                                            )}
                                            {m.estado === 'DEVUELTO_PARCIAL' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 uppercase tracking-widest">
                                                    Dev. Parcial
                                                </span>
                                            )}
                                            {m.estado === 'ENTREGADO' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 uppercase tracking-widest">
                                                    Entregado
                                                </span>
                                            )}
                                            {m.estado === 'ANULADO' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest">
                                                    Anulado
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5 flex-nowrap whitespace-nowrap">
                                                {/* Ver */}
                                                <button
                                                    onClick={() => { setCurrentMuestra(m); setIsViewing(true); }}
                                                    className="px-2.5 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                    title="Ver Detalle"
                                                >
                                                    <Eye className="w-3" /> Ver
                                                </button>

                                                {/* Enviar WhatsApp */}
                                                <button
                                                    onClick={() => handleOpenWhatsAppModal(m)}
                                                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                                    title="Enviar Acta de Muestras por WhatsApp (PDF)"
                                                >
                                                    <MessageCircle className="w-3" /> WhatsApp
                                                </button>

                                                {/* Registrar Devolución */}
                                                {canReturn && m.estado !== 'ANULADO' && m.estado !== 'DEVUELTO_TOTAL' && (
                                                    <button
                                                        onClick={() => handleOpenReturn(m)}
                                                        className="px-2.5 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                                        title="Registrar Devolución"
                                                    >
                                                        <RotateCcw className="w-3" /> Devolución
                                                    </button>
                                                )}

                                                {/* Editar */}
                                                {canEdit && m.estado !== 'ANULADO' && (
                                                    <button
                                                        onClick={() => handleOpenEdit(m)}
                                                        className="px-2.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
                                                        title="Editar Muestra"
                                                    >
                                                        <Edit className="w-3" /> Editar
                                                    </button>
                                                )}

                                                {/* Anular */}
                                                {canAnular && m.estado !== 'ANULADO' && (
                                                    <button
                                                        onClick={() => setAnularConfirmId(m.id)}
                                                        className="px-2.5 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                                        title="Anular Muestra"
                                                    >
                                                        <Trash2 className="w-3" /> Anular
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

                {/* Pagination footer */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredMuestras.length)} de {filteredMuestras.length}
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

            {/* Modal Lateral (Sheet) Nueva / Editar Muestra */}
            <Sheet
                isOpen={isCreating || isEditing}
                onClose={() => { setIsCreating(false); setIsEditing(false); resetForm(); }}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Tag className="w-6 h-6 text-primary/80" />
                        {isEditing ? `Editar Muestra ${currentMuestra?.numero || ''}` : 'Registrar Nueva Muestra'}
                    </span>
                }
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pb-20">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Fecha de Entrega <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="date"
                                        required
                                        value={formFecha}
                                        onChange={(e) => setFormFecha(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">F. Estimada de Devolución</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="date"
                                        value={formFechaEstimada}
                                        onChange={(e) => setFormFechaEstimada(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Cliente <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <select
                                        required
                                        value={formClienteId}
                                        onChange={(e) => setFormClienteId(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm appearance-none"
                                    >
                                        <option value="">Selecciona Cliente...</option>
                                        {clientes?.map(c => (
                                            <option key={c.id} value={c.id}>
                                                {c.persona.nombres} {c.persona.apellidos}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Sucursal / Ciudad <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <select
                                        required
                                        value={formSucursalId}
                                        onChange={(e) => setFormSucursalId(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm appearance-none"
                                    >
                                        <option value="">Selecciona Sucursal...</option>
                                        {filteredSucursales.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.nombre} {(s.ciudad as any)?.nombre ? `(${(s.ciudad as any).nombre})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Vendedor / Responsable</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <select
                                        value={formVendedorId}
                                        onChange={(e) => setFormVendedorId(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm appearance-none"
                                    >
                                        <option value="">Sin asignar / Opcional</option>
                                        {personal?.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nombres} {p.apellidos}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Product Adding Card */}
                        <div className="p-4 border rounded-lg bg-background space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <Package className="w-4 h-4" /> Agregar Productos a la Muestra
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Producto</label>
                                    <select
                                        value={selectedProdId}
                                        onChange={(e) => setSelectedProdId(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none hover:border-primary/50"
                                    >
                                        <option value="">Selecciona Producto...</option>
                                        {productos?.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.codigo} - {p.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemCantidad}
                                        onChange={(e) => setItemCantidad(Number(e.target.value))}
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none hover:border-primary/50"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">N° Lote</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. LT-2026"
                                        value={itemLote}
                                        onChange={(e) => setItemLote(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none hover:border-primary/50"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-muted-foreground">F. Vencimiento</label>
                                    <input
                                        type="date"
                                        value={itemVencimiento}
                                        onChange={(e) => setItemVencimiento(e.target.value)}
                                        className="w-full px-3 py-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none hover:border-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    placeholder="Observación sobre este producto (opcional)..."
                                    value={itemObs}
                                    onChange={(e) => setItemObs(e.target.value)}
                                    className="flex-1 px-3 py-2 border rounded-lg bg-background text-sm focus:ring-2 focus:ring-primary/20 outline-none hover:border-primary/50"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddProduct}
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm shrink-0"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>

                            {/* Added details table */}
                            <div className="border rounded-lg overflow-hidden mt-3">
                                <table className="w-full text-left border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 border-b text-xs text-muted-foreground font-semibold">
                                            <th className="p-2.5">Código / Producto</th>
                                            <th className="p-2.5 text-center">Cant.</th>
                                            <th className="p-2.5">Lote</th>
                                            <th className="p-2.5">Vencimiento</th>
                                            <th className="p-2.5">Observación</th>
                                            <th className="p-2.5 text-right w-16">Quitar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {formDetalles.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="p-4 text-center text-muted-foreground italic text-xs">
                                                    No has agregado productos a la muestra
                                                </td>
                                            </tr>
                                        ) : (
                                            formDetalles.map((d, idx) => (
                                                <tr key={idx} className="hover:bg-accent/30 text-xs">
                                                    <td className="p-2.5 font-medium">
                                                        <span className="font-semibold text-foreground">{d.productoCodigo}</span> - {d.productoNombre}
                                                    </td>
                                                    <td className="p-2.5 text-center font-bold">{d.cantidadEntregada}</td>
                                                    <td className="p-2.5 font-mono text-muted-foreground">{d.numeroLote || '-'}</td>
                                                    <td className="p-2.5 text-muted-foreground">{d.fechaVencimiento ? d.fechaVencimiento.split('-').reverse().join('/') : '-'}</td>
                                                    <td className="p-2.5 text-muted-foreground italic">{d.observaciones || '-'}</td>
                                                    <td className="p-2.5 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveProduct(idx)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Observaciones Generales</label>
                            <textarea
                                placeholder="Motivo de la entrega de muestra..."
                                value={formObservaciones}
                                onChange={(e) => setFormObservaciones(e.target.value)}
                                className="w-full px-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[80px] resize-none hover:border-primary/50 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => { setIsCreating(false); setIsEditing(false); resetForm(); }}
                            className="px-6 py-2.5 border rounded-xl text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> {isEditing ? 'Guardar Cambios' : 'Registrar Muestra'}
                        </button>
                    </div>
                </form>
            </Sheet>

            {/* Modal Lateral (Sheet) Registrar Devolución */}
            <Sheet
                isOpen={isReturning}
                onClose={() => { setIsReturning(false); setCurrentMuestra(null); }}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <RotateCcw className="w-6 h-6 text-primary/80" />
                        Registrar Devolución ({currentMuestra?.numero || ''})
                    </span>
                }
                className="max-w-3xl"
            >
                <form onSubmit={handleSaveReturn} className="space-y-6 pb-20">
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/20">
                            <div>
                                <span className="text-xs text-muted-foreground block">Cliente</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {currentMuestra?.cliente?.persona ? `${currentMuestra.cliente.persona.nombres} ${currentMuestra.cliente.persona.apellidos}` : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Vendedor</span>
                                <span className="text-sm font-semibold text-foreground">
                                    {currentMuestra?.vendedor ? `${currentMuestra.vendedor.nombres} ${currentMuestra.vendedor.apellidos}` : 'Sin asignar'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Fecha de Devolución <span className="text-destructive">*</span></label>
                            <input
                                type="date"
                                required
                                value={returnFecha}
                                onChange={(e) => setReturnFecha(e.target.value)}
                                className="w-full px-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                            />
                        </div>

                        <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground font-medium">
                                Detalle de productos y cantidades devueltas:
                            </span>
                            <button
                                type="button"
                                onClick={handleDevolverTodoPendiente}
                                className="px-3 py-1 border rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            >
                                Devolver Todo Pendiente
                            </button>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b text-xs text-muted-foreground font-semibold">
                                        <th className="p-3">Producto / Lote</th>
                                        <th className="p-3 text-center">Entregado</th>
                                        <th className="p-3 text-center">Dev. Previa</th>
                                        <th className="p-3 text-center">Pendiente</th>
                                        <th className="p-3 text-center w-28">Cant. a Devolver</th>
                                        <th className="p-3">Observación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {returnItems.map((item, idx) => {
                                        const pendiente = Math.max(0, item.cantidadEntregada - item.cantidadDevueltaPrevia);
                                        return (
                                            <tr key={item.id} className="hover:bg-accent/30 text-xs">
                                                <td className="p-3 font-medium">
                                                    <div>{item.productoNombre}</div>
                                                    <div className="text-[11px] text-muted-foreground font-mono">
                                                        {item.productoCodigo} {item.numeroLote ? `| Lote: ${item.numeroLote}` : ''}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center font-bold">{item.cantidadEntregada}</td>
                                                <td className="p-3 text-center font-bold text-green-600">{item.cantidadDevueltaPrevia}</td>
                                                <td className="p-3 text-center font-bold text-amber-600">{pendiente}</td>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={pendiente}
                                                        value={item.cantidadADevolver}
                                                        onChange={(e) => {
                                                            const val = Math.min(pendiente, Math.max(0, Number(e.target.value)));
                                                            const copy = [...returnItems];
                                                            copy[idx].cantidadADevolver = val;
                                                            setReturnItems(copy);
                                                        }}
                                                        className="w-20 px-2 py-1 border rounded text-center font-bold text-sm bg-background outline-none focus:ring-2 focus:ring-primary/20"
                                                    />
                                                </td>
                                                <td className="p-3">
                                                    <input
                                                        type="text"
                                                        placeholder="Estado del producto..."
                                                        value={item.observaciones}
                                                        onChange={(e) => {
                                                            const copy = [...returnItems];
                                                            copy[idx].observaciones = e.target.value;
                                                            setReturnItems(copy);
                                                        }}
                                                        className="w-full px-2 py-1 border rounded text-xs bg-background outline-none"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Observaciones de Devolución</label>
                            <textarea
                                placeholder="Comentarios adicionales sobre la recepción de la muestra..."
                                value={returnObs}
                                onChange={(e) => setReturnObs(e.target.value)}
                                className="w-full px-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[70px] resize-none hover:border-primary/50 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-6 mt-6 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => { setIsReturning(false); setCurrentMuestra(null); }}
                            className="px-6 py-2.5 border rounded-xl text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={devolucionMutation.isPending}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Check className="w-4 h-4" /> Guardar Devolución
                        </button>
                    </div>
                </form>
            </Sheet>

            {/* Modal Lateral (Sheet) Ver Detalle */}
            <Sheet
                isOpen={isViewing && currentMuestra !== null}
                onClose={() => { setIsViewing(false); setCurrentMuestra(null); }}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Tag className="w-6 h-6 text-primary/80" />
                        Detalle de Muestra {currentMuestra?.numero || ''}
                    </span>
                }
                className="max-w-3xl"
            >
                {currentMuestra && (
                    <div className="space-y-5 pb-20">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/20 text-xs">
                            <div>
                                <span className="text-muted-foreground block">Fecha de Entrega</span>
                                <span className="font-bold text-foreground text-sm">
                                    {currentMuestra.fecha ? currentMuestra.fecha.split('T')[0].split('-').reverse().join('/') : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">F. Estimada Devolución</span>
                                <span className="font-bold text-foreground text-sm">
                                    {currentMuestra.fechaEstimadaDevolucion ? currentMuestra.fechaEstimadaDevolucion.split('T')[0].split('-').reverse().join('/') : 'No definida'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">F. Efectiva Devolución</span>
                                <span className="font-bold text-foreground text-sm">
                                    {currentMuestra.fechaDevolucion ? currentMuestra.fechaDevolucion.split('T')[0].split('-').reverse().join('/') : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Estado</span>
                                <span className="font-bold text-foreground text-sm">{currentMuestra.estado}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Cliente</span>
                                <span className="font-semibold text-foreground">
                                    {currentMuestra.cliente?.persona ? `${currentMuestra.cliente.persona.nombres} ${currentMuestra.cliente.persona.apellidos}` : 'Cliente Final'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Vendedor</span>
                                <span className="font-semibold text-foreground">
                                    {currentMuestra.vendedor ? `${currentMuestra.vendedor.nombres} ${currentMuestra.vendedor.apellidos}` : 'Sin asignar'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Sucursal</span>
                                <span className="font-semibold text-foreground">
                                    {currentMuestra.sucursal?.nombre ? `${currentMuestra.sucursal.nombre}${(currentMuestra.sucursal.ciudad as any)?.nombre ? ` (${(currentMuestra.sucursal.ciudad as any).nombre})` : ''}` : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Registrado Por</span>
                                <span className="font-semibold text-foreground">
                                    {currentMuestra.usuario?.username || '-'}
                                </span>
                            </div>
                        </div>

                        {currentMuestra.observaciones && (
                            <div className="p-4 border rounded-lg bg-background text-xs">
                                <span className="font-semibold text-foreground block mb-1">Observaciones / Historial:</span>
                                <p className="text-muted-foreground whitespace-pre-line">{currentMuestra.observaciones}</p>
                            </div>
                        )}

                        <div className="border rounded-lg overflow-hidden">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-muted/50 border-b text-xs text-muted-foreground font-semibold">
                                        <th className="p-3">Código / Producto</th>
                                        <th className="p-3">Lote</th>
                                        <th className="p-3">Vencimiento</th>
                                        <th className="p-3 text-center">Entregado</th>
                                        <th className="p-3 text-center">Devuelto</th>
                                        <th className="p-3 text-center">Pendiente</th>
                                        <th className="p-3">Observación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {currentMuestra.detalles?.map((d) => {
                                        const pendiente = Math.max(0, Number(d.cantidadEntregada) - Number(d.cantidadDevuelta || 0));
                                        return (
                                            <tr key={d.id} className="hover:bg-accent/30 text-xs">
                                                <td className="p-3 font-medium">
                                                    <div className="font-semibold text-foreground">{d.producto?.codigo}</div>
                                                    <div className="text-muted-foreground">{d.producto?.nombre}</div>
                                                </td>
                                                <td className="p-3 font-mono text-muted-foreground">{d.numeroLote || '-'}</td>
                                                <td className="p-3 text-muted-foreground">{d.fechaVencimiento ? d.fechaVencimiento.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                                                <td className="p-3 text-center font-bold">{d.cantidadEntregada}</td>
                                                <td className="p-3 text-center font-bold text-green-600">{d.cantidadDevuelta || 0}</td>
                                                <td className="p-3 text-center font-bold text-amber-600">{pendiente}</td>
                                                <td className="p-3 text-muted-foreground italic">{d.observaciones || '-'}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end gap-2 pt-4 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => { setIsViewing(false); setCurrentMuestra(null); }}
                                className="px-6 py-2.5 border rounded-xl text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={() => handlePrintIndividualMuestra(currentMuestra)}
                                className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold shadow-md hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" /> Imprimir
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenWhatsAppModal(currentMuestra)}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                            >
                                <MessageCircle className="w-4 h-4" /> WhatsApp
                            </button>
                        </div>
                    </div>
                )}
            </Sheet>

            {/* Modal Confirmar Anulación */}
            <Modal
                isOpen={anularConfirmId !== null}
                onClose={() => setAnularConfirmId(null)}
                title="Anular Muestra"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Esta muestra pasará a estado Anulado</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">Esta acción cambiará el estado a ANULADO y no se podrá revertir.</p>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setAnularConfirmId(null)}
                            className="px-6 py-2.5 border rounded-xl text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={() => anularConfirmId && anularMutation.mutate(anularConfirmId)}
                            className="px-6 py-2.5 bg-destructive text-destructive-foreground rounded-xl text-sm font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            Sí, Anular
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal para Enviar Acta de Muestras por WhatsApp */}
            <Modal
                isOpen={whatsappModalData.isOpen}
                onClose={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false, muestra: null }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <MessageCircle className="w-5 h-5" />
                        Enviar Acta de Muestras por WhatsApp
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappModalData.muestra && (
                    <div className="space-y-4">
                        {/* Card resumen de la Muestra */}
                        <div className="p-3.5 bg-muted/40 border rounded-xl space-y-1 text-sm">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-foreground">Muestra N° {whatsappModalData.muestra.numero || whatsappModalData.muestra.id}</span>
                                {(() => {
                                    const totalEntregadas = whatsappModalData.muestra.detalles?.reduce((acc: number, d: any) => acc + Number(d.cantidadEntregada || 0), 0) || 0;
                                    const totalDevueltas = whatsappModalData.muestra.detalles?.reduce((acc: number, d: any) => acc + Number(d.cantidadDevuelta || 0), 0) || 0;
                                    const totalPendientes = Math.max(0, totalEntregadas - totalDevueltas);
                                    return (
                                        <div className="text-xs font-bold flex items-center gap-2">
                                            <span className="text-foreground">{totalEntregadas} Entreg.</span>
                                            {totalDevueltas > 0 && (
                                                <span className="text-emerald-600 dark:text-emerald-400">/ {totalDevueltas} Dev.</span>
                                            )}
                                            {totalPendientes > 0 && (
                                                <span className="text-amber-600 dark:text-amber-400">({totalPendientes} Pend.)</span>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>Cliente: <strong className="text-foreground">{whatsappModalData.muestra.cliente?.persona ? `${whatsappModalData.muestra.cliente.persona.nombres} ${whatsappModalData.muestra.cliente.persona.apellidos}` : 'Cliente'}</strong></span>
                                <span>{whatsappModalData.muestra.fecha ? format(new Date(String(whatsappModalData.muestra.fecha).substring(0, 10) + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</span>
                            </div>
                            {whatsappModalData.muestra.vendedor && (
                                <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                                    <span>Vendedor: <strong className="text-foreground">{`${whatsappModalData.muestra.vendedor.nombres || ''} ${whatsappModalData.muestra.vendedor.apellidos || ''}`.trim() || 'Vendedor'}</strong></span>
                                </div>
                            )}
                        </div>

                        {/* Input de Teléfono */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Número de WhatsApp Cliente</span>
                                <span className="text-[10px] text-muted-foreground font-normal">Prefijo: +591 (Bolivia)</span>
                            </label>
                            <div className="flex rounded-lg border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                                <span className="px-3 py-2 bg-muted text-xs font-semibold text-muted-foreground flex items-center border-r">
                                    🇧🇴 +591
                                </span>
                                <input
                                    type="text"
                                    placeholder="Ej: 71234567"
                                    value={whatsappModalData.phone}
                                    onChange={(e) => setWhatsappModalData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="flex-1 px-3 py-2 text-sm bg-transparent outline-none font-medium"
                                />
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                El cliente recibirá el documento PDF oficial del Acta de Entrega de Muestras generado por el sistema.
                            </p>
                        </div>

                        {/* Canal de WhatsApp Automático de la Sucursal */}
                        <div className="p-3 bg-muted/30 border rounded-xl flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                                    <Building2 className="w-4 h-4 text-primary" />
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-[11px] text-muted-foreground font-medium">Canal de Envío (Sucursal):</span>
                                    {(() => {
                                        const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.muestra.sucursal?.id || whatsappModalData.muestra.cliente?.sucursal?.id);
                                        const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                        const branchName = curBranch?.sucursalNombre || whatsappModalData.muestra.sucursal?.nombre || whatsappModalData.muestra.cliente?.sucursal?.nombre || 'Sucursal Emisora';
                                        const ciudadNombre = curBranch?.ciudadNombre;
                                        const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                        return (
                                            <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                        );
                                    })()}
                                </div>
                            </div>
                            {(() => {
                                const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.muestra.sucursal?.id || whatsappModalData.muestra.cliente?.sucursal?.id);
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                const isConn = curBranch?.status === 'CONNECTED';
                                return (
                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border shrink-0 transition-colors ${
                                        isConn 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' 
                                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                                    }`}>
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${isConn ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        <span>{isConn ? 'Bot Conectado' : 'Bot No Conectado'}</span>
                                    </span>
                                );
                            })()}
                        </div>

                        {/* Mensaje adicional opcional */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Mensaje o Nota Opcional (Pie del PDF)</label>
                            <textarea
                                rows={2}
                                value={whatsappModalData.customMessage}
                                onChange={(e) => setWhatsappModalData(prev => ({ ...prev, customMessage: e.target.value }))}
                                placeholder="Escribe una nota personalizada si deseas acompañar el acta con un mensaje específico..."
                                className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            {(() => {
                                const cleanDigits = (whatsappModalData.phone || '').replace(/\D/g, '');
                                const phoneWithCountry = cleanDigits.length === 8 ? `591${cleanDigits}` : cleanDigits;
                                const defaultText = encodeURIComponent(
                                    `Hola *${whatsappModalData.muestra.cliente?.persona ? `${whatsappModalData.muestra.cliente.persona.nombres} ${whatsappModalData.muestra.cliente.persona.apellidos}` : 'Cliente'}*, le enviamos el comprobante del Acta de Entrega de Muestras N° ${whatsappModalData.muestra.numero || whatsappModalData.muestra.id}.`
                                );
                                const waLink = `https://wa.me/${phoneWithCountry}?text=${defaultText}`;

                                return (
                                    <a
                                        href={phoneWithCountry ? waLink : '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => {
                                            if (!phoneWithCountry) {
                                                e.preventDefault();
                                                toast.error('Ingrese un número de teléfono para abrir WhatsApp Web');
                                            }
                                        }}
                                        className={`px-3 py-2 border rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center gap-1.5 transition-colors ${!phoneWithCountry ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Abrir chat directo en WhatsApp Web"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>WhatsApp Web</span>
                                    </a>
                                );
                            })()}

                            {(() => {
                                const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.muestra.sucursal?.id || whatsappModalData.muestra.cliente?.sucursal?.id);
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                const isConn = curBranch?.status === 'CONNECTED';

                                return (
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false, muestra: null }))}
                                            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sendWhatsAppMutation.isPending || !whatsappModalData.phone.trim() || !isConn}
                                            title={!isConn ? 'El bot de WhatsApp no está conectado en esta sucursal' : undefined}
                                            onClick={() => {
                                                if (!whatsappModalData.muestra) return;
                                                if (!isConn) {
                                                    toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                    return;
                                                }
                                                if (!whatsappModalData.phone.trim()) {
                                                    toast.error('Ingrese el número de teléfono del cliente');
                                                    return;
                                                }
                                                sendWhatsAppMutation.mutate({
                                                    muestraId: whatsappModalData.muestra.id,
                                                    phone: whatsappModalData.phone.trim(),
                                                    sucursalId: whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : undefined,
                                                    message: whatsappModalData.customMessage.trim() || undefined
                                                });
                                            }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {sendWhatsAppMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Enviando PDF...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5" />
                                                    Enviar PDF
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default MuestrasPage;
