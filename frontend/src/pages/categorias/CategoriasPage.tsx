import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { categoryService } from '../../api/categoryService';
import type { Categoria } from '../../api/categoryService';
import { 
    Search, Plus, Pencil, Trash2, FolderTree, 
    X, Save, AlignLeft, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, ArrowLeft
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';

const CategoriasPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<Categoria>>({});
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: categoriasList, isLoading } = useQuery({
        queryKey: ['categoriasList'],
        queryFn: categoryService.getAll,
    });

    const exportColumns = [
        { header: 'Nombre', dataKey: 'nombre' },
        { header: 'Descripción', dataKey: 'descripcion' },
        { header: 'Estado', dataKey: 'activo' }
    ];

    const handlePrint = () => {
        if (!categoriasList) return;
        printData('Reporte de Categorías', exportColumns, filteredCategories);
    };

    const handleExportPDF = () => {
        if (!categoriasList) return;
        exportToPDF('Reporte de Categorías', exportColumns, filteredCategories, 'categorias_reporte');
    };

    const handleExportExcel = () => {
        if (!categoriasList) return;
        exportToExcel(exportColumns, filteredCategories, 'categorias_reporte');
    };

    const createMutation = useMutation({
        mutationFn: categoryService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categoriasList'] });
            setIsEditing(false);
            setCurrentCategory({});
            toast.success('Categoría creada con éxito');
        },
        onError: () => toast.error('Ocurrió un error al crear la categoría')
    });

    const updateMutation = useMutation({
        mutationFn: (data: Categoria) => categoryService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categoriasList'] });
            setIsEditing(false);
            setCurrentCategory({});
        },
        onError: () => toast.error('Ocurrió un error al actualizar la categoría')
    });

    const deleteMutation = useMutation({
        mutationFn: categoryService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categoriasList'] });
            toast.error('Categoría desactivada');
        },
        onError: () => toast.error('Ocurrió un error al desactivar la categoría')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const { productos, marca, ...safeData } = currentCategory as any;
        if (currentCategory.id) {
            updateMutation.mutate(safeData as Categoria, {
                onSuccess: () => toast.success('Categoría actualizada con éxito')
            });
        } else {
            createMutation.mutate(safeData);
        }
    };

    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const handleDelete = (id: number) => setDeleteConfirmId(id);
    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const filteredCategories = useMemo(() => {
        if (!categoriasList) return [];
        return categoriasList.filter(c => 
            c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [categoriasList, searchTerm]);

    const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
    const paginatedCategories = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredCategories.slice(start, start + itemsPerPage);
    }, [filteredCategories, currentPage]);

    React.useEffect(() => setCurrentPage(1), [searchTerm]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando categorías...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link to="/configuracion" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Configuración
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <FolderTree className="w-8 h-8 text-primary/80" />
                        Categorías
                    </h1>
                    <p className="text-muted-foreground italic">Gestiona las agrupaciones de tus productos.</p>
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
                        onClick={() => { setIsEditing(true); setCurrentCategory({}); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nueva Categoría
                    </button>
                </div>
            </div>

            <div className="bg-card p-3 border rounded-lg shadow-sm flex items-center gap-2 max-w-md">
                <Search className="w-5 h-5 text-muted-foreground ml-1" />
                <input 
                    type="text" 
                    placeholder="Buscar categorías..." 
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

            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={
                    <span className="flex items-center gap-2 text-primary">
                        <FolderTree className="w-6 h-6 text-primary/80" />
                        {currentCategory.id ? 'Editar Categoría' : 'Nueva Categoría'}
                    </span>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nombre <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej. Bebidas, Snacks..."
                                    value={currentCategory.nombre || ''}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, nombre: e.target.value })}
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
                                    value={currentCategory.descripcion || ''}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, descripcion: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[100px] resize-none hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Estado</label>
                                <p className="text-[11px] text-muted-foreground">Activar o desactivar categoría</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={currentCategory.activo !== false}
                                    onChange={(e) => setCurrentCategory({ ...currentCategory, activo: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border/50">
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
                            <Save className="w-4 h-4" /> {currentCategory.id ? 'Guardar Cambios' : 'Crear Categoría'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                title="Desactivar Categoría"
            >
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Esta categoría pasará a estado Inactivo</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">Esta categoría dejará de estar disponible, pero no se borrará para preservar el historial.</p>
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
                            className="flex items-center gap-2 px-5 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                        >
                            Sí, Desactivar
                        </button>
                    </div>
                </div>
            </Modal>

            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Nombre</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Descripción</th>
                                
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedCategories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No se encontraron categorías.
                                    </td>
                                </tr>
                            ) : paginatedCategories.map((cat, index) => (
                                <tr key={cat.id} className="hover:bg-accent/30 transition-colors group">
                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4 text-sm font-medium">{cat.nombre}</td>
                                    <td className="p-4 text-sm text-muted-foreground">{cat.descripcion || <span className="italic opacity-50">Sin descripción</span>}</td>
                                    
                                    <td className="p-4 text-sm">
                                        {cat.activo ? (
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
                                                onClick={() => { setCurrentCategory(cat); setIsEditing(true); }}
                                                title="Editar"
                                                className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {cat.activo ? (
                                                <button
                                                    onClick={() => handleDelete(cat.id)}
                                                    title="Desactivar"
                                                    className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => updateMutation.mutate({ ...cat, activo: true } as Categoria, {
                                                        onSuccess: () => toast.success('Categoría activada con éxito')
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

                {totalPages > 1 && (
                    <div className="flex items-center justify-between p-4 border-t bg-muted/20">
                        <span className="text-sm text-muted-foreground">
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCategories.length)} de {filteredCategories.length}
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

export default CategoriasPage;
