import { Pool } from 'pg';
import 'dotenv/config';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'sagar123',
  database: 'dashboard',
  port: parseInt(process.env.PGPORT || '5432'),
});

async function checkTalksTable() {
  try {
    // Check if talks table exists
    const tableResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('talks', 'edofc_talks')
    `);
    console.log('Found tables:', tableResult.rows.map(row => row.table_name));

    // If talks table exists, get its structure
    if (tableResult.rows.some(row => row.table_name === 'talks')) {
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'talks'
        ORDER BY ordinal_position;
      `);
      console.log('\nTalks table structure:');
      console.table(structureResult.rows);

      // Get record count
      const countResult = await pool.query('SELECT COUNT(*) FROM talks');
      console.log('\nNumber of records in talks table:', countResult.rows[0].count);
    }

    // If edofc_talks table exists, get its structure
    if (tableResult.rows.some(row => row.table_name === 'edofc_talks')) {
      const structureResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'edofc_talks'
        ORDER BY ordinal_position;
      `);
      console.log('\nEDOFC_talks table structure:');
      console.table(structureResult.rows);

      // Get record count
      const countResult = await pool.query('SELECT COUNT(*) FROM edofc_talks');
      console.log('\nNumber of records in edofc_talks table:', countResult.rows[0].count);
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await pool.end();
  }
}

checkTalksTable(); 