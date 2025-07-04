import pool from './db';

async function checkBusinessEntitiesSchema() {
  try {
    console.log('Checking business_entities table schema...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'business_entities' 
      ORDER BY ordinal_position
    `);
    
    console.log('Business entities table schema:');
    console.log(result.rows);
    
    // Also check existing data
    const dataResult = await pool.query('SELECT * FROM business_entities LIMIT 3');
    console.log('\nSample business entities data:');
    console.log(dataResult.rows);
    
  } catch (error) {
    console.error('Error checking business entities schema:', error);
  } finally {
    await pool.end();
  }
}

checkBusinessEntitiesSchema(); 