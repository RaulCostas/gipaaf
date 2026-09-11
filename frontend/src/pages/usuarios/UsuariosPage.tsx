import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, roleService } from '../../api/userService';
import type { Usuario } from '../../api/userService';
import { sucursalService } from '../../api/sucursalService';
import { personalService } from '../../api/personalService';
import Modal from '../../components/ui/Modal';
import { 
    Users, UserPlus, Pencil, Trash2, Search, CheckCircle2, 
    Shield, Building2, Mail, Phone, BadgeCheck, AtSign, 
    Key, User, CreditCard, MapPin, X, Briefcase, UserCheck
} from 'lucide-react';
import { toast } from 'sonner';

const UsuariosPage: React.FC = () => {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
    const [search, setSearch] = useState('');

    const [formNombres, setFormNombres] = useState('');
    const [formApellidos, setFormApellidos] = useState('');
    const [formCi, setFormCi] = useState('');
    const [formTelefono, setFormTelefono] = useState('');
    const [formDireccion, setFormDireccion] = useState('');
    const [formSucursalId, setFormSucursalId] = useState('');
    const [selectedPersonalId, setSelectedPersonalId] = useState('');

    const { data: users, isLoading: loadingUsers } = useQuery({
        queryKey: ['users'],
        queryFn: userService.getAll,
    });

    const { data: roles } = useQuery({
        queryKey: ['roles'],
        queryFn: roleService.getAll,
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll,
    });

    const { data: personalList } = useQuery({
        queryKey: ['personal'],
        queryFn: personalService.getAll,
    });

    // Only show personal not linked to other users (or currently linked to this user being edited)
    const availablePersonal = useMemo(() => {
        if (!personalList) return [];
        const linkedPersonalIds = new Set(
            users
                ?.filter(u => u.personal?.id && (!editingUsuario || u.id !== editingUsuario.id))
                .map(u => u.personal!.id) || []
        );

        return personalList.filter(p => {
            const isCurrentlyLinked = editingUsuario?.personal?.id === p.id;
            if (!p.activo && !isCurrentlyLinked) return false;
            return !linkedPersonalIds.has(p.id);
        });
    }, [personalList, users, editingUsuario]);

    const createMutation = useMutation({
        mutationFn: userService.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            toast.success('Usuario creado exitosamente');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Error al crear usuario');
        },
    });

    const updateMutation = useMutation({
        mutationFn: (data: { id: number; user: any }) =>
            userService.update(data.id, data.user),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            setIsModalOpen(false);
            toast.success('Usuario actualizado correctamente');
        },
        onError: (err: any) => {
            toast.error(err?.response?.data?.message || 'Error al actualizar usuario');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: userService.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
            toast.success('Usuario eliminado');
        },
        onError: () => {
            toast.error('Error al eliminar usuario');
        },
    });

    const handleOpenCreate = () => {
        setEditingUsuario(null);
        setSelectedPersonalId('');
        setFormNombres('');
        setFormApellidos('');
        setFormCi('');
        setFormTelefono('');
        setFormDireccion('');
        setFormSucursalId('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (u: Usuario) => {
        setEditingUsuario(u);
        setSelectedPersonalId(u.personal?.id ? String(u.personal.id) : '');
        setFormNombres(u.persona?.nombres || '');
        setFormApellidos(u.persona?.apellidos || '');
        setFormCi(u.persona?.ci || '');
        setFormTelefono(u.persona?.telefono || '');
        setFormDireccion(u.persona?.direccion || '');
        setFormSucursalId(u.sucursal?.id ? String(u.sucursal.id) : '');
        setIsModalOpen(true);
    };

    const handlePersonalSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedPersonalId(val);
        if (val) {
            const found = personalList?.find(p => p.id === Number(val));
            if (found) {
                setFormNombres(found.nombres || '');
                setFormApellidos(found.apellidos || '');
                setFormCi(found.ci || '');
                setFormTelefono(found.telefono || '');
                setFormDireccion(found.direccion || '');
                if (found.sucursal?.id) {
                    setFormSucursalId(String(found.sucursal.id));
                }
            }
        }
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const rolesIds = formData.getAll('roles').map(id => ({ id: Number(id) }));

        const sucursalIdVal = formSucursalId || formData.get('sucursalId');

        const userData: any = {
            username: (formData.get('username') as string)?.trim(),
            email: (formData.get('email') as string)?.trim().toLowerCase(),
            activo: formData.get('activo') === 'on',
            sucursal: sucursalIdVal ? { id: Number(sucursalIdVal) } : null,
            personal: selectedPersonalId ? { id: Number(selectedPersonalId) } : null,
            roles: rolesIds,
            persona: {
                nombres: formNombres.trim(),
                apellidos: formApellidos.trim(),
                ci: formCi.trim(),
                telefono: formTelefono.trim(),
                direccion: formDireccion.trim(),
                email: (formData.get('email') as string)?.trim().toLowerCase() || '',
            }
        };

        const password = formData.get('password') as string;
        if (password && password.trim()) {
            userData.password = password.trim();
        }

        if (editingUsuario) {
            updateMutation.mutate({ id: editingUsuario.id, user: userData });
        } else {
            createMutation.mutate(userData);
        }
    };

    const handleDelete = (id: number) => {
        if (window.confirm('¿Está seguro de eliminar este usuario?')) {
            deleteMutation.mutate(id);
        }
    };

    if (loadingUsers) return <div className="p-6 text-center text-muted-foreground animate-pulse">Cargando usuarios...</div>;

    const filteredUsers = users?.filter(u => {
        const s = search.toLowerCase();
        const usernameMatch = (u.username || '').toLowerCase().includes(s);
        const nombresMatch = (u.persona?.nombres || '').toLowerCase().includes(s);
        const apellidosMatch = (u.persona?.apellidos || '').toLowerCase().includes(s);
        const emailMatch = (u.email || '').toLowerCase().includes(s);
        const personalMatch = u.personal && `${u.personal.nombres} ${u.personal.apellidos}`.toLowerCase().includes(s);
        return usernameMatch || nombresMatch || apellidosMatch || emailMatch || personalMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <Users className="w-8 h-8 text-primary/80" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-muted-foreground italic">Administre las cuentas de acceso y perfiles del personal.</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                >
                    <UserPlus className="w-4 h-4" />
                    Nuevo Usuario
                </button>
            </div>

            <div className="bg-card p-4 rounded-xl border shadow-sm flex items-center gap-3">
                <Search className="w-5 h-5 text-muted-foreground" />
                <input 
                    type="text" 
                    placeholder="Buscar por usuario, nombre, email o personal vinculado..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none w-full text-sm placeholder:text-muted-foreground/70"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredUsers?.map((u) => {
                    const fullName = u.persona ? `${u.persona.nombres || ''} ${u.persona.apellidos || ''}`.trim() : 'Sin Nombre';
                    const initials = fullName !== 'Sin Nombre' 
                        ? `${u.persona?.nombres?.[0] || ''}${u.persona?.apellidos?.[0] || ''}` 
                        : u.username.substring(0, 2);
                    const hasAdminRole = u.roles?.some(r => r.nombre.toUpperCase() === 'ADMIN');

                    return (
                        <div key={u.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
                            {!u.activo && (
                                <div className="absolute top-4 right-4 text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full uppercase">
                                    Inactivo
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-4 mb-4">
                                    <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20 select-none uppercase font-black text-lg">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base truncate flex items-center gap-1.5 leading-none mb-1 text-foreground" title={fullName}>
                                            {fullName}
                                            {hasAdminRole && <BadgeCheck className="w-4 h-4 text-indigo-500 shrink-0" />}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <span className="bg-accent px-1.5 py-0.5 rounded font-mono">@{u.username}</span>
                                            <span className="truncate flex items-center gap-1">
                                                <Building2 className="w-3 h-3" />
                                                {u.sucursal?.nombre || 'General'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                                    <div className="flex items-center gap-2 truncate" title={u.email}>
                                        <Mail className="w-3.5 h-3.5 shrink-0" /> {u.email}
                                    </div>
                                    <div className="flex items-center gap-2 italic">
                                        <Phone className="w-3.5 h-3.5 shrink-0" /> {u.persona?.telefono || 'Sin celular'}
                                    </div>
                                    {u.personal && (
                                        <div className="flex items-center gap-1 text-[11px] text-primary/90 font-semibold bg-primary/5 px-2 py-1 rounded-md border border-primary/10 mt-1" title="Personal / Empleado Vinculado">
                                            <Briefcase className="w-3 h-3 shrink-0 text-primary" />
                                            <span className="truncate">Personal: {u.personal.nombres} {u.personal.apellidos} ({u.personal.cargo})</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-3 pt-3 border-t">
                                <div className="flex flex-wrap gap-1.5">
                                    {u.roles?.map(r => (
                                        <span key={r.id} className="px-2 py-1 bg-primary/10 text-primary text-[10px] rounded-lg font-bold uppercase tracking-tight flex items-center gap-1 border border-primary/20">
                                            <Shield className="w-2.5 h-2.5" />
                                            {r.nombre}
                                        </span>
                                    ))}
                                    {(!u.roles || u.roles.length === 0) && (
                                        <span className="text-[10px] text-muted-foreground italic">Sin rol asignado</span>
                                    )}
                                </div>

                                <div className="flex justify-end gap-1 pt-1">
                                    <button 
                                        onClick={() => handleOpenEdit(u)} 
                                        className="p-2 hover:bg-accent rounded-lg text-muted-foreground hover:text-primary transition-colors"
                                        title="Editar Usuario"
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(u.id)} 
                                        className="p-2 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                                        title="Eliminar Usuario"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={
                    <span className="flex items-center gap-2 text-primary font-bold">
                        <Users className="w-6 h-6 text-primary/80" />
                        {editingUsuario ? `Editar Perfil: ${editingUsuario.username}` : 'Crear Nueva Cuenta de Usuario'}
                    </span>
                }
                className="max-w-3xl"
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="p-3.5 border rounded-xl bg-primary/5 border-primary/20 space-y-1.5">
                        <label className="text-xs font-bold uppercase text-primary tracking-wider flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-primary" /> Vincular con Ficha de Personal (Empleado)
                        </label>
                        <select
                            value={selectedPersonalId}
                            onChange={handlePersonalSelectChange}
                            className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <option value="">-- Sin Vincular / Usuario Independiente --</option>
                            {availablePersonal.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.nombres} {p.apellidos} ({p.cargo}) - CI: {p.ci || 'S/N'}{p.sucursal?.nombre ? ` - ${p.sucursal.nombre}` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-muted-foreground">
                            Al vincular, este usuario quedará identificado con su ficha de personal y se auto-completarán sus datos. Si tiene cargo <b>VENDEDOR</b>, operará únicamente con sus propias ventas y clientes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold border-b pb-1.5 uppercase tracking-widest text-primary flex items-center gap-1.5">
                                <Key className="w-3.5 h-3.5" /> Credenciales de Acceso
                            </h3>
                            <div className="space-y-3">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Email / Correo <span className="text-destructive">*</span></label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input 
                                            name="email" 
                                            type="email" 
                                            defaultValue={editingUsuario?.email} 
                                            required 
                                            className="w-full pl-10 pr-3 py-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                            placeholder="correo@empresa.com" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Nombre de Usuario <span className="text-destructive">*</span></label>
                                    <div className="relative group">
                                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input 
                                            name="username" 
                                            defaultValue={editingUsuario?.username} 
                                            required 
                                            className="w-full pl-10 pr-3 py-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                            placeholder="ej. santiago.costas" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">
                                        {editingUsuario ? 'Nueva Contraseña (Opcional)' : <>Contraseña <span className="text-destructive">*</span></>}
                                    </label>
                                    <div className="relative group">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input 
                                            name="password" 
                                            type="password" 
                                            required={!editingUsuario} 
                                            className="w-full pl-10 pr-3 py-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                            placeholder="••••••••" 
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 pt-1">
                                    <input 
                                        name="activo" 
                                        type="checkbox" 
                                        id="chk-activo"
                                        defaultChecked={editingUsuario ? editingUsuario.activo : true} 
                                        className="w-4 h-4 text-primary rounded cursor-pointer" 
                                    />
                                    <label htmlFor="chk-activo" className="text-xs font-medium cursor-pointer">Cuenta Activa</label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-bold border-b pb-1.5 uppercase tracking-widest text-primary flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5" /> Información Personal
                            </h3>
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Nombres <span className="text-destructive">*</span></label>
                                        <div className="relative group">
                                            <input 
                                                name="nombres" 
                                                value={formNombres}
                                                onChange={(e) => setFormNombres(e.target.value)}
                                                required 
                                                className="w-full p-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                                placeholder="Santiago" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Apellidos <span className="text-destructive">*</span></label>
                                        <div className="relative group">
                                            <input 
                                                name="apellidos" 
                                                value={formApellidos}
                                                onChange={(e) => setFormApellidos(e.target.value)}
                                                required 
                                                className="w-full p-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                                placeholder="Costas" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">C.I. / Documento</label>
                                        <div className="relative group">
                                            <input 
                                                name="ci" 
                                                value={formCi}
                                                onChange={(e) => setFormCi(e.target.value)}
                                                className="w-full p-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                                placeholder="1234567" 
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-muted-foreground uppercase">Celular</label>
                                        <div className="relative group">
                                            <input 
                                                name="telefono" 
                                                value={formTelefono}
                                                onChange={(e) => setFormTelefono(e.target.value)}
                                                className="w-full p-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                                placeholder="70000000" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Dirección</label>
                                    <div className="relative group">
                                        <input 
                                            name="direccion" 
                                            value={formDireccion}
                                            onChange={(e) => setFormDireccion(e.target.value)}
                                            className="w-full p-2.5 bg-background border rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50" 
                                            placeholder="Av. Principal #123" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <Shield className="w-3.5 h-3.5 text-primary" /> Roles de Acceso (Perfiles)
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {roles?.map(r => (
                                    <label key={r.id} className="group relative cursor-pointer select-none">
                                        <input
                                            name="roles"
                                            type="checkbox"
                                            value={r.id}
                                            defaultChecked={editingUsuario?.roles?.some(ur => ur.id === r.id)}
                                            className="peer absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="px-3 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-tight peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-all hover:bg-accent flex items-center gap-1.5 shadow-sm">
                                            <Shield className="w-3 h-3" />
                                            {r.nombre}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2.5">
                            <label className="text-xs font-bold uppercase text-muted-foreground tracking-wider flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-primary" /> Sucursal Asignada
                            </label>
                            <select 
                                name="sucursalId" 
                                value={formSucursalId}
                                onChange={(e) => setFormSucursalId(e.target.value)}
                                className="w-full p-2.5 bg-background border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Sin Sucursal (Acceso General)</option>
                                {sucursales?.filter(s => s.activo !== false || String(s.id) === formSucursalId).map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre}{s.ciudad?.nombre ? ` (${s.ciudad.nombre})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3 border-t mt-6">
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
                            className="px-8 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <CheckCircle2 className="w-4 h-4" />
                            {editingUsuario ? 'Actualizar Cuenta' : 'Crear Cuenta'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default UsuariosPage;
