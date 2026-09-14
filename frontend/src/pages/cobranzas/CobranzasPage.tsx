import { getFileUrl } from '../../api/apiClient';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cobranzaService, type PagoCobranza } from '../../api/cobranzaService';
import { 
    Search, Plus, Trash2, Wallet, 
    X, Save, AlignLeft, ChevronLeft, ChevronRight,
    Printer, FileText, FileSpreadsheet, AlertTriangle,
    Users, ShoppingCart, CreditCard, DollarSign, Calendar, ArrowRightLeft, Pencil,
    Upload, Image as ImageIcon, ExternalLink, Receipt, Eye, Check, User, Lock, RotateCcw,
    MessageSquare, Send, Loader2, MessageCircle, Building2
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DetalleVentaModal from '../../components/ventas/DetalleVentaModal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { personalService } from '../../api/personalService';
import { whatsappService } from '../../api/whatsappService';

const CobranzasPage: React.FC = () => {
    const { isAdmin, isVendedor, isJefeVentas, userPersonal, hasAction } = useAuth();
    const isRestrictedVendor = isVendedor && !isAdmin && !isJefeVentas && !!userPersonal;
    const canCreate = isAdmin || hasAction('COBRANZAS', 'CREAR');
    const canEdit = isAdmin || hasAction('COBRANZAS', 'EDITAR');
    const canAnular = isAdmin || hasAction('COBRANZAS', 'ANULAR') || hasAction('COBRANZAS', 'ELIMINAR');

    const { selectedSucursal, selectedCiudad } = useFilters();
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [filtroCliente, setFiltroCliente] = useState<string>('');
    const [filtroVendedor, setFiltroVendedor] = useState<string>('');
    const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'ACTIVO' | 'ANULADO'>('TODOS');
    const [filtroMetodo, setFiltroMetodo] = useState<string>('TODOS');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const itemsPerPage = 10;
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    const [viewingComprobante, setViewingComprobante] = useState<string | null>(null);
    const [viewingDetalleVenta, setViewingDetalleVenta] = useState<any | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        clienteId: '',
        notaId: '',
        moneda: 'BOB',
        tipoCambio: '6.96' as string | number,
        monto: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        metodoPago: 'Efectivo',
        referencia: '',
        observaciones: '',
        comprobanteUrl: ''
    });

    const [error, setError] = useState<string | null>(null);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);

    // WhatsApp State & Mutations
    const { data: whatsappBranches } = useQuery({
        queryKey: ['whatsapp-branches-status'],
        queryFn: () => whatsappService.getBranchesStatus(),
        staleTime: 10000,
    });

    const [whatsappModalData, setWhatsappModalData] = useState<{
        isOpen: boolean;
        pago: PagoCobranza | null;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        pago: null,
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const sendWhatsAppMutation = useMutation({
        mutationFn: (payload: { pagoId: number; phone?: string; sucursalId?: number; message?: string }) =>
            cobranzaService.sendWhatsApp(payload.pagoId, payload.phone, payload.message, payload.sucursalId),
        onSuccess: (data) => {
            toast.success(data.message || 'Recibo de cobranza enviado exitosamente por WhatsApp');
            setWhatsappModalData(prev => ({ ...prev, isOpen: false, pago: null }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar recibo de cobranza por WhatsApp');
        }
    });

    const handleOpenWhatsAppModal = (pago: PagoCobranza) => {
        const clientPhone = pago.cliente?.persona?.telefono || '';
        const initialSucursalId = pago.nota?.sucursal?.id 
            ? String(pago.nota.sucursal.id) 
            : (pago.cliente?.sucursal?.id 
                ? String(pago.cliente.sucursal.id) 
                : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : '')));

        setWhatsappModalData({
            isOpen: true,
            pago,
            phone: clientPhone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    // Queries
    const { data: pagosList, isLoading } = useQuery({
        queryKey: ['cobranzasList'],
        queryFn: cobranzaService.getAll,
    });

    const { data: vendedores } = useQuery({
        queryKey: ['vendedoresCobranzas'],
        queryFn: async () => {
            const all = await personalService.getAll();
            return all.filter(p => p.cargo === 'VENDEDOR' && p.activo);
        }
    });

    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });

    // Query all sales with pending debt (saldo > 0)
    const { data: todasLasDeudas, isLoading: loadingDeudas } = useQuery({
        queryKey: ['todasLasDeudasCobranza'],
        queryFn: () => cobranzaService.getDeudas(),
    });

    // Sales filtered by global city/branch selector & vendor
    const deudasFiltradas = useMemo(() => {
        if (!todasLasDeudas) return [];
        let filtered = todasLasDeudas;
        if (selectedSucursal) {
            filtered = filtered.filter(d => (d.sucursal as any)?.id === Number(selectedSucursal) || (d.cliente as any)?.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(d => (d.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (d.cliente as any)?.sucursal?.ciudad?.id === Number(selectedCiudad) || (d.cliente as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (isRestrictedVendor) {
            filtered = filtered.filter(d => d.vendedor?.id === userPersonal.id);
        }
        return filtered;
    }, [todasLasDeudas, selectedSucursal, selectedCiudad, isRestrictedVendor, userPersonal]);

    // Clients that actually have pending sales with debt
    const clientesConDeuda = useMemo(() => {
        const map = new Map<number, any>();
        
        if (deudasFiltradas) {
            deudasFiltradas.forEach(nota => {
                if (nota.cliente && !map.has(nota.cliente.id)) {
                    map.set(nota.cliente.id, nota.cliente);
                }
            });
        }

        // If editing an existing payment, ensure its client is present
        if (editingId && pagosList) {
            const pago = pagosList.find(p => p.id === editingId);
            if (pago?.cliente && !map.has(pago.cliente.id)) {
                map.set(pago.cliente.id, pago.cliente);
            }
        }

        return Array.from(map.values());
    }, [deudasFiltradas, editingId, pagosList]);

    const clientesUnicos = useMemo(() => {
        if (!pagosList) return [];
        const map = new Map<number, any>();
        pagosList.forEach(p => {
            if (p.cliente && !map.has(p.cliente.id)) map.set(p.cliente.id, p.cliente);
        });
        return Array.from(map.values()).sort((a, b) => {
            const na = a.persona ? `${a.persona.nombres} ${a.persona.apellidos}` : (a.razonSocial || '');
            const nb = b.persona ? `${b.persona.nombres} ${b.persona.apellidos}` : (b.razonSocial || '');
            return na.localeCompare(nb);
        });
    }, [pagosList]);

    // Pending sales for currently selected client
    const deudasDelCliente = useMemo(() => {
        if (!deudasFiltradas || !formData.clienteId) return [];
        return deudasFiltradas.filter(d => d.cliente?.id === Number(formData.clienteId));
    }, [deudasFiltradas, formData.clienteId]);

    // Selected sale details for payment calculation
    const selectedVenta = useMemo(() => {
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
        if (!selectedVenta) {
            return { montoEquivalente: 0, saldoRestante: 0, simboloVenta: 'Bs.', simboloPago: 'Bs.' };
        }
        const montoNum = parseFloat(formData.monto) || 0;
        const tc = parseFloat(String(formData.tipoCambio).replace(',', '.')) || 6.96;
        const monedaVenta = selectedVenta.moneda || 'BOB';
        const monedaPago = formData.moneda || 'BOB';

        let montoEquivalente = montoNum;
        if (monedaVenta === 'USD' && monedaPago === 'BOB') {
            montoEquivalente = tc > 0 ? Number((montoNum / tc).toFixed(2)) : 0;
        } else if (monedaVenta === 'BOB' && monedaPago === 'USD') {
            montoEquivalente = Number((montoNum * tc).toFixed(2));
        }

        const saldoActual = Number(selectedVenta.saldo) || 0;
        const saldoRestante = Math.max(0, saldoActual - montoEquivalente);
        const simboloVenta = monedaVenta === 'USD' ? '$us' : 'Bs.';
        const simboloPago = monedaPago === 'USD' ? '$us' : 'Bs.';

        return {
            montoEquivalente,
            saldoRestante,
            simboloVenta,
            simboloPago,
            monedaVenta,
            monedaPago,
            diferenteMoneda: monedaVenta !== monedaPago
        };
    }, [selectedVenta, formData.monto, formData.moneda, formData.tipoCambio]);

    // Removed export block to move it below filteredPagos

    // Mutations
    const createMutation = useMutation({
        mutationFn: cobranzaService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cobranzasList'] });
            queryClient.invalidateQueries({ queryKey: ['todasLasDeudasCobranza'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setIsCreating(false);
            resetForm();
            toast.success('Cobranza registrada exitosamente');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al registrar la cobranza';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => cobranzaService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cobranzasList'] });
            queryClient.invalidateQueries({ queryKey: ['todasLasDeudasCobranza'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            setIsCreating(false);
            resetForm();
            toast.success('Cobranza actualizada exitosamente');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al actualizar la cobranza';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const anularMutation = useMutation({
        mutationFn: cobranzaService.anular,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cobranzasList'] });
            queryClient.invalidateQueries({ queryKey: ['todasLasDeudasCobranza'] });
            queryClient.invalidateQueries({ queryKey: ['sales'] });
            toast.success('Cobranza anulada exitosamente');
            setAnularConfirmId(null);
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Error al anular la cobranza');
        }
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        setError(null);
        try {
            const res = await cobranzaService.uploadComprobante(file);
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
            clienteId: '',
            notaId: '',
            moneda: 'BOB',
            tipoCambio: '6.96',
            monto: '',
            fecha: format(new Date(), 'yyyy-MM-dd'),
            metodoPago: 'Efectivo',
            referencia: '',
            observaciones: '',
            comprobanteUrl: ''
        });
        setEditingId(null);
        setError(null);
    };

    const openEditModal = (pago: PagoCobranza) => {
        setEditingId(pago.id);
        setFormData({
            clienteId: pago.cliente?.id?.toString() || '',
            notaId: pago.nota?.id?.toString() || '',
            moneda: pago.moneda || 'BOB',
            tipoCambio: pago.tipoCambio != null ? String(pago.tipoCambio) : '6.96',
            monto: pago.monto?.toString() || '',
            fecha: pago.fecha ? pago.fecha.substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
            metodoPago: pago.metodoPago || 'Efectivo',
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

        if (!formData.clienteId) {
            setError('Debe seleccionar un cliente');
            return;
        }

        if (!formData.notaId) {
            setError('Debe seleccionar una venta pendiente');
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
                clienteId: Number(formData.clienteId),
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
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.id === Number(selectedSucursal) || (p.cliente?.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.cliente?.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.cliente?.ciudad as any)?.id === Number(selectedCiudad));
        }

        if (isRestrictedVendor) {
            filtered = filtered.filter(p => p.nota?.vendedor?.id === userPersonal.id);
        }

        if (filtroCliente) filtered = filtered.filter(p => String(p.cliente?.id) === filtroCliente);
        if (filtroVendedor) filtered = filtered.filter(p => String(p.nota?.vendedor?.id) === filtroVendedor);
        if (filtroEstado === 'ACTIVO') filtered = filtered.filter(p => p.activo);
        else if (filtroEstado === 'ANULADO') filtered = filtered.filter(p => !p.activo);
        if (filtroMetodo !== 'TODOS') filtered = filtered.filter(p => (p.metodoPago || 'Efectivo') === filtroMetodo);
        if (fechaDesde) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) >= fechaDesde);
        if (fechaHasta) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) <= fechaHasta);

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const clienteNombre = p.cliente?.persona 
                    ? `${p.cliente.persona.nombres} ${p.cliente.persona.apellidos}`.toLowerCase() 
                    : (p.cliente?.razonSocial || '').toLowerCase();
                const vendedorNombre = (p.nota?.vendedor
                    ? `${p.nota.vendedor.nombres || ''} ${p.nota.vendedor.apellidos || ''}`
                    : (p.nota?.usuario?.persona 
                        ? `${p.nota.usuario.persona.nombres || ''} ${p.nota.usuario.persona.apellidos || ''}`
                        : (p.nota?.usuario?.username || ''))).toLowerCase();
                const ventaNum = (p.nota?.numero || '').toLowerCase();
                const ref = (p.referencia || '').toLowerCase();
                const metodo = (p.metodoPago || '').toLowerCase();

                return clienteNombre.includes(s) || vendedorNombre.includes(s) || ventaNum.includes(s) || ref.includes(s) || metodo.includes(s);
            });
        }

        return filtered;
    }, [pagosList, selectedSucursal, selectedCiudad, searchTerm, filtroCliente, filtroVendedor, filtroEstado, filtroMetodo, fechaDesde, fechaHasta, isRestrictedVendor, userPersonal]);

    const exportColumns = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Nro Venta', dataKey: 'notaNumero' },
        { header: 'Cliente', dataKey: 'clienteNombre' },
        { header: 'Vendedor', dataKey: 'vendedorNombre' },
        { header: 'Nota de Venta', dataKey: 'notaVenta' },
        { header: 'Método', dataKey: 'metodoPago' },
        { header: 'Referencia', dataKey: 'referencia' },
        { header: 'Total Venta', dataKey: 'totalVentaFormateado' },
        { header: 'Monto Pagado', dataKey: 'montoFormateado' },
        { header: 'Saldo Pendiente', dataKey: 'saldoFormateado' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const mappedExportData = useMemo(() => {
        return filteredPagos.map(p => {
            const simbolo = p.moneda === 'USD' ? '$us' : 'Bs.';
            const montoFormateado = `${simbolo} ${Number(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const saldoSimbolo = p.nota?.moneda === 'USD' ? '$us' : 'Bs.';
            const totalVentaFormateado = p.nota ? `${saldoSimbolo} ${Number(p.nota.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            const saldoFormateado = p.nota ? `${saldoSimbolo} ${Number(p.nota.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            const vendedorNombre = p.nota?.vendedor
                ? `${p.nota.vendedor.nombres || ''} ${p.nota.vendedor.apellidos || ''}`.trim()
                : (p.nota?.usuario?.persona 
                    ? `${p.nota.usuario.persona.nombres || ''} ${p.nota.usuario.persona.apellidos || ''}`.trim()
                    : (p.nota?.usuario?.username || '-'));
            const notaVenta = p.nota?.observaciones || p.observaciones || '-';
            const estado = !p.activo ? 'Anulado' : (Number(p.nota?.saldo) <= 0.001 ? 'Pagada' : 'Aplicado');
            return {
                ...p,
                clienteNombre: p.cliente?.persona ? `${p.cliente.persona.nombres} ${p.cliente.persona.apellidos}` : (p.cliente?.razonSocial || 'Cliente'),
                vendedorNombre,
                notaVenta,
                notaNumero: p.nota?.numero || '-',
                totalVentaFormateado,
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
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }
        if (filtroCliente) {
            const cli = clientesUnicos.find(c => String(c.id) === filtroCliente);
            if (cli) {
                const nombre = cli.persona ? `${cli.persona.nombres} ${cli.persona.apellidos}`.trim() : (cli.razonSocial || 'Cliente');
                texts.push(`Cliente: ${nombre}`);
            }
        }
        if (filtroVendedor) {
            const v = vendedores?.find((ve: any) => String(ve.id) === filtroVendedor);
            if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
        }
        if (filtroEstado === 'ACTIVO') texts.push('Estado: Activos');
        else if (filtroEstado === 'ANULADO') texts.push('Estado: Anulados');
        
        if (filtroMetodo !== 'TODOS') texts.push(`Método: ${filtroMetodo}`);
        
        if (fechaDesde && fechaHasta) {
            texts.push(`Rango: ${fechaDesde.split('-').reverse().join('/')} al ${fechaHasta.split('-').reverse().join('/')}`);
        } else if (fechaDesde) {
            texts.push(`Desde: ${fechaDesde.split('-').reverse().join('/')}`);
        } else if (fechaHasta) {
            texts.push(`Hasta: ${fechaHasta.split('-').reverse().join('/')}`);
        }
        return texts.length > 0 ? texts.join(' | ') : 'Todas las cobranzas';
    };

    const getExportColumns = () => {
        if (filtroCliente) return exportColumns.filter(c => c.dataKey !== 'clienteNombre');
        return exportColumns;
    };

    const getTotalsFooter = () => {
        let totalCobradoBOB = 0;
        let totalCobradoUSD = 0;

        filteredPagos.forEach(p => {
            if (!p.activo) return;
            const monto = Number(p.monto) || 0;
            if (p.moneda === 'USD') {
                totalCobradoUSD += monto;
            } else {
                totalCobradoBOB += monto;
            }
        });

        let montoStr = '';
        if (totalCobradoBOB > 0 && totalCobradoUSD > 0) {
            montoStr = `Bs. ${totalCobradoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | $us ${totalCobradoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (totalCobradoUSD > 0) {
            montoStr = `$us ${totalCobradoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else {
            montoStr = `Bs. ${totalCobradoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        return {
            fecha: 'TOTALES',
            notaNumero: '',
            clienteNombre: '',
            vendedorNombre: '',
            notaVenta: '',
            metodoPago: '',
            referencia: '',
            totalVentaFormateado: '',
            montoFormateado: montoStr,
            saldoFormateado: '',
            estado: `${totals.activosCount} cobros`
        };
    };

    const handlePrint = () => {
        if (!mappedExportData.length) return;
        printData('Reporte de Cobranzas / Pagos de Clientes', getExportColumns(), mappedExportData, getFiltersText(), getTotalsFooter());
    };
    const handleExportPDF = () => {
        if (!mappedExportData.length) return;
        exportToPDF('Reporte de Cobranzas / Pagos de Clientes', getExportColumns(), mappedExportData, 'cobranzas_clientes_reporte', getFiltersText(), getTotalsFooter());
    };
    const handleExportExcel = () => {
        if (!mappedExportData.length) return;
        exportToExcel(getExportColumns(), mappedExportData, 'cobranzas_clientes_reporte', getTotalsFooter());
    };

    // Financial KPI Totals
    const totals = useMemo(() => {
        let totalCobradoBOB = 0;
        let totalCobradoUSD = 0;

        filteredPagos.forEach(p => {
            if (!p.activo) return;
            const monto = Number(p.monto) || 0;
            if (p.moneda === 'USD') {
                totalCobradoUSD += monto;
            } else {
                totalCobradoBOB += monto;
            }
        });

        return {
            totalCobradoBOB,
            totalCobradoUSD,
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

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando cobranzas de clientes...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary/80" />
                        Cobranzas a Clientes
                    </h1>
                    <p className="text-muted-foreground italic">Registro y gestión de cobros y abonos de ventas a crédito.</p>
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

                    {canCreate && (
                        <>
                            <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>
                            <button
                                onClick={() => { resetForm(); setIsCreating(true); }}
                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                            >
                                <Plus className="w-4 h-4" />
                                Nuevo Cobro
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-primary" /> Total Cobrado (Bs.)
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        Bs. {totals.totalCobradoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Cobros activos en Bolivianos</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-primary" /> Total Cobrado ($us)
                    </span>
                    <div className="text-2xl font-black text-primary">
                        $us {totals.totalCobradoUSD.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Cobros activos en Dólares</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-primary" /> Total de Cobros
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        {totals.activosCount} <span className="text-sm font-normal text-muted-foreground">/ {totals.totalCount} registros</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Cobros realizados</p>
                </div>
            </div>

            {/* Toolbar: Buscador, Filtros & Limpiar */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                {/* Search Bar */}
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-sm">
                    <Search className="w-4 h-4 text-muted-foreground ml-1 shrink-0" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, nro de venta, ref..."
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

                {/* Filtro Cliente */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={filtroCliente}
                        onChange={(e) => { setFiltroCliente(e.target.value); setCurrentPage(1); }}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm max-w-[180px] truncate"
                    >
                        <option value="" className="bg-background text-foreground">Todos los Clientes</option>
                        {clientesUnicos.map(c => {
                            const name = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}`.trim() : (c.razonSocial || 'Cliente');
                            return (
                                <option key={c.id} value={c.id} className="bg-background text-foreground">
                                    {name}
                                </option>
                            );
                        })}
                    </select>
                </div>

                {/* Filtro Vendedor */}
                {isRestrictedVendor ? (
                    <div className="flex items-center gap-2 bg-card border border-primary/30 rounded-lg px-3 py-2 shadow-sm text-sm text-primary font-medium">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        <span>Mis Cobranzas ({userPersonal.nombres} {userPersonal.apellidos})</span>
                        <Lock className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <select
                            value={filtroVendedor}
                            onChange={(e) => { setFiltroVendedor(e.target.value); setCurrentPage(1); }}
                            className="bg-transparent border-none outline-none font-medium cursor-pointer text-sm max-w-[180px] truncate"
                        >
                            <option value="" className="bg-background text-foreground">Todos los Vendedores</option>
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
                {(searchTerm || filtroCliente || filtroVendedor || fechaDesde || fechaHasta) && (
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFiltroCliente('');
                            setFiltroVendedor('');
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
            {/* Tabla de Cobranzas */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1050px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Venta</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota de Venta</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Comprobante</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Venta</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Monto Pagado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo Pendiente</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-36">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedPagos.length === 0 ? (
                                <tr>
                                    <td colSpan={14} className="p-8 text-center text-muted-foreground text-sm">
                                        No se encontraron cobranzas registradas.
                                    </td>
                                </tr>
                            ) : paginatedPagos.map((p, index) => {
                                const cliLabel = p.cliente?.persona 
                                    ? `${p.cliente.persona.nombres} ${p.cliente.persona.apellidos}` 
                                    : (p.cliente?.razonSocial || 'Cliente');
                                const vendedorLabel = p.nota?.vendedor
                                    ? `${p.nota.vendedor.nombres || ''} ${p.nota.vendedor.apellidos || ''}`.trim()
                                    : (p.nota?.usuario?.persona 
                                        ? `${p.nota.usuario.persona.nombres || ''} ${p.nota.usuario.persona.apellidos || ''}`.trim()
                                        : (p.nota?.usuario?.username || '-'));
                                const notaVentaLabel = p.nota?.observaciones || p.observaciones || '';
                                const isUSD = p.moneda === 'USD';
                                const simbolo = isUSD ? '$us' : 'Bs.';
                                const ventaMoneda = p.nota?.moneda || 'BOB';
                                const esMonedaCruzada = p.moneda !== ventaMoneda;
                                const saldoSimbolo = ventaMoneda === 'USD' ? '$us' : 'Bs.';
                                const saldoNota = Number(p.nota?.saldo || 0);
                                const totalVenta = Number(p.nota?.total || 0);

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
                                                    onClick={() => setViewingDetalleVenta(p.nota)}
                                                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                    title="Ver detalle y productos de la venta"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                    {p.nota.numero}
                                                </button>
                                            ) : (
                                                <span className="text-muted-foreground font-mono text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-foreground">
                                            {cliLabel}
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {vendedorLabel}
                                        </td>
                                        <td className="p-4 max-w-[180px]">
                                            {notaVentaLabel ? (
                                                <span className="text-xs text-muted-foreground line-clamp-2" title={notaVentaLabel}>
                                                    {notaVentaLabel}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50 font-mono">-</span>
                                            )}
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
                                                        href={getFileUrl(p.comprobanteUrl)} 
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
                                                            src={getFileUrl(p.comprobanteUrl)} 
                                                            alt="Voucher" 
                                                            className="w-7 h-7 object-cover rounded border" 
                                                        />
                                                    </button>
                                                )
                                            ) : (
                                                <span className="text-xs text-muted-foreground">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right font-medium">
                                            {p.nota ? (
                                                <div className="text-sm font-semibold text-foreground">
                                                    {saldoSimbolo} {totalVenta.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                                    ≈ {ventaMoneda === 'USD' ? '$us' : 'Bs.'} {Number(p.montoEquivalente).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                                            <div className="flex justify-end gap-2 flex-wrap items-center">
                                                {p.activo && (
                                                    <button
                                                        onClick={() => handleOpenWhatsAppModal(p)}
                                                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-sm"
                                                        title="Enviar Recibo de Cobranza en PDF por WhatsApp"
                                                    >
                                                        <MessageCircle className="w-3" /> WhatsApp
                                                    </button>
                                                )}
                                                {p.activo && canEdit && (
                                                    <button
                                                        onClick={() => openEditModal(p)}
                                                        className="px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                        title="Editar Cobranza"
                                                    >
                                                        <Pencil className="w-3 h-3" /> Editar
                                                    </button>
                                                )}
                                                {p.activo && canAnular && (
                                                    <button
                                                        onClick={() => setAnularConfirmId(p.id)}
                                                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                                                        title="Anular Cobranza"
                                                    >
                                                        <Trash2 className="w-3 h-3" /> Anular
                                                    </button>
                                                )}
                                                {(!p.activo || (!canEdit && !canAnular)) && (
                                                    <span className="text-xs text-muted-foreground italic">
                                                        {!p.activo ? 'Sin acciones' : 'Solo lectura'}
                                                    </span>
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

            {/* Modal de Registro/Edición de Cobranza */}
            <Modal
                isOpen={isCreating}
                onClose={() => { setIsCreating(false); resetForm(); }}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Wallet className="w-6 h-6 text-primary/80" />
                        {editingId ? 'Editar Cobranza de Cliente' : 'Registrar Cobranza de Cliente'}
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
                        {/* Selector de Cliente */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-primary" />
                                Cliente con Saldo Pendiente <span className="text-destructive">*</span>
                            </label>
                            {loadingDeudas && !editingId ? (
                                <div className="p-2.5 text-xs text-muted-foreground animate-pulse border rounded-lg">Cargando clientes con deuda...</div>
                            ) : (
                                <select
                                    value={formData.clienteId}
                                    onChange={(e) => {
                                        setFormData({
                                            ...formData,
                                            clienteId: e.target.value,
                                            notaId: ''
                                        });
                                        setError(null);
                                    }}
                                    disabled={!!editingId}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm disabled:opacity-60"
                                    required
                                >
                                    <option value="">Seleccione un cliente...</option>
                                    {clientesConDeuda?.map(c => {
                                        const nombre = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : (c.razonSocial || 'Cliente');
                                        return (
                                            <option key={c.id} value={c.id}>
                                                {nombre} {c.persona?.ci ? `(CI: ${c.persona.ci})` : ''}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                            {!editingId && clientesConDeuda && clientesConDeuda.length === 0 && !loadingDeudas && (
                                <p className="text-xs text-amber-600 font-medium">No se encontraron clientes con saldo pendiente de pago.</p>
                            )}
                        </div>

                        {/* Selector de Venta / Nota */}
                        {formData.clienteId && (
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                    <ShoppingCart className="w-4 h-4 text-primary" />
                                    Venta con Saldo Pendiente <span className="text-destructive">*</span>
                                </label>
                                {loadingDeudas && !editingId ? (
                                    <div className="p-2.5 text-xs text-muted-foreground animate-pulse border rounded-lg">Cargando ventas...</div>
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
                                        <option value="">Seleccione una venta...</option>
                                        {editingId && selectedVenta && (
                                            <option value={selectedVenta.id}>
                                                {selectedVenta.numero} - Fecha: {format(new Date(selectedVenta.fecha + 'T00:00:00'), 'dd/MM/yyyy')} | ({selectedVenta.moneda})
                                            </option>
                                        )}
                                        {!editingId && deudasDelCliente?.map(d => {
                                            const sim = d.moneda === 'USD' ? '$us' : 'Bs.';
                                            return (
                                                <option key={d.id} value={d.id}>
                                                    {d.numero} - Fecha: {format(new Date(d.fecha + 'T00:00:00'), 'dd/MM/yyyy')} | Saldo: {sim} {Number(d.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })} ({d.moneda})
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                                {!editingId && deudasDelCliente && deudasDelCliente.length === 0 && (
                                    <p className="text-xs text-green-600 font-medium">Este cliente no tiene ventas con saldo pendiente.</p>
                                )}
                            </div>
                        )}

                        {/* Moneda y Tipo de Cambio */}
                        {selectedVenta && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-muted/20 border rounded-xl">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                        <DollarSign className="w-3.5 h-3.5 text-primary" />
                                        Moneda del Cobro
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

                        {/* Resumen de la Venta y Saldo */}
                        {selectedVenta && (
                            <div className="p-3.5 bg-muted/40 rounded-xl border space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Moneda de Registro Venta:</span>
                                    <span className="font-bold px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px]">
                                        {selectedVenta.moneda || 'BOB'} ({conversion.simboloVenta})
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Total Venta:</span>
                                    <span className="font-semibold">
                                        {conversion.simboloVenta} {Number(selectedVenta.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Saldo Pendiente:</span>
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                        {conversion.simboloVenta} {Number(selectedVenta.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                {conversion.diferenteMoneda && conversion.montoEquivalente > 0 && (
                                    <div className="flex items-center justify-between text-xs py-1 border-t border-dashed">
                                        <span className="text-muted-foreground">Equivalencia a aplicar en venta:</span>
                                        <span className="font-bold text-primary">
                                            {conversion.simboloVenta} {conversion.montoEquivalente.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-xs pt-1.5 border-t">
                                    <span className="text-muted-foreground">Saldo tras este cobro:</span>
                                    <span className={`font-bold ${conversion.saldoRestante === 0 ? 'text-green-600 dark:text-green-400' : 'text-primary'}`}>
                                        {conversion.simboloVenta} {conversion.saldoRestante.toLocaleString('es-BO', { minimumFractionDigits: 2 })} {conversion.saldoRestante === 0 && ' (¡Venta Cancelada / Pagada!)'}
                                    </span>
                                </div>
                                {conversion.saldoRestante === 0 && (
                                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400 text-xs font-bold flex items-center gap-1.5 border border-green-200 dark:border-green-800">
                                        <Check className="w-3.5 h-3.5 shrink-0" />
                                        <span>Con este abono, la venta quedará 100% Pagada / Saldada.</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Monto a Cobrar */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-primary" />
                                Monto a Cobrar ({conversion.simboloPago}) <span className="text-destructive">*</span>
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
                                    <CreditCard className="w-4 h-4 text-primary" /> Método de Cobro
                                </label>
                                <select
                                    value={formData.metodoPago}
                                    onChange={(e) => setFormData({ ...formData, metodoPago: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none text-sm"
                                >
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                                    <option value="QR">QR</option>
                                    <option value="Tarjeta de Débito/Crédito">Tarjeta de Débito/Crédito</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        {/* Referencia */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nro. de Recibo / Depósito / Transacción QR</label>
                            <input
                                type="text"
                                placeholder="Ej. REC-0012, TRF-88392, QR-991..."
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
                                                src={getFileUrl(formData.comprobanteUrl)} 
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
                                            href={getFileUrl(formData.comprobanteUrl)}
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
                                        id="cobranza-comprobante-upload"
                                    />
                                    <label
                                        htmlFor="cobranza-comprobante-upload"
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
                                    placeholder="Detalles adicionales de la cobranza..."
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
                            <Save className="w-4 h-4" /> {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Registrar Cobranza')}
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
                        Comprobante de Cobro / Voucher QR
                    </span>
                }
                className="max-w-xl"
            >
                {viewingComprobante && (
                    <div className="space-y-4">
                        <div className="border rounded-xl overflow-hidden bg-black/5 flex items-center justify-center p-2">
                            <img
                                src={getFileUrl(viewingComprobante)}
                                alt="Comprobante Completo"
                                className="max-h-[70vh] object-contain rounded-lg shadow-md"
                            />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <a
                                href={getFileUrl(viewingComprobante)}
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
                        Confirmar Anulación de Cobranza
                    </span>
                }
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        ¿Estás seguro de anular esta cobranza? Esta acción revertirá el saldo adeudado en la orden de venta correspondiente.
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
                            Sí, Anular Cobranza
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal de Detalle de Productos de la Venta */}
            <DetalleVentaModal
                isOpen={viewingDetalleVenta !== null}
                onClose={() => setViewingDetalleVenta(null)}
                nota={viewingDetalleVenta}
            />

            {/* Modal Enviar Recibo de Cobranza por WhatsApp */}
            <Modal
                isOpen={whatsappModalData.isOpen}
                onClose={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                        <MessageCircle className="w-5 h-5 text-emerald-600" />
                        Enviar Recibo de Cobranza por WhatsApp
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappModalData.pago && (
                    <div className="space-y-4">
                        {/* Card resumen de cobranza */}
                        <div className="p-3.5 bg-muted/40 border rounded-xl space-y-1 text-sm">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-foreground">Recibo N° REC-{String(whatsappModalData.pago.id).padStart(6, '0')}</span>
                                <span className="text-primary text-base">
                                    {whatsappModalData.pago.moneda === 'USD' ? '$us' : 'Bs.'} {Number(whatsappModalData.pago.monto || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>Cliente: {whatsappModalData.pago.cliente?.persona ? `${whatsappModalData.pago.cliente.persona.nombres} ${whatsappModalData.pago.cliente.persona.apellidos}` : 'Cliente Final'}</span>
                                <span>{whatsappModalData.pago.fecha ? String(whatsappModalData.pago.fecha).split('T')[0].split('-').reverse().join('/') : '-'}</span>
                            </div>
                            {whatsappModalData.pago.nota && (
                                <div className="text-xs text-muted-foreground flex justify-between items-center pt-1 border-t border-border/40">
                                    <span>Venta Asociada: <strong className="text-foreground">N° {whatsappModalData.pago.nota.numero}</strong></span>
                                    <span>Saldo Venta: <strong className="text-amber-600">Bs. {Number(whatsappModalData.pago.nota.saldo || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</strong></span>
                                </div>
                            )}
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
                                El cliente recibirá el documento PDF oficial generado por el sistema junto con los detalles de la cobranza.
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
                                        const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.pago.nota?.sucursal?.id || whatsappModalData.pago.cliente?.sucursal?.id);
                                        const sucursalObj = sucursales?.find(s => s.id === sucursalTargetId) || whatsappModalData.pago.nota?.sucursal || whatsappModalData.pago.cliente?.sucursal;
                                        const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                        const ciudadNombre = curBranch?.ciudadNombre || (sucursalObj?.ciudad as any)?.nombre;
                                        const branchName = curBranch?.sucursalNombre || sucursalObj?.nombre || 'Sucursal Central';
                                        const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                        return (
                                            <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                        );
                                    })()}
                                </div>
                            </div>
                            {(() => {
                                const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.pago.nota?.sucursal?.id || whatsappModalData.pago.cliente?.sucursal?.id);
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
                                placeholder="Escribe una nota personalizada si deseas acompañar el PDF con un mensaje específico..."
                                className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            {/* Fallback WhatsApp Web */}
                            {(() => {
                                const cleanDigits = (whatsappModalData.phone || '').replace(/\D/g, '');
                                const phoneWithCountry = cleanDigits.length === 8 ? `591${cleanDigits}` : cleanDigits;
                                const clienteNombre = whatsappModalData.pago.cliente?.persona ? `${whatsappModalData.pago.cliente.persona.nombres || ''} ${whatsappModalData.pago.cliente.persona.apellidos || ''}`.trim() : 'Cliente';
                                const defaultText = encodeURIComponent(
                                    `Hola *${clienteNombre}*, le enviamos su comprobante del Recibo de Cobranza N° REC-${String(whatsappModalData.pago.id).padStart(6, '0')} emitida por GIPAAF.`
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
                                const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.pago.nota?.sucursal?.id || whatsappModalData.pago.cliente?.sucursal?.id);
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
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
                                                if (!whatsappModalData.pago) return;
                                                if (!isConn) {
                                                    toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                    return;
                                                }
                                                if (!whatsappModalData.phone.trim()) {
                                                    toast.error('Ingrese el número de teléfono del cliente');
                                                    return;
                                                }
                                                sendWhatsAppMutation.mutate({
                                                    pagoId: whatsappModalData.pago.id,
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

export default CobranzasPage;
