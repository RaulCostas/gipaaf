import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesService } from '../../api/salesService';
import Modal from '../ui/Modal';
import { ShoppingCart, Receipt, User, Calendar, CreditCard, Package, Building2 } from 'lucide-react';
import { format } from 'date-fns';

interface DetalleVentaModalProps {
    isOpen: boolean;
    onClose: () => void;
    nota?: any | null;
    notaId?: number | null;
}

export const DetalleVentaModal: React.FC<DetalleVentaModalProps> = ({
    isOpen,
    onClose,
    nota,
    notaId
}) => {
    const targetId = nota?.id || notaId;

    // Fetch full sale detail if targetId is present and nota is missing details
    const { data: fullNota, isLoading } = useQuery({
        queryKey: ['detalleVentaModal', targetId],
        queryFn: () => salesService.getOne(Number(targetId)),
        enabled: isOpen && !!targetId && (!nota?.detalles || nota.detalles.length === 0)
    });

    const activeNota = fullNota || nota;

    if (!isOpen) return null;

    const clienteName = activeNota?.cliente?.persona 
        ? `${activeNota.cliente.persona.nombres} ${activeNota.cliente.persona.apellidos}` 
        : (activeNota?.cliente?.razonSocial || 'Cliente General');

    const isUSD = activeNota?.moneda === 'USD';
    const sim = isUSD ? '$us' : 'Bs.';
    const total = Number(activeNota?.total) || 0;
    const saldo = Number(activeNota?.saldo) || 0;
    const cobrado = Math.max(0, total - saldo);
    const subtotalGeneral = Number(activeNota?.subtotal) || total;
    const desc1 = Number(activeNota?.descuento) || 0;
    const desc2 = Number(activeNota?.descuentoPromocion) || 0;
    const vendedorName = activeNota?.vendedor
        ? `${activeNota.vendedor.nombres || ''} ${activeNota.vendedor.apellidos || ''}`.trim() || activeNota.vendedor.nombre || '-'
        : (activeNota?.usuario
            ? `${activeNota.usuario.nombres || ''} ${activeNota.usuario.apellidos || ''}`.trim() || activeNota.usuario.username || '-'
            : '-');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-primary font-bold text-lg flex-wrap">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <span>Detalle de Venta - <span className="font-mono text-foreground">{activeNota?.numero || 'Cargando...'}</span></span>
                    {activeNota && (
                        saldo <= 0.001 ? (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300 border border-green-200 dark:border-green-800">
                                100% Pagada
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                Saldo: {sim} {saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}
                            </span>
                        )
                    )}
                </div>
            }
            className="max-w-3xl max-h-[90vh] flex flex-col"
        >
            {isLoading && !activeNota ? (
                <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                    Cargando información de la venta...
                </div>
            ) : (
                <div className="space-y-5 overflow-y-auto max-h-[calc(90vh-130px)] px-1.5 py-1 custom-scrollbar">
                    {/* Header Info Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-muted/30 border rounded-xl text-xs">
                        <div>
                            <span className="text-muted-foreground block text-[11px]">Cliente:</span>
                            <span className="font-bold text-foreground flex items-center gap-1 mt-0.5">
                                <User className="w-3.5 h-3.5 text-primary" />
                                {clienteName}
                            </span>
                        </div>

                        <div>
                            <span className="text-muted-foreground block text-[11px]">Fecha de Venta:</span>
                            <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                <Calendar className="w-3.5 h-3.5 text-primary" />
                                {activeNota?.fecha ? format(new Date(activeNota.fecha.substring(0, 10) + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                            </span>
                        </div>

                        <div>
                            <span className="text-muted-foreground block text-[11px]">Facturación:</span>
                            <div className="mt-0.5">
                                {activeNota?.conFactura ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                                        <Receipt className="w-3 h-3 text-blue-600" /> FAC: {activeNota.numeroFactura || 'S/N'}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground font-medium">📄 Sin Factura</span>
                                )}
                            </div>
                        </div>

                        <div>
                            <span className="text-muted-foreground block text-[11px]">Condición de Pago:</span>
                            <div className="mt-0.5">
                                {activeNota?.tipoPago === 'CREDITO' || (activeNota?.diasCredito > 0) ? (
                                    <div className="flex flex-col text-[11px]">
                                        <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                                            <CreditCard className="w-3 h-3" /> A Crédito ({activeNota?.diasCredito || 0} d)
                                        </span>
                                        {activeNota?.fechaVencimiento && (
                                            <span className="text-[10px] text-muted-foreground">
                                                Vence: {format(new Date(String(activeNota.fechaVencimiento).substring(0, 10) + 'T00:00:00'), 'dd/MM/yyyy')}
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <span className="font-medium text-foreground">💵 Al Contado</span>
                                )}
                            </div>
                        </div>

                        {activeNota?.sucursal?.nombre && (
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Sucursal:</span>
                                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                                    <Building2 className="w-3.5 h-3.5 text-primary" />
                                    {activeNota.sucursal.nombre} {activeNota.sucursal.ciudad?.nombre ? `(${activeNota.sucursal.ciudad.nombre})` : ''}
                                </span>
                            </div>
                        )}

                        <div>
                            <span className="text-muted-foreground block text-[11px]">Vendedor / Personal:</span>
                            <span className="font-semibold text-foreground mt-0.5 block">
                                {vendedorName}
                            </span>
                        </div>

                        {activeNota?.moneda && (
                            <div>
                                <span className="text-muted-foreground block text-[11px]">Moneda:</span>
                                <span className="font-bold text-foreground mt-0.5 block">
                                    {activeNota.moneda} {activeNota.tipoCambio ? `(TC: ${activeNota.tipoCambio})` : ''}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Products Table with scroll and sticky header */}
                    <div className="border rounded-xl overflow-hidden shadow-sm flex flex-col">
                        <div className="p-3 bg-muted/40 border-b flex items-center justify-between shrink-0">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Package className="w-4 h-4 text-primary" /> Productos Vendidos
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                                {activeNota?.detalles?.length || 0} ítems
                            </span>
                        </div>

                        <div className="overflow-x-auto max-h-64 overflow-y-auto">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead className="sticky top-0 bg-muted/90 backdrop-blur z-10 border-b">
                                    <tr className="text-muted-foreground">
                                        <th className="p-3 w-10">#</th>
                                        <th className="p-3 font-semibold">Producto / Descripción</th>
                                        <th className="p-3 font-semibold">Lote / Venc.</th>
                                        <th className="p-3 font-semibold text-right">Cantidad</th>
                                        <th className="p-3 font-semibold text-right">Precio Unitario</th>
                                        <th className="p-3 font-semibold text-right">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {(!activeNota?.detalles || activeNota.detalles.length === 0) ? (
                                        <tr>
                                            <td colSpan={6} className="p-6 text-center text-muted-foreground text-xs">
                                                No se encontraron productos registrados en esta venta.
                                            </td>
                                        </tr>
                                    ) : (
                                        activeNota.detalles.map((det: any, idx: number) => {
                                            const prodNombre = det.producto?.nombre || 'Producto';
                                            const prodCodigo = det.producto?.codigo || '';
                                            const cant = Number(det.cantidad) || 0;
                                            const pu = Number(det.precioUnitario) || 0;
                                            const st = Number(det.subtotal) || (cant * pu);

                                            return (
                                                <tr key={det.id || idx} className="hover:bg-accent/20 transition-colors">
                                                    <td className="p-3 text-muted-foreground font-mono">{idx + 1}</td>
                                                    <td className="p-3">
                                                        <span className="font-bold text-foreground block">{prodNombre}</span>
                                                        {prodCodigo && <span className="text-[10px] text-muted-foreground font-mono block">Cód: {prodCodigo}</span>}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground">
                                                        {det.movimientosLote && det.movimientosLote.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {det.movimientosLote.map((mov: any, mIdx: number) => {
                                                                    const lot = mov.lote;
                                                                    const hasVenc = !!lot?.fechaVencimiento;
                                                                    const formattedVenc = hasVenc 
                                                                        ? String(lot.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') 
                                                                        : null;
                                                                    return (
                                                                        <div key={mIdx} className="bg-muted/50 p-1 rounded text-[11px]">
                                                                            <span className="font-mono font-semibold text-foreground block">
                                                                                Lote: {lot?.numeroLote || 'S/N'} {det.movimientosLote.length > 1 ? `(${mov.cantidad} u.)` : ''}
                                                                            </span>
                                                                            {formattedVenc && (
                                                                                <span className="text-[10px] text-muted-foreground block">
                                                                                    Venc: {formattedVenc}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : det.numeroLote ? (
                                                            <div className="flex flex-col bg-muted/50 p-1 rounded">
                                                                <span className="font-mono text-[11px] font-semibold text-foreground">Lote: {det.numeroLote}</span>
                                                                {det.fechaVencimiento && (
                                                                    <span className="text-[10px] text-muted-foreground">Venc: {String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/')}</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="italic text-muted-foreground/80">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-foreground">{cant}</td>
                                                    <td className="p-3 text-right text-muted-foreground">{sim} {pu.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                                    <td className="p-3 text-right font-bold text-primary">{sim} {st.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Financial Summary & Observaciones */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-3.5 bg-muted/20 border rounded-xl space-y-1.5 text-xs">
                            <span className="font-semibold text-muted-foreground block">Observaciones / Notas:</span>
                            <p className="text-foreground text-xs italic">
                                {activeNota?.observaciones || 'Sin observaciones registradas.'}
                            </p>
                        </div>

                        <div className="p-3.5 bg-card border rounded-xl space-y-1.5 text-xs">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Subtotal:</span>
                                <span className="font-medium text-foreground">{sim} {subtotalGeneral.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                            </div>
                            {(desc1 > 0 || Number(activeNota?.descuentoPorcentaje) > 0) && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Descuento ({activeNota?.descuentoPorcentaje || 0}%):</span>
                                    <span className="text-red-500 font-medium">- {sim} {desc1.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            {(desc2 > 0 || Number(activeNota?.descuentoPromocionPorcentaje) > 0) && (
                                <div className="flex justify-between text-muted-foreground">
                                    <span>Desc. Promoción ({activeNota?.descuentoPromocionPorcentaje || 0}%):</span>
                                    <span className="text-red-500 font-medium">- {sim} {desc2.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm font-bold pt-1 border-t text-foreground">
                                <span>Total Venta:</span>
                                <span className="text-primary">{sim} {total.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold pt-1 text-green-600">
                                <span>Monto Cobrado / Amortizado:</span>
                                <span>{sim} {cobrado.toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-xs font-bold pt-1 border-t">
                                <span>Saldo Deuda Pendiente:</span>
                                <span className={saldo > 0 ? 'text-red-600 dark:text-red-400 font-bold' : 'text-green-600'}>
                                    {saldo > 0 ? `${sim} ${saldo.toLocaleString('es-BO', { minimumFractionDigits: 2 })}` : 'Saldado / Cancelado'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};
export default DetalleVentaModal;
