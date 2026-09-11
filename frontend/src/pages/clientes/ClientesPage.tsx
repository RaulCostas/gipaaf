import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { clientService } from '../../api/clientService';
import { rutaService } from '../../api/rutaService';
import { sucursalService } from '../../api/sucursalService';
import type { Cliente } from '../../api/clientService';
import Modal from '../../components/ui/Modal';
import { 
    Search, Plus, Pencil, Trash2, Users, 
    X, Save, ChevronLeft, ChevronRight, Check,
    Printer, FileText, FileSpreadsheet, User, Phone, MapPin, CreditCard, Mail, FileBadge, Building2, Barcode, Calendar, Map,
    Compass, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { exportToPDF, exportToExcel, printData } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { useFilters } from '../../context/FilterContext';
import LocationPickerMap from '../../components/ui/LocationPickerMap';

const ClientesPage: React.FC = () => {
    const { selectedCiudad, selectedSucursal } = useFilters();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [currentClient, setCurrentClient] = useState<Partial<Cliente>>({
        persona: { nombres: '', apellidos: '', ci: '', telefono: '', direccion: '', email: '', activo: true } as any,
        codigo: '',
        plazoCreditoDias: 0,
        limiteCredito: 0,
        creditoDisponible: 0,
        observaciones: '',
        latitud: null,
        longitud: null
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const { data: clients, isLoading } = useQuery({
        queryKey: ['clients'],
        queryFn: () => clientService.getAll(),
    });

    const { data: rutasList } = useQuery({
        queryKey: ['rutas'],
        queryFn: rutaService.getAll,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const exportColumns = [
        { header: 'CI/NIT', dataKey: 'ci' },
        { header: 'Nombres', dataKey: 'nombres' },
        { header: 'Apellidos', dataKey: 'apellidos' },
        { header: 'Celular', dataKey: 'telefono' },
        { header: 'Dirección', dataKey: 'direccion' },
        { header: 'Ruta / Vendedor', dataKey: 'rutaVendedor' },
        { header: 'Límite Crédito', dataKey: 'limiteCredito' },
        { header: 'Deuda Actual', dataKey: 'deudaActual' },
        { header: 'Crédito Disp.', dataKey: 'creditoDisponible' },
        { header: 'Estado', dataKey: 'activo' }
    ];

    const excelColumns = [
        { header: 'ID', dataKey: 'id' },
        ...exportColumns
    ];

    const getFormattedData = () => {
        return filteredClients.map(c => ({
            id: c.id,
            ci: c.persona?.ci || '-',
            nombres: c.persona?.nombres || '-',
            apellidos: c.persona?.apellidos || '-',
            telefono: c.persona?.telefono || '-',
            direccion: c.persona?.direccion || '-',
            rutaVendedor: c.ruta ? `${c.ruta.nombre}${c.ruta.vendedor ? ` (${c.ruta.vendedor.nombres} ${c.ruta.vendedor.apellidos})` : ''}` : 'Sin Ruta',
            limiteCredito: c.limiteCredito,
            deudaActual: c.deudaActual || 0,
            creditoDisponible: c.creditoDisponible || 0,
            activo: c.activo
        }));
    };

    const handlePrint = () => {
        if (!clients) return;
        printData('Reporte de Clientes', exportColumns, getFormattedData());
    };

    const handleExportPDF = () => {
        if (!clients) return;
        exportToPDF('Reporte de Clientes', exportColumns, getFormattedData(), 'clientes_reporte');
    };

    const handleExportExcel = () => {
        if (!clients) return;
        exportToExcel(excelColumns, getFormattedData(), 'clientes_reporte');
    };

    const createMutation = useMutation({
        mutationFn: clientService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsEditing(false);
            resetForm();
            toast.success('Cliente creado con éxito');
        },
        onError: () => toast.error('Error al crear cliente')
    });

    const updateMutation = useMutation({
        mutationFn: (data: Cliente) => clientService.update(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            setIsEditing(false);
            resetForm();
        },
        onError: () => toast.error('Error al actualizar cliente')
    });

    const deleteMutation = useMutation({
        mutationFn: clientService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            toast.error('Cliente desactivado');
        },
        onError: () => toast.error('Error al desactivar cliente')
    });

    const resetForm = () => {
        setCurrentClient({
            persona: { nombres: '', apellidos: '', ci: '', telefono: '', direccion: '', email: '', activo: true } as any,
            codigo: '',
            plazoCreditoDias: 0,
            limiteCredito: 0,
            creditoDisponible: 0,
            observaciones: '',
            latitud: null,
            longitud: null,
            activo: true
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Extract ID for relations
        const submitData = { ...currentClient } as any;
        if (submitData.ruta?.id) {
            submitData.ruta = submitData.ruta.id;
        } else {
            submitData.ruta = null;
        }

        if (submitData.sucursal?.id) {
            submitData.sucursal = submitData.sucursal.id;
        } else {
            submitData.sucursal = null;
        }

        if (currentClient.id) {
            updateMutation.mutate(submitData as Cliente, {
                onSuccess: () => toast.success('Cliente actualizado con éxito')
            });
        } else {
            createMutation.mutate(submitData);
        }
    };

    const confirmDelete = () => {
        if (deleteConfirmId) {
            deleteMutation.mutate(deleteConfirmId);
            setDeleteConfirmId(null);
        }
    };

    const filteredClients = useMemo(() => {
        if (!clients) return [];
        let filtered = clients;
        
        if (selectedCiudad) {
            filtered = filtered.filter(c => 
                c.sucursal?.ciudad?.id === Number(selectedCiudad) ||
                c.ruta?.sucursal?.ciudad?.id === Number(selectedCiudad)
            );
        }

        if (selectedSucursal) {
            filtered = filtered.filter(c => c.sucursal?.id === Number(selectedSucursal));
        }

        filtered = filtered.filter(c => 
            c.persona?.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.persona?.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.persona?.ci?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.persona?.telefono?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.persona?.direccion?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        return filtered.sort((a, b) => (a.persona?.nombres || '').localeCompare(b.persona?.nombres || ''));
    }, [clients, searchTerm, selectedCiudad, selectedSucursal]);

    const totalPages = Math.ceil(filteredClients.length / itemsPerPage) || 1;
    const paginatedClients = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredClients.slice(start, start + itemsPerPage);
    }, [filteredClients, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedCiudad, selectedSucursal]);

    if (isLoading) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando clientes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary/80" />
                        Clientes
                    </h1>
                    <p className="text-muted-foreground italic">Gestiona la información y límites de crédito de tus clientes.</p>
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
                        <Plus className="w-4 h-4" /> Nuevo Cliente
                    </button>
                </div>
            </div>

            <div className="bg-card p-3 border rounded-lg shadow-sm flex items-center gap-2 max-w-md">
                <Search className="w-5 h-5 text-muted-foreground ml-1" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, apellido o CI..." 
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
                        <Users className="w-6 h-6 text-primary/80" />
                        {currentClient.id ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </span>
                }>
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto px-1.5 py-1 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Nombres <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Ej: Juan"
                                        value={currentClient.persona?.nombres || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, persona: { ...currentClient.persona!, nombres: e.target.value }})}
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
                                        value={currentClient.persona?.apellidos || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, persona: { ...currentClient.persona!, apellidos: e.target.value }})}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">CI / NIT</label>
                                <div className="relative group">
                                    <FileBadge className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="Ej: 4892301 LP"
                                        value={currentClient.persona?.ci || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, persona: { ...currentClient.persona!, ci: e.target.value }})}
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
                                        value={currentClient.persona?.telefono || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, persona: { ...currentClient.persona!, telefono: e.target.value }})}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="email"
                                    placeholder="Ej: cliente@gmail.com"
                                    value={currentClient.persona?.email || ''}
                                    onChange={(e) => setCurrentClient({ ...currentClient, persona: { ...currentClient.persona!, email: e.target.value }})}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">Dirección</label>
                            <div className="relative group">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Ej: Av. 6 de Agosto #456, Zona Sur"
                                    value={currentClient.persona?.direccion || ''}
                                    onChange={(e) => setCurrentClient({ ...currentClient, persona: { ...currentClient.persona!, direccion: e.target.value }})}
                                    className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                />
                            </div>
                        </div>

                        <LocationPickerMap
                            latitud={currentClient.latitud}
                            longitud={currentClient.longitud}
                            onChange={(lat, lng) => setCurrentClient(prev => ({ ...prev, latitud: lat, longitud: lng }))}
                            title="Ubicación en Mapa"
                            description="Haz clic en el mapa para marcar la ubicación exacta del cliente / taller."
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Código Cliente <span className="text-destructive">*</span></label>
                                <div className="relative group">
                                    <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={currentClient.codigo || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, codigo: e.target.value })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        placeholder="Ej: C-001"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Plazo de Crédito (Días)</label>
                                <div className="relative group">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="number"
                                        min="0"
                                        value={currentClient.plazoCreditoDias || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, plazoCreditoDias: parseInt(e.target.value) || 0 })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                        placeholder="Ej: 30"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Límite de Crédito</label>
                                <div className="relative group">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Ej: 5000.00"
                                        value={currentClient.limiteCredito || ''}
                                        onChange={(e) => setCurrentClient({ ...currentClient, limiteCredito: parseFloat(e.target.value), creditoDisponible: currentClient.id ? currentClient.creditoDisponible : parseFloat(e.target.value) })}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground">Sucursal Asignada</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <select
                                        value={currentClient.sucursal?.id || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const found = sucursales?.find(s => s.id === Number(val));
                                            setCurrentClient({ 
                                                ...currentClient, 
                                                sucursal: found ? found : undefined 
                                            });
                                        }}
                                        className="w-full pl-10 pr-3 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer text-sm"
                                    >
                                        <option value="">-- Sin Sucursal Asignada --</option>
                                        {sucursales?.filter(s => s.activo !== false || s.id === currentClient.sucursal?.id).map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.nombre}{s.ciudad?.nombre ? ` (${s.ciudad.nombre})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {currentClient.ruta && (
                            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center gap-2.5 text-xs">
                                    <Map className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                        <span className="font-semibold text-foreground">Ruta Asignada: </span>
                                        <span className="text-primary font-bold">{currentClient.ruta.nombre}</span>
                                        {currentClient.ruta.vendedor && (
                                            <span className="text-muted-foreground ml-1.5">
                                                (Vendedor: <strong className="text-foreground">{currentClient.ruta.vendedor.nombres} {currentClient.ruta.vendedor.apellidos}</strong>)
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground italic shrink-0">
                                    Asignación administrada en /rutas
                                </span>
                            </div>
                        )}

                        <div className="flex items-center justify-between p-4 border rounded-lg bg-background hover:border-primary/50 transition-colors">
                            <div className="space-y-0.5">
                                <label className="text-sm font-semibold text-foreground">Estado</label>
                                <p className="text-[11px] text-muted-foreground">Activar o desactivar cliente</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={currentClient.activo !== false}
                                    onChange={(e) => setCurrentClient({ ...currentClient, activo: e.target.checked })}
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
                            <Save className="w-4 h-4" /> {currentClient.id ? 'Guardar Cambios' : 'Crear Cliente'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)} title="Desactivar Cliente">
                <div className="space-y-6">
                    <div className="flex items-start gap-4 p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                        <Trash2 className="w-6 h-6 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-semibold text-sm">Este cliente pasará a estado Inactivo</h4>
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
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Código</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Cliente / CI</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Contacto</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Ruta / Vendedor</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground">Crédito / Deuda</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground w-28">Estado</th>
                                <th className="p-4 text-sm font-semibold text-muted-foreground text-right w-32">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {paginatedClients.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No se encontraron clientes.</td></tr>
                            ) : paginatedClients.map((client, index) => (
                                <tr key={client.id} className="hover:bg-accent/30 transition-colors group">
                                    <td className="p-4 text-sm font-mono text-muted-foreground">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="p-4 text-sm font-bold text-foreground">
                                        {client.codigo || '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium">{client.persona.nombres} {client.persona.apellidos}</span>
                                            <span className="text-xs font-mono text-muted-foreground">CI: {client.persona.ci || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <Phone className="w-3.5 h-3.5 shrink-0" /> 
                                                <span>{client.persona.telefono || '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                <MapPin className="w-3.5 h-3.5 shrink-0" /> 
                                                <span className="truncate max-w-[170px]">
                                                    {client.persona.direccion || '-'}
                                                </span>
                                            </div>
                                            {client.latitud && client.longitud && (
                                                <a
                                                    href={`https://maps.google.com/?q=${client.latitud},${client.longitud}`}
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
                                        {client.ruta ? (
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                                                    <Map className="w-3.5 h-3.5 shrink-0 text-primary" />
                                                    <span className="truncate max-w-[170px]">{client.ruta.nombre}</span>
                                                </div>
                                                {client.ruta.vendedor ? (
                                                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                                        <User className="w-3 h-3 shrink-0 text-muted-foreground/70" />
                                                        <span className="truncate max-w-[170px]">
                                                            {client.ruta.vendedor.nombres} {client.ruta.vendedor.apellidos}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] text-muted-foreground/60 italic">Sin vendedor</span>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground">
                                                Sin Ruta
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {client.limiteCredito > 0 ? (
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400" title="Crédito Disponible">
                                                    <span className="text-[10px] font-medium text-muted-foreground">Disp:</span>
                                                    {formatCurrency(client.creditoDisponible)}
                                                </div>
                                                {Number(client.deudaActual || 0) > 0 && (
                                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400" title="Deuda pendiente de pago">
                                                        <span className="text-[10px] font-medium text-muted-foreground">Deuda:</span>
                                                        {formatCurrency(client.deudaActual || 0)}
                                                    </div>
                                                )}
                                                <div className="text-[10px] text-muted-foreground font-medium">
                                                    Límite: {formatCurrency(client.limiteCredito)} {(client.plazoCreditoDias || 0) > 0 ? `| ${client.plazoCreditoDias} d` : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">Sin crédito</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        {client.activo ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-500 uppercase tracking-widest">Activo</span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 uppercase tracking-widest">Inactivo</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm">
                                        <div className="flex justify-end gap-2 transition-opacity">
                                            <button onClick={() => { setCurrentClient({ ...client }); setIsEditing(true); }} title="Editar" className="p-2 text-primary bg-primary/10 hover:bg-primary/20 hover:scale-110 active:scale-95 rounded-lg transition-all">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            {client.activo ? (
                                                <button onClick={() => setDeleteConfirmId(client.id)} title="Desactivar" className="p-2 text-red-600 dark:text-red-100 bg-red-100 dark:bg-red-600 hover:bg-red-200 dark:hover:bg-red-700 hover:scale-110 active:scale-95 rounded-lg transition-all">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <button onClick={() => updateMutation.mutate({ ...client, activo: true } as Cliente, { onSuccess: () => toast.success('Cliente activado con éxito') })} title="Activar" className="p-2 text-green-600 dark:text-green-500 bg-green-500/10 hover:bg-green-500/20 hover:scale-110 active:scale-95 rounded-lg transition-all">
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
                            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredClients.length)} de {filteredClients.length}
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

export default ClientesPage;
