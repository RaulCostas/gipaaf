const { Client } = require('pg');

const client = new Client({
  host: '127.0.0.1',
  port: 5433,
  user: 'postgres',
  password: 'postgrespg',
  database: 'gipaaf'
});

async function run() {
  await client.connect();
  const pRes = await client.query(
    'INSERT INTO personas (nombres, apellidos, "creadoEn") VALUES ($1, $2, NOW()) RETURNING id',
    ['Santiago', 'Costas']
  );
  const personaId = pRes.rows[0].id;
  await client.query('UPDATE usuarios SET "personaId" = $1 WHERE id = 2', [personaId]);
  console.log('Successfully updated user 2 with personaId:', personaId);
  await client.end();
}

run().catch(console.error);
