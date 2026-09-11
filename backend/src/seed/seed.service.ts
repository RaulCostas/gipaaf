import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../usuarios/usuario.entity';
import { Persona } from '../personas/persona.entity';
import { Rol } from '../roles/rol.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Permiso } from '../permisos/permiso.entity';
import * as bcrypt from 'bcryptjs';

const SYSTEM_PERMISSIONS = [
  // Existencias (Stock) & Almacenes
  { nombre: 'Ver Productos', recurso: 'PRODUCTOS', accion: 'VER', descripcion: 'Consultar catálogo de productos' },
  { nombre: 'Crear/Editar Productos', recurso: 'PRODUCTOS', accion: 'GESTIONAR', descripcion: 'Crear, modificar y actualizar precios de productos' },
  { nombre: 'Eliminar Productos', recurso: 'PRODUCTOS', accion: 'ELIMINAR', descripcion: 'Desactivar o eliminar productos' },
  { nombre: 'Gestionar Categorías, Marcas y Grupos', recurso: 'CATALOGOS', accion: 'GESTIONAR', descripcion: 'Administrar categorías, marcas y líneas' },
  { nombre: 'Ver Existencias (Stock)', recurso: 'INVENTARIO', accion: 'VER', descripcion: 'Consultar stock actual por sucursal' },
  { nombre: 'Ajustar Stock Manualmente', recurso: 'INVENTARIO', accion: 'AJUSTAR', descripcion: 'Realizar ajustes de inventario de entrada/salida' },
  { nombre: 'Gestionar Límites de Stock', recurso: 'INVENTARIO', accion: 'LIMITES', descripcion: 'Configurar niveles mínimos y máximos de stock para alertas' },
  { nombre: 'Ver Traspasos entre Sucursales', recurso: 'TRASPASOS', accion: 'VER', descripcion: 'Consultar transferencias de mercadería entre sucursales' },
  { nombre: 'Crear Traspasos entre Sucursales', recurso: 'TRASPASOS', accion: 'CREAR', descripcion: 'Registrar nuevos traspasos entre sucursales con flete' },
  { nombre: 'Anular Traspasos entre Sucursales', recurso: 'TRASPASOS', accion: 'ANULAR', descripcion: 'Anular traspasos y revertir stock' },
  { nombre: 'Ver Movimientos (Historial)', recurso: 'MOVIMIENTOS', accion: 'VER', descripcion: 'Consultar movimientos y trazabilidad de inventario' },

  // Operaciones
  { nombre: 'Ver Proformas', recurso: 'PROFORMAS', accion: 'VER', descripcion: 'Consultar listado e historial de proformas' },
  { nombre: 'Crear Proformas', recurso: 'PROFORMAS', accion: 'CREAR', descripcion: 'Generar nuevas proformas para clientes' },
  { nombre: 'Editar Proformas', recurso: 'PROFORMAS', accion: 'EDITAR', descripcion: 'Modificar proformas existentes' },
  { nombre: 'Anular Proformas', recurso: 'PROFORMAS', accion: 'ANULAR', descripcion: 'Anular proformas' },
  { nombre: 'Ver Ventas', recurso: 'VENTAS', accion: 'VER', descripcion: 'Consultar listado de notas de venta y facturación' },
  { nombre: 'Crear Ventas', recurso: 'VENTAS', accion: 'CREAR', descripcion: 'Registrar nuevas ventas de productos' },
  { nombre: 'Confirmar Ventas', recurso: 'VENTAS', accion: 'CONFIRMAR', descripcion: 'Confirmar ventas y descontar inventario' },
  { nombre: 'Anular Ventas', recurso: 'VENTAS', accion: 'ANULAR', descripcion: 'Anular ventas y restaurar existencias' },
  { nombre: 'Ver Cobranzas', recurso: 'COBRANZAS', accion: 'VER', descripcion: 'Consultar pagos recibidos de clientes' },
  { nombre: 'Registrar Cobranza', recurso: 'COBRANZAS', accion: 'CREAR', descripcion: 'Registrar abonos y pagos de ventas a crédito' },
  { nombre: 'Editar Cobranza', recurso: 'COBRANZAS', accion: 'EDITAR', descripcion: 'Modificar cobros registrados' },
  { nombre: 'Anular Cobranza', recurso: 'COBRANZAS', accion: 'ANULAR', descripcion: 'Anular cobros y restituir saldo a la venta' },
  { nombre: 'Ver Estado Cuentas Clientes', recurso: 'ESTADO_CUENTAS_CLIENTES', accion: 'VER', descripcion: 'Consultar saldos, deudas y estados de cuenta de clientes' },
  { nombre: 'Ver Compras', recurso: 'COMPRAS', accion: 'VER', descripcion: 'Consultar órdenes y notas de compra a proveedores' },
  { nombre: 'Crear Compras', recurso: 'COMPRAS', accion: 'CREAR', descripcion: 'Registrar nuevas compras de productos' },
  { nombre: 'Confirmar Compras', recurso: 'COMPRAS', accion: 'CONFIRMAR', descripcion: 'Confirmar compras e ingresar stock a almacén' },
  { nombre: 'Anular Compras', recurso: 'COMPRAS', accion: 'ANULAR', descripcion: 'Anular compras' },
  { nombre: 'Gestionar Costos de Importación', recurso: 'COMPRAS', accion: 'GESTIONAR_COSTO_IMPORTACION', descripcion: 'Registrar y modificar planilla de gastos de importación y recalcular costo de productos' },
  { nombre: 'Ver Pagos Proveedores', recurso: 'PAGOS_PROVEEDORES', accion: 'VER', descripcion: 'Consultar pagos y amortizaciones a proveedores' },
  { nombre: 'Registrar Pago Proveedor', recurso: 'PAGOS_PROVEEDORES', accion: 'CREAR', descripcion: 'Registrar pagos y amortizaciones de compras a crédito' },
  { nombre: 'Editar Pago Proveedor', recurso: 'PAGOS_PROVEEDORES', accion: 'EDITAR', descripcion: 'Modificar pagos a proveedores' },
  { nombre: 'Anular Pago Proveedor', recurso: 'PAGOS_PROVEEDORES', accion: 'ANULAR', descripcion: 'Anular pagos a proveedores' },
  { nombre: 'Ver Estado Cuentas Proveedores', recurso: 'ESTADO_CUENTAS_PROVEEDORES', accion: 'VER', descripcion: 'Consultar deudas y estados de cuenta de proveedores' },
  { nombre: 'Ver Egresos Diarios', recurso: 'EGRESOS', accion: 'VER', descripcion: 'Consultar egresos y gastos operativos diarios' },
  { nombre: 'Registrar Egreso Diario', recurso: 'EGRESOS', accion: 'CREAR', descripcion: 'Registrar nuevos egresos y gastos menores' },
  { nombre: 'Editar Egreso Diario', recurso: 'EGRESOS', accion: 'EDITAR', descripcion: 'Modificar egresos registrados' },
  { nombre: 'Anular/Eliminar Egreso Diario', recurso: 'EGRESOS', accion: 'ANULAR', descripcion: 'Anular o desactivar egresos diarios' },
  { nombre: 'Ver Devoluciones', recurso: 'DEVOLUCIONES', accion: 'VER', descripcion: 'Consultar devoluciones de clientes' },
  { nombre: 'Crear Devoluciones', recurso: 'DEVOLUCIONES', accion: 'CREAR', descripcion: 'Registrar devoluciones de mercancía' },
  { nombre: 'Ver Muestras', recurso: 'MUESTRAS', accion: 'VER', descripcion: 'Consultar listado e historial de muestras' },
  { nombre: 'Registrar Entrega de Muestras', recurso: 'MUESTRAS', accion: 'CREAR', descripcion: 'Registrar entregas de muestras y descontar existencias' },
  { nombre: 'Editar Muestras', recurso: 'MUESTRAS', accion: 'EDITAR', descripcion: 'Modificar datos de registro de muestras' },
  { nombre: 'Registrar Devolución de Muestras', recurso: 'MUESTRAS', accion: 'RETORNAR', descripcion: 'Registrar devolución de muestras no consumidas al inventario' },
  { nombre: 'Anular Muestras', recurso: 'MUESTRAS', accion: 'ANULAR', descripcion: 'Anular entregas de muestras y restituir inventario' },

  // Contactos
  { nombre: 'Ver Clientes', recurso: 'CLIENTES', accion: 'VER', descripcion: 'Consultar cartera de clientes' },
  { nombre: 'Gestionar Clientes', recurso: 'CLIENTES', accion: 'GESTIONAR', descripcion: 'Crear, editar o desactivar clientes' },
  { nombre: 'Ver Proveedores', recurso: 'PROVEEDORES', accion: 'VER', descripcion: 'Consultar lista de proveedores' },
  { nombre: 'Gestionar Proveedores', recurso: 'PROVEEDORES', accion: 'GESTIONAR', descripcion: 'Crear, editar o desactivar proveedores' },
  { nombre: 'Ver Personal', recurso: 'PERSONAL', accion: 'VER', descripcion: 'Consultar nómina de personal y empleados' },
  { nombre: 'Gestionar Personal', recurso: 'PERSONAL', accion: 'GESTIONAR', descripcion: 'Crear y editar personal' },
  { nombre: 'Ver Rutas de Venta', recurso: 'RUTAS', accion: 'VER', descripcion: 'Consultar rutas asignadas a preventistas/vendedores' },
  { nombre: 'Gestionar Rutas de Venta', recurso: 'RUTAS', accion: 'GESTIONAR', descripcion: 'Crear y asignar rutas de venta' },

  // Reportes
  { nombre: 'Ver Reportes y Estadísticas', recurso: 'REPORTES', accion: 'VER', descripcion: 'Acceso a dashboards y reportes gerenciales' },

  // Utilidades
  { nombre: 'Ver Módulo de Utilidades', recurso: 'UTILIDADES', accion: 'VER', descripcion: 'Consultar análisis de utilidades, ingresos y egresos' },
  { nombre: 'Exportar Utilidades', recurso: 'UTILIDADES', accion: 'EXPORTAR', descripcion: 'Exportar e imprimir reportes de utilidades en PDF y Excel' },

  // Configuración
  { nombre: 'Gestionar Sucursales y Ciudades', recurso: 'CONFIGURACION', accion: 'GESTIONAR', descripcion: 'Administrar sucursales y ciudades' },

  // Seguridad
  { nombre: 'Gestionar Usuarios', recurso: 'USUARIOS', accion: 'GESTIONAR', descripcion: 'Crear, editar contraseñas y desactivar usuarios' },
  { nombre: 'Gestionar Roles y Permisos', recurso: 'ROLES', accion: 'GESTIONAR', descripcion: 'Crear roles y definir perfiles de acceso' },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
    constructor(
        @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
        @InjectRepository(Persona) private personaRepo: Repository<Persona>,
        @InjectRepository(Rol) private rolRepo: Repository<Rol>,
        @InjectRepository(Sucursal) private sucursalRepo: Repository<Sucursal>,
        @InjectRepository(Permiso) private permisoRepo: Repository<Permiso>,
    ) { }

    async onApplicationBootstrap() {
        console.log('🌱 Checking and synchronizing seed permissions...');

        // 1. Ensure all SYSTEM_PERMISSIONS exist uniquely and update their data
        const syncedPermisoIds: number[] = [];

        for (const p of SYSTEM_PERMISSIONS) {
            // Find all matching permissions by resource+action, name, or legacy KARDEX
            const matches = await this.permisoRepo.find({
                where: [
                    { recurso: p.recurso, accion: p.accion },
                    { nombre: p.nombre },
                    ...(p.recurso === 'MOVIMIENTOS' ? [{ recurso: 'KARDEX' }, { nombre: 'Ver Kardex / Historial' }] : [])
                ]
            });

            let primary: Permiso;
            if (matches.length === 0) {
                primary = await this.permisoRepo.save(this.permisoRepo.create(p));
            } else {
                primary = matches[0];
                primary.nombre = p.nombre;
                primary.recurso = p.recurso;
                primary.accion = p.accion;
                primary.descripcion = p.descripcion;
                primary = await this.permisoRepo.save(primary);

                // If duplicates exist, migrate any role references to primary and delete duplicate rows
                if (matches.length > 1) {
                    const roles = await this.rolRepo.find({ relations: ['permisos'] });
                    const duplicateIds = matches.slice(1).map(m => m.id);

                    for (const rol of roles) {
                        const hasDuplicate = rol.permisos.some(perm => duplicateIds.includes(perm.id));
                        if (hasDuplicate) {
                            const updatedPerms = rol.permisos.filter(perm => !duplicateIds.includes(perm.id));
                            if (!updatedPerms.some(perm => perm.id === primary.id)) {
                                updatedPerms.push(primary);
                            }
                            rol.permisos = updatedPerms;
                            await this.rolRepo.save(rol);
                        }
                    }

                    for (let i = 1; i < matches.length; i++) {
                        await this.permisoRepo.remove(matches[i]);
                    }
                }
            }

            syncedPermisoIds.push(primary.id);
        }

        // 2. Remove any obsolete permissions not in SYSTEM_PERMISSIONS
        const allDbPerms = await this.permisoRepo.find();
        for (const dbPerm of allDbPerms) {
            if (!syncedPermisoIds.includes(dbPerm.id)) {
                const roles = await this.rolRepo.find({ relations: ['permisos'] });
                for (const rol of roles) {
                    if (rol.permisos.some(p => p.id === dbPerm.id)) {
                        rol.permisos = rol.permisos.filter(p => p.id !== dbPerm.id);
                        await this.rolRepo.save(rol);
                    }
                }
                await this.permisoRepo.remove(dbPerm);
            }
        }

        const count = await this.usuarioRepo.count();
        if (count > 0) return;

        // 2. Create Sucursal
        let sucursal = await this.sucursalRepo.findOne({ where: { nombre: 'Sucursal Central' } });
        if (!sucursal) {
            sucursal = this.sucursalRepo.create({
                nombre: 'Sucursal Central',
                direccion: 'Calle Principal #123',
                telefono: '00000000',
            });
            sucursal = await this.sucursalRepo.save(sucursal);
        }

        // 3. Create Admin Role with all permissions
        const allPermissions = await this.permisoRepo.find();
        let adminRole = await this.rolRepo.findOne({ where: { nombre: 'ADMIN' } });
        if (!adminRole) {
            adminRole = this.rolRepo.create({
                nombre: 'ADMIN',
                descripcion: 'Administrador total del sistema',
                permisos: allPermissions,
            });
            adminRole = await this.rolRepo.save(adminRole);
        } else {
            adminRole.permisos = allPermissions;
            await this.rolRepo.save(adminRole);
        }

        // 4. Create Persona
        const persona = this.personaRepo.create({
            nombres: 'Administrador',
            apellidos: 'Sistema',
            ci: '000000',
            telefono: '000000',
            direccion: 'Sede Central',
        });
        const savedPersona = await this.personaRepo.save(persona);

        // 5. Create Admin User
        const hash = await bcrypt.hash('admin123', 10);
        const adminUser = this.usuarioRepo.create({
            email: 'admin@gipaaf.com',
            username: 'admin',
            password: hash,
            persona: savedPersona,
            roles: [adminRole],
            sucursal: sucursal,
            activo: true,
        });

        await this.usuarioRepo.save(adminUser);

        console.log('✅ Seeding complete. User: admin@gipaaf.com / admin123');
    }
}
