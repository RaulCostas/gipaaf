import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../ui/Modal';
import { 
    Calculator, Plus, Trash2, Save, X, Printer, 
    Sparkles, DollarSign, Calendar, Building2, Package, Coins,
    CreditCard, Receipt, FileText, Upload, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { importacionService } from '../../api/importacionService';
import type { CostoImportacionData, GastoImportacionItem } from '../../api/importacionService';
import { formatCurrency } from '../../utils/currencyUtils';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';

interface CostoImportacionModalProps {
    isOpen: boolean;
    onClose: () => void;
    compra: any;
    sucursales?: any[];
    ciudades?: any[];
    canManage?: boolean;
    onSuccess?: () => void;
}

const DEFAULT_EXPENSE_PRESETS = [
    'MONTO COMISIÓN',
    'ITF SALIDA 3%',
    'Seguro',
    'Transporte (maritimo)',
    'Transporte Terrestre arica-lpz',
    'Aduana (IVA)',
    'Comisión y gastos de despacho',
    'Liberacion del contenedor',
    'Cargo origen thc destino',
    'Otros Gastos',
    'Emision de documentos',
    'Descarguio La Paz',
    'Descarguío SC',
    'Descarguío CBBA',
    'Transporte (Hasta almacén SCZ)',
    'Transporte (Hasta almacén CBBA)'
];

export const CostoImportacionModal: React.FC<CostoImportacionModalProps> = ({
    isOpen,
    onClose,
    compra,
    sucursales = [],
    canManage = true,
    onSuccess,
}) => {
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

    // Form states
    const [fecha, setFecha] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedSucursalId, setSelectedSucursalId] = useState<string>('');
    const [tipoCambio, setTipoCambio] = useState<number>(6.96);
    const [monedaGastos, setMonedaGastos] = useState<'BOB' | 'USD'>('BOB');
    const [metodoPago, setMetodoPago] = useState<string>('Transferencia Bancaria');
    const [referencia, setReferencia] = useState<string>('');
    const [comprobanteUrl, setComprobanteUrl] = useState<string>('');
    const [gastos, setGastos] = useState<GastoImportacionItem[]>([]);

    // Determine purchase currency and clean provider name
    const isUSD = compra?.moneda === 'USD';
    const monedaCompra = compra?.moneda || 'BOB';
    
    // Provider name without any added parentheses like (ventas srl)
    const provNombre = useMemo(() => {
        if (!compra) return 'PROVEEDOR';
        if (compra.proveedor?.empresa && compra.proveedor.empresa.trim()) {
            return compra.proveedor.empresa.trim();
        }
        if (compra.proveedor?.persona) {
            const p = compra.proveedor.persona;
            return `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'PROVEEDOR';
        }
        return 'PROVEEDOR';
    }, [compra]);

    // Selected sucursal object
    const selectedSucursalObj = useMemo(() => {
        return sucursales.find(s => s.id === Number(selectedSucursalId));
    }, [sucursales, selectedSucursalId]);

    // Load initial data when modal opens or compra changes
    useEffect(() => {
        if (!isOpen || !compra) return;

        const loadData = async () => {
            setIsLoading(true);
            try {
                const existing = await importacionService.getByNotaId(compra.id);
                if (existing) {
                    setFecha(existing.fecha ? existing.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
                    setSelectedSucursalId(existing.sucursalId ? String(existing.sucursalId) : '');
                    setTipoCambio(Number(existing.tipoCambio) || Number(compra.tipoCambio) || 6.96);
                    setMonedaGastos(existing.monedaGastos || 'BOB');
                    setMetodoPago(existing.metodoPago || 'Transferencia Bancaria');
                    setReferencia(existing.referencia || '');
                    setComprobanteUrl(existing.comprobanteUrl || '');
                    setGastos(existing.gastos || []);
                } else {
                    // Por primera vez (sin registro): iniciar vacío para que el usuario use 'Cargar Plantilla'
                    setFecha(compra.fecha ? compra.fecha.split('T')[0] : format(new Date(), 'yyyy-MM-dd'));
                    setSelectedSucursalId('');
                    setTipoCambio(Number(compra.tipoCambio) || 6.96);
                    setMonedaGastos('BOB');
                    setMetodoPago('Transferencia Bancaria');
                    setReferencia('');
                    setComprobanteUrl('');
                    setGastos([]);
                }
            } catch (error) {
                console.error('Error loading import cost', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [isOpen, compra]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploadingFile(true);
        try {
            const res = await importacionService.uploadComprobante(file);
            if (res.error) {
                toast.error(res.message || res.error);
            } else if (res.url) {
                setComprobanteUrl(res.url);
                toast.success('Comprobante subido exitosamente');
            }
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al subir el comprobante');
        } finally {
            setIsUploadingFile(false);
        }
    };

    // Calculate FOB amounts respecting the purchase's original currency
    const totalCompra = Number(compra?.total) || 0;

    const costoFobUsd = useMemo(() => {
        if (isUSD) return totalCompra;
        return tipoCambio > 0 ? totalCompra / tipoCambio : 0;
    }, [isUSD, totalCompra, tipoCambio]);

    const costoFobBob = useMemo(() => {
        if (!isUSD) return totalCompra;
        return totalCompra * (tipoCambio || 1);
    }, [isUSD, totalCompra, tipoCambio]);

    // Handle updating expense row
    const handleUpdateGasto = (index: number, field: keyof GastoImportacionItem, value: any) => {
        setGastos(prev => {
            const next = [...prev];
            const current = { ...next[index] };

            if (field === 'motivo') {
                current.motivo = String(value);
            } else if (field === 'montoUsd') {
                const usd = Number(value) || 0;
                current.montoUsd = usd;
                // Auto convert to Bob if USD was entered
                current.montoBob = Number((usd * (tipoCambio || 1)).toFixed(2));
            } else if (field === 'montoBob') {
                const bob = Number(value) || 0;
                current.montoBob = bob;
                if (isUSD && tipoCambio > 0) {
                    current.montoUsd = Number((bob / tipoCambio).toFixed(2));
                }
            }

            // Recalculate percentage for this item
            if (costoFobBob > 0) {
                current.porcentaje = Number(((current.montoBob * 100) / costoFobBob).toFixed(2));
            } else {
                current.porcentaje = 0;
            }

            next[index] = current;
            return next;
        });
    };

    const handleAddGastoRow = () => {
        setGastos(prev => [...prev, { motivo: '', montoUsd: 0, montoBob: 0, porcentaje: 0 }]);
    };

    const handleRemoveGastoRow = (index: number) => {
        setGastos(prev => prev.filter((_, i) => i !== index));
    };

    const handleLoadFullPresets = () => {
        const existingMotivos = new Set(gastos.map(g => g.motivo.trim().toLowerCase()));
        const newItems: GastoImportacionItem[] = [...gastos];

        for (const preset of DEFAULT_EXPENSE_PRESETS) {
            if (!existingMotivos.has(preset.toLowerCase())) {
                newItems.push({ motivo: preset, montoUsd: 0, montoBob: 0, porcentaje: 0 });
            }
        }
        setGastos(newItems);
        toast.info('Plantilla de motivos de importación cargada');
    };

    // Calculate totals
    const totalGastosBob = useMemo(() => {
        return gastos.reduce((sum, g) => sum + (Number(g.montoBob) || 0), 0);
    }, [gastos]);

    const costoTotalBob = useMemo(() => {
        return costoFobBob + totalGastosBob;
    }, [costoFobBob, totalGastosBob]);

    const porcentajeGastosTotal = useMemo(() => {
        if (costoFobBob <= 0) return 0;
        return (totalGastosBob * 100) / costoFobBob;
    }, [totalGastosBob, costoFobBob]);

    // Detail products landed price preview
    const productosPreview = useMemo(() => {
        if (!compra?.detalles) return [];
        const factor = 1 + (porcentajeGastosTotal / 100);

        return compra.detalles.map((det: any) => {
            const unitPriceOriginal = Number(det.precioUnitario) || 0;
            const unitPriceBob = isUSD ? unitPriceOriginal * (tipoCambio || 1) : unitPriceOriginal;
            const landedCost = unitPriceBob * factor;

            return {
                id: det.producto?.id || det.id,
                codigo: det.producto?.codigo || '-',
                nombre: det.producto?.nombre || 'Producto',
                cantidad: Number(det.cantidad) || 0,
                precioUnitarioOriginal: unitPriceOriginal,
                precioUnitarioFobBob: unitPriceBob,
                nuevoPrecioCompra: Number(landedCost.toFixed(2)),
                incrementoUnitario: Number((landedCost - unitPriceBob).toFixed(2))
            };
        });
    }, [compra, isUSD, tipoCambio, porcentajeGastosTotal]);

    // Handle Save
    const handleSave = async () => {
        if (!compra?.id) return;
        setIsSaving(true);
        try {
            const payload: Partial<CostoImportacionData> = {
                notaId: compra.id,
                sucursalId: selectedSucursalId ? Number(selectedSucursalId) : undefined,
                fecha,
                tipoCambio: isUSD ? tipoCambio : 1,
                costoFobUsd: Number(costoFobUsd.toFixed(2)),
                costoFobBob: Number(costoFobBob.toFixed(2)),
                totalGastosBob: Number(totalGastosBob.toFixed(2)),
                costoTotalBob: Number(costoTotalBob.toFixed(2)),
                porcentajeGastos: Number(porcentajeGastosTotal.toFixed(4)),
                monedaGastos,
                metodoPago,
                referencia,
                comprobanteUrl,
                gastos: gastos.map(g => ({
                    motivo: g.motivo,
                    montoUsd: isUSD ? (Number(g.montoUsd) || 0) : 0,
                    montoBob: Number(g.montoBob) || 0,
                    porcentaje: costoFobBob > 0 ? Number(((Number(g.montoBob) * 100) / costoFobBob).toFixed(2)) : 0
                }))
            };

            await importacionService.guardar(compra.id, payload);
            queryClient.invalidateQueries({ queryKey: ['purchases'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });

            toast.success('Costo de importación guardado y precios de compra actualizados exitosamente');
            if (onSuccess) onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || 'Error al guardar el costo de importación');
        } finally {
            setIsSaving(false);
        }
    };

    // Print liquidation sheet with GIPAAF logo
    const handlePrint = () => {
        const sucursalName = selectedSucursalObj?.nombre || '';
        const ciudadName = selectedSucursalObj?.ciudad?.nombre ? ` - ${selectedSucursalObj.ciudad.nombre}` : '';

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Por favor permite las ventanas emergentes para imprimir');
            return;
        }

        const rowsHtml = gastos.map(g => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 6px 10px; font-size: 12px;">${g.motivo || '-'}</td>
                ${isUSD ? `<td style="border: 1px solid #ddd; padding: 6px 10px; text-align: right; font-size: 12px;">${g.montoUsd ? g.montoUsd.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''}</td>` : ''}
                <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: right; font-size: 12px; font-weight: bold;">${(Number(g.montoBob) || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: right; font-size: 12px;">${costoFobBob > 0 ? ((Number(g.montoBob) * 100) / costoFobBob).toFixed(2) : '0.00'}%</td>
            </tr>
        `).join('');

        const prodsHtml = productosPreview.map((p: any) => `
            <tr>
                <td style="border: 1px solid #ddd; padding: 6px 8px; font-size: 11px;">${p.codigo}</td>
                <td style="border: 1px solid #ddd; padding: 6px 8px; font-size: 11px;">${p.nombre}</td>
                <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: center; font-size: 11px;">${p.cantidad}</td>
                <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; font-size: 11px;">${isUSD ? `$ ${p.precioUnitarioOriginal.toFixed(2)} (Bs. ${p.precioUnitarioFobBob.toFixed(2)})` : `Bs. ${p.precioUnitarioOriginal.toFixed(2)}`}</td>
                <td style="border: 1px solid #ddd; padding: 6px 8px; text-align: right; font-size: 11px; font-weight: bold; color: #1e3a8a;">Bs. ${p.nuevoPrecioCompra.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Costo de Importación - ${compra?.numero || ''}</title>
                <style>
                    @page { size: auto; margin: 15mm; }
                    body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #111; }
                    .header-box { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #eaeaea; padding-bottom: 12px; margin-bottom: 15px; }
                    .logo { max-height: 52px; object-fit: contain; }
                    .title-box { text-align: right; }
                    .title { font-size: 19px; font-weight: bold; color: #b91c1c; text-transform: uppercase; margin: 0 0 4px 0; }
                    .subtitle { font-size: 13px; font-weight: bold; color: #333; text-transform: uppercase; margin: 0; }
                    .info-bar { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 8px 12px; border-radius: 6px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { background-color: #2980b9; color: #ffffff; border: 1px solid #2980b9; padding: 8px 10px; font-size: 12px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .highlight { background-color: #fef08a; font-weight: bold; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    .footer-note { font-size: 11px; font-style: italic; color: #666; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="header-box">
                    <img src="/logo.jpeg" alt="Logo GIPAAF" class="logo" onerror="this.style.display='none'" />
                    <div class="title-box">
                        <h2 class="title">COSTO IMPORTACIÓN ${provNombre}</h2>
                        ${sucursalName ? `<p class="subtitle">COSTO ALMACÉN ${sucursalName.toUpperCase()}${ciudadName.toUpperCase()}</p>` : ''}
                    </div>
                </div>

                <div class="info-bar">
                    <span><strong>N° Compra:</strong> ${compra?.numero || '-'}</span>
                    <span><strong>Moneda Compra:</strong> ${monedaCompra}</span>
                    <span><strong>Fecha Liquidación:</strong> ${fecha.split('-').reverse().join('/')}</span>
                    ${isUSD ? `<span><strong>Tipo de Cambio:</strong> ${tipoCambio}</span>` : ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left;">Concepto / Motivo</th>
                            ${isUSD ? '<th style="text-align: right; width: 110px;">Dólares ($)</th>' : ''}
                            <th style="text-align: right; width: 130px;">Bolivianos (Bs.)</th>
                            <th style="text-align: right; width: 90px;">Porcentual</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="background-color: #f8fafc; font-weight: bold;">
                            <td style="border: 1px solid #ddd; padding: 6px 10px; font-size: 12px;">Costo FOB ${provNombre}</td>
                            ${isUSD ? `<td style="border: 1px solid #ddd; padding: 6px 10px; text-align: right; font-size: 12px;">$ ${costoFobUsd.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>` : ''}
                            <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: right; font-size: 12px;">Bs. ${costoFobBob.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="border: 1px solid #ddd; padding: 6px 10px; text-align: right; font-size: 12px;">-</td>
                        </tr>
                        ${rowsHtml}
                        <tr style="background-color: #f1f5f9; font-weight: bold;">
                            <td colspan="${isUSD ? 2 : 1}" style="border: 1px solid #ddd; padding: 8px 10px; text-align: right; font-size: 12px;">Costo Total</td>
                            <td style="border: 1px solid #ddd; padding: 8px 10px; text-align: right; font-size: 13px;">Bs. ${costoTotalBob.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td style="border: 1px solid #ddd; padding: 8px 10px;"></td>
                        </tr>
                        <tr style="background-color: #e2e8f0; font-weight: bold;">
                            <td colspan="${isUSD ? 2 : 1}" style="border: 1px solid #ddd; padding: 8px 10px; text-align: right; font-size: 13px;">Total Gastos</td>
                            <td style="border: 1px solid #ddd; padding: 8px 10px; text-align: right; font-size: 13px; color: #b91c1c;">Bs. ${totalGastosBob.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            <td class="highlight" style="border: 1px solid #ddd; padding: 8px 10px; text-align: right; font-size: 14px; color: #854d0e;">${porcentajeGastosTotal.toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>

                <h4 style="margin: 15px 0 8px 0; font-size: 13px; color: #1e3a8a;">Actualización de Costos por Producto</h4>
                <table>
                    <thead>
                        <tr>
                            <th style="text-align: left; width: 90px;">Código</th>
                            <th style="text-align: left;">Producto</th>
                            <th style="text-align: center; width: 60px;">Cant.</th>
                            <th style="text-align: right; width: 140px;">Costo FOB Unit. (${monedaCompra})</th>
                            <th style="text-align: right; width: 140px;">Nuevo Costo Real (Bs.)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prodsHtml}
                    </tbody>
                </table>

                <div class="footer-note">
                    Fórmula aplicada: <strong>Total Gastos &times; 100 / Costo FOB</strong> = ${porcentajeGastosTotal.toFixed(2)}% de incremento aplicado al costo de compra de cada producto.
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 300);
    };

    if (!compra) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-primary">
                    <Calculator className="w-6 h-6 text-primary" />
                    <span>Costo de Importación & Liquidación</span>
                </div>
            }
            className="max-w-5xl"
        >
            {isLoading ? (
                <div className="py-12 text-center text-muted-foreground animate-pulse">
                    Cargando información de importación...
                </div>
            ) : (
                <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
                    {/* Header Banner - Excel like */}
                    <div className="p-4 bg-gradient-to-r from-red-50 via-red-100/40 to-muted dark:from-red-950/30 dark:via-background dark:to-muted/20 border border-red-200/60 dark:border-red-900/40 rounded-xl text-center shadow-sm">
                        <h2 className="text-xl font-black text-red-600 dark:text-red-400 tracking-wide uppercase">
                            COSTO IMPORTACIÓN {provNombre}
                        </h2>
                        {selectedSucursalObj && (
                            <div className="flex items-center justify-center gap-2 mt-1 text-xs font-bold text-foreground/80 uppercase">
                                <span>COSTO ALMACÉN:</span>
                                <span className="text-primary">
                                    {selectedSucursalObj.nombre} {selectedSucursalObj.ciudad?.nombre ? `(${selectedSucursalObj.ciudad.nombre})` : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Parameters Bar */}
                    <div className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/60">
                        <div className={`grid grid-cols-1 ${isUSD ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-3`}>
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha Liquidación
                                </label>
                                <input
                                    type="date"
                                    value={fecha}
                                    onChange={(e) => setFecha(e.target.value)}
                                    disabled={!canManage}
                                    className="w-full px-3 py-1.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Building2 className="w-3.5 h-3.5 text-primary" /> Sucursal / Almacén Destino
                                </label>
                                <select
                                    value={selectedSucursalId}
                                    onChange={(e) => setSelectedSucursalId(e.target.value)}
                                    disabled={!canManage}
                                    className="w-full px-3 py-1.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-medium cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="">Seleccionar Sucursal (Ciudad)...</option>
                                    {sucursales.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                    <Coins className="w-3.5 h-3.5 text-blue-600" /> Moneda de Compra (Fija)
                                </label>
                                <div className="px-3 py-1.5 text-sm bg-muted/60 border rounded-lg font-bold text-foreground flex items-center justify-between cursor-not-allowed select-none">
                                    <span>{monedaCompra === 'USD' ? 'USD (Dólares)' : 'BOB (Bolivianos)'}</span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-background text-muted-foreground font-mono font-bold border">
                                        Solo Lectura
                                    </span>
                                </div>
                            </div>

                            {isUSD && (
                                <div className="space-y-1">
                                    <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                                        <DollarSign className="w-3.5 h-3.5 text-green-600" /> Tipo de Cambio (T/C)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={tipoCambio}
                                            onChange={(e) => setTipoCambio(Number(e.target.value) || 0)}
                                            disabled={!canManage}
                                            className="w-full px-3 py-1.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-bold text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                                            placeholder="6.96"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-mono">
                                            Bs./$
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Datos de Pago de los Gastos de Importación */}
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50 items-start">
                            {/* Moneda de Gastos */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <DollarSign className="w-3.5 h-3.5 text-primary" /> Moneda Pago Gastos
                                </label>
                                <select
                                    value={monedaGastos}
                                    onChange={(e) => setMonedaGastos(e.target.value as any)}
                                    disabled={!canManage}
                                    className="w-full px-3 py-1.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 font-bold text-foreground cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="BOB">BOB - Bolivianos (Bs.)</option>
                                    <option value="USD">USD - Dólares ($us)</option>
                                </select>
                            </div>

                            {/* Forma de Pago */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <CreditCard className="w-3.5 h-3.5 text-primary" /> Forma de Pago
                                </label>
                                <select
                                    value={metodoPago}
                                    onChange={(e) => setMetodoPago(e.target.value)}
                                    disabled={!canManage}
                                    className="w-full px-3 py-1.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground cursor-pointer font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                                    <option value="QR">QR</option>
                                    <option value="Efectivo">Efectivo</option>
                                    <option value="Depósito Bancario">Depósito Bancario</option>
                                    <option value="Cheque">Cheque</option>
                                    <option value="Tarjeta">Tarjeta</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            {/* Referencia */}
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-primary" /> Nro. Transacción / Referencia / DUI
                                </label>
                                <input
                                    type="text"
                                    placeholder="Ej. TRF-10293, DUI-482, DIM..."
                                    value={referencia}
                                    onChange={(e) => setReferencia(e.target.value)}
                                    disabled={!canManage}
                                    className="w-full px-3 py-1.5 text-sm bg-background border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 text-foreground disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>

                            {/* Comprobante Upload */}
                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Receipt className="w-3.5 h-3.5 text-primary" /> Comprobante
                                    </label>
                                    {comprobanteUrl && canManage && (
                                        <button
                                            type="button"
                                            onClick={() => setComprobanteUrl('')}
                                            className="text-[10px] text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                                        >
                                            <Trash2 className="w-3 h-3" /> Quitar
                                        </button>
                                    )}
                                </div>

                                {comprobanteUrl ? (
                                    <div className="flex items-center justify-between p-1.5 bg-background border rounded-lg text-xs">
                                        <a
                                            href={comprobanteUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-primary hover:underline font-bold flex items-center gap-1 truncate"
                                        >
                                            <Eye className="w-3.5 h-3.5 shrink-0" /> Ver Archivo
                                        </a>
                                        <span className="text-[10px] text-green-600 font-bold bg-green-100 dark:bg-green-950/60 px-1.5 py-0.5 rounded">
                                            Adjuntado
                                        </span>
                                    </div>
                                ) : canManage ? (
                                    <label className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-primary/50 hover:bg-primary/5 rounded-lg text-xs text-primary font-semibold cursor-pointer transition-colors">
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>{isUploadingFile ? 'Subiendo...' : 'Adjuntar Voucher / Doc'}</span>
                                        <input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={handleFileUpload}
                                            disabled={isUploadingFile}
                                            className="hidden"
                                        />
                                    </label>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic block py-1.5">Sin comprobante</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Cost Breakdown Table */}
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/60 border-b">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Desglose de Costos y Partidas de Gasto
                            </span>
                            {canManage && (
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleLoadFullPresets}
                                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-background hover:bg-accent border rounded-lg text-primary font-semibold transition-all shadow-2xs cursor-pointer"
                                        title="Cargar lista completa de partidas habituales"
                                    >
                                        <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Cargar Plantilla
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleAddGastoRow}
                                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-all shadow-2xs cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" /> Agregar Gasto
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-sky-100/70 dark:bg-sky-950/50 border-b text-sky-900 dark:text-sky-200">
                                        <th className="p-3 text-xs font-bold">Concepto / Motivo</th>
                                        {isUSD && <th className="p-3 text-xs font-bold text-right w-36">Dólares ($)</th>}
                                        <th className="p-3 text-xs font-bold text-right w-44">Bolivianos (Bs.)</th>
                                        <th className="p-3 text-xs font-bold text-right w-28">Porcentual (%)</th>
                                        <th className="p-3 text-xs font-bold text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-sm">
                                    {/* Costo FOB Row */}
                                    <tr className="bg-muted/30 font-bold">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                <span className="text-foreground">
                                                    Costo FOB {provNombre}
                                                </span>
                                            </div>
                                        </td>
                                        {isUSD && (
                                            <td className="p-3 text-right font-mono text-muted-foreground">
                                                {formatCurrency(costoFobUsd, 'USD')}
                                            </td>
                                        )}
                                        <td className="p-3 text-right font-mono text-foreground font-bold">
                                            {formatCurrency(costoFobBob, 'BOB')}
                                        </td>
                                        <td className="p-3 text-right font-mono text-muted-foreground text-xs">
                                            100% (Base)
                                        </td>
                                        <td className="p-3"></td>
                                    </tr>

                                    {/* Empty state when no expenses */}
                                    {gastos.length === 0 && (
                                        <tr>
                                            <td colSpan={isUSD ? 5 : 4} className="p-6 text-center text-muted-foreground text-xs italic bg-muted/10">
                                                No hay partidas de gastos agregadas. Haz clic en <strong className="text-foreground font-semibold">"Cargar Plantilla"</strong> para cargar los conceptos habituales o en <strong className="text-foreground font-semibold">"Agregar Gasto"</strong> para añadir uno personalizado.
                                            </td>
                                        </tr>
                                    )}

                                    {/* Expenses rows */}
                                    {gastos.map((gasto, index) => {
                                        const itemPct = costoFobBob > 0 ? (Number(gasto.montoBob || 0) * 100) / costoFobBob : 0;
                                        return (
                                            <tr key={index} className="hover:bg-accent/30 transition-colors group">
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        placeholder="Motivo de gasto..."
                                                        value={gasto.motivo}
                                                        onChange={(e) => handleUpdateGasto(index, 'motivo', e.target.value)}
                                                        disabled={!canManage}
                                                        className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-md focus:ring-1 focus:ring-primary outline-none disabled:opacity-75 disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                                {isUSD && (
                                                    <td className="p-2 text-right">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="0.00"
                                                            value={gasto.montoUsd || ''}
                                                            onChange={(e) => handleUpdateGasto(index, 'montoUsd', e.target.value)}
                                                            disabled={!canManage}
                                                            className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-md focus:ring-1 focus:ring-primary outline-none text-right font-mono disabled:opacity-75 disabled:cursor-not-allowed"
                                                        />
                                                    </td>
                                                )}
                                                <td className="p-2 text-right">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="0.00"
                                                        value={gasto.montoBob || ''}
                                                        onChange={(e) => handleUpdateGasto(index, 'montoBob', e.target.value)}
                                                        disabled={!canManage}
                                                        className="w-full px-2.5 py-1.5 text-xs bg-background border rounded-md focus:ring-1 focus:ring-primary outline-none text-right font-mono font-bold disabled:opacity-75 disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                                <td className="p-2 text-right font-mono text-xs font-semibold text-muted-foreground">
                                                    {itemPct > 0 ? `${itemPct.toFixed(2)}%` : '0.00%'}
                                                </td>
                                                <td className="p-2 text-center">
                                                    {canManage ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveGastoRow(index)}
                                                            className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                                                            title="Eliminar fila"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    ) : (
                                                        <span className="text-muted-foreground/30">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="border-t-2 border-border/80 bg-muted/40 font-bold text-sm">
                                    {/* Costo Total */}
                                    <tr className="border-b">
                                        <td colSpan={isUSD ? 2 : 1} className="p-3 text-right uppercase text-xs text-muted-foreground">
                                            Costo Total (FOB + Gastos)
                                        </td>
                                        <td className="p-3 text-right font-mono text-foreground font-black text-base">
                                            {formatCurrency(costoTotalBob, 'BOB')}
                                        </td>
                                        <td colSpan={2}></td>
                                    </tr>

                                    {/* Total Gastos + Increment % */}
                                    <tr className="bg-amber-50 dark:bg-amber-950/30">
                                        <td colSpan={isUSD ? 2 : 1} className="p-3 text-right uppercase text-xs text-amber-900 dark:text-amber-300 font-extrabold">
                                            Total Gastos
                                        </td>
                                        <td className="p-3 text-right font-mono text-red-600 dark:text-red-400 font-black text-base">
                                            {formatCurrency(totalGastosBob, 'BOB')}
                                        </td>
                                        <td className="p-3 text-right">
                                            <span className="inline-block px-2.5 py-1 rounded-md bg-yellow-300 text-yellow-950 dark:bg-yellow-400 dark:text-black font-black text-sm shadow-xs font-mono">
                                                {porcentajeGastosTotal.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Formula Explanation */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-muted/30 border rounded-lg text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">Fórmula de Factor de Importación:</span>
                            <code className="px-2 py-0.5 bg-background border rounded font-mono text-primary font-bold">
                                (Total Gastos &times; 100) / Costo FOB
                            </code>
                        </div>
                        <div>
                            <span>Incremento de Costo: </span>
                            <strong className="text-foreground">+{porcentajeGastosTotal.toFixed(2)}%</strong>
                        </div>
                    </div>

                    {/* Products Cost Update Preview */}
                    <div className="border rounded-xl overflow-hidden shadow-sm bg-card">
                        <div className="px-4 py-2.5 bg-muted/60 border-b flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                    Previsualización de Actualización de Precios de Compra ({productosPreview.length} productos)
                                </span>
                            </div>
                            <span className="text-[11px] text-muted-foreground italic">
                                Al guardar, se actualizará el campo precioCompra en la tabla de productos.
                            </span>
                        </div>

                        <div className="overflow-x-auto max-h-56">
                            <table className="w-full text-left border-collapse min-w-[600px]">
                                <thead>
                                    <tr className="bg-muted/30 border-b text-[11px] font-semibold text-muted-foreground uppercase">
                                        <th className="p-2.5">Código</th>
                                        <th className="p-2.5">Producto</th>
                                        <th className="p-2.5 text-center">Cant.</th>
                                        <th className="p-2.5 text-right">Costo FOB Unit. ({monedaCompra})</th>
                                        <th className="p-2.5 text-right font-bold text-primary">Nuevo Costo Real (Bs.)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y text-xs">
                                    {productosPreview.map((p: any) => (
                                        <tr key={p.id} className="hover:bg-accent/30 transition-colors">
                                            <td className="p-2.5 font-mono text-muted-foreground">{p.codigo}</td>
                                            <td className="p-2.5 font-medium text-foreground">{p.nombre}</td>
                                            <td className="p-2.5 text-center font-mono">{p.cantidad}</td>
                                            <td className="p-2.5 text-right font-mono text-muted-foreground">
                                                {isUSD 
                                                    ? `$ ${p.precioUnitarioOriginal.toFixed(2)} (Bs. ${p.precioUnitarioFobBob.toFixed(2)})`
                                                    : formatCurrency(p.precioUnitarioOriginal, 'BOB')
                                                }
                                            </td>
                                            <td className="p-2.5 text-right font-mono font-bold text-primary">
                                                {formatCurrency(p.nuevoPrecioCompra, 'BOB')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-xs font-bold hover:bg-accent text-foreground transition-all shadow-sm cursor-pointer w-full sm:w-auto justify-center"
                        >
                            <Printer className="w-4 h-4 text-muted-foreground" /> Imprimir Liquidación
                        </button>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all cursor-pointer"
                            >
                                <X className="w-3.5 h-3.5 inline mr-1" /> {canManage ? 'Cancelar' : 'Cerrar'}
                            </button>
                            {canManage && (
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                                >
                                    <Save className="w-4 h-4" />
                                    {isSaving ? 'Guardando...' : 'Guardar y Actualizar Costo de Compra'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
};
