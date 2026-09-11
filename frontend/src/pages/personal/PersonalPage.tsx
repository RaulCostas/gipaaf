import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { personalService } from '../../api/personalService';
import { sucursalService } from '../../api/sucursalService';
import { API_BASE_URL } from '../../api/apiClient';
import type { Personal } from '../../api/personalService';
import { 
    Search, Plus, Pencil, Trash2, Users, User,
    X, Save, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, Briefcase, Phone, CreditCard, Building2,
    MapPin, Calendar, Upload, Eye, AlertCircle, RefreshCw, ZoomIn
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { useFilters } from '../../context/FilterContext';

const formatFecha = (fecha?: string | Date | null) => {
    if (!fecha) return '-';
    try {
        const str = typeof fecha === 'string' ? fecha.split('T')[0] : fecha.toISOString().split('T')[0];
        const [y, m, d] = str.split('-');
        return `${d}/${m}/${y}`;
    } catch {
        return String(fecha);
    }
};

const getImageUrl = (url?: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const PersonalPage: React.FC = () => {
    const { selectedCiudad, selectedSucursal } = useFilters();
    const queryClient = useQueryClient();
    
    // Modal states
    const [isEditing, setIsEditing] = useState(false);
    const [currentPersonal, setCurrentPersonal] = useState<Partial<Personal>>({ 
        cargo: 'VENDEDOR', 
        activo: true 
    });
    
    // Dar de Baja modal state
    const [bajaModalPersonal, setBajaModalPersonal] = useState<Personal | null>(null);
    const [bajaFecha, setBajaFecha] = useState<string>('');
    const [bajaMotivo, setBajaMotivo] = useState<string>('');

    // View Details modal state
    const [viewPersonal, setViewPersonal] = useState<Personal | null>(null);

    // Image lightbox state
    const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

    // Upload states
    const [isUploadingAnverso, setIsUploadingAnverso] = useState(false);
    const [isUploadingReverso, setIsUploadingReverso] = useState(false);
    const fileInputAnversoRef = useRef<HTMLInputElement>(null);
    const fileInputReversoRef = useRef<HTMLInputElement>(null);
    
    // Pagination and Search states
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const { data: personalList, isLoading: loadingPersonal } = useQuery({
        queryKey: ['personal'],
        queryFn: personalService.getAll,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const exportColumns = [
        { header: 'Nombres', dataKey: 'nombres' },
        { header: 'Apellidos', dataKey: 'apellidos' },
        { header: 'CI', dataKey: 'ci' },
        { header: 'Celular', dataKey: 'telefono' },
        { header: 'Dirección', dataKey: 'direccion' },
        { header: 'Cargo', dataKey: 'cargo' },
        { header: 'Sucursal', dataKey: 'sucursalNombre' },
        { header: 'F. Ingreso', dataKey: 'fechaIngresoFormatted' },
        { header: 'Estado', dataKey: 'activo' },
        { header: 'F. Baja', dataKey: 'fechaBajaFormatted' },
        { header: 'Motivo Baja', dataKey: 'motivoBaja' }
    ];

    const excelColumns = [
        { header: 'ID', dataKey: 'id' },
        ...exportColumns
    ];

    const filteredPersonal = useMemo(() => {
        if (!personalList) return [];
        let filtered = personalList;
        
        if (selectedCiudad) {
            filtered = filtered.filter(p => p.sucursal?.ciudad?.id === Number(selectedCiudad));
        }

        if (selectedSucursal) {
            filtered = filtered.filter(p => p.sucursal?.id === Number(selectedSucursal));
        }
        
        return filtered.filter(p => 
            p.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.ci && p.ci.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.telefono && p.telefono.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (p.direccion && p.direccion.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [personalList, searchTerm, selectedCiudad, selectedSucursal]);

    const getFormattedData = () => {
        return filteredPersonal.map(p => ({
            ...p,
            sucursalNombre: p.sucursal?.nombre || 'Sin sucursal',
            fechaIngresoFormatted: formatFecha(p.fechaIngreso),
            fechaBajaFormatted: formatFecha(p.fechaBaja),
            activo: p.activo ? 'Activo' : 'Inactivo',
            direccion: p.direccion || '-',
            motivoBaja: p.motivoBaja || '-'
        }));
    };

    const handlePrint = () => {
        if (!personalList) return;
        printData('Reporte de Personal', exportColumns, getFormattedData());
    };

    const handleExportPDF = () => {
        if (!personalList) return;
        exportToPDF('Reporte de Personal', exportColumns, getFormattedData(), 'personal_reporte');
    };

    const handleExportExcel = () => {
        if (!personalList) return;
        exportToExcel(excelColumns, getFormattedData(), 'personal_reporte');
    };

    const createMutation = useMutation({
        mutationFn: personalService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personal'] });
            setIsEditing(false);
            resetForm();
            toast.success('Personal registrado con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al registrar el personal');
        }
    });

    const updateMutation = useMutation({
        mutationFn: (data: Personal) => personalService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personal'] });
            setIsEditing(false);
            resetForm();
            toast.success('Personal actualizado con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al actualizar el personal');
        }
    });

    const darDeBajaMutation = useMutation({
        mutationFn: ({ id, fechaBaja, motivoBaja }: { id: number; fechaBaja: string; motivoBaja: string }) => 
            personalService.darDeBaja(id, { fechaBaja, motivoBaja }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personal'] });
            setBajaModalPersonal(null);
            setBajaFecha('');
            setBajaMotivo('');
            toast.success('Personal dado de baja con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al procesar la baja del personal');
        }
    });

    const reactivarMutation = useMutation({
        mutationFn: (p: Personal) => personalService.update(p.id, { 
            ...p, 
            activo: true,
            fechaBaja: undefined,
            motivoBaja: undefined
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['personal'] });
            toast.success('Personal reactivado con éxito');
        },
        onError: () => {
            toast.error('Ocurrió un error al reactivar el personal');
        }
    });

    const resetForm = () => {
        setCurrentPersonal({ 
            cargo: 'VENDEDOR', 
            activo: true, 
            nombres: '', 
            apellidos: '', 
            ci: '', 
            telefono: '', 
            direccion: '', 
            fechaIngreso: new Date().toISOString().split('T')[0],
            carnetAnverso: undefined,
            carnetReverso: undefined
        });
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsEditing(true);
    };

    const handleOpenEdit = (p: Personal) => {
        setCurrentPersonal({
            ...p,
            fechaIngreso: p.fechaIngreso ? (typeof p.fechaIngreso === 'string' ? p.fechaIngreso.split('T')[0] : new Date(p.fechaIngreso).toISOString().split('T')[0]) : '',
            fechaBaja: p.fechaBaja ? (typeof p.fechaBaja === 'string' ? p.fechaBaja.split('T')[0] : new Date(p.fechaBaja).toISOString().split('T')[0]) : '',
        });
        setIsEditing(true);
    };

    const handleOpenBaja = (p: Personal) => {
        setBajaModalPersonal(p);
        setBajaFecha(new Date().toISOString().split('T')[0]);
        setBajaMotivo('');
    };

    const handleConfirmBaja = (e: React.FormEvent) => {
        e.preventDefault();
        if (!bajaModalPersonal) return;
        if (!bajaFecha) {
            toast.error('Ingrese la fecha de baja');
            return;
        }
        if (!bajaMotivo.trim()) {
            toast.error('Ingrese el motivo de la baja');
            return;
        }

        darDeBajaMutation.mutate({
            id: bajaModalPersonal.id,
            fechaBaja: bajaFecha,
            motivoBaja: bajaMotivo.trim()
        });
    };

    const handleFileUpload = async (type: 'anverso' | 'reverso', file: File) => {
        try {
            if (type === 'anverso') setIsUploadingAnverso(true);
            else setIsUploadingReverso(true);

            const res = await personalService.uploadImage(file);
            if (res.url) {
                setCurrentPersonal(prev => ({
                    ...prev,
                    [type === 'anverso' ? 'carnetAnverso' : 'carnetReverso']: res.url
                }));
                toast.success(`Fotografía de ${type === 'anverso' ? 'anverso' : 'reverso'} cargada`);
            }
        } catch (error) {
            toast.error('Error al subir la imagen del carnet');
        } finally {
            if (type === 'anverso') setIsUploadingAnverso(false);
            else setIsUploadingReverso(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitData = {
            ...currentPersonal,
            sucursal: currentPersonal.sucursal?.id ? { id: Number(currentPersonal.sucursal.id) } : null,
            fechaIngreso: currentPersonal.fechaIngreso || null,
            fechaBaja: currentPersonal.activo ? null : (currentPersonal.fechaBaja || null),
            motivoBaja: currentPersonal.activo ? null : (currentPersonal.motivoBaja || null)
        } as any;

        if (currentPersonal.id) {
            updateMutation.mutate(submitData as Personal);
        } else {
            createMutation.mutate(submitData as Personal);
        }
    };

    const totalPages = Math.ceil(filteredPersonal.length / itemsPerPage) || 1;
    
    const paginatedPersonal = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredPersonal.slice(start, start + itemsPerPage);
    }, [filteredPersonal, currentPage]);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCiudad, selectedSucursal]);

    if (loadingPersonal) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando personal...</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary/80" />
                        Personal de la Empresa
                    </h1>
                    <p className="text-muted-foreground italic">Gestiona a los empleados, vendedores y administrativos.</p>
                </div>
                <div className="flex items-center flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Imprimir">
                            <Printer className="w-4 h-4 text-muted-foreground" /> 
                            <span className="hidden sm:inline">Imprimir</span>
                        </button>
                        <button onClick={handleExportPDF} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a PDF">
                            <FileText className="w-4 h-4 text-red-500" /> 
                            <span className="hidden sm:inline">PDF</span>
                        </button>
                        <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-2 bg-card border rounded-lg text-sm font-medium hover:bg-accent transition-colors shadow-sm" title="Exportar a Excel">
                            <FileSpreadsheet className="w-4 h-4 text-green-600" /> 
                            <span className="hidden sm:inline">Excel</span>
                        </button>
                    </div>

                    <div className="hidden sm:block h-8 w-px bg-border mx-1"></div>

                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Personal
                    </button>
                </div>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-card p-3 border rounded-lg shadow-sm flex items-center gap-2 max-w-md">
                <Search className="w-5 h-5 text-muted-foreground ml-1" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, apellido, CI o dirección..." 
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

            {/* Modal: Crear / Editar Personal */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Users className="w-6 h-6 text-primary/80" />
                        {currentPersonal.id ? 'Editar Personal' : 'Registrar Personal'}
                    </span>
                }
            >
                <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                    <div className="space-y-4">
                        {/* Nombres & Apellidos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Nombres <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Ej: Juan Carlos"
                                        value={currentPersonal.nombres || ''}
                                        onChange={(e) => setCurrentPersonal({ ...currentPersonal, nombres: e.target.value })}
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
                                        placeholder="Ej: Pérez Mendoza"
                                        value={currentPersonal.apellidos || ''}
                                        onChange={(e) => setCurrentPersonal({ ...currentPersonal, apellidos: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* CI & Celular */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">C.I.</label>
                                <div className="relative group">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Ej: 5892341 LP"
                                        value={currentPersonal.ci || ''}
                                        onChange={(e) => setCurrentPersonal({ ...currentPersonal, ci: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Celular</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Ej: 71234567"
                                        value={currentPersonal.telefono || ''}
                                        onChange={(e) => setCurrentPersonal({ ...currentPersonal, telefono: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Dirección */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Dirección</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: Av. Heroínas #321, Zona Central"
                                    value={currentPersonal.direccion || ''}
                                    onChange={(e) => setCurrentPersonal({ ...currentPersonal, direccion: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>

                        {/* Cargo & Sucursal */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Cargo</label>
                                <div className="relative group">
                                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <select
                                        value={currentPersonal.cargo || 'VENDEDOR'}
                                        onChange={(e) => setCurrentPersonal({ ...currentPersonal, cargo: e.target.value as any })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-sm"
                                    >
                                        <option value="GERENTE">Gerente General</option>
                                        <option value="ADMINISTRATIVO">Administrativo</option>
                                        <option value="JEFE_VENTAS">Jefe de Ventas</option>
                                        <option value="VENDEDOR">Vendedor</option>
                                        <option value="RESPONSABLE_ALMACEN">Encargado de Inventario</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Sucursal Asignada</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <select
                                        value={currentPersonal.sucursal?.id || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const found = sucursales?.find(s => s.id === Number(val));
                                            setCurrentPersonal({ 
                                                ...currentPersonal, 
                                                sucursal: found ? { id: found.id, nombre: found.nombre } : undefined 
                                            });
                                        }}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-sm"
                                    >
                                        <option value="">-- Sin Sucursal Asignada --</option>
                                        {sucursales?.filter(s => s.activo !== false || s.id === currentPersonal.sucursal?.id).map(s => (
                                            <option key={s.id} value={s.id}>{s.nombre}{s.ciudad?.nombre ? ` - ${s.ciudad.nombre}` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Fecha de Ingreso */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Fecha de Ingreso</label>
                            <div className="relative group">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="date"
                                    value={currentPersonal.fechaIngreso || ''}
                                    onChange={(e) => setCurrentPersonal({ ...currentPersonal, fechaIngreso: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>

                        {/* Documentos: Carnet de Identidad Anverso y Reverso */}
                        <div className="p-4 border rounded-lg bg-muted/20 space-y-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                                <CreditCard className="w-4 h-4 text-primary" />
                                Carnet de Identidad (Fotografías)
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Anverso */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Carnet Anverso (Frente)</label>
                                    <input
                                        type="file"
                                        ref={fileInputAnversoRef}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('anverso', file);
                                        }}
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                    />
                                    {currentPersonal.carnetAnverso ? (
                                        <div className="relative border rounded-lg p-2 bg-background flex items-center gap-3 group">
                                            <img
                                                src={getImageUrl(currentPersonal.carnetAnverso)}
                                                alt="Carnet Anverso"
                                                className="w-14 h-14 object-cover rounded border bg-muted cursor-pointer"
                                                onClick={() => setPreviewImage({ 
                                                    url: getImageUrl(currentPersonal.carnetAnverso!), 
                                                    title: `Carnet Anverso - ${currentPersonal.nombres || 'Personal'}` 
                                                })}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">Anverso Cargado</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage({ 
                                                        url: getImageUrl(currentPersonal.carnetAnverso!), 
                                                        title: `Carnet Anverso - ${currentPersonal.nombres || 'Personal'}` 
                                                    })}
                                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                                >
                                                    <ZoomIn className="w-3 h-3" /> Ver imagen
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPersonal({ ...currentPersonal, carnetAnverso: undefined })}
                                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title="Quitar imagen"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputAnversoRef.current?.click()}
                                            disabled={isUploadingAnverso}
                                            className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 rounded-lg p-3 text-center transition-all bg-background/50 hover:bg-accent/40 flex flex-col items-center justify-center gap-1.5"
                                        >
                                            {isUploadingAnverso ? (
                                                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-muted-foreground" />
                                            )}
                                            <span className="text-xs font-medium text-foreground">
                                                {isUploadingAnverso ? 'Cargando...' : 'Subir Anverso (Frente)'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">JPG, PNG, PDF</span>
                                        </button>
                                    )}
                                </div>

                                {/* Reverso */}
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground">Carnet Reverso (Dorso)</label>
                                    <input
                                        type="file"
                                        ref={fileInputReversoRef}
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('reverso', file);
                                        }}
                                        accept="image/*,application/pdf"
                                        className="hidden"
                                    />
                                    {currentPersonal.carnetReverso ? (
                                        <div className="relative border rounded-lg p-2 bg-background flex items-center gap-3 group">
                                            <img
                                                src={getImageUrl(currentPersonal.carnetReverso)}
                                                alt="Carnet Reverso"
                                                className="w-14 h-14 object-cover rounded border bg-muted cursor-pointer"
                                                onClick={() => setPreviewImage({ 
                                                    url: getImageUrl(currentPersonal.carnetReverso!), 
                                                    title: `Carnet Reverso - ${currentPersonal.nombres || 'Personal'}` 
                                                })}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-foreground truncate">Reverso Cargado</p>
                                                <button
                                                    type="button"
                                                    onClick={() => setPreviewImage({ 
                                                        url: getImageUrl(currentPersonal.carnetReverso!), 
                                                        title: `Carnet Reverso - ${currentPersonal.nombres || 'Personal'}` 
                                                    })}
                                                    className="text-[11px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                                >
                                                    <ZoomIn className="w-3 h-3" /> Ver imagen
                                                </button>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setCurrentPersonal({ ...currentPersonal, carnetReverso: undefined })}
                                                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                                title="Quitar imagen"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => fileInputReversoRef.current?.click()}
                                            disabled={isUploadingReverso}
                                            className="w-full border-2 border-dashed border-muted-foreground/30 hover:border-primary/60 rounded-lg p-3 text-center transition-all bg-background/50 hover:bg-accent/40 flex flex-col items-center justify-center gap-1.5"
                                        >
                                            {isUploadingReverso ? (
                                                <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                                            ) : (
                                                <Upload className="w-5 h-5 text-muted-foreground" />
                                            )}
                                            <span className="text-xs font-medium text-foreground">
                                                {isUploadingReverso ? 'Cargando...' : 'Subir Reverso (Dorso)'}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">JPG, PNG, PDF</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Estado Toggle & Campos de Baja si está inactivo */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3.5 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                                <div className="space-y-0.5">
                                    <label className="text-sm font-semibold text-foreground">Estado del Empleado</label>
                                    <p className="text-[11px] text-muted-foreground">
                                        {currentPersonal.activo !== false ? 'Activo para operaciones y asignaciones' : 'Inactivo (Dado de Baja)'}
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer"
                                        checked={currentPersonal.activo !== false}
                                        onChange={(e) => setCurrentPersonal({ ...currentPersonal, activo: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>

                            {/* Detalle de baja si está inactivo */}
                            {currentPersonal.activo === false && (
                                <div className="p-4 border border-destructive/20 bg-destructive/5 rounded-lg space-y-3 animate-in fade-in duration-200">
                                    <div className="flex items-center gap-2 text-xs font-bold text-destructive">
                                        <AlertCircle className="w-4 h-4" />
                                        Información de Baja
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Fecha de Baja</label>
                                        <input
                                            type="date"
                                            value={currentPersonal.fechaBaja || ''}
                                            onChange={(e) => setCurrentPersonal({ ...currentPersonal, fechaBaja: e.target.value })}
                                            className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-destructive/20 outline-none text-xs"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-semibold text-foreground">Motivo de Baja</label>
                                        <textarea
                                            rows={2}
                                            placeholder="Motivo de la baja..."
                                            value={currentPersonal.motivoBaja || ''}
                                            onChange={(e) => setCurrentPersonal({ ...currentPersonal, motivoBaja: e.target.value })}
                                            className="w-full p-2 border rounded-lg bg-background focus:ring-2 focus:ring-destructive/20 outline-none text-xs resize-none"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                        <button
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                        >
                            <Save className="w-4 h-4" /> {currentPersonal.id ? 'Guardar Cambios' : 'Crear Personal'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Modal: Solicitar Fecha y Motivo al Dar de Baja */}
            <Modal
                isOpen={bajaModalPersonal !== null}
                onClose={() => setBajaModalPersonal(null)}
                title={
                    <span className="flex items-center gap-2 text-destructive font-bold">
                        <Trash2 className="w-5 h-5" />
                        Dar de Baja a Personal
                    </span>
                }
            >
                {bajaModalPersonal && (
                    <form onSubmit={handleConfirmBaja} className="space-y-5">
                        <div className="p-3.5 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 space-y-1">
                            <h4 className="font-bold text-sm">
                                {bajaModalPersonal.nombres} {bajaModalPersonal.apellidos}
                            </h4>
                            <p className="text-xs opacity-90 text-foreground">
                                Cargo: <span className="font-semibold">{bajaModalPersonal.cargo.replace('_', ' ')}</span>
                                {bajaModalPersonal.ci ? ` | CI: ${bajaModalPersonal.ci}` : ''}
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">
                                    Fecha de Baja <span className="text-destructive">*</span>
                                </label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="date"
                                        value={bajaFecha}
                                        onChange={(e) => setBajaFecha(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-destructive/20 outline-none text-sm font-medium"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">
                                    Motivo de Baja <span className="text-destructive">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Indique la causa o motivo de la baja (ej. Renuncia voluntaria, fin de contrato, reestructuración...)"
                                    value={bajaMotivo}
                                    onChange={(e) => setBajaMotivo(e.target.value)}
                                    className="w-full p-3 border rounded-lg bg-background focus:ring-2 focus:ring-destructive/20 outline-none text-sm resize-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setBajaModalPersonal(null)}
                                className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm font-semibold hover:bg-accent transition-all shadow-sm"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={darDeBajaMutation.isPending}
                                className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
                            >
                                {darDeBajaMutation.isPending ? 'Procesando...' : 'Confirmar Baja'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>

            {/* Modal: Ver Detalles Completos y Carnet */}
            <Modal
                isOpen={viewPersonal !== null}
                onClose={() => setViewPersonal(null)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Eye className="w-5 h-5 text-primary/80" />
                        Ficha de Personal
                    </span>
                }
            >
                {viewPersonal && (
                    <div className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
                        {/* Cabecera del perfil */}
                        <div className="flex items-start justify-between p-4 bg-muted/30 border rounded-lg">
                            <div>
                                <h3 className="text-lg font-bold text-foreground">{viewPersonal.nombres} {viewPersonal.apellidos}</h3>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                    <Briefcase className="w-3.5 h-3.5 text-primary" />
                                    {viewPersonal.cargo.replace('_', ' ')}
                                </p>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                viewPersonal.activo ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                            }`}>
                                {viewPersonal.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        {/* Datos de contacto y asignación */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 border rounded-lg bg-background space-y-1">
                                <span className="text-muted-foreground font-medium">Documento C.I.:</span>
                                <p className="font-semibold text-foreground text-sm">{viewPersonal.ci || 'Sin CI registrado'}</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-background space-y-1">
                                <span className="text-muted-foreground font-medium">Celular:</span>
                                <p className="font-semibold text-foreground text-sm">{viewPersonal.telefono || 'Sin teléfono'}</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-background space-y-1 sm:col-span-2">
                                <span className="text-muted-foreground font-medium">Dirección:</span>
                                <p className="font-semibold text-foreground text-sm">{viewPersonal.direccion || 'Sin dirección registrada'}</p>
                            </div>
                            <div className="p-3 border rounded-lg bg-background space-y-1">
                                <span className="text-muted-foreground font-medium">Sucursal:</span>
                                <p className="font-semibold text-foreground text-sm">
                                    {viewPersonal.sucursal?.nombre || 'Sin sucursal'} 
                                    {viewPersonal.sucursal?.ciudad ? ` (${viewPersonal.sucursal.ciudad.nombre})` : ''}
                                </p>
                            </div>
                            <div className="p-3 border rounded-lg bg-background space-y-1">
                                <span className="text-muted-foreground font-medium">Fecha de Ingreso:</span>
                                <p className="font-semibold text-foreground text-sm">{formatFecha(viewPersonal.fechaIngreso)}</p>
                            </div>
                        </div>

                        {/* Si está inactivo, mostrar datos de baja */}
                        {!viewPersonal.activo && (
                            <div className="p-3.5 border border-destructive/20 bg-destructive/5 rounded-lg space-y-2 text-xs">
                                <div className="flex items-center gap-1.5 font-bold text-destructive">
                                    <AlertCircle className="w-4 h-4" /> Detalle de Baja
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <span className="text-muted-foreground">Fecha de Baja:</span>
                                        <p className="font-semibold text-foreground">{formatFecha(viewPersonal.fechaBaja)}</p>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <span className="text-muted-foreground">Motivo de Baja:</span>
                                        <p className="font-medium text-foreground italic mt-0.5">{viewPersonal.motivoBaja || 'No especificado'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Fotos de Carnet */}
                        <div className="space-y-3 pt-2">
                            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-primary" /> Fotografías de Carnet
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="border rounded-lg p-3 bg-muted/10 space-y-2 text-center">
                                    <span className="text-xs font-semibold text-foreground">Anverso (Frente)</span>
                                    {viewPersonal.carnetAnverso ? (
                                        <div 
                                            className="relative aspect-[3/2] rounded-lg overflow-hidden border bg-background cursor-pointer group"
                                            onClick={() => setPreviewImage({ 
                                                url: getImageUrl(viewPersonal.carnetAnverso!), 
                                                title: `Carnet Anverso - ${viewPersonal.nombres}` 
                                            })}
                                        >
                                            <img 
                                                src={getImageUrl(viewPersonal.carnetAnverso)} 
                                                alt="Anverso" 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                                <ZoomIn className="w-4 h-4" /> Ampliar
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground italic bg-background">
                                            Sin fotografía
                                        </div>
                                    )}
                                </div>

                                <div className="border rounded-lg p-3 bg-muted/10 space-y-2 text-center">
                                    <span className="text-xs font-semibold text-foreground">Reverso (Dorso)</span>
                                    {viewPersonal.carnetReverso ? (
                                        <div 
                                            className="relative aspect-[3/2] rounded-lg overflow-hidden border bg-background cursor-pointer group"
                                            onClick={() => setPreviewImage({ 
                                                url: getImageUrl(viewPersonal.carnetReverso!), 
                                                title: `Carnet Reverso - ${viewPersonal.nombres}` 
                                            })}
                                        >
                                            <img 
                                                src={getImageUrl(viewPersonal.carnetReverso)} 
                                                alt="Reverso" 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                                            />
                                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                                                <ZoomIn className="w-4 h-4" /> Ampliar
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="aspect-[3/2] rounded-lg border border-dashed flex items-center justify-center text-xs text-muted-foreground italic bg-background">
                                            Sin fotografía
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setViewPersonal(null)}
                                className="px-5 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Lightbox / Zoom Modal */}
            {previewImage && (
                <div 
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setPreviewImage(null)}
                >
                    <div 
                        className="relative max-w-3xl max-h-[90vh] bg-card rounded-xl overflow-hidden shadow-2xl border"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-3 border-b bg-muted/40">
                            <h4 className="text-sm font-bold text-foreground truncate">{previewImage.title}</h4>
                            <button 
                                onClick={() => setPreviewImage(null)}
                                className="p-1.5 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-auto">
                            <img 
                                src={previewImage.url} 
                                alt={previewImage.title} 
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow" 
                            />
                        </div>
                    </div>
                </div>
            )}
            
            {/* Tabla Principal */}
            <div className="bg-card border rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[850px]">
                        <thead>
                            <tr className="bg-muted/50 border-b">
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-14">#</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Nombre Completo</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Documento (CI)</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Cargo</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">F. Ingreso</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-36">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedPersonal.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                                        No se encontraron registros de personal.
                                    </td>
                                </tr>
                            ) : paginatedPersonal.map((p, index) => (
                                <tr key={p.id} className="hover:bg-accent/30 transition-colors group">
                                    <td className="p-4 text-sm font-mono text-muted-foreground">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-semibold text-foreground">{p.nombres} {p.apellidos}</span>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="w-3 h-3" /> {p.telefono || 'Sin celular'}
                                                </span>
                                                {p.direccion && (
                                                    <span className="flex items-center gap-1 truncate max-w-[160px]" title={p.direccion}>
                                                        <MapPin className="w-3 h-3 text-primary/70 shrink-0" /> {p.direccion}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <span className="text-muted-foreground font-mono">{p.ci || <span className="italic opacity-50">Sin CI</span>}</span>
                                            {(p.carnetAnverso || p.carnetReverso) && (
                                                <span 
                                                    className="p-1 bg-primary/10 text-primary rounded cursor-pointer hover:bg-primary/20 transition-colors"
                                                    title="Fotos de carnet disponibles"
                                                    onClick={() => setViewPersonal(p)}
                                                >
                                                    <CreditCard className="w-3.5 h-3.5" />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600">
                                            {p.cargo.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {p.sucursal ? (
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
                                                <Building2 className="w-3 h-3 text-primary/70 shrink-0" />
                                                {p.sucursal.nombre}
                                                {p.sucursal.ciudad ? ` (${p.sucursal.ciudad.nombre})` : ''}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-muted-foreground font-mono text-xs">
                                        {formatFecha(p.fechaIngreso)}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {p.activo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest">
                                                Activo
                                            </span>
                                        ) : (
                                            <div className="flex flex-col gap-0.5 max-w-[170px]" title={p.motivoBaja ? `Motivo: ${p.motivoBaja}` : undefined}>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest w-fit">
                                                    Inactivo
                                                </span>
                                                {p.fechaBaja && (
                                                    <span className="text-[11px] text-muted-foreground font-mono font-medium">
                                                        Baja: {formatFecha(p.fechaBaja)}
                                                    </span>
                                                )}
                                                {p.motivoBaja && (
                                                    <span className="text-[11px] text-muted-foreground/90 italic truncate" title={p.motivoBaja}>
                                                        Motivo: {p.motivoBaja}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex justify-end gap-1.5 transition-opacity">
                                            <button
                                                onClick={() => setViewPersonal(p)}
                                                title="Ver Ficha y Carnet"
                                                className="p-2 text-blue-600 dark:text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                            >
                                                <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                            </button>
                                            <button
                                                onClick={() => handleOpenEdit(p)}
                                                title="Editar"
                                                className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {p.activo ? (
                                                <button
                                                    onClick={() => handleOpenBaja(p)}
                                                    title="Dar de Baja"
                                                    className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => reactivarMutation.mutate(p)}
                                                    title="Reactivar Personal"
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredPersonal.length)} de {filteredPersonal.length}
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

export default PersonalPage;
