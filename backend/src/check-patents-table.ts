import pool from './db';

async function checkPatentsTable() {
  try {
    console.log('Checking patents table structure...');

    const patentsColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'patents'
      ORDER BY ordinal_position;
    `);
    console.log('patents columns:', patentsColumns.rows);

  } catch (error) {
    console.error('Error checking patents table:', error);
  } finally {
    await pool.end();
  }
}

checkPatentsTable(); 