import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleService, permissionService } from '../../api/userService';
import type { Rol, Permiso } from '../../api/userService';
import Modal from '../../components/ui/Modal';
import { 
    Shield, ShieldCheck, Plus, Pencil, Trash2, Search, CheckCircle2, 
    Lock, ListChecks, FileText, CheckSquare, Square, X,
    ShoppingCart, Users, TrendingUp, Settings, HelpCircle,
    Boxes, PieChart, Power, PowerOff, ShieldAlert, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

const SECTIONS_CONFIG = [
    {
        title: 'Existencias (Stock)',
        icon: Boxes,
        recursos: ['PRODUCTOS', 'CATALOGOS', 'INVENTARIO', 'TRASPASOS', 'MOVIMIENTOS', 'MERMAS', 'KARDEX']
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
    const [isActivo, setIsActivo] = useState(true);

    // Modal state for viewing all assigned permissions of a role
    const [viewingRolPermisos, setViewingRolPermisos] = useState<Rol | null>(null);
    const [viewingPermSearch, setViewingPermSearch] = useState('');

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

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, activo }: { id: number; activo: boolean }) =>
            roleService.update(id, { activo } as any),
        onSuccess: (_, vars) => {
            queryClient.invalidateQueries({ queryKey: ['roles'] });
            toast.success(vars.activo ? 'Rol reactivado con éxito' : 'Rol dado de baja correctamente');
        },
        onError: () => toast.error('Error al cambiar el estado del rol'),
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
        setIsActivo(rol.activo !== false);
        setSelectedPermissions(rol.permisos?.map(p => p.id) || []);
        setPermSearch('');
        setIsModalOpen(true);
    };

    const handleOpenCreate = () => {
        setEditingRol(null);
        setIsActivo(true);
        setSelectedPermissions([]);
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
            activo: isActivo,
            permisos: selectedPermissions.map(id => ({ id }))
        };

        if (editingRol) {
            updateMutation.mutate({ id: editingRol.id, rol: data as any });
        } else {
            createMutation.mutate(data as any);
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este rol de seguridad? Esta acción no se puede deshacer.')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredRoles = roles?.filter(r =>
        r.nombre.toLowerCase().includes(search.toLowerCase()) ||
        (r.descripcion || '').toLowerCase().includes(search.toLowerCase())
    );

    // Group permissions for form editor
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

    // Group permissions for the "Ver todos los permisos" modal
    const viewingGroupedSections = useMemo(() => {
        if (!viewingRolPermisos?.permisos) return [];

        const s = viewingPermSearch.toLowerCase().trim();
        const matchingPerms = s
            ? viewingRolPermisos.permisos.filter(p =>
                p.nombre.toLowerCase().includes(s) ||
                p.recurso.toLowerCase().includes(s) ||
                (p.descripcion || '').toLowerCase().includes(s)
            )
            : viewingRolPermisos.permisos;

        const sections = SECTIONS_CONFIG.map(sec => {
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

        const knownRecursos = new Set(SECTIONS_CONFIG.flatMap(sec => sec.recursos));
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
    }, [viewingRolPermisos, viewingPermSearch]);

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
                    onClick={handleOpenCreate}
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
                {filteredRoles?.map((r) => {
                    const isAdmin = r.nombre.toLowerCase() === 'admin';
                    const active = r.activo !== false;

                    return (
                        <div key={r.id} className={`bg-card border rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden ${!active ? 'opacity-75 border-dashed border-destructive/40 bg-muted/20' : ''}`}>
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isAdmin ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400' : active ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
                                            <Shield className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg uppercase tracking-tight text-foreground flex items-center gap-2">
                                                {r.nombre}
                                            </h3>
                                            <div className="mt-0.5">
                                                {active ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                                                        Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive uppercase tracking-wider">
                                                        Dado de Baja
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/60">
                                        <button 
                                            onClick={() => handleEdit(r)} 
                                            className="p-1.5 hover:bg-primary/15 rounded-lg text-muted-foreground hover:text-primary transition-colors" 
                                            title="Editar Rol y Permisos"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        {!isAdmin && (
                                            <>
                                                <button 
                                                    onClick={() => toggleStatusMutation.mutate({ id: r.id, activo: !active })} 
                                                    className={`p-1.5 rounded-lg transition-colors ${active ? 'hover:bg-amber-500/15 text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400' : 'hover:bg-emerald-500/15 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400'}`} 
                                                    title={active ? 'Dar de baja este perfil (Desactivar)' : 'Reactivar este perfil'}
                                                >
                                                    {active ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(r.id)} 
                                                    className="p-1.5 hover:bg-destructive/15 rounded-lg text-muted-foreground hover:text-destructive transition-colors" 
                                                    title="Eliminar Rol definitivamente"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 min-h-[40px]">
                                    {r.descripcion || 'Sin descripción asignada.'}
                                </p>
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                                <div 
                                    onClick={() => { setViewingRolPermisos(r); setViewingPermSearch(''); }}
                                    className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary cursor-pointer transition-colors group/hdr"
                                    title="Haga clic para ver todos los permisos de este rol"
                                >
                                    <span className="flex items-center gap-1">
                                        Permisos Asignados
                                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/hdr:opacity-100 transition-opacity" />
                                    </span>
                                    <span className="bg-primary/10 text-primary group-hover/hdr:bg-primary group-hover/hdr:text-primary-foreground px-2 py-0.5 rounded-full font-bold transition-all shadow-sm">
                                        {r.permisos?.length || 0}
                                    </span>
                                </div>
                                <div 
                                    onClick={() => { setViewingRolPermisos(r); setViewingPermSearch(''); }}
                                    className="flex flex-wrap gap-1.5 max-h-[80px] overflow-hidden cursor-pointer"
                                    title="Haga clic para ver todos los permisos de este rol"
                                >
                                    {r.permisos?.slice(0, 4).map(p => (
                                        <span key={p.id} className="px-2 py-0.5 bg-accent hover:bg-primary/15 text-[10px] rounded-md font-medium transition-colors">
                                            {p.nombre}
                                        </span>
                                    ))}
                                    {r.permisos && r.permisos.length > 4 && (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setViewingRolPermisos(r); setViewingPermSearch(''); }}
                                            className="px-2.5 py-0.5 bg-primary/15 hover:bg-primary text-primary hover:text-primary-foreground text-[10px] rounded-md font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
                                        >
                                            +{r.permisos.length - 4} más
                                        </button>
                                    )}
                                </div>
                                {!active && (
                                    <p className="text-[11px] text-destructive italic font-medium flex items-center gap-1 mt-1">
                                        <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                        Perfil inactivo: los usuarios vinculados no pueden operar.
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal de Detalle: Ver Todos los Permisos Asignados */}
            <Modal
                isOpen={viewingRolPermisos !== null}
                onClose={() => setViewingRolPermisos(null)}
                title={
                    <div className="flex items-center gap-2 text-primary font-bold">
                        <ShieldCheck className="w-6 h-6 text-primary/80" />
                        <span>Permisos Asignados: <span className="uppercase text-foreground">{viewingRolPermisos?.nombre}</span></span>
                    </div>
                }
                className="max-w-4xl"
            >
                {viewingRolPermisos && (
                    <div className="space-y-4">
                        {/* Header Info Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 border border-border/80 rounded-xl">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-base uppercase text-foreground">{viewingRolPermisos.nombre}</h3>
                                    {viewingRolPermisos.activo !== false ? (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                                            Activo
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive uppercase">
                                            Dado de Baja
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">{viewingRolPermisos.descripcion || 'Sin descripción asignada.'}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-lg border border-primary/20">
                                    {viewingRolPermisos.permisos?.length || 0} permisos activos
                                </span>
                            </div>
                        </div>

                        {/* Quick Search */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Filtrar permisos asignados (ej. mermas, ventas, traspasos)..."
                                value={viewingPermSearch}
                                onChange={(e) => setViewingPermSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 bg-muted/40 border rounded-lg text-xs outline-none focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        {/* List of Assigned Permissions Grouped by Module */}
                        <div className="max-h-[400px] overflow-y-auto px-1 py-1 space-y-4 custom-scrollbar">
                            {viewingGroupedSections.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground bg-muted/10 border border-dashed rounded-xl">
                                    No se encontraron permisos asignados con ese criterio de búsqueda.
                                </div>
                            ) : (
                                viewingGroupedSections.map(section => {
                                    const SectionIcon = section.icon;

                                    return (
                                        <div key={section.title} className="space-y-2">
                                            <div className="flex items-center justify-between py-1.5 px-3 bg-muted/60 rounded-lg border border-border/60">
                                                <div className="flex items-center gap-2">
                                                    <SectionIcon className="w-4 h-4 text-primary" />
                                                    <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                                                        {section.title}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] bg-background px-2 py-0.5 rounded-full border text-muted-foreground font-semibold">
                                                    {section.perms.length} permisos
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                                {section.perms.map(p => (
                                                    <div
                                                        key={p.id}
                                                        className="p-3 border rounded-xl bg-card border-border shadow-xs flex flex-col justify-between gap-1.5"
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary truncate">
                                                                {p.recurso}
                                                            </span>
                                                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                                        </div>
                                                        <span className="text-xs font-bold text-foreground leading-tight">{p.nombre}</span>
                                                        {p.descripcion && (
                                                            <span className="text-[11px] text-muted-foreground line-clamp-2">
                                                                {p.descripcion}
                                                            </span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer Action Buttons */}
                        <div className="pt-3 flex justify-end gap-3 border-t">
                            <button
                                type="button"
                                onClick={() => setViewingRolPermisos(null)}
                                className="px-4 py-2 border rounded-xl text-sm font-semibold hover:bg-accent transition-colors"
                            >
                                Cerrar
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const r = viewingRolPermisos;
                                    setViewingRolPermisos(null);
                                    handleEdit(r);
                                }}
                                className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Pencil className="w-4 h-4" />
                                Modificar Permisos de este Rol
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Modal Crear / Editar Rol */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Lock className="w-6 h-6 text-primary/80" />
                        {editingRol ? `Editar Rol: ${editingRol.nombre}` : 'Nuevo Perfil de Usuario (Rol)'}
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

                        {/* Estado: Activo / Inactivo */}
                        <div className="flex items-center justify-between p-3 border rounded-xl bg-muted/20 hover:border-primary/40 transition-colors sm:col-span-2">
                            <div className="space-y-0.5">
                                <label className="text-xs font-bold uppercase text-foreground">Estado del Rol (Activo / Inactivo)</label>
                                <p className="text-[11px] text-muted-foreground">
                                    {isActivo ? 'El rol está activo y disponible para asignar a los usuarios.' : 'El rol está dado de baja (los usuarios asociados no podrán utilizar sus permisos).'}
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    name="activo"
                                    className="sr-only peer"
                                    checked={isActivo}
                                    onChange={(e) => setIsActivo(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
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
                                placeholder="Filtrar permisos (ej. ventas, inventario, mermas, clientes)..."
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
