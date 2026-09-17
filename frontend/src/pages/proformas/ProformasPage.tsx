import { formatCurrency } from '../../utils/currencyUtils';
import { toast } from 'sonner';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { proformaService } from '../../api/proformaService';
import { whatsappService } from '../../api/whatsappService';
import { clientService } from '../../api/clientService';
import { productService } from '../../api/productService';
import { inventoryService } from '../../api/inventoryService';
import { sucursalService } from '../../api/sucursalService';
import { personalService } from '../../api/personalService';
import { getCiudades } from '../../api/ciudadService';
import { EstadoNota } from '../../api/purchaseService';
import Sheet from '../../components/ui/Sheet';
import Modal from '../../components/ui/Modal';
import { Search, Plus, Trash2, CheckCircle, Calculator, User, Package, Calendar, X, ShoppingCart, Eye, Edit, Printer, AlertTriangle, Building2, FileText, FileSpreadsheet, Filter, Lock, MessageCircle, Send, ExternalLink, Loader2, Store } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFilters } from '../../context/FilterContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromURL, exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { numeroALetras } from '../../utils/currencyUtils';
import { getClientDisplayName, getClientPersonName, getClientStoreName } from '../../utils/clientUtils';
import { useAuth } from '../../context/AuthContext';

const ProformasPage: React.FC = () => {
    const { isAdmin, isVendedor, isJefeVentas, userPersonal } = useAuth();
    const isRestrictedVendor = isVendedor && !isAdmin && !isJefeVentas && !!userPersonal;
    const { selectedSucursal, selectedCiudad, isRestrictedToBranch, userSucursal, userCiudad } = useFilters();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isViewing, setIsViewing] = useState(false);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [selectedVendedor, setSelectedVendedor] = useState('all');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Form State
    const [newProforma, setNewProforma] = useState<any>({
        numero: '',
        clienteId: '',
        sucursalId: selectedSucursal || (userSucursal?.id ? String(userSucursal.id) : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : '')),
        vendedorId: isRestrictedVendor && userPersonal?.id ? String(userPersonal.id) : '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        observaciones: '',
        descuentoPorcentaje: 0,
        descuentoPromocionPorcentaje: 0,
        detalles: []
    });

    const { data: proformas, isLoading: loadingProformas } = useQuery({
        queryKey: ['proformas'],
        queryFn: proformaService.getAll,
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientService.getAll(),
    });

    const availableClients = useMemo(() => {
        if (!clients) return [];
        const activeSucursal = newProforma.sucursalId || selectedSucursal || (userSucursal?.id ? String(userSucursal.id) : '');
        const activeCiudad = selectedCiudad || (userCiudad?.id ? String(userCiudad.id) : '');

        if (activeSucursal) {
            return clients.filter(c => 
                c.sucursal?.id === Number(activeSucursal) || 
                c.ruta?.sucursal?.id === Number(activeSucursal) ||
                (newProforma.clienteId && c.id.toString() === newProforma.clienteId)
            );
        }
        if (activeCiudad) {
            return clients.filter(c => 
                c.sucursal?.ciudad?.id === Number(activeCiudad) ||
                c.ruta?.sucursal?.ciudad?.id === Number(activeCiudad) ||
                (newProforma.clienteId && c.id.toString() === newProforma.clienteId)
            );
        }
        return clients;
    }, [clients, newProforma.sucursalId, selectedSucursal, userSucursal?.id, selectedCiudad, userCiudad?.id, newProforma.clienteId]);

    
    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
    const { data: inventarios } = useQuery({ queryKey: ['inventarios'], queryFn: inventoryService.getAll });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getAll(),
    });

    const { data: vendedores } = useQuery({
        queryKey: ['vendedores'],
        queryFn: async () => {
            const all = await personalService.getAll();
            return all.filter(p => p.cargo === 'VENDEDOR' && p.activo);
        }
    });

    const createMutation = useMutation({
        mutationFn: proformaService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
            setIsCreating(false);
            resetForm();
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Error al registrar proforma'),
    });

    
    const getProductStock = (prodId: number) => {
        if (!inventarios) return 0;
        const targetState = newProforma;
        let invs = inventarios.filter(i => i.producto.id === prodId);
        if (targetState.sucursalId) {
            invs = invs.filter(i => (i.sucursal?.id === Number(targetState.sucursalId)) || ((i as any).almacen?.id === Number(targetState.sucursalId)));
        }
        return invs.reduce((acc, curr) => acc + Number(curr.stockActual), 0);
    };

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: any }) => proformaService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
            setIsCreating(false);
            resetForm();
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar proforma'),
    });

    const confirmMutation = useMutation({
        mutationFn: proformaService.confirmar,
        onSuccess: () => {
            toast.success('Proforma confirmada exitosamente');
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al confirmar proforma'),
    });

    const convertMutation = useMutation({
        mutationFn: proformaService.convertirAVenta,
        onSuccess: () => {
            toast.success('Proforma convertida a Venta exitosamente');
            queryClient.invalidateQueries({ queryKey: ['proformas'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al convertir a venta'),
    });

    const anularMutation = useMutation({
        mutationFn: proformaService.anular,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['proformas'] })
    });

    // WhatsApp State & Mutations
    const { data: whatsappBranches } = useQuery({
        queryKey: ['whatsapp-branches-status'],
        queryFn: () => whatsappService.getBranchesStatus(),
        staleTime: 10000,
    });

    const [whatsappModalData, setWhatsappModalData] = useState<{
        isOpen: boolean;
        proforma: any | null;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        proforma: null,
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const sendWhatsAppMutation = useMutation({
        mutationFn: (payload: { proformaId: number; phone?: string; sucursalId?: number; message?: string }) =>
            proformaService.sendWhatsApp(payload),
        onSuccess: (data) => {
            toast.success(data.message || 'Proforma enviada exitosamente por WhatsApp');
            setWhatsappModalData(prev => ({ ...prev, isOpen: false, proforma: null }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar proforma por WhatsApp');
        }
    });

    const handleOpenWhatsAppModal = (proforma: any) => {
        const clientPhone = proforma.cliente?.persona?.telefono || '';
        const initialSucursalId = proforma.sucursal?.id 
            ? String(proforma.sucursal.id) 
            : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : ''));

        setWhatsappModalData({
            isOpen: true,
            proforma,
            phone: clientPhone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    const resetForm = () => {
        setEditingId(null);
        setIsViewing(false);
        const firstSucInCiudad = selectedCiudad ? sucursales?.find((s: any) => s.ciudad?.id === Number(selectedCiudad))?.id?.toString() : '';
        const defaultSucId = selectedSucursal || (userSucursal?.id ? String(userSucursal.id) : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (firstSucInCiudad || '')));
        const defaultSucNombre = sucursales?.find((s: any) => s.id.toString() === defaultSucId)?.nombre || userSucursal?.nombre || userPersonal?.sucursal?.nombre || '';

        setNewProforma({
            numero: '',
            clienteId: '',
            sucursalId: defaultSucId,
            vendedorId: isRestrictedVendor && userPersonal?.id ? String(userPersonal.id) : '',
            sucursal: defaultSucNombre,
            fecha: format(new Date(), 'yyyy-MM-dd'),
            observaciones: '',
            descuentoPorcentaje: 0,
            descuentoPromocionPorcentaje: 0,
            detalles: []
        });
        setError(null);
    };

    const handleEdit = (proforma: any) => {
        setEditingId(proforma.id);
        setIsViewing(false);
        setNewProforma({
            numero: proforma.numero || '',
            clienteId: proforma.cliente?.id?.toString() || '',
            sucursalId: proforma.sucursal?.id?.toString() || '',
            vendedorId: proforma.vendedor?.id?.toString() || '',
            sucursal: proforma.sucursal?.nombre || '',
            fecha: proforma.fecha ? proforma.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
            observaciones: proforma.observaciones || '',
            descuentoPorcentaje: Number(proforma.descuentoPorcentaje || 0),
            descuentoPromocionPorcentaje: Number(proforma.descuentoPromocionPorcentaje || 0),
            detalles: proforma.detalles?.map((d: any) => ({
                productoId: d.producto.id,
                producto: d.producto,
                cantidad: Number(d.cantidad),
                precioUnitario: Number(d.precioUnitario),
                
                subtotal: Number(d.subtotal),
                numeroLote: d.numeroLote || '',
                movimientosLote: d.movimientosLote || []
            })) || []
        });
        setIsCreating(true);
    };

    const handleView = (proforma: any) => {
        setEditingId(proforma.id);
        setIsViewing(true);
        setNewProforma({
            numero: proforma.numero || '',
            clienteId: proforma.cliente?.id?.toString() || '',
            sucursalId: proforma.sucursal?.id?.toString() || '',
            vendedorId: proforma.vendedor?.id?.toString() || '',
            sucursal: proforma.sucursal?.nombre || '',
            fecha: proforma.fecha ? proforma.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
            observaciones: proforma.observaciones || '',
            descuentoPorcentaje: Number(proforma.descuentoPorcentaje || 0),
            descuentoPromocionPorcentaje: Number(proforma.descuentoPromocionPorcentaje || 0),
            detalles: proforma.detalles?.map((d: any) => ({
                productoId: d.producto.id,
                producto: d.producto,
                cantidad: Number(d.cantidad),
                precioUnitario: Number(d.precioUnitario),
                
                subtotal: Number(d.subtotal),
                numeroLote: d.numeroLote || '',
                movimientosLote: d.movimientosLote || []
            })) || []
        });
        setIsCreating(true);
    };

    const handlePrintIndividualProforma = async () => {
        const doc = new jsPDF();
        
        try {
            const logoBase64 = await getBase64ImageFromURL('/logo.jpeg');
            doc.addImage(logoBase64, 'JPEG', 14, 10, 45, 15); // Adjust size for better fit
        } catch (e) {
            console.warn('Could not load logo for PDF', e);
        }

        doc.setFontSize(14);
        doc.setTextColor(50, 50, 50);
        doc.text(`PROFORMA - ${newProforma.numero || 'S/N'}`, 196, 18, { align: 'right' });

        doc.setTextColor(80, 80, 80);
        doc.setFontSize(10);
        let currentY = 38;
        
        const fechaFormatted = newProforma.fecha ? newProforma.fecha.split('T')[0].split('-').reverse().join('/') : '';
        doc.text(`Fecha: ${fechaFormatted}`, 14, currentY);
        
        let sucursalTexto = '';
        if (newProforma.sucursalId) {
            const s = sucursales?.find(su => su.id.toString() === newProforma.sucursalId.toString());
            if (s) {
                const ciudadNombre = (s.ciudad as any)?.nombre;
                sucursalTexto = `${s.nombre}${ciudadNombre ? ` (${ciudadNombre})` : ''}`;
            }
        }
        if (!sucursalTexto && newProforma.sucursal) {
            const s = sucursales?.find(su => su.nombre === newProforma.sucursal);
            const ciudadNombre = (s?.ciudad as any)?.nombre;
            sucursalTexto = `${newProforma.sucursal}${ciudadNombre ? ` (${ciudadNombre})` : ''}`;
        }
        if (sucursalTexto) {
            doc.text(`Sucursal: ${sucursalTexto}`, 80, currentY);
        }
        currentY += 6;
        
        let clienteNombre = 'Cliente Final';
        if (newProforma.clienteId) {
            const c = clients?.find(c => c.id.toString() === newProforma.clienteId);
            if (c) clienteNombre = getClientDisplayName(c);
        }
        doc.text(`Cliente: ${clienteNombre}`, 14, currentY);
        
        if (newProforma.vendedorId) {
            const v = vendedores?.find(v => v.id.toString() === newProforma.vendedorId);
            if (v) doc.text(`Vendedor: ${v.nombres} ${v.apellidos}`, 80, currentY);
        }

        const tableColumn = ["Código", "Producto", "Cant.", "P.Unit", "Subtotal"];
        const tableRows = newProforma.detalles.map((det: any) => {
            return [
                det.producto?.codigo || '-',
                det.producto?.nombre || '-',
                det.cantidad.toString(),
                formatCurrency(det.precioUnitario),
                
                formatCurrency(det.subtotal)
            ];
        });

        autoTable(doc, {
            startY: currentY + 10,
            head: [tableColumn],
            body: tableRows,
            styles: {
                font: 'helvetica',
                fontSize: 10,
                cellPadding: 5,
            },
            headStyles: {
                fillColor: [41, 128, 185], // Modern blue
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
        });

        const finalY = (doc as any).lastAutoTable.finalY || currentY + 10;
        const totals = calculateTotals();
        let currentTotalY = finalY + 10;
        
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        
        doc.text(`Subtotal: ${formatCurrency(totals.subtotal)}`, 196, currentTotalY, { align: 'right' });
        currentTotalY += 6;
        if (totals.desc1 > 0) {
            doc.text(`Descuento (${newProforma.descuentoPorcentaje}%): -${formatCurrency(totals.desc1)}`, 196, currentTotalY, { align: 'right' });
            currentTotalY += 6;
        }
        if (totals.desc2 > 0) {
            doc.text(`Promoción (${newProforma.descuentoPromocionPorcentaje}%): -${formatCurrency(totals.desc2)}`, 196, currentTotalY, { align: 'right' });
            currentTotalY += 6;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Total: ${formatCurrency(totals.total)}`, 196, currentTotalY, { align: 'right' });
        
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Son: ${numeroALetras(totals.total)}`, 14, finalY + 10);
        
        if (newProforma.observaciones) {
            doc.setFontSize(10);
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            doc.text('Notas:', 14, finalY + 20);
            doc.setFont("helvetica", "italic");
            doc.text(newProforma.observaciones, 14, finalY + 25);
        }

        window.open(doc.output('bloburl'), '_blank');
    };

    const addProductToDetail = (prodId: string) => {
        const prod = products?.find(p => p.id === Number(prodId));
        if (!prod) return;

        if (newProforma.detalles.some((d: any) => d.productoId === prod.id)) return;

        const precioVentaNum = Number(prod.precioVenta) || 0;

        setNewProforma({
            ...newProforma,
            detalles: [...newProforma.detalles, {
                productoId: prod.id,
                producto: prod,
                cantidad: 1,
                precioUnitario: precioVentaNum,
                descuentoPorcentaje: 0,
            descuentoPromocionPorcentaje: 0,
                subtotal: precioVentaNum
            }]
        });
    };

    const removeDetail = (index: number) => {
        const newDetails = [...newProforma.detalles];
        newDetails.splice(index, 1);
        setNewProforma({ ...newProforma, detalles: newDetails });
    };

    const updateDetail = (index: number, field: string, value: number) => {
        const newDetails = [...newProforma.detalles];
        const det = { ...newDetails[index], [field]: value };
        det.subtotal = det.cantidad * det.precioUnitario;
        newDetails[index] = det;
        setNewProforma({ ...newProforma, detalles: newDetails });
    };

    const calculateTotals = () => {
        const subtotal = newProforma.detalles.reduce((acc: number, det: any) => acc + (det.cantidad * det.precioUnitario), 0);
        const desc1 = (subtotal * Number(newProforma.descuentoPorcentaje || 0)) / 100;
        const sub1 = subtotal - desc1;
        const desc2 = (sub1 * Number(newProforma.descuentoPromocionPorcentaje || 0)) / 100;
        const total = sub1 - desc2;
        return { subtotal, desc1, desc2, total };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newProforma.detalles.length === 0) {
            setError('Agregue al menos un producto a la proforma');
            return;
        }

        const payload = {
            cliente: newProforma.clienteId ? { id: Number(newProforma.clienteId) } : null,
            vendedor: newProforma.vendedorId ? { id: Number(newProforma.vendedorId) } : null,
            sucursal: newProforma.sucursalId ? { id: Number(newProforma.sucursalId) } : null,
            fecha: newProforma.fecha,
            observaciones: newProforma.observaciones,
            detalles: newProforma.detalles.map((d: any) => ({
                producto: { id: d.productoId },
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario
            })),
            descuentoPorcentaje: newProforma.descuentoPorcentaje,
            descuentoPromocionPorcentaje: newProforma.descuentoPromocionPorcentaje
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const filteredProformas = useMemo(() => {
        if (!proformas) return [];
        let filtered = proformas;
        
        if (selectedSucursal) {
            filtered = filtered.filter(p => p.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => p.sucursal?.ciudad?.id === Number(selectedCiudad));
        }

        if (isRestrictedVendor) {
            filtered = filtered.filter(p => p.vendedor?.id === userPersonal.id);
        } else if (selectedVendedor !== 'all') {
            filtered = filtered.filter(p => p.vendedor?.id === Number(selectedVendedor));
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
            const term = search.toLowerCase();
            filtered = filtered.filter(p => 
                p.numero.toLowerCase().includes(term) ||
                p.cliente?.nombreTienda?.toLowerCase().includes(term) ||
                p.cliente?.persona?.nombres?.toLowerCase().includes(term) ||
                p.cliente?.persona?.apellidos?.toLowerCase().includes(term) ||
                p.vendedor?.nombres?.toLowerCase().includes(term) ||
                p.vendedor?.apellidos?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [proformas, search, selectedSucursal, selectedCiudad, selectedVendedor, fechaDesde, fechaHasta, isRestrictedVendor, userPersonal]);

    const getExportColumns = () => {
        let cols = [
            { header: 'N° Proforma', dataKey: 'numero' },
            { header: 'Fecha', dataKey: 'fechaFormatted' },
            { header: 'Cliente', dataKey: 'clienteNombre' },
            { header: 'Vendedor', dataKey: 'vendedorNombre' },
            { header: 'Sucursal', dataKey: 'sucursalNombre' },
            { header: 'SubTotal', dataKey: 'subtotalFormatted' },
            { header: 'Descuento', dataKey: 'descuentoFormatted' },
            { header: 'Total', dataKey: 'totalFormatted' },
            { header: 'Estado', dataKey: 'estado' }
        ];

        if (selectedVendedor !== 'all') {
            cols = cols.filter(c => c.dataKey !== 'vendedorNombre');
        }
        if (selectedSucursal) {
            cols = cols.filter(c => c.dataKey !== 'sucursalNombre');
        }

        return cols;
    };

    const getFormattedData = () => {
        return filteredProformas.map(s => {
            const descCalc = (Number(s.descuento) || 0) + (Number(s.descuentoPromocion) || 0);
            const subTotalCalc = (Number(s.total) || 0) + descCalc;
            const descPct = Number(s.descuentoPorcentaje) || 0;
            const descPromoPct = Number(s.descuentoPromocionPorcentaje) || 0;
            let totalPct = descPct + descPromoPct;
            if (totalPct === 0 && descCalc > 0 && subTotalCalc > 0) {
                totalPct = (descCalc / subTotalCalc) * 100;
            }
            let pctLabel = '';
            if (descPct > 0 && descPromoPct > 0) {
                pctLabel = ` (${Number(descPct.toFixed(2))}% + ${Number(descPromoPct.toFixed(2))}% Promo)`;
            } else if (descPromoPct > 0) {
                pctLabel = ` (${Number(descPromoPct.toFixed(2))}% Promo)`;
            } else if (totalPct > 0) {
                pctLabel = ` (${Number(totalPct.toFixed(2))}%)`;
            }

            const ciudadNombre = (s.sucursal?.ciudad as any)?.nombre;
            const sucursalTexto = s.sucursal ? `${s.sucursal.nombre}${ciudadNombre ? ` (${ciudadNombre})` : ''}`.trim() : '-';
            return {
                id: s.id,
                numero: s.numero || '-',
                fechaFormatted: s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '-',
                clienteNombre: getClientDisplayName(s.cliente),
                vendedorNombre: s.vendedor ? `${s.vendedor.nombres || ''} ${s.vendedor.apellidos || ''}`.trim() : 'Sin asignar',
                sucursalNombre: sucursalTexto,
                subtotalFormatted: formatCurrency(subTotalCalc),
                descuentoFormatted: `${formatCurrency(descCalc)}${pctLabel}`,
                totalFormatted: formatCurrency(s.total || 0),
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

        if (selectedVendedor !== 'all') {
            const v = vendedores?.find(ve => ve.id === Number(selectedVendedor));
            if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
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

        return texts.length > 0 ? texts.join(' | ') : 'Todas las proformas';
    };

    const handlePrintReport = () => {
        if (!filteredProformas.length) {
            toast.error('No hay proformas para imprimir');
            return;
        }
        printData('Reporte de Proformas / Presupuestos', getExportColumns(), getFormattedData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!filteredProformas.length) {
            toast.error('No hay proformas para exportar');
            return;
        }
        exportToPDF('Reporte de Proformas / Presupuestos', getExportColumns(), getFormattedData(), 'proformas_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!filteredProformas.length) {
            toast.error('No hay proformas para exportar');
            return;
        }
        exportToExcel(getExportColumns(), getFormattedData(), 'proformas_reporte');
    };

    const hasActiveFilters = selectedVendedor !== 'all' || !!fechaDesde || !!fechaHasta || !!search;
    const handleClearFilters = () => {
        setSelectedVendedor('all');
        setFechaDesde('');
        setFechaHasta('');
        setSearch('');
    };

    if (loadingProformas) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando proformas...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Calculator className="w-8 h-8 text-primary/80" />
                        Proformas / Presupuestos
                    </h1>
                    <p className="text-muted-foreground italic">Genera cotizaciones y presupuestos para tus clientes.</p>
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

                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Proforma
                    </button>
                </div>
            </div>

            {/* Toolbar: Search, Vendedor, Fechas & Limpiar */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
                    <Search className="w-5 h-5 text-muted-foreground ml-1 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, nro o vendedor..."
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

                {/* Filtro por Vendedor */}
                {isRestrictedVendor ? (
                    <div className="flex items-center gap-2 bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-sm text-sm text-primary font-medium">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        <span>Mis Proformas ({userPersonal.nombres} {userPersonal.apellidos})</span>
                        <Lock className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select
                            value={selectedVendedor}
                            onChange={(e) => setSelectedVendedor(e.target.value)}
                            className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm"
                        >
                            <option value="all" className="bg-background text-foreground">Todos los Vendedores</option>
                            {vendedores?.map(v => (
                                <option key={v.id} value={v.id} className="bg-background text-foreground">
                                    {v.nombres} {v.apellidos}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

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

            <div className="bg-card border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Número / Fecha</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Cliente</th>
                            {selectedVendedor === 'all' && (
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Vendedor</th>
                            )}
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">SubTotal</th>
                            
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Descuento</th>
<th className="p-4 text-sm font-semibold text-muted-foreground text-right">Total</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Estado</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredProformas.map((s) => {
                            const descCalc = (Number(s.descuento) || 0) + (Number(s.descuentoPromocion) || 0);
                            const subTotalCalc = (Number(s.total) || 0) + descCalc;
                            const descPct = Number(s.descuentoPorcentaje) || 0;
                            const descPromoPct = Number(s.descuentoPromocionPorcentaje) || 0;
                            let totalPct = descPct + descPromoPct;
                            if (totalPct === 0 && descCalc > 0 && subTotalCalc > 0) {
                                totalPct = (descCalc / subTotalCalc) * 100;
                            }
                            
                            return (
                                <tr key={s.id} className="hover:bg-accent/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{s.numero}</span>
                                            <span className="text-xs text-muted-foreground">{s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '---'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            {s.cliente?.nombreTienda ? (
                                                <>
                                                    <span className="text-sm font-bold text-foreground flex items-center gap-1">
                                                        <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                        {s.cliente.nombreTienda}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {getClientPersonName(s.cliente)} {s.cliente.persona?.ci ? `• CI: ${s.cliente.persona.ci}` : ''}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="text-sm font-medium">
                                                        {getClientPersonName(s.cliente)}
                                                    </span>
                                                    {s.cliente?.persona?.ci && <span className="text-xs text-muted-foreground">CI: {s.cliente.persona.ci}</span>}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                    {selectedVendedor === 'all' && (
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-muted-foreground">
                                                    {s.vendedor ? `${s.vendedor.nombres} ${s.vendedor.apellidos}` : 'Sin asignar'}
                                                </span>
                                            </div>
                                        </td>
                                    )}
                                    <td className="p-4 text-sm font-medium text-right text-muted-foreground">
                                        {formatCurrency(subTotalCalc)}
                                    </td>
                                    <td className="p-4 text-sm font-medium text-right">
                                        {descCalc > 0 || totalPct > 0 ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                                    {formatCurrency(descCalc)}
                                                </span>
                                                {descPct > 0 && descPromoPct > 0 ? (
                                                    <div className="flex items-center gap-1 flex-wrap justify-end">
                                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200/60 dark:border-red-900/50" title="Descuento estándar">
                                                            {Number(descPct.toFixed(2))}%
                                                        </span>
                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/50" title="Descuento adicional por promoción">
                                                            + {Number(descPromoPct.toFixed(2))}% Promo
                                                        </span>
                                                    </div>
                                                ) : descPromoPct > 0 ? (
                                                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/50" title="Descuento por promoción">
                                                        {Number(descPromoPct.toFixed(2))}% Promo
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200/60 dark:border-red-900/50">
                                                        {Number(totalPct.toFixed(2))}%
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/60">{formatCurrency(0)}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-primary text-right">
                                        {formatCurrency(s.total)}
                                    </td>
                                <td className="p-4">
                                    <div className="flex justify-center">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                            ${s.estado === EstadoNota.CONFIRMADA ? 'bg-green-100 text-green-700 dark:bg-green-950/70 dark:text-green-300' :
                                                s.estado === EstadoNota.CONVERTIDA ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/70 dark:text-cyan-300' :
                                                s.estado === EstadoNota.PENDIENTE ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/70 dark:text-yellow-300' :
                                                    'bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300'}`}>
                                            {s.estado}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleView(s)}
                                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5"
                                            title="Ver Proforma"
                                        >
                                            <Eye className="w-3" /> Ver
                                        </button>
                                        <button
                                            onClick={() => handleOpenWhatsAppModal(s)}
                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                                            title="Enviar Proforma en PDF por WhatsApp"
                                        >
                                            <MessageCircle className="w-3" /> WhatsApp
                                        </button>
                                        {s.estado === EstadoNota.PENDIENTE && (
                                            <button
                                                onClick={() => handleEdit(s)}
                                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5"
                                                title="Editar Proforma"
                                            >
                                                <Edit className="w-3" /> Editar
                                            </button>
                                        )}
                                        {s.estado === EstadoNota.PENDIENTE && (
                                            <button
                                                onClick={() => confirmMutation.mutate(s.id)}
                                                disabled={confirmMutation.isPending}
                                                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
                                                title="Confirmar Proforma (Aprobar presupuesto)"
                                            >
                                                <CheckCircle className="w-3" /> Confirmar
                                            </button>
                                        )}
                                        {s.estado === EstadoNota.PENDIENTE && (
                                            <button
                                                disabled
                                                className="px-3 py-1.5 bg-muted text-muted-foreground/60 border rounded-lg text-xs font-bold cursor-not-allowed opacity-60 flex items-center gap-1.5"
                                                title="Debe confirmar la proforma antes de poder pasar a venta"
                                            >
                                                <Calculator className="w-3" /> A Venta
                                            </button>
                                        )}
                                        {s.estado === EstadoNota.CONFIRMADA && (
                                            <button
                                                onClick={() => convertMutation.mutate(s.id)}
                                                disabled={convertMutation.isPending}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1.5 shadow-sm"
                                                title="Convertir a Venta"
                                            >
                                                <Calculator className="w-3" /> A Venta
                                            </button>
                                        )}
                                        {s.estado !== EstadoNota.ANULADA && s.estado !== EstadoNota.CONVERTIDA && (
                                            <button
                                                onClick={() => setAnularConfirmId(s.id)}
                                                className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5"
                                                title="Anular Proforma"
                                            >
                                                <Trash2 className="w-3" /> Anular
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                        {filteredProformas.length === 0 && (
                            <tr>
                                <td colSpan={7 + (selectedVendedor === 'all' ? 1 : 0)} className="p-8 text-center text-muted-foreground">
                                    No hay proformas registradas.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Sheet
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Calculator className="w-6 h-6 text-primary/80" />
                        {isViewing ? "Ver Proforma" : editingId ? "Editar Proforma" : "Registrar Nueva Proforma"}
                    </span>
                }
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pb-24">
                    {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <Calendar className="w-3 h-3 text-primary" /> Fecha
                            </label>
                            <input
                                type="date"
                                value={newProforma.fecha}
                                onChange={(e) => setNewProforma({ ...newProforma, fecha: e.target.value })}
                                disabled={isViewing}
                                className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <User className="w-3 h-3 text-primary" /> Cliente
                            </label>
                            <select
                                value={newProforma.clienteId}
                                onChange={(e) => setNewProforma({ ...newProforma, clienteId: e.target.value })}
                                disabled={isViewing}
                                className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none disabled:opacity-50"
                            >
                                <option value="">Cliente Final (Sin registrar)</option>
                                {availableClients?.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombreTienda ? `${c.nombreTienda} - ${c.persona.nombres} ${c.persona.apellidos}` : `${c.persona.nombres} ${c.persona.apellidos}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <User className="w-3.5 h-3.5 text-primary" /> Vendedor
                            </label>
                            {isRestrictedVendor && (
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                                    <Lock className="w-3 h-3" /> Asignado a tu cuenta
                                </p>
                            )}
                            <select
                                value={newProforma.vendedorId || ''}
                                onChange={(e) => {
                                    const vId = e.target.value;
                                    const selectedVendedor = vendedores?.find(v => v.id.toString() === vId);
                                    setNewProforma({ 
                                        ...newProforma, 
                                        vendedorId: vId,
                                        sucursalId: selectedVendedor?.sucursal?.id?.toString() || newProforma.sucursalId 
                                    });
                                }}
                                disabled={isViewing || isRestrictedVendor}
                                className={`w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none ${isRestrictedVendor ? 'opacity-80 bg-muted/50 cursor-not-allowed' : 'disabled:opacity-50'}`}
                            >
                                <option value="">Seleccione vendedor...</option>
                                {vendedores?.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.nombres} {v.apellidos}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <Building2 className="w-3 h-3 text-primary" /> Sucursal
                            </label>
                            <select
                                value={newProforma.sucursalId || ''}
                                onChange={(e) => {
                                    const found = sucursales?.find((s: any) => s.id.toString() === e.target.value);
                                    setNewProforma({ ...newProforma, sucursalId: e.target.value, sucursal: found?.nombre || '' });
                                }}
                                disabled={isViewing || isRestrictedToBranch}
                                className={`w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none ${isRestrictedToBranch ? 'opacity-80 bg-muted/50 cursor-not-allowed' : 'disabled:opacity-50'}`}
                            >
                                <option value="">Seleccione una sucursal...</option>
                                {sucursales?.filter((s: any) => s.activo !== false || s.id.toString() === newProforma.sucursalId?.toString()).map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.nombre}{s.ciudad?.nombre ? ` - ${s.ciudad.nombre}` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="border rounded-xl shadow-sm bg-card overflow-hidden">
                        <div className="p-4 bg-muted/30 border-b flex items-center gap-3">
                            <Package className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Detalle de Productos</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            {!isViewing && (
                                <div className="flex gap-2">
                                    <select
                                        id="productSelect"
                                        className="flex-1 p-2.5 border rounded-lg bg-background text-sm outline-none"
                                        defaultValue=""
                                    >
                                        <option value="" disabled>Seleccione un producto para agregar...</option>
                                        {products?.filter(p => p.activo).map(p => {
                                            const stock = getProductStock(p.id);
                                            const isOutOfStock = stock <= 0;
                                            return (
                                                <option 
                                                    key={p.id} 
                                                    value={p.id}
                                                    style={{ color: isOutOfStock ? '#ef4444' : undefined, fontWeight: isOutOfStock ? 'bold' : 'normal' }}
                                                    className={isOutOfStock ? "text-red-500 font-semibold" : ""}
                                                >
                                                    {p.codigo} - {p.nombre} (Bs. {p.precioVenta}) | {isOutOfStock ? '⚠️ SIN STOCK (0)' : `Stock: ${stock}`}
                                                </option>
                                            );
                                        })}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const select = document.getElementById('productSelect') as HTMLSelectElement;
                                            addProductToDetail(select.value);
                                            select.value = "";
                                        }}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors whitespace-nowrap flex items-center gap-2"
                                    >
                                        <ShoppingCart className="w-4 h-4" />
                                        Añadir al carrito
                                    </button>
                                </div>
                            )}

                            <table className="w-full text-left border-collapse mt-4">
                                <thead>
                                    <tr className="bg-muted/50 border-y">
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Cant.</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">P.Unit</th>
                                        
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Subtotal</th>
                                        <th className="p-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {newProforma.detalles.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                                                El carrito está vacío.
                                            </td>
                                        </tr>
                                    )}
                                    {newProforma.detalles.map((det: any, index: number) => {
                                        const stockDisp = getProductStock(det.productoId || det.producto?.id);
                                        const isExceeded = det.cantidad > stockDisp;

                                        return (
                                            <tr key={index} className={`transition-colors ${isExceeded ? 'bg-red-500/10 border-l-4 border-l-red-500 hover:bg-red-500/15' : 'hover:bg-accent/30'}`}>
                                                <td className="p-3">
                                                    <div className="font-medium text-xs flex items-center gap-1.5 flex-wrap">
                                                        <span>{det.producto?.nombre}</span>
                                                        {isExceeded && (
                                                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded text-[10px] font-bold">
                                                                Excede stock ({stockDisp} disp.)
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground font-mono">{det.producto?.codigo}</div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <div className="flex flex-col items-center gap-1">
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={det.cantidad}
                                                            onChange={(e) => updateDetail(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                            disabled={isViewing}
                                                            className={`w-20 p-2 border rounded-lg bg-background text-center text-sm text-foreground outline-none transition-all font-medium ${
                                                                isExceeded 
                                                                    ? 'border-red-500 bg-red-500/10 text-red-600 font-bold focus:ring-2 focus:ring-red-500/20' 
                                                                    : 'focus:ring-2 focus:ring-primary/20 hover:border-primary/50'
                                                            } disabled:opacity-50 disabled:bg-muted/40`}
                                                        />
                                                        <span className={`text-[10px] ${isExceeded ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                            Stock: {stockDisp}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={det.precioUnitario}
                                                        onChange={(e) => updateDetail(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                        disabled={isViewing}
                                                        className="w-24 p-2 border rounded-lg bg-background text-center text-sm text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-medium disabled:opacity-50 disabled:bg-muted/40"
                                                    />
                                                </td>
                                                <td className={`p-3 text-center font-bold ${isExceeded ? 'text-red-600' : ''}`}>
                                                    {formatCurrency(det.subtotal)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {!isViewing && (
                                                        <button type="button" onClick={() => removeDetail(index)} className="text-destructive hover:scale-110 transition-transform">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">Notas de la Proforma</label>
                        <textarea
                            value={newProforma.observaciones}
                            onChange={(e) => setNewProforma({ ...newProforma, observaciones: e.target.value })}
                            disabled={isViewing}
                            className="w-full p-2.5 border rounded-lg bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 outline-none min-h-[60px] transition-all hover:border-primary/50 disabled:opacity-50"
                            placeholder="Ej: Oferta válida por 7 días..."
                        />
                    </div>

                    <div className="fixed bottom-0 right-0 w-full max-w-4xl p-4 md:p-6 bg-card border-t flex flex-wrap items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-2 items-end pr-6 border-r text-xs font-bold w-60">
                                <div className="flex justify-between w-full"><span>Subtotal:</span> <span>{formatCurrency(calculateTotals().subtotal)}</span></div>
                                <div className="flex justify-between w-full items-center gap-2">
                                    <span className="text-muted-foreground font-medium">Desc (%):</span>
                                    <input disabled={isViewing} type="number" min="0" max="100" step="0.1"
                                        className="w-16 px-2.5 py-1.5 border rounded-lg bg-background text-right text-xs text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-semibold disabled:opacity-50"
                                        value={newProforma.descuentoPorcentaje}
                                        onChange={(e) => setNewProforma({ ...newProforma, descuentoPorcentaje: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                {calculateTotals().desc1 > 0 && (
                                    <div className="flex justify-between w-full text-red-600 dark:text-red-400"><span>-{formatCurrency(calculateTotals().desc1)}</span></div>
                                )}
                                
                                <div className="flex justify-between w-full items-center gap-2">
                                    <span className="text-muted-foreground font-medium">Promo (%):</span>
                                    <input disabled={isViewing} type="number" min="0" max="100" step="0.1"
                                        className="w-16 px-2.5 py-1.5 border rounded-lg bg-background text-right text-xs text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-semibold disabled:opacity-50"
                                        value={newProforma.descuentoPromocionPorcentaje}
                                        onChange={(e) => setNewProforma({ ...newProforma, descuentoPromocionPorcentaje: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                {calculateTotals().desc2 > 0 && (
                                    <div className="flex justify-between w-full text-red-600 dark:text-red-400"><span>-{formatCurrency(calculateTotals().desc2)}</span></div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                                    <Calculator className="w-3 h-3 text-primary" /> Total Proforma
                                </span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(calculateTotals().total)}</span>
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
                                <>
                                    <button
                                        type="button"
                                        onClick={handlePrintIndividualProforma}
                                        className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold shadow-md hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> Imprimir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentProforma = proformas?.find(p => p.id === editingId) || {
                                                id: editingId,
                                                numero: newProforma.numero,
                                                total: calculateTotals().total,
                                                cliente: clients?.find(c => c.id.toString() === newProforma.clienteId),
                                                sucursal: sucursales?.find((s: any) => s.id.toString() === newProforma.sucursalId),
                                                vendedor: vendedores?.find(v => v.id.toString() === newProforma.vendedorId),
                                                fecha: newProforma.fecha,
                                                observaciones: newProforma.observaciones
                                            };
                                            handleOpenWhatsAppModal(currentProforma);
                                        }}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
                                        title="Enviar Proforma en PDF a WhatsApp"
                                    >
                                        <MessageCircle className="w-4 h-4" /> WhatsApp
                                    </button>
                                </>
                            )}
                            {!isViewing && (
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-md hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle className="w-4 h-4" /> {editingId ? 'Actualizar' : 'Registrar'}
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
                        ¿Estás seguro de que deseas anular esta proforma? El estado de la proforma cambiará a <span className="font-bold text-destructive">ANULADA</span>.
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

            {/* Modal de Envío de Proforma por WhatsApp */}
            <Modal
                isOpen={whatsappModalData.isOpen}
                onClose={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        Enviar Proforma por WhatsApp
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappModalData.proforma && (
                    <div className="space-y-4">
                        {/* Card resumen de proforma */}
                        <div className="p-3.5 bg-muted/40 border rounded-xl space-y-1 text-sm">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-foreground">Proforma N° {whatsappModalData.proforma.numero || whatsappModalData.proforma.id}</span>
                                <span className="text-primary text-base">{formatCurrency(whatsappModalData.proforma.total)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>Cliente: {whatsappModalData.proforma.cliente?.persona ? `${whatsappModalData.proforma.cliente.persona.nombres} ${whatsappModalData.proforma.cliente.persona.apellidos}` : 'Cliente Final'}</span>
                                <span>{whatsappModalData.proforma.fecha ? String(whatsappModalData.proforma.fecha).split('T')[0].split('-').reverse().join('/') : '-'}</span>
                            </div>
                        </div>

                        {/* Input de Teléfono */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Número de WhatsApp Destinatario</span>
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
                                El cliente recibirá el documento PDF oficial generado por el sistema junto con los detalles de la cotización.
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
                                        const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(whatsappModalData.sucursalId));
                                        const foundSucursal = sucursales?.find(s => String(s.id) === String(whatsappModalData.sucursalId));
                                        const ciudadNombre = curBranch?.ciudadNombre || (foundSucursal?.ciudad as any)?.nombre;
                                        const branchName = curBranch?.sucursalNombre || foundSucursal?.nombre || 'Sucursal Central';
                                        const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                        return (
                                            <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                        );
                                    })()}
                                </div>
                            </div>
                            {(() => {
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(whatsappModalData.sucursalId));
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
                                placeholder="Escribe una nota personalizada si deseas acompañar el PDF con un mensaje específico..."
                                className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            {/* Fallback WhatsApp Web */}
                            {(() => {
                                const cleanPhone = (whatsappModalData.phone || '').replace(/\D/g, '');
                                const phoneWithCountry = cleanPhone.length === 8 ? `591${cleanPhone}` : cleanPhone;
                                const clienteNombre = whatsappModalData.proforma.cliente?.persona ? `${whatsappModalData.proforma.cliente.persona.nombres || ''} ${whatsappModalData.proforma.cliente.persona.apellidos || ''}`.trim() : 'Cliente';
                                const webText = encodeURIComponent(
                                    `Hola ${clienteNombre}, te compartimos el resumen de tu Proforma N° ${whatsappModalData.proforma.numero || whatsappModalData.proforma.id} emitida por GIPAAF por un total de Bs. ${Number(whatsappModalData.proforma.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}. ¡Quedamos a tu disposición!`
                                );
                                const waLink = `https://wa.me/${phoneWithCountry}?text=${webText}`;

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
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(whatsappModalData.sucursalId));
                                const isConn = curBranch?.status === 'CONNECTED';

                                return (
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false }))}
                                            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sendWhatsAppMutation.isPending || !whatsappModalData.phone.trim() || !isConn}
                                            title={!isConn ? 'El bot de WhatsApp no está conectado en esta sucursal' : undefined}
                                            onClick={() => {
                                                if (!isConn) {
                                                    toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                    return;
                                                }
                                                if (!whatsappModalData.phone.trim()) {
                                                    toast.error('Ingrese el número de teléfono del cliente');
                                                    return;
                                                }
                                                sendWhatsAppMutation.mutate({
                                                    proformaId: whatsappModalData.proforma.id,
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

export default ProformasPage;










