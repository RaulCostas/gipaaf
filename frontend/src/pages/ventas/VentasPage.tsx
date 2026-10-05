import { formatCurrency } from '../../utils/currencyUtils';
import { toast } from 'sonner';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../api/salesService';
import { whatsappService } from '../../api/whatsappService';
import { EstadoNota, TipoNota } from '../../api/purchaseService';
import { clientService } from '../../api/clientService';
import { personalService } from '../../api/personalService';
import { productService } from '../../api/productService';
import { inventoryService } from '../../api/inventoryService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';

import Sheet from '../../components/ui/Sheet';
import Modal from '../../components/ui/Modal';
import { SearchableSelect, type SearchableOption } from '../../components/ui/SearchableSelect';
import { Search, Plus, Trash2, CheckCircle, Calculator, ShoppingCart, Printer, User, Package, Calendar, X, Eye, Edit, AlertTriangle, FileText, Receipt, Building2, Info, CreditCard, Clock, FileSpreadsheet, Filter, Lock, MessageCircle, Send, ExternalLink, Loader2, Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromURL, exportToPDF, exportToExcel, printData, printJsPdf } from '../../utils/exportUtils';
import { numeroALetras } from '../../utils/currencyUtils';
import { getClientDisplayName, getClientPersonName, getClientStoreName } from '../../utils/clientUtils';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';

