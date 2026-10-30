const { Client } = require('../backend/node_modules/pg');
require('../backend/node_modules/dotenv').config({ path: './backend/.env' });

const client = new Client({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

async function main() {
  await client.connect();
  console.log(' Conectado a la base de datos PostgreSQL.');

  try {
    await client.query('BEGIN');

    // 1. MODIFICAR SALDO CLIENTE "LA MODERNA" (Código 4058)
    console.log('\n--- 1. Actualizando Saldo Inicial de Cliente "La Moderna" (4058) ---');
    const resNota = await client.query(`
      UPDATE notas
      SET subtotal = 4552.44,
          total = 4552.44,
          saldo = GREATEST(0, 4552.44 - COALESCE((
              SELECT SUM("montoEquivalente") 
              FROM pagos_cobranza 
              WHERE "notaId" = notas.id AND activo = true
          ), 0)),
          "actualizadoEn" = NOW()
      WHERE id = 134
        AND "clienteId" = 265
        AND "sucursalId" = 3
      RETURNING id, numero, subtotal, total, saldo, "actualizadoEn"
    `);
    console.log('Nota actualizada:', resNota.rows[0]);

    // 2. MODIFICAR STOCK EN INVENTARIO (A21-09777 en Sucursal CBBA)
    console.log('\n--- 2. Actualizando Stock en Inventario (A21-09777 en CBBA) ---');
    const resInv = await client.query(`
      UPDATE inventario
      SET "stockActual" = 3.00,
          "actualizadoEn" = NOW()
      WHERE id = 2113
        AND "productoId" = 705
        AND "sucursalId" = 3
      RETURNING id, "productoId", "sucursalId", "stockActual", "actualizadoEn"
    `);
    console.log('Inventario actualizado:', resInv.rows[0]);

    // 3. MODIFICAR LOTE INICIAL (L-INI-CBBA-A21-09777)
    console.log('\n--- 3. Actualizando Lote Inicial (L-INI-CBBA-A21-09777) ---');
    const resLote = await client.query(`
      UPDATE lotes
      SET "cantidadInicial" = 3.00,
          "cantidadActual" = 3.00,
          "actualizadoEn" = NOW()
      WHERE id = 744
        AND "numeroLote" = 'L-INI-CBBA-A21-09777'
      RETURNING id, "numeroLote", "cantidadInicial", "cantidadActual", "actualizadoEn"
    `);
    console.log('Lote actualizado:', resLote.rows[0]);

    // 4. MODIFICAR MOVIMIENTO INICIAL EN KARDEX (movimientos_inventario)
    console.log('\n--- 4. Actualizando Movimiento Inicial Kardex ---');
    const resMov = await client.query(`
      UPDATE movimientos_inventario
      SET cantidad = 3.00
      WHERE id = 762
        AND "inventarioId" = 2113
        AND tipo = 'INVENTARIO_INICIAL'
      RETURNING id, tipo, cantidad, "numeroDocumento"
    `);
    console.log('Movimiento kardex actualizado:', resMov.rows[0]);

    await client.query('COMMIT');
    console.log('\n Transacción confirmada con éxito (COMMIT).');

    // 5. CONSULTA DE VERIFICACIÓN POST-ACTUALIZACIÓN
    console.log('\n=== VERIFICACIÓN FINAL ===');
    const verifyNota = await client.query(`
      SELECT n.id, n.numero, n.subtotal, n.total, n.saldo, c.codigo, c."nombreTienda"
      FROM notas n
      JOIN clientes c ON n."clienteId" = c.id
      WHERE n.id = 134
    `);
    console.log('Verificación Nota Cliente:', verifyNota.rows[0]);

    const verifyProd = await client.query(`
      SELECT p.codigo, p.nombre, i."stockActual", l."numeroLote", l."cantidadActual", m.cantidad AS kardex_inicial
      FROM inventario i
      JOIN productos p ON i."productoId" = p.id
      JOIN lotes l ON l."productoId" = p.id AND l."sucursalId" = i."sucursalId"
      JOIN movimientos_inventario m ON m."inventarioId" = i.id
      WHERE i.id = 2113 AND l.id = 744 AND m.id = 762
    `);
    console.log('Verificación Producto CBBA:', verifyProd.rows[0]);

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error, transacción revertida (ROLLBACK):', error);
  } finally {
    await client.end();
  }
}

main();
