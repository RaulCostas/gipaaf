import { getFileUrl } from '../../api/apiClient';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesService } from '../../api/salesService';
import { clientService } from '../../api/clientService';
import { personalService } from '../../api/personalService';
import { cobranzaService } from '../../api/cobranzaService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { 
    Search, Wallet, X, ChevronLeft, ChevronRight,
    Printer, FileText, FileSpreadsheet,
    Users, ShoppingCart, DollarSign, Calendar, Receipt,
    CheckCircle2, Clock, AlertTriangle, Eye, Lock,
    MessageCircle, Send, Loader2, ExternalLink, Building2, User, Store
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import DetalleVentaModal from '../../components/ventas/DetalleVentaModal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';
import { getClientDisplayName, getClientPersonName, getClientStoreName } from '../../utils/clientUtils';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { whatsappService } from '../../api/whatsappService';

const EstadoCuentaClientesPage: React.FC = () => {
    const { isAdmin, isVendedor, isJefeVentas, userPersonal } = useAuth();
    const isRestrictedVendor = isVendedor && !isAdmin && !isJefeVentas && !!userPersonal;
    const { selectedSucursal, selectedCiudad } = useFilters();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClienteId, setSelectedClienteId] = useState<string>('');
    const [selectedVendedorId, setSelectedVendedorId] = useState<string>('');
    const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | 'PENDIENTE' | 'EN_MORA' | 'AL_DIA' | 'SALDADO'>('TODOS');
    const [facturaFiltro, setFacturaFiltro] = useState<'TODOS' | 'CON_FACTURA' | 'SIN_FACTURA'>('TODOS');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal state for view sale payments history and sale product details
    const [viewingNota, setViewingNota] = useState<any | null>(null);
    const [viewingDetalleVenta, setViewingDetalleVenta] = useState<any | null>(null);

    // WhatsApp State & Mutations
    const { data: whatsappBranches } = useQuery({
        queryKey: ['whatsapp-branches-status'],
        queryFn: () => whatsappService.getBranchesStatus(),
        staleTime: 10000,
    });

    const [whatsappCarteraModalData, setWhatsappCarteraModalData] = useState<{
        isOpen: boolean;
        vendedorId: string;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        vendedorId: '',
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const [whatsappClienteModalData, setWhatsappClienteModalData] = useState<{
        isOpen: boolean;
        clienteId: string;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        clienteId: '',
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const [whatsappVentaModalData, setWhatsappVentaModalData] = useState<{
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

    const sendCarteraMutation = useMutation({
        mutationFn: (payload: { vendedorId: number; phone?: string; sucursalId?: number; message?: string }) =>
            whatsappService.sendCarteraVendedorPdf(payload),
        onSuccess: (data) => {
            toast.success(data.message || 'Planilla de cartera enviada exitosamente por WhatsApp');
            setWhatsappCarteraModalData(prev => ({ ...prev, isOpen: false }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar la planilla de cartera por WhatsApp');
        }
    });

    const sendClienteEstadoCuentaMutation = useMutation({
        mutationFn: (payload: { clienteId: number; phone?: string; sucursalId?: number; message?: string }) =>
            whatsappService.sendEstadoCuentaClientePdf(payload),
        onSuccess: (data) => {
            toast.success(data.message || 'Estado de cuenta consolidado enviado exitosamente por WhatsApp');
            setWhatsappClienteModalData(prev => ({ ...prev, isOpen: false }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar estado de cuenta del cliente');
        }
    });

    const sendEstadoCuentaVentaMutation = useMutation({
        mutationFn: (payload: { ventaId: number; phone?: string; sucursalId?: number; message?: string }) =>
            whatsappService.sendEstadoCuentaVentaPdf(payload),
        onSuccess: (data) => {
            toast.success(data.message || 'Estado de cuenta de la venta enviado exitosamente por WhatsApp');
            setWhatsappVentaModalData(prev => ({ ...prev, isOpen: false, venta: null }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar extracto de cuenta por WhatsApp');
        }
    });

    // Queries
    const { data: salesList, isLoading: loadingSales } = useQuery({
        queryKey: ['sales'],
        queryFn: salesService.getAll,
    });

    const { data: clientsList } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientService.getAll(),
    });

    const { data: personalList } = useQuery({
        queryKey: ['personalList'],
        queryFn: personalService.getAll,
    });

    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });

    const { data: notaPagos, isLoading: loadingNotaPagos } = useQuery({
        queryKey: ['pagosNotaCliente', viewingNota?.id],
        queryFn: () => cobranzaService.getByNota(viewingNota.id),
        enabled: !!viewingNota?.id
    });

    // Helper for calculation of Credit due date and Overdue status (Mora)
    const getMoraInfo = (v: any) => {
        const saldo = Number(v.saldo) || 0;
        if (saldo <= 0) {
            return { estado: 'CANCELADO', texto: 'Cancelado', dias: 0, color: 'green', fechaVenc: null, diasCredito: Number(v.diasCredito || 0) };
        }

        let fechaVenc: Date | null = null;
        let diasCred = Number(v.diasCredito) || 0;

        if (v.fechaVencimiento) {
            fechaVenc = new Date(String(v.fechaVencimiento).substring(0, 10) + 'T00:00:00');
        } else if (diasCred > 0 && v.fecha) {
            const d = new Date(String(v.fecha).substring(0, 10) + 'T00:00:00');
            d.setDate(d.getDate() + diasCred);
            fechaVenc = d;
        } else if (v.cliente?.plazoCreditoDias && Number(v.cliente.plazoCreditoDias) > 0 && v.fecha) {
            diasCred = Number(v.cliente.plazoCreditoDias);
            const d = new Date(String(v.fecha).substring(0, 10) + 'T00:00:00');
            d.setDate(d.getDate() + diasCred);
            fechaVenc = d;
        }

        if (!fechaVenc) {
            return { estado: 'PENDIENTE', texto: 'Por Cobrar', dias: 0, color: 'slate', fechaVenc: null, diasCredito: 0 };
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const diffMs = hoy.getTime() - fechaVenc.getTime();
        const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDias > 0) {
            return { estado: 'EN_MORA', texto: `En Mora (${diffDias} d)`, dias: diffDias, color: 'red', fechaVenc, diasCredito: diasCred };
        } else if (diffDias === 0) {
            return { estado: 'VENCE_HOY', texto: 'Vence Hoy', dias: 0, color: 'orange', fechaVenc, diasCredito: diasCred };
        } else {
            return { estado: 'AL_DIA', texto: `Al Día (${Math.abs(diffDias)} d)`, dias: diffDias, color: 'blue', fechaVenc, diasCredito: diasCred };
        }
    };

    // Helper to get a vendor's active debt summary
    const getVendorPortfolioSummary = (vendedorId: number) => {
        if (!salesList) return { totalSaldo: 0, totalNotas: 0, totalClientes: 0, totalMora: 0 };
        const ventasVend = salesList.filter((s: any) => 
            s.tipo === 'VENTA' && 
            s.estado === 'CONFIRMADA' && 
            Number(s.saldo) > 0 && 
            s.vendedor?.id === vendedorId
        );
        const clientesSet = new Set<number>();
        let totalSaldo = 0;
        let totalMora = 0;

        ventasVend.forEach((v: any) => {
            if (v.cliente?.id) clientesSet.add(v.cliente.id);
            const tc = Number(v.tipoCambio) || 6.96;
            const isUSD = v.moneda === 'USD';
            const saldoBOB = isUSD ? Number(v.saldo) * tc : Number(v.saldo || 0);
            totalSaldo += saldoBOB;
            const mora = getMoraInfo(v);
            if (mora.estado === 'EN_MORA') {
                totalMora += saldoBOB;
            }
        });

        return {
            totalSaldo,
            totalNotas: ventasVend.length,
            totalClientes: clientesSet.size,
            totalMora
        };
    };

    const handleOpenCarteraModal = (initialVendedorId?: string) => {
        const vId = initialVendedorId || selectedVendedorId || (personalList && personalList[0] ? String(personalList[0].id) : '');
        const targetVend = personalList?.find(p => String(p.id) === String(vId));
        const phone = targetVend?.telefono || '';
        const initialSucursalId = targetVend?.sucursal?.id 
            ? String(targetVend.sucursal.id) 
            : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : ''));

        setWhatsappCarteraModalData({
            isOpen: true,
            vendedorId: vId,
            phone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    const handleOpenClienteWhatsAppModal = (initialClienteId?: string) => {
        const cId = initialClienteId || selectedClienteId;
        if (!cId) {
            toast.error('Seleccione un cliente para enviar su estado de cuenta');
            return;
        }
        const targetCli = clientsList?.find(c => String(c.id) === String(cId));
        const phone = targetCli?.persona?.telefono || '';
        const initialSucursalId = targetCli?.sucursal?.id 
            ? String(targetCli.sucursal.id) 
            : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : ''));

        setWhatsappClienteModalData({
            isOpen: true,
            clienteId: String(cId),
            phone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    const handleOpenVentaWhatsAppModal = (v: any) => {
        const clientPhone = v.cliente?.persona?.telefono || '';
        const initialSucursalId = v.sucursal?.id 
            ? String(v.sucursal.id) 
            : (v.cliente?.sucursal?.id ? String(v.cliente.sucursal.id) : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : ''));

        setWhatsappVentaModalData({
            isOpen: true,
            venta: v,
            phone: clientPhone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };

    // Filter clients available for vendor and branch/city
    const availableClients = useMemo(() => {
        if (!clientsList) return [];
        let list = clientsList;
        if (selectedSucursal) {
            list = list.filter(c => 
                c.sucursal?.id === Number(selectedSucursal) || 
                c.ruta?.sucursal?.id === Number(selectedSucursal) ||
                (selectedClienteId && c.id.toString() === selectedClienteId)
            );
        } else if (selectedCiudad) {
            list = list.filter(c => 
                c.sucursal?.ciudad?.id === Number(selectedCiudad) || 
                c.ruta?.sucursal?.ciudad?.id === Number(selectedCiudad) ||
                (selectedClienteId && c.id.toString() === selectedClienteId)
            );
        }
        if (isRestrictedVendor) {
            list = list.filter(c => 
                (c.ruta?.vendedor?.id === userPersonal.id) ||
                salesList?.some(s => s.vendedor?.id === userPersonal.id && s.cliente?.id === c.id) ||
                (selectedClienteId && c.id.toString() === selectedClienteId)
            );
        }
        return list.sort((a, b) => {
            const na = getClientDisplayName(a);
            const nb = getClientDisplayName(b);
            return na.localeCompare(nb);
        });
    }, [clientsList, selectedSucursal, selectedCiudad, isRestrictedVendor, userPersonal, salesList, selectedClienteId]);

    // Filter sales by global filters, client, date range, status, invoice type, and search term
    const filteredVentas = useMemo(() => {
        if (!salesList) return [];
        let filtered = salesList.filter(s => s.tipo === 'VENTA' && s.estado === 'CONFIRMADA');

        // Global branch and city filter
        if (selectedSucursal) {
            filtered = filtered.filter(s => (s.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(s => (s.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        // Specific Client filter
        if (selectedClienteId) {
            filtered = filtered.filter(s => s.cliente?.id === Number(selectedClienteId));
        }

        // Specific Vendedor filter
        if (isRestrictedVendor) {
            filtered = filtered.filter(s => s.vendedor?.id === userPersonal.id);
        } else if (selectedVendedorId) {
            filtered = filtered.filter(s => s.vendedor?.id === Number(selectedVendedorId));
        }

        // Debt / Mora status filter
        if (estadoFiltro === 'PENDIENTE') {
            filtered = filtered.filter(s => Number(s.saldo) > 0);
        } else if (estadoFiltro === 'EN_MORA') {
            filtered = filtered.filter(s => Number(s.saldo) > 0 && getMoraInfo(s).estado === 'EN_MORA');
        } else if (estadoFiltro === 'AL_DIA') {
            filtered = filtered.filter(s => Number(s.saldo) > 0 && (getMoraInfo(s).estado === 'AL_DIA' || getMoraInfo(s).estado === 'VENCE_HOY' || getMoraInfo(s).estado === 'PENDIENTE'));
        } else if (estadoFiltro === 'SALDADO') {
            filtered = filtered.filter(s => Number(s.saldo) === 0);
        }

        // Invoice type filter (Con Factura / Sin Factura)
        if (facturaFiltro === 'CON_FACTURA') {
            filtered = filtered.filter(s => Boolean(s.conFactura));
        } else if (facturaFiltro === 'SIN_FACTURA') {
            filtered = filtered.filter(s => !s.conFactura);
        }

        // Date range filter
        if (fechaDesde) {
            filtered = filtered.filter(s => s.fecha && s.fecha.substring(0, 10) >= fechaDesde);
        }
        if (fechaHasta) {
            filtered = filtered.filter(s => s.fecha && s.fecha.substring(0, 10) <= fechaHasta);
        }

        // Search bar
        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(item => {
                const num = (item.numero || '').toLowerCase();
                const numFac = (item.numeroFactura || '').toLowerCase();
                const cliName = (item.cliente?.nombreTienda ? `${item.cliente.nombreTienda} ` : '') + (item.cliente?.persona 
                    ? `${item.cliente.persona.nombres} ${item.cliente.persona.apellidos}`
                    : '');
                const vendName = item.vendedor
                    ? `${item.vendedor.nombres || ''} ${item.vendedor.apellidos || ''}`.toLowerCase()
                    : '';
                const obs = (item.observaciones || '').toLowerCase();
                return num.includes(s) || numFac.includes(s) || cliName.toLowerCase().includes(s) || vendName.includes(s) || obs.includes(s);
            });
        }

        return filtered;
    }, [salesList, selectedSucursal, selectedCiudad, selectedClienteId, selectedVendedorId, estadoFiltro, facturaFiltro, fechaDesde, fechaHasta, searchTerm, isRestrictedVendor, userPersonal]);

    // Financial Metrics Calculation
    const metrics = useMemo(() => {
        let totalVentasBOB = 0;
        let totalSaldoBOB = 0;
        let totalCobradoBOB = 0;
        let totalConFacturaBOB = 0;
        let totalSinFacturaBOB = 0;
        let totalMoraBOB = 0;
        let conFacturaCount = 0;
        let sinFacturaCount = 0;
        let moraCount = 0;

        filteredVentas.forEach(v => {
            const total = Number(v.total) || 0;
            const saldo = Number(v.saldo) || 0;
            const tc = Number(v.tipoCambio) || 6.96;
            const isUSD = v.moneda === 'USD';

            const totalConvertido = isUSD ? total * tc : total;
            const saldoConvertido = isUSD ? saldo * tc : saldo;
            const cobradoConvertido = Math.max(0, totalConvertido - saldoConvertido);

            totalVentasBOB += totalConvertido;
            totalSaldoBOB += saldoConvertido;
            totalCobradoBOB += cobradoConvertido;

            const mora = getMoraInfo(v);
            if (mora.estado === 'EN_MORA' && saldoConvertido > 0) {
                totalMoraBOB += saldoConvertido;
                moraCount++;
            }

            if (v.conFactura) {
                conFacturaCount++;
                totalConFacturaBOB += totalConvertido;
            } else {
                sinFacturaCount++;
                totalSinFacturaBOB += totalConvertido;
            }
        });

        return {
            totalVentasBOB,
            totalSaldoBOB,
            totalCobradoBOB,
            totalConFacturaBOB,
            totalSinFacturaBOB,
            totalMoraBOB,
            count: filteredVentas.length,
            conFacturaCount,
            sinFacturaCount,
            moraCount
        };
    }, [filteredVentas]);

    // Pagination
    const totalPages = Math.ceil(filteredVentas.length / itemsPerPage) || 1;
    const paginatedVentas = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredVentas.slice(start, start + itemsPerPage);
    }, [filteredVentas, currentPage]);

    React.useEffect(() => setCurrentPage(1), [selectedClienteId, selectedVendedorId, estadoFiltro, facturaFiltro, fechaDesde, fechaHasta, searchTerm]);

    // Export reports
    const exportColumns = [
        { header: 'Fecha', dataKey: 'fechaFormateada' },
        { header: 'Nro Venta', dataKey: 'numero' },
        { header: 'Cliente', dataKey: 'clienteNombre' },
        { header: 'Vendedor', dataKey: 'vendedorNombre' },
        { header: 'Nota de Venta', dataKey: 'observaciones' },
        { header: 'Facturación', dataKey: 'facturaInfo' },
        { header: 'Plazo/Venc.', dataKey: 'vencimientoInfo' },
        { header: 'Total Venta', dataKey: 'totalFormateado' },
        { header: 'Total Cobrado', dataKey: 'cobradoFormateado' },
        { header: 'Saldo Pendiente', dataKey: 'saldoFormateado' },
        { header: 'Estado / Mora', dataKey: 'estadoSaldo' }
    ];

    const mappedExportData = useMemo(() => {
        return filteredVentas.map(v => {
            const isUSD = v.moneda === 'USD';
            const sim = isUSD ? '$us' : 'Bs.';
            const total = Number(v.total) || 0;
            const saldo = Number(v.saldo) || 0;
            const cobrado = Math.max(0, total - saldo);
            const cliName = getClientDisplayName(v.cliente);
            const vendedorNombre = v.vendedor 
                ? `${v.vendedor.nombres || ''} ${v.vendedor.apellidos || ''}`.trim() 
                : '---';
            const mora = getMoraInfo(v);
            const vencStr = mora.fechaVenc ? format(mora.fechaVenc, 'dd/MM/yyyy') : (mora.diasCredito > 0 ? `${mora.diasCredito} días` : 'Contado');

            return {
                ...v,
                fechaFormateada: v.fecha ? format(new Date(v.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-',
                clienteNombre: cliName,
                vendedorNombre,
                observaciones: v.observaciones || '-',
                facturaInfo: v.conFactura ? `Con Factura (#${v.numeroFactura || 'S/N'})` : 'Sin Factura',
                vencimientoInfo: vencStr,
                totalFormateado: `${sim} ${total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
                cobradoFormateado: `${sim} ${cobrado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
                saldoFormateado: `${sim} ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}`,
                estadoSaldo: mora.texto
            };
        });
    }, [filteredVentas]);

    const getFiltersText = () => {
        const texts: string[] = [];

        // Ciudad
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }

        // Sucursal
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }

        // Cliente
        if (selectedClienteId) {
            const cli = clientsList?.find(c => String(c.id) === String(selectedClienteId));
            if (cli) {
                const nombre = getClientDisplayName(cli);
                texts.push(`Cliente: ${nombre}`);
            }
        }

        // Vendedor
        if (selectedVendedorId) {
            const ve = personalList?.find(p => String(p.id) === String(selectedVendedorId));
            if (ve) {
                texts.push(`Vendedor: ${ve.nombres} ${ve.apellidos}`);
            }
        }

        // Estado de deuda / mora
        if (estadoFiltro !== 'TODOS') {
            const estadoLabels: Record<string, string> = {
                PENDIENTE: 'Por Cobrar',
                EN_MORA: 'En Mora',
                AL_DIA: 'Al Día',
                SALDADO: 'Cancelados',
            };
            texts.push(`Estado: ${estadoLabels[estadoFiltro] ?? estadoFiltro}`);
        }

        // Facturación
        if (facturaFiltro === 'CON_FACTURA') texts.push('Facturación: Con Factura');
        else if (facturaFiltro === 'SIN_FACTURA') texts.push('Facturación: Sin Factura');

        // Fechas
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

        return texts.length > 0 ? texts.join(' | ') : 'Todas las cuentas por cobrar';
    };

    const getExportColumns = () => {
        let cols = [...exportColumns];
        if (selectedClienteId) {
            cols = cols.filter(c => c.dataKey !== 'clienteNombre');
        }
        if (selectedVendedorId) {
            cols = cols.filter(c => c.dataKey !== 'vendedorNombre');
        }
        if (facturaFiltro !== 'TODOS') {
            cols = cols.filter(c => c.dataKey !== 'facturaInfo');
        }
        return cols;
    };

    const getTotalsFooter = (): Record<string, string> => {
        let totalVenta = 0;
        let totalCobrado = 0;
        let totalSaldo = 0;

        filteredVentas.forEach(v => {
            const total = Number(v.total) || 0;
            const saldo = Number(v.saldo) || 0;
            const cobrado = Math.max(0, total - saldo);
            const tc = Number(v.tipoCambio) || 6.96;
            const isUSD = v.moneda === 'USD';
            totalVenta   += isUSD ? total   * tc : total;
            totalCobrado += isUSD ? cobrado * tc : cobrado;
            totalSaldo   += isUSD ? saldo   * tc : saldo;
        });

        const fmt = (n: number) => `Bs. ${n.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        return {
            fechaFormateada: 'TOTALES',
            numero: '',
            facturaInfo: '',
            clienteNombre: '',
            vendedorNombre: '',
            observaciones: '',
            vencimientoInfo: '',
            moneda: '',
            totalFormateado: fmt(totalVenta),
            cobradoFormateado: fmt(totalCobrado),
            saldoFormateado: fmt(totalSaldo),
            estadoSaldo: '',
        };
    };

    const handlePrint = () => {
        if (!mappedExportData.length) return;
        printData('Estado de Cuentas por Cobrar - Clientes', getExportColumns(), mappedExportData, getFiltersText(), getTotalsFooter());
    };

    const handleExportPDF = () => {
        if (!mappedExportData.length) return;
        exportToPDF('Estado de Cuentas por Cobrar - Clientes', getExportColumns(), mappedExportData, 'estado_cuenta_clientes', getFiltersText(), getTotalsFooter());
    };

    const handleExportExcel = () => {
        if (!mappedExportData.length) return;
        exportToExcel(getExportColumns(), mappedExportData, 'estado_cuenta_clientes');
    };

    if (loadingSales) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando estado de cuentas de clientes...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Wallet className="w-8 h-8 text-primary/80" />
                        Estado de Cuentas - Clientes
                    </h1>
                    <p className="text-muted-foreground italic">Historial de créditos, cobros y saldos pendientes con y sin factura por cliente.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    {selectedClienteId && (
                        <button
                            type="button"
                            onClick={() => handleOpenClienteWhatsAppModal()}
                            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                            title="Enviar Estado de Cuenta Consolidado al Cliente por WhatsApp"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Enviar Estado de Cuenta al Cliente</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => handleOpenCarteraModal()}
                        className="flex items-center gap-2 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        title="Enviar Planilla de Cartera y Saldos Pendientes al Vendedor por WhatsApp"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar Cartera a Vendedor</span>
                    </button>
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
                </div>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingCart className="w-4 h-4 text-primary" /> Total en Ventas
                    </span>
                    <div className="text-xl font-bold text-foreground">
                        Bs. {metrics.totalVentasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap pt-0.5">
                        <span className="text-blue-600 font-semibold">
                            C/Fact: Bs. {metrics.totalConFacturaBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({metrics.conFacturaCount})
                        </span>
                        <span>•</span>
                        <span className="text-muted-foreground font-semibold">
                            S/Fact: Bs. {metrics.totalSinFacturaBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({metrics.sinFacturaCount})
                        </span>
                    </div>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" /> Total Cobrado / Amortizado
                    </span>
                    <div className="text-xl font-bold text-green-600">
                        Bs. {metrics.totalCobradoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Pagos efectivamente aplicados</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-red-600 dark:text-red-400" /> Saldo Total por Cobrar
                    </span>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        Bs. {metrics.totalSaldoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Cuentas por cobrar pendientes</p>
                </div>

                <div 
                    onClick={() => setEstadoFiltro(prev => prev === 'EN_MORA' ? 'TODOS' : 'EN_MORA')}
                    className={`p-4 bg-card border rounded-xl shadow-sm space-y-1 border-l-4 border-l-red-500 cursor-pointer transition-all hover:shadow-md ${
                        estadoFiltro === 'EN_MORA' ? 'ring-2 ring-red-500 bg-red-50/20' : ''
                    }`}
                    title="Haz clic para filtrar u ocultar cuentas en mora"
                >
                    <span className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center justify-between gap-1.5">
                        <span className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" /> En Mora (Vencidas)</span>
                        {estadoFiltro === 'EN_MORA' && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-black">ACTIVO</span>}
                    </span>
                    <div className="text-xl font-bold text-red-600 dark:text-red-400">
                        Bs. {metrics.totalMoraBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] font-semibold text-red-600/90 dark:text-red-400/90">
                        {metrics.moraCount} {metrics.moraCount === 1 ? 'cuenta vencida' : 'cuentas vencidas'} (clic para filtrar)
                    </p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Selector de Cliente */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-primary" /> Filtrar por Cliente
                        </label>
                        <select
                            value={selectedClienteId}
                            onChange={(e) => setSelectedClienteId(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/50"
                        >
                            <option value="">Todos los Clientes</option>
                            {availableClients.map(c => {
                                const nombre = getClientDisplayName(c);
                                return (
                                    <option key={c.id} value={c.id}>
                                        {nombre} {c.plazoCreditoDias ? `(Límite: ${c.plazoCreditoDias}d)` : ''}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Selector de Vendedor */}
                    {isRestrictedVendor ? (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary" /> Vendedor</span>
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5 font-normal">
                                    <Lock className="w-3 h-3" /> Fijo a tu cuenta
                                </span>
                            </label>
                            <div className="w-full p-2 border border-primary/30 rounded-lg bg-muted/40 text-sm font-medium text-primary flex items-center justify-between">
                                <span>{userPersonal.nombres} {userPersonal.apellidos}</span>
                                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-primary" /> Filtrar por Vendedor
                            </label>
                            <select
                                value={selectedVendedorId}
                                onChange={(e) => setSelectedVendedorId(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/50"
                            >
                                <option value="">Todos los Vendedores</option>
                                {personalList?.map(v => (
                                    <option key={v.id} value={v.id}>
                                        {v.nombres} {v.apellidos}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Filtro de Tipo de Facturación */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-primary" /> Tipo de Emisión
                        </label>
                        <select
                            value={facturaFiltro}
                            onChange={(e) => setFacturaFiltro(e.target.value as any)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="TODOS">Todos (Con y Sin Factura)</option>
                            <option value="CON_FACTURA">Con Factura</option>
                            <option value="SIN_FACTURA">Sin Factura</option>
                        </select>
                    </div>

                    {/* Filtro de Estado de Saldo y Mora */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <DollarSign className="w-3.5 h-3.5 text-primary" /> Estado de Deuda / Mora
                        </label>
                        <select
                            value={estadoFiltro}
                            onChange={(e) => setEstadoFiltro(e.target.value as any)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                        >
                            <option value="TODOS">Todos los Estados</option>
                            <option value="EN_MORA">⚠️ Solo En Mora (Vencidos)</option>
                            <option value="AL_DIA">✅ Solo Al Día (Dentro de Plazo)</option>
                            <option value="PENDIENTE">⏳ Todos por Cobrar</option>
                            <option value="SALDADO">✨ Cancelados / Saldados</option>
                        </select>
                    </div>

                    {/* Fecha Desde */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={fechaDesde}
                            onChange={(e) => setFechaDesde(e.target.value)}
                            className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>

                    {/* Fecha Hasta */}
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {(fechaDesde || fechaHasta || selectedClienteId || selectedVendedorId || estadoFiltro !== 'TODOS' || facturaFiltro !== 'TODOS') && (
                                <button
                                    onClick={() => {
                                        setSelectedClienteId('');
                                        setSelectedVendedorId('');
                                        setEstadoFiltro('TODOS');
                                        setFacturaFiltro('TODOS');
                                        setFechaDesde('');
                                        setFechaHasta('');
                                        setSearchTerm('');
                                    }}
                                    className="p-2 border rounded-lg hover:bg-accent text-xs font-semibold text-muted-foreground whitespace-nowrap"
                                    title="Limpiar Filtros"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Search text and En Mora toggle */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nro. de venta, nro. de factura, cliente, vendedor o nota..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={() => setEstadoFiltro(prev => prev === 'EN_MORA' ? 'TODOS' : 'EN_MORA')}
                        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm shrink-0 cursor-pointer ${
                            estadoFiltro === 'EN_MORA'
                                ? 'bg-primary text-primary-foreground hover:opacity-90 ring-2 ring-primary/30'
                                : 'bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800'
                        }`}
                        title={estadoFiltro === 'EN_MORA' ? "Mostrar todas las ventas" : "Mostrar solo ventas en mora"}
                    >
                        {estadoFiltro === 'EN_MORA' ? (
                            <>
                                <X className="w-4 h-4" />
                                <span>Todos</span>
                            </>
                        ) : (
                            <>
                                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                <span>En Mora</span>
                                {metrics.moraCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-red-600 text-white shadow-sm">
                                        {metrics.moraCount}
                                    </span>
                                )}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Tabla de Estados de Cuenta */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1150px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Venta</th>
                                {!selectedClienteId && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                )}
                                {!selectedVendedorId && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>
                                )}
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota de Venta</th>
                                {facturaFiltro === 'TODOS' && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Facturación</th>
                                )}
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plazo / Venc.</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Venta</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Cobrado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo Deuda</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-36">Estado</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-28">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedVentas.length === 0 ? (
                                <tr>
                                    <td colSpan={10 + (!selectedClienteId ? 1 : 0) + (!selectedVendedorId ? 1 : 0) + (facturaFiltro === 'TODOS' ? 1 : 0)} className="p-8 text-center text-muted-foreground text-sm">
                                        No se encontraron cuentas por cobrar para los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : paginatedVentas.map((v, index) => {
                                const cliLabel = v.cliente?.persona 
                                    ? `${v.cliente.persona.nombres} ${v.cliente.persona.apellidos}` 
                                    : 'Cliente';
                                const vendedorLabel = v.vendedor 
                                    ? `${v.vendedor.nombres || ''} ${v.vendedor.apellidos || ''}`.trim() 
                                    : '---';
                                const isUSD = v.moneda === 'USD';
                                const sim = isUSD ? '$us' : 'Bs.';
                                const total = Number(v.total) || 0;
                                const saldo = Number(v.saldo) || 0;
                                const cobrado = Math.max(0, total - saldo);
                                const mora = getMoraInfo(v);

                                return (
                                    <tr key={v.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-sm font-medium">
                                            {v.fecha ? format(new Date(v.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <button
                                                type="button"
                                                onClick={() => setViewingDetalleVenta(v)}
                                                className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                title="Ver detalle y productos de la venta"
                                            >
                                                <Eye className="w-3 h-3" />
                                                {v.numero}
                                            </button>
                                        </td>
                                        {!selectedClienteId && (
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    {v.cliente?.nombreTienda ? (
                                                        <>
                                                            <span className="text-sm font-bold text-foreground flex items-center gap-1">
                                                                <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                {v.cliente.nombreTienda}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {getClientPersonName(v.cliente)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="text-sm font-semibold text-foreground">
                                                            {getClientPersonName(v.cliente)}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                        {!selectedVendedorId && (
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {vendedorLabel}
                                            </td>
                                        )}
                                        <td className="p-4 max-w-[180px]">
                                            {v.observaciones ? (
                                                <span className="text-xs text-muted-foreground line-clamp-2" title={v.observaciones}>
                                                    {v.observaciones}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground/50 font-mono">-</span>
                                            )}
                                        </td>
                                        {facturaFiltro === 'TODOS' && (
                                            <td className="p-4 text-sm">
                                                {v.conFactura ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200" title={`Factura Nro: ${v.numeroFactura || 'S/N'}`}>
                                                        <Receipt className="w-3 h-3 text-blue-600" /> FAC: {v.numeroFactura || 'S/N'}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                                                        Sin Factura
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="p-4 text-xs">
                                            {mora.fechaVenc ? (
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-foreground">
                                                        {format(mora.fechaVenc, 'dd/MM/yyyy')}
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Plazo: {mora.diasCredito} días
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic">Contado</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right">
                                            {sim} {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right text-green-600">
                                            {sim} {cobrado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-right">
                                            <span className={saldo > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-muted-foreground'}>
                                                {sim} {saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {mora.estado === 'CANCELADO' && (
                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                                    Cancelado
                                                </span>
                                            )}
                                            {mora.estado === 'EN_MORA' && (
                                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-extrabold bg-red-600 text-white uppercase tracking-wider shadow-sm border border-red-700">
                                                    En Mora ({mora.dias} d)
                                                </span>
                                            )}
                                            {mora.estado === 'VENCE_HOY' && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white uppercase tracking-wider shadow-sm">
                                                    Vence Hoy
                                                </span>
                                            )}
                                            {mora.estado === 'AL_DIA' && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase tracking-wider">
                                                    Al Día ({Math.abs(mora.dias)} d)
                                                </span>
                                            )}
                                            {mora.estado === 'PENDIENTE' && (
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wider">
                                                    Por Cobrar
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenVentaWhatsAppModal(v)}
                                                    className="px-2.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                                                    title="Enviar Estado de Cuenta / Saldo de esta Venta por WhatsApp (PDF)"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setViewingNota(v)}
                                                    className="px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                    title="Ver Historial de Pagos"
                                                >
                                                    <Receipt className="w-3.5 h-3.5" /> Pagos
                                                </button>
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredVentas.length)} de {filteredVentas.length}
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

            {/* Modal de Historial de Cobros de la Venta */}
            <Modal
                isOpen={viewingNota !== null}
                onClose={() => setViewingNota(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Receipt className="w-6 h-6 text-primary/80" />
                        Historial de Cobros - Venta {viewingNota?.numero}
                    </span>
                }
                className="max-w-2xl"
            >
                {viewingNota && (
                    <div className="space-y-4">
                        {/* Cabecera de la Venta */}
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3.5 bg-muted/40 rounded-xl border text-xs">
                            <div>
                                <span className="text-muted-foreground block">Cliente:</span>
                                <span className="font-bold text-foreground">
                                    {getClientDisplayName(viewingNota.cliente)}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Facturación:</span>
                                <span className="font-bold text-foreground">
                                    {viewingNota.conFactura ? (
                                        <span className="text-blue-600 font-bold">FAC: {viewingNota.numeroFactura || 'S/N'}</span>
                                    ) : (
                                        <span className="text-muted-foreground font-medium">Sin Factura</span>
                                    )}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Fecha Venta:</span>
                                <span className="font-semibold">
                                    {viewingNota.fecha ? format(new Date(viewingNota.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Total Venta:</span>
                                <span className="font-bold text-primary">
                                    {viewingNota.moneda === 'USD' ? '$us' : 'Bs.'} {Number(viewingNota.total).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Saldo Pendiente:</span>
                                <span className={`font-bold ${Number(viewingNota.saldo) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                    {viewingNota.moneda === 'USD' ? '$us' : 'Bs.'} {Number(viewingNota.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>

                        {/* Listado de Pagos */}
                        <div className="border rounded-xl overflow-hidden">
                            <div className="p-3 bg-muted/50 border-b flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                    <DollarSign className="w-4 h-4 text-primary" /> Pagos y Abonos Registrados
                                </span>
                                <span className="text-xs font-semibold text-muted-foreground">
                                    {notaPagos?.length || 0} abonos
                                </span>
                            </div>

                            {loadingNotaPagos ? (
                                <div className="p-6 text-center text-xs text-muted-foreground animate-pulse">Cargando abonos...</div>
                            ) : notaPagos && notaPagos.length > 0 ? (
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-muted/20 border-b">
                                            <th className="p-3 font-semibold text-muted-foreground">Fecha</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Método</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Referencia</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-center">Comprobante</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-right">Monto Pagado</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {notaPagos.map((p) => {
                                            const isUSD = p.moneda === 'USD';
                                            const sim = isUSD ? '$us' : 'Bs.';
                                            const esCruzada = p.moneda !== viewingNota.moneda;

                                            return (
                                                <tr key={p.id} className="hover:bg-accent/30">
                                                    <td className="p-3 font-medium">
                                                        {p.fecha ? format(new Date(p.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">{p.metodoPago || 'Efectivo'}</td>
                                                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{p.referencia || '-'}</td>
                                                    <td className="p-3 text-center">
                                                        {p.comprobanteUrl ? (
                                                            p.comprobanteUrl.toLowerCase().endsWith('.pdf') ? (
                                                                <a 
                                                                    href={getFileUrl(p.comprobanteUrl)} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer" 
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                                                                    title="Ver comprobante PDF"
                                                                >
                                                                    <FileText className="w-3 h-3" /> PDF
                                                                </a>
                                                            ) : (
                                                                <a
                                                                    href={getFileUrl(p.comprobanteUrl)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1 p-0.5 rounded hover:ring-2 hover:ring-primary/40 transition-all"
                                                                    title="Ver comprobante de pago"
                                                                >
                                                                    <img 
                                                                        src={getFileUrl(p.comprobanteUrl)} 
                                                                        alt="Voucher" 
                                                                        className="w-6 h-6 object-cover rounded border" 
                                                                    />
                                                                </a>
                                                            )
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-primary">
                                                        {sim} {Number(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                        {esCruzada && p.montoEquivalente > 0 && (
                                                            <div className="text-[10px] text-muted-foreground font-normal">
                                                                ≈ {viewingNota.moneda === 'USD' ? '$us' : 'Bs.'} {Number(p.montoEquivalente).toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        {p.activo ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                                                                Aplicado
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                                                Anulado
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-6 text-center text-xs text-muted-foreground">
                                    No se han registrado pagos o abonos para esta venta todavía.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center pt-2 border-t">
                            <button
                                type="button"
                                onClick={() => handleOpenVentaWhatsAppModal(viewingNota)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                                <MessageCircle className="w-4 h-4" /> Enviar por WhatsApp
                            </button>
                            <button
                                onClick={() => setViewingNota(null)}
                                className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Detalle de Productos de la Venta */}
            <DetalleVentaModal
                isOpen={viewingDetalleVenta !== null}
                onClose={() => setViewingDetalleVenta(null)}
                nota={viewingDetalleVenta}
            />

            {/* Modal para Enviar Cartera al Vendedor por WhatsApp */}
            <Modal
                isOpen={whatsappCarteraModalData.isOpen}
                onClose={() => setWhatsappCarteraModalData(prev => ({ ...prev, isOpen: false }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <MessageCircle className="w-5 h-5" />
                        Enviar Planilla de Cartera al Vendedor
                    </span>
                }
                className="max-w-lg"
            >
                <div className="space-y-4">
                    {/* Selector de Vendedor */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>Vendedor Destinatario</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Seleccione el vendedor para cargar su cartera</span>
                        </label>
                        <select
                            value={whatsappCarteraModalData.vendedorId}
                            onChange={(e) => {
                                const newVId = e.target.value;
                                const vend = personalList?.find(p => String(p.id) === String(newVId));
                                setWhatsappCarteraModalData(prev => ({
                                    ...prev,
                                    vendedorId: newVId,
                                    phone: vend?.telefono || prev.phone,
                                    sucursalId: vend?.sucursal?.id ? String(vend.sucursal.id) : prev.sucursalId
                                }));
                            }}
                            className="w-full p-2.5 border rounded-lg bg-background text-xs font-semibold focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                            <option value="">-- Seleccionar Vendedor --</option>
                            {personalList?.map(p => {
                                const summary = getVendorPortfolioSummary(p.id);
                                return (
                                    <option key={p.id} value={p.id}>
                                        {p.nombres} {p.apellidos} {summary.totalNotas > 0 ? `(Bs. ${summary.totalSaldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })} - ${summary.totalNotas} notas)` : '(Sin deuda activa)'}
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {/* Card Resumen de la Cartera */}
                    {whatsappCarteraModalData.vendedorId && (() => {
                        const vIdNum = Number(whatsappCarteraModalData.vendedorId);
                        const summary = getVendorPortfolioSummary(vIdNum);
                        const targetVend = personalList?.find(p => String(p.id) === String(whatsappCarteraModalData.vendedorId));
                        return (
                            <div className="p-3.5 bg-muted/40 border rounded-xl space-y-2 text-xs">
                                <div className="flex justify-between items-center font-bold">
                                    <span className="text-foreground text-sm flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-primary" /> {targetVend?.nombres} {targetVend?.apellidos}
                                    </span>
                                    <span className="text-primary font-extrabold text-sm">
                                        Bs. {summary.totalSaldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/40 text-[11px]">
                                    <div className="bg-background/80 p-2 rounded-lg border">
                                        <span className="text-muted-foreground block text-[10px]">Clientes</span>
                                        <span className="font-bold text-foreground">{summary.totalClientes} clientes</span>
                                    </div>
                                    <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                        <span className="text-red-700 dark:text-red-400 block text-[10px] font-semibold">En Mora</span>
                                        <span className="font-bold text-red-600 dark:text-red-400">Bs. {summary.totalMora.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                                        <span className="text-green-700 dark:text-green-400 block text-[10px] font-semibold">Vigente</span>
                                        <span className="font-bold text-green-600 dark:text-green-400">Bs. {Math.max(0, summary.totalSaldo - summary.totalMora).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Input de Teléfono */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                            <span>Número de WhatsApp Vendedor</span>
                            <span className="text-[10px] text-muted-foreground font-normal">Prefijo: +591 (Bolivia)</span>
                        </label>
                        <div className="flex rounded-lg border bg-background overflow-hidden focus-within:ring-2 focus-within:ring-primary/20">
                            <span className="px-3 py-2 bg-muted text-xs font-semibold text-muted-foreground flex items-center border-r">
                                🇧🇴 +591
                            </span>
                            <input
                                type="text"
                                placeholder="Ej: 71234567"
                                value={whatsappCarteraModalData.phone}
                                onChange={(e) => setWhatsappCarteraModalData(prev => ({ ...prev, phone: e.target.value }))}
                                className="flex-1 px-3 py-2 text-sm bg-transparent outline-none font-medium"
                            />
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            El vendedor recibirá la planilla en formato PDF con la lista detallada de sus clientes, saldos, días de mora y contactos.
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
                                    const targetVend = personalList?.find(p => String(p.id) === String(whatsappCarteraModalData.vendedorId));
                                    const sucursalTargetId = whatsappCarteraModalData.sucursalId ? Number(whatsappCarteraModalData.sucursalId) : (targetVend?.sucursal?.id || userPersonal?.sucursal?.id);
                                    const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                    const branchName = curBranch?.sucursalNombre || targetVend?.sucursal?.nombre || 'Sucursal Emisora';
                                    const ciudadNombre = curBranch?.ciudadNombre;
                                    const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                    return (
                                        <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                    );
                                })()}
                            </div>
                        </div>
                        {(() => {
                            const targetVend = personalList?.find(p => String(p.id) === String(whatsappCarteraModalData.vendedorId));
                            const sucursalTargetId = whatsappCarteraModalData.sucursalId ? Number(whatsappCarteraModalData.sucursalId) : (targetVend?.sucursal?.id || userPersonal?.sucursal?.id);
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

                    {/* Mensaje opcional */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Nota o Mensaje Personalizado para el Vendedor</label>
                        <textarea
                            rows={2}
                            value={whatsappCarteraModalData.customMessage}
                            onChange={(e) => setWhatsappCarteraModalData(prev => ({ ...prev, customMessage: e.target.value }))}
                            placeholder="Escribe un mensaje de acompañamiento para la gestión de cobro..."
                            className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                        />
                    </div>

                    {/* Botones de acción */}
                    <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                        {(() => {
                            const targetVend = personalList?.find(p => String(p.id) === String(whatsappCarteraModalData.vendedorId));
                            const cleanDigits = (whatsappCarteraModalData.phone || '').replace(/\D/g, '');
                            const phoneWithCountry = cleanDigits.length === 8 ? `591${cleanDigits}` : cleanDigits;
                            const defaultText = encodeURIComponent(
                                `Hola *${targetVend ? `${targetVend.nombres} ${targetVend.apellidos}` : 'Vendedor'}*, te enviamos la planilla de tu cartera de clientes con saldo pendiente de cobro.`
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
                            const targetVend = personalList?.find(p => String(p.id) === String(whatsappCarteraModalData.vendedorId));
                            const sucursalTargetId = whatsappCarteraModalData.sucursalId ? Number(whatsappCarteraModalData.sucursalId) : (targetVend?.sucursal?.id || userPersonal?.sucursal?.id);
                            const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                            const isConn = curBranch?.status === 'CONNECTED';

                            return (
                                <div className="flex items-center gap-2 justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setWhatsappCarteraModalData(prev => ({ ...prev, isOpen: false }))}
                                        className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        disabled={sendCarteraMutation.isPending || !whatsappCarteraModalData.vendedorId || !whatsappCarteraModalData.phone.trim() || !isConn}
                                        title={!isConn ? 'El bot de WhatsApp no está conectado en esta sucursal' : undefined}
                                        onClick={() => {
                                            if (!whatsappCarteraModalData.vendedorId) {
                                                toast.error('Seleccione un vendedor');
                                                return;
                                            }
                                            if (!isConn) {
                                                toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                return;
                                            }
                                            if (!whatsappCarteraModalData.phone.trim()) {
                                                toast.error('Ingrese el teléfono del vendedor');
                                                return;
                                            }
                                            sendCarteraMutation.mutate({
                                                vendedorId: Number(whatsappCarteraModalData.vendedorId),
                                                phone: whatsappCarteraModalData.phone.trim(),
                                                sucursalId: whatsappCarteraModalData.sucursalId ? Number(whatsappCarteraModalData.sucursalId) : undefined,
                                                message: whatsappCarteraModalData.customMessage.trim() || undefined
                                            });
                                        }}
                                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {sendCarteraMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                Enviando Planilla...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-3.5 h-3.5" />
                                                Enviar Planilla PDF
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </Modal>

            {/* Modal para Enviar Estado de Cuenta / Extracto de Venta por WhatsApp */}
            <Modal
                isOpen={whatsappVentaModalData.isOpen}
                onClose={() => setWhatsappVentaModalData(prev => ({ ...prev, isOpen: false, venta: null }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <MessageCircle className="w-5 h-5" />
                        Enviar Estado de Cuenta / Extracto de Venta por WhatsApp
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappVentaModalData.venta && (
                    <div className="space-y-4">
                        {/* Card resumen del Estado de Cuenta de la Venta */}
                        {(() => {
                            const v = whatsappVentaModalData.venta;
                            const totalNum = Number(v.total || 0);
                            const saldoNum = Number(v.saldo || 0);
                            const cobradoNum = Math.max(0, totalNum - saldoNum);
                            const sim = v.moneda === 'USD' ? '$us' : 'Bs.';
                            const mora = getMoraInfo(v);
                            const clientName = v.cliente?.persona ? `${v.cliente.persona.nombres} ${v.cliente.persona.apellidos}` : (v.cliente?.codigo || 'Cliente Final');

                            return (
                                <div className="p-3.5 bg-muted/40 border rounded-xl space-y-2 text-sm">
                                    <div className="flex justify-between items-center font-bold">
                                        <span className="text-foreground">Extracto de Venta N° {v.numero || v.id}</span>
                                        <span className="text-primary font-bold">{sim} {totalNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex justify-between items-center">
                                        <span>Cliente: <strong className="text-foreground">{clientName}</strong></span>
                                        <span>Emisión: {v.fecha ? format(new Date(v.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/40 text-xs">
                                        <div>
                                            <span className="text-muted-foreground">Total Pagado: </span>
                                            <span className="font-bold text-green-600">{sim} {cobradoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-muted-foreground">Saldo Pendiente: </span>
                                            <span className={`font-bold ${saldoNum > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600'}`}>
                                                {sim} {saldoNum.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[11px] flex justify-between items-center pt-1 border-t border-border/20">
                                        <span className="text-muted-foreground">Estado de Crédito:</span>
                                        <span className="font-bold text-foreground">{mora.texto}</span>
                                    </div>
                                </div>
                            );
                        })()}

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
                                    value={whatsappVentaModalData.phone}
                                    onChange={(e) => setWhatsappVentaModalData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="flex-1 px-3 py-2 text-sm bg-transparent outline-none font-medium"
                                />
                            </div>
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
                                        const sucursalTargetId = whatsappVentaModalData.sucursalId ? Number(whatsappVentaModalData.sucursalId) : (whatsappVentaModalData.venta.sucursal?.id || whatsappVentaModalData.venta.cliente?.sucursal?.id);
                                        const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                        const branchName = curBranch?.sucursalNombre || whatsappVentaModalData.venta.sucursal?.nombre || 'Sucursal Emisora';
                                        const ciudadNombre = curBranch?.ciudadNombre;
                                        const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                        return (
                                            <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                        );
                                    })()}
                                </div>
                            </div>
                            {(() => {
                                const sucursalTargetId = whatsappVentaModalData.sucursalId ? Number(whatsappVentaModalData.sucursalId) : (whatsappVentaModalData.venta.sucursal?.id || whatsappVentaModalData.venta.cliente?.sucursal?.id);
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
                            <label className="text-xs font-semibold text-muted-foreground">Mensaje o Nota Opcional</label>
                            <textarea
                                rows={2}
                                value={whatsappVentaModalData.customMessage}
                                onChange={(e) => setWhatsappVentaModalData(prev => ({ ...prev, customMessage: e.target.value }))}
                                placeholder="Escribe una nota personalizada..."
                                className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            {(() => {
                                const cleanDigits = (whatsappVentaModalData.phone || '').replace(/\D/g, '');
                                const phoneWithCountry = cleanDigits.length === 8 ? `591${cleanDigits}` : cleanDigits;
                                const defaultText = encodeURIComponent(
                                    `Hola *${whatsappVentaModalData.venta.cliente?.persona ? `${whatsappVentaModalData.venta.cliente.persona.nombres} ${whatsappVentaModalData.venta.cliente.persona.apellidos}` : 'Cliente'}*, le enviamos su Extracto de Cuenta correspondiente a la Venta N° ${whatsappVentaModalData.venta.numero || whatsappVentaModalData.venta.id} con saldo pendiente de ${whatsappVentaModalData.venta.moneda === 'USD' ? '$us' : 'Bs.'} ${Number(whatsappVentaModalData.venta.saldo).toFixed(2)}.`
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
                                const sucursalTargetId = whatsappVentaModalData.sucursalId ? Number(whatsappVentaModalData.sucursalId) : (whatsappVentaModalData.venta.sucursal?.id || whatsappVentaModalData.venta.cliente?.sucursal?.id);
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                const isConn = curBranch?.status === 'CONNECTED';

                                return (
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setWhatsappVentaModalData(prev => ({ ...prev, isOpen: false, venta: null }))}
                                            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sendEstadoCuentaVentaMutation.isPending || !whatsappVentaModalData.phone.trim() || !isConn}
                                            title={!isConn ? 'El bot de WhatsApp no está conectado en esta sucursal' : undefined}
                                            onClick={() => {
                                                if (!whatsappVentaModalData.venta) return;
                                                if (!isConn) {
                                                    toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                    return;
                                                }
                                                if (!whatsappVentaModalData.phone.trim()) {
                                                    toast.error('Ingrese el número de teléfono');
                                                    return;
                                                }
                                                sendEstadoCuentaVentaMutation.mutate({
                                                    ventaId: whatsappVentaModalData.venta.id,
                                                    phone: whatsappVentaModalData.phone.trim(),
                                                    sucursalId: whatsappVentaModalData.sucursalId ? Number(whatsappVentaModalData.sucursalId) : undefined,
                                                    message: whatsappVentaModalData.customMessage.trim() || undefined
                                                });
                                            }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {sendEstadoCuentaVentaMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Enviando Extracto...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5" />
                                                    Enviar Extracto PDF
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

            {/* Modal para Enviar Estado de Cuenta Consolidado del Cliente por WhatsApp */}
            <Modal
                isOpen={whatsappClienteModalData.isOpen}
                onClose={() => setWhatsappClienteModalData(prev => ({ ...prev, isOpen: false }))}
                title={
                    <span className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                        <MessageCircle className="w-5 h-5" />
                        Enviar Estado de Cuenta Consolidado al Cliente
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappClienteModalData.isOpen && (
                    <div className="space-y-4">
                        {/* Selector / Datos del Cliente */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground">Cliente Destinatario</label>
                            <select
                                value={whatsappClienteModalData.clienteId}
                                onChange={(e) => {
                                    const cId = e.target.value;
                                    const targetCli = clientsList?.find(c => String(c.id) === String(cId));
                                    const phone = targetCli?.persona?.telefono || '';
                                    const sucId = targetCli?.sucursal?.id 
                                        ? String(targetCli.sucursal.id) 
                                        : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : ''));
                                    setWhatsappClienteModalData(prev => ({
                                        ...prev,
                                        clienteId: cId,
                                        phone,
                                        sucursalId: sucId
                                    }));
                                }}
                                className="w-full p-2 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">-- Seleccione Cliente --</option>
                                {availableClients.map(c => {
                                    const name = c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : (c.codigo || `Cliente #${c.id}`);
                                    return (
                                        <option key={c.id} value={c.id}>
                                            {name} {c.persona?.ci ? `(CI: ${c.persona.ci})` : ''}
                                        </option>
                                    );
                                })}
                            </select>
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
                                    value={whatsappClienteModalData.phone}
                                    onChange={(e) => setWhatsappClienteModalData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="flex-1 px-3 py-2 text-sm bg-transparent outline-none font-medium"
                                />
                            </div>
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
                                        const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(whatsappClienteModalData.sucursalId));
                                        const branchName = curBranch?.sucursalNombre || 'Sucursal Asignada';
                                        const ciudadNombre = curBranch?.ciudadNombre;
                                        const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                        return (
                                            <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                        );
                                    })()}
                                </div>
                            </div>
                            {(() => {
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(whatsappClienteModalData.sucursalId));
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
                            <label className="text-xs font-semibold text-muted-foreground">Mensaje o Nota Opcional</label>
                            <textarea
                                rows={2}
                                value={whatsappClienteModalData.customMessage}
                                onChange={(e) => setWhatsappClienteModalData(prev => ({ ...prev, customMessage: e.target.value }))}
                                placeholder="Escribe un mensaje personalizado para el cliente..."
                                className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            {(() => {
                                const cleanDigits = (whatsappClienteModalData.phone || '').replace(/\D/g, '');
                                const phoneWithCountry = cleanDigits.length === 8 ? `591${cleanDigits}` : cleanDigits;
                                const targetCli = clientsList?.find(c => String(c.id) === String(whatsappClienteModalData.clienteId));
                                const clientName = targetCli?.persona ? `${targetCli.persona.nombres} ${targetCli.persona.apellidos}` : 'Cliente';
                                const defaultText = encodeURIComponent(
                                    `Hola *${clientName}*, le enviamos su Estado de Cuenta Oficial emitido por GIPAAF.`
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
                                const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(whatsappClienteModalData.sucursalId));
                                const isConn = curBranch?.status === 'CONNECTED';

                                return (
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setWhatsappClienteModalData(prev => ({ ...prev, isOpen: false }))}
                                            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sendClienteEstadoCuentaMutation.isPending || !whatsappClienteModalData.clienteId || !whatsappClienteModalData.phone.trim() || !isConn}
                                            title={!isConn ? 'El bot de WhatsApp no está conectado en esta sucursal' : undefined}
                                            onClick={() => {
                                                if (!whatsappClienteModalData.clienteId) {
                                                    toast.error('Seleccione un cliente');
                                                    return;
                                                }
                                                if (!isConn) {
                                                    toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                    return;
                                                }
                                                if (!whatsappClienteModalData.phone.trim()) {
                                                    toast.error('Ingrese el número de teléfono');
                                                    return;
                                                }
                                                sendClienteEstadoCuentaMutation.mutate({
                                                    clienteId: Number(whatsappClienteModalData.clienteId),
                                                    phone: whatsappClienteModalData.phone.trim(),
                                                    sucursalId: whatsappClienteModalData.sucursalId ? Number(whatsappClienteModalData.sucursalId) : undefined,
                                                    message: whatsappClienteModalData.customMessage.trim() || undefined
                                                });
                                            }}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {sendClienteEstadoCuentaMutation.isPending ? (
                                                <>
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                    Enviando Estado de Cuenta...
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5" />
                                                    Enviar Estado de Cuenta PDF
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

export default EstadoCuentaClientesPage;
