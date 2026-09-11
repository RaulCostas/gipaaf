import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierService } from '../../api/supplierService';
import type { Proveedor } from '../../api/supplierService';
import Modal from '../../components/ui/Modal';
import { 
    Search, Plus, Pencil, Trash2, Building2, 
    X, Save, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, User, Phone, MapPin, Mail, FileBadge, Tag, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';

const ProveedoresPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentSupplier, setCurrentSupplier] = useState<Partial<Proveedor>>({
        persona: { nombres: '', apellidos: '', ci: '', telefono: '', direccion: '', email: '', activo: true } as any,
        empresa: '',
        ruc: '',
        marca: '',
        pais: '',
        observaciones: ''
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers'],
        queryFn: () => supplierService.getAll(),
    });

    const exportColumns = [
        { header: 'Empresa', dataKey: 'empresa' },
        { header: 'Marca', dataKey: 'marca' },
        { header: 'País', dataKey: 'pais' },
        { header: 'RUC/NIT', dataKey: 'ruc' },
        { header: 'Contacto', dataKey: 'contacto' },
        { header: 'Celular', dataKey: 'telefono' },
        { header: 'Estado', dataKey: 'activo' }
    ];

    const excelColumns = [
        { header: 'ID', dataKey: 'id' },
        ...exportColumns
    ];

    const getFormattedData = () => {
        return filteredSuppliers.map(s => ({
            id: s.id,
            empresa: s.empresa || '-',
            ruc: s.ruc || '-',
            contacto: `${s.persona?.nombres || ''} ${s.persona?.apellidos || ''}`.trim() || '-',
            telefono: s.persona?.telefono || '-',
            activo: s.activo
        }));
    };

    const handlePrint = () => {
        if (!suppliers) return;
        printData('Reporte de Proveedores', exportColumns, getFormattedData());
    };

    const handleExportPDF = () => {
        if (!suppliers) return;
        exportToPDF('Reporte de Proveedores', exportColumns, getFormattedData(), 'proveedores_reporte');
    };

    const handleExportExcel = () => {
        if (!suppliers) return;
        exportToExcel(excelColumns, getFormattedData(), 'proveedores_reporte');
    };

    const createMutation = useMutation({
        mutationFn: supplierService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setIsEditing(false);
            resetForm();
            toast.success('Proveedor creado con éxito');
        },
        onError: () => toast.error('Error al crear proveedor')
    });

    const updateMutation = useMutation({
        mutationFn: (data: Proveedor) => supplierService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setIsEditing(false);
            resetForm();
        },
        onError: () => toast.error('Error al actualizar proveedor')
    });

    const deleteMutation = useMutation({
        mutationFn: supplierService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.error('Proveedor desactivado');
        },
        onError: () => toast.error('Error al desactivar proveedor')
    });

    const resetForm = () => {
        setCurrentSupplier({
            persona: { nombres: '', apellidos: '', ci: '', telefono: '', direccion: '', email: '', activo: true } as any,
            empresa: '',
            ruc: '',
            marca: '',
            pais: '',
            observaciones: '',
            activo: true
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentSupplier.id) {
            updateMutation.mutate(currentSupplier as Proveedor, {
                onSuccess: () => toast.success('Proveedor actualizado con éxito')
            });
        } else {
            createMutation.mutate(currentSupplier);
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const filteredSuppliers = useMemo(() => {
        if (!suppliers) return [];
        const filtered = suppliers.filter(s => 
            s.empresa?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.ruc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.persona?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filtered.sort((a, b) => (a.empresa || '').localeCompare(b.empresa || ''));
    }, [suppliers, searchTerm]);

    const totalPages = Math.ceil(filteredSuppliers.length / itemsPerPage) || 1;
    const paginatedSuppliers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSuppliers.slice(start, start + itemsPerPage);
    }, [filteredSuppliers, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando proveedores...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-primary/80" />
                        Proveedores
                    </h1>
                    <p className="text-muted-foreground italic">Administra tus contactos de suministro y empresas de proveedores.</p>
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
                        onClick={() => { resetForm(); setIsEditing(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Proveedor
                    </button>
                </div>
            </div>

            <div className="bg-card p-3 border rounded-lg shadow-sm flex items-center gap-2 max-w-md">
                <Search className="w-5 h-5 text-muted-foreground ml-1" />
                <input 
                    type="text" 
                    placeholder="Buscar por empresa, contacto o RUC..." 
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

            <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title={
                    <span className="flex items-center gap-2 text-primary">
                        <Building2 className="w-6 h-6 text-primary/80" />
                        {currentSupplier.id ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                    </span>
                }>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1.5 py-1 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nombre de la Empresa <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: Distribuidora Automotriz S.A."
                                    value={currentSupplier.empresa || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, empresa: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">RUC / NIT Empresa</label>
                            <div className="relative group">
                                <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: 1029384756"
                                    value={currentSupplier.ruc || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, ruc: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>

                        <div className="pt-4 mt-2 border-t">
                            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                                <User className="w-4 h-4" /> Datos de Contacto
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Nombres <span className="text-destructive">*</span></label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Ej: Carlos"
                                            value={currentSupplier.persona?.nombres || ''}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, persona: { ...currentSupplier.persona!, nombres: e.target.value }})}
                                            className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-foreground">Apellidos <span className="text-destructive">*</span></label>
                                    <div className="relative group">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Ej: Mendoza Silva"
                                            value={currentSupplier.persona?.apellidos || ''}
                                            onChange={(e) => setCurrentSupplier({ ...currentSupplier, persona: { ...currentSupplier.persona!, apellidos: e.target.value }})}
                                            className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Celular</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Ej: 70012345"
                                        value={currentSupplier.persona?.telefono || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, persona: { ...currentSupplier.persona!, telefono: e.target.value }})}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Email de Contacto</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="Ej: proveedor@gmail.com"
                                        value={currentSupplier.persona?.email || ''}
                                        onChange={(e) => setCurrentSupplier({ ...currentSupplier, persona: { ...currentSupplier.persona!, email: e.target.value }})}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Dirección</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: Av. Principal #789, Zona Industrial"
                                    value={currentSupplier.persona?.direccion || ''}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, persona: { ...currentSupplier.persona!, direccion: e.target.value }})}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Marca</label>
                            <div className="relative group">
                                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: Samsung"
                                    value={currentSupplier.marca}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, marca: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">País</label>
                            <div className="relative group">
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: China"
                                    value={currentSupplier.pais}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, pais: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Estado</label>
                                <p className="text-[11px] text-muted-foreground">Activar o desactivar proveedor</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={currentSupplier.activo !== false}
                                    onChange={(e) => setCurrentSupplier({ ...currentSupplier, activo: e.target.checked })}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-border/50 sticky bottom-0 bg-background/95 backdrop-blur-sm z-10 py-3">
                        <button type="button" onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button type="submit" className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
                            <Save className="w-4 h-4" /> {currentSupplier.id ? 'Guardar Cambios' : 'Crear Proveedor'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="Desactivar Proveedor">
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Este proveedor pasará a estado Inactivo</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">Dejará de aparecer en listas de selección y reportes futuros, pero su historial se mantendrá intacto.</p>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button type="button" onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 border rounded-lg text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
                        <button type="button" onClick={confirmDelete} className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm">Sí, Desactivar</button>
                    </div>
                </div>
            </Modal>

            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                        <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-16">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Empresa / RUC</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Marca / País</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Contacto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Comunicación</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedSuppliers.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No se encontraron proveedores.</td></tr>
                            ) : paginatedSuppliers.map((sup, index) => (
                                <tr key={sup.id} className="hover:bg-accent/30 transition-colors group">
                                    <td className="p-4 text-sm font-mono text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{sup.empresa || 'Empresa no registrada'}</span>
                                            <span className="text-xs font-mono text-muted-foreground">RUC: {sup.ruc || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold">{sup.marca || '---'}</span>
                                            <span className="text-xs text-muted-foreground">{sup.pais || '---'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{sup.persona.nombres} {sup.persona.apellidos}</span>
                                            <span className="text-xs text-muted-foreground">CI: {sup.persona.ci || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Mail className="w-3 h-3" /> {sup.persona.email || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="w-3 h-3" /> {sup.persona.telefono || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {sup.activo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest">Activo</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex justify-end gap-2 transition-opacity">
                                            <button onClick={() => { setCurrentSupplier({ ...sup }); setIsEditing(true); }} title="Editar" className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {sup.activo ? (
                                                <button onClick={() => setDeleteConfirmId(sup.id)} title="Desactivar" className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button onClick={() => updateMutation.mutate({ ...sup, activo: true } as Proveedor, { onSuccess: () => toast.success('Proveedor activado con éxito') })} title="Activar" className="p-2 text-green-600 dark:text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all">
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSuppliers.length)} de {filteredSuppliers.length}
                        </span>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
                            <span className="text-sm font-medium px-2">Página {currentPage} de {totalPages}</span>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 border rounded-lg hover:bg-accent disabled:opacity-50 transition-colors"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProveedoresPage;
