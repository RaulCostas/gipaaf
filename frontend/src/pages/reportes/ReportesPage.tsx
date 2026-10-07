import { getFileUrl } from '../../api/apiClient';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cobranzaService } from '../../api/cobranzaService';
import { salesService } from '../../api/salesService';
import { purchaseService, EstadoNota } from '../../api/purchaseService';
import { pagoProveedorService } from '../../api/pagoProveedorService';
import { productService, type Producto } from '../../api/productService';
import { lineaService } from '../../api/lineaService';
import { marcaService } from '../../api/marcaService';
import { grupoService } from '../../api/grupoService';
import { clientService } from '../../api/clientService';
import { supplierService } from '../../api/supplierService';
import { personalService } from '../../api/personalService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { traspasoService } from '../../api/traspasoService';
import { egresoService } from '../../api/egresoService';
import { importacionService } from '../../api/importacionService';
import { inventoryService } from '../../api/inventoryService';
import { movimientoService } from '../../api/movimientoService';
import { returnService } from '../../api/returnService';
import { muestraService } from '../../api/muestraService';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { 
    Search, Printer, FileText, FileSpreadsheet,
    Wallet, ShoppingCart, ShoppingBag, PieChart as PieChartIcon, ChevronLeft, ChevronRight,
    Users, CreditCard, DollarSign, Calendar, X, Eye, User, Building2, Tag, Receipt, Package, HandCoins,
    TrendingUp, BarChart3, Activity, Award, Percent, Boxes, ImageIcon, Layers, Store, ShieldAlert
} from 'lucide-react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import Modal from '../../components/ui/Modal';
import DetalleVentaModal from '../../components/ventas/DetalleVentaModal';
import { SearchableSelect, type SearchableOption } from '../../components/ui/SearchableSelect';
import MultiSelectVendedores from '../../components/ui/MultiSelectVendedores';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatCurrency, formatCurrencyAmount } from '../../utils/currencyUtils';
import { getClientDisplayName, getClientPersonName, getClientStoreName } from '../../utils/clientUtils';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export type ReportTabType = 'estadisticas' | 'productos' | 'kardex-cliente' | 'ventas' | 'ventas-producto' | 'cobranzas' | 'compras' | 'pagos-proveedores';

interface ReportTabConfig {
    id: ReportTabType;
    label: string;
    action: string;
    icon: React.ComponentType<{ className?: string }>;
}

const REPORT_TABS: ReportTabConfig[] = [
    { id: 'estadisticas', label: 'Estadísticas (Estratégico)', action: 'ESTADISTICAS', icon: BarChart3 },
    { id: 'productos', label: 'Kardex de Producto', action: 'PRODUCTOS', icon: Boxes },
    { id: 'kardex-cliente', label: 'Kardex de Cliente', action: 'KARDEX_CLIENTE', icon: Users },
    { id: 'ventas', label: 'Reporte de Ventas', action: 'VENTAS', icon: ShoppingCart },
    { id: 'ventas-producto', label: 'Reporte de Ventas x Producto', action: 'VENTAS_PRODUCTO', icon: Package },
    { id: 'cobranzas', label: 'Reporte de Cobranzas', action: 'COBRANZAS', icon: Wallet },
    { id: 'compras', label: 'Reporte de Compras', action: 'COMPRAS', icon: ShoppingBag },
    { id: 'pagos-proveedores', label: 'Reporte de Pagos a Proveedores', action: 'PAGOS_PROVEEDORES', icon: HandCoins },
];

