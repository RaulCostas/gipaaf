import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import apiClient from '../api/apiClient';

interface AuthContextType {
    user: any | null;
    token: string | null;
    login: (data: { access_token: string, usuario: any }) => void;
    logout: () => void;
    refreshProfile: () => Promise<void>;
    isAuthenticated: boolean;
    loading: boolean;
    isAdmin: boolean;
    isVendedor: boolean;
    isJefeVentas: boolean;
    userPersonal: any | null;
    hasPermission: (recurso: string) => boolean;
    hasAction: (recurso: string, accion: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<any | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        try {
            const savedToken = localStorage.getItem('access_token');
            if (!savedToken) return;
            const res = await apiClient.get('/auth/perfil');
            if (res.data) {
                setUser(res.data);
                localStorage.setItem('user', JSON.stringify(res.data));
            }
        } catch (e) {
            console.error('Error refreshing profile:', e);
        }
    };

    useEffect(() => {
        const savedToken = localStorage.getItem('access_token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser && savedUser !== 'undefined') {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
                refreshProfile();
            } catch (e) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('user');
            }
        } else if (savedUser === 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
        }
        setLoading(false);
    }, []);

    const login = (data: { access_token: string, usuario: any }) => {
        localStorage.setItem('access_token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.usuario));
        setToken(data.access_token);
        setUser(data.usuario);
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const isAdmin = useMemo(() => {
        if (!user || !user.roles) return false;
        return user.roles.some((r: any) => 
            (typeof r === 'string' && r.toUpperCase() === 'ADMIN') ||
            (typeof r === 'object' && r.nombre && r.nombre.toUpperCase() === 'ADMIN')
        );
    }, [user]);

    const isVendedor = useMemo(() => {
        if (!user) return false;
        const hasVendorRole = user.roles?.some((r: any) => 
            (typeof r === 'string' && r.toUpperCase().includes('VENDEDOR')) ||
            (typeof r === 'object' && r.nombre && r.nombre.toUpperCase().includes('VENDEDOR'))
        );
        const hasVendorCargo = user.personal?.cargo === 'VENDEDOR';
        return hasVendorRole || hasVendorCargo;
    }, [user]);

    const isJefeVentas = useMemo(() => {
        if (!user) return false;
        return user.roles?.some((r: any) => 
            (typeof r === 'string' && r.toUpperCase().includes('JEFE')) ||
            (typeof r === 'object' && r.nombre && r.nombre.toUpperCase().includes('JEFE'))
        ) || user.personal?.cargo === 'JEFE_VENTAS';
    }, [user]);

    const userPersonal = useMemo(() => {
        return user?.personal || null;
    }, [user]);

    const hasPermission = (recurso: string): boolean => {
        if (isAdmin) return true;
        if (!user || !user.roles) return false;
        const target = recurso.toUpperCase();
        
        return user.roles.some((r: any) => {
            if (!r || !r.permisos || !Array.isArray(r.permisos)) return false;
            return r.permisos.some((p: any) => 
                (p.recurso && p.recurso.toUpperCase() === target) ||
                (p.nombre && p.nombre.toUpperCase().includes(target))
            );
        });
    };

    const hasAction = (recurso: string, accion: string): boolean => {
        if (isAdmin) return true;
        if (!user || !user.roles) return false;
        const targetRecurso = recurso.toUpperCase();
        const targetAccion = accion.toUpperCase();

        return user.roles.some((r: any) => {
            if (!r || !r.permisos || !Array.isArray(r.permisos)) return false;
            return r.permisos.some((p: any) => 
                (p.recurso && p.recurso.toUpperCase() === targetRecurso) &&
                (p.accion && p.accion.toUpperCase() === targetAccion)
            );
        });
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            token, 
            login, 
            logout, 
            refreshProfile,
            isAuthenticated: !!token, 
            loading,
            isAdmin,
            isVendedor,
            isJefeVentas,
            userPersonal,
            hasPermission,
            hasAction
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
