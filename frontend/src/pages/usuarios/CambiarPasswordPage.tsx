import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { userService } from '../../api/userService';
import { useAuth } from '../../context/AuthContext';
import { 
    KeyRound, Lock, Eye, EyeOff, Save, X, 
    ArrowLeft, ShieldCheck, UserCheck, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';

const CambiarPasswordPage: React.FC = () => {
    const { user } = useAuth();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const changePasswordMutation = useMutation({
        mutationFn: userService.cambiarPassword,
        onSuccess: () => {
            toast.success('¡Contraseña actualizada con éxito!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        },
        onError: (error: any) => {
            const message = error.response?.data?.message || 'Error al cambiar la contraseña';
            toast.error(message);
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword) {
            toast.error('Debe ingresar su contraseña actual');
            return;
        }

        if (newPassword.length < 4) {
            toast.error('La nueva contraseña debe tener al menos 4 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('La nueva contraseña y su confirmación no coinciden');
            return;
        }

        changePasswordMutation.mutate({
            currentPassword,
            newPassword
        });
    };

    const handleReset = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <Link 
                        to="/dashboard" 
                        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors mb-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Inicio
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-primary flex items-center gap-2">
                        <KeyRound className="w-8 h-8 text-primary/80" />
                        Cambiar Contraseña
                    </h1>
                    <p className="text-muted-foreground italic">
                        Actualiza la clave de acceso de tu cuenta de usuario en el sistema.
                    </p>
                </div>
            </div>

            {/* Current Account Information Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground">
                            {user?.persona ? `${user.persona.nombres} ${user.persona.apellidos}` : user?.username || 'Usuario'}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                            {user?.email || 'Sin correo'} • <span className="text-primary font-medium">{user?.roles?.[0]?.nombre || 'Usuario'}</span>
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border text-xs text-muted-foreground font-medium">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    Sesión Activa
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-card border rounded-xl shadow-xs overflow-hidden">
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-5">
                        {/* Contraseña Actual */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground flex items-center justify-between">
                                <span>Contraseña Actual <span className="text-destructive">*</span></span>
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Ingresa tu contraseña actual"
                                    className="w-full pl-10 pr-10 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrent(!showCurrent)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>

                        <div className="h-px bg-border/60 my-2" />

                        {/* Nueva Contraseña */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">
                                Nueva Contraseña <span className="text-destructive">*</span>
                            </label>
                            <div className="relative group">
                                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mínimo 4 caracteres"
                                    className="w-full pl-10 pr-10 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                    minLength={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar Nueva Contraseña */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-foreground">
                                Confirmar Nueva Contraseña <span className="text-destructive">*</span>
                            </label>
                            <div className="relative group">
                                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Vuelve a escribir la nueva contraseña"
                                    className="w-full pl-10 pr-10 py-2.5 border rounded-lg bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50 text-sm"
                                    required
                                    minLength={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                    tabIndex={-1}
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                                </button>
                            </div>
                        </div>

                        {/* Security notice */}
                        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border text-xs text-muted-foreground">
                            <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                            <span>
                                Asegúrate de elegir una contraseña segura que puedas recordar. Al guardar los cambios, tu sesión continuará activa normalmente con la nueva clave.
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={changePasswordMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2.5 border rounded-lg text-sm font-semibold hover:bg-accent hover:scale-[1.02] active:scale-95 transition-all shadow-xs disabled:opacity-50"
                        >
                            <X className="w-4 h-4" /> Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={changePasswordMutation.isPending}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all shadow-sm disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" /> 
                            {changePasswordMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CambiarPasswordPage;
