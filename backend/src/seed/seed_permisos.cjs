const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'gipaaf'
});

const permissions = [
  // Ventas & Proformas
  { nombre: 'Ver Proformas', recurso: 'PROFORMAS', accion: 'VER', descripcion: 'Consultar listado e historial de proformas' },
  { nombre: 'Crear Proformas', recurso: 'PROFORMAS', accion: 'CREAR', descripcion: 'Generar nuevas proformas para clientes' },
  { nombre: 'Editar Proformas', recurso: 'PROFORMAS', accion: 'EDITAR', descripcion: 'Modificar proformas existentes' },
  { nombre: 'Anular Proformas', recurso: 'PROFORMAS', accion: 'ANULAR', descripcion: 'Anular proformas' },
  { nombre: 'Ver Ventas', recurso: 'VENTAS', accion: 'VER', descripcion: 'Consultar listado de notas de venta y facturación' },
  { nombre: 'Crear Ventas', recurso: 'VENTAS', accion: 'CREAR', descripcion: 'Registrar nuevas ventas de productos' },
  { nombre: 'Confirmar Ventas', recurso: 'VENTAS', accion: 'CONFIRMAR', descripcion: 'Confirmar ventas y descontar inventario' },
  { nombre: 'Anular Ventas', recurso: 'VENTAS', accion: 'ANULAR', descripcion: 'Anular ventas y restaurar existencias' },
  { nombre: 'Ver Devoluciones', recurso: 'DEVOLUCIONES', accion: 'VER', descripcion: 'Consultar devoluciones de clientes' },
  { nombre: 'Crear Devoluciones', recurso: 'DEVOLUCIONES', accion: 'CREAR', descripcion: 'Registrar devoluciones de mercancía' },

  // Cobranzas & Finanzas
  { nombre: 'Ver Cobranzas', recurso: 'COBRANZAS', accion: 'VER', descripcion: 'Consultar pagos recibidos de clientes' },
  { nombre: 'Registrar Cobranza', recurso: 'COBRANZAS', accion: 'CREAR', descripcion: 'Registrar abonos y pagos de ventas a crédito' },
  { nombre: 'Editar Cobranza', recurso: 'COBRANZAS', accion: 'EDITAR', descripcion: 'Modificar cobros registrados' },
  { nombre: 'Anular Cobranza', recurso: 'COBRANZAS', accion: 'ANULAR', descripcion: 'Anular cobros y restituir saldo a la venta' },
  { nombre: 'Ver Estado Cuentas Clientes', recurso: 'ESTADO_CUENTAS_CLIENTES', accion: 'VER', descripcion: 'Consultar saldos, deudas y estados de cuenta de clientes' },

  // Compras & Proveedores
  { nombre: 'Ver Compras', recurso: 'COMPRAS', accion: 'VER', descripcion: 'Consultar órdenes y notas de compra a proveedores' },
  { nombre: 'Crear Compras', recurso: 'COMPRAS', accion: 'CREAR', descripcion: 'Registrar nuevas compras de productos' },
  { nombre: 'Editar Compras', recurso: 'COMPRAS', accion: 'EDITAR', descripcion: 'Modificar notas de compra existentes' },
  { nombre: 'Confirmar Compras', recurso: 'COMPRAS', accion: 'CONFIRMAR', descripcion: 'Confirmar compras e ingresar stock a almacén' },
  { nombre: 'Anular Compras', recurso: 'COMPRAS', accion: 'ANULAR', descripcion: 'Anular compras' },
  { nombre: 'Gestionar Costos de Importación', recurso: 'COMPRAS', accion: 'GESTIONAR_COSTO_IMPORTACION', descripcion: 'Registrar y modificar planilla de gastos de importación y recalcular costo de productos' },
  { nombre: 'Ver Costos de Importación', recurso: 'COMPRAS', accion: 'VER_COSTO_IMPORTACION', descripcion: 'Consultar desglose de gastos y planilla de costos de importación' },
  { nombre: 'Ver Pagos Proveedores', recurso: 'PAGOS_PROVEEDORES', accion: 'VER', descripcion: 'Consultar pagos y amortizaciones a proveedores' },
  { nombre: 'Registrar Pago Proveedor', recurso: 'PAGOS_PROVEEDORES', accion: 'CREAR', descripcion: 'Registrar pagos y amortizaciones de compras a crédito' },
  { nombre: 'Editar Pago Proveedor', recurso: 'PAGOS_PROVEEDORES', accion: 'EDITAR', descripcion: 'Modificar pagos a proveedores' },
  { nombre: 'Anular Pago Proveedor', recurso: 'PAGOS_PROVEEDORES', accion: 'ANULAR', descripcion: 'Anular pagos a proveedores' },
  { nombre: 'Ver Estado Cuentas Proveedores', recurso: 'ESTADO_CUENTAS_PROVEEDORES', accion: 'VER', descripcion: 'Consultar deudas y estados de cuenta de proveedores' },

  // Egresos Diarios
  { nombre: 'Ver Egresos Diarios', recurso: 'EGRESOS', accion: 'VER', descripcion: 'Consultar listado de egresos y gastos operativos diarios' },
  { nombre: 'Registrar Egreso Diario', recurso: 'EGRESOS', accion: 'CREAR', descripcion: 'Registrar nuevos egresos y gastos de caja chica o banco' },
  { nombre: 'Editar Egreso Diario', recurso: 'EGRESOS', accion: 'EDITAR', descripcion: 'Modificar egresos registrados' },
  { nombre: 'Anular Egreso Diario', recurso: 'EGRESOS', accion: 'ANULAR', descripcion: 'Anular egresos registrados' },

  // Muestras Médicas y Promocionales
  { nombre: 'Ver Muestras', recurso: 'MUESTRAS', accion: 'VER', descripcion: 'Consultar listado e historial de muestras médicas/promocionales' },
  { nombre: 'Registrar Entrega de Muestras', recurso: 'MUESTRAS', accion: 'CREAR', descripcion: 'Registrar entregas de muestras y descontar existencias' },
  { nombre: 'Editar Muestras', recurso: 'MUESTRAS', accion: 'EDITAR', descripcion: 'Modificar datos de registro de muestras' },
  { nombre: 'Registrar Devolución de Muestras', recurso: 'MUESTRAS', accion: 'RETORNAR', descripcion: 'Registrar devolución de muestras no consumidas al inventario' },
  { nombre: 'Anular Muestras', recurso: 'MUESTRAS', accion: 'ANULAR', descripcion: 'Anular entregas de muestras y restituir inventario' },

  // Inventario & Almacenes
  { nombre: 'Ver Productos', recurso: 'PRODUCTOS', accion: 'VER', descripcion: 'Consultar catálogo de productos' },
  { nombre: 'Crear/Editar Productos', recurso: 'PRODUCTOS', accion: 'GESTIONAR', descripcion: 'Crear, modificar y actualizar precios de productos' },
  { nombre: 'Eliminar Productos', recurso: 'PRODUCTOS', accion: 'ELIMINAR', descripcion: 'Desactivar o eliminar productos' },
  { nombre: 'Gestionar Categorías, Marcas y Grupos', recurso: 'CATALOGOS', accion: 'GESTIONAR', descripcion: 'Administrar categorías, marcas y líneas' },
  { nombre: 'Ver Existencias (Stock)', recurso: 'INVENTARIO', accion: 'VER', descripcion: 'Consultar stock actual por almacén' },
  { nombre: 'Ajustar Stock Manualmente', recurso: 'INVENTARIO', accion: 'AJUSTAR', descripcion: 'Realizar ajustes de inventario de entrada/salida' },
  { nombre: 'Gestionar Límites de Stock', recurso: 'INVENTARIO', accion: 'LIMITES', descripcion: 'Configurar niveles mínimos y máximos de stock para alertas' },
  { nombre: 'Ver Kardex / Historial', recurso: 'KARDEX', accion: 'VER', descripcion: 'Consultar movimientos y trazabilidad de inventario' },
  { nombre: 'Ver Movimientos de Inventario', recurso: 'MOVIMIENTOS', accion: 'VER', descripcion: 'Consultar trazabilidad y movimientos de Kardex' },
  { nombre: 'Ver Traspasos de Almacén', recurso: 'TRASPASOS', accion: 'VER', descripcion: 'Consultar transferencias de mercadería entre almacenes' },
  { nombre: 'Crear Traspasos de Almacén', recurso: 'TRASPASOS', accion: 'CREAR', descripcion: 'Registrar nuevos traspasos entre almacenes con flete' },
  { nombre: 'Anular Traspasos de Almacén', recurso: 'TRASPASOS', accion: 'ANULAR', descripcion: 'Anular traspasos y revertir stock' },

  // Contactos & Rutas
  { nombre: 'Ver Clientes', recurso: 'CLIENTES', accion: 'VER', descripcion: 'Consultar cartera de clientes' },
  { nombre: 'Gestionar Clientes', recurso: 'CLIENTES', accion: 'GESTIONAR', descripcion: 'Crear, editar o desactivar clientes' },
  { nombre: 'Ver Proveedores', recurso: 'PROVEEDORES', accion: 'VER', descripcion: 'Consultar lista de proveedores' },
  { nombre: 'Gestionar Proveedores', recurso: 'PROVEEDORES', accion: 'GESTIONAR', descripcion: 'Crear, editar o desactivar proveedores' },
  { nombre: 'Ver Personal', recurso: 'PERSONAL', accion: 'VER', descripcion: 'Consultar nómina de personal y empleados' },
  { nombre: 'Gestionar Personal', recurso: 'PERSONAL', accion: 'GESTIONAR', descripcion: 'Crear y editar personal' },
  { nombre: 'Ver Rutas de Venta', recurso: 'RUTAS', accion: 'VER', descripcion: 'Consultar rutas asignadas a preventistas/vendedores' },
  { nombre: 'Gestionar Rutas de Venta', recurso: 'RUTAS', accion: 'GESTIONAR', descripcion: 'Crear y asignar rutas de venta' },

  // Analítica & Utilidades
  { nombre: 'Ver Reportes y Estadísticas', recurso: 'REPORTES', accion: 'VER', descripcion: 'Acceso a dashboards y reportes gerenciales' },
  { nombre: 'Ver Módulo de Utilidades', recurso: 'UTILIDADES', accion: 'VER', descripcion: 'Consultar análisis de utilidades, ingresos y egresos' },
  { nombre: 'Exportar Utilidades', recurso: 'UTILIDADES', accion: 'EXPORTAR', descripcion: 'Exportar e imprimir reportes de utilidades en PDF y Excel' },

  // Configuración & Seguridad
  { nombre: 'Gestionar Almacenes y Sucursales', recurso: 'CONFIGURACION', accion: 'GESTIONAR', descripcion: 'Administrar almacenes, sucursales y ciudades' },
  { nombre: 'Ver y Configurar Chatbot WhatsApp', recurso: 'WHATSAPP', accion: 'GESTIONAR', descripcion: 'Vincular QR, configurar respuestas, catálogo y cuentas bancarias del Chatbot' },
  { nombre: 'Gestionar Usuarios', recurso: 'USUARIOS', accion: 'GESTIONAR', descripcion: 'Crear, editar contraseñas y desactivar usuarios' },
  { nombre: 'Gestionar Roles y Permisos', recurso: 'ROLES', accion: 'GESTIONAR', descripcion: 'Crear roles y definir perfiles de acceso' },
];