const ventasPage: React.FC = () => {
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
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [error, setError] = useState<string | null>(null);
    const [selectedProdIdToAdd, setSelectedProdIdToAdd] = useState<string>('');

    // Form State
    const [newVenta, setNewVenta] = useState<any>({
        clienteId: '',
        sucursalId: selectedSucursal || (userSucursal?.id ? String(userSucursal.id) : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : '')),
        vendedorId: isRestrictedVendor && userPersonal?.id ? String(userPersonal.id) : '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        conFactura: false,
        numeroFactura: '',
        observaciones: '',
        descuentoPorcentaje: 0,
        aplicaDescuentoFijo: false,
        descuentoPromocionPorcentaje: 0,
        detalles: []
    });

    const { data: ventas, isLoading: loadingventas } = useQuery({
        queryKey: ['sales'],
        queryFn: salesService.getAll,
    });

    
    const { data: vendedores } = useQuery({
        queryKey: ['vendedores'],
        queryFn: async () => {
            const all = await personalService.getAll();
            return all.filter(p => p.cargo === 'VENDEDOR' && p.activo);
        }
    });

    const { data: clients } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientService.getAll(),
    });

    const availableClients = useMemo(() => {
        if (!clients) return [];
        const activeSucursal = newVenta.sucursalId || selectedSucursal || (userSucursal?.id ? String(userSucursal.id) : '');
        const activeCiudad = selectedCiudad || (userCiudad?.id ? String(userCiudad.id) : '');

        let list = clients;
        if (activeSucursal) {
            list = clients.filter(c => 
                c.sucursal?.id === Number(activeSucursal) || 
                c.ruta?.sucursal?.id === Number(activeSucursal) ||
                (newVenta.clienteId && c.id.toString() === newVenta.clienteId)
            );
        } else if (activeCiudad) {
            list = clients.filter(c => 
                c.sucursal?.ciudad?.id === Number(activeCiudad) || 
                c.ruta?.sucursal?.ciudad?.id === Number(activeCiudad) ||
                (newVenta.clienteId && c.id.toString() === newVenta.clienteId)
            );
        }
        return [...list].sort((a, b) => getClientDisplayName(a).localeCompare(getClientDisplayName(b)));
    }, [clients, newVenta.sucursalId, selectedSucursal, userSucursal?.id, selectedCiudad, userCiudad?.id, newVenta.clienteId]);

    const clientOptions: SearchableOption[] = useMemo(() => {
        return availableClients.map(c => {
            const displayName = getClientDisplayName(c);
            const storeName = getClientStoreName(c);
            const nit = (c as any).nitCi ? `NIT/CI: ${(c as any).nitCi}` : undefined;
            const sub = [storeName && storeName !== displayName ? storeName : '', nit].filter(Boolean).join(' | ');
            return {
                value: c.id,
                label: displayName,
                sublabel: sub || undefined,
            };
        });
    }, [availableClients]);

    
    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
    const { data: inventarios } = useQuery({ queryKey: ['inventarios'], queryFn: inventoryService.getAll });

    const { data: products } = useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getAll(),
    });

    const createMutation = useMutation({
        mutationFn: salesService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setIsCreating(false);
            resetForm();
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Error al registrar Venta'),
    });

    
    const getProductStock = (prodId: number) => {
        if (!inventarios) return 0;
        const targetState = newVenta;
        let invs = inventarios.filter(i => i.producto?.id === prodId);
        if (targetState.sucursalId) {
            invs = invs.filter(i => i.sucursal?.id === Number(targetState.sucursalId));
        }
        let stock = invs.reduce((acc, curr) => acc + Number(curr.stockActual), 0);
        if (editingId && newVenta.estado === EstadoNota.CONFIRMADA) {
            const originalSale = ventas?.find(v => v.id === editingId);
            const originalDet = originalSale?.detalles?.find((d: any) => (d.producto?.id || d.productoId) === prodId);
            if (originalDet) {
                stock += Number(originalDet.cantidad || 0);
            }
        }
        return stock;
    };

    const productOptions: SearchableOption[] = useMemo(() => {
        if (!products) return [];
        return products.filter(p => p.activo).map(p => {
            const stock = getProductStock(p.id);
            const isOutOfStock = stock <= 0;
            return {
                value: p.id,
                label: p.nombre,
                code: p.codigo || undefined,
                sublabel: isOutOfStock 
                    ? '⚠️ Sin stock en la sucursal' 
                    : `Stock: ${stock} ${p.unidadMedida || 'un.'} | Precio: Bs. ${p.precioVenta}`,
                disabled: isOutOfStock
            };
        });
    }, [products, inventarios, newVenta.sucursalId, editingId, newVenta.estado, ventas]);

    const getProductLotes = (prodId: number) => {
        if (!inventarios) return [];
        const targetState = newVenta;
        let invs = inventarios.filter(i => i.producto?.id === prodId);
        if (targetState.sucursalId) {
            invs = invs.filter(i => i.sucursal?.id === Number(targetState.sucursalId));
        }
        const lotes: any[] = [];
        invs.forEach((i: any) => {
            if (i.lotes && i.lotes.length > 0) {
                lotes.push(...i.lotes);
            }
        });
        return lotes;
    };

    const updateMutation = useMutation({
        mutationFn: ({ id, payload }: { id: number; payload: any }) => salesService.update(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setIsCreating(false);
            resetForm();
        },
        onError: (err: any) => setError(err.response?.data?.message || 'Error al actualizar venta'),
    });

    const confirmMutation = useMutation({
        mutationFn: salesService.confirmar,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al confirmar venta'),
    });

    

    const anularMutation = useMutation({
        mutationFn: salesService.anular,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] })
    });

    // WhatsApp State & Mutations
    const [whatsappModalData, setWhatsappModalData] = useState<{
        isOpen: boolean;
        venta: any | null;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        venta: null,
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const { data: whatsappBranches } = useQuery({
        queryKey: ['whatsapp-branches-status'],
        queryFn: () => whatsappService.getBranchesStatus(),
        staleTime: 1000 * 60 * 5,
        enabled: whatsappModalData.isOpen,
    });

    const sendWhatsAppMutation = useMutation({
        mutationFn: (payload: { ventaId: number; phone?: string; sucursalId?: number; message?: string }) =>
            salesService.sendWhatsApp(payload),
        onSuccess: (data) => {
            toast.success(data.message || 'Nota de venta enviada exitosamente por WhatsApp');
            setWhatsappModalData(prev => ({ ...prev, isOpen: false, venta: null }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar nota de venta por WhatsApp');
        }
    });

    const handleOpenWhatsAppModal = (venta: any) => {
        const clientPhone = venta.cliente?.persona?.telefono || '';
        const initialSucursalId = venta.sucursal?.id 
            ? String(venta.sucursal.id) 
            : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : ''));

        setWhatsappModalData({
            isOpen: true,
            venta,
            phone: clientPhone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    
    const resetForm = () => {
        setEditingId(null);
        setIsViewing(false);
        setSelectedProdIdToAdd('');
        const firstSucInCiudad = selectedCiudad ? sucursales?.find((s: any) => s.ciudad?.id === Number(selectedCiudad))?.id?.toString() : '';
        const defaultSucId = selectedSucursal || (userSucursal?.id ? String(userSucursal.id) : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (firstSucInCiudad || '')));
        const defaultSucNombre = sucursales?.find((s: any) => s.id.toString() === defaultSucId)?.nombre || userSucursal?.nombre || userPersonal?.sucursal?.nombre || '';

        setNewVenta({
            numero: '',
            clienteId: '',
            sucursalId: defaultSucId,
            vendedorId: isRestrictedVendor && userPersonal?.id ? String(userPersonal.id) : '',
            sucursal: defaultSucNombre,
            fecha: format(new Date(), 'yyyy-MM-dd'),
            tipoPago: 'CONTADO',
            diasCredito: 0,
            fechaVencimiento: '',
            tipoDocumento: 'NOTA_VENTA',
            observaciones: '',
            detalles: [],
            montoEfectivo: 0,
            montoTransferencia: 0,
            montoQr: 0,
            montoTarjeta: 0,
            descuentoPorcentaje: 0,
            aplicaDescuentoFijo: false,
            descuentoPromocionPorcentaje: 0
        });
        setError(null);
    };

    const handleEdit = (venta: any) => {
        setEditingId(venta.id);
        setIsViewing(false);
        setNewVenta({
            id: venta.id,
            estado: venta.estado,
            numero: venta.numero || '',
            clienteId: venta.cliente?.id?.toString() || '',
            sucursalId: venta.sucursal?.id?.toString() || '',
            vendedorId: venta.vendedor?.id?.toString() || '',
            sucursal: venta.sucursal?.nombre || '',
            fecha: venta.fecha ? venta.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
            conFactura: Boolean(venta.conFactura),
            numeroFactura: venta.numeroFactura || '',
            tipoPago: venta.tipoPago || (venta.diasCredito > 0 ? 'CREDITO' : 'CONTADO'),
            diasCredito: Number(venta.diasCredito || 0),
            fechaVencimiento: venta.fechaVencimiento ? String(venta.fechaVencimiento).split('T')[0] : '',
            tipoDocumento: venta.tipoDocumento || 'NOTA_VENTA',
            observaciones: venta.observaciones || '',
            descuentoPorcentaje: Number(venta.descuentoPorcentaje || 0),
            aplicaDescuentoFijo: Boolean(venta.aplicaDescuentoFijo) || Number(venta.descuentoFijoPorcentaje || 0) > 0,
            descuentoPromocionPorcentaje: Number(venta.descuentoPromocionPorcentaje || 0),
            detalles: venta.detalles?.map((d: any) => ({
                productoId: d.producto?.id || d.productoId,
                producto: d.producto,
                cantidad: Number(d.cantidad),
                precioUnitario: Number(d.precioUnitario),
                descuentoPorcentaje: Number(d.descuentoPorcentaje || 0),
                subtotal: Number(d.subtotal),
                numeroLote: d.numeroLote || '',
                movimientosLote: d.movimientosLote || []
            })) || [],
            montoEfectivo: Number(venta.montoEfectivo || 0),
            montoTransferencia: Number(venta.montoTransferencia || 0),
            montoQr: Number(venta.montoQr || 0),
            montoTarjeta: Number(venta.montoTarjeta || 0)
        });
        setIsCreating(true);
    };

    const handleView = (venta: any) => {
        setEditingId(venta.id);
        setIsViewing(true);
        setNewVenta({
            id: venta.id,
            estado: venta.estado,
            numero: venta.numero || '',
            clienteId: venta.cliente?.id?.toString() || '',
            sucursalId: venta.sucursal?.id?.toString() || '',
            vendedorId: venta.vendedor?.id?.toString() || '',
            sucursal: venta.sucursal?.nombre || '',
            fecha: venta.fecha ? venta.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'),
            conFactura: Boolean(venta.conFactura),
            numeroFactura: venta.numeroFactura || '',
            tipoPago: venta.tipoPago || (venta.diasCredito > 0 ? 'CREDITO' : 'CONTADO'),
            diasCredito: Number(venta.diasCredito || 0),
            fechaVencimiento: venta.fechaVencimiento ? String(venta.fechaVencimiento).split('T')[0] : '',
            tipoDocumento: venta.tipoDocumento || 'NOTA_VENTA',
            observaciones: venta.observaciones || '',
            descuentoPorcentaje: Number(venta.descuentoPorcentaje || 0),
            aplicaDescuentoFijo: Boolean(venta.aplicaDescuentoFijo) || Number(venta.descuentoFijoPorcentaje || 0) > 0,
            descuentoPromocionPorcentaje: Number(venta.descuentoPromocionPorcentaje || 0),
            detalles: venta.detalles?.map((d: any) => ({
                productoId: d.producto?.id || d.productoId,
                producto: d.producto,
                cantidad: Number(d.cantidad),
                precioUnitario: Number(d.precioUnitario),
                descuentoPorcentaje: Number(d.descuentoPorcentaje || 0),
                subtotal: Number(d.subtotal),
                numeroLote: d.numeroLote || '',
                movimientosLote: d.movimientosLote || []
            })) || [],
            montoEfectivo: Number(venta.montoEfectivo || 0),
            montoTransferencia: Number(venta.montoTransferencia || 0),
            montoQr: Number(venta.montoQr || 0),
            montoTarjeta: Number(venta.montoTarjeta || 0)
        });
        setIsCreating(true);
    };

    const handlePrintIndividualVenta = async () => {
        const doc = new jsPDF();
        
        try {
            const logoBase64 = await getBase64ImageFromURL('/logo.jpeg');
            doc.addImage(logoBase64, 'JPEG', 14, 10, 45, 15);
        } catch (e) {
            console.warn('Could not load logo for PDF', e);
        }

        doc.setFontSize(14);
        doc.setTextColor(30, 30, 30);
        doc.setFont("helvetica", "bold");
        doc.text("Nota de Venta Nro " + (newVenta.numero || newVenta.id || 'S/N'), 196, 18, { align: 'right' });

        doc.setTextColor(60, 60, 60);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9.5);
        let currentY = 32;
        
        const fechaFormatted = newVenta.fecha ? newVenta.fecha.split('T')[0].split('-').reverse().join('/') : '';
        doc.text(`Fecha: ${fechaFormatted}`, 14, currentY);
        if (newVenta.sucursal) {
            doc.text(`Sucursal: ${newVenta.sucursal}`, 80, currentY);
        }
        currentY += 5;
        
        let clienteNombre = 'Cliente Final';
        if (newVenta.clienteId) {
            const c = clients?.find(c => c.id.toString() === newVenta.clienteId.toString());
            if (c) clienteNombre = getClientDisplayName(c);
        }
        doc.text(`Cliente: ${clienteNombre}`, 14, currentY);
        
        if (newVenta.vendedorId) {
            const v = vendedores?.find(v => v.id.toString() === newVenta.vendedorId.toString());
            if (v) doc.text(`Vendedor: ${v.nombres} ${v.apellidos}`, 80, currentY);
        }
        currentY += 5;

        const docTipo = newVenta.conFactura ? `Con Factura${newVenta.numeroFactura ? ` (FAC: ${newVenta.numeroFactura})` : ''}` : 'Sin Factura (Nota Venta)';
        doc.text(`Documento: ${docTipo}`, 14, currentY);

        let pagoTexto = 'Al Contado';
        if (newVenta.tipoPago === 'CREDITO') {
            const diasCred = Number(newVenta.diasCredito) || 0;
            const baseDateStr = newVenta.fecha || format(new Date(), 'yyyy-MM-dd');
            const d = new Date(baseDateStr + 'T00:00:00');
            d.setDate(d.getDate() + diasCred);
            const vencStr = format(d, 'dd/MM/yyyy');
            pagoTexto = `A Crédito (${diasCred} días - Vence: ${vencStr})`;
        }
        doc.text(`Condición: ${pagoTexto}`, 80, currentY);

        const hasItemDiscount = newVenta.detalles.some((det: any) => Number(det.descuentoPorcentaje) > 0);

        const tableColumn = hasItemDiscount
            ? ["Código", "Producto", "Cant.", "P.Unit", "Desc. %", "Subtotal"]
            : ["Código", "Producto", "Cant.", "P.Unit", "Subtotal"];

        const tableRows = newVenta.detalles.map((det: any) => {
            const descPct = Number(det.descuentoPorcentaje) || 0;

            const row = [
                det.producto?.codigo || '-',
                det.producto?.nombre || '-',
                det.cantidad.toString(),
                formatCurrency(det.precioUnitario)
            ];

            if (hasItemDiscount) {
                row.push(descPct > 0 ? `${descPct}%` : '0%');
            }

            row.push(formatCurrency(det.subtotal));
            return row;
        });

        autoTable(doc, {
            startY: currentY + 4,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: {
                font: 'helvetica',
                fontSize: 8.5,
                cellPadding: 2.5,
                valign: 'middle',
                textColor: [30, 30, 30],
                lineColor: [200, 200, 200],
                lineWidth: 0.1,
            },
            headStyles: {
                fillColor: [240, 240, 240],
                textColor: [0, 0, 0],
                fontStyle: 'bold',
                lineColor: [180, 180, 180],
                lineWidth: 0.1,
                cellPadding: 2.5,
            },
            alternateRowStyles: {
                fillColor: [252, 252, 252]
            },
            columnStyles: hasItemDiscount ? {
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'center' },
                5: { halign: 'right' }
            } : {
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY || currentY + 8;
        const totals = calculateTotals();
        let currentTotalY = finalY + 8;
        
        doc.setFontSize(9.5);
        doc.setTextColor(40, 40, 40);
        doc.setFont("helvetica", "normal");
        
        doc.text(`Subtotal: ${formatCurrency(totals.subtotal)}`, 196, currentTotalY, { align: 'right' });
        currentTotalY += 5;
        if (totals.desc1 > 0) {
            doc.text(`Descuento (${newVenta.descuentoPorcentaje}%): -${formatCurrency(totals.desc1)}`, 196, currentTotalY, { align: 'right' });
            currentTotalY += 5;
        }
        if (totals.descFijo > 0) {
            doc.text(`Descuento Fijo (3%): -${formatCurrency(totals.descFijo)}`, 196, currentTotalY, { align: 'right' });
            currentTotalY += 5;
        }
        if (totals.desc2 > 0) {
            doc.text(`Promoción (${newVenta.descuentoPromocionPorcentaje}%): -${formatCurrency(totals.desc2)}`, 196, currentTotalY, { align: 'right' });
            currentTotalY += 5;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(`Total: ${formatCurrency(totals.total)}`, 196, currentTotalY, { align: 'right' });
        
        doc.setFontSize(9.5);
        doc.setFont("helvetica", "normal");
        doc.text(`Son: ${numeroALetras(totals.total)}`, 14, finalY + 8);
        
        if (newVenta.observaciones) {
            doc.setFontSize(9);
            doc.setTextColor(80, 80, 80);
            doc.setFont("helvetica", "normal");
            doc.text('Notas:', 14, finalY + 16);
            doc.setFont("helvetica", "italic");
            doc.text(newVenta.observaciones, 14, finalY + 21);
        }

        const bottomContentY = Math.max(currentTotalY, newVenta.observaciones ? finalY + 26 : finalY + 14);
        let signatureY = bottomContentY + 24;

        if (signatureY > 265) {
            doc.addPage();
            signatureY = 40;
        }

        doc.setDrawColor(160, 160, 160);
        doc.setLineDashPattern([1, 1], 0);
        doc.line(20, signatureY, 68, signatureY);
        doc.line(81, signatureY, 129, signatureY);
        doc.line(142, signatureY, 190, signatureY);

        doc.setFontSize(8.5);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(60, 60, 60);
        doc.text('ALMACEN', 44, signatureY + 5, { align: 'center' });
        doc.text('VENDEDOR', 105, signatureY + 5, { align: 'center' });
        doc.text('RECIBIDO POR', 166, signatureY + 5, { align: 'center' });

        printJsPdf(doc);
    };

    const addProductToDetail = (prodId: string) => {
        const prod = products?.find(p => p.id === Number(prodId));
        if (!prod) return;

        if (newVenta.detalles.some((d: any) => d.productoId === prod.id)) return;

        const precioVentaNum = Number(prod.precioVenta) || 0;

        setNewVenta({
            ...newVenta,
            detalles: [...newVenta.detalles, {
                productoId: prod.id,
                producto: prod,
                cantidad: 1,
                precioUnitario: precioVentaNum,
                descuentoPorcentaje: 0,
                subtotal: precioVentaNum
            }]
        });
    };

    const removeDetail = (index: number) => {
        const newDetails = [...newVenta.detalles];
        newDetails.splice(index, 1);
        setNewVenta({ ...newVenta, detalles: newDetails });
    };

    const updateDetail = (index: number, field: string, value: number) => {
        const newDetails = [...newVenta.detalles];
        const det = { ...newDetails[index], [field]: value };
        const cant = Number(det.cantidad) || 0;
        const pu = Number(det.precioUnitario) || 0;
        const descPorc = Math.max(0, Math.min(100, Number(det.descuentoPorcentaje) || 0));
        det.descuentoPorcentaje = descPorc;
        const descMonto = (cant * pu * descPorc) / 100;
        det.subtotal = Number(((cant * pu) - descMonto).toFixed(2));
        newDetails[index] = det;
        setNewVenta({ ...newVenta, detalles: newDetails });
    };

    const calculateTotals = () => {
        const subtotal = newVenta.detalles.reduce((acc: number, det: any) => {
            const cant = Number(det.cantidad) || 0;
            const pu = Number(det.precioUnitario) || 0;
            const descPorc = Number(det.descuentoPorcentaje) || 0;
            const itemSubtotal = (cant * pu) * (1 - descPorc / 100);
            return acc + itemSubtotal;
        }, 0);
        
        // 1. Descuento estándar
        const desc1 = (subtotal * Number(newVenta.descuentoPorcentaje || 0)) / 100;
        const sub1 = subtotal - desc1;
        
        // 2. Descuento fijo 3%
        const hasFijo = Boolean(newVenta.aplicaDescuentoFijo);
        const descFijoPct = hasFijo ? 3 : 0;
        const descFijo = (sub1 * descFijoPct) / 100;
        const subFijo = sub1 - descFijo;
        
        // 3. Descuento promoción
        const desc2 = (subFijo * Number(newVenta.descuentoPromocionPorcentaje || 0)) / 100;
        const total = subFijo - desc2;
        
        return { subtotal, desc1, descFijo, hasFijo, descFijoPct, desc2, total };
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newVenta.detalles.length === 0) {
            setError('Agregue al menos un producto a la Venta');
            return;
        }

        if (newVenta.conFactura && !newVenta.numeroFactura?.trim()) {
            setError('Debe ingresar el número de factura si la venta es con factura');
            return;
        }

        if (newVenta.tipoPago === 'CREDITO') {
            const enteredDias = Number(newVenta.diasCredito) || 0;
            if (enteredDias <= 0) {
                setError('Debe ingresar un plazo de crédito válido en días');
                return;
            }
        }

        const payload = {
            cliente: newVenta.clienteId ? { id: Number(newVenta.clienteId) } : null,
            vendedor: newVenta.vendedorId ? { id: Number(newVenta.vendedorId) } : null,
            sucursal: newVenta.sucursalId ? { id: Number(newVenta.sucursalId) } : null,
            fecha: newVenta.fecha,
            conFactura: Boolean(newVenta.conFactura),
            numeroFactura: newVenta.conFactura ? newVenta.numeroFactura.trim() : null,
            tipoPago: newVenta.tipoPago || 'CONTADO',
            diasCredito: newVenta.tipoPago === 'CREDITO' ? Number(newVenta.diasCredito || 0) : 0,
            observaciones: newVenta.observaciones,
            detalles: newVenta.detalles.map((d: any) => ({
                producto: { id: d.productoId },
                cantidad: d.cantidad,
                precioUnitario: d.precioUnitario,
                descuentoPorcentaje: Number(d.descuentoPorcentaje || 0)
            })),
            descuentoPorcentaje: newVenta.descuentoPorcentaje,
            aplicaDescuentoFijo: Boolean(newVenta.aplicaDescuentoFijo),
            descuentoFijoPorcentaje: newVenta.aplicaDescuentoFijo ? 3 : 0,
            descuentoPromocionPorcentaje: newVenta.descuentoPromocionPorcentaje
        };
        if (editingId) {
            updateMutation.mutate({ id: editingId, payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const filteredventas = useMemo(() => {
        if (!ventas) return [];
        let filtered = ventas;
        
        if (selectedSucursal) {
            filtered = filtered.filter(p => p.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
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
                (p.numeroFactura && p.numeroFactura.toLowerCase().includes(term)) ||
                p.cliente?.nombreTienda?.toLowerCase().includes(term) ||
                p.cliente?.persona?.nombres?.toLowerCase().includes(term) ||
                p.cliente?.persona?.apellidos?.toLowerCase().includes(term) ||
                p.vendedor?.nombres?.toLowerCase().includes(term) ||
                p.vendedor?.apellidos?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [ventas, search, selectedSucursal, selectedCiudad, selectedVendedor, fechaDesde, fechaHasta, isRestrictedVendor, userPersonal]);

    const totalPages = Math.ceil(filteredventas.length / itemsPerPage) || 1;

    const paginatedVentas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredventas.slice(start, start + itemsPerPage);
    }, [filteredventas, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedSucursal, selectedCiudad, selectedVendedor, fechaDesde, fechaHasta]);

    const exportColumns = [
        { header: 'N° Venta', dataKey: 'numero' },
        { header: 'Fecha', dataKey: 'fechaFormatted' },
        { header: 'Cliente', dataKey: 'clienteNombre' },
        { header: 'Vendedor', dataKey: 'vendedorNombre' },
        { header: 'Nota de Venta', dataKey: 'observaciones' },
        { header: 'Sucursal', dataKey: 'sucursalNombre' },
        { header: 'SubTotal', dataKey: 'subtotalFormatted' },
        { header: 'Descuento', dataKey: 'descuentoFormatted' },
        { header: 'Total', dataKey: 'totalFormatted' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const getFormattedData = () => {
        return filteredventas.map(s => {
            const desc1Calc = Number(s.descuento) || 0;
            const descFijoCalc = Number(s.descuentoFijo) || 0;
            const desc2Calc = Number(s.descuentoPromocion) || 0;
            const descTotalCalc = desc1Calc + descFijoCalc + desc2Calc;
            const subTotalCalc = (Number(s.total) || 0) + descTotalCalc;
            
            const descPct = Number(s.descuentoPorcentaje) || 0;
            const hasFijo = Boolean(s.aplicaDescuentoFijo) || Number(s.descuentoFijoPorcentaje || 0) > 0 || descFijoCalc > 0;
            const descPromoPct = Number(s.descuentoPromocionPorcentaje) || 0;

            const parts: string[] = [];
            if (descPct > 0) parts.push(`${Number(descPct.toFixed(2))}%`);
            if (hasFijo) parts.push(`3% Fijo`);
            if (descPromoPct > 0) parts.push(`${Number(descPromoPct.toFixed(2))}% Promo`);
            const pctLabel = parts.length > 0 ? ` (${parts.join(' + ')})` : '';

            const docInfo = s.conFactura ? `FAC: ${s.numeroFactura || 'S/N'}` : 'Nota de Entrega';
            return {
                id: s.id,
                numero: s.numero || '-',
                fechaFormatted: s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '-',
                clienteNombre: getClientDisplayName(s.cliente),
                vendedorNombre: s.vendedor ? `${s.vendedor.nombres || ''} ${s.vendedor.apellidos || ''}`.trim() : '---',
                observaciones: s.observaciones || '-',
                sucursalNombre: s.sucursal?.nombre || '-',
                documentoTipo: docInfo,
                subtotalFormatted: formatCurrency(subTotalCalc),
                descuentoFormatted: `${formatCurrency(descTotalCalc)}${pctLabel}`,
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

        return texts.length > 0 ? texts.join(' | ') : 'Todas las ventas';
    };

    const handlePrintReport = () => {
        if (!filteredventas.length) {
            toast.error('No hay ventas para imprimir');
            return;
        }
        printData('Reporte de Ventas', exportColumns, getFormattedData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!filteredventas.length) {
            toast.error('No hay ventas para exportar');
            return;
        }
        exportToPDF('Reporte de Ventas', exportColumns, getFormattedData(), 'ventas_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!filteredventas.length) {
            toast.error('No hay ventas para exportar');
            return;
        }
        exportToExcel(exportColumns, getFormattedData(), 'ventas_reporte');
    };

    const hasActiveFilters = selectedVendedor !== 'all' || !!fechaDesde || !!fechaHasta || !!search;
    const handleClearFilters = () => {
        setSelectedVendedor('all');
        setFechaDesde('');
        setFechaHasta('');
        setSearch('');
    };


    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <ShoppingCart className="w-8 h-8 text-primary/80" />
                        Ventas
                    </h1>
                    <p className="text-muted-foreground italic">Gestiona las ventas y transacciones de la empresa.</p>
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
                        Nueva Venta
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
                        placeholder="Buscar por cliente, nro o factura..."
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
                        <span>Mis Ventas ({userPersonal.nombres} {userPersonal.apellidos})</span>
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
                <table className="w-full text-left border-collapse min-w-[950px]">
                    <thead>
                        <tr className="bg-muted/50 border-b">
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Número / Fecha</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Cliente</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Vendedor</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground">Nota de Venta</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">SubTotal</th>
                            
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Descuento</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Total</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Estado</th>
                            <th className="p-4 text-sm font-semibold text-muted-foreground text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {loadingventas ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-muted-foreground">
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                        <span>Cargando ventas...</span>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedVentas.length > 0 ? (
                            paginatedVentas.map((s) => {
                            const desc1Calc = Number(s.descuento) || 0;
                            const descFijoCalc = Number(s.descuentoFijo) || 0;
                            const desc2Calc = Number(s.descuentoPromocion) || 0;
                            const descTotalCalc = desc1Calc + descFijoCalc + desc2Calc;
                            const subTotalCalc = (Number(s.total) || 0) + descTotalCalc;

                            const descPct = Number(s.descuentoPorcentaje) || 0;
                            const hasFijo = Boolean(s.aplicaDescuentoFijo) || Number(s.descuentoFijoPorcentaje || 0) > 0 || descFijoCalc > 0;
                            const descPromoPct = Number(s.descuentoPromocionPorcentaje) || 0;

                            return (
                                <tr key={s.id} className="hover:bg-accent/50 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-sm font-bold">{s.numero}</span>
                                                {s.conFactura ? (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200" title={`Factura Nro: ${s.numeroFactura || 'S/N'}`}>
                                                        FAC: {s.numeroFactura || 'S/N'}
                                                    </span>
                                                ) : (
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                                        Sin Factura
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs text-muted-foreground">{s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '---'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            {s.cliente?.nombreTienda ? (
                                                <span className="text-sm font-bold text-foreground flex items-center gap-1">
                                                    <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    {s.cliente.nombreTienda}
                                                </span>
                                            ) : (
                                                <span className="text-sm font-medium">
                                                    {getClientPersonName(s.cliente)}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-muted-foreground">
                                                {s.vendedor ? `${s.vendedor.nombres} ${s.vendedor.apellidos}` : '---'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 max-w-[200px]">
                                        {s.observaciones ? (
                                            <span className="text-xs text-muted-foreground line-clamp-2" title={s.observaciones}>
                                                {s.observaciones}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/50 font-mono">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm font-medium text-right text-muted-foreground">
                                        {formatCurrency(subTotalCalc)}
                                    </td>
                                    <td className="p-4 text-sm font-medium text-right">
                                        {descTotalCalc > 0 || descPct > 0 || hasFijo || descPromoPct > 0 ? (
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-red-600 dark:text-red-400 font-semibold">
                                                    {formatCurrency(descTotalCalc)}
                                                </span>
                                                <div className="flex items-center gap-1 flex-wrap justify-end">
                                                    {descPct > 0 && (
                                                        <span className="text-[10px] font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200/60 dark:border-red-900/50" title="Descuento estándar">
                                                            {Number(descPct.toFixed(2))}%
                                                        </span>
                                                    )}
                                                    {hasFijo && (
                                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-900/50" title="Descuento fijo del 3% en ventas">
                                                            {descPct > 0 ? '+ ' : ''}3% Fijo
                                                        </span>
                                                    )}
                                                    {descPromoPct > 0 && (
                                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200/60 dark:border-amber-900/50" title="Descuento adicional por promoción">
                                                            {(descPct > 0 || hasFijo) ? '+ ' : ''}{Number(descPromoPct.toFixed(2))}% Promo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground/60">{formatCurrency(0)}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm font-bold text-primary text-right">
                                        {formatCurrency(s.total)}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex justify-center flex-wrap gap-2">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider 
                                                ${s.estado === EstadoNota.CONFIRMADA ? 'bg-green-100 text-green-700' :
                                                    s.estado === EstadoNota.PENDIENTE ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-red-100 text-red-700'}`}>
                                                {s.estado}
                                            </span>
                                        </div>
                                    </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2 flex-wrap">
                                        <button
                                            onClick={() => handleView(s)}
                                            className="px-3 py-1.5 bg-gray-600 text-white rounded-lg text-xs font-bold hover:bg-gray-700 transition-all flex items-center gap-1.5"
                                            title="Ver Venta"
                                        >
                                            <Eye className="w-3" /> Ver
                                        </button>
                                        <button
                                            onClick={() => handleOpenWhatsAppModal(s)}
                                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                                            title="Enviar Nota de Venta en PDF por WhatsApp"
                                        >
                                            <MessageCircle className="w-3" /> WhatsApp
                                        </button>
                                        {s.estado !== EstadoNota.ANULADA && (
                                            <button
                                                onClick={() => handleEdit(s)}
                                                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5"
                                                title="Editar Venta"
                                            >
                                                <Edit className="w-3" /> Editar
                                            </button>
                                        )}
                                        {s.estado === EstadoNota.PENDIENTE && (
                                            <button
                                                onClick={() => confirmMutation.mutate(s.id)}
                                                className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all flex items-center gap-1.5"
                                                title="Confirmar Venta (Cerrar)"
                                            >
                                                <CheckCircle className="w-3" /> Confirmar
                                            </button>
                                        )}
                                        {s.estado !== EstadoNota.ANULADA && (
                                            Number(s.saldo) < Number(s.total) ? (
                                                <button
                                                    type="button"
                                                    disabled
                                                    className="px-3 py-1.5 bg-muted text-muted-foreground border rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-not-allowed opacity-60"
                                                    title={Number(s.saldo) <= 0.001 
                                                        ? "Venta 100% Pagada: Está protegida contra anulación. Debe anular sus cobros en Cobranzas primero." 
                                                        : "Venta con Cobros Registrados: Debe anular sus cobros en Cobranzas antes de anular la venta."}
                                                >
                                                    <Lock className="w-3 h-3" /> Anular
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => setAnularConfirmId(s.id)}
                                                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer"
                                                    title="Anular Venta"
                                                >
                                                    <Trash2 className="w-3" /> Anular
                                                </button>
                                            )
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })
                ) : (
                    <tr>
                        <td colSpan={9} className="p-8 text-center text-muted-foreground">
                            No hay ventas registradas.
                        </td>
                    </tr>
                )}
            </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredventas.length)} de {filteredventas.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                disabled={currentPage === 1} 
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm font-medium px-2">
                                Página {currentPage} de {totalPages}
                            </span>
                            <button 
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                disabled={currentPage === totalPages} 
                                className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <Sheet
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <ShoppingCart className="w-6 h-6 text-primary/80" />
                        {isViewing ? 'Ver Venta' : editingId ? 'Editar Venta' : 'Registrar Nueva Venta'}
                    </span>
                }
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6 pb-52">
                    {error && <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg border border-destructive/20">{error}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <Calendar className="w-3 h-3 text-primary" /> Fecha
                            </label>
                            <input disabled={isViewing} 
                                type="date"
                                value={newVenta.fecha}
                                onChange={(e) => setNewVenta({ ...newVenta, fecha: e.target.value })}
                                className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <User className="w-3.5 h-3.5 text-primary" /> Cliente
                            </label>
                            <SearchableSelect
                                disabled={isViewing}
                                value={newVenta.clienteId}
                                onChange={(val) => setNewVenta({ ...newVenta, clienteId: val })}
                                options={clientOptions}
                                placeholder="Cliente Final (Sin registrar)"
                                searchPlaceholder="Buscar cliente por nombre o NIT..."
                            />
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
                                disabled={isViewing || isRestrictedVendor} 
                                value={newVenta.vendedorId || ''}
                                onChange={(e) => {
                                    const vId = e.target.value;
                                    const selectedVendedor = vendedores?.find(v => v.id.toString() === vId);
                                    setNewVenta({ 
                                        ...newVenta, 
                                        vendedorId: vId,
                                        sucursalId: selectedVendedor?.sucursal?.id?.toString() || newVenta.sucursalId 
                                    });
                                }}
                                className={`w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 ${isRestrictedVendor ? 'opacity-80 bg-muted/50 cursor-not-allowed' : ''}`}
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
                            <select disabled={isViewing || isRestrictedToBranch} 
                                value={newVenta.sucursalId || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const found = sucursales?.find((s: any) => s.id.toString() === val);
                                    setNewVenta({ ...newVenta, sucursalId: val, sucursal: found?.nombre || '' });
                                }}
                                className={`w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 ${isRestrictedToBranch ? 'opacity-80 bg-muted/50 cursor-not-allowed' : ''}`}
                            >
                                <option value="">Seleccione una sucursal...</option>
                                {sucursales?.filter((s: any) => s.activo !== false || s.id.toString() === newVenta.sucursalId?.toString()).map((s: any) => (
                                    <option key={s.id} value={s.id}>{s.nombre}{s.ciudad?.nombre ? ` (${s.ciudad.nombre})` : ''}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/20 border rounded-xl">
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <FileText className="w-3.5 h-3.5 text-primary" /> Tipo de Documento
                            </label>
                            <select 
                                disabled={isViewing}
                                value={newVenta.conFactura ? 'true' : 'false'}
                                onChange={(e) => {
                                    const isWith = e.target.value === 'true';
                                    setNewVenta({
                                        ...newVenta,
                                        conFactura: isWith,
                                        numeroFactura: isWith ? newVenta.numeroFactura : ''
                                    });
                                }}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 font-medium"
                            >
                                <option value="false">📄 Sin Factura (Nota Venta)</option>
                                <option value="true">🧾 Con Factura</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <Receipt className="w-3.5 h-3.5 text-primary" /> Número de Factura {newVenta.conFactura && <span className="text-destructive font-bold">*</span>}
                            </label>
                            <div className="relative">
                                <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <input 
                                    disabled={isViewing || !newVenta.conFactura}
                                    type="text"
                                    placeholder={newVenta.conFactura ? "Ej: 10452" : "No aplica"}
                                    value={newVenta.numeroFactura || ''}
                                    onChange={(e) => setNewVenta({ ...newVenta, numeroFactura: e.target.value })}
                                    required={newVenta.conFactura}
                                    className={`w-full pl-9 pr-3 py-2.5 border rounded-lg bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 outline-none transition-all ${
                                        !newVenta.conFactura ? 'opacity-50 bg-muted/40 cursor-not-allowed' : 'hover:border-primary/50'
                                    }`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <CreditCard className="w-3.5 h-3.5 text-primary" /> Condición de Pago
                            </label>
                            <select 
                                disabled={isViewing}
                                value={newVenta.tipoPago || 'CONTADO'}
                                onChange={(e) => {
                                    const tp = e.target.value;
                                    const selectedCli = clients?.find(c => c.id.toString() === newVenta.clienteId);
                                    const defaultDias = tp === 'CREDITO' ? (selectedCli?.plazoCreditoDias || 30) : 0;
                                    setNewVenta({
                                        ...newVenta,
                                        tipoPago: tp,
                                        diasCredito: defaultDias
                                    });
                                }}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 font-medium"
                            >
                                <option value="CONTADO">Al Contado</option>
                                <option value="CREDITO">A Crédito</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">
                                <Clock className="w-3.5 h-3.5 text-primary" /> Plazo Crédito (Días)
                            </label>
                            <div className="flex items-center gap-2.5">
                                <input 
                                    disabled={isViewing || newVenta.tipoPago !== 'CREDITO'}
                                    type="number"
                                    min="1"
                                    placeholder={newVenta.tipoPago === 'CREDITO' ? "30" : "0"}
                                    value={newVenta.tipoPago === 'CREDITO' ? (newVenta.diasCredito || '') : 0}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value) || 0;
                                        setNewVenta({ ...newVenta, diasCredito: val });
                                    }}
                                    className={`w-24 p-2.5 text-center font-bold border rounded-lg bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all shrink-0 ${
                                        newVenta.tipoPago !== 'CREDITO' ? 'opacity-50 bg-muted/40 cursor-not-allowed' : 'hover:border-primary/50'
                                    }`}
                                />
                                {newVenta.tipoPago === 'CREDITO' ? (() => {
                                    const selectedCli = clients?.find(c => c.id.toString() === newVenta.clienteId);
                                    const max = Number(selectedCli?.plazoCreditoDias) || 0;
                                    const currentDias = Number(newVenta.diasCredito) || 0;
                                    
                                    const baseDateStr = newVenta.fecha || format(new Date(), 'yyyy-MM-dd');
                                    const d = new Date(baseDateStr + 'T00:00:00');
                                    d.setDate(d.getDate() + currentDias);
                                    const formattedVenc = format(d, 'dd/MM/yyyy');

                                    return (
                                        <div className="flex flex-col text-[11px] leading-tight">
                                            {max > 0 && (
                                                <span className={currentDias > max ? "text-amber-600 dark:text-amber-400 font-medium" : "text-primary font-semibold"}>
                                                    {currentDias > max ? `Plazo cliente: ${max} d (extendido)` : `Plazo cliente: ${max} d`}
                                                </span>
                                            )}
                                            <span className="text-muted-foreground">Vence: <strong className="text-foreground">{formattedVenc}</strong></span>
                                        </div>
                                    );
                                })() : (
                                    <span className="text-xs text-muted-foreground italic">0 días</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border rounded-xl shadow-sm bg-card">
                        <div className="p-4 bg-muted/30 border-b flex items-center gap-3 rounded-t-xl">
                            <Package className="w-4 h-4 text-primary" />
                            <h3 className="font-semibold text-sm">Detalle de Productos</h3>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                                <div className="flex-1 min-w-0">
                                    <SearchableSelect
                                        disabled={isViewing}
                                        value={selectedProdIdToAdd}
                                        onChange={(val) => setSelectedProdIdToAdd(val)}
                                        options={productOptions}
                                        placeholder="Buscar o seleccionar producto para agregar..."
                                        searchPlaceholder="Escriba código o nombre de producto..."
                                    />
                                </div>
                                {!isViewing && (
                                <button
                                    type="button"
                                    disabled={!selectedProdIdToAdd}
                                    onClick={() => {
                                        if (selectedProdIdToAdd) {
                                            addProductToDetail(selectedProdIdToAdd);
                                            setSelectedProdIdToAdd('');
                                        }
                                    }}
                                    className="w-full sm:w-auto px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 shadow-sm transition-all whitespace-nowrap flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                                >
                                    <ShoppingCart className="w-4 h-4 shrink-0" />
                                    <span>Añadir Producto</span>
                                </button>
                                )}
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse mt-4 min-w-[550px]">
                                    <thead>
                                        <tr className="bg-muted/50 border-y">
                                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Cant.</th>
                                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">P.Unit</th>
                                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Desc. %</th>
                                            <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Subtotal</th>
                                            <th className="p-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {newVenta.detalles.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-8 text-center text-muted-foreground italic">
                                                    El carrito está vacío.
                                                </td>
                                            </tr>
                                        )}
                                        {newVenta.detalles.map((det: any, index: number) => {
                                            const stockDisp = getProductStock(det.productoId || det.producto?.id);
                                            const isExceeded = det.cantidad > stockDisp;

                                            const productLotes = getProductLotes(det.productoId || det.producto?.id);
                                            const assignedLotes = det.movimientosLote && det.movimientosLote.length > 0 ? det.movimientosLote : null;

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
                                                        {assignedLotes ? (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {assignedLotes.map((m: any, mIdx: number) => {
                                                                    const venc = m.lote?.fechaVencimiento ? String(m.lote.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : null;
                                                                    return (
                                                                        <span key={mIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-primary/10 text-[10px] text-primary border border-primary/20">
                                                                            <strong>Lote:</strong> {m.lote?.numeroLote || 'S/N'} ({m.cantidad} u.) {venc ? `| Venc: ${venc}` : ''}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : productLotes.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {productLotes.map((l: any, lIdx: number) => {
                                                                    const venc = l.fechaVencimiento ? String(l.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : null;
                                                                    return (
                                                                        <span key={lIdx} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground border">
                                                                            <strong>Lote:</strong> {l.numeroLote || 'S/N'} ({l.cantidadActual} u.) {venc ? `| Venc: ${venc}` : ''}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : null}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex flex-col items-center gap-1">
                                                            <input disabled={isViewing} 
                                                                type="number"
                                                                min="1"
                                                                value={det.cantidad}
                                                                onChange={(e) => updateDetail(index, 'cantidad', parseFloat(e.target.value) || 0)}
                                                                className={`w-20 p-2 border rounded-lg bg-background text-center text-sm text-foreground outline-none transition-all font-medium ${
                                                                    isExceeded 
                                                                        ? 'border-red-500 bg-red-500/10 text-red-600 font-bold focus:ring-2 focus:ring-red-500/20' 
                                                                        : 'focus:ring-2 focus:ring-primary/20 hover:border-primary/50'
                                                                }`}
                                                            />
                                                            <span className={`text-[10px] ${isExceeded ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                                                                Stock: {stockDisp}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <input disabled={isViewing} 
                                                            type="number"
                                                            step="0.01"
                                                            value={det.precioUnitario}
                                                            onChange={(e) => updateDetail(index, 'precioUnitario', parseFloat(e.target.value) || 0)}
                                                            className="w-24 p-2 border rounded-lg bg-background text-center text-sm text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-medium"
                                                        />
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <input disabled={isViewing} 
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                step="0.5"
                                                                placeholder="0"
                                                                value={det.descuentoPorcentaje || ''}
                                                                onChange={(e) => updateDetail(index, 'descuentoPorcentaje', parseFloat(e.target.value) || 0)}
                                                                className="w-16 p-2 border rounded-lg bg-background text-center text-sm text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-medium"
                                                            />
                                                            <span className="text-xs text-muted-foreground font-semibold">%</span>
                                                        </div>
                                                    </td>

                                                    <td className={`p-3 text-center font-bold ${isExceeded ? 'text-red-600' : ''}`}>
                                                        <div className="flex flex-col items-center">
                                                            <span>{formatCurrency(det.subtotal)}</span>
                                                            {Number(det.descuentoPorcentaje) > 0 && (
                                                                <span className="text-[10px] font-normal text-muted-foreground line-through">
                                                                    {formatCurrency(det.cantidad * det.precioUnitario)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {!isViewing && (<button type="button" onClick={() => removeDetail(index)} className="text-destructive hover:scale-110 transition-transform"><Trash2 className="w-4 h-4" /></button>)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2 italic text-muted-foreground">Notas de la Venta</label>
                        <textarea disabled={isViewing} 
                            value={newVenta.observaciones}
                            onChange={(e) => setNewVenta({ ...newVenta, observaciones: e.target.value })}
                            className="w-full p-2.5 border rounded-lg bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:ring-2 focus:ring-primary/20 outline-none min-h-[60px] transition-all hover:border-primary/50"
                            placeholder="Ej: Oferta válida por 7 días..."
                        />
                    </div>

                    <div className="fixed bottom-0 right-0 w-full max-w-4xl p-4 md:p-6 bg-card border-t flex flex-wrap items-center justify-between gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-10">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col gap-2 items-end pr-6 border-r text-xs font-bold w-64">
                                <div className="flex justify-between w-full"><span>Subtotal:</span> <span>{formatCurrency(calculateTotals().subtotal)}</span></div>
                                
                                {/* Descuento Estándar */}
                                <div className="flex justify-between w-full items-center gap-2">
                                    <span className="text-muted-foreground font-medium">Desc (%):</span>
                                    <input disabled={isViewing} type="number" min="0" max="100" step="0.1"
                                        className="w-16 px-2.5 py-1.5 border rounded-lg bg-background text-left text-xs text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-semibold"
                                        value={newVenta.descuentoPorcentaje}
                                        onChange={(e) => setNewVenta({ ...newVenta, descuentoPorcentaje: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                {calculateTotals().desc1 > 0 && (
                                    <div className="flex justify-between w-full text-red-600 dark:text-red-400"><span>-{formatCurrency(calculateTotals().desc1)}</span></div>
                                )}

                                {/* Descuento Fijo (3%) Checkbox */}
                                <div className="flex justify-between w-full items-center gap-2 py-1 px-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 my-0.5">
                                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                                        <input
                                            disabled={isViewing}
                                            type="checkbox"
                                            checked={Boolean(newVenta.aplicaDescuentoFijo)}
                                            onChange={(e) => setNewVenta({ ...newVenta, aplicaDescuentoFijo: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer accent-emerald-600"
                                        />
                                        <span>Desc. Fijo (3%)</span>
                                    </label>
                                    {calculateTotals().descFijo > 0 && (
                                        <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                                            -{formatCurrency(calculateTotals().descFijo)}
                                        </span>
                                    )}
                                </div>
                                
                                {/* Descuento Promo */}
                                <div className="flex justify-between w-full items-center gap-2">
                                    <span className="text-muted-foreground font-medium">Promo (%):</span>
                                    <input disabled={isViewing} type="number" min="0" max="100" step="0.1"
                                        className="w-16 px-2.5 py-1.5 border rounded-lg bg-background text-left text-xs text-foreground focus:ring-2 focus:ring-primary/20 hover:border-primary/50 outline-none transition-all font-semibold"
                                        value={newVenta.descuentoPromocionPorcentaje}
                                        onChange={(e) => setNewVenta({ ...newVenta, descuentoPromocionPorcentaje: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                {calculateTotals().desc2 > 0 && (
                                    <div className="flex justify-between w-full text-amber-600 dark:text-amber-400 font-bold"><span>-{formatCurrency(calculateTotals().desc2)}</span></div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest flex items-center gap-1">
                                    <Calculator className="w-3 h-3 text-primary" /> Total Venta
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
                                        onClick={handlePrintIndividualVenta}
                                        className="px-6 py-2.5 bg-secondary text-secondary-foreground rounded-xl text-sm font-bold shadow-md hover:bg-secondary/90 transition-all active:scale-95 flex items-center gap-2"
                                    >
                                        <Printer className="w-4 h-4" /> Imprimir
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const currentVenta = ventas?.find(v => v.id === editingId) || {
                                                id: editingId,
                                                numero: newVenta.numero,
                                                total: calculateTotals().total,
                                                cliente: clients?.find(c => c.id.toString() === newVenta.clienteId),
                                                sucursal: sucursales?.find((s: any) => s.id.toString() === newVenta.sucursalId),
                                                vendedor: vendedores?.find(v => v.id.toString() === newVenta.vendedorId),
                                                fecha: newVenta.fecha,
                                                observaciones: newVenta.observaciones,
                                                conFactura: newVenta.conFactura,
                                                numeroFactura: newVenta.numeroFactura
                                            };
                                            handleOpenWhatsAppModal(currentVenta);
                                        }}
                                        className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md hover:bg-emerald-700 transition-all active:scale-95 flex items-center gap-2"
                                        title="Enviar Nota de Venta en PDF por WhatsApp"
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
                        ¿Estás seguro de que deseas anular esta venta? Esta acción devolverá el stock de los productos a la sucursal y cambiará el estado de la nota a <span className="font-bold text-destructive">ANULADA</span>.
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

            {/* Modal de Envío de Nota de Venta por WhatsApp */}
            <Modal
                isOpen={whatsappModalData.isOpen}
                onClose={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        Enviar Nota de Venta por WhatsApp
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappModalData.venta && (
                    <div className="space-y-4">
                        {/* Card resumen de venta */}
                        <div className="p-3.5 bg-muted/40 border rounded-xl space-y-1 text-sm">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-foreground">Nota de Venta N° {whatsappModalData.venta.numero || whatsappModalData.venta.id}</span>
                                <span className="text-primary text-base">{formatCurrency(whatsappModalData.venta.total)}</span>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>Cliente: {whatsappModalData.venta.cliente?.persona ? `${whatsappModalData.venta.cliente.persona.nombres} ${whatsappModalData.venta.cliente.persona.apellidos}` : 'Cliente Final'}</span>
                                <span>{whatsappModalData.venta.fecha ? String(whatsappModalData.venta.fecha).split('T')[0].split('-').reverse().join('/') : '-'}</span>
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
                                El cliente recibirá el comprobante de venta en PDF oficial generado por el sistema.
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
                                const clienteNombre = whatsappModalData.venta.cliente?.persona ? `${whatsappModalData.venta.cliente.persona.nombres || ''} ${whatsappModalData.venta.cliente.persona.apellidos || ''}`.trim() : 'Cliente';
                                const webText = encodeURIComponent(
                                    `Hola ${clienteNombre}, te compartimos el comprobante de tu Nota de Venta N° ${whatsappModalData.venta.numero || whatsappModalData.venta.id} emitida por GIPAAF por un total de Bs. ${Number(whatsappModalData.venta.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}. ¡Muchas gracias por tu compra!`
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
                                                    ventaId: whatsappModalData.venta.id,
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

export default ventasPage;
















