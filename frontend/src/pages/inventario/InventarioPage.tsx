import { Settings2 } from 'lucide-react';
import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { inventoryService } from '../../api/inventoryService';
import { categoryService } from '../../api/categoryService';
import { marcaService } from '../../api/marcaService';
import { grupoService } from '../../api/grupoService';
import { getCiudades } from '../../api/ciudadService';
import { sucursalService } from '../../api/sucursalService';
import Modal from '../../components/ui/Modal';
import { 
    Boxes, Search, Filter, AlertTriangle, 
    Printer, FileText, FileSpreadsheet, X, 
    ChevronLeft, ChevronRight, Check,
    ArrowUpRight, History, Tag, Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatQuantity } from '../../utils/currencyUtils';
import { useFilters } from '../../context/FilterContext';
import { useAuth } from '../../context/AuthContext';

const InventarioPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { selectedCiudad, selectedSucursal } = useFilters();
    const { isAdmin, hasAction } = useAuth();

    const canAjustar = isAdmin || hasAction('INVENTARIO', 'AJUSTAR');
    const canModificarLimites = isAdmin || hasAction('INVENTARIO', 'LIMITES') || hasAction('INVENTARIO', 'GESTIONAR_LIMITES');
    
    const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
    const [selectedMarca, setSelectedMarca] = useState<number | 'all'>('all');
    const [selectedGrupo, setSelectedGrupo] = useState<number | 'all'>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    const [isAdjusting, setIsAdjusting] = useState(false);
    const [isEditingLimits, setIsEditingLimits] = useState(false);
    const [limits, setLimits] = useState({ id: 0, productName: '', stockMinimo: 0, stockMaximo: 0 });
    const [adjustment, setAdjustment] = useState({ id: 0, cantidadStr: '', currentStock: 0, productName: '', observaciones: '' });

    const cantidad = parseFloat(adjustment.cantidadStr) || 0;

    const { data: categories } = useQuery({ queryKey: ['categories'], queryFn: categoryService.getAll });
    const { data: marcas } = useQuery({ queryKey: ['marcas'], queryFn: marcaService.getAll });
    const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: grupoService.getAll });
    const { data: ciudades } = useQuery({ queryKey: ['ciudades'], queryFn: getCiudades });
    const { data: sucursales } = useQuery({ queryKey: ['sucursales'], queryFn: sucursalService.getAll });

    const { data: inventory, isLoading } = useQuery({
        queryKey: ['inventory'],
        queryFn: () => inventoryService.getAll(),
        placeholderData: keepPreviousData,
    });
    
    const limitsMutation = useMutation({
        mutationFn: (data: { id: number, stockMinimo: number, stockMaximo: number }) => inventoryService.update(data.id, { stockMinimo: data.stockMinimo, stockMaximo: data.stockMaximo }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsEditingLimits(false);
            toast.success('Límites actualizados con éxito');
        },
        onError: () => toast.error('Error al actualizar límites')
    });

    const adjustMutation = useMutation({
        mutationFn: ({ id, cantidad, observaciones }: { id: number, cantidad: number, observaciones?: string }) => inventoryService.ajustarStock(id, cantidad, observaciones),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventory'] });
            setIsAdjusting(false);
            toast.success('Stock ajustado con éxito');
        },
        onError: () => toast.error('Error al ajustar el stock')
    });

    const exportColumns = [
        { header: 'Producto', dataKey: 'producto' },
        { header: 'Marca', dataKey: 'marca' },
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Sucursal', dataKey: 'sucursal' },
        { header: 'Stock Actual', dataKey: 'stock' },
        { header: 'Lote(s) / Vencimiento', dataKey: 'lotesInfo' },
        { header: 'Estado', dataKey: 'estado' }
    ];

    const getExportColumns = () => {
        let cols = [...exportColumns];
        if (selectedSucursal) cols = cols.filter(c => c.dataKey !== 'sucursal');
        return cols;
    };

    const getExcelColumns = () => {
        return [
            { header: 'ID', dataKey: 'id' },
            ...getExportColumns()
        ];
    };

    const getMarcaNombre = (producto: any): string => {
        if (!producto) return '-';
        if (producto.marca && typeof producto.marca === 'object' && producto.marca.nombre) {
            return producto.marca.nombre;
        }
        if (typeof producto.marca === 'string' && producto.marca.trim()) {
            return producto.marca.trim();
        }
        const mId = producto.marcaId || producto.marca?.id;
        if (mId && marcas) {
            const found = marcas.find((m: any) => Number(m.id) === Number(mId));
            if (found?.nombre) return found.nombre;
        }
        return '-';
    };

    const filteredInventory = useMemo(() => {
        if (!inventory) return [];

        const filtered = inventory.filter(inv => {
            const marcaNombre = getMarcaNombre(inv.producto);
            const matchesSearch = !searchTerm ||
                inv.producto?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                inv.producto?.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                marcaNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                Boolean((inv as any).lotes && (inv as any).lotes.some((l: any) => (l.numeroLote || '').toLowerCase().includes(searchTerm.toLowerCase())));

            const matchesCiudad = !selectedCiudad || 
                (inv.sucursal as any)?.ciudad?.id === Number(selectedCiudad) ||
                (inv.sucursal as any)?.ciudadId === Number(selectedCiudad);

            const matchesSucursal = !selectedSucursal || 
                (inv.sucursal as any)?.id === Number(selectedSucursal) ||
                (inv as any)?.sucursalId === Number(selectedSucursal);

            const matchesCategory = selectedCategory === 'all' || 
                inv.producto?.categoria?.id === Number(selectedCategory) ||
                inv.producto?.categoriaId === Number(selectedCategory);

            const matchesMarca = selectedMarca === 'all' || 
                inv.producto?.marca?.id === Number(selectedMarca) ||
                inv.producto?.marcaId === Number(selectedMarca) ||
                (marcas?.find(m => m.id === selectedMarca)?.nombre && marcaNombre.toLowerCase() === marcas.find(m => m.id === selectedMarca)?.nombre.toLowerCase());

            const matchesGrupo = selectedGrupo === 'all' || 
                inv.producto?.grupo?.id === Number(selectedGrupo) ||
                inv.producto?.grupoId === Number(selectedGrupo);
            
            return matchesSearch && matchesCiudad && matchesSucursal && matchesCategory && matchesMarca && matchesGrupo;
        });
        
        return filtered.sort((a, b) => (a.producto?.nombre || '').localeCompare(b.producto?.nombre || ''));
    }, [inventory, searchTerm, selectedCiudad, selectedSucursal, selectedCategory, selectedMarca, selectedGrupo, marcas]);

    const getFormattedData = () => {
        return filteredInventory.map(inv => {
            const lotesInfo = (inv as any).lotes && (inv as any).lotes.length > 0
                ? (inv as any).lotes.map((l: any) => {
                    const vencStr = l.fechaVencimiento ? ` (Venc: ${l.fechaVencimiento.substring(0, 10).split('-').reverse().join('/')})` : '';
                    return `Lote: ${l.numeroLote || 'S/N'} [${formatQuantity(l.cantidadActual)} u.]${vencStr}`;
                }).join('; ')
                : '-';

            return {
                id: inv.id,
                producto: inv.producto?.nombre || '-',
                marca: getMarcaNombre(inv.producto),
                codigo: inv.producto?.codigo || '-',
                sucursal: `${(inv.sucursal as any)?.nombre || '-'} (${(inv.sucursal as any)?.ciudad?.nombre || '-'})`,
                stock: `${formatQuantity(inv.stockActual)} ${inv.producto?.unidadMedida || ''}`,
                lotesInfo,
                estado: Number(inv.stockActual) <= Number(inv.stockMinimo) ? 'Stock Bajo' : 'Normal'
            };
        });
    };

    const getFiltersText = () => {
        const texts: string[] = [];

        // Ciudad
        if (selectedCiudad) {
            const c = ciudades?.find(ci => ci.id === Number(selectedCiudad));
            if (c) texts.push(`Ciudad: ${c.nombre}`);
        }

        // Sucursal
        if (selectedSucursal) {
            const s = sucursales?.find(su => su.id === Number(selectedSucursal));
            if (s) texts.push(`Sucursal: ${s.nombre}`);
        }

        // Marcas
        if (selectedMarca !== 'all') {
            const m = marcas?.find(m => m.id === selectedMarca);
            if (m) texts.push(`Marca: ${m.nombre}`);
        }

        // Categorias
        if (selectedCategory !== 'all') {
            const c = categories?.find(c => c.id === selectedCategory);
            if (c) texts.push(`Categoría: ${c.nombre}`);
        }

        // Grupos
        if (selectedGrupo !== 'all') {
            const g = grupos?.find(g => g.id === selectedGrupo);
            if (g) texts.push(`Grupo: ${g.nombre}`);
        }

        if (searchTerm.trim()) {
            texts.push(`Búsqueda: "${searchTerm.trim()}"`);
        }

        return texts.length > 0 ? texts.join(' | ') : 'Todo el inventario';
    };

    const handlePrint = () => {
        if (!inventory) return;
        printData('Reporte de Inventario', getExportColumns(), getFormattedData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!inventory) return;
        exportToPDF('Reporte de Inventario', getExportColumns(), getFormattedData(), 'inventario_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!inventory) return;
        exportToExcel(getExcelColumns(), getFormattedData(), 'inventario_reporte');
    };

    const totalPages = Math.ceil(filteredInventory.length / itemsPerPage) || 1;
    const paginatedInventory = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredInventory.slice(start, start + itemsPerPage);
    }, [filteredInventory, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCiudad, selectedSucursal, selectedCategory, selectedMarca, selectedGrupo]);

    const hasActiveFilters = selectedMarca !== 'all' || selectedCategory !== 'all' || selectedGrupo !== 'all' || !!searchTerm;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Boxes className="w-8 h-8 text-primary/80" />
                        Existencias de Inventario
                    </h1>
                    <p className="text-muted-foreground italic">Control de stock actual, lotes y vencimientos.</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Imprimir reporte"
                    >
                        <Printer className="w-4 h-4 text-muted-foreground" />
                        <span className="hidden sm:inline">Imprimir</span>
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Exportar a PDF"
                    >
                        <FileText className="w-4 h-4 text-red-500" />
                        <span className="hidden sm:inline">PDF</span>
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
                        title="Exportar a Excel"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-green-600" />
                        <span className="hidden sm:inline">Excel</span>
                    </button>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por producto o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-card border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Filtro por Marca */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Tag className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedMarca}
                        onChange={(e) => setSelectedMarca(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todas las Marcas</option>
                        {marcas?.map(m => (
                            <option key={m.id} value={m.id} className="bg-background text-foreground">{m.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Categoría */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todas las Categorías</option>
                        {categories?.map(c => (
                            <option key={c.id} value={c.id} className="bg-background text-foreground">{c.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro por Grupo */}
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Layers className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                        value={selectedGrupo}
                        onChange={(e) => setSelectedGrupo(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="bg-transparent border-none outline-none font-medium cursor-pointer"
                    >
                        <option value="all" className="bg-background text-foreground">Todos los Grupos</option>
                        {grupos?.map(g => (
                            <option key={g.id} value={g.id} className="bg-background text-foreground">{g.nombre}</option>
                        ))}
                    </select>
                </div>

                {/* Botón Limpiar Filtros */}
                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={() => {
                            setSelectedCategory('all');
                            setSelectedMarca('all');
                            setSelectedGrupo('all');
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

            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[950px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Producto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Marca</th>
                                {!selectedSucursal && <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal / Ciudad</th>}
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Lotes / Vencimiento</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Stock Actual</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Stock Mínimo</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-center">Estado</th>
                                {(canAjustar || canModificarLimites) && (
                                    <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {isLoading ? (
                                <tr><td colSpan={7 + (!selectedSucursal ? 1 : 0) + (canAjustar || canModificarLimites ? 1 : 0)} className="p-8 text-center text-muted-foreground animate-pulse">Cargando existencias...</td></tr>
                            ) : paginatedInventory.length === 0 ? (
                                <tr><td colSpan={7 + (!selectedSucursal ? 1 : 0) + (canAjustar || canModificarLimites ? 1 : 0)} className="p-8 text-center text-muted-foreground">No se encontraron productos en inventario.</td></tr>
                            ) : paginatedInventory.map((inv, index) => {
                                const isLowStock = Number(inv.stockActual) <= Number(inv.stockMinimo);
                                const itemLotes = (inv as any).lotes || [];
                                return (
                                    <tr key={inv.id} className="hover:bg-accent/30 transition-colors group">
                                        <td className="p-4 text-sm font-mono text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{inv.producto?.nombre}</span>
                                                <span className="text-xs font-mono text-muted-foreground">Código: {inv.producto?.codigo}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-foreground">
                                                {getMarcaNombre(inv.producto)}
                                            </span>
                                        </td>
                                        {!selectedSucursal && (
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{(inv.sucursal as any)?.nombre || 'Sucursal Principal'}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {(inv.sucursal as any)?.ciudad?.nombre || '-'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="p-4">
                                            {itemLotes.length > 0 ? (
                                                <div className="flex flex-col gap-1 max-w-[240px]">
                                                    {itemLotes.map((lote: any, lIdx: number) => {
                                                        const hasVenc = !!lote.fechaVencimiento;
                                                        let isExpired = false;
                                                        let isNearExpire = false;
                                                        let formattedVenc = '-';

                                                        if (hasVenc) {
                                                            const vencDate = new Date(String(lote.fechaVencimiento).substring(0, 10) + 'T00:00:00');
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const diffDays = Math.ceil((vencDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                                            isExpired = diffDays <= 0;
                                                            isNearExpire = diffDays > 0 && diffDays <= 60;
                                                            formattedVenc = String(lote.fechaVencimiento).substring(0, 10).split('-').reverse().join('/');
                                                        }

                                                        return (
                                                            <div key={lIdx} className="flex flex-col bg-muted/40 hover:bg-muted/70 p-1.5 rounded-md border text-xs">
                                                                <div className="flex items-center justify-between gap-1">
                                                                    <span className="font-mono font-semibold text-foreground text-[11px]">
                                                                        Lote: {lote.numeroLote || 'S/N'}
                                                                    </span>
                                                                    <span className="font-bold text-primary text-[11px]">
                                                                        {formatQuantity(lote.cantidadActual)} {inv.producto.unidadMedida || 'u.'}
                                                                    </span>
                                                                </div>
                                                                {hasVenc && (
                                                                    <div className="flex items-center gap-1 mt-0.5">
                                                                        <span className="text-[10px] text-muted-foreground">Vence:</span>
                                                                        <span className={`text-[10px] font-semibold ${
                                                                            isExpired 
                                                                                ? 'text-destructive font-bold' 
                                                                                : isNearExpire 
                                                                                    ? 'text-amber-600 dark:text-amber-400 font-bold' 
                                                                                    : 'text-foreground'
                                                                        }`}>
                                                                            {formattedVenc} {isExpired ? '(Vencido)' : isNearExpire ? '(Próx.)' : ''}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <span className="text-xs italic text-muted-foreground">Sin lotes registrados</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`text-sm font-bold ${isLowStock ? 'text-destructive' : 'text-primary'}`}>
                                                {formatQuantity(inv.stockActual)}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground ml-1">
                                                {inv.producto.unidadMedida}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center text-sm text-muted-foreground font-medium">
                                            {formatQuantity(inv.stockMinimo || 0)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {isLowStock ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                    <AlertTriangle className="w-3 h-3" /> Stock Bajo
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold uppercase tracking-widest">
                                                    <Check className="w-3 h-3" /> Normal
                                                </span>
                                            )}
                                        </td>
                                        {(canAjustar || canModificarLimites) && (
                                            <td className="p-4 text-sm text-right">
                                                <div className="flex justify-end gap-2">
                                                    {canAjustar && (
                                                        <button
                                                            onClick={() => {
                                                                setAdjustment({
                                                                    id: inv.id,
                                                                    cantidadStr: '',
                                                                    currentStock: Number(inv.stockActual),
                                                                    productName: inv.producto.nombre,
                                                                    observaciones: ''
                                                                });
                                                                setIsAdjusting(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-bold hover:bg-primary hover:text-white transition-all inline-flex items-center gap-1.5"
                                                        >
                                                            <Boxes className="w-3 h-3" /> Ajustar
                                                        </button>
                                                    )}
                                                    {canModificarLimites && (
                                                        <button
                                                            onClick={() => {
                                                                setLimits({
                                                                    id: inv.id,
                                                                    productName: inv.producto.nombre,
                                                                    stockMinimo: Number(inv.stockMinimo || 0),
                                                                    stockMaximo: Number(inv.stockMaximo || 0)
                                                                });
                                                                setIsEditingLimits(true);
                                                            }}
                                                            className="px-3 py-1.5 bg-secondary/10 text-secondary-foreground rounded-lg text-xs font-bold hover:bg-secondary hover:text-secondary-foreground transition-all inline-flex items-center gap-1.5"
                                                            title="Editar Límites"
                                                        >
                                                            <Settings2 className="w-3 h-3" /> Límites
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredInventory.length)} de {filteredInventory.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm font-medium px-2">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>

            <Modal isOpen={isAdjusting} onClose={() => setIsAdjusting(false)} title="Ajuste Manual de Inventario">
                <div className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-xl space-y-2 border">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Producto Seleccionado</div>
                        <div className="text-lg font-bold">{adjustment.productName}</div>
                        <div className="flex justify-between items-center pt-2 border-t mt-2">
                            <span className="text-sm text-muted-foreground">Stock Actual:</span>
                            <span className="text-sm font-bold text-primary">{formatQuantity(adjustment.currentStock)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-sm font-medium block">Cantidad a Ajustar</label>
                        <input
                            type="number"
                            value={adjustment.cantidadStr}
                            onChange={(e) => setAdjustment({ ...adjustment, cantidadStr: e.target.value })}
                            className="w-full p-4 border rounded-xl bg-background text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-center"
                            placeholder="Ej: 10 (entrada) o -10 (salida)"
                            />
                          <div className="space-y-1.5 mt-4">
                              <label className="text-sm font-medium block text-muted-foreground">Observaciones (Opcional)</label>
                              <textarea
                                  value={adjustment.observaciones}
                                  onChange={(e) => setAdjustment({ ...adjustment, observaciones: e.target.value })}
                                  className="w-full p-3 border rounded-lg bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none min-h-[80px]"
                                  placeholder="Ej: Conteo físico, mercadería dañada..."
                              />
                          </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Use números <strong>positivos</strong> para entradas y <strong>negativos</strong> para salidas.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-3 border rounded-xl bg-background flex items-center gap-3 ${!cantidad ? 'opacity-60' : ''}`}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                !cantidad ? 'bg-muted text-muted-foreground' : 
                                cantidad > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                                <ArrowUpRight className={`w-4 h-4 ${cantidad < 0 ? 'rotate-90' : ''}`} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Nuevo Stock</span>
                                <span className={`text-sm font-bold ${
                                    !cantidad ? 'text-foreground' : 
                                    cantidad > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                    {formatQuantity(Number(adjustment.currentStock) + cantidad)}
                                </span>
                            </div>
                        </div>
                        <div className="p-3 border rounded-xl bg-background flex items-center gap-3 opacity-60">
                            <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground flex items-center justify-center">
                                <History className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Movimiento</span>
                                <span className="text-sm font-bold truncate">Ajuste Manual</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border/50">
                        <button type="button" onClick={() => setIsAdjusting(false)} className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
                            <X className="w-4 h-4" /> Descartar
                        </button>
                        <button 
                            type="button" 
                            onClick={() => adjustMutation.mutate({ id: adjustment.id, cantidad, observaciones: adjustment.observaciones })}
                            disabled={!cantidad || cantidad === 0}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" /> Confirmar Ajuste
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal 
                isOpen={isEditingLimits} 
                onClose={() => setIsEditingLimits(false)} 
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Settings2 className="w-6 h-6 text-primary/80" />
                        Editar Límites de Stock
                    </span>
                }
            >
                <div className="space-y-6">
                    <div className="p-4 bg-muted/50 rounded-xl space-y-2 border">
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Producto Seleccionado</div>
                        <div className="text-lg font-bold">{limits.productName}</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground block">Stock Mínimo</label>
                            <input
                                type="number"
                                min="0"
                                value={limits.stockMinimo}
                                onChange={(e) => setLimits({ ...limits, stockMinimo: Number(e.target.value) })}
                                className="w-full p-3 border rounded-xl bg-background text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                            <p className="text-xs text-muted-foreground">Dispara alerta de Stock Bajo</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground block">Stock Máximo</label>
                            <input
                                type="number"
                                min="0"
                                value={limits.stockMaximo}
                                onChange={(e) => setLimits({ ...limits, stockMaximo: Number(e.target.value) })}
                                className="w-full p-3 border rounded-xl bg-background text-lg font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border/50">
                        <button type="button" onClick={() => setIsEditingLimits(false)} className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer">
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button 
                            type="button" 
                            onClick={() => limitsMutation.mutate({ id: limits.id, stockMinimo: limits.stockMinimo, stockMaximo: limits.stockMaximo })}
                            disabled={limitsMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            <Check className="w-4 h-4" /> {limitsMutation.isPending ? 'Guardando...' : 'Guardar Límites'}
                        </button>
                    </div>
                </div>
            </Modal>

        </div>
    );
};

export default InventarioPage;
