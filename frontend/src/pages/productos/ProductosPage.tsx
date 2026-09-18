import { formatCurrency } from '../../utils/currencyUtils';
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '../../api/productService';
import type { Producto } from '../../api/productService';
import { getFileUrl } from '../../api/apiClient';
import { categoryService } from '../../api/categoryService';
import { marcaService } from '../../api/marcaService';
import { grupoService } from '../../api/grupoService';
import { 
    Search, Filter, Plus, Pencil, Trash2, Package, 
    X, Save, AlignLeft, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, ImageIcon, Barcode, DollarSign, Scale, Calendar
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { format } from 'date-fns';

const ProductosPage: React.FC = () => {
    const queryClient = useQueryClient();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentProduct, setCurrentProduct] = useState<Partial<Producto>>({});
    
    // Pagination and Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMarca, setFilterMarca] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterGrupo, setFilterGrupo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: products, isLoading } = useQuery({
        queryKey: ['products'],
        queryFn: () => productService.getAll(),
    });

    
    const { data: marcas } = useQuery({ queryKey: ['marcas'], queryFn: marcaService.getAll });
    const { data: grupos } = useQuery({ queryKey: ['grupos'], queryFn: grupoService.getAll });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: categoryService.getAll,
    });

    const formatFechaCompra = (fecha?: string | Date) => {
        if (!fecha) return 'Sin compras';
        try {
            const str = typeof fecha === 'string' ? (fecha.includes('T') ? fecha : `${fecha}T00:00:00`) : fecha;
            return format(new Date(str), 'dd/MM/yyyy');
        } catch {
            return 'Sin compras';
        }
    };

    const exportColumns = [
        { header: 'Código', dataKey: 'codigo' },
        { header: 'Nombre', dataKey: 'nombre' },
        { header: 'Marca', dataKey: 'marcaNombre' },
        { header: 'Categoría', dataKey: 'categoriaNombre' },
        { header: 'Grupo', dataKey: 'grupoNombre' },
        { header: 'Precio Compra', dataKey: 'precioCompra' },
        { header: 'Última Compra', dataKey: 'fechaUltimaCompraFormatted' },
        { header: 'Precio Venta', dataKey: 'precioVenta' },
        { header: 'Estado', dataKey: 'activo' }
    ];

    const excelColumns = [
        { header: 'ID', dataKey: 'id' },
        ...exportColumns
    ];

    // Format data for exports
    const getFormattedData = () => {
        return filteredProducts.map(p => ({
            ...p,
            marcaNombre: p.marca?.nombre || 'Sin marca',
            categoriaNombre: p.categoria?.nombre || 'Sin categoría',
            grupoNombre: p.grupo?.nombre || 'Sin grupo',
            fechaUltimaCompraFormatted: formatFechaCompra(p.fechaUltimaCompra)
        }));
    };

    const getFiltersText = () => {
        const texts: string[] = [];
        if (filterMarca) {
            const m = marcas?.find(m => m.id === Number(filterMarca));
            if (m) texts.push(`Marca: ${m.nombre}`);
        }
        if (filterCategoria) {
            const c = categories?.find(c => c.id === Number(filterCategoria));
            if (c) texts.push(`Categoría: ${c.nombre}`);
        }
        if (filterGrupo) {
            const g = grupos?.find(g => g.id === Number(filterGrupo));
            if (g) texts.push(`Grupo: ${g.nombre}`);
        }
        if (searchTerm.trim()) {
            texts.push(`Búsqueda: "${searchTerm.trim()}"`);
        }
        return texts.length > 0 ? texts.join(' | ') : 'Todos los productos';
    };

    const handlePrint = () => {
        if (!products) return;
        printData('Reporte de Productos', exportColumns, getFormattedData(), getFiltersText());
    };

    const handleExportPDF = () => {
        if (!products) return;
        exportToPDF('Reporte de Productos', exportColumns, getFormattedData(), 'productos_reporte', getFiltersText());
    };

    const handleExportExcel = () => {
        if (!products) return;
        exportToExcel(excelColumns, getFormattedData(), 'productos_reporte');
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const res = await productService.uploadImage(file);
            if ((res as any).error) {
                toast.error((res as any).message || 'Error al subir la imagen');
            } else {
                setCurrentProduct({ ...currentProduct, imagen: res.url });
                toast.success('Imagen subida con éxito');
            }
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    const createMutation = useMutation({
        mutationFn: productService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsEditing(false);
            setCurrentProduct({});
            toast.success('Producto creado con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al crear el producto');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Producto) => productService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setIsEditing(false);
            setCurrentProduct({});
        },
        onError: () => {
            toast.error('Ocurrió un error al actualizar el producto');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: productService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            toast.error('Producto desactivado');
        },
        onError: () => {
            toast.error('Ocurrió un error al desactivar el producto');
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const { marca, categoria, grupo, ...safeData } = currentProduct as any;
        safeData.imagen = currentProduct.imagen || null;
        safeData.precioCompra = currentProduct.precioCompra !== undefined && currentProduct.precioCompra !== null && !isNaN(Number(currentProduct.precioCompra))
            ? Number(currentProduct.precioCompra)
            : 0;

        if (currentProduct.id) {
            updateMutation.mutate(safeData as Producto, {
                onSuccess: () => toast.success('Producto actualizado con éxito')
            });
        } else {
            createMutation.mutate(safeData);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const handleDelete = (id: number) => {
        setDeleteConfirmId(id);
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    // Filter and Paginate Data
    const filteredProducts = useMemo(() => {
        if (!products) return [];
        const filtered = products.filter(p => {
            const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.codigo.toLowerCase().includes(searchTerm.toLowerCase()) || (p.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchMarca = filterMarca ? p.marcaId === Number(filterMarca) : true;
            const matchCategoria = filterCategoria ? p.categoriaId === Number(filterCategoria) : true;
            const matchGrupo = filterGrupo ? p.grupoId === Number(filterGrupo) : true;
            return matchSearch && matchMarca && matchCategoria && matchGrupo;
        });

        return filtered.sort((a, b) => {
            const marcaA = a.marca?.nombre || '';
            const marcaB = b.marca?.nombre || '';
            if (marcaA !== marcaB) return marcaA.localeCompare(marcaB);

            const catA = a.categoria?.nombre || '';
            const catB = b.categoria?.nombre || '';
            if (catA !== catB) return catA.localeCompare(catB);

            const gruA = a.grupo?.nombre || '';
            const gruB = b.grupo?.nombre || '';
            if (gruA !== gruB) return gruA.localeCompare(gruB);

            return a.nombre.localeCompare(b.nombre);
        });
    }, [products, searchTerm, filterMarca, filterCategoria, filterGrupo]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    
    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage]);

    // Reset page to 1 when searching
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterMarca, filterCategoria, filterGrupo]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando productos...</div>;

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Package className="w-8 h-8 text-primary/80" />
                        Productos
                    </h1>
                    <p className="text-muted-foreground italic">Administra el catálogo de ítems, precios y categorías.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Imprimir">
                            <Printer className="w-4 h-4 text-muted-foreground" /> <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Exportar a PDF">
                            <FileText className="w-4 h-4 text-red-500" /> <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm cursor-pointer" title="Exportar a Excel">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>

                    <button
                        onClick={() => { setIsEditing(true); setCurrentProduct({}); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Producto
                    </button>
                </div>
            </div>

            {/* Search Bar & Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center">
                <div className="bg-card p-2 border rounded-lg shadow-sm flex items-center gap-2 flex-1 min-w-[250px] max-w-md">
                    <Search className="w-5 h-5 text-muted-foreground ml-1" />
                    <input 
                        type="text" 
                        placeholder="Buscar productos..." 
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
                
                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select 
                        className="bg-transparent border-none outline-none font-medium cursor-pointer" 
                        value={filterMarca} 
                        onChange={(e) => setFilterMarca(e.target.value)}
                    >
                        <option value="" className="bg-background text-foreground">Todas las Marcas</option>
                        {marcas?.map(m => <option key={m.id} value={m.id} className="bg-background text-foreground">{m.nombre}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select 
                        className="bg-transparent border-none outline-none font-medium cursor-pointer" 
                        value={filterCategoria} 
                        onChange={(e) => setFilterCategoria(e.target.value)}
                    >
                        <option value="" className="bg-background text-foreground">Todas las Categorías</option>
                        {categories?.map(c => <option key={c.id} value={c.id} className="bg-background text-foreground">{c.nombre}</option>)}
                    </select>
                </div>

                <div className="flex items-center gap-2 bg-card border rounded-lg px-3 py-2 shadow-sm text-sm">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <select 
                        className="bg-transparent border-none outline-none font-medium cursor-pointer" 
                        value={filterGrupo} 
                        onChange={(e) => setFilterGrupo(e.target.value)}
                    >
                        <option value="" className="bg-background text-foreground">Todos los Grupos</option>
                        {grupos?.map(g => <option key={g.id} value={g.id} className="bg-background text-foreground">{g.nombre}</option>)}
                    </select>
                </div>

                {(filterMarca || filterCategoria || filterGrupo || searchTerm) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFilterMarca('');
                            setFilterCategoria('');
                            setFilterGrupo('');
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

            {/* Modal Form */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <Package className="w-6 h-6 text-primary/80" />
                        {currentProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
                    </span>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1.5 py-1 custom-scrollbar">
                    <div className="space-y-4">
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Código <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="SKU..."
                                        value={currentProduct.codigo || ''}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, codigo: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Marca</label>
                                <select
                                    value={currentProduct.marcaId || ''}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, marcaId: parseInt(e.target.value), categoriaId: undefined, grupoId: undefined })}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {marcas?.map((m) => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Categoría</label>
                                <select
                                    value={currentProduct.categoriaId || ''}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, categoriaId: parseInt(e.target.value), grupoId: undefined })}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {categories?.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Grupo</label>
                                <select
                                    value={currentProduct.grupoId || ''}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, grupoId: parseInt(e.target.value) })}
                                    className="w-full p-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer transition-all text-sm"
                                >
                                    <option value="">Seleccionar...</option>
                                    {grupos?.map((grp) => (
                                        <option key={grp.id} value={grp.id}>{grp.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nombre <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Nombre descriptivo"
                                    value={currentProduct.nombre || ''}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, nombre: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Precio de Compra</label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentProduct.precioCompra !== undefined && currentProduct.precioCompra !== null ? currentProduct.precioCompra : ''}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, precioCompra: e.target.value === '' ? undefined : parseFloat(e.target.value) })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Precio de Venta <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary font-bold" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={currentProduct.precioVenta || ''}
                                        onChange={(e) => setCurrentProduct({ ...currentProduct, precioVenta: parseFloat(e.target.value) })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all font-semibold text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Unidad de Medida <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="unid, kg, lt..."
                                    value={currentProduct.unidadMedida || ''}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, unidadMedida: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Descripción</label>
                            <div className="relative group">
                                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <textarea
                                    placeholder="Opcional..."
                                    value={currentProduct.descripcion || ''}
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, descripcion: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[80px] resize-none text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Imagen del Producto</label>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/*"
                                className="hidden"
                            />

                            <div className="flex items-center gap-4">
                                {currentProduct.imagen ? (
                                    <div className="relative w-20 h-20 rounded-lg border bg-muted overflow-hidden group">
                                        <img
                                            src={getFileUrl(currentProduct.imagen)}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setCurrentProduct({ ...currentProduct, imagen: null as any })}
                                            className="absolute inset-0 bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                                        >
                                            Quitar
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploading}
                                        className="w-20 h-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-all text-muted-foreground"
                                    >
                                        <ImageIcon className="w-5 h-5" />
                                        <span className="text-[10px]">{isUploading ? 'Subiendo...' : 'Subir'}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Estado</label>
                                <p className="text-[11px] text-muted-foreground">Activar o desactivar producto</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={currentProduct.activo !== false} // default true if undefined
                                    onChange={(e) => setCurrentProduct({ ...currentProduct, activo: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 py-3">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            <Save className="w-4 h-4" /> {currentProduct.id ? 'Guardar Cambios' : 'Crear Producto'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                title="Desactivar Producto"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Este producto pasará a estado Inactivo</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">Este ítem dejará de estar disponible para la venta, pero no se borrará del historial.</p>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setDeleteConfirmId(null)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                        >
                            Sí, Desactivar
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Table */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16 text-center">Foto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Código / Nombre</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Marca</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Categoría</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Grupo</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">P. Compra</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">P. Venta</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                                        No se encontraron productos.
                                    </td>
                                </tr>
                            ) : paginatedProducts.map((prod, index) => (
                                <tr key={prod.id} className="hover:bg-accent/30 transition-colors group">
                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4">
                                        <div className="w-10 h-10 rounded-lg border bg-background overflow-hidden flex items-center justify-center">
                                            {prod.imagen ? (
                                                 <img
                                                     src={getFileUrl(prod.imagen)}
                                                     alt={prod.nombre}
                                                     className="w-full h-full object-cover"
                                                 />
                                             ) : (
                                                 <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                                             )}
                                         </div>
                                     </td>
                                     <td className="p-4">
                                         <div className="flex flex-col">
                                             <span className="text-xs font-mono text-muted-foreground">{prod.codigo}</span>
                                             <span className="text-sm font-medium">{prod.nombre}</span>
                                         </div>
                                     </td>
                                     <td className="p-4 text-sm">
                                         <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-[10px] font-semibold tracking-wide">
                                             {prod.marca?.nombre || 'Sin marca'}
                                         </span>
                                     </td>
                                     <td className="p-4 text-sm">
                                         <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-[10px] font-semibold tracking-wide">
                                             {prod.categoria?.nombre || 'Sin categoría'}
                                         </span>
                                     </td>
                                     <td className="p-4 text-sm">
                                         <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-[10px] font-semibold tracking-wide">
                                             {prod.grupo?.nombre || 'Sin grupo'}
                                         </span>
                                     </td>
                                     <td className="p-4 text-sm">
                                         <div className="flex flex-col">
                                             <span className="font-semibold text-foreground">
                                                 {formatCurrency(prod.precioCompra || 0)}
                                             </span>
                                             <span className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5" title="Fecha de última compra">
                                                 <Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                                                 {formatFechaCompra(prod.fechaUltimaCompra)}
                                             </span>
                                         </div>
                                     </td>
                                     <td className="p-4 text-sm font-bold text-primary">
                                         {formatCurrency(prod.precioVenta || 0)}
                                     </td>
                                    <td className="p-4 text-sm">
                                        {prod.activo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest">
                                                Activo
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest">
                                                Inactivo
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex justify-end gap-2 transition-opacity">
                                            <button
                                                onClick={() => { 
                                                    setCurrentProduct({
                                                        ...prod,
                                                        marcaId: prod.marca?.id,
                                                        categoriaId: prod.categoria?.id,
                                                        grupoId: prod.grupo?.id
                                                    }); 
                                                    setIsEditing(true); 
                                                }}
                                                title="Editar"
                                                className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {prod.activo ? (
                                                <button
                                                    onClick={() => handleDelete(prod.id)}
                                                    title="Desactivar"
                                                    className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateMutation.mutate({ ...prod, activo: true } as Producto, {
                                                        onSuccess: () => toast.success('Producto activado con éxito')
                                                    })}
                                                    title="Activar"
                                                    className="p-2 text-green-600 dark:text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de {filteredProducts.length}
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
        </div>
    );
};

export default ProductosPage;
