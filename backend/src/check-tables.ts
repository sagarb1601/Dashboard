import { pool } from './db/db';

async function checkTables() {
  try {
    const client = await pool.connect();
    
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Available tables:');
    result.rows.forEach(row => console.log(row.table_name));
    
    client.release();
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    process.exit(0);
  }
}

checkTables(); 