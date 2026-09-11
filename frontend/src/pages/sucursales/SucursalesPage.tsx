import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalService } from '../../api/sucursalService';
import type { Sucursal } from '../../api/sucursalService';
import { getCiudades } from '../../api/ciudadService';
import Modal from '../../components/ui/Modal';
import { 
    Building2, Plus, Pencil, Trash2, Search, X, Save, 
    ChevronLeft, ChevronRight, Check, Printer, 
    FileText, FileSpreadsheet, MapPin, Phone, Mail, Map, Clock,
    ArrowLeft, Compass, ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';

import { useFilters } from '../../context/FilterContext';
import LocationPickerMap from '../../components/ui/LocationPickerMap';

const SucursalesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const { selectedCiudad, selectedSucursal } = useFilters();
    
    const [isEditing, setIsEditing] = useState(false);
    const [currentSucursal, setCurrentSucursal] = useState<Partial<Sucursal>>({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        horarioAtencion: 'Lun a Vie: 08:30 - 18:30 | Sáb: 08:30 - 13:00',
        latitud: null,
        longitud: null,
        activo: true
    });
    const [ciudadId, setCiudadId] = useState<number | ''>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const { data: sucursales, isLoading } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const { data: ciudades } = useQuery({
        queryKey: ['ciudades'],
        queryFn: getCiudades,
    });

    const exportColumns = [
        { header: 'Nombre', dataKey: 'nombre' },
        { header: 'Ciudad', dataKey: 'ciudad' },
        { header: 'Dirección', dataKey: 'direccion' },
        { header: 'Teléfono', dataKey: 'telefono' },
        { header: 'Email', dataKey: 'email' },
        { header: 'Estado', dataKey: 'activo' }
    ];

    const excelColumns = [
        { header: 'ID', dataKey: 'id' },
        ...exportColumns
    ];

    const getFormattedData = () => {
        return filteredSucursales.map(s => ({
            id: s.id,
            nombre: s.nombre,
            ciudad: s.ciudad?.nombre || '-',
            direccion: s.direccion || '-',
            telefono: s.telefono || '-',
            email: s.email || '-',
            activo: s.activo
        }));
    };

    const handlePrint = () => {
        if (!sucursales) return;
        printData('Reporte de Sucursales', exportColumns, getFormattedData());
    };

    const handleExportPDF = () => {
        if (!sucursales) return;
        exportToPDF('Reporte de Sucursales', exportColumns, getFormattedData(), 'sucursales_reporte');
    };

    const handleExportExcel = () => {
        if (!sucursales) return;
        exportToExcel(excelColumns, getFormattedData(), 'sucursales_reporte');
    };

    const createMutation = useMutation({
        mutationFn: sucursalService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sucursales'] });
            setIsEditing(false);
            resetForm();
            toast.success('Sucursal creada con éxito');
        },
        onError: () => toast.error('Error al crear sucursal')
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; sucursal: Partial<Sucursal> }) => sucursalService.update(data.id, data.sucursal),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sucursales'] });
            setIsEditing(false);
            resetForm();
        },
        onError: () => toast.error('Error al actualizar sucursal')
    });

    const deleteMutation = useMutation({
        mutationFn: sucursalService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sucursales'] });
            toast.error('Sucursal desactivada');
        },
        onError: () => toast.error('Error al desactivar sucursal')
    });

    const resetForm = () => {
        setCurrentSucursal({
            nombre: '',
            direccion: '',
            telefono: '',
            email: '',
            horarioAtencion: 'Lun a Vie: 08:30 - 18:30 | Sáb: 08:30 - 13:00',
            latitud: null,
            longitud: null,
            activo: true
        });
        setCiudadId('');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const payload: any = { ...currentSucursal };
        if (ciudadId) {
            payload.ciudad = { id: Number(ciudadId) };
        } else {
            toast.error('Debe seleccionar una ciudad');
            return;
        }

        if (currentSucursal.id) {
            updateMutation.mutate(
                { id: currentSucursal.id, sucursal: payload },
                { onSuccess: () => toast.success('Sucursal actualizada con éxito') }
            );
        } else {
            createMutation.mutate(payload);
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const filteredSucursales = useMemo(() => {
        if (!sucursales) return [];
        const filtered = sucursales.filter(s => {
            const matchesSearch = s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  s.direccion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  s.ciudad?.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesCiudad = !selectedCiudad || s.ciudad?.id === Number(selectedCiudad);
            const matchesSucursal = !selectedSucursal || s.id === Number(selectedSucursal);
            
            return matchesSearch && matchesCiudad && matchesSucursal;
        });
        return filtered.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }, [sucursales, searchTerm, selectedCiudad, selectedSucursal]);

    const totalPages = Math.ceil(filteredSucursales.length / itemsPerPage) || 1;
    const paginatedSucursales = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredSucursales.slice(start, start + itemsPerPage);
    }, [filteredSucursales, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCiudad, selectedSucursal]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando sucursales...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link to="/configuracion" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver a Configuración
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Building2 className="w-8 h-8 text-primary/80" />
                        Sucursales
                    </h1>
                    <p className="text-muted-foreground italic">Gestione las ubicaciones físicas de su negocio.</p>
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
                        <Plus className="w-4 h-4" /> Nueva Sucursal
                    </button>
                </div>
            </div>

            <div className="bg-card p-3 border rounded-lg shadow-sm flex items-center gap-2 max-w-md">
                <Search className="w-5 h-5 text-muted-foreground ml-1" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, dirección o ciudad..." 
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
                        {currentSucursal.id ? 'Editar Sucursal' : 'Nueva Sucursal'}
                    </span>
                }>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1.5 py-1 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Nombre <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={currentSucursal.nombre || ''}
                                    onChange={(e) => setCurrentSucursal({ ...currentSucursal, nombre: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    placeholder="Ej: Sucursal Central"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Ciudad <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <Map className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <select
                                    value={ciudadId}
                                    onChange={(e) => setCiudadId(e.target.value ? Number(e.target.value) : '')}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                >
                                    <option value="" disabled>Seleccione una ciudad</option>
                                    {ciudades?.map(c => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Dirección</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={currentSucursal.direccion || ''}
                                    onChange={(e) => setCurrentSucursal({ ...currentSucursal, direccion: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    placeholder="Av. Principal #123"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Celular</label>
                                <div className="relative group">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={currentSucursal.telefono || ''}
                                        onChange={(e) => setCurrentSucursal({ ...currentSucursal, telefono: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        placeholder="Ej: 73202930 - 22445566"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Email</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        value={currentSucursal.email || ''}
                                        onChange={(e) => setCurrentSucursal({ ...currentSucursal, email: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        placeholder="Ej: lapaz@gipaaf.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Horario de Atención</label>
                            <div className="relative group">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    value={currentSucursal.horarioAtencion || ''}
                                    onChange={(e) => setCurrentSucursal({ ...currentSucursal, horarioAtencion: e.target.value })}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    placeholder="Ej: Lun a Vie: 08:30 - 18:30 | Sáb: 08:30 - 13:00"
                                />
                            </div>
                        </div>

                        <LocationPickerMap
                            latitud={currentSucursal.latitud}
                            longitud={currentSucursal.longitud}
                            onChange={(lat, lng) => setCurrentSucursal(prev => ({ ...prev, latitud: lat, longitud: lng }))}
                            title="Ubicación en Mapa"
                            description="Haz clic en el mapa para marcar la ubicación exacta de la sucursal."
                        />

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Estado</label>
                                <p className="text-[11px] text-muted-foreground">Activar o desactivar sucursal</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={currentSucursal.activo !== false}
                                    onChange={(e) => setCurrentSucursal({ ...currentSucursal, activo: e.target.checked })}
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
                            <Save className="w-4 h-4" /> {currentSucursal.id ? 'Guardar Cambios' : 'Crear Sucursal'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="Desactivar Sucursal">
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Esta sucursal pasará a estado Inactivo</h4>
                            <p className="text-xs mt-1 opacity-90 text-destructive/80">Dejará de aparecer en las listas de selección, pero su historial se mantendrá intacto.</p>
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
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Sucursal</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Ciudad</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Dirección</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Contacto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedSucursales.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No se encontraron sucursales.</td></tr>
                            ) : paginatedSucursales.map((sucursal, index) => (
                                <tr key={sucursal.id} className="hover:bg-accent/30 transition-colors group">
                                    <td className="p-4 text-sm font-mono text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="p-4">
                                        <span className="text-sm font-medium">{sucursal.nombre}</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-sm font-medium text-primary">{sucursal.ciudad?.nombre || 'Sin ciudad'}</span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="w-4 h-4 shrink-0" /> <span className="truncate max-w-[200px]">{sucursal.direccion || '-'}</span>
                                            </div>
                                            {sucursal.horarioAtencion && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground/80">
                                                    <Clock className="w-3.5 h-3.5 shrink-0 text-primary/70" /> <span className="truncate max-w-[220px]">{sucursal.horarioAtencion}</span>
                                                </div>
                                            )}
                                            {sucursal.latitud && sucursal.longitud && (
                                                <a
                                                    href={`https://maps.google.com/?q=${sucursal.latitud},${sucursal.longitud}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-medium mt-0.5"
                                                    title="Abrir ubicación en Google Maps"
                                                >
                                                    <Compass className="w-3.5 h-3.5 shrink-0" />
                                                    <span>Ver en Maps</span>
                                                </a>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="w-3 h-3" /> {sucursal.telefono || '-'}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Mail className="w-3 h-3" /> {sucursal.email || '-'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-sm">
                                        {sucursal.activo !== false ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest">Activo</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex justify-end gap-2 transition-opacity">
                                            <button onClick={() => { 
                                                setCurrentSucursal({ ...sucursal }); 
                                                setCiudadId(sucursal.ciudad?.id || '');
                                                setIsEditing(true); 
                                            }} title="Editar" className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {sucursal.activo !== false ? (
                                                <button onClick={() => setDeleteConfirmId(sucursal.id)} title="Desactivar" className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button onClick={() => updateMutation.mutate({ id: sucursal.id, sucursal: { ...sucursal, activo: true } }, { onSuccess: () => toast.success('Sucursal activada con éxito') })} title="Activar" className="p-2 text-green-600 dark:text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all">
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSucursales.length)} de {filteredSucursales.length}
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

export default SucursalesPage;
