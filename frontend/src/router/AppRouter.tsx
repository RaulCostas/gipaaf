import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, RequirePermission } from './ProtectedRoute';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProductosPage from '../pages/productos/ProductosPage';
import CategoriasPage from '../pages/categorias/CategoriasPage';
import MarcasPage from '../pages/marcas/MarcasPage';
import GruposPage from '../pages/grupos/GruposPage';
import ClientesPage from '../pages/clientes/ClientesPage';
import ProveedoresPage from '../pages/proveedores/ProveedoresPage';
import InventarioPage from '../pages/inventario/InventarioPage';
import MovimientosPage from '../pages/movimientos/MovimientosPage';
import TraspasosPage from '../pages/traspasos/TraspasosPage';
import SucursalesPage from '../pages/sucursales/SucursalesPage';
import CiudadesPage from '../pages/ciudades/CiudadesPage';
import ComprasPage from '../pages/compras/ComprasPage';
import VentasPage from '../pages/ventas/VentasPage';
import DevolucionesPage from '../pages/devoluciones/DevolucionesPage';
import MuestrasPage from '../pages/muestras/MuestrasPage';
import UsuariosPage from '../pages/usuarios/UsuariosPage';
import RolesPage from '../pages/roles/RolesPage';
import CambiarPasswordPage from '../pages/usuarios/CambiarPasswordPage';
import PersonalPage from '../pages/personal/PersonalPage';
import RutasPage from '../pages/rutas/RutasPage';
import ProformasPage from '../pages/proformas/ProformasPage';
import CobranzasPage from '../pages/cobranzas/CobranzasPage';
import PagosProveedoresPage from '../pages/pagos-proveedores/PagosProveedoresPage';
import EgresosPage from '../pages/egresos/EgresosPage';
import EstadoCuentaClientesPage from '../pages/estados-cuenta/EstadoCuentaClientesPage';
import EstadoCuentaProveedoresPage from '../pages/estados-cuenta/EstadoCuentaProveedoresPage';
import MainLayout from '../layouts/MainLayout';
import ConfiguracionPage from '../pages/configuracion/ConfiguracionPage';
import ReportesPage from '../pages/reportes/ReportesPage';
import UtilidadesPage from '../pages/utilidades/UtilidadesPage';
import WhatsAppPage from '../pages/whatsapp/WhatsAppPage';

const AppRouter: React.FC = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<LoginPage />} />

                <Route path="/" element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<Navigate to="/dashboard" replace />} />
                    <Route path="dashboard" element={<DashboardPage />} />

                    {/* Seguridad */}
                    <Route path="usuarios" element={<RequirePermission recurso="USUARIOS"><UsuariosPage /></RequirePermission>} />
                    <Route path="roles" element={<RequirePermission recurso="ROLES"><RolesPage /></RequirePermission>} />
                    <Route path="cambiar-password" element={<CambiarPasswordPage />} />

                    {/* Inventario */}
                    <Route path="productos" element={<RequirePermission recurso="PRODUCTOS"><ProductosPage /></RequirePermission>} />
                    {/* Catálogos / Configuración */}
                    <Route path="marcas" element={<RequirePermission recurso="CONFIGURACION"><MarcasPage /></RequirePermission>} />
                    <Route path="categorias" element={<RequirePermission recurso="CONFIGURACION"><CategoriasPage /></RequirePermission>} />
                    <Route path="grupos" element={<RequirePermission recurso="CONFIGURACION"><GruposPage /></RequirePermission>} />
                    <Route path="inventario" element={<RequirePermission recurso="INVENTARIO"><InventarioPage /></RequirePermission>} />
                    <Route path="movimientos" element={<RequirePermission recurso="MOVIMIENTOS"><MovimientosPage /></RequirePermission>} />
                    <Route path="traspasos" element={<RequirePermission recurso="TRASPASOS"><TraspasosPage /></RequirePermission>} />

                    {/* Operaciones */}
                    <Route path="proformas" element={<RequirePermission recurso="PROFORMAS"><ProformasPage /></RequirePermission>} />
                    <Route path="ventas" element={<RequirePermission recurso="VENTAS"><VentasPage /></RequirePermission>} />
                    <Route path="cobranzas" element={<RequirePermission recurso="COBRANZAS"><CobranzasPage /></RequirePermission>} />
                    <Route path="estado-cuentas-clientes" element={<RequirePermission recurso="ESTADO_CUENTAS_CLIENTES"><EstadoCuentaClientesPage /></RequirePermission>} />
                    <Route path="compras" element={<RequirePermission recurso="COMPRAS"><ComprasPage /></RequirePermission>} />
                    <Route path="pagos-proveedores" element={<RequirePermission recurso="PAGOS_PROVEEDORES"><PagosProveedoresPage /></RequirePermission>} />
                    <Route path="estado-cuentas-proveedores" element={<RequirePermission recurso="ESTADO_CUENTAS_PROVEEDORES"><EstadoCuentaProveedoresPage /></RequirePermission>} />
                    <Route path="egresos" element={<RequirePermission recurso="EGRESOS"><EgresosPage /></RequirePermission>} />
                    <Route path="devoluciones" element={<RequirePermission recurso="DEVOLUCIONES"><DevolucionesPage /></RequirePermission>} />
                    <Route path="muestras" element={<RequirePermission recurso="MUESTRAS"><MuestrasPage /></RequirePermission>} />

                    {/* Contactos */}
                    <Route path="clientes" element={<RequirePermission recurso="CLIENTES"><ClientesPage /></RequirePermission>} />
                    <Route path="proveedores" element={<RequirePermission recurso="PROVEEDORES"><ProveedoresPage /></RequirePermission>} />
                    <Route path="personal" element={<RequirePermission recurso="PERSONAL"><PersonalPage /></RequirePermission>} />
                    <Route path="rutas" element={<RequirePermission recurso="RUTAS"><RutasPage /></RequirePermission>} />

                    {/* Reportes */}
                    <Route path="reportes" element={<RequirePermission recurso="REPORTES"><ReportesPage /></RequirePermission>} />
                    <Route path="utilidades" element={<RequirePermission recurso="UTILIDADES"><UtilidadesPage /></RequirePermission>} />

                    {/* Configuración */}
                    <Route path="sucursales" element={<RequirePermission recurso="CONFIGURACION"><SucursalesPage /></RequirePermission>} />
                    <Route path="ciudades" element={<RequirePermission recurso="CONFIGURACION"><CiudadesPage /></RequirePermission>} />
                    <Route path="configuracion" element={<RequirePermission recurso="CONFIGURACION"><ConfiguracionPage /></RequirePermission>} />
                    <Route path="whatsapp" element={<RequirePermission recurso="WHATSAPP"><WhatsAppPage /></RequirePermission>} />

                    <Route path="*" element={<div className="p-8 text-center text-muted-foreground">404 - Página no encontrada</div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
};

export default AppRouter;
