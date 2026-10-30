/**
 * Script auxiliar: coteja los 65 no encontrados usando el ID del Excel
 * y también intenta reconstruir el código con punto (ej: 700889L36 → 700889L.36)
 */
const path = require('path');
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'))
    .config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { Client } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));

const XLSX = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'xlsx'));
const wb = XLSX.readFile(path.join(__dirname, '..', 'Mermas hasta 30-10-26 Suc. La Paz.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
// Columnas: [ID, Marca, Código, Nombre, Total, Fechas Venc.]
const conDatos = data.slice(1).filter(r => r[4] !== null && r[4] !== undefined && Number(r[4]) > 0);

const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

// Genera variantes del código con punto insertado en distintas posiciones
function generarVariantesConPunto(cod) {
    const variantes = new Set([cod]);
    // Insertar punto en cada posición posible
    for (let i = 1; i < cod.length; i++) {
        variantes.add(cod.slice(0, i) + '.' + cod.slice(i));
    }
    // También con ceros al inicio + punto
    if (/^\d/.test(cod)) {
        const padded = cod.padStart(8, '0');
        variantes.add(padded);
        for (let i = 1; i < padded.length; i++) {
            variantes.add(padded.slice(0, i) + '.' + padded.slice(i));
        }
    }
    return [...variantes];
}

async function run() {
    await client.connect();

    const mapeo = {};
    const noEncontrados = [];

    for (const row of conDatos) {
        const codOriginal = String(row[2]).trim();
        const id = row[0]; // ID del Excel (columna A)
        const nombre = String(row[3]).trim();
        const cantidad = Number(row[4]);

        // 1. Buscar por ID en la tabla de productos (si hay columna id que coincida)
        // El ID del Excel es el ID del producto en el sistema anterior, no en GIPAAF.
        // Intentamos por variantes de código primero.

        const variantes = generarVariantesConPunto(codOriginal);
        const placeholders = variantes.map((_, i) => `$${i + 1}`).join(', ');
        const res = await client.query(
            `SELECT id, codigo, nombre FROM productos WHERE codigo IN (${placeholders}) LIMIT 1`,
            variantes
        );

        if (res.rows.length > 0) {
            const codDB = res.rows[0].codigo;
            if (codDB !== codOriginal) {
                mapeo[codOriginal] = codDB;
                console.log(`  ✅ [CORREGIDO] ExcelID=${id} "${codOriginal}" → DB: "${codDB}" | ${cantidad} u. | ${nombre.substring(0,40)}`);
            }
        } else {
            noEncontrados.push({ id, codOriginal, nombre, cantidad });
        }
    }

    console.log('\n══════════════════════════════════════════════════');
    console.log(`✅ Encontrados con variantes de punto: ${Object.keys(mapeo).length} correcciones nuevas`);
    console.log(`❌ Definitivamente no encontrados: ${noEncontrados.length}`);
    if (noEncontrados.length > 0) {
        console.log('\n--- Productos no encontrados ---');
        noEncontrados.forEach(r =>
            console.log(`  ExcelID=${r.id} | "${r.codOriginal}" | ${r.cantidad} u. | ${r.nombre}`)
        );
    }

    // Cargar mapeo anterior y fusionar
    const fs = require('fs');
    const mapeoAnteriorPath = path.join(__dirname, '_mapeo_codigos.json');
    let mapeoAnterior = {};
    if (fs.existsSync(mapeoAnteriorPath)) {
        mapeoAnterior = JSON.parse(fs.readFileSync(mapeoAnteriorPath, 'utf8'));
    }
    const mapeoFinal = { ...mapeoAnterior, ...mapeo };
    fs.writeFileSync(mapeoAnteriorPath, JSON.stringify(mapeoFinal, null, 2));
    console.log(`\n💾 Mapeo total actualizado: ${Object.keys(mapeoFinal).length} correcciones en _mapeo_codigos.json`);

    await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
