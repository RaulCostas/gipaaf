import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService, permissionService } from '../../api/userService';
import type { Rol, Permiso } from '../../api/userService';
import Modal from '../../components/ui/Modal';
import { 
    Shield, ShieldCheck, Plus, Pencil, Trash2, Search, CheckCircle2, 
    Lock, ListChecks, FileText, CheckSquare, Square, X,
    Package, ShoppingCart, Users, TrendingUp, Settings, HelpCircle,
    Boxes, PieChart
} from 'lucide-react';
import { toast } from 'sonner';

const SECTIONS_CONFIG = [
    {
        title: 'Existencias (Stock)',
        icon: Boxes,
        recursos: ['PRODUCTOS', 'CATALOGOS', 'INVENTARIO', 'TRASPASOS', 'MOVIMIENTOS', 'KARDEX']
    },
    {
        title: 'Operaciones',
        icon: ShoppingCart,
        recursos: [
            'PROFORMAS', 'VENTAS', 'COBRANZAS', 'ESTADO_CUENTAS_CLIENTES', 
            'COMPRAS', 'PAGOS_PROVEEDORES', 'ESTADO_CUENTAS_PROVEEDORES', 
            'EGRESOS', 'DEVOLUCIONES', 'MUESTRAS'
        ]
    },
    {
        title: 'Contactos',
        icon: Users,
        recursos: ['CLIENTES', 'PROVEEDORES', 'PERSONAL', 'RUTAS']
    },
    {
        title: 'Reportes',
        icon: PieChart,
        recursos: ['REPORTES']
    },
    {
        title: 'Utilidades',
        icon: TrendingUp,
        recursos: ['UTILIDADES']
    },
    {
        title: 'Configuración',
        icon: Settings,
        recursos: ['CONFIGURACION', 'WHATSAPP']
    },
    {
        title: 'Seguridad',
        icon: Shield,
        recursos: ['USUARIOS', 'ROLES']
    }
];

const RolesPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRol, setEditingRol] = useState<Rol | null>(null);
    const [search, setSearch] = useState('');
    const [permSearch, setPermSearch] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);

    const { data: roles, isLoading: loadingRoles } = useQuery({
        queryKey: ['roles'],
        queryFn: roleService.getAll,
    });

    const { data: permissions, isLoading: loadingPerms } = useQuery({
        queryKey: ['permissions'],
        queryFn: permissionService.getAll,
    });

    const createMutation = useMutation({
        mutationFn: roleService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsModalOpen(false);
            toast.success('Rol de seguridad creado exitosamente');
        },
        onError: () => toast.error('Error al crear el rol'),
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; rol: Partial<Rol> }) =>
            roleService.update(data.id, data.rol),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            setIsModalOpen(false);
            toast.success('Rol de seguridad actualizado con éxito');
        },
        onError: () => toast.error('Error al actualizar el rol'),
    });

    const deleteMutation = useMutation({
        mutationFn: roleService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success('Rol eliminado');
        },
        onError: () => toast.error('No se pudo eliminar el rol'),
    });

    const handleEdit = (rol: Rol) => {
        setEditingRol(rol);
        setSelectedPermissions(rol.permisos.map(p => p.id));
        setPermSearch('');
        setIsModalOpen(true);
    };

    const handleTogglePermission = (id: number) => {
        setSelectedPermissions(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        if (!permissions) return;
        setSelectedPermissions(permissions.map(p => p.id));
    };

    const handleDeselectAll = () => {
        setSelectedPermissions([]);
    };

    const handleSelectSection = (sectionPerms: Permiso[]) => {
        const idsToAdd = sectionPerms.map(p => p.id);
        setSelectedPermissions(prev => Array.from(new Set([...prev, ...idsToAdd])));
    };

    const handleDeselectSection = (sectionPerms: Permiso[]) => {
        const idsToRemove = new Set(sectionPerms.map(p => p.id));
        setSelectedPermissions(prev => prev.filter(id => !idsToRemove.has(id)));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const nombre = formData.get('nombre') as string;
        const descripcion = formData.get('descripcion') as string;

        if (!nombre || !nombre.trim()) {
            toast.error('El nombre del rol es obligatorio');
            return;
        }

        const data = {
            nombre: nombre.trim().toUpperCase(),
            descripcion: descripcion ? descripcion.trim() : undefined,
            permisos: selectedPermissions.map(id => ({ id }))
        };

        if (editingRol) {
            updateMutation.mutate({ id: editingRol.id, rol: data as any });
        } else {
            createMutation.mutate(data as any);
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este rol de seguridad?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredRoles = roles?.filter(r =>
        r.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (r.descripcion || '').toLowerCase().includes(search.toLowerCase())
    );

    // Group permissions into sections matching the sidebar menu order
    const groupedSections = useMemo(() => {
        if (!permissions) return [];

        const s = permSearch.toLowerCase().trim();
        const matchingPerms = s
            ? permissions.filter(p =>
                p.nombre.toLowerCase().includes(s) ||
                p.recurso.toLowerCase().includes(s) ||
                (p.descripcion || '').toLowerCase().includes(s)
            )
            : permissions;

        const sections = SECTIONS_CONFIG.map(sec => {
            // Filter and sort items within this section according to the configured recursos order
            const perms = matchingPerms.filter(p => sec.recursos.includes(p.recurso.toUpperCase()));
            perms.sort((a, b) => {
                const indexA = sec.recursos.indexOf(a.recurso.toUpperCase());
                const indexB = sec.recursos.indexOf(b.recurso.toUpperCase());
                if (indexA !== indexB) return indexA - indexB;
                return a.id - b.id;
            });
            return {
                ...sec,
                perms
            };
        }).filter(sec => sec.perms.length > 0);

        // Catch any permissions not explicitly in SECTIONS_CONFIG
        const knownRecursos = new Set(SECTIONS_CONFIG.flatMap(s => s.recursos));
        const otherPerms = matchingPerms.filter(p => !knownRecursos.has(p.recurso.toUpperCase()));
        if (otherPerms.length > 0) {
            sections.push({
                title: 'Otros',
                icon: HelpCircle,
                recursos: [],
                perms: otherPerms
            });
        }

        return sections;
    }, [permissions, permSearch]);

    if (loadingRoles || loadingPerms) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando roles y permisos...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Lock className="w-8 h-8 text-primary/80" />
                        Roles y Seguridad
                    </h1>
                    <p className="text-muted-foreground italic">Defina los perfiles de acceso (Roles) y sus permisos asociados en el sistema.</p>
                </div>
                <button
                    onClick={() => {
                        setEditingRol(null);
                        setSelectedPermissions([]);
                        setPermSearch('');
                        setIsModalOpen(true);
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Rol
                </button>
            </div>

            <div className="flex items-center space-x-2 bg-card p-3 border rounded-xl shadow-sm max-w-md">
                <Search className="w-4 h-4 text-muted-foreground ml-2" />
                <input
                    type="text"
                    placeholder="Buscar por nombre de rol o descripción..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1 p-1 bg-transparent border-none text-sm outline-none placeholder:text-muted-foreground/70"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="p-1 hover:bg-accent rounded-md text-muted-foreground">
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRoles?.map((r) => (
                    <div key={r.id} className="bg-card border rounded-2xl p-6 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${r.nombre.toLowerCase() === 'admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : 'bg-primary/10 text-primary'}`}>
                                    <Shield className="w-6 h-6" />
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(r)} className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-primary transition-colors" title="Editar Rol">
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    {r.nombre.toLowerCase() !== 'admin' && (
                                         <button onClick={() => handleDelete(r.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors" title="Eliminar Rol">
                                             <Trash2 className="w-4 h-4" />
                                         </button>
                                    )}
                                </div>
                            </div>

                            <h3 className="font-bold text-xl mb-1 uppercase tracking-tight text-foreground">{r.nombre}</h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                                {r.descripcion || 'Sin descripción asignada.'}
                            </p>
                        </div>

                        <div className="space-y-3 pt-3 border-t">
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <span>Permisos Asignados</span>
                                <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">{r.permisos?.length || 0}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-hidden">
                                {r.permisos?.slice(0, 4).map(p => (
                                    <span key={p.id} className="px-2 py-0.5 bg-accent text-[10px] rounded-md font-medium">
                                        {p.nombre}
                                    </span>
                                ))}
                                {r.permisos && r.permisos.length > 4 && (
                                    <span className="px-2 py-0.5 bg-primary/10 text-[10px] rounded-md font-bold text-primary">
                                        +{r.permisos.length - 4} más
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Crear / Editar Rol */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Lock className="w-6 h-6 text-primary/80" />
                        {editingRol ? `Configurar Rol: ${editingRol.nombre}` : 'Nuevo Perfil de Usuario (Rol)'}
                    </span>
                }
                className="max-w-4xl"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Nombre del Rol <span className="text-destructive">*</span></label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="nombre"
                                    defaultValue={editingRol?.nombre}
                                    required
                                    className="w-full pl-10 pr-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 font-mono uppercase text-sm font-bold"
                                    placeholder="EJ: VENDEDOR, CAJERO..."
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Descripción del Perfil</label>
                            <div className="relative group">
                                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    name="descripcion"
                                    defaultValue={editingRol?.descripcion}
                                    className="w-full pl-10 pr-3 py-2 bg-background border rounded-lg focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    placeholder="Breve resumen de responsabilidades..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3 p-3 border rounded-xl bg-card">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2">
                            <div className="flex items-center gap-2">
                                <ListChecks className="w-4 h-4 text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                                    Asignación de Permisos del Sistema
                                </h3>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                                    {selectedPermissions.length} de {permissions?.length || 0} SELECCIONADOS
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleSelectAll}
                                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                                >
                                    <CheckSquare className="w-3.5 h-3.5" /> Marcar Todos
                                </button>
                                <span className="text-muted-foreground">|</span>
                                <button
                                    type="button"
                                    onClick={handleDeselectAll}
                                    className="text-[11px] font-semibold text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <Square className="w-3.5 h-3.5" /> Desmarcar Todos
                                </button>
                            </div>
                        </div>

                        {/* Search permissions filter */}
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Filtrar permisos (ej. ventas, inventario, clientes)..."
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-muted/40 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* Grouped Permissions Grid */}
                        <div className="max-h-[360px] overflow-y-auto px-1 py-1 space-y-4 custom-scrollbar">
                            {groupedSections.length === 0 ? (
                                <div className="p-4 text-center text-xs text-muted-foreground">
                                    No se encontraron permisos con ese criterio de búsqueda.
                                </div>
                            ) : (
                                groupedSections.map(section => {
                                    const SectionIcon = section.icon;
                                    const sectionSelectedCount = section.perms.filter(p => selectedPermissions.includes(p.id)).length;
                                    const isAllSectionSelected = sectionSelectedCount === section.perms.length;

                                    return (
                                        <div key={section.title} className="space-y-2">
                                            {/* Section Header */}
                                            <div className="flex items-center justify-between py-1 px-2.5 bg-muted/60 rounded-lg border border-border/60">
                                                <div className="flex items-center gap-2">
                                                    <SectionIcon className="w-3.5 h-3.5 text-primary" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                        {section.title}
                                                    </span>
                                                    <span className="text-[10px] bg-background px-1.5 py-0.2 rounded-full border text-muted-foreground font-semibold">
                                                        {sectionSelectedCount} / {section.perms.length}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[11px]">
                                                    <button
                                                        type="button"
                                                        onClick={() => isAllSectionSelected ? handleDeselectSection(section.perms) : handleSelectSection(section.perms)}
                                                        className="text-primary hover:underline font-semibold"
                                                    >
                                                        {isAllSectionSelected ? 'Desmarcar sección' : 'Marcar sección'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Section Cards */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                                {section.perms.map(p => {
                                                    const isSelected = selectedPermissions.includes(p.id);
                                                    return (
                                                        <div
                                                            key={p.id}
                                                            onClick={() => handleTogglePermission(p.id)}
                                                            className={`p-2.5 border rounded-xl cursor-pointer transition-all flex flex-col justify-between gap-1 select-none
                                                                ${isSelected
                                                                    ? 'bg-primary/10 border-primary shadow-sm text-primary'
                                                                    : 'bg-background hover:bg-accent border-border hover:border-primary/30 text-foreground'}`}
                                                        >
                                                            <div className="flex items-center justify-between gap-1">
                                                                <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground truncate">
                                                                    {p.recurso}
                                                                </span>
                                                                {isSelected ? (
                                                                    <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                                                                ) : (
                                                                    <div className="w-3.5 h-3.5 rounded border border-muted-foreground/40 shrink-0" />
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-semibold leading-tight">{p.nombre}</span>
                                                            {p.descripcion && (
                                                                <span className="text-[10px] text-muted-foreground line-clamp-1">
                                                                    {p.descripcion}
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="pt-3 flex justify-end gap-3 border-t">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {editingRol ? 'Guardar Cambios' : 'Crear Rol de Seguridad'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default RolesPage;
