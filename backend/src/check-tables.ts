import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: process.env.PGDATABASE || 'office_dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function checkTables() {
  try {
    // Check both tables
    const result = await pool.query(`
      SELECT 
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'travels') as travels_exists,
        EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'edofc_travels') as edofc_travels_exists;
    `);
    
    console.log('Table existence check:', result.rows[0]);

    // If travels table exists, get its count
    if (result.rows[0].travels_exists) {
      const travelsCount = await pool.query('SELECT COUNT(*) FROM travels');
      console.log('Number of records in travels table:', travelsCount.rows[0].count);
    }

    // If edofc_travels table exists, get its count
    if (result.rows[0].edofc_travels_exists) {
      const edofcTravelsCount = await pool.query('SELECT COUNT(*) FROM edofc_travels');
      console.log('Number of records in edofc_travels table:', edofcTravelsCount.rows[0].count);
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTables(); 