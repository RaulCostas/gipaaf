/**
 * Script auxiliar: busca los códigos no encontrados intentando reconstruir
 * los ceros iniciales con distintas longitudes (7, 8, 9, 11 dígitos)
 */
const path = require('path');
require(path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv'))
    .config({ path: path.join(__dirname, '..', 'backend', '.env') });
const { Client } = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));

const XLSX = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'xlsx'));
const wb = XLSX.readFile(path.join(__dirname, '..', 'Mermas hasta 30-10-26 Suc. La Paz.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
const conDatos = data.slice(1).filter(r => r[4] !== null && r[4] !== undefined && Number(r[4]) > 0);

const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

async function buscarConPadding(cod) {
    // Intentar con padding de 7 a 12 dígitos si el código es puramente numérico
    const esPureNumerico = /^\d+$/.test(cod);
    const candidatos = [cod];
    if (esPureNumerico) {
        for (let len = 7; len <= 12; len++) {
            candidatos.push(cod.padStart(len, '0'));
        }
    }
    // Deduplicar
    const unicos = [...new Set(candidatos)];
    const placeholders = unicos.map((_, i) => `$${i + 1}`).join(', ');
    const res = await client.query(
        `SELECT codigo FROM productos WHERE codigo IN (${placeholders}) LIMIT 1`,
        unicos
    );
    return res.rows.length > 0 ? res.rows[0].codigo : null;
}

async function run() {
    await client.connect();

    const resultados = [];

    for (const row of conDatos) {
        const codOriginal = String(row[2]).trim();
        const encontrado = await buscarConPadding(codOriginal);
        resultados.push({
            codOriginal,
            codDB: encontrado,
            nombre: String(row[3]).trim(),
            cantidad: Number(row[4]),
        });
    }

    const encontrados = resultados.filter(r => r.codDB);
    const noEncontrados = resultados.filter(r => !r.codDB);

    console.log('\n✅ ENCONTRADOS CON PADDING:', encontrados.length);
    encontrados.forEach(r => {
        if (r.codOriginal !== r.codDB) {
            console.log(`   [CORREGIDO] "${r.codOriginal}" → "${r.codDB}" | ${r.cantidad} u.`);
        }
    });

    console.log('\n❌ DEFINITIVAMENTE NO ENCONTRADOS:', noEncontrados.length);
    noEncontrados.forEach(r => console.log(`   - "${r.codOriginal}" | ${r.nombre} | ${r.cantidad} u.`));

    // Guardar mapeo para usar en el script principal
    const mapeo = {};
    encontrados.filter(r => r.codOriginal !== r.codDB).forEach(r => { mapeo[r.codOriginal] = r.codDB; });
    const fs = require('fs');
    fs.writeFileSync(path.join(__dirname, '_mapeo_codigos.json'), JSON.stringify(mapeo, null, 2));
    console.log(`\n💾 Mapeo de correcciones guardado en scripts/_mapeo_codigos.json (${Object.keys(mapeo).length} correcciones)`);

    await client.end();
}
run().catch(e => { console.error(e.message); process.exit(1); });
