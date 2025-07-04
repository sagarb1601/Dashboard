import { Pool } from 'pg';
import 'dotenv/config';

async function checkDatabaseTables(dbName: string) {
  const pool = new Pool({
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'sagar123',
    database: dbName,
    port: parseInt(process.env.PGPORT || '5432'),
  });

  try {
    console.log(`\nChecking database: ${dbName}`);
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('travels', 'edofc_travels')
    `);
    console.log('Found tables:', result.rows.map(row => row.table_name));
  } catch (error) {
    console.error(`Error checking ${dbName}:`, error);
  } finally {
    await pool.end();
  }
}

async function main() {
  await checkDatabaseTables('dashboard');
  await checkDatabaseTables('office_dashboard');
}

main(); 