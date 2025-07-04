import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: 'dashboard',  // Using the correct database name
  port: parseInt(process.env.PGPORT || '5432'),
});

async function checkTravelsTable() {
  try {
    // Check if travels table exists
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('travels', 'edofc_travels')
    `);
    console.log('Found tables:', tableResult.rows.map(row => row.table_name));

    // If travels table exists, get its structure
    if (tableResult.rows.some(row => row.table_name === 'travels')) {
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'travels'
        ORDER BY ordinal_position;
      `);
      console.log('\nTravels table structure:');
      console.table(structureResult.rows);

      // Get record count
      const countResult = await pool.query('SELECT COUNT(*) FROM travels');
      console.log('\nNumber of records in travels table:', countResult.rows[0].count);
    }

    // If edofc_travels table exists, get its structure
    if (tableResult.rows.some(row => row.table_name === 'edofc_travels')) {
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'edofc_travels'
        ORDER BY ordinal_position;
      `);
      console.log('\nEDOFC_travels table structure:');
      console.table(structureResult.rows);

      // Get record count
      const countResult = await pool.query('SELECT COUNT(*) FROM edofc_travels');
      console.log('\nNumber of records in edofc_travels table:', countResult.rows[0].count);
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTravelsTable(); 