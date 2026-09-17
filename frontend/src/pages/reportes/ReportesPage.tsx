import { getFileUrl } from '../../api/apiClient';
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cobranzaService } from '../../api/cobranzaService';
import { salesService } from '../../api/salesService';
import { purchaseService, EstadoNota } from '../../api/purchaseService';
import { pagoProveedorService } from '../../api/pagoProveedorService';
import { productService, type Producto } from '../../api/productService';
import { categoryService } from '../../api/categoryService';
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
import { useFilters } from '../../context/FilterContext';
import { 
    Search, Printer, FileText, FileSpreadsheet,
    Wallet, ShoppingCart, ShoppingBag, PieChart as PieChartIcon, ChevronLeft, ChevronRight,
    Users, CreditCard, DollarSign, Calendar, X, Eye, User, Building2, Tag, Receipt, Package, HandCoins,
    TrendingUp, BarChart3, Activity, Award, Percent, Boxes, ImageIcon, Layers, Store
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
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { getClientDisplayName, getClientPersonName, getClientStoreName } from '../../utils/clientUtils';
import { format, subDays, startOfMonth, startOfYear } from 'date-fns';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const ReportesPage: React.FC = () => {
    const { selectedSucursal, selectedCiudad } = useFilters();
    const [activeTab, setActiveTab] = useState<'estadisticas' | 'productos' | 'ventas' | 'cobranzas' | 'compras' | 'pagos-proveedores'>('estadisticas');

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
    const [filtroProdCategoria, setFiltroProdCategoria] = useState<string>('');
    const [filtroProdMarca, setFiltroProdMarca] = useState<string>('');
    const [filtroProdGrupo, setFiltroProdGrupo] = useState<string>('');
    const [filtroProdEstado, setFiltroProdEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('TODOS');
    const [prodSearchTerm, setProdSearchTerm] = useState('');
    const [prodCurrentPage, setProdCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: VENTAS
    // ==========================================
    const [filtroVentaCliente, setFiltroVentaCliente] = useState<string>('');
    const [filtroVentaVendedor, setFiltroVentaVendedor] = useState<string>('TODOS');
    const [filtroVentaTipoDoc, setFiltroVentaTipoDoc] = useState<string>('TODOS');
    const [filtroVentaEstado, setFiltroVentaEstado] = useState<string>('TODOS');
    const [ventaFechaDesde, setVentaFechaDesde] = useState<string>('');
    const [ventaFechaHasta, setVentaFechaHasta] = useState<string>('');
    const [ventaSearchTerm, setVentaSearchTerm] = useState('');
    const [ventaCurrentPage, setVentaCurrentPage] = useState(1);

    // ==========================================
    // ESTADOS: COBRANZAS
    // ==========================================
    const [filtroCobranzaCliente, setFiltroCobranzaCliente] = useState<string>('');
    const [filtroCobranzaVendedor, setFiltroCobranzaVendedor] = useState<string>('TODOS');
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
        enabled: activeTab === 'productos' || activeTab === 'estadisticas',
    });

    const { data: categoriesList } = useQuery({
        queryKey: ['categoriesListReportes'],
        queryFn: categoryService.getAll,
        enabled: activeTab === 'productos',
    });

    const { data: marcasList } = useQuery({
        queryKey: ['marcasListReportes'],
        queryFn: marcaService.getAll,
        enabled: activeTab === 'productos',
    });

    const { data: gruposList } = useQuery({
        queryKey: ['gruposListReportes'],
        queryFn: grupoService.getAll,
        enabled: activeTab === 'productos',
    });

    const { data: ventasList, isLoading: loadingVentas } = useQuery({
        queryKey: ['ventasListReportes'],
        queryFn: salesService.getAll,
        enabled: activeTab === 'ventas' || activeTab === 'estadisticas',
    });

    const { data: pagosList, isLoading: loadingCobranzas } = useQuery({
        queryKey: ['cobranzasListReportes'],
        queryFn: cobranzaService.getAll,
        enabled: activeTab === 'cobranzas' || activeTab === 'estadisticas',
    });

    const { data: comprasList, isLoading: loadingCompras } = useQuery({
        queryKey: ['comprasListReportes'],
        queryFn: purchaseService.getAll,
        enabled: activeTab === 'compras' || activeTab === 'pagos-proveedores' || activeTab === 'estadisticas',
    });

    const { data: personalList } = useQuery({
        queryKey: ['personalListReportes'],
        queryFn: personalService.getAll,
        enabled: activeTab === 'ventas' || activeTab === 'cobranzas' || activeTab === 'estadisticas',
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
        return personalList.filter(p => p.cargo === 'VENDEDOR' && p.activo);
    }, [personalList]);

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
    // LÓGICA PRODUCTOS
    // ==========================================
    const hasProdActiveFilters = Boolean(
        filtroProdCategoria || filtroProdMarca || 
        filtroProdGrupo || filtroProdEstado !== 'TODOS' || prodSearchTerm
    );

    const handleClearProdFilters = () => {
        setFiltroProdCategoria('');
        setFiltroProdMarca('');
        setFiltroProdGrupo('');
        setFiltroProdEstado('TODOS');
        setProdSearchTerm('');
    };

    const filteredProductos = useMemo(() => {
        if (!productsList) return [];
        let filtered = productsList;

        if (filtroProdCategoria) filtered = filtered.filter(p => String(p.categoria?.id || p.categoriaId) === filtroProdCategoria);
        if (filtroProdMarca) filtered = filtered.filter(p => String(p.marca?.id || p.marcaId) === filtroProdMarca);
        if (filtroProdGrupo) filtered = filtered.filter(p => String(p.grupo?.id || p.grupoId) === filtroProdGrupo);
        if (filtroProdEstado === 'ACTIVO') filtered = filtered.filter(p => p.activo);
        else if (filtroProdEstado === 'INACTIVO') filtered = filtered.filter(p => !p.activo);

        if (prodSearchTerm.trim()) {
            const s = prodSearchTerm.toLowerCase();
            filtered = filtered.filter(p => 
                p.codigo.toLowerCase().includes(s) || 
                p.nombre.toLowerCase().includes(s) || 
                (p.descripcion && p.descripcion.toLowerCase().includes(s))
            );
        }

        return filtered;
    }, [productsList, filtroProdCategoria, filtroProdMarca, filtroProdGrupo, filtroProdEstado, prodSearchTerm]);

    const exportColumnsProductos = [
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Nombre', dataKey: 'nombre' },
        { header: 'Marca', dataKey: 'marcaNombre' },
        { header: 'Categoría', dataKey: 'categoriaNombre' },
        { header: 'Grupo', dataKey: 'grupoNombre' },
        { header: 'Precio Compra', dataKey: 'precioCompraFormatted' },
        { header: 'Precio Venta', dataKey: 'precioVentaFormatted' },
        { header: 'Margen (%)', dataKey: 'margenFormatted' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const getExportColumnsProductos = () => {
        let cols = [...exportColumnsProductos];
        if (filtroProdMarca) cols = cols.filter(c => c.dataKey !== 'marcaNombre');
        if (filtroProdCategoria) cols = cols.filter(c => c.dataKey !== 'categoriaNombre');
        if (filtroProdGrupo) cols = cols.filter(c => c.dataKey !== 'grupoNombre');
        if (filtroProdEstado !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const mappedExportDataProductos = useMemo(() => {
        return filteredProductos.map(p => {
            const pCompra = Number(p.precioCompra) || 0;
            const pVenta = Number(p.precioVenta) || 0;
            const margenPct = pVenta > 0 ? (((pVenta - pCompra) / pVenta) * 100).toFixed(1) + '%' : '0%';

            return {
                id: p.id,
                codigo: p.codigo,
                nombre: p.nombre,
                marcaNombre: p.marca?.nombre || '-',
                categoriaNombre: p.categoria?.nombre || '-',
                grupoNombre: p.grupo?.nombre || '-',
                precioCompraFormatted: formatCurrency(pCompra),
                precioVentaFormatted: formatCurrency(pVenta),
                margenFormatted: margenPct,
                estado: p.activo ? 'Activo' : 'Inactivo'
            };
        });
    }, [filteredProductos]);

    const getFiltersTextProductos = () => {
        const texts: string[] = [];
        if (filtroProdCategoria) {
            const c = categoriesList?.find(cat => String(cat.id) === filtroProdCategoria);
            if (c) texts.push(`Categoría: ${c.nombre}`);
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
        return texts.join(' | ') || 'Todos los productos';
    };

    const totalPagesProductos = Math.ceil(filteredProductos.length / itemsPerPage) || 1;
    const paginatedProductos = useMemo(() => {
        const start = (prodCurrentPage - 1) * itemsPerPage;
        return filteredProductos.slice(start, start + itemsPerPage);
    }, [filteredProductos, prodCurrentPage]);

    React.useEffect(() => setProdCurrentPage(1), [
        filtroProdCategoria, filtroProdMarca, filtroProdGrupo, filtroProdEstado, prodSearchTerm
    ]);

    // ==========================================
    // LÓGICA VENTAS
    // ==========================================
    const hasVentaActiveFilters = Boolean(
        filtroVentaCliente || filtroVentaVendedor !== 'TODOS' || 
        filtroVentaTipoDoc !== 'TODOS' || filtroVentaEstado !== 'TODOS' || 
        ventaFechaDesde || ventaFechaHasta || ventaSearchTerm
    );

    const handleClearVentaFilters = () => {
        setFiltroVentaCliente('');
        setFiltroVentaVendedor('TODOS');
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
        if (filtroVentaVendedor !== 'TODOS') filtered = filtered.filter(p => p.vendedor?.id === Number(filtroVentaVendedor));
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
    }, [ventasList, selectedSucursal, selectedCiudad, filtroVentaCliente, filtroVentaVendedor, filtroVentaTipoDoc, filtroVentaEstado, ventaFechaDesde, ventaFechaHasta, ventaSearchTerm]);

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
        if (filtroVentaVendedor !== 'TODOS') {
            const v = vendedoresList.find(ve => String(ve.id) === filtroVentaVendedor);
            if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
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
        if (filtroVentaVendedor !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'vendedorNombre');
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
        ventaSearchTerm, filtroVentaCliente, filtroVentaVendedor, 
        filtroVentaTipoDoc, filtroVentaEstado, ventaFechaDesde, ventaFechaHasta
    ]);

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
        filtroCobranzaCliente || filtroCobranzaVendedor !== 'TODOS' || 
        filtroCobranzaEstado !== 'TODOS' || filtroCobranzaMetodo !== 'TODOS' || 
        cobranzaFechaDesde || cobranzaFechaHasta || cobranzaSearchTerm
    );

    const handleClearCobranzaFilters = () => {
        setFiltroCobranzaCliente('');
        setFiltroCobranzaVendedor('TODOS');
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
        if (filtroCobranzaVendedor !== 'TODOS') {
            filtered = filtered.filter(p => {
                const vendedorId = p.nota?.vendedor?.id || p.nota?.usuario?.personal?.id || p.nota?.usuario?.id;
                return p.nota?.vendedor?.id === Number(filtroCobranzaVendedor) || String(vendedorId) === filtroCobranzaVendedor;
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
    }, [pagosList, selectedSucursal, selectedCiudad, cobranzaSearchTerm, filtroCobranzaCliente, filtroCobranzaVendedor, filtroCobranzaEstado, filtroCobranzaMetodo, cobranzaFechaDesde, cobranzaFechaHasta]);

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
        if (filtroCobranzaVendedor !== 'TODOS') {
            const v = vendedoresList.find(ve => String(ve.id) === filtroCobranzaVendedor);
            if (v) texts.push(`Vendedor: ${v.nombres} ${v.apellidos}`);
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
        if (filtroCobranzaVendedor !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'vendedorNombre');
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
        cobranzaSearchTerm, filtroCobranzaCliente, filtroCobranzaVendedor, filtroCobranzaEstado, 
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
            printData('Reporte de Catálogo de Productos', getExportColumnsProductos(), mappedExportDataProductos, getFiltersTextProductos());
        } else if (activeTab === 'ventas') {
            if (!mappedExportDataVentas.length) return;
            printData('Reporte de Ventas Realizadas', getExportColumnsVentas(), mappedExportDataVentas, getFiltersTextVentas());
        } else if (activeTab === 'cobranzas') {
            if (!mappedExportDataCobranzas.length) return;
            printData('Reporte de Cobranzas / Pagos de Clientes', getExportColumnsCobranzas(), mappedExportDataCobranzas, getFiltersTextCobranzas());
        } else if (activeTab === 'compras') {
            if (!mappedExportDataCompras.length) return;
            printData('Reporte de Compras Realizadas', getExportColumnsCompras(), mappedExportDataCompras, getFiltersTextCompras());
        } else if (activeTab === 'pagos-proveedores') {
            if (!mappedExportDataPagosProveedores.length) return;
            printData('Reporte de Pagos a Proveedores', getExportColumnsPagosProveedores(), mappedExportDataPagosProveedores, getFiltersTextPagosProveedores());
        }
    };

    const handleExportPDF = () => {
        if (activeTab === 'productos') {
            if (!mappedExportDataProductos.length) return;
            exportToPDF('Reporte de Catálogo de Productos', getExportColumnsProductos(), mappedExportDataProductos, 'productos_reporte', getFiltersTextProductos());
        } else if (activeTab === 'ventas') {
            if (!mappedExportDataVentas.length) return;
            exportToPDF('Reporte de Ventas Realizadas', getExportColumnsVentas(), mappedExportDataVentas, 'ventas_reporte', getFiltersTextVentas());
        } else if (activeTab === 'cobranzas') {
            if (!mappedExportDataCobranzas.length) return;
            exportToPDF('Reporte de Cobranzas / Pagos de Clientes', getExportColumnsCobranzas(), mappedExportDataCobranzas, 'cobranzas_reporte', getFiltersTextCobranzas());
        } else if (activeTab === 'compras') {
            if (!mappedExportDataCompras.length) return;
            exportToPDF('Reporte de Compras Realizadas', getExportColumnsCompras(), mappedExportDataCompras, 'compras_reporte', getFiltersTextCompras());
        } else if (activeTab === 'pagos-proveedores') {
            if (!mappedExportDataPagosProveedores.length) return;
            exportToPDF('Reporte de Pagos a Proveedores', getExportColumnsPagosProveedores(), mappedExportDataPagosProveedores, 'pagos_proveedores_reporte', getFiltersTextPagosProveedores());
        }
    };

    const handleExportExcel = () => {
        if (activeTab === 'productos') {
            if (!mappedExportDataProductos.length) return;
            exportToExcel(getExportColumnsProductos(), mappedExportDataProductos, 'productos_reporte');
        } else if (activeTab === 'ventas') {
            if (!mappedExportDataVentas.length) return;
            exportToExcel(getExportColumnsVentas(), mappedExportDataVentas, 'ventas_reporte');
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
            </div>

            {/* Pestañas (Tabs) en el orden solicitado: Estadísticas, Productos, Ventas, Cobranzas, Compras, Pagos Proveedores */}
            <div className="flex border-b overflow-x-auto custom-scrollbar">
                <button
                    onClick={() => setActiveTab('estadisticas')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'estadisticas' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                    <BarChart3 className="w-4 h-4" />
                    Estadísticas (Estratégico)
                </button>
                <button
                    onClick={() => setActiveTab('productos')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'productos' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                    <Boxes className="w-4 h-4" />
                    Reporte de Productos
                </button>
                <button
                    onClick={() => setActiveTab('ventas')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'ventas' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                    <ShoppingCart className="w-4 h-4" />
                    Reporte de Ventas
                </button>
                <button
                    onClick={() => setActiveTab('cobranzas')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'cobranzas' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                    <Wallet className="w-4 h-4" />
                    Reporte de Cobranzas
                </button>
                <button
                    onClick={() => setActiveTab('compras')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'compras' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                    <ShoppingBag className="w-4 h-4" />
                    Reporte de Compras
                </button>
                <button
                    onClick={() => setActiveTab('pagos-proveedores')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${activeTab === 'pagos-proveedores' ? 'border-primary text-primary font-bold' : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'}`}
                >
                    <HandCoins className="w-4 h-4" />
                    Reporte de Pagos a Proveedores
                </button>
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
            {/* TAB: PRODUCTOS */}
            {/* ========================================== */}
            {activeTab === 'productos' && (
                <>
                    {/* Filtros de Productos */}
                    <div className="bg-card p-4 border rounded-xl shadow-sm space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                                     <Layers className="w-3.5 h-3.5 text-primary" /> Categoría
                                </label>
                                <select 
                                     value={filtroProdCategoria} 
                                     onChange={(e) => setFiltroProdCategoria(e.target.value)} 
                                     className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                     <option value="">Todas las Categorías</option>
                                     {categoriesList?.map(c => (
                                         <option key={c.id} value={c.id}>{c.nombre}</option>
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
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={filtroProdEstado} 
                                        onChange={(e) => setFiltroProdEstado(e.target.value as any)} 
                                        className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        <option value="TODOS">Todos</option>
                                        <option value="ACTIVO">Activos</option>
                                        <option value="INACTIVO">Inactivos</option>
                                    </select>
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

                        <div className="flex items-center gap-3">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <input 
                                    type="text" 
                                    placeholder="Buscar código, nombre de producto..." 
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
                        </div>
                    </div>

                    {/* Tabla de Productos */}
                    <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-muted/50 border-b">
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                                        {!filtroProdMarca && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Marca</th>}
                                        {!filtroProdCategoria && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</th>}
                                        {!filtroProdGrupo && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Grupo</th>}
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">P. Compra</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">P. Venta</th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Margen</th>
                                        {filtroProdEstado === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loadingProducts ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground animate-pulse text-sm">
                                                Cargando catálogo de productos...
                                            </td>
                                        </tr>
                                    ) : paginatedProductos.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-8 text-center text-muted-foreground text-sm">
                                                No se encontraron productos para los filtros seleccionados.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedProductos.map((p, index) => {
                                            const pCompra = Number(p.precioCompra) || 0;
                                            const pVenta = Number(p.precioVenta) || 0;
                                            const margenBs = pVenta - pCompra;
                                            const margenPct = pVenta > 0 ? ((margenBs / pVenta) * 100).toFixed(1) : '0';

                                            return (
                                                <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                                        {(prodCurrentPage - 1) * itemsPerPage + index + 1}
                                                    </td>
                                                    <td className="p-4 text-sm font-mono font-semibold text-foreground">
                                                        {p.codigo}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg border bg-background overflow-hidden flex items-center justify-center shrink-0">
                                                                {p.imagen ? (
                                                                    <img
                                                                        src={getFileUrl(p.imagen)}
                                                                        alt={p.nombre}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                                                                )}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium text-foreground">{p.nombre}</span>
                                                                {p.descripcion && <span className="text-[11px] text-muted-foreground line-clamp-1">{p.descripcion}</span>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {!filtroProdMarca && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {p.marca?.nombre || '-'}
                                                        </td>
                                                    )}
                                                    {!filtroProdCategoria && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {p.categoria?.nombre || '-'}
                                                        </td>
                                                    )}
                                                    {!filtroProdGrupo && (
                                                        <td className="p-4 text-sm text-muted-foreground">
                                                            {p.grupo?.nombre || '-'}
                                                        </td>
                                                    )}
                                                    <td className="p-4 text-sm font-medium text-right text-muted-foreground">
                                                        {formatCurrency(pCompra)}
                                                    </td>
                                                    <td className="p-4 text-sm font-bold text-primary text-right">
                                                        {formatCurrency(pVenta)}
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <div className={`text-xs font-bold ${margenBs >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600'}`}>
                                                            {margenPct}%
                                                        </div>
                                                        <div className="text-[10px] text-muted-foreground">
                                                            {formatCurrency(margenBs)}
                                                        </div>
                                                    </td>
                                                    {filtroProdEstado === 'TODOS' && (
                                                        <td className="p-4 text-center">
                                                            {p.activo ? (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                                                    Activo
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
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
                            </table>
                        </div>

                        {/* Paginación Productos */}
                        {totalPagesProductos > 1 && (
                            <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                                <span className="text-sm text-muted-foreground">
                                    Mostrando {((prodCurrentPage - 1) * itemsPerPage) + 1} a {Math.min(prodCurrentPage * itemsPerPage, filteredProductos.length)} de {filteredProductos.length}
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
                </>
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
                                <select 
                                    value={filtroVentaCliente} 
                                    onChange={(e) => setFiltroVentaCliente(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Todos los Clientes</option>
                                    {clientesUnicos.map(c => (
                                        <option key={c.id} value={c.id}>{getClientDisplayName(c)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <User className="w-3.5 h-3.5 text-primary" /> Vendedor
                                </label>
                                <select 
                                    value={filtroVentaVendedor} 
                                    onChange={(e) => setFiltroVentaVendedor(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos los Vendedores</option>
                                    {vendedoresList.map(v => (
                                        <option key={v.id} value={v.id}>{v.nombres} {v.apellidos}</option>
                                    ))}
                                </select>
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
                                        {filtroVentaVendedor === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>}
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
                                                                    <>
                                                                        <span className="font-bold text-foreground flex items-center gap-1">
                                                                            <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                            {s.cliente.nombreTienda}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {getClientPersonName(s.cliente)} {s.cliente?.persona?.ci ? `• CI: ${s.cliente.persona.ci}` : ''}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span className="font-semibold text-foreground">{getClientPersonName(s.cliente)}</span>
                                                                        {s.cliente?.persona?.ci && (
                                                                            <span className="text-[11px] text-muted-foreground">CI: {s.cliente.persona.ci}</span>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {filtroVentaVendedor === 'TODOS' && (
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
                                <select 
                                    value={filtroCobranzaCliente} 
                                    onChange={(e) => setFiltroCobranzaCliente(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="">Todos los Clientes</option>
                                    {clientesUnicos.map(c => (
                                        <option key={c.id} value={c.id}>{getClientDisplayName(c)}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5 text-primary" /> Vendedor
                                </label>
                                <select 
                                    value={filtroCobranzaVendedor} 
                                    onChange={(e) => setFiltroCobranzaVendedor(e.target.value)} 
                                    className="w-full p-2 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                >
                                    <option value="TODOS">Todos los Vendedores</option>
                                    {vendedoresList.map(v => (
                                        <option key={v.id} value={v.id}>{v.nombres} {v.apellidos}</option>
                                    ))}
                                </select>
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
                                        {filtroCobranzaVendedor === 'TODOS' && <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vendedor</th>}
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
                                                                    <>
                                                                        <span className="font-bold text-foreground flex items-center gap-1">
                                                                            <Store className="w-3.5 h-3.5 text-primary shrink-0" />
                                                                            {p.cliente.nombreTienda}
                                                                        </span>
                                                                        <span className="text-xs text-muted-foreground">
                                                                            {getClientPersonName(p.cliente)}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span>{getClientPersonName(p.cliente)}</span>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )}
                                                    {filtroCobranzaVendedor === 'TODOS' && (
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
        </div>
    );
};

export default ReportesPage;
