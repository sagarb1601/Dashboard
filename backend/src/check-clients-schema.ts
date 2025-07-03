import pool from './db';

async function checkClientsSchema() {
  try {
    console.log('Checking clients table schema...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'clients' 
      ORDER BY ordinal_position
    `);
    
    console.log('Clients table schema:');
    console.log(result.rows);
    
    // Also check existing data
    const dataResult = await pool.query('SELECT * FROM clients LIMIT 3');
    console.log('\nSample clients data:');
    console.log(dataResult.rows);
    
  } catch (error) {
    console.error('Error checking clients schema:', error);
  } finally {
    await pool.end();
  }
}

checkClientsSchema(); 