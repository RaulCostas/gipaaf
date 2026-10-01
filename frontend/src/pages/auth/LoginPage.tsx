import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/apiClient';
import { userService } from '../../api/userService';
import { Mail, Lock, LogIn, ArrowRight, KeyRound, X, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Forgot password states
    const [showForgot, setShowForgot] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
    const [forgotError, setForgotError] = useState<string | null>(null);

    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    React.useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
        
        // Ensure theme is applied even if we load directly into the login page
        const isDark = localStorage.getItem('theme') === 'dark' || 
               (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isAuthenticated, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            login(response.data);
            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setForgotError(null);
        setForgotSuccess(null);
        setForgotLoading(true);

        try {
            const res = await userService.forgotPassword(forgotEmail);
            setForgotSuccess(res.message || 'Se ha enviado una contraseña temporal a tu correo electrónico.');
        } catch (err: any) {
            setForgotError(err?.response?.data?.message || 'Error al procesar la recuperación de contraseña.');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-background font-sans">
            {/* Left side - Banner / Branding (hidden on mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-primary/5 flex-col items-center justify-center border-r border-border/50">
                <div className="absolute inset-0 overflow-hidden">
                    {/* Background decorative elements */}
                    <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/10 blur-3xl"></div>
                    <div className="absolute top-[60%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-3xl"></div>
                </div>
                
                <div className="relative z-10 flex flex-col items-center justify-center p-12 text-center max-w-lg">
                    <div className="bg-card p-4 rounded-3xl shadow-xl mb-8 border border-border/50">
                        <img src="/logo.jpeg" alt="Logo Principal" className="w-32 h-32 object-contain rounded-xl" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-red-600 dark:text-red-500 mb-4">GIPAAF</h1>
                    <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                        Sistema integral de gestión de inventarios, proformas, almacenes y facturación.
                    </p>
                </div>
            </div>

            {/* Right side - Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
                {/* Mobile decorative background */}
                <div className="absolute inset-0 overflow-hidden lg:hidden">
                    <div className="absolute -top-[30%] -right-[20%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl"></div>
                </div>

                <div className="w-full max-w-md space-y-8 relative z-10">
                    <div className="text-center lg:text-left">
                        {/* Show icon on mobile only */}
                        <img src="/icono.png" alt="Icono" className="w-16 h-16 mx-auto lg:hidden mb-6 object-contain" />
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">¡Bienvenido!</h2>
                        <p className="text-sm text-muted-foreground mt-2">
                            Ingresa tus credenciales para acceder a tu cuenta
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 mt-8">
                        {error && (
                            <div className="p-4 text-sm bg-destructive/10 text-destructive rounded-xl border border-destructive/20 flex items-start gap-3">
                                <div className="mt-0.5 font-bold">Error</div>
                                <div className="flex-1">{error}</div>
                            </div>
                        )}
                        
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-foreground">Correo Electrónico</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="email"
                                        placeholder="usuario@ejemplo.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-11 p-3 border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-semibold text-foreground">Contraseña</label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowForgot(true);
                                            setForgotEmail(email);
                                            setForgotSuccess(null);
                                            setForgotError(null);
                                        }}
                                        className="text-xs font-semibold text-primary hover:underline cursor-pointer bg-transparent border-none"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-11 p-3 border rounded-xl bg-background focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 px-4 bg-primary text-primary-foreground rounded-xl hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></span>
                                    Validando...
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Iniciar Sesión
                                    <ArrowRight className="w-5 h-5 ml-1 opacity-70" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>

            {/* Modal de Recuperación de Contraseña */}
            {showForgot && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card border p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl relative">
                        <button
                            onClick={() => setShowForgot(false)}
                            className="absolute top-5 right-5 p-1.5 text-muted-foreground hover:bg-accent rounded-full transition-colors cursor-pointer"
                            title="Cerrar"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center mb-6">
                            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-3 border border-primary/20 shadow-inner">
                                <KeyRound className="w-7 h-7" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground tracking-tight">Recuperar Contraseña</h3>
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                Ingresa tu correo electrónico registrado. Te enviaremos una <strong>contraseña temporal</strong> para que puedas acceder al sistema.
                            </p>
                        </div>

                        {forgotSuccess ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                                    <div className="text-xs leading-relaxed font-medium">
                                        {forgotSuccess}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowForgot(false);
                                        setForgotSuccess(null);
                                    }}
                                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 transition-all cursor-pointer text-sm"
                                >
                                    Volver al Inicio de Sesión
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotSubmit} className="space-y-4">
                                {forgotError && (
                                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-xl flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                                        <div className="flex-1">{forgotError}</div>
                                    </div>
                                )}

                                <div className="space-y-1.5 text-left">
                                    <label className="text-xs font-bold text-muted-foreground uppercase">Correo Electrónico</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                        <input
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="ejemplo@correo.com"
                                            required
                                            className="w-full pl-10 pr-3 py-2.5 bg-background border rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all hover:border-primary/50"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-2">
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl shadow-md hover:opacity-90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
                                    >
                                        {forgotLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Enviando correo...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-4 h-4" />
                                                Enviar Contraseña Temporal
                                            </>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        disabled={forgotLoading}
                                        onClick={() => setShowForgot(false)}
                                        className="w-full py-2.5 bg-accent hover:bg-accent/80 text-foreground font-medium rounded-xl text-xs transition-colors cursor-pointer"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginPage;
