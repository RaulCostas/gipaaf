import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import React, { useState, useMemo } from 'react';
import { 
    Users, Building2, Map, Package, ShoppingCart, ShoppingBag, 
    FileText, FileSpreadsheet, Menu, LogOut, Sun, Moon, MapPin, 
    Receipt, Calculator, Settings, X, Home, Boxes, Wallet, Undo2, 
    Briefcase, UserCircle, Shield, Key, History, ArrowLeftRight, PieChart, DollarSign,
    Tag, TrendingUp, MessageSquare, KeyRound, Lock
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCiudades } from '../api/ciudadService';
import { sucursalService } from '../api/sucursalService';
import { useFilters } from '../context/FilterContext';

const MainLayout: React.FC = () => {
    const { logout, user, isAdmin, hasPermission } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        selectedCiudad, 
        setSelectedCiudad, 
        selectedSucursal, 
        setSelectedSucursal,
        userSucursal,
        userCiudad,
        isRestrictedToBranch
    } = useFilters();
    
    // Sidebar is open by default on desktop, closed by default on mobile
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);

    React.useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close sidebar on mobile when route changes
    React.useEffect(() => {
        if (window.innerWidth < 768) {
            setSidebarOpen(false);
        }
    }, [location.pathname]);

    const { data: ciudades } = useQuery({
        queryKey: ['ciudades'],
        queryFn: getCiudades
    });

    const { data: sucursales } = useQuery({
        queryKey: ['sucursales'],
        queryFn: sucursalService.getAll
    });

    const filteredSucursales = useMemo(() => {
        if (!sucursales) return [];
        const activeOnly = sucursales.filter(s => s.activo !== false);
        if (!selectedCiudad) return activeOnly;
        return activeOnly.filter(s => s.ciudad?.id === Number(selectedCiudad));
    }, [sucursales, selectedCiudad]);

    const [isDark, setIsDark] = React.useState(() => {
        return localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    React.useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const renderSidebarLink = (to: string, Icon: any, label: string) => {
        const isActive = location.pathname.startsWith(to);
        return (
            <Link 
                key={to}
                to={to} 
                className={`
                    flex items-center p-2.5 rounded-lg transition-all text-sm font-medium
                    ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-muted-foreground hover:text-foreground'}
                    ${!sidebarOpen ? 'justify-center md:px-0' : 'gap-3'}
                `}
                title={!sidebarOpen ? label : undefined}
            >
                <Icon className={`shrink-0 ${isActive ? 'text-primary' : ''} ${!sidebarOpen ? 'w-5 h-5' : 'w-4 h-4'}`} />
                <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${sidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden md:block md:w-0'}`}>
                    {label}
                </span>
            </Link>
        );
    };

    const renderSidebarSection = (title: string) => (
        <div key={title} className={`
            pt-4 pb-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-widest whitespace-nowrap overflow-hidden transition-all duration-300
            ${sidebarOpen ? 'opacity-100' : 'opacity-0 h-0 pt-0 pb-0 md:h-0'}
        `}>
            {title}
        </div>
    );

    const navSections = [
        {
            title: "Existencias (Stock)",
            items: [
                { path: "/productos", icon: Package, label: "Productos", perm: "PRODUCTOS" },
                { path: "/inventario", icon: Boxes, label: "Existencias (Stock)", perm: "INVENTARIO" },
                { path: "/traspasos", icon: ArrowLeftRight, label: "Traspasos entre Sucursales", perm: "TRASPASOS" },
                { path: "/movimientos", icon: History, label: "Movimientos (Historial)", perm: "MOVIMIENTOS" },
            ]
        },
        {
            title: "Operaciones",
            items: [
                { path: "/proformas", icon: Calculator, label: "Proformas", perm: "PROFORMAS" },
                { path: "/ventas", icon: ShoppingCart, label: "Ventas", perm: "VENTAS" },
                { path: "/cobranzas", icon: Wallet, label: "Cobranzas", perm: "COBRANZAS" },
                { path: "/estado-cuentas-clientes", icon: FileText, label: "Est. Cuentas Clientes", perm: "ESTADO_CUENTAS_CLIENTES" },
                { path: "/compras", icon: ShoppingBag, label: "Compras", perm: "COMPRAS" },
                { path: "/pagos-proveedores", icon: Receipt, label: "Pagos Proveedores", perm: "PAGOS_PROVEEDORES" },
                { path: "/estado-cuentas-proveedores", icon: FileSpreadsheet, label: "Est. Cuentas Proveedores", perm: "ESTADO_CUENTAS_PROVEEDORES" },
                { path: "/egresos", icon: DollarSign, label: "Egresos Diarios", perm: "EGRESOS" },
                { path: "/devoluciones", icon: Undo2, label: "Devoluciones", perm: "DEVOLUCIONES" },
                { path: "/muestras", icon: Tag, label: "Muestras", perm: "MUESTRAS" },
            ]
        },
        {
            title: "Contactos",
            items: [
                { path: "/clientes", icon: Users, label: "Clientes", perm: "CLIENTES" },
                { path: "/proveedores", icon: UserCircle, label: "Proveedores", perm: "PROVEEDORES" },
                { path: "/personal", icon: Briefcase, label: "Personal", perm: "PERSONAL" },
                { path: "/rutas", icon: Map, label: "Rutas de Venta", perm: "RUTAS" },
            ]
        },
        {
            title: "Reportes",
            items: [
                { path: "/reportes", icon: PieChart, label: "Reportes", perm: "REPORTES" },
            ]
        },
        {
            title: "Utilidades",
            items: [
                { path: "/utilidades", icon: TrendingUp, label: "Utilidades", perm: "UTILIDADES" },
            ]
        },
        {
            title: "Configuración",
            items: [
                { path: "/configuracion", icon: Settings, label: "Ajustes Generales", perm: "CONFIGURACION" },
                { path: "/whatsapp", icon: MessageSquare, label: "Chatbot WhatsApp", perm: "WHATSAPP" },
            ]
        },
        {
            title: "Seguridad",
            items: [
                { path: "/usuarios", icon: Shield, label: "Usuarios", perm: "USUARIOS" },
                { path: "/roles", icon: Key, label: "Roles", perm: "ROLES" },
                { path: "/cambiar-password", icon: KeyRound, label: "Cambiar Contraseña", perm: "" },
            ]
        },
    ];

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* Sidebar Overlay on mobile */}
            {sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden" 
                    onClick={() => setSidebarOpen(false)} 
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed md:static inset-y-0 left-0 z-30
                border-r bg-card flex flex-col transition-all duration-300 ease-in-out shrink-0
                ${sidebarOpen ? 'w-64 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-16'}
            `}>
                <div className="p-4 border-b flex justify-between items-center h-16 shrink-0 overflow-hidden">
                    <div className={`flex items-center ${sidebarOpen ? 'gap-2' : 'justify-center w-full'} overflow-hidden`}>
                        <img 
                            src="/icono.png" 
                            alt="Logo GIPAAF" 
                            className={`shrink-0 object-contain transition-all duration-300 ${sidebarOpen ? 'w-8 h-8' : 'w-7 h-7'}`} 
                        />
                        <h1 className={`font-black tracking-tight text-red-600 dark:text-red-500 transition-all duration-300 ${sidebarOpen ? 'text-xl opacity-100' : 'text-sm opacity-0 hidden'}`}>
                            GIPAAF
                        </h1>
                    </div>
                    <button className="md:hidden shrink-0" onClick={() => setSidebarOpen(false)}>
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>
                
                <nav className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar py-4 space-y-1 ${sidebarOpen ? 'px-4' : 'px-2'}`}>
                    {renderSidebarLink("/dashboard", Home, "Inicio")}
                    
                    {navSections.map(section => {
                        const visibleItems = section.items.filter(item => !item.perm || isAdmin || hasPermission(item.perm));
                        if (visibleItems.length === 0) return null;
                        return (
                            <React.Fragment key={section.title}>
                                {renderSidebarSection(section.title)}
                                {visibleItems.map(item => renderSidebarLink(item.path, item.icon, item.label))}
                            </React.Fragment>
                        );
                    })}
                </nav>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
                {/* Header */}
                <header className="h-16 border-b bg-card flex items-center justify-between px-4 md:px-6 shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <button 
                            className="p-2 -ml-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-md transition-colors"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            title={sidebarOpen ? "Colapsar menú" : "Expandir menú"}
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        {isRestrictedToBranch ? (
                            <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-lg text-xs font-semibold ml-2 shadow-xs">
                                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                <span>{userSucursal?.nombre} {userCiudad?.nombre ? `(${userCiudad.nombre})` : ''}</span>
                                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                    <Lock className="w-2.5 h-2.5" /> Fija
                                </span>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 hidden lg:flex ml-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded hidden xl:block">Ciudad</span>
                                    <div className="relative group">
                                        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                        <select 
                                            className="text-sm bg-background border rounded-md pl-9 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 font-medium w-48 truncate transition-all cursor-pointer"
                                            value={selectedCiudad}
                                            onChange={(e) => {
                                                setSelectedCiudad(e.target.value);
                                                setSelectedSucursal('');
                                            }}
                                        >
                                            <option value="">Todas las Ciudades</option>
                                            {ciudades?.map(c => (
                                                <option key={c.id} value={c.id}>{c.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 hidden sm:flex">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded hidden xl:block">Sucursal</span>
                                    <div className="relative group">
                                        <Building2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                        <select 
                                            className="text-sm bg-background border rounded-md pl-9 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20 hover:border-primary/50 font-medium w-48 truncate transition-all cursor-pointer disabled:opacity-50"
                                            value={selectedSucursal}
                                            onChange={(e) => setSelectedSucursal(e.target.value)}
                                            disabled={!selectedCiudad}
                                        >
                                            <option value="">Todas las Sucursales</option>
                                            {filteredSucursales?.map(s => (
                                                <option key={s.id} value={s.id}>{s.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {(selectedCiudad || selectedSucursal) && (
                                    <button
                                        onClick={() => {
                                            setSelectedCiudad('');
                                            setSelectedSucursal('');
                                        }}
                                        className="text-xs text-primary font-bold hover:underline hidden sm:block ml-1 cursor-pointer"
                                    >
                                        Limpiar Filtros
                                    </button>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right Header Options */}
                    <div className="flex items-center gap-1 sm:gap-2">
                        <Link
                            to="/dashboard"
                            className="p-2 text-muted-foreground hover:bg-accent hover:text-primary rounded-lg transition-colors flex items-center justify-center"
                            title="Ir a Inicio"
                        >
                            <Home className="w-5 h-5" />
                        </Link>

                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 text-muted-foreground hover:bg-accent hover:text-foreground rounded-lg transition-colors"
                            title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
                        >
                            {isDark ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5" />}
                        </button>

                        <div className="flex items-center gap-3 border-l pl-3">
                            <div className="flex flex-col text-right hidden sm:block">
                                <span className="text-sm font-bold leading-tight">
                                    {user?.personal ? `${user.personal.nombres} ${user.personal.apellidos || ''}`.trim() : (user?.persona ? `${user.persona.nombres} ${user.persona.apellidos || ''}`.trim() : (user?.username || 'Usuario'))}
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                                    {user?.personal?.cargo || user?.roles?.map((r: any) => typeof r === 'string' ? r : r.nombre).join(', ') || 'Sin Rol'}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-sm font-semibold text-red-600 bg-red-500/10 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
                                title="Cerrar Sesión"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Salir</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/20 custom-scrollbar">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
