import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="h-screen w-screen flex items-center justify-center text-muted-foreground animate-pulse">Cargando sistema...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export const RequirePermission: React.FC<{ recurso: string; children: React.ReactNode }> = ({ recurso, children }) => {
    const { isAdmin, hasPermission, loading } = useAuth();

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Verificando permisos...</div>;
    }

    if (!isAdmin && !hasPermission(recurso)) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center">
                    <ShieldAlert className="w-8 h-8" />
                </div>
                <div className="space-y-1 max-w-md">
                    <h2 className="text-xl font-bold text-foreground">Acceso Restringido</h2>
                    <p className="text-sm text-muted-foreground">
                        Tu perfil de usuario no cuenta con los permisos necesarios para acceder al módulo de <span className="font-semibold text-primary uppercase">[{recurso}]</span>.
                    </p>
                </div>
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all shadow-md"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al Inicio
                </Link>
            </div>
        );
    }

    return <>{children}</>;
};
