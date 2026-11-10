import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { traspasoService, type Traspaso } from '../../api/traspasoService';
import { sucursalService } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import { productService, type Producto } from '../../api/productService';
import { inventoryService } from '../../api/inventoryService';
import { 
    Search, Plus, Trash2, ArrowLeftRight, 
    X, Save, ChevronLeft, ChevronRight, Edit,
    Printer, FileText, FileSpreadsheet, AlertTriangle,
    Building2, Calendar, Eye, Truck, Package, CheckCircle2, XCircle, Filter,
    MessageCircle, Send, Loader2, ExternalLink, Check, Lock
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { SearchableSelect, type SearchableOption } from '../../components/ui/SearchableSelect';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getBase64ImageFromURL, exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';
import { whatsappService } from '../../api/whatsappService';

interface ItemForm {
    detalleId?: number;
    productoId: number;
    producto?: Producto;
    cantidad: number;
    cantidadOriginal?: number;
    numeroLote?: string;
    fechaVencimiento?: string;
    stockDisponible: number;
    observacion?: string;
    tieneVentasDestino?: boolean;
    cantidadVendidaDestino?: number;
    cantidadDisponibleDestino?: number;
    lotesResumenTexto?: string;
}

const TraspasosPage: React.FC = () => {
    const { userPersonal } = useAuth();
    const { selectedSucursal, selectedCiudad } = useFilters();
    const queryClient = useQueryClient();

    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loadingEditId, setLoadingEditId] = useState<number | null>(null);
    const [viewingTraspaso, setViewingTraspaso] = useState<Traspaso | null>(null);
    const [anularConfirmId, setAnularConfirmId] = useState<number | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOrigenId, setSelectedOrigenId] = useState<string>('all');
    const [selectedDestinoId, setSelectedDestinoId] = useState<string>('all');

    // WhatsApp State & Mutations
    const { data: whatsappBranches } = useQuery({
        queryKey: ['whatsapp-branches-status'],
        queryFn: () => whatsappService.getBranchesStatus(),
        staleTime: 10000,
    });

    const [whatsappModalData, setWhatsappModalData] = useState<{
        isOpen: boolean;
        traspaso: Traspaso | null;
        phone: string;
        sucursalId: string;
        customMessage: string;
    }>({
        isOpen: false,
        traspaso: null,
        phone: '',
        sucursalId: '',
        customMessage: ''
    });

    const sendWhatsAppMutation = useMutation({
        mutationFn: (payload: { traspasoId: number; phone?: string; sucursalId?: number; message?: string }) =>
            traspasoService.sendWhatsApp(payload.traspasoId, payload.phone, payload.sucursalId, payload.message),
        onSuccess: (data) => {
            toast.success(data.message || 'Guía de traspaso enviada exitosamente por WhatsApp');
            setWhatsappModalData(prev => ({ ...prev, isOpen: false, traspaso: null }));
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al enviar guía de traspaso por WhatsApp');
        }
    });

    const handleOpenWhatsAppModal = (traspaso: Traspaso) => {
        const destPhone = (traspaso.sucursalDestino || traspaso.almacenDestino)?.telefono || '';
        const initialSucursalId = (traspaso.sucursalOrigen || traspaso.almacenOrigen)?.id 
            ? String((traspaso.sucursalOrigen || traspaso.almacenOrigen)?.id) 
            : ((traspaso.sucursalDestino || traspaso.almacenDestino)?.id 
                ? String((traspaso.sucursalDestino || traspaso.almacenDestino)?.id) 
                : (userPersonal?.sucursal?.id ? String(userPersonal.sucursal.id) : (sucursales && sucursales[0] ? String(sucursales[0].id) : '')));

        setWhatsappModalData({
            isOpen: true,
            traspaso,
            phone: destPhone,
            sucursalId: initialSucursalId,
            customMessage: ''
        });
    };
    const [statusFilter, setStatusFilter] = useState<'TODOS' | 'COMPLETADO' | 'ANULADO'>('TODOS');
    const [fechaDesde, setFechaDesde] = useState('');
    const [fechaHasta, setFechaHasta] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form state
    const [formData, setFormData] = useState({
        codigo: '',
        fecha: format(new Date(), 'yyyy-MM-dd'),
        sucursalOrigenId: '',
        sucursalDestinoId: '',
        costoTransporte: '',
        sucursalCargoCosto: 'ORIGEN' as 'ORIGEN' | 'DESTINO',
        sucursalGastoId: '',
        motivo: '',
        observaciones: ''
    });

    const [itemsList, setItemsList] = useState<ItemForm[]>([]);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [selectedProdId, setSelectedProdId] = useState<string>('');
    const [selectedNumeroLote, setSelectedNumeroLote] = useState<string>('');
    const [itemCantidad, setItemCantidad] = useState<string>('1');
    const [itemObservacion, setItemObservacion] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    // Queries
    const { data: traspasosList, isLoading } = useQuery({
        queryKey: ['traspasosList'],
        queryFn: traspasoService.getAll,
        staleTime: 30000,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursalesList'],
        queryFn: sucursalService.getAll,
        staleTime: 60000,
    });

    const { data: ciudades } = useQuery({
        queryKey: ['ciudadesList'],
        queryFn: getCiudades,
        staleTime: 60000,
    });

    const { data: productos } = useQuery({
        queryKey: ['productosList'],
        queryFn: () => productService.getAll(),
        enabled: isCreating,
        staleTime: 30000,
    });

    const { data: inventarios } = useQuery({
        queryKey: ['inventariosGlobal'],
        queryFn: inventoryService.getAll,
        enabled: isCreating,
        staleTime: 30000,
    });

    // Helper: calculate stock in selected origin branch for a product
    const getStockInOrigen = (prodId: number, sucId: number): number => {
        if (!inventarios || !prodId || !sucId) return 0;
        const inv = inventarios.find(i => i.producto?.id === prodId && ((i.sucursal?.id === sucId) || (i.almacen?.id === sucId)));
        return inv ? Number(inv.stockActual) : 0;
    };

    const getLotesInOrigen = (prodId: number, sucId: number): any[] => {
        if (!inventarios || !prodId || !sucId) return [];
        const inv = inventarios.find(i => i.producto?.id === prodId && ((i.sucursal?.id === sucId) || (i.almacen?.id === sucId)));
        return (inv as any)?.lotes || [];
    };

    const availableLotesInOrigen = useMemo(() => {
        if (!selectedProdId || !formData.sucursalOrigenId) return [];
        return getLotesInOrigen(Number(selectedProdId), Number(formData.sucursalOrigenId));
    }, [selectedProdId, formData.sucursalOrigenId, inventarios]);

    const hasSoldItemsInTraspaso = useMemo(
        () => Boolean(editingId && itemsList.some(i => i.tieneVentasDestino)),
        [editingId, itemsList]
    );

    const editingLockedItem = useMemo(
        () => (editingItemIndex !== null && itemsList[editingItemIndex]?.tieneVentasDestino ? itemsList[editingItemIndex] : null),
        [editingItemIndex, itemsList]
    );

    const isSpecificLot = (lote?: string) => Boolean(lote && !lote.startsWith('TRASP-') && lote !== 'S/N');

    const selectedProductStockInOrigen = useMemo(() => {
        if (!selectedProdId || !formData.sucursalOrigenId) return 0;
        const prodId = Number(selectedProdId);
        let baseStock = 0;
        if (isSpecificLot(selectedNumeroLote)) {
            const found = availableLotesInOrigen.find(l => l.numeroLote === selectedNumeroLote);
            baseStock = found ? Number(found.cantidadActual) : 0;
        } else {
            baseStock = getStockInOrigen(prodId, Number(formData.sucursalOrigenId));
        }

        if (editingId) {
            const origSum = itemsList
                .filter(i => i.productoId === prodId && (!isSpecificLot(selectedNumeroLote) || (i.numeroLote || '') === selectedNumeroLote))
                .reduce((acc, i) => acc + (i.cantidadOriginal || 0), 0);
            const otherCurrSum = itemsList
                .filter((_, idx) => (editingItemIndex !== null ? idx !== editingItemIndex : true))
                .filter(i => i.productoId === prodId && (!isSpecificLot(selectedNumeroLote) || (i.numeroLote || '') === selectedNumeroLote))
                .reduce((acc, i) => acc + i.cantidad, 0);
            return Math.max(0, baseStock + origSum - otherCurrSum);
        }
        return baseStock;
    }, [selectedProdId, selectedNumeroLote, availableLotesInOrigen, formData.sucursalOrigenId, inventarios, editingId, editingItemIndex, itemsList]);

    const productOptions: SearchableOption[] = useMemo(() => {
        if (!productos) return [];
        return productos.map(p => {
            let stock = getStockInOrigen(p.id, Number(formData.sucursalOrigenId));
            if (editingId && editingItemIndex !== null && itemsList[editingItemIndex]?.productoId === p.id) {
                stock += (itemsList[editingItemIndex].cantidadOriginal ?? itemsList[editingItemIndex].cantidad);
            }
            const isOutOfStock = stock <= 0;
            return {
                value: p.id,
                label: p.nombre,
                code: p.codigo || undefined,
                sublabel: isOutOfStock 
                    ? '⚠️ Sin stock en la sucursal de origen' 
                    : `Stock: ${stock} ${p.unidadMedida || 'un.'}`,
                disabled: isOutOfStock
            };
        });
    }, [productos, formData.sucursalOrigenId, inventarios, editingId, editingItemIndex, itemsList]);

    // Handle adding or updating item in the transfer list
    const handleAddItem = () => {
        setError(null);
        if (!selectedProdId) {
            setError('Debe seleccionar un producto');
            return;
        }

        const qty = parseFloat(itemCantidad);
        if (isNaN(qty) || qty <= 0) {
            setError('La cantidad a traspasar debe ser mayor a 0');
            return;
        }

        const prodId = Number(selectedProdId);
        const prod = productos?.find(p => p.id === prodId) || (editingItemIndex !== null ? itemsList[editingItemIndex]?.producto : undefined);
        if (!prod) return;

        if (editingItemIndex !== null && itemsList[editingItemIndex]?.tieneVentasDestino) {
            const lockedItem = itemsList[editingItemIndex];
            const minQty = lockedItem.cantidadVendidaDestino || 0;
            if (qty < minQty) {
                setError(
                    `No se puede reducir la cantidad de "${prod.nombre}" por debajo de ${minQty} un., ya que esa cantidad ya fue vendida o utilizada en la sucursal de destino.`
                );
                return;
            }
        }

        const stockDisponible = getStockInOrigen(prodId, Number(formData.sucursalOrigenId));
        const chosenLot = isSpecificLot(selectedNumeroLote)
            ? availableLotesInOrigen.find(l => l.numeroLote === selectedNumeroLote)
            : null;
        let lotMax = isSpecificLot(selectedNumeroLote)
            ? (chosenLot ? Number(chosenLot.cantidadActual) : 0)
            : stockDisponible;

        // Add back original DB quantities for this traspaso matching this product/lote
        if (editingId) {
            const origSum = itemsList
                .filter(i => i.productoId === prodId && (!isSpecificLot(selectedNumeroLote) || (i.numeroLote || '') === selectedNumeroLote))
                .reduce((acc, curr) => acc + (curr.cantidadOriginal || 0), 0);
            lotMax += origSum;
        }

        // Calculate quantity already assigned to other items in the list for same product and lot
        const otherQtyInList = itemsList
            .filter((_, idx) => editingItemIndex !== null ? idx !== editingItemIndex : true)
            .filter(i => i.productoId === prodId && (!isSpecificLot(selectedNumeroLote) || (i.numeroLote || '') === selectedNumeroLote))
            .reduce((acc, curr) => acc + curr.cantidad, 0);

        if (qty + otherQtyInList > lotMax) {
            const remaining = Math.max(0, lotMax - otherQtyInList);
            setError(isSpecificLot(selectedNumeroLote)
                ? `Stock insuficiente en el lote "${selectedNumeroLote}". Disponible: ${remaining}, Solicitado: ${qty}`
                : `Stock insuficiente en la sucursal de origen. Disponible: ${remaining}, Solicitado: ${qty}`
            );
            return;
        }

        if (editingItemIndex !== null) {
            // Update existing item in the list preserving metadata
            const updated = [...itemsList];
            const prev = updated[editingItemIndex];
            updated[editingItemIndex] = {
                ...prev,
                productoId: prodId,
                producto: prod,
                cantidad: qty,
                numeroLote: selectedNumeroLote || undefined,
                fechaVencimiento: chosenLot?.fechaVencimiento || prev?.fechaVencimiento || undefined,
                stockDisponible: lotMax,
                observacion: itemObservacion
            };
            setItemsList(updated);
            setEditingItemIndex(null);
            toast.success(`Producto "${prod.nombre}" actualizado en la lista`);
        } else {
            // Add new item to the list
            const existingIndex = itemsList.findIndex(i => i.productoId === prodId && (i.numeroLote || '') === (selectedNumeroLote || ''));
            if (existingIndex >= 0) {
                const newTotalQty = itemsList[existingIndex].cantidad + qty;
                const otherTotalExcludingExisting = itemsList
                    .filter((_, idx) => idx !== existingIndex)
                    .filter(i => i.productoId === prodId && (!isSpecificLot(selectedNumeroLote) || (i.numeroLote || '') === selectedNumeroLote))
                    .reduce((acc, curr) => acc + curr.cantidad, 0);
                if (newTotalQty + otherTotalExcludingExisting > lotMax) {
                    const maxForExisting = Math.max(0, lotMax - otherTotalExcludingExisting);
                    setError(`La cantidad total (${newTotalQty}) supera el stock disponible (${maxForExisting})`);
                    return;
                }
                const updated = [...itemsList];
                updated[existingIndex] = {
                    ...updated[existingIndex],
                    cantidad: newTotalQty,
                    observacion: itemObservacion || updated[existingIndex].observacion
                };
                setItemsList(updated);
            } else {
                setItemsList([
                    ...itemsList,
                    {
                        productoId: prodId,
                        producto: prod,
                        cantidad: qty,
                        numeroLote: selectedNumeroLote || undefined,
                        fechaVencimiento: chosenLot?.fechaVencimiento || undefined,
                        stockDisponible: lotMax,
                        observacion: itemObservacion
                    }
                ]);
            }
        }

        setSelectedProdId('');
        setSelectedNumeroLote('');
        setItemCantidad('1');
        setItemObservacion('');
    };

    const handleEditItem = (index: number) => {
        const item = itemsList[index];
        if (!item) return;
        setEditingItemIndex(index);
        setSelectedProdId(String(item.productoId));
        setSelectedNumeroLote(item.numeroLote || '');
        setItemCantidad(String(item.cantidad));
        setItemObservacion(item.observacion || '');
        setError(null);
    };

    const handleCancelEditItem = () => {
        setEditingItemIndex(null);
        setSelectedProdId('');
        setSelectedNumeroLote('');
        setItemCantidad('1');
        setItemObservacion('');
        setError(null);
    };

    const handleRemoveItem = (index: number) => {
        if (itemsList[index]?.tieneVentasDestino) {
            toast.error(`No se puede eliminar "${itemsList[index]?.producto?.nombre}": ya se vendieron o utilizaron unidades de este lote en la sucursal de destino.`);
            return;
        }
        if (editingItemIndex === index) {
            handleCancelEditItem();
        } else if (editingItemIndex !== null && editingItemIndex > index) {
            setEditingItemIndex(editingItemIndex - 1);
        }
        setItemsList(itemsList.filter((_, idx) => idx !== index));
    };

    // Mutations
    const createMutation = useMutation({
        mutationFn: traspasoService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['traspasosList'] });
            queryClient.invalidateQueries({ queryKey: ['inventariosGlobal'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            setIsCreating(false);
            setEditingId(null);
            resetForm();
            toast.success('Traspaso entre sucursales registrado y stock actualizado con éxito');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al registrar el traspaso';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: number; data: any }) => traspasoService.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['traspasosList'] });
            queryClient.invalidateQueries({ queryKey: ['inventariosGlobal'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            setIsCreating(false);
            setEditingId(null);
            resetForm();
            toast.success('Traspaso actualizado y stock recalculado con éxito');
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al actualizar el traspaso';
            setError(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const anularMutation = useMutation({
        mutationFn: traspasoService.anular,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['traspasosList'] });
            queryClient.invalidateQueries({ queryKey: ['inventariosGlobal'] });
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            queryClient.invalidateQueries({ queryKey: ['movimientos'] });
            toast.success('Traspaso anulado y stock revertido exitosamente');
            setAnularConfirmId(null);
            if (viewingTraspaso) setViewingTraspaso(null);
        },
        onError: (err: any) => {
            const msg = err?.response?.data?.message || 'Error al anular el traspaso';
            toast.error(Array.isArray(msg) ? msg.join(', ') : msg);
        }
    });

    const getSucursalCodePreview = (sucId?: string): string => {
        if (!sucId || !sucursales) return 'LP';
        const suc = sucursales.find(s => String(s.id) === String(sucId));
        if (!suc) return 'LP';
        const ciudad = (suc.ciudad?.nombre || '').toUpperCase().trim();
        const nombre = (suc.nombre || '').toUpperCase().trim();

        if (ciudad.includes('COCHABAMBA') || nombre.includes('COCHABAMBA') || nombre.includes('CBBA')) return 'CBBA';
        if (ciudad.includes('LA PAZ') || nombre.includes('LA PAZ') || nombre.includes('LPZ') || nombre.includes('LP')) return 'LP';
        if (ciudad.includes('SANTA CRUZ') || nombre.includes('SANTA CRUZ') || nombre.includes('SCZ') || nombre.includes('SC')) return 'SCZ';
        if (ciudad.includes('ORURO') || nombre.includes('ORURO')) return 'ORU';
        if (ciudad.includes('POTOSI') || ciudad.includes('POTOSÍ') || nombre.includes('POTOSI')) return 'PTS';
        if (ciudad.includes('TARIJA') || nombre.includes('TARIJA')) return 'TJA';
        if (ciudad.includes('CHUQUISACA') || ciudad.includes('SUCRE') || nombre.includes('SUCRE')) return 'CHQ';
        if (ciudad.includes('BENI') || nombre.includes('BENI')) return 'BEN';
        if (ciudad.includes('PANDO') || nombre.includes('PANDO')) return 'PAN';

        const clean = (ciudad || nombre).replace(/[^A-Z0-9]/g, '');
        return clean ? clean.substring(0, 4) : `SUC${suc.id}`;
    };

    const resetForm = () => {
        setEditingId(null);
        setEditingItemIndex(null);
        const firstSucInCiudad = selectedCiudad ? sucursales?.find((s: any) => s.ciudad?.id === Number(selectedCiudad))?.id?.toString() : '';
        const defaultOrigenId = selectedSucursal ? String(selectedSucursal) : (firstSucInCiudad || '');
        setFormData({
            codigo: '',
            fecha: format(new Date(), 'yyyy-MM-dd'),
            sucursalOrigenId: defaultOrigenId,
            sucursalDestinoId: '',
            costoTransporte: '',
            sucursalCargoCosto: 'ORIGEN',
            sucursalGastoId: defaultOrigenId,
            motivo: '',
            observaciones: ''
        });
        setItemsList([]);
        setSelectedProdId('');
        setSelectedNumeroLote('');
        setItemCantidad('1');
        setItemObservacion('');
        setError(null);
    };

    const handleOpenEdit = async (t: Traspaso) => {
        setLoadingEditId(t.id);
        try {
            const [freshTraspaso, freshInventarios] = await Promise.all([
                traspasoService.getById(t.id),
                queryClient.fetchQuery({
                    queryKey: ['inventariosGlobal'],
                    queryFn: inventoryService.getAll,
                    staleTime: 0,
                }),
            ]);

            const source = freshTraspaso || t;
            const origId = (source.sucursalOrigen || source.almacenOrigen)?.id ? String((source.sucursalOrigen || source.almacenOrigen)?.id) : '';
            const destId = (source.sucursalDestino || source.almacenDestino)?.id ? String((source.sucursalDestino || source.almacenDestino)?.id) : '';
            const gastoId = source.sucursalGasto?.id 
                ? String(source.sucursalGasto.id) 
                : (source.sucursalCargoCosto === 'DESTINO' ? destId : origId);

            setEditingId(source.id);
            setEditingItemIndex(null);
            setFormData({
                codigo: source.codigo || '',
                fecha: source.fecha ? String(source.fecha).substring(0, 10) : format(new Date(), 'yyyy-MM-dd'),
                sucursalOrigenId: origId,
                sucursalDestinoId: destId,
                costoTransporte: source.costoTransporte !== undefined && source.costoTransporte !== null ? String(source.costoTransporte) : '',
                sucursalCargoCosto: source.sucursalCargoCosto || 'ORIGEN',
                sucursalGastoId: gastoId,
                motivo: source.motivo || '',
                observaciones: source.observaciones || ''
            });

            const mappedItems: ItemForm[] = (source.detalles || []).map(d => {
                const invOrig = (freshInventarios || []).find(
                    (i: any) => i.producto?.id === d.producto?.id && ((i.sucursal?.id === Number(origId)) || (i.almacen?.id === Number(origId)))
                );
                let lotesArr: Array<{ numeroLote: string; cantidad: number }> = [];
                if (d.lotesDetalle) {
                    try {
                        lotesArr = JSON.parse(d.lotesDetalle) || [];
                    } catch {
                        lotesArr = [];
                    }
                }
                const isMultiLote = Array.isArray(lotesArr) && lotesArr.length > 1;
                const itemLote = isMultiLote ? undefined : (d.numeroLote || undefined);

                let currentStockInBranch = invOrig ? Number(invOrig.stockActual) : 0;
                if (itemLote && !itemLote.startsWith('TRASP-') && itemLote !== 'S/N') {
                    const loteMatch = ((invOrig as any)?.lotes || []).find((l: any) => l.numeroLote === itemLote);
                    currentStockInBranch = loteMatch ? Number(loteMatch.cantidadActual) : 0;
                }

                const qtyOrig = Number(d.cantidad) || 0;
                return {
                    detalleId: d.id,
                    productoId: d.producto?.id,
                    producto: d.producto,
                    cantidad: qtyOrig,
                    cantidadOriginal: qtyOrig,
                    numeroLote: itemLote,
                    fechaVencimiento: d.fechaVencimiento ? String(d.fechaVencimiento).substring(0, 10) : undefined,
                    stockDisponible: currentStockInBranch + qtyOrig,
                    observacion: d.observacion || '',
                    tieneVentasDestino: Boolean(d.tieneVentasDestino),
                    cantidadVendidaDestino: Number(d.cantidadVendidaDestino) || 0,
                    cantidadDisponibleDestino: d.cantidadDisponibleDestino !== undefined ? Number(d.cantidadDisponibleDestino) : qtyOrig,
                    lotesResumenTexto: isMultiLote ? lotesArr.map(l => `${l.numeroLote} (${l.cantidad} u.)`).join(', ') : undefined,
                };
            });

            setItemsList(mappedItems);
            setSelectedProdId('');
            setSelectedNumeroLote('');
            setItemCantidad('1');
            setItemObservacion('');
            setError(null);
            if (viewingTraspaso) setViewingTraspaso(null);
            setIsCreating(true);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Error al cargar los detalles actualizados del traspaso');
        } finally {
            setLoadingEditId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.sucursalOrigenId || !formData.sucursalDestinoId) {
            setError('Debe seleccionar las sucursales de origen y destino');
            return;
        }

        if (formData.sucursalOrigenId === formData.sucursalDestinoId) {
            setError('La sucursal de origen y destino deben ser diferentes');
            return;
        }

        if (itemsList.length === 0) {
            setError('Debe agregar al menos un producto a la lista de traspaso');
            return;
        }

        const costoTransporte = parseFloat(formData.costoTransporte) || 0;
        if (costoTransporte > 0 && !formData.sucursalGastoId) {
            setError('Debe seleccionar qué sucursal se hace cargo del costo/egreso de transporte');
            return;
        }

        const payload = {
            codigo: formData.codigo || undefined,
            fecha: formData.fecha,
            sucursalOrigenId: Number(formData.sucursalOrigenId),
            sucursalDestinoId: Number(formData.sucursalDestinoId),
            costoTransporte,
            sucursalGastoId: formData.sucursalGastoId ? Number(formData.sucursalGastoId) : undefined,
            sucursalCargoCosto: (formData.sucursalGastoId === formData.sucursalDestinoId ? 'DESTINO' : 'ORIGEN') as 'ORIGEN' | 'DESTINO',
            motivo: formData.motivo,
            observaciones: formData.observaciones,
            detalles: itemsList.map(i => ({
                detalleId: i.detalleId,
                productoId: i.productoId,
                cantidad: i.cantidad,
                numeroLote: i.numeroLote,
                observacion: i.observacion
            }))
        };

        if (editingId) {
            updateMutation.mutate({ id: editingId, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    // Filter traspasos list by search, status, global sucursal/ciudad, and origin/destination sucursal
    const filteredTraspasos = useMemo(() => {
        if (!traspasosList) return [];
        let filtered = traspasosList;

        if (selectedSucursal) {
            filtered = filtered.filter(t => 
                (t.sucursalOrigen || t.almacenOrigen)?.id === Number(selectedSucursal) || 
                (t.sucursalDestino || t.almacenDestino)?.id === Number(selectedSucursal) ||
                (t as any)?.sucursalOrigenId === Number(selectedSucursal) ||
                (t as any)?.sucursalDestinoId === Number(selectedSucursal)
            );
        } else if (selectedCiudad) {
            filtered = filtered.filter(t => 
                ((t.sucursalOrigen || t.almacenOrigen) as any)?.ciudad?.id === Number(selectedCiudad) || 
                ((t.sucursalDestino || t.almacenDestino) as any)?.ciudad?.id === Number(selectedCiudad) ||
                ((t.sucursalOrigen || t.almacenOrigen) as any)?.ciudadId === Number(selectedCiudad) ||
                ((t.sucursalDestino || t.almacenDestino) as any)?.ciudadId === Number(selectedCiudad)
            );
        }

        if (selectedOrigenId !== 'all') {
            filtered = filtered.filter(t => 
                (t.sucursalOrigen || t.almacenOrigen)?.id === Number(selectedOrigenId) ||
                (t as any)?.sucursalOrigenId === Number(selectedOrigenId)
            );
        }

        if (selectedDestinoId !== 'all') {
            filtered = filtered.filter(t => 
                (t.sucursalDestino || t.almacenDestino)?.id === Number(selectedDestinoId) ||
                (t as any)?.sucursalDestinoId === Number(selectedDestinoId)
            );
        }

        if (statusFilter !== 'TODOS') {
            filtered = filtered.filter(t => t.estado === statusFilter);
        }

        if (fechaDesde && fechaHasta) {
            filtered = filtered.filter(t => t.fecha >= fechaDesde && t.fecha <= fechaHasta);
        } else if (fechaDesde) {
            filtered = filtered.filter(t => t.fecha >= fechaDesde);
        } else if (fechaHasta) {
            filtered = filtered.filter(t => t.fecha <= fechaHasta);
        }

        if (searchTerm) {
            const s = searchTerm.toLowerCase();
            filtered = filtered.filter(t => {
                const cod = (t.codigo || '').toLowerCase();
                const orig = ((t.sucursalOrigen || t.almacenOrigen)?.nombre || '').toLowerCase();
                const dest = ((t.sucursalDestino || t.almacenDestino)?.nombre || '').toLowerCase();
                const mot = (t.motivo || '').toLowerCase();
                const hasProd = t.detalles?.some(d => d.producto?.nombre?.toLowerCase().includes(s));

                return cod.includes(s) || orig.includes(s) || dest.includes(s) || mot.includes(s) || hasProd;
            });
        }

        return filtered;
    }, [traspasosList, selectedSucursal, selectedCiudad, selectedOrigenId, selectedDestinoId, statusFilter, fechaDesde, fechaHasta, searchTerm]);

    // Financial KPI Totals
    const totals = useMemo(() => {
        let totalCostoTransporte = 0;
        let totalItemsMovidos = 0;

        filteredTraspasos.forEach(t => {
            if (t.estado === 'COMPLETADO') {
                totalCostoTransporte += Number(t.costoTransporte) || 0;
                t.detalles?.forEach(d => {
                    totalItemsMovidos += Number(d.cantidad) || 0;
                });
            }
        });

        return {
            totalCostoTransporte,
            totalItemsMovidos,
            totalCount: filteredTraspasos.length,
            completadosCount: filteredTraspasos.filter(t => t.estado === 'COMPLETADO').length
        };
    }, [filteredTraspasos]);

    // Pagination
    const totalPages = Math.ceil(filteredTraspasos.length / itemsPerPage) || 1;
    const paginatedTraspasos = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredTraspasos.slice(start, start + itemsPerPage);
    }, [filteredTraspasos, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedSucursal, selectedCiudad, selectedOrigenId, selectedDestinoId, statusFilter, fechaDesde, fechaHasta]);

    // Export Reports
    const exportColumns = [
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Fecha', dataKey: 'fechaFormateada' },
        { header: 'Sucursal Origen', dataKey: 'sucursalOrigenNombre' },
        { header: 'Sucursal Destino', dataKey: 'sucursalDestinoNombre' },
        { header: 'Lotes Traspasados', dataKey: 'lotesResumen' },
        { header: 'Costo Traspaso (Bs.)', dataKey: 'costoFormateado' },
        { header: 'Cargo del Costo', dataKey: 'cargoCostoSucursal' },
        { header: 'Cant. Items', dataKey: 'totalItems' },
        { header: 'Motivo', dataKey: 'motivo' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const getExportColumns = () => {
        let cols = [...exportColumns];
        if (selectedOrigenId !== 'all') cols = cols.filter(c => c.dataKey !== 'sucursalOrigenNombre');
        if (selectedDestinoId !== 'all') cols = cols.filter(c => c.dataKey !== 'sucursalDestinoNombre');
        if (statusFilter !== 'TODOS') cols = cols.filter(c => c.dataKey !== 'estado');
        return cols;
    };

    const mappedExportData = useMemo(() => {
        if (!filteredTraspasos) return [];
        return filteredTraspasos.map(t => {
            const fechaFormateada = t.fecha ? format(new Date(t.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-';
            const costoFormateado = Number(t.costoTransporte).toLocaleString('es-BO', { minimumFractionDigits: 2 });
            const totalItems = t.detalles?.reduce((acc, curr) => acc + Number(curr.cantidad), 0) || 0;
            const sucOrig = t.sucursalOrigen || t.almacenOrigen;
            const sucDest = t.sucursalDestino || t.almacenDestino;
            const origCiudad = (sucOrig as any)?.ciudad?.nombre ? ` (${(sucOrig as any).ciudad.nombre})` : '';
            const destCiudad = (sucDest as any)?.ciudad?.nombre ? ` (${(sucDest as any).ciudad.nombre})` : '';
            const sucursalOrigenNombre = `${sucOrig?.nombre || '-'}${origCiudad}`;
            const sucursalDestinoNombre = `${sucDest?.nombre || '-'}${destCiudad}`;
            const sucGasto = t.sucursalGasto;
            const cargoCostoSucursal = Number(t.costoTransporte) > 0
                ? (sucGasto?.nombre 
                    ? `${sucGasto.nombre}${(sucGasto as any)?.ciudad?.nombre ? ` (${(sucGasto as any).ciudad.nombre})` : ''}`
                    : (t.sucursalCargoCosto === 'DESTINO' ? `Destino (${sucDest?.nombre || '-'})` : `Origen (${sucOrig?.nombre || '-'})`))
                : '-';
            const lotesResumen = t.detalles && t.detalles.length > 0
                ? t.detalles.map(d => `${d.producto?.nombre || 'Prod'} [Lote: ${d.numeroLote || 'S/N'} x ${d.cantidad}]`).join('; ')
                : '-';

            return {
                id: t.id,
                codigo: t.codigo || `TR-${t.id}`,
                fechaFormateada,
                sucursalOrigenNombre,
                sucursalDestinoNombre,
                costoFormateado,
                cargoCostoSucursal,
                totalItems,
                lotesResumen,
                motivo: t.motivo || '-',
                estado: t.estado === 'COMPLETADO' ? 'Completado' : 'Anulado'
            };
        });
    }, [filteredTraspasos]);

    const getFiltersText = () => {
        const texts: string[] = [];

        // Sucursal (Filtro Global)
        if (selectedSucursal) {
            const s = sucursales?.find(su => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal (Global): ${s.nombre}`);
        }

        // Ciudad (Filtro Global)
        if (selectedCiudad) {
            const c = ciudades?.find(ci => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }

        // Sucursal Origen
        if (selectedOrigenId !== 'all') {
            const s = sucursales?.find(su => su.id === Number(selectedOrigenId));
            const ciudadStr = s?.ciudad?.nombre ? ` (${s.ciudad.nombre})` : '';
            texts.push(`Origen: ${s?.nombre || selectedOrigenId}${ciudadStr}`);
        }

        // Sucursal Destino
        if (selectedDestinoId !== 'all') {
            const s = sucursales?.find(su => su.id === Number(selectedDestinoId));
            const ciudadStr = s?.ciudad?.nombre ? ` (${s.ciudad.nombre})` : '';
            texts.push(`Destino: ${s?.nombre || selectedDestinoId}${ciudadStr}`);
        }

        // Estado
        if (statusFilter !== 'TODOS') {
            texts.push(`Estado: ${statusFilter === 'COMPLETADO' ? 'Completados' : 'Anulados'}`);
        }

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

        return texts.length > 0 ? texts.join(' | ') : 'Todos los traspasos';
    };

    const handlePrint = () => {
        if (!mappedExportData.length) return;
        printData('Reporte de Traspasos entre Sucursales', getExportColumns(), mappedExportData, getFiltersText());
    };

    const handleExportPDF = () => {
        if (!mappedExportData.length) return;
        exportToPDF('Reporte de Traspasos entre Sucursales', getExportColumns(), mappedExportData, 'traspasos_sucursales_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!mappedExportData.length) return;
        exportToExcel(getExportColumns(), mappedExportData, 'traspasos_sucursales_reporte');
    };

    const handlePrintIndividualTraspaso = async (t: Traspaso) => {
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
        doc.text(`GUÍA DE TRASPASO ENTRE SUCURSALES`, 196, 16, { align: 'right' });
        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`N° ${t.codigo || 'TRS-' + t.id}`, 196, 22, { align: 'right' });

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(60, 60, 60);
        let currentY = 36;

        const sucOrigen = t.sucursalOrigen || t.almacenOrigen;
        const sucDestino = t.sucursalDestino || t.almacenDestino;
        const fechaFormatted = t.fecha ? String(t.fecha).split('T')[0].split('-').reverse().join('/') : '-';
        const usuarioNombre = t.usuario?.persona ? `${t.usuario.persona.nombres} ${t.usuario.persona.apellidos || ''}`.trim() : (t.usuario?.username || 'Sistema');
        const origenNombre = sucOrigen ? `${sucOrigen.nombre}${(sucOrigen as any)?.ciudad?.nombre ? ` (${(sucOrigen as any).ciudad.nombre})` : ''}` : '-';
        const destinoNombre = sucDestino ? `${sucDestino.nombre}${(sucDestino as any)?.ciudad?.nombre ? ` (${(sucDestino as any).ciudad.nombre})` : ''}` : '-';

        doc.text(`Fecha: ${fechaFormatted}`, 14, currentY);
        doc.text(`Estado: ${t.estado}`, 110, currentY);
        currentY += 5;

        doc.text(`Sucursal Origen (Salida): ${origenNombre}`, 14, currentY);
        currentY += 5;

        doc.text(`Sucursal Destino (Ingreso): ${destinoNombre}`, 14, currentY);
        currentY += 5;

        const sucGastoNombre = t.sucursalGasto?.nombre || (t.sucursalCargoCosto === 'DESTINO' ? 'Destino' : 'Origen');
        const costoTxt = Number(t.costoTransporte) > 0 
            ? `Bs. ${Number(t.costoTransporte).toLocaleString('es-BO', { minimumFractionDigits: 2 })} (Cargo: ${sucGastoNombre})`
            : 'Bs. 0.00 (Sin Costo)';
        doc.text(`Costo Transporte: ${costoTxt}`, 14, currentY);
        doc.text(`Registrado por: ${usuarioNombre}`, 110, currentY);
        currentY += 5;

        if (t.motivo || t.observaciones) {
            const obs = `${t.motivo ? `Motivo: ${t.motivo}` : ''}${t.motivo && t.observaciones ? ' | ' : ''}${t.observaciones ? `Obs: ${t.observaciones}` : ''}`;
            doc.text(obs, 14, currentY, { maxWidth: 182 });
            currentY += 6;
        }

        const tableColumn = ["#", "Código", "Producto", "Lote / Vencimiento", "Cantidad", "Observación"];
        let totalUnidades = 0;

        const tableRows = (t.detalles || []).map((det: any, idx: number) => {
            const cantNum = Number(det.cantidad || 0);
            totalUnidades += cantNum;

            let loteVencStr = '-';
            let lotesList: any[] = [];
            if (det.lotesDetalle) {
                try {
                    lotesList = JSON.parse(det.lotesDetalle);
                } catch (e) {
                    lotesList = [];
                }
            }

            if (lotesList.length > 0) {
                loteVencStr = lotesList.map((lt: any) => {
                    const venc = lt.fechaVencimiento ? String(lt.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : '';
                    return `Lote ${lt.numeroLote || 'S/N'} (${lt.cantidad} u.)${venc ? ' - Venc: ' + venc : ''}`;
                }).join('\n');
            } else if (det.numeroLote) {
                const venc = det.fechaVencimiento ? String(det.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : '';
                loteVencStr = `Lote ${det.numeroLote}${venc ? ' - Venc: ' + venc : ''}`;
            }

            return [
                (idx + 1).toString(),
                det.producto?.codigo || '-',
                det.producto?.nombre || '-',
                loteVencStr,
                `${cantNum} ${det.producto?.unidadMedida || 'u.'}`,
                det.observacion || '-'
            ];
        });

        autoTable(doc, {
            startY: currentY + 3,
            head: [tableColumn],
            body: tableRows,
            styles: {
                font: 'helvetica',
                fontSize: 8.5,
                cellPadding: 2.5,
            },
            headStyles: {
                fillColor: [59, 130, 246],
                textColor: 255,
                fontStyle: 'bold',
                halign: 'center'
            },
            alternateRowStyles: {
                fillColor: [248, 250, 252]
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'center', cellWidth: 22 },
                2: { halign: 'left', cellWidth: 55 },
                3: { halign: 'left', cellWidth: 50 },
                4: { halign: 'right', cellWidth: 25 },
                5: { halign: 'left', cellWidth: 24 },
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 10;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text(`Total Ítems: ${(t.detalles || []).length} | Total Unidades: ${totalUnidades.toLocaleString('es-BO')}`, 14, finalY);

        const signY = finalY + 26 > 270 ? 270 : finalY + 26;
        doc.setDrawColor(180, 180, 180);
        doc.line(14, signY, 68, signY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text("Entregué Conforme\n(Sucursal Origen)", 41, signY + 4, { align: "center" });

        doc.line(78, signY, 132, signY);
        doc.text("Transporte / Chofer\n(Conformidad)", 105, signY + 4, { align: "center" });

        doc.line(142, signY, 196, signY);
        doc.text("Recibí Conforme\n(Sucursal Destino)", 169, signY + 4, { align: "center" });

        window.open(doc.output('bloburl'), '_blank');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <ArrowLeftRight className="w-8 h-8 text-primary/80" />
                        Traspasos entre Sucursales
                    </h1>
                    <p className="text-muted-foreground italic">
                        Control y registro de transferencias de productos entre sucursales con cálculo de costo de transporte.
                    </p>
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

                    <button
                        onClick={() => { resetForm(); setIsCreating(true); }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Traspaso
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ArrowLeftRight className="w-4 h-4 text-primary" /> Total Traspasos
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        {totals.completadosCount} <span className="text-sm font-normal text-muted-foreground">/ {totals.totalCount} registros</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Traspasos completados con éxito</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-primary" /> Gasto de Transporte Total
                    </span>
                    <div className="text-2xl font-black text-foreground">
                        Bs. {totals.totalCostoTransporte.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-[11px] text-muted-foreground">Costo acumulado de flete/traspasos (Bs.)</p>
                </div>

                <div className="p-4 bg-card border rounded-xl shadow-sm space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <Package className="w-4 h-4 text-primary" /> Unidades Movidas
                    </span>
                    <div className="text-2xl font-black text-primary">
                        {totals.totalItemsMovidos.toLocaleString('es-BO')} <span className="text-sm font-normal text-muted-foreground">unidades</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Productos transferidos entre sucursales</p>
                </div>
            </div>

            {/* Search, Sucursales & Status Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-wrap items-stretch sm:items-center">
                <div className="bg-card p-2.5 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[220px] max-w-md">
                    <Search className="w-5 h-5 text-muted-foreground ml-1 shrink-0" />
                    <input 
                        type="text" 
                        placeholder="Buscar por código, sucursal, motivo o producto..." 
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

                {/* Filtro Sucursal Origen */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <select
                        value={selectedOrigenId}
                        onChange={(e) => setSelectedOrigenId(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer max-w-[200px] truncate"
                        title="Filtrar por Sucursal de Origen"
                    >
                        <option value="all" className="bg-background text-foreground">Origen: Todas</option>
                        {sucursales?.map(s => (
                            <option key={s.id} value={s.id} className="bg-background text-foreground">
                                {s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Filtro Sucursal Destino */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Building2 className="w-4 h-4 text-primary shrink-0" />
                    <select
                        value={selectedDestinoId}
                        onChange={(e) => setSelectedDestinoId(e.target.value)}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer max-w-[200px] truncate"
                        title="Filtrar por Sucursal de Destino"
                    >
                        <option value="all" className="bg-background text-foreground">Destino: Todas</option>
                        {sucursales?.map(s => (
                            <option key={s.id} value={s.id} className="bg-background text-foreground">
                                {s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}
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

                {/* Status Toggle */}
                <div className="flex items-center bg-muted/40 p-1 border rounded-lg text-xs font-semibold">
                    <button
                        onClick={() => setStatusFilter('TODOS')}
                        className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === 'TODOS' ? 'bg-card text-foreground shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setStatusFilter('COMPLETADO')}
                        className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === 'COMPLETADO' ? 'bg-green-600 text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Completados
                    </button>
                    <button
                        onClick={() => setStatusFilter('ANULADO')}
                        className={`px-3 py-1.5 rounded-md transition-all ${statusFilter === 'ANULADO' ? 'bg-red-600 text-white shadow-sm font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Anulados
                    </button>
                </div>

                {/* Limpiar Filtros */}
                {(selectedOrigenId !== 'all' || selectedDestinoId !== 'all' || statusFilter !== 'TODOS' || !!searchTerm || !!fechaDesde || !!fechaHasta) && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedOrigenId('all');
                            setSelectedDestinoId('all');
                            setStatusFilter('TODOS');
                            setFechaDesde('');
                            setFechaHasta('');
                            setSearchTerm('');
                        }}
                        className="px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-accent border rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                        title="Limpiar filtros"
                    >
                        <X className="w-3.5 h-3.5" />
                        <span>Limpiar</span>
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-12">#</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Código</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fecha</th>
                                {selectedOrigenId === 'all' && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sucursal Origen</th>
                                )}
                                {selectedDestinoId === 'all' && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sucursal Destino</th>
                                )}
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Items</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Costo Traspaso</th>
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Motivo</th>
                                {statusFilter === 'TODOS' && (
                                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground w-28 text-center">Estado</th>
                                )}
                                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right w-44">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7 + (selectedOrigenId === 'all' ? 1 : 0) + (selectedDestinoId === 'all' ? 1 : 0) + (statusFilter === 'TODOS' ? 1 : 0)} className="p-12 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center justify-center gap-2.5">
                                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                            <span className="text-sm font-medium">Cargando traspasos entre sucursales...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedTraspasos.length === 0 ? (
                                <tr>
                                    <td colSpan={7 + (selectedOrigenId === 'all' ? 1 : 0) + (selectedDestinoId === 'all' ? 1 : 0) + (statusFilter === 'TODOS' ? 1 : 0)} className="p-8 text-center text-muted-foreground text-sm">
                                        No se encontraron registros de traspasos entre sucursales.
                                    </td>
                                </tr>
                            ) : paginatedTraspasos.map((t, index) => {
                                const totalQty = t.detalles?.reduce((acc, curr) => acc + Number(curr.cantidad), 0) || 0;
                                const isAnulado = t.estado === 'ANULADO' || !t.activo;
                                const sucOrigen = t.sucursalOrigen || t.almacenOrigen;
                                const sucDestino = t.sucursalDestino || t.almacenDestino;

                                return (
                                    <tr key={t.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-sm">
                                            <span className="font-mono text-xs font-bold px-2 py-1 rounded bg-primary/10 text-primary">
                                                {t.codigo}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium">
                                            {t.fecha ? format(new Date(t.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}
                                        </td>
                                        {selectedOrigenId === 'all' && (
                                            <td className="p-4 text-sm font-semibold text-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                                    <span>{sucOrigen?.nombre || '-'}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(sucOrigen as any)?.ciudad?.nombre || ''}
                                                </span>
                                            </td>
                                        )}
                                        {selectedDestinoId === 'all' && (
                                            <td className="p-4 text-sm font-semibold text-foreground">
                                                <div className="flex items-center gap-1.5">
                                                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                                    <span>{sucDestino?.nombre || '-'}</span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {(sucDestino as any)?.ciudad?.nombre || ''}
                                                </span>
                                            </td>
                                        )}
                                        <td className="p-4 text-center font-bold text-sm">
                                            <span className="px-2 py-0.5 bg-muted rounded text-xs">
                                                {totalQty} un.
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="text-sm font-bold text-foreground">
                                                Bs. {Number(t.costoTransporte).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                            {Number(t.costoTransporte) > 0 && (
                                                <div className="mt-1">
                                                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded border ${
                                                        t.sucursalGasto
                                                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700'
                                                            : t.sucursalCargoCosto === 'DESTINO'
                                                                ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-200 dark:border-purple-700'
                                                                : 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-700'
                                                    }`} title={`Costo asumido por Sucursal ${t.sucursalGasto?.nombre || (t.sucursalCargoCosto === 'DESTINO' ? 'Destino' : 'Origen')}`}>
                                                        Cargo: {t.sucursalGasto?.nombre || (t.sucursalCargoCosto === 'DESTINO' ? 'Destino' : 'Origen')}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-xs text-muted-foreground max-w-[150px] truncate" title={t.motivo}>
                                            {t.motivo || '-'}
                                        </td>
                                        {statusFilter === 'TODOS' && (
                                            <td className="p-4 text-center">
                                                {!isAnulado ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700 uppercase tracking-wider">
                                                        <CheckCircle2 className="w-3 h-3" /> Completado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                                                        <XCircle className="w-3 h-3" /> Anulado
                                                    </span>
                                                )}
                                            </td>
                                        )}
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-1.5">
                                                <button
                                                    onClick={() => setViewingTraspaso(t)}
                                                    className="px-2.5 py-1.5 bg-card border hover:border-primary/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                    title="Ver Detalle de Traspaso"
                                                >
                                                    <Eye className="w-3.5 h-3.5 text-primary" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintIndividualTraspaso(t)}
                                                    className="px-2.5 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                    title="Imprimir Guía de Traspaso"
                                                >
                                                    <Printer className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => handleOpenWhatsAppModal(t)}
                                                    className="px-2.5 py-1.5 bg-card border hover:border-emerald-500/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                    title="Enviar Guía de Traspaso por WhatsApp (PDF)"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                                </button>
                                                {!isAnulado && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenEdit(t)}
                                                            disabled={loadingEditId === t.id}
                                                            className="px-2.5 py-1.5 bg-card border hover:border-amber-500/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer disabled:opacity-60"
                                                            title="Editar Traspaso"
                                                        >
                                                            {loadingEditId === t.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                                            ) : (
                                                                <Edit className="w-3.5 h-3.5 text-amber-500" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => setAnularConfirmId(t.id)}
                                                            className="px-2.5 py-1.5 bg-card border hover:border-red-500/50 text-foreground rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                                                            title="Anular Traspaso (Revertir Stock)"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                        </button>
                                                    </>
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredTraspasos.length)} de {filteredTraspasos.length}
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

            {/* Modal de Registro / Edición de Traspaso */}
            <Modal
                isOpen={isCreating}
                onClose={() => { setIsCreating(false); resetForm(); }}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <ArrowLeftRight className="w-6 h-6 text-primary/80" />
                        {editingId ? 'Editar Traspaso entre Sucursales' : 'Registrar Traspaso entre Sucursales'}
                    </span>
                }
                className="max-w-3xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1.5 py-1 custom-scrollbar">
                        {hasSoldItemsInTraspaso && (
                            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 text-xs text-foreground flex items-start gap-2.5">
                                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                                <div className="space-y-0.5">
                                    <p className="font-bold text-amber-600">Este traspaso tiene productos con ventas o salidas registradas en la sucursal de destino</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        No se pueden cambiar las sucursales ni eliminar esos productos (ni reducir por debajo de lo vendido en destino), pero <strong className="text-foreground">sí puedes aumentar cantidades por error de digitación</strong>, agregar nuevos productos o editar/eliminar ítems que aún no se vendieron.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Cabecera: Código, Fecha, Costo de Transporte */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Código de Traspaso</label>
                                <input
                                    type="text"
                                    placeholder={`Autogenerado (Ej. TRASP-${getSucursalCodePreview(formData.sucursalOrigenId)}-0001)`}
                                    value={formData.codigo}
                                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm font-mono outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5 text-primary" /> Fecha <span className="text-destructive">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={formData.fecha}
                                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                                    <Truck className="w-3.5 h-3.5 text-primary" /> Costo Traspaso / Flete (Bs.)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">Bs.</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        value={formData.costoTransporte}
                                        onChange={(e) => setFormData({ ...formData, costoTransporte: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2.5 border rounded-lg bg-background text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sucursal Origen y Sucursal Destino */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-muted/20 border rounded-xl">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-red-500" />
                                    Sucursal de Origen (Salida de Stock) <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={formData.sucursalOrigenId}
                                    disabled={hasSoldItemsInTraspaso}
                                    onChange={(e) => {
                                        const newOrigId = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            sucursalOrigenId: newOrigId,
                                            sucursalGastoId: (!prev.sucursalGastoId || prev.sucursalGastoId === prev.sucursalOrigenId) ? newOrigId : prev.sucursalGastoId
                                        }));
                                        setItemsList([]); // Reset items if branch changes
                                        setError(null);
                                    }}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                >
                                    <option value="">Seleccione Sucursal Origen...</option>
                                    {sucursales?.filter(s => s.activo !== false || s.id.toString() === formData.sucursalOrigenId).map(s => (
                                        <option key={s.id} value={s.id} disabled={s.id.toString() === formData.sucursalDestinoId}>
                                            {s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-green-500" />
                                    Sucursal de Destino (Ingreso de Stock) <span className="text-destructive">*</span>
                                </label>
                                <select
                                    value={formData.sucursalDestinoId}
                                    disabled={hasSoldItemsInTraspaso}
                                    onChange={(e) => {
                                        setFormData({ ...formData, sucursalDestinoId: e.target.value });
                                        setError(null);
                                    }}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                    required
                                >
                                    <option value="">Seleccione Sucursal Destino...</option>
                                    {sucursales?.filter(s => s.activo !== false || s.id.toString() === formData.sucursalDestinoId).map(s => (
                                        <option key={s.id} value={s.id} disabled={s.id.toString() === formData.sucursalOrigenId}>
                                            {s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Asignación de Cargo por Costo de Transporte / Egreso */}
                        {parseFloat(formData.costoTransporte) > 0 && (
                            <div className="p-3.5 bg-muted/40 border border-primary/30 rounded-xl space-y-2">
                                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                                    <span className="flex items-center gap-1.5">
                                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                                        <span>¿Qué sucursal se hace cargo de este gasto / egreso de dinero?</span>
                                        <span className="text-destructive">*</span>
                                    </span>
                                </label>
                                <select
                                    value={formData.sucursalGastoId}
                                    onChange={(e) => {
                                        setFormData({ ...formData, sucursalGastoId: e.target.value });
                                        setError(null);
                                    }}
                                    className="w-full p-2.5 border rounded-lg bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                                    required
                                >
                                    <option value="">Seleccione Sucursal que asume el gasto...</option>
                                    {sucursales?.filter(s => s.activo !== false || s.id.toString() === formData.sucursalGastoId).map(s => {
                                        const isOrig = s.id.toString() === formData.sucursalOrigenId;
                                        const isDest = s.id.toString() === formData.sucursalDestinoId;
                                        const tag = isOrig ? ' (Origen / Salida)' : (isDest ? ' (Destino / Ingreso)' : '');
                                        return (
                                            <option key={s.id} value={s.id}>
                                                {s.nombre} {s.ciudad?.nombre ? `(${s.ciudad.nombre})` : ''}{tag}
                                            </option>
                                        );
                                    })}
                                </select>
                                <p className="text-[11px] text-muted-foreground">
                                    El egreso financiero de este flete se asignará a la sucursal seleccionada. Puede elegir origen, destino o cualquier otra sucursal de la empresa.
                                </p>
                            </div>
                        )}

                        {/* Selección de Productos y Cantidades */}
                        <div className="space-y-3 p-3.5 border rounded-xl bg-card">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                                    <Package className="w-4 h-4 text-primary" /> Productos a Traspasar
                                </span>
                                {formData.sucursalOrigenId && (
                                    <span className="text-[11px] text-muted-foreground">
                                        Mostrando stock disponible en sucursal origen seleccionada
                                    </span>
                                )}
                            </div>

                            {!formData.sucursalOrigenId ? (
                                <p className="text-xs text-amber-600 font-medium p-2 bg-amber-500/10 rounded-lg">
                                    Seleccione primero una sucursal de origen para consultar el stock disponible y agregar productos.
                                </p>
                            ) : (
                                <div className="space-y-3 bg-muted/20 p-3 rounded-xl border border-border/60">
                                    {editingItemIndex !== null && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-700 dark:text-blue-300 shadow-xs">
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-1.5 font-bold">
                                                    <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span>Modificando producto en la lista: <span className="underline">{itemsList[editingItemIndex]?.producto?.nombre}</span></span>
                                                </div>
                                                {editingLockedItem && (
                                                    <p className="text-[11px] text-amber-600 pl-5 font-semibold">
                                                        Ya tiene {editingLockedItem.cantidadVendidaDestino} un. vendidas/usadas en destino (solo puede ajustar cantidad ≥ {editingLockedItem.cantidadVendidaDestino} un. o editar observación).
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleCancelEditItem}
                                                className="text-[11px] font-semibold hover:underline flex items-center gap-1 text-muted-foreground hover:text-foreground cursor-pointer self-end sm:self-center"
                                            >
                                                <X className="w-3.5 h-3.5" /> Cancelar edición
                                            </button>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                        <div className="sm:col-span-8 space-y-1">
                                            <label className="text-[11px] font-semibold text-muted-foreground">Producto</label>
                                            <SearchableSelect
                                                value={selectedProdId}
                                                disabled={Boolean(editingLockedItem)}
                                                onChange={(val) => {
                                                    setSelectedProdId(val);
                                                    setSelectedNumeroLote('');
                                                }}
                                                options={productOptions}
                                                placeholder="Buscar producto por nombre o código..."
                                                searchPlaceholder="Escriba código o nombre de producto..."
                                            />
                                        </div>

                                        <div className="sm:col-span-4 space-y-1">
                                            <label className="text-[11px] font-semibold text-muted-foreground">Lote de Origen</label>
                                            <select
                                                value={selectedNumeroLote}
                                                onChange={(e) => setSelectedNumeroLote(e.target.value)}
                                                disabled={!selectedProdId || Boolean(editingLockedItem) || (availableLotesInOrigen.length === 0 && !selectedNumeroLote)}
                                                className="w-full min-h-[40px] p-2 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                                            >
                                                <option value="">Automático (FEFO / PEPS)</option>
                                                {selectedNumeroLote && !availableLotesInOrigen.some(l => l.numeroLote === selectedNumeroLote) && (
                                                    <option value={selectedNumeroLote}>Lote: {selectedNumeroLote} (0 u. adicionales en origen)</option>
                                                )}
                                                {availableLotesInOrigen.map(l => {
                                                    const venc = l.fechaVencimiento ? ` | Venc: ${String(l.fechaVencimiento).substring(0, 10).split('-').reverse().join('/')}` : '';
                                                    return (
                                                        <option key={l.id} value={l.numeroLote}>
                                                            Lote: {l.numeroLote || 'S/N'} ({l.cantidadActual} u.){venc}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                                        <div className="sm:col-span-3 space-y-1">
                                            <div className="flex items-center justify-between gap-1">
                                                <label className="text-[11px] font-semibold text-muted-foreground">Cantidad</label>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold">
                                                    {editingLockedItem && (
                                                        <span className="text-amber-600">Mín: {editingLockedItem.cantidadVendidaDestino}</span>
                                                    )}
                                                    {selectedProdId && (
                                                        <span className="text-primary">Max: {selectedProductStockInOrigen}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <input
                                                type="number"
                                                step="1"
                                                min={editingLockedItem ? Math.max(1, editingLockedItem.cantidadVendidaDestino || 1) : (selectedProdId ? 1 : undefined)}
                                                max={selectedProdId && selectedProductStockInOrigen > 0 ? selectedProductStockInOrigen : undefined}
                                                value={itemCantidad}
                                                onChange={(e) => setItemCantidad(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddItem();
                                                    }
                                                }}
                                                className="w-full min-h-[38px] p-2 border rounded-lg bg-background text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        <div className="sm:col-span-6 space-y-1">
                                            <label className="text-[11px] font-semibold text-muted-foreground">Observación (Opcional)</label>
                                            <input
                                                type="text"
                                                placeholder="Detalle o nota..."
                                                value={itemObservacion}
                                                onChange={(e) => setItemObservacion(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        handleAddItem();
                                                    }
                                                }}
                                                className="w-full min-h-[38px] p-2 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>

                                        <div className={`sm:col-span-3 flex items-center gap-1.5`}>
                                            <button
                                                type="button"
                                                onClick={handleAddItem}
                                                className={`w-full min-h-[38px] py-2 px-3 ${editingItemIndex !== null ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-primary text-primary-foreground hover:opacity-90'} text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer`}
                                                title={editingItemIndex !== null ? 'Actualizar cambios del producto' : 'Agregar a la lista'}
                                            >
                                                {editingItemIndex !== null ? (
                                                    <>
                                                        <Check className="w-4 h-4 shrink-0" />
                                                        <span>Actualizar</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Plus className="w-4 h-4 shrink-0" />
                                                        <span>Agregar</span>
                                                    </>
                                                )}
                                            </button>
                                            {editingItemIndex !== null && (
                                                <button
                                                    type="button"
                                                    onClick={handleCancelEditItem}
                                                    className="px-2.5 min-h-[38px] border rounded-lg text-xs font-semibold hover:bg-accent text-foreground transition-all cursor-pointer"
                                                    title="Cancelar edición"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Lista de Items agregados */}
                            {itemsList.length > 0 && (
                                <div className="border rounded-lg overflow-hidden mt-3">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead>
                                            <tr className="bg-muted/40 border-b">
                                                <th className="p-2.5 font-semibold text-muted-foreground">Producto</th>
                                                <th className="p-2.5 font-semibold text-muted-foreground">Lote / Vencimiento</th>
                                                <th className="p-2.5 font-semibold text-muted-foreground text-center">Stock Origen</th>
                                                <th className="p-2.5 font-semibold text-muted-foreground text-right">Cant. a Traspasar</th>
                                                <th className="p-2.5 font-semibold text-muted-foreground">Detalle</th>
                                                <th className="p-2.5 font-semibold text-muted-foreground text-right w-20">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {itemsList.map((item, idx) => (
                                                <tr 
                                                    key={idx} 
                                                    className={`hover:bg-accent/30 transition-colors ${editingItemIndex === idx ? 'bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-l-blue-500' : ''}`}
                                                >
                                                    <td className="p-2.5 font-medium">
                                                        <div>
                                                            {item.producto?.nombre}
                                                            {item.producto?.codigo && (
                                                                <span className="text-[10px] text-muted-foreground ml-1.5 font-mono">
                                                                    [{item.producto.codigo}]
                                                                </span>
                                                            )}
                                                        </div>
                                                        {item.tieneVentasDestino && (
                                                            <div className="mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 border border-amber-500/40 text-[10px] font-semibold">
                                                                <Lock className="w-2.5 h-2.5 shrink-0" />
                                                                <span>Vendidas en destino: {item.cantidadVendidaDestino} un. (Mín. {item.cantidadVendidaDestino})</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5">
                                                        {item.numeroLote ? (
                                                            <div className="flex flex-col text-[11px]">
                                                                <span className="font-mono font-semibold text-foreground">Lote: {item.numeroLote}</span>
                                                                {item.fechaVencimiento && (
                                                                    <span className="text-[10px] text-muted-foreground">Venc: {String(item.fechaVencimiento).substring(0, 10).split('-').reverse().join('/')}</span>
                                                                )}
                                                            </div>
                                                        ) : item.lotesResumenTexto ? (
                                                            <div className="flex flex-col text-[10px] text-muted-foreground">
                                                                <span className="font-semibold text-foreground">Multi-lote (FEFO)</span>
                                                                <span className="font-mono">{item.lotesResumenTexto}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                                                                Auto (FEFO/PEPS)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-2.5 text-center text-muted-foreground font-mono">
                                                        {item.stockDisponible} un.
                                                    </td>
                                                    <td className="p-2.5 text-right font-bold text-primary">
                                                        {item.cantidad} {item.producto?.unidadMedida || 'un.'}
                                                    </td>
                                                    <td className="p-2.5 text-muted-foreground text-[11px]">
                                                        {item.observacion || '-'}
                                                    </td>
                                                    <td className="p-2.5 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditItem(idx)}
                                                                className={`p-1.5 rounded transition-colors cursor-pointer ${editingItemIndex === idx ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'text-blue-600 hover:bg-blue-500/10'}`}
                                                                title={item.tieneVentasDestino ? `Editar cantidad (mín. ${item.cantidadVendidaDestino} un.) u observación` : 'Editar producto'}
                                                            >
                                                                <Edit className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                disabled={Boolean(item.tieneVentasDestino)}
                                                                onClick={() => handleRemoveItem(idx)}
                                                                className={`p-1.5 rounded transition-colors ${
                                                                    item.tieneVentasDestino
                                                                        ? 'text-muted-foreground/40 cursor-not-allowed'
                                                                        : 'text-red-600 hover:bg-red-500/10 cursor-pointer'
                                                                }`}
                                                                title={
                                                                    item.tieneVentasDestino
                                                                        ? `Bloqueado: ya se vendieron/utilizaron ${item.cantidadVendidaDestino} un. de este lote en destino`
                                                                        : 'Eliminar producto'
                                                                }
                                                            >
                                                                {item.tieneVentasDestino ? (
                                                                    <Lock className="w-3.5 h-3.5" />
                                                                ) : (
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                )}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Motivo y Observaciones */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Motivo / Justificación</label>
                                <textarea
                                    placeholder="Ej. Reabastecimiento de sucursal, redistribución..."
                                    value={formData.motivo}
                                    onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] resize-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-foreground">Observaciones Adicionales</label>
                                <textarea
                                    placeholder="Detalles sobre el transporte, transportista, etc..."
                                    value={formData.observaciones}
                                    onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                                    className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border/50">
                        <div className="text-xs text-muted-foreground">
                            Total items: <span className="font-bold text-foreground">{itemsList.length}</span> | Total unidades: <span className="font-bold text-primary">{itemsList.reduce((acc, curr) => acc + curr.cantidad, 0)}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                type="button"
                                onClick={() => { setIsCreating(false); resetForm(); }}
                                className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm"
                            >
                                <X className="w-4 h-4" /> Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={createMutation.isPending || updateMutation.isPending || itemsList.length === 0}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                            >
                                <Save className="w-4 h-4" /> {editingId ? (updateMutation.isPending ? 'Actualizando...' : 'Guardar Cambios') : (createMutation.isPending ? 'Procesando...' : 'Completar Traspaso')}
                            </button>
                        </div>
                    </div>
                </form>
            </Modal>

            {/* Modal de Detalle / Comprobante de Traspaso */}
            <Modal
                isOpen={viewingTraspaso !== null}
                onClose={() => setViewingTraspaso(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <ArrowLeftRight className="w-6 h-6 text-primary/80" />
                        Comprobante de Traspaso: {viewingTraspaso?.codigo}
                    </span>
                }
                className="max-w-2xl"
            >
                {viewingTraspaso && (() => {
                    const sucOrigen = viewingTraspaso.sucursalOrigen || viewingTraspaso.almacenOrigen;
                    const sucDestino = viewingTraspaso.sucursalDestino || viewingTraspaso.almacenDestino;
                    return (
                    <div className="space-y-4">
                        {/* Cabecera Informativa */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-muted/20 border rounded-xl text-xs">
                            <div>
                                <span className="text-muted-foreground block">Fecha:</span>
                                <span className="font-bold">{viewingTraspaso.fecha ? format(new Date(viewingTraspaso.fecha + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Estado:</span>
                                <span className={`font-bold ${viewingTraspaso.estado === 'COMPLETADO' ? 'text-green-600' : 'text-red-600'}`}>
                                    {viewingTraspaso.estado}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Costo Transporte:</span>
                                <span className="font-bold text-primary">Bs. {Number(viewingTraspaso.costoTransporte).toLocaleString('es-BO', { minimumFractionDigits: 2 })}</span>
                                {Number(viewingTraspaso.costoTransporte) > 0 && (
                                    <span className="text-[10px] text-muted-foreground block font-medium mt-0.5">
                                        Cargo: <span className="font-bold text-foreground">
                                            {viewingTraspaso.sucursalGasto?.nombre 
                                                ? `${viewingTraspaso.sucursalGasto.nombre}${(viewingTraspaso.sucursalGasto as any)?.ciudad?.nombre ? ` (${(viewingTraspaso.sucursalGasto as any).ciudad.nombre})` : ''}`
                                                : (viewingTraspaso.sucursalCargoCosto === 'DESTINO' ? `Destino (${sucDestino?.nombre || '-'})` : `Origen (${sucOrigen?.nombre || '-'})`)}
                                        </span>
                                    </span>
                                )}
                            </div>
                            <div>
                                <span className="text-muted-foreground block">Registrado por:</span>
                                <span className="font-bold truncate">{viewingTraspaso.usuario?.persona ? `${viewingTraspaso.usuario.persona.nombres}` : (viewingTraspaso.usuario?.username || 'Sistema')}</span>
                            </div>
                        </div>

                        {/* Sucursales Involucradas */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-card border rounded-xl text-xs">
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-red-500 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" /> SUCURSAL ORIGEN (SALIDA)
                                </span>
                                <p className="font-bold text-foreground text-sm">{sucOrigen?.nombre || '-'}</p>
                                <p className="text-muted-foreground text-[11px]">{(sucOrigen as any)?.ciudad?.nombre || 'Sin ciudad'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-[11px] font-bold text-green-600 flex items-center gap-1">
                                    <Building2 className="w-3.5 h-3.5" /> SUCURSAL DESTINO (INGRESO)
                                </span>
                                <p className="font-bold text-foreground text-sm">{sucDestino?.nombre || '-'}</p>
                                <p className="text-muted-foreground text-[11px]">{(sucDestino as any)?.ciudad?.nombre || 'Sin ciudad'}</p>
                            </div>
                        </div>

                        {/* Tabla de Productos Traspasados */}
                        <div className="space-y-1.5">
                            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                                Productos Transferidos
                            </span>
                            <div className="border rounded-lg overflow-hidden">
                                <table className="w-full text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-muted/40 border-b">
                                            <th className="p-3 font-semibold text-muted-foreground w-10">#</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Producto</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Lote / Vencimiento</th>
                                            <th className="p-3 font-semibold text-muted-foreground text-right">Cantidad</th>
                                            <th className="p-3 font-semibold text-muted-foreground">Observación</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {viewingTraspaso.detalles?.map((d: any, idx) => {
                                            let lotesList: any[] = [];
                                            if (d.lotesDetalle) {
                                                try {
                                                    lotesList = JSON.parse(d.lotesDetalle);
                                                } catch (e) {
                                                    lotesList = [];
                                                }
                                            }

                                            return (
                                                <tr key={d.id || idx} className="hover:bg-accent/20">
                                                    <td className="p-3 font-mono text-muted-foreground">{idx + 1}</td>
                                                    <td className="p-3 font-medium">
                                                        {d.producto?.nombre}
                                                        {d.producto?.codigo && (
                                                            <span className="text-[10px] text-muted-foreground font-mono ml-1.5">
                                                                [{d.producto.codigo}]
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3">
                                                        {lotesList.length > 0 ? (
                                                            <div className="flex flex-col gap-1">
                                                                {lotesList.map((lt: any, lIdx: number) => {
                                                                    const venc = lt.fechaVencimiento ? String(lt.fechaVencimiento).substring(0, 10).split('-').reverse().join('/') : null;
                                                                    return (
                                                                        <div key={lIdx} className="bg-muted/60 p-1 rounded text-[11px] border">
                                                                            <div className="flex items-center gap-1.5">
                                                                                <span className="font-mono font-semibold text-foreground">
                                                                                    Lote: {lt.numeroLote || 'S/N'}
                                                                                </span>
                                                                                <span className="text-primary font-bold text-[10px]">
                                                                                    ({lt.cantidad} {d.producto?.unidadMedida || 'u.'})
                                                                                </span>
                                                                            </div>
                                                                            {venc && (
                                                                                <span className="text-[10px] text-muted-foreground block">
                                                                                    Venc: {venc}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        ) : d.numeroLote ? (
                                                            <div className="bg-muted/60 p-1 rounded text-[11px] border">
                                                                <span className="font-mono font-semibold text-foreground block">Lote: {d.numeroLote}</span>
                                                                {d.fechaVencimiento && (
                                                                    <span className="text-[10px] text-muted-foreground block">
                                                                        Venc: {String(d.fechaVencimiento).substring(0, 10).split('-').reverse().join('/')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="italic text-muted-foreground">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right font-bold text-primary">
                                                        {Number(d.cantidad).toLocaleString('es-BO')} {d.producto?.unidadMedida || 'un.'}
                                                    </td>
                                                    <td className="p-3 text-muted-foreground text-[11px]">
                                                        {d.observacion || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Motivo & Observaciones */}
                        {(viewingTraspaso.motivo || viewingTraspaso.observaciones) && (
                            <div className="p-3 bg-muted/20 border rounded-xl space-y-2 text-xs">
                                {viewingTraspaso.motivo && (
                                    <div>
                                        <span className="font-bold text-foreground">Motivo: </span>
                                        <span className="text-muted-foreground">{viewingTraspaso.motivo}</span>
                                    </div>
                                )}
                                {viewingTraspaso.observaciones && (
                                    <div>
                                        <span className="font-bold text-foreground">Observaciones: </span>
                                        <span className="text-muted-foreground">{viewingTraspaso.observaciones}</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-3 border-t">
                            <div className="flex items-center gap-2">
                                {viewingTraspaso.estado === 'COMPLETADO' && (
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEdit(viewingTraspaso)}
                                        disabled={loadingEditId === viewingTraspaso.id}
                                        className="px-3 py-2 bg-amber-500/10 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                                        title="Editar Traspaso"
                                    >
                                        {loadingEditId === viewingTraspaso.id ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : (
                                            <Edit className="w-3.5 h-3.5" />
                                        )} Editar
                                    </button>
                                )}
                                {viewingTraspaso.estado === 'COMPLETADO' && (
                                    <button
                                        type="button"
                                        onClick={() => setAnularConfirmId(viewingTraspaso.id)}
                                        className="px-3 py-2 bg-red-600/10 text-red-600 hover:bg-red-600 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Anular Traspaso
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => handlePrintIndividualTraspaso(viewingTraspaso)}
                                    className="px-3 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                    title="Imprimir Guía de Traspaso"
                                >
                                    <Printer className="w-3.5 h-3.5" /> Imprimir
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOpenWhatsAppModal(viewingTraspaso)}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => setViewingTraspaso(null)}
                                className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all ml-auto"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                    );
                })()}
            </Modal>

            {/* Modal Confirmar Anulación */}
            <Modal
                isOpen={anularConfirmId !== null}
                onClose={() => setAnularConfirmId(null)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        Confirmar Anulación de Traspaso
                    </span>
                }
                className="max-w-md"
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        ¿Estás seguro de anular este traspaso? Al confirmar, las cantidades transferidas serán descontadas de la sucursal de destino y devueltas automáticamente a la sucursal de origen.
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
                            Sí, Anular y Revertir Stock
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Modal para Enviar Guía de Traspaso por WhatsApp */}
            <Modal
                isOpen={whatsappModalData.isOpen}
                onClose={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false, traspaso: null }))}
                title={
                    <span className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                        <MessageCircle className="w-5 h-5" />
                        Enviar Guía de Traspaso por WhatsApp
                    </span>
                }
                className="max-w-lg"
            >
                {whatsappModalData.traspaso && (
                    <div className="space-y-4">
                        {/* Card resumen de traspaso */}
                        <div className="p-3.5 bg-muted/40 border rounded-xl space-y-1 text-sm">
                            <div className="flex justify-between items-center font-bold">
                                <span className="text-foreground">Traspaso N° {whatsappModalData.traspaso.codigo || `TR-${whatsappModalData.traspaso.id}`}</span>
                                <span className="text-primary text-base">
                                    {whatsappModalData.traspaso.detalles?.reduce((acc, d) => acc + Number(d.cantidad || 0), 0) || 0} Unidades
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center">
                                <span>Origen: <strong className="text-foreground">{(whatsappModalData.traspaso.sucursalOrigen || whatsappModalData.traspaso.almacenOrigen)?.nombre || '-'}</strong></span>
                                <span>Destino: <strong className="text-foreground">{(whatsappModalData.traspaso.sucursalDestino || whatsappModalData.traspaso.almacenDestino)?.nombre || '-'}</strong></span>
                            </div>
                            <div className="text-xs text-muted-foreground flex justify-between items-center pt-1 border-t border-border/40">
                                <span>Fecha: {format(new Date(whatsappModalData.traspaso.fecha + 'T00:00:00'), 'dd/MM/yyyy')}</span>
                                {Number(whatsappModalData.traspaso.costoTransporte) > 0 && (
                                    <span>Flete: <strong className="text-foreground">Bs. {Number(whatsappModalData.traspaso.costoTransporte).toFixed(2)}</strong></span>
                                )}
                            </div>
                        </div>

                        {/* Input de Teléfono */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                                <span>Número de WhatsApp Destinatario (Encargado / Chofer)</span>
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
                                El destinatario recibirá el documento PDF oficial de la guía de traspaso emitido por el sistema.
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
                                        const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.traspaso.sucursalOrigen?.id || whatsappModalData.traspaso.almacenOrigen?.id);
                                        const curBranch = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId));
                                        const branchName = curBranch?.sucursalNombre || (whatsappModalData.traspaso.sucursalOrigen || whatsappModalData.traspaso.almacenOrigen)?.nombre || 'Sucursal Origen';
                                        const ciudadNombre = curBranch?.ciudadNombre;
                                        const branchDisplay = ciudadNombre ? `${branchName} (${ciudadNombre})` : branchName;
                                        return (
                                            <span className="text-xs font-bold text-foreground truncate">{branchDisplay}</span>
                                        );
                                    })()}
                                </div>
                            </div>
                            {(() => {
                                const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.traspaso.sucursalOrigen?.id || whatsappModalData.traspaso.almacenOrigen?.id);
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
                                placeholder="Escribe una nota personalizada si deseas acompañar la guía con un mensaje específico..."
                                className="w-full p-2.5 border rounded-lg bg-background text-xs outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/60"
                            />
                        </div>

                        {/* Botones de acción */}
                        <div className="pt-3 border-t flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                            {(() => {
                                const cleanDigits = (whatsappModalData.phone || '').replace(/\D/g, '');
                                const phoneWithCountry = cleanDigits.length === 8 ? `591${cleanDigits}` : cleanDigits;
                                const defaultText = encodeURIComponent(
                                    `Hola, le enviamos la Guía de Traspaso N° ${whatsappModalData.traspaso.codigo || `TR-${whatsappModalData.traspaso.id}`}.`
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
                                const sucursalTargetId = whatsappModalData.sucursalId ? Number(whatsappModalData.sucursalId) : (whatsappModalData.traspaso.sucursalOrigen?.id || whatsappModalData.traspaso.almacenOrigen?.id);
                                const isConn = whatsappBranches?.find(b => String(b.sucursalId) === String(sucursalTargetId))?.status === 'CONNECTED';

                                return (
                                    <div className="flex items-center gap-2 justify-end">
                                        <button
                                            type="button"
                                            onClick={() => setWhatsappModalData(prev => ({ ...prev, isOpen: false, traspaso: null }))}
                                            className="px-4 py-2 border rounded-lg text-xs font-semibold hover:bg-accent transition-all"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            disabled={sendWhatsAppMutation.isPending || !whatsappModalData.phone.trim() || !isConn}
                                            title={!isConn ? 'El bot de WhatsApp no está conectado en esta sucursal' : undefined}
                                            onClick={() => {
                                                if (!whatsappModalData.traspaso) return;
                                                if (!isConn) {
                                                    toast.error('El bot de WhatsApp de esta sucursal no está conectado');
                                                    return;
                                                }
                                                if (!whatsappModalData.phone.trim()) {
                                                    toast.error('Ingrese el número de teléfono de destino');
                                                    return;
                                                }
                                                sendWhatsAppMutation.mutate({
                                                    traspasoId: whatsappModalData.traspaso.id,
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

export default TraspasosPage;
