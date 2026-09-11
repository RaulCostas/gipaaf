import React, { useState, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { utilidadesService } from '../../api/utilidadesService';
import type { PagoCobranza } from '../../api/cobranzaService';
import type { PagoProveedor } from '../../api/pagoProveedorService';
import type { Egreso } from '../../api/egresoService';
import type { CostoImportacionData, GastoImportacionItem } from '../../api/importacionService';
import type { Traspaso } from '../../api/traspasoService';
import { getCiudades } from '../../api/ciudadService';
import { sucursalService } from '../../api/sucursalService';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import Modal from '../../components/ui/Modal';
import DetalleVentaModal from '../../components/ventas/DetalleVentaModal';
import DetalleCompraModal from '../../components/compras/DetalleCompraModal';
import { 
    TrendingUp, Search, Calendar, Filter, 
    Printer, FileText, FileSpreadsheet,
    ArrowDownRight, ArrowUpRight, DollarSign, Wallet,
    Building2, CheckCircle2, AlertCircle, ThumbsUp, ThumbsDown,
    X, ChevronRight, Eye, Receipt, ExternalLink, Image as ImageIcon
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

import { API_BASE_URL } from '../../api/apiClient';

const formatNumberOnly = (val: number | string | null | undefined): string => {
    const num = Number(val) || 0;
    return num.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getComprobanteFullUrl = (url?: string): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

type CategoryKey = 'cobranzas' | 'pagosProveedores' | 'egresosDiarios' | 'gastosImportacion' | 'pagosFletes';

interface BaseStatCategory<T> {
    key: CategoryKey;
    label: string;
    bs: number;
    sus: number;
    itemsBs: T[];
    itemsSus: T[];
}

interface CobranzaItem {
    id: number | string;
    notaId?: number;
    fecha: string;
    rawFecha: string;
    nroVenta: string;
    cliente: string;
    vendedor: string;
    notaVenta: string;
    metodo: string;
    referencia: string;
    comprobante: string;
    comprobanteUrl?: string;
    monto: number;
    moneda: 'BOB' | 'USD';
    sucursal?: string;
}

interface PagoProveedorItem {
    id: number | string;
    notaId?: number;
    fecha: string;
    rawFecha: string;
    nroCompra: string;
    proveedor: string;
    metodo: string;
    referencia: string;
    comprobante: string;
    comprobanteUrl?: string;
    monto: number;
    moneda: 'BOB' | 'USD';
    sucursal?: string;
}

interface EgresoItem {
    id: number | string;
    fecha: string;
    rawFecha: string;
    codigo: string;
    detalle: string;
    metodo: string;
    comprobante: string;
    comprobanteUrl?: string;
    monto: number;
    moneda: 'BOB' | 'USD';
    sucursal?: string;
}

interface GastoImportacionDetailItem {
    id: number | string;
    notaId?: number;
    fecha: string;
    rawFecha: string;
    nroCompra: string;
    proveedor: string;
    referencia: string;
    gastos: GastoImportacionItem[];
    gastosResumen: string;
    metodo: string;
    comprobante: string;
    comprobanteUrl?: string;
    monto: number;
    moneda: 'BOB' | 'USD';
    sucursal?: string;
}

interface FleteItem {
    id: number | string;
    fecha: string;
    rawFecha: string;
    codigo: string;
    sucursalOrigen: string;
    sucursalDestino: string;
    motivo: string;
    monto: number;
    moneda: 'BOB';
}

const UtilidadesPage: React.FC = () => {
    const { isAdmin, hasAction } = useAuth();
    const canExport = isAdmin || hasAction('UTILIDADES', 'EXPORTAR');
    const { selectedSucursal, selectedCiudad } = useFilters();

    // Filtros de Período
    const [filterType, setFilterType] = useState<'date' | 'month' | 'year'>('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
    const [selectedYear, setSelectedYear] = useState(() => format(new Date(), 'yyyy'));

    // Modal de detalle
    const [selectedDetail, setSelectedDetail] = useState<{
        key: CategoryKey;
        title: string;
        currency: 'Bolivianos' | 'Dólares';
        items: any[];
    } | null>(null);
    const [modalSearch, setModalSearch] = useState('');

    // Modal para ver comprobante / voucher
    const [viewingComprobante, setViewingComprobante] = useState<string | null>(null);

    // Modales para ver detalle completo de Venta y Compra
    const [viewingDetalleVentaId, setViewingDetalleVentaId] = useState<number | null>(null);
    const [viewingDetalleCompraId, setViewingDetalleCompraId] = useState<number | null>(null);

    // Sub-Modal para ver lista de gastos de importación
    const [selectedSubmodalGastos, setSelectedSubmodalGastos] = useState<{
        nroCompra: string;
        referencia?: string;
        gastos: GastoImportacionItem[];
        totalBob: number;
        totalUsd: number;
    } | null>(null);

    // Queries auxiliares para nombres en filtros
    const { data: ciudades } = useQuery({
        queryKey: ['ciudades'],
        queryFn: getCiudades,
        staleTime: 1000 * 60 * 10,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
        staleTime: 1000 * 60 * 10,
    });

    // Query unificada y optimizada de todas las fuentes financieras
    const { data: utilidadesData, isLoading } = useQuery({
        queryKey: ['utilidadesData'],
        queryFn: utilidadesService.getData,
        staleTime: 1000 * 60 * 2,
        placeholderData: keepPreviousData,
    });

    const cobranzas = utilidadesData?.cobranzas || [];
    const pagosProveedores = utilidadesData?.pagosProveedores || [];
    const egresos = utilidadesData?.egresos || [];
    const costosImportacion = utilidadesData?.costosImportacion || [];
    const traspasos = utilidadesData?.traspasos || [];

    // Rango de fechas calculado según filterType
    const { dateRangeStart, dateRangeEnd } = useMemo(() => {
        if (filterType === 'date') {
            return {
                dateRangeStart: startDate || '1900-01-01',
                dateRangeEnd: endDate || '2100-12-31'
            };
        }
        if (filterType === 'month' && selectedMonth) {
            const [y, m] = selectedMonth.split('-').map(Number);
            const date = new Date(y, m - 1, 1);
            return {
                dateRangeStart: format(startOfMonth(date), 'yyyy-MM-dd'),
                dateRangeEnd: format(endOfMonth(date), 'yyyy-MM-dd')
            };
        }
        if (filterType === 'year' && selectedYear) {
            const date = new Date(Number(selectedYear), 0, 1);
            return {
                dateRangeStart: format(startOfYear(date), 'yyyy-MM-dd'),
                dateRangeEnd: format(endOfYear(date), 'yyyy-MM-dd')
            };
        }
        return { dateRangeStart: '1900-01-01', dateRangeEnd: '2100-12-31' };
    }, [filterType, startDate, endDate, selectedMonth, selectedYear]);

    // Helpers de filtro de fecha y sucursal
    const isDateInRange = (d?: string | Date | null) => {
        if (!d) return false;
        const str = typeof d === 'string' ? d.substring(0, 10) : format(new Date(d), 'yyyy-MM-dd');
        return str >= dateRangeStart && str <= dateRangeEnd;
    };

    const isSucursalMatch = (sucId?: number, ciudadId?: number) => {
        if (selectedSucursal && sucId) {
            return sucId === Number(selectedSucursal);
        }
        if (selectedCiudad && ciudadId) {
            return ciudadId === Number(selectedCiudad);
        }
        return true;
    };

    // Subtítulo informativo de filtros para Impresión / PDF / Excel
    const getFilterSubtitle = () => {
        const parts: string[] = [];
        if (filterType === 'month') {
            const [year, month] = selectedMonth.split('-');
            const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
            const monthName = monthNames[Number(month) - 1] || month;
            parts.push(`Tipo: Mensual | Mes: ${monthName} ${year} | Período: ${formatDate(dateRangeStart)} al ${formatDate(dateRangeEnd)}`);
        } else if (filterType === 'year') {
            parts.push(`Tipo: Anual | Año: ${selectedYear} | Período: ${formatDate(dateRangeStart)} al ${formatDate(dateRangeEnd)}`);
        } else if (filterType === 'date') {
            parts.push(`Tipo: Rango de Fechas | Fecha Inicio: ${formatDate(startDate || dateRangeStart)} | Fecha Fin: ${formatDate(endDate || dateRangeEnd)}`);
        }

        if (selectedCiudad) {
            const c = ciudades?.find(ci => ci.id === Number(selectedCiudad));
            if (c) parts.push(`Ciudad: ${c.nombre}`);
        }
        if (selectedSucursal) {
            const s = sucursales?.find(su => su.id === Number(selectedSucursal));
            if (s) parts.push(`Sucursal: ${s.nombre}`);
        }

        return parts.join(' - ');
    };

    // Cálculo consolidado de las 8 filas de análisis
    const stats = useMemo(() => {
        // 1. INGRESOS: Cobranzas de Clientes
        const itemsIngresosBs: CobranzaItem[] = [];
        const itemsIngresosSus: CobranzaItem[] = [];

        cobranzas.forEach((c: PagoCobranza) => {
            if (!c.activo) return;
            if (!isDateInRange(c.fecha)) return;
            const sucId = (c.nota?.sucursal as any)?.id || (c.cliente?.sucursal as any)?.id;
            const ciuId = (c.nota?.sucursal as any)?.ciudad?.id || (c.cliente?.sucursal as any)?.ciudad?.id || (c.cliente?.ciudad as any)?.id;
            if (!isSucursalMatch(sucId, ciuId)) return;

            const monto = Number(c.monto) || 0;
            const isSus = c.moneda === 'USD';
            const rawFecha = typeof c.fecha === 'string' ? c.fecha.substring(0, 10) : format(new Date(c.fecha), 'yyyy-MM-dd');
            
            const clienteName = c.cliente?.persona 
                ? `${c.cliente.persona.nombres || ''} ${c.cliente.persona.apellidos || ''}`.trim() 
                : (c.cliente?.razonSocial || 'Cliente Final');
                
            const vendedorName = c.nota?.vendedor 
                ? `${c.nota.vendedor.nombres || ''} ${c.nota.vendedor.apellidos || ''}`.trim() 
                : (c.nota?.usuario?.persona ? `${c.nota.usuario.persona.nombres || ''} ${c.nota.usuario.persona.apellidos || ''}`.trim() : '-');

            const item: CobranzaItem = {
                id: `cob-${c.id}`,
                notaId: c.nota?.id,
                fecha: formatDate(c.fecha),
                rawFecha,
                nroVenta: c.nota?.numero || '-',
                cliente: clienteName || 'Cliente Final',
                vendedor: vendedorName || '-',
                notaVenta: c.nota?.observaciones || '-',
                metodo: c.metodoPago || 'Efectivo',
                referencia: c.referencia || '-',
                comprobante: c.comprobanteUrl ? 'Ver Comprobante' : '-',
                comprobanteUrl: c.comprobanteUrl,
                monto,
                moneda: isSus ? 'USD' : 'BOB',
                sucursal: c.nota?.sucursal?.nombre || c.cliente?.sucursal?.nombre
            };

            if (isSus) itemsIngresosSus.push(item);
            else itemsIngresosBs.push(item);
        });

        itemsIngresosBs.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));
        itemsIngresosSus.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));

        const ingresosCat: BaseStatCategory<CobranzaItem> = {
            key: 'cobranzas',
            label: 'Ingresos por Pagos de Clientes',
            bs: itemsIngresosBs.reduce((acc, i) => acc + i.monto, 0),
            sus: itemsIngresosSus.reduce((acc, i) => acc + i.monto, 0),
            itemsBs: itemsIngresosBs,
            itemsSus: itemsIngresosSus
        };

        const totalIngresos = {
            bs: ingresosCat.bs,
            sus: ingresosCat.sus
        };

        // 2. EGRESOS: Pagos a Proveedores
        const itemsProvBs: PagoProveedorItem[] = [];
        const itemsProvSus: PagoProveedorItem[] = [];

        pagosProveedores.forEach((p: PagoProveedor) => {
            if (!p.activo) return;
            if (!isDateInRange(p.fecha)) return;
            const sucId = (p.nota?.sucursal as any)?.id;
            const ciuId = (p.nota?.sucursal as any)?.ciudad?.id;
            if (!isSucursalMatch(sucId, ciuId)) return;

            const monto = Number(p.monto) || 0;
            const isSus = p.moneda === 'USD';
            const rawFecha = typeof p.fecha === 'string' ? p.fecha.substring(0, 10) : format(new Date(p.fecha), 'yyyy-MM-dd');
            
            const provPersona = p.proveedor?.persona ? `${p.proveedor.persona.nombres || ''} ${p.proveedor.persona.apellidos || ''}`.trim() : '';
            const provName = p.proveedor?.empresa 
                ? `${p.proveedor.empresa}${provPersona ? ` (${provPersona})` : ''}` 
                : (p.proveedor?.razonSocial || provPersona || 'Proveedor');

            const item: PagoProveedorItem = {
                id: `prov-${p.id}`,
                notaId: p.nota?.id,
                fecha: formatDate(p.fecha),
                rawFecha,
                nroCompra: p.nota?.numero || '-',
                proveedor: provName,
                metodo: p.metodoPago || 'Efectivo',
                referencia: p.referencia || p.observaciones || '-',
                comprobante: p.comprobanteUrl ? 'Ver Comprobante' : '-',
                comprobanteUrl: p.comprobanteUrl,
                monto,
                moneda: isSus ? 'USD' : 'BOB',
                sucursal: p.nota?.sucursal?.nombre
            };

            if (isSus) itemsProvSus.push(item);
            else itemsProvBs.push(item);
        });

        itemsProvBs.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));
        itemsProvSus.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));

        const pagosProveedoresCat: BaseStatCategory<PagoProveedorItem> = {
            key: 'pagosProveedores',
            label: 'Pagos a Proveedores',
            bs: itemsProvBs.reduce((acc, i) => acc + i.monto, 0),
            sus: itemsProvSus.reduce((acc, i) => acc + i.monto, 0),
            itemsBs: itemsProvBs,
            itemsSus: itemsProvSus
        };

        // 3. EGRESOS: Egresos Diarios
        const itemsEgresosBs: EgresoItem[] = [];
        const itemsEgresosSus: EgresoItem[] = [];

        egresos.forEach((e: Egreso) => {
            if (!e.activo) return;
            // Excluir egresos automáticos de traspasos para no duplicarlos con 'Pagos a Fletes por traspasos'
            if (e.codigo?.startsWith('EGR-TRASP') || e.detalle?.toLowerCase().includes('costo de transporte por traspaso')) return;
            if (!isDateInRange(e.fecha)) return;
            const sucId = (e.sucursal as any)?.id;
            const ciuId = (e.sucursal as any)?.ciudad?.id;
            if (!isSucursalMatch(sucId, ciuId)) return;

            const monto = Number(e.monto) || 0;
            const isSus = e.moneda === 'USD';
            const rawFecha = typeof e.fecha === 'string' ? e.fecha.substring(0, 10) : format(new Date(e.fecha), 'yyyy-MM-dd');
            const item: EgresoItem = {
                id: `egr-${e.id}`,
                fecha: formatDate(e.fecha),
                rawFecha,
                codigo: e.codigo || `EGR-${e.id}`,
                detalle: e.detalle || 'Gasto operativo',
                metodo: e.formaPago || 'Caja Chica',
                comprobante: e.nroComprobante ? `Comp. ${e.nroComprobante}` : (e.comprobanteUrl ? 'Ver Doc' : '-'),
                comprobanteUrl: e.comprobanteUrl,
                monto,
                moneda: isSus ? 'USD' : 'BOB',
                sucursal: e.sucursal?.nombre
            };

            if (isSus) itemsEgresosSus.push(item);
            else itemsEgresosBs.push(item);
        });

        itemsEgresosBs.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));
        itemsEgresosSus.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));

        const egresosDiariosCat: BaseStatCategory<EgresoItem> = {
            key: 'egresosDiarios',
            label: 'Egresos Diarios',
            bs: itemsEgresosBs.reduce((acc, i) => acc + i.monto, 0),
            sus: itemsEgresosSus.reduce((acc, i) => acc + i.monto, 0),
            itemsBs: itemsEgresosBs,
            itemsSus: itemsEgresosSus
        };

        // 4. EGRESOS: Gastos Costos de Importación
        const itemsImpBs: GastoImportacionDetailItem[] = [];
        const itemsImpSus: GastoImportacionDetailItem[] = [];

        costosImportacion.forEach((imp: CostoImportacionData) => {
            const fechaImport = imp.fecha || (imp as any)?.nota?.fecha;
            if (!isDateInRange(fechaImport)) return;
            const sucId = imp.sucursalId || imp.sucursal?.id;
            if (!isSucursalMatch(sucId, undefined)) return;

            const gastosList = imp.gastos || [];
            const montoBob = Number(imp.totalGastosBob) || gastosList.reduce((acc, g) => acc + (Number(g.montoBob) || 0), 0);
            const isGastoUSD = imp.monedaGastos === 'USD';
            const montoUsd = isGastoUSD 
                ? (gastosList.reduce((acc, g) => acc + (Number(g.montoUsd) || 0), 0) || (imp.tipoCambio ? montoBob / imp.tipoCambio : 0))
                : 0;
            
            const nroCompra = (imp as any)?.nota?.numero || `COM-${imp.notaId}`;
            const provPersona = (imp as any)?.nota?.proveedor?.persona ? `${(imp as any).nota.proveedor.persona.nombres || ''} ${(imp as any).nota.proveedor.persona.apellidos || ''}`.trim() : '';
            const provName = (imp as any)?.nota?.proveedor?.empresa 
                ? `${(imp as any).nota.proveedor.empresa}${provPersona ? ` (${provPersona})` : ''}` 
                : (provPersona || '-');

            const resumen = gastosList.length > 0 
                ? gastosList.map(g => `${g.motivo}: ${formatCurrency(g.montoBob, 'BOB')}`).join('; ') 
                : 'Sin desglose de conceptos';

            const rawFecha = typeof fechaImport === 'string' ? fechaImport.substring(0, 10) : format(new Date(fechaImport), 'yyyy-MM-dd');

            const item: GastoImportacionDetailItem = {
                id: `imp-${imp.id || imp.notaId}`,
                notaId: imp.notaId || (imp as any)?.nota?.id,
                fecha: formatDate(fechaImport),
                rawFecha,
                nroCompra,
                proveedor: provName,
                referencia: imp.referencia || '-',
                gastos: gastosList,
                gastosResumen: resumen,
                metodo: imp.metodoPago || 'Transferencia Bancaria',
                comprobante: imp.comprobanteUrl ? 'Ver Comprobante' : '-',
                comprobanteUrl: imp.comprobanteUrl,
                monto: isGastoUSD ? montoUsd : montoBob,
                moneda: isGastoUSD ? 'USD' : 'BOB',
                sucursal: imp.sucursal?.nombre
            };

            if (isGastoUSD) {
                if (montoUsd > 0) itemsImpSus.push(item);
            } else {
                if (montoBob > 0) itemsImpBs.push(item);
            }
        });

        itemsImpBs.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));
        itemsImpSus.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));

        const gastosImportacionCat: BaseStatCategory<GastoImportacionDetailItem> = {
            key: 'gastosImportacion',
            label: 'Gastos Costos de Importación',
            bs: itemsImpBs.reduce((acc, i) => acc + i.monto, 0),
            sus: itemsImpSus.reduce((acc, i) => acc + i.monto, 0),
            itemsBs: itemsImpBs,
            itemsSus: itemsImpSus
        };

        // 5. EGRESOS: Pagos a Fletes por traspasos
        const itemsFletesBs: FleteItem[] = [];
        const itemsFletesSus: FleteItem[] = [];

        traspasos.forEach((t: Traspaso) => {
            if (t.estado === 'ANULADO') return;
            if (!isDateInRange(t.fecha)) return;
            const monto = Number(t.costoTransporte) || 0;
            if (monto <= 0) return;

            const sucId = t.sucursalCargoCosto === 'DESTINO' 
                ? (t.sucursalDestino as any)?.id 
                : (t.sucursalOrigen as any)?.id;
            const ciuId = t.sucursalCargoCosto === 'DESTINO'
                ? (t.sucursalDestino as any)?.ciudad?.id
                : (t.sucursalOrigen as any)?.ciudad?.id;

            if (!isSucursalMatch(sucId, ciuId)) return;

            const origenNom = t.sucursalOrigen?.nombre || 'Origen';
            const destinoNom = t.sucursalDestino?.nombre || 'Destino';
            const rawFecha = typeof t.fecha === 'string' ? t.fecha.substring(0, 10) : format(new Date(t.fecha), 'yyyy-MM-dd');

            itemsFletesBs.push({
                id: `flete-${t.id}`,
                fecha: formatDate(t.fecha),
                rawFecha,
                codigo: t.codigo || `TRASP-${t.id}`,
                sucursalOrigen: origenNom,
                sucursalDestino: destinoNom,
                motivo: t.motivo || t.observaciones || 'Traspaso entre sucursales',
                monto,
                moneda: 'BOB'
            });
        });

        itemsFletesBs.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));
        itemsFletesSus.sort((a, b) => a.rawFecha.localeCompare(b.rawFecha));

        const pagosFletesCat: BaseStatCategory<FleteItem> = {
            key: 'pagosFletes',
            label: 'Pagos a Fletes por traspasos',
            bs: itemsFletesBs.reduce((acc, i) => acc + i.monto, 0),
            sus: itemsFletesSus.reduce((acc, i) => acc + i.monto, 0),
            itemsBs: itemsFletesBs,
            itemsSus: itemsFletesSus
        };

        // Consolidados Totales
        const totalEgresos = {
            bs: pagosProveedoresCat.bs + egresosDiariosCat.bs + gastosImportacionCat.bs + pagosFletesCat.bs,
            sus: pagosProveedoresCat.sus + egresosDiariosCat.sus + gastosImportacionCat.sus + pagosFletesCat.sus,
        };

        const totalUtilidades = {
            bs: totalIngresos.bs - totalEgresos.bs,
            sus: totalIngresos.sus - totalEgresos.sus,
        };

        return {
            ingresos: ingresosCat,
            totalIngresos,
            pagosProveedores: pagosProveedoresCat,
            egresosDiarios: egresosDiariosCat,
            gastosImportacion: gastosImportacionCat,
            pagosFletes: pagosFletesCat,
            totalEgresos,
            totalUtilidades,
        };
    }, [cobranzas, pagosProveedores, egresos, costosImportacion, traspasos, dateRangeStart, dateRangeEnd, selectedSucursal, selectedCiudad]);

    // Manejador del modal de detalle
    const handleOpenDetail = (cat: BaseStatCategory<any>, currency: 'Bolivianos' | 'Dólares') => {
        setSelectedDetail({
            key: cat.key,
            title: cat.label,
            currency,
            items: currency === 'Bolivianos' ? cat.itemsBs : cat.itemsSus,
        });
        setModalSearch('');
    };

    // Elementos filtrados en el modal de detalle
    const filteredModalItems = useMemo(() => {
        if (!selectedDetail) return [];
        if (!modalSearch.trim()) return selectedDetail.items;
        const s = modalSearch.toLowerCase();
        return selectedDetail.items.filter((item: any) => {
            return Object.values(item).some(val => 
                typeof val === 'string' && val.toLowerCase().includes(s)
            );
        });
    }, [selectedDetail, modalSearch]);

    const modalTotal = useMemo(() => {
        return filteredModalItems.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    }, [filteredModalItems]);

    // Exportación de reporte general consolidado
    const exportData = [
        { concepto: stats.ingresos.label, bs: formatCurrency(stats.ingresos.bs, 'BOB'), sus: formatCurrency(stats.ingresos.sus, 'USD') },
        { concepto: 'TOTAL INGRESOS', bs: formatCurrency(stats.totalIngresos.bs, 'BOB'), sus: formatCurrency(stats.totalIngresos.sus, 'USD') },
        { concepto: stats.pagosProveedores.label, bs: formatCurrency(stats.pagosProveedores.bs, 'BOB'), sus: formatCurrency(stats.pagosProveedores.sus, 'USD') },
        { concepto: stats.egresosDiarios.label, bs: formatCurrency(stats.egresosDiarios.bs, 'BOB'), sus: formatCurrency(stats.egresosDiarios.sus, 'USD') },
        { concepto: stats.gastosImportacion.label, bs: formatCurrency(stats.gastosImportacion.bs, 'BOB'), sus: formatCurrency(stats.gastosImportacion.sus, 'USD') },
        { concepto: stats.pagosFletes.label, bs: formatCurrency(stats.pagosFletes.bs, 'BOB'), sus: formatCurrency(stats.pagosFletes.sus, 'USD') },
        { concepto: 'TOTAL EGRESOS', bs: formatCurrency(stats.totalEgresos.bs, 'BOB'), sus: formatCurrency(stats.totalEgresos.sus, 'USD') },
        { concepto: 'TOTAL UTILIDADES', bs: formatCurrency(stats.totalUtilidades.bs, 'BOB'), sus: formatCurrency(stats.totalUtilidades.sus, 'USD') },
    ];

    const exportColumns = [
        { header: 'Concepto', dataKey: 'concepto' },
        { header: 'Bolivianos (Bs.)', dataKey: 'bs' },
        { header: 'Dólares ($us)', dataKey: 'sus' },
    ];

    const handlePrint = () => {
        printData(`Reporte de Utilidades`, exportColumns, exportData, getFilterSubtitle());
    };

    const handleExportPDF = () => {
        exportToPDF(`Reporte de Utilidades`, exportColumns, exportData, 'utilidades_reporte', getFilterSubtitle());
    };

    const handleExportExcel = () => {
        exportToExcel(exportColumns, exportData, 'utilidades_reporte', {
            concepto: 'TOTAL UTILIDADES',
            bs: formatCurrency(stats.totalUtilidades.bs, 'BOB'),
            sus: formatCurrency(stats.totalUtilidades.sus, 'USD')
        });
    };

    // Obtener columnas y datos formateados para el Modal según la categoría activa
    const getModalExportConfig = () => {
        if (!selectedDetail) return { columns: [], data: [] };

        let columns: { header: string; dataKey: string }[] = [];

        switch (selectedDetail.key) {
            case 'cobranzas':
                columns = [
                    { header: '#', dataKey: 'index' },
                    { header: 'Fecha', dataKey: 'fecha' },
                    { header: 'Nro. Venta', dataKey: 'nroVenta' },
                    { header: 'Cliente', dataKey: 'cliente' },
                    { header: 'Vendedor', dataKey: 'vendedor' },
                    { header: 'Nota de venta', dataKey: 'notaVenta' },
                    { header: 'Método', dataKey: 'metodo' },
                    { header: 'Referencia', dataKey: 'referencia' },
                    { header: 'Comprobante', dataKey: 'comprobante' },
                    { header: 'Monto', dataKey: 'montoFormateado' },
                ];
                break;
            case 'pagosProveedores':
                columns = [
                    { header: '#', dataKey: 'index' },
                    { header: 'Fecha', dataKey: 'fecha' },
                    { header: 'Nro Compra', dataKey: 'nroCompra' },
                    { header: 'Proveedor', dataKey: 'proveedor' },
                    { header: 'Método', dataKey: 'metodo' },
                    { header: 'Referencia', dataKey: 'referencia' },
                    { header: 'Comprobante', dataKey: 'comprobante' },
                    { header: 'Monto', dataKey: 'montoFormateado' },
                ];
                break;
            case 'egresosDiarios':
                columns = [
                    { header: '#', dataKey: 'index' },
                    { header: 'Fecha', dataKey: 'fecha' },
                    { header: 'Código', dataKey: 'codigo' },
                    { header: 'Detalle / Concepto', dataKey: 'detalle' },
                    { header: 'Método', dataKey: 'metodo' },
                    { header: 'Comprobante', dataKey: 'comprobante' },
                    { header: 'Monto', dataKey: 'montoFormateado' },
                ];
                break;
            case 'gastosImportacion':
                columns = [
                    { header: '#', dataKey: 'index' },
                    { header: 'Fecha', dataKey: 'fecha' },
                    { header: 'Nro Compra', dataKey: 'nroCompra' },
                    { header: 'Proveedor', dataKey: 'proveedor' },
                    { header: 'Gastos de Importación', dataKey: 'gastosResumen' },
                    { header: 'Método', dataKey: 'metodo' },
                    { header: 'Referencia', dataKey: 'referencia' },
                    { header: 'Comprobante', dataKey: 'comprobante' },
                    { header: 'Monto', dataKey: 'montoFormateado' },
                ];
                break;
            case 'pagosFletes':
                columns = [
                    { header: '#', dataKey: 'index' },
                    { header: 'Fecha', dataKey: 'fecha' },
                    { header: 'Código', dataKey: 'codigo' },
                    { header: 'Sucursal Origen', dataKey: 'sucursalOrigen' },
                    { header: 'Sucursal Destino', dataKey: 'sucursalDestino' },
                    { header: 'Motivo', dataKey: 'motivo' },
                    { header: 'Monto', dataKey: 'montoFormateado' },
                ];
                break;
        }

        const data = filteredModalItems.map((item: any, idx: number) => ({
            ...item,
            index: idx + 1,
            montoFormateado: formatNumberOnly(item.monto),
        }));

        return { columns, data };
    };

    // Exportar detalle modal
    const handlePrintModal = () => {
        if (!selectedDetail) return;
        const { columns, data } = getModalExportConfig();
        const footer: Record<string, string> = {
            montoFormateado: formatNumberOnly(modalTotal),
        };
        printData(`Desglose: ${selectedDetail.title} (${selectedDetail.currency})`, columns, data, getFilterSubtitle(), footer);
    };

    const handleExportModalPDF = () => {
        if (!selectedDetail) return;
        const { columns, data } = getModalExportConfig();
        const footer: Record<string, string> = {
            montoFormateado: formatNumberOnly(modalTotal),
        };
        exportToPDF(`Desglose: ${selectedDetail.title} (${selectedDetail.currency})`, columns, data, `desglose_${selectedDetail.key}`, getFilterSubtitle(), footer);
    };

    const handleExportModalExcel = () => {
        if (!selectedDetail) return;
        const { columns, data } = getModalExportConfig();
        const footer: Record<string, string> = {
            montoFormateado: formatNumberOnly(modalTotal),
        };
        exportToExcel(columns, data, `desglose_${selectedDetail.key}`, footer);
    };

    return (
        <div className="space-y-6">
            {/* Header banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <TrendingUp className="w-8 h-8 text-primary/80" />
                        Utilidades
                    </h1>
                    <p className="text-muted-foreground italic">
                        Cálculo de ganancias netas, margen de utilidad y balance financiero consolidado.
                    </p>
                </div>
                {canExport && (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handlePrint} 
                            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" 
                            title="Imprimir Reporte"
                        >
                            <Printer className="w-4 h-4 text-muted-foreground" /> <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button 
                            onClick={handleExportPDF} 
                            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" 
                            title="Exportar a PDF"
                        >
                            <FileText className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button 
                            onClick={handleExportExcel} 
                            className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" 
                            title="Exportar a Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Filtros de período */}
            <div className="bg-card border rounded-xl p-4 md:p-5 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b pb-3">
                    <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                        <Filter className="w-4 h-4 text-primary" />
                        <span>Filtros de Período y Análisis</span>
                    </div>

                    {/* Botones de acceso rápido */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                            onClick={() => {
                                setFilterType('month');
                                setSelectedMonth(format(new Date(), 'yyyy-MM'));
                            }}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${filterType === 'month' && selectedMonth === format(new Date(), 'yyyy-MM') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                        >
                            Mes Actual
                        </button>
                        <button
                            onClick={() => {
                                setFilterType('year');
                                setSelectedYear(format(new Date(), 'yyyy'));
                            }}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${filterType === 'year' && selectedYear === format(new Date(), 'yyyy') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                        >
                            Año Actual
                        </button>
                        <button
                            onClick={() => {
                                setFilterType('date');
                                const hoy = format(new Date(), 'yyyy-MM-dd');
                                setStartDate(hoy);
                                setEndDate(hoy);
                            }}
                            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${filterType === 'date' && startDate === format(new Date(), 'yyyy-MM-dd') && endDate === format(new Date(), 'yyyy-MM-dd') ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/50 hover:bg-muted text-muted-foreground'}`}
                        >
                            Hoy
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    {/* Selector de Tipo */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">Tipo de Análisis</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all hover:border-primary/50 cursor-pointer"
                        >
                            <option value="month">📅 Mensual</option>
                            <option value="year">📊 Anual</option>
                            <option value="date">📆 Por Rango de Fechas</option>
                        </select>
                    </div>

                    {/* Inputs dinámicos */}
                    {filterType === 'month' && (
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground">Seleccione Mes</label>
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                            />
                        </div>
                    )}

                    {filterType === 'year' && (
                        <div className="space-y-1.5 sm:col-span-2">
                            <label className="text-xs font-semibold text-muted-foreground">Seleccione Año</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(e.target.value)}
                                className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer font-medium"
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + 1 - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {filterType === 'date' && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Fecha Inicio</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-muted-foreground">Fecha Fin</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
                                />
                            </div>
                        </>
                    )}

                    {/* Resumen del Período */}
                    <div className="p-2.5 bg-muted/40 border rounded-lg text-xs flex flex-col justify-center">
                        <span className="text-muted-foreground">Período Seleccionado:</span>
                        <span className="font-semibold text-foreground truncate mt-0.5">
                            {formatDate(dateRangeStart)} al {formatDate(dateRangeEnd)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabla Principal de Análisis de Utilidades */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                {/* Cabecera de la tabla */}
                <div className="grid grid-cols-12 bg-muted/80 border-b text-xs font-bold uppercase tracking-wider text-muted-foreground py-3.5 px-4 sm:px-6">
                    <div className="col-span-5 sm:col-span-4">Concepto / Fila de Análisis</div>
                    <div className="col-span-3 sm:col-span-3 text-right">Bolivianos (Bs.)</div>
                    <div className="col-span-1 text-center">Ver</div>
                    <div className="col-span-2 sm:col-span-3 text-right">Dólares ($us)</div>
                    <div className="col-span-1 text-center">Ver</div>
                </div>

                {isLoading ? (
                    <div className="p-12 text-center text-muted-foreground animate-pulse space-y-2">
                        <TrendingUp className="w-8 h-8 text-primary mx-auto animate-bounce" />
                        <p className="font-medium">Calculando utilidades e ingresos...</p>
                    </div>
                ) : (
                    <div className="divide-y text-sm">
                        {/* 1. INGRESOS POR PAGOS DE CLIENTES */}
                        <div className="grid grid-cols-12 py-3.5 px-4 sm:px-6 hover:bg-muted/30 items-center transition-colors">
                            <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                {stats.ingresos.label}
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(stats.ingresos.bs, 'BOB')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.ingresos, 'Bolivianos')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Bolivianos"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="col-span-2 sm:col-span-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                {formatCurrency(stats.ingresos.sus, 'USD')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.ingresos, 'Dólares')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Dólares"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 2. TOTAL INGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 sm:px-6 bg-emerald-50/80 dark:bg-emerald-950/40 border-y border-emerald-200 dark:border-emerald-800/40 font-bold text-emerald-900 dark:text-emerald-200 items-center">
                            <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                                <ArrowUpRight className="w-4 h-4 text-emerald-600" />
                                TOTAL INGRESOS
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                                {formatCurrency(stats.totalIngresos.bs, 'BOB')}
                            </div>
                            <div className="col-span-1"></div>
                            <div className="col-span-2 sm:col-span-3 text-right text-base font-extrabold text-emerald-700 dark:text-emerald-300">
                                {formatCurrency(stats.totalIngresos.sus, 'USD')}
                            </div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* SEPARADOR DE EGRESOS */}
                        <div className="py-2 bg-muted/20 text-xs font-semibold text-muted-foreground uppercase px-6 tracking-wide">
                            Desglose de Egresos y Costos Operativos
                        </div>

                        {/* 3. PAGOS A PROVEEDORES */}
                        <div className="grid grid-cols-12 py-3.5 px-4 sm:px-6 hover:bg-muted/30 items-center transition-colors">
                            <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                {stats.pagosProveedores.label}
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.pagosProveedores.bs, 'BOB')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.pagosProveedores, 'Bolivianos')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Bolivianos"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="col-span-2 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.pagosProveedores.sus, 'USD')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.pagosProveedores, 'Dólares')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Dólares"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 4. EGRESOS DIARIOS */}
                        <div className="grid grid-cols-12 py-3.5 px-4 sm:px-6 hover:bg-muted/30 items-center transition-colors">
                            <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                                {stats.egresosDiarios.label}
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.egresosDiarios.bs, 'BOB')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.egresosDiarios, 'Bolivianos')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Bolivianos"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="col-span-2 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.egresosDiarios.sus, 'USD')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.egresosDiarios, 'Dólares')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Dólares"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 5. GASTOS COSTOS DE IMPORTACIÓN */}
                        <div className="grid grid-cols-12 py-3.5 px-4 sm:px-6 hover:bg-muted/30 items-center transition-colors">
                            <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                {stats.gastosImportacion.label}
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.gastosImportacion.bs, 'BOB')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.gastosImportacion, 'Bolivianos')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Bolivianos"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="col-span-2 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.gastosImportacion.sus, 'USD')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.gastosImportacion, 'Dólares')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Dólares"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 6. PAGOS A FLETES POR TRASPASOS */}
                        <div className="grid grid-cols-12 py-3.5 px-4 sm:px-6 hover:bg-muted/30 items-center transition-colors">
                            <div className="col-span-5 sm:col-span-4 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                                {stats.pagosFletes.label}
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.pagosFletes.bs, 'BOB')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.pagosFletes, 'Bolivianos')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Bolivianos"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="col-span-2 sm:col-span-3 text-right font-medium text-foreground">
                                {formatCurrency(stats.pagosFletes.sus, 'USD')}
                            </div>
                            <div className="col-span-1 text-center">
                                <button
                                    onClick={() => handleOpenDetail(stats.pagosFletes, 'Dólares')}
                                    className="p-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-all shadow-xs"
                                    title="Ver detalle en Dólares"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* 7. TOTAL EGRESOS */}
                        <div className="grid grid-cols-12 py-3 px-4 sm:px-6 bg-rose-50/80 dark:bg-rose-950/40 border-y border-rose-200 dark:border-rose-800/40 font-bold text-rose-900 dark:text-rose-200 items-center">
                            <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                                <ArrowDownRight className="w-4 h-4 text-rose-600" />
                                TOTAL EGRESOS
                            </div>
                            <div className="col-span-3 sm:col-span-3 text-right text-base font-extrabold text-rose-700 dark:text-rose-300">
                                {formatCurrency(stats.totalEgresos.bs, 'BOB')}
                            </div>
                            <div className="col-span-1"></div>
                            <div className="col-span-2 sm:col-span-3 text-right text-base font-extrabold text-rose-700 dark:text-rose-300">
                                {formatCurrency(stats.totalEgresos.sus, 'USD')}
                            </div>
                            <div className="col-span-1"></div>
                        </div>

                        {/* 8. TOTAL UTILIDADES */}
                        <div className="grid grid-cols-12 py-5 px-4 sm:px-6 bg-primary/5 dark:bg-primary/10 border-t-2 border-primary/30 items-center">
                            <div className="col-span-5 sm:col-span-4 text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                TOTAL UTILIDADES
                            </div>

                            {/* Bolivianos */}
                            <div className={`col-span-3 sm:col-span-3 text-right text-lg sm:text-xl font-black flex items-center justify-end gap-1.5 ${stats.totalUtilidades.bs >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {stats.totalUtilidades.bs >= 0 ? (
                                    <ThumbsUp className="w-5 h-5 shrink-0 hidden sm:inline" />
                                ) : (
                                    <ThumbsDown className="w-5 h-5 shrink-0 hidden sm:inline" />
                                )}
                                <span>{formatCurrency(stats.totalUtilidades.bs, 'BOB')}</span>
                            </div>

                            <div className="col-span-1"></div>

                            {/* Dólares */}
                            <div className={`col-span-2 sm:col-span-3 text-right text-lg sm:text-xl font-black flex items-center justify-end gap-1.5 ${stats.totalUtilidades.sus >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {stats.totalUtilidades.sus >= 0 ? (
                                    <ThumbsUp className="w-5 h-5 shrink-0 hidden sm:inline" />
                                ) : (
                                    <ThumbsDown className="w-5 h-5 shrink-0 hidden sm:inline" />
                                )}
                                <span>{formatCurrency(stats.totalUtilidades.sus, 'USD')}</span>
                            </div>

                            <div className="col-span-1"></div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Principal de Desglose de Detalle */}
            <Modal
                isOpen={!!selectedDetail}
                onClose={() => setSelectedDetail(null)}
                title={`Desglose: ${selectedDetail?.title || ''} (${selectedDetail?.currency || ''})`}
                className="max-w-6xl max-h-[92vh] flex flex-col"
            >
                <div className="space-y-4">
                    {/* Barra de búsqueda y botones de exportación */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar en este desglose..."
                                value={modalSearch}
                                onChange={(e) => setModalSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {canExport && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrintModal}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-card border rounded-lg text-xs font-semibold hover:bg-accent transition-colors shadow-xs"
                                    title="Imprimir Desglose"
                                >
                                    <Printer className="w-3.5 h-3.5 text-muted-foreground" />
                                    Imprimir
                                </button>
                                <button
                                    onClick={handleExportModalPDF}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-card border rounded-lg text-xs font-semibold hover:bg-accent transition-colors shadow-xs"
                                    title="Exportar Desglose a PDF"
                                >
                                    <FileText className="w-3.5 h-3.5 text-red-500" />
                                    PDF
                                </button>
                                <button
                                    onClick={handleExportModalExcel}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-card border rounded-lg text-xs font-semibold hover:bg-accent transition-colors shadow-xs"
                                    title="Exportar Desglose a Excel"
                                >
                                    <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" />
                                    Excel
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tabla de Desglose según la Categoría Seleccionada */}
                    <div className="border rounded-xl overflow-hidden max-h-[55vh] overflow-y-auto overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-muted/80 sticky top-0 border-b z-10">
                                {selectedDetail?.key === 'cobranzas' && (
                                    <tr>
                                        <th className="p-2.5 font-bold text-center w-10">#</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Fecha</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Nro. Venta</th>
                                        <th className="p-2.5 font-bold">Cliente</th>
                                        <th className="p-2.5 font-bold">Vendedor</th>
                                        <th className="p-2.5 font-bold">Nota de venta</th>
                                        <th className="p-2.5 font-bold">Método</th>
                                        <th className="p-2.5 font-bold">Referencia</th>
                                        <th className="p-2.5 font-bold text-center">Comprobante</th>
                                        <th className="p-2.5 font-bold text-right whitespace-nowrap">Monto</th>
                                    </tr>
                                )}

                                {selectedDetail?.key === 'pagosProveedores' && (
                                    <tr>
                                        <th className="p-2.5 font-bold text-center w-10">#</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Fecha</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Nro Compra</th>
                                        <th className="p-2.5 font-bold">Proveedor</th>
                                        <th className="p-2.5 font-bold">Método</th>
                                        <th className="p-2.5 font-bold">Referencia</th>
                                        <th className="p-2.5 font-bold text-center">Comprobante</th>
                                        <th className="p-2.5 font-bold text-right whitespace-nowrap">Monto</th>
                                    </tr>
                                )}

                                {selectedDetail?.key === 'egresosDiarios' && (
                                    <tr>
                                        <th className="p-2.5 font-bold text-center w-10">#</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Fecha</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Código</th>
                                        <th className="p-2.5 font-bold">Detalle / Concepto</th>
                                        <th className="p-2.5 font-bold">Método</th>
                                        <th className="p-2.5 font-bold text-center">Comprobante</th>
                                        <th className="p-2.5 font-bold text-right whitespace-nowrap">Monto</th>
                                    </tr>
                                )}

                                {selectedDetail?.key === 'gastosImportacion' && (
                                    <tr>
                                        <th className="p-2.5 font-bold text-center w-10">#</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Fecha</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Nro Compra</th>
                                        <th className="p-2.5 font-bold">Proveedor</th>
                                        <th className="p-2.5 font-bold text-center">Gastos de Importación</th>
                                        <th className="p-2.5 font-bold">Método</th>
                                        <th className="p-2.5 font-bold">Referencia</th>
                                        <th className="p-2.5 font-bold text-center">Comprobante</th>
                                        <th className="p-2.5 font-bold text-right whitespace-nowrap">Monto</th>
                                    </tr>
                                )}

                                {selectedDetail?.key === 'pagosFletes' && (
                                    <tr>
                                        <th className="p-2.5 font-bold text-center w-10">#</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Fecha</th>
                                        <th className="p-2.5 font-bold whitespace-nowrap">Código</th>
                                        <th className="p-2.5 font-bold">Sucursal Origen</th>
                                        <th className="p-2.5 font-bold">Sucursal Destino</th>
                                        <th className="p-2.5 font-bold">Motivo</th>
                                        <th className="p-2.5 font-bold text-right whitespace-nowrap">Monto</th>
                                    </tr>
                                )}
                            </thead>

                            <tbody className="divide-y">
                                {filteredModalItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={10} className="p-8 text-center text-muted-foreground italic">
                                            No se encontraron transacciones registradas en este período.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredModalItems.map((item: any, idx: number) => {
                                        const num = idx + 1;
                                        return (
                                            <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                {/* Category: Cobranzas */}
                                                {selectedDetail?.key === 'cobranzas' && (
                                                    <>
                                                        <td className="p-2.5 text-center text-muted-foreground font-mono">{num}</td>
                                                        <td className="p-2.5 whitespace-nowrap text-muted-foreground font-mono">{item.fecha}</td>
                                                        <td className="p-2.5 whitespace-nowrap">
                                                            {item.notaId ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingDetalleVentaId(item.notaId)}
                                                                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                                    title="Ver detalle y productos de la venta"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    {item.nroVenta}
                                                                </button>
                                                            ) : (
                                                                <span className="font-bold text-primary">{item.nroVenta}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 font-medium text-foreground">{item.cliente}</td>
                                                        <td className="p-2.5 text-muted-foreground">{item.vendedor}</td>
                                                        <td className="p-2.5 text-muted-foreground">{item.notaVenta}</td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 bg-muted rounded font-medium text-[11px]">{item.metodo}</span>
                                                        </td>
                                                        <td className="p-2.5 text-muted-foreground">{item.referencia}</td>
                                                        <td className="p-2.5 text-center">
                                                            {item.comprobanteUrl ? (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setViewingComprobante(item.comprobanteUrl)} 
                                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px] cursor-pointer"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-right font-bold text-foreground whitespace-nowrap">
                                                            {formatNumberOnly(item.monto)}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Category: Pagos a Proveedores */}
                                                {selectedDetail?.key === 'pagosProveedores' && (
                                                    <>
                                                        <td className="p-2.5 text-center text-muted-foreground font-mono">{num}</td>
                                                        <td className="p-2.5 whitespace-nowrap text-muted-foreground font-mono">{item.fecha}</td>
                                                        <td className="p-2.5 whitespace-nowrap">
                                                            {item.notaId ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingDetalleCompraId(item.notaId)}
                                                                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                                    title="Ver detalle y productos de la compra"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    {item.nroCompra}
                                                                </button>
                                                            ) : (
                                                                <span className="font-bold text-primary">{item.nroCompra}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 font-medium text-foreground">{item.proveedor}</td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 bg-muted rounded font-medium text-[11px]">{item.metodo}</span>
                                                        </td>
                                                        <td className="p-2.5 text-muted-foreground">{item.referencia}</td>
                                                        <td className="p-2.5 text-center">
                                                            {item.comprobanteUrl ? (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setViewingComprobante(item.comprobanteUrl)} 
                                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px] cursor-pointer"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-right font-bold text-foreground whitespace-nowrap">
                                                            {formatNumberOnly(item.monto)}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Category: Egresos Diarios */}
                                                {selectedDetail?.key === 'egresosDiarios' && (
                                                    <>
                                                        <td className="p-2.5 text-center text-muted-foreground font-mono">{num}</td>
                                                        <td className="p-2.5 whitespace-nowrap text-muted-foreground font-mono">{item.fecha}</td>
                                                        <td className="p-2.5 font-bold text-primary whitespace-nowrap">{item.codigo}</td>
                                                        <td className="p-2.5 font-medium text-foreground">{item.detalle}</td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 bg-muted rounded font-medium text-[11px]">{item.metodo}</span>
                                                        </td>
                                                        <td className="p-2.5 text-center">
                                                            {item.comprobanteUrl ? (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setViewingComprobante(item.comprobanteUrl)} 
                                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px] cursor-pointer"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted-foreground font-medium">{item.comprobante}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-right font-bold text-foreground whitespace-nowrap">
                                                            {formatNumberOnly(item.monto)}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Category: Gastos Costos de Importación */}
                                                {selectedDetail?.key === 'gastosImportacion' && (
                                                    <>
                                                        <td className="p-2.5 text-center text-muted-foreground font-mono">{num}</td>
                                                        <td className="p-2.5 whitespace-nowrap text-muted-foreground font-mono">{item.fecha}</td>
                                                        <td className="p-2.5 whitespace-nowrap">
                                                            {item.notaId ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setViewingDetalleCompraId(item.notaId)}
                                                                    className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all inline-flex items-center gap-1 cursor-pointer"
                                                                    title="Ver detalle y productos de la compra"
                                                                >
                                                                    <Eye className="w-3 h-3" />
                                                                    {item.nroCompra}
                                                                </button>
                                                            ) : (
                                                                <span className="font-bold text-primary">{item.nroCompra}</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 font-medium text-foreground">{item.proveedor}</td>
                                                        <td className="p-2.5 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => setSelectedSubmodalGastos({
                                                                    nroCompra: item.nroCompra,
                                                                    referencia: item.proveedor,
                                                                    gastos: item.gastos || [],
                                                                    totalBob: item.moneda === 'BOB' ? item.monto : (item.gastos || []).reduce((acc: number, g: any) => acc + (Number(g.montoBob) || 0), 0),
                                                                    totalUsd: item.moneda === 'USD' ? item.monto : (item.gastos || []).reduce((acc: number, g: any) => acc + (Number(g.montoUsd) || 0), 0),
                                                                })}
                                                                className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-md text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                                                title="Ver desglose detallado de gastos"
                                                            >
                                                                <Receipt className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                                                <span>Ver Gastos ({item.gastos?.length || 0})</span>
                                                            </button>
                                                        </td>
                                                        <td className="p-2.5">
                                                            <span className="px-2 py-0.5 bg-muted rounded font-medium text-[11px]">{item.metodo}</span>
                                                        </td>
                                                        <td className="p-2.5 text-muted-foreground">{item.referencia}</td>
                                                        <td className="p-2.5 text-center">
                                                            {item.comprobanteUrl ? (
                                                                <button 
                                                                    type="button"
                                                                    onClick={() => setViewingComprobante(item.comprobanteUrl)} 
                                                                    className="inline-flex items-center gap-1 text-primary hover:underline font-semibold text-[11px] cursor-pointer"
                                                                >
                                                                    <Eye className="w-3.5 h-3.5" /> Ver
                                                                </button>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </td>
                                                        <td className="p-2.5 text-right font-bold text-foreground whitespace-nowrap">
                                                            {formatNumberOnly(item.monto)}
                                                        </td>
                                                    </>
                                                )}

                                                {/* Category: Pagos a Fletes por traspasos */}
                                                {selectedDetail?.key === 'pagosFletes' && (
                                                    <>
                                                        <td className="p-2.5 text-center text-muted-foreground font-mono">{num}</td>
                                                        <td className="p-2.5 whitespace-nowrap text-muted-foreground font-mono">{item.fecha}</td>
                                                        <td className="p-2.5 font-bold text-primary whitespace-nowrap">{item.codigo}</td>
                                                        <td className="p-2.5 font-medium text-foreground">{item.sucursalOrigen}</td>
                                                        <td className="p-2.5 font-medium text-foreground">{item.sucursalDestino}</td>
                                                        <td className="p-2.5 text-muted-foreground">{item.motivo}</td>
                                                        <td className="p-2.5 text-right font-bold text-foreground whitespace-nowrap">
                                                            {formatNumberOnly(item.monto)}
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer con Total del Desglose */}
                    <div className="flex items-center justify-between p-3.5 bg-muted/40 border rounded-xl text-sm font-bold">
                        <span className="text-muted-foreground">Total del Desglose ({filteredModalItems.length} registros):</span>
                        <span className="text-base font-extrabold text-primary">
                            {formatNumberOnly(modalTotal)}
                        </span>
                    </div>
                </div>
            </Modal>

            {/* Sub-Modal para Ver Planilla de Gastos de Importación */}
            <Modal
                isOpen={!!selectedSubmodalGastos}
                onClose={() => setSelectedSubmodalGastos(null)}
                title={`Gastos de Importación - ${selectedSubmodalGastos?.nroCompra || ''}`}
                className="max-w-2xl"
            >
                <div className="space-y-4">
                    <div className="p-3 bg-muted/30 border rounded-lg text-xs space-y-1">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Compra / Importación:</span>
                            <span className="font-bold text-primary">{selectedSubmodalGastos?.nroCompra}</span>
                        </div>
                        {selectedSubmodalGastos?.referencia && (
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Proveedor:</span>
                                <span className="font-medium text-foreground">{selectedSubmodalGastos.referencia}</span>
                            </div>
                        )}
                    </div>

                    <div className="border rounded-xl overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar shadow-xs">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="bg-muted/80 sticky top-0 border-b">
                                <tr>
                                    <th className="p-2.5 font-bold text-center w-12">#</th>
                                    <th className="p-2.5 font-bold">Concepto / Motivo de Gasto</th>
                                    <th className="p-2.5 font-bold text-right w-40">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {(!selectedSubmodalGastos?.gastos || selectedSubmodalGastos.gastos.length === 0) ? (
                                    <tr>
                                        <td colSpan={3} className="p-6 text-center text-muted-foreground italic">
                                            No se registraron gastos individuales para esta importación.
                                        </td>
                                    </tr>
                                ) : (
                                    selectedSubmodalGastos.gastos.map((g, idx) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-2.5 text-center text-muted-foreground font-mono">{idx + 1}</td>
                                            <td className="p-2.5 font-medium text-foreground">{g.motivo}</td>
                                            <td className="p-2.5 text-right font-bold text-foreground">
                                                {formatNumberOnly(g.montoBob)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-muted/40 border rounded-xl text-xs font-bold">
                        <span className="text-muted-foreground">Total Gastos:</span>
                        <span className="text-sm font-extrabold text-primary">
                            {formatNumberOnly(selectedSubmodalGastos?.totalBob || 0)}
                        </span>
                    </div>
                </div>
            </Modal>

            {/* Modal para Visualizar Comprobante / Voucher */}
            <Modal
                isOpen={viewingComprobante !== null}
                onClose={() => setViewingComprobante(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <ImageIcon className="w-5 h-5 text-primary/80" />
                        Comprobante / Voucher de Pago
                    </span>
                }
                className="max-w-2xl"
            >
                {viewingComprobante && (
                    <div className="space-y-4">
                        <div className="border rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 flex items-center justify-center p-2 min-h-[250px]">
                            {viewingComprobante.toLowerCase().endsWith('.pdf') ? (
                                <iframe
                                    src={getComprobanteFullUrl(viewingComprobante)}
                                    title="Comprobante PDF"
                                    className="w-full h-[65vh] rounded-lg border-0"
                                />
                            ) : (
                                <img
                                    src={getComprobanteFullUrl(viewingComprobante)}
                                    alt="Comprobante Completo"
                                    className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md"
                                />
                            )}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <a
                                href={getComprobanteFullUrl(viewingComprobante)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> Abrir en nueva pestaña
                            </a>
                            <button
                                type="button"
                                onClick={() => setViewingComprobante(null)}
                                className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all cursor-pointer"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal de Detalle de Venta */}
            <DetalleVentaModal
                isOpen={viewingDetalleVentaId !== null}
                onClose={() => setViewingDetalleVentaId(null)}
                notaId={viewingDetalleVentaId}
            />

            {/* Modal de Detalle de Compra */}
            <DetalleCompraModal
                isOpen={viewingDetalleCompraId !== null}
                onClose={() => setViewingDetalleCompraId(null)}
                notaId={viewingDetalleCompraId}
            />
        </div>
    );
};

export default UtilidadesPage;
