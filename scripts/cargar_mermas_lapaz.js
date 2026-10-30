/**
 * Script: cargar_mermas_lapaz.js
 * Propósito: Cargar las mermas del sistema anterior (hasta 30/10/2026) para la Sucursal La Paz
 *            en la tabla movimientos_inventario con tipo 'MERMA'.
 *
 * ⚠️  IMPORTANTE: Este script NO modifica inventario.stockActual ni la tabla lotes.
 *                 Solo inserta registros históricos en movimientos_inventario para
 *                 trazabilidad del Kardex.
 *
 * Fuente: "Mermas hasta 30-10-26 Suc. La Paz.xlsx"
 * Sucursal La Paz ID: 1
 * Fecha de referencia de las mermas: 2026-10-30
 *
 * Uso:
 *   node scripts/cargar_mermas_lapaz.js               → modo DRY-RUN (solo muestra SQL, no ejecuta)
 *   node scripts/cargar_mermas_lapaz.js --ejecutar     → ejecuta en la base de datos de producción
 *
 * Requiere: pg (npm install pg) en el directorio raíz o backend
 */

const path = require('path');
const fs = require('fs');

// Genera variantes del código con punto en distintas posiciones (para buscar en BD)
function generarVariantesConPunto(cod) {
    const variantes = new Set([cod]);
    for (let i = 1; i < cod.length; i++) {
        variantes.add(cod.slice(0, i) + '.' + cod.slice(i));
    }
    if (/^\d/.test(cod)) {
        for (let len = 7; len <= 12; len++) {
            const padded = cod.padStart(len, '0');
            variantes.add(padded);
            for (let i = 1; i < padded.length; i++) {
                variantes.add(padded.slice(0, i) + '.' + padded.slice(i));
            }
        }
    }
    return [...variantes];
}

// ── Cargar xlsx desde node_modules del frontend ──────────────────────────────
const xlsxPath = path.join(__dirname, '..', 'frontend', 'node_modules', 'xlsx');
const XLSX = require(xlsxPath);

// ── Config de base de datos (tomada del .env del backend) ─────────────────────
const dotenvPath = path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv');
require(dotenvPath).config({ path: path.join(__dirname, '..', 'backend', '.env') });

const DB_CONFIG = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME     || 'gipaaf',
    user:     process.env.DB_USERNAME || process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
};

const EJECUTAR = process.argv.includes('--ejecutar');
const SUCURSAL_LP_ID = 1;
const FECHA_MERMA = '2026-10-30'; // Fecha de referencia del cierre

