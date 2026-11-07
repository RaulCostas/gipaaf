const path = require('path');
const { Client } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));

const client = new Client({
    host: 'localhost',
    port: 5433,
    database: 'gipaaf',
    user: 'postgres',
    password: 'postgrespg',
});

async function run() {
    await client.connect();
    console.log('Connected to DB');

    try {
        await client.query('BEGIN');

        // 1. Actualizar el código del producto H2000 a VY-H2000
        const updProd = await client.query(`
            UPDATE productos 
            SET codigo = 'VY-H2000' 
            WHERE (codigo = 'VY-H2001' OR codigo = 'VY-H2000' OR nombre ILIKE 'H2000 Soplete%')
            RETURNING id, codigo, nombre;
        `);
        console.log('Producto H2000 actualizado/verificado:');
        console.table(updProd.rows);

        // 2. Actualizar el movimiento de merma en La Paz
        const updMov = await client.query(`
            UPDATE movimientos_inventario
            SET 
                "inventarioId" = (
                    SELECT i.id 
                    FROM inventario i
                    JOIN productos p ON p.id = i."productoId"
                    JOIN sucursales s ON s.id = i."sucursalId"
                    WHERE p.codigo = 'VY-H2000' 
                      AND (s.id = 1 OR s.nombre ILIKE '%Paz%')
                    LIMIT 1
                ),
                "numeroDocumento" = 'MERMA-LP-HIST-VY-H2000',
                motivo = 'Merma histórica [VY-H2000] - Sistema anterior'
            WHERE id IN (
                SELECT m.id
                FROM movimientos_inventario m
                JOIN inventario i ON i.id = m."inventarioId"
                JOIN productos p ON p.id = i."productoId"
                JOIN sucursales s ON s.id = i."sucursalId"
                WHERE p.codigo = 'VY-N2001'
                  AND (s.id = 1 OR s.nombre ILIKE '%Paz%')
                  AND m.tipo IN ('MERMA', 'MERMA_DESCARTE')
            )
            RETURNING id, tipo, cantidad, "numeroDocumento", motivo, "inventarioId";
        `);
        console.log('Movimiento de merma actualizado:');
        console.table(updMov.rows);

        await client.query('COMMIT');
        console.log('✅ Transacción completada con éxito.');

        // 3. Verificación final
        const check = await client.query(`
            SELECT m.id as mov_id, m.tipo, m.cantidad, m."numeroDocumento", m.motivo,
                   p.id as prod_id, p.codigo as prod_codigo, p.nombre as prod_nombre,
                   s.nombre as sucursal, i."stockActual"
            FROM movimientos_inventario m
            JOIN inventario i ON i.id = m."inventarioId"
            JOIN productos p ON p.id = i."productoId"
            JOIN sucursales s ON s.id = i."sucursalId"
            WHERE p.codigo IN ('VY-H2000', 'VY-N2001')
              AND m.tipo IN ('MERMA', 'MERMA_DESCARTE')
        `);
        console.log('\n--- VERIFICACIÓN FINAL DE MERMAS ---');
        console.table(check.rows);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Error durante la transacción:', e);
    } finally {
        await client.end();
    }
}

run().catch(console.error);
