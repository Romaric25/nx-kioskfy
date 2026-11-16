// Purge toutes les sessions kioskfy (tables `sessions` better-auth).
// Rend inopérants les cookies de session existants — y compris les vieux
// cookies `.kioskfy.com` émis avant le passage en cookies host-only.
// Tous les utilisateurs devront se reconnecter sur chaque sous-domaine.
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });
require('dotenv').config({ path: './.env' });

async function main() {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL,
    connectTimeout: 15000,
  });
  const [res] = await conn.query('DELETE FROM sessions');
  console.log(`Sessions supprimées : ${res.affectedRows}`);
  await conn.end();
}

main().catch((err) => {
  console.error('Échec :', err.message);
  process.exit(1);
});