// ── Leer Excel ────────────────────────────────────────────────────────────────
const excelFile = path.join(__dirname, '..', 'Mermas hasta 30-10-26 Suc. La Paz.xlsx');
const wb = XLSX.readFile(excelFile);
const ws = wb.Sheets[wb.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

// Cargar mapeo de correcciones de códigos (ceros perdidos + puntos eliminados por Excel)
const mapeoPath = path.join(__dirname, '_mapeo_codigos.json');
const mapeoCodigos = fs.existsSync(mapeoPath) ? JSON.parse(fs.readFileSync(mapeoPath, 'utf8')) : {};
console.log(`📋 Mapeo de correcciones de códigos cargado: ${Object.keys(mapeoCodigos).length} entradas`);

// Columnas: [ID, Marca, Código, Nombre, Total, Fechas Venc.]
const mermas = rawData
    .slice(1) // saltar encabezado
    .filter(r => r[4] !== null && r[4] !== undefined && Number(r[4]) > 0)
    .map(r => {
        const codExcel = String(r[2]).trim();
        const codigo = mapeoCodigos[codExcel] || codExcel; // aplicar corrección si existe
        return {
            codExcel,
            codigo,
            nombre:    String(r[3]).trim(),
            cantidad:  Number(r[4]),
            fechaVenc: r[5] ? String(r[5]).trim() : null,
        };
    });

console.log(`\n📦 Mermas a cargar: ${mermas.length} productos, ${mermas.reduce((s, m) => s + m.cantidad, 0)} unidades totales`);
console.log(`🏢 Sucursal: La Paz (ID=${SUCURSAL_LP_ID})`);
console.log(`📅 Fecha de referencia: ${FECHA_MERMA}`);
console.log(`⚙️  Modo: ${EJECUTAR ? '🔴 EJECUCIÓN REAL' : '🟡 DRY-RUN (solo lectura)'}\n`);

// ── Función principal ─────────────────────────────────────────────────────────
async function main() {
    let client;

    try {
        // Intentar cargar pg
        let pg;
        try {
            pg = require('pg');
        } catch {
            try {
                pg = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
            } catch {
                console.error('❌ No se encontró el módulo "pg". Ejecuta: npm install pg  en el directorio raíz o backend.');
                process.exit(1);
            }
        }

        const { Client } = pg;
        client = new Client(DB_CONFIG);

        console.log(`🔌 Conectando a base de datos: ${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database} ...`);
        await client.connect();
        console.log('✅ Conexión exitosa.\n');

        let insertados = 0;
        let omitidos = 0;
        let noEncontrados = [];
        let sinInventario = [];

        for (const merma of mermas) {
            // 1. Buscar el producto por código (ya corregido desde el mapeo)
            const prodRes = await client.query(
                `SELECT id, codigo, nombre FROM productos WHERE codigo = $1 LIMIT 1`,
                [merma.codigo]
            );

            if (prodRes.rows.length === 0) {
                noEncontrados.push(merma.codigo + (merma.codExcel !== merma.codigo ? ` (Excel: ${merma.codExcel})` : ''));
                console.warn(`  ⚠️  Producto no encontrado: ${merma.codigo} - ${merma.nombre}`);
                continue;
            }

            const prod = prodRes.rows[0];

            // 2. Buscar el registro de inventario en la sucursal La Paz
            const invRes = await client.query(
                `SELECT id, "stockActual", "precioCompra" FROM inventario WHERE "productoId" = $1 AND "sucursalId" = $2 LIMIT 1`,
                [prod.id, SUCURSAL_LP_ID]
            );

            if (invRes.rows.length === 0) {
                sinInventario.push(merma.codigo);
                console.warn(`  ⚠️  Sin registro de inventario en La Paz: ${merma.codigo} - ${merma.nombre}`);
                continue;
            }

            const inv = invRes.rows[0];

            // 3. Verificar si ya existe un movimiento MERMA para este producto en esa fecha
            const docNum = `MERMA-LP-HIST-${merma.codigo}`;
            const existeRes = await client.query(
                `SELECT id FROM movimientos_inventario
                 WHERE "inventarioId" = $1 AND tipo = 'MERMA' AND "numeroDocumento" = $2
                 LIMIT 1`,
                [inv.id, docNum]
            );

            if (existeRes.rows.length > 0) {
                omitidos++;
                console.log(`  ⏩ Ya existe: ${merma.codigo} (${merma.cantidad} u.) → omitido`);
                continue;
            }

            // 4. Construir observación
            const obsPartes = [`Merma histórica del sistema anterior hasta el 30/10/2026`];
            if (merma.fechaVenc) obsPartes.push(`Vencimiento: ${merma.fechaVenc}`);
            const observacion = obsPartes.join(' | ');

            const motivo = `Merma histórica [${merma.codigo}] - Sistema anterior`;

            // 5. Insertar el movimiento
            const sql = `
                INSERT INTO movimientos_inventario
                    (tipo, cantidad, motivo, "numeroDocumento", observaciones, "costoUnitario", "inventarioId", "creadoEn")
                VALUES
                    ('MERMA', $1, $2, $3, $4, $5, $6, $7::timestamp)
                RETURNING id
            `;
            const params = [
                merma.cantidad,
                motivo,
                docNum,
                observacion,
                Number(inv.precioCompra) || 0,
                inv.id,
                `${FECHA_MERMA}T08:00:00.000Z`,
            ];

            if (EJECUTAR) {
                const res = await client.query(sql, params);
                insertados++;
                console.log(`  ✅ Insertado id=${res.rows[0].id}: ${merma.codigo} | ${merma.cantidad} u. | ${merma.nombre.substring(0,40)}`);
            } else {
                // DRY-RUN: solo mostrar
                insertados++;
                const sqlMostrar = sql
                    .replace('$1', merma.cantidad)
                    .replace('$2', `'${motivo}'`)
                    .replace('$3', `'${docNum}'`)
                    .replace('$4', `'${observacion}'`)
                    .replace('$5', Number(inv.precioCompra) || 0)
                    .replace('$6', inv.id)
                    .replace("$7::timestamp", `'${FECHA_MERMA}T08:00:00.000Z'`);
                console.log(`  🔍 DRY-RUN: ${merma.codigo} | ${merma.cantidad} u. | invId=${inv.id} | stockActual=${inv.stockActual}`);
            }
        }

        // ── Resumen final ─────────────────────────────────────────────────────
        console.log('\n═══════════════════════════════════════════════════════');
        console.log('📊 RESUMEN FINAL');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`  ✅ ${EJECUTAR ? 'Insertados' : 'A insertar'}:      ${insertados}`);
        console.log(`  ⏩ Ya existían (omitidos): ${omitidos}`);
        if (noEncontrados.length > 0) {
            console.log(`  ❌ Productos no encontrados en DB (${noEncontrados.length}):`);
            noEncontrados.forEach(c => console.log(`       - ${c}`));
        }
        if (sinInventario.length > 0) {
            console.log(`  ⚠️  Sin inventario en La Paz (${sinInventario.length}):`);
            sinInventario.forEach(c => console.log(`       - ${c}`));
        }
        if (!EJECUTAR) {
            console.log('\n  💡 Para ejecutar en la base de datos, corre:');
            console.log('     node scripts/cargar_mermas_lapaz.js --ejecutar');
        } else {
            console.log('\n  🎉 Mermas cargadas exitosamente. NO se modificó inventario ni lotes.');
        }
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        if (err.stack) console.error(err.stack);
        process.exit(1);
    } finally {
        if (client) await client.end();
    }
}

main();