async function run() {
  await client.connect();
  console.log('Connected to DB');

  for (const p of permissions) {
    const res = await client.query('SELECT id FROM permisos WHERE nombre = $1 AND recurso = $2', [p.nombre, p.recurso]);
    if (res.rows.length === 0) {
      await client.query(
        'INSERT INTO permisos (nombre, recurso, accion, descripcion, "creadoEn") VALUES ($1, $2, $3, $4, NOW())',
        [p.nombre, p.recurso, p.accion, p.descripcion]
      );
    }
  }

  // Associate all permissions to ADMIN role
  const adminRes = await client.query('SELECT id FROM roles WHERE nombre = $1', ['ADMIN']);
  if (adminRes.rows.length > 0) {
    const adminId = adminRes.rows[0].id;
    const allPerms = await client.query('SELECT id FROM permisos');
    for (const perm of allPerms.rows) {
      const link = await client.query('SELECT * FROM rol_permisos WHERE "rolesId" = $1 AND "permisosId" = $2 OR ("rolId" = $1 AND "permisoId" = $2)', [adminId, perm.id]).catch(() => ({ rows: [] }));
      if (link.rows.length === 0) {
        await client.query('INSERT INTO rol_permisos VALUES ($1, $2) ON CONFLICT DO NOTHING', [adminId, perm.id]).catch(console.error);
      }
    }
  }

  const count = await client.query('SELECT COUNT(*) FROM permisos');
  console.log('Total Permisos in DB now:', count.rows[0].count);
  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