const ReportesPage: React.FC = () => {
    const { isAdmin, isVendedor, isJefeVentas, hasAction, userPersonal } = useAuth();
    const isRestrictedVendor = isVendedor && !isAdmin && !isJefeVentas && !!userPersonal;
    const { selectedSucursal, selectedCiudad } = useFilters();

    const availableTabs = useMemo(() => {
        return REPORT_TABS.filter(tab => isAdmin || hasAction('REPORTES', tab.action));
    }, [isAdmin, hasAction]);

    const [activeTab, setActiveTab] = useState<ReportTabType>('estadisticas');

    // Automatically ensure activeTab is valid among authorized tabs
    React.useEffect(() => {
        if (availableTabs.length > 0 && !availableTabs.some(t => t.id === activeTab)) {
            setActiveTab(availableTabs[0].id);
        }
    }, [availableTabs, activeTab]);

    // ==========================================
    // ESTADOS: ESTADÍSTICAS ESTRATÉGICAS
    // ==========================================
    const [presetPeriodo, setPresetPeriodo] = useState<'ESTE_MES' | 'ULTIMOS_30_DIAS' | 'ULTIMO_TRIMESTRE' | 'ANIO_ACTUAL' | 'PERSONALIZADO'>('ESTE_MES');
    const [statsFechaDesde, setStatsFechaDesde] = useState<string>(() => format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [statsFechaHasta, setStatsFechaHasta] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));

    const handlePresetChange = (preset: 'ESTE_MES' | 'ULTIMOS_30_DIAS' | 'ULTIMO_TRIMESTRE' | 'ANIO_ACTUAL' | 'PERSONALIZADO') => {
        setPresetPeriodo(preset);
        const hoy = new Date();
        const hoyStr = format(hoy, 'yyyy-MM-dd');

        if (preset === 'ESTE_MES') {
            setStatsFechaDesde(format(startOfMonth(hoy), 'yyyy-MM-dd'));
            setStatsFechaHasta(hoyStr);
        } else if (preset === 'ULTIMOS_30_DIAS') {
            setStatsFechaDesde(format(subDays(hoy, 30), 'yyyy-MM-dd'));
            setStatsFechaHasta(hoyStr);
        } else if (preset === 'ULTIMO_TRIMESTRE') {
            setStatsFechaDesde(format(subDays(hoy, 90), 'yyyy-MM-dd'));
            setStatsFechaHasta(hoyStr);
        } else if (preset === 'ANIO_ACTUAL') {
            setStatsFechaDesde(format(startOfYear(hoy), 'yyyy-MM-dd'));
            setStatsFechaHasta(hoyStr);
        }
    };

    // ==========================================
    // ESTADOS: PRODUCTOS
    // ==========================================
    const [filtroProdLinea, setFiltroProdLinea] = useState<string>('');
    const [filtroProdMarca, setFiltroProdMarca] = useState<string>('');
    const [filtroProdGrupo, setFiltroProdGrupo] = useState<string>('');
    const [filtroProdEstado, setFiltroProdEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');
    const [prodFechaDesde, setProdFechaDesde] = useState<string>('');
    const [prodFechaHasta, setProdFechaHasta] = useState<string>('');
    const [prodSearchTerm, setProdSearchTerm] = useState('');
    const [prodCurrentPage, setProdCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: KARDEX INDIVIDUAL DE CLIENTE
    // ==========================================
    const [kardexClienteId, setKardexClienteId] = useState<string>('');
    const [kardexFechaDesde, setKardexFechaDesde] = useState<string>(() => format(startOfYear(new Date()), 'yyyy-MM-dd'));
    const [kardexFechaHasta, setKardexFechaHasta] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
    const [kardexIncluirMuestras, setKardexIncluirMuestras] = useState<boolean>(true);
    const [kardexIncluirDevoluciones, setKardexIncluirDevoluciones] = useState<boolean>(true);

    // ==========================================
    // ESTADOS: VENTAS
    // ==========================================
    const [filtroVentaCliente, setFiltroVentaCliente] = useState<string>('');
    const [filtroVentaVendedores, setFiltroVentaVendedores] = useState<string[]>([]);
    const [filtroVentaTipoDoc, setFiltroVentaTipoDoc] = useState<string>('TODOS');
    const [filtroVentaEstado, setFiltroVentaEstado] = useState<string>('TODOS');
    const [ventaFechaDesde, setVentaFechaDesde] = useState<string>('');
    const [ventaFechaHasta, setVentaFechaHasta] = useState<string>('');
    const [ventaSearchTerm, setVentaSearchTerm] = useState('');
    const [ventaCurrentPage, setVentaCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: REPORTE DE VENTAS X PRODUCTO
    // ==========================================
    const [filtroVentaProdProducto, setFiltroVentaProdProducto] = useState<string>('');
    const [filtroVentaProdMarca, setFiltroVentaProdMarca] = useState<string>('TODOS');
    const [filtroVentaProdVendedores, setFiltroVentaProdVendedores] = useState<string[]>([]);
    const [filtroVentaProdTipoPago, setFiltroVentaProdTipoPago] = useState<string>('TODOS');
    const [ventaProdFechaDesde, setVentaProdFechaDesde] = useState<string>('');
    const [ventaProdFechaHasta, setVentaProdFechaHasta] = useState<string>('');
    const [ventaProdSearchTerm, setVentaProdSearchTerm] = useState('');
    const [ventaProdCurrentPage, setVentaProdCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: COBRANZAS
    // ==========================================
    const [filtroCobranzaCliente, setFiltroCobranzaCliente] = useState<string>('');
    const [filtroCobranzaVendedores, setFiltroCobranzaVendedores] = useState<string[]>([]);
    const [filtroCobranzaEstado, setFiltroCobranzaEstado] = useState<'TODOS' | 'ACTIVO' | 'ANULADO'>('TODOS');
    const [filtroCobranzaMetodo, setFiltroCobranzaMetodo] = useState<string>('TODOS');
    const [cobranzaFechaDesde, setCobranzaFechaDesde] = useState<string>('');
    const [cobranzaFechaHasta, setCobranzaFechaHasta] = useState<string>('');
    const [cobranzaSearchTerm, setCobranzaSearchTerm] = useState('');
    const [cobranzaCurrentPage, setCobranzaCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: COMPRAS
    // ==========================================
    const [filtroCompraProveedor, setFiltroCompraProveedor] = useState<string>('');
    const [filtroCompraMoneda, setFiltroCompraMoneda] = useState<string>('TODOS');
    const [filtroCompraEstado, setFiltroCompraEstado] = useState<string>('TODOS');
    const [compraFechaDesde, setCompraFechaDesde] = useState<string>('');
    const [compraFechaHasta, setCompraFechaHasta] = useState<string>('');
    const [compraSearchTerm, setCompraSearchTerm] = useState('');
    const [compraCurrentPage, setCompraCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: PAGOS A PROVEEDORES
    // ==========================================
    const [filtroPagoProvProveedor, setFiltroPagoProvProveedor] = useState<string>('');
    const [filtroPagoProvEstado, setFiltroPagoProvEstado] = useState<'TODOS' | 'ACTIVO' | 'ANULADO'>('TODOS');
    const [filtroPagoProvMetodo, setFiltroPagoProvMetodo] = useState<string>('TODOS');
    const [pagoProvFechaDesde, setPagoProvFechaDesde] = useState<string>('');
    const [pagoProvFechaHasta, setPagoProvFechaHasta] = useState<string>('');
    const [pagoProvSearchTerm, setPagoProvSearchTerm] = useState('');
    const [pagoProvCurrentPage, setPagoProvCurrentPage] = useState(1);

    const itemsPerPage = 10;

    // Modales de detalle
    const [viewingComprobante, setViewingComprobante] = useState<string | null>(null);
    const [viewingDetalleVenta, setViewingDetalleVenta] = useState<any | null>(null);
    const [viewingDetalleCompra, setViewingDetalleCompra] = useState<any | null>(null);

    // ==========================================
    // CONSULTAS A LA API
    // ==========================================
    const { data: productsList, isLoading: loadingProducts } = useQuery({
        queryKey: ['productsListReportes'],
        queryFn: () => productService.getAll(),
        enabled: activeTab === 'productos' || activeTab === 'estadisticas' || activeTab === 'ventas-producto',
    });

    const { data: inventoryList, isLoading: loadingInventory } = useQuery({
        queryKey: ['inventoryListReportes'],
        queryFn: () => inventoryService.getAll(),
        enabled: activeTab === 'productos' || activeTab === 'estadisticas',
    });

    const { data: movimientosList } = useQuery({
        queryKey: ['movimientosListReportes'],
        queryFn: () => movimientoService.getAll(),
        enabled: activeTab === 'productos' || activeTab === 'estadisticas',
    });

    const { data: lineasList } = useQuery({
        queryKey: ['lineasListReportes'],
        queryFn: lineaService.getAll,
        enabled: activeTab === 'productos',
    });

    const { data: marcasList } = useQuery({
        queryKey: ['marcasListReportes'],
        queryFn: marcaService.getAll,
        enabled: activeTab === 'productos' || activeTab === 'ventas-producto',
    });

    const { data: gruposList } = useQuery({
        queryKey: ['gruposListReportes'],
        queryFn: grupoService.getAll,
        enabled: activeTab === 'productos',
    });

    const { data: ventasList, isLoading: loadingVentas } = useQuery({
        queryKey: ['ventasListReportes'],
        queryFn: salesService.getAll,
        enabled: activeTab === 'ventas' || activeTab === 'ventas-producto' || activeTab === 'estadisticas' || activeTab === 'kardex-cliente',
    });

    const { data: pagosList, isLoading: loadingCobranzas } = useQuery({
        queryKey: ['cobranzasListReportes'],
        queryFn: cobranzaService.getAll,
        enabled: activeTab === 'cobranzas' || activeTab === 'estadisticas' || activeTab === 'kardex-cliente',
    });

    const { data: muestrasList } = useQuery({
        queryKey: ['muestrasListReportes'],
        queryFn: () => muestraService.getAll(),
        enabled: activeTab === 'kardex-cliente',
    });

    const { data: devolucionesList } = useQuery({
        queryKey: ['devolucionesListReportes'],
        queryFn: () => returnService.getAll(),
        enabled: activeTab === 'kardex-cliente',
    });

    const { data: comprasList, isLoading: loadingCompras } = useQuery({
        queryKey: ['comprasListReportes'],
        queryFn: purchaseService.getAll,
        enabled: activeTab === 'compras' || activeTab === 'pagos-proveedores' || activeTab === 'estadisticas',
    });

    const { data: personalList } = useQuery({
        queryKey: ['personalListReportes'],
        queryFn: personalService.getAll,
        enabled: activeTab === 'ventas' || activeTab === 'ventas-producto' || activeTab === 'cobranzas' || activeTab === 'estadisticas',
    });

    const { data: pagosProveedoresList, isLoading: loadingPagosProveedores } = useQuery({
        queryKey: ['pagosProveedoresListReportes'],
        queryFn: pagoProveedorService.getAll,
        enabled: activeTab === 'pagos-proveedores' || activeTab === 'estadisticas',
    });

    const { data: clientesList } = useQuery({
        queryKey: ['clientesListReportes'],
        queryFn: () => clientService.getAll(),
    });

    const { data: proveedoresList } = useQuery({
        queryKey: ['proveedoresListReportes'],
        queryFn: () => supplierService.getAll(),
        enabled: activeTab === 'compras' || activeTab === 'pagos-proveedores' || activeTab === 'estadisticas',
    });

    const { data: traspasosList } = useQuery({
        queryKey: ['traspasosListReportes'],
        queryFn: traspasoService.getAll,
        enabled: activeTab === 'estadisticas',
    });

    const { data: egresosList } = useQuery({
        queryKey: ['egresosListReportes'],
        queryFn: egresoService.getAll,
        enabled: activeTab === 'estadisticas',
    });

    const { data: costosImportacionList } = useQuery({
        queryKey: ['costosImportacionListReportes'],
        queryFn: importacionService.getAll,
        enabled: activeTab === 'estadisticas',
    });

    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });

    // Vendedores activos
    const vendedoresList = useMemo(() => {
        if (!personalList) return [];
        let list = personalList.filter(p => p.cargo === 'VENDEDOR' && p.activo);
        if (selectedSucursal) {
            list = list.filter(p => p.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            list = list.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }
        return list;
    }, [personalList, selectedSucursal, selectedCiudad]);

    // Clientes únicos ordenados para el selector
    const clientesUnicos = useMemo(() => {
        if (clientesList && clientesList.length > 0) {
            return [...clientesList].sort((a, b) => {
                const na = getClientDisplayName(a);
                const nb = getClientDisplayName(b);
                return na.localeCompare(nb);
            });
        }
        return [];
    }, [clientesList]);

    const clientReportOptions: SearchableOption[] = useMemo(() => {
        return clientesUnicos.map(c => ({
            value: String(c.id),
            label: `${c.codigo ? `[${c.codigo}] ` : ''}${getClientDisplayName(c)}${(c.sucursal as any)?.ciudad?.nombre ? ` (${(c.sucursal as any)?.ciudad?.nombre})` : ''}`,
            code: c.codigo ? String(c.codigo) : undefined,
            sublabel: c.nombreTienda && c.persona ? `${c.persona.nombres} ${c.persona.apellidos}` : (c.persona?.ci ? `CI: ${c.persona.ci}` : undefined)
        }));
    }, [clientesUnicos]);

    const clientFilterOptions: SearchableOption[] = useMemo(() => {
        return [
            { value: '', label: 'Todos los Clientes' },
            ...clientReportOptions
        ];
    }, [clientReportOptions]);

    // Proveedores ordenados para el selector
    const proveedoresUnicos = useMemo(() => {
        if (proveedoresList && proveedoresList.length > 0) {
            return [...proveedoresList].sort((a, b) => {
                const na = a.empresa || (a.persona ? `${a.persona.nombres} ${a.persona.apellidos}` : '');
                const nb = b.empresa || (b.persona ? `${b.persona.nombres} ${b.persona.apellidos}` : '');
                return na.localeCompare(nb);
            });
        }
        return [];
    }, [proveedoresList]);

    // ==========================================
    // CÁLCULOS ESTRATÉGICOS (KPIs Y GRÁFICOS)
    // ==========================================
    const strategicData = useMemo(() => {
        let vList = ventasList || [];
        if (selectedSucursal) vList = vList.filter(v => v.sucursal?.id === Number(selectedSucursal));
        else if (selectedCiudad) vList = vList.filter(v => (v.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        if (statsFechaDesde) vList = vList.filter(v => v.fecha && v.fecha.substring(0, 10) >= statsFechaDesde);
        if (statsFechaHasta) vList = vList.filter(v => v.fecha && v.fecha.substring(0, 10) <= statsFechaHasta);

        const ventasConfirmadas = vList.filter(v => v.estado !== 'ANULADA');
        const totalVentasBOB = ventasConfirmadas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
        const cantidadVentas = ventasConfirmadas.length;
        const ticketPromedio = cantidadVentas > 0 ? totalVentasBOB / cantidadVentas : 0;

        let cList = comprasList || [];
        if (selectedSucursal) cList = cList.filter(c => c.sucursal?.id === Number(selectedSucursal) || (c.almacen as any)?.sucursal?.id === Number(selectedSucursal));
        else if (selectedCiudad) cList = cList.filter(c => (c.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (c.almacen as any)?.sucursal?.ciudad?.id === Number(selectedCiudad));
        if (statsFechaDesde) cList = cList.filter(c => c.fecha && c.fecha.substring(0, 10) >= statsFechaDesde);
        if (statsFechaHasta) cList = cList.filter(c => c.fecha && c.fecha.substring(0, 10) <= statsFechaHasta);

        const comprasConfirmadas = cList.filter(c => c.estado === EstadoNota.CONFIRMADA);
        const totalComprasBOB = comprasConfirmadas.reduce((acc, c) => {
            const monto = Number(c.total) || 0;
            const tasa = (c.moneda?.toUpperCase() === 'USD') ? (Number(c.tipoCambio) || 6.96) : 1;
            return acc + (monto * tasa);
        }, 0);

        let cobList = pagosList || [];
        if (selectedSucursal) cobList = cobList.filter(p => (p.nota?.sucursal as any)?.id === Number(selectedSucursal) || (p.cliente?.sucursal as any)?.id === Number(selectedSucursal));
        else if (selectedCiudad) cobList = cobList.filter(p => (p.nota?.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.cliente?.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        if (statsFechaDesde) cobList = cobList.filter(p => p.fecha && p.fecha.substring(0, 10) >= statsFechaDesde);
        if (statsFechaHasta) cobList = cobList.filter(p => p.fecha && p.fecha.substring(0, 10) <= statsFechaHasta);

        const cobranzasActivas = cobList.filter(p => p.activo);
        const totalCobranzasBOB = cobranzasActivas.reduce((acc, p) => {
            const monto = Number(p.monto) || 0;
            const tasa = (p.moneda?.toUpperCase() === 'USD') ? (Number(p.tipoCambio) || 6.96) : 1;
            return acc + (monto * tasa);
        }, 0);

        let pagProvList = pagosProveedoresList || [];
        if (selectedSucursal) pagProvList = pagProvList.filter(p => (p.nota?.sucursal as any)?.id === Number(selectedSucursal) || (p.proveedor?.sucursal as any)?.id === Number(selectedSucursal));
        else if (selectedCiudad) pagProvList = pagProvList.filter(p => (p.nota?.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.proveedor?.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        if (statsFechaDesde) pagProvList = pagProvList.filter(p => p.fecha && p.fecha.substring(0, 10) >= statsFechaDesde);
        if (statsFechaHasta) pagProvList = pagProvList.filter(p => p.fecha && p.fecha.substring(0, 10) <= statsFechaHasta);

        const pagosProvActivos = pagProvList.filter(p => p.activo);
        const totalPagosProvBOB = pagosProvActivos.reduce((acc, p) => {
            const monto = Number(p.monto) || 0;
            const tasa = (p.moneda?.toUpperCase() === 'USD') ? (Number(p.tipoCambio) || 6.96) : 1;
            return acc + (monto * tasa);
        }, 0);

        let trList = traspasosList || [];
        if (selectedSucursal) {
            trList = trList.filter(t => {
                const sucAsignadaId = (t.sucursalCargoCosto === 'DESTINO' 
                    ? (t.sucursalDestino?.id || (t.almacenDestino as any)?.id) 
                    : (t.sucursalOrigen?.id || (t.almacenOrigen as any)?.id));
                return sucAsignadaId === Number(selectedSucursal);
            });
        } else if (selectedCiudad) {
            trList = trList.filter(t => {
                const sucAsignada = t.sucursalCargoCosto === 'DESTINO' 
                    ? (t.sucursalDestino || t.almacenDestino) 
                    : (t.sucursalOrigen || t.almacenOrigen);
                const ciudadId = (sucAsignada as any)?.ciudad?.id || (sucAsignada as any)?.ciudadId;
                return ciudadId === Number(selectedCiudad);
            });
        }
        if (statsFechaDesde) trList = trList.filter(t => t.fecha && t.fecha.substring(0, 10) >= statsFechaDesde);
        if (statsFechaHasta) trList = trList.filter(t => t.fecha && t.fecha.substring(0, 10) <= statsFechaHasta);

        const traspasosActivos = trList.filter(t => t.estado !== 'ANULADO' && (Number(t.costoTransporte) || 0) > 0);
        const totalFletesTraspasoBOB = traspasosActivos.reduce((acc, t) => acc + (Number(t.costoTransporte) || 0), 0);

        let egList = egresosList || [];
        if (selectedSucursal) egList = egList.filter(e => e.sucursal?.id === Number(selectedSucursal) || e.sucursalId === Number(selectedSucursal));
        else if (selectedCiudad) egList = egList.filter(e => (e.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        if (statsFechaDesde) egList = egList.filter(e => e.fecha && e.fecha.substring(0, 10) >= statsFechaDesde);
        if (statsFechaHasta) egList = egList.filter(e => e.fecha && e.fecha.substring(0, 10) <= statsFechaHasta);

        // Excluir los egresos automáticos de traspasos para no duplicar con totalFletesTraspasoBOB
        const egresosActivos = egList.filter(e => 
            e.activo && 
            !e.codigo?.startsWith('EGR-TRASP-') && 
            !e.nroComprobante?.startsWith('TRASP-') &&
            !e.detalle?.toLowerCase().includes('traspaso [trasp-')
        );
        const totalEgresosDiariosBOB = egresosActivos.reduce((acc, e) => {
            const monto = Number(e.monto) || 0;
            const tasa = (e.moneda?.toUpperCase() === 'USD') ? (Number(e.tipoCambio) || 6.96) : 1;
            return acc + (monto * tasa);
        }, 0);

        // Costos de Importación de Compras
        let impList = costosImportacionList || [];
        if (selectedSucursal) {
            impList = impList.filter(imp => (imp.sucursalId === Number(selectedSucursal) || imp.sucursal?.id === Number(selectedSucursal)));
        } else if (selectedCiudad) {
            impList = impList.filter(imp => {
                const suc = sucursales?.find(s => s.id === (imp.sucursalId || imp.sucursal?.id));
                const ciudadId = (suc as any)?.ciudad?.id || (suc as any)?.ciudadId;
                return ciudadId === Number(selectedCiudad);
            });
        }
        if (statsFechaDesde) impList = impList.filter(imp => {
            const f = imp.fecha || (imp as any)?.nota?.fecha;
            return f && String(f).substring(0, 10) >= statsFechaDesde;
        });
        if (statsFechaHasta) impList = impList.filter(imp => {
            const f = imp.fecha || (imp as any)?.nota?.fecha;
            return f && String(f).substring(0, 10) <= statsFechaHasta;
        });

        const totalCostosImportacionBOB = impList.reduce((acc, imp) => {
            const monto = Number(imp.totalGastosBob) || (imp.gastos || []).reduce((gAcc, g) => gAcc + (Number(g.montoBob) || 0), 0);
            return acc + monto;
        }, 0);

        const totalEgresosBOB = totalPagosProvBOB + totalCostosImportacionBOB + totalFletesTraspasoBOB + totalEgresosDiariosBOB;
        const flujoCajaNeto = totalCobranzasBOB - totalEgresosBOB;
        const margenBruto = totalVentasBOB - totalComprasBOB;
        const margenPorcentaje = totalVentasBOB > 0 ? (margenBruto / totalVentasBOB) * 100 : 0;
        const ratioRecaudacion = totalVentasBOB > 0 ? (totalCobranzasBOB / totalVentasBOB) * 100 : 0;

        // 1. Tendencia Temporal (Timeline Cobranzas vs Pagos + Importación + Fletes + Egresos Diarios)
        const timelineMap = new Map<string, { fecha: string; fechaLabel: string; ingresos: number; egresos: number }>();
        cobranzasActivas.forEach(p => {
            if (!p.fecha) return;
            const dStr = p.fecha.substring(0, 10);
            const entry = timelineMap.get(dStr) || { fecha: dStr, fechaLabel: dStr.split('-').reverse().slice(0, 2).join('/'), ingresos: 0, egresos: 0 };
            const monto = Number(p.monto) || 0;
            const tasa = (p.moneda?.toUpperCase() === 'USD') ? (Number(p.tipoCambio) || 6.96) : 1;
            entry.ingresos += monto * tasa;
            timelineMap.set(dStr, entry);
        });

        pagosProvActivos.forEach(p => {
            if (!p.fecha) return;
            const dStr = p.fecha.substring(0, 10);
            const entry = timelineMap.get(dStr) || { fecha: dStr, fechaLabel: dStr.split('-').reverse().slice(0, 2).join('/'), ingresos: 0, egresos: 0 };
            const monto = Number(p.monto) || 0;
            const tasa = (p.moneda?.toUpperCase() === 'USD') ? (Number(p.tipoCambio) || 6.96) : 1;
            entry.egresos += monto * tasa;
            timelineMap.set(dStr, entry);
        });

        impList.forEach(imp => {
            const fechaStr = imp.fecha || (imp as any)?.nota?.fecha;
            if (!fechaStr) return;
            const dStr = String(fechaStr).substring(0, 10);
            const entry = timelineMap.get(dStr) || { fecha: dStr, fechaLabel: dStr.split('-').reverse().slice(0, 2).join('/'), ingresos: 0, egresos: 0 };
            const monto = Number(imp.totalGastosBob) || (imp.gastos || []).reduce((acc, g) => acc + (Number(g.montoBob) || 0), 0);
            entry.egresos += monto;
            timelineMap.set(dStr, entry);
        });

        traspasosActivos.forEach(t => {
            if (!t.fecha) return;
            const dStr = t.fecha.substring(0, 10);
            const entry = timelineMap.get(dStr) || { fecha: dStr, fechaLabel: dStr.split('-').reverse().slice(0, 2).join('/'), ingresos: 0, egresos: 0 };
            const monto = Number(t.costoTransporte) || 0;
            entry.egresos += monto;
            timelineMap.set(dStr, entry);
        });

        egresosActivos.forEach(e => {
            if (!e.fecha) return;
            const dStr = e.fecha.substring(0, 10);
            const entry = timelineMap.get(dStr) || { fecha: dStr, fechaLabel: dStr.split('-').reverse().slice(0, 2).join('/'), ingresos: 0, egresos: 0 };
            const monto = Number(e.monto) || 0;
            const tasa = (e.moneda?.toUpperCase() === 'USD') ? (Number(e.tipoCambio) || 6.96) : 1;
            entry.egresos += monto * tasa;
            timelineMap.set(dStr, entry);
        });

        const timelineData = Array.from(timelineMap.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));

        // 2. Top 5 Productos Más Vendidos
        const productSalesMap = new Map<string, { id: number; nombre: string; codigo: string; cantidad: number; total: number }>();
        ventasConfirmadas.forEach(v => {
            if (v.detalles && Array.isArray(v.detalles)) {
                v.detalles.forEach((d: any) => {
                    const prodName = d.producto?.nombre || 'Producto';
                    const prodCod = d.producto?.codigo || '';
                    const key = `${prodName}_${prodCod}`;
                    const entry = productSalesMap.get(key) || { id: d.producto?.id || 0, nombre: prodName, codigo: prodCod, cantidad: 0, total: 0 };
                    entry.cantidad += Number(d.cantidad) || 0;
                    entry.total += Number(d.subtotal) || 0;
                    productSalesMap.set(key, entry);
                });
            }
        });

        const topProductos = Array.from(productSalesMap.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 5)
            .map(p => ({
                name: p.nombre.length > 20 ? p.nombre.substring(0, 18) + '...' : p.nombre,
                fullName: p.nombre,
                cantidad: p.cantidad,
                total: Math.round(p.total)
            }));

        // 3. Rendimiento por Vendedor
        const sellerMap = new Map<string, { vendedor: string; total: number; ventasCount: number }>();
        ventasConfirmadas.forEach(v => {
            const vName = v.vendedor ? `${v.vendedor.nombres || ''} ${v.vendedor.apellidos || ''}`.trim() : 'Sin Asignar';
            const entry = sellerMap.get(vName) || { vendedor: vName, total: 0, ventasCount: 0 };
            entry.total += Number(v.total) || 0;
            entry.ventasCount += 1;
            sellerMap.set(vName, entry);
        });

        const sellerData = Array.from(sellerMap.values()).sort((a, b) => b.total - a.total).slice(0, 6);

        // 4. Métodos de Pago
        const paymentMethodsMap = new Map<string, number>();
        cobranzasActivas.forEach(p => {
            const m = (p.metodoPago && p.metodoPago.trim()) || 'Efectivo';
            const monto = Number(p.monto) || 0;
            const tasa = (p.moneda?.toUpperCase() === 'USD') ? (Number(p.tipoCambio) || 6.96) : 1;
            paymentMethodsMap.set(m, (paymentMethodsMap.get(m) || 0) + (monto * tasa));
        });

        const paymentMethodsData = Array.from(paymentMethodsMap.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value)
        }));

        // 5. Ventas por Sucursal
        const sucursalesMap = new Map<string, number>();
        ventasConfirmadas.forEach(v => {
            const sucObj = sucursales?.find(s => s.id === v.sucursal?.id) || v.sucursal;
            const sucNombre = sucObj?.nombre || v.sucursal?.nombre || 'Sucursal Central';
            const ciudadNombre = (sucObj as any)?.ciudad?.nombre || (v.sucursal as any)?.ciudad?.nombre;
            const sucLabel = ciudadNombre ? `${sucNombre} (${ciudadNombre})` : sucNombre;
            sucursalesMap.set(sucLabel, (sucursalesMap.get(sucLabel) || 0) + (Number(v.total) || 0));
        });

        const sucursalesData = Array.from(sucursalesMap.entries()).map(([name, total]) => ({
            name,
            total: Math.round(total)
        }));

        return {
            totalVentasBOB,
            cantidadVentas,
            ticketPromedio,
            totalComprasBOB,
            totalCobranzasBOB,
            totalPagosProvBOB,
            totalCostosImportacionBOB,
            totalFletesTraspasoBOB,
            totalEgresosDiariosBOB,
            totalEgresosBOB,
            flujoCajaNeto,
            margenBruto,
            margenPorcentaje,
            ratioRecaudacion,
            timelineData,
            topProductos,
            sellerData,
            paymentMethodsData,
            sucursalesData
        };
    }, [ventasList, comprasList, pagosList, pagosProveedoresList, costosImportacionList, traspasosList, egresosList, statsFechaDesde, statsFechaHasta, selectedSucursal, selectedCiudad, sucursales]);

    // ==========================================
    // LÓGICA PRODUCTOS Y EXISTENCIAS POR SUCURSAL
    // ==========================================
    const hasProdActiveFilters = Boolean(
        filtroProdLinea || filtroProdMarca || 
        filtroProdGrupo || filtroProdEstado !== 'TODOS' || 
        prodFechaDesde || prodFechaHasta || prodSearchTerm
    );

    const handleClearProdFilters = () => {
        setFiltroProdLinea('');
        setFiltroProdMarca('');
        setFiltroProdGrupo('');
        setFiltroProdEstado('TODOS');
        setProdFechaDesde('');
        setProdFechaHasta('');
        setProdSearchTerm('');
    };

    const getCiudadAbrev = (nombre?: string) => {
        if (!nombre) return 'OTRO';
        const n = nombre.trim().toUpperCase();
        if (n.includes('PAZ')) return 'LP';
        if (n.includes('COCHABAMBA') || n.includes('CBBA')) return 'CBBA';
        if (n.includes('SANTA CRUZ') || n.includes('SCZ')) return 'SCZ';
        if (n.includes('ALTO')) return 'EA';
        if (n.includes('ORURO')) return 'ORU';
        if (n.includes('SUCRE')) return 'SUC';
        if (n.includes('TARIJA')) return 'TJA';
        if (n.includes('POTOSI') || n.includes('POTOSÍ')) return 'POT';
        if (n.includes('BENI')) return 'BEN';
        if (n.includes('PANDO')) return 'PAN';
        return nombre.substring(0, 4).toUpperCase();
    };

    const activeSucursales = useMemo(() => {
        if (!sucursales || sucursales.length === 0) {
            return (ciudades || [])
                .filter(c => c.activo !== false)
                .map(c => ({
                    id: c.id,
                    nombre: c.nombre,
                    ciudadId: c.id,
                    ciudadNombre: c.nombre,
                    ciudadAbrev: getCiudadAbrev(c.nombre),
                    key: `stock_suc_${c.id}`
                }));
        }
        return sucursales
            .filter(s => s.activo !== false)
            .map(s => {
                const ciudadObj = (s as any).ciudad || ciudades?.find(c => c.id === ((s as any).ciudadId || (s as any).ciudad?.id));
                const ciudadNombre = ciudadObj?.nombre || '';
                const ciudadAbrev = ciudadNombre ? getCiudadAbrev(ciudadNombre) : '';
                return {
                    id: s.id,
                    nombre: s.nombre,
                    ciudadId: ciudadObj?.id || (s as any).ciudadId,
                    ciudadNombre,
                    ciudadAbrev,
                    key: `stock_suc_${s.id}`
                };
            })
            .sort((a, b) => {
                if (a.ciudadAbrev !== b.ciudadAbrev) {
                    return a.ciudadAbrev.localeCompare(b.ciudadAbrev);
                }
                return a.nombre.localeCompare(b.nombre);
            });
    }, [sucursales, ciudades]);

    const getProductStockData = (prodId: number) => {
        if (!inventoryList) return { stockPorSucursal: {}, totalExistencias: 0 };

        const stockMap: Record<number, number> = {};
        activeSucursales.forEach(s => { stockMap[s.id] = 0; });

        if (prodFechaHasta) {
            const cutOffDateStr = prodFechaHasta + 'T23:59:59.999Z';
            const prodInvs = inventoryList.filter(inv => inv.producto?.id === prodId);

            prodInvs.forEach(inv => {
                const sucursalId = (inv.sucursal as any)?.id || (inv.sucursal as any)?.sucursalId;
                if (!sucursalId) return;

                let currentStock = Number(inv.stockActual || 0);

                if (movimientosList) {
                    const movsAfter = movimientosList.filter(m => 
                        m.inventario?.id === inv.id && 
                        m.creadoEn && 
                        new Date(m.creadoEn).toISOString() > cutOffDateStr
                    );

                    movsAfter.forEach(m => {
                        const cant = Number(m.cantidad || 0);
                        const tipo = (m.tipo || '').toUpperCase();
                        if (['ENTRADA', 'COMPRA', 'TRASPASO_ENTRADA', 'DEVOLUCION', 'INGRESO'].includes(tipo)) {
                            currentStock -= cant;
                        } else if (['SALIDA', 'VENTA', 'TRASPASO_SALIDA'].includes(tipo)) {
                            currentStock += cant;
                        }
                    });
                }

                const finalStock = Math.max(0, currentStock);
                stockMap[sucursalId] = (stockMap[sucursalId] || 0) + finalStock;
            });
        } else {
            inventoryList.forEach(inv => {
                if (inv.producto?.id === prodId) {
                    const sucursalId = (inv.sucursal as any)?.id || (inv.sucursal as any)?.sucursalId;
                    if (sucursalId) {
                        stockMap[sucursalId] = (stockMap[sucursalId] || 0) + Number(inv.stockActual || 0);
                    }
                }
            });
        }

        const total = Object.values(stockMap).reduce((acc, v) => acc + v, 0);

        return {
            stockPorSucursal: stockMap,
            totalExistencias: total
        };
    };

    const filteredProductos = useMemo(() => {
        if (!productsList) return [];
        let filtered = productsList;

        if (filtroProdLinea) filtered = filtered.filter(p => String(p.linea?.id || p.lineaId || p.categoria?.id || p.categoriaId) === filtroProdLinea);
        if (filtroProdMarca) filtered = filtered.filter(p => String(p.marca?.id || p.marcaId) === filtroProdMarca);
        if (filtroProdGrupo) filtered = filtered.filter(p => String(p.grupo?.id || p.grupoId) === filtroProdGrupo);
        if (filtroProdEstado === 'ACTIVO') filtered = filtered.filter(p => p.activo);
        else if (filtroProdEstado === 'INACTIVO') filtered = filtered.filter(p => !p.activo);

        // Opción B: Filtrar productos por rango de fecha si se especifica Fecha Desde o Hasta
        if (prodFechaDesde || prodFechaHasta) {
            const desdeStr = prodFechaDesde || null;
            const hastaStr = prodFechaHasta ? prodFechaHasta + 'T23:59:59.999Z' : null;

            filtered = filtered.filter(p => {
                if (movimientosList) {
                    const hasMovInRange = movimientosList.some(m => {
                        const isProd = m.inventario?.producto?.id === p.id || (m as any).productoId === p.id || (m.inventario as any)?.productoId === p.id;
                        if (!isProd || !m.creadoEn) return false;
                        const fStr = typeof m.creadoEn === 'string' ? m.creadoEn : new Date(m.creadoEn).toISOString();
                        if (desdeStr && fStr.substring(0, 10) < desdeStr) return false;
                        if (hastaStr && fStr > hastaStr) return false;
                        return true;
                    });
                    if (hasMovInRange) return true;
                }

                if (p.fechaUltimaCompra) {
                    const fc = String(p.fechaUltimaCompra).substring(0, 10);
                    if ((!prodFechaDesde || fc >= prodFechaDesde) && (!prodFechaHasta || fc <= prodFechaHasta)) {
                        return true;
                    }
                }

                const pCreadoEn = (p as any).creadoEn || (p as any).createdAt;
                if (pCreadoEn) {
                    const cr = String(pCreadoEn).substring(0, 10);
                    if ((!prodFechaDesde || cr >= prodFechaDesde) && (!prodFechaHasta || cr <= prodFechaHasta)) {
                        return true;
                    }
                }

                // Si se especificó Fecha Desde y no tuvo movimientos ni compras en ese rango, no incluir
                if (prodFechaDesde) {
                    return false;
                }

                return true;
            });
        }

        if (prodSearchTerm.trim()) {
            const s = prodSearchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.codigo.toLowerCase().includes(s) || 
                p.nombre.toLowerCase().includes(s) || 
                (p.descripcion && p.descripcion.toLowerCase().includes(s))
            );
        }

        return filtered;
    }, [productsList, filtroProdLinea, filtroProdMarca, filtroProdGrupo, filtroProdEstado, prodSearchTerm, prodFechaDesde, prodFechaHasta, movimientosList]);

    const metricsProductos = useMemo(() => {
        let totalExistencias = 0;
        let totalValorCosto = 0;
        let totalValorVenta = 0;
        const totalItems = filteredProductos.length;

        filteredProductos.forEach(p => {
            const { totalExistencias: ex } = getProductStockData(p.id);
            const pCompra = Number(p.precioCompra) || 0;
            const pVenta = Number(p.precioVenta) || 0;
            totalExistencias += ex;
            totalValorCosto += ex * pCompra;
            totalValorVenta += ex * pVenta;
        });

        const margenPotencial = totalValorVenta - totalValorCosto;
        const margenPct = totalValorVenta > 0 ? (margenPotencial / totalValorVenta) * 100 : 0;

        return {
            totalItems,
            totalExistencias,
            totalValorCosto,
            totalValorVenta,
            margenPotencial,
            margenPct
        };
    }, [filteredProductos, inventoryList, movimientosList, prodFechaHasta, selectedSucursal, selectedCiudad, activeSucursales]);

    const formatFechaCompra = (fecha?: string | Date) => {
        if (!fecha) return 'Sin compras';
        try {
            const str = typeof fecha === 'string' ? (fecha.includes('T') ? fecha : `${fecha}T00:00:00`) : fecha;
            return format(new Date(str), 'dd/MM/yyyy');
        } catch {
            return 'Sin compras';
        }
    };

    const exportColumnsProductos = useMemo(() => {
        const cols: { header: string; dataKey: string }[] = [
            { header: 'CÓDIGO DE PRODUCTO', dataKey: 'codigo' },
            { header: 'MARCA', dataKey: 'marcaNombre' },
            { header: 'LÍNEA', dataKey: 'lineaNombre' },
            { header: 'GRUPO', dataKey: 'grupoNombre' },
            { header: 'NOMBRE', dataKey: 'nombre' },
        ];

        activeSucursales.forEach(s => {
            const headerLabel = s.ciudadAbrev ? `${s.ciudadAbrev} (${s.nombre})` : s.nombre;
            cols.push({ header: headerLabel.toUpperCase(), dataKey: `stock_suc_${s.id}` });
        });

        cols.push(
            { header: 'TOTAL EXISTENCIAS', dataKey: 'totalExistencias' },
            { header: 'COSTO UNITARIO', dataKey: 'precioCompraFormatted' },
            { header: 'TOTAL BS', dataKey: 'totalBsFormatted' },
            { header: 'PRECIO VENTA', dataKey: 'precioVentaFormatted' },
            { header: 'ÚLTIMA COMPRA', dataKey: 'fechaUltimaCompraFormatted' },
            { header: 'ESTADO', dataKey: 'estado' }
        );

        return cols;
    }, [activeSucursales]);

    const getExportColumnsProductos = () => {
        let cols = [...exportColumnsProductos];
        if (filtroProdMarca) cols = cols.filter(c => c.dataKey !== 'marcaNombre');
        if (filtroProdLinea) cols = cols.filter(c => c.dataKey !== 'lineaNombre');
        if (filtroProdGrupo) cols = cols.filter(c => c.dataKey !== 'grupoNombre');
        if (filtroProdEstado !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const mappedExportDataProductos = useMemo(() => {
        return filteredProductos.map(p => {
            const pCompra = Number(p.precioCompra) || 0;
            const pVenta = Number(p.precioVenta) || 0;
            const { stockPorSucursal, totalExistencias } = getProductStockData(p.id);
            const totalBs = totalExistencias * pCompra;
            const margenBs = pVenta - pCompra;

            const row: any = {
                id: p.id,
                codigo: p.codigo,
                marcaNombre: p.marca?.nombre || '-',
                lineaNombre: p.linea?.nombre || p.categoria?.nombre || '-',
                categoriaNombre: p.linea?.nombre || p.categoria?.nombre || '-',
                grupoNombre: p.grupo?.nombre || '-',
                nombre: p.nombre,
                totalExistencias: totalExistencias > 0 ? totalExistencias.toLocaleString('es-BO') : '0',
                precioCompraFormatted: pCompra.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                totalBsFormatted: totalBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                precioVentaFormatted: pVenta.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                margenFormatted: margenBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                fechaUltimaCompraFormatted: formatFechaCompra(p.fechaUltimaCompra),
                estado: p.activo ? 'Activo' : 'Inactivo'
            };

            activeSucursales.forEach(s => {
                const qty = stockPorSucursal[s.id] || 0;
                row[`stock_suc_${s.id}`] = qty > 0 ? qty.toLocaleString('es-BO') : '0';
            });

            return row;
        });
    }, [filteredProductos, activeSucursales, inventoryList, movimientosList, prodFechaHasta]);

    const exportFooterProductos = useMemo(() => {
        const footer: Record<string, string> = {
            codigo: 'TOTAL GENERAL',
            totalExistencias: metricsProductos.totalExistencias.toLocaleString('es-BO'),
            totalBsFormatted: metricsProductos.totalValorCosto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        };

        activeSucursales.forEach(s => {
            const sucTotal = filteredProductos.reduce((acc, p) => {
                const { stockPorSucursal } = getProductStockData(p.id);
                return acc + (stockPorSucursal[s.id] || 0);
            }, 0);
            footer[`stock_suc_${s.id}`] = sucTotal.toLocaleString('es-BO');
        });

        return footer;
    }, [filteredProductos, activeSucursales, metricsProductos, inventoryList, movimientosList, prodFechaHasta]);

    const getFiltersTextProductos = () => {
        const texts: string[] = [];
        if (prodFechaHasta) {
            texts.push(`A la fecha: ${prodFechaHasta.split('-').reverse().join('/')}`);
        }
        if (prodFechaDesde && prodFechaHasta) {
            texts.push(`Período: ${prodFechaDesde.split('-').reverse().join('/')} al ${prodFechaHasta.split('-').reverse().join('/')}`);
        } else if (prodFechaDesde) {
            texts.push(`Desde: ${prodFechaDesde.split('-').reverse().join('/')}`);
        }
        if (filtroProdLinea) {
            const l = lineasList?.find(lin => String(lin.id) === filtroProdLinea);
            if (l) texts.push(`Línea: ${l.nombre}`);
        }
        if (filtroProdMarca) {
            const m = marcasList?.find(mar => String(mar.id) === filtroProdMarca);
            if (m) texts.push(`Marca: ${m.nombre}`);
        }
        if (filtroProdGrupo) {
            const g = gruposList?.find(gru => String(gru.id) === filtroProdGrupo);
            if (g) texts.push(`Grupo: ${g.nombre}`);
        }
        if (filtroProdEstado !== 'TODOS') {
            texts.push(`Estado: ${filtroProdEstado === 'ACTIVO' ? 'Activos' : 'Inactivos'}`);
        }
        if (prodSearchTerm) {
            texts.push(`Búsqueda: "${prodSearchTerm}"`);
        }
        return texts.join(' | ') || (prodFechaHasta ? `A la fecha: ${prodFechaHasta.split('-').reverse().join('/')}` : 'Todos los productos con existencias');
    };

    const totalPagesProductos = Math.ceil(filteredProductos.length / itemsPerPage) || 1;
    const paginatedProductos = useMemo(() => {
        const start = (prodCurrentPage - 1) * itemsPerPage;
        return filteredProductos.slice(start, start + itemsPerPage);
    }, [filteredProductos, prodCurrentPage]);

    React.useEffect(() => setProdCurrentPage(1), [
        filtroProdLinea, filtroProdMarca, filtroProdGrupo, filtroProdEstado, prodFechaDesde, prodFechaHasta, prodSearchTerm
    ]);

    // ==========================================
    // LÓGICA KARDEX INDIVIDUAL DE CLIENTE
    // ==========================================
    const selectedKardexCliente = useMemo(() => {
        if (!kardexClienteId || !clientesList) return null;
        return clientesList.find(c => String(c.id) === String(kardexClienteId)) || null;
    }, [kardexClienteId, clientesList]);

    const kardexTimeline = useMemo(() => {
        if (!selectedKardexCliente) {
            return {
                saldoInicial: 0,
                movimientos: [] as Array<{
                    id: string;
                    fecha: string;
                    fechaRaw: string;
                    nroNota: string;
                    observacion: string;
                    nroRecibo: string;
                    credito: number;
                    abono: number;
                    saldo: number;
                    tipo: 'VENTA' | 'PAGO' | 'DEVOLUCION' | 'MUESTRA';
                    badge?: string;
                }>,
                totalCredito: 0,
                totalAbono: 0,
                saldoFinal: 0,
                totalMuestras: 0,
                totalDevoluciones: 0,
            };
        }

        const cId = selectedKardexCliente.id;
        const desdeStr = kardexFechaDesde ? kardexFechaDesde.substring(0, 10) : '';
        const hastaStr = kardexFechaHasta ? kardexFechaHasta.substring(0, 10) : '';

        // 1. Ventas del cliente
        const clientVentas = (ventasList || []).filter(v => 
            (v.cliente?.id === cId || (v as any).clienteId === cId) && 
            v.estado !== 'ANULADA' &&
            (!selectedSucursal || v.sucursal?.id === Number(selectedSucursal) || (v as any).sucursalId === Number(selectedSucursal))
        );

        // 2. Pagos / Cobranzas del cliente
        const clientPagos = (pagosList || []).filter(p => 
            (p.cliente?.id === cId || (p as any).clienteId === cId || p.nota?.cliente?.id === cId || (p.nota as any)?.clienteId === cId) && 
            p.activo !== false &&
            (!selectedSucursal || p.nota?.sucursal?.id === Number(selectedSucursal) || (p.nota as any)?.sucursalId === Number(selectedSucursal))
        );

        // 3. Devoluciones del cliente (Cambios de producto a producto)
        const clientDevoluciones = (devolucionesList || []).filter(d => 
            (d.cliente?.id === cId || (d as any).clienteId === cId) && 
            d.estado !== 'ANULADA' &&
            (!selectedSucursal || d.sucursal?.id === Number(selectedSucursal) || (d as any).sucursalId === Number(selectedSucursal))
        );

        // 4. Muestras entregadas al cliente
        const clientMuestras = (muestrasList || []).filter(m => 
            (m.cliente?.id === cId || (m as any).clienteId === cId) && 
            m.estado !== 'ANULADO' &&
            (!selectedSucursal || m.sucursal?.id === Number(selectedSucursal) || (m as any).sucursalId === Number(selectedSucursal))
        );

        // 5. Saldo Inicial: Ventas - Pagos anteriores a kardexFechaDesde
        let saldoInicial = 0;
        if (desdeStr) {
            const priorVentas = clientVentas.filter(v => v.fecha && v.fecha.substring(0, 10) < desdeStr);
            const priorPagos = clientPagos.filter(p => p.fecha && p.fecha.substring(0, 10) < desdeStr);
            const totalPriorVentas = priorVentas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
            const totalPriorPagos = priorPagos.reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
            saldoInicial = totalPriorVentas - totalPriorPagos;
        }

        // 6. Movimientos en el período
        type KardexItemType = {
            id: string;
            fecha: string;
            fechaRaw: string;
            nroNota: string;
            observacion: string;
            nroRecibo: string;
            credito: number;
            abono: number;
            saldo: number;
            tipo: 'VENTA' | 'PAGO' | 'DEVOLUCION' | 'MUESTRA';
            badge?: string;
        };

        const items: KardexItemType[] = [];

        // Ventas en el período
        clientVentas.forEach(v => {
            const f = v.fecha ? v.fecha.substring(0, 10) : '';
            if (desdeStr && f < desdeStr) return;
            if (hastaStr && f > hastaStr) return;

            const nroNota = v.numero || String(v.id);
            const total = Number(v.total) || 0;
            const factStr = v.numeroFactura ? `FACT. ${v.numeroFactura}` : ((v as any).nroRecibo ? `REC. ${(v as any).nroRecibo}` : '');
            let obs = v.observaciones ? v.observaciones.trim() : `VENTA NOTA ${nroNota}`;
            if (factStr && !obs.toUpperCase().includes(factStr)) {
                obs += ` (${factStr})`;
            }

            items.push({
                id: `venta-${v.id}`,
                fecha: f ? f.split('-').reverse().join('/') : '-',
                fechaRaw: v.fecha || f,
                nroNota: nroNota,
                observacion: obs.toUpperCase(),
                nroRecibo: (v as any).nroRecibo || '',
                credito: total,
                abono: 0,
                saldo: 0,
                tipo: 'VENTA'
            });
        });

        // Pagos en el período
        clientPagos.forEach(p => {
            const f = p.fecha ? p.fecha.substring(0, 10) : '';
            if (desdeStr && f < desdeStr) return;
            if (hastaStr && f > hastaStr) return;

            const nroNota = p.nota?.numero || '0';
            const monto = Number(p.monto) || 0;
            const nroRecibo = p.referencia || p.comprobanteUrl || String(p.id);
            const metodo = p.metodoPago ? `(${p.metodoPago})` : '';
            let obs = p.observaciones ? p.observaciones.trim() : (nroNota !== '0' ? `PAGO NOTA ${nroNota} ${metodo}` : `PAGO A CUENTA ${metodo}`);

            items.push({
                id: `pago-${p.id}`,
                fecha: f ? f.split('-').reverse().join('/') : '-',
                fechaRaw: p.fecha || f,
                nroNota: nroNota,
                observacion: obs.toUpperCase(),
                nroRecibo: nroRecibo !== '0' ? nroRecibo : '',
                credito: 0,
                abono: monto,
                saldo: 0,
                tipo: 'PAGO'
            });
        });

        // Devoluciones (Cambio producto a producto - Sin movimiento de dinero)
        let totalDevs = 0;
        if (kardexIncluirDevoluciones) {
            clientDevoluciones.forEach(d => {
                const f = d.fecha ? d.fecha.substring(0, 10) : '';
                if (desdeStr && f < desdeStr) return;
                if (hastaStr && f > hastaStr) return;
                totalDevs++;

                const nroNota = d.numero || String(d.id);
                const itemsDev = d.detalles?.map((dt: any) => `${dt.cantidad}x ${dt.producto?.nombre || 'Prod'}`).join(', ') || '';
                const obs = d.observaciones 
                    ? `[CAMBIO DE PRODUCTO] ${d.observaciones.trim()} ${itemsDev ? `(${itemsDev})` : ''}`
                    : `[CAMBIO DE PRODUCTO] DEVOLUCIÓN NOTA ${nroNota} ${itemsDev ? `(${itemsDev})` : ''}`;

                items.push({
                    id: `dev-${d.id}`,
                    fecha: f ? f.split('-').reverse().join('/') : '-',
                    fechaRaw: d.fecha || f,
                    nroNota: nroNota,
                    observacion: obs.toUpperCase(),
                    nroRecibo: '',
                    credito: 0,
                    abono: 0,
                    saldo: 0,
                    tipo: 'DEVOLUCION',
                    badge: 'Cambio Físico'
                });
            });
        }

        // Muestras (Entregas físicas de muestras - Sin costo/deuda)
        let totalMuestrasCount = 0;
        if (kardexIncluirMuestras) {
            clientMuestras.forEach(m => {
                const f = m.fecha ? m.fecha.substring(0, 10) : '';
                if (desdeStr && f < desdeStr) return;
                if (hastaStr && f > hastaStr) return;
                totalMuestrasCount++;

                const nroNota = m.numero || String(m.id);
                const itemsMuestra = m.detalles?.map(dt => `${dt.cantidadEntregada}x ${dt.producto?.nombre || 'Prod'}`).join(', ') || '';
                const obs = m.observaciones 
                    ? `[ENTREGA MUESTRA] ${m.observaciones.trim()} ${itemsMuestra ? `(${itemsMuestra})` : ''}`
                    : `[ENTREGA MUESTRA] MUESTRA ${nroNota} ${itemsMuestra ? `(${itemsMuestra})` : ''}`;

                items.push({
                    id: `muestra-${m.id}`,
                    fecha: f ? f.split('-').reverse().join('/') : '-',
                    fechaRaw: m.fecha || f,
                    nroNota: nroNota,
                    observacion: obs.toUpperCase(),
                    nroRecibo: '',
                    credito: 0,
                    abono: 0,
                    saldo: 0,
                    tipo: 'MUESTRA',
                    badge: 'Muestra'
                });
            });
        }

        // Ordenar cronológicamente ascendente
        items.sort((a, b) => {
            const diff = new Date(a.fechaRaw).getTime() - new Date(b.fechaRaw).getTime();
            if (diff !== 0) return diff;
            const order: Record<string, number> = { VENTA: 1, DEVOLUCION: 2, MUESTRA: 3, PAGO: 4 };
            return (order[a.tipo] || 9) - (order[b.tipo] || 9);
        });

        // Calcular saldo acumulado
        let currentSaldo = saldoInicial;
        let totalCreditoPeriodo = 0;
        let totalAbonoPeriodo = 0;

        items.forEach(it => {
            totalCreditoPeriodo += it.credito;
            totalAbonoPeriodo += it.abono;
            currentSaldo = currentSaldo + it.credito - it.abono;
            it.saldo = currentSaldo;
        });

        return {
            saldoInicial,
            movimientos: items,
            totalCredito: totalCreditoPeriodo,
            totalAbono: totalAbonoPeriodo,
            saldoFinal: currentSaldo,
            totalMuestras: totalMuestrasCount,
            totalDevoluciones: totalDevs
        };
    }, [selectedKardexCliente, ventasList, pagosList, devolucionesList, muestrasList, kardexFechaDesde, kardexFechaHasta, kardexIncluirDevoluciones, kardexIncluirMuestras, selectedSucursal]);

    const exportColumnsKardex = useMemo(() => [
        { header: 'FECHA', dataKey: 'fecha' },
        { header: 'NRO DE NOTA', dataKey: 'nroNota' },
        { header: 'OBSERVACIÓN', dataKey: 'observacion' },
        { header: 'NRO DE RECIBO', dataKey: 'nroRecibo' },
        { header: 'CRÉDITO', dataKey: 'creditoFormatted' },
        { header: 'ABONO', dataKey: 'abonoFormatted' },
        { header: 'SALDO', dataKey: 'saldoFormatted' },
    ], []);

    const mappedExportDataKardex = useMemo(() => {
        if (!selectedKardexCliente) return [];
        const rows: any[] = [];

        // Fila 1: Saldo Inicial si existe fecha desde
        if (kardexFechaDesde) {
            rows.push({
                fecha: kardexFechaDesde.split('-').reverse().join('/'),
                nroNota: '0',
                observacion: 'SALDO INICIAL',
                nroRecibo: '0',
                creditoFormatted: kardexTimeline.saldoInicial >= 0 ? kardexTimeline.saldoInicial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00',
                abonoFormatted: kardexTimeline.saldoInicial < 0 ? Math.abs(kardexTimeline.saldoInicial).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00',
                saldoFormatted: kardexTimeline.saldoInicial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            });
        }

        kardexTimeline.movimientos.forEach(m => {
            rows.push({
                fecha: m.fecha,
                nroNota: m.nroNota,
                observacion: m.observacion,
                nroRecibo: m.nroRecibo || '',
                creditoFormatted: m.credito > 0 ? m.credito.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00',
                abonoFormatted: m.abono > 0 ? m.abono.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00',
                saldoFormatted: m.saldo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            });
        });

        return rows;
    }, [selectedKardexCliente, kardexTimeline, kardexFechaDesde]);

    const exportFooterKardex = useMemo(() => {
        if (!selectedKardexCliente) return undefined;
        return {
            fecha: 'TOTALES',
            nroNota: '',
            observacion: '',
            nroRecibo: '',
            creditoFormatted: kardexTimeline.totalCredito.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            abonoFormatted: kardexTimeline.totalAbono.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            saldoFormatted: kardexTimeline.saldoFinal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
        };
    }, [selectedKardexCliente, kardexTimeline]);

    const getKardexSubtitle = () => {
        const c = selectedKardexCliente;
        const clientLabel = c ? `${c.codigo || ''} - ${getClientDisplayName(c)}` : 'Sin cliente seleccionado';
        const fechaCorte = kardexFechaHasta ? kardexFechaHasta.split('-').reverse().join('/') : format(new Date(), 'dd/MM/yyyy');
        return `Cliente: ${clientLabel} | Corte al ${fechaCorte} | Desde: ${kardexFechaDesde ? kardexFechaDesde.split('-').reverse().join('/') : 'Inicio'}`;
    };

    // ==========================================
    // LÓGICA VENTAS
    // ==========================================
    const hasVentaActiveFilters = Boolean(
        filtroVentaCliente || filtroVentaVendedores.length > 0 || 
        filtroVentaTipoDoc !== 'TODOS' || filtroVentaEstado !== 'TODOS' || 
        ventaFechaDesde || ventaFechaHasta || ventaSearchTerm
    );

    const handleClearVentaFilters = () => {
        setFiltroVentaCliente('');
        setFiltroVentaVendedores([]);
        setFiltroVentaTipoDoc('TODOS');
        setFiltroVentaEstado('TODOS');
        setVentaFechaDesde('');
        setVentaFechaHasta('');
        setVentaSearchTerm('');
    };

    const filteredVentas = useMemo(() => {
        if (!ventasList) return [];
        let filtered = ventasList;

        if (selectedSucursal) {
            filtered = filtered.filter(p => p.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (filtroVentaCliente) filtered = filtered.filter(p => String(p.cliente?.id) === filtroVentaCliente);
        
        if (isRestrictedVendor) {
            filtered = filtered.filter(p => p.vendedor?.id === userPersonal.id);
        } else if (filtroVentaVendedores.length > 0) {
            const setIds = new Set(filtroVentaVendedores.map(id => Number(id)));
            filtered = filtered.filter(p => p.vendedor?.id && setIds.has(p.vendedor.id));
        }

        if (filtroVentaTipoDoc === 'CON_FACTURA') filtered = filtered.filter(p => p.conFactura);
        else if (filtroVentaTipoDoc === 'SIN_FACTURA') filtered = filtered.filter(p => !p.conFactura);
        if (filtroVentaEstado !== 'TODOS') filtered = filtered.filter(p => p.estado === filtroVentaEstado);
        if (ventaFechaDesde) filtered = filtered.filter(p => p.fecha && p.fecha.split('T')[0] >= ventaFechaDesde);
        if (ventaFechaHasta) filtered = filtered.filter(p => p.fecha && p.fecha.split('T')[0] <= ventaFechaHasta);

        if (ventaSearchTerm.trim()) {
            const term = ventaSearchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.numero?.toLowerCase().includes(term) ||
                (p.numeroFactura && p.numeroFactura.toLowerCase().includes(term)) ||
                p.cliente?.nombreTienda?.toLowerCase().includes(term) ||
                p.cliente?.persona?.nombres?.toLowerCase().includes(term) ||
                p.cliente?.persona?.apellidos?.toLowerCase().includes(term) ||
                p.vendedor?.nombres?.toLowerCase().includes(term) ||
                p.vendedor?.apellidos?.toLowerCase().includes(term)
            );
        }

        return filtered;
    }, [ventasList, selectedSucursal, selectedCiudad, filtroVentaCliente, filtroVentaVendedores, isRestrictedVendor, userPersonal, filtroVentaTipoDoc, filtroVentaEstado, ventaFechaDesde, ventaFechaHasta, ventaSearchTerm]);

    const exportColumnsVentas = [
        { header: 'Fecha', dataKey: 'fechaFormatted' },
        { header: 'N° Venta', dataKey: 'numero' },
        { header: 'Documento', dataKey: 'documentoTipo' },
        { header: 'Cliente', dataKey: 'clienteNombre' },
        { header: 'Vendedor', dataKey: 'vendedorNombre' },
        { header: 'Nota de Venta', dataKey: 'observaciones' },
        { header: 'Sucursal', dataKey: 'sucursalNombre' },
        { header: 'SubTotal', dataKey: 'subtotalFormatted' },
        { header: 'Descuento', dataKey: 'descuentoFormatted' },
        { header: 'Total', dataKey: 'totalFormatted' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const mappedExportDataVentas = useMemo(() => {
        return filteredVentas.map(s => {
            const subTotalCalc = (Number(s.total) || 0) + (Number(s.descuento) || 0) + (Number(s.descuentoPromocion) || 0);
            const descCalc = (Number(s.descuento) || 0) + (Number(s.descuentoPromocion) || 0);
            const docInfo = s.conFactura ? `FAC: ${s.numeroFactura || 'S/N'}` : 'Nota de Entrega';
            const ciudadNombre = (s.sucursal?.ciudad as any)?.nombre;
            const sucursalTexto = s.sucursal ? `${s.sucursal.nombre}${ciudadNombre ? ` (${ciudadNombre})` : ''}`.trim() : '-';
            return {
                id: s.id,
                numero: s.numero || '-',
                documentoTipo: docInfo,
                fechaFormatted: s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '-',
                clienteNombre: getClientDisplayName(s.cliente),
                vendedorNombre: s.vendedor ? `${s.vendedor.nombres || ''} ${s.vendedor.apellidos || ''}`.trim() : '---',
                observaciones: s.observaciones || '-',
                sucursalNombre: sucursalTexto,
                subtotalFormatted: formatCurrency(subTotalCalc),
                descuentoFormatted: formatCurrency(descCalc),
                totalFormatted: formatCurrency(s.total || 0),
                estado: s.estado || 'CONFIRMADA'
            };
        });
    }, [filteredVentas]);

    const getFiltersTextVentas = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            texts.push(`Ciudad: ${c?.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            texts.push(`Sucursal: ${s?.nombre || selectedSucursal}`);
        }
        if (filtroVentaCliente) {
            const cli = clientesUnicos.find(c => String(c.id) === filtroVentaCliente);
            if (cli) {
                const nombre = getClientDisplayName(cli);
                texts.push(`Cliente: ${nombre}`);
            }
        }
        if (filtroVentaVendedores.length > 0) {
            if (filtroVentaVendedores.length === 1) {
                const v = vendedoresList.find(ve => String(ve.id) === filtroVentaVendedores[0]);
                if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
            } else {
                texts.push(`Vendedores: ${filtroVentaVendedores.length} seleccionados`);
            }
        }
        if (filtroVentaTipoDoc === 'CON_FACTURA') texts.push('Tipo: Con Factura');
        else if (filtroVentaTipoDoc === 'SIN_FACTURA') texts.push('Tipo: Sin Factura');
        if (filtroVentaEstado !== 'TODOS') texts.push(`Estado: ${filtroVentaEstado}`);
        if (ventaFechaDesde && ventaFechaHasta) texts.push(`Rango: ${ventaFechaDesde.split('-').reverse().join('/')} al ${ventaFechaHasta.split('-').reverse().join('/')}`);
        else if (ventaFechaDesde) texts.push(`Desde: ${ventaFechaDesde.split('-').reverse().join('/')}`);
        else if (ventaFechaHasta) texts.push(`Hasta: ${ventaFechaHasta.split('-').reverse().join('/')}`);
        if (ventaSearchTerm) texts.push(`Búsqueda: "${ventaSearchTerm}"`);
        return texts.join(' | ') || 'Todos los registros';
    };

    const getExportColumnsVentas = () => {
        let cols = [...exportColumnsVentas];
        if (filtroVentaCliente) cols = cols.filter(c => c.dataKey !== 'clienteNombre');
        if (filtroVentaVendedores.length === 1) cols = cols.filter(c => c.dataKey !== 'vendedorNombre');
        if (selectedSucursal) cols = cols.filter(c => c.dataKey !== 'sucursalNombre');
        if (filtroVentaEstado !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const totalPagesVentas = Math.ceil(filteredVentas.length / itemsPerPage) || 1;
    const paginatedVentas = useMemo(() => {
        const start = (ventaCurrentPage - 1) * itemsPerPage;
        return filteredVentas.slice(start, start + itemsPerPage);
    }, [filteredVentas, ventaCurrentPage]);

    React.useEffect(() => setVentaCurrentPage(1), [
        ventaSearchTerm, filtroVentaCliente, filtroVentaVendedores, 
        filtroVentaTipoDoc, filtroVentaEstado, ventaFechaDesde, ventaFechaHasta
    ]);

    // ==========================================
    // LÓGICA REPORTE DE VENTAS X PRODUCTO
    // ==========================================
    const hasVentaProdActiveFilters = Boolean(
        filtroVentaProdProducto || filtroVentaProdMarca !== 'TODOS' || 
        filtroVentaProdVendedores.length > 0 || filtroVentaProdTipoPago !== 'TODOS' || 
        ventaProdFechaDesde || ventaProdFechaHasta || ventaProdSearchTerm
    );

    const handleClearVentaProdFilters = () => {
        setFiltroVentaProdProducto('');
        setFiltroVentaProdMarca('TODOS');
        setFiltroVentaProdVendedores([]);
        setFiltroVentaProdTipoPago('TODOS');
        setVentaProdFechaDesde('');
        setVentaProdFechaHasta('');
        setVentaProdSearchTerm('');
    };

    const productOptionsVentaProd: SearchableOption[] = useMemo(() => {
        if (!productsList) return [{ value: '', label: 'Todos los Productos' }];
        return [
            { value: '', label: 'Todos los Productos' },
            ...productsList.map(p => ({
                value: String(p.id),
                label: `${p.codigo ? `[${p.codigo}] ` : ''}${p.nombre}`,
                code: p.codigo || undefined,
                sublabel: `Marca: ${p.marca?.nombre || 'S/M'} | P.Venta: Bs. ${Number(p.precioVenta || 0).toFixed(2)} | P.Compra: Bs. ${Number(p.precioCompra || 0).toFixed(2)}`
            }))
        ];
    }, [productsList]);

    const productsMap = useMemo(() => {
        const map = new Map<number, Producto>();
        if (productsList) {
            productsList.forEach(p => map.set(p.id, p));
        }
        return map;
    }, [productsList]);

    const ventasPorProductoItems = useMemo(() => {
        if (!ventasList) return [];
        let sales = ventasList;

        if (selectedSucursal) {
            sales = sales.filter(p => p.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            sales = sales.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (ventaProdFechaDesde) {
            sales = sales.filter(p => p.fecha && p.fecha.split('T')[0] >= ventaProdFechaDesde);
        }
        if (ventaProdFechaHasta) {
            sales = sales.filter(p => p.fecha && p.fecha.split('T')[0] <= ventaProdFechaHasta);
        }

        if (isRestrictedVendor) {
            sales = sales.filter(p => p.vendedor?.id === userPersonal.id);
        } else if (filtroVentaProdVendedores.length > 0) {
            const setIds = new Set(filtroVentaProdVendedores.map(id => Number(id)));
            sales = sales.filter(p => p.vendedor?.id && setIds.has(p.vendedor.id));
        }

        if (filtroVentaProdTipoPago !== 'TODOS') {
            sales = sales.filter(p => {
                const forma = p.tipoPago || ((Number(p.diasCredito) || 0) > 0 ? 'CREDITO' : 'CONTADO');
                return forma === filtroVentaProdTipoPago;
            });
        }

        const items: Array<{
            id: string;
            ventaId: number;
            nroVenta: string;
            fecha: string;
            fechaFormatted: string;
            ciudadSucursal: string;
            clienteTienda: string;
            clienteNombre: string;
            vendedorNombre: string;
            marcaNombre: string;
            productoCodigo: string;
            productoNombre: string;
            formaPago: string;
            cantidad: number;
            precioVenta: number;
            precioCompra: number;
            gananciaUnitaria: number;
            gananciaTotal: number;
            subtotalVenta: number;
            subtotalCosto: number;
            estado: string;
            rawVenta: any;
        }> = [];

        sales.forEach(v => {
            if (v.estado === 'ANULADA') return;

            const ciudadNombre = (v.sucursal?.ciudad as any)?.nombre || (v.sucursal as any)?.ciudadNombre || '';
            const sucursalNombre = v.sucursal?.nombre || '';
            const ciudadSucursal = ciudadNombre 
                ? `${ciudadNombre} (${sucursalNombre})` 
                : sucursalNombre || '-';

            const clienteTienda = v.cliente?.nombreTienda?.trim() || getClientDisplayName(v.cliente) || 'Cliente Final';
            const clienteNombre = getClientDisplayName(v.cliente);

            const vendedorNombre = v.vendedor 
                ? `${v.vendedor.nombres || ''} ${v.vendedor.apellidos || ''}`.trim() 
                : (v.usuario?.nombres ? `${v.usuario.nombres} ${v.usuario.apellidos || ''}`.trim() : '---');

            const formaPago = v.tipoPago || ((Number(v.diasCredito) || 0) > 0 ? 'CREDITO' : 'CONTADO');
            const fecha = v.fecha ? v.fecha.split('T')[0] : '';
            const fechaFormatted = fecha ? fecha.split('-').reverse().join('/') : '-';

            (v.detalles || []).forEach((det: any, idx: number) => {
                const prodId = det.producto?.id || det.productoId;
                const fullProd = productsMap.get(prodId) || det.producto;

                if (filtroVentaProdProducto && String(prodId) !== filtroVentaProdProducto) {
                    return;
                }

                const marcaNombre = fullProd?.marca?.nombre || det.producto?.marca?.nombre || '-';
                if (filtroVentaProdMarca !== 'TODOS' && String(fullProd?.marcaId || fullProd?.marca?.id) !== filtroVentaProdMarca) {
                    return;
                }

                const productoNombre = fullProd?.nombre || det.producto?.nombre || 'Producto no especificado';
                const productoCodigo = fullProd?.codigo || det.producto?.codigo || '-';
                const cantidad = Number(det.cantidad || 0);
                const precioVenta = Number(det.precioUnitario || 0);

                // Costeo PEPS (FIFO) vinculado al costo de compra específico de cada lote ingresado
                let precioCompra = 0;
                let subtotalCosto = 0;

                if (det.movimientosLote && Array.isArray(det.movimientosLote) && det.movimientosLote.length > 0) {
                    let cantTotalLotes = 0;
                    let costoAcumulado = 0;
                    for (const mov of det.movimientosLote) {
                        const cantMov = Number(mov.cantidad || 0);
                        const costoLote = Number(mov.lote?.costoUnitario || 0);
                        if (costoLote > 0) {
                            costoAcumulado += cantMov * costoLote;
                            cantTotalLotes += cantMov;
                        } else {
                            const costoFallback = Number(fullProd?.precioCompra ?? det.producto?.precioCompra ?? 0);
                            costoAcumulado += cantMov * costoFallback;
                            cantTotalLotes += cantMov;
                        }
                    }
                    if (cantTotalLotes > 0) {
                        subtotalCosto = costoAcumulado;
                        precioCompra = costoAcumulado / cantTotalLotes;
                    }
                }

                if (precioCompra <= 0) {
                    precioCompra = Number(fullProd?.precioCompra ?? det.producto?.precioCompra ?? 0);
                    subtotalCosto = precioCompra * cantidad;
                }

                const gananciaUnitaria = precioVenta - precioCompra;
                const gananciaTotal = (precioVenta * cantidad) - subtotalCosto;
                const subtotalVenta = Number(det.subtotal) || (precioVenta * cantidad);

                if (ventaProdSearchTerm.trim()) {
                    const term = ventaProdSearchTerm.toLowerCase();
                    const matches = 
                        productoNombre.toLowerCase().includes(term) ||
                        productoCodigo.toLowerCase().includes(term) ||
                        marcaNombre.toLowerCase().includes(term) ||
                        clienteTienda.toLowerCase().includes(term) ||
                        clienteNombre.toLowerCase().includes(term) ||
                        (v.numero || '').toLowerCase().includes(term) ||
                        vendedorNombre.toLowerCase().includes(term) ||
                        ciudadSucursal.toLowerCase().includes(term);
                    if (!matches) return;
                }

                items.push({
                    id: `${v.id}-${idx}`,
                    ventaId: v.id,
                    nroVenta: v.numero || 'S/N',
                    fecha,
                    fechaFormatted,
                    ciudadSucursal,
                    clienteTienda,
                    clienteNombre,
                    vendedorNombre,
                    marcaNombre,
                    productoCodigo,
                    productoNombre,
                    formaPago,
                    cantidad,
                    precioVenta,
                    precioCompra,
                    gananciaUnitaria,
                    gananciaTotal,
                    subtotalVenta,
                    subtotalCosto,
                    estado: v.estado || 'CONFIRMADA',
                    rawVenta: v
                });
            });
        });

        return items;
    }, [
        ventasList, productsMap, selectedSucursal, selectedCiudad,
        ventaProdFechaDesde, ventaProdFechaHasta, filtroVentaProdProducto,
        filtroVentaProdMarca, filtroVentaProdVendedores, isRestrictedVendor, userPersonal, filtroVentaProdTipoPago,
        ventaProdSearchTerm
    ]);

    const totalesVentasPorProducto = useMemo(() => {
        const totalCantidad = ventasPorProductoItems.reduce((sum, item) => sum + item.cantidad, 0);
        const totalPrecioVentaUnitario = ventasPorProductoItems.reduce((sum, item) => sum + item.precioVenta, 0);
        const totalPrecioCompraUnitario = ventasPorProductoItems.reduce((sum, item) => sum + item.precioCompra, 0);
        const totalGananciaUnitaria = ventasPorProductoItems.reduce((sum, item) => sum + item.gananciaUnitaria, 0);
        const totalVenta = ventasPorProductoItems.reduce((sum, item) => sum + item.subtotalVenta, 0);
        const totalCosto = ventasPorProductoItems.reduce((sum, item) => sum + item.subtotalCosto, 0);
        const totalGanancia = ventasPorProductoItems.reduce((sum, item) => sum + item.gananciaTotal, 0);
        const margenPromedio = totalVenta > 0 ? (totalGanancia / totalVenta) * 100 : 0;

        return {
            totalRegistros: ventasPorProductoItems.length,
            totalCantidad,
            totalPrecioVentaUnitario,
            totalPrecioCompraUnitario,
            totalGananciaUnitaria,
            totalVenta,
            totalCosto,
            totalGanancia,
            margenPromedio
        };
    }, [ventasPorProductoItems]);

    const totalPagesVentasProducto = Math.ceil(ventasPorProductoItems.length / itemsPerPage) || 1;
    const paginatedVentasPorProducto = useMemo(() => {
        const start = (ventaProdCurrentPage - 1) * itemsPerPage;
        return ventasPorProductoItems.slice(start, start + itemsPerPage);
    }, [ventasPorProductoItems, ventaProdCurrentPage, itemsPerPage]);

    React.useEffect(() => setVentaProdCurrentPage(1), [
        ventaProdSearchTerm, filtroVentaProdProducto, filtroVentaProdMarca,
        filtroVentaProdVendedores, filtroVentaProdTipoPago, ventaProdFechaDesde, ventaProdFechaHasta
    ]);

    const exportColumnsVentasProducto = [
        { header: 'Fecha', dataKey: 'fechaFormatted' },
        { header: 'Ciudad (Sucursal)', dataKey: 'ciudadSucursal' },
        { header: 'Nro Venta', dataKey: 'nroVenta' },
        { header: 'Cliente', dataKey: 'clienteTienda' },
        { header: 'Vendedor', dataKey: 'vendedorNombre' },
        { header: 'Marca', dataKey: 'marcaNombre' },
        { header: 'Producto', dataKey: 'productoDisplay' },
        { header: 'Forma', dataKey: 'formaPago' },
        { header: 'Cant.', dataKey: 'cantidad' },
        { header: 'Precio Venta', dataKey: 'precioVentaFormatted' },
        { header: 'Precio Compra', dataKey: 'precioCompraFormatted' },
        { header: 'Ganancia Unit.', dataKey: 'gananciaFormatted' },
        { header: 'Ganancia Total', dataKey: 'gananciaTotalFormatted' }
    ];

    const mappedExportDataVentasProducto = useMemo(() => {
        return ventasPorProductoItems.map(item => ({
            fechaFormatted: item.fechaFormatted,
            ciudadSucursal: item.ciudadSucursal,
            nroVenta: item.nroVenta,
            clienteTienda: item.clienteTienda,
            vendedorNombre: item.vendedorNombre,
            marcaNombre: item.marcaNombre,
            productoDisplay: item.productoNombre,
            formaPago: item.formaPago,
            cantidad: item.cantidad,
            precioVentaFormatted: formatCurrencyAmount(item.precioVenta),
            precioCompraFormatted: formatCurrencyAmount(item.precioCompra),
            gananciaFormatted: formatCurrencyAmount(item.gananciaUnitaria),
            gananciaTotalFormatted: formatCurrencyAmount(item.gananciaTotal)
        }));
    }, [ventasPorProductoItems]);

    const exportFooterVentasProducto = useMemo(() => {
        return {
            fechaFormatted: 'TOTALES',
            ciudadSucursal: '',
            nroVenta: '',
            clienteTienda: '',
            vendedorNombre: '',
            marcaNombre: '',
            productoDisplay: `${totalesVentasPorProducto.totalRegistros} ítems`,
            formaPago: '',
            cantidad: String(totalesVentasPorProducto.totalCantidad),
            precioVentaFormatted: formatCurrencyAmount(totalesVentasPorProducto.totalPrecioVentaUnitario),
            precioCompraFormatted: formatCurrencyAmount(totalesVentasPorProducto.totalPrecioCompraUnitario),
            gananciaFormatted: formatCurrencyAmount(totalesVentasPorProducto.totalGananciaUnitaria),
            gananciaTotalFormatted: formatCurrencyAmount(totalesVentasPorProducto.totalGanancia)
        };
    }, [totalesVentasPorProducto]);

    const getFiltersTextVentasProducto = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            texts.push(`Ciudad: ${c?.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            texts.push(`Sucursal: ${s?.nombre || selectedSucursal}`);
        }
        if (filtroVentaProdProducto) {
            const p = productsMap.get(Number(filtroVentaProdProducto));
            if (p) texts.push(`Producto: [${p.codigo || ''}] ${p.nombre}`);
        }
        if (filtroVentaProdMarca !== 'TODOS') {
            const m = marcasList?.find(m => String(m.id) === filtroVentaProdMarca);
            if (m) texts.push(`Marca: ${m.nombre}`);
        }
        if (filtroVentaProdVendedores.length > 0) {
            if (filtroVentaProdVendedores.length === 1) {
                const v = vendedoresList.find(ve => String(ve.id) === filtroVentaProdVendedores[0]);
                if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
            } else {
                texts.push(`Vendedores: ${filtroVentaProdVendedores.length} seleccionados`);
            }
        }
        if (filtroVentaProdTipoPago !== 'TODOS') texts.push(`Forma Pago: ${filtroVentaProdTipoPago}`);
        if (ventaProdFechaDesde && ventaProdFechaHasta) texts.push(`Rango: ${ventaProdFechaDesde.split('-').reverse().join('/')} al ${ventaProdFechaHasta.split('-').reverse().join('/')}`);
        else if (ventaProdFechaDesde) texts.push(`Desde: ${ventaProdFechaDesde.split('-').reverse().join('/')}`);
        else if (ventaProdFechaHasta) texts.push(`Hasta: ${ventaProdFechaHasta.split('-').reverse().join('/')}`);
        if (ventaProdSearchTerm) texts.push(`Búsqueda: "${ventaProdSearchTerm}"`);
        return texts.join(' | ') || 'Todos los registros';
    };

    // ==========================================
    // LÓGICA COBRANZAS
    // ==========================================
    const metodosPagoUnicos = useMemo(() => {
        if (!pagosList) return [];
        const set = new Set<string>();
        pagosList.forEach(p => {
            if (p.metodoPago && p.metodoPago.trim()) set.add(p.metodoPago.trim());
        });
        return Array.from(set).sort();
    }, [pagosList]);

    const hasCobranzaActiveFilters = Boolean(
        filtroCobranzaCliente || filtroCobranzaVendedores.length > 0 || 
        filtroCobranzaEstado !== 'TODOS' || filtroCobranzaMetodo !== 'TODOS' || 
        cobranzaFechaDesde || cobranzaFechaHasta || cobranzaSearchTerm
    );

    const handleClearCobranzaFilters = () => {
        setFiltroCobranzaCliente('');
        setFiltroCobranzaVendedores([]);
        setFiltroCobranzaEstado('TODOS');
        setFiltroCobranzaMetodo('TODOS');
        setCobranzaFechaDesde('');
        setCobranzaFechaHasta('');
        setCobranzaSearchTerm('');
    };

    const filteredCobranzas = useMemo(() => {
        if (!pagosList) return [];
        let filtered = pagosList;

        if (selectedSucursal) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.id === Number(selectedSucursal) || (p.cliente?.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.cliente?.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (filtroCobranzaCliente) filtered = filtered.filter(p => String(p.cliente?.id) === filtroCobranzaCliente);
        
        if (isRestrictedVendor) {
            filtered = filtered.filter(p => p.nota?.vendedor?.id === userPersonal.id);
        } else if (filtroCobranzaVendedores.length > 0) {
            const setIds = new Set(filtroCobranzaVendedores.map(id => Number(id)));
            filtered = filtered.filter(p => {
                const vendedorId = p.nota?.vendedor?.id || p.nota?.usuario?.personal?.id || p.nota?.usuario?.id;
                return (p.nota?.vendedor?.id && setIds.has(p.nota.vendedor.id)) || (vendedorId && setIds.has(Number(vendedorId)));
            });
        }

        if (filtroCobranzaEstado === 'ACTIVO') filtered = filtered.filter(p => p.activo);
        else if (filtroCobranzaEstado === 'ANULADO') filtered = filtered.filter(p => !p.activo);
        if (filtroCobranzaMetodo !== 'TODOS') filtered = filtered.filter(p => (p.metodoPago || 'Efectivo') === filtroCobranzaMetodo);
        if (cobranzaFechaDesde) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) >= cobranzaFechaDesde);
        if (cobranzaFechaHasta) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) <= cobranzaFechaHasta);

        if (cobranzaSearchTerm) {
            const s = cobranzaSearchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const clienteNombre = (p.cliente?.nombreTienda ? `${p.cliente.nombreTienda} ` : '') + (p.cliente?.persona 
                    ? `${p.cliente.persona.nombres} ${p.cliente.persona.apellidos}` 
                    : ((p.cliente as any)?.razonSocial || ''));
                const vendedorNombre = (p.nota?.vendedor
                    ? `${p.nota.vendedor.nombres || ''} ${p.nota.vendedor.apellidos || ''}`
                    : (p.nota?.usuario?.persona 
                        ? `${p.nota.usuario.persona.nombres || ''} ${p.nota.usuario.persona.apellidos || ''}`
                        : (p.nota?.usuario?.username || ''))).toLowerCase();
                const ventaNum = (p.nota?.numero || '').toLowerCase();
                const ref = (p.referencia || '').toLowerCase();
                const metodo = (p.metodoPago || '').toLowerCase();

                return clienteNombre.toLowerCase().includes(s) || vendedorNombre.includes(s) || ventaNum.includes(s) || ref.includes(s) || metodo.includes(s);
            });
        }

        return filtered;
    }, [pagosList, selectedSucursal, selectedCiudad, cobranzaSearchTerm, filtroCobranzaCliente, filtroCobranzaVendedores, isRestrictedVendor, userPersonal, filtroCobranzaEstado, filtroCobranzaMetodo, cobranzaFechaDesde, cobranzaFechaHasta]);

    const exportColumnsCobranzas = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Nro Venta', dataKey: 'notaNumero' },
        { header: 'Cliente', dataKey: 'clienteNombre' },
        { header: 'Vendedor', dataKey: 'vendedorNombre' },
        { header: 'Nota de Venta', dataKey: 'notaVenta' },
        { header: 'Método de Pago', dataKey: 'metodoPago' },
        { header: 'Referencia', dataKey: 'referencia' },
        { header: 'Total Venta', dataKey: 'totalVentaFormateado' },
        { header: 'Monto Pagado', dataKey: 'montoFormateado' },
        { header: 'Saldo Pendiente', dataKey: 'saldoFormateado' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const mappedExportDataCobranzas = useMemo(() => {
        return filteredCobranzas.map(p => {
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
            return {
                ...p,
                clienteNombre: getClientDisplayName(p.cliente),
                vendedorNombre,
                notaVenta,
                notaNumero: p.nota?.numero || '-',
                totalVentaFormateado,
                montoFormateado,
                saldoFormateado,
                estado: p.activo ? 'Activo' : 'Anulado'
            };
        });
    }, [filteredCobranzas]);

    const getFiltersTextCobranzas = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            texts.push(`Ciudad: ${c?.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            texts.push(`Sucursal: ${s?.nombre || selectedSucursal}`);
        }
        if (filtroCobranzaCliente) {
            const cli = clientesUnicos.find(c => String(c.id) === filtroCobranzaCliente);
            if (cli) {
                const nombre = getClientDisplayName(cli);
                texts.push(`Cliente: ${nombre}`);
            }
        }
        if (filtroCobranzaVendedores.length > 0) {
            if (filtroCobranzaVendedores.length === 1) {
                const v = vendedoresList.find(ve => String(ve.id) === filtroCobranzaVendedores[0]);
                if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
            } else {
                texts.push(`Vendedores: ${filtroCobranzaVendedores.length} seleccionados`);
            }
        }
        if (filtroCobranzaEstado === 'ACTIVO') texts.push('Estado: Activos');
        else if (filtroCobranzaEstado === 'ANULADO') texts.push('Estado: Anulados');
        if (filtroCobranzaMetodo && filtroCobranzaMetodo !== 'TODOS') texts.push(`Método: ${filtroCobranzaMetodo}`);
        if (cobranzaFechaDesde && cobranzaFechaHasta) texts.push(`Rango: ${cobranzaFechaDesde.split('-').reverse().join('/')} al ${cobranzaFechaHasta.split('-').reverse().join('/')}`);
        else if (cobranzaFechaDesde) texts.push(`Desde: ${cobranzaFechaDesde.split('-').reverse().join('/')}`);
        else if (cobranzaFechaHasta) texts.push(`Hasta: ${cobranzaFechaHasta.split('-').reverse().join('/')}`);
        if (cobranzaSearchTerm) texts.push(`Búsqueda: "${cobranzaSearchTerm}"`);
        return texts.join(' | ') || 'Todos los registros';
    };

    const getExportColumnsCobranzas = () => {
        let cols = [...exportColumnsCobranzas];
        if (filtroCobranzaCliente) cols = cols.filter(c => c.dataKey !== 'clienteNombre');
        if (filtroCobranzaVendedores.length === 1) cols = cols.filter(c => c.dataKey !== 'vendedorNombre');
        if (filtroCobranzaMetodo && filtroCobranzaMetodo !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'metodoPago');
        if (filtroCobranzaEstado !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const totalPagesCobranzas = Math.ceil(filteredCobranzas.length / itemsPerPage) || 1;
    const paginatedCobranzas = useMemo(() => {
        const start = (cobranzaCurrentPage - 1) * itemsPerPage;
        return filteredCobranzas.slice(start, start + itemsPerPage);
    }, [filteredCobranzas, cobranzaCurrentPage]);

    React.useEffect(() => setCobranzaCurrentPage(1), [
        cobranzaSearchTerm, filtroCobranzaCliente, filtroCobranzaVendedores, filtroCobranzaEstado, 
        filtroCobranzaMetodo, cobranzaFechaDesde, cobranzaFechaHasta
    ]);

    // ==========================================
    // LÓGICA COMPRAS
    // ==========================================
    const hasCompraActiveFilters = Boolean(
        filtroCompraProveedor || filtroCompraMoneda !== 'TODOS' || 
        filtroCompraEstado !== 'TODOS' || compraFechaDesde || 
        compraFechaHasta || compraSearchTerm
    );

    const handleClearCompraFilters = () => {
        setFiltroCompraProveedor('');
        setFiltroCompraMoneda('TODOS');
        setFiltroCompraEstado('TODOS');
        setCompraFechaDesde('');
        setCompraFechaHasta('');
        setCompraSearchTerm('');
    };

    const filteredCompras = useMemo(() => {
        if (!comprasList) return [];
        let filtered = comprasList;

        if (selectedSucursal) {
            filtered = filtered.filter(p => p.sucursal?.id === Number(selectedSucursal) || (p.almacen as any)?.sucursal?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.almacen as any)?.sucursal?.ciudad?.id === Number(selectedCiudad));
        }

        if (filtroCompraProveedor) filtered = filtered.filter(p => String(p.proveedor?.id) === filtroCompraProveedor);
        if (filtroCompraMoneda !== 'TODOS') filtered = filtered.filter(p => p.moneda === filtroCompraMoneda);
        if (filtroCompraEstado !== 'TODOS') filtered = filtered.filter(p => p.estado === filtroCompraEstado);
        if (compraFechaDesde) filtered = filtered.filter(p => p.fecha && p.fecha.split('T')[0] >= compraFechaDesde);
        if (compraFechaHasta) filtered = filtered.filter(p => p.fecha && p.fecha.split('T')[0] <= compraFechaHasta);

        if (compraSearchTerm.trim()) {
            const s = compraSearchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const num = p.numero?.toLowerCase() || '';
                const provEmpresa = p.proveedor?.empresa?.toLowerCase() || '';
                const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.toLowerCase() : '';
                return num.includes(s) || provEmpresa.includes(s) || provPersona.includes(s);
            });
        }

        return filtered;
    }, [comprasList, selectedSucursal, selectedCiudad, filtroCompraProveedor, filtroCompraMoneda, filtroCompraEstado, compraFechaDesde, compraFechaHasta, compraSearchTerm]);

    const exportColumnsCompras = [
        { header: 'Fecha', dataKey: 'fechaFormatted' },
        { header: 'Nro Compra', dataKey: 'numero' },
        { header: 'Proveedor', dataKey: 'proveedorNombre' },
        { header: 'Sucursal', dataKey: 'sucursalNombre' },
        { header: 'Moneda', dataKey: 'moneda' },
        { header: 'SubTotal', dataKey: 'subtotalFormatted' },
        { header: 'Descuento', dataKey: 'descuentoFormatted' },
        { header: 'Total', dataKey: 'totalFormatted' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const mappedExportDataCompras = useMemo(() => {
        return filteredCompras.map(s => {
            const subTotalCalc = (Number(s.total) || 0) + (Number(s.descuento) || 0);
            const descCalc = Number(s.descuento) || 0;
            const provPersona = s.proveedor?.persona ? `${s.proveedor.persona.nombres} ${s.proveedor.persona.apellidos}`.trim() : '';
            const provNombre = s.proveedor?.empresa ? `${s.proveedor.empresa}${provPersona ? ` (${provPersona})` : ''}` : (provPersona || 'Proveedor');
            const sucObj = s.sucursal || s.almacen;
            const ciudadNombre = (sucObj as any)?.ciudad?.nombre;
            const sucursalTexto = sucObj ? `${sucObj.nombre}${ciudadNombre ? ` (${ciudadNombre})` : ''}`.trim() : '-';
            return {
                id: s.id,
                numero: s.numero || '-',
                fechaFormatted: s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '-',
                proveedorNombre: provNombre,
                sucursalNombre: sucursalTexto,
                moneda: s.moneda || 'BOB',
                subtotalFormatted: formatCurrency(subTotalCalc, s.moneda || 'BOB'),
                descuentoFormatted: formatCurrency(descCalc, s.moneda || 'BOB'),
                totalFormatted: formatCurrency(s.total || 0, s.moneda || 'BOB'),
                estado: s.estado || 'CONFIRMADA'
            };
        });
    }, [filteredCompras]);

    const getFiltersTextCompras = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            texts.push(`Ciudad: ${c?.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            texts.push(`Sucursal: ${s?.nombre || selectedSucursal}`);
        }
        if (filtroCompraProveedor) {
            const sup = proveedoresUnicos.find(sp => String(sp.id) === filtroCompraProveedor);
            const supName = sup?.empresa || (sup?.persona ? `${sup.persona.nombres} ${sup.persona.apellidos}` : filtroCompraProveedor);
            texts.push(`Proveedor: ${supName}`);
        }
        if (filtroCompraMoneda !== 'TODOS') texts.push(`Moneda: ${filtroCompraMoneda}`);
        if (filtroCompraEstado !== 'TODOS') texts.push(`Estado: ${filtroCompraEstado}`);
        if (compraFechaDesde && compraFechaHasta) texts.push(`Rango: ${compraFechaDesde.split('-').reverse().join('/')} al ${compraFechaHasta.split('-').reverse().join('/')}`);
        else if (compraFechaDesde) texts.push(`Desde: ${compraFechaDesde.split('-').reverse().join('/')}`);
        else if (compraFechaHasta) texts.push(`Hasta: ${compraFechaHasta.split('-').reverse().join('/')}`);
        if (compraSearchTerm) texts.push(`Búsqueda: "${compraSearchTerm}"`);
        return texts.join(' | ') || 'Todos los registros';
    };

    const getExportColumnsCompras = () => {
        let cols = [...exportColumnsCompras];
        if (filtroCompraProveedor) cols = cols.filter(c => c.dataKey !== 'proveedorNombre');
        if (selectedSucursal) cols = cols.filter(c => c.dataKey !== 'sucursalNombre');
        if (filtroCompraMoneda !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'moneda');
        if (filtroCompraEstado !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const totalPagesCompras = Math.ceil(filteredCompras.length / itemsPerPage) || 1;
    const paginatedCompras = useMemo(() => {
        const start = (compraCurrentPage - 1) * itemsPerPage;
        return filteredCompras.slice(start, start + itemsPerPage);
    }, [filteredCompras, compraCurrentPage]);

    React.useEffect(() => setCompraCurrentPage(1), [
        compraSearchTerm, filtroCompraProveedor, filtroCompraMoneda, 
        filtroCompraEstado, compraFechaDesde, compraFechaHasta
    ]);

    // ==========================================
    // LÓGICA PAGOS A PROVEEDORES
    // ==========================================
    const metodosPagoProvUnicos = useMemo(() => {
        if (!pagosProveedoresList) return [];
        const set = new Set<string>();
        pagosProveedoresList.forEach(p => {
            if (p.metodoPago && p.metodoPago.trim()) set.add(p.metodoPago.trim());
        });
        return Array.from(set).sort();
    }, [pagosProveedoresList]);

    const hasPagoProvActiveFilters = Boolean(
        filtroPagoProvProveedor || filtroPagoProvEstado !== 'TODOS' || 
        filtroPagoProvMetodo !== 'TODOS' || pagoProvFechaDesde || 
        pagoProvFechaHasta || pagoProvSearchTerm
    );

    const handleClearPagoProvFilters = () => {
        setFiltroPagoProvProveedor('');
        setFiltroPagoProvEstado('TODOS');
        setFiltroPagoProvMetodo('TODOS');
        setPagoProvFechaDesde('');
        setPagoProvFechaHasta('');
        setPagoProvSearchTerm('');
    };

    const filteredPagosProveedores = useMemo(() => {
        if (!pagosProveedoresList) return [];
        let filtered = pagosProveedoresList;

        if (selectedSucursal) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.id === Number(selectedSucursal) || (p.proveedor?.sucursal as any)?.id === Number(selectedSucursal));
        } else if (selectedCiudad) {
            filtered = filtered.filter(p => (p.nota?.sucursal as any)?.ciudad?.id === Number(selectedCiudad) || (p.proveedor?.sucursal as any)?.ciudad?.id === Number(selectedCiudad));
        }

        if (filtroPagoProvProveedor) filtered = filtered.filter(p => String(p.proveedor?.id) === filtroPagoProvProveedor);
        if (filtroPagoProvEstado === 'ACTIVO') filtered = filtered.filter(p => p.activo);
        else if (filtroPagoProvEstado === 'ANULADO') filtered = filtered.filter(p => !p.activo);
        if (filtroPagoProvMetodo !== 'TODOS') filtered = filtered.filter(p => (p.metodoPago || 'Efectivo') === filtroPagoProvMetodo);
        if (pagoProvFechaDesde) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) >= pagoProvFechaDesde);
        if (pagoProvFechaHasta) filtered = filtered.filter(p => p.fecha && p.fecha.substring(0, 10) <= pagoProvFechaHasta);

        if (pagoProvSearchTerm) {
            const s = pagoProvSearchTerm.toLowerCase();
            filtered = filtered.filter(p => {
                const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.toLowerCase() : '';
                const provEmpresa = (p.proveedor?.empresa || '').toLowerCase();
                const compraNum = (p.nota?.numero || '').toLowerCase();
                const ref = (p.referencia || '').toLowerCase();
                const metodo = (p.metodoPago || '').toLowerCase();

                return provPersona.includes(s) || provEmpresa.includes(s) || compraNum.includes(s) || ref.includes(s) || metodo.includes(s);
            });
        }

        return filtered;
    }, [pagosProveedoresList, selectedSucursal, selectedCiudad, pagoProvSearchTerm, filtroPagoProvProveedor, filtroPagoProvEstado, filtroPagoProvMetodo, pagoProvFechaDesde, pagoProvFechaHasta]);

    const exportColumnsPagosProveedores = [
        { header: 'Fecha', dataKey: 'fecha' },
        { header: 'Nro Compra', dataKey: 'notaNumero' },
        { header: 'Proveedor', dataKey: 'proveedorNombre' },
        { header: 'Método de Pago', dataKey: 'metodoPago' },
        { header: 'Referencia', dataKey: 'referencia' },
        { header: 'Total Compra', dataKey: 'totalCompraFormateado' },
        { header: 'Monto Pagado', dataKey: 'montoFormateado' },
        { header: 'Saldo Pendiente', dataKey: 'saldoFormateado' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const mappedExportDataPagosProveedores = useMemo(() => {
        return filteredPagosProveedores.map(p => {
            const simbolo = p.moneda === 'USD' ? '$us' : 'Bs.';
            const montoFormateado = `${simbolo} ${Number(p.monto).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.trim() : '';
            const provNombre = p.proveedor?.empresa ? `${p.proveedor.empresa}${provPersona ? ` (${provPersona})` : ''}` : (provPersona || 'Proveedor');
            const compraMoneda = p.nota?.moneda || 'BOB';
            const compraSimbolo = compraMoneda === 'USD' ? '$us' : 'Bs.';
            const totalCompraFormateado = p.nota?.total != null ? `${compraSimbolo} ${Number(p.nota.total).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            const saldoFormateado = p.nota?.saldo != null ? `${compraSimbolo} ${Number(p.nota.saldo).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-';
            return {
                ...p,
                proveedorNombre: provNombre,
                notaNumero: p.nota?.numero || '-',
                totalCompraFormateado,
                montoFormateado,
                saldoFormateado,
                estado: p.activo ? 'Activo' : 'Anulado'
            };
        });
    }, [filteredPagosProveedores]);

    const getFiltersTextPagosProveedores = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            texts.push(`Ciudad: ${c?.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            texts.push(`Sucursal: ${s?.nombre || selectedSucursal}`);
        }
        if (filtroPagoProvProveedor) {
            const sup = proveedoresUnicos.find(sp => String(sp.id) === filtroPagoProvProveedor);
            const supName = sup?.empresa || (sup?.persona ? `${sup.persona.nombres} ${sup.persona.apellidos}` : filtroPagoProvProveedor);
            texts.push(`Proveedor: ${supName}`);
        }
        if (filtroPagoProvEstado === 'ACTIVO') texts.push('Estado: Activos');
        else if (filtroPagoProvEstado === 'ANULADO') texts.push('Estado: Anulados');
        if (filtroPagoProvMetodo && filtroPagoProvMetodo !== 'TODOS') texts.push(`Método: ${filtroPagoProvMetodo}`);
        if (pagoProvFechaDesde && pagoProvFechaHasta) texts.push(`Rango: ${pagoProvFechaDesde.split('-').reverse().join('/')} al ${pagoProvFechaHasta.split('-').reverse().join('/')}`);
        else if (pagoProvFechaDesde) texts.push(`Desde: ${pagoProvFechaDesde.split('-').reverse().join('/')}`);
        else if (pagoProvFechaHasta) texts.push(`Hasta: ${pagoProvFechaHasta.split('-').reverse().join('/')}`);
        if (pagoProvSearchTerm) texts.push(`Búsqueda: "${pagoProvSearchTerm}"`);
        return texts.join(' | ') || 'Todos los registros';
    };

    const getExportColumnsPagosProveedores = () => {
        let cols = [...exportColumnsPagosProveedores];
        if (filtroPagoProvProveedor) cols = cols.filter(c => c.dataKey !== 'proveedorNombre');
        if (filtroPagoProvMetodo && filtroPagoProvMetodo !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'metodoPago');
        if (filtroPagoProvEstado !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const totalPagesPagosProveedores = Math.ceil(filteredPagosProveedores.length / itemsPerPage) || 1;
    const paginatedPagosProveedores = useMemo(() => {
        const start = (pagoProvCurrentPage - 1) * itemsPerPage;
        return filteredPagosProveedores.slice(start, start + itemsPerPage);
    }, [filteredPagosProveedores, pagoProvCurrentPage]);

    React.useEffect(() => setPagoProvCurrentPage(1), [
        pagoProvSearchTerm, filtroPagoProvProveedor, filtroPagoProvEstado, 
        filtroPagoProvMetodo, pagoProvFechaDesde, pagoProvFechaHasta
    ]);

    const getFiltersTextEstadisticas = () => {
        const texts: string[] = [];
        if (selectedCiudad) {
            const c = ciudades?.find((ci: any) => ci.id === Number(selectedCiudad));
            texts.push(`Ciudad: ${c?.nombre || selectedCiudad}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find((su: any) => su.id === Number(selectedSucursal));
            texts.push(`Sucursal: ${s?.nombre || selectedSucursal}`);
        }
        if (statsFechaDesde && statsFechaHasta) {
            texts.push(`Rango: ${statsFechaDesde.split('-').reverse().join('/')} al ${statsFechaHasta.split('-').reverse().join('/')}`);
        } else if (statsFechaDesde) {
            texts.push(`Desde: ${statsFechaDesde.split('-').reverse().join('/')}`);
        } else if (statsFechaHasta) {
            texts.push(`Hasta: ${statsFechaHasta.split('-').reverse().join('/')}`);
        }
        return texts.join(' | ') || 'Todos los registros y períodos';
    };

    // ==========================================
    // HANDLERS GENERALES DE IMPRESIÓN Y EXPORTACIÓN
    // ==========================================
    const handlePrintEstadisticas = () => {
        const dateStr = format(new Date(), 'dd/MM/yyyy - HH:mm');
        const filterStr = getFiltersTextEstadisticas();

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>Reporte Estratégico y Analítica - GIPAAF</title>
                <style>
                    * { box-sizing: border-box; }
                    body { font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; padding: 25px; color: #1e293b; background: #fff; font-size: 12px; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 16px; }
                    .logo { height: 48px; object-fit: contain; }
                    .title-container { text-align: right; }
                    .report-title { color: #0f172a; margin: 0; font-size: 20px; font-weight: 800; }
                    .report-subtitle { color: #64748b; font-size: 11px; margin: 2px 0 0 0; }
                    .date { color: #64748b; font-size: 11px; margin: 4px 0 0 0; }
                    
                    .filters-box { margin-bottom: 18px; padding: 10px 14px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 11px; line-height: 1.5; }
                    
                    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 20px; }
                    .kpi-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px 12px; background: #ffffff; }
                    .kpi-title { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                    .kpi-value { font-size: 16px; font-weight: 800; color: #0f172a; }
                    .kpi-sub { font-size: 10px; color: #64748b; margin-top: 2px; }
                    
                    .section-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 18px 0 8px 0; border-left: 4px solid #2563eb; padding-left: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
                    .tables-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
                    
                    table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 11px; }
                    th, td { padding: 7px 9px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                    th { background-color: #f1f5f9; color: #334155; font-weight: 700; font-size: 10.5px; text-transform: uppercase; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: 700; }
                    
                    @media print {
                        body { padding: 0; }
                        @page { size: portrait; margin: 10mm; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/logo.jpeg" alt="Logo GIPAAF" class="logo" onerror="this.style.display='none'" />
                    <div class="title-container">
                        <h2 class="report-title">Centro de Analítica y Rendimiento</h2>
                        <p class="report-subtitle">Resumen Ejecutivo y Estratégico del Negocio</p>
                        <p class="date">Fecha de Emisión: ${dateStr}</p>
                    </div>
                </div>

                <div class="filters-box">
                    <strong style="color: #0f172a;">Filtros aplicados:</strong> <span style="color: #475569;">${filterStr}</span>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-title">Ventas Totales</div>
                        <div class="kpi-value" style="color: #2563eb;">Bs. ${strategicData.totalVentasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="kpi-sub">${strategicData.cantidadVentas} ventas confirmadas</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-title">Compras Totales</div>
                        <div class="kpi-value">Bs. ${strategicData.totalComprasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="kpi-sub">Inversión en inventario</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-title">Margen Bruto</div>
                        <div class="kpi-value" style="color: #059669;">Bs. ${strategicData.margenBruto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                    <div class="kpi-card">
                        <div class="kpi-title">Flujo de Caja Neto</div>
                        <div class="kpi-value" style="color: ${strategicData.flujoCajaNeto >= 0 ? '#059669' : '#d97706'};">Bs. ${strategicData.flujoCajaNeto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                        <div class="kpi-sub" style="margin-top: 4px;">Cobranzas: <strong>Bs. ${strategicData.totalCobranzasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
                        <div class="kpi-sub" style="border-top: 1px solid #e5e7eb; margin-top: 4px; padding-top: 4px;">Pagos Prov: Bs. ${strategicData.totalPagosProvBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}${strategicData.totalEgresosDiariosBOB > 0 ? ` | Egresos Diarios: Bs. ${strategicData.totalEgresosDiariosBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}${strategicData.totalCostosImportacionBOB > 0 ? ` | Gastos Import.: Bs. ${strategicData.totalCostosImportacionBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}${strategicData.totalFletesTraspasoBOB > 0 ? ` | Fletes Trasp.: Bs. ${strategicData.totalFletesTraspasoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}</div>
                    </div>
                </div>

                <div class="tables-grid">
                    <div>
                        <div class="section-title">Top 5 Productos Más Vendidos</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Producto</th>
                                    <th class="text-center">Cant.</th>
                                    <th class="text-right">Total Facturado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${strategicData.topProductos.length === 0 ? '<tr><td colspan="4" class="text-center" style="color:#64748b;">Sin ventas en el período</td></tr>' : strategicData.topProductos.map((p, idx) => `
                                    <tr>
                                        <td class="text-center font-bold">${idx + 1}</td>
                                        <td>${p.fullName}</td>
                                        <td class="text-center">${p.cantidad}</td>
                                        <td class="text-right font-bold">Bs. ${p.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <div class="section-title">Rendimiento por Vendedor</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Ejecutivo / Vendedor</th>
                                    <th class="text-center">Ventas</th>
                                    <th class="text-right">Total Facturado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${strategicData.sellerData.length === 0 ? '<tr><td colspan="4" class="text-center" style="color:#64748b;">Sin ventas asignadas</td></tr>' : strategicData.sellerData.map((s, idx) => `
                                    <tr>
                                        <td class="text-center font-bold">${idx + 1}</td>
                                        <td>${s.vendedor}</td>
                                        <td class="text-center">${s.ventasCount}</td>
                                        <td class="text-right font-bold">Bs. ${s.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="tables-grid">
                    <div>
                        <div class="section-title">Ventas por Sucursal</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Sucursal (Ciudad)</th>
                                    <th class="text-right">Total Facturado</th>
                                    <th class="text-right">Participación</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${strategicData.sucursalesData.length === 0 ? '<tr><td colspan="3" class="text-center" style="color:#64748b;">Sin ventas registradas</td></tr>' : strategicData.sucursalesData.map(suc => {
                                    const pct = strategicData.totalVentasBOB > 0 ? ((suc.total / strategicData.totalVentasBOB) * 100).toFixed(1) : '0';
                                    return `
                                        <tr>
                                            <td class="font-bold">${suc.name}</td>
                                            <td class="text-right font-bold">Bs. ${suc.total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td class="text-right">${pct}%</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div>
                        <div class="section-title">Distribución por Método de Cobro</div>
                        <table>
                            <thead>
                                <tr>
                                    <th>Método</th>
                                    <th class="text-right">Recaudado</th>
                                    <th class="text-right">Proporción</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${strategicData.paymentMethodsData.length === 0 ? '<tr><td colspan="3" class="text-center" style="color:#64748b;">Sin cobranzas registradas</td></tr>' : strategicData.paymentMethodsData.map(pm => {
                                    const pct = strategicData.totalCobranzasBOB > 0 ? ((pm.value / strategicData.totalCobranzasBOB) * 100).toFixed(1) : '0';
                                    return `
                                        <tr>
                                            <td class="font-bold">${pm.name}</td>
                                            <td class="text-right font-bold">Bs. ${pm.value.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td class="text-right">${pct}%</td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </body>
            </html>
        `;

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        iframe.style.visibility = 'hidden';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (!doc) {
            iframe.remove();
            return;
        }

        doc.open();
        doc.write(html);
        doc.close();

        setTimeout(() => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (err) {
                console.error('Error during printing stats:', err);
            } finally {
                setTimeout(() => {
                    iframe.remove();
                }, 1000);
            }
        }, 350);
    };

    const handlePrint = () => {
        if (activeTab === 'estadisticas') {
            handlePrintEstadisticas();
        } else if (activeTab === 'productos') {
            if (!mappedExportDataProductos.length) return;
            printData('Reporte de Existencias y Catálogo de Productos', getExportColumnsProductos(), mappedExportDataProductos, getFiltersTextProductos(), exportFooterProductos);
        } else if (activeTab === 'kardex-cliente') {
            if (!mappedExportDataKardex.length) return;
            printData('KARDEX INDIVIDUAL DE CLIENTE', exportColumnsKardex, mappedExportDataKardex, getKardexSubtitle(), exportFooterKardex);
        } else if (activeTab === 'ventas') {
            if (!mappedExportDataVentas.length) return;
            printData('Reporte de Ventas Realizadas', getExportColumnsVentas(), mappedExportDataVentas, getFiltersTextVentas());
        } else if (activeTab === 'ventas-producto') {
            if (!mappedExportDataVentasProducto.length) return;
            printData('Reporte de Ventas por Producto', exportColumnsVentasProducto, mappedExportDataVentasProducto, getFiltersTextVentasProducto(), exportFooterVentasProducto, 'landscape');
        } else if (activeTab === 'cobranzas') {
            if (!mappedExportDataCobranzas.length) return;
            printData('Reporte de Cobranzas / Pagos de Clientes', getExportColumnsCobranzas(), mappedExportDataCobranzas, getFiltersTextCobranzas(), undefined, 'landscape');
        } else if (activeTab === 'compras') {
            if (!mappedExportDataCompras.length) return;
            printData('Reporte de Compras Realizadas', getExportColumnsCompras(), mappedExportDataCompras, getFiltersTextCompras());
        } else if (activeTab === 'pagos-proveedores') {
            if (!mappedExportDataPagosProveedores.length) return;
            printData('Reporte de Pagos a Proveedores', getExportColumnsPagosProveedores(), mappedExportDataPagosProveedores, getFiltersTextPagosProveedores(), undefined, 'landscape');
        }
    };

    const handleExportPDF = () => {
        if (activeTab === 'productos') {
            if (!mappedExportDataProductos.length) return;
            exportToPDF('Reporte de Existencias y Catálogo de Productos', getExportColumnsProductos(), mappedExportDataProductos, 'productos_existencias_reporte', getFiltersTextProductos(), exportFooterProductos);
        } else if (activeTab === 'kardex-cliente') {
            if (!mappedExportDataKardex.length) return;
            const fileName = `kardex_cliente_${selectedKardexCliente?.codigo || 'reporte'}`;
            exportToPDF('KARDEX INDIVIDUAL DE CLIENTE', exportColumnsKardex, mappedExportDataKardex, fileName, getKardexSubtitle(), exportFooterKardex);
        } else if (activeTab === 'ventas') {
            if (!mappedExportDataVentas.length) return;
            exportToPDF('Reporte de Ventas Realizadas', getExportColumnsVentas(), mappedExportDataVentas, 'ventas_reporte', getFiltersTextVentas());
        } else if (activeTab === 'ventas-producto') {
            if (!mappedExportDataVentasProducto.length) return;
            exportToPDF('Reporte de Ventas por Producto', exportColumnsVentasProducto, mappedExportDataVentasProducto, 'ventas_por_producto_reporte', getFiltersTextVentasProducto(), exportFooterVentasProducto, 'landscape');
        } else if (activeTab === 'cobranzas') {
            if (!mappedExportDataCobranzas.length) return;
            exportToPDF('Reporte de Cobranzas / Pagos de Clientes', getExportColumnsCobranzas(), mappedExportDataCobranzas, 'cobranzas_reporte', getFiltersTextCobranzas(), undefined, 'landscape');
        } else if (activeTab === 'compras') {
            if (!mappedExportDataCompras.length) return;
            exportToPDF('Reporte de Compras Realizadas', getExportColumnsCompras(), mappedExportDataCompras, 'compras_reporte', getFiltersTextCompras());
        } else if (activeTab === 'pagos-proveedores') {
            if (!mappedExportDataPagosProveedores.length) return;
            exportToPDF('Reporte de Pagos a Proveedores', getExportColumnsPagosProveedores(), mappedExportDataPagosProveedores, 'pagos_proveedores_reporte', getFiltersTextPagosProveedores(), undefined, 'landscape');
        }
    };

    const handleExportExcel = () => {
        if (activeTab === 'productos') {
            if (!mappedExportDataProductos.length) return;
            exportToExcel(getExportColumnsProductos(), mappedExportDataProductos, 'productos_existencias_reporte', exportFooterProductos);
        } else if (activeTab === 'kardex-cliente') {
            if (!mappedExportDataKardex.length) return;
            const fileName = `kardex_cliente_${selectedKardexCliente?.codigo || 'reporte'}`;
            exportToExcel(exportColumnsKardex, mappedExportDataKardex, fileName, exportFooterKardex);
        } else if (activeTab === 'ventas') {
            if (!mappedExportDataVentas.length) return;
            exportToExcel(getExportColumnsVentas(), mappedExportDataVentas, 'ventas_reporte');
        } else if (activeTab === 'ventas-producto') {
            if (!mappedExportDataVentasProducto.length) return;
            exportToExcel(exportColumnsVentasProducto, mappedExportDataVentasProducto, 'ventas_por_producto_reporte', exportFooterVentasProducto);
        } else if (activeTab === 'cobranzas') {
            if (!mappedExportDataCobranzas.length) return;
            exportToExcel(getExportColumnsCobranzas(), mappedExportDataCobranzas, 'cobranzas_reporte');
        } else if (activeTab === 'compras') {
            if (!mappedExportDataCompras.length) return;
            exportToExcel(getExportColumnsCompras(), mappedExportDataCompras, 'compras_reporte');
        } else if (activeTab === 'pagos-proveedores') {
            if (!mappedExportDataPagosProveedores.length) return;
            exportToExcel(getExportColumnsPagosProveedores(), mappedExportDataPagosProveedores, 'pagos_proveedores_reporte');
        }
    };

    return (
        <div className="space-y-6">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <PieChartIcon className="w-8 h-8 text-primary/80" />
                        Centro de Reportes y Analítica
                    </h1>
                    <p className="text-muted-foreground italic">Analiza el rendimiento del negocio para la toma de decisiones estratégicas.</p>
                </div>
                {availableTabs.length > 0 && (
                    <div className="flex items-center flex-wrap gap-3">
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Imprimir">
                                <Printer className="w-4 h-4 text-muted-foreground" /> <span className="hidden sm:inline">Imprimir</span>
                            </button>
                            {activeTab !== 'estadisticas' && (
                                <>
                                    <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Exportar a PDF">
                                        <FileText className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">PDF</span>
                                    </button>
                                    <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Exportar a Excel">
                                        <FileSpreadsheet className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Excel</span>
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {availableTabs.length === 0 ? (
                <div className="p-12 text-center bg-card border rounded-2xl shadow-sm space-y-3">
                    <ShieldAlert className="w-12 h-12 text-destructive/80 mx-auto" />
                    <h2 className="text-xl font-bold text-foreground">Acceso Restringido</h2>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        No tiene permisos asignados para visualizar ninguna de las pestañas del módulo de Reportes. Comuníquese con un administrador para solicitar acceso.
                    </p>
                </div>
            ) : (
                <>
                    {/* Pestañas (Tabs) autorizadas */}
                    <div className="flex border-b overflow-x-auto custom-scrollbar">
                        {availableTabs.map(tab => {
                            const TabIcon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                                >
                                    <TabIcon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* ========================================== */}
                    {/* TAB: ESTADÍSTICAS ESTRATÉGICAS */}
                    {/* ========================================== */}
                    {activeTab === 'estadisticas' && (
                <div className="space-y-6">
                    {/* Barra de Filtros de Período */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Periodo:</span>
                            <button
                                onClick={() => handlePresetChange('ESTE_MES')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${presetPeriodo === 'ESTE_MES' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-accent'}`}
                            >
                                Este Mes
                            </button>
                            <button
                                onClick={() => handlePresetChange('ULTIMOS_30_DIAS')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${presetPeriodo === 'ULTIMOS_30_DIAS' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-accent'}`}
                            >
                                Últimos 30 días
                            </button>
                            <button
                                onClick={() => handlePresetChange('ULTIMO_TRIMESTRE')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${presetPeriodo === 'ULTIMO_TRIMESTRE' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-accent'}`}
                            >
                                Último Trimestre
                            </button>
                            <button
                                onClick={() => handlePresetChange('ANIO_ACTUAL')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${presetPeriodo === 'ANIO_ACTUAL' ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-accent'}`}
                            >
                                Año Actual
                            </button>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="flex items-center gap-1.5 bg-background border rounded-lg px-2 py-1 shadow-sm">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="date"
                                    value={statsFechaDesde}
                                    onChange={(e) => { setStatsFechaDesde(e.target.value); setPresetPeriodo('PERSONALIZADO'); }}
                                    className="text-xs bg-transparent border-none outline-none font-medium cursor-pointer"
                                />
                                <span className="text-xs text-muted-foreground">-</span>
                                <input
                                    type="date"
                                    value={statsFechaHasta}
                                    onChange={(e) => { setStatsFechaHasta(e.target.value); setPresetPeriodo('PERSONALIZADO'); }}
                                    className="text-xs bg-transparent border-none outline-none font-medium cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Fila de Tarjetas de KPIs Clave */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ventas Facturadas</span>
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-foreground">
                                    Bs. {strategicData.totalVentasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">{strategicData.cantidadVentas}</span> operaciones registradas
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Margen Bruto</span>
                                <div className={`p-2 rounded-lg ${strategicData.margenBruto >= 0 ? 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                                    <Percent className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className={`text-2xl font-black ${strategicData.margenBruto >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    Bs. {strategicData.margenBruto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    Rendimiento: <span className="font-bold text-foreground">{strategicData.margenPorcentaje.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Flujo de Caja Real</span>
                                <div className={`p-2 rounded-lg ${strategicData.flujoCajaNeto >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'}`}>
                                    <Activity className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className={`text-2xl font-black ${strategicData.flujoCajaNeto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    Bs. {strategicData.flujoCajaNeto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="text-[11px] text-muted-foreground mt-1 flex items-center justify-between">
                                    <span>Cobranzas: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">Bs. {strategicData.totalCobranzasBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                </div>
                                <div className="border-t border-border/60 mt-1.5 pt-1.5 flex items-center justify-between text-[10.5px] text-muted-foreground flex-wrap gap-x-2 gap-y-1">
                                    <span>Pagos Prov: <strong className="text-foreground">Bs. {strategicData.totalPagosProvBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                    {strategicData.totalEgresosDiariosBOB > 0 && (
                                        <span>Egresos Diarios: <strong className="text-foreground">Bs. {strategicData.totalEgresosDiariosBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                    )}
                                    {strategicData.totalCostosImportacionBOB > 0 && (
                                        <span>Gastos Import.: <strong className="text-foreground">Bs. {strategicData.totalCostosImportacionBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                    )}
                                    {strategicData.totalFletesTraspasoBOB > 0 && (
                                        <span>Fletes Trasp.: <strong className="text-foreground">Bs. {strategicData.totalFletesTraspasoBOB.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ticket Promedio</span>
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-foreground">
                                    Bs. {strategicData.ticketPromedio.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    Tasa Recaudación: <span className="font-bold text-foreground">{strategicData.ratioRecaudacion.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos Estratégicos */}
                    <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
                        <div>
                            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                Evolución de Liquidez y Flujo de Caja (Cobranzas vs Egresos Totales)
                            </h3>
                            <p className="text-xs text-muted-foreground">Comparativa de dinero real recaudado por cobranzas frente a egresos desembolsados (pagos a proveedores, egresos diarios, gastos de importación y fletes de traspasos).</p>
                        </div>

                        <div className="h-[300px] w-full">
                            {strategicData.timelineData.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                    No hay registros de movimientos de caja en el período seleccionado.
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={strategicData.timelineData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                        <defs>
                                             <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                            </linearGradient>
                                            <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                        <XAxis dataKey="fechaLabel" tick={{ fontSize: 11 }} />
                                        <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Bs. ${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                                        <RechartsTooltip 
                                            formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-BO', { minimumFractionDigits: 2 })}`, '']}
                                            labelFormatter={(label) => `Fecha: ${label}`}
                                        />
                                        <Legend />
                                        <Area type="monotone" name="Cobranzas Recaudadas" dataKey="ingresos" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorIngresos)" />
                                        <Area type="monotone" name="Egresos Totales (Pagos Prov. + Egresos Diarios + Gastos Import. + Fletes Trasp.)" dataKey="egresos" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorEgresos)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Top Productos & Vendedores */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Award className="w-5 h-5 text-amber-500" />
                                    Top 5 Productos con Mayor Facturación
                                </h3>
                                <p className="text-xs text-muted-foreground">Artículos líderes que generan mayor volumen de ventas.</p>
                            </div>

                            <div className="h-[260px] w-full">
                                {strategicData.topProductos.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                        No hay productos vendidos en el periodo.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={strategicData.topProductos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} horizontal={false} />
                                            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(val) => `Bs. ${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                                            <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} />
                                            <RechartsTooltip 
                                                formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-BO')}`, 'Facturación']}
                                                labelFormatter={(label, item) => item[0]?.payload?.fullName || label}
                                            />
                                            <Bar dataKey="total" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                                                {strategicData.topProductos.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Rendimiento Comercial por Vendedor
                                </h3>
                                <p className="text-xs text-muted-foreground">Volumen total facturado por cada ejecutivo en el periodo.</p>
                            </div>

                            <div className="h-[260px] w-full">
                                {strategicData.sellerData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                        No hay ventas asignadas a vendedores.
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={strategicData.sellerData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                            <XAxis dataKey="vendedor" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Bs. ${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                                            <RechartsTooltip 
                                                formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-BO')}`, 'Ventas Totales']}
                                            />
                                            <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Métodos de Pago & Sucursales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-500" />
                                    Distribución de Métodos de Pago (Cobranzas)
                                </h3>
                                <p className="text-xs text-muted-foreground">Proporción del dinero recaudado por canal de pago.</p>
                            </div>

                            <div className="h-[250px] w-full flex items-center justify-center">
                                {strategicData.paymentMethodsData.length === 0 ? (
                                    <div className="text-muted-foreground text-sm italic">No hay cobros registrados.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPieChart>
                                            <Pie
                                                data={strategicData.paymentMethodsData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={55}
                                                outerRadius={85}
                                                paddingAngle={4}
                                                dataKey="value"
                                                label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                            >
                                                {strategicData.paymentMethodsData.map((_, index) => (
                                                    <Cell key={`cell-pm-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-BO')}`, 'Recaudado']} />
                                        </RechartsPieChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        <div className="bg-card border rounded-xl shadow-sm p-5 space-y-4">
                            <div>
                                <h3 className="font-bold text-base text-foreground flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-500" />
                                    Participación de Ventas por Sucursal
                                </h3>
                                <p className="text-xs text-muted-foreground">Aporte de facturación por punto de venta.</p>
                            </div>

                            <div className="h-[250px] w-full">
                                {strategicData.sucursalesData.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">No hay ventas registradas por sucursal.</div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={strategicData.sucursalesData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                            <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `Bs. ${val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}`} />
                                            <RechartsTooltip formatter={(value: any) => [`Bs. ${Number(value).toLocaleString('es-BO')}`, 'Ventas']} />
                                            <Bar dataKey="total" fill="#06b6d4" radius={[6, 6, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* TAB: PRODUCTOS Y EXISTENCIAS POR SUCURSAL */}
            {/* ========================================== */}
            {activeTab === 'productos' && (
                <div className="space-y-6">
                    {/* Métricas de Existencias y Catálogo */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-primary" /> Total Productos
                            </span>
                            <div className="text-xl font-bold text-foreground">
                                {metricsProductos.totalItems.toLocaleString('es-BO')} <span className="text-xs font-normal text-muted-foreground">ítems</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">En catálogo según filtros</p>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Boxes className="w-4 h-4 text-blue-600" /> Total Existencias
                            </span>
                            <div className="text-xl font-bold text-blue-600">
                                {metricsProductos.totalExistencias.toLocaleString('es-BO')} <span className="text-xs font-normal text-muted-foreground">unidades</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">
                                {prodFechaHasta ? `Stock a la fecha ${prodFechaHasta.split('-').reverse().join('/')}` : 'Stock consolidado en sucursales'}
                            </p>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <DollarSign className="w-4 h-4 text-emerald-600" /> Total Bs (Al Costo)
                            </span>
                            <div className="text-xl font-bold text-emerald-600">
                                Bs. {metricsProductos.totalValorCosto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <p className="text-[11px] text-muted-foreground">Valorización total al costo unitario</p>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <TrendingUp className="w-4 h-4 text-primary" /> Total Bs (A la Venta)
                            </span>
                            <div className="text-xl font-bold text-primary">
                                Bs. {metricsProductos.totalValorVenta.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                <span>Margen est.:</span>
                                <span className="font-semibold text-green-600">
                                    Bs. {metricsProductos.margenPotencial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({metricsProductos.margenPct.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filtros de Productos */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                     <Tag className="w-3.5 h-3.5 text-primary" /> Marca
                                </label>
                                <select 
                                     value={filtroProdMarca} 
                                     onChange={(e) => setFiltroProdMarca(e.target.value)} 
                                     className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                     <option value="">Todas las Marcas</option>
                                     {marcasList?.map(m => (
                                         <option key={m.id} value={m.id}>{m.nombre}</option>
                                     ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                     <Layers className="w-3.5 h-3.5 text-primary" /> Línea
                                </label>
                                <select 
                                     value={filtroProdLinea} 
                                     onChange={(e) => setFiltroProdLinea(e.target.value)} 
                                     className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                     <option value="">Todas las Líneas</option>
                                     {lineasList?.map(l => (
                                         <option key={l.id} value={l.id}>{l.nombre}</option>
                                     ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                     <Boxes className="w-3.5 h-3.5 text-primary" /> Grupo
                                </label>
                                <select 
                                     value={filtroProdGrupo} 
                                     onChange={(e) => setFiltroProdGrupo(e.target.value)} 
                                     className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                     <option value="">Todos los Grupos</option>
                                     {gruposList?.map(g => (
                                         <option key={g.id} value={g.id}>{g.nombre}</option>
                                     ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <CreditCard className="w-3.5 h-3.5 text-primary" /> Estado
                                </label>
                                <select 
                                    value={filtroProdEstado} 
                                    onChange={(e) => setFiltroProdEstado(e.target.value as any)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="ACTIVO">Activos</option>
                                    <option value="INACTIVO">Inactivos</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                                </label>
                                <input 
                                    type="date" 
                                    value={prodFechaDesde} 
                                    onChange={(e) => setProdFechaDesde(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta (A la fecha)
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={prodFechaHasta} 
                                        onChange={(e) => setProdFechaHasta(e.target.value)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                    {hasProdActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearProdFilters}
                                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 h-[38px]"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-3.5 h-3.5" /> Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar por código, nombre o descripción..." 
                                    value={prodSearchTerm} 
                                    onChange={(e) => setProdSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                                {prodSearchTerm && (
                                    <button onClick={() => setProdSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const hoy = format(new Date(), 'yyyy-MM-dd');
                                        setProdFechaHasta(hoy);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                        prodFechaHasta === format(new Date(), 'yyyy-MM-dd')
                                            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                            : 'bg-muted/40 text-muted-foreground hover:bg-accent'
                                    }`}
                                >
                                    A la fecha de hoy
                                </button>
                                {prodFechaHasta && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setProdFechaDesde('');
                                            setProdFechaHasta('');
                                        }}
                                        className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-accent border transition-colors"
                                    >
                                        Ver Stock Actual
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Productos y Existencias */}
                    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1050px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10">#</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código</th>
                                        {!filtroProdMarca && <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marca</th>}
                                        {!filtroProdLinea && <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Línea</th>}
                                        {!filtroProdGrupo && <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupo</th>}
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nombre Producto</th>
                                        
                                        {/* Columnas dinámicas de sucursales con Ciudad arriba y Sucursal debajo */}
                                        {activeSucursales.map(s => (
                                            <th key={s.id} className="p-2 text-right min-w-[90px] border-l border-r border-border/40" title={`Existencias en ${s.ciudadNombre || s.ciudadAbrev} - ${s.nombre}`}>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xs font-bold uppercase tracking-wider text-primary leading-tight">
                                                        {s.ciudadAbrev || s.ciudadNombre || 'SUC'}
                                                    </span>
                                                    <span className="text-[10px] font-medium text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[95px] leading-tight" title={s.nombre}>
                                                        {s.nombre}
                                                    </span>
                                                </div>
                                            </th>
                                        ))}

                                        <th className="p-3 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 text-right bg-blue-50/40 dark:bg-blue-950/20">
                                            Total Existencias
                                        </th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">
                                            Costo Unitario
                                        </th>
                                        <th className="p-3 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 text-right bg-emerald-50/40 dark:bg-emerald-950/20">
                                            Total Bs
                                        </th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">P. Venta</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Margen</th>
                                        {filtroProdEstado === 'TODOS' && <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-24 text-center">Estado</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingProducts || loadingInventory ? (
                                        <tr>
                                            <td colSpan={14 + activeSucursales.length} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando catálogo y existencias de productos...
                                            </td>
                                        </tr>
                                    ) : paginatedProductos.length === 0 ? (
                                        <tr>
                                            <td colSpan={14 + activeSucursales.length} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron productos para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProductos.map((p, index) => {
                                            const pCompra = Number(p.precioCompra) || 0;
                                            const pVenta = Number(p.precioVenta) || 0;
                                            const { stockPorSucursal, totalExistencias } = getProductStockData(p.id);
                                            const totalBs = totalExistencias * pCompra;
                                            const margenBs = pVenta - pCompra;
                                            const margenPct = pVenta > 0 ? ((margenBs / pVenta) * 100).toFixed(1) : '0';

                                            return (
                                                <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                                    <td className="p-3 text-xs font-mono text-muted-foreground">
                                                        {(prodCurrentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="p-3 text-xs font-mono font-bold text-foreground whitespace-nowrap">
                                                        {p.codigo}
                                                    </td>
                                                    {!filtroProdMarca && (
                                                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                                            {p.marca?.nombre || '-'}
                                                        </td>
                                                    )}
                                                    {!filtroProdLinea && (
                                                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                                            {p.linea?.nombre || p.categoria?.nombre || '-'}
                                                        </td>
                                                    )}
                                                    {!filtroProdGrupo && (
                                                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                                                            {p.grupo?.nombre || '-'}
                                                        </td>
                                                    )}
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2.5 min-w-[200px]">
                                                            <div className="w-7 h-7 rounded-md border bg-background overflow-hidden flex items-center justify-center shrink-0">
                                                                {p.imagen ? (
                                                                    <img
                                                                        src={getFileUrl(p.imagen)}
                                                                        alt={p.nombre}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <ImageIcon className="w-3.5 h-3.5 text-muted-foreground/50" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs font-semibold text-foreground leading-snug">{p.nombre}</span>
                                                                {p.descripcion && <span className="text-[10px] text-muted-foreground line-clamp-1">{p.descripcion}</span>}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Stock por Sucursal */}
                                                    {activeSucursales.map(s => {
                                                        const qty = stockPorSucursal[s.id] || 0;
                                                        return (
                                                            <td key={s.id} className="p-3 text-xs font-mono text-right whitespace-nowrap border-l border-r border-border/20">
                                                                <span className={qty > 0 ? 'font-bold text-foreground' : 'text-muted-foreground/50'}>
                                                                    {qty.toLocaleString('es-BO')}
                                                                </span>
                                                            </td>
                                                        );
                                                    })}

                                                    {/* Total Existencias */}
                                                    <td className="p-3 text-xs font-mono font-bold text-right text-blue-700 dark:text-blue-400 bg-blue-50/20 dark:bg-blue-950/10 whitespace-nowrap">
                                                        {totalExistencias.toLocaleString('es-BO')}
                                                    </td>

                                                    {/* Costo Unitario / P. Compra */}
                                                    <td className="p-3 text-xs text-right whitespace-nowrap">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-semibold text-foreground font-mono">
                                                                {pCompra.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5" title="Fecha de última compra">
                                                                <Calendar className="w-2.5 h-2.5 text-muted-foreground/70 shrink-0" />
                                                                {formatFechaCompra(p.fechaUltimaCompra)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Total Bs */}
                                                    <td className="p-3 text-xs font-mono font-bold text-right text-emerald-700 dark:text-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/10 whitespace-nowrap">
                                                        {totalBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>

                                                    {/* P. Venta */}
                                                    <td className="p-3 text-xs font-bold text-primary text-right font-mono whitespace-nowrap">
                                                        {pVenta.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>

                                                    {/* Margen */}
                                                    <td className="p-3 text-right whitespace-nowrap">
                                                        <div className={`text-xs font-bold font-mono ${margenBs >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                                                            {margenBs.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {margenPct}%
                                                        </div>
                                                    </td>

                                                    {/* Estado */}
                                                    {filtroProdEstado === 'TODOS' && (
                                                        <td className="p-3 text-center whitespace-nowrap">
                                                            {p.activo ? (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                                                    Activo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                                                                    Inactivo
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {filteredProductos.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-muted/70 font-bold border-t-2 border-primary/20 text-xs">
                                            <td colSpan={2 + (!filtroProdMarca ? 1 : 0) + (!filtroProdLinea ? 1 : 0) + (!filtroProdGrupo ? 1 : 0) + 1} className="p-3 text-foreground font-black">
                                                TOTAL GENERAL CONSOLIDADO ({filteredProductos.length} ítems)
                                            </td>

                                            {activeSucursales.map(s => {
                                                const sucTotal = filteredProductos.reduce((acc, p) => {
                                                    const { stockPorSucursal } = getProductStockData(p.id);
                                                    return acc + (stockPorSucursal[s.id] || 0);
                                                }, 0);
                                                return (
                                                    <td key={s.id} className="p-3 text-right font-mono font-bold text-foreground border-l border-r border-border/30">
                                                        {sucTotal.toLocaleString('es-BO')}
                                                    </td>
                                                );
                                            })}

                                            <td className="p-3 text-right font-mono font-black text-blue-700 dark:text-blue-400 bg-blue-100/30">
                                                {metricsProductos.totalExistencias.toLocaleString('es-BO')}
                                            </td>
                                            <td className="p-3 text-right text-muted-foreground font-semibold">
                                                ---
                                            </td>
                                            <td className="p-3 text-right font-mono font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/30">
                                                Bs. {metricsProductos.totalValorCosto.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-3 text-right font-mono font-bold text-primary">
                                                Bs. {metricsProductos.totalValorVenta.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-3 text-right font-mono text-green-600 font-bold">
                                                Bs. {metricsProductos.margenPotencial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            {filtroProdEstado === 'TODOS' && <td className="p-3"></td>}
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Paginación Productos */}
                        {totalPagesProductos > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((prodCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(prodCurrentPage * itemsPerPage, filteredProductos.length)} de {filteredProductos.length} productos
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setProdCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={prodCurrentPage === 1}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium px-2">
                                        Página {prodCurrentPage} de {totalPagesProductos}
                                    </span>
                                    <button 
                                        onClick={() => setProdCurrentPage(p => Math.min(totalPagesProductos, p + 1))}
                                        disabled={prodCurrentPage === totalPagesProductos}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ========================================== */}
            {/* TAB: KARDEX INDIVIDUAL DE CLIENTE */}
            {/* ========================================== */}
            {activeTab === 'kardex-cliente' && (
                <div className="space-y-6">
                    {/* Barra de Búsqueda y Selección de Cliente + Fechas */}
                    <div className="bg-card p-5 border rounded-xl shadow-sm space-y-4">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                            {/* Selector de Cliente */}
                            <div className="lg:col-span-6 space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="w-4 h-4 text-primary" /> Seleccionar Cliente
                                    </span>
                                    {selectedKardexCliente && (
                                        <span className="text-[11px] font-mono text-primary font-bold">
                                            CÓDIGO: {selectedKardexCliente.codigo || 'S/C'}
                                        </span>
                                    )}
                                </label>
                                <SearchableSelect
                                    value={kardexClienteId}
                                    onChange={(val) => setKardexClienteId(String(val || ''))}
                                    options={clientReportOptions}
                                    placeholder="-- Selecciona un Cliente para generar el Kardex --"
                                    searchPlaceholder="Buscar cliente por nombre, tienda o CI..."
                                />
                            </div>

                            {/* Rango de Fechas */}
                            <div className="lg:col-span-4 space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4 text-primary" /> Rango de Fechas
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-muted-foreground">Desde</span>
                                        <input
                                            type="date"
                                            value={kardexFechaDesde}
                                            onChange={(e) => setKardexFechaDesde(e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                        />
                                    </div>
                                    <div className="space-y-0.5">
                                        <span className="text-[10px] text-muted-foreground">Hasta</span>
                                        <input
                                            type="date"
                                            value={kardexFechaHasta}
                                            onChange={(e) => setKardexFechaHasta(e.target.value)}
                                            className="w-full p-2 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Accesos rápidos de fecha */}
                            <div className="lg:col-span-2 flex flex-wrap lg:flex-col gap-1.5 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKardexFechaDesde(format(startOfYear(new Date()), 'yyyy-MM-dd'));
                                        setKardexFechaHasta(format(new Date(), 'yyyy-MM-dd'));
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-muted/60 hover:bg-accent rounded border transition-colors text-center cursor-pointer"
                                >
                                    Año Actual
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKardexFechaDesde(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
                                        setKardexFechaHasta(format(new Date(), 'yyyy-MM-dd'));
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-muted/60 hover:bg-accent rounded border transition-colors text-center cursor-pointer"
                                >
                                    Este Mes
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setKardexFechaDesde('');
                                        setKardexFechaHasta(format(new Date(), 'yyyy-MM-dd'));
                                    }}
                                    className="px-2.5 py-1 text-[11px] font-semibold bg-muted/60 hover:bg-accent rounded border transition-colors text-center cursor-pointer"
                                >
                                    Todo el Historial
                                </button>
                            </div>
                        </div>

                        {/* Toggles de Devoluciones y Muestras */}
                        <div className="pt-2 border-t flex items-center justify-between flex-wrap gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-5 flex-wrap">
                                <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={kardexIncluirDevoluciones}
                                        onChange={(e) => setKardexIncluirDevoluciones(e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span>Mostrar Cambios de Producto / Devoluciones <span className="text-[10px] text-muted-foreground font-normal">(producto a producto sin dinero)</span></span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer select-none font-medium text-foreground">
                                    <input
                                        type="checkbox"
                                        checked={kardexIncluirMuestras}
                                        onChange={(e) => setKardexIncluirMuestras(e.target.checked)}
                                        className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                    />
                                    <span>Mostrar Entregas de Muestras <span className="text-[10px] text-muted-foreground font-normal">(sin costo monetario)</span></span>
                                </label>
                            </div>
                            {selectedKardexCliente && (
                                <span className="text-[11px] text-muted-foreground italic">
                                    {kardexTimeline.movimientos.length} movimientos registrados en el período
                                </span>
                            )}
                        </div>
                    </div>

                    {!selectedKardexCliente ? (
                        <div className="p-12 text-center bg-card border rounded-2xl shadow-sm space-y-4">
                            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center">
                                <Users className="w-8 h-8" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-foreground">Selecciona un Cliente para Visualizar su Kardex</h3>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    Elige un cliente del menú superior para consultar el extracto detallado de notas de venta (crédito), pagos aplicados (abono), cambios de producto y saldo progresivo.
                                </p>
                            </div>
                            {/* Clientes sugeridos / rápidos */}
                            <div className="pt-4 max-w-2xl mx-auto text-left">
                                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Clientes registrados recientemente:</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {clientesList?.slice(0, 6).map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => setKardexClienteId(String(c.id))}
                                            className="p-3 border rounded-xl hover:border-primary/50 hover:bg-accent/40 text-left transition-all flex items-center justify-between cursor-pointer group"
                                        >
                                            <div className="truncate">
                                                <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                                    {c.codigo ? `[${c.codigo}] ` : ''}{getClientDisplayName(c)}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground">
                                                    {c.persona?.telefono || (c as any).telefono || (c.sucursal as any)?.nombre || 'Cliente Registrado'}
                                                </div>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {/* Ficha de Resumen del Cliente */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Receipt className="w-4 h-4 text-blue-600" /> Saldo Inicial
                                    </span>
                                    <div className={`text-xl font-bold font-mono ${kardexTimeline.saldoInicial > 0 ? 'text-amber-600' : 'text-foreground'}`}>
                                        Bs. {kardexTimeline.saldoInicial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {kardexFechaDesde ? `Al ${kardexFechaDesde.split('-').reverse().join('/')}` : 'Desde el inicio'}
                                    </p>
                                </div>

                                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <ShoppingCart className="w-4 h-4 text-primary" /> Total Créditos (Ventas)
                                    </span>
                                    <div className="text-xl font-bold font-mono text-primary">
                                        Bs. {kardexTimeline.totalCredito.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Cargos en el período</p>
                                </div>

                                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <Wallet className="w-4 h-4 text-emerald-600" /> Total Abonos (Pagos)
                                    </span>
                                    <div className="text-xl font-bold font-mono text-emerald-600">
                                        Bs. {kardexTimeline.totalAbono.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">Cobros en el período</p>
                                </div>

                                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                        <DollarSign className="w-4 h-4 text-purple-600" /> Saldo Pendiente Final
                                    </span>
                                    <div className={`text-xl font-black font-mono ${kardexTimeline.saldoFinal > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}`}>
                                        Bs. {kardexTimeline.saldoFinal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </div>
                                    <p className="text-[11px] text-muted-foreground">
                                        {kardexTimeline.saldoFinal <= 0.01 ? 'Cuenta al día (Sin saldo)' : 'Deuda acumulada actual'}
                                    </p>
                                </div>
                            </div>

                            {/* Tabla de Movimientos del Kardex */}
                            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[1050px]">
                                        <thead>
                                            <tr className="bg-muted/50 border-b">
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-32">Fecha</th>
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-32">Nro. de Nota</th>
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observación</th>
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center w-32">Nro. de Recibo</th>
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-36">Crédito</th>
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-36">Abono</th>
                                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-40">Saldo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {/* Fila 1: Saldo Inicial si hay fecha desde */}
                                            {kardexFechaDesde && (
                                                <tr className="bg-muted/20 font-medium">
                                                    <td className="p-4 text-sm font-medium text-center text-muted-foreground whitespace-nowrap">
                                                        {kardexFechaDesde.split('-').reverse().join('/')}
                                                    </td>
                                                    <td className="p-4 text-sm font-mono text-center text-muted-foreground whitespace-nowrap">
                                                        0
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-foreground">
                                                        SALDO INICIAL
                                                    </td>
                                                    <td className="p-4 text-sm font-mono text-center text-muted-foreground whitespace-nowrap">
                                                        0
                                                    </td>
                                                    <td className="p-4 text-sm font-mono font-medium text-foreground text-right whitespace-nowrap">
                                                        {kardexTimeline.saldoInicial >= 0 ? kardexTimeline.saldoInicial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                                                    </td>
                                                    <td className="p-4 text-sm font-mono font-medium text-foreground text-right whitespace-nowrap">
                                                        {kardexTimeline.saldoInicial < 0 ? Math.abs(kardexTimeline.saldoInicial).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                                                    </td>
                                                    <td className="p-4 text-sm font-mono font-bold text-foreground text-right whitespace-nowrap">
                                                        {kardexTimeline.saldoInicial.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            )}

                                            {kardexTimeline.movimientos.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-sm">
                                                        No se encontraron movimientos registrados para este cliente en el período seleccionado.
                                                    </td>
                                                </tr>
                                            ) : (
                                                kardexTimeline.movimientos.map((m) => (
                                                    <tr key={m.id} className="hover:bg-accent/30 transition-colors group">
                                                        <td className="p-4 text-sm font-medium text-center text-foreground whitespace-nowrap">
                                                            {m.fecha}
                                                        </td>
                                                        <td className="p-4 text-sm font-mono font-bold text-foreground text-center whitespace-nowrap">
                                                            {m.nroNota}
                                                        </td>
                                                        <td className="p-4 text-sm">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <span className="font-medium text-foreground">{m.observacion}</span>
                                                                {m.badge === 'Cambio Físico' && (
                                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                                        Cambio Físico
                                                                    </span>
                                                                )}
                                                                {m.badge === 'Muestra' && (
                                                                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                                                                        Muestra
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-sm font-mono text-center text-muted-foreground whitespace-nowrap">
                                                            {m.nroRecibo || '-'}
                                                        </td>
                                                        <td className="p-4 text-sm font-mono font-semibold text-foreground text-right whitespace-nowrap">
                                                            {m.credito > 0 ? m.credito.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                                                        </td>
                                                        <td className="p-4 text-sm font-mono font-semibold text-foreground text-right whitespace-nowrap">
                                                            {m.abono > 0 ? m.abono.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'}
                                                        </td>
                                                        <td className="p-4 text-sm font-mono font-bold text-foreground text-right whitespace-nowrap">
                                                            {m.saldo.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                        {/* Fila de Totales */}
                                        <tfoot>
                                            <tr className="bg-muted/50 font-bold border-t text-sm">
                                                <td colSpan={4} className="p-4 text-left uppercase tracking-wider text-foreground font-black">
                                                    TOTALES CONSOLIDADOS DEL PERÍODO
                                                </td>
                                                <td className="p-4 text-right font-mono font-black text-foreground">
                                                    Bs. {kardexTimeline.totalCredito.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4 text-right font-mono font-black text-foreground">
                                                    Bs. {kardexTimeline.totalAbono.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="p-4 text-right font-mono font-black text-foreground">
                                                    Bs. {kardexTimeline.saldoFinal.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ========================================== */}
            {/* TAB: VENTAS (Antes de Cobranzas) */}
            {/* ========================================== */}
            {activeTab === 'ventas' && (
                <>
                    {/* Filtros de Ventas */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Cliente
                                </label>
                                <SearchableSelect 
                                    value={filtroVentaCliente} 
                                    onChange={(val) => { setFiltroVentaCliente(String(val || '')); setVentaCurrentPage(1); }} 
                                    options={clientFilterOptions}
                                    placeholder="Todos los Clientes"
                                    searchPlaceholder="Buscar cliente..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-primary" /> Vendedor
                                </label>
                                <MultiSelectVendedores
                                    vendedores={vendedoresList}
                                    selectedVendedores={filtroVentaVendedores}
                                    onChange={(vals) => {
                                        setFiltroVentaVendedores(vals);
                                        setVentaCurrentPage(1);
                                    }}
                                    isRestrictedVendor={isRestrictedVendor}
                                    userPersonal={userPersonal}
                                    placeholder="Todos los Vendedores"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Receipt className="w-3.5 h-3.5 text-primary" /> Tipo Doc.
                                </label>
                                <select 
                                    value={filtroVentaTipoDoc} 
                                    onChange={(e) => setFiltroVentaTipoDoc(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos los Tipos</option>
                                    <option value="CON_FACTURA">Con Factura</option>
                                    <option value="SIN_FACTURA">Sin Factura (Nota)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5 text-primary" /> Estado
                                </label>
                                <select 
                                    value={filtroVentaEstado} 
                                    onChange={(e) => setFiltroVentaEstado(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="CONFIRMADA">Confirmadas</option>
                                    <option value="PENDIENTE">Pendientes</option>
                                    <option value="ANULADA">Anuladas</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                                </label>
                                <input 
                                    type="date" 
                                    value={ventaFechaDesde} 
                                    onChange={(e) => setVentaFechaDesde(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={ventaFechaHasta} 
                                        onChange={(e) => setVentaFechaHasta(e.target.value)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                    {hasVentaActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearVentaFilters}
                                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 h-[38px]"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-3.5 h-3.5" /> Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar nro de venta, factura, cliente..." 
                                    value={ventaSearchTerm} 
                                    onChange={(e) => setVentaSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                                {ventaSearchTerm && (
                                    <button onClick={() => setVentaSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Ventas */}
                    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1050px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Venta / Factura</th>
                                        {!filtroVentaCliente && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>}
                                        {filtroVentaVendedores.length !== 1 && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota de Venta</th>
                                        {!selectedSucursal && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sucursal</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">SubTotal</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Descuento</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</th>
                                        {filtroVentaEstado === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingVentas ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando reporte de ventas...
                                            </td>
                                        </tr>
                                    ) : paginatedVentas.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron ventas registradas para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVentas.map((s, index) => {
                                            const cliLabel = s.cliente?.persona 
                                                ? `${s.cliente.persona.nombres} ${s.cliente.persona.apellidos}` 
                                                : ((s.cliente as any)?.razonSocial || 'Cliente Final');
                                            const subTotalCalc = (Number(s.total) || 0) + (Number(s.descuento) || 0) + (Number(s.descuentoPromocion) || 0);
                                            const descCalc = (Number(s.descuento) || 0) + (Number(s.descuentoPromocion) || 0);

                                            return (
                                                <tr key={s.id} className="hover:bg-accent/30 transition-colors group">
                                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                                        {(ventaCurrentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="p-4 text-sm font-medium">
                                                        {s.fecha ? s.fecha.split('T')[0].split('-').reverse().join('/') : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingDetalleVenta(s)}
                                                                    className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                                    title="Ver detalle y productos de la venta"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    {s.numero || 'S/N'}
                                                                </button>
                                                                {s.conFactura ? (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800" title={`Factura Nro: ${s.numeroFactura || 'S/N'}`}>
                                                                        FAC: {s.numeroFactura || 'S/N'}
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                                                        Nota
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {!filtroVentaCliente && (
                                                        <td className="p-4 text-sm">
                                                            <div className="flex flex-col">
                                                                {s.cliente?.nombreTienda ? (
                                                                    <span className="font-bold text-foreground flex items-center gap-1">
                                                                        <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                        {s.cliente.nombreTienda}
                                                                    </span>
                                                                ) : (
                                                                    <span className="font-semibold text-foreground">{getClientPersonName(s.cliente)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {filtroVentaVendedores.length !== 1 && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {s.vendedor ? `${s.vendedor.nombres} ${s.vendedor.apellidos}` : '---'}
                                                        </td>
                                                    )}
                                                    <td className="p-4 max-w-[200px]">
                                                        {s.observaciones ? (
                                                            <span className="text-xs text-muted-foreground line-clamp-2" title={s.observaciones}>
                                                                {s.observaciones}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/50 font-mono">-</span>
                                                        )}
                                                    </td>
                                                    {!selectedSucursal && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            <div className="font-medium text-foreground">{s.sucursal?.nombre || '-'}</div>
                                                            {(s.sucursal as any)?.ciudad?.nombre && (
                                                                <span className="text-[10px] text-muted-foreground block">
                                                                    {(s.sucursal as any).ciudad.nombre}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-sm font-medium text-right text-muted-foreground">
                                                        {formatCurrency(subTotalCalc)}
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-right text-red-600 dark:text-red-400">
                                                        {descCalc > 0 ? formatCurrency(descCalc) : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-primary text-right">
                                                        {formatCurrency(s.total)}
                                                    </td>
                                                    {filtroVentaEstado === 'TODOS' && (
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                s.estado === 'ANULADA' 
                                                                    ? 'bg-red-100 text-red-700' 
                                                                    : s.estado === 'PENDIENTE'
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-green-100 text-green-700'
                                                            }`}>
                                                                {s.estado || 'CONFIRMADA'}
                                                            </span>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación Ventas */}
                        {totalPagesVentas > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((ventaCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(ventaCurrentPage * itemsPerPage, filteredVentas.length)} de {filteredVentas.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setVentaCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={ventaCurrentPage === 1}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium px-2">
                                        Página {ventaCurrentPage} de {totalPagesVentas}
                                    </span>
                                    <button 
                                        onClick={() => setVentaCurrentPage(p => Math.min(totalPagesVentas, p + 1))}
                                        disabled={ventaCurrentPage === totalPagesVentas}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========================================== */}
            {/* TAB: VENTAS X PRODUCTO */}
            {/* ========================================== */}
            {activeTab === 'ventas-producto' && (
                <>
                    {/* Tarjetas Resumen KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Unidades Vendidas</span>
                                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                    <Package className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-foreground">
                                    {totalesVentasPorProducto.totalCantidad.toLocaleString('es-BO')} u.
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground">{totalesVentasPorProducto.totalRegistros}</span> líneas de detalle
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Ingresos (Venta)</span>
                                <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                                    <ShoppingCart className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-foreground">
                                    {formatCurrency(totalesVentasPorProducto.totalVenta)}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    Total facturado / notas
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Costo Compra Total</span>
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400">
                                    <ShoppingBag className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className="text-2xl font-black text-foreground">
                                    {formatCurrency(totalesVentasPorProducto.totalCosto)}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    Costo base de inventario
                                </div>
                            </div>
                        </div>

                        <div className="p-4 bg-card border rounded-xl shadow-sm space-y-2 relative overflow-hidden">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ganancia Neta Total</span>
                                <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div>
                                <div className={`text-2xl font-black ${totalesVentasPorProducto.totalGanancia >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(totalesVentasPorProducto.totalGanancia)}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                    Margen prom: <span className="font-bold text-foreground">{totalesVentasPorProducto.margenPromedio.toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filtros de Ventas x Producto */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {/* Filtro Producto */}
                            <div className="space-y-1 lg:col-span-2">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Package className="w-3.5 h-3.5 text-primary" /> Producto
                                </label>
                                <SearchableSelect 
                                    value={filtroVentaProdProducto} 
                                    onChange={(val) => { setFiltroVentaProdProducto(String(val || '')); setVentaProdCurrentPage(1); }} 
                                    options={productOptionsVentaProd}
                                    placeholder="Todos los Productos"
                                    searchPlaceholder="Buscar por código o nombre..."
                                />
                            </div>

                            {/* Filtro Marca */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5 text-primary" /> Marca
                                </label>
                                <select 
                                    value={filtroVentaProdMarca} 
                                    onChange={(e) => setFiltroVentaProdMarca(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todas las Marcas</option>
                                    {marcasList?.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro Vendedor */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-primary" /> Vendedor
                                </label>
                                <MultiSelectVendedores
                                    vendedores={vendedoresList}
                                    selectedVendedores={filtroVentaProdVendedores}
                                    onChange={(vals) => {
                                        setFiltroVentaProdVendedores(vals);
                                        setVentaProdCurrentPage(1);
                                    }}
                                    isRestrictedVendor={isRestrictedVendor}
                                    userPersonal={userPersonal}
                                    placeholder="Todos los Vendedores"
                                />
                            </div>

                            {/* Filtro Fecha Desde */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                                </label>
                                <input 
                                    type="date" 
                                    value={ventaProdFechaDesde} 
                                    onChange={(e) => setVentaProdFechaDesde(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>

                            {/* Filtro Fecha Hasta + Botón Limpiar */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={ventaProdFechaHasta} 
                                        onChange={(e) => setVentaProdFechaHasta(e.target.value)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                    {hasVentaProdActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearVentaProdFilters}
                                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 h-[38px]"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-3.5 h-3.5" /> Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fila de Búsqueda y Filtro de Forma de Pago */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar producto, cliente, nro venta, marca..." 
                                    value={ventaProdSearchTerm} 
                                    onChange={(e) => setVentaProdSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                                {ventaProdSearchTerm && (
                                    <button onClick={() => setVentaProdSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Forma de Pago:</label>
                                <select 
                                    value={filtroVentaProdTipoPago} 
                                    onChange={(e) => setFiltroVentaProdTipoPago(e.target.value)} 
                                    className="p-2 border rounded-lg bg-background text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todas las Formas</option>
                                    <option value="CONTADO">Al Contado</option>
                                    <option value="CREDITO">A Crédito</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tabla Ventas por Producto */}
                    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[1250px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-10 text-center">#</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ciudad (Sucursal)</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro Venta</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marca</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Forma</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Cant.</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Precio Venta</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Precio Compra</th>
                                        <th className="p-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Ganancia</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingVentas || loadingProducts ? (
                                        <tr>
                                            <td colSpan={13} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando reporte de ventas por producto...
                                            </td>
                                        </tr>
                                    ) : paginatedVentasPorProducto.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron ventas registradas para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedVentasPorProducto.map((item, index) => {
                                            const isPositiva = item.gananciaUnitaria >= 0;
                                            return (
                                                <tr key={item.id} className="hover:bg-accent/30 transition-colors group">
                                                    <td className="p-3.5 text-xs font-mono text-muted-foreground text-center">
                                                        {(ventaProdCurrentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="p-3.5 text-xs font-medium whitespace-nowrap">
                                                        {item.fechaFormatted}
                                                    </td>
                                                    <td className="p-3.5 text-xs text-muted-foreground">
                                                        <div className="font-medium text-foreground">{item.ciudadSucursal}</div>
                                                    </td>
                                                    <td className="p-3.5 text-xs">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingDetalleVenta(item.rawVenta)}
                                                            className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                            title="Ver venta completa"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            {item.nroVenta}
                                                        </button>
                                                    </td>
                                                    <td className="p-3.5 text-xs">
                                                        <div className="flex items-center gap-1 font-bold text-foreground max-w-[180px] truncate" title={item.clienteTienda}>
                                                            <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                            <span className="truncate">{item.clienteTienda}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3.5 text-xs text-muted-foreground max-w-[140px] truncate" title={item.vendedorNombre}>
                                                        {item.vendedorNombre}
                                                    </td>
                                                    <td className="p-3.5 text-xs font-semibold text-foreground">
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground font-bold">
                                                            {item.marcaNombre}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-xs max-w-[240px]">
                                                        <div className="font-medium text-foreground truncate" title={item.productoNombre}>
                                                            {item.productoNombre}
                                                        </div>
                                                        {item.productoCodigo !== '-' && (
                                                            <div className="text-[10px] text-muted-foreground font-mono">
                                                                {item.productoCodigo}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-3.5 text-xs text-center">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                            item.formaPago === 'CREDITO' 
                                                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' 
                                                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                                        }`}>
                                                            {item.formaPago}
                                                        </span>
                                                    </td>
                                                    <td className="p-3.5 text-xs font-mono font-bold text-center text-foreground">
                                                        {item.cantidad}
                                                    </td>
                                                    <td className="p-3.5 text-xs font-mono font-semibold text-right text-foreground">
                                                        {formatCurrency(item.precioVenta)}
                                                    </td>
                                                    <td className="p-3.5 text-xs font-mono text-right text-muted-foreground">
                                                        {formatCurrency(item.precioCompra)}
                                                    </td>
                                                    <td className="p-3.5 text-xs font-mono text-right">
                                                        <div className={`font-bold ${isPositiva ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                                            {formatCurrency(item.gananciaUnitaria)}
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground" title="Ganancia Total = Ganancia Unit. x Cantidad">
                                                            Tot: {formatCurrency(item.gananciaTotal)}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                                {/* Fila de Totales */}
                                {ventasPorProductoItems.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-muted/50 font-bold border-t text-xs">
                                            <td colSpan={9} className="p-3.5 text-left uppercase tracking-wider text-foreground font-black">
                                                TOTALES ({ventasPorProductoItems.length} registros)
                                            </td>
                                            <td className="p-3.5 text-center font-mono font-black text-foreground">
                                                {totalesVentasPorProducto.totalCantidad.toLocaleString('es-BO')}
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-black text-foreground">
                                                {formatCurrency(totalesVentasPorProducto.totalPrecioVentaUnitario)}
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-black text-muted-foreground">
                                                {formatCurrency(totalesVentasPorProducto.totalPrecioCompraUnitario)}
                                            </td>
                                            <td className="p-3.5 text-right font-mono font-black text-purple-600 dark:text-purple-400">
                                                <div className="font-bold">
                                                    {formatCurrency(totalesVentasPorProducto.totalGananciaUnitaria)}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground font-normal" title="Ganancia Total = Ganancia Unit. x Cantidad">
                                                    Tot: {formatCurrency(totalesVentasPorProducto.totalGanancia)}
                                                </div>
                                            </td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>

                        {/* Paginación */}
                        {totalPagesVentasProducto > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((ventaProdCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(ventaProdCurrentPage * itemsPerPage, ventasPorProductoItems.length)} de {ventasPorProductoItems.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setVentaProdCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={ventaProdCurrentPage === 1}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium px-2">
                                        Página {ventaProdCurrentPage} de {totalPagesVentasProducto}
                                    </span>
                                    <button 
                                        onClick={() => setVentaProdCurrentPage(p => Math.min(totalPagesVentasProducto, p + 1))}
                                        disabled={ventaProdCurrentPage === totalPagesVentasProducto}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========================================== */}
            {/* TAB: COBRANZAS */}
            {/* ========================================== */}
            {activeTab === 'cobranzas' && (
                <>
                    {/* Filtros de Cobranzas */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Cliente
                                </label>
                                <SearchableSelect 
                                    value={filtroCobranzaCliente} 
                                    onChange={(val) => { setFiltroCobranzaCliente(String(val || '')); setCobranzaCurrentPage(1); }} 
                                    options={clientFilterOptions}
                                    placeholder="Todos los Clientes"
                                    searchPlaceholder="Buscar cliente..."
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Vendedor
                                </label>
                                <MultiSelectVendedores
                                    vendedores={vendedoresList}
                                    selectedVendedores={filtroCobranzaVendedores}
                                    onChange={(vals) => {
                                        setFiltroCobranzaVendedores(vals);
                                        setCobranzaCurrentPage(1);
                                    }}
                                    isRestrictedVendor={isRestrictedVendor}
                                    userPersonal={userPersonal}
                                    placeholder="Todos los Vendedores"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <CreditCard className="w-3.5 h-3.5 text-primary" /> Estado
                                </label>
                                <select 
                                    value={filtroCobranzaEstado} 
                                    onChange={(e) => setFiltroCobranzaEstado(e.target.value as any)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="ACTIVO">Activos</option>
                                    <option value="ANULADO">Anulados</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" /> Método de Pago
                                </label>
                                <select 
                                    value={filtroCobranzaMetodo} 
                                    onChange={(e) => setFiltroCobranzaMetodo(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos los Métodos</option>
                                    {metodosPagoUnicos.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                                </label>
                                <input 
                                    type="date" 
                                    value={cobranzaFechaDesde} 
                                    onChange={(e) => setCobranzaFechaDesde(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={cobranzaFechaHasta} 
                                        onChange={(e) => setCobranzaFechaHasta(e.target.value)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                    {hasCobranzaActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearCobranzaFilters}
                                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 h-[38px]"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-3.5 h-3.5" /> Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar cliente, nro de venta, ref..." 
                                    value={cobranzaSearchTerm} 
                                    onChange={(e) => setCobranzaSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                                {cobranzaSearchTerm && (
                                    <button onClick={() => setCobranzaSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
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
                                        {!filtroCobranzaCliente && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cliente</th>}
                                        {filtroCobranzaVendedores.length !== 1 && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nota de Venta</th>
                                        {(!filtroCobranzaMetodo || filtroCobranzaMetodo === 'TODOS') && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pago</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Comprobante</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Venta</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Monto Pagado</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo Pendiente</th>
                                        {filtroCobranzaEstado === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingCobranzas ? (
                                        <tr>
                                            <td colSpan={13} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando cobranzas de clientes...
                                            </td>
                                        </tr>
                                    ) : paginatedCobranzas.length === 0 ? (
                                        <tr>
                                            <td colSpan={13} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron cobranzas registradas para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCobranzas.map((p, index) => {
                                            const cliLabel = p.cliente?.persona 
                                                ? `${p.cliente.persona.nombres} ${p.cliente.persona.apellidos}` 
                                                : ((p.cliente as any)?.razonSocial || 'Cliente');
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
                                                        {(cobranzaCurrentPage - 1) * itemsPerPage + index + 1}
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
                                                    {!filtroCobranzaCliente && (
                                                        <td className="p-4 text-sm font-semibold text-foreground">
                                                            <div className="flex flex-col">
                                                                {p.cliente?.nombreTienda ? (
                                                                    <span className="font-bold text-foreground flex items-center gap-1">
                                                                        <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                        {p.cliente.nombreTienda}
                                                                    </span>
                                                                ) : (
                                                                    <span>{getClientPersonName(p.cliente)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {filtroCobranzaVendedores.length !== 1 && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {vendedorLabel}
                                                        </td>
                                                    )}
                                                    <td className="p-4 max-w-[180px]">
                                                        {notaVentaLabel ? (
                                                            <span className="text-xs text-muted-foreground line-clamp-2" title={notaVentaLabel}>
                                                                {notaVentaLabel}
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground/50 font-mono">-</span>
                                                        )}
                                                    </td>
                                                    {(!filtroCobranzaMetodo || filtroCobranzaMetodo === 'TODOS') && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {p.metodoPago || 'Efectivo'}
                                                        </td>
                                                    )}
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
                                                    {filtroCobranzaEstado === 'TODOS' && (
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
                                                                    Parcial
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación Cobranzas */}
                        {totalPagesCobranzas > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((cobranzaCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(cobranzaCurrentPage * itemsPerPage, filteredCobranzas.length)} de {filteredCobranzas.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCobranzaCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={cobranzaCurrentPage === 1}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium px-2">
                                        Página {cobranzaCurrentPage} de {totalPagesCobranzas}
                                    </span>
                                    <button 
                                        onClick={() => setCobranzaCurrentPage(p => Math.min(totalPagesCobranzas, p + 1))}
                                        disabled={cobranzaCurrentPage === totalPagesCobranzas}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========================================== */}
            {/* TAB: COMPRAS */}
            {/* ========================================== */}
            {activeTab === 'compras' && (
                <>
                    {/* Filtros de Compras */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Proveedor
                                </label>
                                <select 
                                    value={filtroCompraProveedor} 
                                    onChange={(e) => setFiltroCompraProveedor(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Todos los Proveedores</option>
                                    {proveedoresUnicos.map(p => {
                                        const nombre = p.empresa || (p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : 'Proveedor');
                                        return <option key={p.id} value={p.id}>{nombre}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" /> Moneda
                                </label>
                                <select 
                                    value={filtroCompraMoneda} 
                                    onChange={(e) => setFiltroCompraMoneda(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todas las Monedas</option>
                                    <option value="BOB">BOB (Bolivianos)</option>
                                    <option value="USD">USD (Dólares)</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Tag className="w-3.5 h-3.5 text-primary" /> Estado
                                </label>
                                <select 
                                    value={filtroCompraEstado} 
                                    onChange={(e) => setFiltroCompraEstado(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos los Estados</option>
                                    <option value={EstadoNota.CONFIRMADA}>Confirmadas</option>
                                    <option value={EstadoNota.PENDIENTE}>Pendientes</option>
                                    <option value={EstadoNota.ANULADA}>Anuladas</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                                </label>
                                <input 
                                    type="date" 
                                    value={compraFechaDesde} 
                                    onChange={(e) => setCompraFechaDesde(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={compraFechaHasta} 
                                        onChange={(e) => setCompraFechaHasta(e.target.value)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                    {hasCompraActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearCompraFilters}
                                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 h-[38px]"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-3.5 h-3.5" /> Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar nro de compra, proveedor..." 
                                    value={compraSearchTerm} 
                                    onChange={(e) => setCompraSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                                {compraSearchTerm && (
                                    <button onClick={() => setCompraSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Compras */}
                    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[950px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Compra</th>
                                        {!filtroCompraProveedor && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedor</th>}
                                        {!selectedSucursal && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sucursal</th>}
                                        {filtroCompraMoneda === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Moneda</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">SubTotal</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Descuento</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total</th>
                                        {filtroCompraEstado === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingCompras ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando reporte de compras...
                                            </td>
                                        </tr>
                                    ) : paginatedCompras.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron compras registradas para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedCompras.map((p, index) => {
                                            const subTotalCalc = (Number(p.total) || 0) + (Number(p.descuento) || 0);
                                            const descCalc = Number(p.descuento) || 0;
                                            const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.trim() : '';

                                            return (
                                                <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                                        {(compraCurrentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="p-4 text-sm font-medium">
                                                        {p.fecha ? format(new Date(p.fecha), 'dd/MM/yyyy') : '-'}
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => setViewingDetalleCompra(p)}
                                                            className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                            title="Ver detalle y productos de la compra"
                                                        >
                                                            <Eye className="w-3 h-3" />
                                                            {p.numero || 'S/N'}
                                                        </button>
                                                    </td>
                                                    {!filtroCompraProveedor && (
                                                        <td className="p-4 text-sm">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground">{p.proveedor?.empresa || 'Proveedor'}</span>
                                                                {provPersona && (
                                                                    <span className="text-[11px] text-muted-foreground">{provPersona}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {!selectedSucursal && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            <div className="font-medium text-foreground">{p.sucursal?.nombre || (p.almacen as any)?.nombre || '-'}</div>
                                                            {((p.sucursal as any)?.ciudad?.nombre || (p.almacen as any)?.ciudad?.nombre) && (
                                                                <span className="text-[10px] text-muted-foreground block">
                                                                    {(p.sucursal as any)?.ciudad?.nombre || (p.almacen as any)?.ciudad?.nombre}
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    {filtroCompraMoneda === 'TODOS' && (
                                                        <td className="p-4 text-center">
                                                            <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-bold text-muted-foreground">
                                                                {p.moneda || 'BOB'}
                                                            </span>
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-sm font-medium text-right text-muted-foreground">
                                                        {formatCurrency(subTotalCalc, p.moneda || 'BOB')}
                                                    </td>
                                                    <td className="p-4 text-sm font-medium text-right text-red-600 dark:text-red-400">
                                                        {descCalc > 0 ? formatCurrency(descCalc, p.moneda || 'BOB') : '-'}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-primary text-right">
                                                        {formatCurrency(p.total, p.moneda || 'BOB')}
                                                    </td>
                                                    {filtroCompraEstado === 'TODOS' && (
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                                p.estado === EstadoNota.CONFIRMADA
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : p.estado === EstadoNota.PENDIENTE
                                                                    ? 'bg-yellow-100 text-yellow-700'
                                                                    : 'bg-red-100 text-red-700'
                                                            }`}>
                                                                {p.estado}
                                                            </span>
                                                        </td>
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación Compras */}
                        {totalPagesCompras > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((compraCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(compraCurrentPage * itemsPerPage, filteredCompras.length)} de {filteredCompras.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setCompraCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={compraCurrentPage === 1}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium px-2">
                                        Página {compraCurrentPage} de {totalPagesCompras}
                                    </span>
                                    <button 
                                        onClick={() => setCompraCurrentPage(p => Math.min(totalPagesCompras, p + 1))}
                                        disabled={compraCurrentPage === totalPagesCompras}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ========================================== */}
            {/* TAB: PAGOS A PROVEEDORES */}
            {/* ========================================== */}
            {activeTab === 'pagos-proveedores' && (
                <>
                    {/* Filtros de Pagos a Proveedores */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Proveedor
                                </label>
                                <select 
                                    value={filtroPagoProvProveedor} 
                                    onChange={(e) => setFiltroPagoProvProveedor(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Todos los Proveedores</option>
                                    {proveedoresUnicos.map(p => {
                                        const nombre = p.empresa || (p.persona ? `${p.persona.nombres} ${p.persona.apellidos}` : 'Proveedor');
                                        return <option key={p.id} value={p.id}>{nombre}</option>;
                                    })}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <CreditCard className="w-3.5 h-3.5 text-primary" /> Estado
                                </label>
                                <select 
                                    value={filtroPagoProvEstado} 
                                    onChange={(e) => setFiltroPagoProvEstado(e.target.value as any)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="ACTIVO">Activos</option>
                                    <option value="ANULADO">Anulados</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" /> Método de Pago
                                </label>
                                <select 
                                    value={filtroPagoProvMetodo} 
                                    onChange={(e) => setFiltroPagoProvMetodo(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos los Métodos</option>
                                    {metodosPagoProvUnicos.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Desde
                                </label>
                                <input 
                                    type="date" 
                                    value={pagoProvFechaDesde} 
                                    onChange={(e) => setPagoProvFechaDesde(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Hasta
                                </label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="date" 
                                        value={pagoProvFechaHasta} 
                                        onChange={(e) => setPagoProvFechaHasta(e.target.value)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                    />
                                    {hasPagoProvActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearPagoProvFilters}
                                            className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 h-[38px]"
                                            title="Limpiar filtros"
                                        >
                                            <X className="w-3.5 h-3.5" /> Limpiar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar proveedor, nro de compra, ref..." 
                                    value={pagoProvSearchTerm} 
                                    onChange={(e) => setPagoProvSearchTerm(e.target.value)} 
                                    className="w-full pl-9 pr-8 p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20" 
                                />
                                {pagoProvSearchTerm && (
                                    <button onClick={() => setPagoProvSearchTerm('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-accent rounded text-muted-foreground">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Pagos a Proveedores */}
                    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nro. Compra</th>
                                        {!filtroPagoProvProveedor && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proveedor</th>}
                                        {(!filtroPagoProvMetodo || filtroPagoProvMetodo === 'TODOS') && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Método de Pago</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Referencia</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Comprobante</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Total Compra</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Monto Pagado</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Saldo Pendiente</th>
                                        {filtroPagoProvEstado === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingPagosProveedores ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando pagos a proveedores...
                                            </td>
                                        </tr>
                                    ) : paginatedPagosProveedores.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron pagos a proveedores registrados para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedPagosProveedores.map((p, index) => {
                                            const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres} ${p.proveedor.persona.apellidos}`.trim() : '';
                                            const provNombre = p.proveedor?.empresa ? `${p.proveedor.empresa}${provPersona ? ` (${provPersona})` : ''}` : (provPersona || 'Proveedor');
                                            const isUSD = p.moneda === 'USD';
                                            const simbolo = isUSD ? '$us' : 'Bs.';
                                            const compraMoneda = p.nota?.moneda || 'BOB';
                                            const esMonedaCruzada = p.moneda !== compraMoneda;
                                            const saldoSimbolo = compraMoneda === 'USD' ? '$us' : 'Bs.';
                                            const saldoNota = Number(p.nota?.saldo || 0);

                                            return (
                                                <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                                        {(pagoProvCurrentPage - 1) * itemsPerPage + index + 1}
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
                                                    {!filtroPagoProvProveedor && (
                                                        <td className="p-4 text-sm font-semibold text-foreground">
                                                            {provNombre}
                                                        </td>
                                                    )}
                                                    {(!filtroPagoProvMetodo || filtroPagoProvMetodo === 'TODOS') && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {p.metodoPago || 'Efectivo'}
                                                        </td>
                                                    )}
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
                                                            <span className="text-sm font-semibold text-foreground">
                                                                {saldoSimbolo} {Number(p.nota.total || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                            </span>
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
                                                    {filtroPagoProvEstado === 'TODOS' && (
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
                                                    )}
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación Pagos a Proveedores */}
                        {totalPagesPagosProveedores > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((pagoProvCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(pagoProvCurrentPage * itemsPerPage, filteredPagosProveedores.length)} de {filteredPagosProveedores.length}
                                </span>
                                <div className="flex items-center gap-2">
                                    <button 
                                        onClick={() => setPagoProvCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={pagoProvCurrentPage === 1}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-medium px-2">
                                        Página {pagoProvCurrentPage} de {totalPagesPagosProveedores}
                                    </span>
                                    <button 
                                        onClick={() => setPagoProvCurrentPage(p => Math.min(totalPagesPagosProveedores, p + 1))}
                                        disabled={pagoProvCurrentPage === totalPagesPagosProveedores}
                                        className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 disabled:hover:bg-transparent transition-colors cursor-pointer"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Modal para ver comprobante en grande */}
            <Modal
                isOpen={!!viewingComprobante}
                onClose={() => setViewingComprobante(null)}
                title="Comprobante de Pago"
            >
                <div className="flex justify-center p-2">
                    {viewingComprobante && (
                        <img 
                            src={getFileUrl(viewingComprobante)} 
                            alt="Comprobante de Pago" 
                            className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-md" 
                        />
                    )}
                </div>
            </Modal>

            {/* Modal de Detalle de Venta */}
            <DetalleVentaModal
                isOpen={!!viewingDetalleVenta}
                onClose={() => setViewingDetalleVenta(null)}
                nota={viewingDetalleVenta}
            />

            {/* Modal de Detalle de Compra */}
            <Modal
                isOpen={!!viewingDetalleCompra}
                onClose={() => setViewingDetalleCompra(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Package className="w-5 h-5" />
                        Detalle de Compra: {viewingDetalleCompra?.numero || 'S/N'}
                    </span>
                }
            >
                {viewingDetalleCompra && (
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-muted/30 rounded-xl border">
                            <div>
                                <span className="text-xs text-muted-foreground block">Proveedor:</span>
                                <span className="font-semibold">{viewingDetalleCompra.proveedor?.empresa || 'Proveedor'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Fecha:</span>
                                <span className="font-semibold">{viewingDetalleCompra.fecha ? format(new Date(viewingDetalleCompra.fecha), 'dd/MM/yyyy') : '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Sucursal:</span>
                                <span className="font-semibold">{viewingDetalleCompra.sucursal?.nombre || '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Moneda:</span>
                                <span className="font-bold">{viewingDetalleCompra.moneda || 'BOB'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-muted-foreground block">Estado:</span>
                                <span className="font-bold uppercase text-primary">{viewingDetalleCompra.estado}</span>
                            </div>
                            {viewingDetalleCompra.observaciones && (
                                <div className="sm:col-span-3">
                                    <span className="text-xs text-muted-foreground block">Observaciones:</span>
                                    <span className="italic">{viewingDetalleCompra.observaciones}</span>
                                </div>
                            )}
                        </div>

                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Lote</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Venc.</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Cant.</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">P. Unit</th>
                                        <th className="p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {viewingDetalleCompra.detalles?.map((d: any, i: number) => (
                                        <tr key={i} className="hover:bg-accent/30">
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{d.producto?.nombre}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">{d.producto?.codigo}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-center text-xs font-mono">{d.numeroLote || '-'}</td>
                                            <td className="p-3 text-center text-xs">{d.fechaVencimiento ? d.fechaVencimiento.split('T')[0].split('-').reverse().join('/') : '-'}</td>
                                            <td className="p-3 text-center font-bold">{d.cantidad}</td>
                                            <td className="p-3 text-right text-muted-foreground">{formatCurrency(d.precioUnitario, viewingDetalleCompra.moneda || 'BOB')}</td>
                                            <td className="p-3 text-right font-bold">{formatCurrency(d.subtotal, viewingDetalleCompra.moneda || 'BOB')}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex justify-end p-2">
                            <div className="text-right space-y-1">
                                <div className="text-xs text-muted-foreground">
                                    SubTotal: <span className="font-medium">{formatCurrency((Number(viewingDetalleCompra.total) || 0) + (Number(viewingDetalleCompra.descuento) || 0), viewingDetalleCompra.moneda || 'BOB')}</span>
                                </div>
                                {Number(viewingDetalleCompra.descuento) > 0 && (
                                    <div className="text-xs text-red-600">
                                        Descuento: <span className="font-medium">-{formatCurrency(viewingDetalleCompra.descuento, viewingDetalleCompra.moneda || 'BOB')}</span>
                                    </div>
                                )}
                                <div className="text-base font-bold text-primary">
                                    Total: {formatCurrency(viewingDetalleCompra.total, viewingDetalleCompra.moneda || 'BOB')}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
                </>
            )}
        </div>
    );
};

export default ReportesPage;
