const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function main() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'roi_calculation',
    password: 'admin',
    port: 5433,
  });

  await client.connect();
  const hash = bcrypt.hashSync('admin123', 10);
  await client.query('UPDATE users SET password_hash = $1 WHERE email = $2', [hash, 'manager@gmail.com']);
  console.log('Updated password for manager@gmail.com to admin123');
  await client.end();
}

main().catch(console.error);
