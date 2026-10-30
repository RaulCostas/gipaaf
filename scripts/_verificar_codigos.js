const path = require('path');
const dotenvPath = path.join(__dirname, '..', 'backend', 'node_modules', 'dotenv');
require(dotenvPath).config({ path: path.join(__dirname, '..', 'backend', '.env') });
const pg = require(path.join(__dirname, '..', 'backend', 'node_modules', 'pg'));
const { Client } = pg;

const XLSX = require(path.join(__dirname, '..', 'frontend', 'node_modules', 'xlsx'));
const wb = XLSX.readFile(path.join(__dirname, '..', 'Mermas hasta 30-10-26 Suc. La Paz.xlsx'));
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
const conDatos = data.slice(1).filter(r => r[4] !== null && r[4] !== undefined && Number(r[4]) > 0);

const codigos = [...new Set(conDatos.map(r => String(r[2]).trim()))];
console.log('Códigos únicos con merma:', codigos.length);

const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
});

async function run() {
    await client.connect();
    let encontrados = 0, noEncontrados = [];

    for (const cod of codigos) {
        // Probar: tal cual, con ceros (8 dígitos), también sin ceros
        const padded8 = cod.padStart(8, '0');
        const padded11 = cod.padStart(11, '0');
        const res = await client.query(
            'SELECT codigo FROM productos WHERE codigo = $1 OR codigo = $2 OR codigo = $3 LIMIT 1',
            [cod, padded8, padded11]
        );
        if (res.rows.length > 0) {
            encontrados++;
            console.log(`  ✅ Encontrado: "${cod}" → DB: "${res.rows[0].codigo}"`);
        } else {
            noEncontrados.push({ original: cod, padded8 });
        }
    }

    console.log('\n══════════════════════════════');
    console.log(`✅ Encontrados: ${encontrados}`);
    console.log(`❌ No encontrados: ${noEncontrados.length}`);
    noEncontrados.forEach(c => console.log(`   - "${c.original}" (padded: "${c.padded8}")`));
    await client.end();
}

run().catch(e => { console.error(e.message); process.exit(1); });
